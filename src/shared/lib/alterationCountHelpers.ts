import {
    AlterationTypeConstants,
    ExtendedAlteration,
    ExtendedSample,
} from '../../pages/resultsView/ResultsViewPageStore';
import {
    IAlterationCountMap,
    IAlterationData,
} from '../../pages/resultsView/cancerSummary/CancerSummaryContent';
import { Sample, MolecularProfile } from 'cbioportal-ts-api-client';
import * as _ from 'lodash';
import { CoverageInformation } from 'pages/resultsView/ResultsViewPageStoreUtils';
import { isSampleProfiledInMultiple } from './isSampleProfiled';

export function getAlterationCountsForCancerTypesByGene(
    alterationsByGeneBySampleKey: {
        [geneName: string]: { [sampleId: string]: ExtendedAlteration[] };
    },
    samplesExtendedWithClinicalData: ExtendedSample[],
    groupByProperty: keyof ExtendedSample,
    molecularProfileIdsByAlterationType: {
        [alterationType: string]: MolecularProfile[];
    },
    coverageInformation: CoverageInformation
) {
    const ret = _.mapValues(
        alterationsByGeneBySampleKey,
        (
            alterationsBySampleId: { [sampleId: string]: ExtendedAlteration[] },
            gene: string
        ) => {
            const samplesByCancerType = _.groupBy(
                samplesExtendedWithClinicalData,
                (sample: ExtendedSample) => {
                    return sample[groupByProperty];
                }
            );
            return countAlterationOccurences(
                samplesByCancerType,
                alterationsBySampleId,
                molecularProfileIdsByAlterationType,
                coverageInformation,
                gene
            );
        }
    );
    return ret;
}

export function getAlterationCountsForCancerTypesForAllGenes(
    alterationsByGeneBySampleKey: {
        [geneName: string]: { [sampleId: string]: ExtendedAlteration[] };
    },
    samplesExtendedWithClinicalData: ExtendedSample[],
    groupByProperty: keyof ExtendedSample,
    molecularProfileIdsByAlterationType: {
        [alterationType: string]: MolecularProfile[];
    },
    coverageInformation: CoverageInformation
) {
    const samplesByCancerType = _.groupBy(
        samplesExtendedWithClinicalData,
        (sample: ExtendedSample) => sample[groupByProperty]
    );
    const flattened = _.flatMap(alterationsByGeneBySampleKey, map => map);

    // NEED TO FLATTEN and then merge this to get all alteration by sampleId
    function customizer(objValue: any, srcValue: any) {
        if (_.isArray(objValue)) {
            return objValue.concat(srcValue);
        }
    }

    const merged: {
        [uniqueSampleKey: string]: ExtendedAlteration[];
    } = _.mergeWith({}, ...flattened, customizer) as {
        [uniqueSampleKey: string]: ExtendedAlteration[];
    };
    return countAlterationOccurences(
        samplesByCancerType,
        merged,
        molecularProfileIdsByAlterationType,
        coverageInformation
    );
}

/*
 * accepts samples and alterations to those samples and produces counts keyed by grouping type
 * (e.g. cancerType, cancerTypeDetailed, cancerStudy)
 */
export function countAlterationOccurences(
    groupedSamples: { [groupingProperty: string]: ExtendedSample[] },
    alterationsBySampleId: { [id: string]: ExtendedAlteration[] },
    molecularProfileIdsByAlterationType: {
        [alterationType: string]: MolecularProfile[];
    },
    coverageInformation: CoverageInformation,
    hugoGeneSymbol?: string
) {
    return _.mapValues(
        groupedSamples,
        (samples: ExtendedSample[], cancerType: string) => {
            const counts: IAlterationCountMap = {
                mutated: 0,
                amp: 0, // 2
                homdel: 0, // -2
                hetloss: 0, // -1
                gain: 0, // 1
                fusion: 0,
                mrnaExpressionHigh: 0,
                mrnaExpressionLow: 0,
                protExpressionHigh: 0,
                protExpressionLow: 0,
                multiple: 0,
            };

            const profiledTypeCounts = {
                mutation: 0,
                cna: 0,
                expression: 0,
                protein: 0,
            };

            const notProfiledSamplesCounts = {
                mutation: 0,
                cna: 0,
                expression: 0,
                protein: 0,
            };

            const ret: IAlterationData = {
                profiledSampleTotal: 0,
                alterationTotal: 0,
                alterationTypeCounts: counts,
                alteredSampleCount: 0,
                parentCancerType: samples[0].cancerType,
                profiledSamplesCounts: profiledTypeCounts,
                notProfiledSamplesCounts: notProfiledSamplesCounts,
            };

            // for each sample in cancer type
            _.forEach(samples, (sample: Sample) => {
                let isSampleProfiled = false;

                _.forEach(
                    molecularProfileIdsByAlterationType,
                    (molecularProfiles, alterationType) => {
                        const profiled = _.some(
                            isSampleProfiledInMultiple(
                                sample.uniqueSampleKey,
                                _.map(
                                    molecularProfiles,
                                    molecularProfile =>
                                        molecularProfile.molecularProfileId
                                ),
                                coverageInformation,
                                hugoGeneSymbol
                            )
                        );
                        isSampleProfiled = isSampleProfiled || profiled;
                        switch (alterationType) {
                            case AlterationTypeConstants.COPY_NUMBER_ALTERATION: {
                                profiled
                                    ? profiledTypeCounts.cna++
                                    : notProfiledSamplesCounts.cna++;
                                break;
                            }
                            case AlterationTypeConstants.MRNA_EXPRESSION: {
                                profiled
                                    ? profiledTypeCounts.expression++
                                    : notProfiledSamplesCounts.expression++;
                                break;
                            }
                            case AlterationTypeConstants.PROTEIN_LEVEL: {
                                profiled
                                    ? profiledTypeCounts.protein++
                                    : notProfiledSamplesCounts.protein++;
                                break;
                            }
                            case AlterationTypeConstants.MUTATION_EXTENDED: {
                                profiled
                                    ? profiledTypeCounts.mutation++
                                    : notProfiledSamplesCounts.mutation++;
                                break;
                            }
                        }
                    }
                );

                if (isSampleProfiled) {
                    ret.profiledSampleTotal += 1;
                }
                // there are alterations corresponding to that sample
                if (sample.uniqueSampleKey in alterationsBySampleId) {
                    const alterations =
                        alterationsBySampleId[sample.uniqueSampleKey];

                    //a sample could have multiple mutations.  we only want to to count one
                    const uniqueAlterations = _.uniqBy(
                        alterations,
                        alteration => alteration.alterationType
                    );

                    ret.alterationTotal += uniqueAlterations.length;

                    // if the sample has at least one alteration, it's altered so
                    // increment alteredSampleTotal
                    if (uniqueAlterations.length > 0) {
                        //
                        ret.alteredSampleCount += 1;
                    }

                    // if we have multiple alterations, we just register this as "multiple" and do NOT add
                    // individual alterations to their respective counts
                    if (uniqueAlterations.length > 1) {
                        counts.multiple++;
                    } else {
                        // for each alteration, determine what it's type is and increment the counts for this set of samples
                        _.forEach(
                            uniqueAlterations,
                            (alteration: ExtendedAlteration) => {
                                switch (alteration.alterationType) {
                                    case AlterationTypeConstants.COPY_NUMBER_ALTERATION:
                                        // to do: type oqlfilter so that we can be sure alterationSubType is truly key of interface
                                        counts[
                                            alteration.alterationSubType as keyof IAlterationCountMap
                                        ]++;
                                        break;
                                    case AlterationTypeConstants.MRNA_EXPRESSION:
                                        if (
                                            alteration.alterationSubType ===
                                            'high'
                                        )
                                            counts.mrnaExpressionHigh++;
                                        if (
                                            alteration.alterationSubType ===
                                            'low'
                                        )
                                            counts.mrnaExpressionLow++;
                                        break;
                                    case AlterationTypeConstants.PROTEIN_LEVEL:
                                        if (
                                            alteration.alterationSubType ===
                                            'high'
                                        )
                                            counts.protExpressionHigh++;
                                        if (
                                            alteration.alterationSubType ===
                                            'low'
                                        )
                                            counts.protExpressionLow++;
                                        break;
                                    case AlterationTypeConstants.MUTATION_EXTENDED:
                                        counts.mutated++;
                                        break;
                                    case AlterationTypeConstants.FUSION:
                                        counts.fusion++;
                                        break;
                                }
                            }
                        );
                    }
                }
            });
            return ret;
        }
    );
}
