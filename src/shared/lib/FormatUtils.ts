export function toPrecision(value:number, precision:number, threshold:number)
{
    // round to precision significant figures
    // with threshold being the upper bound on the numbers that are
    // rewritten in exponential notation

    if (0.000001 <= value && value < threshold)
        return value.toExponential(precision);

    let ret = value.toPrecision(precision);
    //if (ret.indexOf(".")!==-1)
    //    ret = ret.replace(/\.?0+$/,'');

    return ret;
}
