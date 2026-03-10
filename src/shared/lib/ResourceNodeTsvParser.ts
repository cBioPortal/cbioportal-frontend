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

    return lines.slice(1).map(line => {
        const values = line.split('\t');
        const row: any = {};
        mappedHeaders.forEach((header, i) => {
            const value = (values[i] || '').trim();
            if (header === 'metadata') {
                row[header] = value ? JSON.parse(value) : undefined;
            } else {
                row[header] = value;
            }
        });
        return row as ResourceNodeRow;
    });
}
