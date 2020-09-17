import {
    EventPosition,
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
} from './lib/helpers';
import { TimelineStore } from './TimelineStore';
import { renderStack } from './svg/renderStack';
import { observer } from 'mobx-react';
import classNames from 'classnames';

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
    collapsed: boolean;
}

/*
 get events with identical positions so we can stack them
 */
export function groupEventsByPosition(events: TimelineEvent[]) {
    return _.groupBy(events, e => {
        return `${e.start}-${e.end}`;
    });
}

function getTrackValueRange(track: TimelineTrackSpecification) {
    // We are assuming this is a line chart track

    let min = Number.POSITIVE_INFINITY;
    let max = Number.NEGATIVE_INFINITY;
    let value: number | null;
    for (const event of track.items) {
        value = track.getLineChartValue!(event);
        if (value === null) {
            continue;
        }
        min = Math.min(value, min);
        max = Math.max(value, max);
    }
    if (max === min) {
        // prevent divide-by-zero and scaling issues
        max = min + 1;
    }

    return { min, max };
}

function getLineChartYCoordinate(
    events: TimelineEvent[],
    track: TimelineTrackSpecification,
    trackHeight: number,
    trackValueRange: { min: number; max: number }
) {
    let values = events.map(track.getLineChartValue!).filter(x => x !== null);
    if (values.length === 0) {
        return null;
    }

    const padding = Math.min(TIMELINE_LINE_CHART_TRACK_HEIGHT / 7, 15); // pad proportionally but no more padding than 15
    const plottingHeight = trackHeight - 2 * padding;
    const plottingProportion =
        (_.mean(values) - trackValueRange.min) /
        (trackValueRange.max - trackValueRange.min);

    return padding + (1 - plottingProportion) * plottingHeight; // 1-p because SVG y axis points down
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

function renderLineChartLines(points: { x: number; y: number }[]) {
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
        y = getLineChartYCoordinate(
            events,
            trackData,
            trackHeight,
            trackValueRange!
        );
    }

    return y;
}

const POINT_RADIUS = 4;
const POINT_COLOR = 'rgb(31, 119, 180)';

export function renderPoint(
    events: TimelineEvent[],
    trackData: TimelineTrackSpecification,
    y: number
) {
    // If there's specific render functions and multiple data,
    //  we'll show that render in the tooltip.
    if (events.length === 1 && events[0].render) {
        return events[0].render(events[0]);
    } else if (trackData.renderEvents) {
        return trackData.renderEvents(events);
    } else {
        return (
            <g>
                {events.length > 1 ? (
                    <>
                        {renderSuperscript(events.length)}
                        {renderStack(events.map(e => POINT_COLOR))}
                    </>
                ) : (
                    <circle cx="0" cy={y} r={POINT_RADIUS} fill={POINT_COLOR} />
                )}
            </g>
        );
    }
}

function renderRange(pixelWidth: number) {
    const height = 5;
    return (
        <rect
            width={Math.max(pixelWidth, 2 * POINT_RADIUS)}
            height={height}
            y={(TIMELINE_TRACK_HEIGHT - height) / 2}
            rx="2"
            ry="2"
            fill="rgb(31, 119, 180)"
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
        collapsed,
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
                        content = renderPoint(itemGroup, trackData, y);
                        linePoints.push({
                            x: position ? position.pixelLeft : 0,
                            y,
                        });
                    }
                } else if (position && position.pixelWidth) {
                    content = renderRange(position.pixelWidth);
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
                className={classNames('tl-track', {
                    'tl-collapsed': collapsed,
                })}
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
                    renderLineChartLines(linePoints)}
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
                    {_.map(event.event.attributes, (att: any) => {
                        return (
                            <tr>
                                <th>{att.key.replace(/_/g, ' ')}</th>
                                <td>{att.value}</td>
                            </tr>
                        );
                    })}
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
