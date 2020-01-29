import { LevelOfEvidenceType } from 'cbioportal-frontend-commons';

export type IndicatorQueryTreatment = {
    level: LevelOfEvidenceType;
};

export type ArticleAbstract = {
    abstract: string;
    link: string;
};

export type Citations = {
    abstracts: ArticleAbstract[];
    pmids: string[];
};

export type MutationEffectResp = {
    knownEffect: string;
    citations: Citations;
    description: string;
};

export type Query = {
    id: string;
    alteration: string;
    tumorType: string;
    hugoSymbol: string;
};

export type IndicatorQueryResp = {
    highestSensitiveLevel: LevelOfEvidenceType;
    highestResistanceLevel: LevelOfEvidenceType;
    vus: boolean;
    geneExist: boolean;
    geneSummary: string;
    tumorTypeSummary: string;
    variantSummary: string;
    query: Query;
    oncogenic: string;
    mutationEffect: MutationEffectResp;
    treatments: IndicatorQueryTreatment[];
};

export type OncoKbTreatment = {
    level: string;
    variant: string[];
    cancerType: string;
    pmids: number[];
    abstracts: ArticleAbstract[];
    description: string;
    treatment: string;
};

export type CancerGene = {
    entrezGeneId: number;
    oncokbAnnotated: boolean;
};

export interface IOncoKbData {
    indicatorMap: { [id: string]: IndicatorQueryResp } | null;
}

export interface IEvidence {
    id: string;
    gene: any;
    alteration: any[];
    prevalence: any[];
    progImp: any[];
    treatments: {
        sensitivity: any[];
        resistance: any[];
    }; //separated by level type
    trials: any[];
    oncogenic: string;
    oncogenicRefs: string[];
    mutationEffect: any;
    summary: string;
    drugs: {
        sensitivity: {
            current: any[];
            inOtherTumor: any[];
        };
        resistance: any[];
    };
}
