import {
    CanonicalMutationType,
    findFirstMostCommonElt,
    getCanonicalMutationType,
    getProteinImpactTypeFromCanonical,
    ProteinImpactType,
} from 'cbioportal-frontend-commons';
import { Mutation } from 'cbioportal-utils';
import _ from 'lodash';

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
