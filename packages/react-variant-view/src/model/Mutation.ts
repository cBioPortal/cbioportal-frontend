// this component comes from signal
export interface ICountByTumorType {
    tumorType: string;
    tumorTypeCount: number;
    variantCount: number;
}

export interface ITumorTypeDecomposition extends ICountByTumorType {
    frequency: number | null;
    biallelicRatio: number | null;
    biallelicVariantCount: number;
}

export interface IMutation {
    chromosome: string;
    countsByTumorType: ICountByTumorType[];
    biallelicCountsByTumorType: ICountByTumorType[];
    qcPassCountsByTumorType: ICountByTumorType[];
    endPosition: number;
    hugoGeneSymbol: string;
    mutationStatus: string;
    pathogenic: string;
    penetrance: string;
    referenceAllele: string;
    startPosition: number;
    variantAllele: string;
}

export interface IExtendedMutation extends IMutation {
    tumorTypeDecomposition: ITumorTypeDecomposition[];
    somaticFrequency: number | null;
    germlineFrequency: number | null;
    pathogenicGermlineFrequency: number | null;
    biallelicGermlineFrequency: number | null;
    biallelicPathogenicGermlineFrequency: number | null;
    ratioBiallelicPathogenic: number | null;
}
