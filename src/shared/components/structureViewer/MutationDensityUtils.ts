/** Light (sparse) to dark (dense) gradient for mutation count at a residue. */
export const MUTATION_DENSITY_COLOR_LOW = '#F3E5F5';
export const MUTATION_DENSITY_COLOR_HIGH = '#6A1B9A';

export function getMaxMutationCount(
    mutationsByPosition: { [position: string]: unknown[] }
): number {
    let max = 0;

    Object.values(mutationsByPosition).forEach(mutations => {
        max = Math.max(max, mutations.length);
    });

    return max || 1;
}

function interpolateHexColor(
    lowHex: string,
    highHex: string,
    t: number
): string {
    const clamped = Math.min(1, Math.max(0, t));
    const parse = (hex: string) => [
        parseInt(hex.slice(1, 3), 16),
        parseInt(hex.slice(3, 5), 16),
        parseInt(hex.slice(5, 7), 16),
    ];
    const [r0, g0, b0] = parse(lowHex);
    const [r1, g1, b1] = parse(highHex);
    const mix = (a: number, b: number) =>
        Math.round(a + (b - a) * clamped)
            .toString(16)
            .padStart(2, '0');

    return `#${mix(r0, r1)}${mix(g0, g1)}${mix(b0, b1)}`;
}

/** Map mutation count at one residue to a color (1 = lightest, maxCount = darkest). */
export function getColorForMutationDensity(
    count: number,
    maxCount: number
): string {
    if (count <= 0) {
        return MUTATION_DENSITY_COLOR_LOW;
    }

    const normalizedMax = Math.max(1, maxCount);

    if (normalizedMax === 1) {
        return MUTATION_DENSITY_COLOR_HIGH;
    }

    const t = (count - 1) / (normalizedMax - 1);

    return interpolateHexColor(
        MUTATION_DENSITY_COLOR_LOW,
        MUTATION_DENSITY_COLOR_HIGH,
        t
    );
}
