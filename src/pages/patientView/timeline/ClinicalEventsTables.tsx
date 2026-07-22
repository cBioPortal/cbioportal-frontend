import React, { useMemo } from 'react';
import {
    ClinicalDataBySampleId,
    ClinicalEvent,
} from 'cbioportal-ts-api-client';
import { groupTimelineData } from 'pages/patientView/timeline/timelineDataUtils';
import LazyMobXTable from 'shared/components/lazyMobXTable/LazyMobXTable';
import { DownloadControlOption } from 'cbioportal-frontend-commons';
import { getServerConfig } from 'config/config';
import { buildTimelineEventsSignature } from './pathologyTimelineUtils';
import { isWsiPathologyClinicalEvent } from './pathologyClinicalEventUtils';
import { usePathologyAugmentedClinicalEventsState } from './usePathologyAugmentedClinicalEvents';
import {
    buildPathologyPresentationItemClinicalEventSignature,
    buildPathologyPresentationItemsFromClinicalEvents,
    formatPathologyLinkoutLabel,
    groupPathologyPresentationItems,
} from './pathologyPresentationUtils';
import {
    getBoundedMapCacheValue,
    setBoundedMapCacheValue,
} from './boundedMapCache';

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
const clinicalEventTableColumnsCache = new WeakMap<
    string[],
    CachedClinicalEventTableColumnsEntry
>();

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
    return getBoundedMapCacheValue(pathologyClinicalTableCache, cacheKey);
}

function setCachedPathologyClinicalTableData(
    cacheKey: string,
    rows: string[][]
): string[][] {
    return setBoundedMapCacheValue(
        pathologyClinicalTableCache,
        cacheKey,
        rows,
        MAX_PATHOLOGY_CLINICAL_TABLE_CACHE_ENTRIES
    );
}

function buildPathologyClinicalTableDataUncached(
    events: ClinicalEvent[]
): string[][] {
    const rows = groupPathologyPresentationItems(
        buildPathologyPresentationItemsFromClinicalEvents(
            events.filter(isWsiPathologyClinicalEvent)
        )
    );

    const tableRows = new Array<string[][][number]>(rows.length + 1);
    tableRows[0] = PATHOLOGY_TABLE_HEADERS;
    for (let index = 0; index < rows.length; index += 1) {
        const row = rows[index];
        const slides = String(row.totalCount);
        tableRows[index + 1] = [
            row.date == null ? 'Unknown' : String(row.date),
            row.sampleId,
            row.matchLevel,
            row.specimens.join(', '),
            row.subtype,
            slides,
            row.servableCount > 0 && row.linkout
                ? `${formatPathologyLinkoutLabel(
                      row.servableCount,
                      row.totalCount
                  )}||${row.linkout}`
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
    return getBoundedMapCacheValue(clinicalEventTableCache, cacheKey);
}

function setCachedClinicalEventTablePayload(
    cacheKey: string,
    payload: ClinicalEventTableCacheEntry
): ClinicalEventTableCacheEntry {
    return setBoundedMapCacheValue(
        clinicalEventTableCache,
        cacheKey,
        payload,
        MAX_CLINICAL_EVENT_TABLE_CACHE_ENTRIES
    );
}

function getCachedPartitionedClinicalEvents(
    cacheKey: string
): PartitionedClinicalEventsEntry | undefined {
    return getBoundedMapCacheValue(partitionedClinicalEventsCache, cacheKey);
}

function setCachedPartitionedClinicalEvents(
    cacheKey: string,
    entry: PartitionedClinicalEventsEntry
): PartitionedClinicalEventsEntry {
    return setBoundedMapCacheValue(
        partitionedClinicalEventsCache,
        cacheKey,
        entry,
        MAX_PARTITIONED_CLINICAL_EVENTS_CACHE_ENTRIES
    );
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
        const signature = buildPathologyPresentationItemClinicalEventSignature(
            event
        );
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
    return getBoundedMapCacheValue(
        clinicalEventTableHeaderCache,
        headerSignature
    );
}

function setCachedClinicalEventTableHeader(
    headerSignature: string,
    entry: CachedClinicalEventTableHeaderEntry
): CachedClinicalEventTableHeaderEntry {
    return setBoundedMapCacheValue(
        clinicalEventTableHeaderCache,
        headerSignature,
        entry,
        MAX_CLINICAL_EVENT_TABLE_HEADER_CACHE_ENTRIES
    );
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
