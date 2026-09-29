import {
    clearWsiResourceAccessTargets,
    clearWsiSlideAccess,
    getWsiSlideAccess,
    isWsiAuthEnabled,
    registerWsiResourceAccess,
    registerWsiResourceAccessTarget,
} from './wsiAuth';

const mockServerConfig = { authenticationMethod: 'saml' };

jest.mock('shared/api/urls', () => ({
    buildCBioPortalAPIUrl: jest.fn((path: string) => `/${path}`),
}));

jest.mock('config/config', () => ({
    getServerConfig: () => mockServerConfig,
}));

describe('WSI access capability', () => {
    beforeEach(() => {
        jest.restoreAllMocks();
        clearWsiSlideAccess();
        mockServerConfig.authenticationMethod = 'saml';
        delete (mockServerConfig as any).msk_wsi_authentication_enabled;
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
        registerWsiResourceAccessTarget('study-1', 'slide-1', {
            patientId: 'patient-1',
            resourceId: 'WSI_SAMPLE',
            resourceDataId: '42',
        });
    });

    it('enables WSI auth for saml-backed portals', () => {
        expect(isWsiAuthEnabled()).toBe(true);
    });

    it('requests and caches source-bound access for one slide', async () => {
        const response = {
            ok: true,
            json: async () => ({
                imageId: 'slide-1',
                sourceUrl: 's3://bucket/slide-1.svs',
                tileMetadata: {
                    dimensions: { width: 100, height: 80 },
                    levels: 1,
                    level_dimensions: [{ width: 100, height: 80 }],
                    level_downsamples: [1],
                    max_zoom: 0,
                    tile_size: 256,
                    safe_min_level: 0,
                },
                thumbnail: {
                    sourceUrl: 's3://bucket/thumbs/slide-1.jpg',
                    width: 128,
                    height: 96,
                    contentType: 'image/jpeg',
                },
                accessToken: 'token',
                tokenType: 'Bearer',
                expiresIn: 300,
            }),
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
            '/api/wsi/v2/resources/study-1/patient-1/WSI_SAMPLE/42/access'
        );
    });

    it('does not reuse a capability across authenticated subjects', async () => {
        const response = (accessToken: string) =>
            ({
                ok: true,
                json: async () => ({
                    imageId: 'slide-1',
                    sourceUrl: 's3://bucket/slide-1.svs',
                    tileMetadata: {
                        dimensions: { width: 100, height: 80 },
                        levels: 1,
                        level_dimensions: [{ width: 100, height: 80 }],
                        level_downsamples: [1],
                        max_zoom: 0,
                        tile_size: 256,
                        safe_min_level: 0,
                    },
                    thumbnail: {
                        sourceUrl: 's3://bucket/thumbs/slide-1.jpg',
                        width: 128,
                        height: 96,
                        contentType: 'image/jpeg',
                    },
                    accessToken,
                    tokenType: 'Bearer',
                    expiresIn: 300,
                }),
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

    it('always enables the source-bound WSI capability contract', () => {
        mockServerConfig.authenticationMethod = 'false';
        expect(isWsiAuthEnabled()).toBe(true);
    });

    it('rejects a schema-v2 metadata object with a non-current decode policy', async () => {
        const response = {
            ok: true,
            json: async () => ({
                imageId: 'slide-1',
                sourceUrl: 's3://bucket/slide-1.svs',
                tileMetadata: {
                    dimensions: { width: 100, height: 80 },
                    levels: 1,
                    level_dimensions: [{ width: 100, height: 80 }],
                    max_zoom: 0,
                    tile_size: 256,
                    tile_metadata_schema_version: 2,
                    level_downsamples: [1],
                    safe_min_level: 0,
                    decode_policy_version:
                        'geometry-v2;tile-max=4194304;thumbnail-max=4194304',
                    max_decode_pixels: 4194304,
                    thumbnail_max_decode_pixels: 4194304,
                },
                thumbnail: {
                    sourceUrl: 's3://bucket/thumbs/slide-1.jpg',
                    width: 128,
                    height: 96,
                    contentType: 'image/jpeg',
                },
                accessToken: 'token',
                expiresIn: 300,
            }),
        } as Response;
        jest.spyOn(global, 'fetch').mockResolvedValue(response);

        await expect(getWsiSlideAccess('study-1', 'slide-1')).rejects.toThrow(
            'Invalid WSI decode policy'
        );
    });

    describe('resource access targets', () => {
        const validAccess = {
            imageId: 'slide-1',
            sourceUrl: 's3://bucket/slide-1.svs',
            tileMetadata: {
                dimensions: { width: 100, height: 80 },
                levels: 1,
                level_dimensions: [{ width: 100, height: 80 }],
                level_downsamples: [1],
                max_zoom: 0,
                tile_size: 256,
                safe_min_level: 0,
            },
            thumbnail: {
                sourceUrl: 's3://bucket/thumbs/slide-1.jpg',
                width: 128,
                height: 96,
                contentType: 'image/jpeg',
            },
            accessToken: 'token',
            tokenType: 'Bearer',
            expiresIn: 300,
        };
        const response = (status: number) =>
            ({
                ok: status >= 200 && status < 300,
                status,
                json: async () => validAccess,
            } as Response);

        function hierarchy(slides: Array<[string, string]>): any {
            return {
                patient_id: 'patient-1',
                samples: [
                    {
                        sample_id: 'S-1',
                        parts: [
                            {
                                blocks: [
                                    {
                                        slides: slides.map(
                                            ([imageId, rowId]) => ({
                                                image_id: imageId,
                                                resource_id: 'WSI_SAMPLE',
                                                resource_data_id: rowId,
                                            })
                                        ),
                                    },
                                ],
                            },
                        ],
                    },
                ],
            };
        }

        function requestedPaths(): string[] {
            return (global.fetch as jest.Mock).mock.calls.map(([url]) =>
                new URL(String(url)).pathname.replace(
                    '/api/wsi/v2/resources/',
                    ''
                )
            );
        }

        beforeEach(() => {
            clearWsiResourceAccessTargets();
        });

        it('rejects an unknown image before any request', async () => {
            registerWsiResourceAccess('study-1', hierarchy([['slide-1', '1']]));

            await expect(
                getWsiSlideAccess('study-1', 'unknown-slide')
            ).rejects.toThrow('WSI resource selection is unavailable');
            await expect(
                getWsiSlideAccess('other-study', 'slide-1')
            ).rejects.toThrow('WSI resource selection is unavailable');
            expect(global.fetch).not.toHaveBeenCalled();
        });

        it('replaces every target of a patient on re-registration', async () => {
            registerWsiResourceAccess(
                'study-1',
                hierarchy([
                    ['slide-1', '1'],
                    ['slide-2', '2'],
                ])
            );
            registerWsiResourceAccess('study-1', hierarchy([['slide-1', '7']]));
            jest.spyOn(global, 'fetch').mockResolvedValue(response(200));

            await getWsiSlideAccess('study-1', 'slide-1');
            await expect(
                getWsiSlideAccess('study-1', 'slide-2')
            ).rejects.toThrow('WSI resource selection is unavailable');
            expect(requestedPaths()).toEqual([
                'study-1/patient-1/WSI_SAMPLE/7/access',
            ]);
        });

        it('refreshes the hierarchy once and retries after a 404', async () => {
            const refresh = jest.fn(async () => {
                registerWsiResourceAccess(
                    'study-1',
                    hierarchy([['slide-1', '8']]),
                    refresh
                );
            });
            registerWsiResourceAccess(
                'study-1',
                hierarchy([['slide-1', '1']]),
                refresh
            );
            jest.spyOn(global, 'fetch')
                .mockResolvedValueOnce(response(404))
                .mockResolvedValueOnce(response(200));

            await expect(
                getWsiSlideAccess('study-1', 'slide-1')
            ).resolves.toEqual(
                expect.objectContaining({ accessToken: 'token' })
            );
            expect(refresh).toHaveBeenCalledTimes(1);
            expect(requestedPaths()).toEqual([
                'study-1/patient-1/WSI_SAMPLE/1/access',
                'study-1/patient-1/WSI_SAMPLE/8/access',
            ]);
        });

        it('does not retry a 404 when the refresh kept the slide identity', async () => {
            const refresh = jest.fn(async () => {
                registerWsiResourceAccess(
                    'study-1',
                    hierarchy([['slide-1', '1']]),
                    refresh
                );
            });
            registerWsiResourceAccess(
                'study-1',
                hierarchy([['slide-1', '1']]),
                refresh
            );
            jest.spyOn(global, 'fetch').mockResolvedValue(response(404));

            await expect(
                getWsiSlideAccess('study-1', 'slide-1')
            ).rejects.toThrow('WSI authorization failed (404)');
            expect(refresh).toHaveBeenCalledTimes(1);
            expect(global.fetch).toHaveBeenCalledTimes(1);
        });

        it('fails a persistently missing slide fast on later requests', async () => {
            const refresh = jest.fn(async () => {
                registerWsiResourceAccess(
                    'study-1',
                    hierarchy([['slide-1', '1']]),
                    refresh
                );
            });
            registerWsiResourceAccess(
                'study-1',
                hierarchy([['slide-1', '1']]),
                refresh
            );
            jest.spyOn(global, 'fetch').mockResolvedValue(response(404));

            await expect(
                getWsiSlideAccess('study-1', 'slide-1')
            ).rejects.toThrow('WSI authorization failed (404)');
            await expect(
                getWsiSlideAccess('study-1', 'slide-1', true)
            ).rejects.toThrow('WSI authorization failed (404)');
            // A cached re-registration with the same identity keeps the memory.
            registerWsiResourceAccess(
                'study-1',
                hierarchy([['slide-1', '1']]),
                refresh
            );
            await expect(
                getWsiSlideAccess('study-1', 'slide-1')
            ).rejects.toThrow('WSI authorization failed (404)');
            expect(refresh).toHaveBeenCalledTimes(1);
            expect(global.fetch).toHaveBeenCalledTimes(1);
        });

        it('shares one refresh across concurrent 404s for different slides', async () => {
            const slides: Array<[string, string]> = [
                ['slide-1', '1'],
                ['slide-2', '2'],
                ['slide-3', '3'],
                ['slide-4', '4'],
            ];
            const refresh = jest.fn(async () => {
                registerWsiResourceAccess(
                    'study-1',
                    hierarchy([
                        ['slide-1', '1'],
                        ['slide-2', '20'],
                        ['slide-3', '3'],
                        ['slide-4', '4'],
                    ]),
                    refresh
                );
            });
            registerWsiResourceAccess('study-1', hierarchy(slides), refresh);
            jest.spyOn(global, 'fetch').mockImplementation((async (
                url: string
            ) =>
                response(
                    String(url).includes('/20/access') ? 200 : 404
                )) as any);

            const results = await Promise.allSettled(
                slides.map(([imageId]) => getWsiSlideAccess('study-1', imageId))
            );

            expect(results.map(result => result.status)).toEqual([
                'rejected',
                'fulfilled',
                'rejected',
                'rejected',
            ]);
            expect(refresh).toHaveBeenCalledTimes(1);
            expect(requestedPaths()).toEqual([
                'study-1/patient-1/WSI_SAMPLE/1/access',
                'study-1/patient-1/WSI_SAMPLE/2/access',
                'study-1/patient-1/WSI_SAMPLE/3/access',
                'study-1/patient-1/WSI_SAMPLE/4/access',
                'study-1/patient-1/WSI_SAMPLE/20/access',
            ]);
        });

        it('does not refresh again for a slide the refresh already confirmed', async () => {
            const refresh = jest.fn(async () => {
                registerWsiResourceAccess(
                    'study-1',
                    hierarchy([
                        ['slide-1', '1'],
                        ['slide-2', '2'],
                    ]),
                    refresh
                );
            });
            registerWsiResourceAccess(
                'study-1',
                hierarchy([
                    ['slide-1', '1'],
                    ['slide-2', '2'],
                ]),
                refresh
            );
            jest.spyOn(global, 'fetch').mockResolvedValue(response(404));

            await expect(
                getWsiSlideAccess('study-1', 'slide-1')
            ).rejects.toThrow('WSI authorization failed (404)');
            await expect(
                getWsiSlideAccess('study-1', 'slide-2')
            ).rejects.toThrow('WSI authorization failed (404)');
            expect(refresh).toHaveBeenCalledTimes(1);
            expect(global.fetch).toHaveBeenCalledTimes(2);
        });

        it('retries a remembered slide once it is registered with a new identity', async () => {
            const refresh = jest.fn(async () => {
                registerWsiResourceAccess(
                    'study-1',
                    hierarchy([['slide-1', '1']]),
                    refresh
                );
            });
            registerWsiResourceAccess(
                'study-1',
                hierarchy([['slide-1', '1']]),
                refresh
            );
            jest.spyOn(global, 'fetch')
                .mockResolvedValueOnce(response(404))
                .mockResolvedValueOnce(response(200));

            await expect(
                getWsiSlideAccess('study-1', 'slide-1')
            ).rejects.toThrow('WSI authorization failed (404)');
            registerWsiResourceAccess(
                'study-1',
                hierarchy([['slide-1', '5']]),
                refresh
            );
            await expect(
                getWsiSlideAccess('study-1', 'slide-1')
            ).resolves.toEqual(
                expect.objectContaining({ accessToken: 'token' })
            );
            expect(refresh).toHaveBeenCalledTimes(1);
            expect(requestedPaths()).toEqual([
                'study-1/patient-1/WSI_SAMPLE/1/access',
                'study-1/patient-1/WSI_SAMPLE/5/access',
            ]);
        });

        it('forgets a remembered slide when its access is cleared', async () => {
            const refresh = jest.fn(async () => {
                registerWsiResourceAccess(
                    'study-1',
                    hierarchy([['slide-1', '1']]),
                    refresh
                );
            });
            registerWsiResourceAccess(
                'study-1',
                hierarchy([['slide-1', '1']]),
                refresh
            );
            jest.spyOn(global, 'fetch')
                .mockResolvedValueOnce(response(404))
                .mockResolvedValueOnce(response(200));

            await expect(
                getWsiSlideAccess('study-1', 'slide-1')
            ).rejects.toThrow('WSI authorization failed (404)');
            clearWsiSlideAccess('study-1');
            registerWsiResourceAccess(
                'study-1',
                hierarchy([['slide-1', '1']]),
                refresh
            );
            await expect(
                getWsiSlideAccess('study-1', 'slide-1')
            ).resolves.toEqual(
                expect.objectContaining({ accessToken: 'token' })
            );
            expect(refresh).toHaveBeenCalledTimes(1);
            expect(global.fetch).toHaveBeenCalledTimes(2);
        });

        it('forgets a remembered slide when its patient targets are cleared', async () => {
            const refresh = jest.fn(async () => {
                registerWsiResourceAccess(
                    'study-1',
                    hierarchy([['slide-1', '1']]),
                    refresh
                );
            });
            registerWsiResourceAccess(
                'study-1',
                hierarchy([['slide-1', '1']]),
                refresh
            );
            jest.spyOn(global, 'fetch')
                .mockResolvedValueOnce(response(404))
                .mockResolvedValueOnce(response(404));

            await expect(
                getWsiSlideAccess('study-1', 'slide-1')
            ).rejects.toThrow('WSI authorization failed (404)');
            clearWsiResourceAccessTargets('study-1', 'patient-1');
            registerWsiResourceAccess(
                'study-1',
                hierarchy([['slide-1', '1']]),
                refresh
            );
            await expect(
                getWsiSlideAccess('study-1', 'slide-1')
            ).rejects.toThrow('WSI authorization failed (404)');
            expect(refresh).toHaveBeenCalledTimes(2);
            expect(global.fetch).toHaveBeenCalledTimes(2);
        });

        it('rejects without a retry when the refreshed hierarchy dropped the slide', async () => {
            const refresh = jest.fn(async () => {
                registerWsiResourceAccess(
                    'study-1',
                    hierarchy([['slide-2', '9']]),
                    refresh
                );
            });
            registerWsiResourceAccess(
                'study-1',
                hierarchy([['slide-1', '1']]),
                refresh
            );
            jest.spyOn(global, 'fetch').mockResolvedValue(response(404));

            await expect(
                getWsiSlideAccess('study-1', 'slide-1')
            ).rejects.toThrow('WSI resource selection is unavailable');
            expect(global.fetch).toHaveBeenCalledTimes(1);
        });

        it('does not refresh for access failures other than 404', async () => {
            const refresh = jest.fn(async () => undefined);
            registerWsiResourceAccess(
                'study-1',
                hierarchy([['slide-1', '1']]),
                refresh
            );
            jest.spyOn(global, 'fetch').mockResolvedValue(response(403));

            await expect(
                getWsiSlideAccess('study-1', 'slide-1')
            ).rejects.toThrow('WSI authorization failed (403)');
            expect(refresh).not.toHaveBeenCalled();
            expect(global.fetch).toHaveBeenCalledTimes(1);

            await expect(
                getWsiSlideAccess('study-1', 'slide-1')
            ).rejects.toThrow('WSI authorization failed (403)');
            expect(global.fetch).toHaveBeenCalledTimes(2);
        });

        it('reports a 404 once when no refresher is registered', async () => {
            registerWsiResourceAccessTarget('study-1', 'slide-1', {
                patientId: 'patient-1',
                resourceId: 'WSI_SAMPLE',
                resourceDataId: '42',
            });
            jest.spyOn(global, 'fetch').mockResolvedValue(response(404));

            await expect(
                getWsiSlideAccess('study-1', 'slide-1')
            ).rejects.toThrow('WSI authorization failed (404)');
            expect(global.fetch).toHaveBeenCalledTimes(1);
        });
    });
});
