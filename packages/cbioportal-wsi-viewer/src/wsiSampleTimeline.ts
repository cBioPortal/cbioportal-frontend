import { ClinicalEvent } from 'cbioportal-ts-api-client';
import { formatDaysSinceDiagnosis } from './wsiNavUtils';

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

/** Explains the day notation wherever a slide or sample day is shown. */
export const DAY_ZERO_TOOLTIP =
    "Days are counted from the patient's first tumor sequencing (d0): " +
    'd-242 is 242 days before it, d+7 is 7 days after.';

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

/** Tooltip for a slide's procedure timepoint, with its sample's sequencing when known. */
export function procedureTooltip(
    procedureDays: number | null | undefined,
    sequencingDays: number | null | undefined
): string | undefined {
    if (procedureDays == null) {
        return undefined;
    }
    const procedure = `Procedure on ${formatDaysSinceDiagnosis(procedureDays)}`;
    if (sequencingDays == null) {
        return `${procedure}. ${DAY_ZERO_TOOLTIP}`;
    }
    const delta = sequencingDays - procedureDays;
    const relation =
        delta === 0
            ? 'the same day this sample was sequenced'
            : `${Math.abs(delta)} days ${
                  delta > 0 ? 'before' : 'after'
              } this sample was sequenced (${formatDaysSinceDiagnosis(
                  sequencingDays
              )})`;
    return `${procedure}, ${relation}. ${DAY_ZERO_TOOLTIP}`;
}

/** "sequenced d+7" for a sample group header, or null when unknown. */
export function sampleSequencedText(
    timeline: WsiSampleTimeline | undefined
): string | null {
    return timeline?.sequencingDays != null
        ? `sequenced ${formatDaysSinceDiagnosis(timeline.sequencingDays)}`
        : null;
}

/** "Proc 249 d before sequencing", or null when either day is unknown. */
export function procedureRelativeToSequencingText(
    procedureDays: number | null | undefined,
    sequencingDays: number | null | undefined
): string | null {
    if (procedureDays == null || sequencingDays == null) {
        return null;
    }
    const delta = sequencingDays - procedureDays;
    if (delta === 0) {
        return 'Proc same day as sequencing';
    }
    return `Proc ${Math.abs(delta)} d ${
        delta > 0 ? 'before' : 'after'
    } sequencing`;
}

/**
 * Sequencing day with its offset from the procedure, e.g.
 * "d+7 (249 d later)". Without a procedure day only the day is shown.
 */
export function sequencedRelativeToProcedureText(
    sequencingDays: number,
    procedureDays: number | null | undefined
): string {
    const day = formatDaysSinceDiagnosis(sequencingDays);
    if (procedureDays == null) {
        return day;
    }
    const delta = sequencingDays - procedureDays;
    if (delta === 0) {
        return `${day} (same day)`;
    }
    return `${day} (${Math.abs(delta)} d ${delta > 0 ? 'later' : 'earlier'})`;
}
