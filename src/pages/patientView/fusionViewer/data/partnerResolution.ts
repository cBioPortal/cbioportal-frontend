import { TranscriptData } from './types';

/** Slop window (bp) for treating a breakpoint as "inside" a transcript range. */
const POSITION_OVERLAP_SLOP = 10_000;

export type MismatchStatus =
    | 'consistent' // each symbol's transcripts overlap the position paired with it
    | 'swapped' // each symbol overlaps the OTHER side's position
    | 'inconsistent' // neither configuration overlaps cleanly
    | 'unknown'; // not enough data to decide (a transcript list is empty)

interface MismatchInput {
    gene1Position: number;
    gene2Position: number;
    gene1Transcripts: TranscriptData[];
    gene2Transcripts: TranscriptData[];
}

function anyOverlap(txs: TranscriptData[], pos: number): boolean {
    if (!txs.length || !pos) return false;
    return txs.some(
        t =>
            t.txStart - POSITION_OVERLAP_SLOP <= pos &&
            pos <= t.txEnd + POSITION_OVERLAP_SLOP
    );
}

/**
 * Compare each FusionEvent partner's loaded transcripts against the partner's
 * paired position. Used to detect "pattern B" rows where the curator's symbol
 * columns are inverted relative to the position columns.
 */
export function detectSymbolPositionMismatch(
    input: MismatchInput
): MismatchStatus {
    if (!input.gene1Transcripts.length || !input.gene2Transcripts.length) {
        return 'unknown';
    }

    const direct1 = anyOverlap(input.gene1Transcripts, input.gene1Position);
    const direct2 = anyOverlap(input.gene2Transcripts, input.gene2Position);
    if (direct1 && direct2) return 'consistent';

    const cross1 = anyOverlap(input.gene1Transcripts, input.gene2Position);
    const cross2 = anyOverlap(input.gene2Transcripts, input.gene1Position);
    if (cross1 && cross2) return 'swapped';

    return 'inconsistent';
}
