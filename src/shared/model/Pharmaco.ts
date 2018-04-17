export interface IPharmacoGeneData {
    id: number;
    name: string;
    description: string;
    url: string;
    variants: {[variantName: string]: number};
};

export interface IPharmacoVariantData {
    id: number;
    name: string;
    geneId: number;
    description: string;
    url: string;
    evidence: {[evidenceType: string]: number};
};

export interface IPharmacoGene {[name: string]: IPharmacoGeneData;};

export interface IPharmacoVariant {[geneName: string]: {[variantName: string]: IPharmacoVariantData};};

export interface IPharmacoEntry {
    name: string;
    description: string;
    url: string;
    variants: {[name: string]: IPharmacoVariantData};
};

export type MobXStatus = "pending" | "error" | "complete";

export interface IPharmacoGeneDataWrapper {
    status: MobXStatus;
    result?: IPharmacoGene;
}

export interface IPharmacoVariantDataWrapper {
    status: MobXStatus;
    result?: IPharmacoVariant;
}