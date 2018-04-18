import * as request from 'superagent';
import {ITrialMatchData} from "shared/model/TrialMatch.ts";

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
};


/**
 * CIViC
 */
export default class TrialMatchAPI {
    /**
     * Retrieves the gene entries for the ids given, if they are in the Civic API.
     */
    getTrialMatchGenesBatch(id: string): Promise<ITrialMatchData[]> {
        return request.get('http://localhost:8082/api/matches/genes/' + id)
            .then((res) => {
                const response = res.body;
                let result: TrialMatch[];
                if (response instanceof Array) {
                    result = response;
                } else {
                    result = [response];
                }
                return result.map((record: TrialMatch) => ({
                    nctID: record.nctID,
                    trialTitle: record.trialTitle,
                    code: record.code,
                    matchType: record.matchType,
                    matchLevel: record.matchLevel,
                    proteinChange: record.proteinChange,
                    dose: record.dose,
                    trialStatus: record.trialStatus,
                    oncogenicity: record.oncogenicity,
                    mutEffect: record.mutEffect
                }));
            });
    }
}