import React, {
    MutableRefObject,
    useCallback,
    useEffect,
    useRef,
    useState,
} from 'react';
import { observer } from 'mobx-react-lite';
import TimelineTracks from './TimelineTracks';
import { TimelineStore } from './TimelineStore';
import _ from 'lodash';
import jQuery from 'jquery';
import {
    flattenTracks,
    getPointInTrimmedSpaceFromScreenRead,
    REMOVE_FOR_DOWNLOAD_CLASSNAME,
} from './lib/helpers';
import intersect from './lib/intersect';
import TrackHeader, {
    EXPORT_TRACK_HEADER_BORDER_CLASSNAME,
    getTrackHeadersG,
} from './TrackHeader';
import TickAxis, { TICK_AXIS_COLOR, TICK_AXIS_HEIGHT } from './TickAxis';
import { TickIntervalEnum } from './types';
import './timeline.scss';
import { DownloadControls } from 'cbioportal-frontend-commons';
import CustomTrack, { CustomTrackSpecification } from './CustomTrack';
import CustomTrackHeader from './CustomTrackHeader';

import classNames from 'classnames';
import getSvg from './svg/getSvg';

interface ITimelineProps {
    store: TimelineStore;
    onClickDownload: () => void;
    customTracks?: CustomTrackSpecification[];
    width: number;
    hideLabels?: boolean;
    visibleTracks?: string[];
    hideXAxis?: boolean;
    disableZoom?: boolean;
    headerWidth?: number;
}

function handleMouseEvents(
    e: any,
    store: TimelineStore,
    refs: any,
    zoomDisabled: boolean = false
) {
    const $timeline = jQuery(refs.timeline.current);
    const $zoomSelectBox = jQuery(refs.zoomSelectBox.current);
    const $zoomSelectBoxMask = jQuery(refs.zoomSelectBoxMask.current);

    switch (e.type) {
        case 'mouseleave':
            jQuery(refs.cursor.current).hide();
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
            if (!zoomDisabled) {
                store.dragging = { start: null, end: null };
            }
            break;

        case 'mousemove':
            const pos =
                e.clientX -
                $timeline.offset()!.left +
                (jQuery(document).scrollLeft() || 0);
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
                // if zooming is enabled and we're not dragging, show the zoom cursor
                if (!zoomDisabled) {
                    jQuery(refs.cursor.current).css({
                        left:
                            e.clientX -
                            $timeline.offset()!.left +
                            (jQuery(document).scrollLeft() || 0),
                        display: 'block',
                    });
                }
            }
            break;
    }
}

const hoverCallback = (
    e: React.MouseEvent<any>,
    styleTag: MutableRefObject<null>
) => {
    if (styleTag && styleTag.current) {
        switch (e.type) {
            case 'mouseenter':
                const trackIndex = _.findIndex(
                    e.currentTarget.parentNode!.children,
                    el => el === e.currentTarget
                );
                if (trackIndex !== undefined) {
                    jQuery(styleTag.current!).text(`
                    .tl-timeline-tracklabels > div:nth-child(${trackIndex +
                        1}) {
                        background:#F2F2F2;
                    }
                    
                    .tl-timeline .tl-track:nth-child(${trackIndex +
                        1}) rect.tl-track-highlight {
                        opacity: 1 !important;
                    }
                `);
                }
                break;
            default:
                jQuery(styleTag.current!).empty();
                break;
        }
    }
};

function bindToDOMEvents(store: TimelineStore, refs: any) {
    const keydown = function(e: JQuery.Event) {
        let preventDefault = false;
        switch (e.which) {
            case 37:
            //left
            case 40:
                //down
                if (store.prevTooltipEvent()) {
                    preventDefault = true;
                }
                break;
            case 38:
            //up
            case 39:
            //right
            case 32:
                //spacebar
                if (store.nextTooltipEvent()) {
                    preventDefault = true;
                }
                break;
            case 27:
                // escape
                store.removeAllTooltips();
                preventDefault = true;
                break;
        }
        if (preventDefault) {
            e.preventDefault();
        }
    };

    jQuery(document).on('keydown', keydown as any);

    const resize = function() {
        store.viewPortWidth = jQuery(refs.timelineViewPort.current).width()!;
    };
    jQuery(window).on('resize', resize);

    const mouseleave = function() {
        store.removeAllTooltips();
    };
    jQuery('body').on('mouseleave', mouseleave);

    return function() {
        jQuery(window).off('resize', resize);
        jQuery('body').off('mouseleave', mouseleave);
        jQuery(document).off('keydown', keydown);
    };
}

const Timeline: React.FunctionComponent<ITimelineProps> = observer(function({
    store,
    customTracks,
    width,
    hideLabels = false,
    onClickDownload,
    visibleTracks,
    hideXAxis,
    headerWidth,
}: ITimelineProps) {
    const tracks = store.data;
    const SCROLLBAR_PADDING = 15;
    let height =
        TICK_AXIS_HEIGHT +
        _.sumBy(tracks, t => {
            if (visibleTracks) {
                return visibleTracks.includes(t.track.type) ? t.height : 0;
            } else {
                return t.height;
            }
        }) +
        _.sumBy(customTracks || [], t => t.height(store)) +
        SCROLLBAR_PADDING;

    const refs = {
        cursor: useRef(null),
        wrapper: useRef(null),
        timeline: useRef<SVGSVGElement>(null),
        timelineTracksArea: useRef<SVGGElement>(null),
        timelineHeadersArea: useRef(null),
        zoomSelectBox: useRef(null),
        zoomSelectBoxMask: useRef(null),
        cursorText: useRef(null),
        hoverStyleTag: useRef(null),
        timelineViewPort: useRef(null),
    };

    const memoizedHoverCallback = useCallback(
        (e: React.MouseEvent) => {
            hoverCallback(e, refs.hoverStyleTag);
        },
        [refs.hoverStyleTag]
    );

    // on mount, there will be no element to measure, so we need to do this on equivalent
    // of componentDidMount
    useEffect(() => {
        setTimeout(() => {
            store.viewPortWidth = jQuery(
                refs.timelineViewPort.current!
            ).width()!;

            // keep initial width so that collapsing tracks doesn't lead to
            //  the header area shrinking in width
            store.headersWidth = jQuery(
                refs.timelineHeadersArea.current!
            ).width()!;
        }, 10);

        const cleanupDomEvents = bindToDOMEvents(store, refs);

        return function cleanup() {
            cleanupDomEvents();
        };
    }, []);

    let myZoom = 1;
    if (store.zoomRange && store.zoomedWidth) {
        myZoom = store.absoluteWidth / store.zoomedWidth;
    }

    const renderWidth = store.viewPortWidth ? store.viewPortWidth * myZoom : 0;

    const filteredTracks =
        visibleTracks === undefined
            ? tracks
            : tracks.filter(t => visibleTracks.includes(t.track.type));

    return (
        <div ref={refs.wrapper} className={'tl-timeline-wrapper'}>
            <div className={'tl-timeline-reset-buttons'}>
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
                {store.expandedTrims && (
                    <div>
                        <button
                            className={'btn btn-xs'}
                            onClick={store.toggleExpandedTrims}
                        >
                            reset axis
                        </button>
                    </div>
                )}
            </div>
            <style ref={refs.hoverStyleTag} />
            <div style={{ flexBasis: width - 28, display: 'flex' }}>
                {' '}
                {/* -20 for room for download controls*/}
                <div
                    className={'tl-timeline-leftbar'}
                    style={{ paddingTop: TICK_AXIS_HEIGHT, flexShrink: 0 }}
                >
                    <div
                        ref={refs.timelineHeadersArea}
                        className={classNames('tl-timeline-tracklabels', {
                            'tl-displaynone': hideLabels,
                        })}
                        style={{
                            width: headerWidth || 'auto',
                            minWidth: headerWidth || store.headersWidth,
                        }}
                    >
                        {filteredTracks.map(track => {
                            return (
                                <TrackHeader
                                    store={store}
                                    track={track.track}
                                    height={track.height}
                                    paddingLeft={track.indent}
                                    handleTrackHover={memoizedHoverCallback}
                                />
                            );
                        })}
                        {customTracks &&
                            customTracks.map(track => {
                                return (
                                    <CustomTrackHeader
                                        store={store}
                                        specification={track}
                                        handleTrackHover={memoizedHoverCallback}
                                        disableHover={track.disableHover}
                                    />
                                );
                            })}
                    </div>
                </div>
                <div
                    className={'tl-viewport-pseudo-border'}
                    style={{ height: height - SCROLLBAR_PADDING }}
                />
                <div
                    ref={refs.timelineViewPort}
                    className={'tl-timelineviewport'}
                    style={{ flexShrink: 1, height }}
                >
                    {store.viewPortWidth > 0 && store.ticks && (
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
                            <div
                                ref={refs.cursor}
                                style={{ height: height - SCROLLBAR_PADDING }}
                                className={'tl-cursor'}
                            >
                                <div ref={refs.cursorText} />
                            </div>
                            <div
                                ref={refs.zoomSelectBoxMask}
                                className={'tl-zoom-selectbox-mask'}
                            />
                            <div
                                ref={refs.zoomSelectBox}
                                style={{ height: height - SCROLLBAR_PADDING }}
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
                                        handleTrackHover={memoizedHoverCallback}
                                        visibleTracks={visibleTracks}
                                    />
                                    {hideXAxis !== true && (
                                        <TickAxis
                                            store={store}
                                            width={renderWidth}
                                        />
                                    )}
                                    {/*TickAxis needs to go on top so its not covered by tracks*/}
                                </g>
                            </svg>
                        </div>
                    )}
                </div>
                <div
                    className={'tl-viewport-pseudo-border'}
                    style={{ height: height - SCROLLBAR_PADDING }}
                />
                <DownloadControls
                    buttons={['PDF', 'PNG', 'SVG']}
                    filename="timeline"
                    getSvg={() =>
                        getSvg(
                            store,
                            refs.timelineTracksArea.current,
                            customTracks
                        )
                    }
                    additionalRightButtons={[
                        {
                            key: 'Data (ZIP)',
                            content: <span>Data (ZIP)</span>,
                            onClick: onClickDownload,
                        },
                    ]}
                    dontFade={true}
                    type={'button'}
                    style={{ marginLeft: 7 }}
                />
            </div>
        </div>
    );
});

export default Timeline;
