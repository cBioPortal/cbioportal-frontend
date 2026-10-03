import {
    buildWsiHierarchyApiUrl,
    buildWsiRequestHeaders,
    buildWsiThumbnailUrl,
} from './wsiUrls';

describe('buildWsiHierarchyApiUrl', () => {
    it('preserves a portal context path and encodes identifiers', () => {
        const buildApiUrl = (path: string) =>
            `https://portal.example/beta/${path}`;

        expect(
            buildWsiHierarchyApiUrl(buildApiUrl, 'study / 1', 'patient#1')
        ).toBe(
            'https://portal.example/beta/api/wsi/v2/hierarchy/study%20%2F%201/patient%231'
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
