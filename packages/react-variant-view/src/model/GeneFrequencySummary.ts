// this component comes from signal

export interface IGeneFrequencySummary {
    hugoSymbol: string;
    penetrance: string[];
    sampleCount: number;
    frequencies: IFrequencySummary[];
}

export interface ITumorTypeFrequencySummary extends IGeneFrequencySummary {
    tumorType: string;
}

export interface IFrequencySummary {
    frequency: number;
    category: FrequencySummaryCategory;
}

export enum FrequencySummaryCategory {
    DEFAULT = 'NA',
    SOMATIC_DRIVER = 'somaticDriverByGene',
    PATHOGENIC_GERMLINE = 'pathogenicGermlineByGene',
    PERCENT_BIALLELIC = 'percentBiallelicByGene',
}
