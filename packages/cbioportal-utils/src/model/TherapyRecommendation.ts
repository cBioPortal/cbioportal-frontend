export enum TREvidenceLevel {
    NA,
    m1A,
    m1B,
    m1C,
    m2A,
    m2B,
    m2C,
    m3,
    m4,
}

export enum EvidenceLevelExtension {
    NA = '',
    IS = 'is',
    IV = 'iv',
    R = 'R',
    ZFDA = 'Z(FDA)',
    ZEMA = 'Z(EMA)',
}

export enum MtbState {
    PARTIAL = 'Partial',
    PRELIMINARY = 'Preliminary',
    FINAL = 'Final',
}

export interface IRecommender {
    credentials: string;
    full_name?: string;
    email?: string;
}

export interface IMtb {
    id: string;
    orderId: string;
    therapyRecommendations: ITherapyRecommendation[];
    geneticCounselingRecommendation: boolean;
    rebiopsyRecommendation: boolean;
    generalRecommendation: string;
    diagnosis: string;
    date: string;
    mtbState: MtbState;
    samples: string[];
    author: string;
}

export interface ITherapyRecommendation {
    id: string;
    comment: string[];
    reasoning: IReasoning;
    evidenceLevel: TREvidenceLevel;
    evidenceLevelExtension?: EvidenceLevelExtension;
    evidenceLevelM3Text: string;
    author: string;
    treatments: ITreatment[];
    references: IReference[];
    clinicalTrials: IClinicalTrial[];
    diagnosis?: string[];
    studyId?: string;
    caseId?: string;
}

export interface IClinicalTrial {
    name: string;
    id: string;
}

export interface IReference {
    name: string;
    pmid?: number;
    comment?: string;
}

export interface ITreatment {
    name: string;
    ncit_code: string;
    synonyms?: string;
}

export interface IClinicalData {
    sampleId?: string;
    attributeId?: string;
    attributeName?: string;
    value: string;
}

export interface IReasoning {
    geneticAlterations?: IGeneticAlteration[];
    clinicalData?: IClinicalData[];
    tmb?: number;
    other?: string;
}

export interface IGeneticAlteration {
    entrezGeneId?: number;
    hugoSymbol: string;
    alteration?: string;
    chromosome?: string;
    start?: number;
    end?: number;
    ref?: string;
    alt?: string;
    aminoAcidChange?: string;
    alleleFrequency?: number | null;
    dbsnp?: string;
    clinvar?: number;
    cosmic?: string;
    gnomad?: number;
    sampleIds?: string[];
}

export interface IDeletions {
    mtb: string[];
    therapyRecommendation: string[];
    followUp: string[];
}

export interface IResponseCriteria {
    cr3: boolean;
    pr3: boolean;
    sd3: boolean;
    pd3: boolean;
    cr6: boolean;
    pr6: boolean;
    sd6: boolean;
    pd6: boolean;
    cr12: boolean;
    pr12: boolean;
    sd12: boolean;
    pd12: boolean;
}

export interface IFollowUp {
    id: string;
    therapyRecommendation: ITherapyRecommendation;
    date: string;
    author: string;
    therapyRecommendationRealized: boolean;
    sideEffect: boolean;
    response: IResponseCriteria;
    comment: string;
}

export interface ISharedTherapyRecommendationData {
    localTherapyRecommendations: ITherapyRecommendation[];
    localFollowUps: IFollowUp[];
    sharedTherapyRecommendations: ITherapyRecommendation[];
    sharedFollowUps: IFollowUp[];
    proteinChange?: string;
    diagnosis?: string[];
    caseId?: string;
    studyId?: string;
}
