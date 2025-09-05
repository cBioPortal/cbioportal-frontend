import * as React from 'react';
import StructuralVariantTable, {
    StructuralVariantTableColumnType,
    IStructuralVariantTableProps,
} from 'shared/components/structuralVariantTable/StructuralVariantTable';

export interface IResultsViewStructuralVariantTableProps
    extends IStructuralVariantTableProps {
    // add results view specific props here if needed
}

export default class ResultsViewStructuralVariantTable extends StructuralVariantTable<
    IResultsViewStructuralVariantTableProps
> {
    public static defaultProps = {
        ...StructuralVariantTable.defaultProps,
        // The columns order is defined here
        columns: [
            StructuralVariantTableColumnType.STUDY,
            StructuralVariantTableColumnType.SAMPLE_ID,
            StructuralVariantTableColumnType.CANCER_TYPE_DETAILED,
            StructuralVariantTableColumnType.SITE1_HUGO_SYMBOL,
            StructuralVariantTableColumnType.SITE1_ENTREZ_GENE_ID,
            StructuralVariantTableColumnType.SITE1_ENSEMBL_TRANSCRIPT_ID,
            StructuralVariantTableColumnType.SITE1_CHROMOSOME,
            StructuralVariantTableColumnType.SITE1_POSITION,
            StructuralVariantTableColumnType.SITE1_EXON,
            StructuralVariantTableColumnType.SITE1_DESCRIPTION,
            StructuralVariantTableColumnType.SITE2_HUGO_SYMBOL,
            StructuralVariantTableColumnType.SITE2_ENTREZ_GENE_ID,
            StructuralVariantTableColumnType.SITE2_ENSEMBL_TRANSCRIPT_ID,
            StructuralVariantTableColumnType.SITE2_CHROMOSOME,
            StructuralVariantTableColumnType.SITE2_POSITION,
            StructuralVariantTableColumnType.SITE2_EXON,
            StructuralVariantTableColumnType.SITE2_DESCRIPTION,
            StructuralVariantTableColumnType.SITE2_EFFECT_ON_FRAME,
            StructuralVariantTableColumnType.ANNOTATION,
            StructuralVariantTableColumnType.MUTATION_STATUS,
            StructuralVariantTableColumnType.NCBI_BUILD,
            StructuralVariantTableColumnType.DNA_SUPPORT,
            StructuralVariantTableColumnType.RNA_SUPPORT,
            StructuralVariantTableColumnType.NORMAL_READ_COUNT,
            StructuralVariantTableColumnType.TUMOR_READ_COUNT,
            StructuralVariantTableColumnType.NORMAL_VARIANT_COUNT,
            StructuralVariantTableColumnType.TUMOR_VARIANT_COUNT,
            StructuralVariantTableColumnType.NORMAL_PAIRED_END_READ_COUNT,
            StructuralVariantTableColumnType.TUMOR_PAIRED_END_READ_COUNT,
            StructuralVariantTableColumnType.NORMAL_SPLIT_READ_COUNT,
            StructuralVariantTableColumnType.TUMOR_SPLIT_READ_COUNT,
            StructuralVariantTableColumnType.SV_DESCRIPTION,
            StructuralVariantTableColumnType.BREAKPOINT_TYPE,
            StructuralVariantTableColumnType.CENTER,
            StructuralVariantTableColumnType.CONNECTION_TYPE,
            StructuralVariantTableColumnType.EVENT_INFO,
            StructuralVariantTableColumnType.VARIANT_CLASS,
            StructuralVariantTableColumnType.LENGTH,
            StructuralVariantTableColumnType.COMMENTS,
        ],
    };
}
