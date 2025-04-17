/**
 * A visually distinct color palette for visualizations
 */
const COLOR_PALETTE = [
    '#3366cc',
    '#dc3912',
    '#ff9900',
    '#109618',
    '#990099',
    '#0099c6',
    '#dd4477',
    '#66aa00',
    '#b82e2e',
    '#316395',
    '#994499',
    '#22aa99',
    '#aaaa11',
    '#6633cc',
    '#e67300',
    '#8b0707',
    '#651067',
    '#329262',
    '#5574a6',
    '#3b3eac',
];

/**
 * Generates a hash code from a string
 * @param str - Input string
 * @returns A numeric hash
 */
function hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = (hash << 5) - hash + char;
        hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash);
}

/**
 * Gets a color for a given string input
 * @param input - String input to generate a color for
 * @returns A hex color string
 */
export function getColor(input: string): string {
    if (!input) return '#cccccc'; // Default color for empty input

    // Use the hash to select a color from the palette
    const index = hashString(input) % COLOR_PALETTE.length;
    return COLOR_PALETTE[index];
}
