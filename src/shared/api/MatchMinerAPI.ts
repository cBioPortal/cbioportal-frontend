import * as request from 'superagent';
import { ITrial, ITrialMatch } from 'shared/model/MatchMiner';
import { buildCBioPortalAPIUrl } from './urls';

/**
 * Retrieves the trial matches for the query given, if they are in the MatchMiner API.
 */
// It cannot be set globally since it will cause test error: undefined of 'replace'.
export async function fetchTrialMatches(query: {
    mrn: string;
}): Promise<Array<ITrialMatch>> {
    const cbioportalUrl = buildCBioPortalAPIUrl('api/matchminer');
    return request
        .get(cbioportalUrl + '/api/trial_match/' + query.mrn)
        .set('Content-Type', 'application/json')
        .send(query)
        .then(res => {
            const myResponse = JSON.parse(res.text);
            const response = myResponse._items;
            let ret: Array<ITrialMatch> = [];
            response.forEach((record: any) => {
                let curRecord: ITrialMatch = {
                    id: record.nct_id + '+' + record.protocol_no,
                    nctId: record.nct_id,
                    protocolNo: record.protocol_no,
                    gender: record.gender ? record.gender : '',
                    matchType: record.match_type ? record.match_type : '',
                    armDescription: record.arm_description
                        ? record.arm_description
                        : '',
                    armType: record.arm_type ? record.arm_type : '',
                    sampleId: record.sample_id,
                    mrn: record.mrn,
                    vitalStatus: record.vital_status ? record.vital_status : '',
                    genomicAlteration: record.genomic_alteration
                        ? record.genomic_alteration
                        : '',
                    trueHugoSymbol: record.true_hugo_symbol
                        ? record.true_hugo_symbol
                        : '',
                    trueProteinChange: record.true_protein_change
                        ? record.true_protein_change
                        : '',
                    oncotreePrimaryDiagnosisName: record.oncotree_primary_diagnosis_name
                        ? record.oncotree_primary_diagnosis_name
                        : '',
                    trialAgeNumerical: record.trial_age_numerical
                        ? record.trial_age_numerical
                        : '',
                    trialOncotreePrimaryDiagnosis: record.trial_oncotree_primary_diagnosis
                        ? record.trial_oncotree_primary_diagnosis
                        : '',
                    shortTitle: record.short_title ? record.short_title : '',
                    status: record.trial_summary_status
                        ? record.trial_summary_status
                        : '',
                };
                ret.push(curRecord);
            });
            return ret;
        });
}

export async function fetchTrialsById(query: object): Promise<Array<ITrial>> {
    const cbioportalUrl = buildCBioPortalAPIUrl('api/matchminer');
    return request
        .get(cbioportalUrl + '/api/trial')
        .set('Content-Type', 'application/json')
        .send(query)
        .then(res => {
            const myResponse = JSON.parse(res.text);
            const response = myResponse._items;
            let ret: Array<ITrial> = [];
            response.forEach((record: any) => {
                let curRecord: ITrial = {
                    id: record.nct_id + '+' + record.protocol_no,
                    nctId: record.nct_id,
                    protocolNo: record.protocol_no,
                    principalInvestigator: record.principal_investigator,
                    phase: record.phase,
                    shortTitle: record.short_title,
                    status: record.status,
                    treatmentList: record.treatment_list,
                };
                ret.push(curRecord);
            });
            return ret;
        });
}
