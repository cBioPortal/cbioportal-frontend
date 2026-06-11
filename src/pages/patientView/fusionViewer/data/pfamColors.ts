// Pfam domain coloring mirrored from cBioPortal's react-mutation-mapper so the
// fusion-product protein-domain track matches the lollipop / mutation-mapper
// view used elsewhere in cBioPortal.
// Source: packages/react-mutation-mapper/src/util/PfamUtils.ts
//   (generatePfamDomainColorMap)

/** The cBioPortal Pfam domain palette, in assignment order. */
export const PFAM_DOMAIN_COLORS: string[] = [
    '#2dcf00',
    '#ff5353',
    '#5b5bff',
    '#ebd61d',
    '#ba21e0',
    '#ff9c42',
    '#ff7dff',
    '#b9264f',
    '#baba21',
    '#c48484',
    '#1f88a7',
    '#cafeb8',
    '#4a9586',
    '#ceb86c',
    '#0e180f',
];

/** Neutral fill for domains lacking a Pfam id (uncolored in the palette). */
export const PFAM_FALLBACK_COLOR = '#9e9e9e';

/**
 * Map each unique Pfam domain id to a palette color, assigned by ascending
 * start position. Matches `generatePfamDomainColorMap` in react-mutation-mapper
 * (does NOT mutate the input — sorts a copy).
 */
export function generatePfamDomainColorMap(
    domains: { pfamId?: string; startAA?: number }[]
): { [pfamId: string]: string } {
    const map: { [pfamId: string]: string } = {};
    let colorIdx = 0;
    [...domains]
        .sort((a, b) => (a.startAA ?? 0) - (b.startAA ?? 0))
        .forEach(domain => {
            const id = domain.pfamId;
            if (id && map[id] === undefined) {
                map[id] =
                    PFAM_DOMAIN_COLORS[colorIdx % PFAM_DOMAIN_COLORS.length];
                colorIdx++;
            }
        });
    return map;
}

/**
 * Pick a readable text color (dark or white) for a label drawn on top of the
 * given hex fill, by relative luminance.
 */
export function readableTextColor(hex: string): string {
    if (!/^#[0-9a-fA-F]{6}$/.test(hex)) return '#333';
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.6 ? '#333' : '#fff';
}
