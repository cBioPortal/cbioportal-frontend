export type IndicatorQueryTreatment = {
    level: "LEVEL_0" | "LEVEL_1" | "LEVEL_2A" | "LEVEL_2B" | "LEVEL_3A" | "LEVEL_3B" | "LEVEL_4" | "LEVEL_R1" | "LEVEL_R2" | "LEVEL_R3" | "LEVEL_Px1" | "LEVEL_Px2" | "LEVEL_Px3" | "LEVEL_Dx1" | "LEVEL_Dx2" | "LEVEL_Dx3"
};

export type MutationEffectResp = {
    knownEffect: string;
};

export type Query = {
    alteration: string;
    tumorType: string;
};

export type IndicatorQueryResp = {
    query: Query;
    oncogenic: string;
    mutationEffect: MutationEffectResp;
    treatments: IndicatorQueryTreatment[];
};

export type CancerGene = {
    entrezGeneId: number;
    oncokbAnnotated: boolean;
};

export interface IOncoKbData {
    indicatorMap: {[id:string]: IndicatorQueryResp} | null;
}
