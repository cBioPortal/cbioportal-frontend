import { GroupStatistics } from 'cbioportal-ts-api-client';

export interface ExpressionEnrichmentRow {
    checked: boolean;
    disabled: boolean;
    hugoGeneSymbol: string;
    entrezGeneId: number;
    cytoband: string;
    logRatio?: number;
    pValue: number;
    qValue: number;
    groupsSet: { [id: string]: GroupStatistics };
    enrichedGroup: string;
}
