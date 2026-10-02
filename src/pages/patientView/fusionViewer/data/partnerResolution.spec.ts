import { assert } from 'chai';
import { FusionEvent, GenePartner, TranscriptData } from './types';
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
        isCallerSelected: false,
        isCanonical: false,
        domains: [],
        utrs: [],
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

import { resolveFivePrimeBy, resolveFusionPartners } from './partnerResolution';

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

function makeGene(
    symbol: string,
    chromosome: string,
    position: number,
    transcriptId: string
): GenePartner {
    return {
        symbol,
        chromosome,
        position,
        selectedTranscriptId: transcriptId,
        siteDescription: '',
    };
}

function makeFusion(overrides: Partial<FusionEvent>): FusionEvent {
    return {
        id: 'f1',
        tumorId: 's1',
        gene1: makeGene('GENE_A', '1', 1000, 'ENST_A'),
        gene2: makeGene('GENE_B', '2', 2000, 'ENST_B'),
        fusion: 'GENE_A::GENE_B',
        totalReadSupport: 10,
        callMethod: 'SV',
        frameCallMethod: 'In_frame',
        annotation: '',
        position: '',
        significance: 'NA',
        note: '',
        connectionType: '3to5',
        svIdiom: 'INTERGENIC_FUSION',
        frame: 'IN_FRAME',
        isRnaDerived: false,
        ...overrides,
    };
}

describe('resolveFusionPartners', () => {
    // TMPRSS2 chr21:42.8M-, ERG chr21:39.7M-
    const tmprss2 = makeTx('TMPRSS2', 42836478, 42903043, '-');
    const erg = makeTx('ERG', 39751949, 40033704, '-');

    it('TMPRSS2-ERG pattern A: site1=ERG, site2=TMPRSS2, conn=3to5', () => {
        // gene1.symbol="ERG" at position in ERG range; gene2.symbol="TMPRSS2"
        // at position in TMPRSS2 range. Canonical 5p = TMPRSS2 (higher coord).
        const fusion = makeFusion({
            gene1: makeGene('ERG', '21', 39860000, 'ENST_ERG'),
            gene2: makeGene('TMPRSS2', '21', 42880000, 'ENST_TMPRSS2'),
            connectionType: '3to5',
        });
        const result = resolveFusionPartners({
            fusion,
            gene1Transcripts: [erg],
            gene2Transcripts: [tmprss2],
        });
        assert.equal(result.fivePrime.symbol, 'TMPRSS2');
        assert.equal(result.fivePrime.position, 42880000);
        assert.equal(result.threePrime!.symbol, 'ERG');
        assert.equal(result.threePrime!.position, 39860000);
        assert.equal(result.swapped, true);
        assert.equal(result.mismatchStatus, 'consistent');
        // Which transcript array drives each role
        assert.deepEqual(result.fivePrimeTranscripts, [tmprss2]);
        assert.deepEqual(result.threePrimeTranscripts, [erg]);
    });

    it('TMPRSS2-ERG pattern B: gene1.symbol="TMPRSS2" but position is in ERG range', () => {
        // The curator wrote "TMPRSS2" at site1 but site1Position=39.8M is in ERG.
        // After Genome Nexus fetch returns TMPRSS2 transcripts at chr21:42.8M,
        // the resolver detects the mismatch, swaps the symbol/position pairing,
        // then applies the rule.
        const fusion = makeFusion({
            gene1: makeGene('TMPRSS2', '21', 39860000, 'ENST_TMPRSS2'),
            gene2: makeGene('ERG', '21', 42880000, 'ENST_ERG'),
            connectionType: '3to5',
        });
        const result = resolveFusionPartners({
            fusion,
            gene1Transcripts: [tmprss2], // fetched for gene1.symbol="TMPRSS2"
            gene2Transcripts: [erg],
        });
        // Canonical 5p is TMPRSS2: its true position is 42880000 (the value
        // that overlapped its transcripts), with TMPRSS2 transcripts.
        assert.equal(result.fivePrime.symbol, 'TMPRSS2');
        assert.equal(result.fivePrime.position, 42880000);
        assert.equal(result.threePrime!.symbol, 'ERG');
        assert.equal(result.threePrime!.position, 39860000);
        assert.equal(result.mismatchStatus, 'swapped');
        assert.equal(result.swapped, true);
        assert.deepEqual(result.fivePrimeTranscripts, [tmprss2]);
        assert.deepEqual(result.threePrimeTranscripts, [erg]);
    });

    it('EML4-ALK inversion: (+, -, 3to3) selects low position as 5p', () => {
        // EML4 chr2:42M (+), ALK chr2:29M (-). Canonical 5p=EML4. But after
        // position-sort, ALK is "low" (29M) and EML4 is "high" (42M). Rule
        // for (-, +, 3to3) is "high is 5p". So canonical 5p=EML4 (high). ✓
        const eml4 = makeTx('EML4', 42396490, 42559688, '+');
        const alk = makeTx('ALK', 29415640, 30144477, '-');
        const fusion = makeFusion({
            gene1: makeGene('ALK', '2', 29447000, 'ENST_ALK'),
            gene2: makeGene('EML4', '2', 42493000, 'ENST_EML4'),
            connectionType: '3to3',
        });
        const result = resolveFusionPartners({
            fusion,
            gene1Transcripts: [alk],
            gene2Transcripts: [eml4],
        });
        assert.equal(result.fivePrime.symbol, 'EML4');
        assert.equal(result.threePrime!.symbol, 'ALK');
        assert.equal(result.swapped, true);
    });

    it('KIF5B-RET inversion: (+, +, 5to5) selects low position as 5p (no swap)', () => {
        // KIF5B chr10:32M (+), RET chr10:43M (+). Canonical 5p=KIF5B (low).
        const kif5b = makeTx('KIF5B', 32289061, 32412393, '+');
        const ret = makeTx('RET', 43572517, 43625797, '+');
        const fusion = makeFusion({
            gene1: makeGene('KIF5B', '10', 32312000, 'ENST_KIF5B'),
            gene2: makeGene('RET', '10', 43611000, 'ENST_RET'),
            connectionType: '5to5',
        });
        const result = resolveFusionPartners({
            fusion,
            gene1Transcripts: [kif5b],
            gene2Transcripts: [ret],
        });
        assert.equal(result.fivePrime.symbol, 'KIF5B');
        assert.equal(result.threePrime!.symbol, 'RET');
        assert.equal(result.swapped, false);
    });

    it('falls back to site1=5p when transcripts have not loaded yet', () => {
        const fusion = makeFusion({});
        const result = resolveFusionPartners({
            fusion,
            gene1Transcripts: [],
            gene2Transcripts: [],
        });
        assert.equal(result.fivePrime.symbol, 'GENE_A');
        assert.equal(result.threePrime!.symbol, 'GENE_B');
        assert.equal(result.swapped, false);
        assert.equal(result.mismatchStatus, 'unknown');
    });

    it('falls back to site1=5p when connectionType is missing', () => {
        const tmprss2Tx = makeTx('TMPRSS2', 42836478, 42903043, '-');
        const ergTx = makeTx('ERG', 39751949, 40033704, '-');
        const fusion = makeFusion({
            gene1: makeGene('ERG', '21', 39860000, 'ENST_ERG'),
            gene2: makeGene('TMPRSS2', '21', 42880000, 'ENST_TMPRSS2'),
            connectionType: '',
        });
        const result = resolveFusionPartners({
            fusion,
            gene1Transcripts: [ergTx],
            gene2Transcripts: [tmprss2Tx],
        });
        assert.equal(result.fivePrime.symbol, 'ERG');
        assert.equal(result.threePrime!.symbol, 'TMPRSS2');
        assert.equal(result.swapped, false);
    });

    it('handles intergenic (gene2 null) — returns site1 unchanged', () => {
        const fusion = makeFusion({ gene2: null });
        const result = resolveFusionPartners({
            fusion,
            gene1Transcripts: [],
            gene2Transcripts: [],
        });
        assert.equal(result.fivePrime.symbol, 'GENE_A');
        assert.isNull(result.threePrime);
        assert.equal(result.swapped, false);
    });
});
