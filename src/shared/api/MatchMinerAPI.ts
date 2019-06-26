import * as request from 'superagent';
import { ITrial, ITrialMatch } from "shared/model/MatchMiner.ts";
import { buildCBioPortalAPIUrl } from "./urls";

/**
 * Retrieves the trial matches for the query given, if they are in the MatchMiner API.
 */

const cbioportalUrl = buildCBioPortalAPIUrl('api-legacy/proxy/matchminer/api');
export async function postMatchMinerTrialMatches(query: object): Promise<Array<ITrialMatch>> {
    return request.post(cbioportalUrl + '/post_trial_match')
    .set('Content-Type', 'application/json')
    .send(query)
    .then((res) => {
        const response = JSON.parse(JSON.parse(res.text));
        return response.map((record:any) => ({
            nctId: record.nct_id,
            protocolNo: record.protocol_no,
            oncotreePrimaryDiagnosisName: record.oncotree_primary_diagnosis_name,
            gender: record.gender,
            matchType: record.match_type,
            armDescription: record.arm_description ? record.arm_description : '',
            trueHugoSymbol: record.true_hugo_symbol,
            trialAccrualStatus: record.trial_accrual_status,
            matchLevel: record.match_level,
            sampleId: record.sample_id,
            mrn: record.mrn,
            trueProteinChange: record.true_protein_change,
            vitalStatus: record.vital_status,
            genomicAlteration: record.genomic_alteration,
            patientClinical: record.trial_age_numerical + ' ' + record.trial_oncotree_primary_diagnosis,
            patientGenomic: record.true_hugo_symbol + ' ' + record.true_protein_change,
            trialAgeNumerical: record.trial_age_numerical,
            trialOncotreePrimaryDiagnosis: record.trial_oncotree_primary_diagnosis
        }));
    });
}

export async function getMatchMinerTrialByTypeId(type: string, id: string): Promise<ITrial> {
    return request.get(cbioportalUrl + '/' + type + '/'+ id)
    .then((res) => {
        const response = JSON.parse(JSON.parse(res.text));
        return {
            nctId: response.nct_id,
            protocolNo: response.protocol_no,
            phase: response.phase,
            shortTitle: response.short_title,
            status: response.status,
            treatmentList: response.treatment_list
        };
    });
}

export async function postMatchMinerTrial(query: object): Promise<Array<ITrial>> {
    return request.post(cbioportalUrl + '/post_trial')
    .set('Content-Type', 'application/json')
    .send(query)
    .then((res) => {
        const response = JSON.parse(JSON.parse(res.text));
        return response.map((record:any) => ({
            nctId: record.nct_id,
            protocolNo: record.protocol_no,
            phase: record.phase,
            shortTitle: record.short_title,
            status: record.status,
            treatmentList: record.treatment_list
        }));
    });
}

export async function postMatchMinerTrialsById(query: object): Promise<Array<ITrial>> {
    return request.post(cbioportalUrl + '/trials')
    .set('Content-Type', 'application/json')
    .send(query)
    .then((res) => {
        const response = JSON.parse(JSON.parse(res.text));
        return response.map((record:any) => ({
            nctId: record.nct_id,
            protocolNo: record.protocol_no,
            phase: record.phase,
            shortTitle: record.short_title,
            status: record.status,
            treatmentList: record.treatment_list
        }));
    });
}
