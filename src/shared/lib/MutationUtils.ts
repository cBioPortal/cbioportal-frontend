import * as _ from 'lodash';
import {
    getColorForProteinImpactType as getDefaultColorForProteinImpactType,
    IProteinImpactTypeColors
} from "react-mutation-mapper";
import {Gene, MolecularProfile, Mutation, SampleIdentifier} from "shared/api/generated/CBioPortalAPI";
import {GenomicLocation} from "public-lib/api/generated/GenomeNexusAPIInternal";
import {MUTATION_STATUS_GERMLINE, MOLECULAR_PROFILE_UNCALLED_MUTATIONS_SUFFIX} from "shared/constants";
import {toSampleUuid} from "./UuidUtils";
import {stringListToSet} from "public-lib/lib/StringUtils";
import {
    MUT_COLOR_INFRAME, MUT_COLOR_MISSENSE, MUT_COLOR_OTHER,
    MUT_COLOR_TRUNC
} from "shared/lib/Colors";
import {normalizeMutations} from "../components/mutationMapper/MutationMapperUtils";


export const DEFAULT_PROTEIN_IMPACT_TYPE_COLORS: IProteinImpactTypeColors = {
    missenseColor: MUT_COLOR_MISSENSE,
    inframeColor: MUT_COLOR_INFRAME,
    truncatingColor: MUT_COLOR_TRUNC,
    otherColor: MUT_COLOR_OTHER
};

export function isUncalled(molecularProfileId:string) {
    const r = new RegExp(MOLECULAR_PROFILE_UNCALLED_MUTATIONS_SUFFIX + "$");
    return r.test(molecularProfileId);
}

export function getColorForProteinImpactType(mutations: Mutation[],
    colors: IProteinImpactTypeColors = DEFAULT_PROTEIN_IMPACT_TYPE_COLORS): string
{
    return getDefaultColorForProteinImpactType(normalizeMutations(mutations), colors);
}

// TODO remove when done refactoring mutation mapper
export function groupMutationsByProteinStartPos(mutationData: Mutation[][]): {[pos: number]: Mutation[]}
{
    const map: { [pos: number]: Mutation[] } = {};

    for (const mutations of mutationData) {
        for (const mutation of mutations) {
            const codon = mutation.proteinPosStart;

            if (codon !== undefined && codon !== null) {
                map[codon] = map[codon] || [];
                map[codon].push(mutation);
            }
        }
    }

    return map;
}

export function groupMutationsByGeneAndPatientAndProteinChange(mutations: Mutation[]): {[key: string]: Mutation[]}
{
    // key = <gene>_<patient>_<proteinChange>
    const map: {[key: string]: Mutation[]} = {};

    for (const mutation of mutations)
    {
        const key = `${mutation.gene.hugoGeneSymbol}_${mutation.patientId}_${mutation.proteinChange}`;
        map[key] = map[key] || [];
        map[key].push(mutation);
    }

    return map;
}

export function countDuplicateMutations(groupedMutations: {[key: string]: Mutation[]}): number
{
    // helper to count duplicate mutations
    const countMapper = (mutations: Mutation[]) => mutations.length > 0 ? mutations.length - 1 : 0;

    // helper to get the total sum
    const sumReducer = (acc: number, current: number) => acc + current;

    return _.values(groupedMutations).map(countMapper).reduce(sumReducer, 0);
}

export function countUniqueMutations(mutations: Mutation[]): number
{
    return Object.keys(groupMutationsByGeneAndPatientAndProteinChange(mutations)).length;
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

const GERMLINE_REGEXP = new RegExp(MUTATION_STATUS_GERMLINE, "i");
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
                        GERMLINE_REGEXP.test(m.mutationStatus) &&
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
                            !(GERMLINE_REGEXP.test(m.mutationStatus)) &&
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

export function isNotGermlineMutation(
    m:{ mutationStatus?:string }
) {
    return !m.mutationStatus || !(GERMLINE_REGEXP.test(m.mutationStatus));
}

export function updateMissingGeneInfo(mutations: Partial<Mutation>[],
                                      genesByHugoSymbol: {[hugoGeneSymbol:string]: Gene})
{
    mutations.forEach(mutation => {
        if (mutation.gene && mutation.gene.hugoGeneSymbol)
        {
            const gene = genesByHugoSymbol[mutation.gene.hugoGeneSymbol];

            if (gene) {
                // keep the existing "mutation.gene" values: only overwrite missing (undefined) values
                mutation.gene = _.merge({}, gene, mutation.gene);
                // also update entrezGeneId for the mutation itself
                mutation.entrezGeneId = mutation.entrezGeneId || gene.entrezGeneId;
            }
        }
    });
}

// TODO remove when done refactoring mutation mapper
export function extractGenomicLocation(mutation: Mutation)
{
    if (mutation.gene && mutation.chr &&
        mutation.startPosition &&
        mutation.endPosition &&
        mutation.referenceAllele &&
        mutation.variantAllele)
    {
        return {
            chromosome: mutation.chr.replace("chr", ""),
            start: mutation.startPosition,
            end: mutation.endPosition,
            referenceAllele: mutation.referenceAllele,
            variantAllele: mutation.variantAllele
        };
    }
    else {
        return undefined;
    }
}

// TODO remove when done refactoring mutation mapper
export function genomicLocationString(genomicLocation: GenomicLocation)
{
    return `${genomicLocation.chromosome},${genomicLocation.start},${genomicLocation.end},${genomicLocation.referenceAllele},${genomicLocation.variantAllele}`;
}

// TODO remove when done refactoring mutation mapper
export function uniqueGenomicLocations(mutations: Mutation[]): GenomicLocation[]
{
    const genomicLocationMap: {[key: string]: GenomicLocation} = {};

    mutations.map((mutation: Mutation) => {
        const genomicLocation: GenomicLocation|undefined = extractGenomicLocation(mutation);

        if (genomicLocation) {
            genomicLocationMap[genomicLocationString(genomicLocation)] = genomicLocation;
        }
    });

    return _.values(genomicLocationMap);
}
