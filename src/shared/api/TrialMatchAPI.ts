import * as request from 'superagent';
import {ITrialMatchGene, ITrialMatchGeneData, ITrialMatchVariant, ITrialMatchVariantData} from "shared/model/TrialMatch.ts";

type TrialMatchAPIGene = {
    name: string;
    variants: Array<TrialMatchAPIGeneVariant>;
};

type TrialMatchAPIGeneVariant = {
    name: string;
    id: string;
};

type TrialMatchAPIVariant = {
    name: string;
    matches: Array<TrialMatch>;
};

type TrialMatch = {
    trialTitle: string;
    [propName: string]: any;
};

/**
 * Returns a map with the different types of evidence and the number of times that each evidence happens.
 */
function countMatches(trialMatchItems: Array<TrialMatch>): {[title: string]: number} {
    const match: {[title: string]: number} = {};
    trialMatchItems.forEach(function (trialMatchItem: TrialMatch) {
        let title = trialMatchItem.trialTitle;
        if (match.hasOwnProperty(title)) {
            match[title] += 1;
        }
        else {
            match[title] = 1;
        }
    });
    return match;
};

/**
 * Returns a map with the different variant names and their variant id.
 */
function createVariantMap(variantArray: Array<TrialMatchAPIGeneVariant>): {[variantName: string]: string} {
    let variantMap: {[variantName: string]: string} = {};
    if (variantArray && variantArray.length > 0) {
        variantArray.forEach(function(variant) {
            variantMap[variant.name] = variant.id;
        });
    }
    return variantMap;
};

/**
 * CIViC
 */
export default class TrialMatchAPI {
    /**
     * Retrieves the gene entries for the ids given, if they are in the Civic API.
     */
    getTrialMatchGenesBatch(ids: string): Promise<Array<ITrialMatchGeneData>> {
        return request.get('http://localhost:8081/web/api/matches/genes/' + ids)
            .then((res) => {
                let response = res.body;
                let result: Array<TrialMatchAPIGene>;
                if (response instanceof Array) {
                    result = response;
                } else {
                    result = [response];
                }
                return result.map((record: TrialMatchAPIGene) => ({
                    name: record.name,
                    variants: createVariantMap(record.variants)
                }));
            });
    }

    /**
     * Returns a promise that resolves with the variants for the parameters given.
     */
    getVariant(id: string, name: string, gene: string): Promise<ITrialMatchVariantData> {
        return request.get('http://localhost:8081/web/api/matches/variants/' + id)
            .then((res) => {
                const result = res.body;
                return {
                    id,
                    name,
                    gene,
                    match: countMatches(result.matches)
                };
            });
    }
}
