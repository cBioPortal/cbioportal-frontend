export interface IMyCancerGenome {
    hugoGeneSymbol: string;
    alteration: string;
    cancerType: string;
    linkHTML: string;
}

export interface IMyCancerGenomeData {
    [hugoSymbol: string]: IMyCancerGenome[];
}
