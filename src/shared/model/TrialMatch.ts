export interface ITrialMatchGeneData {
    hugoSymbol: string;
    variants: {[variantName: string]: string};
}

export interface ITrialMatchVariantData {
    genomicId: string;
    name: string;
    gene: string;
    exonNumber: string;
    oncogenicity: string;
    mutEffect: string;
    matches: {[title:string]:TrialMatchData[]};
}

export type TrialMatchData = {
    title: string;
    nctID: string;
    status: string;
    code: string;
    hugoSymbol: string;
    matchLevel: string;
    matchMolecularType: string;
    matchCancerType: string,
    mutEffect: string,
    dose: string;
    variantClassification: string;
};

export interface ITrialMatchGene {[name: string]: ITrialMatchGeneData;}

export interface ITrialMatchVariant {[sampleId:string]:{[geneName: string]: {[variantName: string]: ITrialMatchVariantData}};}

export interface ITrialMatchEntry {
    name: string;
    variants: {[id: string]: ITrialMatchVariantData};
}

export type MobXStatus = "pending" | "error" | "complete";

export interface ITrialMatchGeneDataWrapper {
    status: MobXStatus;
    result?: ITrialMatchGene;
}

export interface ITrialMatchVariantDataWrapper {
    status: MobXStatus;
    result?: ITrialMatchVariant;
}