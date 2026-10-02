import { FusionEvent, GenePartner, TranscriptData } from './types';

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

export interface ResolvedFusion {
    fivePrime: GenePartner;
    threePrime: GenePartner | null;
    /** Transcripts for the 5' role (either gene1Transcripts or gene2Transcripts). */
    fivePrimeTranscripts: TranscriptData[];
    /** Transcripts for the 3' role (the other set). Empty when threePrime is null. */
    threePrimeTranscripts: TranscriptData[];
    /** True when gene1 and gene2 had to be swapped to produce the canonical order. */
    swapped: boolean;
    /** Outcome of the symbol/position sanity check. */
    mismatchStatus: MismatchStatus;
}

interface ResolveInput {
    fusion: FusionEvent;
    gene1Transcripts: TranscriptData[];
    gene2Transcripts: TranscriptData[];
}

/** Return the strand of the first transcript in the list, or null. */
function strandOf(txs: TranscriptData[]): '+' | '-' | null {
    return txs.length > 0 ? txs[0].strand : null;
}

/**
 * Resolve the canonical 5' and 3' fusion partners given a FusionEvent and the
 * Genome Nexus transcripts already fetched for each side.
 *
 * Algorithm:
 *  1. Detect symbol/position mismatch ("pattern B"). When detected, treat each
 *     symbol as paired with the OTHER side's position (and chromosome).
 *  2. Sort the two partners by position.
 *  3. Look up (lowStrand, highStrand, connectionType) in the empirical rule
 *     table. Choose which sorted side is the 5' partner.
 *  4. If anything is missing — empty transcripts, unknown connectionType,
 *     intergenic fusion — fall back to the input gene1/gene2 unchanged.
 */
export function resolveFusionPartners(input: ResolveInput): ResolvedFusion {
    const { fusion, gene1Transcripts, gene2Transcripts } = input;
    const fallback: ResolvedFusion = {
        fivePrime: fusion.gene1,
        threePrime: fusion.gene2,
        fivePrimeTranscripts: gene1Transcripts,
        threePrimeTranscripts: gene2Transcripts,
        swapped: false,
        mismatchStatus: 'unknown',
    };

    if (!fusion.gene2) {
        return fallback;
    }

    const mismatchStatus = detectSymbolPositionMismatch({
        gene1Position: fusion.gene1.position,
        gene2Position: fusion.gene2.position,
        gene1Transcripts,
        gene2Transcripts,
    });

    // Build "normalized" partners: each one carries the symbol/transcripts of
    // the gene curated for that side, but the position/chromosome of wherever
    // that gene's transcripts actually overlap.
    let leftPartner: GenePartner;
    let rightPartner: GenePartner;
    let leftTxs: TranscriptData[];
    let rightTxs: TranscriptData[];
    if (mismatchStatus === 'swapped') {
        // gene1's symbol belongs with gene2's position; gene2's symbol with gene1's position
        leftPartner = {
            ...fusion.gene1,
            position: fusion.gene2.position,
            chromosome: fusion.gene2.chromosome,
        };
        rightPartner = {
            ...fusion.gene2,
            position: fusion.gene1.position,
            chromosome: fusion.gene1.chromosome,
        };
        leftTxs = gene1Transcripts;
        rightTxs = gene2Transcripts;
    } else {
        leftPartner = fusion.gene1;
        rightPartner = fusion.gene2;
        leftTxs = gene1Transcripts;
        rightTxs = gene2Transcripts;
    }

    // Position-sort
    const leftIsLow = leftPartner.position <= rightPartner.position;
    const low = leftIsLow ? leftPartner : rightPartner;
    const high = leftIsLow ? rightPartner : leftPartner;
    const lowTxs = leftIsLow ? leftTxs : rightTxs;
    const highTxs = leftIsLow ? rightTxs : leftTxs;

    const lowStrand = strandOf(lowTxs);
    const highStrand = strandOf(highTxs);
    if (!lowStrand || !highStrand) {
        return { ...fallback, mismatchStatus };
    }

    const which = resolveFivePrimeBy(
        lowStrand,
        highStrand,
        fusion.connectionType
    );
    if (which === null) {
        return { ...fallback, mismatchStatus };
    }

    const fivePrime = which === 'low' ? low : high;
    const threePrime = which === 'low' ? high : low;
    const fivePrimeTranscripts = which === 'low' ? lowTxs : highTxs;
    const threePrimeTranscripts = which === 'low' ? highTxs : lowTxs;

    // swapped means: the canonical 5p is NOT the original fusion.gene1
    const swapped =
        fivePrime.symbol !== fusion.gene1.symbol ||
        fivePrime.position !== fusion.gene1.position;

    return {
        fivePrime,
        threePrime,
        fivePrimeTranscripts,
        threePrimeTranscripts,
        swapped,
        mismatchStatus,
    };
}
