import { assert } from 'chai';

import { clampZoomLevel, ZOOM_MAX, ZOOM_MIN } from './ZoomUtils';

describe('ZoomUtils', () => {
    describe('clampZoomLevel', () => {
        it('uses minimum zoom for undefined and low values', () => {
            assert.equal(clampZoomLevel(undefined as any), ZOOM_MIN);
            assert.equal(clampZoomLevel(0.5), ZOOM_MIN);
        });

        it('keeps values inside range unchanged', () => {
            assert.equal(clampZoomLevel(1), 1);
            assert.equal(clampZoomLevel(2.5), 2.5);
        });

        it('caps values above max zoom', () => {
            assert.equal(clampZoomLevel(ZOOM_MAX + 1), ZOOM_MAX);
        });
    });
});
