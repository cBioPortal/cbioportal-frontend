/** Residues below this pLDDT are treated as low-confidence (AlphaFold DB convention). */
export const ALPHAFOLD_PLDDT_LOW_THRESHOLD = 50;

/** AlphaFold DB standard pLDDT color bands (stored in mmCIF B-factor). */
export const ALPHAFOLD_PLDDT_LEGEND = [
    { label: 'Very high (>90)', color: '#0053D6', min: 90, max: 100 },
    { label: 'Confident (70–90)', color: '#65CBF3', min: 70, max: 90 },
    { label: 'Low (50–70)', color: '#FFDB13', min: 50, max: 70 },
    { label: 'Very low (<50)', color: '#FF7D45', min: 0, max: 50 },
] as const;

/** Color of the AlphaFold DB pLDDT band a score falls in; a boundary belongs to the higher band. */
export function getAlphaFoldPlddtColor(plddt: number): string {
    const band = ALPHAFOLD_PLDDT_LEGEND.find(item => plddt >= item.min);

    return (band ?? ALPHAFOLD_PLDDT_LEGEND[ALPHAFOLD_PLDDT_LEGEND.length - 1])
        .color;
}

/**
 * 3Dmol.js colorfunc: colors each atom by the pLDDT band of its B-factor
 * (= pLDDT in AlphaFold models), so the structure matches the legend.
 */
export function getAlphaFoldPlddtColorfunc(): (atom: { b: number }) => string {
    return atom => getAlphaFoldPlddtColor(atom.b);
}

export function isLowPlddt(plddt: number): boolean {
    return plddt < ALPHAFOLD_PLDDT_LOW_THRESHOLD;
}

export function getLowPlddtPositions(
    plddtByResidue: { [position: number]: number },
    positions: number[]
): number[] {
    return positions.filter(position => {
        const score = plddtByResidue[position];

        return score != null && isLowPlddt(score);
    });
}
