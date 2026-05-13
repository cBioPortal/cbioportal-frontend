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

/**
 * Empirical lookup table keyed by `${lowStrand}|${highStrand}|${connectionType}`.
 * Value names which position holds the canonical 5' fusion partner.
 *
 * Derived from msk_impact_50k_2026 by cross-referencing connectionType +
 * known gene strands against the canonical fusion name in eventInfo for
 * 1,800+ rows across TMPRSS2-ERG, EML4-ALK, KIF5B-RET, CCDC6-RET,
 * NCOA4-RET, and others. Sample sizes for each row are in the test.
 *
 * Combinations omitted from this table are intentionally returned as null
 * (unknown) because the data was too sparse or genuinely ambiguous to
 * commit to a rule. The caller is expected to fall back to "trust site1
 * as 5p" in those cases.
 */
const FIVE_PRIME_RULES: ReadonlyMap<string, 'low' | 'high'> = new Map([
    ['+|+|3to5', 'low'],
    ['+|+|5to5', 'low'],
    ['+|-|3to3', 'low'],
    ['+|-|5to3', 'high'],
    ['+|-|5to5', 'high'],
    ['-|+|3to3', 'high'],
    ['-|+|3to5', 'high'],
    ['-|+|5to3', 'low'],
    ['-|+|5to5', 'low'],
    ['-|-|3to5', 'high'],
    ['-|-|5to3', 'low'],
]);

/**
 * Decide which position (low or high, after position-sort) holds the canonical
 * 5' fusion partner, given the strand of each gene and the connectionType.
 *
 * Returns null when the combination is not in the empirical rule set — the
 * caller should preserve the existing site1=5p ordering in that case.
 */
export function resolveFivePrimeBy(
    lowStrand: '+' | '-',
    highStrand: '+' | '-',
    connectionType: string
): 'low' | 'high' | null {
    if (
        (lowStrand !== '+' && lowStrand !== '-') ||
        (highStrand !== '+' && highStrand !== '-') ||
        !connectionType
    ) {
        return null;
    }
    const key = `${lowStrand}|${highStrand}|${connectionType}`;
    return FIVE_PRIME_RULES.get(key) ?? null;
}
