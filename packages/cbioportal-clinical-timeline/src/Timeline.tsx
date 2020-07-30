import React, { useEffect, useRef, useState } from 'react';
import { Observer, observer } from 'mobx-react-lite';
import TimelineTracks from './TimelineTracks';
import { TimelineStore } from './TimelineStore';
import _ from 'lodash';
import $ from 'jquery';
import { getPointInTrimmedSpaceFromScreenRead } from './lib/helpers';
import intersect from './lib/intersect';
import TrackHeader from './TrackHeader';
import TickRow from './TickRow';
import { TickIntervalEnum } from './types';
import './timeline.scss';
import { WindowWrapper } from 'cbioportal-frontend-commons';

(window as any).$ = $;

interface ITimelineProps {
    store: TimelineStore;
    customRows?: (store: TimelineStore) => JSX.Element;
    width: number;
}

const getFocusedPoints = _.debounce(function(
    point: number,
    store: TimelineStore
) {
    const p = getPointInTrimmedSpaceFromScreenRead(point, store.ticks);

    const focusedPoints = store.allItems.filter(event =>
        intersect(p - 5, p + 5, event.start - 5, event.end + 5)
    );

    return focusedPoints;
},
100);

function handleMouseEvents(e: any, store: TimelineStore, refs: any) {
    const $timeline = $(refs.timeline.current);
    const $zoomSelectBox = $(refs.zoomSelectBox.current);
    const $zoomSelectBoxMask = $(refs.zoomSelectBoxMask.current);

    switch (e.type) {
        case 'mouseleave':
            $(refs.cursor.current).hide();
            break;

        case 'mouseup':
            if (store.dragging) {
                if (
                    !!store.dragging.start &&
                    !!store.dragging.end &&
                    Math.abs(store.dragging.start! - store.dragging.end!) > 10
                ) {
                    const width = $timeline.width()!;
                    const percStart = store.dragging.start! / width;
                    const percEnd = store.dragging.end! / width;
                    const startVal = percStart * store.absoluteWidth;
                    const endVal = percEnd * store.absoluteWidth;
                    const myStart = getPointInTrimmedSpaceFromScreenRead(
                        startVal,
                        store.ticks
                    );
                    const myEnd = getPointInTrimmedSpaceFromScreenRead(
                        endVal,
                        store.ticks
                    );

                    if (myStart <= myEnd) {
                        store.setZoomBounds(myStart, myEnd);
                    } else {
                        store.setZoomBounds(myEnd, myStart);
                    }
                }

                store.dragging = undefined;

                $zoomSelectBoxMask.hide();
                $zoomSelectBox.hide();
            }

            store.dragging = undefined;
            break;
        case 'mousedown':
            store.dragging = { start: null, end: null };
            break;

        case 'mousemove':
            const pos = e.clientX - $timeline.offset()!.left;
            if (store.dragging) {
                e.preventDefault();
                if (store.dragging.start === null) {
                    store.dragging.start = pos;
                }
                store.dragging.end = pos;

                $zoomSelectBoxMask.show();
                $zoomSelectBox.show().css({
                    left:
                        store.dragging.start < store.dragging.end
                            ? store.dragging.start
                            : store.dragging.end,
                    width: Math.abs(store.dragging.end - store.dragging.start),
                });
            } else {
                //const point = (pos / $timeline.width()!) * store.absoluteWidth;

                const width = $timeline.width()!;
                const percStart = pos / width;
                const startVal = percStart * store.absoluteWidth;
                const myStart = getPointInTrimmedSpaceFromScreenRead(
                    startVal,
                    store.ticks
                );

                //getFocusedPoints(point, store);

                const years = Math.floor(myStart / TickIntervalEnum.YEAR);
                const months = Math.floor(
                    (myStart - years * TickIntervalEnum.YEAR) /
                        TickIntervalEnum.MONTH
                );
                const days = Math.floor(
                    myStart -
                        (years * TickIntervalEnum.YEAR +
                            months * TickIntervalEnum.MONTH)
                );

                const yearText = years > 0 ? `${years}y` : '';
                const monthText = months > 0 ? ` ${months}m` : '';
                const dayText = days > 0 ? ` ${days}d` : '';

                const label = `${yearText}${monthText}${dayText}`;

                $(refs.cursor.current).css({
                    left: e.clientX - $timeline.offset()!.left,
                    display: 'block',
                });

                //$(refs.cursorText.current).html(label);
            }
            break;
    }
}

const Timeline: React.FunctionComponent<ITimelineProps> = observer(function({
    store,
    customRows,
    width,
}: ITimelineProps) {
    const [viewPortWidth, setViewPortWidth] = useState<number | null>(null);
    const height = 500; // TODO: compute height
    const labelsWidth = 300; // TODO: compute

    const [zoomBound, setZoomBound] = useState<string | null>(null);

    const refs = {
        cursor: useRef(null),
        wrapper: useRef(null),
        timeline: useRef(null),
        zoomSelectBox: useRef(null),
        zoomSelectBoxMask: useRef(null),
        cursorText: useRef(null),
    };

    // on mount, there will be no element to measure, so we need to do this on equivalent
    // of componentDidMount
    useEffect(() => {
        setTimeout(() => {
            setViewPortWidth(store.viewPortWidth);
        }, 10);
    }, []);

    let myZoom = 1;
    if (store.zoomRange && store.zoomedWidth) {
        myZoom = store.absoluteWidth / store.zoomedWidth;
    }

    const renderWidth = viewPortWidth ? viewPortWidth / myZoom : 0;

    return (
        <div ref={refs.wrapper} className={'tl-timeline-wrapper'}>
            {store.zoomBounds && (
                <div className={'tl-timeline-unzoom'}>
                    <button
                        className={'btn btn-xs'}
                        onClick={() => {
                            store.setZoomBounds();
                        }}
                    >
                        reset zoom
                    </button>
                </div>
            )}

            <div className={'tl-timeline-display'}>
                <div className={'tl-timeline-leftbar'}>
                    <div className={'tl-timeline-tracklabels'}>
                        {store.data.map((track, i) => {
                            return <TrackHeader track={track} />;
                        })}
                    </div>
                </div>

                <div
                    className={'tl-timelineviewport'}
                    style={{
                        width: width - labelsWidth,
                    }}
                >
                    {viewPortWidth && store.ticks && (
                        <div
                            className={'tl-timeline'}
                            id={'tl-timeline'}
                            ref={refs.timeline}
                            onMouseDown={e => handleMouseEvents(e, store, refs)}
                            onMouseUp={e => handleMouseEvents(e, store, refs)}
                            onMouseMove={e => handleMouseEvents(e, store, refs)}
                            onMouseLeave={e =>
                                handleMouseEvents(e, store, refs)
                            }
                        >
                            <div ref={refs.cursor} className={'tl-cursor'}>
                                <div ref={refs.cursorText}></div>
                            </div>
                            <div
                                ref={refs.zoomSelectBoxMask}
                                className={'tl-zoom-selectbox-mask'}
                            ></div>
                            <div
                                ref={refs.zoomSelectBox}
                                className={'tl-zoom-selectbox'}
                            ></div>

                            <svg height={height} width={renderWidth}>
                                <TickRow store={store} width={renderWidth} />
                            </svg>

                            {/*<TimelineTracks store={store} />*/}

                            {/*customRows && customRows(store)*/}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
});

export default Timeline;
