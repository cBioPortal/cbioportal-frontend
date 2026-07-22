import { matchesWsiStainFilter } from './wsiSlideUtils';
import {
    fetchPatientBootstrapReadOnly,
    hasCachedPatientBootstrap,
    hydratePatientBootstrapCaches,
    isWsiBootstrapEnabled,
} from './wsiBootstrapFetch';
import {
    buildWsiHash,
    buildWsiDownloadFilename,
    clampImageCoordinates,
    clearWsiHashFromCurrentUrl,
    copyCurrentUrlToClipboard,
    downloadCanvasAsJpeg,
    readWsiHashState,
    scheduleHashStateWrite,
    writeWsiHashToCurrentUrl,
} from './wsiViewStateUtils';
import {
    buildOsdOptions,
    createOsdMouseTracker,
    destroyOsdHandles,
    ensureNavigator,
    offsetNavigatorElement,
    registerOsdLifecycleHandlers,
    restoreOrHomeViewport,
    scheduleOsdSpinnerFallback,
    scheduleOsdSpinnerHide,
} from './wsiOsdUtils';
import { getWsiAccessToken, isWsiAuthEnabled } from './wsiAuth';
import { ensureWsiPreconnect } from './wsiNetworkWarmup';
import { hasPreloadedOpenSeadragon } from './wsiOpenSeadragonLoader';
import {
    fetchPatientHierarchy,
    hasCachedPatientHierarchy,
} from './wsiHierarchyFetchCache';
import {
    fetchSlideMetadataCached,
    fetchSlideMetadataCachedReadOnly,
    hasCachedSlideMetadata,
} from './wsiMetadataFetchCache';
import {} from './wsiSlideUtils';
import {
    PatientBootstrapResponse,
    PatientHierarchy,
    PathologySlideFilter,
    Sample,
    Slide,
    TileMetadata,
} from './wsiViewerTypes';

export interface WsiInitialSlideLoadPerformance {
    loadSeq: number;
    slideId: string;
    patientId?: string;
    studyId?: string;
    openSeadragonWarmHit: boolean;
    hierarchyCacheHit: boolean;
    metadataCacheHit: boolean;
    hierarchySource: 'shared-cache' | 'network' | 'bootstrap';
    metadataSource: 'viewer-cache' | 'shared-cache' | 'network' | 'bootstrap';
    loadPath: 'legacy' | 'bootstrap';
    bootstrapStatus:
        | 'disabled'
        | 'success'
        | 'failed'
        | 'missing-initial'
        | 'skipped-cache-hit'
        | 'filtered-out';
    bootstrapFallbackReason?: string;
    hierarchyMs: number;
    metadataMs: number;
    osdOpenMs: number;
    firstTileReadyMs: number;
}

export interface WsiViewerControllerHost {
    getProps(): {
        url: string;
        studyId?: string;
        pathologyFilter?: PathologySlideFilter;
    };
    resetHierarchyLoadState(): void;
    setHierarchy(
        data: PatientHierarchy | null,
        sourceHierarchy?: PatientHierarchy | null
    ): void;
    setLoading(loading: boolean): void;
    setError(error: string | null): void;
    getHierarchy(): PatientHierarchy | null;
    getServableSlides(): Array<{ slide: Slide; sample: Sample }>;
    getStainFilter(): 'all' | 'hne' | 'ihc';
    getTileServerBase(): string;
    getTileServerOrigin(): string;
    getCbioApiBase(): string;
    getViewerContainerElement(): HTMLDivElement | null;
    chooseInitialServableSlide(
        allSlides: Array<{ slide: Slide; sample: Sample }>
    ): { slide: Slide; sample: Sample } | undefined;
    beginSlideSelection(slide: Slide, sample: Sample): void;
    setSelectedMeta(meta: TileMetadata | null): void;
    setViewerReady(viewerReady: boolean): void;
    setSpinnerVisible(spinnerVisible: boolean): void;
    setTilesReady(tilesReady: boolean): void;
    getSelectedSlide(): Slide | null;
    getSelectedSample(): Sample | null;
    getSelectedMeta(): TileMetadata | null;
    clearSelectedSlide(): void;
    getPatientId(): string | undefined;
    setCoordInputs(x: string, y: string): void;
    getCoordInputs(): { x: string; y: string };
    updateCursorPos(x: number, y: number): void;
    clearCursorPos(): void;
    runSampleEnrichment(
        base: string,
        studyId: string,
        patientId: string,
        sampleIds: string[],
        shouldContinue: () => boolean
    ): Promise<void>;
    reportInitialSlideLoadPerformance(
        metric: WsiInitialSlideLoadPerformance
    ): void;
}

export class WsiViewerController {
    private static readonly METADATA_PREFETCH_CONCURRENCY = 3;
    private static readonly METADATA_PREFETCH_BATCH_DELAY_MS = 150;
    private metaCache = new Map<string, TileMetadata>();
    private metaRequestCache = new Map<string, Promise<TileMetadata>>();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private osdViewer: any = null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private osdMouseTracker: any = null;
    private mountSeq = 0;
    private loadingStart = 0;
    private spinnerTimer: ReturnType<typeof setTimeout> | null = null;
    private tileReadyTimer: ReturnType<typeof setTimeout> | null = null;
    private tileFailureCount = 0;
    private writeHashTimer: ReturnType<typeof setTimeout> | null = null;
    private hierarchyLoadSeq = 0;
    private hierarchyAbortController: AbortController | null = null;
    private backgroundWorkStarted = false;
    private backgroundWorkScheduled = false;
    private backgroundWorkIdleHandle: number | null = null;
    private backgroundWorkTimer: ReturnType<typeof setTimeout> | null = null;
    private sampleEnrichmentStarted = false;
    private sampleEnrichmentScheduled = false;
    private sampleEnrichmentIdleHandle: number | null = null;
    private sampleEnrichmentTimer: ReturnType<typeof setTimeout> | null = null;
    private navigatorScheduled = false;
    private navigatorIdleHandle: number | null = null;
    private navigatorTimer: ReturnType<typeof setTimeout> | null = null;
    private restoreHashViewportForNextSelection = false;
    private initialSlideImageId: string | undefined = undefined;
    private initialSlideLoadTrace: {
        loadSeq: number;
        startedAt: number;
        slideId?: string;
        openSeadragonWarmHit: boolean;
        hierarchyCacheHit: boolean;
        metadataCacheHit: boolean;
        hierarchySource: 'shared-cache' | 'network' | 'bootstrap';
        metadataSource:
            | 'viewer-cache'
            | 'shared-cache'
            | 'network'
            | 'bootstrap';
        loadPath: 'legacy' | 'bootstrap';
        bootstrapStatus:
            | 'disabled'
            | 'success'
            | 'failed'
            | 'missing-initial'
            | 'skipped-cache-hit'
            | 'filtered-out';
        bootstrapFallbackReason?: string;
        hierarchyLoadedAt?: number;
        metadataLoadedAt?: number;
        osdOpenAt?: number;
        firstTileReadyAt?: number;
        reported: boolean;
    } | null = null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private openSeadragon: any | null = null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private openSeadragonPromise: Promise<any> | null = null;
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

    dispose() {
        this.mountSeq++;
        if (this.writeHashTimer !== null) {
            clearTimeout(this.writeHashTimer);
            this.writeHashTimer = null;
        }
        if (this.tileReadyTimer !== null) {
            clearTimeout(this.tileReadyTimer);
            this.tileReadyTimer = null;
        }
        this.metaRequestCache.clear();
        this.hierarchyAbortController?.abort();
        this.hierarchyAbortController = null;
        this.cancelBackgroundWorkSchedule();
        this.cancelSampleEnrichmentSchedule();
        this.cancelNavigatorSchedule();
        this.destroyViewer();
        clearWsiHashFromCurrentUrl();
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

    private cancelSampleEnrichmentSchedule() {
        if (
            this.sampleEnrichmentIdleHandle !== null &&
            typeof window !== 'undefined' &&
            typeof window.cancelIdleCallback === 'function'
        ) {
            window.cancelIdleCallback(this.sampleEnrichmentIdleHandle);
        }
        this.sampleEnrichmentIdleHandle = null;
        if (this.sampleEnrichmentTimer !== null) {
            clearTimeout(this.sampleEnrichmentTimer);
            this.sampleEnrichmentTimer = null;
        }
        this.sampleEnrichmentScheduled = false;
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
            loadPath: 'legacy',
            bootstrapStatus: 'disabled',
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
            | 'firstTileReadyAt',
        performanceStage:
            | 'hierarchy-loaded'
            | 'metadata-loaded'
            | 'osd-open'
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
            trace.metadataLoadedAt == null ||
            trace.osdOpenAt == null ||
            trace.firstTileReadyAt == null
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
        this.measurePerformanceStage(
            loadSeq,
            'metadata-ms',
            'start',
            'metadata-loaded'
        );
        this.measurePerformanceStage(
            loadSeq,
            'osd-open-ms',
            'start',
            'osd-open'
        );
        this.measurePerformanceStage(
            loadSeq,
            'first-tile-ready-ms',
            'start',
            'first-tile-ready'
        );
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
            loadPath: trace.loadPath,
            bootstrapStatus: trace.bootstrapStatus,
            bootstrapFallbackReason: trace.bootstrapFallbackReason,
            hierarchyMs: trace.hierarchyLoadedAt - trace.startedAt,
            metadataMs: trace.metadataLoadedAt - trace.startedAt,
            osdOpenMs: trace.osdOpenAt - trace.startedAt,
            firstTileReadyMs: trace.firstTileReadyAt - trace.startedAt,
        });
    }

    private async tryLoadBootstrap(
        signal: AbortSignal
    ): Promise<PatientBootstrapResponse | null> {
        if (!isWsiBootstrapEnabled()) {
            if (this.initialSlideLoadTrace) {
                this.initialSlideLoadTrace.bootstrapStatus = 'disabled';
            }
            return null;
        }

        const props = this.host.getProps();

        try {
            const payload = await fetchPatientBootstrapReadOnly(
                {
                    hierarchyUrl: props.url,
                },
                signal
            );
            hydratePatientBootstrapCaches(
                props.url,
                this.host.getTileServerBase(),
                payload
            );
            if (this.initialSlideLoadTrace) {
                this.initialSlideLoadTrace.loadPath = 'bootstrap';
                this.initialSlideLoadTrace.bootstrapStatus =
                    payload.initial == null ? 'missing-initial' : 'success';
                this.initialSlideLoadTrace.hierarchySource = 'bootstrap';
                if (payload.initial?.image_id) {
                    this.initialSlideLoadTrace.metadataSource = 'bootstrap';
                }
            }
            return payload;
        } catch (error) {
            if (this.initialSlideLoadTrace) {
                this.initialSlideLoadTrace.bootstrapStatus = 'failed';
                this.initialSlideLoadTrace.bootstrapFallbackReason =
                    error instanceof Error ? error.message : String(error);
            }
            return null;
        }
    }

    private primeOpenSeadragonLoad() {
        if (this.openSeadragon) {
            return Promise.resolve(this.openSeadragon);
        }
        if (this.openSeadragonPromise) {
            return this.openSeadragonPromise;
        }

        this.openSeadragonPromise = this.loadOpenSeadragon()
            .then(openSeadragon => {
                this.openSeadragon = openSeadragon;
                return openSeadragon;
            })
            .catch(error => {
                this.openSeadragonPromise = null;
                throw error;
            });

        return this.openSeadragonPromise;
    }

    private writeHashState() {
        this.writeHashTimer = scheduleHashStateWrite({
            timer: this.writeHashTimer,
            selectedSlideId: this.host.getSelectedSlide()?.image_id,
            osdViewer: this.osdViewer,
        });
    }

    private destroyViewer() {
        destroyOsdHandles({
            osdMouseTracker: this.osdMouseTracker,
            osdViewer: this.osdViewer,
            clearCursorPos: () => this.host.clearCursorPos(),
        });
        this.osdMouseTracker = null;
        this.osdViewer = null;
    }

    private cancelActiveMount(): void {
        this.mountSeq++;
        if (this.spinnerTimer !== null) {
            clearTimeout(this.spinnerTimer);
            this.spinnerTimer = null;
        }
        if (this.tileReadyTimer !== null) {
            clearTimeout(this.tileReadyTimer);
            this.tileReadyTimer = null;
        }
        this.destroyViewer();
    }

    async loadHierarchy(restoreHashViewport = true) {
        const loadSeq = ++this.hierarchyLoadSeq;
        this.hierarchyAbortController?.abort();
        const abortController = new AbortController();
        this.hierarchyAbortController = abortController;
        this.mountSeq++;
        this.metaCache.clear();
        this.metaRequestCache.clear();
        this.backgroundWorkStarted = false;
        this.backgroundWorkScheduled = false;
        this.sampleEnrichmentStarted = false;
        this.sampleEnrichmentScheduled = false;
        this.initialSlideImageId = undefined;
        this.cancelBackgroundWorkSchedule();
        this.cancelSampleEnrichmentSchedule();
        this.cancelNavigatorSchedule();
        this.startInitialSlideLoadTrace(loadSeq);
        if (this.initialSlideLoadTrace?.loadSeq === loadSeq) {
            this.initialSlideLoadTrace.openSeadragonWarmHit = hasPreloadedOpenSeadragon();
        }
        this.host.resetHierarchyLoadState();
        ensureWsiPreconnect(this.host.getTileServerOrigin());
        void this.primeOpenSeadragonLoad().catch(() => {});

        try {
            const hierarchyCacheHit = hasCachedPatientHierarchy(
                this.host.getProps().url
            );
            const bootstrapCacheHit = isWsiBootstrapEnabled()
                ? hasCachedPatientBootstrap({
                      hierarchyUrl: this.host.getProps().url,
                  })
                : false;
            const bootstrapPayload =
                isWsiBootstrapEnabled() && !hierarchyCacheHit
                    ? await this.tryLoadBootstrap(abortController.signal)
                    : null;
            if (this.initialSlideLoadTrace?.loadSeq === loadSeq) {
                this.initialSlideLoadTrace.hierarchyCacheHit =
                    hierarchyCacheHit || bootstrapCacheHit;
                if (
                    isWsiBootstrapEnabled() &&
                    hierarchyCacheHit &&
                    !bootstrapCacheHit
                ) {
                    this.initialSlideLoadTrace.bootstrapStatus =
                        'skipped-cache-hit';
                }
                if (bootstrapPayload == null) {
                    this.initialSlideLoadTrace.hierarchySource = hierarchyCacheHit
                        ? 'shared-cache'
                        : 'network';
                }
            }
            let data: PatientHierarchy =
                bootstrapPayload?.hierarchy ??
                (await fetchPatientHierarchy(
                    this.host.getProps().url,
                    abortController.signal
                ));
            if (
                loadSeq !== this.hierarchyLoadSeq ||
                abortController.signal.aborted
            ) {
                return;
            }

            const sourceHierarchy = data;
            this.host.setHierarchy(data, sourceHierarchy);
            this.host.setLoading(false);
            this.recordInitialSlideStage(
                loadSeq,
                'hierarchyLoadedAt',
                'hierarchy-loaded'
            );

            const allSlides = this.host.getServableSlides();
            const bootstrapInitial =
                bootstrapPayload?.initial?.image_id != null
                    ? allSlides.find(
                          entry =>
                              entry.slide.image_id ===
                              bootstrapPayload.initial!.image_id
                      )
                    : undefined;
            const first = this.host.chooseInitialServableSlide(allSlides);
            if (
                bootstrapPayload?.initial &&
                !bootstrapInitial &&
                this.initialSlideLoadTrace?.loadSeq === loadSeq
            ) {
                this.initialSlideLoadTrace.bootstrapStatus = 'filtered-out';
                this.initialSlideLoadTrace.bootstrapFallbackReason =
                    'bootstrap initial slide missing after frontend filtering';
                this.initialSlideLoadTrace.metadataCacheHit = false;
                this.initialSlideLoadTrace.metadataSource = 'network';
            } else if (
                first &&
                bootstrapPayload?.initial &&
                first.slide.image_id !== bootstrapPayload.initial.image_id &&
                this.initialSlideLoadTrace?.loadSeq === loadSeq
            ) {
                this.initialSlideLoadTrace.metadataCacheHit = false;
                this.initialSlideLoadTrace.metadataSource = 'network';
            }
            if (first) {
                this.restoreHashViewportForNextSelection = restoreHashViewport;
                this.initialSlideImageId = first.slide.image_id;
                this.setInitialSlideTraceSlide(loadSeq, first.slide.image_id);
                void this.fetchSlideMetadata(first.slide.image_id).catch(() => {
                    // Best-effort warmup; selectSlide will surface real errors.
                });
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

    private shouldContinueBackgroundWork(expectedLoadSeq: number): boolean {
        return (
            expectedLoadSeq === this.hierarchyLoadSeq &&
            this.host.getHierarchy() !== null
        );
    }

    private scheduleSampleEnrichment(expectedLoadSeq: number) {
        if (
            this.sampleEnrichmentStarted ||
            this.sampleEnrichmentScheduled ||
            !this.host.getProps().studyId
        ) {
            return;
        }

        const runSampleEnrichment = () => {
            this.sampleEnrichmentIdleHandle = null;
            this.sampleEnrichmentTimer = null;
            this.sampleEnrichmentScheduled = false;
            if (
                this.sampleEnrichmentStarted ||
                !this.shouldContinueBackgroundWork(expectedLoadSeq) ||
                !this.host.getProps().studyId
            ) {
                return;
            }

            this.sampleEnrichmentStarted = true;
            void this.enrichSamplesFromCbioportal(expectedLoadSeq);
        };

        this.sampleEnrichmentScheduled = true;
        if (
            typeof window !== 'undefined' &&
            typeof window.requestIdleCallback === 'function'
        ) {
            this.sampleEnrichmentIdleHandle = window.requestIdleCallback(
                runSampleEnrichment,
                { timeout: 4000 }
            );
            return;
        }

        this.sampleEnrichmentTimer = setTimeout(runSampleEnrichment, 1200);
    }

    private startBackgroundWorkIfReady(seq: number) {
        if (
            seq !== this.mountSeq ||
            this.backgroundWorkStarted ||
            this.backgroundWorkScheduled ||
            !this.initialSlideImageId
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
                !this.initialSlideImageId
            ) {
                return;
            }
            this.backgroundWorkStarted = true;
            void this.prefetchSlideMetadata(
                this.initialSlideImageId,
                expectedLoadSeq
            );
            this.scheduleSampleEnrichment(expectedLoadSeq);
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
            ensureNavigator({
                osdViewer: this.osdViewer,
                openSeadragon: this.openSeadragon,
                meta,
                baseUrl: this.host.getTileServerBase(),
                imageId: slide.image_id,
                studyId: this.host.getProps().studyId,
                accessToken: isWsiAuthEnabled()
                    ? await getWsiAccessToken(
                          this.host.getProps().studyId || ''
                      )
                    : undefined,
            });
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

    private fetchSlideMetadata(imageId: string): Promise<TileMetadata> {
        const cached = this.metaCache.get(imageId);
        if (cached) {
            if (
                imageId === this.initialSlideImageId &&
                this.initialSlideLoadTrace
            ) {
                this.initialSlideLoadTrace.metadataCacheHit = true;
                this.initialSlideLoadTrace.metadataSource = 'viewer-cache';
            }
            return Promise.resolve(cached);
        }
        const pending = this.metaRequestCache.get(imageId);
        if (pending) {
            return pending;
        }
        if (
            imageId === this.initialSlideImageId &&
            this.initialSlideLoadTrace &&
            hasCachedSlideMetadata(this.host.getTileServerBase(), imageId)
        ) {
            this.initialSlideLoadTrace.metadataCacheHit = true;
            if (this.initialSlideLoadTrace.metadataSource !== 'bootstrap') {
                this.initialSlideLoadTrace.metadataSource = 'shared-cache';
            }
        }
        const request = fetchSlideMetadataCachedReadOnly(
            this.host.getTileServerBase(),
            imageId,
            undefined,
            this.host.getProps().studyId
        )
            .then(meta => {
                this.metaCache.set(imageId, meta);
                this.metaRequestCache.delete(imageId);
                return meta;
            })
            .catch(error => {
                this.metaRequestCache.delete(imageId);
                throw error;
            });
        this.metaRequestCache.set(imageId, request);
        return request;
    }

    private async prefetchSlideMetadata(
        skipImageId?: string,
        expectedLoadSeq = this.hierarchyLoadSeq
    ) {
        const selectedSampleId = this.host.getSelectedSample()?.sample_id;
        const stainFilter = this.host.getStainFilter();
        const prioritizedSlides: Slide[] = [];
        const sameSampleOtherStain: Slide[] = [];
        const otherSampleMatchingStain: Slide[] = [];
        const otherSampleOtherStain: Slide[] = [];
        const queuedImageIds = new Set<string>();

        for (const entry of this.host.getServableSlides()) {
            if (
                entry.slide.image_id === skipImageId ||
                this.metaCache.has(entry.slide.image_id) ||
                queuedImageIds.has(entry.slide.image_id)
            ) {
                continue;
            }
            queuedImageIds.add(entry.slide.image_id);

            const sameSample = entry.sample.sample_id === selectedSampleId;
            const matchesStain = matchesWsiStainFilter(
                entry.slide,
                stainFilter
            );
            if (sameSample && matchesStain) {
                prioritizedSlides.push(entry.slide);
            } else if (sameSample) {
                sameSampleOtherStain.push(entry.slide);
            } else if (matchesStain) {
                otherSampleMatchingStain.push(entry.slide);
            } else {
                otherSampleOtherStain.push(entry.slide);
            }
        }

        prioritizedSlides.push(...sameSampleOtherStain);
        prioritizedSlides.push(...otherSampleMatchingStain);
        prioritizedSlides.push(...otherSampleOtherStain);

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
                        prioritizedSlides[batchIndex].image_id
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

    private async enrichSamplesFromCbioportal(
        expectedLoadSeq = this.hierarchyLoadSeq
    ) {
        if (!this.shouldContinueBackgroundWork(expectedLoadSeq)) return;
        const { studyId } = this.host.getProps();
        const hierarchy = this.host.getHierarchy();
        if (!studyId || !hierarchy?.samples.length) return;

        const base = this.host.getCbioApiBase();
        const sampleIds: string[] = [];
        for (let index = 0; index < hierarchy.samples.length; index += 1) {
            const sampleId = hierarchy.samples[index].sample_id;
            if (sampleId && sampleId !== 'UNMATCHED') {
                sampleIds.push(sampleId);
            }
        }
        if (!sampleIds.length) return;

        try {
            await this.host.runSampleEnrichment(
                base,
                studyId,
                hierarchy.patient_id,
                sampleIds,
                () => this.shouldContinueBackgroundWork(expectedLoadSeq)
            );
        } catch {
            // Silently fall back to tile-server data
        }
    }

    async selectSlide(
        slide: Slide,
        sample: Sample,
        restoreHashViewport = this.restoreHashViewportForNextSelection
    ): Promise<void> {
        if (
            this.host.getSelectedSlide()?.image_id === slide.image_id &&
            this.host.getSelectedSample()?.sample_id === sample.sample_id &&
            this.host.getSelectedMeta() != null &&
            this.osdViewer != null
        ) {
            return;
        }
        this.cancelActiveMount();
        this.restoreHashViewportForNextSelection = false;
        this.host.beginSlideSelection(slide, sample);
        this.loadingStart = Date.now();
        if (this.spinnerTimer !== null) {
            clearTimeout(this.spinnerTimer);
            this.spinnerTimer = null;
        }
        const seq = this.mountSeq;
        await this.mountOSD(slide, seq, restoreHashViewport);
    }

    async retrySelectedSlide(): Promise<void> {
        const slide = this.host.getSelectedSlide();
        const sample = this.host.getSelectedSample();
        if (!slide || !sample) return;

        this.cancelActiveMount();
        this.host.beginSlideSelection(slide, sample);
        this.loadingStart = Date.now();
        const seq = this.mountSeq;
        await this.mountOSD(slide, seq, true);
    }

    cancelSlideSelection(): void {
        this.cancelActiveMount();
    }

    restoreCurrentViewportFromHash(): void {
        const slide = this.host.getSelectedSlide();
        if (!slide || !this.osdViewer || !this.openSeadragon) return;

        restoreOrHomeViewport({
            osdViewer: this.osdViewer,
            hashState: readWsiHashState(),
            selectedSlideId: slide.image_id,
            openSeadragon: this.openSeadragon,
        });
    }

    clearSelectedSlide(): void {
        this.mountSeq++;
        if (this.spinnerTimer !== null) {
            clearTimeout(this.spinnerTimer);
            this.spinnerTimer = null;
        }
        if (this.tileReadyTimer !== null) {
            clearTimeout(this.tileReadyTimer);
            this.tileReadyTimer = null;
        }
        this.destroyViewer();
        this.host.clearSelectedSlide();
        clearWsiHashFromCurrentUrl();
    }

    goToCoordinates() {
        if (!this.osdViewer) {
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
            this.osdViewer?.drawer?.canvas ?? this.osdViewer?.canvas ?? null;
        if (!canvas) return;

        try {
            const viewport = this.osdViewer.viewport;
            const center = viewport.viewportToImageCoordinates(
                viewport.getCenter()
            );
            const filename = buildWsiDownloadFilename({
                patientId: this.host.getPatientId(),
                slideId: this.host.getSelectedSlide()?.image_id,
                x: Math.round(center.x),
                y: Math.round(center.y),
            });
            downloadCanvasAsJpeg(canvas, filename);
        } catch (_) {
            // canvas tainted or not ready
        }
    }

    async copyViewLink() {
        const hash = buildWsiHash({
            selectedSlideId: this.host.getSelectedSlide()?.image_id,
            osdViewer: this.osdViewer,
        });
        const url = hash
            ? writeWsiHashToCurrentUrl(hash)
            : window.location.href;
        await copyCurrentUrlToClipboard(url);
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
        this.ensureMouseTrackerForReadyViewer(seq);
        this.scheduleNavigatorIfReady(seq);
        const selectedSlideId = this.host.getSelectedSlide()?.image_id;
        if (
            selectedSlideId &&
            selectedSlideId === this.initialSlideImageId &&
            this.initialSlideLoadTrace
        ) {
            this.recordInitialSlideStage(
                this.initialSlideLoadTrace.loadSeq,
                'firstTileReadyAt',
                'first-tile-ready',
                selectedSlideId
            );
            this.maybeReportInitialSlideLoadPerformance(
                this.initialSlideLoadTrace.loadSeq
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
        this.host.setViewerReady(true);
        if (
            slide.image_id === this.initialSlideImageId &&
            this.initialSlideLoadTrace
        ) {
            this.recordInitialSlideStage(
                this.initialSlideLoadTrace.loadSeq,
                'osdOpenAt',
                'osd-open',
                slide.image_id
            );
        }
        const hashState = restoreHashViewport ? readWsiHashState() : null;
        try {
            restoreOrHomeViewport({
                osdViewer: this.osdViewer,
                hashState,
                selectedSlideId: slide.image_id,
                openSeadragon: this.openSeadragon,
            });
            this.writeHashState();
        } catch (_) {
            // viewport not ready
        }
        this.osdViewer.addHandler('animation-finish', () => {
            this.writeHashState();
        });
        this.tileFailureCount = 0;
        this.tileReadyTimer = setTimeout(() => {
            if (seq !== this.mountSeq) return;
            this.host.setError(
                'Slide tiles did not load. The slide server may be unavailable.'
            );
            this.host.setSpinnerVisible(false);
            this.host.setTilesReady(true);
        }, 15_000);
        let didMarkTilesReady = false;
        const hideSpinner = () => {
            if (didMarkTilesReady) return;
            didMarkTilesReady = true;
            this.hideSpinnerForMount(seq);
        };
        this.spinnerTimer = scheduleOsdSpinnerFallback({
            existingTimer: this.spinnerTimer,
            hideSpinner,
        });
        const markTilesReadyAfterMinimumSpinner = () => {
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
        this.osdViewer.addOnceHandler(
            'tile-loaded',
            markTilesReadyAfterMinimumSpinner
        );
        this.osdViewer.addOnceHandler(
            'tile-drawn',
            markTilesReadyAfterMinimumSpinner
        );
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private handleOsdOpenFailed(seq: number, event: any) {
        if (seq !== this.mountSeq) return;
        // eslint-disable-next-line no-console
        console.error('[WSIViewer] OSD open-failed', event);
        this.host.setError(
            `OSD open failed: ${event?.message ?? JSON.stringify(event)}`
        );
        this.host.setViewerReady(false);
        this.host.setSpinnerVisible(false);
        this.host.setTilesReady(true);
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private handleOsdTileLoadFailed(seq: number, event: any) {
        // eslint-disable-next-line no-console
        console.warn('[WSIViewer] tile-load-failed', event?.tile?.url);
        if (seq !== this.mountSeq) return;
        this.tileFailureCount += 1;
        if (this.tileFailureCount < 3) return;
        this.host.setError(
            'Slide tiles could not be loaded. The slide server may be unavailable.'
        );
        this.host.setSpinnerVisible(false);
        this.host.setTilesReady(true);
    }

    private async mountOSD(
        slide: Slide,
        seq: number,
        restoreHashViewport = true
    ) {
        const openSeadragonPromise = this.primeOpenSeadragonLoad();
        let meta = this.metaCache.get(slide.image_id);
        if (!meta) {
            try {
                meta = await this.fetchSlideMetadata(slide.image_id);
            } catch (err) {
                if (seq !== this.mountSeq) return;
                // eslint-disable-next-line no-console
                console.error('[WSIViewer] metadata fetch failed', err);
                this.host.setError(`Failed to load slide metadata: ${err}`);
                return;
            }
        }

        if (seq !== this.mountSeq) return;
        this.host.setSelectedMeta(meta);
        if (
            slide.image_id === this.initialSlideImageId &&
            this.initialSlideLoadTrace
        ) {
            this.recordInitialSlideStage(
                this.initialSlideLoadTrace.loadSeq,
                'metadataLoadedAt',
                'metadata-loaded',
                slide.image_id
            );
        }

        await new Promise<void>(resolve =>
            requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
        );
        if (seq !== this.mountSeq) return;

        const containerEl = this.host.getViewerContainerElement();
        if (!containerEl) return;

        this.destroyViewer();
        try {
            const openSeadragon = await openSeadragonPromise;
            const accessToken = isWsiAuthEnabled()
                ? await getWsiAccessToken(this.host.getProps().studyId || '')
                : undefined;
            if (seq !== this.mountSeq) return;
            this.osdViewer = openSeadragon(
                buildOsdOptions({
                    element: containerEl,
                    navId: this.navId,
                    meta,
                    baseUrl: this.host.getTileServerBase(),
                    imageId: slide.image_id,
                    accessToken,
                    studyId: this.host.getProps().studyId,
                })
            );
        } catch (err) {
            if (seq !== this.mountSeq) return;
            // eslint-disable-next-line no-console
            console.error('[WSIViewer] OSD init error:', err);
            this.host.setError(`OSD init error: ${err}`);
            return;
        }

        if (seq !== this.mountSeq) {
            this.destroyViewer();
            return;
        }

        offsetNavigatorElement(this.osdViewer);
        registerOsdLifecycleHandlers({
            osdViewer: this.osdViewer,
            onOpen: () => this.handleOsdOpen(seq, slide, restoreHashViewport),
            onOpenFailed: e => this.handleOsdOpenFailed(seq, e),
            onTileLoadFailed: e => this.handleOsdTileLoadFailed(seq, e),
        });
    }
}
