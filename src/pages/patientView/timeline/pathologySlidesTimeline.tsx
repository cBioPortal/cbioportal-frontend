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

// The PATHOLOGY SLIDES events are the patient's clinical events imported
// from the pathology timeline file (data_clinical_timeline_pathology_slides),
// one per procedure day, sample, match level, specimen and stain: SAMPLE_ID
// ("Unmatched" when not linked to a sequenced sample), SUBTYPE (the stain
// row), MATCH_LEVEL, SPECIMEN, IMAGE_COUNT (viewable slides),
// TOTAL_IMAGE_COUNT, TIMEPOINT_SOURCE and LINKOUT (the Pathology Slides
// tab, scoped to the event).

export const PATHOLOGY_SLIDES_EVENT_TYPE = 'PATHOLOGY SLIDES';

/** Whether the events include PATHOLOGY SLIDES events. */
export function hasPathologySlideEvents(events: ClinicalEvent[]): boolean {
    return events.some(
        e => e.eventType?.toUpperCase() === PATHOLOGY_SLIDES_EVENT_TYPE
    );
}

/**
 * The events with LINKOUT dropped from PATHOLOGY SLIDES events, for a portal
 * that serves no slides: the link points at a Pathology Slides tab it does
 * not have.
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
 * A PATHOLOGY SLIDES event; only the fields the track reads, satisfied by
 * both a clinical event and a timeline item's event.
 */
export interface PathologySlideEvent {
    attributes: Array<{ key: string; value: string }>;
    startNumberOfDaysSinceDiagnosis?: number;
}

function attribute(event: PathologySlideEvent, key: string): string {
    const found = (event.attributes || []).find(
        attr => attr.key.toUpperCase() === key
    );
    return (found?.value || '').trim();
}

function countAttribute(event: PathologySlideEvent, key: string): number {
    const count = parseInt(attribute(event, key), 10);
    return Number.isFinite(count) && count > 0 ? count : 0;
}

const UNMATCHED_LABEL = 'Unmatched';

/** BLOCK, PART or UNMATCHED. */
function matchLevel(event: PathologySlideEvent): string {
    const level = attribute(event, 'MATCH_LEVEL').toUpperCase();
    return level === 'BLOCK' || level === 'PART' ? level : 'UNMATCHED';
}

/** Sequenced sample of a BLOCK- or PART-matched event; unset when unmatched. */
export function pathologySlideSampleId(
    event: PathologySlideEvent
): string | undefined {
    const sampleId = attribute(event, 'SAMPLE_ID');
    return matchLevel(event) !== 'UNMATCHED' &&
        sampleId &&
        sampleId.toUpperCase() !== 'UNMATCHED'
        ? sampleId
        : undefined;
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

const MATCH_LABELS: Record<string, { text: string; tooltip: string }> = {
    BLOCK: {
        text: 'Block',
        tooltip:
            'The slide was cut from the same tissue block that was sequenced for this sample',
    },
    PART: {
        text: 'Part',
        tooltip:
            'The slide comes from the same part as the sequenced sample; the sequenced block is not confirmed',
    },
};

const UNMATCHED_TOOLTIP = 'Not linked to a sequenced sample';
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
    /** Hover explanation for the value. */
    tooltip?: string;
}

export interface PathologySlideTooltipContent {
    title: string;
    lines: PathologySlideTooltipLine[];
    /** In-app path to the Pathology Slides tab; unset when nothing is viewable. */
    openPath?: string;
    openLabel: string;
}

/**
 * Timeline tooltip content for one PATHOLOGY SLIDES event, e.g.
 * "Pathology slides · H&E · Part-matched" followed by Sample, Procedure,
 * Part and Slides lines.
 */
export function buildPathologySlideTooltipContent(
    event: PathologySlideEvent,
    sampleTimelines: WsiSampleTimelineMap
): PathologySlideTooltipContent {
    const match = MATCH_LABELS[matchLevel(event)];
    const sampleId = pathologySlideSampleId(event);
    const stain = attribute(event, 'SUBTYPE');
    const title = [
        'Pathology slides',
        stain,
        match ? `${match.text}-matched` : UNMATCHED_LABEL,
    ]
        .filter(Boolean)
        .join(' · ');

    const lines: PathologySlideTooltipLine[] = [
        {
            label: 'Sample',
            value: sampleId || UNMATCHED_SAMPLE_TEXT,
            tooltip: match ? match.tooltip : UNMATCHED_TOOLTIP,
        },
    ];
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
            tooltip: [attribute(event, 'TIMEPOINT_SOURCE'), DAY_ZERO_TOOLTIP]
                .filter(Boolean)
                .join('. '),
        });
    }
    const specimen = attribute(event, 'SPECIMEN');
    if (specimen) {
        lines.push({ label: 'Part', value: specimen });
    }
    const viewable = countAttribute(event, 'IMAGE_COUNT');
    const total = Math.max(
        countAttribute(event, 'TOTAL_IMAGE_COUNT'),
        viewable
    );
    const nonViewable = total - viewable;
    lines.push({
        label: 'Slides',
        value: `${viewable} of ${total} viewable`,
        tooltip:
            nonViewable > 0
                ? `${nonViewable} ${
                      nonViewable === 1 ? 'slide is' : 'slides are'
                  } not viewable: no scanned image is available.`
                : undefined,
    });

    return {
        title,
        lines,
        openPath: viewable > 0 ? pathologySlideOpenPath(event) : undefined,
        openLabel: `Open ${stain || 'pathology'} slides for ${sampleId ||
            UNMATCHED_LABEL}`,
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
    const sampleId = pathologySlideSampleId(event);
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

export const PathologySlideTooltip: React.FunctionComponent<{
    event: PathologySlideEvent;
    sampleTimelines: WsiSampleTimelineMap;
}> = function({ event, sampleTimelines }) {
    const content = buildPathologySlideTooltipContent(event, sampleTimelines);
    return (
        <div data-test="pathology-slide-tooltip">
            <strong>{content.title}</strong>
            <table style={{ marginTop: 5 }}>
                <tbody>
                    {content.lines.map(line => (
                        <tr key={line.label}>
                            <th style={{ paddingRight: 10 }}>{line.label}</th>
                            <td
                                title={line.tooltip}
                                style={
                                    line.tooltip
                                        ? { cursor: 'help' }
                                        : undefined
                                }
                            >
                                {line.value}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
            {content.openPath && (
                <div style={{ marginTop: 5 }}>
                    <Link
                        to={content.openPath}
                        className="btn btn-default btn-xs"
                        aria-label={content.openLabel}
                        title={content.openLabel}
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
                                markerSample(e)?.label || ''
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
