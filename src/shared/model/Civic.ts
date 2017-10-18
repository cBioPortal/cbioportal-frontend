export interface ICivicGeneData {
    id: number;
    name: string;
    description: string;
    url: string;
    variants: {[variantName: string]: number};
};

export interface ICivicVariantData {
    id: number;
    name: string;
    geneId: number;
    description: string;
    url: string;
    evidence: {[evidenceType: string]: number};
};

export interface ICivicGene {[name: string]: ICivicGeneData;};

export interface ICivicVariant {[geneName: string]: {[variantName: string]: ICivicVariantData};};

export interface ICivicEntry {
    name: string;
    description: string;
    url: string;
    variants: {[name: string]: ICivicVariantData};
};

export type MobXStatus = "pending" | "error" | "complete";

export interface ICivicGeneDataWrapper {
    status: MobXStatus;
    result?: ICivicGene;
}

export interface ICivicVariantDataWrapper {
    status: MobXStatus;
    result?: ICivicVariant;
}