// this component comes from signal
import { CancerTypeFilter, DataFilter } from 'react-mutation-mapper';

import {
    IGeneFrequencySummary,
    ITumorTypeFrequencySummary,
} from '../model/GeneFrequencySummary';
import {
    IExtendedMutation,
    IMutation,
    ITumorTypeDecomposition,
} from '../model/Mutation';

export const HUGO_SYMBOL_SEARCH_FILTER_ID = '_signalHugoSymbolSearchFilter_';
export const HUGO_SYMBOL_DROPDOWN_FILTER_ID =
    '_signalHugoSymbolDropdownFilter_';
export const CANCER_TYPE_FILTER_ID = '_signalCancerTypeFilter_';
export const MUTATION_STATUS_FILTER_ID = '_signalMutationStatusFilter_';
export const PROTEIN_IMPACT_TYPE_FILTER_ID = '_signalProteinImpactTypeFilter_';
export const PENETRANCE_FILTER_ID = '_signalPenetranceFilter_';
export const HUGO_SYMBOL_FILTER_TYPE = 'signalHugoSymbol';
export const MUTATION_STATUS_FILTER_TYPE = 'signalMutationStatus';
export const MUTATION_COUNT_FILTER_TYPE = 'signalMutationCount';
export const PENETRANCE_FILTER_TYPE = 'signalPenetrance';

export enum MutationStatusFilterValue {
    SOMATIC = 'Somatic',
    GERMLINE = 'Germline',
    BENIGN_GERMLINE = 'Rare Benign/VUS Germline',
    PATHOGENIC_GERMLINE = 'Pathogenic Germline',
    BIALLELIC_PATHOGENIC_GERMLINE = 'Biallelic Pathogenic Germline',
}

export type MutationStatusFilter = DataFilter<MutationStatusFilterValue>;
export type MutationCountFilter = DataFilter<number>; // TODO this should be an interval not a single number
export type HugoSymbolFilter = DataFilter<string>;

export function applyCancerTypeFilter(
    filter: CancerTypeFilter,
    mutation: IMutation
) {
    return (
        mutation.countsByTumorType.find(
            c =>
                filter.values.find(
                    v =>
                        v.length > 0 &&
                        c.variantCount > 0 &&
                        c.tumorType.toLowerCase().includes(v.toLowerCase())
                ) !== undefined
        ) !== undefined
    );
}

export function isKnownTumorType(tumorType: string) {
    return (
        !tumorType.toLowerCase().includes('unknown') &&
        !tumorType.toLowerCase().includes('other')
    );
}

export function applyTumorTypeFrequencySummaryCancerTypeFilter(
    filter: CancerTypeFilter,
    tumorTypeFrequencySummary: ITumorTypeFrequencySummary
) {
    return filter.values
        .map(v =>
            tumorTypeFrequencySummary.tumorType
                .toLowerCase()
                .includes(v.toLowerCase())
        )
        .includes(true);
}

export function applyGeneFrequencySummaryHugoSymbolFilter(
    filter: HugoSymbolFilter,
    geneFrequencySummary: IGeneFrequencySummary
) {
    return filter.values
        .map(v =>
            geneFrequencySummary.hugoSymbol
                .toLowerCase()
                .includes(v.toLowerCase())
        )
        .includes(true);
}

export function applyMutationStatusFilter(
    filter: MutationStatusFilter,
    mutation: IExtendedMutation,
    biallelicFrequency:
        | number
        | null = mutation.biallelicPathogenicGermlineFrequency
) {
    return filter.values
        .map(v => {
            let match = false;

            const isGermline = mutation.mutationStatus
                .toLowerCase()
                .includes(MutationStatusFilterValue.GERMLINE.toLowerCase());
            const isPathogenicGermline =
                isGermline && mutation.pathogenic === '1';
            const isBenignGermline = isGermline && !isPathogenicGermline;
            const isSomatic = mutation.mutationStatus
                .toLowerCase()
                .includes(MutationStatusFilterValue.SOMATIC.toLowerCase());

            if (v.length > 0) {
                if (v === MutationStatusFilterValue.SOMATIC) {
                    match = isSomatic;
                } else if (v === MutationStatusFilterValue.GERMLINE) {
                    match = isGermline;
                } else if (v === MutationStatusFilterValue.BENIGN_GERMLINE) {
                    match = isBenignGermline;
                } else if (
                    v === MutationStatusFilterValue.PATHOGENIC_GERMLINE
                ) {
                    match = isPathogenicGermline;
                } else if (
                    v ===
                    MutationStatusFilterValue.BIALLELIC_PATHOGENIC_GERMLINE
                ) {
                    match =
                        isPathogenicGermline &&
                        biallelicFrequency !== null &&
                        biallelicFrequency > 0;
                }
            }

            return match;
        })
        .includes(true);
}

export function containsCancerType(
    filter: CancerTypeFilter | undefined,
    cancerType: string
) {
    return (
        !filter ||
        filter.values.find(v =>
            cancerType.toLowerCase().includes(v.toLowerCase())
        ) !== undefined
    );
}

export function matchesMutationStatus(
    filter: MutationStatusFilter | undefined,
    mutation: IExtendedMutation,
    tumorTypeDecomposition: ITumorTypeDecomposition
) {
    return (
        !filter ||
        applyMutationStatusFilter(
            filter,
            mutation,
            tumorTypeDecomposition.biallelicRatio
        )
    );
}

export function findCancerTypeFilter(dataFilters: DataFilter[]) {
    return dataFilters.find(f => f.id === CANCER_TYPE_FILTER_ID);
}

export function findMutationStatusFilter(dataFilters: DataFilter[]) {
    return dataFilters.find(f => f.id === MUTATION_STATUS_FILTER_ID);
}

export function findMutationTypeFilter(dataFilters: DataFilter[]) {
    return dataFilters.find(f => f.id === PROTEIN_IMPACT_TYPE_FILTER_ID);
}

export function getDefaultMutationStatusFilterValues() {
    return [
        MutationStatusFilterValue.SOMATIC,
        MutationStatusFilterValue.PATHOGENIC_GERMLINE,
    ];
}

export function updateDataFilters(
    dataFilters: DataFilter[],
    dataFilterId: string,
    dataFilter?: DataFilter
): DataFilter[] {
    // all other filters except the current filter with the given data filter id
    const otherFilters = dataFilters.filter(
        (f: DataFilter) => f.id !== dataFilterId
    );

    if (!dataFilter) {
        // if no new filter is provided, just remove the existing one
        return otherFilters;
    } else {
        // update data filters with the new one
        return [...otherFilters, dataFilter];
    }
}
