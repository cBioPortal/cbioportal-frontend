import React, { useMemo } from 'react';
import { observer } from 'mobx-react-lite';
import { ClinicalDataBySampleId, Sample } from 'cbioportal-ts-api-client';
import PatientViewMutationsDataStore from '../mutation/PatientViewMutationsDataStore';

import 'cbioportal-clinical-timeline/dist/styles.css';

import {
    configureTracks,
    ITimelineConfig,
    Timeline,
    TimelineStore,
    TimelineTrackSpecification,
} from 'cbioportal-clinical-timeline';

import { ClinicalEvent } from 'cbioportal-ts-api-client';
import SampleManager from 'pages/patientView/SampleManager';
import {
    buildBaseConfig,
    configureGenieTimeline,
    configureHtanOhsuTimeline,
    configureTimelineToxicityColors,
    sortTracks,
} from 'pages/patientView/timeline/timeline_helpers';
import { buildTimelineEventsSignature } from './pathologyTimelineUtils';
import { downloadZippedTracks } from './timelineDataUtils';
import { usePathologyAugmentedClinicalEventsState } from './usePathologyAugmentedClinicalEvents';
import {
    buildTimelineCaseMetaDataSignature,
    buildTimelineSampleManagerSignature,
} from './timelineInputSignatureUtils';
import { isWsiPathologyClinicalEvent } from './pathologyClinicalEventUtils';
import { PATHOLOGY_EVENT_ATTRIBUTE_KEYS } from './pathologyTimelineUtils';
import { buildClinicalEventsSignature } from './clinicalEventSignatureUtils';

export interface ISampleMetaDeta {
    color: { [sampleId: string]: string };
    index: { [sampleId: string]: number };
    label: { [sampleId: string]: string };
}

export interface ITimelineProps {
    dataStore: PatientViewMutationsDataStore;
    data: ClinicalEvent[];
    clinicalEventsSignature?: string;
    caseMetaData: ISampleMetaDeta;
    sampleManager: SampleManager;
    width: number;
    samples: Sample[];
    clinicalSamples?: ClinicalDataBySampleId[];
    mutationProfileId: string;
    headerWidth?: number;
}

export interface ITimelineWrapperContentProps extends ITimelineProps {
    timelineData: ClinicalEvent[];
    timelineDataSignature?: string;
}

interface ITimelinePortalFlags {
    isGenieBpcStudy: boolean;
    isHtanOhsuPatient: boolean;
    isToxicityPortal: boolean;
}

const MAX_TIMELINE_WRAPPER_CACHE_ENTRIES = 100;

const nestedPathologyTimelineCache = new Map<string, ClinicalEvent[]>();
const timelinePortalExtrasCache = new Map<string, ClinicalEvent[]>();
const collapsedPathologyTimelineCache = new Map<string, ClinicalEvent[]>();

function getCachedTimelineWrapperArray(
    cache: Map<string, ClinicalEvent[]>,
    key: string
): ClinicalEvent[] | undefined {
    const cached = cache.get(key);
    if (!cached) {
        return undefined;
    }

    cache.delete(key);
    cache.set(key, cached);
    return cached;
}

function setCachedTimelineWrapperArray(
    cache: Map<string, ClinicalEvent[]>,
    key: string,
    value: ClinicalEvent[]
): ClinicalEvent[] {
    if (cache.has(key)) {
        cache.delete(key);
    }
    cache.set(key, value);

    if (cache.size > MAX_TIMELINE_WRAPPER_CACHE_ENTRIES) {
        const oldestKey = cache.keys().next().value;
        if (oldestKey) {
            cache.delete(oldestKey);
        }
    }

    return value;
}

const HTAN_OHSU_EXTRA_EVENT: ClinicalEvent = {
    uniquePatientKey: 'SFRBOV8xOmh0YW5fdGVzdF8yMDIx',
    uniqueSampleKey: '',
    studyId: 'htan_test_2021',
    patientId: 'HTA9_1',
    eventType: 'IMAGING',
    attributes: [
        {
            key: 'linkout',
            value:
                'https://minerva-story-htan-ohsu-demo.surge.sh/#s=0#w=0#g=0#m=-1#a=-100_-100#v=0.5_0.5_0.5#o=-100_-100_1_1#p=Q',
        },
        { key: 'ASSAY_TYPE', value: 'mIHC' },
        {
            key: 'FILE_FORMAT',
            value: 'OME-TIFF',
        },
    ],
    endNumberOfDaysSinceDiagnosis: 25726,
    startNumberOfDaysSinceDiagnosis: 25726,
};

function getTimelinePortalFlags(location: Location): ITimelinePortalFlags {
    return {
        isGenieBpcStudy: location.href.includes('genie_bpc'),
        isHtanOhsuPatient:
            location.href.includes('htan_test_2021') &&
            location.href.includes('HTA9_1'),
        isToxicityPortal: [
            'triage.cbioportal.mskcc.org',
            'cbioportal.mskcc.org',
            'private.cbioportal.mskcc.org',
        ].includes(location.hostname),
    };
}

export function getTimelineDataWithPortalExtras(
    timelineData: ClinicalEvent[],
    isHtanOhsuPatient: boolean,
    timelineDataSignature?: string
): ClinicalEvent[] {
    if (!isHtanOhsuPatient) {
        return timelineData;
    }

    const cacheKey = `${
        timelineDataSignature || buildTimelineEventsSignature(timelineData)
    }::htan-ohsu`;
    const cached = getCachedTimelineWrapperArray(
        timelinePortalExtrasCache,
        cacheKey
    );
    if (cached) {
        return cached;
    }

    const nextTimelineData = new Array<ClinicalEvent>(timelineData.length + 1);
    for (let index = 0; index < timelineData.length; index += 1) {
        nextTimelineData[index] = timelineData[index];
    }
    nextTimelineData[timelineData.length] = HTAN_OHSU_EXTRA_EVENT;

    return setCachedTimelineWrapperArray(
        timelinePortalExtrasCache,
        cacheKey,
        nextTimelineData
    );
}

export function nestPathologyTimelineTracks(
    events: ClinicalEvent[],
    eventsSignature?: string
): ClinicalEvent[] {
    const cacheKey = eventsSignature || buildTimelineEventsSignature(events);
    const cached = getCachedTimelineWrapperArray(
        nestedPathologyTimelineCache,
        cacheKey
    );
    if (cached) {
        return cached;
    }

    let nestedEvents: ClinicalEvent[] | undefined;
    for (let index = 0; index < events.length; index += 1) {
        const event = events[index];
        const pathologyType =
            event.eventType === 'PATHOLOGY'
                ? 'Biomarkers'
                : event.eventType === 'PATHOLOGY SLIDES'
                ? 'Slides'
                : undefined;

        if (!pathologyType) {
            if (nestedEvents) {
                nestedEvents.push(event);
            }
            continue;
        }

        if (!nestedEvents) {
            nestedEvents = new Array<ClinicalEvent>(index);
            for (let existingIndex = 0; existingIndex < index; existingIndex += 1) {
                nestedEvents[existingIndex] = events[existingIndex];
            }
        }

        const attributes = event.attributes || [];
        let skippedPathologyTypeAttribute = 0;
        for (
            let attributeIndex = 0;
            attributeIndex < attributes.length;
            attributeIndex += 1
        ) {
            if (attributes[attributeIndex].key === 'PATHOLOGY_TYPE') {
                skippedPathologyTypeAttribute = 1;
                break;
            }
        }
        const nextAttributes = new Array(
            attributes.length - skippedPathologyTypeAttribute + 1
        );
        let nextAttributeIndex = 0;
        for (
            let attributeIndex = 0;
            attributeIndex < attributes.length;
            attributeIndex += 1
        ) {
            const attribute = attributes[attributeIndex];

            if (attribute.key === 'PATHOLOGY_TYPE') {
                continue;
            }

            if (pathologyType === 'Slides' && attribute.key === 'SUBTYPE') {
                nextAttributes[nextAttributeIndex] = {
                    ...attribute,
                    value: attribute.value.replace(/ \(Non-viewable\)$/, ''),
                };
                nextAttributeIndex += 1;
                continue;
            }

            nextAttributes[nextAttributeIndex] = attribute;
            nextAttributeIndex += 1;
        }

        nextAttributes[nextAttributeIndex] = {
            key: 'PATHOLOGY_TYPE',
            value: pathologyType,
        };

        nestedEvents.push({
            ...event,
            eventType: 'PATHOLOGY',
            attributes: nextAttributes,
        });
    }

    return setCachedTimelineWrapperArray(
        nestedPathologyTimelineCache,
        cacheKey,
        nestedEvents || events
    );
}

type GroupedPathologyTimelineEvent = {
    firstEvent: ClinicalEvent;
    date: number | undefined;
    linkout: string;
    match: string;
    sample: string;
    servableCount: number;
    specimens: string[];
    subtype: string;
    timepointSource: string;
    totalCount: number;
};

function getPathologyAttributeValue(
    event: ClinicalEvent,
    key: string
): string {
    const attributes = event.attributes || [];
    for (let index = 0; index < attributes.length; index += 1) {
        if (attributes[index].key === key) {
            return attributes[index].value || '';
        }
    }
    return '';
}

function stripSpecimenKeyFromTimelineLinkout(linkout: string): string {
    if (!linkout || !linkout.includes('specimenKey=')) {
        return linkout;
    }

    const [path, query = ''] = linkout.split('?');
    const params = new URLSearchParams(query);
    params.delete('specimenKey');
    const nextQuery = params.toString();
    return nextQuery ? `${path}?${nextQuery}` : path;
}

function joinDistinctTimelineValues(values: string[]): string {
    const seen = new Set<string>();
    const ordered: string[] = [];

    for (let index = 0; index < values.length; index += 1) {
        const value = values[index];
        if (!value || seen.has(value)) {
            continue;
        }
        seen.add(value);
        ordered.push(value);
    }

    return ordered.join(', ');
}

function buildCollapsedPathologyTimelineEvent(
    group: GroupedPathologyTimelineEvent
): ClinicalEvent {
    const firstEvent = group.firstEvent;
    const nextAttributes = (firstEvent.attributes || []).map(attribute => {
        switch (attribute.key) {
            case PATHOLOGY_EVENT_ATTRIBUTE_KEYS.specimen:
                return {
                    ...attribute,
                    value: joinDistinctTimelineValues(group.specimens),
                };
            case PATHOLOGY_EVENT_ATTRIBUTE_KEYS.imageCount:
                return {
                    ...attribute,
                    value: String(group.servableCount),
                };
            case PATHOLOGY_EVENT_ATTRIBUTE_KEYS.nonServableImageCount:
                return {
                    ...attribute,
                    value: String(group.totalCount - group.servableCount),
                };
            case PATHOLOGY_EVENT_ATTRIBUTE_KEYS.totalImageCount:
                return {
                    ...attribute,
                    value: String(group.totalCount),
                };
            case PATHOLOGY_EVENT_ATTRIBUTE_KEYS.timepointSource:
                return {
                    ...attribute,
                    value: group.timepointSource,
                };
            case PATHOLOGY_EVENT_ATTRIBUTE_KEYS.linkout:
                return group.linkout
                    ? {
                          ...attribute,
                          value: group.linkout,
                      }
                    : null;
            default:
                return attribute;
        }
    }).filter(Boolean) as NonNullable<ClinicalEvent['attributes']>;

    if (
        group.linkout &&
        !nextAttributes.some(
            attribute => attribute.key === PATHOLOGY_EVENT_ATTRIBUTE_KEYS.linkout
        )
    ) {
        nextAttributes.push({
            key: PATHOLOGY_EVENT_ATTRIBUTE_KEYS.linkout,
            value: group.linkout,
        });
    }

    return {
        ...firstEvent,
        attributes: nextAttributes,
        uniqueSampleKey: [
            firstEvent.studyId || '',
            firstEvent.patientId || '',
            group.subtype,
            group.date ?? '',
            group.match,
            group.sample || 'UNMATCHED',
            'collapsed',
        ].join('_'),
    };
}

export function collapsePathologyTimelineEvents(
    events: ClinicalEvent[],
    eventsSignature?: string
): ClinicalEvent[] {
    const cacheKey =
        eventsSignature ||
        buildClinicalEventsSignature(events, { includeUniqueKeys: false });
    const cached = getCachedTimelineWrapperArray(
        collapsedPathologyTimelineCache,
        cacheKey
    );
    if (cached) {
        return cached;
    }

    const grouped = new Map<string, GroupedPathologyTimelineEvent>();
    let collapsedEvents: ClinicalEvent[] | undefined;

    for (let index = 0; index < events.length; index += 1) {
        const event = events[index];
        if (!isWsiPathologyClinicalEvent(event)) {
            if (collapsedEvents) {
                collapsedEvents.push(event);
            }
            continue;
        }

        if (!collapsedEvents) {
            collapsedEvents = new Array<ClinicalEvent>(index);
            for (let existingIndex = 0; existingIndex < index; existingIndex += 1) {
                collapsedEvents[existingIndex] = events[existingIndex];
            }
        }

        const date = event.startNumberOfDaysSinceDiagnosis;
        const sample = getPathologyAttributeValue(
            event,
            PATHOLOGY_EVENT_ATTRIBUTE_KEYS.sampleId
        );
        const match = getPathologyAttributeValue(
            event,
            PATHOLOGY_EVENT_ATTRIBUTE_KEYS.matchLevel
        );
        const subtype = getPathologyAttributeValue(
            event,
            PATHOLOGY_EVENT_ATTRIBUTE_KEYS.subtype
        );
        const specimen = getPathologyAttributeValue(
            event,
            PATHOLOGY_EVENT_ATTRIBUTE_KEYS.specimen
        );
        const linkout = stripSpecimenKeyFromTimelineLinkout(
            getPathologyAttributeValue(event, PATHOLOGY_EVENT_ATTRIBUTE_KEYS.linkout)
        );
        const servableCount = Number(
            getPathologyAttributeValue(event, PATHOLOGY_EVENT_ATTRIBUTE_KEYS.imageCount)
        ) || 0;
        const totalCount = Number(
            getPathologyAttributeValue(
                event,
                PATHOLOGY_EVENT_ATTRIBUTE_KEYS.totalImageCount
            )
        ) || 0;
        const timepointSource = getPathologyAttributeValue(
            event,
            PATHOLOGY_EVENT_ATTRIBUTE_KEYS.timepointSource
        );

        const key = [
            date == null ? 'Unknown' : String(date),
            sample,
            match,
            subtype,
        ].join('||');
        const existing = grouped.get(key);
        if (existing) {
            existing.servableCount += servableCount;
            existing.totalCount += totalCount;
            if (specimen) {
                existing.specimens.push(specimen);
            }
            if (!existing.linkout && linkout) {
                existing.linkout = linkout;
            }
            if (timepointSource) {
                existing.timepointSource = joinDistinctTimelineValues([
                    existing.timepointSource,
                    timepointSource,
                ]);
            }
            continue;
        }

        grouped.set(key, {
            date,
            firstEvent: event,
            linkout,
            match,
            sample,
            servableCount,
            specimens: specimen ? [specimen] : [],
            subtype,
            timepointSource,
            totalCount,
        });
    }

    if (!collapsedEvents) {
        return events;
    }

    const groupedValues = Array.from(grouped.values());
    groupedValues.sort(
        (a, b) =>
            (a.date ?? Number.POSITIVE_INFINITY) -
                (b.date ?? Number.POSITIVE_INFINITY) ||
            a.sample.localeCompare(b.sample) ||
            a.match.localeCompare(b.match) ||
            a.subtype.localeCompare(b.subtype)
    );

    for (let index = 0; index < groupedValues.length; index += 1) {
        collapsedEvents.push(
            buildCollapsedPathologyTimelineEvent(groupedValues[index])
        );
    }

    return setCachedTimelineWrapperArray(
        collapsedPathologyTimelineCache,
        cacheKey,
        collapsedEvents
    );
}

export const TimelineWrapperContent: React.FunctionComponent<ITimelineWrapperContentProps> = observer(
    function({
        timelineData,
        timelineDataSignature,
        caseMetaData,
        sampleManager,
        width,
        headerWidth,
        samples,
        clinicalSamples,
    }: ITimelineWrapperContentProps) {
        const {
            isGenieBpcStudy,
            isHtanOhsuPatient,
            isToxicityPortal,
        } = getTimelinePortalFlags(window.location);
        const caseMetaDataSignature =
            buildTimelineCaseMetaDataSignature(caseMetaData);
        const sampleManagerSignature =
            buildTimelineSampleManagerSignature(sampleManager);
        const resolvedTimelineDataSignature =
            timelineDataSignature ||
            buildTimelineEventsSignature(timelineData);
        const collapsedTimelineData = useMemo(
            () =>
                collapsePathologyTimelineEvents(
                    timelineData,
                    resolvedTimelineDataSignature
                ),
            [resolvedTimelineDataSignature]
        );
        const collapsedTimelineDataSignature = useMemo(
            () =>
                collapsedTimelineData === timelineData
                    ? resolvedTimelineDataSignature
                    : buildTimelineEventsSignature(collapsedTimelineData),
            [collapsedTimelineData, resolvedTimelineDataSignature]
        );
        const nestedTimelineData = useMemo(
            () =>
                nestPathologyTimelineTracks(
                    collapsedTimelineData,
                    collapsedTimelineDataSignature
                ),
            [collapsedTimelineDataSignature]
        );
        const timelineDataWithPortalExtrasSignature = isHtanOhsuPatient
            ? `${collapsedTimelineDataSignature}::htan-ohsu`
            : collapsedTimelineDataSignature;
        const timelineDataWithPortalExtras = useMemo(
            () =>
                getTimelineDataWithPortalExtras(
                    nestedTimelineData,
                    isHtanOhsuPatient,
                    collapsedTimelineDataSignature
                ),
            [isHtanOhsuPatient, collapsedTimelineDataSignature]
        );

        const store = useMemo(() => {
            const baseConfig: ITimelineConfig = buildBaseConfig(
                sampleManager,
                caseMetaData
            );

            if (isGenieBpcStudy) {
                configureGenieTimeline(baseConfig);
            }

            if (isHtanOhsuPatient) {
                configureHtanOhsuTimeline(baseConfig);
            }

            if (isToxicityPortal) {
                configureTimelineToxicityColors(baseConfig);
            }

            const trackSpecifications = sortTracks(
                baseConfig,
                timelineDataWithPortalExtras,
                timelineDataWithPortalExtrasSignature
            );

            configureTracks(trackSpecifications, baseConfig);
            return new TimelineStore(trackSpecifications);
        }, [
            caseMetaDataSignature,
            isGenieBpcStudy,
            isHtanOhsuPatient,
            isToxicityPortal,
            sampleManagerSignature,
            timelineDataWithPortalExtrasSignature,
        ]);

        return (
            <>
                <div>
                    <div>
                        <Timeline
                            store={store}
                            width={width}
                            headerWidth={headerWidth}
                            onClickDownload={() =>
                                downloadZippedTracks(
                                    timelineDataWithPortalExtras
                                )
                            }
                        />
                    </div>
                </div>
            </>
        );
    }
);

const TimelineWrapper: React.FunctionComponent<ITimelineProps> = observer(
    function(props: ITimelineProps) {
        const patientId =
            props.samples[0]?.patientId || props.data[0]?.patientId;
        const studyId = props.samples[0]?.studyId || props.data[0]?.studyId;
        const clinicalEventsSignature =
            props.clinicalEventsSignature ||
            buildTimelineEventsSignature(props.data);
        const timelineDataState = usePathologyAugmentedClinicalEventsState({
            clinicalEvents: props.data,
            clinicalEventsSignature,
            errorMessage: 'Failed to load pathology timeline image counts',
            patientId,
            samples: props.clinicalSamples || props.sampleManager.samples,
            studyId,
        });
        const timelineData = timelineDataState.events;
        const timelineDataSignature = timelineDataState.eventsSignature;

        return (
            <TimelineWrapperContent
                {...props}
                timelineData={timelineData}
                timelineDataSignature={timelineDataSignature}
            />
        );
    }
);

export default TimelineWrapper;
