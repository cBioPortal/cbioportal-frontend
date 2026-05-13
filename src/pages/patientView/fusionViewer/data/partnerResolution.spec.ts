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
