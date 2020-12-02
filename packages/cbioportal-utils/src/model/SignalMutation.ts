import { CountByTumorType, SignalMutation } from 'genome-nexus-ts-api-client';

export interface ISignalTumorTypeDecomposition extends CountByTumorType {
    frequency: number | null;
    biallelicRatio: number | null;
    biallelicVariantCount: number;
}

export interface IExtendedSignalMutation extends SignalMutation {
    tumorTypeDecomposition: ISignalTumorTypeDecomposition[];
    somaticFrequency: number | null;
    germlineFrequency: number | null;
    pathogenicGermlineFrequency: number | null;
    biallelicGermlineFrequency: number | null;
    biallelicPathogenicGermlineFrequency: number | null;
    ratioBiallelicPathogenic: number | null;
}
