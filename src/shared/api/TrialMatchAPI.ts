import * as request from 'superagent';
import {ITrialMatchGene, ITrialMatchGeneData, ITrialMatchVariant, ITrialMatchVariantData, TrialMatchData} from "shared/model/TrialMatch.ts";

type TrialMatchAPIGene = {
    hugoSymbol: string;
    variants: TrialMatchAPIGeneVariant[];
};

type TrialMatchAPIGeneVariant = {
    proteinChange: string;
    sampleId: string;
};

type TrialMatchAPIVariant = {
    name: string;
    oncogenicity: string;
    mutEffect: string;
    matches: TrialMatchData[];
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
function countMatches(trialMatchItems: Array<TrialMatch>): {[title:string]:Array<TrialMatchData>} {
    const matches: {[title:string]:Array<TrialMatchData>} = {};

    trialMatchItems.forEach(trialMatchItem => {
        if (!matches[trialMatchItem.trialTitle]) {
            matches[trialMatchItem.trialTitle] = [];
        }
        matches[trialMatchItem.trialTitle].push({
            title: trialMatchItem.trialTitle,
            nctID: trialMatchItem.nctID,
            status: trialMatchItem.trialStatus,
            code: trialMatchItem.code,
            matchLevel: trialMatchItem.matchLevel,
            matchType: trialMatchItem.matchType,
            dose: trialMatchItem.dose});

    });
    return matches;
}

/**
 * Returns a map with the different variant names and their variant id.
 */
function createVariantMap(variantArray: Array<TrialMatchAPIGeneVariant>): {[variantName: string]: string} {
    let variantMap: {[variantName: string]: string} = {};
    if (variantArray && variantArray.length > 0) {
        variantArray.forEach(function(variant) {
            if (!variantMap[variant.proteinChange]) {
                variantMap[variant.proteinChange] = variant.sampleId;
            }
            else {
                variantMap[variant.proteinChange] += ',' + variant.sampleId;
            }
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
                    hugoSymbol: record.hugoSymbol,
                    variants: createVariantMap(record.variants)
                }));
            });
    }

    /**
     * Returns a promise that resolves with the variants for the parameters given.
     */
    getVariant(id: string, name: string, gene: string): Promise<ITrialMatchVariantData> {
        return request.get('http://localhost:8081/web/api/matches/' + gene + '/' + name + '?sample=' + id)
            .then((res) => {
                const result = res.body;
                return {
                    genomicId: result[id].genomicId,
                    name,
                    gene,
                    oncogenicity: result[id].oncogenicity,
                    mutEffect: result[id].mutEffect,
                    matches: countMatches(result[id].matches)
                };
            });
    }
}
