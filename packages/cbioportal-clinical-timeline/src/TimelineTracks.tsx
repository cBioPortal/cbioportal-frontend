import {
    TickIntervalEnum,
    TimelineEvent,
    TimelineTick,
    TimelineTrack,
} from './types';
import { TIMELINE_ROW_HEIGHT, TimelineRow } from './TimelineRow';
import React, { useCallback, useState } from 'react';
import { TimelineStore } from './TimelineStore';
import _ from 'lodash';
import { observer } from 'mobx-react';
import $ from 'jquery';
import { Portal } from 'react-overlays/lib';
import { Popover } from 'react-bootstrap';
import { sortNestedTracks } from './lib/helpers';
import CustomRow, { CustomRowSpecification } from './CustomRow';
import { TICK_ROW_HEIGHT } from './TickRow';

export interface ITimelineTracks {
    store: TimelineStore;
    width: number;
    customTracks?: CustomRowSpecification[];
}

function expandTrack(track: TimelineTrack): TimelineTrack[] {
    const ret = [track];
    if (track.tracks) {
        // we want to sort nested tracks by start date of first item
        const sortedNestedTracks = sortNestedTracks(track.tracks);
        ret.push(..._.flatMap(sortedNestedTracks, expandTrack));
    }
    return ret;
}

export const TimelineTracks: React.FunctionComponent<
    ITimelineTracks
> = observer(function({ store, width, customTracks }) {
    const hoverCallback = (e: React.MouseEvent<SVGGElement>) => {
        switch (e.type) {
            case 'mouseenter':
                const rowIndex = _.findIndex(
                    e.currentTarget.parentNode!.children,
                    el => el === e.currentTarget
                );
                if (rowIndex !== undefined) {
                    $('.tl-row-hover').text(`
                 .tl-timeline-tracklabels > div:nth-child(${rowIndex + 1}) {
                                background:#F2F2F2;
                            }
                        }
                    `);
                }
                break;
            default:
                $('.tl-row-hover').empty();
                break;
        }
    };

    const tracks = _.flatMap(store.data, expandTrack);

    let nextY = 0;

    return (
        <>
            <style className={'tl-row-hover'} />
            <g style={{ transform: `translate(0, ${TICK_ROW_HEIGHT}px)` }}>
                {tracks.map(row => {
                    const y = nextY;
                    nextY += TIMELINE_ROW_HEIGHT;
                    return (
                        <TimelineRow
                            limit={store.trimmedLimit}
                            trackData={row}
                            getPosition={store.getPosition}
                            handleRowHover={hoverCallback}
                            setTooltipContent={store.setTooltipContent}
                            setMousePosition={store.setMousePosition}
                            y={y}
                            width={width}
                        />
                    );
                })}
                {customTracks &&
                    customTracks.map(track => {
                        const y = nextY;
                        nextY += track.height(store);
                        return (
                            <CustomRow
                                store={store}
                                specification={track}
                                handleRowHover={hoverCallback}
                                width={width}
                                y={y}
                            />
                        );
                    })}
            </g>
            {store.tooltipContent && (
                <Portal container={document.body}>
                    <Popover
                        arrowOffsetTop={17}
                        className={'tl-timeline-tooltip'}
                        positionLeft={store.mousePosition.x + 10}
                        positionTop={store.mousePosition.y - 17}
                    >
                        {store.tooltipContent}
                    </Popover>
                </Portal>
            )}
        </>
    );
});

export default TimelineTracks;
