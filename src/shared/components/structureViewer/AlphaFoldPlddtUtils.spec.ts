import { assert } from 'chai';
import {
    ALPHAFOLD_PLDDT_LEGEND,
    getAlphaFoldPlddtColor,
    getAlphaFoldPlddtColorfunc,
} from './AlphaFoldPlddtUtils';

const VERY_HIGH = '#0053D6';
const CONFIDENT = '#65CBF3';
const LOW = '#FFDB13';
const VERY_LOW = '#FF7D45';

describe('AlphaFoldPlddtUtils', () => {
    describe('getAlphaFoldPlddtColor', () => {
        it('colors each pLDDT score by its AlphaFold DB band', () => {
            assert.equal(getAlphaFoldPlddtColor(95), VERY_HIGH);
            assert.equal(getAlphaFoldPlddtColor(80), CONFIDENT);
            assert.equal(getAlphaFoldPlddtColor(60), LOW);
            assert.equal(getAlphaFoldPlddtColor(45), VERY_LOW);
            assert.equal(getAlphaFoldPlddtColor(20), VERY_LOW);
        });

        it('puts a score on a band boundary in the higher band', () => {
            assert.equal(getAlphaFoldPlddtColor(90), VERY_HIGH);
            assert.equal(getAlphaFoldPlddtColor(89.99), CONFIDENT);
            assert.equal(getAlphaFoldPlddtColor(70), CONFIDENT);
            assert.equal(getAlphaFoldPlddtColor(69.99), LOW);
            assert.equal(getAlphaFoldPlddtColor(50), LOW);
            assert.equal(getAlphaFoldPlddtColor(49.99), VERY_LOW);
        });

        it('covers both ends of the 0-100 scale', () => {
            assert.equal(getAlphaFoldPlddtColor(0), VERY_LOW);
            assert.equal(getAlphaFoldPlddtColor(100), VERY_HIGH);
        });

        it('uses the legend color of every band', () => {
            ALPHAFOLD_PLDDT_LEGEND.forEach(item => {
                assert.equal(
                    getAlphaFoldPlddtColor(item.min),
                    item.color,
                    item.label
                );
                assert.equal(
                    getAlphaFoldPlddtColor((item.min + item.max) / 2),
                    item.color,
                    item.label
                );
            });
        });
    });

    describe('getAlphaFoldPlddtColorfunc', () => {
        it('colors a 3Dmol atom by the pLDDT stored in its B-factor', () => {
            const colorfunc = getAlphaFoldPlddtColorfunc();

            assert.equal(colorfunc({ b: 45 }), VERY_LOW);
            assert.equal(colorfunc({ b: 65 }), LOW);
            assert.equal(colorfunc({ b: 80 }), CONFIDENT);
            assert.equal(colorfunc({ b: 92.5 }), VERY_HIGH);
        });
    });
});
