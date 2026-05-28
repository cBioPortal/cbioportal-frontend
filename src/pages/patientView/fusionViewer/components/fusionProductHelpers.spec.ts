import { assert } from 'chai';
import {
    select5PrimeExons,
    select3PrimeExons,
    select5PrimeDomains,
    select3PrimeDomains,
    computeJunctionX,
    PRODUCT_HEIGHT,
    EXON_GAP,
    DIAMOND_SIZE,
} from './fusionProductHelpers';
import {
    Exon,
    ProteinDomain,
    TranscriptData,
    GenePartner,
} from '../data/types';

function makeDomain(
    name: string,
    startGenomic: number,
    endGenomic: number,
    startAA = 1,
    endAA = 100
): ProteinDomain {
    return {
        name,
        pfamId: `PF_${name}`,
        startGenomic,
        endGenomic,
        startAA,
        endAA,
        source: 'Pfam',
    };
}

// ---------------------------------------------------------------------------
// Test data
// ---------------------------------------------------------------------------

function makeExons(ranges: Array<[number, number, number]>): Exon[] {
    return ranges.map(([num, start, end]) => ({
        number: num,
        start,
        end,
    }));
}

function makeTranscript(
    exons: Exon[],
    strand: '+' | '-' = '+'
): TranscriptData {
    return {
        transcriptId: 'ENST00000001',
        displayName: 'ENST00000001',
        gene: 'TEST_GENE',
        biotype: 'protein_coding',
        strand,
        txStart: Math.min(...exons.map(e => e.start)),
        txEnd: Math.max(...exons.map(e => e.end)),
        exons,
        isForteSelected: true,
        domains: [],
        utrs: [],
    };
}

function makeGene(overrides: Partial<GenePartner> = {}): GenePartner {
    return {
        symbol: 'GENE',
        chromosome: '1',
        position: 5000,
        selectedTranscriptId: 'ENST00000001',
        siteDescription: '',
        ...overrides,
    };
}

describe('fusionProductHelpers', () => {
    // -------------------------------------------------------------------
    // select5PrimeExons
    // -------------------------------------------------------------------
    describe('select5PrimeExons', () => {
        const exons = makeExons([
            [1, 100, 200],
            [2, 300, 400],
            [3, 500, 600],
            [4, 700, 800],
        ]);

        describe('+ strand', () => {
            it('includes exons whose start <= breakpoint', () => {
                const result = select5PrimeExons(exons, 350, '+');

                assert.equal(result.length, 2);
                assert.equal(result[0].number, 1);
                assert.equal(result[1].number, 2);
            });

            it('includes exon at exact breakpoint position', () => {
                const result = select5PrimeExons(exons, 300, '+');

                assert.equal(result.length, 2);
                assert.equal(result[1].start, 300);
            });

            it('returns all exons when breakpoint is after last exon', () => {
                const result = select5PrimeExons(exons, 9999, '+');

                assert.equal(result.length, 4);
            });

            it('returns only first exon when breakpoint is at first exon start', () => {
                const result = select5PrimeExons(exons, 100, '+');

                assert.equal(result.length, 1);
                assert.equal(result[0].number, 1);
            });

            it('returns empty when breakpoint is before all exons', () => {
                const result = select5PrimeExons(exons, 50, '+');

                assert.equal(result.length, 0);
            });
        });

        describe('- strand', () => {
            it('includes exons whose end >= breakpoint', () => {
                const result = select5PrimeExons(exons, 350, '-');

                assert.equal(result.length, 3);
                assert.equal(result[0].number, 2); // end 400 >= 350
                assert.equal(result[1].number, 3); // end 600 >= 350
                assert.equal(result[2].number, 4); // end 800 >= 350
            });

            it('includes exon at exact breakpoint position (end == bp)', () => {
                const result = select5PrimeExons(exons, 400, '-');

                assert.equal(result.length, 3);
            });

            it('returns empty when breakpoint is after all exon ends', () => {
                const result = select5PrimeExons(exons, 9999, '-');

                assert.equal(result.length, 0);
            });
        });
    });

    // -------------------------------------------------------------------
    // select3PrimeExons
    // -------------------------------------------------------------------
    describe('select3PrimeExons', () => {
        const exons = makeExons([
            [1, 100, 200],
            [2, 300, 400],
            [3, 500, 600],
            [4, 700, 800],
        ]);

        describe('+ strand', () => {
            it('includes exons whose end >= breakpoint', () => {
                const result = select3PrimeExons(exons, 350, '+');

                assert.equal(result.length, 3);
                assert.equal(result[0].number, 2); // end 400 >= 350
                assert.equal(result[1].number, 3);
                assert.equal(result[2].number, 4);
            });

            it('returns all exons when breakpoint is before first exon', () => {
                const result = select3PrimeExons(exons, 50, '+');

                assert.equal(result.length, 4);
            });

            it('returns empty when breakpoint is after all exon ends', () => {
                const result = select3PrimeExons(exons, 9999, '+');

                assert.equal(result.length, 0);
            });
        });

        describe('- strand', () => {
            it('includes exons whose start <= breakpoint', () => {
                const result = select3PrimeExons(exons, 350, '-');

                assert.equal(result.length, 2);
                assert.equal(result[0].number, 1); // start 100 <= 350
                assert.equal(result[1].number, 2); // start 300 <= 350
            });

            it('returns all exons when breakpoint is after last exon', () => {
                const result = select3PrimeExons(exons, 9999, '-');

                assert.equal(result.length, 4);
            });

            it('returns empty when breakpoint is before all exons', () => {
                const result = select3PrimeExons(exons, 50, '-');

                assert.equal(result.length, 0);
            });
        });
    });

    // -------------------------------------------------------------------
    // select5PrimeExons & select3PrimeExons — symmetry check
    // -------------------------------------------------------------------
    describe('5-prime / 3-prime symmetry', () => {
        const exons = makeExons([
            [1, 100, 200],
            [2, 300, 400],
            [3, 500, 600],
        ]);

        it('5p(+) and 3p(-) are equivalent (both filter by start <= bp)', () => {
            const five = select5PrimeExons(exons, 350, '+');
            const three = select3PrimeExons(exons, 350, '-');

            assert.deepEqual(five, three);
        });

        it('5p(-) and 3p(+) are equivalent (both filter by end >= bp)', () => {
            const five = select5PrimeExons(exons, 350, '-');
            const three = select3PrimeExons(exons, 350, '+');

            assert.deepEqual(five, three);
        });
    });

    // -------------------------------------------------------------------
    // select5PrimeDomains / select3PrimeDomains
    // -------------------------------------------------------------------
    describe('select5PrimeDomains / select3PrimeDomains', () => {
        // Simulated EGFR-like layout on + strand: domains ordered by coord.
        const domains = [
            makeDomain('RecepL_1', 55210000, 55215000),
            makeDomain('Furin', 55215500, 55222000),
            makeDomain('RecepL_2', 55225000, 55230000),
            makeDomain('Pkinase', 55240000, 55250000),
        ];

        describe('+ strand', () => {
            it('5p retains domains whose startGenomic <= breakpoint', () => {
                // EGFRvIII-like 5p breakpoint before all coding domains
                const result = select5PrimeDomains(domains, 55206630, '+');
                assert.equal(result.length, 0);
            });

            it('5p includes partial-overlap domain (start upstream)', () => {
                // Breakpoint mid-Furin → Furin has upstream portion, is retained
                const result = select5PrimeDomains(domains, 55220000, '+');
                assert.deepEqual(
                    result.map(d => d.name),
                    ['RecepL_1', 'Furin']
                );
            });

            it('3p retains domains whose endGenomic >= breakpoint', () => {
                // EGFRvIII-like 3p breakpoint drops L1 and most of Furin
                const result = select3PrimeDomains(domains, 55223152, '+');
                assert.deepEqual(
                    result.map(d => d.name),
                    ['RecepL_2', 'Pkinase']
                );
            });

            it('3p includes partial-overlap domain (end downstream)', () => {
                const result = select3PrimeDomains(domains, 55220000, '+');
                assert.deepEqual(
                    result.map(d => d.name),
                    ['Furin', 'RecepL_2', 'Pkinase']
                );
            });
        });

        describe('- strand', () => {
            // For minus strand, 5' of gene is at HIGH genomic coords.
            const minusDomains = [
                makeDomain('KinaseC_terminal', 29420000, 29425000),
                makeDomain('Pkinase', 29440000, 29460000),
                makeDomain('MAM', 29800000, 29820000),
            ];

            it('5p retains domains whose endGenomic >= breakpoint', () => {
                // Minus-strand 5p partner: retained region is upstream in tx
                // direction = higher coords. Breakpoint at 29,446,700 keeps
                // Pkinase (overlaps) and MAM (upstream); drops KinaseC_term.
                const result = select5PrimeDomains(minusDomains, 29446700, '-');
                assert.deepEqual(
                    result.map(d => d.name),
                    ['Pkinase', 'MAM']
                );
            });

            it('3p retains domains whose startGenomic <= breakpoint', () => {
                // Minus-strand 3p partner: retained region is downstream in
                // tx direction = lower coords.
                const result = select3PrimeDomains(minusDomains, 29446700, '-');
                assert.deepEqual(
                    result.map(d => d.name),
                    ['KinaseC_terminal', 'Pkinase']
                );
            });
        });

        it('5p/3p symmetry matches exon selector rule', () => {
            // Same rule as exon selector: 5p(+) ≡ 3p(-), 5p(-) ≡ 3p(+).
            const f5p = select5PrimeDomains(domains, 55220000, '+');
            const f3m = select3PrimeDomains(domains, 55220000, '-');
            assert.deepEqual(f5p, f3m);

            const f5m = select5PrimeDomains(domains, 55220000, '-');
            const f3p = select3PrimeDomains(domains, 55220000, '+');
            assert.deepEqual(f5m, f3p);
        });
    });

    // -------------------------------------------------------------------
    // computeJunctionX
    // -------------------------------------------------------------------
    describe('computeJunctionX', () => {
        it('returns center when gene2 is null', () => {
            const gene1 = makeGene();
            const t5p = makeTranscript(
                makeExons([
                    [1, 100, 200],
                    [2, 300, 400],
                ]),
                '+'
            );

            const jx = computeJunctionX(gene1, null, t5p, undefined, 0, 500);

            assert.equal(jx, 250); // x + width/2
        });

        it('returns center when forteTranscript3p is undefined', () => {
            const gene1 = makeGene();
            const gene2 = makeGene({ symbol: 'GENE_B', position: 8000 });
            const t5p = makeTranscript(
                makeExons([
                    [1, 100, 200],
                    [2, 300, 400],
                ]),
                '+'
            );

            const jx = computeJunctionX(gene1, gene2, t5p, undefined, 0, 500);

            assert.equal(jx, 250);
        });

        it('returns center when no exons are retained', () => {
            const gene1 = makeGene({ position: 50 }); // before all exons
            const gene2 = makeGene({ position: 9999 }); // after all exons on +
            const t5p = makeTranscript(makeExons([[1, 100, 200]]), '+');
            const t3p = makeTranscript(makeExons([[1, 100, 200]]), '+');

            // gene1 at 50 on + strand: no exon starts <= 50
            // gene2 at 9999 on + strand: exon end 200 < 9999 → wait, 200 >= 9999? No.
            // Actually exon end 200 is NOT >= 9999, so 0 retained 3p exons.
            // 5p: start <= 50? 100 <= 50? No. So 0 retained 5p exons.
            const jx = computeJunctionX(gene1, gene2, t5p, t3p, 0, 500);

            assert.equal(jx, 250);
        });

        it('computes junction position between retained 5p and 3p exons', () => {
            const gene1 = makeGene({ position: 250 });
            const gene2 = makeGene({
                symbol: 'GENE_B',
                position: 350,
            });

            const exons5p = makeExons([
                [1, 100, 200],
                [2, 200, 300],
            ]);
            const exons3p = makeExons([
                [1, 300, 400],
                [2, 400, 500],
            ]);

            const t5p = makeTranscript(exons5p, '+');
            const t3p = makeTranscript(exons3p, '+');

            const x = 10;
            const width = 600;
            const jx = computeJunctionX(gene1, gene2, t5p, t3p, x, width);

            // 5p exons retained: start <= 250 → exons 1 (100) and 2 (200) → 2 exons
            // 3p exons retained: end >= 350 → exons 1 (400) and 2 (500) → 2 exons
            // totalExons = 4
            const diamondWidth = DIAMOND_SIZE * 2 + 4;
            const availableWidth =
                width - diamondWidth - EXON_GAP * (4 - 1) - 20;
            const exonWidth = Math.max(8, availableWidth / 4);
            const startX = x + 10;
            const after5p = startX + 2 * (exonWidth + EXON_GAP);
            const expected = after5p + diamondWidth / 2;

            assert.closeTo(jx, expected, 0.001);
        });

        it('accounts for x offset', () => {
            const gene1 = makeGene({ position: 50 }); // no exons retained
            const jx = computeJunctionX(
                gene1,
                null,
                makeTranscript(makeExons([[1, 100, 200]]), '+'),
                undefined,
                100,
                400
            );

            assert.equal(jx, 300); // 100 + 400/2
        });

        it('exported constants have expected values', () => {
            assert.equal(PRODUCT_HEIGHT, 20);
            assert.equal(EXON_GAP, 2);
            assert.equal(DIAMOND_SIZE, 8);
        });
    });
});
