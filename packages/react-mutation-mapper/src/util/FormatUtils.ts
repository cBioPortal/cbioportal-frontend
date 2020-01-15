export function formatPercentValue(rate: number, fractionDigits: number = 1)
{
    const fixed = rate.toFixed(fractionDigits);

    let displayValue = fixed;

    // if the actual value is not zero but the display value is like 0.0, then show instead < 0.1
    if (rate !== 0 && Number(fixed) === 0) {
        displayValue = `< ${1 / Math.pow(10, fractionDigits)}`;
    }

    return displayValue;
}

export function numberOfLeadingDecimalZeros(value: number) {
    return -Math.floor( (Math.log10(value) / Math.log10(10)) + 1);
}

export function significantDigits(data: number, length: number) {
    // data: the original number, length: how many significant digits in return
    // refer to: https://stackoverflow.com/questions/27220908
    if (data === 0) {
        return data;
    }
    var numDigits = Math.ceil(Math.log10(Math.abs(data)));
    var rounded =
        Math.round(data * Math.pow(10, length - numDigits)) *
        Math.pow(10, numDigits - length);
    return rounded.toFixed(Math.max(length - numDigits, 0));
}