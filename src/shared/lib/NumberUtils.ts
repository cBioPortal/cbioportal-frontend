export function toConditionalPrecision(number: number, precision: number, threshold: number): string {

    if (0.000001 <= number && number < threshold) {
        return number.toExponential(precision);
    }

    return number.toPrecision(precision);
};

/** will return false if number is null
 * used to test FACETS data values which are imported into database as MIN_FLOAT when "NA"
 */
export function floatValueIsNA(number: number): boolean {
    const minFloatValue: number = 1.0e-44;
    return (number === undefined || (number > 0 && number < minFloatValue));
}
