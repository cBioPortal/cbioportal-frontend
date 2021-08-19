import * as request from 'superagent';

import {
    EvidenceLevel,
    ICivicEvidenceSummary,
    ICivicGeneSummary,
    ICivicVariantSummary,
} from '../model/Civic';

type CivicAPIGene = {
    id: number;
    name: string;
    description: string;
    variants: Array<CivicAPIGeneVariant>;
};

type CivicAPIGeneVariant = {
    id: number;
    name: string;
    evidence_items: Evidence[];
};

type Evidence = {
    id: number;
    name: string;
    evidence_type: string;
    clinical_significance: string;
    evidence_direction: EvidenceDirection;
    evidence_level: EvidenceLevel;
    drugs: Drug[];
    disease: Disease;
};

type Disease = {
    id: number;
    name: string;
    display_name: string;
    url: string;
};

type Drug = {
    id: number;
    name: string;
    ncit_id: string;
    aliases: string[];
};

enum EvidenceDirection {
    Supports = 'Supports',
    DoesNotSupport = 'Does Not Support',
}

enum ClinicalSignificance {
    // Clinical Significance For Predictive Evidence
    Sensitivity = 'Sensitivity/Response',
    Resistance = 'Resistance',
    AdverseResponse = 'Adverse Response',
    ReducedSensitivity = 'Reduced Sensitivity',
    NA = 'N/A',
}

/**
 * Returns a map with the different types of evidence and the number of times that each evidence happens.
 */
function countEvidenceTypes(
    evidenceItems: Evidence[]
): { [evidenceType: string]: number } {
    const counts: { [evidenceType: string]: number } = {};

    evidenceItems.forEach(function(evidenceItem: Evidence) {
        const evidenceType = evidenceItem.evidence_type;
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
            evidence.evidence_direction === EvidenceDirection.Supports &&
            filter(evidence)
    );

    filteredEvidences.sort((a, b) => {
        const aLevel = a.evidence_level;
        const bLevel = b.evidence_level;

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
        type: evidence.evidence_type,
        clinicalSignificance: evidence.clinical_significance,
        level: evidence.evidence_level,
        drugs: (evidence.drugs || []).map(d => d.name),
        disease: evidence.disease?.display_name || evidence.disease?.name,
    };
}

/**
 * Returns a map with the different variant names and their variant id.
 */
function createVariantMap(
    variantArray: CivicAPIGeneVariant[]
): { [variantName: string]: number } {
    let variantMap: { [variantName: string]: number } = {};
    if (variantArray && variantArray.length > 0) {
        variantArray.forEach(function(variant) {
            variantMap[variant.name] = variant.id;
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
    getCivicGenesBatch(ids: string): Promise<ICivicGeneSummary[]> {
        return request
            .get('https://civicdb.org/api/genes/' + ids)
            .query({ identifier_type: 'entrez_id' })
            .then(res => {
                const response = res.body;
                const result: CivicAPIGene[] =
                    response instanceof Array ? response : [response];
                return result.map((record: CivicAPIGene) => ({
                    id: record.id,
                    name: record.name,
                    description: record.description,
                    url:
                        'https://civicdb.org/events/genes/' +
                        record.id +
                        '/summary',
                    variants: createVariantMap(record.variants),
                }));
            });
    }

    /**
     * Returns a promise that resolves with the variants for the parameters given.
     */
    getCivicVariantSummary(
        id: number,
        name: string,
        geneId: number
    ): Promise<ICivicVariantSummary> {
        return request
            .get('https://civicdb.org/api/variants/' + id)
            .then(response => {
                const result = response.body;
                const supportingEvidences = findSupportingEvidences(
                    result.evidence_items
                );

                return {
                    id,
                    name,
                    geneId,
                    description: result.description,
                    url:
                        'https://civicdb.org/events/genes/' +
                        geneId +
                        '/summary/variants/' +
                        id +
                        '/summary#variant',
                    evidenceCounts: countEvidenceTypes(result.evidence_items),
                    evidences: supportingEvidences.map(summarizeEvidence),
                };
            });
    }
}

export default CivicAPI;
