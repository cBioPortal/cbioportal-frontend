export interface ITrialMatchGeneData {
    name: string;
    variants: {[variantName: string]: string};
}

export interface ITrialMatchVariantData {
    id: string;
    name: string;
    gene: string;
    oncogenicity: string;
    mutEffect: string;
    match: {[trialTitle: string]: string};
}

export interface ITrialMatchData {
    title: string;
    nctID: string;
    code: string;
    matchLevel: string;
    matchType: string;
    dose: string;
}

export interface ITrialMatchGene {[name: string]: ITrialMatchGeneData;}

export interface ITrialMatchVariant {[geneName: string]: {[variantName: string]: ITrialMatchVariantData};}

export interface ITrialMatchEntry {
    name: string;
    variants: {[name: string]: ITrialMatchVariantData};
};

export type MobXStatus = "pending" | "error" | "complete";

export interface ITrialMatchGeneDataWrapper {
    status: MobXStatus;
    result?: ITrialMatchGene;
}

export interface ITrialMatchVariantDataWrapper {
    status: MobXStatus;
    result?: ITrialMatchVariant;
}