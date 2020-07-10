import * as request from 'superagent';

import { ICivicGeneData, ICivicVariantData } from '../model/Civic';

type CivicAPIGene = {
    id: number;
    name: string;
    description: string;
    variants: Array<CivicAPIGeneVariant>;
    [propName: string]: any;
};

type CivicAPIGeneVariant = {
    name: string;
    id: number;
    [propName: string]: any;
};

type Evidence = {
    evidence_type: string;
    [propName: string]: any;
};

/**
 * Returns a map with the different types of evidence and the number of times that each evidence happens.
 */
function countEvidenceTypes(
    evidenceItems: Array<Evidence>
): { [evidenceType: string]: number } {
    let evidence: { [evidenceType: string]: number } = {};
    evidenceItems.forEach(function(evidenceItem: Evidence) {
        let evidenceType = evidenceItem.evidence_type;
        if (evidence.hasOwnProperty(evidenceType)) {
            evidence[evidenceType] += 1;
        } else {
            evidence[evidenceType] = 1;
        }
    });
    return evidence;
}

/**
 * Returns a map with the different variant names and their variant id.
 */
function createVariantMap(
    variantArray: Array<CivicAPIGeneVariant>
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
    getCivicGenesBatch(ids: string): Promise<Array<ICivicGeneData>> {
        return request
            .get('https://civicdb.org/api/genes/' + ids)
            .query({ identifier_type: 'entrez_id' })
            .then(res => {
                let response = res.body;
                let result: Array<CivicAPIGene>;
                if (response instanceof Array) {
                    result = response;
                } else {
                    result = [response];
                }
                return result.map((record: CivicAPIGene) => ({
                    id: record.id,
                    name: record.name,
                    description: record.description,
                    url:
                        'https://civicdb.org/#/events/genes/' +
                        record.id +
                        '/summary',
                    variants: createVariantMap(record.variants),
                }));
            });
    }

    /**
     * Returns a promise that resolves with the variants for the parameters given.
     */
    getVariant(
        id: number,
        name: string,
        geneId: number
    ): Promise<ICivicVariantData> {
        return request
            .get('https://civicdb.org/api/variants/' + id)
            .then(res => {
                let result = res.body;
                return {
                    id,
                    name,
                    geneId,
                    description: result.description,
                    url:
                        'https://civicdb.org/#/events/genes/' +
                        geneId +
                        '/summary/variants/' +
                        id +
                        '/summary#variant',
                    evidence: countEvidenceTypes(result.evidence_items),
                };
            });
    }
}

export default CivicAPI;
