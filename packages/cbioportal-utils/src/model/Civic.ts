export interface ICivicGeneSummary {
    id: number;
    name: string;
    description: string;
    url: string;
    variants: { [variantName: string]: number };
}

export interface ICivicVariantSummary {
    id: number;
    name: string;
    geneId: number;
    description: string;
    url: string;
    evidenceCounts: { [evidenceType: string]: number };
    drugs: string[];
}

export interface ICivicGeneIndex {
    [name: string]: ICivicGeneSummary;
}

export interface ICivicVariantIndex {
    [geneName: string]: { [variantName: string]: ICivicVariantSummary };
}

export interface ICivicEntry {
    name: string;
    description: string;
    url: string;
    variants: { [name: string]: ICivicVariantSummary };
}
