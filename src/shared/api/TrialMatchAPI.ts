import * as request from 'superagent';
import {ITrialMatchGeneData} from "shared/model/TrialMatch.ts";
import {ICivicGeneData} from "../model/Civic";

type TrialMatchAPIGene = {
    matches: TrialMatch[];
};

type TrialMatch = {
    nctID: string;
    trialTitle: string;
    code: string;
    matchType: string;
    matchLevel: string;
    proteinChange: string;
    dose: string;
    trialStatus: string;
    oncogenicity: string;
    mutEffect: string;
    [propName: string]: any;
};


/**
 * CIViC
 */
export default class TrialMatchAPI {
    /**
     * Retrieves the gene entries for the ids given, if they are in the Civic API.
     */
    getTrialMatchGenesBatch(ids: string): Promise<ITrialMatchGeneData[]> {
        return request.get('http://localhost:8082/api/matches/genes/' + ids)
            .then((res) => {
                const response = res.body;
                let result: TrialMatchAPIGene[];
                if (response instanceof Array) {
                    result = response;
                } else {
                    result = [response];
                }
                return result.map((record: TrialMatchAPIGene) => ({
                    matches: record.matches
                }));
            });
    }
}