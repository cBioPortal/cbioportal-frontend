import {
    EventPosition,
    TimelineEvent,
    TimelineTrackSpecification,
} from './types';
import React, { useState } from 'react';
import _ from 'lodash';
import { REMOVE_FOR_DOWNLOAD_CLASSNAME } from './lib/helpers';
import { getTextHeight, getTextWidth } from 'cbioportal-frontend-commons';
import { TimelineStore } from './TimelineStore';

export interface ITimelineTrackProps {
    trackData: TimelineTrackSpecification;
    limit: number;
    getPosition: (
        item: TimelineEvent,
        limit: number
    ) => EventPosition | undefined;
    handleTrackHover: (e: React.MouseEvent<SVGGElement>) => void;
    store: TimelineStore;
    y: number;
    width: number;
}

export const TIMELINE_TRACK_HEIGHT = 20;
/*
 get events with identical positions so we can stack them
 */
export function groupEventsByPosition(events: TimelineEvent[]) {
    return _.groupBy(events, e => {
        return `${e.start}-${e.end}`;
    });
}

function renderSuperscript(number: number) {
    return (
        <g style={{ transform: 'translate(1px, 1px)' }}>
            <rect
                x={0}
                y={0}
                rx={2}
                ry={2}
                height={getTextHeight(number + '', 'Arial', '8px') + 2}
                width={
                    getTextWidth('x', 'Arial', '6px') +
                    getTextWidth(number + '', 'Arial', '8px') +
                    2
                }
                fill={'white'}
                stroke={'#eee'}
            />
            <text
                x={1}
                y={0}
                dy={'1em'}
                className="noselect"
                style={{ fill: 'black', pointerEvents: 'none' }}
            >
                <tspan dy="1.3em" style={{ fontSize: 6 }}>
                    x
                </tspan>
                <tspan style={{ fontSize: 8 }}>{number}</tspan>
            </text>
        </g>
    );
}

export function renderPoint(
    events: TimelineEvent[],
    trackData: TimelineTrackSpecification
) {
    if (events.length === 1 && events[0].render) {
        return events[0].render(events[0]);
    } else if (events.length === 1 && trackData.render) {
        return trackData.render(events[0]);
    } else {
        // If there's specific render functions and multiple data,
        //  we'll show that render in the tooltip.
        return (
            <g>
                {events.length > 1 && renderSuperscript(events.length)}
                <circle
                    cx="0"
                    cy={TIMELINE_TRACK_HEIGHT / 2}
                    r="4"
                    fill="rgb(31, 119, 180)"
                />
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
    width,
}: ITimelineTrackProps) {
    let eventsGroupedByPosition;

    if (trackData.items) {
        eventsGroupedByPosition = groupEventsByPosition(trackData.items);
    }

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
                height={TIMELINE_TRACK_HEIGHT}
                width={width}
                onMouseMove={() => {
                    // hide tooltip when mouse over the background rect
                    store.setTooltipModel(null);
                }}
            />
            {eventsGroupedByPosition &&
                _.map(eventsGroupedByPosition, itemGroup => {
                    const item = itemGroup[0];
                    const position = getPosition(item, limit);
                    let style: any = {
                        transform: position
                            ? `translate(${position.pixelLeft}px, 0)`
                            : undefined,
                    };

                    let content: JSX.Element | null | string = null;

                    const isPoint = item.start === item.end;

                    if (isPoint) {
                        content = renderPoint(itemGroup, trackData);
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
                })}
            <line
                x1={0}
                x2={width}
                y1={TIMELINE_TRACK_HEIGHT - 0.5}
                y2={TIMELINE_TRACK_HEIGHT - 0.5}
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
                    <td>{event.event.startNumberOfDaysSinceDiagnosis}</td>
                </tr>
                {event.event.endNumberOfDaysSinceDiagnosis && (
                    <tr>
                        <th>END DATE:</th>
                        <td>{event.event.endNumberOfDaysSinceDiagnosis}</td>
                    </tr>
                )}
            </table>
        </div>
    );
};
