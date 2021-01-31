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
    exonNumber: string;
    matches: TrialMatchData[];
};

type TrialMatch = {
    trialTitle: string;
    nctID: string;
    trialStatus: string;
    code: string;
    hugoSymbol: string;
    matchLevel: string;
    matchMolecularType: string;
    matchCancerType: string;
    mutEffect: string;
    dose: string;
    variantClassification: string;
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
        let matchMolecularType: string;
        const variantClassification = trialMatchItem.variantClassification.replace("_"," ");
        switch (trialMatchItem.mutEffect) {
            case 'Gain-of-function':
            case 'Likely Gain-of-function':
                matchMolecularType = "Activating " + trialMatchItem.hugoSymbol + " " + variantClassification;
                break;
            case 'Loss-of-function':
            case 'Likely Loss-of-function':
                matchMolecularType = "Inactivating " + trialMatchItem.hugoSymbol + " " + variantClassification;
                break;
            default:
                matchMolecularType = trialMatchItem.hugoSymbol + " " + variantClassification;
        }
        matches[trialMatchItem.trialTitle].push({
            title: trialMatchItem.trialTitle,
            nctID: trialMatchItem.nctID,
            status: trialMatchItem.trialStatus,
            code: trialMatchItem.code,
            hugoSymbol: trialMatchItem.hugoSymbol,
            matchLevel: trialMatchItem.matchLevel,
            matchMolecularType: matchMolecularType,
            dose: trialMatchItem.dose,
            matchCancerType: trialMatchItem.matchCancerType,
            mutEffect: trialMatchItem.mutEffect,
            variantClassification: trialMatchItem.variantClassification
        });

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
        return request.get('https://cbioportal.ca/web/api/matches/genes/' + ids)
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
        return request.get('https://cbioportal.ca/web/api/matches/' + gene + '/' + name + '?sample=' + id)
            .then((res) => {
                const result = res.body;
                return {
                    genomicId: result[id].genomicId,
                    name,
                    gene,
                    exonNumber: result[id].exonNumber,
                    oncogenicity: result[id].oncogenicity,
                    mutEffect: result[id].mutEffect,
                    matches: countMatches(result[id].matches)
                };
            });
    }
}
