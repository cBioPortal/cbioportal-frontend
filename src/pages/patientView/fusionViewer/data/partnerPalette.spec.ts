import { assert } from 'chai';
import {
    rankedColorMap,
    colorFor,
    PARTNER_PALETTE,
    OTHER_COLOR,
    NO_PARTNER_COLOR,
} from './partnerPalette';
import { NO_PARTNER } from './comparisonRows';

describe('partnerPalette', () => {
    it('top 8 non-sentinel categories get the palette; the rest are other', () => {
        const cats = [
            NO_PARTNER,
            ...Array.from({ length: 10 }, (_, i) => `P${i}`),
        ];
        const m = rankedColorMap(cats);
        assert.equal(colorFor(m, NO_PARTNER), NO_PARTNER_COLOR);
        assert.equal(colorFor(m, 'P0'), PARTNER_PALETTE[0]);
        assert.equal(colorFor(m, 'P7'), PARTNER_PALETTE[7]);
        assert.equal(colorFor(m, 'P8'), OTHER_COLOR);
        assert.equal(colorFor(m, 'never-seen'), OTHER_COLOR);
    });
});
