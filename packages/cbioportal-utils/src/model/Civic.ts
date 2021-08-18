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
    evidences: ICivicEvidenceSummary[];
}

export enum EvidenceLevel {
    A = 'A',
    B = 'B',
    C = 'C',
    D = 'D',
    E = 'E',
}

export interface ICivicEvidenceSummary {
    id: number;
    type: string;
    clinicalSignificance: string;
    level: EvidenceLevel;
    drugs: string[];
    disease?: string;
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
