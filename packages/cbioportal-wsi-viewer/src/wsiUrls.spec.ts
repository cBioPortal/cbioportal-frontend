import {
    buildWsiRequestHeaders,
    buildWsiResourceRowsApiUrl,
    buildWsiThumbnailUrl,
} from './wsiUrls';

describe('buildWsiResourceRowsApiUrl', () => {
    it('preserves a portal context path', () => {
        const buildApiUrl = (path: string) =>
            `https://portal.example/beta/${path}`;

        expect(buildWsiResourceRowsApiUrl(buildApiUrl)).toBe(
            'https://portal.example/beta/api/resource-table/query/fetch'
        );
    });
});

describe('buildWsiThumbnailUrl', () => {
    it('puts no slide identifier or source in the thumbnail URL', () => {
        expect(
            buildWsiThumbnailUrl('https://tiles.example.org/wsi/', 128, 96)
        ).toBe('https://tiles.example.org/wsi/thumbnails?width=128&height=96');
    });

    it('bounds thumbnail dimensions', () => {
        expect(buildWsiThumbnailUrl('https://tiles.example.org', 63.6, 0)).toBe(
            'https://tiles.example.org/thumbnails?width=64&height=1'
        );
    });
});

describe('buildWsiRequestHeaders', () => {
    it('sends only the bearer token', () => {
        expect(buildWsiRequestHeaders('token-1')).toEqual({
            Authorization: 'Bearer token-1',
        });
        expect(buildWsiRequestHeaders()).toEqual({});
    });
});
