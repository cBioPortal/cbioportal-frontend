import {
    clearWsiSlideAccess,
    getWsiSlideAccess,
    isWsiAuthEnabled,
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
            '/api/wsi/v2/slides/study-1/slide-1/access'
        );
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
});
