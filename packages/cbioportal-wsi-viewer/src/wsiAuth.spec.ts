import {
    clearWsiResourceAccessTargets,
    clearWsiSlideAccess,
    getWsiSlideAccess,
    registerWsiResourceAccess,
} from './wsiAuth';
import {
    makeAccessPayload,
    makeTileMetadata,
    registerTestSlideAccess,
} from './wsiTestFixtures';
import { configureWsiViewerRuntime, WsiViewerConfig } from './wsiViewerConfig';

function configureRuntime(overrides: Partial<WsiViewerConfig> = {}) {
    configureWsiViewerRuntime({
        buildApiUrl: (path: string) => `/${path}`,
        ...overrides,
    });
}

describe('WSI access capability', () => {
    beforeEach(() => {
        jest.restoreAllMocks();
        clearWsiSlideAccess();
        configureRuntime();
        global.fetch = jest.fn() as typeof fetch;
        global.Headers = (class {
            private values = new Map<string, string>();
            constructor(init?: Record<string, string>) {
                Object.entries(init ?? {}).forEach(([key, value]) =>
                    this.values.set(key.toLowerCase(), value)
                );
            }
            set(key: string, value: string) {
                this.values.set(key.toLowerCase(), value);
            }
            get(key: string) {
                return this.values.get(key.toLowerCase()) ?? null;
            }
        } as unknown) as typeof Headers;
        registerTestSlideAccess('study-1', 'patient-1', 'slide-1');
    });

    it('requests and caches access for one slide', async () => {
        const response = {
            ok: true,
            json: async () => makeAccessPayload({ accessToken: 'token' }),
        } as Response;
        jest.spyOn(global, 'fetch').mockResolvedValue(response);

        await expect(getWsiSlideAccess('study-1', 'slide-1')).resolves.toEqual(
            expect.objectContaining({ accessToken: 'token' })
        );
        await expect(getWsiSlideAccess('study-1', 'slide-1')).resolves.toEqual(
            expect.objectContaining({ accessToken: 'token' })
        );
        expect(global.fetch).toHaveBeenCalledTimes(1);
        expect((global.fetch as jest.Mock).mock.calls[0][0]).toContain(
            '/api/resources/study-1/WSI_SAMPLE/access?key=slide-1&patientId=patient-1'
        );
    });

    it('does not reuse a capability across authenticated subjects', async () => {
        const response = (accessToken: string) =>
            ({
                ok: true,
                json: async () => makeAccessPayload({ accessToken }),
            } as Response);

        jest.spyOn(global, 'fetch')
            .mockResolvedValueOnce(response('token-a'))
            .mockResolvedValueOnce(response('token-b'));

        await expect(
            getWsiSlideAccess('study-1', 'slide-1', false, 'user-a')
        ).resolves.toEqual(expect.objectContaining({ accessToken: 'token-a' }));
        await expect(
            getWsiSlideAccess('study-1', 'slide-1', false, 'user-b')
        ).resolves.toEqual(expect.objectContaining({ accessToken: 'token-b' }));
        expect(global.fetch).toHaveBeenCalledTimes(2);
    });

    function registerWithTileMetadata(tileMetadata: unknown) {
        registerWsiResourceAccess('study-1', {
            patient_id: 'patient-1',
            samples: [
                {
                    sample_id: 'S-1',
                    parts: [
                        {
                            blocks: [
                                {
                                    slides: [
                                        {
                                            slide_key: 'slide-1',
                                            resource_id: 'WSI_SAMPLE',
                                            serving_key: 'slide-1',
                                            tile_metadata: tileMetadata,
                                        },
                                    ],
                                },
                            ],
                        },
                    ],
                },
            ],
        } as any);
    }

    it('rejects a slide row whose tile metadata has a non-current decode policy, before any request', async () => {
        registerWithTileMetadata(
            makeTileMetadata({
                decode_policy_version:
                    'geometry-v2;tile-max=4194304;thumbnail-max=4194304',
                max_decode_pixels: 4194304,
                thumbnail_max_decode_pixels: 4194304,
            })
        );

        await expect(getWsiSlideAccess('study-1', 'slide-1')).rejects.toThrow(
            'Invalid WSI decode policy'
        );
        expect(global.fetch).not.toHaveBeenCalled();
    });

    it('rejects tile metadata without the schema version', async () => {
        const { tile_metadata_schema_version, ...legacy } = makeTileMetadata();
        registerWithTileMetadata(legacy);

        await expect(getWsiSlideAccess('study-1', 'slide-1')).rejects.toThrow(
            'Invalid WSI tile metadata schema'
        );
    });

    it('takes the tile metadata from the slide row, not the access response', async () => {
        jest.spyOn(global, 'fetch').mockResolvedValue({
            ok: true,
            json: async () =>
                makeAccessPayload({
                    tileMetadata: makeTileMetadata({ tile_size: 512 }),
                }),
        } as Response);

        const access = await getWsiSlideAccess('study-1', 'slide-1');

        expect(access.tileMetadata).toEqual(makeTileMetadata());
    });

    describe('registered slides', () => {
        const validAccess = makeAccessPayload();
        const response = (status: number) =>
            ({
                ok: status >= 200 && status < 300,
                status,
                json: async () => validAccess,
            } as Response);

        function hierarchy(
            slideKeys: string[],
            resourceId = 'WSI_SAMPLE'
        ): any {
            return {
                patient_id: 'patient-1',
                samples: [
                    {
                        sample_id: 'S-1',
                        parts: [
                            {
                                blocks: [
                                    {
                                        slides: slideKeys.map(slideKey => ({
                                            slide_key: slideKey,
                                            resource_id: resourceId,
                                            serving_key: slideKey,
                                            tile_metadata: makeTileMetadata(),
                                        })),
                                    },
                                ],
                            },
                        ],
                    },
                ],
            };
        }

        function requestedUrls(): string[] {
            return (global.fetch as jest.Mock).mock.calls.map(([url]) => {
                const parsed = new URL(String(url));
                return `${parsed.pathname.replace('/api/resources/', '')}${
                    parsed.search
                }`;
            });
        }

        beforeEach(() => {
            clearWsiResourceAccessTargets();
        });

        it('rejects an unknown slide before any request', async () => {
            registerWsiResourceAccess('study-1', hierarchy(['slide-1']));

            await expect(
                getWsiSlideAccess('study-1', 'unknown-slide')
            ).rejects.toThrow('WSI resource selection is unavailable');
            await expect(
                getWsiSlideAccess('other-study', 'slide-1')
            ).rejects.toThrow('WSI resource selection is unavailable');
            expect(global.fetch).not.toHaveBeenCalled();
        });

        it('replaces every slide of a patient on re-registration', async () => {
            registerWsiResourceAccess(
                'study-1',
                hierarchy(['slide-1', 'slide-2'])
            );
            registerWsiResourceAccess('study-1', hierarchy(['slide-1']));
            jest.spyOn(global, 'fetch').mockResolvedValue(response(200));

            await getWsiSlideAccess('study-1', 'slide-1');
            await expect(
                getWsiSlideAccess('study-1', 'slide-2')
            ).rejects.toThrow('WSI resource selection is unavailable');
            expect(requestedUrls()).toEqual([
                'study-1/WSI_SAMPLE/access?key=slide-1&patientId=patient-1',
            ]);
        });

        it('names the slide by its resource and opaque serving key', async () => {
            const key = '0123456789ab';
            registerWsiResourceAccess('study-1', hierarchy([key]));
            jest.spyOn(global, 'fetch').mockResolvedValue({
                ok: true,
                status: 200,
                json: async () => ({ ...validAccess, key }),
            } as Response);

            await expect(getWsiSlideAccess('study-1', key)).resolves.toEqual(
                expect.objectContaining({ slideKey: key })
            );

            expect(requestedUrls()).toEqual([
                `study-1/WSI_SAMPLE/access?key=${key}&patientId=patient-1`,
            ]);
            const url = String((global.fetch as jest.Mock).mock.calls[0][0]);
            expect(url).not.toMatch(/imageId|image_id/i);
        });

        it('requests a patient-level slide from its own resource', async () => {
            registerWsiResourceAccess(
                'study-1',
                hierarchy(['slide-1'], 'WSI_PATIENT')
            );
            jest.spyOn(global, 'fetch').mockResolvedValue({
                ok: true,
                status: 200,
                json: async () => ({
                    ...validAccess,
                    resourceId: 'WSI_PATIENT',
                }),
            } as Response);

            await getWsiSlideAccess('study-1', 'slide-1');

            expect(requestedUrls()).toEqual([
                'study-1/WSI_PATIENT/access?key=slide-1&patientId=patient-1',
            ]);
        });

        it('rejects a slide without serving data before any request', async () => {
            const unservable = hierarchy(['slide-1']);
            delete unservable.samples[0].parts[0].blocks[0].slides[0]
                .serving_key;
            registerWsiResourceAccess('study-1', unservable);

            await expect(
                getWsiSlideAccess('study-1', 'slide-1')
            ).rejects.toThrow('WSI slide cannot serve tiles');
            expect(global.fetch).not.toHaveBeenCalled();
        });

        it('rejects a response for a different key', async () => {
            registerWsiResourceAccess('study-1', hierarchy(['slide-1']));
            jest.spyOn(global, 'fetch').mockResolvedValue({
                ok: true,
                status: 200,
                json: async () => ({ ...validAccess, key: 'slide-2' }),
            } as Response);

            await expect(
                getWsiSlideAccess('study-1', 'slide-1')
            ).rejects.toThrow('Invalid WSI slide access response');
        });

        it('rejects a response for a different resource', async () => {
            registerWsiResourceAccess('study-1', hierarchy(['slide-1']));
            jest.spyOn(global, 'fetch').mockResolvedValue({
                ok: true,
                status: 200,
                json: async () => ({ ...validAccess, resourceId: 'OTHER' }),
            } as Response);

            await expect(
                getWsiSlideAccess('study-1', 'slide-1')
            ).rejects.toThrow('Invalid WSI slide access response');
        });

        it('rejects a response without a key', async () => {
            registerWsiResourceAccess('study-1', hierarchy(['slide-1']));
            const { key, ...withoutKey } = validAccess;
            jest.spyOn(global, 'fetch').mockResolvedValue({
                ok: true,
                status: 200,
                json: async () => withoutKey,
            } as Response);

            await expect(
                getWsiSlideAccess('study-1', 'slide-1')
            ).rejects.toThrow('Invalid WSI slide access response');
        });

        it('keeps only the contract fields of the response', async () => {
            registerWsiResourceAccess('study-1', hierarchy(['slide-1']));
            jest.spyOn(global, 'fetch').mockResolvedValue({
                ok: true,
                status: 200,
                json: async () => ({
                    ...validAccess,
                    imageId: 'source-image',
                    sourceUrl: 's3://bucket/source-image.svs',
                    thumbnail: { sourceUrl: 's3://bucket/source-image.jpg' },
                }),
            } as Response);

            const access = await getWsiSlideAccess('study-1', 'slide-1');

            expect(Object.keys(access).sort()).toEqual([
                'accessToken',
                'expiresAt',
                'expiresIn',
                'slideKey',
                'tileMetadata',
            ]);
            expect(JSON.stringify(access)).not.toContain('source-image');
        });

        it('adds the query after the host builds the path', async () => {
            // The portal's URL builder encodes a "?" inside the path.
            configureWsiViewerRuntime({
                buildApiUrl: (path: string) => `/${path.replace(/\?/g, '%3F')}`,
            });
            registerWsiResourceAccess('study-1', hierarchy(['slide-1']));
            const fetchSpy = jest
                .spyOn(global, 'fetch')
                .mockResolvedValue(response(200));

            await getWsiSlideAccess('study-1', 'slide-1');

            const requested = new URL(String(fetchSpy.mock.calls[0][0]));
            expect(requested.pathname).toBe(
                '/api/resources/study-1/WSI_SAMPLE/access'
            );
            expect(requested.searchParams.get('key')).toBe('slide-1');
            expect(requested.searchParams.get('patientId')).toBe('patient-1');
        });

        it('reports a 404 once, without a retry', async () => {
            registerWsiResourceAccess('study-1', hierarchy(['slide-1']));
            jest.spyOn(global, 'fetch').mockResolvedValue(response(404));

            await expect(
                getWsiSlideAccess('study-1', 'slide-1')
            ).rejects.toThrow('WSI authorization failed (404)');
            expect(global.fetch).toHaveBeenCalledTimes(1);
        });

        it('does not cache a failed request', async () => {
            registerWsiResourceAccess('study-1', hierarchy(['slide-1']));
            jest.spyOn(global, 'fetch').mockResolvedValue(response(403));

            await expect(
                getWsiSlideAccess('study-1', 'slide-1')
            ).rejects.toThrow('WSI authorization failed (403)');
            await expect(
                getWsiSlideAccess('study-1', 'slide-1')
            ).rejects.toThrow('WSI authorization failed (403)');
            expect(global.fetch).toHaveBeenCalledTimes(2);
        });
    });
});
