import {
    EventPosition,
    TickIntervalEnum,
    TimelineEvent,
    TimelineTrackSpecification,
} from './types';
import { action, computed, observable } from 'mobx';
import {
    getFullTicks,
    getPerc,
    getPointInTrimmedSpace,
    getTrimmedTicks,
} from './lib/helpers';
import _ from 'lodash';
import $ from 'jquery';
import autobind from 'autobind-decorator';
import * as React from 'react';
import {
    EventTooltipContent,
    renderPoint,
    TIMELINE_TRACK_HEIGHT,
} from './TimelineTrack';

export class TimelineStore {
    constructor(tracks: TimelineTrackSpecification[]) {
        this.data = tracks;

        $(document).on('keydown', e => {
            let preventDefault = false;
            if (this.tooltipContent !== null) {
                switch (e.which) {
                    case 37:
                    //left
                    case 40:
                        //down
                        this.prevTooltipEvent();
                        preventDefault = true;
                        break;
                    case 38:
                    //up
                    case 39:
                        //right
                        this.nextTooltipEvent();
                        preventDefault = true;
                        break;
                }
            }
            if (preventDefault) {
                e.preventDefault();
            }
        });
    }

    @observable private tooltipModel = null as null | {
        track: TimelineTrackSpecification;
        events: TimelineEvent[];
        index: number;
    };

    @observable mousePosition = { x: 0, y: 0 };

    @autobind
    @action
    setTooltipModel(
        model: null | {
            track: TimelineTrackSpecification;
            events: TimelineEvent[];
        }
    ) {
        this.tooltipModel = model
            ? {
                  ...model,
                  index: 0,
              }
            : null;
    }

    @autobind
    @action
    nextTooltipEvent() {
        this.tooltipModel!.index =
            (this.tooltipModel!.index + 1) % this.tooltipModel!.events.length;
    }

    @autobind
    @action
    prevTooltipEvent() {
        this.tooltipModel!.index = Math.abs(
            (this.tooltipModel!.index - 1) % this.tooltipModel!.events.length
        );
    }

    @computed get tooltipContent() {
        if (!this.tooltipModel) {
            return null;
        }

        const activeItem = this.tooltipModel.events[this.tooltipModel.index];
        let content;
        if (this.tooltipModel.track.renderTooltip) {
            content = this.tooltipModel.track.renderTooltip(activeItem);
        } else {
            content = <EventTooltipContent event={activeItem} />;
        }

        const multipleItems = this.tooltipModel.events.length > 1;
        let style: any = {};
        let point = null;
        if (multipleItems) {
            style = {
                borderBottom: '1px dashed white',
                paddingBottom: 5,
            };
            point = (
                <svg
                    width={TIMELINE_TRACK_HEIGHT}
                    height={TIMELINE_TRACK_HEIGHT}
                    style={{ marginRight: 5, marginTop: 2 }}
                >
                    <g
                        style={{
                            transform: `translate(${TIMELINE_TRACK_HEIGHT /
                                2}px, 0)`,
                        }}
                    >
                        {renderPoint([activeItem], this.tooltipModel.track)}
                    </g>
                </svg>
            );
        }

        return (
            <div>
                <div style={style}>{content}</div>
                {multipleItems && (
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                        }}
                    >
                        {point}
                        {this.tooltipModel.index + 1} of{' '}
                        {this.tooltipModel.events.length}. Click or use arrow
                        keys to see others.
                    </div>
                )}
            </div>
        );
    }

    @autobind
    @action
    setMousePosition(p: { x: number; y: number }) {
        this.mousePosition.x = p.x;
        this.mousePosition.y = p.y;
    }

    @computed get limit() {
        return this.lastTick.end;
    }

    @computed get tickInterval() {
        return TickIntervalEnum.YEAR;
        //return Math.abs(this.firstTick.end - this.firstTick.start + 1);
    }

    @observable.ref zoomBounds: { start: number; end: number } | undefined;

    dragging:
        | { start: number | null; end: number | null }
        | undefined = undefined;

    @computed get viewPortWidth() {
        const width = $('.tl-timelineviewport').width()!;
        return width;
    }

    setZoomBounds(start?: number, end?: number) {
        if (start && end) {
            this.zoomBounds = { start, end };
        } else {
            this.zoomBounds = undefined;
        }
        setTimeout(this.setScroll.bind(this), 10);
    }

    @autobind
    getPosition(item: any): EventPosition | undefined {
        const start = getPointInTrimmedSpace(item.start, this.ticks);
        const end = getPointInTrimmedSpace(item.end || item.start, this.ticks);

        if (start === undefined || end === undefined) {
            return undefined;
        }

        // this shifts them over so that we start at zero instead of negative
        const normalizedStart = start - this.firstTick.start;
        const normalizedEnd = end - this.firstTick.start;

        const widthPerc = getPerc(
            normalizedEnd - normalizedStart,
            this.absoluteWidth
        );

        return {
            left: getPerc(normalizedStart, this.absoluteWidth) + '%',
            width: widthPerc + '%',
            pixelLeft:
                (getPerc(normalizedStart, this.absoluteWidth) / 100) *
                this.pixelWidth,
            pixelWidth: (widthPerc / 100) * this.pixelWidth,
        };
    }

    @computed get trimmedLimit() {
        return this.lastTick.end + Math.abs(this.firstTick.start);
    }

    @observable.ref data: TimelineTrackSpecification[];

    @computed get allItems(): TimelineEvent[] {
        function getItems(track: TimelineTrackSpecification): TimelineEvent[] {
            if (track.tracks && track.tracks.length > 0) {
                return _.flatten(track.tracks.map(t => getItems(t)));
            } else {
                return track.items;
            }
        }

        const events = _.flattenDeep(this.data.map(t => getItems(t)));

        return _.sortBy(events, e => e.start);
    }

    @computed get ticks() {
        const fullTicks = getFullTicks(this.allItems, TickIntervalEnum.YEAR);

        return getTrimmedTicks(fullTicks);
    }

    @computed get lastTick() {
        return this.ticks[this.ticks.length - 1];
    }

    @computed get firstTick() {
        return this.ticks[0];
    }

    @computed get absoluteWidth() {
        const start = this.firstTick.start + Math.abs(this.firstTick.start);
        const end =
            getPointInTrimmedSpace(this.lastTick.end, this.ticks)! +
            Math.abs(this.firstTick.start);
        return end - start;
    }

    @computed get zoomedWidth() {
        if (this.zoomRange) {
            return this.zoomRange.end - this.zoomRange.start;
        } else {
            return undefined;
        }
    }

    @computed get tickPixelWidth() {
        // pixel width equals total pixel width / number of ticks (trims are zero width, so discard them)
        return (
            (this.viewPortWidth * this.zoomLevel) /
            this.ticks.filter(t => !t.isTrim).length
        );
    }

    @computed get pixelWidth() {
        return this.viewPortWidth !== undefined
            ? this.viewPortWidth * this.zoomLevel
            : 0;
    }

    @computed get zoomRange() {
        if (this.zoomBounds) {
            return {
                start: getPointInTrimmedSpace(
                    this.zoomBounds.start,
                    this.ticks
                )!,
                end: getPointInTrimmedSpace(this.zoomBounds.end, this.ticks)!,
            };
        } else {
            return undefined;
        }
    }

    @computed get zoomLevel() {
        return !this.zoomedWidth ? 1 : this.absoluteWidth / this.zoomedWidth!;
    }

    @observable hoveredTrackIndex: number | undefined;

    setScroll() {
        let pixelLeft = 0;

        if (this.zoomBounds) {
            const trimmedPos = this.getPosition({
                start: this.zoomBounds!.start,
                end: this.zoomBounds!.end,
            });

            if (trimmedPos) {
                pixelLeft = trimmedPos.pixelLeft;
            }
        }
        (document.getElementById('tl-timeline')!
            .parentNode! as any).scrollLeft = pixelLeft;
    }
}
