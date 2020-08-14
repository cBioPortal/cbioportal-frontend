import {
    EventPosition,
    TimelineEvent,
    TimelineTrackSpecification,
    TimelineTrackType,
} from './types';
import React from 'react';
import _ from 'lodash';
import { formatDate, REMOVE_FOR_DOWNLOAD_CLASSNAME } from './lib/helpers';
import { TimelineStore } from './TimelineStore';
import { renderStack } from './svg/renderStack';

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

export const TIMELINE_TRACK_HEIGHT = 20;
export const TIMELINE_LINE_CHART_TRACK_HEIGHT = 100; // TODO: dynamic?
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

export function getTrackHeight(track: TimelineTrackSpecification) {
    switch (track.trackType) {
        case TimelineTrackType.LINE_CHART:
            return TIMELINE_LINE_CHART_TRACK_HEIGHT;
        case TimelineTrackType.DEFAULT:
        case undefined:
        default:
            return TIMELINE_TRACK_HEIGHT;
    }
}

function renderSuperscript(number: number) {
    return (
        <g style={{ transform: 'translate(1px, -8px)' }}>
            <text
                x={1}
                y={0}
                dy={'1em'}
                className="noselect"
                style={{ fill: '#666', pointerEvents: 'none' }}
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

export function renderPoint(
    events: TimelineEvent[],
    trackData: TimelineTrackSpecification,
    y: number
) {
    // If there's specific render functions and multiple data,
    //  we'll show that render in the tooltip.
    if (events.length === 1 && events[0].render) {
        return events[0].render(events[0]);
    } else if (events.length === 1 && trackData.renderEvent) {
        return trackData.renderEvent(events[0]);
    } else {
        return (
            <g>
                {events.length > 1 && renderSuperscript(events.length)}
                {events.length > 1 ? (
                    renderStack(10, TIMELINE_TRACK_HEIGHT / 2, '#222222')
                ) : (
                    <circle cx="0" cy={y} r="4" fill="rgb(31, 119, 180)" />
                )}
            </g>
        );
    }
}

function renderRange(pixelWidth: number) {
    const height = 5;
    return (
        <rect
            width={pixelWidth}
            height={height}
            y={(TIMELINE_TRACK_HEIGHT - height) / 2}
            rx="2"
            ry="2"
            fill="rgb(31, 119, 180)"
        />
    );
}

export const TimelineTrack: React.FunctionComponent<
    ITimelineTrackProps
> = function({
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
            let style: any = {
                transform: position
                    ? `translate(${position.pixelLeft}px, 0)`
                    : undefined,
            };

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
                <g
                    style={style}
                    onMouseMove={e => {
                        store.setTooltipModel({
                            track: trackData,
                            events: itemGroup,
                        });
                        store.setMousePosition({
                            x: e.pageX,
                            y: e.pageY,
                        });
                    }}
                    onClick={() => {
                        store.nextTooltipEvent();
                    }}
                >
                    {content}
                </g>
            );
        });

    return (
        <g
            className={'tl-track'}
            style={{
                transform: `translate(0, ${y}px)`,
            }}
            onMouseEnter={handleTrackHover}
            onMouseLeave={handleTrackHover}
        >
            <rect
                className={`tl-track-highlight ${REMOVE_FOR_DOWNLOAD_CLASSNAME}`}
                x={0}
                y={0}
                height={height}
                width={width}
                onMouseMove={() => {
                    // hide tooltip when mouse over the background rect
                    store.setTooltipModel(null);
                }}
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
};

export const EventTooltipContent: React.FunctionComponent<{
    event: TimelineEvent;
}> = function({ event }) {
    return (
        <div>
            <table>
                {_.map(event.event.attributes, (att: any) => {
                    return (
                        <tr>
                            <th>{att.key.replace('_', ' ')}</th>
                            <td>{att.value}</td>
                        </tr>
                    );
                })}
                <tr>
                    <th>START DATE:</th>
                    <td className={'nowrap'}>
                        {formatDate(
                            event.event.startNumberOfDaysSinceDiagnosis
                        )}
                    </td>
                </tr>
                {event.event.endNumberOfDaysSinceDiagnosis && (
                    <tr>
                        <th>END DATE:</th>
                        <td className={'nowrap'}>
                            {formatDate(
                                event.event.endNumberOfDaysSinceDiagnosis
                            )}
                        </td>
                    </tr>
                )}
            </table>
        </div>
    );
};
