import * as React from 'react';
import * as _ from 'lodash';
import {
    DEFAULT_PROTEIN_IMPACT_TYPE_COLORS,
    getColorForProteinImpactType as getDefaultColorForProteinImpactType,
    IProteinImpactTypeColors,
    ProteinImpactTypeFilter,
} from 'react-mutation-mapper';
import {
    Gene,
    MolecularProfile,
    Mutation,
    SampleIdentifier,
} from 'cbioportal-ts-api-client';
import {
    stringListToSet,
    ProteinImpactType,
    getProteinImpactType,
    DriverVsVusType,
    MUT_DRIVER,
    MUT_VUS,
} from 'cbioportal-frontend-commons';
import { extractGenomicLocation } from 'cbioportal-utils';
import { GenomicLocation } from 'genome-nexus-ts-api-client';
import {
    MUTATION_STATUS_GERMLINE,
    MOLECULAR_PROFILE_UNCALLED_MUTATIONS_SUFFIX,
} from 'shared/constants';
import { toSampleUuid } from './UuidUtils';
import { normalizeMutations } from '../components/mutationMapper/MutationMapperUtils';
import { getSimplifiedMutationType } from './oql/AccessorsForOqlFilter';

export const SELECTOR_VALUE_WITH_VUS = [
    ProteinImpactType.MISSENSE_PUTATIVE_DRIVER,
    ProteinImpactType.MISSENSE_UNKNOWN_SIGNIFICANCE,
    ProteinImpactType.TRUNCATING_PUTATIVE_DRIVER,
    ProteinImpactType.TRUNCATING_UNKNOWN_SIGNIFICANCE,
    ProteinImpactType.INFRAME_PUTATIVE_DRIVER,
    ProteinImpactType.INFRAME_UNKNOWN_SIGNIFICANCE,
    ProteinImpactType.SPLICE_PUTATIVE_DRIVER,
    ProteinImpactType.SPLICE_UNKNOWN_SIGNIFICANCE,
    ProteinImpactType.FUSION_PUTATIVE_DRIVER,
    ProteinImpactType.FUSION_UNKNOWN_SIGNIFICANCE,
    ProteinImpactType.OTHER,
];

export function getProteinImpactTypeOptionDisplayValueMap(proteinImpactTypeColorMap: {
    [proteinImpactType: string]: string;
}): { [proteinImpactType: string]: JSX.Element } {
    return {
        [ProteinImpactType.MISSENSE_PUTATIVE_DRIVER]: (
            <strong
                style={{
                    color:
                        proteinImpactTypeColorMap[
                            ProteinImpactType.MISSENSE_PUTATIVE_DRIVER
                        ],
                }}
            >
                Missense
            </strong>
        ),
        [ProteinImpactType.MISSENSE_UNKNOWN_SIGNIFICANCE]: (
            <strong
                style={{
                    color:
                        proteinImpactTypeColorMap[
                            ProteinImpactType.MISSENSE_UNKNOWN_SIGNIFICANCE
                        ],
                }}
            >
                Missense
            </strong>
        ),
        [ProteinImpactType.TRUNCATING_PUTATIVE_DRIVER]: (
            <strong
                style={{
                    color:
                        proteinImpactTypeColorMap[
                            ProteinImpactType.TRUNCATING_PUTATIVE_DRIVER
                        ],
                }}
            >
                Truncating
            </strong>
        ),
        [ProteinImpactType.TRUNCATING_UNKNOWN_SIGNIFICANCE]: (
            <strong
                style={{
                    color:
                        proteinImpactTypeColorMap[
                            ProteinImpactType.TRUNCATING_UNKNOWN_SIGNIFICANCE
                        ],
                }}
            >
                Truncating
            </strong>
        ),
        [ProteinImpactType.INFRAME_PUTATIVE_DRIVER]: (
            <strong
                style={{
                    color:
                        proteinImpactTypeColorMap[
                            ProteinImpactType.INFRAME_PUTATIVE_DRIVER
                        ],
                }}
            >
                Inframe
            </strong>
        ),
        [ProteinImpactType.INFRAME_UNKNOWN_SIGNIFICANCE]: (
            <strong
                style={{
                    color:
                        proteinImpactTypeColorMap[
                            ProteinImpactType.INFRAME_UNKNOWN_SIGNIFICANCE
                        ],
                }}
            >
                Inframe
            </strong>
        ),
        [ProteinImpactType.SPLICE_PUTATIVE_DRIVER]: (
            <strong
                style={{
                    color:
                        proteinImpactTypeColorMap[
                            ProteinImpactType.SPLICE_PUTATIVE_DRIVER
                        ],
                }}
            >
                Splice
            </strong>
        ),
        [ProteinImpactType.SPLICE_UNKNOWN_SIGNIFICANCE]: (
            <strong
                style={{
                    color:
                        proteinImpactTypeColorMap[
                            ProteinImpactType.SPLICE_UNKNOWN_SIGNIFICANCE
                        ],
                }}
            >
                Splice
            </strong>
        ),
        [ProteinImpactType.FUSION_PUTATIVE_DRIVER]: (
            <strong
                style={{
                    color:
                        proteinImpactTypeColorMap[
                            ProteinImpactType.FUSION_PUTATIVE_DRIVER
                        ],
                }}
            >
                SV/Fusion
            </strong>
        ),
        [ProteinImpactType.FUSION_UNKNOWN_SIGNIFICANCE]: (
            <strong
                style={{
                    color:
                        proteinImpactTypeColorMap[
                            ProteinImpactType.FUSION_UNKNOWN_SIGNIFICANCE
                        ],
                }}
            >
                SV/Fusion
            </strong>
        ),
        [ProteinImpactType.OTHER]: (
            <strong
                style={{
                    color: proteinImpactTypeColorMap[ProteinImpactType.OTHER],
                }}
            >
                Other
            </strong>
        ),
        [DriverVsVusType.DRIVER]: (
            <strong
                style={{
                    color: proteinImpactTypeColorMap[DriverVsVusType.DRIVER],
                }}
            >
                Driver
            </strong>
        ),
        [DriverVsVusType.VUS]: (
            <strong
                style={{
                    color: proteinImpactTypeColorMap[DriverVsVusType.VUS],
                }}
            >
                VUS
            </strong>
        ),
    };
}

export function getProteinImpactTypeColorMap(
    colors: IProteinImpactTypeColors
): { [proteinImpactType: string]: string } {
    return {
        [ProteinImpactType.MISSENSE_PUTATIVE_DRIVER]: colors.missenseColor,
        [ProteinImpactType.MISSENSE_UNKNOWN_SIGNIFICANCE]:
            colors.missenseVusColor,
        [ProteinImpactType.TRUNCATING_PUTATIVE_DRIVER]: colors.truncatingColor,
        [ProteinImpactType.TRUNCATING_UNKNOWN_SIGNIFICANCE]:
            colors.truncatingVusColor,
        [ProteinImpactType.INFRAME_PUTATIVE_DRIVER]: colors.inframeColor,
        [ProteinImpactType.INFRAME_UNKNOWN_SIGNIFICANCE]:
            colors.inframeVusColor,
        [ProteinImpactType.SPLICE_PUTATIVE_DRIVER]: colors.spliceColor,
        [ProteinImpactType.SPLICE_UNKNOWN_SIGNIFICANCE]: colors.spliceVusColor,
        [ProteinImpactType.FUSION_PUTATIVE_DRIVER]: colors.fusionColor,
        [ProteinImpactType.FUSION_UNKNOWN_SIGNIFICANCE]: colors.fusionVusColor,
        [ProteinImpactType.OTHER]: colors.otherColor,
        [DriverVsVusType.DRIVER]: MUT_DRIVER,
        [DriverVsVusType.VUS]: MUT_VUS,
    };
}

export const ANNOTATED_PROTEIN_IMPACT_TYPE_FILTER_ID =
    '_cBioPortalAnnotatedProteinImpactTypeFilter_';
export const ANNOTATED_PROTEIN_IMPACT_FILTER_TYPE =
    'annotatedProteinImpactType';

export function isFusion(mutation: Mutation) {
    return getSimplifiedMutationType(mutation.mutationType) === 'fusion';
}

export function isUncalled(molecularProfileId: string) {
    const r = new RegExp(MOLECULAR_PROFILE_UNCALLED_MUTATIONS_SUFFIX + '$');
    return r.test(molecularProfileId);
}

export function getColorForProteinImpactType(
    mutations: Mutation[],
    colors: IProteinImpactTypeColors = DEFAULT_PROTEIN_IMPACT_TYPE_COLORS,
    isPutativeDriver?: (mutation: Partial<Mutation>) => boolean
): string {
    return getDefaultColorForProteinImpactType(
        normalizeMutations(mutations),
        colors,
        undefined,
        isPutativeDriver
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

export type VAFReport = {
    vaf: number;
    variantReadCount: number;
    totalReadCount: number;
};
export function getVariantAlleleFrequency(m: Mutation): VAFReport | null {
    if (
        Number.isInteger(m.tumorRefCount) &&
        Number.isInteger(m.tumorAltCount)
    ) {
        const vaf = m.tumorAltCount / (m.tumorAltCount + m.tumorRefCount);
        if (isNaN(vaf)) {
            return null;
        } else {
            return {
                vaf,
                variantReadCount: m.tumorAltCount,
                totalReadCount: m.tumorAltCount + m.tumorRefCount,
            };
        }
    } else {
        return null;
    }
}

export function hasASCNProperty(mutation: Mutation, property: string) {
    return (
        mutation.alleleSpecificCopyNumber !== undefined &&
        (mutation.alleleSpecificCopyNumber as any)[property] !== undefined
    );
}

export function getAnnotatedProteinImpactType(
    mutation: Partial<Mutation>,
    proteinImpactType: string,
    isPutativeDriverFun?: (mutation: Partial<Mutation>) => boolean
) {
    const isPutativeDriver = !!(
        !isPutativeDriverFun || isPutativeDriverFun(mutation)
    );
    switch (proteinImpactType) {
        case ProteinImpactType.MISSENSE:
            return isPutativeDriver
                ? ProteinImpactType.MISSENSE_PUTATIVE_DRIVER
                : ProteinImpactType.MISSENSE_UNKNOWN_SIGNIFICANCE;
        case ProteinImpactType.TRUNCATING:
            return isPutativeDriver
                ? ProteinImpactType.TRUNCATING_PUTATIVE_DRIVER
                : ProteinImpactType.TRUNCATING_UNKNOWN_SIGNIFICANCE;
        case ProteinImpactType.INFRAME:
            return isPutativeDriver
                ? ProteinImpactType.INFRAME_PUTATIVE_DRIVER
                : ProteinImpactType.INFRAME_UNKNOWN_SIGNIFICANCE;
        case ProteinImpactType.FUSION:
            return isPutativeDriver
                ? ProteinImpactType.FUSION_PUTATIVE_DRIVER
                : ProteinImpactType.FUSION_UNKNOWN_SIGNIFICANCE;
        case ProteinImpactType.SPLICE:
            return isPutativeDriver
                ? ProteinImpactType.SPLICE_PUTATIVE_DRIVER
                : ProteinImpactType.SPLICE_UNKNOWN_SIGNIFICANCE;
        default:
            return ProteinImpactType.OTHER;
    }
}

export function createAnnotatedProteinImpactTypeFilter(
    isPutativeDriver?: (mutation: Partial<Mutation>) => boolean
) {
    const filter = (filter: ProteinImpactTypeFilter, mutation: Mutation) => {
        return filter.values.includes(
            isPutativeDriver === undefined
                ? getProteinImpactType(mutation.mutationType || 'other')
                : getAnnotatedProteinImpactType(
                      mutation,
                      getProteinImpactType(mutation.mutationType || 'other'),
                      isPutativeDriver
                  )
        );
    };
    return filter;
}
