import { buildOsdOptions, restoreOrHomeViewport } from './wsiOsdUtils';

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
            imageId: '42',
        });

        expect(options.showNavigator).toBe(true);
        expect(options.navigatorPosition).toBe('BOTTOM_RIGHT');
        expect(options.navigatorSizeRatio).toBe(0.2);
        expect(options.tileSources.getTileUrl(3, 4, 5)).toBe(
            'https://tiles.example.com/tiles/42/zxy/3/4/5'
        );
        expect(options.loadTilesWithAjax).toBe(false);
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
            imageId: '42',
            accessToken: 'token',
            studyId: 'study-1',
        });

        expect(options.loadTilesWithAjax).toBe(true);
        expect(options.ajaxHeaders).toEqual({
            Authorization: 'Bearer token',
        });
        expect(options.tileSources.getTileUrl(3, 4, 5)).toContain(
            '?studyId=study-1'
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
