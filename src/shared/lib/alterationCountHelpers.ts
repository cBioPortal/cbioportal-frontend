import {
    AlterationTypeConstants, ExtendedAlteration,
    ExtendedSample
} from "../../pages/resultsView/ResultsViewPageStore";
import {IAlterationCountMap, IAlterationData} from "../../pages/resultsView/cancerSummary/CancerSummaryContent";
import {Sample} from "../api/generated/CBioPortalAPI";
import * as _ from 'lodash';

export function getAlterationCountsForCancerTypesByGene(alterationsByGeneBySampleKey:{ [geneName:string]: {[sampleId: string]: ExtendedAlteration[]} },
                                                        samplesExtendedWithClinicalData:ExtendedSample[],
                                                        groupByProperty: keyof ExtendedSample){
    const ret = _.mapValues(alterationsByGeneBySampleKey, (alterationsBySampleId: {[sampleId: string]: ExtendedAlteration[]}, gene: string) => {
        const samplesByCancerType = _.groupBy(samplesExtendedWithClinicalData,(sample:ExtendedSample)=>{
            return sample[groupByProperty];
        });
        return countAlterationOccurences(samplesByCancerType, alterationsBySampleId);
    });
    return ret;
}

export function getAlterationCountsForCancerTypesForAllGenes(alterationsByGeneBySampleKey:{ [geneName:string]: {[sampleId: string]: ExtendedAlteration[]} },
                                                             samplesExtendedWithClinicalData:ExtendedSample[],
                                                             groupByProperty: keyof ExtendedSample){

    const samplesByCancerType = _.groupBy(samplesExtendedWithClinicalData,(sample:ExtendedSample)=>{
        return sample[groupByProperty];
    });
    const flattened = _.flatMap(alterationsByGeneBySampleKey, (map) => map);

    // NEED TO FLATTEN and then merge this to get all alteration by sampleId
    function customizer(objValue: any, srcValue: any) {
        if (_.isArray(objValue)) {
            return objValue.concat(srcValue);
        }
    }
    const merged: { [uniqueSampleKey: string]: ExtendedAlteration[] } =
        (_.mergeWith({}, ...flattened, customizer) as { [uniqueSampleKey: string]: ExtendedAlteration[] });
    return countAlterationOccurences(samplesByCancerType, merged);

}

/*
 * accepts samples and alterations to those samples and produces counts keyed by grouping type
 * (e.g. cancerType, cancerTypeDetailed, cancerStudy)
 */
export function countAlterationOccurences(groupedSamples: {[groupingProperty: string]: ExtendedSample[]}, alterationsBySampleId: {[id: string]: ExtendedAlteration[]}):{ [groupingProperty:string]:IAlterationData } {

    return _.mapValues(groupedSamples, (samples: ExtendedSample[], cancerType: string) => {

        const counts: IAlterationCountMap = {
            mutated: 0,
            amp: 0, // 2
            homdel: 0, // -2
            hetloss: 0, // -1
            gain:0, // 1
            fusion: 0,
            mrnaExpressionUp: 0,
            mrnaExpressionDown: 0,
            protExpressionUp: 0,
            protExpressionDown: 0,
            multiple: 0,
        };

        const ret: IAlterationData = {
            sampleTotal:samples.length,
            alterationTotal:0,
            alterationTypeCounts:counts,
            alteredSampleCount:0,
            parentCancerType:samples[0].cancerType
        };

        // for each sample in cancer type
        _.forEach(samples, (sample: Sample) => {
            // there are alterations corresponding to that sample
            if (sample.uniqueSampleKey in alterationsBySampleId) {

                const alterations = alterationsBySampleId[sample.uniqueSampleKey];

                //a sample could have multiple mutations.  we only want to to count one
                const uniqueAlterations = _.uniqBy(alterations, (alteration) => alteration.alterationType);

                ret.alterationTotal += uniqueAlterations.length;

                // if the sample has at least one alteration, it's altered so
                // increment alteredSampleTotal
                if (uniqueAlterations.length > 0) { //
                    ret.alteredSampleCount+=1;
                }

                // if we have multiple alterations, we just register this as "multiple" and do NOT add
                // individual alterations to their respective counts
                if (uniqueAlterations.length > 1) {
                    counts.multiple++;
                } else {

                    // for each alteration, determine what it's type is and increment the counts for this set of samples
                    _.forEach(uniqueAlterations, (alteration: ExtendedAlteration) => {
                        switch (alteration.alterationType) {
                            case AlterationTypeConstants.COPY_NUMBER_ALTERATION:
                                // to do: type oqlfilter so that we can be sure alterationSubType is truly key of interface
                                counts[(alteration.alterationSubType as keyof IAlterationCountMap)]++;
                                break;
                            case AlterationTypeConstants.MRNA_EXPRESSION:
                                if (alteration.alterationSubType === 'up') counts.mrnaExpressionUp++;
                                if (alteration.alterationSubType === 'down') counts.mrnaExpressionDown++;
                                break;
                            case AlterationTypeConstants.PROTEIN_LEVEL:
                                if (alteration.alterationSubType === 'up') counts.protExpressionUp++;
                                if (alteration.alterationSubType === 'down') counts.protExpressionDown++;
                                break;
                            case AlterationTypeConstants.MUTATION_EXTENDED:
                                counts.mutated++;
                                break;
                            case AlterationTypeConstants.FUSION:
                                counts.fusion++;
                                break;

                        }

                    });
                }

            }

        });

        return ret;


    });

}