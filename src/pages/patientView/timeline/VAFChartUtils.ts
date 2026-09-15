import { getVariantAlleleFrequency } from '../../../shared/lib/MutationUtils';
import { MutationStatus } from '../mutation/PatientViewMutationsTabUtils';
import { isSampleProfiled } from '../../../shared/lib/isSampleProfiled';
import { Mutation, Sample } from 'cbioportal-ts-api-client';
import { CoverageInformation } from '../../../shared/lib/GenePanelUtils';
import { GROUP_BY_NONE } from './/VAFChartControls';
import { numberOfLeadingDecimalZeros } from 'cbioportal-utils';

const MIN_LOG_ARG = 0.001;

export interface IPoint {
    x: number;
    y: number;
    sampleId: string;
    mutation: Mutation;
    mutationStatus: MutationStatus;
}

function isPointBasedOnRealVAF(d: { mutationStatus: MutationStatus }) {
    return (
        d.mutationStatus === MutationStatus.MUTATED_WITH_VAF ||
        d.mutationStatus === MutationStatus.PROFILED_WITH_READS_BUT_UNCALLED
    );
}

function getRenderableLineBounds(thisLineData: Partial<IPoint>[]) {
    let firstRealPointIndex = -1;
    let lastRealPointIndex = -1;

    for (let index = 0; index < thisLineData.length; index++) {
        if (isPointBasedOnRealVAF(thisLineData[index] as IPoint)) {
            firstRealPointIndex = index;
            break;
        }
    }

    for (let index = thisLineData.length - 1; index >= 0; index--) {
        if (isPointBasedOnRealVAF(thisLineData[index] as IPoint)) {
            lastRealPointIndex = index;
            break;
        }
    }

    return {
        firstRealPointIndex,
        lastRealPointIndex,
    };
}

function partitionInterpolatedLineData(thisLineData: Partial<IPoint>[]) {
    const { firstRealPointIndex, lastRealPointIndex } =
        getRenderableLineBounds(thisLineData);

    if (firstRealPointIndex < 0 || lastRealPointIndex < 0) {
        return {
            grayPoints: [] as IPoint[],
            lineData: [] as IPoint[],
        };
    }

    const thisLineDataWithoutGrayPoints: IPoint[] = [];
    const thisGrayPoints: IPoint[] = [];
    let leftDefinedIndex = firstRealPointIndex;
    let index = firstRealPointIndex;

    while (index <= lastRealPointIndex) {
        const point = thisLineData[index];

        if (point.y !== undefined || index === lastRealPointIndex) {
            thisLineDataWithoutGrayPoints.push(point as IPoint);
            leftDefinedIndex = index;
            index += 1;
            continue;
        }

        let rightDefinedIndex = index + 1;
        while (
            rightDefinedIndex <= lastRealPointIndex &&
            thisLineData[rightDefinedIndex].y === undefined
        ) {
            rightDefinedIndex += 1;
        }

        const step = 1 / (rightDefinedIndex - leftDefinedIndex);
        const leftValue = thisLineData[leftDefinedIndex].y!;
        const rightValue = thisLineData[rightDefinedIndex].y!;

        while (index < rightDefinedIndex) {
            const interpolatedPoint = thisLineData[index] as IPoint;
            interpolatedPoint.y =
                (index - leftDefinedIndex) * step * (leftValue + rightValue);
            thisGrayPoints.push(interpolatedPoint);
            index += 1;
        }
    }

    return {
        grayPoints: thisGrayPoints,
        lineData: thisLineDataWithoutGrayPoints,
    };
}

export function splitMutationsBySampleGroup(
    mutations: Mutation[][],
    sampleGroup: { [s: string]: string }
) {
    const groupedMutations: Mutation[][] = [];

    for (let mutationIndex = 0; mutationIndex < mutations.length; mutationIndex += 1) {
        const mutation = mutations[mutationIndex];
        const groupedMutation: { [s: string]: Mutation[] } = {};
        const orderedGroups: string[] = [];
        for (let sampleIndex = 0; sampleIndex < mutation.length; sampleIndex += 1) {
            const sample = mutation[sampleIndex];
            const group = sampleGroup[sample.sampleId];
            if (groupedMutation[group] === undefined) {
                groupedMutation[group] = [];
                orderedGroups.push(group);
            }
            groupedMutation[group].push(sample);
        }
        for (let groupIndex = 0; groupIndex < orderedGroups.length; groupIndex += 1) {
            groupedMutations.push(groupedMutation[orderedGroups[groupIndex]]);
        }
    }
    return groupedMutations;
}

export function computeRenderData(
    samples: Sample[],
    mutations: Mutation[][],
    sampleIdIndex: { [sampleId: string]: number },
    mutationProfileId: string,
    coverageInformation: CoverageInformation,
    groupByOption: string,
    sampleIdToClinicalValue: { [sampleId: string]: string }
) {
    const grayPoints: IPoint[] = []; // points that are purely interpolated for rendering, dont have data of their own
    const lineData: IPoint[][] = [];
    const profilingStatusCache = new Map<string, boolean>();
    const groupByEnabled = !!groupByOption && groupByOption !== GROUP_BY_NONE;
    const groupedMutations = groupByEnabled
        ? splitMutationsBySampleGroup(mutations, sampleIdToClinicalValue)
        : mutations;

    const isSampleMutationProfiled = (
        sampleUniqueSampleKey: string,
        hugoGeneSymbol: string
    ) => {
        const cacheKey = `${sampleUniqueSampleKey}::${hugoGeneSymbol}`;
        const cached = profilingStatusCache.get(cacheKey);
        if (cached !== undefined) {
            return cached;
        }

        const profiled = isSampleProfiled(
            sampleUniqueSampleKey,
            mutationProfileId,
            hugoGeneSymbol,
            coverageInformation
        );
        profilingStatusCache.set(cacheKey, profiled);
        return profiled;
    };

    for (
        let mergedMutationIndex = 0;
        mergedMutationIndex < groupedMutations.length;
        mergedMutationIndex += 1
    ) {
        const mergedMutation = groupedMutations[mergedMutationIndex];
        // determine data points in line for this mutation

        // first add data points for each mutation
        const thisLineData: Partial<IPoint>[] = [];
        // keep track of which samples have mutations
        const samplesWithData = new Set<string>();
        const samplesWithDataGroup = groupByEnabled
            ? sampleIdToClinicalValue[mergedMutation[0].sampleId]
            : undefined;

        for (
            let mutationIndex = 0;
            mutationIndex < mergedMutation.length;
            mutationIndex += 1
        ) {
            const mutation = mergedMutation[mutationIndex];
            const sampleKey = mutation.uniqueSampleKey;
            const sampleId = mutation.sampleId;
            const vafReport = getVariantAlleleFrequency(mutation);
            const x = sampleIdIndex[sampleId];
            if (vafReport !== null) {
                // has VAF data
                const mutationStatus = mutation.mutationStatus;
                const isUncalledMutation =
                    typeof mutationStatus === 'string' &&
                    mutationStatus.toLowerCase() === 'uncalled';
                if (isUncalledMutation) {
                    if (mutation.tumorAltCount > 0) {
                        // add point for uncalled mutation with supporting reads
                        thisLineData.push({
                            x,
                            y: vafReport.vaf,
                            sampleId,
                            mutation,
                            mutationStatus:
                                MutationStatus.PROFILED_WITH_READS_BUT_UNCALLED,
                        });
                        samplesWithData.add(sampleKey);
                    }
                } else {
                    // add point for called mutation with VAF data
                    thisLineData.push({
                        x,
                        y: vafReport.vaf,
                        sampleId,
                        mutation,
                        mutationStatus: MutationStatus.MUTATED_WITH_VAF,
                    });
                    samplesWithData.add(sampleKey);
                }
            } else {
                // no VAF data - add point which will be extrapolated
                thisLineData.push({
                    x,
                    sampleId,
                    mutation,
                    mutationStatus: MutationStatus.MUTATED_BUT_NO_VAF,
                });
                samplesWithData.add(sampleKey);
            }
        }

        const mutation = mergedMutation[0];
        // add data points for samples without mutations
        for (let sampleIndex = 0; sampleIndex < samples.length; sampleIndex += 1) {
            const sample = samples[sampleIndex];
            if (!samplesWithData.has(sample.uniqueSampleKey)) {
                // check if it is in the same group as samplesWithData
                if (
                    !groupByEnabled ||
                    sampleIdToClinicalValue[sample.sampleId] ==
                        samplesWithDataGroup
                ) {
                    if (
                        !isSampleMutationProfiled(
                            sample.uniqueSampleKey,
                            mutation.gene.hugoGeneSymbol
                        )
                    ) {
                        // not profiled
                        thisLineData.push({
                            x: sampleIdIndex[sample.sampleId],
                            sampleId: sample.sampleId,
                            mutation,
                            mutationStatus: MutationStatus.NOT_PROFILED,
                        });
                    } else {
                        thisLineData.push({
                            x: sampleIdIndex[sample.sampleId],
                            y: 0,
                            sampleId: sample.sampleId,
                            mutation,
                            mutationStatus:
                                MutationStatus.PROFILED_BUT_NOT_MUTATED,
                        });
                    }
                }
            }
        }
        // sort by sample order
        thisLineData.sort((left, right) => (left.x || 0) - (right.x || 0));
        const {
            grayPoints: thisGrayPoints,
            lineData: thisLineDataWithoutGrayPoints,
        } = partitionInterpolatedLineData(thisLineData);

        if (thisLineDataWithoutGrayPoints.length === 0) {
            // skip this mutation if theres no line data left to plot
            continue;
        }
        grayPoints.push(...thisGrayPoints);
        lineData.push(thisLineDataWithoutGrayPoints);
    }
    return {
        lineData,
        grayPoints,
    };
}

export function getYAxisTickmarks(
    minY: number,
    maxY: number,
    numTicks: number = 6
): number[] {
    if (numTicks === 0) return [minY, maxY];
    const tickmarkSize = (maxY - minY) / (numTicks - 1);
    const tickMarks = [minY];
    for (let i = 1; i < numTicks; i++) {
        const rawValue = tickMarks[i - 1] + tickmarkSize;
        tickMarks[i] = rawValue;
    }
    return tickMarks;
}

/**
 * Decimal adjustment of a number.
 * from: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/floor
 * @param {String}  type  The type of adjustment.
 * @param {Number}  value The number.
 * @param {Integer} exp   The exponent (the 10 logarithm of the adjustment base).
 * @returns {Number} The adjusted value.
 */
function decimalAdjust(
    type: 'floor' | 'ceil' | 'round',
    value: number,
    exp: number
) {
    // If the exp is undefined or zero...
    if (typeof exp === 'undefined' || +exp === 0) {
        return Math[type](value);
    }
    value = +value;
    exp = +exp;
    // If the value is not a number or the exp is not an integer...
    if (isNaN(value) || !(typeof exp === 'number' && exp % 1 === 0)) {
        return NaN;
    }
    // Shift
    let shiftStr = value.toString().split('e');
    let shiftNum = Math[type](
        +(shiftStr[0] + 'e' + (shiftStr[1] ? +shiftStr[1] - exp : -exp))
    );
    // Shift back
    shiftStr = shiftNum.toString().split('e');
    return +(shiftStr[0] + 'e' + (shiftStr[1] ? +shiftStr[1] + exp : exp));
}

// Convenience functions for decimal round, floor and ceil
export function round10(value: number, exp: number) {
    return decimalAdjust('round', value, exp);
}
export function floor10(value: number, exp: number) {
    return decimalAdjust('floor', value, exp);
}
export function ceil10(value: number, exp: number) {
    return decimalAdjust('ceil', value, exp);
}

export function yValueScaleFunction(
    minTickmarkValue: number,
    maxTickmarkValue: number,
    plotRange: number,
    log10Transform: boolean | undefined
): (value: number) => number {
    const yPadding = 10;

    if (maxTickmarkValue !== undefined && minTickmarkValue !== undefined) {
        // when truncating the range of values is distributed
        // differently over the svg vertical space
        const rangeMinusPadding = plotRange - yPadding * 2;

        if (log10Transform) {
            const logMinTickmark = Math.log10(
                Math.max(MIN_LOG_ARG, minTickmarkValue)
            );
            const logMaxTickmark = Math.log10(
                Math.max(MIN_LOG_ARG, maxTickmarkValue)
            );
            const valueRange = logMaxTickmark - logMinTickmark;
            const linearTransformationScale = rangeMinusPadding / valueRange;

            return (y: number) => {
                const logY = Math.log10(Math.max(MIN_LOG_ARG, y));
                // translate so that min tickmark represents the 0 line
                const translatedY = logY - logMinTickmark;
                return (
                    plotRange -
                    yPadding -
                    translatedY * linearTransformationScale
                );
            };
        } else {
            const valueRange = maxTickmarkValue - minTickmarkValue;
            const linearTransformationScale = rangeMinusPadding / valueRange;

            return (y: number) => {
                // translate so that min tickmark represents the 0 line
                const translatedY = y - minTickmarkValue;
                return (
                    plotRange -
                    yPadding -
                    translatedY * linearTransformationScale
                );
            };
        }
    }
    return (y: number) => y;
}

// Examples: 0 -> 0, 0.1 -> 0, 0.01 -> 1, 0.0001 -> 3
export function numLeadingDecimalZeros(y: number) {
    if (y == 0 || y >= 0.1) return 0;
    return numberOfLeadingDecimalZeros(y);
}

/**
 * Try to return tick labels with fractional part just long enogh to disttinguish them.
 * It tries up to 3th positions in fractional part. Otherwise return scientific representation of original numbers.
 * Function returns distinct labels.
 * If input contains duplicates function deduplicates and return less labels that amount of input numbers.
 * @param nums array of ticks as numbers
 */
export function minimalDistinctTickStrings(nums: number[]): string[] {
    const distinctNums: number[] = [];
    const seen = new Set<number>();

    for (let index = 0; index < nums.length; index += 1) {
        const num = nums[index];
        if (!seen.has(num)) {
            seen.add(num);
            distinctNums.push(num);
        }
    }

    let fromPos = Number.POSITIVE_INFINITY;
    for (let index = 0; index < distinctNums.length; index += 1) {
        const num = distinctNums[index];
        const digitsToShow = Number.isInteger(num)
            ? 0
            : numLeadingDecimalZeros(num) + 1;
        if (digitsToShow < fromPos) {
            fromPos = digitsToShow;
        }
    }
    const toPos = 3;

    for (let pos = fromPos; pos <= toPos; pos++) {
        const labels = new Array<string>(distinctNums.length);
        const seenLabels = new Set<string>();
        let allDistinct = true;

        for (let index = 0; index < distinctNums.length; index += 1) {
            const label = distinctNums[index].toFixed(pos);
            labels[index] = label;
            if (seenLabels.has(label)) {
                allDistinct = false;
            } else {
                seenLabels.add(label);
            }
        }

        if (allDistinct) {
            return labels;
        }
    }

    const labels = new Array<string>(distinctNums.length);
    for (let index = 0; index < distinctNums.length; index += 1) {
        labels[index] = distinctNums[index].toExponential();
    }
    return labels;
}
