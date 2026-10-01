import { FusionEvent, FrameStatus, TranscriptData } from './types';
import { classifyFrame, buildPairKey } from './cohortAggregation';
import { resolveFusionPartners } from './partnerResolution';

export type AnchorSide = '5p' | '3p';

/** What the user (or auto/seed logic) picked. `'auto'` side is resolved later. */
export type ComparisonAnchor =
    | { mode: 'pair'; key: string }
    | { mode: 'gene'; gene: string; side: AnchorSide | 'auto' };

/** The anchor the views render: a gene anchor's side is always concrete. */
export type EffectiveAnchor =
    | { mode: 'pair'; key: string }
    | { mode: 'gene'; gene: string; side: AnchorSide };

export const NO_PARTNER = '(no partner)';
export const INTRAGENIC = '(intragenic)';

export interface ComparisonRow {
    event: FusionEvent;
    sampleId: string;
    fivePrimeSymbol: string;
    threePrimeSymbol: string | null;
    anchorBreakpoint: number;
    /** Genomic position of the 3′ partner breakpoint (null when no partner). */
    partnerBreakpoint: number | null;
    frame: FrameStatus;
}

export function buildComparisonRows(
    events: FusionEvent[],
    anchor: ComparisonAnchor
): ComparisonRow[] {
    const matches = (e: FusionEvent): boolean => {
        if (anchor.mode === 'pair') {
            return (
                buildPairKey(
                    e.gene1.symbol,
                    e.gene2 ? e.gene2.symbol : null
                ) === anchor.key
            );
        }
        return (
            e.gene1.symbol === anchor.gene ||
            (!!e.gene2 && e.gene2.symbol === anchor.gene)
        );
    };

    return events.filter(matches).map(e => ({
        event: e,
        sampleId: e.tumorId,
        fivePrimeSymbol: e.gene1.symbol,
        threePrimeSymbol: e.gene2 ? e.gene2.symbol : null,
        anchorBreakpoint: e.gene1.position,
        partnerBreakpoint: e.gene2 ? e.gene2.position : null,
        frame: classifyFrame(e.frameCallMethod),
    }));
}

/**
 * Re-derive each row's 5′/3′ assignment using the strand + connectionType
 * resolver (`resolveFusionPartners`) — the same canonical logic the
 * single-sample patient diagram uses. `buildComparisonRows` naively trusts the
 * curated site1=5′ ordering; this corrects it once transcripts (for strand)
 * are available. When a side's transcripts are missing the resolver falls back
 * to the original ordering, so passing empty lists is a safe no-op.
 */
export function resolveComparisonRows(
    rows: ComparisonRow[],
    transcriptsForGene: (symbol: string) => TranscriptData[]
): ComparisonRow[] {
    return rows.map(row => {
        const e = row.event;
        const resolved = resolveFusionPartners({
            fusion: e,
            gene1Transcripts: transcriptsForGene(e.gene1.symbol),
            gene2Transcripts: e.gene2 ? transcriptsForGene(e.gene2.symbol) : [],
        });
        return {
            ...row,
            fivePrimeSymbol: resolved.fivePrime.symbol,
            threePrimeSymbol: resolved.threePrime
                ? resolved.threePrime.symbol
                : null,
            anchorBreakpoint: resolved.fivePrime.position,
            partnerBreakpoint: resolved.threePrime
                ? resolved.threePrime.position
                : null,
        };
    });
}

/**
 * Force every row in a pair-anchored comparison onto ONE canonical 5′ gene.
 *
 * `resolveComparisonRows` decides 5′/3′ per row from that row's own
 * `connectionType`, so a single gene pair can end up with a mix (e.g. most
 * TMPRSS2-ERG rows resolve to TMPRSS2-5′ via `3to5`, but `5to3`/blank rows fall
 * back to ERG-5′). Mixed orientation puts breakpoints from two different genes
 * on one anchor track and pairs strips' transcripts with the wrong breakpoint.
 *
 * Given the pair's consensus 5′ symbol, swap the minority rows (and their
 * breakpoints) so the whole cohort shares one coordinate system. Positions come
 * from the already-resolved row, so pattern-B normalization is preserved. Rows
 * that don't contain the target gene are left untouched.
 */
export function orientComparisonRowsTo5p(
    rows: ComparisonRow[],
    fivePrimeSymbol: string
): ComparisonRow[] {
    return rows.map(row => {
        if (row.fivePrimeSymbol === fivePrimeSymbol) return row;
        if (
            row.threePrimeSymbol === fivePrimeSymbol &&
            row.partnerBreakpoint !== null
        ) {
            return {
                ...row,
                fivePrimeSymbol: row.threePrimeSymbol,
                threePrimeSymbol: row.fivePrimeSymbol,
                anchorBreakpoint: row.partnerBreakpoint,
                partnerBreakpoint: row.anchorBreakpoint,
            };
        }
        return row;
    });
}

/**
 * Snap each row's anchor breakpoint to whichever of its two positions actually
 * sits near the anchor gene's locus.
 *
 * Some source rows have their symbol and position columns desynced ("pattern
 * B"): e.g. the TMPRSS2 symbol is paired with an ERG-locus position and vice
 * versa. `orientComparisonRowsTo5p` fixes the SYMBOL (it's already the anchor)
 * but not the mispaired POSITION, so the breakpoint lands ~3 Mb off the gene.
 * Preferring transcript-RANGE CONTAINMENT (with a slop) over nearest-midpoint
 * corrects this robustly even for genes megabases apart, where a breakpoint
 * near a large gene's far end can be numerically closer to the partner's
 * midpoint. If the anchor breakpoint is in range → keep it. Else if the partner
 * breakpoint is in range → swap. Else fall back to nearest-midpoint. No-op when
 * there is no partner breakpoint, or for intragenic events (same symbol both
 * sides) where containment is ambiguous.
 */
const SNAP_SLOP = 20000;

export function snapBreakpointsToAnchorGene(
    rows: ComparisonRow[],
    txStart: number,
    txEnd: number
): ComparisonRow[] {
    const mid = (txStart + txEnd) / 2;
    const lo = txStart - SNAP_SLOP;
    const hi = txEnd + SNAP_SLOP;
    const inRange = (p: number | null): boolean =>
        p !== null && p >= lo && p <= hi;
    return rows.map(row => {
        if (row.partnerBreakpoint === null) return row;
        // Intragenic: both positions sit in the same gene, so containment can't
        // disambiguate the anchor side — leave the row untouched.
        const e = row.event;
        if (e && e.gene1 && e.gene1.symbol === (e.gene2 && e.gene2.symbol))
            return row;

        const swapped: ComparisonRow = {
            ...row,
            anchorBreakpoint: row.partnerBreakpoint,
            partnerBreakpoint: row.anchorBreakpoint,
        };
        if (inRange(row.anchorBreakpoint)) return row;
        if (inRange(row.partnerBreakpoint)) return swapped;
        // Both out of range → fall back to nearest-midpoint.
        const dAnchor = Math.abs(row.anchorBreakpoint - mid);
        const dPartner = Math.abs(row.partnerBreakpoint - mid);
        return dPartner < dAnchor ? swapped : row;
    });
}

export function sortComparisonRows(rows: ComparisonRow[]): ComparisonRow[] {
    return [...rows].sort((a, b) => a.anchorBreakpoint - b.anchorBreakpoint);
}

const isPartnerless = (row: ComparisonRow): boolean =>
    row.threePrimeSymbol === null || row.partnerBreakpoint === null;

/**
 * The anchor gene's endpoint on the chosen side. Partnerless rows have no
 * fused side: the resolver leaves the gene in the 5′ field, so read that.
 */
export function anchorEndpoint(
    row: ComparisonRow,
    side: AnchorSide
): { symbol: string; breakpoint: number } {
    if (side === '5p' || isPartnerless(row)) {
        return {
            symbol: row.fivePrimeSymbol,
            breakpoint: row.anchorBreakpoint,
        };
    }
    return {
        symbol: row.threePrimeSymbol as string,
        breakpoint: row.partnerBreakpoint as number,
    };
}

/** The endpoint opposite the anchor; null for partnerless rows. */
export function partnerEndpoint(
    row: ComparisonRow,
    side: AnchorSide
): { symbol: string | null; breakpoint: number | null } {
    if (isPartnerless(row)) return { symbol: null, breakpoint: null };
    return side === '5p'
        ? { symbol: row.threePrimeSymbol, breakpoint: row.partnerBreakpoint }
        : { symbol: row.fivePrimeSymbol, breakpoint: row.anchorBreakpoint };
}

/** Partner bucket for the Gene-mode table, facet and lollipop colours. */
export function partnerCategory(
    row: ComparisonRow,
    gene: string,
    side: AnchorSide
): string {
    if (isPartnerless(row)) return NO_PARTNER;
    if (row.fivePrimeSymbol === gene && row.threePrimeSymbol === gene) {
        return INTRAGENIC;
    }
    return partnerEndpoint(row, side).symbol as string;
}

/**
 * Keep rows whose anchor gene sits on `side`. Partnerless and intragenic rows
 * have no fused side (or the gene on both) and are always kept (D19). Must run
 * on RESOLVED rows -- raw site order is not a reliable 5′/3′ call.
 */
export function filterRowsToAnchorSide(
    rows: ComparisonRow[],
    gene: string,
    side: AnchorSide
): { kept: ComparisonRow[]; oppositeCount: number } {
    const kept: ComparisonRow[] = [];
    let oppositeCount = 0;
    rows.forEach(row => {
        const category = partnerCategory(row, gene, side);
        if (category === NO_PARTNER || category === INTRAGENIC) {
            kept.push(row);
            return;
        }
        const onSide =
            side === '5p'
                ? row.fivePrimeSymbol === gene
                : row.threePrimeSymbol === gene;
        if (onSide) kept.push(row);
        else oppositeCount += 1;
    });
    return { kept, oppositeCount };
}

/** Side the gene occupies in most partnered, non-intragenic rows; ties → 5p. */
export function majoritySide(rows: ComparisonRow[], gene: string): AnchorSide {
    let five = 0;
    let three = 0;
    rows.forEach(row => {
        if (isPartnerless(row)) return;
        if (row.fivePrimeSymbol === row.threePrimeSymbol) return;
        if (row.fivePrimeSymbol === gene) five += 1;
        else if (row.threePrimeSymbol === gene) three += 1;
    });
    return three > five ? '3p' : '5p';
}

const swapPositions = (row: ComparisonRow): ComparisonRow =>
    row.partnerBreakpoint === null
        ? row
        : {
              ...row,
              anchorBreakpoint: row.partnerBreakpoint,
              partnerBreakpoint: row.anchorBreakpoint,
          };

/**
 * Side-aware pattern-B snap: make the anchor-side position sit inside the
 * anchor gene. For '3p' the positions are swapped, snapped with the 5′ logic,
 * and swapped back, so symbols never move.
 */
export function snapBreakpointsToGeneSide(
    rows: ComparisonRow[],
    txStart: number,
    txEnd: number,
    side: AnchorSide
): ComparisonRow[] {
    if (side === '5p') return snapBreakpointsToAnchorGene(rows, txStart, txEnd);
    return snapBreakpointsToAnchorGene(
        rows.map(swapPositions),
        txStart,
        txEnd
    ).map(swapPositions);
}

export function sortRowsByAnchorSide(
    rows: ComparisonRow[],
    side: AnchorSide
): ComparisonRow[] {
    return [...rows].sort(
        (a, b) =>
            anchorEndpoint(a, side).breakpoint -
            anchorEndpoint(b, side).breakpoint
    );
}
