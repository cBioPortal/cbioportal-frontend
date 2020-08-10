import React, { useEffect, useRef, useState } from 'react';
import { observer } from 'mobx-react-lite';
import TimelineTracks from './TimelineTracks';
import { TimelineStore } from './TimelineStore';
import _ from 'lodash';
import $ from 'jquery';
import {
    getPointInTrimmedSpaceFromScreenRead,
    REMOVE_FOR_DOWNLOAD_CLASSNAME,
} from './lib/helpers';
import intersect from './lib/intersect';
import TrackHeader, {
    expandTracks,
    EXPORT_TRACK_HEADER_BORDER_CLASSNAME,
    getTrackHeadersG,
} from './TrackHeader';
import TickAxis, { TICK_AXIS_COLOR, TICK_AXIS_HEIGHT } from './TickAxis';
import { TickIntervalEnum } from './types';
import './timeline.scss';
import { DownloadControls } from 'cbioportal-frontend-commons';
import CustomTrack, { CustomTrackSpecification } from './CustomTrack';
import CustomTrackHeader from './CustomTrackHeader';
import { TIMELINE_TRACK_HEIGHT } from './TimelineTrack';

(window as any).$ = $;

interface ITimelineProps {
    store: TimelineStore;
    customTracks?: CustomTrackSpecification[];
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
            const pos =
                e.clientX -
                $timeline.offset()!.left +
                ($(document).scrollLeft() || 0);
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
                    left:
                        e.clientX -
                        $timeline.offset()!.left +
                        ($(document).scrollLeft() || 0),
                    display: 'block',
                });

                //$(refs.cursorText.current).html(label);
            }
            break;
    }
}

const Timeline: React.FunctionComponent<ITimelineProps> = observer(function({
    store,
    customTracks,
    width,
}: ITimelineProps) {
    const [viewPortWidth, setViewPortWidth] = useState<number | null>(null);
    const height =
        TICK_AXIS_HEIGHT +
        expandTracks(store.data).length * TIMELINE_TRACK_HEIGHT +
        _.sumBy(customTracks || [], t => t.height(store));

    const refs = {
        cursor: useRef(null),
        wrapper: useRef(null),
        timeline: useRef<SVGSVGElement>(null),
        timelineTracksArea: useRef<SVGGElement>(null),
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

    const renderWidth = viewPortWidth ? viewPortWidth * myZoom : 0;

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

            <div style={{ flexBasis: width - 28, display: 'flex' }}>
                {' '}
                {/* -20 for room for download controls*/}
                <div
                    className={'tl-timeline-leftbar'}
                    style={{ paddingTop: TICK_AXIS_HEIGHT, flexShrink: 0 }}
                >
                    <div className={'tl-timeline-tracklabels'}>
                        {store.data.map(track => {
                            return <TrackHeader track={track} />;
                        })}
                        {customTracks &&
                            customTracks.map(track => {
                                return (
                                    <CustomTrackHeader
                                        store={store}
                                        specification={track}
                                    />
                                );
                            })}
                    </div>
                </div>
                <div
                    className={'tl-timelineviewport'}
                    style={{ flexShrink: 1, height }}
                >
                    {viewPortWidth && store.ticks && (
                        <div
                            className={'tl-timeline'}
                            id={'tl-timeline'}
                            onMouseDown={e => handleMouseEvents(e, store, refs)}
                            onMouseUp={e => handleMouseEvents(e, store, refs)}
                            onMouseMove={e => handleMouseEvents(e, store, refs)}
                            onMouseLeave={e =>
                                handleMouseEvents(e, store, refs)
                            }
                        >
                            <div ref={refs.cursor} className={'tl-cursor'}>
                                <div ref={refs.cursorText} />
                            </div>
                            <div
                                ref={refs.zoomSelectBoxMask}
                                className={'tl-zoom-selectbox-mask'}
                            />
                            <div
                                ref={refs.zoomSelectBox}
                                className={'tl-zoom-selectbox'}
                            />

                            <svg
                                ref={refs.timeline}
                                width={renderWidth}
                                height={height}
                                className={'tl-timeline-svg'}
                            >
                                <g ref={refs.timelineTracksArea}>
                                    <TimelineTracks
                                        store={store}
                                        width={renderWidth}
                                        customTracks={customTracks}
                                    />
                                    <TickAxis
                                        store={store}
                                        width={renderWidth}
                                    />{' '}
                                    {/*TickAxis needs to go on top so its not covered by tracks*/}
                                </g>
                            </svg>
                        </div>
                    )}
                </div>
                <DownloadControls
                    filename="timeline"
                    getSvg={() =>
                        getSvg(
                            store,
                            refs.timelineTracksArea.current,
                            customTracks
                        )
                    }
                    dontFade={true}
                    type={'button'}
                    style={{ marginLeft: 7 }}
                />
            </div>
        </div>
    );
});

function getSvg(
    store: TimelineStore,
    timelineG: SVGGElement | null,
    customTracks?: CustomTrackSpecification[]
) {
    if (!timelineG) {
        return null;
    }

    const svg = (document.createElementNS(
        'http://www.w3.org/2000/svg',
        'svg'
    ) as unknown) as SVGElement;
    document.body.appendChild(svg); // add to body so that we can do getBBox calculations for layout

    const everythingG = (document.createElementNS(
        'http://www.w3.org/2000/svg',
        'g'
    ) as unknown) as SVGGElement;
    svg.append(everythingG);

    try {
        // Add headers
        const headersG = getTrackHeadersG(store, customTracks);
        everythingG.appendChild(headersG);
        const headersSize = headersG.getBBox();
        const headersPadding = 10;

        // Add separating line between headers and tracks
        const separatingLine = (document.createElementNS(
            'http://www.w3.org/2000/svg',
            'line'
        ) as unknown) as SVGLineElement;
        separatingLine.setAttribute(
            'x1',
            `${headersSize.width + headersPadding}`
        );
        separatingLine.setAttribute(
            'x2',
            `${headersSize.width + headersPadding}`
        );
        separatingLine.setAttribute('y1', '0');
        separatingLine.setAttribute(
            'y2',
            `${headersSize.y + headersSize.height}`
        );
        separatingLine.setAttribute(
            'style',
            `stroke-width:1; stroke:${TICK_AXIS_COLOR}`
        );
        everythingG.appendChild(separatingLine);

        // Add tracks
        // Clone node so we don't disrupt the UI
        timelineG = timelineG.cloneNode(true) as SVGGElement;
        everythingG.appendChild(timelineG);
        // Move tracks over from labels
        timelineG.setAttribute(
            'style',
            `transform: translate(${headersSize.width + headersPadding}px, 0)`
        );

        const everythingSize = everythingG.getBBox();

        // Set svg size to include everything
        svg.setAttribute('width', `${everythingSize.width}`);
        svg.setAttribute('height', `${everythingSize.height}`);

        // Finishing touches
        // Filter out non-download elements
        $(svg)
            .find(`.${REMOVE_FOR_DOWNLOAD_CLASSNAME}`)
            .remove();

        // Extend track header borders
        $(svg)
            .find(`.${EXPORT_TRACK_HEADER_BORDER_CLASSNAME}`)
            .each(function() {
                this.setAttribute(
                    'x2',
                    `${headersSize.width + headersPadding}`
                );
            });
    } finally {
        document.body.removeChild(svg); // remove from body no matter what happens
    }
    return svg;
}

export default Timeline;
