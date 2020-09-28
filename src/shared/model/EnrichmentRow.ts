import { GroupStatistics } from 'cbioportal-ts-api-client';

export interface BaseEnrichmentRow {
    checked: boolean;
    disabled: boolean;
    logRatio?: number;
    pValue: number;
    qValue: number;
    groupsSet: { [id: string]: GroupStatistics };
    enrichedGroup: string;
}

export interface ExpressionEnrichmentRow extends BaseEnrichmentRow {
    hugoGeneSymbol: string;
    entrezGeneId: number;
    cytoband: string;
}

export interface GenericAssayEnrichmentRow extends BaseEnrichmentRow {
    stableId: string;
    entityName: string;
}
