import { ClinicalEvent } from 'cbioportal-ts-api-client';
import JSZip from 'jszip';
import fileDownload from 'react-file-download';
import {
    buildClinicalEventSignature,
    buildClinicalEventsSignature,
} from './clinicalEventSignatureUtils';

const HEADERS = ['PATIENT_ID', 'START_DATE', 'STOP_DATE', 'EVENT_TYPE'];
const MAX_TIMELINE_ROWS_CACHE_ENTRIES = 100;
const MAX_GROUPED_TIMELINE_DATA_CACHE_ENTRIES = 100;

type TimelineRowsCacheEntry = {
    rows: string[][];
};

type GroupedTimelineData = { [eventType: string]: string[][] };

type GroupedTimelineDataCacheEntry = {
    data: GroupedTimelineData;
};

type GroupedTimelineEventsEntry = {
    eventsByType: { [eventType: string]: ClinicalEvent[] };
    orderedEventTypes: string[];
    signature: string;
    signaturesByType: { [eventType: string]: string };
};

const timelineRowsCache = new Map<string, TimelineRowsCacheEntry>();
const groupedTimelineDataCache = new Map<
    string,
    GroupedTimelineDataCacheEntry
>();

export function downloadZippedTracks(events: ClinicalEvent[]) {
    const groupedTimelineEvents = groupEventsByType(events);

    const zip = new JSZip();
    for (
        let index = 0;
        index < groupedTimelineEvents.orderedEventTypes.length;
        index += 1
    ) {
        const eventType = groupedTimelineEvents.orderedEventTypes[index];
        zip.file(
            `data_timeline_${eventType.toLowerCase()}.txt`,
            toTSV(
                groupedTimelineEvents.eventsByType[eventType],
                groupedTimelineEvents.signaturesByType[eventType]
            )
        );
    }
    zip.generateAsync({ type: 'blob' }).then(function(content) {
        fileDownload(content, 'timeline.zip');
    });
}

export function groupTimelineData(
    events: ClinicalEvent[],
    eventsSignature?: string
) {
    const groupedTimelineEvents = groupEventsByType(events, eventsSignature);
    const signature = groupedTimelineEvents.signature;
    const cached = getCachedGroupedTimelineData(signature);
    if (cached) {
        return cached;
    }

    const groupedData: GroupedTimelineData = {};
    for (
        let index = 0;
        index < groupedTimelineEvents.orderedEventTypes.length;
        index += 1
    ) {
        const eventType = groupedTimelineEvents.orderedEventTypes[index];
        groupedData[eventType] = getRows(
            groupedTimelineEvents.eventsByType[eventType],
            groupedTimelineEvents.signaturesByType[eventType]
        );
    }

    return setCachedGroupedTimelineData(signature, groupedData);
}

function toTSV(events: ClinicalEvent[], eventsSignature?: string): string {
    const rows = getRows(events, eventsSignature);
    let tsv = '';

    for (let rowIndex = 0; rowIndex < rows.length; rowIndex += 1) {
        if (rowIndex > 0) {
            tsv += '\n';
        }
        tsv += rows[rowIndex].join('\t');
    }

    return `${tsv}\n`;
}

function groupEventsByType(
    events: ClinicalEvent[],
    eventsSignature?: string
): GroupedTimelineEventsEntry {
    const eventsByType: { [eventType: string]: ClinicalEvent[] } = {};
    const orderedEventTypes: string[] = [];
    const signaturesByType: { [eventType: string]: string } = {};
    let derivedSignature = '';

    for (let index = 0; index < events.length; index += 1) {
        const event = events[index];
        const eventType = event.eventType;
        const eventSignature = buildClinicalEventSignature(event);
        let eventTypeEvents = eventsByType[eventType];

        if (!eventsSignature) {
            if (index > 0) {
                derivedSignature += '||';
            }
            derivedSignature += eventSignature;
        }

        if (!eventTypeEvents) {
            eventTypeEvents = [];
            eventsByType[eventType] = eventTypeEvents;
            orderedEventTypes.push(eventType);
            signaturesByType[eventType] = '';
        }

        eventTypeEvents.push(event);
        const eventTypeSignature = signaturesByType[eventType];
        if (eventTypeSignature) {
            signaturesByType[eventType] = `${eventTypeSignature}||${eventSignature}`;
        } else {
            signaturesByType[eventType] = eventSignature;
        }
    }

    return {
        eventsByType,
        orderedEventTypes,
        signature: eventsSignature || derivedSignature,
        signaturesByType,
    };
}

function getCachedTimelineRows(signature: string): string[][] | undefined {
    const cached = timelineRowsCache.get(signature);
    if (!cached) {
        return undefined;
    }

    timelineRowsCache.delete(signature);
    timelineRowsCache.set(signature, cached);
    return cached.rows;
}

function getCachedGroupedTimelineData(
    signature: string
): GroupedTimelineData | undefined {
    const cached = groupedTimelineDataCache.get(signature);
    if (!cached) {
        return undefined;
    }

    groupedTimelineDataCache.delete(signature);
    groupedTimelineDataCache.set(signature, cached);
    return cached.data;
}

function setCachedTimelineRows(signature: string, rows: string[][]): string[][] {
    if (timelineRowsCache.has(signature)) {
        timelineRowsCache.delete(signature);
    }
    timelineRowsCache.set(signature, { rows });

    if (timelineRowsCache.size > MAX_TIMELINE_ROWS_CACHE_ENTRIES) {
        const oldestKey = timelineRowsCache.keys().next().value;
        if (oldestKey) {
            timelineRowsCache.delete(oldestKey);
        }
    }

    return rows;
}

function setCachedGroupedTimelineData(
    signature: string,
    data: GroupedTimelineData
): GroupedTimelineData {
    if (groupedTimelineDataCache.has(signature)) {
        groupedTimelineDataCache.delete(signature);
    }
    groupedTimelineDataCache.set(signature, { data });

    if (
        groupedTimelineDataCache.size >
        MAX_GROUPED_TIMELINE_DATA_CACHE_ENTRIES
    ) {
        const oldestKey = groupedTimelineDataCache.keys().next().value;
        if (oldestKey) {
            groupedTimelineDataCache.delete(oldestKey);
        }
    }

    return data;
}

function getRows(events: ClinicalEvent[], eventsSignature?: string): string[][] {
    const signature = eventsSignature || buildClinicalEventsSignature(events);
    const cachedRows = getCachedTimelineRows(signature);
    if (cachedRows) {
        return cachedRows;
    }

    const extraColumnsMap: { [columnKey: string]: true } = {};
    const extraColumns: string[] = [];
    const attributeValueMaps: Array<Record<string, string>> = [];
    for (let eventIndex = 0; eventIndex < events.length; eventIndex += 1) {
        const event = events[eventIndex];
        const attributeValueMap: Record<string, string> = {};
        const attributes = event.attributes;
        if (attributes) {
            for (
                let attributeIndex = 0;
                attributeIndex < attributes.length;
                attributeIndex += 1
            ) {
                const attribute = attributes[attributeIndex];
                const attributeKey = attribute.key;
                if (!extraColumnsMap[attributeKey]) {
                    extraColumnsMap[attributeKey] = true;
                    extraColumns.push(attributeKey);
                }
                attributeValueMap[attributeKey] = attribute.value;
            }
        }
        attributeValueMaps.push(attributeValueMap);
    }

    const rows = new Array<string[]>(events.length + 1);
    const headerRow = new Array<string>(HEADERS.length + extraColumns.length);
    for (let index = 0; index < HEADERS.length; index += 1) {
        headerRow[index] = HEADERS[index];
    }
    for (let index = 0; index < extraColumns.length; index += 1) {
        headerRow[HEADERS.length + index] = extraColumns[index];
    }
    rows[0] = headerRow;
    for (let index = 0; index < events.length; index += 1) {
        const event = events[index];
        const row = new Array<string>(HEADERS.length + extraColumns.length);
        row[0] = event.patientId;
        row[1] =
            event.startNumberOfDaysSinceDiagnosis !== undefined
                ? event.startNumberOfDaysSinceDiagnosis.toString()
                : '';
        row[2] =
            event.endNumberOfDaysSinceDiagnosis !== undefined
                ? event.endNumberOfDaysSinceDiagnosis.toString()
                : '';
        row[3] = event.eventType;
        const attributeValueMap = attributeValueMaps[index];
        for (
            let columnIndex = 0;
            columnIndex < extraColumns.length;
            columnIndex += 1
        ) {
            row[HEADERS.length + columnIndex] =
                attributeValueMap[extraColumns[columnIndex]] || '';
        }
        rows[index + 1] = row;
    }
    return setCachedTimelineRows(signature, rows);
}
