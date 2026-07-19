import React, { useMemo } from 'react';
import {
    ClinicalDataBySampleId,
    ClinicalEvent,
} from 'cbioportal-ts-api-client';
import { groupTimelineData } from 'pages/patientView/timeline/timelineDataUtils';
import LazyMobXTable from 'shared/components/lazyMobXTable/LazyMobXTable';
import { DownloadControlOption } from 'cbioportal-frontend-commons';
import { getServerConfig } from 'config/config';
import {
    buildTimelineEventsSignature,
    PATHOLOGY_EVENT_ATTRIBUTE_KEYS,
} from './pathologyTimelineUtils';
import {
    buildClinicalEventAttributesSignature,
    buildClinicalEventSignature,
} from './clinicalEventSignatureUtils';
import { isWsiPathologyClinicalEvent } from './pathologyClinicalEventUtils';
import { usePathologyAugmentedClinicalEventsState } from './usePathologyAugmentedClinicalEvents';

class EventsTable extends LazyMobXTable<{}> {}

const PATHOLOGY_TABLE_HEADERS = [
    'DATE (DAYS)',
    'SAMPLE',
    'MATCH',
    'SPECIMEN',
    'SLIDE TYPE',
    'SLIDES',
    'LINKOUT',
];
const MAX_CLINICAL_EVENT_TABLE_CACHE_ENTRIES = 100;
const MAX_PATHOLOGY_CLINICAL_TABLE_CACHE_ENTRIES = 100;
const MAX_CLINICAL_EVENT_TABLE_HEADER_CACHE_ENTRIES = 100;
const MAX_PARTITIONED_CLINICAL_EVENTS_CACHE_ENTRIES = 100;

type ClinicalEventTableData = { [eventType: string]: string[][] };

type ClinicalEventTableSection = {
    key: string;
    dataRows: string[][];
    columns: ClinicalEventTableColumn[];
};

type ClinicalEventTableCacheEntry = {
    data: ClinicalEventTableData;
    sections: ClinicalEventTableSection[];
};

type PartitionedClinicalEventsEntry = {
    nonWsiEvents: ClinicalEvent[];
    nonWsiEventsSignature: string;
    wsiPathologyEvents: ClinicalEvent[];
    wsiPathologyEventsSignature: string;
};

type CachedPathologyClinicalRowEntry = {
    attributesRef?: ClinicalEvent['attributes'];
    attributesSignature: string;
    date: number | undefined;
    linkout: string;
    linkoutHref: string;
    match: string;
    sample: string;
    servableCount: number;
    slides: string;
    specimen: string;
    subtype: string;
    totalCount: number;
};

type CachedClinicalEventTableHeaderEntry = {
    cleanedHeaderRow: string[];
    columns: ClinicalEventTableColumn[];
    headerSignature: string;
    visibleColumnIndices: number[];
};

type CachedClinicalEventTableColumnsEntry = {
    columns: ClinicalEventTableColumn[];
    headerSignature: string;
};

type ClinicalEventTableColumn = {
    name: string;
    render: (data: string[]) => JSX.Element;
    download: (data: string[]) => string;
    sortBy: (data: string[]) => string;
    filter: (
        txt: string,
        filterString: string,
        filterStringUpper: string
    ) => boolean;
};

const clinicalEventTableCache = new Map<string, ClinicalEventTableCacheEntry>();
const pathologyClinicalTableCache = new Map<string, string[][]>();
const partitionedClinicalEventsCache = new Map<
    string,
    PartitionedClinicalEventsEntry
>();
const clinicalEventTableHeaderCache = new Map<
    string,
    CachedClinicalEventTableHeaderEntry
>();
const pathologyClinicalRowCache = new WeakMap<
    ClinicalEvent,
    CachedPathologyClinicalRowEntry
>();
const clinicalEventTableColumnsCache = new WeakMap<
    string[],
    CachedClinicalEventTableColumnsEntry
>();

function getPathologyClinicalRowEntry(
    event: ClinicalEvent
): CachedPathologyClinicalRowEntry {
    const attributes = event.attributes;
    const attributesSignature = buildClinicalEventAttributesSignature(attributes);
    const cached = pathologyClinicalRowCache.get(event);

    if (
        cached &&
        cached.attributesRef === attributes &&
        cached.attributesSignature === attributesSignature &&
        cached.date === event.startNumberOfDaysSinceDiagnosis
    ) {
        return cached;
    }

    let sample = '—';
    let match = '';
    let specimen = '';
    let subtype = '';
    let linkout = '';
    let servableCount = 0;
    let totalCount = 0;

    for (const attribute of attributes || []) {
        switch (attribute.key) {
            case PATHOLOGY_EVENT_ATTRIBUTE_KEYS.imageCount:
                servableCount = Number(attribute.value) || 0;
                break;
            case PATHOLOGY_EVENT_ATTRIBUTE_KEYS.totalImageCount:
                totalCount = Number(attribute.value) || 0;
                break;
            case PATHOLOGY_EVENT_ATTRIBUTE_KEYS.linkout:
                linkout = attribute.value || '';
                break;
            case PATHOLOGY_EVENT_ATTRIBUTE_KEYS.sampleId:
                sample = attribute.value || '—';
                break;
            case PATHOLOGY_EVENT_ATTRIBUTE_KEYS.matchLevel:
                match = attribute.value || '';
                break;
            case PATHOLOGY_EVENT_ATTRIBUTE_KEYS.specimen:
                specimen = attribute.value || '';
                break;
            case PATHOLOGY_EVENT_ATTRIBUTE_KEYS.subtype:
                subtype = attribute.value || '';
                break;
        }
    }

    const entry = {
        attributesRef: attributes,
        attributesSignature,
        date: event.startNumberOfDaysSinceDiagnosis,
        linkout:
            servableCount > 0 && linkout
                ? `View ${servableCount} of ${totalCount}||${linkout}`
                : '',
        linkoutHref: linkout,
        match,
        sample,
        servableCount,
        slides:
            servableCount > 0
                ? `${totalCount} (${servableCount} viewable)`
                : String(totalCount),
        specimen,
        subtype,
        totalCount,
    };

    pathologyClinicalRowCache.set(event, entry);
    return entry;
}

function stripSpecimenKeyFromLinkout(linkoutHref: string): string {
    if (!linkoutHref || !linkoutHref.includes('specimenKey=')) {
        return linkoutHref;
    }

    const [pathname, rawQuery = ''] = linkoutHref.split('?', 2);
    const params = new URLSearchParams(rawQuery);
    params.delete('specimenKey');
    const nextQuery = params.toString();
    return nextQuery ? `${pathname}?${nextQuery}` : pathname;
}

function joinDistinctPathologySpecimens(specimens: string[]): string {
    const seen = new Set<string>();
    const ordered: string[] = [];

    for (let index = 0; index < specimens.length; index += 1) {
        const specimen = specimens[index];
        if (!specimen || seen.has(specimen)) {
            continue;
        }
        seen.add(specimen);
        ordered.push(specimen);
    }

    return ordered.join(', ');
}

type GroupedPathologyClinicalRow = {
    date: number | undefined;
    linkoutHref: string;
    match: string;
    sample: string;
    servableCount: number;
    specimens: string[];
    subtype: string;
    totalCount: number;
};

function buildClinicalEventTableCacheKey(
    events: ClinicalEvent[],
    studyId: string,
    patientId: string,
    eventsSignature?: string
): string {
    return `${studyId}::${patientId}::${
        eventsSignature || buildTimelineEventsSignature(events)
    }`;
}

function getCachedPathologyClinicalTableData(
    cacheKey: string
): string[][] | undefined {
    const cached = pathologyClinicalTableCache.get(cacheKey);
    if (!cached) {
        return undefined;
    }

    pathologyClinicalTableCache.delete(cacheKey);
    pathologyClinicalTableCache.set(cacheKey, cached);
    return cached;
}

function setCachedPathologyClinicalTableData(
    cacheKey: string,
    rows: string[][]
): string[][] {
    if (pathologyClinicalTableCache.has(cacheKey)) {
        pathologyClinicalTableCache.delete(cacheKey);
    }
    pathologyClinicalTableCache.set(cacheKey, rows);

    if (
        pathologyClinicalTableCache.size >
        MAX_PATHOLOGY_CLINICAL_TABLE_CACHE_ENTRIES
    ) {
        const oldestKey = pathologyClinicalTableCache.keys().next().value;
        if (oldestKey) {
            pathologyClinicalTableCache.delete(oldestKey);
        }
    }

    return rows;
}

function buildPathologyClinicalTableDataUncached(
    events: ClinicalEvent[]
): string[][] {
    const groupedRows = new Map<string, GroupedPathologyClinicalRow>();

    for (let index = 0; index < events.length; index += 1) {
        const event = events[index];
        if (!isWsiPathologyClinicalEvent(event)) {
            continue;
        }

        const row = getPathologyClinicalRowEntry(event);
        const key = [
            row.date == null ? 'Unknown' : String(row.date),
            row.sample,
            row.match,
            row.subtype,
        ].join('||');
        const existing = groupedRows.get(key);

        if (existing) {
            existing.totalCount += row.totalCount;
            existing.servableCount += row.servableCount;
            if (row.specimen) {
                existing.specimens.push(row.specimen);
            }
            if (!existing.linkoutHref && row.linkoutHref) {
                existing.linkoutHref = row.linkoutHref;
            }
            continue;
        }

        groupedRows.set(key, {
            date: row.date,
            linkoutHref: row.linkoutHref,
            match: row.match,
            sample: row.sample,
            servableCount: row.servableCount,
            specimens: row.specimen ? [row.specimen] : [],
            subtype: row.subtype,
            totalCount: row.totalCount,
        });
    }

    const rows = Array.from(groupedRows.values());

    rows.sort((a, b) => {
            if (a.date == null) return 1;
            if (b.date == null) return -1;
            return (
                a.date - b.date ||
                a.sample.localeCompare(b.sample) ||
                a.match.localeCompare(b.match) ||
                a.subtype.localeCompare(b.subtype)
            );
        });

    const tableRows = new Array<string[][][number]>(rows.length + 1);
    tableRows[0] = PATHOLOGY_TABLE_HEADERS;
    for (let index = 0; index < rows.length; index += 1) {
        const row = rows[index];
        const specimen = joinDistinctPathologySpecimens(row.specimens);
        const sanitizedLinkoutHref = stripSpecimenKeyFromLinkout(row.linkoutHref);
        const slides =
            row.servableCount > 0
                ? `${row.totalCount} (${row.servableCount} viewable)`
                : String(row.totalCount);
        tableRows[index + 1] = [
            row.date == null ? 'Unknown' : String(row.date),
            row.sample,
            row.match,
            specimen,
            row.subtype,
            slides,
            row.servableCount > 0 && sanitizedLinkoutHref
                ? `View ${row.servableCount} of ${row.totalCount}||${sanitizedLinkoutHref}`
                : '',
        ];
    }

    return tableRows;
}

function buildPathologyClinicalTableData(
    events: ClinicalEvent[],
    studyId: string,
    patientId: string,
    eventsSignature?: string
): string[][] {
    const cacheKey = buildClinicalEventTableCacheKey(
        events,
        studyId,
        patientId,
        eventsSignature
    );
    const cached = getCachedPathologyClinicalTableData(cacheKey);
    if (cached) {
        return cached;
    }

    return setCachedPathologyClinicalTableData(
        cacheKey,
        buildPathologyClinicalTableDataUncached(events)
    );
}

export function buildClinicalEventTableData(
    events: ClinicalEvent[],
    studyId: string,
    patientId: string,
    eventsSignature?: string
): ClinicalEventTableData {
    return getPreparedClinicalEventTablePayload(
        events,
        studyId,
        patientId,
        eventsSignature
    ).data;
}

function getCachedClinicalEventTablePayload(
    cacheKey: string
): ClinicalEventTableCacheEntry | undefined {
    const cached = clinicalEventTableCache.get(cacheKey);
    if (!cached) {
        return undefined;
    }

    clinicalEventTableCache.delete(cacheKey);
    clinicalEventTableCache.set(cacheKey, cached);
    return cached;
}

function setCachedClinicalEventTablePayload(
    cacheKey: string,
    payload: ClinicalEventTableCacheEntry
): ClinicalEventTableCacheEntry {
    if (clinicalEventTableCache.has(cacheKey)) {
        clinicalEventTableCache.delete(cacheKey);
    }
    clinicalEventTableCache.set(cacheKey, payload);

    if (
        clinicalEventTableCache.size >
        MAX_CLINICAL_EVENT_TABLE_CACHE_ENTRIES
    ) {
        const oldestKey = clinicalEventTableCache.keys().next().value;
        if (oldestKey) {
            clinicalEventTableCache.delete(oldestKey);
        }
    }

    return payload;
}

function getCachedPartitionedClinicalEvents(
    cacheKey: string
): PartitionedClinicalEventsEntry | undefined {
    const cached = partitionedClinicalEventsCache.get(cacheKey);
    if (!cached) {
        return undefined;
    }

    partitionedClinicalEventsCache.delete(cacheKey);
    partitionedClinicalEventsCache.set(cacheKey, cached);
    return cached;
}

function setCachedPartitionedClinicalEvents(
    cacheKey: string,
    entry: PartitionedClinicalEventsEntry
): PartitionedClinicalEventsEntry {
    if (partitionedClinicalEventsCache.has(cacheKey)) {
        partitionedClinicalEventsCache.delete(cacheKey);
    }
    partitionedClinicalEventsCache.set(cacheKey, entry);

    if (
        partitionedClinicalEventsCache.size >
        MAX_PARTITIONED_CLINICAL_EVENTS_CACHE_ENTRIES
    ) {
        const oldestKey = partitionedClinicalEventsCache.keys().next().value;
        if (oldestKey) {
            partitionedClinicalEventsCache.delete(oldestKey);
        }
    }

    return entry;
}

function getPartitionedClinicalEvents(
    events: ClinicalEvent[],
    topLevelSignature: string
): PartitionedClinicalEventsEntry {
    const cached = getCachedPartitionedClinicalEvents(topLevelSignature);
    if (cached) {
        return cached;
    }

    const wsiPathologyEvents: ClinicalEvent[] = [];
    const nonWsiEvents: ClinicalEvent[] = [];
    const wsiPathologyEventSignatures: string[] = [];
    const nonWsiEventSignatures: string[] = [];

    for (let index = 0; index < events.length; index += 1) {
        const event = events[index];
        const signature = buildClinicalEventSignature(event, {
            includeUniqueKeys: false,
        });
        if (isWsiPathologyClinicalEvent(event)) {
            wsiPathologyEvents.push(event);
            wsiPathologyEventSignatures.push(signature);
        } else {
            nonWsiEvents.push(event);
            nonWsiEventSignatures.push(signature);
        }
    }

    return setCachedPartitionedClinicalEvents(topLevelSignature, {
        nonWsiEvents,
        nonWsiEventsSignature: nonWsiEventSignatures.join('||'),
        wsiPathologyEvents,
        wsiPathologyEventsSignature: wsiPathologyEventSignatures.join('||'),
    });
}

function buildClinicalEventTableDataUncached(
    events: ClinicalEvent[],
    studyId: string,
    patientId: string,
    eventsSignature?: string
): ClinicalEventTableData {
    const resolvedEventsSignature =
        eventsSignature || buildTimelineEventsSignature(events);
    const {
        nonWsiEvents,
        nonWsiEventsSignature,
        wsiPathologyEvents,
        wsiPathologyEventsSignature,
    } = getPartitionedClinicalEvents(
        events,
        resolvedEventsSignature
    );
    const data = groupTimelineData(nonWsiEvents, nonWsiEventsSignature);
    if (data.PATHOLOGY) {
        data['PATHOLOGY BIOMARKERS'] = data.PATHOLOGY;
        delete data.PATHOLOGY;
    }
    if (wsiPathologyEvents.length > 0) {
        data['PATHOLOGY SLIDES'] = buildPathologyClinicalTableData(
            wsiPathologyEvents,
            studyId,
            patientId,
            wsiPathologyEventsSignature
        );
    }
    return data;
}

function makeColumns(headerRow: string[]): ClinicalEventTableColumn[] {
    const headerSignature = headerRow.join('|');
    const cached = clinicalEventTableColumnsCache.get(headerRow);

    if (cached && cached.headerSignature === headerSignature) {
        return cached.columns;
    }

    const columns = new Array<ClinicalEventTableColumn>(headerRow.length);
    for (let index = 0; index < headerRow.length; index += 1) {
        const item = headerRow[index];
        columns[index] = {
            name: item,
            render: (data: string[]) => {
                const value = data[index];
                if (item === 'LINKOUT' && value) {
                    const [label, href] = value.split('||');
                    return (
                        <a
                            href={href}
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            {label}
                        </a>
                    );
                }
                return <span>{value}</span>;
            },
            download: (data: string[]) => data[index],
            sortBy: (data: string[]) => data[index],
            filter: (
                txt: string,
                filterString: string,
                filterStringUpper: string
            ) =>
                txt
                    ?.toString()
                    .toUpperCase()
                    .includes(filterStringUpper),
        };
    }

    clinicalEventTableColumnsCache.set(headerRow, {
        columns,
        headerSignature,
    });

    return columns;
}

function getCachedClinicalEventTableHeader(
    headerSignature: string
): CachedClinicalEventTableHeaderEntry | undefined {
    const cached = clinicalEventTableHeaderCache.get(headerSignature);
    if (!cached) {
        return undefined;
    }

    clinicalEventTableHeaderCache.delete(headerSignature);
    clinicalEventTableHeaderCache.set(headerSignature, cached);
    return cached;
}

function setCachedClinicalEventTableHeader(
    headerSignature: string,
    entry: CachedClinicalEventTableHeaderEntry
): CachedClinicalEventTableHeaderEntry {
    if (clinicalEventTableHeaderCache.has(headerSignature)) {
        clinicalEventTableHeaderCache.delete(headerSignature);
    }
    clinicalEventTableHeaderCache.set(headerSignature, entry);

    if (
        clinicalEventTableHeaderCache.size >
        MAX_CLINICAL_EVENT_TABLE_HEADER_CACHE_ENTRIES
    ) {
        const oldestKey = clinicalEventTableHeaderCache.keys().next().value;
        if (oldestKey) {
            clinicalEventTableHeaderCache.delete(oldestKey);
        }
    }

    return entry;
}

function getPreparedClinicalEventTableHeader(
    headerRow: string[]
): CachedClinicalEventTableHeaderEntry {
    const headerSignature = headerRow.join('|');
    const cached = getCachedClinicalEventTableHeader(headerSignature);
    if (cached) {
        return cached;
    }

    const visibleColumnIndices: number[] = [];
    for (let index = 0; index < headerRow.length; index += 1) {
        const item = headerRow[index];
        if (item !== 'PATIENT_ID' && !/^STYLE_/.test(item)) {
            visibleColumnIndices.push(index);
        }
    }

    const cleanedHeaderRow = new Array<string>(visibleColumnIndices.length);
    for (let index = 0; index < visibleColumnIndices.length; index += 1) {
        cleanedHeaderRow[index] = headerRow[visibleColumnIndices[index]];
    }

    return setCachedClinicalEventTableHeader(headerSignature, {
        cleanedHeaderRow,
        columns: makeColumns(cleanedHeaderRow),
        headerSignature,
        visibleColumnIndices,
    });
}

function prepareClinicalEventTableSections(
    data: ClinicalEventTableData
): ClinicalEventTableSection[] {
    let sectionCount = 0;
    for (const key in data) {
        if (Object.prototype.hasOwnProperty.call(data, key)) {
            sectionCount += 1;
        }
    }

    const sections = new Array<ClinicalEventTableSection>(sectionCount);
    let dataIndex = 0;
    for (const key in data) {
        if (!Object.prototype.hasOwnProperty.call(data, key)) {
            continue;
        }
        const dataCategory = data[key];
        const { cleanedHeaderRow, columns, visibleColumnIndices } =
            getPreparedClinicalEventTableHeader(dataCategory[0]);

        const dataRows = new Array<string[]>(dataCategory.length - 1);
        for (let rowIndex = 1; rowIndex < dataCategory.length; rowIndex += 1) {
            const row = dataCategory[rowIndex];
            const cleanedRow = new Array<string>(visibleColumnIndices.length);

            for (
                let columnIndex = 0;
                columnIndex < visibleColumnIndices.length;
                columnIndex += 1
            ) {
                cleanedRow[columnIndex] = row[visibleColumnIndices[columnIndex]];
            }

            dataRows[rowIndex - 1] = cleanedRow;
        }

        sections[dataIndex] = {
            key,
            dataRows,
            columns,
        };
        dataIndex += 1;
    }

    return sections;
}

function getPreparedClinicalEventTablePayload(
    events: ClinicalEvent[],
    studyId: string,
    patientId: string,
    eventsSignature?: string
): ClinicalEventTableCacheEntry {
    const cacheKey = buildClinicalEventTableCacheKey(
        events,
        studyId,
        patientId,
        eventsSignature
    );
    const cached = getCachedClinicalEventTablePayload(cacheKey);
    if (cached) {
        return cached;
    }

    const data = buildClinicalEventTableDataUncached(
        events,
        studyId,
        patientId,
        eventsSignature
    );
    return setCachedClinicalEventTablePayload(cacheKey, {
        data,
        sections: prepareClinicalEventTableSections(data),
    });
}

const ClinicalEventsTables: React.FunctionComponent<{
    patientId: string;
    studyId: string;
    augmentedEvents: ClinicalEvent[];
    augmentedEventsSignature?: string;
}> = function({
    augmentedEvents,
    augmentedEventsSignature,
    patientId,
    studyId,
}) {
    const resolvedAugmentedEventsSignature =
        augmentedEventsSignature || buildTimelineEventsSignature(augmentedEvents);

    const { sections } = useMemo(
        () =>
            getPreparedClinicalEventTablePayload(
                augmentedEvents,
                studyId,
                patientId,
                resolvedAugmentedEventsSignature
            ),
        [resolvedAugmentedEventsSignature, patientId, studyId]
    );

    return (
        <div>
            {(() => {
                const renderedSections = new Array<JSX.Element>(sections.length);
                for (let index = 0; index < sections.length; index += 1) {
                    const { key, dataRows, columns } = sections[index];
                    renderedSections[index] = (
                        <React.Fragment key={key}>
                            <h3
                                className={'pull-left'}
                                style={{ textTransform: 'capitalize' }}
                            >
                                {key.toLowerCase()}
                            </h3>
                            <EventsTable
                                data={dataRows}
                                columns={columns}
                                showPagination={false}
                                showColumnVisibility={false}
                                showFilter={true}
                                showCopyDownload={
                                    getServerConfig()
                                        .skin_hide_download_controls ===
                                    DownloadControlOption.SHOW_ALL
                                }
                            />
                        </React.Fragment>
                    );
                }
                return renderedSections;
            })()}
        </div>
    );
};

const ClinicalEventsTablesWithAugmentation: React.FunctionComponent<{
    clinicalEvents: ClinicalEvent[];
    clinicalEventsSignature?: string;
    patientId: string;
    studyId: string;
    samples: ClinicalDataBySampleId[];
}> = function({
    clinicalEvents,
    clinicalEventsSignature,
    patientId,
    studyId,
    samples,
}) {
    const resolvedClinicalEventsSignature =
        clinicalEventsSignature || buildTimelineEventsSignature(clinicalEvents);
    const augmentedEventsState = usePathologyAugmentedClinicalEventsState({
        clinicalEvents,
        clinicalEventsSignature: resolvedClinicalEventsSignature,
        errorMessage:
            'Failed to load pathology timeline data for clinical event tables',
        patientId,
        samples,
        studyId,
    });
    const augmentedEvents = augmentedEventsState.events;
    const augmentedEventsSignature = augmentedEventsState.eventsSignature;

    return (
        <ClinicalEventsTables
            patientId={patientId}
            studyId={studyId}
            augmentedEvents={augmentedEvents}
            augmentedEventsSignature={augmentedEventsSignature}
        />
    );
};

export { ClinicalEventsTables as ClinicalEventsTablesContent };
export default ClinicalEventsTablesWithAugmentation;
