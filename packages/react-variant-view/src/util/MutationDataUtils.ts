// functions in this component come from signal

import _ from 'lodash';
import {
    ICountByTumorType,
    IExtendedMutation,
    IMutation,
    ITumorTypeDecomposition,
} from '../model/Mutation';

export function isGermlineMutation(mutation: IMutation) {
    return mutation.mutationStatus.toLowerCase() === 'germline';
}

export function isSomaticMutation(mutation: IMutation) {
    return mutation.mutationStatus.toLowerCase() === 'somatic';
}

export function isPathogenicMutation(mutation: IMutation) {
    return mutation.pathogenic === '1';
}

export function extendMutations(mutations: IMutation[]): IExtendedMutation[] {
    // filter out biallelic mutations, since their count is already included in germline mutations
    // we only use biallelic mutations to add frequency values and additional count fields
    return mutations.map(mutation => {
        const isSomatic = isSomaticMutation(mutation);
        const isGermline = isGermlineMutation(mutation);
        const isPathogenic = isPathogenicMutation(mutation);

        const pathogenicGermlineFrequency =
            isGermline && isPathogenic
                ? calculateOverallFrequency(mutation.countsByTumorType)
                : null;
        const biallelicGermlineFrequency =
            isGermline && mutation.biallelicCountsByTumorType
                ? calculateOverallFrequency(mutation.biallelicCountsByTumorType)
                : null;

        const tumorTypeDecomposition: ITumorTypeDecomposition[] = generateTumorTypeDecomposition(
            mutation.countsByTumorType,
            mutation.biallelicCountsByTumorType,
            mutation.qcPassCountsByTumorType
        );

        return {
            ...mutation,
            tumorTypeDecomposition,
            somaticFrequency: isSomatic
                ? calculateOverallFrequency(mutation.countsByTumorType)
                : null,
            germlineFrequency: isGermline
                ? calculateOverallFrequency(mutation.countsByTumorType)
                : null,
            pathogenicGermlineFrequency,
            biallelicGermlineFrequency,
            biallelicPathogenicGermlineFrequency: isPathogenic
                ? biallelicGermlineFrequency
                : null,
            ratioBiallelicPathogenic:
                isPathogenic &&
                mutation.biallelicCountsByTumorType &&
                mutation.qcPassCountsByTumorType
                    ? calculateTotalVariantRatio(
                          mutation.biallelicCountsByTumorType,
                          mutation.qcPassCountsByTumorType
                      )
                    : null,
        };
    });
}

export function generateTumorTypeDecomposition(
    countsByTumorType: ICountByTumorType[],
    biallelicCountsByTumorType?: ICountByTumorType[],
    qcPassCountsByTumorType?: ICountByTumorType[]
) {
    let biallelicTumorMap: { [tumorType: string]: ICountByTumorType };
    let qcPassTumorMap: { [tumorType: string]: ICountByTumorType };

    if (biallelicCountsByTumorType && qcPassCountsByTumorType) {
        biallelicTumorMap = _.keyBy(biallelicCountsByTumorType, 'tumorType');
        qcPassTumorMap = _.keyBy(qcPassCountsByTumorType, 'tumorType');
    }

    return countsByTumorType.map(counts => ({
        ...counts,
        frequency: counts.variantCount / counts.tumorTypeCount,
        biallelicRatio:
            biallelicTumorMap && qcPassTumorMap
                ? calcBiallelicRatio(
                      biallelicTumorMap[counts.tumorType],
                      qcPassTumorMap[counts.tumorType]
                  )
                : null,
        biallelicVariantCount:
            biallelicTumorMap && biallelicTumorMap[counts.tumorType]
                ? biallelicTumorMap[counts.tumorType].variantCount
                : 0,
    }));
}

export function calcBiallelicRatio(
    biallelicCountByTumorType?: ICountByTumorType,
    qcPassCountByTumorType?: ICountByTumorType
) {
    const ratio =
        (biallelicCountByTumorType
            ? biallelicCountByTumorType.variantCount
            : 0) /
        (qcPassCountByTumorType ? qcPassCountByTumorType.variantCount : 0);

    return _.isNaN(ratio) ? null : ratio;
}

function totalVariants(counts: ICountByTumorType[]) {
    return (
        counts.map(c => c.variantCount).reduce((acc, curr) => acc + curr, 0) ||
        0
    );
}

function totalSamples(counts: ICountByTumorType[]) {
    return (
        counts
            .map(c => c.tumorTypeCount)
            .reduce((acc, curr) => acc + curr, 0) || 0
    );
}

export function calculateOverallFrequency(counts: ICountByTumorType[]) {
    return totalVariants(counts) / totalSamples(counts);
}

export function calculateTotalVariantRatio(
    counts1: ICountByTumorType[],
    counts2: ICountByTumorType[]
) {
    return totalVariants(counts1) / totalVariants(counts2);
}
