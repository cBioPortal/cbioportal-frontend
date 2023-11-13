import fetch from 'cross-fetch';
import { ApolloClient, HttpLink, InMemoryCache, gql } from '@apollo/client';

import {
    EvidenceLevel,
    ICivicEvidenceSummary,
    ICivicGeneSummary,
    ICivicVariantSummary,
} from '../model/Civic';
import _ from 'lodash';

type CivicAPIGene = {
    id: number;
    name: string;
    description: string;
    link: string;
    variants: CivicVariantCollection;
};

type CivicVariantCollection = {
    nodes: Array<CivicVariant>;
};

type CivicVariant = {
    id: number;
    name: string;
    singleVariantMolecularProfile: CivicMolecularProfile;
};

type CivicMolecularProfile = {
    description: string;
    evidenceItems: EvidenceCollection;
};

type EvidenceCollection = {
    nodes: Array<Evidence>;
};

type Evidence = {
    id: number;
    name: string;
    evidenceType: string;
    significance: string;
    evidenceDirection: EvidenceDirection;
    evidenceLevel: EvidenceLevel;
    therapies: Therapy[];
    disease: Disease;
};

type Therapy = {
    id: number;
    name: string;
    ncitId: string;
    therapyAliases: string[];
};

type Disease = {
    id: number;
    name: string;
    displayName: string;
    link: string;
};

enum EvidenceDirection {
    Supports = 'SUPPORTS',
    DoesNotSupport = 'DOES_NOT_SUPPORT',
}

const client = new ApolloClient({
    link: new HttpLink({ uri: 'https://civicdb.org/api/graphql', fetch }),
    cache: new InMemoryCache(),
});

/**
 * Returns a map with the different types of evidence and the number of times that each evidence happens.
 */
function countEvidenceTypes(
    evidenceItems: Evidence[]
): { [evidenceType: string]: number } {
    const counts: { [evidenceType: string]: number } = {};

    evidenceItems.forEach(function(evidenceItem: Evidence) {
        const evidenceType = evidenceItem.evidenceType;
        if (counts.hasOwnProperty(evidenceType)) {
            counts[evidenceType] += 1;
        } else {
            counts[evidenceType] = 1;
        }
    });

    return counts;
}

function findSupportingEvidences(
    evidences: Evidence[],
    filter: (evidence: Evidence) => boolean = () => true
): Evidence[] {
    const filteredEvidences = evidences.filter(
        evidence =>
            evidence.evidenceDirection === EvidenceDirection.Supports &&
            filter(evidence)
    );

    filteredEvidences.sort((a, b) => {
        const aLevel = a.evidenceLevel;
        const bLevel = b.evidenceLevel;

        if (aLevel === undefined && bLevel === undefined) {
            return 0;
        } else if (aLevel === undefined) {
            return -1;
        } else if (bLevel === undefined) {
            return 1;
        } else if (bLevel > aLevel) {
            return -1;
        } else if (aLevel > bLevel) {
            return 1;
        } else {
            return 0;
        }
    });

    return filteredEvidences;
}

function summarizeEvidence(evidence: Evidence): ICivicEvidenceSummary {
    return {
        id: evidence.id,
        type: evidence.evidenceType,
        clinicalSignificance: evidence.significance,
        level: evidence.evidenceLevel,
        therapies: (evidence.therapies || []).map(d => d.name),
        disease: evidence.disease?.displayName || evidence.disease?.name,
    };
}

/**
 * Returns a map with the different variant names and their variant id.
 */
function createVariantMap(
    variantArray: CivicVariant[]
): { [variantName: string]: number } {
    let variantMap: { [variantName: string]: number } = {};
    if (variantArray && variantArray.length > 0) {
        variantArray.forEach(function(variant) {
            variantMap[variant.name] = variant.id;
        });
    }
    return variantMap;
}

function createCivicVariantSummaryMap(
    variantArray: CivicVariant[],
    civicId: number
): { [variantName: string]: ICivicVariantSummary } {
    let variantMap: { [variantName: string]: ICivicVariantSummary } = {};
    if (variantArray && variantArray.length > 0) {
        variantArray.forEach(function(variant) {
            const civicMolecularProfile = variant.singleVariantMolecularProfile;
            const supportingEvidences = findSupportingEvidences(
                civicMolecularProfile.evidenceItems.nodes
            );

            const civicVariantSummary: ICivicVariantSummary = {
                id: variant.id,
                name: variant.name,
                geneId: civicId,
                description: civicMolecularProfile.description,
                url: 'https://civicdb.org/variants/' + variant.id + '/summary',
                evidenceCounts: countEvidenceTypes(
                    civicMolecularProfile.evidenceItems.nodes
                ),
                evidences: supportingEvidences.map(summarizeEvidence),
            };
            variantMap[variant.name] = civicVariantSummary;
        });
    }
    return variantMap;
}

/**
 * CIViC
 */
export class CivicAPI {
    /**
     * Retrieves the gene entries for the ids given, if they are in the Civic API.
     */
    getCivicGenesBatch(hugoGeneSymbol: string): Promise<ICivicGeneSummary[]> {
        return client
            .query({
                query: gql`
                    query gene($entrezSymbol: String, $id: Int) {
                        gene(entrezSymbol: $entrezSymbol, id: $id) {
                            id
                            description
                            link
                            name
                            variants {
                                nodes {
                                    name
                                    id
                                    singleVariantMolecularProfile {
                                        description
                                        evidenceItems {
                                            nodes {
                                                id
                                                name
                                                description
                                                evidenceType
                                                evidenceDirection
                                                evidenceLevel
                                                significance
                                                disease {
                                                    displayName
                                                    name
                                                    id
                                                    link
                                                }
                                                therapies {
                                                    name
                                                    id
                                                    ncitId
                                                    therapyAliases
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                `,
                variables: { entrezSymbol: hugoGeneSymbol },
            })
            .then(civicResponse => {
                const response: CivicAPIGene = civicResponse.data.gene;
                const result: CivicAPIGene[] =
                    response instanceof Array ? response : [response];
                return _.compact(result).map((record: CivicAPIGene) => ({
                    id: record.id,
                    name: record.name,
                    description: record.description,
                    url: 'https://civicdb.org/genes/' + record.id + '/summary',
                    variants: createCivicVariantSummaryMap(
                        record.variants.nodes,
                        record.id
                    ),
                }));
            });
    }
}

export default CivicAPI;
