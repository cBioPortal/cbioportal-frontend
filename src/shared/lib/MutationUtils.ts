import * as _ from 'lodash';
import {
    default as getCanonicalMutationType, CanonicalMutationType,
    ProteinImpactType, getProteinImpactTypeFromCanonical
} from "./getCanonicalMutationType";
import {MolecularProfile, Mutation, SampleIdentifier} from "shared/api/generated/CBioPortalAPI";
import {MUTATION_STATUS_GERMLINE, MOLECULAR_PROFILE_UNCALLED_MUTATIONS_SUFFIX} from "shared/constants";
import {findFirstMostCommonElt} from "./findFirstMostCommonElt";
import {toSampleUuid} from "./UuidUtils";
import {stringListToSet} from "./StringUtils";

export interface IProteinImpactTypeColors
{
    missenseColor: string;
    inframeColor: string;
    truncatingColor: string;
    otherColor: string;
}

export const DEFAULT_PROTEIN_IMPACT_TYPE_COLORS: IProteinImpactTypeColors = {
    missenseColor: "#008000",
    inframeColor: "#8B4513",
    truncatingColor: "#000000",
    otherColor: "#8B00C9"
};

export const MUTATION_TYPE_PRIORITY: {[canonicalMutationType: string]: number} = {
    "missense": 1,
    "inframe": 2,
    "truncating": 4,
    "nonsense": 6,
    "nonstop": 7,
    "nonstart": 8,
    "frameshift": 4,
    "frame_shift_del": 4,
    "frame_shift_ins": 5,
    "in_frame_ins": 3,
    "in_frame_del": 2,
    "splice_site": 9,
    "fusion": 10,
    "silent": 11,
    "other": 11
};

export function isUncalled(molecularProfileId:string) {
    const r = new RegExp(MOLECULAR_PROFILE_UNCALLED_MUTATIONS_SUFFIX + "$");
    return r.test(molecularProfileId);
}

export function mutationTypeSort(typeA: CanonicalMutationType, typeB: CanonicalMutationType)
{
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

export function getColorForProteinImpactType(mutations: Mutation[],
    colors: IProteinImpactTypeColors = DEFAULT_PROTEIN_IMPACT_TYPE_COLORS): string
{
    const sortedCanonicalMutationTypes: CanonicalMutationType[] =
        mutations.map(m => getCanonicalMutationType(m.mutationType)).sort(mutationTypeSort);

    const chosenCanonicalType:CanonicalMutationType|undefined = findFirstMostCommonElt(sortedCanonicalMutationTypes);
    if (chosenCanonicalType) {
        const proteinImpactType:ProteinImpactType = getProteinImpactTypeFromCanonical(chosenCanonicalType);

        switch (proteinImpactType) {
            case "missense":
                return colors.missenseColor;
            case "truncating":
                return colors.truncatingColor;
            case "inframe":
                return colors.inframeColor;
            default:
                return colors.otherColor;
        }
    } else {
        return "#FF0000"; // we only get here if theres no mutations, which shouldnt happen. red to indicate an error
    }
}

export function groupMutationsByProteinStartPos(mutationData: Mutation[][]): {[pos: number]: Mutation[]}
{
    const map: {[pos: number]: Mutation[]} = {};

    for (const mutations of mutationData) {
        for (const mutation of mutations) {
            const codon = mutation.proteinPosStart;
            map[codon] = map[codon] || [];
            map[codon].push(mutation);
        }
    }

    return map;
}

/**
 * Protein start positions for the mutations falling between a specific start and end position range
 */
export function getProteinStartPositionsByRange(data: Mutation[][], start: number, end: number)
{
    const positions: number[] = [];

    data.forEach((mutations: Mutation[]) => {
        const mutation = mutations[0];

        // only add positions which fall between start & end positions
        if (mutation.proteinPosStart > -1 &&
            mutation.proteinPosStart >= start &&
            mutation.proteinPosStart <= end)
        {
            positions.push(mutation.proteinPosStart);
        }

        if (mutation.proteinPosEnd > mutation.proteinPosStart &&
            mutation.proteinPosEnd >= start &&
            mutation.proteinPosEnd <= end)
        {
            positions.push(mutation.proteinPosEnd);
        }
    });

    return _.uniq(positions);
}

/**
 * Percentage of cases/samples with a germline mutation in given gene.
 * Assumes all given sample ids in the study had germline screening for all
 * genes (TODO: use gene panel).
 */
export function germlineMutationRate(hugoGeneSymbol:string,
                                     mutations: Mutation[],
                                     molecularProfileIdToMolecularProfile:{[molecularProfileId:string]:MolecularProfile},
                                     samples: SampleIdentifier[])
{
    if (mutations.length > 0 && samples.length > 0) {
        const sampleIds = stringListToSet(samples.map(toSampleUuid));
        const nrCasesGermlineMutation:number =
            _.chain(mutations)
            .filter((m:Mutation) => {
                const profile = molecularProfileIdToMolecularProfile[m.molecularProfileId];
                if (profile) {
                    return (
                        m.gene.hugoGeneSymbol === hugoGeneSymbol &&
                        new RegExp(MUTATION_STATUS_GERMLINE, "i").test(m.mutationStatus) &&
                        // filter for given sample IDs
                        !!sampleIds[toSampleUuid(profile.studyId, m.sampleId)]
                    );
                } else {
                    return false;
                }
            })
            .map(toSampleUuid)
            .uniq()
            .value()
            .length;
        return nrCasesGermlineMutation * 100.0 / samples.length;
    } else {
        return 0;
    }
}

/**
 * Percentage of cases/samples with a somatic mutation in given gene.
 */
export function somaticMutationRate(hugoGeneSymbol: string, mutations: Mutation[],
                                    molecularProfileIdToMolecularProfile:{[molecularProfileId:string]:MolecularProfile},
                                    samples: SampleIdentifier[]) {
    if (mutations.length > 0 && samples.length > 0) {
        const sampleIds = stringListToSet(samples.map(toSampleUuid));
        return (
            _.chain(mutations)
                .filter((m:Mutation) => {
                    const profile = molecularProfileIdToMolecularProfile[m.molecularProfileId];
                    if (profile) {
                        return (
                            m.gene.hugoGeneSymbol === hugoGeneSymbol &&
                            !(new RegExp(MUTATION_STATUS_GERMLINE, "i").test(m.mutationStatus)) &&
                            // filter for given sample IDs
                            !!sampleIds[toSampleUuid(profile.studyId, m.sampleId)]
                        );
                    } else {
                        return false;
                    }
                })
                .map(toSampleUuid)
                .uniq()
                .value()
                .length * 100.0 /
                samples.length
        );
    } else {
        return 0;
    }
}
