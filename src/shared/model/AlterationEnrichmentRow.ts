export interface AlterationEnrichmentRow {
    checked: boolean;
    disabled: boolean;
    hugoGeneSymbol: string;
    entrezGeneId: number;
    cytoband: string;
    alteredCount: number;
    alteredPercentage: number;
    unalteredCount: number;
    unalteredPercentage: number;
    logRatio: number;
    pValue: number;
    qValue: number;
}
