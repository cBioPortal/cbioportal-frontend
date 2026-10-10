import {
    buildOsdOptions,
    ensureNavigator,
    OSD_INITIAL_IMAGE_LOADER_LIMIT,
    OSD_STEADY_IMAGE_LOADER_LIMIT,
    OSD_TILE_RETRY_DELAY_MS,
    OSD_TILE_RETRY_MAX,
    OSD_TILE_REQUEST_TIMEOUT_MS,
    promoteOsdImageLoaderLimit,
    restoreOrHomeViewport,
} from './wsiOsdUtils';

describe('buildOsdOptions', () => {
    it('defers navigator creation until the main tile is drawn', () => {
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
        });

        expect(options.showNavigator).toBe(false);
        expect(options.timeout).toBe(OSD_TILE_REQUEST_TIMEOUT_MS);
        expect(options.imageLoaderLimit).toBe(OSD_INITIAL_IMAGE_LOADER_LIMIT);
        expect(options.tileRetryMax).toBe(OSD_TILE_RETRY_MAX);
        expect(options.tileRetryDelay).toBe(OSD_TILE_RETRY_DELAY_MS);
        expect(options.tileSources.getTileUrl(3, 4, 5)).toBe(
            'https://tiles.example.com/tiles/zxy/3/4/5'
        );
        expect(options.tileSources.minLevel).toBe(0);
        // Without an access token there is nothing to send.
        expect(options.loadTilesWithAjax).toBe(false);
        expect(options.ajaxHeaders).toEqual({});
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
        });

        expect(options.loadTilesWithAjax).toBe(true);
        expect(options.ajaxHeaders).toEqual({
            Authorization: 'Bearer token',
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

    it('fits a slide selected by a coordinate-less hash to the view', () => {
        const viewport = {
            panTo: jest.fn(),
            zoomTo: jest.fn(),
            goHome: jest.fn(),
        };

        restoreOrHomeViewport({
            osdViewer: { viewport },
            hashState: { slideId: '42' },
            selectedSlideId: '42',
            openSeadragon: {},
        });

        expect(viewport.goHome).toHaveBeenCalledWith(true);
        expect(viewport.panTo).not.toHaveBeenCalled();
    });
});

describe('ensureNavigator', () => {
    const meta = {
        dimensions: { width: 1000, height: 800 },
        levels: 2,
        level_dimensions: [
            { width: 1000, height: 800 },
            { width: 500, height: 400 },
        ],
        max_zoom: 6,
        tile_size: 256,
    } as any;

    function fakeOsd() {
        const created: any[] = [];
        class Navigator {
            options: any;
            added: any[] = [];
            element = { style: {} as any };
            constructor(options: any) {
                this.options = options;
                created.push(this);
            }
            addTiledImage(options: any) {
                this.added.push(options);
            }
        }
        return { openSeadragon: { Navigator }, created };
    }

    it('mirrors the image already open in the viewer, with its original', () => {
        const { openSeadragon, created } = fakeOsd();
        const shown = { id: 'main-image' };
        const osdViewer: any = {
            world: { getItemCount: () => 1, getItemAt: () => shown },
        };

        const navigator = ensureNavigator({
            osdViewer,
            openSeadragon,
            meta,
            baseUrl: 'https://tiles.example/wsi/tiles/k',
            accessToken: 'token',
        });

        expect(created).toHaveLength(1);
        expect(osdViewer.navigator).toBe(navigator);
        // Opening its own tileSources would add an image with no original.
        expect(created[0].options.tileSources).toBeUndefined();
        expect(created[0].options.loadTilesWithAjax).toBe(true);
        expect(created[0].added).toHaveLength(1);
        expect(created[0].added[0].originalTiledImage).toBe(shown);
        expect(created[0].added[0].tileSource).toBeDefined();
    });

    it('creates the navigator only once', () => {
        const { openSeadragon, created } = fakeOsd();
        const osdViewer: any = {
            world: { getItemCount: () => 0, getItemAt: () => undefined },
        };
        const args = {
            osdViewer,
            openSeadragon,
            meta,
            baseUrl: 'https://tiles.example/wsi/tiles/k',
        };
        const first = ensureNavigator(args);
        expect(ensureNavigator(args)).toBe(first);
        expect(created).toHaveLength(1);
    });
});
