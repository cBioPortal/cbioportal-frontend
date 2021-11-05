import { scaleLinear, scaleLog } from 'd3-scale';
import _ from 'lodash';

export function getViolinX(
    dataX: number,
    dataBounds: { min: number; max: number },
    plotWidth: number
) {
    // map from data scale to violin scale
    return (
        violinPlotXPadding +
        ((dataX - dataBounds.min) * (plotWidth - 10)) /
            (dataBounds.max - dataBounds.min)
    );
}

function isPowerOfTen(x: number) {
    const str = x.toString();
    return str[0] === '1' && parseFloat(str.substring(1)) === 0;
}
export function getTickValues(
    bounds: { min: number; max: number },
    chartDimensionWidth: number,
    logScale: boolean
) {
    let range = [bounds.min, bounds.max];
    let ret = [...range];
    const numTotalTicks = 2 * chartDimensionWidth;
    const numMiddleTicks = numTotalTicks - 2; // we will always have the start and end as ticks
    if (logScale) {
        range = range.map(Math.exp);
        let middleTicks = scaleLog()
            .domain(range)
            .ticks();
        if (middleTicks.length > numMiddleTicks) {
            // first just take out all non-multiples of ten
            middleTicks = middleTicks.filter(x => x % 10 === 0);
        }
        if (middleTicks.length > numMiddleTicks) {
            // if still too many, filter out non-powers of ten
            middleTicks = middleTicks.filter(isPowerOfTen);
        }
        while (middleTicks.length > numMiddleTicks) {
            // if still too many, iteratively filter out every other tick
            middleTicks = middleTicks.filter((x, index) => index % 2 === 0);
        }
        ret.push(...middleTicks.map(x => Math.log(x + 1))); // need to add 1 to counter the inversion
    } else {
        ret.push(
            ...scaleLinear()
                .domain(range)
                .ticks(2 * chartDimensionWidth - 2)
        );
    }

    ret = _.sortBy(_.uniq(ret));
    return ret;
}

export const violinPlotXPadding = 5;
export const violinPlotSvgHeight = 30;
