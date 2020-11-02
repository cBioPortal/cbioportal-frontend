export interface TimelineEvent {
    start: number;
    end: number;
    event: any;
    render?(item: TimelineEvent): JSX.Element | string;
}

export enum TimelineTrackType {
    DEFAULT,
    LINE_CHART,
}

export interface TimelineTrackSpecification {
    items: TimelineEvent[];
    type: string;
    uid: string;
    label?: string;
    tracks?: TimelineTrackSpecification[];
    renderEvents?: (e: TimelineEvent[]) => JSX.Element | string;
    renderTooltip?: (e: TimelineEvent) => JSX.Element | string | null; // null means use default tooltip
    sortSimultaneousEvents?: (e: TimelineEvent[]) => TimelineEvent[];
    trackType?: TimelineTrackType;
    getLineChartValue?: (e: TimelineEvent) => number | null;
    disableHover?: boolean;
}

export interface TimelineTick {
    start: number;
    end: number;
    realEnd?: number;
    offset?: number;
    isTrim?: boolean;
    events?: TimelineEvent[];
}

export interface EventPosition {
    left: string;
    pixelLeft: number;
    width: string;
    pixelWidth: number;
}

export enum TickIntervalEnum {
    MONTH = 30.41666,
    YEAR = 365,
    DAY = 1,
}

export interface ZoomBounds {
    start: number;
    end: number;
}
