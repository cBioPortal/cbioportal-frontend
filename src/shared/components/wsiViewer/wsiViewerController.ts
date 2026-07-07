import { matchesWsiStainFilter } from './wsiSlideUtils';
import {
    buildWsiDownloadFilename,
    clampImageCoordinates,
    copyCurrentUrlToClipboard,
    downloadCanvasAsJpeg,
    readWsiHashState,
    scheduleHashStateWrite,
} from './wsiViewStateUtils';
import {
    buildOsdOptions,
    createOsdMouseTracker,
    destroyOsdHandles,
    offsetNavigatorElement,
    registerOsdLifecycleHandlers,
    restoreOrHomeViewport,
    scheduleOsdSpinnerFallback,
    scheduleOsdSpinnerHide,
} from './wsiOsdUtils';
import {
    PatientHierarchy,
    Sample,
    Slide,
    TileMetadata,
} from './wsiViewerTypes';
import { SampleIdentifier } from './wsiDataMergeUtils';

export interface WsiViewerControllerHost {
    getProps(): {
        url: string;
        studyId?: string;
        allowedSampleIds?: string[];
        preferredSampleId?: string;
    };
    resetHierarchyLoadState(): void;
    setHierarchy(data: PatientHierarchy | null): void;
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
    getSelectedMeta(): TileMetadata | null;
    getPatientId(): string | undefined;
    setCoordInputs(x: string, y: string): void;
    getCoordInputs(): { x: string; y: string };
    updateCursorPos(x: number, y: number): void;
    clearCursorPos(): void;
    buildSampleIdentifiers(studyId: string): SampleIdentifier[];
    triggerPostMutationAnnotationFetches(base: string, studyId: string): void;
    triggerPostCnaAnnotationFetches(): void;
    triggerPostStructuralVariantAnnotationFetches(): void;
    fetchAndMergeSampleTimepoints(
        base: string,
        studyId: string,
        patientId: string
    ): Promise<void>;
    fetchAndMergeClinicalData(
        base: string,
        studyId: string,
        sampleIdentifiers: SampleIdentifier[]
    ): Promise<void>;
    fetchAndMergeMutations(
        base: string,
        studyId: string,
        sampleIdentifiers: SampleIdentifier[]
    ): Promise<void>;
    fetchAndMergeCNA(
        base: string,
        studyId: string,
        sampleIdentifiers: SampleIdentifier[]
    ): Promise<void>;
    fetchAndMergeStructuralVariants(
        base: string,
        studyId: string,
        sampleIdentifiers: SampleIdentifier[]
    ): Promise<void>;
}

export class WsiViewerController {
    private metaCache = new Map<string, TileMetadata>();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private osdViewer: any = null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private osdMouseTracker: any = null;
    private mountSeq = 0;
    private loadingStart = 0;
    private spinnerTimer: ReturnType<typeof setTimeout> | null = null;
    private selectSlideDebounce: ReturnType<typeof setTimeout> | null = null;
    private pendingSelectSlideResolve: (() => void) | null = null;
    private writeHashTimer: ReturnType<typeof setTimeout> | null = null;
    private hierarchyLoadSeq = 0;
    private hierarchyAbortController: AbortController | null = null;
    private static readonly MIN_SPINNER_MS = 250;
    private static readonly SELECT_DEBOUNCE_MS = 150;

    public readonly navId = `wsi-nav-${Math.random()
        .toString(36)
        .slice(2, 9)}`;

    constructor(
        private readonly host: WsiViewerControllerHost,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        private readonly openSeadragon: any
    ) {}

    forceResize() {
        this.osdViewer?.forceResize?.();
    }

    dispose() {
        this.mountSeq++;
        this.cancelPendingSlideSelection();
        if (this.writeHashTimer !== null) {
            clearTimeout(this.writeHashTimer);
            this.writeHashTimer = null;
        }
        this.hierarchyAbortController?.abort();
        this.hierarchyAbortController = null;
        this.destroyViewer();
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

    async loadHierarchy() {
        const loadSeq = ++this.hierarchyLoadSeq;
        this.hierarchyAbortController?.abort();
        const abortController = new AbortController();
        this.hierarchyAbortController = abortController;
        this.mountSeq++;
        this.metaCache.clear();
        this.host.resetHierarchyLoadState();

        try {
            const resp = await fetch(this.host.getProps().url, {
                signal: abortController.signal,
            });
            if (!resp.ok) {
                throw new Error(`Server returned ${resp.status}`);
            }
            const data: PatientHierarchy = await resp.json();
            if (
                loadSeq !== this.hierarchyLoadSeq ||
                abortController.signal.aborted
            ) {
                return;
            }

            const allowedSampleIds = this.host.getProps().allowedSampleIds || [];
            if (allowedSampleIds.length > 0) {
                const allowed = new Set(allowedSampleIds);
                data.samples = data.samples.filter(sample =>
                    allowed.has(sample.sample_id)
                );
            }

            this.host.setHierarchy(data);
            this.host.setLoading(false);

            if (this.host.getProps().studyId) {
                void this.enrichSamplesFromCbioportal();
            }

            const allSlides = this.host.getServableSlides();
            const first = this.host.chooseInitialServableSlide(allSlides);
            if (first) {
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
            void this.prefetchSlideMetadata(first?.slide.image_id);
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

    private async prefetchSlideMetadata(skipImageId?: string) {
        const slides = this.host
            .getServableSlides()
            .map(entry => entry.slide)
            .filter(
                slide =>
                    slide.image_id !== skipImageId &&
                    !this.metaCache.has(slide.image_id)
            );

        if (slides.length === 0) return;
        const base = this.host.getTileServerBase();
        const THUMB_BATCH = 4;

        for (let i = 0; i < slides.length; i += THUMB_BATCH) {
            if (!this.host.getHierarchy()) return;
            for (const slide of slides.slice(i, i + THUMB_BATCH)) {
                fetch(`${base}/tiles/${slide.image_id}/thumbnail`).catch(
                    () => {}
                );
            }
            if (i + THUMB_BATCH < slides.length) {
                await new Promise(resolve => setTimeout(resolve, 200));
            }
        }

        for (const slide of slides) {
            if (!this.host.getHierarchy()) return;
            await fetch(`${base}/tiles/${slide.image_id}/metadata`)
                .then(resp => (resp.ok ? resp.json() : Promise.reject(resp.status)))
                .then((meta: TileMetadata) => {
                    this.metaCache.set(slide.image_id, meta);
                })
                .catch(() => {});
            await new Promise(resolve => setTimeout(resolve, 150));
        }
    }

    private async enrichSamplesFromCbioportal() {
        const { studyId } = this.host.getProps();
        const hierarchy = this.host.getHierarchy();
        if (!studyId || !hierarchy?.samples.length) return;

        const base = this.host.getCbioApiBase();
        const sampleIdentifiers = this.host.buildSampleIdentifiers(studyId);
        if (!sampleIdentifiers.length) return;

        try {
            await this.host.fetchAndMergeSampleTimepoints(
                base,
                studyId,
                hierarchy.patient_id
            );
            await this.host.fetchAndMergeClinicalData(
                base,
                studyId,
                sampleIdentifiers
            );
            await this.host.fetchAndMergeMutations(
                base,
                studyId,
                sampleIdentifiers
            );
            this.host.triggerPostMutationAnnotationFetches(base, studyId);
            await this.host.fetchAndMergeCNA(base, studyId, sampleIdentifiers);
            this.host.triggerPostCnaAnnotationFetches();
            await this.host.fetchAndMergeStructuralVariants(
                base,
                studyId,
                sampleIdentifiers
            );
            this.host.triggerPostStructuralVariantAnnotationFetches();
        } catch {
            // Silently fall back to tile-server data
        }
    }

    private cancelPendingSlideSelection() {
        if (this.selectSlideDebounce !== null) {
            clearTimeout(this.selectSlideDebounce);
            this.selectSlideDebounce = null;
        }
        if (this.pendingSelectSlideResolve) {
            this.pendingSelectSlideResolve();
            this.pendingSelectSlideResolve = null;
        }
    }

    selectSlide(slide: Slide, sample: Sample): Promise<void> {
        this.host.beginSlideSelection(slide, sample);
        this.loadingStart = Date.now();
        if (this.spinnerTimer !== null) {
            clearTimeout(this.spinnerTimer);
            this.spinnerTimer = null;
        }
        const seq = ++this.mountSeq;
        this.cancelPendingSlideSelection();

        return new Promise(resolve => {
            this.pendingSelectSlideResolve = resolve;
            this.selectSlideDebounce = setTimeout(() => {
                this.selectSlideDebounce = null;
                const finalize = this.pendingSelectSlideResolve;
                this.pendingSelectSlideResolve = null;
                void this.mountOSD(slide, seq).then(() => {
                    finalize?.();
                });
            }, WsiViewerController.SELECT_DEBOUNCE_MS);
        });
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
        const imagePoint = new this.openSeadragon.Point(clamped.x, clamped.y);
        const viewportPoint =
            this.osdViewer.viewport.imageToViewportCoordinates(imagePoint);
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
        this.writeHashState();
        await copyCurrentUrlToClipboard();
    }

    private hideSpinnerForMount(seq: number) {
        if (seq !== this.mountSeq) return;
        if (this.spinnerTimer !== null) {
            clearTimeout(this.spinnerTimer);
            this.spinnerTimer = null;
        }
        this.host.setSpinnerVisible(false);
        this.host.setTilesReady(true);
    }

    private handleOsdOpen(seq: number, slide: Slide) {
        if (seq !== this.mountSeq) return;
        this.host.setViewerReady(true);
        const hashState = readWsiHashState();
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
        const hideSpinner = () => this.hideSpinnerForMount(seq);
        this.spinnerTimer = scheduleOsdSpinnerFallback({
            existingTimer: this.spinnerTimer,
            hideSpinner,
        });
        this.osdViewer.addOnceHandler('tile-loaded', () => {
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
        });
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
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private handleOsdTileLoadFailed(event: any) {
        // eslint-disable-next-line no-console
        console.warn('[WSIViewer] tile-load-failed', event?.tile?.url);
    }

    private async mountOSD(slide: Slide, seq: number) {
        let meta = this.metaCache.get(slide.image_id);
        if (!meta) {
            const metaUrl = `${this.host.getTileServerBase()}/tiles/${slide.image_id}/metadata`;
            fetch(
                `${this.host.getTileServerBase()}/tiles/${slide.image_id}/thumbnail`
            ).catch(() => {});
            try {
                const resp = await fetch(metaUrl);
                if (!resp.ok) {
                    throw new Error(`${resp.status} ${resp.statusText}`);
                }
                meta = (await resp.json()) as TileMetadata;
                this.metaCache.set(slide.image_id, meta);
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

        await new Promise<void>(resolve =>
            requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
        );
        if (seq !== this.mountSeq) return;

        const containerEl = this.host.getViewerContainerElement();
        if (!containerEl) return;

        this.destroyViewer();
        try {
            this.osdViewer = this.openSeadragon(
                buildOsdOptions({
                    element: containerEl,
                    navId: this.navId,
                    meta,
                    baseUrl: this.host.getTileServerBase(),
                    imageId: slide.image_id,
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
            onOpen: () => this.handleOsdOpen(seq, slide),
            onOpenFailed: e => this.handleOsdOpenFailed(seq, e),
            onTileLoadFailed: e => this.handleOsdTileLoadFailed(e),
        });
        this.osdMouseTracker = createOsdMouseTracker({
            openSeadragon: this.openSeadragon,
            element: containerEl,
            viewer: this.osdViewer,
            onCursorMove: (x, y) => this.host.updateCursorPos(x, y),
            onCursorExit: () => this.host.clearCursorPos(),
        });
    }
}
