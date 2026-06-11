import {
    Exon,
    ProteinDomain,
    TranscriptData,
    GenePartner,
} from '../data/types';

// ---------------------------------------------------------------------------
// Layout constants
// ---------------------------------------------------------------------------
export const PRODUCT_HEIGHT = 20;
export const EXON_GAP = 2;
// Gap between the 5′ and 3′ exon blocks at the fusion junction (where the
// breakpoint diamond used to be). Small — just enough to read as a seam.
export const JUNCTION_GAP = 8;
// Floor on a drawn exon width so very short exons stay visible / clickable.
const MIN_EXON_W = 4;

// ---------------------------------------------------------------------------
// Exon selection logic
// ---------------------------------------------------------------------------

/**
 * Select exons from the 5-prime gene that are retained in the fusion product.
 *
 * For + strand: exons whose start <= breakpoint
 * For - strand: exons whose end >= breakpoint
 */
export function select5PrimeExons(
    exons: Exon[],
    breakpointPos: number,
    strand: '+' | '-'
): Exon[] {
    if (strand === '+') {
        return exons.filter(e => e.start <= breakpointPos);
    } else {
        return exons.filter(e => e.end >= breakpointPos);
    }
}

/**
 * Select exons from the 3-prime gene that are retained in the fusion product.
 *
 * For + strand: exons whose end >= breakpoint
 * For - strand: exons whose start <= breakpoint
 */
export function select3PrimeExons(
    exons: Exon[],
    breakpointPos: number,
    strand: '+' | '-'
): Exon[] {
    if (strand === '+') {
        return exons.filter(e => e.end >= breakpointPos);
    } else {
        return exons.filter(e => e.start <= breakpointPos);
    }
}

/**
 * Select protein domains retained on the 5-prime side of a fusion.
 *
 * A domain is retained if any portion of its genomic footprint lies on the
 * 5-prime side of the breakpoint, using the same inclusive rule as
 * select5PrimeExons:
 *   + strand: startGenomic <= breakpoint
 *   - strand: endGenomic   >= breakpoint
 */
export function select5PrimeDomains(
    domains: ProteinDomain[],
    breakpointPos: number,
    strand: '+' | '-'
): ProteinDomain[] {
    if (strand === '+') {
        return domains.filter(d => d.startGenomic <= breakpointPos);
    }
    return domains.filter(d => d.endGenomic >= breakpointPos);
}

/**
 * Select protein domains retained on the 3-prime side of a fusion.
 *
 *   + strand: endGenomic   >= breakpoint
 *   - strand: startGenomic <= breakpoint
 */
export function select3PrimeDomains(
    domains: ProteinDomain[],
    breakpointPos: number,
    strand: '+' | '-'
): ProteinDomain[] {
    if (strand === '+') {
        return domains.filter(d => d.endGenomic >= breakpointPos);
    }
    return domains.filter(d => d.startGenomic <= breakpointPos);
}

export interface FusionExonLayout {
    /** Drawn width (px) of each retained 5′ exon, in order. */
    widths5p: number[];
    /** Drawn width (px) of each retained 3′ exon, in order. */
    widths3p: number[];
    /** Left-edge x (px) of each retained 5′ exon block, in order. */
    xs5p: number[];
    /** Left-edge x (px) of each retained 3′ exon block, in order. */
    xs3p: number[];
    /** Left edge of the first exon. */
    startX: number;
    /** Center of the junction gap between the 5′ and 3′ blocks. */
    junctionX: number;
}

/**
 * Retained exons for one partner, sorted into transcription order (5′→3′) —
 * the same order the fusion product lays them out left-to-right. Sharing this
 * helper keeps FusionProduct and ProteinDomainTrack on an identical exon
 * sequence so domains can be aligned under the exons that encode them.
 */
export function retainedExonsInOrder(
    transcript: TranscriptData,
    breakpointPos: number,
    is5Prime: boolean
): Exon[] {
    const sorted = [...transcript.exons].sort((a, b) =>
        transcript.strand === '-' ? b.start - a.start : a.start - b.start
    );
    return is5Prime
        ? select5PrimeExons(sorted, breakpointPos, transcript.strand)
        : select3PrimeExons(sorted, breakpointPos, transcript.strand);
}

/**
 * Shared fusion-product exon layout. Exon rectangles are drawn TO SCALE —
 * each width is proportional to that exon's genomic length (bp) — with a small
 * floor so very short exons stay visible. Used by both FusionProduct (to place
 * the exon rects) and computeJunctionX (to place the connecting arcs) so the
 * two cannot drift apart.
 */
export function computeFusionExonLayout(
    retained5p: Exon[],
    retained3p: Exon[],
    x: number,
    width: number
): FusionExonLayout {
    const startX = x + 10;
    const totalExons = retained5p.length + retained3p.length;
    const exonLen = (e: Exon) => Math.max(1, e.end - e.start);
    const totalLen =
        [...retained5p, ...retained3p].reduce((s, e) => s + exonLen(e), 0) || 1;
    const availableWidth =
        width - JUNCTION_GAP - EXON_GAP * Math.max(0, totalExons - 1) - 20;
    const scaleW = (e: Exon) =>
        Math.max(MIN_EXON_W, (exonLen(e) / totalLen) * availableWidth);
    const widths5p = retained5p.map(scaleW);
    const widths3p = retained3p.map(scaleW);

    const xs5p: number[] = [];
    let cursor = startX;
    widths5p.forEach(w => {
        xs5p.push(cursor);
        cursor += w + EXON_GAP;
    });
    const junctionX = cursor + JUNCTION_GAP / 2;
    cursor += JUNCTION_GAP;
    const xs3p: number[] = [];
    widths3p.forEach(w => {
        xs3p.push(cursor);
        cursor += w + EXON_GAP;
    });

    return { widths5p, widths3p, xs5p, xs3p, startX, junctionX };
}

/**
 * Map a genomic coordinate to its x in the to-scale fusion exon layout, so a
 * protein domain can be drawn directly under the exons that encode it.
 * `exons`, `xs`, and `widths` are the retained exons in transcription order
 * with their drawn block left-edges and widths. A coordinate inside an exon
 * interpolates within that block (strand-aware); one in an intron or beyond
 * the retained set clamps to the nearest exon edge.
 */
export function genomicToExonX(
    genomicPos: number,
    exons: Exon[],
    xs: number[],
    widths: number[],
    strand: '+' | '-'
): number {
    if (exons.length === 0) return 0;
    const fracIn = (e: Exon) =>
        strand === '+'
            ? (genomicPos - e.start) / Math.max(1, e.end - e.start)
            : (e.end - genomicPos) / Math.max(1, e.end - e.start);

    for (let i = 0; i < exons.length; i++) {
        const e = exons[i];
        if (genomicPos >= e.start && genomicPos <= e.end) {
            return xs[i] + fracIn(e) * widths[i];
        }
    }

    // Outside all exons. exons[0] is the 5′-most (leftmost) block.
    const first = exons[0];
    const last = exons[exons.length - 1];
    const upstreamOfFirst =
        strand === '+' ? genomicPos < first.start : genomicPos > first.end;
    if (upstreamOfFirst) return xs[0];
    const downstreamOfLast =
        strand === '+' ? genomicPos > last.end : genomicPos < last.start;
    if (downstreamOfLast) {
        const li = exons.length - 1;
        return xs[li] + widths[li];
    }
    // In an intron between two exon blocks → clamp to the preceding block edge.
    for (let i = 0; i < exons.length - 1; i++) {
        const e = exons[i];
        const next = exons[i + 1];
        const between =
            strand === '+'
                ? genomicPos > e.end && genomicPos < next.start
                : genomicPos < e.start && genomicPos > next.end;
        if (between) return xs[i] + widths[i];
    }
    return xs[0];
}

/**
 * Compute the junction x position for connecting arcs. Delegates to the shared
 * layout so arcs land exactly on the FusionProduct junction.
 */
export function computeJunctionX(
    gene1: GenePartner,
    gene2: GenePartner | null,
    forteTranscript5p: TranscriptData,
    forteTranscript3p: TranscriptData | undefined,
    x: number,
    width: number
): number {
    if (!gene2 || !forteTranscript3p) {
        return x + width / 2;
    }

    const sorted5p = [...forteTranscript5p.exons].sort(
        (a, b) => a.number - b.number
    );
    const sorted3p = [...forteTranscript3p.exons].sort(
        (a, b) => a.number - b.number
    );

    const retained5p = select5PrimeExons(
        sorted5p,
        gene1.position,
        forteTranscript5p.strand
    );
    const retained3p = select3PrimeExons(
        sorted3p,
        gene2.position,
        forteTranscript3p.strand
    );

    if (retained5p.length + retained3p.length === 0) return x + width / 2;

    return computeFusionExonLayout(retained5p, retained3p, x, width).junctionX;
}

/**
 * Promoter-swap heuristic: does the 5′ partner contribute promoter / 5′UTR only
 * (no coding)? True when the 5′ breakpoint is at or upstream of the 5′ gene's
 * CDS start, so the fusion product's ORF comes from the 3′ gene driven by the
 * 5′ promoter. Requires 5′UTR annotation on the transcript; returns false when
 * absent (can't tell → don't flag).
 */
export function fivePrimeContributesNoCoding(
    transcript5p: TranscriptData,
    breakpoint5p: number
): boolean {
    const fiveUtrs = (transcript5p.utrs || []).filter(
        u => u.type === 'five_prime'
    );
    if (fiveUtrs.length === 0) return false;
    if (transcript5p.strand === '+') {
        // CDS begins just after the last (highest-coord) 5′UTR base.
        const lastUtrEnd = Math.max(...fiveUtrs.map(u => u.end));
        return breakpoint5p <= lastUtrEnd;
    }
    // − strand: 5′UTR is the highest-coord region; CDS begins just below it.
    const firstUtrStart = Math.min(...fiveUtrs.map(u => u.start));
    return breakpoint5p >= firstUtrStart;
}
