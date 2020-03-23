import * as _ from 'lodash';
import {
    extractGenomicLocation,
    getColorForProteinImpactType as getDefaultColorForProteinImpactType,
    IProteinImpactTypeColors,
} from 'react-mutation-mapper';
import {
    Gene,
    MolecularProfile,
    Mutation,
    SampleIdentifier,
} from 'shared/api/generated/CBioPortalAPI';
import { GenomicLocation, stringListToSet } from 'cbioportal-frontend-commons';
import {
    MUTATION_STATUS_GERMLINE,
    MOLECULAR_PROFILE_UNCALLED_MUTATIONS_SUFFIX,
} from 'shared/constants';
import { toSampleUuid } from './UuidUtils';
import {
    MUT_COLOR_INFRAME,
    MUT_COLOR_MISSENSE,
    MUT_COLOR_OTHER,
    MUT_COLOR_TRUNC,
} from 'shared/lib/Colors';
import { normalizeMutations } from '../components/mutationMapper/MutationMapperUtils';
import { getSimplifiedMutationType } from './oql/AccessorsForOqlFilter';

export const DEFAULT_PROTEIN_IMPACT_TYPE_COLORS: IProteinImpactTypeColors = {
    missenseColor: MUT_COLOR_MISSENSE,
    inframeColor: MUT_COLOR_INFRAME,
    truncatingColor: MUT_COLOR_TRUNC,
    otherColor: MUT_COLOR_OTHER,
};

export function isFusion(mutation: Mutation) {
    return getSimplifiedMutationType(mutation.mutationType) === 'fusion';
}

export function isUncalled(molecularProfileId: string) {
    const r = new RegExp(MOLECULAR_PROFILE_UNCALLED_MUTATIONS_SUFFIX + '$');
    return r.test(molecularProfileId);
}

export function getColorForProteinImpactType(
    mutations: Mutation[],
    colors: IProteinImpactTypeColors = DEFAULT_PROTEIN_IMPACT_TYPE_COLORS
): string {
    return getDefaultColorForProteinImpactType(
        normalizeMutations(mutations),
        colors
    );
}

// TODO remove when done refactoring mutation mapper
export function groupMutationsByProteinStartPos(
    mutationData: Mutation[][]
): { [pos: number]: Mutation[] } {
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

export function groupMutationsByGeneAndPatientAndProteinChange(
    mutations: Mutation[]
): { [key: string]: Mutation[] } {
    // key = <gene>_<patient>_<proteinChange>
    const map: { [key: string]: Mutation[] } = {};

    for (const mutation of mutations) {
        const key = `${mutation.gene.hugoGeneSymbol}_${mutation.patientId}_${mutation.proteinChange}`;
        map[key] = map[key] || [];
        map[key].push(mutation);
    }

    return map;
}

export function countDuplicateMutations(groupedMutations: {
    [key: string]: Mutation[];
}): number {
    // helper to count duplicate mutations
    const countMapper = (mutations: Mutation[]) =>
        mutations.length > 0 ? mutations.length - 1 : 0;

    // helper to get the total sum
    const sumReducer = (acc: number, current: number) => acc + current;

    return _.values(groupedMutations)
        .map(countMapper)
        .reduce(sumReducer, 0);
}

export function countUniqueMutations(mutations: Mutation[]): number {
    return Object.keys(
        groupMutationsByGeneAndPatientAndProteinChange(mutations)
    ).length;
}

/**
 * Protein start positions for the mutations falling between a specific start and end position range
 */
export function getProteinStartPositionsByRange(
    data: Mutation[][],
    start: number,
    end: number
) {
    const positions: number[] = [];

    data.forEach((mutations: Mutation[]) => {
        const mutation = mutations[0];

        // only add positions which fall between start & end positions
        if (
            mutation.proteinPosStart > -1 &&
            mutation.proteinPosStart >= start &&
            mutation.proteinPosStart <= end
        ) {
            positions.push(mutation.proteinPosStart);
        }

        if (
            mutation.proteinPosEnd > mutation.proteinPosStart &&
            mutation.proteinPosEnd >= start &&
            mutation.proteinPosEnd <= end
        ) {
            positions.push(mutation.proteinPosEnd);
        }
    });

    return _.uniq(positions);
}

export const GERMLINE_REGEXP = new RegExp(MUTATION_STATUS_GERMLINE, 'i');
/**
 * Percentage of cases/samples with a germline mutation in given gene.
 * Assumes all given sample ids in the study had germline screening for all
 * genes (TODO: use gene panel).
 */
export function germlineMutationRate(
    hugoGeneSymbol: string,
    mutations: Mutation[],
    molecularProfileIdToMolecularProfile: {
        [molecularProfileId: string]: MolecularProfile;
    },
    samples: SampleIdentifier[]
) {
    if (mutations.length > 0 && samples.length > 0) {
        const sampleIds = stringListToSet(samples.map(toSampleUuid));
        const nrCasesGermlineMutation: number = _.chain(mutations)
            .filter((m: Mutation) => {
                const profile =
                    molecularProfileIdToMolecularProfile[m.molecularProfileId];
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
            .value().length;
        return (nrCasesGermlineMutation * 100.0) / samples.length;
    } else {
        return 0;
    }
}

/**
 * Percentage of cases/samples with a somatic mutation in given gene.
 */
export function somaticMutationRate(
    hugoGeneSymbol: string,
    mutations: Mutation[],
    molecularProfileIdToMolecularProfile: {
        [molecularProfileId: string]: MolecularProfile;
    },
    samples: SampleIdentifier[]
) {
    if (mutations.length > 0 && samples.length > 0) {
        const sampleIds = stringListToSet(samples.map(toSampleUuid));
        return (
            (_.chain(mutations)
                .filter((m: Mutation) => {
                    const profile =
                        molecularProfileIdToMolecularProfile[
                            m.molecularProfileId
                        ];
                    if (profile) {
                        return (
                            m.gene.hugoGeneSymbol === hugoGeneSymbol &&
                            !GERMLINE_REGEXP.test(m.mutationStatus) &&
                            // filter for given sample IDs
                            !!sampleIds[
                                toSampleUuid(profile.studyId, m.sampleId)
                            ]
                        );
                    } else {
                        return false;
                    }
                })
                .map(toSampleUuid)
                .uniq()
                .value().length *
                100.0) /
            samples.length
        );
    } else {
        return 0;
    }
}

export function isNotGermlineMutation(m: { mutationStatus?: string }) {
    return !m.mutationStatus || !GERMLINE_REGEXP.test(m.mutationStatus);
}

export function updateMissingGeneInfo(
    mutations: Partial<Mutation>[],
    genesByHugoSymbol: { [hugoGeneSymbol: string]: Gene }
) {
    mutations.forEach(mutation => {
        if (mutation.gene && mutation.gene.hugoGeneSymbol) {
            const gene = genesByHugoSymbol[mutation.gene.hugoGeneSymbol];

            if (gene) {
                // keep the existing "mutation.gene" values: only overwrite missing (undefined) values
                mutation.gene = _.merge({}, gene, mutation.gene);
                // also update entrezGeneId for the mutation itself
                mutation.entrezGeneId =
                    mutation.entrezGeneId || gene.entrezGeneId;
            }
        }
    });
}

// TODO remove when done refactoring mutation mapper
export function genomicLocationString(genomicLocation: GenomicLocation) {
    // mapping chromosome X with 23
    let chromosome = genomicLocation.chromosome;
    switch (genomicLocation.chromosome.toUpperCase()) {
        case 'X':
            chromosome = '23';
            break;
        case 'Y':
            chromosome = '24';
            break;
        default:
    }

    return `${chromosome},${genomicLocation.start},${genomicLocation.end},${genomicLocation.referenceAllele},${genomicLocation.variantAllele}`;
}

// TODO remove when done refactoring mutation mapper
export function uniqueGenomicLocations(
    mutations: Mutation[]
): GenomicLocation[] {
    const genomicLocationMap: { [key: string]: GenomicLocation } = {};

    mutations.map((mutation: Mutation) => {
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

export function getVariantAlleleFrequency(m: Mutation) {
    if (
        Number.isInteger(m.tumorRefCount) &&
        Number.isInteger(m.tumorAltCount)
    ) {
        const vaf = m.tumorAltCount / (m.tumorAltCount + m.tumorRefCount);
        if (isNaN(vaf)) {
            return null;
        } else {
            return vaf;
        }
    } else {
        return null;
    }
}

export function generateHgvsgByMutation(
    mutation: Partial<Mutation>
): string | null {
    if (isValidGenomicLocation(mutation)) {
        // ins
        if (mutation.referenceAllele === '-') {
            return `${mutation.chr}:g.${mutation.startPosition}_${mutation.endPosition}ins${mutation.variantAllele}`;
        }
        // del (in new format that no ref after del, may differ with genome nexus hgvsg response)
        else if (mutation.variantAllele === '-') {
            if (mutation.startPosition === mutation.endPosition) {
                return `${mutation.chr}:g.${mutation.startPosition}del`;
            }
            return `${mutation.chr}:g.${mutation.startPosition}_${mutation.endPosition}del`;
        }
        // substitution
        else if (
            mutation.referenceAllele!.length === 1 &&
            mutation.variantAllele!.length === 1
        ) {
            return `${mutation.chr}:g.${mutation.startPosition}${mutation.referenceAllele}>${mutation.variantAllele}`;
        }
        // delins (in new format that no ref after del, may differ with genome nexus hgvsg response)
        else if (
            mutation.referenceAllele!.length === 1 &&
            mutation.variantAllele!.length > 1
        ) {
            return `${mutation.chr}:g.${mutation.startPosition}delins${mutation.variantAllele}`;
        }
        // delins (in new format that no ref after del, may differ with genome nexus hgvsg response)
        // for cases mutation.referenceAllele.length > 1 && mutation.variantAllele.length >= 1
        else {
            return `${mutation.chr}:g.${mutation.startPosition}_${mutation.endPosition}delins${mutation.variantAllele}`;
        }
    }

    return null;
}

export function isValidGenomicLocation(mutation: Partial<Mutation>): boolean {
    if (
        mutation.chr &&
        mutation.startPosition &&
        mutation.startPosition !== -1 &&
        mutation.endPosition &&
        mutation.endPosition !== -1 &&
        mutation.referenceAllele &&
        mutation.referenceAllele !== 'NA' &&
        mutation.variantAllele &&
        mutation.variantAllele !== 'NA'
    ) {
        if (
            mutation.referenceAllele === '-' &&
            mutation.variantAllele === '-'
        ) {
            return false;
        }
        return true;
    }

    return false;
}
