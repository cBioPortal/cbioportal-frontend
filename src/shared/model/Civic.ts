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

export interface ICivicGeneDataWrapper {
    status: "pending" | "error" | "complete";
    result?: ICivicGene;
}

export interface ICivicVariantDataWrapper {
    status: "pending" | "error" | "complete";
    result?: ICivicVariant;
}