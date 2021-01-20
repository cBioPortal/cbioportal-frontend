export function toConditionalPrecision(number: number, precision: number, threshold: number): string {

    if (0.000001 <= number && number < threshold) {
        return number.toExponential(precision);
    }

    return number.toPrecision(precision);
};