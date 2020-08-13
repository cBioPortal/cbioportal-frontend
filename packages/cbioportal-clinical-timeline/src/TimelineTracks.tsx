import {
    TickIntervalEnum,
    TimelineEvent,
    TimelineTick,
    TimelineTrackSpecification,
} from './types';
import { TIMELINE_TRACK_HEIGHT, TimelineTrack } from './TimelineTrack';
import React, { useCallback, useState } from 'react';
import { TimelineStore } from './TimelineStore';
import _ from 'lodash';
import { observer } from 'mobx-react';
import $ from 'jquery';
import { Portal } from 'react-overlays/lib';
import { Popover } from 'react-bootstrap';
import { sortNestedTracks } from './lib/helpers';
import CustomTrack, { CustomTrackSpecification } from './CustomTrack';
import { TICK_AXIS_HEIGHT } from './TickAxis';
import { expandTracks } from './TrackHeader';

export interface ITimelineTracks {
    store: TimelineStore;
    width: number;
    handleTrackHover: (e: React.MouseEvent<SVGGElement>) => void;
    customTracks?: CustomTrackSpecification[];
}

export const TimelineTracks: React.FunctionComponent<
    ITimelineTracks
> = observer(function({ store, width, handleTrackHover, customTracks }) {
    const tracks = expandTracks(store.data);

    let nextY = 0;

    return (
        <>
            <g style={{ transform: `translate(0, ${TICK_AXIS_HEIGHT}px)` }}>
                {tracks.map(track => {
                    const y = nextY;
                    nextY += track.height;
                    return (
                        <TimelineTrack
                            limit={store.trimmedLimit}
                            trackData={track.track}
                            getPosition={store.getPosition}
                            handleTrackHover={handleTrackHover}
                            store={store}
                            y={y}
                            height={track.height}
                            width={width}
                        />
                    );
                })}
                {customTracks &&
                    customTracks.map(track => {
                        const y = nextY;
                        nextY += track.height(store);
                        return (
                            <CustomTrack
                                store={store}
                                specification={track}
                                handleTrackHover={handleTrackHover}
                                width={width}
                                y={y}
                            />
                        );
                    })}
            </g>
            {store.tooltipContent &&
                (() => {
                    const placementLeft = store.mousePosition.x > width / 2;
                    return (
                        <Portal container={document.body}>
                            <Popover
                                arrowOffsetTop={17}
                                placement={placementLeft ? 'left' : 'right'}
                                style={{
                                    transform: placementLeft
                                        ? 'translate(-100%, 0)'
                                        : '',
                                }}
                                className={'tl-timeline-tooltip'}
                                positionLeft={
                                    store.mousePosition.x +
                                    (placementLeft ? -10 : 10)
                                }
                                positionTop={store.mousePosition.y - 17}
                            >
                                {store.tooltipContent}
                            </Popover>
                        </Portal>
                    );
                })()}
        </>
    );
});

export default TimelineTracks;
