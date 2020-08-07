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
    customTracks?: CustomTrackSpecification[];
}

export const TimelineTracks: React.FunctionComponent<
    ITimelineTracks
> = observer(function({ store, width, customTracks }) {
    const hoverCallback = (e: React.MouseEvent<SVGGElement>) => {
        switch (e.type) {
            case 'mouseenter':
                const trackIndex = _.findIndex(
                    e.currentTarget.parentNode!.children,
                    el => el === e.currentTarget
                );
                if (trackIndex !== undefined) {
                    $('.tl-header-hover-style').text(`
                 .tl-timeline-tracklabels > div:nth-child(${trackIndex + 1}) {
                                background:#F2F2F2;
                            }
                        }
                    `);
                }
                break;
            default:
                $('.tl-header-hover-style').empty();
                break;
        }
    };

    const tracks = expandTracks(store.data).map(t => t.track);

    let nextY = 0;

    return (
        <>
            <style className={'tl-header-hover-style'} />
            <g style={{ transform: `translate(0, ${TICK_AXIS_HEIGHT}px)` }}>
                {tracks.map(track => {
                    const y = nextY;
                    nextY += TIMELINE_TRACK_HEIGHT;
                    return (
                        <TimelineTrack
                            limit={store.trimmedLimit}
                            trackData={track}
                            getPosition={store.getPosition}
                            handleTrackHover={hoverCallback}
                            store={store}
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
                            <CustomTrack
                                store={store}
                                specification={track}
                                handleTrackHover={hoverCallback}
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
