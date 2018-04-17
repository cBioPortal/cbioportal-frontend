export interface ITrialMatchGeneData {
    matches: ITrialMatch[];
}

export interface ITrialMatch {
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

export interface ITrialMatchGene {[name: string]: ITrialMatchGeneData;}

export type MobXStatus = "pending" | "error" | "complete";

export interface ITrialMatchDataWrapper {
    status: MobXStatus;
    result?: ITrialMatchGeneData;
}