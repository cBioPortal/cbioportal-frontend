import { TickIntervalEnum, TimelineTick } from './types';
import { TimelineRow } from './TimelineRow';
import React, { useCallback } from 'react';
import { TimelineStore } from './TimelineStore';
import _ from 'lodash';
import { observer } from 'mobx-react';
import $ from 'jquery';

export interface ITimelineTracks {
    store: TimelineStore;
    customTracks?: (store: TimelineStore) => JSX.Element[] | JSX.Element;
}

export const TimelineTracks: React.FunctionComponent<
    ITimelineTracks
> = observer(function({ store, customTracks }) {
    const hoverCallback = (e: React.MouseEvent<HTMLDivElement>) => {
        switch (e.type) {
            case 'mouseenter':
                const rowIndex = _.findIndex(
                    e.currentTarget.parentNode!.children,
                    el => el === e.currentTarget
                );
                if (rowIndex !== undefined) {
                    $('.tl-row-hover').text(`
                        .tl-timeline-tracklabels > div:nth-child(${rowIndex +
                            1}) {
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

    return (
        <>
            <style className={'tl-row-hover'}></style>
            <div className={'tl-rowGroup'}>
                {store.data.map((row, i) => {
                    return (
                        <TimelineRow
                            limit={store.trimmedLimit}
                            trackData={row}
                            handleMouseHover={hoverCallback}
                            getPosition={store.getPosition}
                        />
                    );
                })}
            </div>
        </>
    );
});

export default TimelineTracks;
