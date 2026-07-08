// Shared horizontal frame for the two-tier SV/Fusion comparison view.
//
// The anchor-gene track (Tier 1) and every fusion-product strip (Tier 2) are
// drawn 1:1 into the SAME frame so their columns line up:
//
//   0 ────────── leftX ─────────── junctionX ─────────── rightX ────── width
//   │ sample-ID    │  5′ (anchor)      │  3′ (partner)       │  frame/reads │
//   │  gutter      │  fans left to seam │ extends right       │   gutter     │
//
// In junction (MSA) mode the fusion seam of every row is pinned to `junctionX`,
// and the anchor-gene body ends at `junctionX` with breakpoint lollipops
// fanning left into the gene.

export const LABEL_GUTTER = 170; // left gutter for sample-ID labels
export const RIGHT_GUTTER = 120; // right gutter for frame-status / read counts
export const JUNCTION_FRAC = 0.5; // seam position within the drawable region

export interface ComparisonFrame {
    leftX: number;
    junctionX: number;
    rightX: number;
}

/**
 * Derive the shared frame x-coordinates from a measured content width.
 * `rightX` is floored so the drawable region never collapses on narrow widths.
 */
export function computeComparisonFrame(width: number): ComparisonFrame {
    const leftX = LABEL_GUTTER;
    const rightX = Math.max(leftX + 120, width - RIGHT_GUTTER);
    const junctionX = leftX + (rightX - leftX) * JUNCTION_FRAC;
    return { leftX, junctionX, rightX };
}

/**
 * Shared bp→px scale for one side: the widest row (in retained genomic bp)
 * exactly fills its region, and every other row is drawn proportionally
 * smaller so retained lengths are comparable across samples. Returns 0 when
 * there is nothing to draw.
 */
export function sharedPxPerBp(
    maxRetainedBp: number,
    regionWidth: number
): number {
    if (maxRetainedBp <= 0 || regionWidth <= 0) return 0;
    return regionWidth / maxRetainedBp;
}
