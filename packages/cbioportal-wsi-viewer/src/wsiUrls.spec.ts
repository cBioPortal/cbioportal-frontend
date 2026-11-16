import {
    checkWsiTileServerOrigin,
    normalizeWsiTileServerBase,
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

describe('normalizeWsiTileServerBase', () => {
    it.each([
        ['/wsi', '/wsi/'],
        ['/wsi/', '/wsi/'],
        ['/wsi//', '/wsi/'],
        ['https://portal.example.org/wsi', 'https://portal.example.org/wsi/'],
        ['https://portal.example.org', 'https://portal.example.org/'],
    ])('normalizes %s to %s', (base, expected) => {
        expect(normalizeWsiTileServerBase(base)).toBe(expected);
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

describe('tile and thumbnail URLs', () => {
    it.each([
        '/wsi',
        '/wsi/',
        'https://portal.example.org/wsi',
        'https://portal.example.org/wsi/',
    ])('share the base %s, with or without a trailing slash', base => {
        const query = buildWsiSlideQuery('study-1', SOURCE);
        const root = base.replace(/\/$/, '');
        expect(buildWsiTileUrl(base, query, 0, 0, 0)).toBe(
            `${root}/tiles/zxy/0/0/0?${query}`
        );
        expect(buildWsiThumbnailUrl(base, 'study-1', SOURCE, 128, 96)).toBe(
            `${root}/thumbnails?${query}&width=128&height=96`
        );
    });
});

describe('checkWsiTileServerOrigin', () => {
    let errorSpy: jest.SpyInstance;

    beforeEach(() => {
        errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
        errorSpy.mockRestore();
    });

    it('accepts a relative or same-origin tile server', () => {
        expect(checkWsiTileServerOrigin('/wsi')).toBe(true);
        expect(checkWsiTileServerOrigin(`${window.location.origin}/wsi/`)).toBe(
            true
        );
        expect(errorSpy).not.toHaveBeenCalled();
    });

    it('reports a cross-origin tile server once', () => {
        expect(checkWsiTileServerOrigin('https://cross.example.org/wsi')).toBe(
            false
        );
        expect(
            checkWsiTileServerOrigin('https://cross.example.org/other/')
        ).toBe(false);

        expect(errorSpy).toHaveBeenCalledTimes(1);
        expect(errorSpy.mock.calls[0][0]).toContain(
            'https://cross.example.org'
        );
        expect(errorSpy.mock.calls[0][0]).toContain('same-origin');
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
