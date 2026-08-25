export const ZOOM_MIN = 1;
export const ZOOM_MAX = 20;

export function clampZoomLevel(value: number) {
    return Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, value || ZOOM_MIN));
}
