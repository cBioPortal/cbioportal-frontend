import { GroupStatistics } from 'shared/api/generated/CBioPortalAPIInternal';

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
