import { getVariantAlleleFrequency } from '../../../shared/lib/MutationUtils';
import { MutationStatus } from './PatientViewMutationsTabUtils';
import { isSampleProfiled } from '../../../shared/lib/isSampleProfiled';
import _ from 'lodash';
import { Mutation, Sample } from 'cbioportal-ts-api-client';
import { CoverageInformation } from '../../resultsView/ResultsViewPageStoreUtils';

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

function splitMutationsBySampleGroup(
    mutations: Mutation[][],
    sampleGroup: { [s: string]: string }
) {
    let groupedMutation: { [s: string]: Mutation[] } = {};
    let groupedMutations: Mutation[][] = [];

    mutations.forEach((mutation, i) => {
        groupedMutation = {};
        mutation.forEach((sample, j) => {
            if (groupedMutation[sampleGroup[sample.sampleId]] === undefined) {
                groupedMutation[sampleGroup[sample.sampleId]] = [];
            }
            //sample.groupByValue = sampleGroup[sample.sampleId];
            groupedMutation[sampleGroup[sample.sampleId]].push(sample);
        });
        for (const m in groupedMutation) {
            groupedMutations.push(groupedMutation[m]);
        }
    });
    return groupedMutations;
}

export function computeRenderData(
    samples: Sample[],
    mutations: Mutation[][],
    sampleIdIndex: { [sampleId: string]: number },
    mutationProfileId: string,
    coverageInformation: CoverageInformation,
    vafTimeline: boolean,
    sampleTimelinePosition: number[],
    groupById: string,
    sampleGroup: { [s: string]: string }
) {
    const grayPoints: IPoint[] = []; // points that are purely interpolated for rendering, dont have data of their own
    const lineData: IPoint[][] = [];

    if (groupById != undefined && groupById != 'none')
        mutations = splitMutationsBySampleGroup(mutations, sampleGroup);

    for (const mergedMutation of mutations) {
        // determine data points in line for this mutation

        // first add data points for each mutation
        let thisLineData: Partial<IPoint>[] = [];
        // keep track of which samples have mutations
        const samplesWithData: { [uniqueSampleKey: string]: boolean } = {};
        for (const mutation of mergedMutation) {
            const sampleKey = mutation.uniqueSampleKey;
            const sampleId = mutation.sampleId;
            const vaf = getVariantAlleleFrequency(mutation);

            if (vaf !== null) {
                // has VAF data

                if (mutation.mutationStatus.toLowerCase() === 'uncalled') {
                    if (mutation.tumorAltCount > 0) {
                        // add point for uncalled mutation with supporting reads
                        thisLineData.push({
                            x:
                                vafTimeline === false
                                    ? sampleIdIndex[sampleId]
                                    : sampleTimelinePosition[
                                          sampleIdIndex[sampleId]
                                      ],
                            y: vaf,
                            sampleId,
                            mutation,
                            mutationStatus:
                                MutationStatus.PROFILED_WITH_READS_BUT_UNCALLED,
                        });
                        samplesWithData[sampleKey] = true;
                    }
                } else {
                    // add point for called mutation with VAF data
                    thisLineData.push({
                        x:
                            vafTimeline === false
                                ? sampleIdIndex[sampleId]
                                : sampleTimelinePosition[
                                      sampleIdIndex[sampleId]
                                  ],
                        y: vaf,
                        sampleId,
                        mutation,
                        mutationStatus: MutationStatus.MUTATED_WITH_VAF,
                    });
                    samplesWithData[sampleKey] = true;
                }
            } else {
                // no VAF data - add point which will be extrapolated
                thisLineData.push({
                    x:
                        vafTimeline === false
                            ? sampleIdIndex[sampleId]
                            : sampleTimelinePosition[sampleIdIndex[sampleId]],
                    sampleId,
                    mutation,
                    mutationStatus: MutationStatus.MUTATED_BUT_NO_VAF,
                });
                samplesWithData[sampleKey] = true;
            }
        }

        const mutation = mergedMutation[0];
        // add data points for samples without mutations
        for (const sample of samples) {
            if (!(sample.uniqueSampleKey in samplesWithData)) {
                if (
                    !isSampleProfiled(
                        sample.uniqueSampleKey,
                        mutationProfileId,
                        mutation.gene.hugoGeneSymbol,
                        coverageInformation
                    )
                ) {
                    // not profiled
                    thisLineData.push({
                        x:
                            vafTimeline === false
                                ? sampleIdIndex[sample.sampleId]
                                : sampleTimelinePosition[
                                      sampleIdIndex[sample.sampleId]
                                  ],
                        sampleId: sample.sampleId,
                        mutation,
                        mutationStatus: MutationStatus.NOT_PROFILED,
                    });
                } else {
                    thisLineData.push({
                        x:
                            vafTimeline === false
                                ? sampleIdIndex[sample.sampleId]
                                : sampleTimelinePosition[
                                      sampleIdIndex[sample.sampleId]
                                  ],
                        y: 0,
                        sampleId: sample.sampleId,
                        mutation,
                        mutationStatus: MutationStatus.PROFILED_BUT_NOT_MUTATED,
                    });
                }
            }
        }
        // sort by sample order
        thisLineData = _.sortBy(thisLineData, d => d.x);
        // interpolate missing y values
        // take out anything from the left and right that dont have data - we'll only interpolate points with data to their left and right
        while (
            thisLineData.length > 0 &&
            !isPointBasedOnRealVAF(thisLineData[0] as IPoint)
        ) {
            thisLineData.shift();
        }
        while (
            thisLineData.length > 0 &&
            !isPointBasedOnRealVAF(thisLineData[
                thisLineData.length - 1
            ] as IPoint)
        ) {
            thisLineData.pop();
        }
        if (thisLineData.length === 0) {
            // skip this mutation if theres no line data left to plot
            continue;
        }
        // interpolate, and pull out interpolated points into gray points array
        const thisLineDataWithoutGrayPoints: IPoint[] = [];
        const thisGrayPoints: IPoint[] = [];
        for (let i = 0; i < thisLineData.length; i++) {
            if (
                i !== 0 &&
                i !== thisLineData.length - 1 &&
                thisLineData[i].y === undefined
            ) {
                // find closest defined data to the left and right
                let leftIndex = 0,
                    rightIndex = 0;
                for (leftIndex = i; leftIndex >= 0; leftIndex--) {
                    if (thisLineData[leftIndex].y !== undefined) {
                        break;
                    }
                }
                for (
                    rightIndex = i;
                    rightIndex <= thisLineData.length - 1;
                    rightIndex++
                ) {
                    if (thisLineData[rightIndex].y !== undefined) {
                        break;
                    }
                }
                const step = 1 / (rightIndex - leftIndex);
                thisLineData[i].y =
                    (i - leftIndex) *
                    step *
                    (thisLineData[leftIndex].y! + thisLineData[rightIndex].y!);
                // add to grayPoints
                thisGrayPoints.push(thisLineData[i] as IPoint);
            } else {
                thisLineDataWithoutGrayPoints.push(thisLineData[i] as IPoint);
            }
        }
        // we know thisLineDataWithoutGrayPoints is nonempty because it could only be empty if every point in
        //  it was gray, in which case it would have been made empty and skipped above.
        grayPoints.push(...thisGrayPoints);
        lineData.push(thisLineDataWithoutGrayPoints);
    }
    return {
        lineData,
        grayPoints,
    };
}
