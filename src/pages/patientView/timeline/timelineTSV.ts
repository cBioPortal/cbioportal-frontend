import { ClinicalEvent, ClinicalEventData } from 'cbioportal-ts-api-client';

const HEADER = ['PATIENT_ID\tSTART_DATE\tSTOP_DATE\tTYPE\tVALUE'];

export function toTSV(events: ClinicalEvent[]): string {
    const rows = HEADER.concat(events.map(toRow));
    return rows.join('\n') + '\n';
}

function toRow(event: ClinicalEvent): string {
    const row = [
        event.patientId,
        event.startNumberOfDaysSinceDiagnosis !== undefined
            ? event.startNumberOfDaysSinceDiagnosis.toString()
            : '',
        event.endNumberOfDaysSinceDiagnosis !== undefined
            ? event.endNumberOfDaysSinceDiagnosis.toString()
            : '',
        event.eventType,
        extractValue(event),
    ];

    return row.join('\t');
}

function extractValue(event: ClinicalEvent): string | undefined {
    switch (event.eventType) {
        case 'SPECIMEN':
            return getValueFromAttribute(event.attributes, 'SURGERY');
        case 'STATUS':
            return getValueFromAttribute(event.attributes, 'STATUS');
        case 'TREATMENT':
            const subtype = getValueFromAttribute(event.attributes, 'SUBTYPE');
            const agent = getValueFromAttribute(event.attributes, 'AGENT');
            return agent === undefined ? subtype : agent;
        case 'SURGERY':
            return getValueFromAttribute(
                event.attributes,
                'EVENT_TYPE_DETAILED'
            );
        default:
            return '';
    }
}

function getValueFromAttribute(
    attributes: ClinicalEventData[],
    key: string
): string | undefined {
    const attribute = attributes.find(a => a.key === key);
    return attribute === undefined ? undefined : attribute.value;
}
