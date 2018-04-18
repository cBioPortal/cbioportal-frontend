export interface ITrialMatchData {
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
}

export interface ITrialMatchGeneData {[gene: string]: ITrialMatchData[];}

export type MobXStatus = "pending" | "error" | "complete";

export interface ITrialMatchDataWrapper {
    status: MobXStatus;
    result?: ITrialMatchGeneData;
}