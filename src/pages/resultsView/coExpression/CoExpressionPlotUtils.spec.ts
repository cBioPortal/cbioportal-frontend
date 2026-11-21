import { assert } from 'chai';
import { getAxisLogScale, getUniquePrecision } from './CoExpressionPlotUtils';

describe('CoExpressionPlotUtils', () => {
    describe('getUniquePrecision', () => {
        it('empty array', () => {
            assert.equal(getUniquePrecision(0, []), 0);
        });
        it('value not present', () => {
            assert.equal(getUniquePrecision(0, [1]), 0);
        });
        it('completely unique', () => {
            assert.equal(getUniquePrecision(23, [11, 2, 23, 43, 59, 0]), 0);
        });
        it('unique at one decimal', () => {
            assert.equal(getUniquePrecision(1.5, [1.2, 1.6, 2, 5, 1.5]), 1);
        });
        it('unique at 2 decimals', () => {
            assert.equal(
                getUniquePrecision(6.51, [1.23, 1.6, 6.53, 5, 6.51]),
                2
            );
        });
        it('unique at 5 decimals', () => {
            assert.equal(
                getUniquePrecision(
                    1.23456,
                    [1.23456, 1.23459, 2.23456, 43.31314, 5],
                    10
                ),
                5
            );
        });
    });

    describe('getAxisLogScale', () => {
        const RNA_SEQ = 'brca_tcga_pan_can_atlas_2018_rna_seq_v2_mrna';
        const RNA_SEQ_ZSCORES =
            'brca_tcga_pan_can_atlas_2018_rna_seq_v2_mrna_median_all_sample_Zscores';
        const RPPA = 'brca_tcga_pan_can_atlas_2018_rppa';
        const MICROARRAY = 'coadread_tcga_pub_mrna';

        it('log2-transforms an RNA-seq profile', () => {
            const logScale = getAxisLogScale(true, RNA_SEQ)!;
            assert.equal(logScale.label, 'log2');
            assert.equal(logScale.fLogScale(1024), 10);
            assert.equal(logScale.fInvLogScale(10), 1024);
        });
        it('maps RNA-seq values below 0.01 to log2(0.01)', () => {
            const logScale = getAxisLogScale(true, RNA_SEQ)!;
            assert.equal(logScale.fLogScale(0), Math.log2(0.01));
        });
        it('does not transform profiles that are not RNA-seq', () => {
            assert.isUndefined(getAxisLogScale(true, RPPA));
            assert.isUndefined(getAxisLogScale(true, MICROARRAY));
            assert.isUndefined(getAxisLogScale(true, RNA_SEQ_ZSCORES));
        });
        it('does not transform anything when log scale is off', () => {
            assert.isUndefined(getAxisLogScale(false, RNA_SEQ));
        });
    });
});
