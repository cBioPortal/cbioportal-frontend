import { assert } from 'chai';
import { TranscriptData } from './types';
import { detectSymbolPositionMismatch } from './partnerResolution';

/** Build a minimal TranscriptData covering [start, end] on the given chromosome. */
function makeTx(
    gene: string,
    txStart: number,
    txEnd: number,
    strand: '+' | '-' = '+'
): TranscriptData {
    return {
        transcriptId: `ENST_${gene}_${txStart}`,
        displayName: `${gene}-201`,
        gene,
        biotype: 'protein_coding',
        exons: [],
        strand,
        txStart,
        txEnd,
        isForteSelected: false,
        domains: [],
    };
}

describe('detectSymbolPositionMismatch', () => {
    // TMPRSS2 GRCh37: chr21:42,836,478-42,903,043, minus strand
    // ERG GRCh37:     chr21:39,751,949-40,033,704, minus strand
    const tmprss2Txs = [makeTx('TMPRSS2', 42836478, 42903043, '-')];
    const ergTxs = [makeTx('ERG', 39751949, 40033704, '-')];

    it('returns "consistent" when both symbols overlap their paired positions', () => {
        // Pattern A: site1=ERG@39.8M (in ERG range), site2=TMPRSS2@42.8M (in TMPRSS2 range)
        const result = detectSymbolPositionMismatch({
            gene1Position: 39860000,
            gene2Position: 42880000,
            gene1Transcripts: ergTxs,
            gene2Transcripts: tmprss2Txs,
        });
        assert.equal(result, 'consistent');
    });

    it('returns "swapped" when each symbol overlaps the OTHER position', () => {
        // Pattern B: site1=TMPRSS2 (symbol) but position 39.8M is in ERG range
        //            site2=ERG (symbol) but position 42.8M is in TMPRSS2 range
        const result = detectSymbolPositionMismatch({
            gene1Position: 39860000,
            gene2Position: 42880000,
            gene1Transcripts: tmprss2Txs, // gene1.symbol was "TMPRSS2"
            gene2Transcripts: ergTxs, // gene2.symbol was "ERG"
        });
        assert.equal(result, 'swapped');
    });

    it('returns "inconsistent" when neither overlap matches', () => {
        // e.g. one position is on an entirely different chromosome
        const result = detectSymbolPositionMismatch({
            gene1Position: 100, // not in any tx range
            gene2Position: 200,
            gene1Transcripts: tmprss2Txs,
            gene2Transcripts: ergTxs,
        });
        assert.equal(result, 'inconsistent');
    });

    it('returns "unknown" when one or both transcript lists are empty', () => {
        const result = detectSymbolPositionMismatch({
            gene1Position: 39860000,
            gene2Position: 42880000,
            gene1Transcripts: [],
            gene2Transcripts: tmprss2Txs,
        });
        assert.equal(result, 'unknown');
    });

    it('treats positions within 10kb of a transcript end as overlapping', () => {
        // Breakpoints can fall just outside the canonical tx range
        const result = detectSymbolPositionMismatch({
            gene1Position: 42836000, // 478 bp before tx start, within slop
            gene2Position: 39800000,
            gene1Transcripts: tmprss2Txs,
            gene2Transcripts: ergTxs,
        });
        assert.equal(result, 'consistent');
    });
});

import { resolveFivePrimeBy } from './partnerResolution';

describe('resolveFivePrimeBy', () => {
    // Empirically derived from msk_impact_50k_2026; "low" = the partner at the
    // lower genomic coordinate after position-sort, "high" = higher coord.
    // Result: which position holds the canonical 5' partner.

    it('TMPRSS2-ERG style: (-, -, 3to5) -> high is 5p', () => {
        // Both minus strand, deletion-style. Canonical: TMPRSS2 (higher coord) is 5p.
        assert.equal(resolveFivePrimeBy('-', '-', '3to5'), 'high');
    });

    it('EML4-ALK style: (+, -, 3to3) -> low is 5p', () => {
        // Mixed strands, inversion. Canonical: EML4 (lower coord, +) is 5p.
        assert.equal(resolveFivePrimeBy('+', '-', '3to3'), 'low');
    });

    it('ALK-EML4 row (positions swapped): (-, +, 3to3) -> high is 5p', () => {
        // Same biology, opposite position order. Canonical 5p still EML4 (now high).
        assert.equal(resolveFivePrimeBy('-', '+', '3to3'), 'high');
    });

    it('KIF5B-RET style: (+, +, 5to5) -> low is 5p', () => {
        // Both plus, head-to-head inversion. Canonical: KIF5B (lower) is 5p.
        assert.equal(resolveFivePrimeBy('+', '+', '5to5'), 'low');
    });

    it('CCDC6-RET style: (+, -, 5to5) -> high is 5p', () => {
        assert.equal(resolveFivePrimeBy('+', '-', '5to5'), 'high');
    });

    it('NCOA4-RET style: (-, +, 5to3) -> low is 5p', () => {
        assert.equal(resolveFivePrimeBy('-', '+', '5to3'), 'low');
    });

    it('returns null for unknown / ambiguous combinations', () => {
        assert.isNull(resolveFivePrimeBy('+' as any, '+' as any, '' as any));
        assert.isNull(resolveFivePrimeBy('-', '-', 'unknown'));
        // (+, +, 3to3) has too small a sample to commit to a rule
        assert.isNull(resolveFivePrimeBy('+', '+', '3to3'));
    });

    it('covers all 11 unambiguous combinations found in the 50k study', () => {
        // Source of truth: empirical lookup table, comments document the
        // example fusion pair that established each row.
        const cases: Array<['+' | '-', '+' | '-', string, 'low' | 'high']> = [
            ['+', '+', '3to5', 'low'], // 2 rows
            ['+', '+', '5to5', 'low'], // KIF5B-RET, 84 rows
            ['+', '-', '3to3', 'low'], // EML4-ALK, 98 rows
            ['+', '-', '5to3', 'high'], // 5 rows
            ['+', '-', '5to5', 'high'], // RET-CCDC6, 26 rows
            ['-', '+', '3to3', 'high'], // ALK-EML4, 122 rows
            ['-', '+', '3to5', 'high'], // 5 rows
            ['-', '+', '5to3', 'low'], // NCOA4-RET, 27 rows
            ['-', '+', '5to5', 'low'], // 24 rows
            ['-', '-', '3to5', 'high'], // TMPRSS2-ERG, 412 rows
            ['-', '-', '5to3', 'low'], // 17 rows
        ];
        for (const [lo, hi, conn, expected] of cases) {
            assert.equal(
                resolveFivePrimeBy(lo, hi, conn),
                expected,
                `(${lo}, ${hi}, ${conn})`
            );
        }
    });
});
