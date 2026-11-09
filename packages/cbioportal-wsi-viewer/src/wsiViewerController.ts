import { WsiStainFilter } from './wsiViewerTypes';
import { fetchWsiPatientHierarchy } from './wsiHierarchyFetchCache';
import {
    buildWsiDownloadFilename,
    buildWsiViewState,
    clampImageCoordinates,
    copyCurrentUrlToClipboard,
    hashUrlState,
    downloadCanvasAsJpeg,
    scheduleHashStateWrite,
    writeSelectedSlideState,
} from './wsiViewStateUtils';
import { getWsiViewerRuntime } from './wsiViewerConfig';
import {
    buildOsdOptions,
    createOsdMouseTracker,
    destroyOsdHandles,
    ensureNavigator,
    offsetNavigatorElement,
    OSD_TILE_RETRY_MAX,
    isOsdViewerIdle,
    isStaleOsdTileEvent,
    promoteOsdImageLoaderLimit,
    reopenOsdViewer,
    restoreOrHomeViewport,
} from './wsiOsdUtils';
import { getWsiSlideSource } from './wsiAuth';
import { buildWsiSlideQuery } from './wsiUrls';
import { fetchWsiThumbnailBlob } from './wsiThumbnailFetchCache';
import { revokeObjectUrl } from './wsiCacheUtils';
import { WsiViewerState } from './wsiViewerState';
import { Sample, Slide, WsiSlideSource } from './wsiViewerTypes';

const WSI_SELECTION_TIMEOUT_MS = 185_000;
const WSI_TILE_READY_TIMEOUT_MS = 185_000;
const WSI_OSD_OPEN_TIMEOUT_MS = 120_000;

/**
 * Shown when a tile request is answered 401/403. Only the ingress in front of
 * the tile server answers that, after checking the session cookie against the
 * study: the session has expired or no longer has access. The tile server's
 * own refusals are 404.
 */
export const WSI_SESSION_EXPIRED_MESSAGE =
    'Your session has expired or you do not have access to this study. Reload the page or sign in again.';

function isAccessDeniedStatus(status: unknown): boolean {
    return status === 401 || status === 403;
}

export type WsiInitialSlideLoadOutcome =
    | 'success'
    | 'metadata_failed'
    | 'osd_init_failed'
    | 'osd_open_failed'
    | 'tile_failed'
    | 'tile_timeout'
    | 'selection_timeout';

/** How the first slide of a hierarchy load ended. */
export interface WsiInitialSlideLoadPerformance {
    outcome: WsiInitialSlideLoadOutcome;
    /** Time from the hierarchy request to the first tile; null on failure. */
    firstTileReadyMs: number | null;
}

/** What the controller needs from its component beyond the shared state. */
export interface WsiViewerControllerHost {
    getProps(): {
        studyId: string;
        patientId: string;
        authScope: string;
    };
    getServableSlides(): Array<{ slide: Slide; sample: Sample }>;
    getStainFilter(): WsiStainFilter;
    getTileServerBase(): string;
    getViewerContainerElement(): HTMLDivElement | null;
    chooseInitialServableSlide(
        allSlides: Array<{ slide: Slide; sample: Sample }>
    ): { slide: Slide; sample: Sample } | undefined;
    reportInitialSlideLoadPerformance(
        metric: WsiInitialSlideLoadPerformance
    ): void;
    /** The patient's hierarchy starts (re)loading; the shared state is reset. */
    onHierarchyLoadStarted?(): void;
    onSlideSelectionStarted?(slide: Slide): void;
    onSelectionCleared?(): void;
    onViewerOpened?(viewer: any, openSeadragon: any, slide: Slide): void;
    onViewerDestroyed?(): void;
}

type MountTimer =
    | 'spinnerTimer'
    | 'tileReadyTimer'
    | 'osdOpenTimer'
    | 'selectionTimeoutTimer'
    | 'writeHashTimer';

/**
 * Runs `run` when the browser is idle (at most `idleTimeoutMs` later), or
 * after `fallbackMs` without requestIdleCallback. Returns a cancel function.
 */
function scheduleIdle(
    run: () => void,
    idleTimeoutMs: number,
    fallbackMs: number
): () => void {
    if (
        typeof window !== 'undefined' &&
        typeof window.requestIdleCallback === 'function'
    ) {
        const handle = window.requestIdleCallback(run, {
            timeout: idleTimeoutMs,
        });
        return () => window.cancelIdleCallback?.(handle);
    }
    const timer = setTimeout(run, fallbackMs);
    return () => clearTimeout(timer);
}

/** How long after tiles are ready the preview goes if tile-drawn never comes. */
const PREVIEW_CLEAR_FALLBACK_MS = 1500;

export class WsiViewerController {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private osdViewer: any = null;
    /** Whether `osdViewer` shows, or is opening, the current mount's slide. */
    private osdSlideMounted = false;
    /** Handlers bound to `osdViewer` for the current slide only. */
    private osdSlideHandlers: Array<{
        eventName: string;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        handler: (event: any) => void;
    }> = [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private osdMouseTracker: any = null;
    private thumbnailPreviewAbortController: AbortController | null = null;
    private thumbnailPreviewObjectUrl: string | null = null;
    private nativeTileReadySeq: number | null = null;
    private nativeTileDrawnSeq: number | null = null;
    /** Whether the renderer raises tile-drawn, which clears the preview. */
    private tileDrawnClearsPreview = false;
    private mountSeq = 0;
    private loadingStart = 0;
    private spinnerTimer: ReturnType<typeof setTimeout> | null = null;
    private tileReadyTimer: ReturnType<typeof setTimeout> | null = null;
    private osdOpenTimer: ReturnType<typeof setTimeout> | null = null;
    private selectionTimeoutTimer: ReturnType<typeof setTimeout> | null = null;
    private viewerVisible = true;
    private terminalTileFailures = new Set<string>();
    private writeHashTimer: ReturnType<typeof setTimeout> | null = null;
    private hierarchyLoadSeq = 0;
    private hierarchyAbortController: AbortController | null = null;
    /** Cancels the scheduled navigator setup or its retry. */
    private cancelScheduledNavigator: (() => void) | null = null;
    private restoreHashViewportForNextSelection = false;
    private initialSlideKey: string | undefined = undefined;
    /** Start time of the hierarchy load whose first slide is unreported. */
    private initialSlideLoadStartedAt: number | null = null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private openSeadragon: any | null = null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private static readonly MIN_SPINNER_MS = 250;

    public readonly navId = `wsi-nav-${Math.random()
        .toString(36)
        .slice(2, 9)}`;

    constructor(
        private readonly host: WsiViewerControllerHost,
        private readonly state: WsiViewerState,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        private readonly loadOpenSeadragon: () => Promise<any>
    ) {}

    /** The viewer, while it holds the current mount's slide. */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private get mountedViewer(): any {
        return this.osdSlideMounted ? this.osdViewer : null;
    }

    private clearTimer(name: MountTimer): void {
        const timer = this[name];
        if (timer !== null) clearTimeout(timer);
        this[name] = null;
    }

    /** Clears the per-mount timers, leaving any later work of the mount stale. */
    private clearMountTimers(): void {
        this.clearTimer('spinnerTimer');
        this.clearTimer('tileReadyTimer');
        this.clearTimer('osdOpenTimer');
        this.clearTimer('selectionTimeoutTimer');
    }

    /**
     * Starts a new mount sequence, so callbacks of the previous mount are
     * ignored, and stops its preview and timers.
     */
    private resetMount(): void {
        this.mountSeq++;
        this.nativeTileReadySeq = null;
        this.nativeTileDrawnSeq = null;
        this.clearThumbnailPreview();
        this.clearMountTimers();
    }

    /**
     * Ends the current mount on an error: the error overlay with Retry
     * replaces the spinner and the thumbnail preview.
     */
    private failMount(
        error: string,
        outcome: WsiInitialSlideLoadOutcome
    ): void {
        this.clearMountTimers();
        this.state.error = error;
        this.clearThumbnailPreview();
        this.state.spinnerVisible = false;
        this.state.tilesReady = true;
        this.finishInitialSlideLoad(outcome);
    }

    dispose() {
        this.resetMount();
        this.clearTimer('writeHashTimer');
        this.hierarchyAbortController?.abort();
        this.hierarchyAbortController = null;
        this.cancelNavigatorSchedule();
        this.destroyViewer();
        hashUrlState.clear();
    }

    private cancelNavigatorSchedule() {
        this.cancelScheduledNavigator?.();
        this.cancelScheduledNavigator = null;
    }

    /**
     * Reports how the first slide of the current hierarchy load ended, once.
     * Nothing is reported before that slide is chosen.
     */
    private finishInitialSlideLoad(outcome: WsiInitialSlideLoadOutcome): void {
        const startedAt = this.initialSlideLoadStartedAt;
        if (startedAt === null || !this.initialSlideKey) return;
        this.initialSlideLoadStartedAt = null;
        this.host.reportInitialSlideLoadPerformance({
            outcome,
            firstTileReadyMs:
                outcome === 'success' ? Date.now() - startedAt : null,
        });
    }

    private primeOpenSeadragonLoad() {
        return this.loadOpenSeadragon().then(openSeadragon => {
            this.openSeadragon = openSeadragon;
            return openSeadragon;
        });
    }

    private writeHashState() {
        // A viewport measured in a container with no size is not a view to share or restore.
        if (!hasLaidOutContainer(this.mountedViewer)) return;
        this.writeHashTimer = scheduleHashStateWrite({
            timer: this.writeHashTimer,
            selectedSlideId: this.state.selectedSlide?.slide_key,
            osdViewer: this.mountedViewer,
            urlState: hashUrlState,
        });
    }

    /**
     * Binds a handler to the viewer for the current slide; it is removed when
     * the slide is unmounted, so the reused viewer does not collect handlers.
     * Returns the bound handler, for removing it earlier.
     */
    private addSlideHandler(
        eventName: string,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        handler: (event: any) => void,
        once = false
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ): ((event: any) => void) | undefined {
        const viewer = this.osdViewer;
        if (!viewer) return undefined;
        const tileEvent = eventName.startsWith('tile-');
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const registered = (event: any) => {
            // Ignore tiles of an image this viewer no longer shows; a
            // one-time handler stays bound for the current slide's tile.
            if (tileEvent && isStaleOsdTileEvent(viewer, event)) return;
            if (once) this.removeSlideHandler(eventName, registered);
            handler(event);
        };
        if (viewer.addHandler(eventName, registered) === false) {
            return undefined;
        }
        this.osdSlideHandlers.push({ eventName, handler: registered });
        return registered;
    }

    private removeSlideHandler(
        eventName: string,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        handler: (event: any) => void
    ): void {
        this.osdViewer?.removeHandler?.(eventName, handler);
        this.osdSlideHandlers = this.osdSlideHandlers.filter(
            entry => entry.handler !== handler
        );
    }

    /**
     * Unmounts the current slide but keeps the viewer for the next one: its
     * per-slide handlers are removed and its image closed, so the next
     * slide's thumbnail preview shows through until its tiles draw.
     */
    private closeViewerSlide() {
        const viewer = this.osdViewer;
        this.osdSlideHandlers.forEach(({ eventName, handler }) =>
            viewer?.removeHandler?.(eventName, handler)
        );
        this.osdSlideHandlers = [];
        this.osdSlideMounted = false;
        if (viewer) {
            try {
                viewer.close?.();
            } catch (_) {
                // ignore
            }
        }
        this.state.clearCursorPos();
    }

    private destroyViewer() {
        this.osdSlideHandlers = [];
        this.osdSlideMounted = false;
        this.host.onViewerDestroyed?.();
        destroyOsdHandles({
            osdMouseTracker: this.osdMouseTracker,
            osdViewer: this.osdViewer,
            clearCursorPos: () => this.state.clearCursorPos(),
        });
        this.osdMouseTracker = null;
        this.osdViewer = null;
    }

    private revokeThumbnailPreviewObjectUrl(): void {
        revokeObjectUrl(this.thumbnailPreviewObjectUrl);
        this.thumbnailPreviewObjectUrl = null;
    }

    private clearThumbnailPreview(): void {
        this.thumbnailPreviewAbortController?.abort();
        this.thumbnailPreviewAbortController = null;
        this.revokeThumbnailPreviewObjectUrl();
        this.state.thumbnailPreviewUrl = null;
    }

    private startThumbnailPreview(source: WsiSlideSource, seq: number): void {
        this.clearThumbnailPreview();
        const requestController = new AbortController();
        this.thumbnailPreviewAbortController = requestController;

        void fetchWsiThumbnailBlob(
            this.host.getTileServerBase(),
            this.host.getProps().studyId,
            source,
            requestController.signal,
            'default',
            this.host.getProps().authScope
        )
            .then(blob => {
                const objectUrl = URL.createObjectURL(blob);
                const stale =
                    seq !== this.mountSeq ||
                    requestController.signal.aborted ||
                    this.thumbnailPreviewAbortController !==
                        requestController ||
                    this.nativeTileReadySeq === seq ||
                    this.nativeTileDrawnSeq === seq;
                if (stale) {
                    revokeObjectUrl(objectUrl);
                    return;
                }
                this.revokeThumbnailPreviewObjectUrl();
                this.thumbnailPreviewObjectUrl = objectUrl;
                this.state.thumbnailPreviewUrl = objectUrl;
            })
            .catch(error => {
                if (requestController.signal.aborted || seq !== this.mountSeq) {
                    return;
                }
                // A preview is an optimization: any failure, a refused
                // session included, just drops it. The tiles decide whether
                // the slide fails (see handleOsdTileLoadFailed).
                if (
                    typeof window !== 'undefined' &&
                    (window as any).devContext === true
                ) {
                    // eslint-disable-next-line no-console
                    console.info(
                        '[WSIViewer] thumbnail preview unavailable',
                        error
                    );
                }
            });
    }

    private cancelActiveMount(): void {
        this.resetMount();
        this.closeViewerSlide();
    }

    /**
     * Whether the viewer is on screen. OpenSeadragon ignores container size
     * changes while hidden: a hidden tab collapses the container, and
     * resizing to that and back rescales the view.
     */
    setVisible(visible: boolean): void {
        if (visible === this.viewerVisible) return;
        this.viewerVisible = visible;
        if (this.osdViewer) this.osdViewer.autoResize = visible;
    }

    async loadHierarchy(restoreHashViewport = true) {
        const loadSeq = ++this.hierarchyLoadSeq;
        this.hierarchyAbortController?.abort();
        const abortController = new AbortController();
        this.hierarchyAbortController = abortController;
        this.resetMount();
        this.initialSlideKey = undefined;
        this.cancelNavigatorSchedule();
        this.initialSlideLoadStartedAt = Date.now();
        this.state.resetForHierarchyLoad();
        this.host.onHierarchyLoadStarted?.();
        void this.primeOpenSeadragonLoad().catch(() => {});

        try {
            const { authScope, studyId, patientId } = this.host.getProps();
            const data = await fetchWsiPatientHierarchy(
                studyId,
                patientId,
                authScope,
                abortController.signal
            );
            if (
                loadSeq !== this.hierarchyLoadSeq ||
                abortController.signal.aborted
            ) {
                return;
            }

            this.state.hierarchy = data;
            this.state.loading = false;

            const allSlides = this.host.getServableSlides();
            const first = this.host.chooseInitialServableSlide(allSlides);
            if (first) {
                this.restoreHashViewportForNextSelection = restoreHashViewport;
                this.initialSlideKey = first.slide.slide_key;
                await new Promise<void>(resolve =>
                    requestAnimationFrame(() => resolve())
                );
                if (
                    loadSeq !== this.hierarchyLoadSeq ||
                    abortController.signal.aborted
                ) {
                    return;
                }
                await this.selectSlide(first.slide, first.sample);
            }
        } catch (e) {
            if (
                abortController.signal.aborted ||
                loadSeq !== this.hierarchyLoadSeq
            ) {
                return;
            }
            this.state.error = e instanceof Error ? e.message : String(e);
            this.state.loading = false;
        } finally {
            if (this.hierarchyAbortController === abortController) {
                this.hierarchyAbortController = null;
            }
        }
    }

    private scheduleNavigatorIfReady(seq: number) {
        if (
            seq !== this.mountSeq ||
            this.cancelScheduledNavigator ||
            !this.osdViewer ||
            this.osdViewer.navigator ||
            !this.openSeadragon ||
            !this.state.selectedSlide ||
            !this.state.selectedMeta
        ) {
            return;
        }

        const slide = this.state.selectedSlide!;
        const meta = this.state.selectedMeta!;
        const expectedMountSeq = this.mountSeq;
        const runNavigatorSetup = () => {
            this.cancelScheduledNavigator = null;
            if (
                expectedMountSeq !== this.mountSeq ||
                !this.osdViewer ||
                this.osdViewer.navigator ||
                !this.openSeadragon
            ) {
                return;
            }
            const { studyId } = this.host.getProps();
            try {
                ensureNavigator({
                    osdViewer: this.osdViewer,
                    openSeadragon: this.openSeadragon,
                    meta,
                    baseUrl: this.host.getTileServerBase(),
                    slideQuery: buildWsiSlideQuery(
                        studyId,
                        getWsiSlideSource(studyId, slide.slide_key)
                    ),
                });
            } catch (_) {
                if (expectedMountSeq !== this.mountSeq) return;
                const retry = setTimeout(() => {
                    this.cancelScheduledNavigator = null;
                    this.scheduleNavigatorIfReady(expectedMountSeq);
                }, 5000);
                this.cancelScheduledNavigator = () => clearTimeout(retry);
            }
        };

        this.cancelScheduledNavigator = scheduleIdle(
            runNavigatorSetup,
            750,
            150
        );
    }

    async selectSlide(
        slide: Slide,
        sample: Sample,
        restoreHashViewport = this.restoreHashViewportForNextSelection
    ): Promise<void> {
        if (
            this.state.selectedSlide?.slide_key === slide.slide_key &&
            this.state.selectedSample?.sample_id === sample.sample_id &&
            this.state.selectedMeta != null &&
            this.mountedViewer != null
        ) {
            return;
        }
        this.restoreHashViewportForNextSelection = false;
        await this.beginMount(slide, sample, restoreHashViewport, true);
    }

    async retrySelectedSlide(): Promise<void> {
        const slide = this.state.selectedSlide;
        const sample = this.state.selectedSample;
        if (!slide || !sample) return;
        await this.beginMount(slide, sample, true, false);
    }

    /** Replaces the current mount with one of `slide`. */
    private async beginMount(
        slide: Slide,
        sample: Sample,
        restoreHashViewport: boolean,
        notifyHost: boolean
    ): Promise<void> {
        this.cancelActiveMount();
        this.state.beginSlideSelection(slide, sample);
        writeSelectedSlideState(hashUrlState, slide.slide_key);
        if (notifyHost) this.host.onSlideSelectionStarted?.(slide);
        this.loadingStart = Date.now();
        const seq = this.mountSeq;
        this.scheduleSelectionTimeout(seq);
        await this.mountOSD(slide, seq, restoreHashViewport);
    }

    cancelSlideSelection(): void {
        this.cancelActiveMount();
    }

    restoreCurrentViewportFromHash(): void {
        const slide = this.state.selectedSlide;
        if (!slide || !this.mountedViewer || !this.openSeadragon) return;

        restoreOrHomeViewport({
            osdViewer: this.mountedViewer,
            hashState: hashUrlState.read(),
            selectedSlideId: slide.slide_key,
            openSeadragon: this.openSeadragon,
            meta: this.state.selectedMeta,
        });
        this.writeHashState();
    }

    clearSelectedSlide(): void {
        this.resetMount();
        this.destroyViewer();
        this.state.clearSelection();
        this.host.onSelectionCleared?.();
        hashUrlState.clear();
    }

    goToCoordinates() {
        if (!this.mountedViewer) {
            return;
        }
        const clamped = clampImageCoordinates(
            this.state.coordInputX,
            this.state.coordInputY,
            this.state.selectedMeta?.dimensions
        );
        if (!clamped) {
            return;
        }
        this.state.setCoordInputs(String(clamped.x), String(clamped.y));
        if (!this.openSeadragon) {
            return;
        }
        const imagePoint = new this.openSeadragon.Point(clamped.x, clamped.y);
        const viewportPoint = this.osdViewer.viewport.imageToViewportCoordinates(
            imagePoint
        );
        this.osdViewer.viewport.panTo(viewportPoint, true);
    }

    downloadView() {
        const canvas: HTMLCanvasElement | null =
            this.mountedViewer?.drawer?.canvas ??
            this.mountedViewer?.canvas ??
            null;
        if (!canvas) return;

        try {
            const viewport = this.osdViewer.viewport;
            const center = viewport.viewportToImageCoordinates(
                viewport.getCenter()
            );
            const filename = buildWsiDownloadFilename({
                patientId: this.state.hierarchy?.patient_id,
                slideId: this.state.selectedSlide?.slide_key,
                x: Math.round(center.x),
                y: Math.round(center.y),
            });
            downloadCanvasAsJpeg(canvas, filename);
        } catch (_) {
            // canvas tainted or not ready
        }
    }

    async copyViewLink() {
        const state = buildWsiViewState({
            selectedSlideId: this.state.selectedSlide?.slide_key,
            osdViewer: this.mountedViewer,
        });
        const url = state
            ? hashUrlState.write(state)
            : hashUrlState.currentUrl();
        await copyCurrentUrlToClipboard(url);
    }

    private scheduleSelectionTimeout(seq: number) {
        this.clearTimer('selectionTimeoutTimer');
        this.selectionTimeoutTimer = setTimeout(() => {
            if (seq !== this.mountSeq) return;
            this.failMount(
                'Slide viewer did not finish loading. Try another slide.',
                'selection_timeout'
            );
        }, WSI_SELECTION_TIMEOUT_MS);
    }

    private hideSpinnerForMount(seq: number) {
        if (seq !== this.mountSeq) return;
        this.clearTimer('tileReadyTimer');
        this.clearTimer('spinnerTimer');
        this.clearTimer('osdOpenTimer');
        this.state.spinnerVisible = false;
        this.state.tilesReady = true;
        this.state.error = null;
        // A renderer that never raises tile-drawn (WebGL) would otherwise
        // keep the full-size preview under the slide, where it shows when
        // zoomed out. A loaded tile is drawn on the viewer's next redraw, so
        // the preview goes the frame after that; every renderer also gets a
        // later fallback in case its draw event never comes.
        const clearPreview = () => {
            if (seq === this.mountSeq) this.clearThumbnailPreview();
        };
        setTimeout(clearPreview, PREVIEW_CLEAR_FALLBACK_MS);
        if (!this.tileDrawnClearsPreview) {
            this.addSlideHandler(
                'update-viewport',
                () => {
                    if (typeof requestAnimationFrame === 'function') {
                        requestAnimationFrame(clearPreview);
                    } else {
                        clearPreview();
                    }
                },
                true
            );
        }
        promoteOsdImageLoaderLimit(this.osdViewer);
        this.ensureMouseTrackerForReadyViewer(seq);
        if (this.state.selectedSlide?.slide_key === this.initialSlideKey) {
            this.finishInitialSlideLoad('success');
        }
    }

    private reportViewScale() {
        try {
            const viewport = this.osdViewer?.viewport;
            const scale = viewport?.viewportToImageZoom?.(
                viewport.getZoom(true)
            );
            this.state.setViewScale(
                Number.isFinite(scale) && scale > 0 ? scale : null
            );
        } catch (_) {
            // viewport not ready
        }
    }

    private ensureMouseTrackerForReadyViewer(seq: number) {
        if (
            seq !== this.mountSeq ||
            this.osdMouseTracker ||
            !this.osdViewer ||
            !this.openSeadragon
        ) {
            return;
        }

        const containerEl = this.host.getViewerContainerElement();
        if (!containerEl) {
            return;
        }

        this.osdMouseTracker = createOsdMouseTracker({
            openSeadragon: this.openSeadragon,
            element: containerEl,
            viewer: this.osdViewer,
            onCursorMove: (x, y) => this.state.setCursorPos(x, y),
            onCursorExit: () => this.state.clearCursorPos(),
        });
    }

    private handleOsdOpen(
        seq: number,
        slide: Slide,
        restoreHashViewport: boolean
    ) {
        if (seq !== this.mountSeq) return;
        this.clearTimer('osdOpenTimer');
        this.clearTimer('selectionTimeoutTimer');
        const hashState = restoreHashViewport ? hashUrlState.read() : null;
        const applyInitialView = () => {
            try {
                restoreOrHomeViewport({
                    osdViewer: this.osdViewer,
                    hashState,
                    selectedSlideId: slide.slide_key,
                    openSeadragon: this.openSeadragon,
                    meta: this.state.selectedMeta,
                });
                this.writeHashState();
            } catch (_) {
                // viewport not ready
            }
        };
        if (hasLaidOutContainer(this.osdViewer)) {
            applyInitialView();
        } else {
            // Opened while hidden (e.g. in a tab laid out off-screen with no
            // width): a view fitted now would be wrong once the container gets
            // its size, so fit it then. OpenSeadragon raises 'resize' before it
            // rescales the viewport for the new size, so fit on the next frame.
            const onResize = this.addSlideHandler('resize', event => {
                if (seq !== this.mountSeq) return;
                if (!isLaidOutSize(event?.newContainerSize)) return;
                if (onResize) this.removeSlideHandler('resize', onResize);
                requestAnimationFrame(() => {
                    if (seq === this.mountSeq) applyInitialView();
                });
            });
        }
        this.addSlideHandler('animation-finish', () => {
            this.writeHashState();
        });
        this.addSlideHandler('update-viewport', () => this.reportViewScale());
        this.terminalTileFailures.clear();
        const scheduleNavigatorAfterFullLoad = (event: any) => {
            if (event?.fullyLoaded) {
                this.removeSlideHandler(
                    'fully-loaded-change',
                    scheduleNavigatorAfterFullLoad
                );
                this.scheduleNavigatorIfReady(seq);
            }
        };
        this.addSlideHandler(
            'fully-loaded-change',
            scheduleNavigatorAfterFullLoad
        );
        if (this.osdViewer.isFullyLoaded?.()) {
            scheduleNavigatorAfterFullLoad({ fullyLoaded: true });
        }
        this.tileReadyTimer = setTimeout(() => {
            if (seq !== this.mountSeq) return;
            this.failMount(
                'Slide tiles did not load. The slide server may be unavailable.',
                'tile_timeout'
            );
        }, WSI_TILE_READY_TIMEOUT_MS);
        let didMarkNativeTileReady = false;
        let didMarkNativeTileDrawn = false;
        const markNativeTileReady = () => {
            if (didMarkNativeTileReady) return;
            didMarkNativeTileReady = true;
            this.nativeTileReadySeq = seq;
            const remainingMs =
                WsiViewerController.MIN_SPINNER_MS -
                (Date.now() - this.loadingStart);
            if (remainingMs <= 0) {
                this.hideSpinnerForMount(seq);
                return;
            }
            this.clearTimer('spinnerTimer');
            this.spinnerTimer = setTimeout(
                () => this.hideSpinnerForMount(seq),
                remainingMs
            );
        };
        const markNativeTileDrawn = () => {
            if (didMarkNativeTileDrawn) return;
            didMarkNativeTileDrawn = true;
            this.nativeTileDrawnSeq = seq;
            this.clearThumbnailPreview();
            // Some renderers emit tile-loaded but never emit tile-drawn. The
            // loaded event is sufficient to make the viewer interactive; a
            // real draw still clears the thumbnail underlay when available.
            markNativeTileReady();
        };
        // OpenSeadragon rejects tile-drawn for WebGL. Use its public drawer
        // type instead of a constructor name, which is minified in production.
        const drawerType = this.osdViewer.drawer?.getType?.();
        this.tileDrawnClearsPreview = false;
        if (drawerType !== 'webgl') {
            try {
                this.tileDrawnClearsPreview = !!this.addSlideHandler(
                    'tile-drawn',
                    markNativeTileDrawn,
                    true
                );
            } catch (_) {
                // WebGL renderers rely on the tile-loaded handler below.
            }
        }
        // A successful load is the reliable readiness signal across canvas
        // and WebGL renderers. Keep the thumbnail until tile-drawn when that
        // event is available, so the transition never flashes an empty view.
        this.addSlideHandler('tile-loaded', markNativeTileReady, true);
        this.host.onViewerOpened?.(this.osdViewer, this.openSeadragon, slide);
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private handleOsdOpenFailed(seq: number, event: any) {
        if (seq !== this.mountSeq) return;
        // eslint-disable-next-line no-console
        console.error('[WSIViewer] OSD open-failed', event);
        this.failMount(
            `OSD open failed: ${event?.message ?? JSON.stringify(event)}`,
            'osd_open_failed'
        );
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private handleOsdTileLoadFailed(seq: number, event: any) {
        if (seq !== this.mountSeq) return;
        // Retrying cannot help a session the portal refused.
        if (isAccessDeniedStatus(event?.tileRequest?.status)) {
            this.failMount(WSI_SESSION_EXPIRED_MESSAGE, 'tile_failed');
            return;
        }
        if (
            typeof event?.tries === 'number' &&
            event.tries <= OSD_TILE_RETRY_MAX
        ) {
            return;
        }
        const failures = this.terminalTileFailures;
        const tileKey =
            event?.tile?.getUrl?.() ||
            event?.tile?.url ||
            `tile-failure-${failures.size + 1}`;
        if (failures.has(tileKey)) return;
        failures.add(tileKey);
        // eslint-disable-next-line no-console
        console.warn('[WSIViewer] tile-load-failed', tileKey);
        if (failures.size < 3) return;
        this.failMount(
            'Slide tiles could not be loaded. The slide server may be unavailable.',
            'tile_failed'
        );
    }

    private async mountOSD(
        slide: Slide,
        seq: number,
        restoreHashViewport = true
    ) {
        const openSeadragonPromise = this.primeOpenSeadragonLoad();
        const { studyId } = this.host.getProps();
        let source: WsiSlideSource;
        try {
            source = getWsiSlideSource(studyId, slide.slide_key);
        } catch (err) {
            if (seq !== this.mountSeq) return;
            // eslint-disable-next-line no-console
            console.error('[WSIViewer] slide cannot be served', err);
            this.failMount(
                `Failed to load slide metadata: ${err}`,
                'metadata_failed'
            );
            return;
        }

        // Starting the published-thumbnail fetch here lets it run while OSD
        // initializes.
        this.startThumbnailPreview(source, seq);
        const meta = source.tileMetadata;
        const slideQuery = buildWsiSlideQuery(studyId, source);
        this.state.selectedMeta = meta;

        await new Promise<void>(resolve =>
            requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
        );
        if (seq !== this.mountSeq) return;

        const containerEl = this.host.getViewerContainerElement();
        if (!containerEl) return;

        // A viewer built in this container opens later slides itself; one
        // left in a container that has since been replaced is rebuilt.
        if (this.osdViewer && this.osdViewer.element !== containerEl) {
            this.destroyViewer();
        }
        let reopenSlide: (() => void) | null = null;
        try {
            const openSeadragon = await openSeadragonPromise;
            if (seq !== this.mountSeq) return;
            // Reuse needs an idle viewer: tile requests of the previous slide
            // still in flight would hold loader slots ahead of this slide's
            // cold open. A busy viewer is rebuilt.
            const reusableViewer =
                this.osdViewer?.element === containerEl &&
                isOsdViewerIdle(this.osdViewer)
                    ? this.osdViewer
                    : null;
            if (reusableViewer) {
                reopenSlide = () =>
                    reopenOsdViewer({
                        osdViewer: reusableViewer,
                        meta,
                        baseUrl: this.host.getTileServerBase(),
                        slideQuery,
                    });
            } else {
                this.destroyViewer();
                this.osdViewer = openSeadragon(
                    buildOsdOptions({
                        element: containerEl,
                        navId: this.navId,
                        meta,
                        baseUrl: this.host.getTileServerBase(),
                        slideQuery,
                        prefixUrl: getWsiViewerRuntime().osdPrefixUrl,
                    })
                );
                this.osdViewer.autoResize = this.viewerVisible;
                // OpenSeadragon replaces the custom home button title with its
                // generic "Go home" label. Keep the viewer's public keyboard and
                // screen-reader wording stable after OSD has wired the button.
                const homeButton = document.getElementById(
                    `${this.navId}-home`
                );
                homeButton?.setAttribute('title', 'Fit to view');
                homeButton?.setAttribute('aria-label', 'Fit to view');
            }
            this.osdSlideMounted = true;
        } catch (err) {
            if (seq !== this.mountSeq) return;
            // eslint-disable-next-line no-console
            console.error('[WSIViewer] OSD init error:', err);
            this.failMount(`OSD init error: ${err}`, 'osd_init_failed');
            return;
        }

        if (seq !== this.mountSeq) {
            this.destroyViewer();
            return;
        }

        this.clearTimer('osdOpenTimer');
        this.osdOpenTimer = setTimeout(() => {
            if (seq !== this.mountSeq) return;
            this.failMount(
                'Slide viewer did not finish opening. Try another slide.',
                'osd_open_failed'
            );
        }, WSI_OSD_OPEN_TIMEOUT_MS);

        offsetNavigatorElement(this.osdViewer);
        this.addSlideHandler(
            'open',
            () => this.handleOsdOpen(seq, slide, restoreHashViewport),
            true
        );
        this.addSlideHandler(
            'open-failed',
            e => this.handleOsdOpenFailed(seq, e),
            true
        );
        this.addSlideHandler('tile-load-failed', e =>
            this.handleOsdTileLoadFailed(seq, e)
        );
        if (reopenSlide) {
            try {
                reopenSlide();
            } catch (err) {
                this.handleOsdOpenFailed(seq, err);
            }
        }
    }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function isLaidOutSize(size: any): boolean {
    return !!size && size.x > 1 && size.y > 1;
}

/**
 * Whether the viewer's container had a size when OpenSeadragon last measured
 * it. A hidden container measures 1×1 at most (OpenSeadragon's floor) or has
 * no width when laid out off-screen. Viewers that cannot report a size count
 * as laid out.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function hasLaidOutContainer(osdViewer: any): boolean {
    const size = osdViewer?.viewport?.getContainerSize?.();
    return size === undefined || isLaidOutSize(size);
}
