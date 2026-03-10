import { ResourceNodeRow } from './ResourceNodeTypes';

export interface MetadataValueCount {
    value: string;
    count: number;
}

export function extractMetadataKeys(rows: ResourceNodeRow[]): string[] {
    const keys = new Set<string>();
    for (const row of rows) {
        if (row.metadata) {
            Object.keys(row.metadata).forEach(k => keys.add(k));
        }
    }
    return Array.from(keys);
}

export function aggregateMetadataCounts(
    rows: ResourceNodeRow[]
): Map<string, MetadataValueCount[]> {
    const counts = new Map<string, Map<string, number>>();

    for (const row of rows) {
        if (!row.metadata) continue;
        for (const [key, value] of Object.entries(row.metadata)) {
            const strValue = String(value);
            if (!counts.has(key)) {
                counts.set(key, new Map());
            }
            const valueCounts = counts.get(key)!;
            valueCounts.set(strValue, (valueCounts.get(strValue) || 0) + 1);
        }
    }

    const result = new Map<string, MetadataValueCount[]>();
    for (const [key, valueCounts] of counts) {
        result.set(
            key,
            Array.from(valueCounts.entries()).map(([value, count]) => ({
                value,
                count,
            }))
        );
    }
    return result;
}
