export function toConditionalPrecision(number: number, precision: number, threshold: number): string {

    if (0.000001 <= number && number < threshold) {
        return number.toExponential(precision);
    }

    return number.toPrecision(precision);
};

export function toConditionalPrecisionWithMinimum(
    positiveNumber:number,
    precision:number,
    precisionThreshold:number,
    minimumExponent:number
):string {
    if (positiveNumber === 0 || Math.log10(positiveNumber) < minimumExponent) {
        return `< 10^${minimumExponent}`;
    } else {
        return toConditionalPrecision(positiveNumber, precision, precisionThreshold);
    }
}