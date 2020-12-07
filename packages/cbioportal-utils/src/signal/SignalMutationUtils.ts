import { CountByTumorType, SignalMutation } from 'genome-nexus-ts-api-client';
import _ from 'lodash';
import {
    IExtendedSignalMutation,
    ISignalTumorTypeDecomposition,
} from '../model/SignalMutation';

export function isGermlineMutation(mutation: SignalMutation) {
    return mutation.mutationStatus.toLowerCase() === 'germline';
}

export function isSomaticMutation(mutation: SignalMutation) {
    return mutation.mutationStatus.toLowerCase() === 'somatic';
}

export function isPathogenicMutation(mutation: SignalMutation) {
    return mutation.pathogenic === '1';
}

export function extendMutations(
    mutations: SignalMutation[]
): IExtendedSignalMutation[] {
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

        const tumorTypeDecomposition: ISignalTumorTypeDecomposition[] = generateTumorTypeDecomposition(
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
    countsByTumorType: CountByTumorType[],
    biallelicCountsByTumorType?: CountByTumorType[],
    qcPassCountsByTumorType?: CountByTumorType[]
) {
    let biallelicTumorMap: { [tumorType: string]: CountByTumorType };
    let qcPassTumorMap: { [tumorType: string]: CountByTumorType };

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
    biallelicCountByTumorType?: CountByTumorType,
    qcPassCountByTumorType?: CountByTumorType
) {
    const ratio =
        (biallelicCountByTumorType
            ? biallelicCountByTumorType.variantCount
            : 0) /
        (qcPassCountByTumorType ? qcPassCountByTumorType.variantCount : 0);

    return _.isNaN(ratio) ? null : ratio;
}

function totalVariants(counts: CountByTumorType[]) {
    return (
        counts.map(c => c.variantCount).reduce((acc, curr) => acc + curr, 0) ||
        0
    );
}

function totalSamples(counts: CountByTumorType[]) {
    return (
        counts
            .map(c => c.tumorTypeCount)
            .reduce((acc, curr) => acc + curr, 0) || 0
    );
}

export function calculateOverallFrequency(counts: CountByTumorType[]) {
    return totalVariants(counts) / totalSamples(counts);
}

export function calculateTotalVariantRatio(
    counts1: CountByTumorType[],
    counts2: CountByTumorType[]
) {
    return totalVariants(counts1) / totalVariants(counts2);
}
