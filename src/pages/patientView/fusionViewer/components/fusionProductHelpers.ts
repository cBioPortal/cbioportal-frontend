import {
    Exon,
    ProteinDomain,
    TranscriptData,
    GenePartner,
    RetainedDomain,
    SvIdiom,
} from '../data/types';

// ---------------------------------------------------------------------------
// Domain truncation constants
// ---------------------------------------------------------------------------
/**
 * A domain is styled "intact" only when the fraction retained is at or above
 * this threshold. Below it the domain is rendered with a ghost/hatched stub
 * and a truncation badge. Adjust to tune sensitivity.
 */
export const DOMAIN_TRUNCATION_THRESHOLD = 0.9;

// ---------------------------------------------------------------------------
// Layout constants
// ---------------------------------------------------------------------------
export const PRODUCT_HEIGHT = 20;
export const EXON_GAP = 2;
// Gap between the 5′ and 3′ exon blocks at the fusion junction (where the
// breakpoint diamond used to be). Small — just enough to read as a seam.
export const JUNCTION_GAP = 14;
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
 * Resolve the effective 5′ / 3′ breakpoints that drive product/gene-track exon
 * selection. Pure so the strand logic can be exhaustively tested.
 *
 * For two-gene fusions (and any non-intragenic idiom) gene1 is the resolved 5′
 * partner, so its position is the 5′ breakpoint and gene2's the 3′ — returned
 * unchanged.
 *
 * For INTRAGENIC deletion/duplication BOTH breakpoints lie on one transcript, so
 * 5′/3′ assignment must follow STRAND + POSITION, not the arbitrary site1/site2
 * (gene1/gene2) order — on minus-strand genes that order is reversed relative to
 * transcription. We derive upstream (5′-ward) / downstream (3′-ward) from
 * min/max by strand:
 *   + strand: upstream = lower position,  downstream = higher position
 *   − strand: upstream = higher position, downstream = lower position
 * DELETION keeps the exons OUTSIDE the segment → 5′ = upstream, 3′ = downstream
 * (the gap between the retained sets is the deletion).
 * DUPLICATION keeps/overlaps the INSIDE segment → swapped, so the 5′ and 3′
 * retained sets overlap over the duplicated exons (tandem repeat).
 */
export function resolveProductBreakpoints(
    svIdiom: SvIdiom,
    strand5p: '+' | '-',
    gene1Position: number,
    gene2Position: number | undefined
): { breakpoint5p: number; breakpoint3p: number | undefined } {
    const isIntragenicProduct =
        svIdiom === 'INTRAGENIC_DELETION' ||
        svIdiom === 'INTRAGENIC_DUPLICATION';
    if (!isIntragenicProduct || gene2Position === undefined) {
        return { breakpoint5p: gene1Position, breakpoint3p: gene2Position };
    }
    const hi = Math.max(gene1Position, gene2Position);
    const lo = Math.min(gene1Position, gene2Position);
    const upstream = strand5p === '-' ? hi : lo;
    const downstream = strand5p === '-' ? lo : hi;
    if (svIdiom === 'INTRAGENIC_DUPLICATION') {
        return { breakpoint5p: downstream, breakpoint3p: upstream };
    }
    return { breakpoint5p: upstream, breakpoint3p: downstream };
}

/**
 * Linear interpolation of a breakpoint genomic position onto a domain's AA
 * coordinate space. Used only for domains the breakpoint actually intersects.
 *
 * The interpolation accounts for strand:
 *   + strand: AA increases with genomic position
 *   - strand: AA increases as genomic position decreases
 *
 * Returns `domain.startAA` when the genomic span is zero (degenerate case).
 */
export function breakpointToDomainAA(
    domain: ProteinDomain,
    breakpointGenomic: number,
    strand: '+' | '-'
): number {
    const gSpan = domain.endGenomic - domain.startGenomic;
    if (gSpan === 0) return domain.startAA;
    const aaSpan = domain.endAA - domain.startAA;
    const rawFrac = (breakpointGenomic - domain.startGenomic) / gSpan;
    const frac = strand === '+' ? rawFrac : 1 - rawFrac;
    return domain.startAA + frac * aaSpan;
}

/**
 * Build a RetainedDomain for a domain that is fully retained (breakpoint does
 * not intersect it).
 */
function makeFullRetainedDomain(
    domain: ProteinDomain,
    side: '5p' | '3p'
): RetainedDomain {
    return {
        domain,
        side,
        retainedStartAA: domain.startAA,
        retainedEndAA: domain.endAA,
        isTruncated: false,
        retainedFraction: 1,
        lostStartAA: domain.endAA,
        lostEndAA: domain.endAA,
    };
}

/**
 * Build a RetainedDomain for a domain that straddles the breakpoint.
 * For the 5′ side we retain [startAA, bpAA]; for the 3′ side [bpAA, endAA].
 */
function makeTruncatedRetainedDomain(
    domain: ProteinDomain,
    side: '5p' | '3p',
    bpAA: number
): RetainedDomain {
    const fullLen = domain.endAA - domain.startAA + 1;
    let retainedStartAA: number;
    let retainedEndAA: number;
    let lostStartAA: number;
    let lostEndAA: number;

    if (side === '5p') {
        retainedStartAA = domain.startAA;
        retainedEndAA = Math.min(domain.endAA, Math.max(domain.startAA, bpAA));
        lostStartAA = retainedEndAA;
        lostEndAA = domain.endAA;
    } else {
        retainedStartAA = Math.max(
            domain.startAA,
            Math.min(domain.endAA, bpAA)
        );
        retainedEndAA = domain.endAA;
        lostStartAA = domain.startAA;
        lostEndAA = retainedStartAA;
    }

    const retainedLen = retainedEndAA - retainedStartAA + 1;
    const retainedFraction = Math.min(1, Math.max(0, retainedLen / fullLen));
    const isTruncated = retainedFraction < DOMAIN_TRUNCATION_THRESHOLD;

    return {
        domain,
        side,
        retainedStartAA,
        retainedEndAA,
        isTruncated,
        retainedFraction,
        lostStartAA,
        lostEndAA,
    };
}

/**
 * Select protein domains retained on the 5-prime side of a fusion.
 *
 * A domain is retained if any portion of its genomic footprint lies on the
 * 5-prime side of the breakpoint, using the same inclusive rule as
 * select5PrimeExons:
 *   + strand: startGenomic <= breakpoint
 *   - strand: endGenomic   >= breakpoint
 *
 * Domains straddling the breakpoint are clipped to the retained AA interval
 * and returned with `isTruncated = true` when the retained fraction is below
 * DOMAIN_TRUNCATION_THRESHOLD.
 */
export function select5PrimeDomains(
    domains: ProteinDomain[],
    breakpointPos: number,
    strand: '+' | '-'
): RetainedDomain[] {
    return domains
        .filter(d =>
            strand === '+'
                ? d.startGenomic <= breakpointPos
                : d.endGenomic >= breakpointPos
        )
        .map(d => {
            // Check if the breakpoint falls strictly inside this domain.
            const straddlesFwd =
                strand === '+' &&
                d.startGenomic <= breakpointPos &&
                breakpointPos < d.endGenomic;
            const straddlesRev =
                strand === '-' &&
                d.startGenomic < breakpointPos &&
                breakpointPos <= d.endGenomic;
            if (straddlesFwd || straddlesRev) {
                const bpAA = breakpointToDomainAA(d, breakpointPos, strand);
                return makeTruncatedRetainedDomain(d, '5p', bpAA);
            }
            return makeFullRetainedDomain(d, '5p');
        });
}

/**
 * Select protein domains retained on the 3-prime side of a fusion.
 *
 *   + strand: endGenomic   >= breakpoint
 *   - strand: startGenomic <= breakpoint
 *
 * Domains straddling the breakpoint are clipped to the retained AA interval.
 */
export function select3PrimeDomains(
    domains: ProteinDomain[],
    breakpointPos: number,
    strand: '+' | '-'
): RetainedDomain[] {
    return domains
        .filter(d =>
            strand === '+'
                ? d.endGenomic >= breakpointPos
                : d.startGenomic <= breakpointPos
        )
        .map(d => {
            const straddlesFwd =
                strand === '+' &&
                d.startGenomic < breakpointPos &&
                breakpointPos <= d.endGenomic;
            const straddlesRev =
                strand === '-' &&
                d.startGenomic <= breakpointPos &&
                breakpointPos < d.endGenomic;
            if (straddlesFwd || straddlesRev) {
                const bpAA = breakpointToDomainAA(d, breakpointPos, strand);
                return makeTruncatedRetainedDomain(d, '3p', bpAA);
            }
            return makeFullRetainedDomain(d, '3p');
        });
}

export interface GhostStubRect {
    ghostX: number;
    ghostWidth: number;
}

/**
 * Geometry for a truncated domain's lost-portion "ghost" stub, capped so it
 * never spills past the domain's own on-screen footprint [domainLeft, domainRight]
 * (whose far edge ≈ the fusion junction). Without the cap, the MIN_DOMAIN_W
 * floor applied to the solid retained rect pushes the ghost past the junction at
 * very low retention, overrunning the 3′ partner's domains.
 *
 * 5′ domains keep their retained solid on the left and the ghost extends right;
 * 3′ domains keep the solid on the right and the ghost fills left to the solid
 * edge. A cap that lands at 0 leaves only the truncation badge (the caller
 * suppresses sub-MIN_GHOST_W stubs), so truncation is never silently lost.
 */
export function ghostStubRect(
    side: '5p' | '3p',
    solidX: number,
    solidWidth: number,
    lostSvgWidth: number,
    domainLeft: number,
    domainRight: number
): GhostStubRect {
    if (side === '5p') {
        const ghostX = solidX + solidWidth;
        return {
            ghostX,
            ghostWidth: Math.max(
                0,
                Math.min(lostSvgWidth, domainRight - ghostX)
            ),
        };
    }
    const ghostWidth = Math.max(0, Math.min(lostSvgWidth, solidX - domainLeft));
    return { ghostX: solidX - ghostWidth, ghostWidth };
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
 * Does a caller-provided site description explicitly indicate the partner
 * contributes promoter / 5′UTR only (no coding)? cBioPortal/TARGET SV records
 * carry forms like "5'-UTR of FRMD6(+):38Kb before coding start" and
 * "Promoter of GENE" — the caller's authoritative call, which geometry can't
 * always recover (e.g. when Genome Nexus omits UTR annotation). Checked before
 * geometry. A 3′UTR mention never matches.
 */
export function descriptionImpliesNoCoding(siteDescription?: string): boolean {
    if (!siteDescription) return false;
    const s = siteDescription.toLowerCase();
    if (/\bpromoter\b/.test(s)) return true;
    // "5'-UTR of ...", "5' utr", "five prime utr"
    if (/\b5\s*'?\s*-?\s*utr\b/.test(s)) return true;
    if (/\bfive[\s-]?prime[\s-]?utr\b/.test(s)) return true;
    return false;
}

/**
 * Promoter-swap heuristic: does the 5′ partner contribute promoter / 5′UTR only
 * (no coding)? True when either the caller's annotation says so, or the 5′
 * breakpoint is at/upstream of the 5′ gene's CDS start (so the fusion product's
 * ORF comes from the 3′ gene driven by the 5′ promoter). Geometry requires
 * 5′UTR annotation on the transcript; with neither signal it returns false
 * (can't tell → don't flag).
 */
export function fivePrimeContributesNoCoding(
    transcript5p: TranscriptData,
    breakpoint5p: number,
    siteDescription5p?: string
): boolean {
    // Primary signal: the caller's own annotation.
    if (descriptionImpliesNoCoding(siteDescription5p)) return true;
    // Fallback: geometry from Genome Nexus 5′UTR annotation.
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

/**
 * Does the 3′ partner contribute coding sequence to the product? A real promoter
 * swap needs the 3′ gene to supply the ORF — if it doesn't, there is no chimeric
 * protein at all. Conservative by default (returns true so genuine swaps still
 * render); returns false only on positive evidence the 3′ side is non-coding:
 * a caller annotation naming its 3′UTR, or a breakpoint inside the 3′UTR.
 */
export function threePrimeContributesCoding(
    transcript3p: TranscriptData,
    breakpoint3p: number,
    siteDescription3p?: string
): boolean {
    if (
        siteDescription3p &&
        /\b3\s*'?\s*-?\s*utr\b/.test(siteDescription3p.toLowerCase())
    ) {
        return false;
    }
    const threeUtrs = (transcript3p.utrs || []).filter(
        u => u.type === 'three_prime'
    );
    if (threeUtrs.length === 0) return true; // no info → assume coding
    if (transcript3p.strand === '+') {
        // 3′UTR is the highest-coord region; CDS ends just before it. The 3′
        // partner retains [breakpoint, txEnd]; coding only if the break is below
        // the CDS end.
        const cdsEnd = Math.min(...threeUtrs.map(u => u.start));
        return breakpoint3p < cdsEnd;
    }
    // − strand: 3′UTR is the lowest-coord region; CDS ends just above it.
    const cdsEnd = Math.max(...threeUtrs.map(u => u.end));
    return breakpoint3p > cdsEnd;
}

/**
 * Composed promoter-swap decision: the 5′ partner contributes no coding AND, when
 * 3′ partner data is available, the 3′ partner does contribute coding. Use this
 * at render time rather than calling the parts directly.
 */
export function detectPromoterSwap(args: {
    transcript5p: TranscriptData;
    breakpoint5p: number;
    siteDescription5p?: string;
    transcript3p?: TranscriptData;
    breakpoint3p?: number;
    siteDescription3p?: string;
}): boolean {
    // Intragenic guard: an SV whose two breakpoints are in the SAME gene
    // (intragenic DEL/DUP/INV) is one gene rearranged internally, not a
    // promoter swap between two genes.
    if (
        args.transcript3p &&
        args.transcript5p.gene &&
        args.transcript5p.gene === args.transcript3p.gene
    ) {
        return false;
    }
    if (
        !fivePrimeContributesNoCoding(
            args.transcript5p,
            args.breakpoint5p,
            args.siteDescription5p
        )
    ) {
        return false;
    }
    if (args.transcript3p && args.breakpoint3p != null) {
        return threePrimeContributesCoding(
            args.transcript3p,
            args.breakpoint3p,
            args.siteDescription3p
        );
    }
    return true;
}
