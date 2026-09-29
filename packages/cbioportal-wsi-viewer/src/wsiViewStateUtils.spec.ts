/**
 * @jest-environment jsdom
 */
import {
    buildWsiHash,
    clearWsiHashFromCurrentUrl,
    hasWsiHashViewport,
    readWsiHashState,
    writeSelectedSlideHashToCurrentUrl,
    writeWsiHashToCurrentUrl,
} from './wsiViewStateUtils';

describe('wsiViewStateUtils', () => {
    let originalHash: string;
    let replaceStateSpy: jest.SpyInstance;

    beforeEach(() => {
        originalHash = window.location.hash;
        replaceStateSpy = jest.spyOn(window.history, 'replaceState');
    });

    afterEach(() => {
        window.location.hash = originalHash;
        replaceStateSpy.mockRestore();
    });

    it('builds the WSI hash without URLSearchParams allocation and preserves encoded slide ids', () => {
        const hash = buildWsiHash({
            selectedSlideId: 'slide id/1',
            osdViewer: {
                viewport: {
                    getCenter: jest.fn().mockReturnValue({}),
                    viewportToImageCoordinates: jest
                        .fn()
                        .mockReturnValue({ x: 1234.4, y: 5678.6 }),
                    getZoom: jest.fn().mockReturnValue(1.23456789),
                },
            },
        });

        expect(hash).toBe('wsi:slide=slide%20id%2F1&x=1234&y=5679&z=1.234568');
        window.location.hash = `#${hash}`;
        expect(readWsiHashState()).toEqual({
            slideId: 'slide id/1',
            x: 1234,
            y: 5679,
            z: 1.234568,
        });
    });

    it('skips replaceState when the hash is already current', () => {
        window.location.hash = '#wsi:slide=slide-1&x=1&y=2&z=3.000000';

        const href = writeWsiHashToCurrentUrl(
            'wsi:slide=slide-1&x=1&y=2&z=3.000000'
        );

        expect(replaceStateSpy).not.toHaveBeenCalled();
        expect(href).toContain('#wsi:slide=slide-1&x=1&y=2&z=3.000000');
    });

    it('updates the URL when the target hash changes', () => {
        window.location.hash = '#wsi:slide=slide-1&x=1&y=2&z=3.000000';

        const href = writeWsiHashToCurrentUrl(
            'wsi:slide=slide-2&x=4&y=5&z=6.000000'
        );

        expect(replaceStateSpy).toHaveBeenCalledTimes(1);
        expect(href).toContain('#wsi:slide=slide-2&x=4&y=5&z=6.000000');
    });

    it('clears a stale WSI hash without touching other hashes', () => {
        window.location.hash = '#wsi:slide=slide-1&x=1&y=2&z=3.000000';

        clearWsiHashFromCurrentUrl();

        expect(window.location.hash).toBe('');
        expect(replaceStateSpy).toHaveBeenCalledTimes(1);

        replaceStateSpy.mockClear();
        window.location.hash = '#other=1';
        clearWsiHashFromCurrentUrl();
        expect(window.location.hash).toBe('#other=1');
        expect(replaceStateSpy).not.toHaveBeenCalled();
    });

    it('reads a coordinate-less slide selection hash', () => {
        window.location.hash = `#wsi:slide=${encodeURIComponent('slide id/1')}`;

        const state = readWsiHashState();

        expect(state).toEqual({ slideId: 'slide id/1' });
        expect(hasWsiHashViewport(state)).toBe(false);
    });

    it('rejects a partial or malformed viewport', () => {
        window.location.hash = '#wsi:slide=slide-1&x=1&y=2';
        expect(readWsiHashState()).toBeNull();
        window.location.hash = '#wsi:slide=slide-1&x=1&y=2&z=bad';
        expect(readWsiHashState()).toBeNull();
        window.location.hash = '#wsi:x=1&y=2&z=3';
        expect(readWsiHashState()).toBeNull();
    });

    it('keeps a coordinate-less selection when switching slides', () => {
        window.location.hash = '#wsi:slide=slide-1';

        const href = writeSelectedSlideHashToCurrentUrl('slide-2');

        expect(href).toMatch(/#wsi:slide=slide-2$/);
        expect(readWsiHashState()).toEqual({ slideId: 'slide-2' });
    });

    it('carries the viewport when switching slides from a full hash', () => {
        window.location.hash = '#wsi:slide=slide-1&x=1&y=2&z=3';

        const href = writeSelectedSlideHashToCurrentUrl('slide-2');

        expect(href).toContain('#wsi:slide=slide-2&x=1&y=2&z=3.000000');
        expect(hasWsiHashViewport(readWsiHashState())).toBe(true);
    });
});
