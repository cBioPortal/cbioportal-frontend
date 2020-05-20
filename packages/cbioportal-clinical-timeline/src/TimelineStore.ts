import {
    EventPosition,
    TickIntervalEnum,
    TimelineEvent,
    TimelineTrack,
} from './types';
import { computed, observable } from 'mobx';
import {
    getFullTicks,
    getPerc,
    getPointInTrimmedSpace,
    getTrimmedTicks,
} from './lib/helpers';
import _ from 'lodash';
import $ from 'jquery';
import autobind from 'autobind-decorator';

export class TimelineStore {
    constructor(tracks: TimelineTrack[]) {
        this.data = tracks;
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

        let width =
            getPerc(normalizedEnd, this.absoluteWidth) -
            getPerc(normalizedStart, this.absoluteWidth) +
            '%';

        width =
            getPerc(normalizedEnd - normalizedStart, this.absoluteWidth) + '%';

        return {
            left: getPerc(normalizedStart, this.absoluteWidth) + '%',
            width: width,
            pixelLeft:
                (getPerc(normalizedStart, this.absoluteWidth) / 100) *
                this.pixelWidth,
        };
    }

    @computed get trimmedLimit() {
        return this.lastTick.end + Math.abs(this.firstTick.start);
    }

    @observable.ref data: TimelineTrack[];

    @computed get allItems(): TimelineEvent[] {
        function getItems(track: TimelineTrack): TimelineEvent[] {
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

    @observable hoveredRowIndex: number | undefined;

    setScroll() {
        let perc = 0;

        if (this.zoomBounds) {
            const trimmedPos = this.getPosition({
                start: this.zoomBounds!.start,
                end: this.zoomBounds!.end,
            });

            if (trimmedPos) {
                // @ts-ignore
                perc =
                    (parseFloat(trimmedPos.left) / 100) *
                    $('#tl-timeline').width()!;
            }
        }

        //@ts-ignore
        document.getElementById('tl-timeline')!.parentNode!.scrollLeft = perc;
    }
}
