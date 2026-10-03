import { selectMetadataPrefetchSlides } from './wsiSlideUtils';
import { WsiStainFilter } from './wsiViewerTypes';
import { fetchPatientHierarchyReadOnly } from './wsiHierarchyFetchCache';
import {
    buildWsiDownloadFilename,
    buildWsiViewState,
    clampImageCoordinates,
    copyCurrentUrlToClipboard,
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
    OSD_SPINNER_FALLBACK_MS,
    OSD_TILE_RETRY_MAX,
    isOsdViewerIdle,
    isStaleOsdTileEvent,
    promoteOsdImageLoaderLimit,
    reopenOsdViewer,
    restoreOrHomeViewport,
    scheduleOsdSpinnerFallback,
    scheduleOsdSpinnerHide,
} from './wsiOsdUtils';
import { getWsiSlideAccess } from './wsiAuth';
import { buildWsiRequestHeaders } from './wsiUrls';
import { ensureWsiPreconnect } from './wsiNetworkWarmup';
import { hasPreloadedOpenSeadragon } from './wsiOpenSeadragonLoader';
import { fetchWsiThumbnailBlob } from './wsiThumbnailFetchCache';
import { hasCachedPatientHierarchy } from './wsiHierarchyFetchCache';
import {
    evictSlideMetadataCache,
    fetchSlideMetadataCachedReadOnly,
    hasCachedSlideMetadata,
} from './wsiMetadataFetchCache';
import {
    PatientHierarchy,
    PathologySlideFilter,
    Sample,
    Slide,
    TileMetadata,
    WsiSlideAccess,
} from './wsiViewerTypes';

const WSI_SELECTION_TIMEOUT_MS = 185_000;
const WSI_TILE_READY_TIMEOUT_MS = 185_000;
const WSI_OSD_OPEN_TIMEOUT_MS = 120_000;

export type WsiInitialSlideLoadOutcome =
    | 'success'
    | 'metadata_failed'
    | 'osd_init_failed'
    | 'osd_open_failed'
    | 'tile_failed'
    | 'tile_timeout'
    | 'selection_timeout';

export interface WsiInitialSlideLoadPerformance {
    loadSeq: number;
    slideId: string;
    patientId?: string;
    studyId?: string;
    openSeadragonWarmHit: boolean;
    hierarchyCacheHit: boolean;
    metadataCacheHit: boolean;
    hierarchySource: 'shared-cache' | 'network';
    metadataSource: 'shared-cache' | 'network';
    hierarchyMs: number;
    metadataMs: number | null;
    osdOpenMs: number | null;
    previewShown: boolean;
    previewReadyMs: number | null;
    firstTileReadyMs: number | null;
    outcome?: WsiInitialSlideLoadOutcome;
}

export interface WsiViewerControllerHost {
    getProps(): {
        hierarchyUrl: string;
        studyId?: string;
        patientId?: string;
        pathologyFilter?: PathologySlideFilter;
        authScope?: string;
    };
    resetHierarchyLoadState(): void;
    setHierarchy(data: PatientHierarchy | null): void;
    setLoading(loading: boolean): void;
    setError(error: string | null): void;
    getHierarchy(): PatientHierarchy | null;
    getServableSlides(): Array<{ slide: Slide; sample: Sample }>;
    getStainFilter(): WsiStainFilter;
    getTileServerBase(): string;
    getTileServerOrigin(): string;
    getViewerContainerElement(): HTMLDivElement | null;
    chooseInitialServableSlide(
        allSlides: Array<{ slide: Slide; sample: Sample }>
    ): { slide: Slide; sample: Sample } | undefined;
    beginSlideSelection(slide: Slide, sample: Sample): void;
    setSelectedMeta(meta: TileMetadata | null): void;
    setViewerReady(viewerReady: boolean): void;
    setSpinnerVisible(spinnerVisible: boolean): void;
    setTilesReady(tilesReady: boolean): void;
    setThumbnailPreview(objectUrl: string | null): void;
    getSelectedSlide(): Slide | null;
    getSelectedSample(): Sample | null;
    getSelectedMeta(): TileMetadata | null;
    clearSelectedSlide(): void;
    getPatientId(): string | undefined;
    setCoordInputs(x: string, y: string): void;
    getCoordInputs(): { x: string; y: string };
    updateCursorPos(x: number, y: number): void;
    clearCursorPos(): void;
    reportInitialSlideLoadPerformance(
        metric: WsiInitialSlideLoadPerformance
    ): void;
    onSlideSelectionStarted?(slide: Slide): void;
    onViewerOpened?(viewer: any, openSeadragon: any, slide: Slide): void;
    onViewerDestroyed?(): void;
}

export class WsiViewerController {
    private static readonly METADATA_PREFETCH_CONCURRENCY = 3;
    private static readonly METADATA_PREFETCH_LIMIT = 3;
    private static readonly METADATA_PREFETCH_BATCH_DELAY_MS = 150;
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
    private mountSeq = 0;
    private loadingStart = 0;
    private spinnerTimer: ReturnType<typeof setTimeout> | null = null;
    private tileReadyTimer: ReturnType<typeof setTimeout> | null = null;
    private osdOpenTimer: ReturnType<typeof setTimeout> | null = null;
    private selectionTimeoutTimer: ReturnType<typeof setTimeout> | null = null;
    private wsiTokenRefreshTimer: ReturnType<typeof setTimeout> | null = null;
    /** The next access-token refresh, kept while the viewer is hidden. */
    private wsiTokenRefresh: {
        studyId: string;
        slideKey: string;
        seq: number;
        refreshAt: number;
    } | null = null;
    private viewerVisible = true;
    private tileFailureCount = 0;
    private terminalTileFailures = new Set<string>();
    private writeHashTimer: ReturnType<typeof setTimeout> | null = null;
    private hierarchyLoadSeq = 0;
    private hierarchyAbortController: AbortController | null = null;
    private backgroundWorkStarted = false;
    private backgroundWorkScheduled = false;
    private backgroundWorkIdleHandle: number | null = null;
    private backgroundWorkTimer: ReturnType<typeof setTimeout> | null = null;
    private navigatorScheduled = false;
    private navigatorIdleHandle: number | null = null;
    private navigatorTimer: ReturnType<typeof setTimeout> | null = null;
    private restoreHashViewportForNextSelection = false;
    private initialSlideKey: string | undefined = undefined;
    private initialSlideLoadTrace: {
        loadSeq: number;
        startedAt: number;
        slideId?: string;
        openSeadragonWarmHit: boolean;
        hierarchyCacheHit: boolean;
        metadataCacheHit: boolean;
        hierarchySource: 'shared-cache' | 'network';
        metadataSource: 'shared-cache' | 'network';
        hierarchyLoadedAt?: number;
        metadataLoadedAt?: number;
        osdOpenAt?: number;
        previewReadyAt?: number;
        previewShown: boolean;
        firstTileReadyAt?: number;
        outcome?: WsiInitialSlideLoadOutcome;
        reported: boolean;
    } | null = null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private openSeadragon: any | null = null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private static readonly MIN_SPINNER_MS = 250;

    public readonly navId = `wsi-nav-${Math.random()
        .toString(36)
        .slice(2, 9)}`;

    constructor(
        private readonly host: WsiViewerControllerHost,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        private readonly loadOpenSeadragon: () => Promise<any>
    ) {}

    forceResize() {
        this.osdViewer?.forceResize?.();
    }

    /** The viewer, while it holds the current mount's slide. */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private get mountedViewer(): any {
        return this.osdSlideMounted ? this.osdViewer : null;
    }

    dispose() {
        this.mountSeq++;
        this.nativeTileReadySeq = null;
        this.nativeTileDrawnSeq = null;
        this.clearThumbnailPreview();
        if (this.writeHashTimer !== null) {
            clearTimeout(this.writeHashTimer);
            this.writeHashTimer = null;
        }
        if (this.tileReadyTimer !== null) {
            clearTimeout(this.tileReadyTimer);
            this.tileReadyTimer = null;
        }
        if (this.osdOpenTimer !== null) {
            clearTimeout(this.osdOpenTimer);
            this.osdOpenTimer = null;
        }
        if (this.selectionTimeoutTimer !== null) {
            clearTimeout(this.selectionTimeoutTimer);
            this.selectionTimeoutTimer = null;
        }
        this.cancelWsiTokenRefresh();
        this.hierarchyAbortController?.abort();
        this.hierarchyAbortController = null;
        this.cancelBackgroundWorkSchedule();
        this.cancelNavigatorSchedule();
        this.destroyViewer();
        getWsiViewerRuntime().urlState.clear();
    }

    private cancelBackgroundWorkSchedule() {
        if (
            this.backgroundWorkIdleHandle !== null &&
            typeof window !== 'undefined' &&
            typeof window.cancelIdleCallback === 'function'
        ) {
            window.cancelIdleCallback(this.backgroundWorkIdleHandle);
        }
        this.backgroundWorkIdleHandle = null;
        if (this.backgroundWorkTimer !== null) {
            clearTimeout(this.backgroundWorkTimer);
            this.backgroundWorkTimer = null;
        }
        this.backgroundWorkScheduled = false;
    }

    private cancelNavigatorSchedule() {
        if (
            this.navigatorIdleHandle !== null &&
            typeof window !== 'undefined' &&
            typeof window.cancelIdleCallback === 'function'
        ) {
            window.cancelIdleCallback(this.navigatorIdleHandle);
        }
        this.navigatorIdleHandle = null;
        if (this.navigatorTimer !== null) {
            clearTimeout(this.navigatorTimer);
            this.navigatorTimer = null;
        }
        this.navigatorScheduled = false;
    }

    private now(): number {
        if (
            typeof window !== 'undefined' &&
            typeof window.performance?.now === 'function'
        ) {
            return window.performance.now();
        }
        return Date.now();
    }

    private markPerformanceStage(loadSeq: number, stage: string) {
        if (typeof window === 'undefined') {
            return;
        }
        try {
            window.performance?.mark?.(`wsi:${loadSeq}:${stage}`);
        } catch (_) {
            // Performance marks are best-effort only.
        }
    }

    private measurePerformanceStage(
        loadSeq: number,
        measureName: string,
        startStage: string,
        endStage: string
    ) {
        if (typeof window === 'undefined') {
            return;
        }
        try {
            window.performance?.measure?.(
                `wsi:${loadSeq}:${measureName}`,
                `wsi:${loadSeq}:${startStage}`,
                `wsi:${loadSeq}:${endStage}`
            );
        } catch (_) {
            // Ignore duplicate or missing mark errors.
        }
    }

    private startInitialSlideLoadTrace(loadSeq: number) {
        this.initialSlideLoadTrace = {
            loadSeq,
            startedAt: this.now(),
            openSeadragonWarmHit: false,
            hierarchyCacheHit: false,
            metadataCacheHit: false,
            hierarchySource: 'network',
            metadataSource: 'network',
            previewShown: false,
            outcome: undefined,
            reported: false,
        };
        this.markPerformanceStage(loadSeq, 'start');
    }

    private setInitialSlideTraceSlide(loadSeq: number, slideId: string) {
        if (this.initialSlideLoadTrace?.loadSeq !== loadSeq) {
            return;
        }
        this.initialSlideLoadTrace.slideId = slideId;
    }

    private recordInitialSlideStage(
        loadSeq: number,
        stage:
            | 'hierarchyLoadedAt'
            | 'metadataLoadedAt'
            | 'osdOpenAt'
            | 'previewReadyAt'
            | 'firstTileReadyAt',
        performanceStage:
            | 'hierarchy-loaded'
            | 'metadata-loaded'
            | 'osd-open'
            | 'preview-ready'
            | 'first-tile-ready',
        slideId?: string
    ) {
        const trace = this.initialSlideLoadTrace;
        if (!trace || trace.loadSeq !== loadSeq) {
            return;
        }
        if (slideId && trace.slideId && slideId !== trace.slideId) {
            return;
        }
        if (trace[stage] != null) {
            return;
        }

        trace[stage] = this.now();
        this.markPerformanceStage(loadSeq, performanceStage);
    }

    private maybeReportInitialSlideLoadPerformance(loadSeq: number) {
        const trace = this.initialSlideLoadTrace;
        if (
            !trace ||
            trace.loadSeq !== loadSeq ||
            trace.reported ||
            !trace.slideId ||
            trace.hierarchyLoadedAt == null ||
            (!trace.outcome && trace.firstTileReadyAt == null)
        ) {
            return;
        }

        trace.reported = true;
        this.measurePerformanceStage(
            loadSeq,
            'hierarchy-ms',
            'start',
            'hierarchy-loaded'
        );
        if (trace.metadataLoadedAt != null) {
            this.measurePerformanceStage(
                loadSeq,
                'metadata-ms',
                'start',
                'metadata-loaded'
            );
        }
        if (trace.osdOpenAt != null) {
            this.measurePerformanceStage(
                loadSeq,
                'osd-open-ms',
                'start',
                'osd-open'
            );
        }
        if (trace.firstTileReadyAt != null) {
            this.measurePerformanceStage(
                loadSeq,
                'first-tile-ready-ms',
                'start',
                'first-tile-ready'
            );
        }
        if (trace.previewReadyAt != null) {
            this.measurePerformanceStage(
                loadSeq,
                'preview-ready-ms',
                'start',
                'preview-ready'
            );
        }
        this.host.reportInitialSlideLoadPerformance({
            loadSeq,
            slideId: trace.slideId,
            patientId: this.host.getPatientId(),
            studyId: this.host.getProps().studyId,
            openSeadragonWarmHit: trace.openSeadragonWarmHit,
            hierarchyCacheHit: trace.hierarchyCacheHit,
            metadataCacheHit: trace.metadataCacheHit,
            hierarchySource: trace.hierarchySource,
            metadataSource: trace.metadataSource,
            hierarchyMs: trace.hierarchyLoadedAt - trace.startedAt,
            metadataMs:
                trace.metadataLoadedAt == null
                    ? null
                    : trace.metadataLoadedAt - trace.startedAt,
            osdOpenMs:
                trace.osdOpenAt == null
                    ? null
                    : trace.osdOpenAt - trace.startedAt,
            previewShown: trace.previewShown,
            previewReadyMs:
                trace.previewReadyAt == null
                    ? null
                    : trace.previewReadyAt - trace.startedAt,
            firstTileReadyMs:
                trace.firstTileReadyAt == null
                    ? null
                    : trace.firstTileReadyAt - trace.startedAt,
            outcome: trace.outcome || 'success',
        });
    }

    private finishInitialSlideLoad(
        loadSeq: number,
        outcome: WsiInitialSlideLoadOutcome
    ): void {
        const trace = this.initialSlideLoadTrace;
        if (!trace || trace.loadSeq !== loadSeq || trace.outcome) {
            return;
        }
        trace.outcome = outcome;
        this.maybeReportInitialSlideLoadPerformance(loadSeq);
    }

    private primeOpenSeadragonLoad() {
        return this.loadOpenSeadragon().then(openSeadragon => {
            this.openSeadragon = openSeadragon;
            return openSeadragon;
        });
    }

    private writeHashState() {
        this.writeHashTimer = scheduleHashStateWrite({
            timer: this.writeHashTimer,
            selectedSlideId: this.host.getSelectedSlide()?.slide_key,
            osdViewer: this.mountedViewer,
            urlState: getWsiViewerRuntime().urlState,
        });
    }

    /**
     * Binds a handler to the viewer for the current slide; it is removed when
     * the slide is unmounted, so the reused viewer does not collect handlers.
     */
    private addSlideHandler(
        eventName: string,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        handler: (event: any) => void,
        once = false
    ): void {
        const viewer = this.osdViewer;
        if (!viewer) return;
        const tileEvent = eventName.startsWith('tile-');
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const registered = (event: any) => {
            // Ignore tiles of an image this viewer no longer shows; a
            // one-time handler stays bound for the current slide's tile.
            if (tileEvent && isStaleOsdTileEvent(viewer, event)) return;
            if (once) this.removeSlideHandler(eventName, registered);
            handler(event);
        };
        if (viewer.addHandler(eventName, registered) === false) return;
        this.osdSlideHandlers.push({ eventName, handler: registered });
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
        this.host.clearCursorPos();
    }

    private destroyViewer() {
        this.osdSlideHandlers = [];
        this.osdSlideMounted = false;
        this.host.onViewerDestroyed?.();
        destroyOsdHandles({
            osdMouseTracker: this.osdMouseTracker,
            osdViewer: this.osdViewer,
            clearCursorPos: () => this.host.clearCursorPos(),
        });
        this.osdMouseTracker = null;
        this.osdViewer = null;
    }

    private revokeThumbnailPreviewObjectUrl(): void {
        if (
            this.thumbnailPreviewObjectUrl &&
            typeof URL !== 'undefined' &&
            typeof URL.revokeObjectURL === 'function'
        ) {
            URL.revokeObjectURL(this.thumbnailPreviewObjectUrl);
        }
        this.thumbnailPreviewObjectUrl = null;
    }

    private clearThumbnailPreview(): void {
        this.thumbnailPreviewAbortController?.abort();
        this.thumbnailPreviewAbortController = null;
        this.revokeThumbnailPreviewObjectUrl();
        this.host.setThumbnailPreview(null);
    }

    private startThumbnailPreview(
        slideKey: string,
        seq: number,
        accessPromise: Promise<WsiSlideAccess>
    ): void {
        this.clearThumbnailPreview();
        const requestController = new AbortController();
        this.thumbnailPreviewAbortController = requestController;

        void accessPromise
            .then(async access => {
                if (seq !== this.mountSeq || requestController.signal.aborted) {
                    return null;
                }
                const blob = await fetchWsiThumbnailBlob(
                    this.host.getTileServerBase(),
                    this.host.getProps().studyId || '',
                    slideKey,
                    access,
                    requestController.signal,
                    'default',
                    this.host.getProps().authScope
                );
                return URL.createObjectURL(blob);
            })
            .then(objectUrl => {
                if (!objectUrl) return;
                const stale =
                    seq !== this.mountSeq ||
                    requestController.signal.aborted ||
                    this.thumbnailPreviewAbortController !==
                        requestController ||
                    this.nativeTileReadySeq === seq ||
                    this.nativeTileDrawnSeq === seq;
                if (stale) {
                    if (typeof URL.revokeObjectURL === 'function') {
                        URL.revokeObjectURL(objectUrl);
                    }
                    return;
                }
                this.revokeThumbnailPreviewObjectUrl();
                this.thumbnailPreviewObjectUrl = objectUrl;
                this.host.setThumbnailPreview(objectUrl);
                this.recordInitialSlideStage(
                    this.hierarchyLoadSeq,
                    'previewReadyAt',
                    'preview-ready',
                    slideKey
                );
                if (this.initialSlideLoadTrace?.slideId === slideKey) {
                    this.initialSlideLoadTrace.previewShown = true;
                }
            })
            .catch(error => {
                if (requestController.signal.aborted || seq !== this.mountSeq) {
                    return;
                }
                // A preview is an optimization. Native OSD loading continues
                // when the published thumbnail is unavailable.
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
        this.mountSeq++;
        this.nativeTileReadySeq = null;
        this.nativeTileDrawnSeq = null;
        this.clearThumbnailPreview();
        if (this.spinnerTimer !== null) {
            clearTimeout(this.spinnerTimer);
            this.spinnerTimer = null;
        }
        if (this.tileReadyTimer !== null) {
            clearTimeout(this.tileReadyTimer);
            this.tileReadyTimer = null;
        }
        if (this.osdOpenTimer !== null) {
            clearTimeout(this.osdOpenTimer);
            this.osdOpenTimer = null;
        }
        if (this.selectionTimeoutTimer !== null) {
            clearTimeout(this.selectionTimeoutTimer);
            this.selectionTimeoutTimer = null;
        }
        this.cancelWsiTokenRefresh();
        this.closeViewerSlide();
    }

    private clearWsiTokenRefreshTimer(): void {
        if (this.wsiTokenRefreshTimer !== null) {
            clearTimeout(this.wsiTokenRefreshTimer);
            this.wsiTokenRefreshTimer = null;
        }
    }

    private cancelWsiTokenRefresh(): void {
        this.clearWsiTokenRefreshTimer();
        this.wsiTokenRefresh = null;
    }

    private scheduleWsiTokenRefresh(
        studyId: string,
        slideKey: string,
        seq: number,
        expiresAt: number
    ): void {
        this.setWsiTokenRefresh(studyId, slideKey, seq, expiresAt - 30_000);
    }

    private setWsiTokenRefresh(
        studyId: string,
        slideKey: string,
        seq: number,
        refreshAt: number
    ): void {
        this.cancelWsiTokenRefresh();
        this.wsiTokenRefresh = { studyId, slideKey, seq, refreshAt };
        this.startWsiTokenRefreshTimer();
    }

    // Hidden viewers load no tiles, so their token is refreshed when shown.
    private startWsiTokenRefreshTimer(): void {
        const refresh = this.wsiTokenRefresh;
        if (!refresh || !this.viewerVisible) return;
        this.clearWsiTokenRefreshTimer();
        const delay = Math.max(1000, refresh.refreshAt - Date.now());
        this.wsiTokenRefreshTimer = setTimeout(() => {
            this.wsiTokenRefreshTimer = null;
            this.wsiTokenRefresh = null;
            void this.refreshWsiToken(
                refresh.studyId,
                refresh.slideKey,
                refresh.seq
            );
        }, delay);
    }

    /**
     * Whether the viewer is on screen. Token refresh pauses while it is
     * hidden and, once shown, runs at once if the refresh is due.
     */
    setVisible(visible: boolean): void {
        if (visible === this.viewerVisible) return;
        this.viewerVisible = visible;
        if (!visible) {
            this.clearWsiTokenRefreshTimer();
            return;
        }
        const refresh = this.wsiTokenRefresh;
        if (refresh && refresh.refreshAt <= Date.now()) {
            this.wsiTokenRefresh = null;
            void this.refreshWsiToken(
                refresh.studyId,
                refresh.slideKey,
                refresh.seq
            );
            return;
        }
        this.startWsiTokenRefreshTimer();
    }

    private async refreshWsiToken(
        studyId: string,
        slideKey: string,
        seq: number
    ): Promise<void> {
        if (seq !== this.mountSeq || !this.osdViewer) return;
        try {
            const access = await getWsiSlideAccess(
                studyId,
                slideKey,
                true,
                this.host.getProps().authScope
            );
            if (seq !== this.mountSeq || !this.osdViewer) return;
            const headers = buildWsiRequestHeaders(access.accessToken);
            this.osdViewer.setAjaxHeaders?.(headers, true);
            this.osdViewer.navigator?.setAjaxHeaders?.(headers, true);
            this.scheduleWsiTokenRefresh(
                studyId,
                slideKey,
                seq,
                access.expiresAt || Date.now() + access.expiresIn * 1000
            );
        } catch (_) {
            if (seq !== this.mountSeq) return;
            this.setWsiTokenRefresh(
                studyId,
                slideKey,
                seq,
                Date.now() + 10_000
            );
        }
    }

    async loadHierarchy(restoreHashViewport = true) {
        const loadSeq = ++this.hierarchyLoadSeq;
        this.hierarchyAbortController?.abort();
        const abortController = new AbortController();
        this.hierarchyAbortController = abortController;
        this.mountSeq++;
        this.nativeTileReadySeq = null;
        this.nativeTileDrawnSeq = null;
        this.clearThumbnailPreview();
        this.backgroundWorkStarted = false;
        this.backgroundWorkScheduled = false;
        this.initialSlideKey = undefined;
        this.cancelBackgroundWorkSchedule();
        this.cancelNavigatorSchedule();
        this.startInitialSlideLoadTrace(loadSeq);
        if (this.initialSlideLoadTrace?.loadSeq === loadSeq) {
            this.initialSlideLoadTrace.openSeadragonWarmHit = hasPreloadedOpenSeadragon();
        }
        this.host.resetHierarchyLoadState();
        ensureWsiPreconnect(this.host.getTileServerOrigin());
        void this.primeOpenSeadragonLoad().catch(() => {});

        try {
            const {
                hierarchyUrl,
                authScope,
                studyId,
                patientId,
            } = this.host.getProps();
            const hierarchyCacheHit = hasCachedPatientHierarchy(
                hierarchyUrl,
                authScope
            );
            const hierarchy = await fetchPatientHierarchyReadOnly(
                hierarchyUrl,
                abortController.signal,
                authScope,
                studyId,
                patientId
            );
            if (this.initialSlideLoadTrace?.loadSeq === loadSeq) {
                this.initialSlideLoadTrace.hierarchyCacheHit = hierarchyCacheHit;
                this.initialSlideLoadTrace.hierarchySource = hierarchyCacheHit
                    ? 'shared-cache'
                    : 'network';
            }
            const data = hierarchy;
            if (
                loadSeq !== this.hierarchyLoadSeq ||
                abortController.signal.aborted
            ) {
                return;
            }

            this.host.setHierarchy(data);
            this.host.setLoading(false);
            this.recordInitialSlideStage(
                loadSeq,
                'hierarchyLoadedAt',
                'hierarchy-loaded'
            );

            const allSlides = this.host.getServableSlides();
            const first = this.host.chooseInitialServableSlide(allSlides);
            if (first) {
                this.restoreHashViewportForNextSelection = restoreHashViewport;
                this.initialSlideKey = first.slide.slide_key;
                this.setInitialSlideTraceSlide(loadSeq, first.slide.slide_key);
                await this.fetchSlideMetadata(first.slide.slide_key).catch(
                    () => {
                        // Best-effort warmup; selectSlide will surface real errors.
                    }
                );
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

            if (
                loadSeq !== this.hierarchyLoadSeq ||
                abortController.signal.aborted
            ) {
                return;
            }
        } catch (e) {
            if (
                abortController.signal.aborted ||
                loadSeq !== this.hierarchyLoadSeq
            ) {
                return;
            }
            this.host.setError(e instanceof Error ? e.message : String(e));
            this.host.setLoading(false);
        } finally {
            if (this.hierarchyAbortController === abortController) {
                this.hierarchyAbortController = null;
            }
        }
    }

    private shouldContinueBackgroundWork(
        expectedLoadSeq: number,
        expectedHierarchy?: PatientHierarchy
    ): boolean {
        const hierarchy = this.host.getHierarchy();
        return (
            expectedLoadSeq === this.hierarchyLoadSeq &&
            hierarchy !== null &&
            (!expectedHierarchy || hierarchy === expectedHierarchy)
        );
    }

    private startBackgroundWorkIfReady(seq: number) {
        if (
            seq !== this.mountSeq ||
            this.backgroundWorkStarted ||
            this.backgroundWorkScheduled ||
            !this.initialSlideKey
        ) {
            return;
        }

        const expectedLoadSeq = this.hierarchyLoadSeq;
        const runBackgroundWork = () => {
            this.backgroundWorkIdleHandle = null;
            this.backgroundWorkTimer = null;
            this.backgroundWorkScheduled = false;
            if (
                seq !== this.mountSeq ||
                this.backgroundWorkStarted ||
                !this.shouldContinueBackgroundWork(expectedLoadSeq) ||
                !this.initialSlideKey
            ) {
                return;
            }
            this.backgroundWorkStarted = true;
            void this.prefetchSlideMetadata(
                this.initialSlideKey,
                expectedLoadSeq
            );
        };

        this.backgroundWorkScheduled = true;
        if (
            typeof window !== 'undefined' &&
            typeof window.requestIdleCallback === 'function'
        ) {
            this.backgroundWorkIdleHandle = window.requestIdleCallback(
                runBackgroundWork,
                { timeout: 1500 }
            );
            return;
        }

        this.backgroundWorkTimer = setTimeout(runBackgroundWork, 300);
    }

    private scheduleNavigatorIfReady(seq: number) {
        if (
            seq !== this.mountSeq ||
            this.navigatorScheduled ||
            !this.osdViewer ||
            this.osdViewer.navigator ||
            !this.openSeadragon ||
            !this.host.getSelectedSlide() ||
            !this.host.getSelectedMeta()
        ) {
            return;
        }

        const slide = this.host.getSelectedSlide()!;
        const meta = this.host.getSelectedMeta()!;
        const expectedMountSeq = this.mountSeq;
        const runNavigatorSetup = async () => {
            this.navigatorIdleHandle = null;
            this.navigatorTimer = null;
            this.navigatorScheduled = false;
            if (
                expectedMountSeq !== this.mountSeq ||
                !this.osdViewer ||
                this.osdViewer.navigator ||
                !this.openSeadragon
            ) {
                return;
            }
            const studyId = this.host.getProps().studyId;
            if (!studyId) return;
            try {
                const access = await getWsiSlideAccess(
                    studyId,
                    slide.slide_key,
                    false,
                    this.host.getProps().authScope
                );
                if (
                    expectedMountSeq !== this.mountSeq ||
                    !this.osdViewer ||
                    this.osdViewer.navigator
                ) {
                    return;
                }
                ensureNavigator({
                    osdViewer: this.osdViewer,
                    openSeadragon: this.openSeadragon,
                    meta,
                    baseUrl: this.host.getTileServerBase(),
                    accessToken: access.accessToken,
                });
            } catch (_) {
                if (expectedMountSeq !== this.mountSeq) return;
                this.navigatorTimer = setTimeout(() => {
                    this.navigatorTimer = null;
                    this.scheduleNavigatorIfReady(expectedMountSeq);
                }, 5000);
            }
        };

        this.navigatorScheduled = true;
        if (
            typeof window !== 'undefined' &&
            typeof window.requestIdleCallback === 'function'
        ) {
            this.navigatorIdleHandle = window.requestIdleCallback(
                runNavigatorSetup,
                { timeout: 750 }
            );
            return;
        }

        this.navigatorTimer = setTimeout(runNavigatorSetup, 150);
    }

    private fetchSlideMetadata(slideKey: string): Promise<TileMetadata> {
        const tileServerBase = this.host.getTileServerBase();
        const { studyId, authScope } = this.host.getProps();
        if (
            slideKey === this.initialSlideKey &&
            this.initialSlideLoadTrace &&
            hasCachedSlideMetadata(tileServerBase, slideKey, studyId, authScope)
        ) {
            this.initialSlideLoadTrace.metadataCacheHit = true;
            this.initialSlideLoadTrace.metadataSource = 'shared-cache';
        }
        return fetchSlideMetadataCachedReadOnly(
            tileServerBase,
            slideKey,
            undefined,
            studyId,
            authScope
        );
    }

    private async prefetchSlideMetadata(
        skipSlideKey?: string,
        expectedLoadSeq = this.hierarchyLoadSeq
    ) {
        const prioritizedSlides = selectMetadataPrefetchSlides(
            this.host.getServableSlides(),
            {
                selectedSampleId: this.host.getSelectedSample()?.sample_id,
                stainFilter: this.host.getStainFilter(),
                limit: WsiViewerController.METADATA_PREFETCH_LIMIT,
                skipSlideKey,
                isCached: slideKey =>
                    hasCachedSlideMetadata(
                        this.host.getTileServerBase(),
                        slideKey,
                        this.host.getProps().studyId,
                        this.host.getProps().authScope
                    ),
            }
        );

        for (
            let index = 0;
            index < prioritizedSlides.length;
            index += WsiViewerController.METADATA_PREFETCH_CONCURRENCY
        ) {
            if (!this.shouldContinueBackgroundWork(expectedLoadSeq)) return;

            const batchRequests: Array<Promise<TileMetadata>> = [];
            const batchEnd = Math.min(
                index + WsiViewerController.METADATA_PREFETCH_CONCURRENCY,
                prioritizedSlides.length
            );
            for (
                let batchIndex = index;
                batchIndex < batchEnd;
                batchIndex += 1
            ) {
                batchRequests.push(
                    this.fetchSlideMetadata(
                        prioritizedSlides[batchIndex].slide_key
                    )
                );
            }
            await Promise.allSettled(batchRequests);
            if (!this.shouldContinueBackgroundWork(expectedLoadSeq)) return;

            if (batchEnd < prioritizedSlides.length) {
                await new Promise(resolve =>
                    setTimeout(
                        resolve,
                        WsiViewerController.METADATA_PREFETCH_BATCH_DELAY_MS
                    )
                );
            }
        }
    }

    async selectSlide(
        slide: Slide,
        sample: Sample,
        restoreHashViewport = this.restoreHashViewportForNextSelection
    ): Promise<void> {
        if (
            this.host.getSelectedSlide()?.slide_key === slide.slide_key &&
            this.host.getSelectedSample()?.sample_id === sample.sample_id &&
            this.host.getSelectedMeta() != null &&
            this.mountedViewer != null
        ) {
            return;
        }
        this.cancelActiveMount();
        this.restoreHashViewportForNextSelection = false;
        this.host.beginSlideSelection(slide, sample);
        writeSelectedSlideState(
            getWsiViewerRuntime().urlState,
            slide.slide_key
        );
        this.host.onSlideSelectionStarted?.(slide);
        this.loadingStart = Date.now();
        if (this.spinnerTimer !== null) {
            clearTimeout(this.spinnerTimer);
            this.spinnerTimer = null;
        }
        const seq = this.mountSeq;
        this.scheduleSelectionTimeout(
            seq,
            'Slide viewer did not finish loading. Try another slide.'
        );
        await this.mountOSD(slide, seq, restoreHashViewport);
    }

    async retrySelectedSlide(): Promise<void> {
        const slide = this.host.getSelectedSlide();
        const sample = this.host.getSelectedSample();
        if (!slide || !sample) return;

        evictSlideMetadataCache(
            this.host.getTileServerBase(),
            slide.slide_key,
            this.host.getProps().studyId,
            this.host.getProps().authScope
        );
        this.cancelActiveMount();
        this.host.beginSlideSelection(slide, sample);
        writeSelectedSlideState(
            getWsiViewerRuntime().urlState,
            slide.slide_key
        );
        this.loadingStart = Date.now();
        const seq = this.mountSeq;
        this.scheduleSelectionTimeout(
            seq,
            'Slide viewer did not finish loading. Try another slide.'
        );
        await this.mountOSD(slide, seq, true);
    }

    cancelSlideSelection(): void {
        this.cancelActiveMount();
    }

    restoreCurrentViewportFromHash(): void {
        const slide = this.host.getSelectedSlide();
        if (!slide || !this.mountedViewer || !this.openSeadragon) return;

        restoreOrHomeViewport({
            osdViewer: this.mountedViewer,
            hashState: getWsiViewerRuntime().urlState.read(),
            selectedSlideId: slide.slide_key,
            openSeadragon: this.openSeadragon,
            meta: this.host.getSelectedMeta(),
        });
        this.writeHashState();
    }

    clearSelectedSlide(): void {
        this.mountSeq++;
        this.nativeTileReadySeq = null;
        this.nativeTileDrawnSeq = null;
        this.clearThumbnailPreview();
        this.cancelWsiTokenRefresh();
        if (this.spinnerTimer !== null) {
            clearTimeout(this.spinnerTimer);
            this.spinnerTimer = null;
        }
        if (this.osdOpenTimer !== null) {
            clearTimeout(this.osdOpenTimer);
            this.osdOpenTimer = null;
        }
        if (this.selectionTimeoutTimer !== null) {
            clearTimeout(this.selectionTimeoutTimer);
            this.selectionTimeoutTimer = null;
        }
        if (this.tileReadyTimer !== null) {
            clearTimeout(this.tileReadyTimer);
            this.tileReadyTimer = null;
        }
        this.destroyViewer();
        this.host.clearSelectedSlide();
        getWsiViewerRuntime().urlState.clear();
    }

    goToCoordinates() {
        if (!this.mountedViewer) {
            return;
        }
        const coords = this.host.getCoordInputs();
        const clamped = clampImageCoordinates(
            coords.x,
            coords.y,
            this.host.getSelectedMeta()?.dimensions
        );
        if (!clamped) {
            return;
        }
        this.host.setCoordInputs(String(clamped.x), String(clamped.y));
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
                patientId: this.host.getPatientId(),
                slideId: this.host.getSelectedSlide()?.slide_key,
                x: Math.round(center.x),
                y: Math.round(center.y),
            });
            downloadCanvasAsJpeg(canvas, filename);
        } catch (_) {
            // canvas tainted or not ready
        }
    }

    async copyViewLink() {
        const { urlState } = getWsiViewerRuntime();
        const state = buildWsiViewState({
            selectedSlideId: this.host.getSelectedSlide()?.slide_key,
            osdViewer: this.mountedViewer,
        });
        const url = state ? urlState.write(state) : urlState.currentUrl();
        await copyCurrentUrlToClipboard(url);
    }

    private scheduleSelectionTimeout(seq: number, errorMessage: string) {
        if (this.selectionTimeoutTimer !== null) {
            clearTimeout(this.selectionTimeoutTimer);
        }
        this.selectionTimeoutTimer = setTimeout(() => {
            if (seq !== this.mountSeq) {
                return;
            }
            this.selectionTimeoutTimer = null;
            this.host.setError(errorMessage);
            this.clearThumbnailPreview();
            this.host.setSpinnerVisible(false);
            this.host.setTilesReady(true);
            this.finishInitialSlideLoad(
                this.initialSlideLoadTrace?.loadSeq ?? this.hierarchyLoadSeq,
                'selection_timeout'
            );
        }, WSI_SELECTION_TIMEOUT_MS);
    }

    private hideSpinnerForMount(seq: number) {
        if (seq !== this.mountSeq) return;
        if (this.tileReadyTimer !== null) {
            clearTimeout(this.tileReadyTimer);
            this.tileReadyTimer = null;
        }
        if (this.spinnerTimer !== null) {
            clearTimeout(this.spinnerTimer);
            this.spinnerTimer = null;
        }
        this.host.setSpinnerVisible(false);
        this.host.setTilesReady(true);
        this.host.setError(null);
        promoteOsdImageLoaderLimit(this.osdViewer);
        if (this.osdOpenTimer !== null) {
            clearTimeout(this.osdOpenTimer);
            this.osdOpenTimer = null;
        }
        this.ensureMouseTrackerForReadyViewer(seq);
        const selectedSlideId = this.host.getSelectedSlide()?.slide_key;
        if (
            selectedSlideId &&
            selectedSlideId === this.initialSlideKey &&
            this.initialSlideLoadTrace
        ) {
            this.recordInitialSlideStage(
                this.initialSlideLoadTrace.loadSeq,
                'firstTileReadyAt',
                'first-tile-ready',
                selectedSlideId
            );
            this.finishInitialSlideLoad(
                this.initialSlideLoadTrace.loadSeq,
                'success'
            );
        }
        this.startBackgroundWorkIfReady(seq);
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
            onCursorMove: (x, y) => this.host.updateCursorPos(x, y),
            onCursorExit: () => this.host.clearCursorPos(),
        });
    }

    private handleOsdOpen(
        seq: number,
        slide: Slide,
        restoreHashViewport: boolean
    ) {
        if (seq !== this.mountSeq) return;
        if (this.osdOpenTimer !== null) {
            clearTimeout(this.osdOpenTimer);
            this.osdOpenTimer = null;
        }
        if (this.selectionTimeoutTimer !== null) {
            clearTimeout(this.selectionTimeoutTimer);
            this.selectionTimeoutTimer = null;
        }
        this.host.setViewerReady(true);
        if (
            slide.slide_key === this.initialSlideKey &&
            this.initialSlideLoadTrace
        ) {
            this.recordInitialSlideStage(
                this.initialSlideLoadTrace.loadSeq,
                'osdOpenAt',
                'osd-open',
                slide.slide_key
            );
        }
        const hashState = restoreHashViewport
            ? getWsiViewerRuntime().urlState.read()
            : null;
        try {
            restoreOrHomeViewport({
                osdViewer: this.osdViewer,
                hashState,
                selectedSlideId: slide.slide_key,
                openSeadragon: this.openSeadragon,
                meta: this.host.getSelectedMeta(),
            });
            this.writeHashState();
        } catch (_) {
            // viewport not ready
        }
        this.addSlideHandler('animation-finish', () => {
            this.writeHashState();
        });
        this.tileFailureCount = 0;
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
            this.tileReadyTimer = null;
            if (this.spinnerTimer !== null) {
                clearTimeout(this.spinnerTimer);
                this.spinnerTimer = null;
            }
            this.host.setError(
                'Slide tiles did not load. The slide server may be unavailable.'
            );
            this.clearThumbnailPreview();
            this.host.setSpinnerVisible(false);
            this.host.setTilesReady(true);
            this.finishInitialSlideLoad(
                this.initialSlideLoadTrace?.loadSeq ?? this.hierarchyLoadSeq,
                'tile_timeout'
            );
        }, WSI_TILE_READY_TIMEOUT_MS);
        let didMarkNativeTileReady = false;
        let didMarkNativeTileDrawn = false;
        const markNativeTileReady = () => {
            if (didMarkNativeTileReady) return;
            didMarkNativeTileReady = true;
            this.nativeTileReadySeq = seq;
            const hideSpinner = () => this.hideSpinnerForMount(seq);
            if (
                Date.now() - this.loadingStart >=
                WsiViewerController.MIN_SPINNER_MS
            ) {
                hideSpinner();
                return;
            }
            this.spinnerTimer = scheduleOsdSpinnerHide({
                existingTimer: this.spinnerTimer,
                hideSpinner,
                loadingStart: this.loadingStart,
                minimumSpinnerMs: WsiViewerController.MIN_SPINNER_MS,
            });
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
        this.spinnerTimer = scheduleOsdSpinnerFallback({
            existingTimer: this.spinnerTimer,
            hideSpinner: () => {
                if (seq !== this.mountSeq || didMarkNativeTileReady) return;
                this.spinnerTimer = null;
                this.host.setSpinnerVisible(false);
            },
            fallbackMs: OSD_SPINNER_FALLBACK_MS,
        });
        // OpenSeadragon rejects tile-drawn for WebGL. Use its public drawer
        // type instead of a constructor name, which is minified in production.
        const drawerType = this.osdViewer.drawer?.getType?.();
        if (drawerType !== 'webgl') {
            try {
                this.addSlideHandler('tile-drawn', markNativeTileDrawn, true);
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
        if (this.osdOpenTimer !== null) {
            clearTimeout(this.osdOpenTimer);
            this.osdOpenTimer = null;
        }
        if (this.selectionTimeoutTimer !== null) {
            clearTimeout(this.selectionTimeoutTimer);
            this.selectionTimeoutTimer = null;
        }
        // eslint-disable-next-line no-console
        console.error('[WSIViewer] OSD open-failed', event);
        this.host.setError(
            `OSD open failed: ${event?.message ?? JSON.stringify(event)}`
        );
        this.clearThumbnailPreview();
        this.host.setViewerReady(false);
        this.host.setSpinnerVisible(false);
        this.host.setTilesReady(true);
        this.finishInitialSlideLoad(
            this.initialSlideLoadTrace?.loadSeq ?? this.hierarchyLoadSeq,
            'osd_open_failed'
        );
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private handleOsdTileLoadFailed(seq: number, event: any) {
        // eslint-disable-next-line no-console
        console.warn('[WSIViewer] tile-load-failed', event?.tile?.url);
        if (seq !== this.mountSeq) return;
        if (
            typeof event?.tries === 'number' &&
            event.tries <= OSD_TILE_RETRY_MAX
        ) {
            return;
        }
        const tileKey =
            event?.tile?.getUrl?.() ||
            event?.tile?.url ||
            `tile-failure-${this.tileFailureCount + 1}`;
        if (this.terminalTileFailures.has(tileKey)) return;
        this.terminalTileFailures.add(tileKey);
        this.tileFailureCount = this.terminalTileFailures.size;
        if (this.tileFailureCount < 3) return;
        if (this.osdOpenTimer !== null) {
            clearTimeout(this.osdOpenTimer);
            this.osdOpenTimer = null;
        }
        if (this.selectionTimeoutTimer !== null) {
            clearTimeout(this.selectionTimeoutTimer);
            this.selectionTimeoutTimer = null;
        }
        if (this.tileReadyTimer !== null) {
            clearTimeout(this.tileReadyTimer);
            this.tileReadyTimer = null;
        }
        this.host.setError(
            'Slide tiles could not be loaded. The slide server may be unavailable.'
        );
        this.clearThumbnailPreview();
        this.host.setSpinnerVisible(false);
        this.host.setTilesReady(true);
        this.finishInitialSlideLoad(
            this.initialSlideLoadTrace?.loadSeq ?? this.hierarchyLoadSeq,
            'tile_failed'
        );
    }

    private async mountOSD(
        slide: Slide,
        seq: number,
        restoreHashViewport = true
    ) {
        const openSeadragonPromise = this.primeOpenSeadragonLoad();
        const studyId = this.host.getProps().studyId;
        const accessPromise = studyId
            ? getWsiSlideAccess(
                  studyId,
                  slide.slide_key,
                  false,
                  this.host.getProps().authScope
              )
            : null;
        if (studyId && accessPromise) {
            // The access request is shared with metadata loading. Starting
            // the published-thumbnail fetch here lets it run while OSD and
            // slide metadata initialize.
            this.startThumbnailPreview(slide.slide_key, seq, accessPromise);
        }
        let meta: TileMetadata;
        try {
            meta = await this.fetchSlideMetadata(slide.slide_key);
        } catch (err) {
            if (seq !== this.mountSeq) return;
            // eslint-disable-next-line no-console
            console.error('[WSIViewer] metadata fetch failed', err);
            this.host.setError(`Failed to load slide metadata: ${err}`);
            this.clearThumbnailPreview();
            if (this.selectionTimeoutTimer !== null) {
                clearTimeout(this.selectionTimeoutTimer);
                this.selectionTimeoutTimer = null;
            }
            // The error overlay replaces the spinner and exposes Retry.
            // Mark the attempted load as finished so a failed metadata
            // request cannot leave the viewer in a perpetual loading state.
            this.host.setSpinnerVisible(false);
            this.host.setTilesReady(true);
            this.finishInitialSlideLoad(
                this.initialSlideLoadTrace?.loadSeq ?? this.hierarchyLoadSeq,
                'metadata_failed'
            );
            return;
        }

        if (seq !== this.mountSeq) return;
        this.host.setSelectedMeta(meta);
        if (
            slide.slide_key === this.initialSlideKey &&
            this.initialSlideLoadTrace
        ) {
            this.recordInitialSlideStage(
                this.initialSlideLoadTrace.loadSeq,
                'metadataLoadedAt',
                'metadata-loaded',
                slide.slide_key
            );
        }

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
            if (!studyId || !accessPromise) {
                throw new Error('WSI viewer requires a study ID');
            }
            const access = await accessPromise;
            if (seq !== this.mountSeq) return;
            // Reuse needs an idle viewer: tile requests of the previous slide
            // still in flight would hold loader slots ahead of this slide's
            // cold open. A busy viewer is rebuilt, as before.
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
                        accessToken: access.accessToken,
                    });
            } else {
                this.destroyViewer();
                this.osdViewer = openSeadragon(
                    buildOsdOptions({
                        element: containerEl,
                        navId: this.navId,
                        meta,
                        baseUrl: this.host.getTileServerBase(),
                        accessToken: access.accessToken,
                        prefixUrl: getWsiViewerRuntime().osdPrefixUrl,
                    })
                );
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
            this.scheduleWsiTokenRefresh(
                studyId,
                slide.slide_key,
                seq,
                access.expiresAt || Date.now() + access.expiresIn * 1000
            );
        } catch (err) {
            if (seq !== this.mountSeq) return;
            // eslint-disable-next-line no-console
            console.error('[WSIViewer] OSD init error:', err);
            this.host.setError(`OSD init error: ${err}`);
            this.clearThumbnailPreview();
            if (this.selectionTimeoutTimer !== null) {
                clearTimeout(this.selectionTimeoutTimer);
                this.selectionTimeoutTimer = null;
            }
            this.host.setViewerReady(false);
            this.host.setSpinnerVisible(false);
            this.host.setTilesReady(true);
            this.finishInitialSlideLoad(
                this.initialSlideLoadTrace?.loadSeq ?? this.hierarchyLoadSeq,
                'osd_init_failed'
            );
            return;
        }

        if (seq !== this.mountSeq) {
            this.destroyViewer();
            return;
        }

        if (this.osdOpenTimer !== null) {
            clearTimeout(this.osdOpenTimer);
        }
        this.osdOpenTimer = setTimeout(() => {
            if (seq !== this.mountSeq) {
                return;
            }
            this.osdOpenTimer = null;
            this.host.setError(
                'Slide viewer did not finish opening. Try another slide.'
            );
            this.clearThumbnailPreview();
            this.host.setSpinnerVisible(false);
            this.host.setTilesReady(true);
            this.finishInitialSlideLoad(
                this.initialSlideLoadTrace?.loadSeq ?? this.hierarchyLoadSeq,
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
