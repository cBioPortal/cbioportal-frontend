import {
    EventPosition,
    TickIntervalEnum,
    TimelineEvent,
    TimelineTick,
    TimelineTrackSpecification,
    TimelineTrackType,
} from './types';
import { action, computed, observable, makeObservable } from 'mobx';
import {
    buildTimelineEventSignature,
    colorGetterFactory,
    flattenTracks,
    getFullTicks,
    getPerc,
    getPointInTrimmedSpace,
    getTrimmedTicks,
    TIMELINE_TRACK_HEIGHT,
} from './lib/helpers';

import autobind from 'autobind-decorator';
import * as React from 'react';
import { EventTooltipContent, renderPoint } from './TimelineTrack';

type TooltipModel = {
    track: TimelineTrackSpecification;
    events: TimelineEvent[];

    // if `position` is undefined, then show it at mousePosition.
    position?: { x: number; y: number };
};

type CachedEventPositionEntry = {
    absoluteWidth: number;
    firstTickStart: number;
    itemEnd: number;
    itemStart: number;
    pixelWidth: number;
    position?: EventPosition;
    ticksSignature: number;
};

type CachedTickPositionEntry = {
    absoluteWidth: number;
    firstTickStart: number;
    pixelWidth: number;
    position?: EventPosition;
    start: number;
    ticksSignature: number;
};

type CachedTooltipContentEntry = {
    contentBySignature: Map<string, JSX.Element>;
};

type CachedTooltipPointColorGetterEntry = {
    eventColorGetter?: Function;
    resolvedColorGetter?: (event: TimelineEvent) => string;
};

type TickLayoutContext = {
    absoluteWidth: number;
    firstTickStart: number;
    pixelWidth: number;
    ticks: TimelineTick[];
    ticksSignature: number;
};

type SampleTimelineSummary = {
    sampleEvents: TimelineEvent[];
    sampleIds: string[];
};

const functionIdentityCache = new WeakMap<Function, number>();
const tooltipPointColorGetterCache = new WeakMap<
    TimelineTrackSpecification,
    CachedTooltipPointColorGetterEntry
>();
let nextFunctionIdentity = 1;
let nextTimelineStoreId = 1;

function getFunctionIdentity(fn?: Function): number {
    if (!fn) {
        return 0;
    }

    const cached = functionIdentityCache.get(fn);
    if (cached) {
        return cached;
    }

    const nextId = nextFunctionIdentity++;
    functionIdentityCache.set(fn, nextId);
    return nextId;
}

function getTooltipPointColorGetter(track: TimelineTrackSpecification) {
    const eventColorGetter = track.timelineConfig?.eventColorGetter;
    const cached = tooltipPointColorGetterCache.get(track);

    if (cached && cached.eventColorGetter === eventColorGetter) {
        return cached.resolvedColorGetter;
    }

    const resolvedColorGetter = eventColorGetter
        ? colorGetterFactory(eventColorGetter)
        : undefined;

    tooltipPointColorGetterCache.set(track, {
        eventColorGetter,
        resolvedColorGetter,
    });

    return resolvedColorGetter;
}

function buildTooltipContentSignature(
    uid: string,
    tooltipModel: TooltipModel,
    tooltipIndex: number,
    activeItem: TimelineEvent
) {
    return `${uid}::${tooltipIndex}::${tooltipModel.events.length}::${
        tooltipModel.track.trackType || ''
    }::${getFunctionIdentity(tooltipModel.track.renderTooltip)}::${getFunctionIdentity(
        tooltipModel.track.timelineConfig?.eventColorGetter
    )}::${getFunctionIdentity(
        tooltipModel.track.trackConf?.configureTrack
    )}::${buildTimelineEventSignature(activeItem)}`;
}

export class TimelineStore {
    @observable private _expandedTrims = false;
    @observable.ref _data: TimelineTrackSpecification[];
    private collapsedTracks = observable.map({}, { deep: false });
    private eventPositionCache = new WeakMap<object, CachedEventPositionEntry>();
    private tickPositionCache = new Map<number, CachedTickPositionEntry>();
    private tooltipContentCache = new WeakMap<
        TooltipModel,
        CachedTooltipContentEntry
    >();

    public uniqueId = `tl-id-${nextTimelineStoreId++}`;

    constructor(tracks: TimelineTrackSpecification[]) {
        makeObservable<
            TimelineStore,
            '_expandedTrims' | '_lastHoveredTooltipUid'
        >(this);
        this._data = tracks;

        (window as any).timelineStore = this;
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

    @computed private get sampleTimelineSummary(): SampleTimelineSummary {
        const sampleEvents: TimelineEvent[] = [];
        const sampleIds: string[] = [];
        for (const event of this.allItems) {
            if (!/^SPECIMEN$|^SAMPLE ACQUISITION$/i.test(event.event!.eventType)) {
                continue;
            }

            sampleEvents.push(event);
            for (const attribute of event.event.attributes || []) {
                if (attribute.key === 'SAMPLE_ID') {
                    sampleIds.push(attribute.value);
                }
            }
        }

        return { sampleEvents, sampleIds };
    }

    @computed get sampleEvents() {
        return this.sampleTimelineSummary.sampleEvents;
    }

    @computed get sampleIds() {
        return this.sampleTimelineSummary.sampleIds;
    }

    @computed get expandedTrims() {
        return this._expandedTrims;
    }
    @action.bound
    public toggleExpandedTrims() {
        this._expandedTrims = !this._expandedTrims;
    }

    private tooltipUidCounter = 0;
    // Have to keep tooltip index separate so it can be observable.
    // TooltipModel has recursive nested structure so its not safe to
    //  make it observable in a deep map.
    private tooltipModelsByUid = observable.map<string, TooltipModel>(
        {},
        { deep: false }
    );
    private tooltipIndexByUid = observable.map<string, number>(
        {},
        { deep: false }
    );
    @observable private _lastHoveredTooltipUid: string | null = null;
    @action
    public setHoveredTooltipUid(uid: string | null) {
        if (this._lastHoveredTooltipUid === uid) {
            return;
        }
        this._lastHoveredTooltipUid = uid;
    }
    @computed get hoveredTooltipUid() {
        if (
            this._lastHoveredTooltipUid &&
            this.doesTooltipExist(this._lastHoveredTooltipUid)
        ) {
            return this._lastHoveredTooltipUid;
        } else if (this.tooltipModelsByUid.size === 1) {
            return this.tooltipModelsByUid.keys().next().value; // equivalent of keys()[0] with Iterators
        } else {
            return null;
        }
    }

    @observable mousePosition = { x: 0, y: 0 };

    doesTooltipExist(uid: string) {
        return this.tooltipModelsByUid.has(uid);
    }

    @computed get tooltipModels() {
        const tooltipModels = new Array<[string, TooltipModel, number]>(
            this.tooltipModelsByUid.size
        );
        let index = 0;
        const entries = this.tooltipModelsByUid.entries();
        let currentEntry = entries.next();
        while (!currentEntry.done) {
            const [uid, model] = currentEntry.value;
            tooltipModels[index] = [
                uid,
                model,
                this.tooltipIndexByUid.get(uid)!,
            ];
            index += 1;
            currentEntry = entries.next();
        }

        return tooltipModels;
    }

    @action.bound
    addTooltip(model: Pick<TooltipModel, 'track' | 'events'>) {
        const tooltipUid = (this.tooltipUidCounter++).toString();
        this.tooltipModelsByUid.set(tooltipUid, model);
        this.tooltipIndexByUid.set(tooltipUid, 0);
        return tooltipUid;
    }

    @action.bound
    removeTooltip(tooltipUid: string) {
        this.tooltipModelsByUid.delete(tooltipUid);
        this.tooltipIndexByUid.delete(tooltipUid);
        if (tooltipUid === this.hoveredTooltipUid) {
            this.setHoveredTooltipUid(null);
        }
    }

    @action.bound
    removeAllTooltips() {
        this.tooltipModelsByUid.clear();
        this.tooltipIndexByUid.clear();
    }

    @action
    removeAllTooltipsExcept(tooltipUid: string) {
        const uidsToRemove: string[] = [];
        const keys = this.tooltipModelsByUid.keys();
        let currentKey = keys.next();
        while (!currentKey.done) {
            const uid = currentKey.value;
            if (uid !== tooltipUid) {
                uidsToRemove.push(uid);
            }
            currentKey = keys.next();
        }
        for (const uid of uidsToRemove) {
            this.tooltipModelsByUid.delete(uid);
            this.tooltipIndexByUid.delete(uid);
        }
    }

    @action.bound
    togglePinTooltip(tooltipUid: string) {
        const model = this.tooltipModelsByUid.get(tooltipUid)!;
        if (model.position) {
            model.position = undefined;
        } else {
            model.position = { ...this.mousePosition };
        }
    }

    @action.bound
    pinTooltip(tooltipUid: string) {
        const model = this.tooltipModelsByUid.get(tooltipUid);
        if (model && !model.position) {
            model.position = { ...this.mousePosition };
        }
    }

    isTooltipPinned(tooltipUid: string) {
        return !!this.tooltipModelsByUid.get(tooltipUid)!.position;
    }

    @action.bound
    nextTooltipEvent(tooltipUid: string | null = this.hoveredTooltipUid) {
        if (!tooltipUid) {
            return false;
        }

        const model = this.tooltipModelsByUid.get(tooltipUid);
        const currentIndex = this.tooltipIndexByUid.get(tooltipUid);
        if (!model || currentIndex === undefined) {
            return false;
        }
        this.tooltipIndexByUid.set(
            tooltipUid,
            (currentIndex + 1) % model.events.length
        );

        return true;
    }

    @action.bound
    prevTooltipEvent(tooltipUid: string | null = this.hoveredTooltipUid) {
        if (!tooltipUid) {
            return false;
        }

        const model = this.tooltipModelsByUid.get(tooltipUid);
        const currentIndex = this.tooltipIndexByUid.get(tooltipUid);
        if (!model || currentIndex === undefined) {
            return false;
        }

        let nextIndex = currentIndex - 1;
        while (nextIndex < 0) {
            nextIndex += model.events.length;
        }
        this.tooltipIndexByUid.set(tooltipUid, nextIndex);

        return true;
    }

    public getTooltipContent(
        uid: string,
        tooltipModel: TooltipModel,
        tooltipIndex: number
    ) {
        const activeItem = tooltipModel.events[tooltipIndex];
        const signature = buildTooltipContentSignature(
            uid,
            tooltipModel,
            tooltipIndex,
            activeItem
        );
        const cached = this.tooltipContentCache.get(tooltipModel);
        const cachedContent = cached?.contentBySignature.get(signature);
        if (cachedContent) {
            return cachedContent;
        }

        let content = null;
        if (tooltipModel.track.renderTooltip) {
            content = tooltipModel.track.renderTooltip(activeItem);
        }

        if (content === null) {
            // Show default tooltip if there's no custom track tooltip renderer,
            //  or if the track renderer returns `null`
            content = (
                <EventTooltipContent
                    trackConfig={tooltipModel.track.trackConf}
                    event={activeItem}
                />
            );
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
                            TIMELINE_TRACK_HEIGHT / 2,
                            getTooltipPointColorGetter(tooltipModel.track)
                        )}
                    </g>
                </svg>
            );
        }

        const tooltipContent = (
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
                        <span className="btn-group">
                            <button
                                className="btn btn-default btn-xs"
                                onClick={() => this.prevTooltipEvent(uid)}
                            >
                                &lt;
                            </button>
                            <span className="btn btn-default btn-xs">
                                {tooltipIndex + 1} of{' '}
                                {tooltipModel.events.length} events
                            </span>
                            <button
                                className="btn btn-default btn-xs"
                                onClick={() => this.nextTooltipEvent(uid)}
                            >
                                &gt;
                            </button>
                        </span>
                    </div>
                )}
                {tooltipModel.track.trackType ===
                    TimelineTrackType.LINE_CHART &&
                    tooltipModel.events.length > 1 && (
                        <div>
                            <i>
                                Plotted y value is the max of simultaneous
                                events.
                            </i>
                        </div>
                    )}
                <div>{content}</div>
            </div>
        );

        const nextContentBySignature = cached?.contentBySignature || new Map();
        nextContentBySignature.set(signature, tooltipContent);
        this.tooltipContentCache.set(tooltipModel, {
            contentBySignature: nextContentBySignature,
        });

        return tooltipContent;
    }

    @action.bound
    setMousePosition(p: { x: number; y: number }) {
        if (this.mousePosition.x === p.x && this.mousePosition.y === p.y) {
            return;
        }
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
        //setTimeout(this.setScroll.bind(this), 10);
    }

    private buildTicksSignature(ticks: TimelineTick[]) {
        let hash = 0;

        for (let index = 0; index < ticks.length; index += 1) {
            const tick = ticks[index];
            hash =
                ((hash * 33 +
                    tick.start * 3 +
                    tick.end * 5 +
                    (tick.realEnd ?? 0) * 7 +
                    (tick.offset ?? 0) * 11 +
                    (tick.isTrim ? 13 : 0)) |
                    0) ^ index;
        }

        return hash;
    }

    @computed private get tickLayoutContext(): TickLayoutContext {
        const ticks = this.ticks;

        return {
            absoluteWidth: this.absoluteWidth,
            firstTickStart: this.firstTick.start,
            pixelWidth: this.pixelWidth,
            ticks,
            ticksSignature: this.buildTicksSignature(ticks),
        };
    }

    @autobind
    getPosition(item: any): EventPosition | undefined {
        const {
            ticks,
            ticksSignature,
            firstTickStart,
            absoluteWidth,
            pixelWidth,
        } = this.tickLayoutContext;
        const itemStart = item.start;
        const itemEnd = item.end || item.start;
        const cached = this.eventPositionCache.get(item);

        if (
            cached &&
            cached.ticksSignature === ticksSignature &&
            cached.itemStart === itemStart &&
            cached.itemEnd === itemEnd &&
            cached.firstTickStart === firstTickStart &&
            cached.absoluteWidth === absoluteWidth &&
            cached.pixelWidth === pixelWidth
        ) {
            return cached.position;
        }

        const start = getPointInTrimmedSpace(itemStart, ticks);
        const end = getPointInTrimmedSpace(itemEnd, ticks);

        if (start === undefined || end === undefined) {
            this.eventPositionCache.set(item, {
                absoluteWidth,
                firstTickStart,
                itemEnd,
                itemStart,
                pixelWidth,
                position: undefined,
                ticksSignature,
            });
            return undefined;
        }

        // this shifts them over so that we start at zero instead of negative
        const normalizedStart = start - firstTickStart;
        const normalizedEnd = end - firstTickStart;

        const widthPerc = getPerc(normalizedEnd - normalizedStart, absoluteWidth);

        const position = {
            left: getPerc(normalizedStart, absoluteWidth) + '%',
            width: widthPerc + '%',
            pixelLeft: (getPerc(normalizedStart, absoluteWidth) / 100) * pixelWidth,
            pixelWidth: (widthPerc / 100) * pixelWidth,
        };
        this.eventPositionCache.set(item, {
            absoluteWidth,
            firstTickStart,
            itemEnd,
            itemStart,
            pixelWidth,
            position,
            ticksSignature,
        });

        return position;
    }

    @autobind
    getTickPosition(start: number): EventPosition | undefined {
        const {
            ticks,
            ticksSignature,
            firstTickStart,
            absoluteWidth,
            pixelWidth,
        } = this.tickLayoutContext;
        const cached = this.tickPositionCache.get(start);

        if (
            cached &&
            cached.ticksSignature === ticksSignature &&
            cached.start === start &&
            cached.firstTickStart === firstTickStart &&
            cached.absoluteWidth === absoluteWidth &&
            cached.pixelWidth === pixelWidth
        ) {
            return cached.position;
        }

        const trimmedStart = getPointInTrimmedSpace(start, ticks);

        if (trimmedStart === undefined) {
            this.tickPositionCache.set(start, {
                absoluteWidth,
                firstTickStart,
                pixelWidth,
                position: undefined,
                start,
                ticksSignature,
            });
            return undefined;
        }

        const normalizedStart = trimmedStart - firstTickStart;
        const left = getPerc(normalizedStart, absoluteWidth);
        const position = {
            left: left + '%',
            width: '0%',
            pixelLeft: (left / 100) * pixelWidth,
            pixelWidth: 0,
        };

        this.tickPositionCache.set(start, {
            absoluteWidth,
            firstTickStart,
            pixelWidth,
            position,
            start,
            ticksSignature,
        });

        return position;
    }

    @computed get trimmedLimit() {
        return this.lastTick.end + Math.abs(this.firstTick.start);
    }

    @computed get allItems(): TimelineEvent[] {
        const events: TimelineEvent[] = [];
        for (let index = 0; index < this.data.length; index += 1) {
            const items = this.data[index].track.items;
            if (!items) {
                continue;
            }

            for (let itemIndex = 0; itemIndex < items.length; itemIndex += 1) {
                events.push(items[itemIndex]);
            }
        }

        events.sort((left, right) => left.start - right.start);
        return events;
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
        let nonTrimTickCount = 0;
        for (let index = 0; index < this.ticks.length; index += 1) {
            if (!this.ticks[index].isTrim) {
                nonTrimTickCount += 1;
            }
        }

        return (
            (this.viewPortWidth * this.zoomLevel) /
            nonTrimTickCount
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
}
