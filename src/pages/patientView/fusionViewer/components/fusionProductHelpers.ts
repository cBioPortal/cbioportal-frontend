import { Exon, TranscriptData, GenePartner } from '../data/types';

// ---------------------------------------------------------------------------
// Layout constants
// ---------------------------------------------------------------------------
export const PRODUCT_HEIGHT = 20;
export const EXON_GAP = 2;
export const DIAMOND_SIZE = 8;

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
 * Compute the junction x position for connecting arcs.
 * Mirrors the internal logic so the parent orchestrator can position arcs.
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
        gene1.strand
    );
    const retained3p = select3PrimeExons(
        sorted3p,
        gene2.position,
        gene2.strand
    );

    const totalExons = retained5p.length + retained3p.length;
    if (totalExons === 0) return x + width / 2;

    const diamondWidth = DIAMOND_SIZE * 2 + 4;
    const availableWidth =
        width - diamondWidth - EXON_GAP * (totalExons - 1) - 20;
    const exonWidth = Math.max(8, availableWidth / totalExons);
    const startX = x + 10;

    const after5p = startX + retained5p.length * (exonWidth + EXON_GAP);
    return after5p + diamondWidth / 2;
}
