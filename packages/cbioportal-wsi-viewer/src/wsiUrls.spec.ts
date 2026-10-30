import {
    buildWsiResourceRowsApiUrl,
    buildWsiSlideQuery,
    buildWsiThumbnailUrl,
    buildWsiTileUrl,
} from './wsiUrls';

const SOURCE = {
    servingKey: '0123456789ab',
    sealedSource: 'v1.a+b/c=',
};

describe('buildWsiResourceRowsApiUrl', () => {
    it('preserves a portal context path', () => {
        const buildApiUrl = (path: string) =>
            `https://portal.example/beta/${path}`;

        expect(buildWsiResourceRowsApiUrl(buildApiUrl)).toBe(
            'https://portal.example/beta/api/resource-table/query/fetch'
        );
    });
});

describe('buildWsiSlideQuery', () => {
    it('names the slide by study, key and sealed source, URL-encoded', () => {
        expect(buildWsiSlideQuery('study 1', SOURCE)).toBe(
            'studyId=study%201&key=0123456789ab&enc=v1.a%2Bb%2Fc%3D'
        );
    });
});

describe('buildWsiTileUrl', () => {
    it('puts the slide query on the ZXY tile path', () => {
        const query = buildWsiSlideQuery('study-1', SOURCE);
        expect(buildWsiTileUrl('/tiles-api/', query, 3, 1, 2)).toBe(
            `/tiles-api/tiles/zxy/3/1/2?${query}`
        );
    });
});

describe('buildWsiThumbnailUrl', () => {
    it('names the slide and the requested size only', () => {
        const url = new URL(
            buildWsiThumbnailUrl(
                'https://tiles.example.org/wsi/',
                'study-1',
                SOURCE,
                128,
                96
            )
        );
        expect(url.origin + url.pathname).toBe(
            'https://tiles.example.org/wsi/thumbnails'
        );
        expect([...url.searchParams.entries()]).toEqual([
            ['studyId', 'study-1'],
            ['key', '0123456789ab'],
            ['enc', 'v1.a+b/c='],
            ['width', '128'],
            ['height', '96'],
        ]);
    });

    it('bounds thumbnail dimensions', () => {
        const url = new URL(
            buildWsiThumbnailUrl(
                'https://tiles.example.org',
                'study-1',
                SOURCE,
                63.6,
                0
            )
        );
        expect(url.searchParams.get('width')).toBe('64');
        expect(url.searchParams.get('height')).toBe('1');
    });
});
