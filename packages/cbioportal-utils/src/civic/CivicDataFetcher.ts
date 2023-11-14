import fetch from 'cross-fetch';
import { ApolloClient, HttpLink, InMemoryCache, gql } from '@apollo/client';

import {
    EvidenceLevel,
    ICivicEvidenceSummary,
    ICivicGeneSummary,
    ICivicVariantSummary,
} from '../model/Civic';
import _ from 'lodash';

type CivicAPIGenes = {
    pageInfo: PageInfo;
    nodes: Array<CivicAPIGene>;
};

type PageInfo = {
    endCursor: string;
    hasNextPage: boolean;
    startCursor: string;
    hasPreviousPage: boolean;
};

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
     * Retrieves the gene entries for the hugo symbols given, if they are in the Civic API.
     */
    async getCivicGeneSummaries(
        hugoGeneSymbols: string[]
    ): Promise<ICivicGeneSummary[]> {
        let result: ICivicGeneSummary[] = [];
        // civic genes api can return up to 50 civic genes in a single request (no limit on sending)
        // if result contains more than 50 genes, the first 50 genes will be returned, other queries (genes after 50) will need to be sent again
        // the next query will start from the last gene of previous query (by giving "after" parameter), which is the "endCursor" field returned in previous query
        // set needToFetch to true to make sure the query will be sent at least for the first time
        let needToFetch = true;
        let after = null;
        while (needToFetch) {
            const civicGenes: CivicAPIGenes = await this.fetchCivicAPIGenes(
                hugoGeneSymbols,
                after
            );
            // hasNextPage is true means there are more than 50 genes in the return, and need to make another request
            if (civicGenes.pageInfo?.hasNextPage) {
                // Update endCursor when next page is available
                after = civicGenes.pageInfo.endCursor;
                // continue fetching data from the next page
                needToFetch = true;
            } else {
                // set needToFetch to false if no next page
                needToFetch = false;
            }
            // filter our null responses
            const filteredCivicGenes = _.compact(civicGenes.nodes);
            const geneSummaries = _.map(filteredCivicGenes, record => {
                const geneSummary: ICivicGeneSummary = {
                    id: record.id,
                    name: record.name,
                    description: record.description,
                    url: 'https://civicdb.org/genes/' + record.id + '/summary',
                    variants: createCivicVariantSummaryMap(
                        record.variants.nodes,
                        record.id
                    ),
                };
                return geneSummary;
            });
            result.push(...geneSummaries);
        }
        return Promise.resolve(result);
    }

    fetchCivicAPIGenes(
        hugoGeneSymbols: string[],
        after: string | null = null
    ): Promise<CivicAPIGenes> {
        return client
            .query({
                query: gql`
                    query genes($after: String, $entrezSymbols: [String!]) {
                        genes(after: $after, entrezSymbols: $entrezSymbols) {
                            pageInfo {
                                endCursor
                                hasNextPage
                                startCursor
                                hasPreviousPage
                            }
                            nodes {
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
                    }
                `,
                variables: { after: after, entrezSymbols: hugoGeneSymbols },
            })
            .then(civicResponse => {
                return civicResponse.data.genes as CivicAPIGenes;
            });
    }
}

export default CivicAPI;
