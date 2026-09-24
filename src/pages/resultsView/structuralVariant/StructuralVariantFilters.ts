import { CancerStudy, StructuralVariant } from 'cbioportal-ts-api-client';
import { Exon } from 'genome-nexus-ts-api-client';
import { FusionTableColumnType } from 'shared/components/structuralVariantTable/StructuralVariantTable';
import { StructuralVariantExt } from 'shared/model/Fusion';

export interface NumericColumnFilter {
    kind: 'numeric';
    lowerBound: number;
    upperBound: number;
    hideEmptyValues: boolean;
}

export interface CategoricalColumnFilter {
    kind: 'categorical';
    filterCondition: string;
    filterString: string;
    selections: Set<string>;
}

export type StructuralVariantColumnFilter =
    | NumericColumnFilter
    | CategoricalColumnFilter;

export const numericColumns = new Set<FusionTableColumnType>([
    FusionTableColumnType.SITE1_POSITION,
    FusionTableColumnType.SITE2_POSITION,
    FusionTableColumnType.NORMAL_READ_COUNT,
    FusionTableColumnType.TUMOR_READ_COUNT,
    FusionTableColumnType.NORMAL_VARIANT_COUNT,
    FusionTableColumnType.TUMOR_VARIANT_COUNT,
    FusionTableColumnType.NORMAL_PAIRED_END_READ_COUNT,
    FusionTableColumnType.TUMOR_PAIRED_END_READ_COUNT,
    FusionTableColumnType.NORMAL_SPLIT_READ_COUNT,
    FusionTableColumnType.TUMOR_SPLIT_READ_COUNT,
    FusionTableColumnType.LENGTH,
]);

const attributes: Partial<Record<
    FusionTableColumnType,
    keyof StructuralVariant | 'center'
>> = {
    [FusionTableColumnType.STUDY]: 'studyId',
    [FusionTableColumnType.SAMPLE_ID]: 'sampleId',
    [FusionTableColumnType.SITE1_HUGO_SYMBOL]: 'site1HugoSymbol',
    [FusionTableColumnType.SITE1_ENTREZ_GENE_ID]: 'site1EntrezGeneId',
    [FusionTableColumnType.SITE1_ENSEMBL_TRANSCRIPT_ID]:
        'site1EnsemblTranscriptId',
    [FusionTableColumnType.SITE1_CHROMOSOME]: 'site1Chromosome',
    [FusionTableColumnType.SITE1_POSITION]: 'site1Position',
    [FusionTableColumnType.SITE1_DESCRIPTION]: 'site1Description',
    [FusionTableColumnType.SITE2_HUGO_SYMBOL]: 'site2HugoSymbol',
    [FusionTableColumnType.SITE2_ENTREZ_GENE_ID]: 'site2EntrezGeneId',
    [FusionTableColumnType.SITE2_ENSEMBL_TRANSCRIPT_ID]:
        'site2EnsemblTranscriptId',
    [FusionTableColumnType.SITE2_CHROMOSOME]: 'site2Chromosome',
    [FusionTableColumnType.SITE2_POSITION]: 'site2Position',
    [FusionTableColumnType.SITE2_DESCRIPTION]: 'site2Description',
    [FusionTableColumnType.SITE2_EFFECT_ON_FRAME]: 'site2EffectOnFrame',
    [FusionTableColumnType.MUTATION_STATUS]: 'svStatus',
    [FusionTableColumnType.NCBI_BUILD]: 'ncbiBuild',
    [FusionTableColumnType.DNA_SUPPORT]: 'dnaSupport',
    [FusionTableColumnType.RNA_SUPPORT]: 'rnaSupport',
    [FusionTableColumnType.NORMAL_READ_COUNT]: 'normalReadCount',
    [FusionTableColumnType.TUMOR_READ_COUNT]: 'tumorReadCount',
    [FusionTableColumnType.NORMAL_VARIANT_COUNT]: 'normalVariantCount',
    [FusionTableColumnType.TUMOR_VARIANT_COUNT]: 'tumorVariantCount',
    [FusionTableColumnType.NORMAL_PAIRED_END_READ_COUNT]:
        'normalPairedEndReadCount',
    [FusionTableColumnType.TUMOR_PAIRED_END_READ_COUNT]:
        'tumorPairedEndReadCount',
    [FusionTableColumnType.NORMAL_SPLIT_READ_COUNT]: 'normalSplitReadCount',
    [FusionTableColumnType.TUMOR_SPLIT_READ_COUNT]: 'tumorSplitReadCount',
    [FusionTableColumnType.SV_DESCRIPTION]: 'annotation',
    [FusionTableColumnType.BREAKPOINT_TYPE]: 'breakpointType',
    [FusionTableColumnType.CENTER]: 'center',
    [FusionTableColumnType.CONNECTION_TYPE]: 'connectionType',
    [FusionTableColumnType.EVENT_INFO]: 'eventInfo',
    [FusionTableColumnType.VARIANT_CLASS]: 'variantClass',
    [FusionTableColumnType.LENGTH]: 'length',
    [FusionTableColumnType.COMMENTS]: 'comments',
};

export interface StructuralVariantFilterContext {
    studyIdToStudy?: { [studyId: string]: CancerStudy };
    uniqueSampleKeyToTumorType?: { [key: string]: string };
    transcriptToExons?: Map<string, Exon[]>;
    annotationValue?: (row: StructuralVariant[]) => string;
}

export function exonOrIntronLabel(
    exons: Exon[] | undefined,
    position: number
): string {
    if (!exons) return '';
    const exon = exons.find(
        e => e.exonStart <= position && position <= e.exonEnd
    );
    if (exon) return `Exon ${exon.rank}`;
    for (let i = 1; i < exons.length; i++) {
        if (exons[i - 1].exonEnd < position && position < exons[i].exonStart) {
            return `Intron ${exons[i - 1].rank}`;
        }
    }
    return '';
}

export function structuralVariantColumnValue(
    row: StructuralVariant[],
    column: FusionTableColumnType,
    context: StructuralVariantFilterContext = {}
): string | number | null {
    const variant = row[0];
    if (!variant) return null;
    if (column === FusionTableColumnType.STUDY) {
        return (
            context.studyIdToStudy?.[variant.studyId]?.name || variant.studyId
        );
    }
    if (column === FusionTableColumnType.CANCER_TYPE_DETAILED) {
        return (
            context.uniqueSampleKeyToTumorType?.[variant.uniqueSampleKey] ||
            null
        );
    }
    if (column === FusionTableColumnType.ANNOTATION) {
        return context.annotationValue?.(row) || null;
    }
    if (
        column === FusionTableColumnType.SITE1_EXON ||
        column === FusionTableColumnType.SITE2_EXON
    ) {
        const firstSite = column === FusionTableColumnType.SITE1_EXON;
        const transcriptId = firstSite
            ? variant.site1EnsemblTranscriptId
            : variant.site2EnsemblTranscriptId;
        const transcript =
            transcriptId !== 'NA'
                ? transcriptId
                : firstSite
                ? variant.site1HugoSymbol
                : variant.site2HugoSymbol;
        const position = firstSite
            ? variant.site1Position
            : variant.site2Position;
        return (
            exonOrIntronLabel(
                context.transcriptToExons?.get(transcript),
                position
            ) || null
        );
    }
    const attribute = attributes[column];
    const value = attribute
        ? attribute === 'center'
            ? (variant as StructuralVariantExt).center
            : variant[attribute]
        : null;
    return value === undefined ||
        value === null ||
        value === '' ||
        value === 'NA'
        ? null
        : (value as string | number);
}

export function matchesColumnFilter(
    value: string | number | null,
    filter: StructuralVariantColumnFilter
): boolean {
    if (filter.kind === 'numeric') {
        const number = value === null ? null : Number(value);
        return number === null || !Number.isFinite(number)
            ? !filter.hideEmptyValues
            : number >= filter.lowerBound && number <= filter.upperBound;
    }
    const text = value === null ? '(Blanks)' : String(value);
    const search = filter.filterString.toUpperCase();
    const upper = text.toUpperCase();
    let matchesSearch = true;
    if (search) {
        switch (filter.filterCondition) {
            case 'doesNotContain':
                matchesSearch = !upper.includes(search);
                break;
            case 'equals':
                matchesSearch = upper === search;
                break;
            case 'doesNotEqual':
                matchesSearch = upper !== search;
                break;
            case 'beginsWith':
                matchesSearch = upper.startsWith(search);
                break;
            case 'doesNotBeginWith':
                matchesSearch = !upper.startsWith(search);
                break;
            case 'endsWith':
                matchesSearch = upper.endsWith(search);
                break;
            case 'doesNotEndWith':
                matchesSearch = !upper.endsWith(search);
                break;
            case 'regex':
                try {
                    matchesSearch = new RegExp(filter.filterString).test(text);
                } catch (e) {
                    matchesSearch = false;
                }
                break;
            default:
                matchesSearch = upper.includes(search);
        }
    }
    return matchesSearch && filter.selections.has(text);
}
