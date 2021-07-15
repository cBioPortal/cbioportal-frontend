import * as request from 'superagent';
import _ from 'lodash';

import { ICivicGeneSummary, ICivicVariantSummary } from '../model/Civic';

type CivicAPIGene = {
    id: number;
    name: string;
    description: string;
    variants: Array<CivicAPIGeneVariant>;
};

type CivicAPIGeneVariant = {
    name: string;
    id: number;
    evidence_items: Evidence[];
    assertions: Assertion[];
};

type Evidence = {
    evidence_type: string;
};

type Assertion = {
    id: number;
    name: string;
    type: string;
    evidence_type: string;
    clinical_significance: string;
    evidence_item_count: number;
    fda_regulatory_approval: boolean;
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

/**
 * Returns a map with the different types of evidence and the number of times that each evidence happens.
 */
function countEvidenceTypes(
    evidenceItems: Evidence[]
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

function getUniqueDrugs(assertions: Assertion[]): string[] {
    return _.uniq(
        _.flatten(
            assertions.map(assertion => assertion.drugs.map(drug => drug.name))
        )
    );
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
    getCivicVariantSummary(
        id: number,
        name: string,
        geneId: number
    ): Promise<ICivicVariantSummary> {
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
                    evidenceCounts: countEvidenceTypes(result.evidence_items),
                    drugs: getUniqueDrugs(result.assertions),
                };
            });
    }
}

export default CivicAPI;
