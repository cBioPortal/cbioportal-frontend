import { assert } from 'chai';
import {
    CHROM_LABELS,
    chromosomeLengths,
    chromIndex,
    angleFor,
    polar,
    sectorArcPath,
    chordPath,
    svIdiomColor,
} from './circosGeometry';

describe('circosGeometry', () => {
    describe('chromosomeLengths', () => {
        it('returns a 25-element array (index 0 dummy, 1-24 = chr1-22,X,Y) for GRCh37', () => {
            const lengths = chromosomeLengths('GRCh37');
            assert.equal(lengths.length, 25);
            assert.equal(lengths[1], 249250621); // chr1
            assert.equal(lengths[24], 59373566); // chrY
        });

        it('returns GRCh38 lengths for GRCh38', () => {
            const lengths = chromosomeLengths('GRCh38');
            assert.equal(lengths[1], 248956422);
        });

        it('falls back to GRCh38 for an unknown/missing build', () => {
            const fallback = chromosomeLengths('GRCh38');
            const unknown = chromosomeLengths('bogus-build' as any);
            assert.deepEqual(unknown, fallback);
        });
    });

    describe('CHROM_LABELS', () => {
        it('is index-aligned with 25 entries, chr1 at index 1, X at 23, Y at 24', () => {
            assert.equal(CHROM_LABELS.length, 25);
            assert.equal(CHROM_LABELS[1], '1');
            assert.equal(CHROM_LABELS[22], '22');
            assert.equal(CHROM_LABELS[23], 'X');
            assert.equal(CHROM_LABELS[24], 'Y');
        });
    });

    describe('chromIndex', () => {
        it('maps a plain chromosome number string', () => {
            assert.equal(chromIndex('1'), 1);
            assert.equal(chromIndex('22'), 22);
        });

        it('maps X and Y', () => {
            assert.equal(chromIndex('X'), 23);
            assert.equal(chromIndex('Y'), 24);
        });

        it('tolerates a chr prefix', () => {
            assert.equal(chromIndex('chr1'), 1);
            assert.equal(chromIndex('chrX'), 23);
        });

        it('returns -1 for an unmappable chromosome', () => {
            assert.equal(chromIndex('GL000220.1'), -1);
            assert.equal(chromIndex(''), -1);
        });
    });

    describe('angleFor', () => {
        const lengths = chromosomeLengths('GRCh38');
        const gapDeg = 1.5;

        it('places pos 0 of chr1 at the start of the ring (~0deg)', () => {
            const angle = angleFor(1, 0, lengths, gapDeg);
            assert.approximately(angle, 0, 0.01);
        });

        it('is monotonically increasing within a sector', () => {
            const a1 = angleFor(1, 1000, lengths, gapDeg);
            const a2 = angleFor(1, 2000, lengths, gapDeg);
            const a3 = angleFor(1, 3000, lengths, gapDeg);
            assert.isBelow(a1, a2);
            assert.isBelow(a2, a3);
        });

        it('places the end of chrY near 360 - gapDeg', () => {
            const angle = angleFor(24, lengths[24], lengths, gapDeg);
            assert.approximately(angle, 360 - gapDeg, 1);
        });

        it('respects cumulative offsets across sectors (chr2 starts after chr1 + gap)', () => {
            const chr1End = angleFor(1, lengths[1], lengths, gapDeg);
            const chr2Start = angleFor(2, 0, lengths, gapDeg);
            assert.isAbove(chr2Start, chr1End);
        });
    });

    describe('polar', () => {
        it('maps 0deg (top) to (cx, cy - radius)', () => {
            const p = polar(0, 100, 50, 50);
            assert.approximately(p.x, 50, 0.01);
            assert.approximately(p.y, -50, 0.01);
        });

        it('maps 90deg (clockwise from top = right) to (cx + radius, cy)', () => {
            const p = polar(90, 100, 50, 50);
            assert.approximately(p.x, 150, 0.01);
            assert.approximately(p.y, 50, 0.01);
        });
    });

    describe('sectorArcPath', () => {
        it('returns a non-empty SVG path string starting with M', () => {
            const d = sectorArcPath(0, 10, 100, 90, 90);
            assert.isString(d);
            assert.isTrue(d.startsWith('M'));
            assert.isFalse(/NaN/.test(d));
        });
    });

    describe('chordPath', () => {
        it('returns a non-empty valid path string for two distinct angles', () => {
            const d = chordPath(10, 200, 100, 90, 90);
            assert.isTrue(d.startsWith('M'));
            assert.isFalse(/NaN/.test(d));
        });

        it('does not produce NaN for a degenerate (near-identical angle) chord', () => {
            const d = chordPath(45, 45.0001, 100, 90, 90);
            assert.isFalse(/NaN/.test(d));
            assert.isTrue(d.startsWith('M'));
        });

        it('spreads near-coincident endpoints so short-range events draw a visible loop', () => {
            const d = chordPath(45, 45.0001, 100, 90, 90);
            const m = d.match(
                /^M ([\d.-]+) ([\d.-]+) Q [\d.-]+ [\d.-]+ ([\d.-]+) ([\d.-]+)/
            );
            assert.isNotNull(m);
            const x1 = Number(m![1]);
            const y1 = Number(m![2]);
            const x2 = Number(m![3]);
            const y2 = Number(m![4]);
            // Endpoints must be visibly apart, not a zero-width spike.
            assert.isAbove(Math.hypot(x2 - x1, y2 - y1), 2);
        });
    });

    describe('svIdiomColor', () => {
        it('maps each known idiom', () => {
            assert.equal(svIdiomColor('INTERGENIC_FUSION'), '#474747');
            assert.equal(svIdiomColor('INTRACHROM_FUSION'), '#474747');
            assert.equal(svIdiomColor('INTRAGENIC_DELETION'), '#EE2B2B');
            assert.equal(svIdiomColor('INTRAGENIC_DUPLICATION'), '#45BA4B');
            assert.equal(svIdiomColor('INTRAGENIC_INVERSION'), '#2B45EE');
        });

        it('falls back for INSERTION / INTERGENIC_REGION / UNKNOWN_SV', () => {
            assert.equal(svIdiomColor('INSERTION'), '#666666');
            assert.equal(svIdiomColor('INTERGENIC_REGION'), '#666666');
            assert.equal(svIdiomColor('UNKNOWN_SV'), '#666666');
        });
    });
});
