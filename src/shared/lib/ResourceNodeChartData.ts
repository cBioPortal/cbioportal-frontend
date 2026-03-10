import { ResourceNodeRow } from './ResourceNodeTypes';

export interface ResourceMetadataRow {
    value: string;
    count: number;
    uniquePatientKeys: string[];
    uniqueSampleKeys: string[];
}

export interface ResourceMetadataChartData {
    metadataKey: string;
    rows: ResourceMetadataRow[];
}

export function buildChartDataFromMetadata(
    rows: ResourceNodeRow[]
): ResourceMetadataChartData[] {
    const keyMap = new Map<
        string,
        Map<
            string,
            { count: number; patients: Set<string>; samples: Set<string> }
        >
    >();

    for (const row of rows) {
        if (!row.metadata) continue;
        for (const [key, value] of Object.entries(row.metadata)) {
            const strValue = String(value);
            if (!keyMap.has(key)) {
                keyMap.set(key, new Map());
            }
            const valueMap = keyMap.get(key)!;
            if (!valueMap.has(strValue)) {
                valueMap.set(strValue, {
                    count: 0,
                    patients: new Set(),
                    samples: new Set(),
                });
            }
            const entry = valueMap.get(strValue)!;
            entry.count++;
            entry.patients.add(row.patientId);
            entry.samples.add(row.sampleId);
        }
    }

    const result: ResourceMetadataChartData[] = [];
    for (const [key, valueMap] of keyMap) {
        const chartRows: ResourceMetadataRow[] = [];
        for (const [value, entry] of valueMap) {
            chartRows.push({
                value,
                count: entry.count,
                uniquePatientKeys: Array.from(entry.patients),
                uniqueSampleKeys: Array.from(entry.samples),
            });
        }
        result.push({ metadataKey: key, rows: chartRows });
    }
    return result;
}
