import { assert } from 'chai';
import {
    select5PrimeExons,
    select3PrimeExons,
    select5PrimeDomains,
    select3PrimeDomains,
    computeJunctionX,
    computeFusionExonLayout,
    retainedExonsInOrder,
    genomicToExonX,
    fivePrimeContributesNoCoding,
    breakpointToDomainAA,
    ghostStubRect,
    DOMAIN_TRUNCATION_THRESHOLD,
    PRODUCT_HEIGHT,
    EXON_GAP,
    JUNCTION_GAP,
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
                    result.map(d => d.domain.name),
                    ['RecepL_1', 'Furin']
                );
            });

            it('3p retains domains whose endGenomic >= breakpoint', () => {
                // EGFRvIII-like 3p breakpoint drops L1 and most of Furin
                const result = select3PrimeDomains(domains, 55223152, '+');
                assert.deepEqual(
                    result.map(d => d.domain.name),
                    ['RecepL_2', 'Pkinase']
                );
            });

            it('3p includes partial-overlap domain (end downstream)', () => {
                const result = select3PrimeDomains(domains, 55220000, '+');
                assert.deepEqual(
                    result.map(d => d.domain.name),
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
                    result.map(d => d.domain.name),
                    ['Pkinase', 'MAM']
                );
            });

            it('3p retains domains whose startGenomic <= breakpoint', () => {
                // Minus-strand 3p partner: retained region is downstream in
                // tx direction = lower coords.
                const result = select3PrimeDomains(minusDomains, 29446700, '-');
                assert.deepEqual(
                    result.map(d => d.domain.name),
                    ['KinaseC_terminal', 'Pkinase']
                );
            });
        });

        it('5p/3p symmetry matches exon selector rule', () => {
            // Same rule as exon selector: 5p(+) ≡ 3p(-), 5p(-) ≡ 3p(+).
            // Compare domain names since RetainedDomain differs by .side field.
            const f5p = select5PrimeDomains(domains, 55220000, '+');
            const f3m = select3PrimeDomains(domains, 55220000, '-');
            assert.deepEqual(
                f5p.map(d => d.domain.name),
                f3m.map(d => d.domain.name)
            );

            const f5m = select5PrimeDomains(domains, 55220000, '-');
            const f3p = select3PrimeDomains(domains, 55220000, '+');
            assert.deepEqual(
                f5m.map(d => d.domain.name),
                f3p.map(d => d.domain.name)
            );
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
            // totalExons = 4; all exons are 100 bp so each gets an equal
            // to-scale width.
            const availableWidth =
                width - JUNCTION_GAP - EXON_GAP * (4 - 1) - 20;
            const w = (100 / 400) * availableWidth; // 100bp of 400bp total
            const startX = x + 10;
            const after5p = startX + 2 * w + EXON_GAP * 2;
            const expected = after5p + JUNCTION_GAP / 2;

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
            assert.equal(JUNCTION_GAP, 8);
        });
    });

    // -------------------------------------------------------------------
    // computeFusionExonLayout — exons drawn to scale (∝ bp length)
    // -------------------------------------------------------------------
    describe('computeFusionExonLayout', () => {
        const ex = (start: number, end: number) => ({ number: 1, start, end });

        it('sizes exon widths proportional to genomic length', () => {
            // 5′: one 100bp exon; 3′: one 300bp exon → 3:1 width ratio.
            const layout = computeFusionExonLayout(
                [ex(0, 100)],
                [ex(0, 300)],
                0,
                500
            );
            assert.equal(layout.widths5p.length, 1);
            assert.equal(layout.widths3p.length, 1);
            assert.closeTo(
                layout.widths3p[0] / layout.widths5p[0],
                3,
                0.001,
                '300bp exon is 3× the width of the 100bp exon'
            );
        });

        it('applies a minimum width floor to very short exons', () => {
            // One huge exon and one 1bp exon — the tiny one clamps to the floor.
            const layout = computeFusionExonLayout(
                [ex(0, 100000)],
                [ex(0, 1)],
                0,
                500
            );
            assert.equal(layout.widths3p[0], 4); // MIN_EXON_W
        });

        it('junctionX sits after the 5′ block plus half the junction gap', () => {
            const layout = computeFusionExonLayout(
                [ex(0, 100)],
                [ex(0, 100)],
                0,
                500
            );
            const expected =
                layout.startX +
                layout.widths5p[0] +
                EXON_GAP * 1 +
                JUNCTION_GAP / 2;
            assert.closeTo(layout.junctionX, expected, 0.001);
        });
    });

    // -------------------------------------------------------------------
    // retainedExonsInOrder — transcription-order retained exons
    // -------------------------------------------------------------------
    describe('retainedExonsInOrder', () => {
        it('+ strand 5′: ascending order, keeps exons starting at/before bp', () => {
            const t = makeTranscript(
                makeExons([
                    [1, 100, 200],
                    [2, 300, 400],
                ]),
                '+'
            );
            const r = retainedExonsInOrder(t, 250, true);
            assert.deepEqual(
                r.map(e => e.number),
                [1]
            );
        });

        it('− strand 5′: descending order, keeps exons ending at/after bp', () => {
            const t = makeTranscript(
                makeExons([
                    [1, 100, 200],
                    [2, 300, 400],
                ]),
                '-'
            );
            const r = retainedExonsInOrder(t, 250, true);
            // − strand transcription order is high→low start; exon 2 (end 400)
            // is the retained 5′ exon and comes first.
            assert.deepEqual(
                r.map(e => e.number),
                [2]
            );
        });
    });

    // -------------------------------------------------------------------
    // genomicToExonX — map a genomic coord onto the exon blocks
    // -------------------------------------------------------------------
    describe('genomicToExonX', () => {
        const exonsPlus = makeExons([
            [1, 0, 100],
            [2, 200, 300],
        ]);
        const xs = [10, 120];
        const widths = [100, 100];

        it('+ strand: exon start → block left edge, end → right edge', () => {
            assert.equal(genomicToExonX(0, exonsPlus, xs, widths, '+'), 10);
            assert.equal(genomicToExonX(100, exonsPlus, xs, widths, '+'), 110);
            assert.equal(genomicToExonX(50, exonsPlus, xs, widths, '+'), 60);
            assert.equal(genomicToExonX(200, exonsPlus, xs, widths, '+'), 120);
            assert.equal(genomicToExonX(300, exonsPlus, xs, widths, '+'), 220);
        });

        it('+ strand: intron clamps to the preceding block right edge', () => {
            assert.equal(genomicToExonX(150, exonsPlus, xs, widths, '+'), 110);
        });

        it('+ strand: outside the retained set clamps to nearest edge', () => {
            assert.equal(genomicToExonX(-50, exonsPlus, xs, widths, '+'), 10);
            assert.equal(genomicToExonX(999, exonsPlus, xs, widths, '+'), 220);
        });

        it('− strand: higher genomic coord maps further left', () => {
            // Transcription order (descending start): exon[300-end] then exon[0-100]
            const exonsMinus = makeExons([
                [1, 200, 300],
                [2, 0, 100],
            ]);
            // 5′ end (highest coord, 300) → leftmost edge.
            assert.equal(genomicToExonX(300, exonsMinus, xs, widths, '-'), 10);
            assert.equal(genomicToExonX(200, exonsMinus, xs, widths, '-'), 110);
            // 3′ end (lowest coord, 0) → rightmost edge.
            assert.equal(genomicToExonX(0, exonsMinus, xs, widths, '-'), 220);
        });
    });

    // -------------------------------------------------------------------
    // fivePrimeContributesNoCoding — promoter-swap detection
    // -------------------------------------------------------------------
    describe('fivePrimeContributesNoCoding', () => {
        const withUtr = (
            strand: '+' | '-',
            utr: { start: number; end: number }
        ): TranscriptData => ({
            ...makeTranscript(makeExons([[1, 100, 400]]), strand),
            utrs: [{ ...utr, type: 'five_prime' }],
        });

        it('+ strand: true when breakpoint is within/upstream of the 5′UTR', () => {
            const t = withUtr('+', { start: 100, end: 200 }); // CDS starts >200
            assert.isTrue(fivePrimeContributesNoCoding(t, 150));
            assert.isTrue(fivePrimeContributesNoCoding(t, 200));
        });

        it('+ strand: false when breakpoint is past the 5′UTR (into CDS)', () => {
            const t = withUtr('+', { start: 100, end: 200 });
            assert.isFalse(fivePrimeContributesNoCoding(t, 250));
        });

        it('− strand: true when breakpoint is within/upstream of the 5′UTR', () => {
            const t = withUtr('-', { start: 300, end: 400 }); // CDS starts <300
            assert.isTrue(fivePrimeContributesNoCoding(t, 350));
            assert.isTrue(fivePrimeContributesNoCoding(t, 300));
        });

        it('− strand: false when breakpoint is past the 5′UTR (into CDS)', () => {
            const t = withUtr('-', { start: 300, end: 400 });
            assert.isFalse(fivePrimeContributesNoCoding(t, 250));
        });

        it('returns false when no 5′UTR annotation is present', () => {
            const t = makeTranscript(makeExons([[1, 100, 400]]), '+');
            assert.isFalse(fivePrimeContributesNoCoding(t, 150));
        });
    });

    // -------------------------------------------------------------------
    // breakpointToDomainAA — genomic-to-AA interpolation within a domain
    // -------------------------------------------------------------------
    describe('breakpointToDomainAA', () => {
        // Domain: genomic 1000-2000, AA 10-110 (100 AA span, 1000 bp span).
        const domain = makeDomain('Test', 1000, 2000, 10, 110);

        it('+ strand: breakpoint at domain start -> startAA', () => {
            assert.closeTo(breakpointToDomainAA(domain, 1000, '+'), 10, 0.01);
        });

        it('+ strand: breakpoint at domain end -> endAA', () => {
            assert.closeTo(breakpointToDomainAA(domain, 2000, '+'), 110, 0.01);
        });

        it('+ strand: breakpoint at midpoint -> mid-AA', () => {
            // Mid genomic = 1500, expected AA = 10 + 0.5 * 100 = 60
            assert.closeTo(breakpointToDomainAA(domain, 1500, '+'), 60, 0.01);
        });

        it('+ strand: breakpoint at 25% -> 25% AA', () => {
            // 1250 genomic -> 10 + 0.25 * 100 = 35 AA
            assert.closeTo(breakpointToDomainAA(domain, 1250, '+'), 35, 0.01);
        });

        it('- strand: breakpoint at domain start (low coord) -> endAA', () => {
            // On minus strand, low genomic = 3' end of protein -> endAA
            assert.closeTo(breakpointToDomainAA(domain, 1000, '-'), 110, 0.01);
        });

        it('- strand: breakpoint at domain end (high coord) -> startAA', () => {
            assert.closeTo(breakpointToDomainAA(domain, 2000, '-'), 10, 0.01);
        });

        it('- strand: breakpoint at midpoint -> mid-AA (same as + strand midpoint)', () => {
            // 1 - 0.5 frac on - strand = 0.5 -> same mid AA = 60
            assert.closeTo(breakpointToDomainAA(domain, 1500, '-'), 60, 0.01);
        });

        it('degenerate: gSpan == 0 returns startAA', () => {
            const pointDomain = makeDomain('Point', 500, 500, 42, 42);
            assert.equal(breakpointToDomainAA(pointDomain, 500, '+'), 42);
        });
    });

    // -------------------------------------------------------------------
    // select5PrimeDomains / select3PrimeDomains — RetainedDomain output
    // -------------------------------------------------------------------
    describe('select5PrimeDomains / select3PrimeDomains — truncation output', () => {
        // Domain: genomic 1000-3000 (2000 bp), AA 1-200.
        // Breakpoint at 2000 (midpoint) -> half retained on 5p, half on 3p.
        const domain = makeDomain('Kinase', 1000, 3000, 1, 200);

        describe('fully retained domains', () => {
            it('5p +strand: domain entirely before breakpoint is fully retained', () => {
                // Domain ends at 3000, breakpoint at 3001 -> no straddle
                const [rd] = select5PrimeDomains([domain], 3001, '+');
                assert.isFalse(rd.isTruncated);
                assert.equal(rd.retainedFraction, 1);
                assert.equal(rd.retainedStartAA, 1);
                assert.equal(rd.retainedEndAA, 200);
            });

            it('3p +strand: domain entirely after breakpoint is fully retained', () => {
                // Domain starts at 1000, breakpoint at 999 -> no straddle
                const [rd] = select3PrimeDomains([domain], 999, '+');
                assert.isFalse(rd.isTruncated);
                assert.equal(rd.retainedFraction, 1);
            });
        });

        describe('straddling domain — + strand', () => {
            it('5p side: retains the left half, loses right half', () => {
                // Breakpoint at midpoint (2000): retains AA 1..100, loses 100..200
                const [rd] = select5PrimeDomains([domain], 2000, '+');
                assert.isTrue(rd.isTruncated);
                assert.equal(rd.retainedStartAA, 1);
                assert.closeTo(rd.retainedEndAA, 100, 0.5);
                assert.closeTo(rd.retainedFraction, 0.5, 0.01);
                assert.equal(rd.lostStartAA, rd.retainedEndAA);
                assert.equal(rd.lostEndAA, 200);
            });

            it('3p side: retains the right half, loses left half', () => {
                // Breakpoint at midpoint (2000): retains AA 100..200
                const [rd] = select3PrimeDomains([domain], 2000, '+');
                assert.isTrue(rd.isTruncated);
                assert.closeTo(rd.retainedStartAA, 100, 0.5);
                assert.equal(rd.retainedEndAA, 200);
                assert.closeTo(rd.retainedFraction, 0.5, 0.01);
            });

            it('5p side: exact AA values for 25% breakpoint', () => {
                // Breakpoint at 1500 (25% into domain): retains 25% of AA
                // AA retained end = 1 + 0.25 * 199 = ~50.75
                const [rd] = select5PrimeDomains([domain], 1500, '+');
                assert.isTrue(rd.isTruncated);
                assert.closeTo(rd.retainedFraction, 0.25, 0.01);
            });
        });

        describe('straddling domain — - strand', () => {
            it('5p - strand retains same fraction as + strand for mirror breakpoint', () => {
                // On - strand, 5p retains high-coord side.
                // Domain 1000-3000, breakpoint at 2000 (mid).
                // frac = 1 - 0.5 = 0.5 -> bpAA = 1 + 0.5*199 = 100.5
                // 5p retains [bpAA=~100, endAA=200] -> ~100/200 = 0.5
                const [rd] = select5PrimeDomains([domain], 2000, '-');
                assert.isTrue(rd.isTruncated);
                assert.closeTo(rd.retainedFraction, 0.5, 0.02);
            });

            it('3p - strand retains same fraction as + strand for mirror breakpoint', () => {
                const [rd] = select3PrimeDomains([domain], 2000, '-');
                assert.isTrue(rd.isTruncated);
                assert.closeTo(rd.retainedFraction, 0.5, 0.02);
            });
        });

        describe('DOMAIN_TRUNCATION_THRESHOLD', () => {
            it('domain retaining >= 90% is not truncated (isTruncated=false)', () => {
                // Breakpoint at 2820 = 91% into domain (genomic fraction)
                // retained fraction ~ 0.91 >= threshold
                const bp = 1000 + Math.round(0.91 * 2000); // 2820
                const [rd] = select5PrimeDomains([domain], bp, '+');
                assert.isFalse(rd.isTruncated);
                assert.isAtLeast(
                    rd.retainedFraction,
                    DOMAIN_TRUNCATION_THRESHOLD
                );
            });

            it('domain retaining < 90% is truncated (isTruncated=true)', () => {
                // Breakpoint at 2600 = 80% into domain
                const bp = 1000 + Math.round(0.8 * 2000); // 2600
                const [rd] = select5PrimeDomains([domain], bp, '+');
                assert.isTrue(rd.isTruncated);
                assert.isBelow(
                    rd.retainedFraction,
                    DOMAIN_TRUNCATION_THRESHOLD
                );
            });
        });

        describe('domains fully outside retained set are excluded', () => {
            it('5p: domain starting after breakpoint is excluded', () => {
                // On + strand 5p filter: startGenomic <= breakpoint
                // domain starts at 1000, breakpoint at 999 -> excluded
                const result = select5PrimeDomains([domain], 999, '+');
                assert.equal(result.length, 0);
            });

            it('3p: domain ending before breakpoint is excluded', () => {
                // On + strand 3p filter: endGenomic >= breakpoint
                // domain ends at 3000, breakpoint at 3001 -> excluded
                const result = select3PrimeDomains([domain], 3001, '+');
                assert.equal(result.length, 0);
            });
        });

        describe('breakpoint exactly on domain boundary', () => {
            it('5p: breakpoint == endGenomic -> not straddling, full domain retained', () => {
                const [rd] = select5PrimeDomains([domain], 3000, '+');
                // startGenomic(1000) <= 3000 AND NOT (3000 < endGenomic(3000))
                assert.isFalse(rd.isTruncated);
                assert.equal(rd.retainedFraction, 1);
            });

            it('3p: breakpoint == startGenomic -> not straddling, full domain retained', () => {
                const [rd] = select3PrimeDomains([domain], 1000, '+');
                // endGenomic(3000) >= 1000 AND NOT (1000 < endGenomic... wait, straddle check:
                // straddlesFwd = startGenomic(1000) < bp(1000) = false -> not straddling
                assert.isFalse(rd.isTruncated);
                assert.equal(rd.retainedFraction, 1);
            });
        });
    });

    describe('ghostStubRect', () => {
        // Domain footprint spans x ∈ [100, 200]; the far edge (200 for 5′,
        // 100 for 3′) sits at the fusion junction.
        it('5′ ghost fits between the solid and the junction in the normal case', () => {
            // 60% retained: solid 100..160, ghost should fill 160..200.
            const { ghostX, ghostWidth } = ghostStubRect(
                '5p',
                100,
                60,
                40,
                100,
                200
            );
            assert.equal(ghostX, 160);
            assert.equal(ghostWidth, 40);
            assert.isAtMost(ghostX + ghostWidth, 200); // never past the junction
        });

        it('5′ ghost is capped at the junction when the MIN_DOMAIN_W floor inflates the solid (low retention)', () => {
            // Very low retention: solid floored to 4px at x=100, lost wants the
            // full ~100px footprint. Uncapped, ghost would reach 204 (past 200).
            const { ghostX, ghostWidth } = ghostStubRect(
                '5p',
                100,
                4,
                100,
                100,
                200
            );
            assert.equal(ghostX, 104);
            assert.equal(ghostWidth, 96); // capped to domainRight - ghostX
            assert.isAtMost(ghostX + ghostWidth, 200);
        });

        it('3′ ghost fills left to the solid edge, never crossing the domain left edge', () => {
            // Solid retained on the right at x=160 (width 40 → 160..200); ghost
            // fills 100..160. Oversized lostSvgWidth must clamp to 60.
            const { ghostX, ghostWidth } = ghostStubRect(
                '3p',
                160,
                40,
                999,
                100,
                200
            );
            assert.equal(ghostX, 100);
            assert.equal(ghostWidth, 60);
            assert.isAtLeast(ghostX, 100); // never past the domain left edge
        });

        it('caps the ghost to 0 (suppressible) when no room remains', () => {
            // Solid floor already reaches the junction → no space for a ghost.
            const { ghostWidth } = ghostStubRect('5p', 100, 100, 50, 100, 200);
            assert.equal(ghostWidth, 0);
        });
    });
});
