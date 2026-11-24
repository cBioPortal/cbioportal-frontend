/**
 * A named set of points picked on a map.
 *
 * Each lasso makes one, rather than merging into a single anonymous
 * selection, so several neighbourhoods can be held side by side, told apart
 * on the map by colour, and compared against each other.
 */
export interface MapSelection {
    id: number;
    name: string;
    color: string;
    /** sampleId, or patientId on a patient-level map. */
    keys: Set<string>;
    /**
     * The lasso it was drawn with, in data coordinates so it stays over the
     * same points as the map is panned and zoomed. Absent for a selection
     * made some other way.
     */
    path?: MapPoint[];
}

export interface MapPoint {
    x: number;
    y: number;
}

/** A committed selection's outline, ready to draw. */
export interface MapSelectionOutline {
    id: number;
    color: string;
    path: MapPoint[];
}

/** What a selection looks like to the controls: no key set to re-render on. */
export interface MapSelectionSummary {
    id: number;
    name: string;
    color: string;
    count: number;
}

/**
 * Colours for selections, in order. Distinct from any colour-by palette: a
 * selection's colour says which selection a point is in, not what it is.
 */
export const SELECTION_COLORS = [
    '#2e7d32',
    '#c2185b',
    '#1565c0',
    '#ef6c00',
    '#6a1b9a',
    '#00838f',
    '#9e9d24',
    '#4e342e',
];
