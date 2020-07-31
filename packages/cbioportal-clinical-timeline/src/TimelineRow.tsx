import { EventPosition, TimelineEvent, TimelineTrack } from './types';
import React from 'react';
import Tooltip from 'rc-tooltip';
import classNames from 'classnames';
import _ from 'lodash';

export interface ITimelineRowProps {
    trackData: TimelineTrack;
    limit: number;
    getPosition: (
        item: TimelineEvent,
        limit: number
    ) => EventPosition | undefined;
    handleMouseHover: (e: React.MouseEvent<HTMLDivElement>) => void;
    y: number;
    width: number;
}

export const TIMELINE_ROW_HEIGHT = 20;
/*
 get events with identical positions so we can stack them
 */
export function groupEventsByPosition(events: TimelineEvent[]) {
    return _.groupBy(events, e => {
        return `${e.start}-${e.end}`;
    });
}

function renderPoint(event: TimelineEvent, trackData: TimelineTrack) {
    if (event.render) {
        return event.render(event);
    } else if (trackData.render) {
        return trackData.render(event);
    } else {
        return (
            <circle
                cx="0"
                cy={TIMELINE_ROW_HEIGHT / 2}
                r="4"
                fill="rgb(31, 119, 180)"
            />
        );
    }
}

function renderRange(pixelWidth: number) {
    const height = 5;
    return (
        <rect
            className={'tl-item-range'}
            width={pixelWidth}
            height={height}
            y={(TIMELINE_ROW_HEIGHT - height) / 2}
            rx="2"
            ry="2"
        />
    );
}

export const TimelineRow: React.FunctionComponent<
    ITimelineRowProps
> = function({
    trackData,
    limit,
    getPosition,
    handleMouseHover,
    y,
    width,
}: ITimelineRowProps) {
    let eventsGroupedByPosition;

    if (trackData.items) {
        eventsGroupedByPosition = groupEventsByPosition(trackData.items);
    }

    return (
        <g
            className={'tl-row'}
            style={{
                transform: `translate(0, ${y}px)`,
            }}
            //onMouseEnter={handleMouseHover}
            //onMouseLeave={handleMouseHover}
        >
            {eventsGroupedByPosition &&
                _.map(eventsGroupedByPosition, itemGroup => {
                    const item = itemGroup[0];
                    const position = getPosition(item, limit);
                    const style = position && {
                        transform: `translate(${position.pixelLeft}px, 0)`,
                    };

                    let content: JSX.Element | null | string = null;

                    const isPoint = item.start === item.end;

                    if (isPoint) {
                        content = renderPoint(item, trackData);

                        if (itemGroup.length > 1) {
                            // TODO: handle multiple simultaneous data points
                        }
                    } else if (position && position.pixelWidth) {
                        content = renderRange(position.pixelWidth);
                    }

                    return (
                        <g
                            style={style}
                            className={classNames({
                                'tl-item': true,
                                'tl-item-point': isPoint,
                            })}
                        >
                            {content}
                        </g>
                    ); // TODO: tooltip
                    /*return (
                    <Tooltip
                        mouseEnterDelay={0.2}
                        mouseLeaveDelay={0}
                        destroyTooltipOnHide={
                            { keepParent: false } as any
                        } // typings are wrong
                        overlayClassName={'tl-timeline-tooltip'}
                        overlay={() => {
                            return trackData.renderTooltip ? (
                                trackData.renderTooltip(item)
                            ) : (
                                <EventTooltipContent event={item} />
                            );
                        }}
                    >
                        <g
                            style={style}
                            className={classNames({
                                'tl-item': true,
                                'tl-item-point': isPoint,
                                'tl-item-range': !isPoint,
                            })}
                        >
                            {content}
                        </g>
                    </Tooltip>*/
                })}
            <line
                x1={0}
                x2={width}
                y1={TIMELINE_ROW_HEIGHT - 0.5}
                y2={TIMELINE_ROW_HEIGHT - 0.5}
                stroke={'#eee'}
                strokeWidth={1}
                strokeDasharray={'3,2'}
            />
        </g>
    );
};

const EventTooltipContent: React.FunctionComponent<{
    event: TimelineEvent;
}> = function({ event }) {
    return (
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
    );
};
