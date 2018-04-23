import * as request from 'superagent';
import {ITrialMatchGene, ITrialMatchGeneData, ITrialMatchVariant, ITrialMatchVariantData, ITrialMatchData} from "shared/model/TrialMatch.ts";

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
    oncogenicity: string;
    mutEffect: string;
    matches: Array<ITrialMatchData>;
};

type TrialMatch = {
    trialTitle: string;
    nctID: string;
    trialStatus: string;
    code: string;
    matchLevel: string;
    matchType: string;
    dose: string;
    [propName: string]: any;
};

/**
 * Returns a map with the different types of evidence and the number of times that each evidence happens.
 */
function countMatches(trialMatchItems: Array<TrialMatch>): {[trialTitle: string]: string} {
    const match: {[trialTitle: string]: string} = {};
    trialMatchItems.forEach(function (trialMatchItem: TrialMatch) {
        let trialTitle = trialMatchItem.trialTitle;
        match[trialTitle] = trialMatchItem.nctID + "," + trialMatchItem.trialStatus + "," +
                            trialMatchItem.code  + "," + trialMatchItem.dose;
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
                    oncogenicity: result.oncogenicity,
                    mutEffect: result.mutEffect,
                    match: countMatches(result.matches)
                };
            });
    }
}
