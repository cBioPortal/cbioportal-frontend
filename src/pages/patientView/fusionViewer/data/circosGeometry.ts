import { GenomeBuild } from './genomeNexusTranscriptService';
import { SvIdiom } from './types';

// tsconfig has no resolveJsonModule wired at the root; require() the JSON
// the same way MutationalSignatureBarChart.tsx pulls in cosmic_reference.json.
const chromosomeSizesData: {
    genomeBuild: string;
    chromosomeSize: number[];
}[] = require('../../genomicOverview/chromosomeSizes.json');

/** Index-aligned chromosome labels: index 0 is a dummy, 1-22 = chr1-22, 23 = X, 24 = Y. */
export const CHROM_LABELS: string[] = [
    '',
    '1',
    '2',
    '3',
    '4',
    '5',
    '6',
    '7',
    '8',
    '9',
    '10',
    '11',
    '12',
    '13',
    '14',
    '15',
    '16',
    '17',
    '18',
    '19',
    '20',
    '21',
    '22',
    'X',
    'Y',
];

const NUM_SECTORS = 24;

/**
 * Returns the chromosomeSize array (index 0 dummy, 1-24 = chr1-22,X,Y) for the
 * given build. Falls back to GRCh38 when the build is missing/unrecognized.
 */
export function chromosomeLengths(build: GenomeBuild): number[] {
    const entry = chromosomeSizesData.find(e => e.genomeBuild === build);
    if (entry) {
        return entry.chromosomeSize;
    }
    const fallback = chromosomeSizesData.find(e => e.genomeBuild === 'GRCh38');
    return fallback ? fallback.chromosomeSize : [];
}

/**
 * Maps a GenePartner.chromosome string ('1'..'22', 'X', 'Y', tolerating a
 * 'chr' prefix) to its ring index (1-24). Returns -1 if unmappable.
 */
export function chromIndex(chromosome: string): number {
    const normalized = chromosome.replace(/^chr/i, '');
    const idx = CHROM_LABELS.indexOf(normalized);
    return idx > 0 ? idx : -1;
}

/**
 * Cumulative-offset angle mapping: total drawable degrees = 360 - 24*gapDeg,
 * allocated to sectors proportional to chromosome length. Returns the
 * absolute angle (degrees, 0 at top, clockwise) of `pos` within its sector.
 */
export function angleFor(
    chromIdx: number,
    pos: number,
    lengths: number[],
    gapDeg: number
): number {
    const totalLength = lengths
        .slice(1, NUM_SECTORS + 1)
        .reduce((sum, len) => sum + len, 0);
    const drawableDeg = 360 - NUM_SECTORS * gapDeg;

    let offsetDeg = 0;
    for (let i = 1; i < chromIdx; i++) {
        const sectorFraction = lengths[i] / totalLength;
        offsetDeg += sectorFraction * drawableDeg + gapDeg;
    }

    const sectorLength = lengths[chromIdx] || 1;
    const clampedPos = Math.max(0, Math.min(pos, sectorLength));
    const posFraction = clampedPos / sectorLength;
    const sectorSpanDeg = (lengths[chromIdx] / totalLength) * drawableDeg;

    return offsetDeg + posFraction * sectorSpanDeg;
}

/** Polar-to-cartesian, 0deg at top, clockwise. */
export function polar(
    angleDeg: number,
    radius: number,
    cx: number,
    cy: number
): { x: number; y: number } {
    const angleRad = ((angleDeg - 90) * Math.PI) / 180;
    return {
        x: cx + radius * Math.cos(angleRad),
        y: cy + radius * Math.sin(angleRad),
    };
}

/** SVG arc path (stroke) for one chromosome ring segment. */
export function sectorArcPath(
    startDeg: number,
    endDeg: number,
    radius: number,
    cx: number,
    cy: number
): string {
    const start = polar(startDeg, radius, cx, cy);
    const end = polar(endDeg, radius, cx, cy);
    const largeArcFlag = endDeg - startDeg > 180 ? 1 : 0;
    return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${end.x} ${end.y}`;
}

/**
 * Quadratic bezier chord from the inner end of angle a1 to that of a2,
 * control point pulled toward center. Degenerate (a1 ~= a2) inputs still
 * produce a small, finite loop rather than NaN.
 */
export function chordPath(
    a1Deg: number,
    a2Deg: number,
    radius: number,
    cx: number,
    cy: number
): string {
    const p1 = polar(a1Deg, radius, cx, cy);
    const p2 = polar(a2Deg, radius, cx, cy);
    // Control point pulled toward the center; for a near-identical angle
    // (degenerate intragenic loop) pull it in only slightly so the loop
    // stays small but the path remains valid (non-zero control point).
    const midDeg = (a1Deg + a2Deg) / 2;
    const isDegenerate = Math.abs(a1Deg - a2Deg) < 0.01;
    const controlRadius = isDegenerate ? radius * 0.9 : radius * 0.15;
    const control = polar(midDeg, controlRadius, cx, cy);
    return `M ${p1.x} ${p1.y} Q ${control.x} ${control.y} ${p2.x} ${p2.y}`;
}

const SV_IDIOM_COLORS: Partial<Record<SvIdiom, string>> = {
    INTERGENIC_FUSION: '#474747',
    INTRACHROM_FUSION: '#474747',
    INTRAGENIC_DELETION: '#EE2B2B',
    INTRAGENIC_DUPLICATION: '#45BA4B',
    INTRAGENIC_INVERSION: '#2B45EE',
};
const SV_IDIOM_FALLBACK_COLOR = '#666666';

/** Maps a SvIdiom to its arc color (FusViz TRA/DEL/DUP/INV semantics). */
export function svIdiomColor(idiom: SvIdiom): string {
    return SV_IDIOM_COLORS[idiom] || SV_IDIOM_FALLBACK_COLOR;
}
