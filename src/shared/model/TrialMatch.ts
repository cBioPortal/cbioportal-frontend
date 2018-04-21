export interface ITrialMatchGeneData {
    name: string;
    variants: {[variantName: string]: string};
}

export interface ITrialMatchVariantData {
    id: string;
    name: string;
    gene: string;
    match: {[title: string]: number};
}

export interface ITrialMatchGene {[name: string]: ITrialMatchGeneData;}

export interface ITrialMatchVariant {[geneName: string]: {[variantName: string]: ITrialMatchVariantData};}

export interface ITrialMatchEntry {
    name: string;
    variants: {[name: string]: ITrialMatchVariantData};
};

export type MobXStatus = "pending" | "error" | "complete";

export interface ICivicGeneDataWrapper {
    status: MobXStatus;
    result?: ITrialMatchGene;
}

export interface ICivicVariantDataWrapper {
    status: MobXStatus;
    result?: ITrialMatchVariant;
}