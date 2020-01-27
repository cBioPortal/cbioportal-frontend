import { CountSummary } from 'shared/api/generated/CBioPortalAPIInternal';

export interface AlterationEnrichmentRow {
    checked: boolean;
    disabled: boolean;
    hugoGeneSymbol: string;
    entrezGeneId: number;
    cytoband: string;
    logRatio?: number;
    pValue?: number;
    qValue?: number;
    value?: number; // for copy number, used in group comparison
    groupsSet: { [id: string]: CountSummary & { alteredPercentage: number } };
    enrichedGroup?: string;
}
