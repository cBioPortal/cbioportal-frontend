import _ from 'lodash';

import {
    CanonicalMutationType,
    findFirstMostCommonElt,
    getCanonicalMutationType,
    getProteinImpactTypeFromCanonical,
    ProteinImpactType,
} from 'cbioportal-frontend-commons';

import { GenomicLocation } from '../model/CancerHotspot';
import { Mutation } from '../model/Mutation';
import { IProteinImpactTypeColors } from '../model/ProteinImpact';

// Default Protein Impact Type colors
export const MUT_COLOR_MISSENSE = '#008000';
export const MUT_COLOR_INFRAME = '#993404';
export const MUT_COLOR_TRUNC = '#000000';
export const MUT_COLOR_OTHER = '#CF58BC';

export const DEFAULT_PROTEIN_IMPACT_TYPE_COLORS: IProteinImpactTypeColors = {
    missenseColor: MUT_COLOR_MISSENSE,
    inframeColor: MUT_COLOR_INFRAME,
    truncatingColor: MUT_COLOR_TRUNC,
    otherColor: MUT_COLOR_OTHER,
};

export const MUTATION_TYPE_PRIORITY: {
    [canonicalMutationType: string]: number;
} = {
    missense: 1,
    inframe: 2,
    truncating: 4,
    nonsense: 6,
    nonstop: 7,
    nonstart: 8,
    frameshift: 4,
    frame_shift_del: 4,
    frame_shift_ins: 5,
    in_frame_ins: 3,
    in_frame_del: 2,
    splice_site: 9,
    fusion: 10,
    silent: 11,
    other: 11,
};

export function countMutationsByProteinChange(
    mutations: Mutation[]
): { proteinChange: string; count: number }[] {
    const mutationsByProteinChange = _.groupBy(mutations, 'proteinChange');
    const mutationCountsByProteinChange = _.map(
        mutationsByProteinChange,
        mutations => ({
            proteinChange: mutations[0].proteinChange,
            count: mutations.length,
        })
    );

    // order by count descending, and then protein change ascending
    return _.orderBy(
        mutationCountsByProteinChange,
        ['count', 'proteinChange'],
        ['desc', 'asc']
    );
}

export function groupMutationsByProteinStartPos(
    mutations: Mutation[]
): { [pos: number]: Mutation[] } {
    const map: { [pos: number]: Mutation[] } = {};

    for (const mutation of mutations) {
        const codon = mutation.proteinPosStart;

        if (codon !== undefined && codon !== null) {
            map[codon] = map[codon] || [];
            map[codon].push(mutation);
        }
    }

    return map;
}

export function mutationTypeSort(
    typeA: CanonicalMutationType,
    typeB: CanonicalMutationType
) {
    const priorityA = MUTATION_TYPE_PRIORITY[typeA];
    const priorityB = MUTATION_TYPE_PRIORITY[typeB];
    if (priorityA < priorityB) {
        return -1;
    } else if (priorityA > priorityB) {
        return 1;
    } else {
        return typeA.localeCompare(typeB);
    }
}

export function getColorForProteinImpactType(
    mutations: Partial<Mutation>[],
    colors: IProteinImpactTypeColors = DEFAULT_PROTEIN_IMPACT_TYPE_COLORS,
    getMutationCount: (mutation: Partial<Mutation>) => number = () => 1
): string {
    const sortedCanonicalMutationTypes: CanonicalMutationType[] =
        // need to flatten before sorting, since we map a single mutation to an array of elements
        _.flatten(
            mutations.map(m =>
                // create an array of elements for a single mutation, since the mutation count may be different than 1,
                // this adjusts the weight of a particular mutation with a high count
                _.fill(
                    Array(Math.ceil(getMutationCount(m))),
                    getCanonicalMutationType(m.mutationType || '')
                )
            )
        ).sort(mutationTypeSort);

    const chosenCanonicalType:
        | CanonicalMutationType
        | undefined = findFirstMostCommonElt(sortedCanonicalMutationTypes);

    if (chosenCanonicalType) {
        const proteinImpactType: ProteinImpactType = getProteinImpactTypeFromCanonical(
            chosenCanonicalType
        );

        switch (proteinImpactType) {
            case 'missense':
                return colors.missenseColor;
            case 'truncating':
                return colors.truncatingColor;
            case 'inframe':
                return colors.inframeColor;
            default:
                return colors.otherColor;
        }
    } else {
        return '#FF0000'; // we only get here if theres no mutations, which shouldnt happen. red to indicate an error
    }
}

export function extractGenomicLocation(
    mutation: Partial<Mutation & { chr: string }>
) {
    // TODO workaround for cbioportal API mutation type,
    //  add a custom getChromosome(mutation: Mutation) function?
    const chromosome = mutation.chromosome || mutation.chr;

    if (
        chromosome &&
        mutation.startPosition &&
        mutation.endPosition &&
        mutation.referenceAllele &&
        mutation.variantAllele
    ) {
        return {
            chromosome: chromosome.replace('chr', ''),
            start: mutation.startPosition,
            end: mutation.endPosition,
            referenceAllele: mutation.referenceAllele,
            variantAllele: mutation.variantAllele,
        };
    } else {
        return undefined;
    }
}

export function genomicLocationString(genomicLocation: GenomicLocation) {
    return `${genomicLocation.chromosome},${genomicLocation.start},${genomicLocation.end},${genomicLocation.referenceAllele},${genomicLocation.variantAllele}`;
}

export function uniqueGenomicLocations(
    mutations: Partial<Mutation>[]
): GenomicLocation[] {
    const genomicLocationMap: { [key: string]: GenomicLocation } = {};

    mutations.map((mutation: Partial<Mutation>) => {
        const genomicLocation:
            | GenomicLocation
            | undefined = extractGenomicLocation(mutation);

        if (genomicLocation) {
            genomicLocationMap[
                genomicLocationString(genomicLocation)
            ] = genomicLocation;
        }
    });

    return _.values(genomicLocationMap);
}
