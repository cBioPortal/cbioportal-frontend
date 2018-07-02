export interface ExpressionEnrichmentRow {
    checked: boolean;
    disabled: boolean;
    hugoGeneSymbol: string;
    entrezGeneId: number;
    cytoband: string;
    meanExpressionInAlteredGroup: number;
    meanExpressionInUnalteredGroup: number;
    standardDeviationInAlteredGroup: number;
    standardDeviationInUnalteredGroup: number;
    logRatio: number;
    pValue: number;
    qValue: number;
}
