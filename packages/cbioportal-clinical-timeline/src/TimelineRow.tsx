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
}

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
            <svg width="14" height="14">
                <circle cx="7" cy="7" r="4" fill="rgb(31, 119, 180)"></circle>
            </svg>
        );
    }
}

export const TimelineRow: React.FunctionComponent<
    ITimelineRowProps
> = function({ trackData, limit, getPosition, handleMouseHover }) {
    let eventsGroupedByPosition;

    if (!trackData.tracks && trackData.items) {
        eventsGroupedByPosition = groupEventsByPosition(trackData.items);
    }

    // we want to sort tracks by start date of first item
    let sortedRows: TimelineTrack[] | undefined;
    if (trackData.tracks) {
        sortedRows = _.sortBy(trackData.tracks, t =>
            t.items && t.items.length ? t.items[0].start : 0
        );
    }

    return (
        <>
            {trackData.tracks && trackData.tracks.length && (
                <>
                    <div
                        className={'tl-row'}
                        onMouseEnter={handleMouseHover}
                        onMouseLeave={handleMouseHover}
                    ></div>
                    {sortedRows!.map(track => (
                        <TimelineRow
                            handleMouseHover={handleMouseHover}
                            trackData={track}
                            limit={limit}
                            getPosition={getPosition}
                        />
                    ))}
                </>
            )}
            {!trackData.tracks && eventsGroupedByPosition && (
                <div
                    className={'tl-row'}
                    onMouseEnter={handleMouseHover}
                    onMouseLeave={handleMouseHover}
                >
                    {_.map(eventsGroupedByPosition, itemGroup => {
                        const item = itemGroup[0];
                        const style = getPosition(item, limit);

                        let content: JSX.Element | null | string = null;

                        const isPoint = item.start === item.end;

                        if (isPoint) {
                            content = renderPoint(item, trackData);

                            if (false && itemGroup.length > 1) {
                                content = (
                                    <div className={'tl-timeline-multipoint'}>
                                        <svg
                                            width="14"
                                            height="14"
                                            opacity={0.2}
                                        >
                                            <circle
                                                cx="7"
                                                cy="7"
                                                r="4"
                                                fill="gray"
                                            ></circle>
                                        </svg>
                                        {content}
                                        <svg
                                            width="14"
                                            height="14"
                                            opacity={0.2}
                                        >
                                            <circle
                                                cx="7"
                                                cy="7"
                                                r="4"
                                                fill="gray"
                                            ></circle>
                                        </svg>
                                    </div>
                                );
                            }
                        }

                        return (
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
                                <div
                                    style={style}
                                    className={classNames({
                                        'tl-item': true,
                                        'tl-item-point': isPoint,
                                        'tl-item-range': !isPoint,
                                    })}
                                >
                                    {content}
                                </div>
                            </Tooltip>
                        );
                    })}
                </div>
            )}
        </>
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
