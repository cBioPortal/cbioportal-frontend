/**
 * Formats a numerical value for display on chart axes
 * @param value - The value to format
 * @param values - Array of values for context (used to determine appropriate precision)
 * @returns Formatted string representation of the value
 */
export function tickFormatNumeral(value: number, values: number[]): string {
    if (value === 0) return '0';
    if (isNaN(value)) return 'NaN';
    if (!isFinite(value)) return value > 0 ? '∞' : '-∞';

    const range = Math.max(...values) - Math.min(...values);
    const absValue = Math.abs(value);

    if (absValue >= 1000000 || absValue <= 0.0001) {
        return value.toExponential(2);
    } else if (range >= 1000) {
        return value.toLocaleString(undefined, { maximumFractionDigits: 0 });
    } else if (range >= 10) {
        return value.toLocaleString(undefined, { maximumFractionDigits: 1 });
    } else if (range >= 1) {
        return value.toLocaleString(undefined, { maximumFractionDigits: 2 });
    } else {
        const digits = 3 - Math.floor(Math.log10(absValue));
        return value.toLocaleString(undefined, {
            maximumFractionDigits: Math.max(digits, 3),
        });
    }
}
