import {
    EventPosition,
    TickIntervalEnum,
    TimelineEvent,
    TimelineTrackSpecification,
} from './types';
import { action, computed, observable } from 'mobx';
import {
    flattenTracks,
    getFullTicks,
    getPerc,
    getPointInTrimmedSpace,
    getTrimmedTicks,
    TIMELINE_TRACK_HEIGHT,
} from './lib/helpers';
import _ from 'lodash';

import autobind from 'autobind-decorator';
import * as React from 'react';
import { EventTooltipContent, renderPoint } from './TimelineTrack';

type TooltipModel = {
    track: TimelineTrackSpecification;
    events: TimelineEvent[];
    index: number;

    // if `position` is undefined, then show it at mousePosition.
    position?: { x: number; y: number };
};

export class TimelineStore {
    @observable private _expandedTrims = false;
    @observable.ref _data: TimelineTrackSpecification[];
    private collapsedTracks = observable.map();

    constructor(tracks: TimelineTrackSpecification[]) {
        this._data = tracks;
    }

    @observable enableCollapseTrack = true;

    @computed get data(): {
        track: TimelineTrackSpecification;
        indent: number;
        height: number;
    }[] {
        // flatten track structure and annotate with important info, and filter out collapsed track children
        return flattenTracks(this._data, this.isTrackCollapsed);
    }

    @action toggleTrackCollapse(trackUid: string) {
        if (this.collapsedTracks.has(trackUid)) {
            this.collapsedTracks.delete(trackUid);
        } else {
            this.collapsedTracks.set(trackUid, true);
        }
    }

    @autobind isTrackCollapsed(trackUid: string) {
        return this.collapsedTracks.has(trackUid);
    }

    @computed get expandedTrims() {
        return this._expandedTrims;
    }
    @autobind
    @action
    public toggleExpandedTrims() {
        this._expandedTrims = !this._expandedTrims;
    }

    private tooltipUidCounter = 0;
    private tooltipModelsByUid = observable.map<TooltipModel>();
    @observable private _lastHoveredTooltipUid: string | null = null;
    @action
    public setHoveredTooltipUid(uid: string | null) {
        this._lastHoveredTooltipUid = uid;
    }
    @computed get hoveredTooltipUid() {
        if (
            this._lastHoveredTooltipUid &&
            this.doesTooltipExist(this._lastHoveredTooltipUid)
        ) {
            return this._lastHoveredTooltipUid;
        } else if (this.tooltipModelsByUid.size === 1) {
            return this.tooltipModelsByUid.keys()[0];
        } else {
            return null;
        }
    }

    @observable mousePosition = { x: 0, y: 0 };

    doesTooltipExist(uid: string) {
        return this.tooltipModelsByUid.has(uid);
    }

    @computed get tooltipModels() {
        return this.tooltipModelsByUid.entries();
    }

    @autobind
    @action
    addTooltip(model: Pick<TooltipModel, 'track' | 'events'>) {
        const tooltipUid = (this.tooltipUidCounter++).toString();
        this.tooltipModelsByUid.set(tooltipUid, {
            ...model,
            index: 0,
        });
        return tooltipUid;
    }

    @autobind
    @action
    removeTooltip(tooltipUid: string) {
        this.tooltipModelsByUid.delete(tooltipUid);
        if (tooltipUid === this.hoveredTooltipUid) {
            this.setHoveredTooltipUid(null);
        }
    }

    @autobind
    @action
    removeAllTooltips() {
        this.tooltipModelsByUid.clear();
    }

    @action
    removeAllTooltipsExcept(tooltipUid: string) {
        const uids = this.tooltipModelsByUid.keys();
        for (const uid of uids) {
            if (uid !== tooltipUid) {
                this.tooltipModelsByUid.delete(uid);
            }
        }
    }

    @autobind
    @action
    togglePinTooltip(tooltipUid: string) {
        const model = this.tooltipModelsByUid.get(tooltipUid)!;
        if (model.position) {
            model.position = undefined;
        } else {
            model.position = { ...this.mousePosition };
        }
    }

    isTooltipPinned(tooltipUid: string) {
        return !!this.tooltipModelsByUid.get(tooltipUid)!.position;
    }

    @autobind
    @action
    nextTooltipEvent() {
        if (!this.hoveredTooltipUid) {
            return false;
        }

        const model = this.tooltipModelsByUid.get(this.hoveredTooltipUid)!;
        model.index = (model.index + 1) % model.events.length;

        return true;
    }

    @autobind
    @action
    prevTooltipEvent() {
        if (!this.hoveredTooltipUid) {
            return false;
        }

        const model = this.tooltipModelsByUid.get(this.hoveredTooltipUid)!;

        let nextIndex = model.index - 1;
        while (nextIndex < 0) {
            nextIndex += model.events.length;
        }
        model.index = nextIndex;

        return true;
    }

    public getTooltipContent(uid: string, tooltipModel: TooltipModel) {
        const activeItem = tooltipModel.events[tooltipModel.index];
        let content;
        if (tooltipModel.track.renderTooltip) {
            content = tooltipModel.track.renderTooltip(activeItem);
        } else {
            content = <EventTooltipContent event={activeItem} />;
        }

        const multipleItems = tooltipModel.events.length > 1;
        let point = null;
        if (multipleItems) {
            point = (
                <svg
                    width={TIMELINE_TRACK_HEIGHT}
                    height={TIMELINE_TRACK_HEIGHT}
                    style={{ marginRight: 5 }}
                >
                    <g transform={`translate(${TIMELINE_TRACK_HEIGHT / 2} 0)`}>
                        {renderPoint(
                            [activeItem],
                            tooltipModel.track,
                            TIMELINE_TRACK_HEIGHT / 2
                        )}
                    </g>
                </svg>
            );
        }

        return (
            <div
                onMouseEnter={() => this.setHoveredTooltipUid(uid)}
                onMouseMove={() => this.setHoveredTooltipUid(uid)}
                onClick={() => this.removeAllTooltipsExcept(uid)}
            >
                {multipleItems && (
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            borderBottom: '1px dashed white',
                            paddingBottom: 3,
                            marginBottom: 3,
                        }}
                    >
                        {point}
                        {uid === this.hoveredTooltipUid && (
                            <span>
                                {tooltipModel.index + 1} of{' '}
                                {tooltipModel.events.length}. Use spacebar or
                                arrow keys to see others.
                            </span>
                        )}
                    </div>
                )}
                <div>{content}</div>
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
    }

    @observable.ref zoomBounds: { start: number; end: number } | undefined;

    dragging:
        | { start: number | null; end: number | null }
        | undefined = undefined;

    @observable viewPortWidth: number = 0;
    @observable headersWidth: number = 0;

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

    @computed get allItems(): TimelineEvent[] {
        function getItems(track: TimelineTrackSpecification): TimelineEvent[] {
            if (track.tracks && track.tracks.length > 0) {
                return _.flatten(track.tracks.map(t => getItems(t)));
            } else {
                return track.items;
            }
        }

        const events = _.flattenDeep(this.data.map(t => getItems(t.track)));

        return _.sortBy(events, e => e.start);
    }

    @computed get ticks() {
        const fullTicks = getFullTicks(this.allItems, TickIntervalEnum.YEAR);

        return getTrimmedTicks(fullTicks, this.expandedTrims);
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
