import { ClinicalEvent } from 'cbioportal-ts-api-client';
import { DAY_ZERO_TOOLTIP, formatDaysSinceDiagnosis } from './wsiNavUtils';

/** Per-sample acquisition and sequencing days from the patient timeline. */
export interface WsiSampleTimeline {
    acquisitionDays?: number;
    sequencingDays?: number;
}

export type WsiSampleTimelineMap = ReadonlyMap<string, WsiSampleTimeline>;

// Same event conventions as the patient timeline and SampleManager sample
// ordering: specimen/acquisition events name the sample by SAMPLE_ID or a
// specimen reference number; sequencing events name it by SAMPLE_ID.
const ACQUISITION_EVENT_TYPE = /SPECIMEN|Sample Acquisition|sample_acquisition/i;
const SEQUENCING_EVENT_TYPE = /^sequencing$/i;
const ACQUISITION_SAMPLE_KEYS = [
    'SAMPLE_ID',
    'SpecimenReferenceNumber',
    'SPECIMEN_REFERENCE_NUMBER',
];
const SEQUENCING_SAMPLE_KEYS = ['SAMPLE_ID'];

function eventSampleIds(event: ClinicalEvent, keys: string[]): string[] {
    return (event.attributes || [])
        .filter(attr => keys.includes(attr.key) && !!attr.value)
        .map(attr => attr.value);
}

function keepEarliest(
    map: Map<string, WsiSampleTimeline>,
    sampleId: string,
    field: keyof WsiSampleTimeline,
    days: number
) {
    const entry = map.get(sampleId) || {};
    const current = entry[field];
    if (current == null || days < current) {
        entry[field] = days;
    }
    map.set(sampleId, entry);
}

/**
 * Builds sample acquisition and sequencing days (days since diagnosis, the
 * patient timeline coordinate) from clinical events. When a sample has
 * several events of one kind, the earliest day wins.
 */
export function buildWsiSampleTimelineMap(
    events?: ClinicalEvent[] | null
): Map<string, WsiSampleTimeline> {
    const map = new Map<string, WsiSampleTimeline>();
    (events || []).forEach(event => {
        const days = event?.startNumberOfDaysSinceDiagnosis;
        if (typeof days !== 'number' || !Number.isFinite(days)) {
            return;
        }
        const eventType = event.eventType || '';
        if (SEQUENCING_EVENT_TYPE.test(eventType)) {
            eventSampleIds(event, SEQUENCING_SAMPLE_KEYS).forEach(sampleId =>
                keepEarliest(map, sampleId, 'sequencingDays', days)
            );
        } else if (ACQUISITION_EVENT_TYPE.test(eventType)) {
            eventSampleIds(event, ACQUISITION_SAMPLE_KEYS).forEach(sampleId =>
                keepEarliest(map, sampleId, 'acquisitionDays', days)
            );
        }
    });
    return map;
}

/** Tooltip for a sample's "sequenced d+7" label. */
export function sampleSequencedTooltip(
    timeline: WsiSampleTimeline | undefined
): string | undefined {
    return timeline?.sequencingDays != null
        ? `This sample was sequenced on ${formatDaysSinceDiagnosis(
              timeline.sequencingDays
          )}. ${DAY_ZERO_TOOLTIP}`
        : undefined;
}

/** "sequenced d+7" for a sample group header, or null when unknown. */
export function sampleSequencedText(
    timeline: WsiSampleTimeline | undefined
): string | null {
    return timeline?.sequencingDays != null
        ? `sequenced ${formatDaysSinceDiagnosis(timeline.sequencingDays)}`
        : null;
}
