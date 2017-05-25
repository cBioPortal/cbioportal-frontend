export interface IPdbPosition {
    position: number;
    insertionCode?: string;
}

export interface IPdbPositionRange {
    start: IPdbPosition;
    end: IPdbPosition;
}
