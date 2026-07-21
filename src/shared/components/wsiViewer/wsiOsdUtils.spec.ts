import { buildOsdOptions } from './wsiOsdUtils';

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
    });
});
