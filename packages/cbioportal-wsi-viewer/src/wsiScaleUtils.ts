import { TileMetadata } from './wsiViewerTypes';

/** Length range of the scale bar on screen, in CSS pixels. */
const SCALE_BAR_MIN_PX = 60;
const SCALE_BAR_MAX_PX = 150;
const NICE_STEPS = [1, 2, 5];

export interface WsiScaleBar {
    /** On-screen length in CSS pixels. */
    widthPx: number;
    /** "500 µm", "2 mm". */
    label: string;
}

/**
 * A scale bar of a round length (1, 2 or 5 × 10ⁿ µm) that fits between the
 * minimum and maximum on-screen length, or undefined without a usable scale.
 *
 * @param micronsPerScreenPx microns of tissue under one CSS pixel
 */
export function chooseScaleBar(
    micronsPerScreenPx: number
): WsiScaleBar | undefined {
    if (!Number.isFinite(micronsPerScreenPx) || micronsPerScreenPx <= 0) {
        return undefined;
    }
    const minMicrons = micronsPerScreenPx * SCALE_BAR_MIN_PX;
    let exponent = Math.floor(Math.log10(minMicrons));
    for (let tries = 0; tries < 4; tries++, exponent++) {
        for (const step of NICE_STEPS) {
            const microns = step * Math.pow(10, exponent);
            const widthPx = microns / micronsPerScreenPx;
            if (widthPx >= SCALE_BAR_MIN_PX && widthPx <= SCALE_BAR_MAX_PX) {
                return { widthPx, label: formatMicrons(microns) };
            }
        }
    }
    return undefined;
}

function formatMicrons(microns: number): string {
    if (microns >= 1000) {
        return `${trimNumber(microns / 1000)} mm`;
    }
    return `${trimNumber(microns)} µm`;
}

function trimNumber(value: number): string {
    return String(parseFloat(value.toPrecision(3)));
}

/**
 * The scan's objective power: the recorded one, else estimated from the
 * resolution (a 20× scan is about 0.5 µm/px).
 */
export function nativeObjectivePower(
    meta: Pick<TileMetadata, 'objective_power' | 'mpp'> | null | undefined
): number | undefined {
    if (meta?.objective_power && meta.objective_power > 0) {
        return meta.objective_power;
    }
    const mpp = meta?.mpp?.x;
    return mpp && mpp > 0 ? 10 / mpp : undefined;
}

/**
 * The magnification the screen shows, as a microscope would label it: the
 * scan's objective power times the screen pixels per image pixel.
 */
export function formatMagnification(
    objectivePower: number | undefined,
    screenPxPerImagePx: number
): string | undefined {
    if (
        !objectivePower ||
        !Number.isFinite(screenPxPerImagePx) ||
        screenPxPerImagePx <= 0
    ) {
        return undefined;
    }
    const magnification = objectivePower * screenPxPerImagePx;
    const digits = magnification < 10 ? 1 : 0;
    return `${magnification.toFixed(digits)}×`;
}
