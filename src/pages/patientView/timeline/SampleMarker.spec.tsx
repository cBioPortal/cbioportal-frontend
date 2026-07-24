import { assert } from 'chai';
import {
    getMultipleSampleMarkerClipPathId,
    getMultipleSampleMarkerColorKey,
    getMultipleSampleMarkerSummary,
} from './SampleMarker';

describe('SampleMarker', () => {
    it('builds deterministic clip-path ids from the marker payload', () => {
        assert.equal(
            getMultipleSampleMarkerClipPathId(
                ['#111111', '#222222'],
                ['1', '2']
            ),
            'multiple-sample-marker-#111111|#222222::1|2'
        );
    });

    it('builds stable color keys for segmented sample-marker fills', () => {
        assert.equal(
            getMultipleSampleMarkerColorKey('#111111', 1),
            '#111111:1'
        );
    });

    it('reuses the same multiple-sample marker summary for unchanged warm inputs', () => {
        const colors = ['#111111', '#222222'];
        const labels = ['1', '2'];

        const first = getMultipleSampleMarkerSummary(colors, labels);
        const second = getMultipleSampleMarkerSummary(colors, labels);

        assert.strictEqual(second, first);
        assert.equal(first.label, '1-2');
        assert.deepEqual(first.uniqueColors, ['#111111', '#222222']);
    });

    it('rebuilds the multiple-sample marker summary when labels mutate in place', () => {
        const colors = ['#111111', '#222222'];
        const labels = ['1', '2'];

        const first = getMultipleSampleMarkerSummary(colors, labels);
        labels[1] = '3';
        const second = getMultipleSampleMarkerSummary(colors, labels);

        assert.notStrictEqual(second, first);
        assert.equal(second.label, '1, 3');
        assert.equal(
            second.clipPathId,
            'multiple-sample-marker-#111111|#222222::1|3'
        );
    });
});
