import {
    clearWsiResourceAccessTargets,
    clearWsiSlideAccess,
    getWsiSlideAccess,
    registerWsiResourceAccess,
    registerWsiResourceAccessTarget,
} from './wsiAuth';
import { configureWsiViewerRuntime, WsiViewerConfig } from './wsiViewerConfig';

function configureRuntime(overrides: Partial<WsiViewerConfig> = {}) {
    configureWsiViewerRuntime({
        buildApiUrl: (path: string) => `/${path}`,
        authEnabled: true,
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
        registerWsiResourceAccessTarget('study-1', 'slide-1', 'patient-1');
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
            '/api/wsi/v2/resources/study-1/patient-1/access?imageId=slide-1'
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

    describe('registered slides', () => {
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

        function hierarchy(imageIds: string[]): any {
            return {
                patient_id: 'patient-1',
                samples: [
                    {
                        sample_id: 'S-1',
                        parts: [
                            {
                                blocks: [
                                    {
                                        slides: imageIds.map(imageId => ({
                                            image_id: imageId,
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
                return `${parsed.pathname.replace(
                    '/api/wsi/v2/resources/',
                    ''
                )}${parsed.search}`;
            });
        }

        beforeEach(() => {
            clearWsiResourceAccessTargets();
        });

        it('rejects an unknown image before any request', async () => {
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
                'study-1/patient-1/access?imageId=slide-1',
            ]);
        });

        it('names the slide by its encoded image ID', async () => {
            registerWsiResourceAccess('study-1', hierarchy(['IMG 7/A&B']));
            jest.spyOn(global, 'fetch').mockResolvedValue(response(200));

            await getWsiSlideAccess('study-1', 'IMG 7/A&B');

            expect(requestedUrls()).toEqual([
                'study-1/patient-1/access?imageId=IMG%207%2FA%26B',
            ]);
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
