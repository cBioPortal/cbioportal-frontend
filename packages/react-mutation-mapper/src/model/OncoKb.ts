export type Level = "LEVEL_0" | "LEVEL_1" | "LEVEL_2A" | "LEVEL_2B" | "LEVEL_3A" | "LEVEL_3B" | "LEVEL_4" | "LEVEL_R1" | "LEVEL_R2" | "LEVEL_R3" | "LEVEL_Px1" | "LEVEL_Px2" | "LEVEL_Px3" | "LEVEL_Dx1" | "LEVEL_Dx2" | "LEVEL_Dx3";

export type IndicatorQueryTreatment = {
    level: Level;
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
    highestSensitiveLevel: Level;
    highestResistanceLevel: Level;
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
    level: string,
    variant: string[],
    cancerType: string,
    pmids: number[],
    abstracts: ArticleAbstract[],
    description: string,
    treatment: string
};

export type CancerGene = {
    entrezGeneId: number;
    oncokbAnnotated: boolean;
};

export interface IOncoKbData {
    indicatorMap: {[id:string]: IndicatorQueryResp} | null;
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
        },
        resistance: any[];
    };
}
