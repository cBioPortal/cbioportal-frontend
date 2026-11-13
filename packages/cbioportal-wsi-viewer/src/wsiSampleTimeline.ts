import {
    DAY_ZERO_TOOLTIP,
    formatDaysSinceDiagnosis,
    formatDaysSinceDiagnosisShort,
} from './wsiNavUtils';

/**
 * The fields of a patient clinical event (the cBioPortal API's
 * ClinicalEvent) that sample days are read from.
 */
export interface WsiClinicalEvent {
    eventType?: string;
    startNumberOfDaysSinceDiagnosis?: number;
    attributes?: Array<{ key: string; value: string }>;
}

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

function eventSampleIds(event: WsiClinicalEvent, keys: string[]): string[] {
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
 * several events of one kind, the earliest day wins whatever the event
 * order: a sample is acquired before any later re-collection or re-run is
 * recorded, and the patient view's sample ordering (SampleManager) uses the
 * same rule.
 */
export function buildWsiSampleTimelineMap(
    events?: WsiClinicalEvent[] | null
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

/** Tooltip for a sample's sequencing day label, with the exact day. */
export function sampleSequencedTooltip(
    timeline: WsiSampleTimeline | undefined
): string | undefined {
    return timeline?.sequencingDays != null
        ? `This sample was sequenced on ${formatDaysSinceDiagnosis(
              timeline.sequencingDays
          )}. ${DAY_ZERO_TOOLTIP}`
        : undefined;
}

/**
 * The sample's sequencing day for its slide list header, e.g. "d+7" or
 * "+3.4y"; "sequenced" is left to the tooltip. Null when unknown.
 */
export function sampleSequencedText(
    timeline: WsiSampleTimeline | undefined
): string | null {
    return timeline?.sequencingDays != null
        ? formatDaysSinceDiagnosisShort(timeline.sequencingDays)
        : null;
}
