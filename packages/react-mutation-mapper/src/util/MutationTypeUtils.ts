import {
    CanonicalMutationType,
    findFirstMostCommonElt,
    getCanonicalMutationType,
    getProteinImpactTypeFromCanonical,
    ProteinImpactType,
    MUT_COLOR_MISSENSE,
    MUT_COLOR_INFRAME,
    MUT_COLOR_TRUNC,
    MUT_COLOR_SPLICE,
    MUT_COLOR_FUSION,
    MUT_COLOR_OTHER,
    MUT_COLOR_MISSENSE_PASSENGER,
    MUT_COLOR_INFRAME_PASSENGER,
    MUT_COLOR_TRUNC_PASSENGER,
    MUT_COLOR_SPLICE_PASSENGER,
} from 'cbioportal-frontend-commons';
import { Mutation } from 'cbioportal-utils';
import _ from 'lodash';

import { IProteinImpactTypeColors } from '../model/ProteinImpact';

export const DEFAULT_PROTEIN_IMPACT_TYPE_COLORS: IProteinImpactTypeColors = {
    missenseColor: MUT_COLOR_MISSENSE,
    missenseVusColor: MUT_COLOR_MISSENSE_PASSENGER,
    inframeColor: MUT_COLOR_INFRAME,
    inframeVusColor: MUT_COLOR_INFRAME_PASSENGER,
    truncatingColor: MUT_COLOR_TRUNC,
    truncatingVusColor: MUT_COLOR_TRUNC_PASSENGER,
    spliceColor: MUT_COLOR_SPLICE,
    spliceVusColor: MUT_COLOR_SPLICE_PASSENGER,
    fusionColor: MUT_COLOR_FUSION,
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

export function getColorForProteinImpactType<T extends Mutation>(
    mutations: Partial<T>[],
    colors: IProteinImpactTypeColors = DEFAULT_PROTEIN_IMPACT_TYPE_COLORS,
    getMutationCount: (mutation: Partial<T>) => number = () => 1,
    isPutativeDriver?: (mutation: Partial<T>) => boolean
): string {
    const processedMutations = mutations.map(m => {
        return {
            count: Math.ceil(getMutationCount(m)),

            // if not coloring drivers vs vus, color everything as driver
            isPutativeDriver: !!(!isPutativeDriver || isPutativeDriver(m)),

            canonicalType: getCanonicalMutationType(
                (m.mutationType || '') as string
            ),
        };
    });
    // aggregate counts by type + driver status
    const counts: any = {};
    for (const pMut of processedMutations) {
        const key = `${pMut.canonicalType}_${pMut.isPutativeDriver}`;
        counts[key] = counts[key] || {
            count: 0,
            isPutativeDriver: pMut.isPutativeDriver,
            canonicalType: pMut.canonicalType,
        };
        counts[key].count += pMut.count;
    }

    const sortedMutations = _.sortBy(_.values(counts), [
        pMut => (pMut.isPutativeDriver ? 0 : 1), // putative driver preferred non putative driver
        pMut => -pMut.count, // sort descending by count - higher count preferred to lower count
        pMut => MUTATION_TYPE_PRIORITY[pMut.canonicalType], // finally, sort by specified priority
    ]);

    if (sortedMutations.length > 0) {
        const chosenMutation = sortedMutations[0];

        const proteinImpactType: ProteinImpactType = getProteinImpactTypeFromCanonical(
            chosenMutation.canonicalType
        );

        switch (proteinImpactType) {
            case ProteinImpactType.MISSENSE:
                return chosenMutation.isPutativeDriver
                    ? colors.missenseColor
                    : colors.missenseVusColor;
            case ProteinImpactType.TRUNCATING:
                return chosenMutation.isPutativeDriver
                    ? colors.truncatingColor
                    : colors.truncatingVusColor;
            case ProteinImpactType.INFRAME:
                return chosenMutation.isPutativeDriver
                    ? colors.inframeColor
                    : colors.inframeVusColor;
            case ProteinImpactType.FUSION:
                return colors.fusionColor;
            case ProteinImpactType.SPLICE:
                return chosenMutation.isPutativeDriver
                    ? colors.spliceColor
                    : colors.spliceVusColor;
            default:
                return colors.otherColor;
        }
    } else {
        return '#FF0000'; // we only get here if theres no mutations, which shouldnt happen. red to indicate an error
    }
}
