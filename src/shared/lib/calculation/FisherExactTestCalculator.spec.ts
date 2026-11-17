import { assert } from 'chai';
import { getTwoTailedPValue } from './FisherExactTestCalculator';

describe('#calculatePValue()', () => {
    it('returns 1 for all zero counts', () => {
        assert.equal(1, getTwoTailedPValue(0, 0, 0, 0));
    });

    it('returns 1 for all one counts', () => {
        assert.equal(1, getTwoTailedPValue(0, 0, 0, 0));
    });

    it('returns correct p values for multiple different counts', () => {
        assert.equal(
            0.00036917378321091467,
            getTwoTailedPValue(9, 268, 0, 384)
        );

        assert.equal(0.0023260213212133113, getTwoTailedPValue(9, 268, 1, 383));

        assert.equal(0.999999999999234, getTwoTailedPValue(0, 277, 1, 383));

        assert.equal(
            0.000007200394775273417,
            getTwoTailedPValue(24, 253, 5, 379)
        );
    });

    it('returns the same p value when the two groups are swapped', () => {
        // altered and unaltered counts of two equal-size groups
        const tables = [
            [299, 1, 298, 2],
            [296, 4, 298, 2],
            [265, 35, 285, 15],
        ];
        tables.forEach(([a, b, c, d]) => {
            const p = getTwoTailedPValue(a, b, c, d);
            const swapped = getTwoTailedPValue(c, d, a, b);
            assert.closeTo(swapped, p, 1e-10);
        });
        // values from R's fisher.test
        assert.closeTo(getTwoTailedPValue(299, 1, 298, 2), 1, 1e-10);
        assert.closeTo(
            getTwoTailedPValue(296, 4, 298, 2),
            0.685927004588,
            1e-10
        );
        assert.closeTo(
            getTwoTailedPValue(265, 35, 285, 15),
            0.004582812026,
            1e-10
        );
    });

    it('never returns a p value above 1', () => {
        assert.isAtMost(getTwoTailedPValue(150, 150, 150, 150), 1);
    });
});
