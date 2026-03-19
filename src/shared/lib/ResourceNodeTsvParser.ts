import { ResourceNodeRow } from './ResourceNodeTypes';

const HEADER_MAP: Record<string, keyof ResourceNodeRow> = {
    PATIENT_ID: 'patientId',
    SAMPLE_ID: 'sampleId',
    RESOURCE_ID: 'resourceId',
    URL: 'url',
    DISPLAY_NAME: 'displayName',
    TYPE: 'type',
    GROUP_PATH: 'groupPath',
    METADATA: 'metadata',
};

export function parseTsvToRows(tsv: string): ResourceNodeRow[] {
    const lines = tsv.trim().split('\n');
    const headers = lines[0].split('\t');
    const mappedHeaders = headers.map(h => HEADER_MAP[h.trim()] || h.trim());
    const hasSampleId = mappedHeaders.includes('sampleId');

    return lines.slice(1).map(line => {
        const values = line.split('\t');
        const row: any = {};
        mappedHeaders.forEach((header, i) => {
            const value = (values[i] || '').trim();
            if (header === 'metadata') {
                if (!value) {
                    row[header] = undefined;
                } else {
                    // Handle CSV-escaped JSON: "{""key"": ""val""}" → {"key": "val"}
                    let json = value;
                    if (json.startsWith('"') && json.endsWith('"')) {
                        json = json.slice(1, -1).replace(/""/g, '"');
                    }
                    row[header] = JSON.parse(json);
                }
            } else {
                row[header] = value;
            }
        });
        // When no SAMPLE_ID column exists (patient-level resources), use patientId
        if (!hasSampleId || !row.sampleId) {
            row.sampleId = row.patientId;
        }
        return row as ResourceNodeRow;
    });
}
