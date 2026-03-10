import { NamespaceAttribute } from 'cbioportal-ts-api-client';
import {
    ResourceMetadataChartData,
    ResourceMetadataRow,
} from './ResourceNodeChartData';

// Matches MultiSelectionTableRow from studyView/table/MultiSelectionTable.tsx
// without importing it directly to avoid circular deps
export interface MockMultiSelectionTableRow {
    uniqueKey: string;
    label: string;
    numberOfAlteredCases: number;
    numberOfProfiledCases: number;
    totalCount: number;
    qValue: number;
    matchingGenePanelIds: Array<string>;
    oncokbAnnotated: boolean;
    isOncokbOncogene: boolean;
    isOncokbTumorSuppressorGene: boolean;
    isCancerGene: boolean;
}

const OUTER_KEY = 'resource_metadata';

/**
 * Convert metadata keys into NamespaceAttribute[] for chart registration.
 */
export function buildNamespaceAttributes(
    chartData: ResourceMetadataChartData[]
): NamespaceAttribute[] {
    return chartData.map(d => ({
        outerKey: OUTER_KEY,
        innerKey: d.metadataKey,
    }));
}

/**
 * Convert a single metadata key's value counts into MultiSelectionTableRow[].
 * This is the shape that getVariantAnnotationChartData() returns via
 * invokeNamespaceDataCount().
 */
export function buildTableRowsForKey(
    chartDataEntry: ResourceMetadataChartData,
    totalProfiledCases: number
): MockMultiSelectionTableRow[] {
    return chartDataEntry.rows.map((row: ResourceMetadataRow) => ({
        uniqueKey: row.value,
        label: row.value,
        numberOfAlteredCases: row.count,
        numberOfProfiledCases: totalProfiledCases,
        totalCount: row.count,
        qValue: 0,
        matchingGenePanelIds: [],
        oncokbAnnotated: false,
        isOncokbOncogene: false,
        isOncokbTumorSuppressorGene: false,
        isCancerGene: false,
    }));
}

/**
 * Build a lookup from uniqueKey ("resource_metadata_<metadataKey>")
 * to pre-computed MultiSelectionTableRow[].
 * This can be used to override getVariantAnnotationChartData() promises.
 */
export function buildChartDataLookup(
    chartData: ResourceMetadataChartData[],
    totalProfiledCases: number
): Map<string, MockMultiSelectionTableRow[]> {
    const lookup = new Map<string, MockMultiSelectionTableRow[]>();
    for (const entry of chartData) {
        const uniqueKey = `${OUTER_KEY}_${entry.metadataKey}`;
        lookup.set(uniqueKey, buildTableRowsForKey(entry, totalProfiledCases));
    }
    return lookup;
}
