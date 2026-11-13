import React from 'react';
import { Link } from 'react-router-dom';
import _ from 'lodash';
import {
    getAttributeValue,
    ITrackEventConfig,
    renderStack,
    renderSuperscript,
    TimelineEvent,
    TimelineTrackSpecification,
} from 'cbioportal-clinical-timeline';
import { ClinicalEvent } from 'cbioportal-ts-api-client';
import {
    buildWsiSampleTimelineMap,
    DAY_ZERO_TOOLTIP,
    formatDaysSinceDiagnosis,
    WsiSampleTimelineMap,
} from 'cbioportal-wsi-viewer';
import { getTextWidth } from 'cbioportal-frontend-commons';
import SampleMarker, { MultipleSampleMarker } from './SampleMarker';
import {
    getNumberRangeLabel,
    getSortedSampleInfo,
} from './TimelineWrapperUtils';
import { ISampleMetaDeta } from './TimelineWrapper';
import { PatientViewPageTabs } from 'pages/patientView/PatientViewPageTabIds';

/*
 * PATHOLOGY SLIDES clinical events: the slides of one procedure day, drawn on
 * the patient timeline as one row per stain. The track reads these event
 * attributes; every one is optional:
 *
 * - SUBTYPE: the stain; it names the stain row ("H&E", "IHC", ...).
 * - SAMPLE_ID: the sequenced sample the slides are linked to, or "Unmatched".
 * - MATCH_LEVEL: how the slides are linked to SAMPLE_ID: BLOCK (cut from the
 *   sequenced block), PART (same part, block not confirmed) or UNMATCHED.
 *   Without it, slides whose SAMPLE_ID is one of the patient's samples are
 *   linked to that sample with no level, and other slides are unmatched.
 * - SPECIMEN: the part the slides come from.
 * - IMAGE_COUNT: slides with a scanned image that the viewer can open; at 0
 *   the tooltip has no Open slides link.
 * - TOTAL_IMAGE_COUNT: all slides, viewable or not. NON_SERVABLE_IMAGE_COUNT
 *   (slides without a scanned image) is covered by the same Slides line.
 *   Without either count, the tooltip has no Slides line.
 * - TIMEPOINT_SOURCE: how the procedure day was derived.
 * - LINKOUT: an in-app link to the patient's Pathology Slides tab,
 *   `/patient/wsiHESlides?...`, scoped to the event's slides. Other links
 *   are not followed.
 *
 * Any other attribute is listed after these in the tooltip.
 */

export const PATHOLOGY_SLIDES_EVENT_TYPE = 'PATHOLOGY SLIDES';

/** Whether the events include PATHOLOGY SLIDES events. */
export function hasPathologySlideEvents(
    events: Array<{ eventType?: string }>
): boolean {
    return events.some(
        e => e.eventType?.toUpperCase() === PATHOLOGY_SLIDES_EVENT_TYPE
    );
}

/**
 * The events with LINKOUT dropped from PATHOLOGY SLIDES events, for a patient
 * view without a Pathology Slides tab for the link to open.
 */
export function withoutPathologySlideLinkouts(
    events: ClinicalEvent[]
): ClinicalEvent[] {
    return events.map(e =>
        e.eventType?.toUpperCase() === PATHOLOGY_SLIDES_EVENT_TYPE
            ? {
                  ...e,
                  attributes: e.attributes.filter(
                      a => a.key.toUpperCase() !== 'LINKOUT'
                  ),
              }
            : e
    );
}

/**
 * Whether the Summary timeline draws PATHOLOGY SLIDES events linked to the
 * Pathology Slides tab: only when that tab is shown, so a link never points
 * at a missing tab. Undefined while the tab's decision is pending for events
 * that include slides; the timeline builds its tracks once, so it waits.
 */
export function timelineShowsPathologySlides(
    events: ClinicalEvent[],
    slidesTab: { configured: boolean; pending: boolean; shown: boolean }
): boolean | undefined {
    if (!slidesTab.configured || !hasPathologySlideEvents(events)) {
        return false;
    }
    return slidesTab.pending ? undefined : slidesTab.shown;
}

/**
 * A PATHOLOGY SLIDES event; only the fields the track reads, satisfied by
 * both a clinical event and a timeline item's event.
 */
export interface PathologySlideEvent {
    attributes: Array<{ key: string; value: string }>;
    startNumberOfDaysSinceDiagnosis?: number;
}

/** Whether a sample ID names one of the patient's samples. */
export type IsPatientSample = (sampleId: string) => boolean;

function findAttribute(event: PathologySlideEvent, key: string) {
    return (event.attributes || []).find(
        attr => attr.key.toUpperCase() === key
    );
}

function attribute(event: PathologySlideEvent, key: string): string {
    return (findAttribute(event, key)?.value || '').trim();
}

/** A non-negative count attribute; undefined when absent or not a count. */
function countAttribute(
    event: PathologySlideEvent,
    key: string
): number | undefined {
    const value = attribute(event, key);
    if (!/^\d+$/.test(value)) {
        return undefined;
    }
    return parseInt(value, 10);
}

const UNMATCHED_LABEL = 'Unmatched';

type StatedMatchLevel = 'BLOCK' | 'PART' | 'UNMATCHED';

/** The event's MATCH_LEVEL; undefined when absent or not a known level. */
function statedMatchLevel(
    event: PathologySlideEvent
): StatedMatchLevel | undefined {
    const level = attribute(event, 'MATCH_LEVEL').toUpperCase();
    return level === 'BLOCK' || level === 'PART' || level === 'UNMATCHED'
        ? level
        : undefined;
}

/**
 * The sequenced sample a PATHOLOGY SLIDES event is linked to: its SAMPLE_ID
 * when MATCH_LEVEL is BLOCK or PART, or, without a MATCH_LEVEL, when
 * SAMPLE_ID is one of the patient's samples. Unset when unmatched.
 */
export function pathologySlideSampleId(
    event: PathologySlideEvent,
    isPatientSample: IsPatientSample
): string | undefined {
    const sampleId = attribute(event, 'SAMPLE_ID');
    if (!sampleId || sampleId.toUpperCase() === 'UNMATCHED') {
        return undefined;
    }
    const level = statedMatchLevel(event);
    if (level === undefined) {
        return isPatientSample(sampleId) ? sampleId : undefined;
    }
    return level === 'UNMATCHED' ? undefined : sampleId;
}

/** The patient's samples, from the timeline's sample metadata. */
export function patientSamplesOf(
    caseMetaData: ISampleMetaDeta
): IsPatientSample {
    return sampleId =>
        Object.prototype.hasOwnProperty.call(caseMetaData.label, sampleId);
}

const SLIDES_TAB_PATH = `/patient/${PatientViewPageTabs.WSIHESlides}`;

/**
 * The event's LINKOUT when it opens the patient Pathology Slides tab;
 * anything else is not linked.
 */
export function pathologySlideOpenPath(
    event: PathologySlideEvent
): string | undefined {
    const linkout = attribute(event, 'LINKOUT');
    return linkout.startsWith(`${SLIDES_TAB_PATH}?`) ? linkout : undefined;
}

const MATCH_LABELS: Record<string, { text: string; note: string }> = {
    BLOCK: {
        text: 'Block',
        note:
            'The slide was cut from the same tissue block that was sequenced for this sample.',
    },
    PART: {
        text: 'Part',
        note:
            'The slide comes from the same part as the sequenced sample; the sequenced block is not confirmed.',
    },
};

const UNMATCHED_SAMPLE_TEXT = 'Unmatched (not linked to a sequenced sample)';

/**
 * Procedure offset from sequencing, e.g. "42 d before sequencing (d+962)".
 * Empty when the sequencing day is unknown.
 */
function sequencingRelation(
    procedureDays: number,
    sequencingDays: number | undefined
): string {
    if (sequencingDays == null) {
        return '';
    }
    const day = formatDaysSinceDiagnosis(sequencingDays);
    const delta = sequencingDays - procedureDays;
    if (delta === 0) {
        return `same day as sequencing (${day})`;
    }
    return `${Math.abs(delta)} d ${
        delta > 0 ? 'before' : 'after'
    } sequencing (${day})`;
}

/** One labelled line of the timeline tooltip for a PATHOLOGY SLIDES event. */
export interface PathologySlideTooltipLine {
    label: string;
    value: string;
    /** Explanation shown under the value. */
    note?: string;
}

export interface PathologySlideTooltipContent {
    title: string;
    /** The slide lines, then the event's other attributes. */
    lines: PathologySlideTooltipLine[];
    /** Explanation of the day notation, when a day is shown. */
    footnote?: string;
    /** In-app path to the Pathology Slides tab; unset when not linked. */
    openPath?: string;
    /** Accessible name of the link; it starts with the visible text. */
    openLabel: string;
}

/** Attributes the timeline styles events with, never listed. */
const STYLE_ATTRIBUTE_KEYS = ['STYLE_COLOR', 'STYLE_SHAPE'];

/** "1 of 3 viewable", "2 viewable" or "3"; undefined without counts. */
function slideCountLine(
    event: PathologySlideEvent
): { line: PathologySlideTooltipLine; keys: string[] } | undefined {
    const viewable = countAttribute(event, 'IMAGE_COUNT');
    const total = countAttribute(event, 'TOTAL_IMAGE_COUNT');
    if (viewable === undefined && total === undefined) {
        return undefined;
    }
    if (viewable === undefined) {
        return {
            line: { label: 'Slides', value: String(total) },
            keys: ['TOTAL_IMAGE_COUNT'],
        };
    }
    if (total === undefined) {
        return {
            line: { label: 'Slides', value: `${viewable} viewable` },
            keys: ['IMAGE_COUNT'],
        };
    }
    const shownTotal = Math.max(total, viewable);
    const nonViewable = shownTotal - viewable;
    return {
        line: {
            label: 'Slides',
            value: `${viewable} of ${shownTotal} viewable`,
            note:
                nonViewable > 0
                    ? `${nonViewable} ${
                          nonViewable === 1 ? 'slide is' : 'slides are'
                      } not viewable: no scanned image is available.`
                    : undefined,
        },
        keys: ['IMAGE_COUNT', 'TOTAL_IMAGE_COUNT', 'NON_SERVABLE_IMAGE_COUNT'],
    };
}

/**
 * Timeline tooltip content for one PATHOLOGY SLIDES event, e.g.
 * "Pathology slides · H&E · Part-matched" followed by Sample, Procedure,
 * Part and Slides lines, then the event's other attributes.
 */
export function buildPathologySlideTooltipContent(
    event: PathologySlideEvent,
    sampleTimelines: WsiSampleTimelineMap,
    isPatientSample: IsPatientSample
): PathologySlideTooltipContent {
    const sampleId = pathologySlideSampleId(event, isPatientSample);
    const match = sampleId
        ? MATCH_LABELS[statedMatchLevel(event) || '']
        : undefined;
    const stain = attribute(event, 'SUBTYPE');
    const title = [
        'Pathology slides',
        stain,
        match ? `${match.text}-matched` : sampleId ? '' : UNMATCHED_LABEL,
    ]
        .filter(Boolean)
        .join(' · ');

    const shownKeys = [
        'SAMPLE_ID',
        'SUBTYPE',
        'MATCH_LEVEL',
        'LINKOUT',
        ...STYLE_ATTRIBUTE_KEYS,
    ];
    const lines: PathologySlideTooltipLine[] = [
        {
            label: 'Sample',
            value: sampleId || UNMATCHED_SAMPLE_TEXT,
            note: match?.note,
        },
    ];
    let footnote: string | undefined;
    const days = event.startNumberOfDaysSinceDiagnosis;
    if (typeof days === 'number' && Number.isFinite(days)) {
        const relation = sequencingRelation(
            days,
            sampleId ? sampleTimelines.get(sampleId)?.sequencingDays : undefined
        );
        const procedure = formatDaysSinceDiagnosis(days);
        lines.push({
            label: 'Procedure',
            value: relation ? `${procedure} — ${relation}` : procedure,
            note: attribute(event, 'TIMEPOINT_SOURCE') || undefined,
        });
        shownKeys.push('TIMEPOINT_SOURCE');
        footnote = DAY_ZERO_TOOLTIP;
    }
    const specimen = attribute(event, 'SPECIMEN');
    if (specimen) {
        lines.push({ label: 'Part', value: specimen });
        shownKeys.push('SPECIMEN');
    }
    const counts = slideCountLine(event);
    if (counts) {
        lines.push(counts.line);
        shownKeys.push(...counts.keys);
    }
    (event.attributes || []).forEach(attr => {
        const key = attr.key.toUpperCase();
        const value = (attr.value || '').trim();
        if (value && !shownKeys.includes(key)) {
            lines.push({ label: attr.key.replace(/_/g, ' '), value });
        }
    });

    return {
        title,
        lines,
        footnote,
        // A known zero viewable count has nothing to open.
        openPath:
            countAttribute(event, 'IMAGE_COUNT') === 0
                ? undefined
                : pathologySlideOpenPath(event),
        openLabel: `Open slides (${[stain, sampleId || UNMATCHED_LABEL]
            .filter(Boolean)
            .join(', ')})`,
    };
}

export interface PathologySlideMarkerSample {
    sampleId: string;
    color: string;
    label: string;
}

/**
 * The patient sample a PATHOLOGY SLIDES event is matched to, with its
 * SampleManager color and number, or null when the event is unmatched or
 * names a sample outside this patient view.
 */
export function pathologySlideMarkerSample(
    event: PathologySlideEvent,
    caseMetaData: ISampleMetaDeta
): PathologySlideMarkerSample | null {
    const sampleId = pathologySlideSampleId(
        event,
        patientSamplesOf(caseMetaData)
    );
    const label = sampleId ? caseMetaData.label[sampleId] : undefined;
    if (!sampleId || !label) {
        return null;
    }
    return {
        sampleId,
        color: caseMetaData.color[sampleId] || '#333333',
        label,
    };
}

/** Fill of the marker for slides not linked to a sequenced sample. */
export const UNMATCHED_MARKER_COLOR = '#999999';

const SAMPLE_MARKER_RADIUS = 7;

/**
 * How a group of simultaneous PATHOLOGY SLIDES events is drawn:
 * - "sample": every event belongs to one sample; its numbered marker.
 * - "samples": events from several samples (unmatched ones add no number);
 *   the multi-sample marker with each sample listed once.
 * - "unmatched": no event belongs to a patient sample; a grey marker.
 * `count` is the number of events, shown as a superscript when above one.
 */
export type PathologySlideGroupMarker = { count: number } & (
    | { kind: 'sample'; sample: PathologySlideMarkerSample }
    | { kind: 'samples'; samples: PathologySlideMarkerSample[] }
    | { kind: 'unmatched' }
);

export function pathologySlideGroupMarker(
    events: PathologySlideEvent[],
    caseMetaData: ISampleMetaDeta
): PathologySlideGroupMarker {
    const count = events.length;
    const markerSamples = events.map(e =>
        pathologySlideMarkerSample(e, caseMetaData)
    );
    const samples = _.uniqBy(
        markerSamples.filter(
            (s): s is PathologySlideMarkerSample => s !== null
        ),
        s => s.sampleId
    );
    if (samples.length === 0) {
        return { kind: 'unmatched', count };
    }
    if (samples.length === 1 && !markerSamples.includes(null)) {
        return { kind: 'sample', sample: samples[0], count };
    }
    return { kind: 'samples', samples, count };
}

/** Superscript event count placed just right of a marker's top edge. */
function countSuperscript(count: number, y: number, markerHalfWidth: number) {
    return (
        <g transform={`translate(${markerHalfWidth - 3} 0)`}>
            {renderSuperscript(count, y)}
        </g>
    );
}

export function renderPathologySlideGroupMarker(
    marker: PathologySlideGroupMarker,
    y: number
): JSX.Element {
    let shape: JSX.Element;
    let halfWidth: number;
    switch (marker.kind) {
        case 'sample':
            shape = (
                <SampleMarker
                    color={marker.sample.color}
                    label={marker.sample.label}
                    y={y}
                />
            );
            halfWidth = SAMPLE_MARKER_RADIUS;
            break;
        case 'samples': {
            const colors = marker.samples.map(s => s.color);
            const labels = marker.samples.map(s => s.label);
            // Same width as MultipleSampleMarker's pill.
            const label = getNumberRangeLabel(
                getSortedSampleInfo(colors, labels).map(p => p.label)
            );
            halfWidth = Math.ceil(getTextWidth(label, 'Arial', '10px')) / 2 + 4;
            shape = (
                <MultipleSampleMarker colors={colors} labels={labels} y={y} />
            );
            break;
        }
        default:
            if (marker.count > 1) {
                shape = renderStack(
                    _.times(marker.count, () => UNMATCHED_MARKER_COLOR),
                    y
                );
                halfWidth = 4.5;
            } else {
                shape = (
                    <circle
                        cx="0"
                        cy={y}
                        r={SAMPLE_MARKER_RADIUS}
                        fill={UNMATCHED_MARKER_COLOR}
                    />
                );
                halfWidth = SAMPLE_MARKER_RADIUS;
            }
    }
    return (
        <g>
            {shape}
            {marker.count > 1 && countSuperscript(marker.count, y, halfWidth)}
        </g>
    );
}

const NOTE_STYLE: React.CSSProperties = { maxWidth: 320 };

export const PathologySlideTooltip: React.FunctionComponent<{
    event: PathologySlideEvent;
    sampleTimelines: WsiSampleTimelineMap;
    isPatientSample: IsPatientSample;
}> = function({ event, sampleTimelines, isPatientSample }) {
    const content = buildPathologySlideTooltipContent(
        event,
        sampleTimelines,
        isPatientSample
    );
    return (
        <div data-test="pathology-slide-tooltip">
            <strong>{content.title}</strong>
            <table style={{ marginTop: 5 }}>
                <tbody>
                    {content.lines.map((line, i) => (
                        <tr key={i}>
                            <th
                                scope="row"
                                style={{
                                    paddingRight: 10,
                                    verticalAlign: 'top',
                                }}
                            >
                                {line.label}
                            </th>
                            <td>
                                {line.value}
                                {line.note && (
                                    <div
                                        className="text-muted small"
                                        style={NOTE_STYLE}
                                    >
                                        {line.note}
                                    </div>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
            {content.footnote && (
                <div
                    className="text-muted small"
                    style={{ ...NOTE_STYLE, marginTop: 5 }}
                >
                    {content.footnote}
                </div>
            )}
            {content.openPath && (
                <div style={{ marginTop: 5 }}>
                    <Link
                        to={content.openPath}
                        className="btn btn-default btn-xs"
                        aria-label={content.openLabel}
                    >
                        Open slides
                    </Link>
                </div>
            )}
        </div>
    );
};

/** Stain rows first, in this order; any other stain follows alphabetically. */
const STAIN_TRACK_ORDER = ['H&E', 'IHC'];

function stainTrackRank(type: string): [number, string] {
    const index = STAIN_TRACK_ORDER.indexOf(type);
    if (index >= 0) {
        return [index, ''];
    }
    // Unknown and the timeline's "Other" catch-all go last.
    const isCatchAll = /^(unknown|other)$/i.test(type);
    return [STAIN_TRACK_ORDER.length + (isCatchAll ? 1 : 0), type];
}

/** Orders the stain rows under the PATHOLOGY SLIDES track: H&E, IHC, others. */
export function sortPathologyStainTracks(
    tracks: TimelineTrackSpecification[]
): TimelineTrackSpecification[] {
    return _.sortBy(tracks, [
        t => stainTrackRank(t.type)[0],
        t => stainTrackRank(t.type)[1],
    ]);
}

/**
 * PATHOLOGY SLIDES track, split into one row per stain (SUBTYPE) by the
 * timeline's track structure. Events are drawn with the SampleManager's
 * numbered, colored sample markers (see pathologySlideGroupMarker), with a
 * count when several share a day.
 */
export function pathologySlidesTrackConfig(
    caseMetaData: ISampleMetaDeta,
    clinicalEvents: ClinicalEvent[] | undefined
): ITrackEventConfig {
    return {
        trackTypeMatch: new RegExp(`^${PATHOLOGY_SLIDES_EVENT_TYPE}$`, 'i'),
        configureTrack: (root: TimelineTrackSpecification) => {
            const sampleTimelines = buildWsiSampleTimelineMap(clinicalEvents);
            const isPatientSample = patientSamplesOf(caseMetaData);
            const markerSample = (e: TimelineEvent) =>
                pathologySlideMarkerSample(e.event, caseMetaData);

            // Stain rows are child tracks whose type is the stain, so the
            // renderers are set on every track of the subtree.
            const configure = (cat: TimelineTrackSpecification) => {
                cat.eventColorGetter = e =>
                    markerSample(e)?.color || UNMATCHED_MARKER_COLOR;

                cat.sortSimultaneousEvents = (events: TimelineEvent[]) =>
                    _.sortBy<TimelineEvent>(events, [
                        (e: TimelineEvent) => {
                            const label = parseInt(
                                markerSample(e)?.label || '',
                                10
                            );
                            return isNaN(label)
                                ? Number.POSITIVE_INFINITY
                                : label;
                        },
                        (e: TimelineEvent) =>
                            getAttributeValue('SUBTYPE', e) || '',
                    ]);

                cat.renderEvents = (events: TimelineEvent[], y: number) =>
                    renderPathologySlideGroupMarker(
                        pathologySlideGroupMarker(
                            events.map(e => e.event),
                            caseMetaData
                        ),
                        y
                    );

                cat.renderTooltip = (e: TimelineEvent) => (
                    <PathologySlideTooltip
                        event={e.event}
                        sampleTimelines={sampleTimelines}
                        isPatientSample={isPatientSample}
                    />
                );

                if (cat.tracks && cat.tracks.length) {
                    cat.tracks = sortPathologyStainTracks(cat.tracks);
                    cat.tracks.forEach(configure);
                }
            };
            configure(root);
        },
    };
}
