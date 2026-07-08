import {
    GermlineIndicatorQueryResp,
    SomaticIndicatorQueryResp,
} from 'oncokb-ts-api-client';

export type IndicatorQueryResp =
    | SomaticIndicatorQueryResp
    | GermlineIndicatorQueryResp;

// The indicator type guards live in cbioportal-utils (the package that owns the
// IndicatorQueryResp union). Re-exported here so existing importers of this
// module keep working, but there is a single canonical definition.
export { isGermlineIndicator, isSomaticIndicator } from 'cbioportal-utils';

export type Query = {
    id: string;
    alteration: string;
    tumorType: string;
    hugoSymbol: string;
};

export interface IOncoKbData {
    indicatorMap: { [id: string]: IndicatorQueryResp } | null;
}

export enum OncoKbCardDataType {
    BIOLOGICAL,
    TXS,
    TXR,
    DX,
    PX,
}

export enum EvidenceType {
    GENE_SUMMARY = 'GENE_SUMMARY',
    MUTATION_SUMMARY = 'MUTATION_SUMMARY',
    TUMOR_TYPE_SUMMARY = 'TUMOR_TYPE_SUMMARY',
    GENE_TUMOR_TYPE_SUMMARY = 'GENE_TUMOR_TYPE_SUMMARY',
    PROGNOSTIC_SUMMARY = 'PROGNOSTIC_SUMMARY',
    DIAGNOSTIC_SUMMARY = 'DIAGNOSTIC_SUMMARY',
    GENE_BACKGROUND = 'GENE_BACKGROUND',
    ONCOGENIC = 'ONCOGENIC',
    MUTATION_EFFECT = 'MUTATION_EFFECT',
    VUS = 'VUS',
    PROGNOSTIC_IMPLICATION = 'PROGNOSTIC_IMPLICATION',
    DIAGNOSTIC_IMPLICATION = 'DIAGNOSTIC_IMPLICATION',
    STANDARD_THERAPEUTIC_IMPLICATIONS_FOR_DRUG_SENSITIVITY = 'STANDARD_THERAPEUTIC_IMPLICATIONS_FOR_DRUG_SENSITIVITY',
    STANDARD_THERAPEUTIC_IMPLICATIONS_FOR_DRUG_RESISTANCE = 'STANDARD_THERAPEUTIC_IMPLICATIONS_FOR_DRUG_RESISTANCE',
    INVESTIGATIONAL_THERAPEUTIC_IMPLICATIONS_DRUG_SENSITIVITY = 'INVESTIGATIONAL_THERAPEUTIC_IMPLICATIONS_DRUG_SENSITIVITY',
    INVESTIGATIONAL_THERAPEUTIC_IMPLICATIONS_DRUG_RESISTANCE = 'INVESTIGATIONAL_THERAPEUTIC_IMPLICATIONS_DRUG_RESISTANCE',
}
