import { action, makeObservable, observable } from 'mobx';
import {
    PatientHierarchy,
    Sample,
    Slide,
    TileMetadata,
} from './wsiViewerTypes';
import { nativeObjectivePower } from './wsiScaleUtils';

/**
 * The slide viewer's state: the component renders it, and the controller
 * updates it as the hierarchy and slides load and the view moves.
 */
export class WsiViewerState {
    @observable hierarchy: PatientHierarchy | null = null;
    @observable selectedSlide: Slide | null = null;
    @observable selectedSample: Sample | null = null;
    @observable selectedMeta: TileMetadata | null = null;
    @observable loading = true;
    @observable error: string | null = null;
    /** True once OSD has loaded the first tile; used to release deferred
     *  sidebar content after the initial viewer work settles. */
    @observable tilesReady = false;
    /** Separate flag that controls spinner visibility; set true on slide select,
     *  set false once the viewer opens AND at least MIN_SPINNER_MS have elapsed,
     *  so viewport setup isn't delayed by the spinner. */
    @observable spinnerVisible = false;
    @observable thumbnailPreviewUrl: string | null = null;
    /** Coordinate bar — input field values */
    @observable coordInputX = '';
    @observable coordInputY = '';
    /** Current cursor position in image pixels (null when viewer not ready or cursor outside) */
    @observable cursorPos: { x: number; y: number } | null = null;
    /** Screen pixels per image pixel at the current zoom. */
    @observable viewScale: number | null = null;

    constructor() {
        makeObservable(this);
    }

    /** The scan's microns per pixel; a scanner that recorded none reports 0. */
    get selectedMpp(): { x: number; y: number } | undefined {
        const mpp = this.selectedMeta?.mpp;
        return mpp && mpp.x > 0 && mpp.y > 0 ? mpp : undefined;
    }

    get selectedObjectivePower(): number | undefined {
        return nativeObjectivePower(this.selectedMeta);
    }

    @action.bound
    resetForHierarchyLoad() {
        this.loading = true;
        this.error = null;
        this.hierarchy = null;
        this.clearSelection();
        this.coordInputX = '';
        this.coordInputY = '';
    }

    @action.bound
    clearSelection() {
        this.selectedSlide = null;
        this.selectedSample = null;
        this.selectedMeta = null;
        this.tilesReady = false;
        this.spinnerVisible = false;
        this.thumbnailPreviewUrl = null;
        this.cursorPos = null;
        this.viewScale = null;
    }

    @action.bound
    beginSlideSelection(slide: Slide, sample: Sample) {
        this.selectedSlide = slide;
        this.selectedSample = sample;
        this.selectedMeta = null;
        this.tilesReady = false;
        this.spinnerVisible = true;
        this.error = null;
    }

    @action.bound
    setCoordInputs(x: string, y: string) {
        this.coordInputX = x;
        this.coordInputY = y;
    }

    @action.bound
    setCursorPos(x: number, y: number) {
        // Zoomed in, many mouse moves land on the same image pixel.
        if (this.cursorPos?.x === x && this.cursorPos.y === y) return;
        this.cursorPos = { x, y };
    }

    @action.bound
    clearCursorPos() {
        this.cursorPos = null;
    }

    /** Skips changes too small to move the scale bar or magnification. */
    @action.bound
    setViewScale(scale: number | null) {
        const current = this.viewScale;
        if (
            scale !== null &&
            current !== null &&
            Math.abs(scale - current) / current < 0.002
        ) {
            return;
        }
        this.viewScale = scale;
    }
}
