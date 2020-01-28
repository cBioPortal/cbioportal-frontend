import { LevelOfEvidence } from '../api/model/oncokb';

export const LEVELS = {
    sensitivity: ['4', '3B', '3A', '2B', '2A', '2', '1', '0'],
    resistance: ['R3', 'R2', 'R1'],
    all: ['4', 'R3', '3B', '3A', 'R2', '2B', '2A', '2', '1', 'R1', '0'],
};

export enum AlterationTypes {
    Mutation = 0,
}

export function generatePartialEvidenceQuery(evidenceTypes?: string) {
    return {
        evidenceTypes: evidenceTypes
            ? evidenceTypes
            : 'GENE_SUMMARY,GENE_BACKGROUND,ONCOGENIC,MUTATION_EFFECT,VUS,MUTATION_SUMMARY,TUMOR_TYPE_SUMMARY,STANDARD_THERAPEUTIC_IMPLICATIONS_FOR_DRUG_SENSITIVITY,STANDARD_THERAPEUTIC_IMPLICATIONS_FOR_DRUG_RESISTANCE,INVESTIGATIONAL_THERAPEUTIC_IMPLICATIONS_DRUG_SENSITIVITY,INVESTIGATIONAL_THERAPEUTIC_IMPLICATIONS_DRUG_RESISTANCE',
        highestLevelOnly: false,
        levels: [
            LevelOfEvidence.LEVEL_1,
            LevelOfEvidence.LEVEL_2,
            LevelOfEvidence.LEVEL_2A,
            LevelOfEvidence.LEVEL_2B,
            LevelOfEvidence.LEVEL_3A,
            LevelOfEvidence.LEVEL_3B,
            LevelOfEvidence.LEVEL_4,
            LevelOfEvidence.LEVEL_R1,
            LevelOfEvidence.LEVEL_R2,
        ],
        source: 'cbioportal',
    };
}

export function generateQueryVariant(
    entrezGeneId: number,
    tumorType: string | null,
    alteration?: string,
    mutationType?: string,
    proteinPosStart?: number,
    proteinPosEnd?: number,
    alterationType?: string
) {
    let query = {
        id: generateQueryVariantId(
            entrezGeneId,
            tumorType,
            alteration,
            mutationType
        ),
        hugoSymbol: '',
        tumorType: tumorType as string, // generated api typings are wrong, it can accept null
        alterationType:
            alterationType || AlterationTypes[AlterationTypes.Mutation],
        entrezGeneId: entrezGeneId,
        alteration: alteration || '',
        consequence: mutationType || 'any',
        proteinStart: proteinPosStart === undefined ? -1 : proteinPosStart,
        proteinEnd: proteinPosEnd === undefined ? -1 : proteinPosEnd,
        type: 'web',
        hgvs: '',
        svType: 'DELETION', // TODO: hack because svType is not optional
    };

    // Use proper parameters for Intragenic variant
    if (query.alteration.toLowerCase().indexOf('intragenic') !== -1) {
        query.alterationType = 'structural_variant';
        query.svType = 'DELETION';
        query.consequence = '';
    }
    return query;
}

export function generateQueryVariantId(
    entrezGeneId: number,
    tumorType: string | null,
    alteration?: string,
    mutationType?: string
): string {
    let id = tumorType ? `${entrezGeneId}_${tumorType}` : `${entrezGeneId}`;

    if (alteration) {
        id = `${id}_${alteration}`;
    }

    if (mutationType) {
        id = `${id}_${mutationType}`;
    }

    return id.trim().replace(/\s/g, '_');
}
