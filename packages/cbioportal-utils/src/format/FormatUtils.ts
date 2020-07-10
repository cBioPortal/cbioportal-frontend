export function formatPercentValue(rate: number, fractionDigits: number = 1) {
    const fixed = rate.toFixed(fractionDigits);

    let displayValue = fixed;

    // if the actual value is not zero but the display value is like 0.0, then show instead < 0.1
    if (rate !== 0 && Number(fixed) === 0) {
        displayValue = `< ${1 / Math.pow(10, fractionDigits)}`;
    }

    return displayValue;
}

export function numberOfLeadingDecimalZeros(value: number) {
    return -Math.floor(Math.log10(value) / Math.log10(10) + 1);
}
