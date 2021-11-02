import {
    EventPosition,
    POINT_COLOR,
    POINT_RADIUS,
    TimelineEvent,
    TimelineTrackSpecification,
    TimelineTrackType,
} from './types';
import React, { useCallback, useState } from 'react';
import _ from 'lodash';
import {
    formatDate,
    REMOVE_FOR_DOWNLOAD_CLASSNAME,
    TIMELINE_LINE_CHART_TRACK_HEIGHT,
    TIMELINE_TRACK_HEIGHT,
    getTrackHeight,
    getAttributeValue,
    getTrackEventColorGetter,
} from './lib/helpers';
import { TimelineStore } from './TimelineStore';
import { renderStack } from './svg/renderStack';
import { observer } from 'mobx-react';
import {
    getLineChartYCoordinateForEvents,
    getTicksForLineChartAxis,
    getTrackValueRange,
} from './lib/lineChartAxisUtils';
import { getColor } from 'cbioportal-frontend-commons';
import { getTrackLabel } from './TrackHeader';
import { renderShape } from './renderHelpers';

export interface ITimelineTrackProps {
    trackData: TimelineTrackSpecification;
    limit: number;
    getPosition: (
        item: TimelineEvent,
        limit: number
    ) => EventPosition | undefined;
    handleTrackHover: (e: React.MouseEvent<any>) => void;
    store: TimelineStore;
    y: number;
    height: number;
    width: number;
}

/*
 get events with identical positions so we can stack them
 */
export function groupEventsByPosition(events: TimelineEvent[]) {
    return _.groupBy(events, e => {
        return `${e.start}-${e.end}`;
    });
}

export function renderSuperscript(number: number) {
    return (
        <g transform={'translate(3 -8)'}>
            <text
                x={1}
                y={0}
                dy={'1em'}
                className="noselect"
                style={{
                    fontFamily: 'Arial',
                    fill: '#666',
                    pointerEvents: 'none',
                }}
            >
                <tspan style={{ fontSize: 7 }}>{number}</tspan>
            </text>
        </g>
    );
}

function renderTickGridLines(track: TimelineTrackSpecification, width: number) {
    const ticks = getTicksForLineChartAxis(track);
    return ticks.map(tick => (
        <line
            className={'tl-axis-grid-line tl-track-highlight'}
            x1={0}
            x2={width}
            y1={tick.offset}
            y2={tick.offset}
        />
    ));
}

function renderLineChartConnectingLines(points: { x: number; y: number }[]) {
    if (points.length < 2) {
        return null;
    }

    return (
        <g>
            {points.map((point, index) => {
                if (index === 0) {
                    return null;
                } else {
                    const prev = points[index - 1];
                    return (
                        <line
                            style={{
                                stroke: '#555',
                                strokeWidth: 2,
                            }}
                            x1={prev.x}
                            y1={prev.y}
                            x2={point.x}
                            y2={point.y}
                        />
                    );
                }
            })}
        </g>
    );
}

function getPointY(
    events: TimelineEvent[],
    trackData: TimelineTrackSpecification,
    trackHeight: number,
    trackValueRange?: { min: number; max: number }
) {
    let y: number | null;

    if (!trackValueRange) {
        y = trackHeight / 2;
    } else {
        y = getLineChartYCoordinateForEvents(
            events,
            trackData,
            trackHeight,
            trackValueRange!
        );
    }

    return y;
}

export function randomColorGetter(e: TimelineEvent) {
    return getColor(getTrackLabel(e.containingTrack));
}

function getSpecifiedColorIfExists(e: TimelineEvent) {
    return getAttributeValue('STYLE_COLOR', e);
}

const defaultColorGetter = function(e: TimelineEvent) {
    return getSpecifiedColorIfExists(e) || POINT_COLOR;
};

export function renderPoint(
    events: TimelineEvent[],
    y: number,
    eventColorGetter: (e: TimelineEvent) => string = defaultColorGetter
) {
    // When nested tracks are collapsed, we might see multiple events that are
    //  from different tracks. So let's check if all these events actually come
    //  from the same track
    const allFromSameTrack =
        _.uniq(events.map(e => e.containingTrack.uid)).length === 1;

    let contents: any | null = null;
    if (allFromSameTrack && events[0].containingTrack.renderEvents) {
        // If they are all from the same track and there is a track-specific renderer,
        // try that.
        contents = events[0].containingTrack.renderEvents(events, y);
    }
    // Otherwise, or if that returns null, use default renderers. For multiple events, we'll show the individual
    // renders in the tooltip.

    if (contents === null) {
        if (events.length > 1) {
            contents = (
                <>
                    {renderSuperscript(events.length)}
                    {renderStack(events.map(eventColorGetter))}
                </>
            );
        } else {
            contents = renderShape(events[0], y, eventColorGetter);
        }
    }

    return <g>{contents}</g>;
}

function renderRange(
    pixelWidth: number,
    events: TimelineEvent[],
    eventColorGetter: (e: TimelineEvent) => string = defaultColorGetter
) {
    const height = 5;
    return (
        <rect
            width={Math.max(pixelWidth, 2 * POINT_RADIUS)}
            height={height}
            y={(TIMELINE_TRACK_HEIGHT - height) / 2}
            rx="2"
            ry="2"
            fill={eventColorGetter(events[0])}
        />
    );
}

export const TimelineTrack: React.FunctionComponent<ITimelineTrackProps> = observer(
    function({
        trackData,
        limit,
        getPosition,
        handleTrackHover,
        store,
        y,
        height,
        width,
    }: ITimelineTrackProps) {
        let eventsGroupedByPosition;

        if (trackData.items) {
            eventsGroupedByPosition = groupEventsByPosition(trackData.items);
            if (trackData.sortSimultaneousEvents) {
                eventsGroupedByPosition = _.mapValues(
                    eventsGroupedByPosition,
                    trackData.sortSimultaneousEvents
                );
            }
        }

        let trackValueRange: { min: number; max: number };
        const linePoints: { x: number; y: number }[] = [];
        if (trackData.trackType === TimelineTrackType.LINE_CHART) {
            trackValueRange = getTrackValueRange(trackData);
        }

        const points =
            eventsGroupedByPosition &&
            _.map(eventsGroupedByPosition, itemGroup => {
                const firstItem = itemGroup[0];
                const position = getPosition(firstItem, limit);

                let content: JSX.Element | null | string = null;

                const isPoint = firstItem.start === firstItem.end;

                if (isPoint) {
                    const y = getPointY(
                        itemGroup,
                        trackData,
                        height,
                        trackValueRange
                    );
                    if (y !== null) {
                        content = renderPoint(
                            itemGroup,
                            y,
                            getTrackEventColorGetter(trackData)
                        );
                        linePoints.push({
                            x: position ? position.pixelLeft : 0,
                            y,
                        });
                    }
                } else if (position && position.pixelWidth) {
                    content = renderRange(
                        position.pixelWidth,
                        itemGroup,
                        getTrackEventColorGetter(trackData)
                    );
                }

                return (
                    <TimelineItemWithTooltip
                        x={position && position.pixelLeft}
                        store={store}
                        track={trackData}
                        events={itemGroup}
                        content={content}
                    />
                );
            });

        return (
            <g
                className={'tl-track'}
                transform={`translate(0 ${y})`}
                onMouseEnter={handleTrackHover}
                onMouseLeave={handleTrackHover}
            >
                <rect
                    className={`tl-track-highlight ${REMOVE_FOR_DOWNLOAD_CLASSNAME}`}
                    x={0}
                    y={0}
                    height={height}
                    width={width}
                />
                {trackData.trackType === TimelineTrackType.LINE_CHART &&
                    renderTickGridLines(trackData, width)}
                {trackData.trackType === TimelineTrackType.LINE_CHART &&
                    renderLineChartConnectingLines(linePoints)}
                {points}
                <line
                    x1={0}
                    x2={width}
                    y1={height - 0.5}
                    y2={height - 0.5}
                    stroke={'#eee'}
                    strokeWidth={1}
                    strokeDasharray={'3,2'}
                />
            </g>
        );
    }
);

const TimelineItemWithTooltip: React.FunctionComponent<{
    x: number | undefined;
    store: TimelineStore;
    track: TimelineTrackSpecification;
    events: TimelineEvent[];
    content: any;
}> = function({ x, store, track, events, content }) {
    const [tooltipUid, setTooltipUid] = useState<string | null>(null);

    const transforms = [];
    if (x) {
        transforms.push(`translate(${x} 0)`);
    }

    function syncTooltipUid() {
        if (tooltipUid && !store.doesTooltipExist(tooltipUid)) {
            setTooltipUid(null);
            return null;
        }
        return tooltipUid;
    }

    return (
        <g
            style={{ cursor: 'pointer' }}
            transform={transforms.join(' ')}
            onMouseMove={e => {
                let uid = syncTooltipUid();

                if (!uid) {
                    uid = store.addTooltip({
                        track,
                        events,
                    });

                    setTooltipUid(uid);
                }
                store.setHoveredTooltipUid(uid);
                store.setMousePosition({
                    x: e.pageX,
                    y: e.pageY,
                });
            }}
            onMouseLeave={e => {
                const uid = syncTooltipUid();

                if (uid && !store.isTooltipPinned(uid)) {
                    store.removeTooltip(uid);
                    setTooltipUid(null);
                }
            }}
            onClick={() => {
                const uid = syncTooltipUid();

                if (uid) {
                    store.togglePinTooltip(uid);
                }
            }}
        >
            {content}
        </g>
    );
};

export const EventTooltipContent: React.FunctionComponent<{
    event: TimelineEvent;
}> = function({ event }) {
    return (
        <div>
            <table>
                <tbody>
                    {_.map(
                        event.event.attributes.sort((a: any, b: any) =>
                            a.key > b.key ? 1 : -1
                        ),
                        (att: any) => {
                            return (
                                <tr>
                                    <th>{att.key.replace(/_/g, ' ')}</th>
                                    <td>{att.value}</td>
                                </tr>
                            );
                        }
                    )}
                    <tr>
                        <th>{`${
                            event.event.endNumberOfDaysSinceDiagnosis
                                ? 'START DATE'
                                : 'DATE'
                        }`}</th>
                        <td className={'nowrap'}>
                            {formatDate(
                                event.event.startNumberOfDaysSinceDiagnosis
                            )}
                        </td>
                    </tr>
                    {event.event.endNumberOfDaysSinceDiagnosis && (
                        <tr>
                            <th>END DATE</th>
                            <td className={'nowrap'}>
                                {formatDate(
                                    event.event.endNumberOfDaysSinceDiagnosis
                                )}
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
};
