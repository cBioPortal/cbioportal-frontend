/** Residues below this pLDDT are treated as low-confidence (AlphaFold DB convention). */
export const ALPHAFOLD_PLDDT_LOW_THRESHOLD = 50;

/** AlphaFold DB standard pLDDT color bands (stored in mmCIF B-factor). */
export const ALPHAFOLD_PLDDT_LEGEND = [
    { label: 'Very high (>90)', color: '#0053D6', min: 90, max: 100 },
    { label: 'Confident (70–90)', color: '#65CBF3', min: 70, max: 90 },
    { label: 'Low (50–70)', color: '#FFDB13', min: 50, max: 70 },
    { label: 'Very low (<50)', color: '#FF7D45', min: 0, max: 50 },
] as const;

/** 3Dmol.js colorscheme: color protein by B-factor (= pLDDT in AlphaFold models). */
export function getAlphaFoldPlddtColorscheme(): {
    prop: string;
    gradient: string;
    min: number;
    max: number;
    colors: string[];
} {
    return {
        prop: 'b',
        gradient: 'linear',
        min: 0,
        max: 100,
        colors: ['0xFF7D45', '0xFFDB13', '0x65CBF3', '0x0053D6'],
    };
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
