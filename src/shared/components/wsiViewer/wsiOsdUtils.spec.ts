import {
    buildOsdOptions,
    OSD_INITIAL_IMAGE_LOADER_LIMIT,
    OSD_STEADY_IMAGE_LOADER_LIMIT,
    OSD_TILE_RETRY_DELAY_MS,
    OSD_TILE_RETRY_MAX,
    OSD_TILE_TIMEOUT_MS,
    promoteOsdImageLoaderLimit,
    restoreOrHomeViewport,
} from './wsiOsdUtils';

describe('buildOsdOptions', () => {
    it('enables the navigator at viewer creation time', () => {
        const options = buildOsdOptions({
            element: {} as HTMLElement,
            navId: 'wsi-nav-test',
            meta: {
                dimensions: { width: 1000, height: 800 },
                levels: 2,
                level_dimensions: [
                    { width: 1000, height: 800 },
                    { width: 500, height: 400 },
                ],
                max_zoom: 6,
                tile_size: 256,
            },
            baseUrl: 'https://tiles.example.com',
            sourceUrl: 's3://bucket/slide-42.svs',
        });

        expect(options.showNavigator).toBe(true);
        expect(options.navigatorPosition).toBe('BOTTOM_RIGHT');
        expect(options.navigatorSizeRatio).toBe(0.2);
        expect(options.tileSources.getTileUrl(3, 4, 5)).toBe(
            'https://tiles.example.com/tiles/zxy/3/4/5'
        );
        expect(options.tileSources.minLevel).toBe(0);
        expect(options.loadTilesWithAjax).toBe(true);
        expect(options.imageLoaderLimit).toBe(OSD_INITIAL_IMAGE_LOADER_LIMIT);
        expect(options.timeout).toBe(OSD_TILE_TIMEOUT_MS);
        expect(options.tileRetryMax).toBe(OSD_TILE_RETRY_MAX);
        expect(options.tileRetryDelay).toBe(OSD_TILE_RETRY_DELAY_MS);
        expect(options.ajaxHeaders).toEqual({
            'X-WSI-Source': 's3://bucket/slide-42.svs',
        });
    });

    it('promotes the image loader after the first tile is ready', () => {
        const imageLoader = { jobLimit: OSD_INITIAL_IMAGE_LOADER_LIMIT };

        promoteOsdImageLoaderLimit({ imageLoader });

        expect(imageLoader.jobLimit).toBe(OSD_STEADY_IMAGE_LOADER_LIMIT);
    });

    it('starts at the certified safe minimum level', () => {
        const options = buildOsdOptions({
            element: {} as HTMLElement,
            navId: 'wsi-nav-safe-min',
            meta: {
                dimensions: { width: 1000, height: 800 },
                levels: 2,
                level_dimensions: [{ width: 1000, height: 800 }],
                max_zoom: 6,
                safe_min_level: 3,
                tile_size: 256,
            },
            baseUrl: 'https://tiles.example.com',
            sourceUrl: 's3://bucket/slide-42.svs',
        });

        expect(options.tileSources.minLevel).toBe(3);
    });

    it('enables AJAX tile loading when a capability token is supplied', () => {
        const options = buildOsdOptions({
            element: {} as HTMLElement,
            navId: 'wsi-nav-test',
            meta: {
                dimensions: { width: 1000, height: 800 },
                levels: 2,
                level_dimensions: [{ width: 1000, height: 800 }],
                max_zoom: 6,
                tile_size: 256,
            },
            baseUrl: 'https://tiles.example.com',
            accessToken: 'token',
            sourceUrl: 's3://bucket/slide-42.svs',
        });

        expect(options.loadTilesWithAjax).toBe(true);
        expect(options.ajaxHeaders).toEqual({
            Authorization: 'Bearer token',
            'X-WSI-Source': 's3://bucket/slide-42.svs',
        });
        expect(options.tileSources.getTileUrl(3, 4, 5)).toBe(
            'https://tiles.example.com/tiles/zxy/3/4/5'
        );
    });

    it('clamps an extreme shared-view hash before restoring the viewport', () => {
        const applyConstraints = jest.fn();
        const viewport = {
            getMinZoom: jest.fn().mockReturnValue(0.5),
            getMaxZoom: jest.fn().mockReturnValue(4),
            imageToViewportCoordinates: jest.fn((point: any) => point),
            panTo: jest.fn(),
            zoomTo: jest.fn(),
            applyConstraints,
            goHome: jest.fn(),
        };
        const viewer = { viewport };
        const openSeadragon = {
            Point: class Point {
                constructor(public x: number, public y: number) {}
            },
        };

        restoreOrHomeViewport({
            osdViewer: viewer,
            hashState: {
                slideId: '42',
                x: 999999,
                y: -10,
                z: 999999,
            },
            selectedSlideId: '42',
            openSeadragon,
            meta: {
                dimensions: { width: 1000, height: 800 },
                levels: 2,
                level_dimensions: [{ width: 1000, height: 800 }],
                max_zoom: 6,
                tile_size: 256,
            },
        });

        expect(viewport.imageToViewportCoordinates).toHaveBeenCalledWith({
            x: 999,
            y: 0,
        });
        expect(viewport.zoomTo).toHaveBeenCalledWith(4, undefined, true);
        expect(applyConstraints).toHaveBeenCalledWith(true);
    });
});
