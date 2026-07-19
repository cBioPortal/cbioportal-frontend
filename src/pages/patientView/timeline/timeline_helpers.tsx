import {
    formatDate,
    getAttributeValue,
    ITimelineConfig,
    POINT_COLOR,
    TimelineEvent,
    TimelineLegendItem,
    TimelineTrackSpecification,
    TimelineTrackType,
} from 'cbioportal-clinical-timeline';
import {
    getEventColor,
    getSampleInfo,
} from 'pages/patientView/timeline/TimelineWrapperUtils';
import React from 'react';
import SampleMarker, {
    MultipleSampleMarker,
} from 'pages/patientView/timeline/SampleMarker';
import SampleManager from 'pages/patientView/SampleManager';
import { ISampleMetaDeta } from 'pages/patientView/timeline/TimelineWrapper';
import { ClinicalDataBySampleId, ClinicalEvent } from 'cbioportal-ts-api-client';
import { getColor, getTextWidth } from 'cbioportal-frontend-commons';
import ReactMarkdown from 'react-markdown';
import { PATHOLOGY_EVENT_ATTRIBUTE_KEYS } from './pathologyTimelineUtils';
import { buildClinicalEventsSignature } from './clinicalEventSignatureUtils';
import {
    buildTimelineCaseMetaDataSignature,
    buildTimelineSampleManagerSignature,
} from './timelineInputSignatureUtils';

const OTHER = 'Other';
const MAX_BASE_CONFIG_CACHE_ENTRIES = 50;
const MAX_SORTED_TRACKS_CACHE_ENTRIES = 100;
const PATHOLOGY_TRACK_COLORS: Record<string, string> = {
    'H&E': '#1f77b4',
    IHC: '#c66a00',
};
const PATHOLOGY_NON_SERVABLE_TRACK_COLOR = '#7a7a7a';

type PathologyPresentationSummary = {
    eventSignature: string;
    date: number | null | undefined;
    eventLinkRows: Array<{ href: string; label: string }>;
    linkout?: string;
    linkouts: string[];
    matchLevels: string[];
    nonServableCount: number;
    sampleIds: string[];
    servableCount: number;
    source: string;
    specimens: string[];
};

type GroupedPathologyPresentationLinkRow = {
    href: string;
    matchLevel: string;
    sampleId: string;
    servableCount: number;
    specimens: string[];
};

type PathologyEventPresentationData = Readonly<{
    imageCount: number;
    linkout: string;
    matchLevel: string;
    nonServableImageCount: number;
    sampleId: string;
    signature: string;
    specimen: string;
    subtype: string;
    timepointSource: string;
}>;

const pathologyPresentationSummaryCache = new WeakMap<
    TimelineEvent[],
    PathologyPresentationSummary
>();
const pathologyEventPresentationDataCache = new WeakMap<
    TimelineEvent['event']['attributes'],
    PathologyEventPresentationData
>();
type CachedTimelineEventAttributesSignatureEntry = {
    orderedSnapshot: string;
    signature: string;
};
type SampleTooltipAttributeRow = Readonly<{ key: string; value: string }>;

type SampleTimelineTooltipData = Readonly<{
    orderedAttributes: readonly SampleTooltipAttributeRow[];
    sampleId?: string;
}>;

type CachedTimelineSortConfigEntry = {
    signature: string;
    sortOrderEntries: string[];
    trackStructureEntries: string[];
    trackStructuresByRoot: { [rootTrack: string]: string[] };
    upperSortOrder: string[];
};

type CachedSampleTimelineTooltipDataEntry = {
    clinicalDataRef?: ClinicalDataBySampleId['clinicalData'];
    clinicalSignature: string;
    eventSignature: string;
    tooltipData: SampleTimelineTooltipData;
};

const sampleTimelineTooltipDataCache = new WeakMap<
    TimelineEvent['event']['attributes'],
    CachedSampleTimelineTooltipDataEntry
>();
const timelineEventAttributesSignatureCache = new WeakMap<
    TimelineEvent['event']['attributes'],
    CachedTimelineEventAttributesSignatureEntry
>();
const sampleClinicalDataSignatureCache = new WeakMap<
    ClinicalDataBySampleId['clinicalData'],
    CachedTimelineEventAttributesSignatureEntry
>();
const timelineSortConfigCache = new WeakMap<
    ITimelineConfig,
    CachedTimelineSortConfigEntry
>();
const baseConfigCache = new Map<string, ITimelineConfig>();
const sortedTracksCache = new Map<string, TimelineTrackSpecification[]>();

function freezePathologyPresentationSummary(
    summary: PathologyPresentationSummary
): PathologyPresentationSummary {
    const frozenEventLinkRows = new Array<{ href: string; label: string }>(
        summary.eventLinkRows.length
    );
    for (let index = 0; index < summary.eventLinkRows.length; index += 1) {
        const row = summary.eventLinkRows[index];
        frozenEventLinkRows[index] = Object.freeze({
            href: row.href,
            label: row.label,
        });
    }
    const linkouts = new Array<string>(summary.linkouts.length);
    for (let index = 0; index < summary.linkouts.length; index += 1) {
        linkouts[index] = summary.linkouts[index];
    }
    const matchLevels = new Array<string>(summary.matchLevels.length);
    for (let index = 0; index < summary.matchLevels.length; index += 1) {
        matchLevels[index] = summary.matchLevels[index];
    }
    const sampleIds = new Array<string>(summary.sampleIds.length);
    for (let index = 0; index < summary.sampleIds.length; index += 1) {
        sampleIds[index] = summary.sampleIds[index];
    }
    const specimens = new Array<string>(summary.specimens.length);
    for (let index = 0; index < summary.specimens.length; index += 1) {
        specimens[index] = summary.specimens[index];
    }
    const frozen = {
        ...summary,
        eventLinkRows: Object.freeze(frozenEventLinkRows) as Array<{
            href: string;
            label: string;
        }>,
        linkouts: Object.freeze(linkouts) as string[],
        matchLevels: Object.freeze(matchLevels) as string[],
        sampleIds: Object.freeze(sampleIds) as string[],
        specimens: Object.freeze(specimens) as string[],
    };
    return Object.freeze(frozen) as PathologyPresentationSummary;
}

function freezeSampleTimelineTooltipData(
    tooltipData: {
        orderedAttributes: SampleTooltipAttributeRow[];
        sampleId?: string;
    }
): SampleTimelineTooltipData {
    const orderedAttributes = new Array<SampleTooltipAttributeRow>(
        tooltipData.orderedAttributes.length
    );
    for (let index = 0; index < tooltipData.orderedAttributes.length; index += 1) {
        const attribute = tooltipData.orderedAttributes[index];
        orderedAttributes[index] = Object.freeze({
            key: attribute.key,
            value: attribute.value,
        });
    }
    return Object.freeze({
        ...tooltipData,
        orderedAttributes: Object.freeze(orderedAttributes),
    }) as SampleTimelineTooltipData;
}

function cloneTimelineConfig(config: ITimelineConfig): ITimelineConfig {
    const sortOrder = config.sortOrder
        ? new Array<string>(config.sortOrder.length)
        : undefined;
    if (sortOrder) {
        for (let index = 0; index < config.sortOrder!.length; index += 1) {
            sortOrder[index] = config.sortOrder![index];
        }
    }

    const trackStructures = config.trackStructures
        ? new Array<string[]>(config.trackStructures.length)
        : undefined;
    if (trackStructures) {
        for (
            let structureIndex = 0;
            structureIndex < config.trackStructures!.length;
            structureIndex += 1
        ) {
            const sourceStructure = config.trackStructures![structureIndex];
            const clonedStructure = new Array<string>(sourceStructure.length);
            for (
                let itemIndex = 0;
                itemIndex < sourceStructure.length;
                itemIndex += 1
            ) {
                clonedStructure[itemIndex] = sourceStructure[itemIndex];
            }
            trackStructures[structureIndex] = clonedStructure;
        }
    }

    const sourceTrackEventRenderers = config.trackEventRenderers;
    const trackEventRenderers = sourceTrackEventRenderers
        ? new Array(sourceTrackEventRenderers.length)
        : undefined;
    if (trackEventRenderers && sourceTrackEventRenderers) {
        for (
            let rendererIndex = 0;
            rendererIndex < sourceTrackEventRenderers.length;
            rendererIndex += 1
        ) {
            const renderer = sourceTrackEventRenderers[rendererIndex];
            const legend = renderer.legend
                ? new Array(renderer.legend.length)
                : undefined;
            if (legend) {
                for (let legendIndex = 0; legendIndex < renderer.legend!.length; legendIndex += 1) {
                    const item = renderer.legend![legendIndex];
                    legend[legendIndex] = { color: item.color, label: item.label };
                }
            }
            const sourceAttributeOrder = renderer.attributeOrder;
            const attributeOrder = sourceAttributeOrder
                ? new Array(sourceAttributeOrder.length)
                : undefined;
            if (attributeOrder && sourceAttributeOrder) {
                for (
                    let attributeIndex = 0;
                    attributeIndex < sourceAttributeOrder.length;
                    attributeIndex += 1
                ) {
                    attributeOrder[attributeIndex] =
                        sourceAttributeOrder[attributeIndex];
                }
            }
            trackEventRenderers[rendererIndex] = {
                ...renderer,
                legend,
                attributeOrder,
            };
        }
    }

    return {
        ...config,
        sortOrder,
        trackStructures,
        trackEventRenderers,
    };
}

function getCachedBaseConfig(cacheKey: string): ITimelineConfig | undefined {
    const cached = baseConfigCache.get(cacheKey);
    if (!cached) {
        return undefined;
    }

    baseConfigCache.delete(cacheKey);
    baseConfigCache.set(cacheKey, cached);
    return cloneTimelineConfig(cached);
}

function setCachedBaseConfig(
    cacheKey: string,
    config: ITimelineConfig
): ITimelineConfig {
    if (baseConfigCache.has(cacheKey)) {
        baseConfigCache.delete(cacheKey);
    }
    const cachedConfig = cloneTimelineConfig(config);
    baseConfigCache.set(cacheKey, cachedConfig);

    if (baseConfigCache.size > MAX_BASE_CONFIG_CACHE_ENTRIES) {
        const oldestKey = baseConfigCache.keys().next().value;
        if (oldestKey) {
            baseConfigCache.delete(oldestKey);
        }
    }

    return config;
}

function buildTimelineSortConfigSignature(baseConfig: ITimelineConfig): string {
    return getResolvedTimelineSortConfig(baseConfig).signature;
}

function getResolvedTimelineSortConfig(
    baseConfig: ITimelineConfig
): CachedTimelineSortConfigEntry {
    const sourceSortOrder = baseConfig.sortOrder || [];
    const sortOrderEntries = new Array<string>(sourceSortOrder.length);
    for (let index = 0; index < sourceSortOrder.length; index += 1) {
        sortOrderEntries[index] = sourceSortOrder[index].toUpperCase();
    }

    const sourceTrackStructures = baseConfig.trackStructures || [];
    const trackStructureEntries = new Array<string>(sourceTrackStructures.length);
    const trackStructuresByRoot: { [root: string]: string[] } = {};
    for (
        let structureIndex = 0;
        structureIndex < sourceTrackStructures.length;
        structureIndex += 1
    ) {
        const structure = sourceTrackStructures[structureIndex];
        trackStructureEntries[structureIndex] = structure.join('>');
        if (structure.length > 0) {
            trackStructuresByRoot[structure[0]] = structure;
        }
    }
    const cached = timelineSortConfigCache.get(baseConfig);

    if (
        cached &&
        cached.sortOrderEntries.length === sortOrderEntries.length &&
        cached.trackStructureEntries.length === trackStructureEntries.length &&
        cached.sortOrderEntries.every(
            (entry, index) => entry === sortOrderEntries[index]
        ) &&
        cached.trackStructureEntries.every(
            (entry, index) => entry === trackStructureEntries[index]
        )
    ) {
        return cached;
    }

    const resolved = {
        signature: `${sortOrderEntries.join('|')}::${trackStructureEntries.join(
            '|'
        )}`,
        sortOrderEntries,
        trackStructureEntries,
        trackStructuresByRoot,
        upperSortOrder: sortOrderEntries,
    };
    timelineSortConfigCache.set(baseConfig, resolved);
    return resolved;
}

function getCachedSortedTracks(
    cacheKey: string
): TimelineTrackSpecification[] | undefined {
    const cached = sortedTracksCache.get(cacheKey);
    if (!cached) {
        return undefined;
    }

    sortedTracksCache.delete(cacheKey);
    sortedTracksCache.set(cacheKey, cached);
    return cached;
}

function setCachedSortedTracks(
    cacheKey: string,
    tracks: TimelineTrackSpecification[]
): TimelineTrackSpecification[] {
    if (sortedTracksCache.has(cacheKey)) {
        sortedTracksCache.delete(cacheKey);
    }
    const cachedTracks = cloneTrackSpecifications(tracks);
    sortedTracksCache.set(cacheKey, cachedTracks);

    if (sortedTracksCache.size > MAX_SORTED_TRACKS_CACHE_ENTRIES) {
        const oldestKey = sortedTracksCache.keys().next().value;
        if (oldestKey) {
            sortedTracksCache.delete(oldestKey);
        }
    }

    return tracks;
}

function cloneTrackSpecifications(
    tracks: TimelineTrackSpecification[]
): TimelineTrackSpecification[] {
    const clonedTracks = new Array<TimelineTrackSpecification>(tracks.length);
    for (let index = 0; index < tracks.length; index += 1) {
        clonedTracks[index] = cloneTrackSpecification(tracks[index]);
    }
    return clonedTracks;
}

function cloneTrackSpecification(
    track: TimelineTrackSpecification
): TimelineTrackSpecification {
    const clonedTrack: TimelineTrackSpecification = {
        ...track,
        items: [],
        tracks: undefined,
    };

    const items = track.items || [];
    clonedTrack.items = new Array(items.length);
    for (let index = 0; index < items.length; index += 1) {
        const item = items[index];
        clonedTrack.items[index] = {
            ...item,
            event: item.event,
            containingTrack: clonedTrack,
        };
    }

    if (track.tracks?.length) {
        clonedTrack.tracks = new Array(track.tracks.length);
        for (let index = 0; index < track.tracks.length; index += 1) {
            clonedTrack.tracks[index] = cloneTrackSpecification(
                track.tracks[index]
            );
        }
    }

    return clonedTrack;
}

function buildPathologyPresentationEventSignature(
    event: TimelineEvent
): string {
    const data = getPathologyEventPresentationData(event);
    return [
        event.event.startNumberOfDaysSinceDiagnosis ?? '',
        data.signature,
    ].join('::');
}

function buildTimelineEventAttributesSignature(
    attributes: TimelineEvent['event']['attributes']
): string {
    let orderedSnapshot = '';
    for (let index = 0; index < attributes.length; index += 1) {
        const attribute = attributes[index];
        if (index > 0) {
            orderedSnapshot += '|';
        }
        orderedSnapshot += `${attribute.key}:${attribute.value}`;
    }
    const signature = orderedSnapshot;
    const cached = timelineEventAttributesSignatureCache.get(attributes);

    if (cached && cached.orderedSnapshot === orderedSnapshot) {
        return cached.signature;
    }

    timelineEventAttributesSignatureCache.set(attributes, {
        orderedSnapshot,
        signature,
    });
    return signature;
}

function freezePathologyEventPresentationData(
    data: Omit<PathologyEventPresentationData, 'signature'> & {
        signature: string;
    }
): PathologyEventPresentationData {
    return Object.freeze({ ...data }) as PathologyEventPresentationData;
}

function buildClinicalDataSignature(
    sampleWithClinicalData?: ClinicalDataBySampleId
): string {
    const clinicalData = sampleWithClinicalData?.clinicalData || [];
    let orderedSnapshot = '';
    for (let index = 0; index < clinicalData.length; index += 1) {
        const entry = clinicalData[index];
        if (index > 0) {
            orderedSnapshot += '|';
        }
        orderedSnapshot += `${entry.clinicalAttributeId}:${entry.value}`;
    }
    const signature = orderedSnapshot;
    const cached = sampleClinicalDataSignatureCache.get(clinicalData);

    if (cached && cached.orderedSnapshot === orderedSnapshot) {
        return cached.signature;
    }

    sampleClinicalDataSignatureCache.set(clinicalData, {
        orderedSnapshot,
        signature,
    });
    return signature;
}

function buildPathologyPresentationSummarySignature(
    events: TimelineEvent[]
): string {
    const signatures = new Array(events.length);
    for (let index = 0; index < events.length; index += 1) {
        signatures[index] = buildPathologyPresentationEventSignature(
            events[index]
        );
    }
    signatures.sort((left, right) => left.localeCompare(right));

    let signature = '';
    for (let index = 0; index < signatures.length; index += 1) {
        if (index > 0) {
            signature += '|';
        }
        signature += signatures[index];
    }
    return signature;
}

function shouldShowSampleTimelineTooltipAttribute(key: string): boolean {
    const normalizedKey = key.toUpperCase();
    return (
        normalizedKey !== 'SAMPLE_ID' &&
        normalizedKey !== 'MATCH_LEVEL' &&
        normalizedKey !== 'SPECIMEN' &&
        normalizedKey !== 'SPECIMEN_KEY' &&
        normalizedKey !== 'HAS_WSI_SLIDE' &&
        normalizedKey !== 'TIMEPOINT_SOURCE' &&
        !normalizedKey.startsWith('WSI_')
    );
}

function getSampleTimelineTooltipData(
    event: TimelineEvent,
    sampleWithClinicalData?: ClinicalDataBySampleId
): SampleTimelineTooltipData {
    const eventAttributes = event.event.attributes || [];
    const eventSignature = buildTimelineEventAttributesSignature(eventAttributes);
    const clinicalDataRef = sampleWithClinicalData?.clinicalData;
    const clinicalSignature = buildClinicalDataSignature(sampleWithClinicalData);
    const cached = sampleTimelineTooltipDataCache.get(eventAttributes);

    if (
        cached &&
        cached.eventSignature === eventSignature &&
        cached.clinicalDataRef === clinicalDataRef &&
        cached.clinicalSignature === clinicalSignature
    ) {
        return cached.tooltipData;
    }

    const attributes = new Map<string, string>();
    for (let index = 0; index < eventAttributes.length; index += 1) {
        const attr = eventAttributes[index];
        if (shouldShowSampleTimelineTooltipAttribute(attr.key)) {
            attributes.set(attr.key, attr.value);
        }
    }

    const clinicalDataRows = sampleWithClinicalData?.clinicalData || [];
    for (let index = 0; index < clinicalDataRows.length; index += 1) {
        const clinicalData = clinicalDataRows[index];
        if (
            shouldShowSampleTimelineTooltipAttribute(
                clinicalData.clinicalAttributeId
            )
        ) {
            attributes.set(clinicalData.clinicalAttributeId, clinicalData.value);
        }
    }

    const orderedAttributes = new Array<SampleTooltipAttributeRow>(
        attributes.size
    );
    let entryIndex = 0;
    for (const [key, value] of attributes.entries()) {
        orderedAttributes[entryIndex] = { key, value };
        entryIndex += 1;
    }
    orderedAttributes.sort((left, right) => left.key.localeCompare(right.key));

    const tooltipData = freezeSampleTimelineTooltipData({
        orderedAttributes,
        sampleId: sampleWithClinicalData?.id,
    });

    sampleTimelineTooltipDataCache.set(eventAttributes, {
        clinicalDataRef,
        clinicalSignature,
        eventSignature,
        tooltipData,
    });

    return tooltipData;
}

function asTimelineEvents(
    input: TimelineEvent | TimelineEvent[] | undefined
): TimelineEvent[] {
    if (!input) return [];
    return Array.isArray(input) ? input : [input];
}

function getPathologyEventPresentationData(
    event: TimelineEvent
): PathologyEventPresentationData {
    const attributes = event.event.attributes || [];
    const signature = buildTimelineEventAttributesSignature(attributes);
    const cached = pathologyEventPresentationDataCache.get(attributes);

    if (cached && cached.signature === signature) {
        return cached;
    }

    const attributeValue = (key: string) => getAttributeValue(key, event) || '';
    const data = freezePathologyEventPresentationData({
        imageCount:
            Number(attributeValue(PATHOLOGY_EVENT_ATTRIBUTE_KEYS.imageCount)) ||
            0,
        linkout: attributeValue(PATHOLOGY_EVENT_ATTRIBUTE_KEYS.linkout),
        matchLevel: attributeValue(PATHOLOGY_EVENT_ATTRIBUTE_KEYS.matchLevel),
        nonServableImageCount:
            Number(
                attributeValue(
                    PATHOLOGY_EVENT_ATTRIBUTE_KEYS.nonServableImageCount
                )
            ) || 0,
        sampleId: attributeValue(PATHOLOGY_EVENT_ATTRIBUTE_KEYS.sampleId),
        signature,
        specimen: attributeValue(PATHOLOGY_EVENT_ATTRIBUTE_KEYS.specimen),
        subtype: attributeValue(PATHOLOGY_EVENT_ATTRIBUTE_KEYS.subtype),
        timepointSource: attributeValue(
            PATHOLOGY_EVENT_ATTRIBUTE_KEYS.timepointSource
        ),
    });

    pathologyEventPresentationDataCache.set(attributes, data);
    return data;
}

function getPathologyTrackColor(
    track: TimelineTrackSpecification,
    events: TimelineEvent[]
): string {
    const subtype =
        track.type || getPathologyEventPresentationData(events[0]).subtype || 'H&E';
    return PATHOLOGY_TRACK_COLORS[subtype] || '#666666';
}

function stripSpecimenKeyFromPathologyLinkout(linkout: string): string {
    if (!linkout || !linkout.includes('specimenKey=')) {
        return linkout;
    }

    const [pathname, rawQuery = ''] = linkout.split('?', 2);
    const params = new URLSearchParams(rawQuery);
    params.delete('specimenKey');
    const nextQuery = params.toString();
    return nextQuery ? `${pathname}?${nextQuery}` : pathname;
}

function joinDistinctPathologyPresentationSpecimens(specimens: string[]): string {
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

function buildGroupedPathologyPresentationLabel(
    row: GroupedPathologyPresentationLinkRow
): string {
    const totalCount = row.servableCount;
    const pieces = [String(totalCount)];
    if (row.matchLevel) {
        pieces.push(row.matchLevel);
    }
    const specimenLabel = joinDistinctPathologyPresentationSpecimens(
        row.specimens
    );
    if (specimenLabel) {
        pieces.push(specimenLabel);
    }
    return pieces.join(' - ');
}

function getPathologyCountBadgeClipPathId(
    track: TimelineTrackSpecification,
    events: TimelineEvent[]
): string {
    const summary = getPathologyPresentationSummary(events);
    let eventLinkRowsSignature = '';
    for (let index = 0; index < summary.eventLinkRows.length; index += 1) {
        if (index > 0) {
            eventLinkRowsSignature += '|';
        }
        eventLinkRowsSignature += summary.eventLinkRows[index].href;
    }
    return [
        'pathology-count-badge',
        track.uid || track.type || '',
        summary.date ?? '',
        summary.servableCount,
        summary.nonServableCount,
        summary.linkout || eventLinkRowsSignature,
    ].join(':');
}

function getPathologyPresentationSummary(
    events: TimelineEvent[]
): PathologyPresentationSummary {
    const cached = pathologyPresentationSummaryCache.get(events);
    const eventSignature = buildPathologyPresentationSummarySignature(events);
    if (cached && cached.eventSignature === eventSignature) {
        return cached;
    }

    let servableCount = 0;
    let nonServableCount = 0;
    const sources = new Set<string>();
    const sampleIdsSet = new Set<string>();
    const matchLevelsSet = new Set<string>();
    const specimensSet = new Set<string>();
    const groupedLinkRows = new Map<string, GroupedPathologyPresentationLinkRow>();

    for (const event of events) {
        const data = getPathologyEventPresentationData(event);
        servableCount += data.imageCount;
        nonServableCount += data.nonServableImageCount;

        if (data.timepointSource) {
            sources.add(data.timepointSource);
        }
        if (data.sampleId) {
            sampleIdsSet.add(data.sampleId);
        }
        if (data.matchLevel) {
            matchLevelsSet.add(data.matchLevel);
        }
        if (data.specimen) {
            specimensSet.add(data.specimen);
        }
        if (data.linkout) {
            const collapsedHref = stripSpecimenKeyFromPathologyLinkout(
                data.linkout
            );
            const groupedLinkRowKey = [
                data.sampleId,
                data.matchLevel,
                collapsedHref,
            ].join('||');
            const existing = groupedLinkRows.get(groupedLinkRowKey);
            if (existing) {
                existing.servableCount += data.imageCount;
                if (data.specimen) {
                    existing.specimens.push(data.specimen);
                }
            } else {
                groupedLinkRows.set(groupedLinkRowKey, {
                    href: collapsedHref,
                    matchLevel: data.matchLevel,
                    sampleId: data.sampleId,
                    servableCount: data.imageCount,
                    specimens: data.specimen ? [data.specimen] : [],
                });
            }
        }
    }

    const sourceValues = Array.from(sources);
    sourceValues.sort((left, right) => left.localeCompare(right));
    const source = sourceValues.join(', ');

    const sampleIds = Array.from(sampleIdsSet);
    sampleIds.sort((left, right) => left.localeCompare(right));

    const matchLevels = Array.from(matchLevelsSet);
    matchLevels.sort((left, right) => left.localeCompare(right));

    const specimens = Array.from(specimensSet);
    specimens.sort((left, right) => left.localeCompare(right));

    const linkouts =
        servableCount > 0
            ? Array.from(groupedLinkRows.values()).map(row => row.href)
            : [];
    linkouts.sort((left, right) => left.localeCompare(right));
    const linkout = linkouts.length === 1 ? linkouts[0] : undefined;
    const eventLinkRows: Array<{
        href: string;
        label: string;
    }> = [];
    if (!linkout && linkouts.length > 0) {
        const groupedRows = Array.from(groupedLinkRows.values());
        for (let index = 0; index < groupedRows.length; index += 1) {
            const row = groupedRows[index];
            eventLinkRows.push({
                href: row.href,
                label: buildGroupedPathologyPresentationLabel(row),
            });
        }
        eventLinkRows.sort(
            (left, right) =>
                left.label.localeCompare(right.label) ||
                left.href.localeCompare(right.href)
        );
    }
    const summary = freezePathologyPresentationSummary({
        eventSignature,
        date: events[0]?.event.startNumberOfDaysSinceDiagnosis,
        eventLinkRows,
        linkout,
        linkouts,
        matchLevels,
        nonServableCount,
        sampleIds,
        servableCount,
        source,
        specimens,
    });

    pathologyPresentationSummaryCache.set(events, summary);
    return summary;
}

export function renderPathologyCountBadge(
    events: TimelineEvent[],
    yCoordinate: number,
    track: TimelineTrackSpecification
) {
    const {
        linkout,
        linkouts,
        nonServableCount,
        servableCount,
    } = getPathologyPresentationSummary(events);
    const totalCount = servableCount + nonServableCount;
    const label = String(totalCount);
    const labelWidth = Math.ceil(getTextWidth(label, 'Arial', '10px'));
    const rectPadding = 4;
    const rectWidth = Math.max(18, labelWidth + 2 * rectPadding);
    const rectHeight = 14;
    const color = getPathologyTrackColor(track, events);
    const clipPathId = getPathologyCountBadgeClipPathId(track, events);
    const servableWidth =
        totalCount > 0 ? (rectWidth * servableCount) / totalCount : 0;
    const nonServableWidth = rectWidth - servableWidth;

    const content = (
        <g transform={`translate(0 ${yCoordinate})`}>
            <defs>
                <clipPath id={clipPathId}>
                    <rect
                        x={-rectWidth / 2}
                        y={-rectHeight / 2}
                        width={rectWidth}
                        height={rectHeight}
                        rx={rectHeight / 2}
                        ry={rectHeight / 2}
                    />
                </clipPath>
            </defs>
            <g clipPath={`url(#${clipPathId})`}>
                {servableWidth > 0 && (
                    <rect
                        x={-rectWidth / 2}
                        y={-rectHeight / 2}
                        width={servableWidth}
                        height={rectHeight}
                        fill={color}
                    />
                )}
                {nonServableWidth > 0 && (
                    <rect
                        x={rectWidth / 2 - nonServableWidth}
                        y={-rectHeight / 2}
                        width={nonServableWidth}
                        height={rectHeight}
                        fill={PATHOLOGY_NON_SERVABLE_TRACK_COLOR}
                    />
                )}
            </g>
            <text
                x="0"
                y="0"
                text-anchor="middle"
                fill="white"
                font-size="10px"
                font-family="Arial"
                dy=".3em"
            >
                {label}
            </text>
        </g>
    );

    if (!linkout) {
        return content;
    }

    return (
        <a href={linkout} target="_blank" onClick={e => e.stopPropagation()}>
            {content}
        </a>
    );
}

export function renderPathologyTooltip(
    input: TimelineEvent | TimelineEvent[],
    track: TimelineTrackSpecification
) {
    const events = asTimelineEvents(input);
    if (!events.length) {
        return null;
    }
    const {
        date,
        eventLinkRows,
        linkout,
        matchLevels,
        nonServableCount,
        servableCount,
        specimens,
    } = getPathologyPresentationSummary(events);
    return (
        <table className="table table-condensed">
            <tbody>
                <tr>
                    <td>PATHOLOGY TYPE</td>
                    <td>Slides</td>
                </tr>
                <tr>
                    <td>SLIDE TYPE</td>
                    <td>{track.type}</td>
                </tr>
                {servableCount > 0 && (
                    <tr>
                        <td>VIEWABLE SLIDES</td>
                        <td>{servableCount}</td>
                    </tr>
                )}
                {nonServableCount > 0 && (
                    <tr>
                        <td>NON-VIEWABLE SLIDES</td>
                        <td>{nonServableCount}</td>
                    </tr>
                )}
                {matchLevels.length > 0 && (
                    <tr>
                        <td>MATCH</td>
                        <td>{matchLevels.join(', ')}</td>
                    </tr>
                )}
                {specimens.length > 0 && (
                    <tr>
                        <td>SPECIMEN</td>
                        <td>{specimens.join(', ')}</td>
                    </tr>
                )}
                {linkout && (
                    <tr>
                        <td>LINKOUT</td>
                        <td>
                            <a
                                href={linkout}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={event => event.stopPropagation()}
                            >
                                View slides
                            </a>
                        </td>
                    </tr>
                )}
                {!linkout &&
                    (() => {
                        const linkRows = new Array<JSX.Element>(
                            eventLinkRows.length
                        );
                        for (
                            let index = 0;
                            index < eventLinkRows.length;
                            index += 1
                        ) {
                            const item = eventLinkRows[index];
                            linkRows[index] = (
                                <tr key={`${item.href}:${item.label}`}>
                                    <td>{index === 0 ? 'LINKOUTS' : ''}</td>
                                    <td>
                                        <a
                                            href={item.href}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            onClick={event =>
                                                event.stopPropagation()
                                            }
                                        >
                                            {item.label}
                                        </a>
                                    </td>
                                </tr>
                            );
                        }
                        return linkRows;
                    })()}
                <tr>
                    <td>DATE</td>
                    <td className="nowrap">
                        {date == null ? 'Unknown' : formatDate(date)}
                    </td>
                </tr>
            </tbody>
        </table>
    );
}

export function configureHtanOhsuTimeline(baseConfig: ITimelineConfig) {
    baseConfig.trackEventRenderers = baseConfig.trackEventRenderers || [];
    baseConfig.trackEventRenderers.push({
        trackTypeMatch: /IMAGING/i,
        configureTrack: (cat: TimelineTrackSpecification) => {
            cat.renderEvents = function(e) {
                return (
                    <a
                        href={
                            'https://minerva-story-htan-ohsu-demo.surge.sh/#s=0#w=0#g=0#m=-1#a=-100_-100#v=0.5_0.5_0.5#o=-100_-100_1_1#p=Q'
                        }
                        target={'_blank'}
                        onClick={e => e.stopPropagation()}
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            version="1.1"
                            id="Layer_1"
                            x="-8px"
                            y="1px"
                            width="16px"
                            height="16px"
                            viewBox="0 0 16 16"
                            enable-background="new 0 0 16 16"
                        >
                            <g>
                                <circle
                                    fill="none"
                                    stroke="#646464"
                                    stroke-width="2"
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                    stroke-miterlimit="10"
                                    cx="7.997"
                                    cy="9.058"
                                    r="3.023"
                                />
                                <path
                                    fill="none"
                                    stroke="#646464"
                                    stroke-width="2"
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                    stroke-miterlimit="10"
                                    d="   M14.168,4h-2.983l-0.521-1.36C10.503,2.288,10.07,2,9.702,2H6.359C5.99,2,5.558,2.288,5.396,2.64L4.877,4H1.893   C1.401,4,1,4.427,1,4.948v8.072C1,13.543,1.401,14,1.893,14h12.275C14.659,14,15,13.543,15,13.021V4.948   C15,4.427,14.659,4,14.168,4z"
                                />
                            </g>
                        </svg>
                    </a>
                );
            };
            cat.renderTooltip = function() {
                return (
                    <div>
                        <strong>Click camera to open image viewer</strong>
                        <hr style={{ margin: '5px 0' }} />
                        <table>
                            <tr>
                                <td>Assay Type</td>
                                <td>mIHC</td>
                            </tr>
                            <tr>
                                <td>File Format</td>
                                <td>OME-TIFF</td>
                            </tr>
                        </table>
                    </div>
                );
            };
        },
    });
}

export function configureTimelineToxicityColors(baseConfig: ITimelineConfig) {
    baseConfig.trackStructures = baseConfig.trackStructures || [];
    baseConfig.trackStructures!.push([
        'TOXICITY',
        'TOXICITY_TYPE',
        'SUBTYPE',
        'TOX_OTHER_SPECIFY',
    ]);

    baseConfig.trackStructures!.push(['MEASUREMENTS', 'TEST']);

    baseConfig.trackEventRenderers?.push({
        trackTypeMatch: /BMI/i,
        configureTrack: (cat: TimelineTrackSpecification) => {
            //     psaTrack.trackType = TimelineTrackType.LINE_CHART;
            //     psaTrack.getLineChartValue = (e: TimelineEvent) => {}
            cat.trackType = TimelineTrackType.LINE_CHART;
            cat.getLineChartValue = (e: TimelineEvent) => {
                try {
                    const val = e?.event?.attributes?.find(
                        e => e.key === 'RESULT'
                    )?.value;
                    if (val !== undefined) {
                        return parseFloat(val);
                    } else {
                        return null;
                    }
                } catch (ex) {
                    return null;
                }
            };
        },
    });

    baseConfig.eventColorGetter = function(e: TimelineEvent) {
        const grade = e.event.attributes.find(
            (att: any) => att.key === 'GRADE'
        );
        if (grade) {
            const colorMap: any = {
                '1': 'green',
                '2': 'yellow',
                '3': 'orange',
                '4': 'red',
            };
            return colorMap[grade.value] || POINT_COLOR;
        } else {
            const path = e.containingTrack.uid.split('.');
            if (path[0] === 'TREATMENT' && path.length > 2) {
                return getColor(path[2]);
            }
        }
    };
}

export function configureGenieTimeline(baseConfig: ITimelineConfig) {
    baseConfig.sortOrder = [
        'Sample acquisition',
        'Sequencing',
        'Surgery',
        'Diagnostics',
        'Diagnostic',
        'Diagnosis',
        'Treatment',
        'Lab_test',
        'Status',
        'IMAGING',
        'MEDONC',
        'Med Onc Assessment',
        'Pathology',
    ];

    const legend: TimelineLegendItem[] = [
        { label: 'Indeterminate', color: '#ffffff' },
        { label: 'Stable', color: '#dcdcdc' },
        { label: 'Mixed', color: '#daa520' },
        { label: 'Improving', color: 'rgb(44, 160, 44)' },
        { label: 'Worsening', color: 'rgb(214, 39, 40)' },
    ];

    // this differs from default in that on genie, we do NOT distinguish tracks based on subtype. we hide on subtype
    baseConfig.trackStructures = [
        ['TREATMENT', 'TREATMENT_TYPE', 'AGENT'],
        ['LAB_TEST', 'TEST'],
    ];

    // status track
    baseConfig.trackEventRenderers = baseConfig.trackEventRenderers || [];
    baseConfig.trackEventRenderers.push({
        trackTypeMatch: /Med Onc Assessment|MedOnc/i,
        legend,
        attributeOrder: ['CURATED_CANCER_STATUS', 'CANCER_STATUS'],
        configureTrack: (cat: TimelineTrackSpecification) => {
            cat.label = 'Med Onc Assessment';
            const _getEventColor = (event: TimelineEvent) => {
                if (event.end > event.start) {
                    // range
                    return POINT_COLOR;
                }
                return getEventColor(
                    event,
                    ['CURATED_CANCER_STATUS'],
                    [
                        { re: /indeter/i, color: '#ffffff' },
                        { re: /stable/i, color: '#dcdcdc' },
                        { re: /mixed/i, color: 'goldenrod' },
                        {
                            re: /improving/i,
                            color: 'rgb(44, 160, 44)',
                        },
                        {
                            re: /worsening/i,
                            color: 'rgb(214, 39, 40)',
                        },
                    ]
                );
            };
            cat.renderEvents = (events, y) => {
                if (events.length === 1) {
                    const color = _getEventColor(events[0]);
                    return (
                        <circle
                            cx="0"
                            cy={y}
                            r="4"
                            stroke="#999999"
                            fill={color}
                        />
                    );
                } else {
                    return null; // render default
                }
            };
        },
    });

    // imaging track
    baseConfig.trackEventRenderers.push({
        trackTypeMatch: /IMAGING/i,
        legend,
        attributeOrder: ['CURATED_CANCER_STATUS', 'CANCER_STATUS'],
        configureTrack: (cat: TimelineTrackSpecification) => {
            cat.label = 'Imaging Assessment';
            if (cat.items && cat.items.length) {
                const _getEventColor = (event: TimelineEvent) => {
                    if (event.end > event.start) {
                        // range
                        return POINT_COLOR;
                    }
                    return getEventColor(
                        event,
                        ['IMAGE_OVERALL', 'CURATED_CANCER_STATUS'],
                        [
                            {
                                re: /indeter|does not mention/i,
                                color: '#ffffff',
                            },
                            { re: /stable/i, color: 'gainsboro' },
                            { re: /mixed/i, color: 'goldenrod' },
                            {
                                re: /improving/i,
                                color: 'rgb(44, 160, 44)',
                            },
                            {
                                re: /worsening/i,
                                color: 'rgb(214, 39, 40)',
                            },
                        ]
                    );
                };

                cat.eventColorGetter = _getEventColor;
                cat.renderEvents = (events, y) => {
                    if (events.length === 1) {
                        const color = _getEventColor(events[0]);
                        return (
                            <circle
                                cx="0"
                                cy={y}
                                r="4"
                                stroke="#999999"
                                fill={color}
                            />
                        );
                    } else {
                        return null; // use default rendering
                    }
                };
            }
        },
    });
    return baseConfig;
}

export function buildBaseConfig(
    sampleManager: SampleManager,
    caseMetaData: ISampleMetaDeta
) {
    const cacheKey = `${buildTimelineSampleManagerSignature(
        sampleManager
    )}::${buildTimelineCaseMetaDataSignature(caseMetaData)}`;
    const cached = getCachedBaseConfig(cacheKey);
    if (cached) {
        return cached;
    }

    let baseConfig: ITimelineConfig = {
        sortOrder: [
            'Specimen',
            'Sample Acquisition',
            'Sequencing',
            'Surgery',
            'Med Onc',
            'Med Onc Assessment',
            'Status',
            'Diagnostics',
            'Diagnostic',
            'Pathology',
            'Imaging',
            'Imaging Assessment',
            'Treatment',
            'Diagnosis',
            'Lab_test',
            'Measurements',
        ],
        trackStructures: [
            ['TREATMENT', 'TREATMENT_TYPE', 'SUBTYPE', 'AGENT'],
            ['LAB_TEST', 'TEST'],
            ['DIAGNOSIS', 'SUBTYPE'],
            ['PATHOLOGY', 'PATHOLOGY_TYPE', 'SUBTYPE'],
            ['BIOBANK', 'SPECIMEN_TYPE', 'SITE', 'SUBTYPE'],
        ],
        trackEventRenderers: [
            {
                trackTypeMatch: /TOXICITY/,
                configureTrack: (cat: TimelineTrackSpecification) => {},
            },

            {
                trackTypeMatch: /MEASUREMENTS/i,
                configureTrack: (cat: TimelineTrackSpecification) => {
                    if (cat.tracks) {
                        for (const track of cat.tracks) {
                            if (track.items.length) {
                                if (allResultValuesAreNumerical(track.items)) {
                                    track.trackType =
                                        TimelineTrackType.LINE_CHART;
                                    track.getLineChartValue = e =>
                                        getNumericalAttrVal('RESULT', e);
                                }
                            }
                        }
                    }
                },
            },

            {
                trackTypeMatch: /LAB_TEST/i,
                configureTrack: (cat: TimelineTrackSpecification) => {
                    // Configure non-PSA tracks
                    if (cat.tracks) {
                        for (const track of cat.tracks) {
                            if (track.type !== 'PSA') {
                                configureLABTESTSubTrack(track);
                            }
                        }
                    }

                    // Configure PSA track
                    const psaTrack = cat.tracks
                        ? cat.tracks.find(t => t.type === 'PSA')
                        : undefined;

                    if (psaTrack && psaTrack && psaTrack.items.length) {
                        psaTrack.trackType = TimelineTrackType.LINE_CHART;
                        psaTrack.getLineChartValue = (e: TimelineEvent) => {
                            const val =
                                getAttributeValue('VALUE', e) ||
                                getAttributeValue('RESULT', e);
                            if (val === undefined) {
                                return null;
                            } else {
                                return parseFloat(val.replace(/^[<>]/gi, ''));
                            }
                        };
                    }
                },
            },
            {
                trackTypeMatch: /H&E|IHC/i,
                configureTrack: (cat: TimelineTrackSpecification) => {
                    cat.renderEvents = (events, yCoordinate) =>
                        renderPathologyCountBadge(events, yCoordinate, cat);
                    cat.renderTooltip = event =>
                        renderPathologyTooltip(event, cat);
                },
            },
            {
                trackTypeMatch: /^STATUS$/i,
                configureTrack: (cat: TimelineTrackSpecification) => {
                    cat.renderEvents = (
                        events: TimelineEvent[],
                        yCoordinate: number
                    ) => {
                        if (
                            events.length === 1 &&
                            events[0].event.attributes.find((attr: any) => {
                                return (
                                    !!attr.key.match(/^STATUS$/i) &&
                                    !!attr.value.match(/^DECEASED$/i)
                                );
                            })
                        ) {
                            // if an event has a "status" attribute with value "deceased",
                            // then render it as a black diamond
                            const size = 7;
                            return (
                                <rect
                                    x={0}
                                    y={yCoordinate - size / 2}
                                    fill={'black'}
                                    width={size}
                                    height={size}
                                    style={{
                                        transformBox: 'fill-box',
                                        transformOrigin: 'center',
                                        transform: 'rotate(45deg)',
                                    }}
                                />
                            );
                        } else {
                            // render default
                            return null;
                        }
                    };
                },
            },
            {
                trackTypeMatch: /SPECIMEN|SAMPLE ACQUISITION|SEQUENCING/i,
                configureTrack: (cat: TimelineTrackSpecification) => {
                    const sampleById = new Map();
                    for (const sample of sampleManager.samples) {
                        sampleById.set(sample.id, sample);
                    }
                    // we want a custom tooltip for samples, which includes clinical data
                    // not included in the timeline event
                    cat.renderTooltip = function(event: TimelineEvent) {
                        try {
                            const hoveredSample = event.event.attributes.find(
                                (att: any) => att.key === 'SAMPLE_ID'
                            );

                            if (!hoveredSample || !hoveredSample.value) {
                                return null;
                            }

                            const sampleWithClinicalData = sampleById.get(
                                hoveredSample.value
                            );
                            const { orderedAttributes, sampleId } =
                                getSampleTimelineTooltipData(
                                    event,
                                    sampleWithClinicalData
                                );

                            return (
                                <table>
                                    <tbody>
                                        {sampleId && (
                                            <tr>
                                                <th>SAMPLE ID</th>
                                                <td>{sampleId}</td>
                                            </tr>
                                        )}

                                        {(() => {
                                            const attributeRows =
                                                new Array<JSX.Element>(
                                                    orderedAttributes.length
                                                );
                                            for (
                                                let index = 0;
                                                index <
                                                orderedAttributes.length;
                                                index += 1
                                            ) {
                                                const attr =
                                                    orderedAttributes[index];
                                                attributeRows[index] = (
                                                    <tr
                                                        key={`${attr.key}:${attr.value}`}
                                                    >
                                                        <th>
                                                            {attr.key
                                                                .toUpperCase()
                                                                .replace(
                                                                    /_/g,
                                                                    ' '
                                                                )}
                                                        </th>
                                                        <td>
                                                            {' '}
                                                            <ReactMarkdown
                                                                allowedElements={[
                                                                    'p',
                                                                    'a',
                                                                ]}
                                                                linkTarget={
                                                                    '_blank'
                                                                }
                                                            >
                                                                {attr.value}
                                                            </ReactMarkdown>
                                                        </td>
                                                    </tr>
                                                );
                                            }
                                            return attributeRows;
                                        })()}
                                        <tr>
                                            <th>START DATE</th>
                                            <td className={'nowrap'}>
                                                {formatDate(event.start)}
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            );
                        } catch (ex) {
                            console.error(
                                'ERROR: Failed to render Timeline tooltip',
                                ex
                            );
                            return <div>Error rendering tooltip</div>;
                        }
                    };

                    cat.sortSimultaneousEvents = (events: TimelineEvent[]) => {
                        const sortedEvents = [...events];
                        sortedEvents.sort((left, right) => {
                            let leftValue = Number.POSITIVE_INFINITY;
                            const leftSampleInfo = getSampleInfo(
                                left,
                                caseMetaData
                            );
                            if (leftSampleInfo) {
                                const label = parseInt(leftSampleInfo.label);
                                if (!isNaN(label)) {
                                    leftValue = label;
                                }
                            }

                            let rightValue = Number.POSITIVE_INFINITY;
                            const rightSampleInfo = getSampleInfo(
                                right,
                                caseMetaData
                            );
                            if (rightSampleInfo) {
                                const label = parseInt(rightSampleInfo.label);
                                if (!isNaN(label)) {
                                    rightValue = label;
                                }
                            }

                            return leftValue - rightValue;
                        });
                        return sortedEvents;
                    };

                    cat.renderEvents = (events: TimelineEvent[], y: number) => {
                        if (events.length === 1) {
                            const sampleInfo = getSampleInfo(
                                events[0],
                                caseMetaData
                            );
                            if (sampleInfo) {
                                return (
                                    <SampleMarker
                                        color={sampleInfo.color}
                                        label={sampleInfo.label}
                                        y={y}
                                    />
                                );
                            } else {
                                return null;
                            }
                        } else {
                            const colors: string[] = [];
                            const labels: string[] = [];
                            for (const event of events) {
                                const sampleInfo = getSampleInfo(
                                    event,
                                    caseMetaData
                                );
                                if (sampleInfo) {
                                    colors.push(sampleInfo.color);
                                    labels.push(sampleInfo.label);
                                }
                            }
                            return (
                                <MultipleSampleMarker
                                    colors={colors}
                                    labels={labels}
                                    y={y}
                                />
                            );
                        }
                    };
                },
            },
        ],
    };

    return setCachedBaseConfig(cacheKey, baseConfig);
}

export function sortTracks(
    baseConfig: any,
    data: ClinicalEvent[],
    dataSignature?: string
): TimelineTrackSpecification[] {
    const resolvedSortConfig = getResolvedTimelineSortConfig(baseConfig);
    const cacheKey = `${resolvedSortConfig.signature}::${
        dataSignature || buildClinicalEventsSignature(data)
    }`;
    const cached = getCachedSortedTracks(cacheKey);
    if (cached) {
        return cloneTrackSpecifications(cached);
    }

    const dataByEventType: { [eventType: string]: ClinicalEvent[] } = {};
    const encounteredTrackTypes: string[] = [];
    const configuredTrackTypes = new Set(resolvedSortConfig.upperSortOrder);
    for (const event of data) {
        const eventType = event.eventType.toUpperCase();
        if (!dataByEventType[eventType]) {
            dataByEventType[eventType] = [];
            if (!configuredTrackTypes.has(eventType)) {
                encounteredTrackTypes.push(eventType);
            }
        }
        dataByEventType[eventType].push(event);
    }

    const allTracksInOrder: string[] = [];
    for (const trackType of resolvedSortConfig.upperSortOrder) {
        allTracksInOrder.push(trackType);
    }
    for (const trackType of encounteredTrackTypes) {
        allTracksInOrder.push(trackType);
    }

    const trackSpecifications: TimelineTrackSpecification[] = [];
    for (const trackKey of allTracksInOrder) {
        const data = dataByEventType[trackKey];
        if (!data) {
            continue;
        }

        if (trackKey in resolvedSortConfig.trackStructuresByRoot) {
            trackSpecifications.push(
                collapseOTHERTracks(
                    organizeDataIntoTracks(
                        trackKey,
                        resolvedSortConfig.trackStructuresByRoot[
                            trackKey
                        ].slice(1),
                        data,
                        trackKey
                    )
                )
            );
        } else {
            const trackSpec: Partial<TimelineTrackSpecification> = {
                type: trackKey,
                uid: trackKey,
            };
            trackSpec.items = makeItems(
                data,
                trackSpec as TimelineTrackSpecification
            );
            trackSpecifications.push(trackSpec as TimelineTrackSpecification);
        }
    }

    return setCachedSortedTracks(cacheKey, trackSpecifications);
}

function collapseOTHERTracks(rootTrack: TimelineTrackSpecification) {
    // In-place operation modifying the input.

    // Recursively find cases where there is only one child track, an Other,
    //  and absorb its items and descendents into the parent.
    // If rootTrack only has one child track and it is an OTHER track, then
    //  absorb its items and descendants into rootTrack. Keep going until
    //  this is no longer true.
    while (
        rootTrack.tracks &&
        rootTrack.tracks.length === 1 &&
        rootTrack.tracks[0].type === OTHER
    ) {
        const mergedItems = new Array(
            rootTrack.items.length + rootTrack.tracks[0].items.length
        );
        let mergedIndex = 0;
        for (const item of rootTrack.items) {
            mergedItems[mergedIndex] = item;
            mergedIndex += 1;
        }
        for (const item of rootTrack.tracks[0].items) {
            mergedItems[mergedIndex] = item;
            mergedIndex += 1;
        }
        rootTrack.items = mergedItems;
        rootTrack.tracks = rootTrack.tracks[0].tracks;
    }

    // Recurse
    if (rootTrack.tracks) {
        for (const track of rootTrack.tracks) {
            collapseOTHERTracks(track);
        }
    }

    // Finally, return the (possibly modified) argument for easy chaining
    return rootTrack;
}

function organizeDataIntoTracks(
    rootTrackType: string,
    trackStructure: string[],
    eventData: ClinicalEvent[],
    uid: string
): TimelineTrackSpecification {
    const groupingKey = trackStructure[0];
    const childTrackStructure =
        trackStructure.length > 1 ? trackStructure.slice(1) : undefined;
    const dataByRootValue: { [rootValue: string]: ClinicalEvent[] } = {};
    const rootValues: string[] = [];

    for (const item of eventData) {
        let rootValue = OTHER;
        for (const attribute of item.attributes || []) {
            if (attribute.key === groupingKey) {
                rootValue = attribute.value;
                break;
            }
        }

        let bucket = dataByRootValue[rootValue];
        if (!bucket) {
            bucket = [];
            dataByRootValue[rootValue] = bucket;
            rootValues.push(rootValue);
        }
        bucket.push(item);
    }

    const tracks: TimelineTrackSpecification[] = [];
    for (const rootValue of rootValues) {
        const data = dataByRootValue[rootValue];
        if (childTrackStructure) {
            tracks.push(
                organizeDataIntoTracks(
                    rootValue,
                    childTrackStructure,
                    data,
                    `${uid}.${rootValue}`
                )
            );
        } else {
            const trackSpec: Partial<TimelineTrackSpecification> = {
                type: rootValue,
                uid: `${uid}.${rootValue}`,
            };
            trackSpec.items = makeItems(
                data,
                trackSpec as TimelineTrackSpecification
            );
            tracks.push(trackSpec as TimelineTrackSpecification);
        }
    }

    // Finally, organize all tracks under an empty root track
    const track = {
        type: rootTrackType,
        tracks,
        items: [],
        uid,
    };

    return track;
}

function makeItems(
    eventData: ClinicalEvent[],
    containingTrack: TimelineTrackSpecification
) {
    const items = new Array(eventData.length);

    for (let index = 0; index < eventData.length; index += 1) {
        const e = eventData[index];
        items[index] = {
            end:
                e.endNumberOfDaysSinceDiagnosis ||
                e.startNumberOfDaysSinceDiagnosis,
            start: e.startNumberOfDaysSinceDiagnosis,
            event: e,
            containingTrack,
        };
    }

    return items;
}

function getNumericalAttrVal(name: string, e: TimelineEvent) {
    const val = getAttributeValue(name, e);
    if (val === undefined) {
        return null;
    } else {
        return parseFloat(val.replace(/^[<>]/gi, ''));
    }
}
function configureLABTESTSubTrack(track: TimelineTrackSpecification) {
    if (track.items.length) {
        if (allResultValuesAreNumerical(track.items)) {
            track.trackType = TimelineTrackType.LINE_CHART;
            track.getLineChartValue = e => getNumericalAttrVal('RESULT', e);
        }
        // recurse
        if (track.tracks) {
            for (const childTrack of track.tracks) {
                configureLABTESTSubTrack(childTrack);
            }
        }
    }
}

export function allResultValuesAreNumerical(events: TimelineEvent[]) {
    for (const event of events) {
        const val = getNumericalAttrVal('RESULT', event);
        if (!(val !== null && !isNaN(val))) {
            return false;
        }
    }
    return true;
}
