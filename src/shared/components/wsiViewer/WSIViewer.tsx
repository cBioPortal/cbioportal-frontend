import * as React from 'react';
import { observer } from 'mobx-react';
import { observable, action, computed, makeObservable } from 'mobx';
import LoadingIndicator from 'shared/components/loadingIndicator/LoadingIndicator';
import { DefaultTooltip } from 'cbioportal-frontend-commons';
import {
    PathologySlideFilter,
    PathologySlideMatchFilter,
    Slide,
    Sample,
    PatientHierarchy,
    TileMetadata,
    MutationDetail,
} from './wsiViewerTypes';
import {
    getServableSlideAssociationsByImageId,
    getServableSlideAssociationsByImageIdReadOnly,
    getOrderedServableSlidesForSampleReadOnly,
    getServableSlideIdsForPathologyFilterReadOnly,
    matchesWsiStainFilter,
    sampleHasServableSlide,
} from './wsiSlideUtils';
import {
    chooseInitialMatchingServableSlide,
    chooseInitialServableSlide,
} from './wsiInitialSlideUtils';
import { MetaRow, WsiMetaSidebar } from './wsiMetaSidebar';
import {
    buildPathRowsReadOnly,
    buildSampleUrl,
    buildSeqRowsReadOnly,
    buildWsiRowsReadOnly,
} from './wsiMetaUtils';
import { readWsiHashState } from './wsiViewStateUtils';
import { SampleIdentifier } from './wsiDataMergeUtils';
import { BLOCK_LABEL_TIP, compareSamplesByTimepoint } from './wsiNavUtils';
import { WsiNavPanel } from './wsiNavPanel';
import {
    WsiInitialSlideLoadPerformance,
    WsiViewerController,
    WsiViewerControllerHost,
} from './wsiViewerController';
import { loadOpenSeadragon } from './wsiOpenSeadragonLoader';
import {
    fetchClinicalDataRecordsReadOnly,
    fetchCnaDataReadOnly,
    fetchMutationDataReadOnly,
    fetchMutationFrequencyDataReadOnly,
    fetchStructuralVariantDataReadOnly,
} from './wsiCbioportalDataUtils';
import {
    fetchCivicCnaAnnotationsReadOnly,
    fetchCivicMutationAnnotationsReadOnly,
    fetchOncoKbCnaAnnotationsReadOnly,
    fetchOncoKbMutationAnnotationsReadOnly,
    fetchOncoKbStructuralVariantAnnotationsReadOnly,
} from './wsiAnnotationDataUtils';
import {
    applyClinicalDataRecords,
    applyCivicCnaAnnotations,
    applyCivicMutationAnnotations,
    applyCnaData,
    applyMutationData,
    applyMutationFrequencyData,
    applyOncoKbCnaAnnotations,
    applyOncoKbMutationAnnotations,
    applyOncoKbStructuralVariantAnnotations,
    applyStructuralVariantData,
} from './wsiHierarchyUpdateUtils';
import { reportWsiInitialSlideLoadPerformance } from 'shared/lib/tracking';

// ---- design tokens (matches iframe viewer) ----
const C = {
    blue: '#2986e2',
    blueDark: '#1a6cc4',
    blueLight: '#e8f1fb',
    orange: '#f5a623',
    text: '#333',
    muted: '#737373',
    border: '#ddd',
    navBg: '#fafafa',
    sidebarBg: '#f5f5f5',
} as const;

const NAV_W = 252;
const SIDEBAR_W = 320;
const SIDEBAR_MIN_W = 220;
const SIDEBAR_MAX_W = 520;
const SIDEBAR_HANDLE_W = 8;
const SLIDE_SELECTION_DEBOUNCE_MS = 120;

function freezeMetaRows(rows: MetaRow[]): MetaRow[] {
    rows.forEach(row => Object.freeze(row));
    return Object.freeze(rows) as MetaRow[];
}

const sectionTitleStyle: React.CSSProperties = {
    fontSize: 10,
    fontWeight: 700,
    color: C.muted,
    textTransform: 'uppercase',
    letterSpacing: '.8px',
};

// ---- shared utility functions ----

interface Props {
    /** URL of the form https://tile-server/patient/{patient_id} */
    url: string;
    height: number;
    /** cBioPortal study ID — used to build sample links in the sidebar */
    studyId?: string;
    initialStainFilter?: 'all' | 'hne' | 'ihc';
    preferredSampleId?: string;
    pathologyFilter?: PathologySlideFilter;
}

interface CoordBarViewerState {
    coordBarInputX: string;
    coordBarInputY: string;
    coordBarCursorPos: { x: number; y: number } | null;
    coordBarMpp?: { x: number; y: number };
}

function getInitialMatchFilter(
    pathologyFilter?: PathologySlideFilter
): PathologySlideMatchFilter {
    const normalizedMatchLevel = pathologyFilter?.matchLevel?.toUpperCase();
    if (normalizedMatchLevel === 'PART') {
        return 'part';
    }
    if (normalizedMatchLevel === 'BLOCK') {
        return 'block';
    }
    if (normalizedMatchLevel === 'UNMATCHED') {
        return 'unmatched';
    }
    return 'all';
}

function getPathologyPreferredImageIds(
    hierarchy: PatientHierarchy | null | undefined,
    pathologyFilter?: PathologySlideFilter
): Set<string> | undefined {
    if (!hierarchy || !pathologyFilter) {
        return undefined;
    }

    return getServableSlideIdsForPathologyFilterReadOnly(
        hierarchy,
        pathologyFilter
    );
}

@observer
export default class WSIViewer extends React.Component<Props, {}> {
    @observable private hierarchy: PatientHierarchy | null = null;
    @observable private sourceHierarchy: PatientHierarchy | null = null;
    @observable private selectedSlide: Slide | null = null;
    @observable private selectedSample: Sample | null = null;
    @observable private selectedMeta: TileMetadata | null = null;
    @observable private loading = true;
    @observable private error: string | null = null;
    @observable private viewerReady = false;
    /** True once OSD has drawn the first tile; used to show/hide the thumbnail
     *  underlay that covers the grey canvas while initial tiles are loading. */
    @observable private tilesReady = false;
    /** Separate flag that controls spinner visibility; set true on slide select,
     *  set false after viewerReady AND at least MIN_SPINNER_MS have elapsed.
     *  Decoupled from viewerReady so viewport setup isn't delayed. */
    @observable private spinnerVisible = false;
    @observable private stainFilter: 'all' | 'hne' | 'ihc' = 'all';
    @observable private matchFilter: PathologySlideMatchFilter = 'all';
    @observable private sidebarWidth = SIDEBAR_W;
    /** Coordinate bar — input field values */
    @observable coordInputX = '';
    @observable coordInputY = '';
    /** Current cursor position in image pixels (null when viewer not ready or cursor outside) */
    @observable cursorPos: { x: number; y: number } | null = null;

    private viewerContainerRef = React.createRef<HTMLDivElement>();
    /** Stable per-instance ID prefix for OSD custom nav button elements */
    private resizeStartX = 0;
    private resizeStartWidth = 0;
    private isResizingSidebar = false;
    private controller: WsiViewerController;
    private hierarchyDataVersion = 0;
    private hierarchyRefreshScheduled = false;
    private hierarchyRefreshRaf: number | null = null;
    private hierarchyRefreshTimer: ReturnType<typeof setTimeout> | null = null;
    private slideSelectionTimer: ReturnType<typeof setTimeout> | null = null;
    private cachedSelectedSampleUrl:
        | {
              studyId?: string;
              sampleId?: string;
              patientId?: string;
              value?: string;
          }
        | undefined;
    private cachedThumbSrc:
        | {
              slideId?: string;
              tileServerBase: string;
              value: string | null;
          }
        | undefined;
    private cachedSeqRows:
        | {
              sample: Sample | null;
              slide: Slide | null;
              sampleUrl?: string;
              version: number;
              rows: ReturnType<typeof buildSeqRowsReadOnly>;
          }
        | undefined;
    private cachedWsiRows:
        | {
              slide: Slide | null;
              meta: TileMetadata | null;
              version: number;
              rows: ReturnType<typeof buildWsiRowsReadOnly>;
          }
        | undefined;
    private cachedPathRows:
        | {
              slide: Slide | null;
              sample: Sample | null;
              patientId?: string;
              studyId?: string;
              version: number;
              rows: ReturnType<typeof buildPathRowsReadOnly>;
          }
        | undefined;

    private get navId() {
        return this.controller.navId;
    }

    // ---- stable callbacks (prevent prop-equality churn on child components) ----
    private cancelPendingSlideSelection() {
        if (this.slideSelectionTimer !== null) {
            clearTimeout(this.slideSelectionTimer);
            this.slideSelectionTimer = null;
        }
    }

    private readonly handleFilterChange = action((f: 'all' | 'hne' | 'ihc') => {
        if (this.stainFilter === f) {
            return;
        }
        this.cancelPendingSlideSelection();
        this.stainFilter = f;
        void this.reselectSlideForCurrentFilters();
    });
    private readonly handleMatchFilterChange = action(
        (f: PathologySlideMatchFilter) => {
            if (this.matchFilter === f) {
                return;
            }
            this.cancelPendingSlideSelection();
            this.matchFilter = f;
            void this.reselectSlideForCurrentFilters();
        }
    );
    private readonly handleSelectSlide = (slide: Slide, sample: Sample) => {
        this.controller.cancelSlideSelection();
        if (this.slideSelectionTimer !== null) {
            clearTimeout(this.slideSelectionTimer);
        }
        this.slideSelectionTimer = setTimeout(() => {
            this.slideSelectionTimer = null;
            void this.controller.selectSlide(slide, sample);
        }, SLIDE_SELECTION_DEBOUNCE_MS);
    };
    private readonly handleHashChange = () => {
        void this.selectSlideFromHash();
    };
    private readonly handleRetryViewer = () => {
        void this.controller.retrySelectedSlide();
    };
    private readonly handleChangeX = action((v: string) => {
        this.coordInputX = v;
    });
    private readonly handleChangeY = action((v: string) => {
        this.coordInputY = v;
    });
    private readonly handleCopyLink = () => this.copyViewLink();
    private readonly handleDownload = () => this.downloadView();
    private readonly handleGoToCoordinates = () => {
        this.goToCoordinates();
    };
    private readonly handleSidebarResizeMove = (event: MouseEvent) => {
        if (!this.isResizingSidebar) return;
        const nextWidth =
            this.resizeStartWidth + (this.resizeStartX - event.clientX);
        this.setSidebarWidth(nextWidth);
    };
    private readonly handleSidebarResizeEnd = () => {
        if (!this.isResizingSidebar) return;
        this.isResizingSidebar = false;
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
        window.removeEventListener('mousemove', this.handleSidebarResizeMove);
        window.removeEventListener('mouseup', this.handleSidebarResizeEnd);
    };

    constructor(props: Props) {
        super(props);
        makeObservable(this);
        if (props.initialStainFilter) {
            this.stainFilter = props.initialStainFilter;
        }
        this.matchFilter = getInitialMatchFilter(props.pathologyFilter);
        this.controller = new WsiViewerController(
            this.createControllerHost(),
            loadOpenSeadragon
        );
    }

    @action.bound
    private setSidebarWidth(width: number) {
        const clamped = Math.max(SIDEBAR_MIN_W, Math.min(SIDEBAR_MAX_W, width));
        this.sidebarWidth = clamped;
        this.controller.forceResize();
    }

    private beginSidebarResize = (event: React.MouseEvent<HTMLDivElement>) => {
        event.preventDefault();
        this.isResizingSidebar = true;
        this.resizeStartX = event.clientX;
        this.resizeStartWidth = this.sidebarWidth;
        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';
        window.addEventListener('mousemove', this.handleSidebarResizeMove);
        window.addEventListener('mouseup', this.handleSidebarResizeEnd);
    };

    private createControllerHost(): WsiViewerControllerHost {
        return {
            getProps: () => this.controllerProps,
            resetHierarchyLoadState: () => this.resetHierarchyLoadState(),
            setHierarchy: (hierarchy, sourceHierarchy) => {
                this.hierarchy = hierarchy;
                this.sourceHierarchy = sourceHierarchy ?? hierarchy;
            },
            setLoading: loading => {
                this.loading = loading;
            },
            setError: error => {
                this.error = error;
            },
            getHierarchy: () => this.hierarchy,
            getServableSlides: () => this.servableSlides,
            getStainFilter: () => this.stainFilter,
            getTileServerBase: () => this.tileServerBase,
            getTileServerOrigin: () => this.tileServerOrigin,
            getCbioApiBase: () => this.cbioApiBase,
            getViewerContainerElement: () => this.viewerContainerRef.current,
            chooseInitialServableSlide: allSlides =>
                this.chooseInitialServableSlide(allSlides),
            beginSlideSelection: (slide, sample) =>
                this.beginSlideSelection(slide, sample),
            setSelectedMeta: meta => {
                this.selectedMeta = meta;
            },
            setViewerReady: viewerReady => {
                this.viewerReady = viewerReady;
            },
            setSpinnerVisible: spinnerVisible => {
                this.spinnerVisible = spinnerVisible;
            },
            setTilesReady: tilesReady => {
                this.tilesReady = tilesReady;
            },
            getSelectedSlide: () => this.selectedSlide,
            getSelectedSample: () => this.selectedSample,
            getSelectedMeta: () => this.selectedMeta,
            clearSelectedSlide: () => {
                this.selectedSlide = null;
                this.selectedSample = null;
                this.selectedMeta = null;
                this.viewerReady = false;
                this.spinnerVisible = false;
                this.tilesReady = false;
            },
            getPatientId: () => this.hierarchy?.patient_id,
            setCoordInputs: (x, y) => this.setCoordInputs(x, y),
            getCoordInputs: () => ({
                x: this.coordInputX,
                y: this.coordInputY,
            }),
            updateCursorPos: (x, y) => this.handleCursorMove(x, y),
            clearCursorPos: () => this.clearCursorPos(),
            runSampleEnrichment: (
                base,
                studyId,
                patientId,
                sampleIds,
                shouldContinue
            ) =>
                this.runSampleEnrichment(
                    base,
                    studyId,
                    patientId,
                    sampleIds,
                    shouldContinue
                ),
            reportInitialSlideLoadPerformance: metric =>
                this.reportInitialSlideLoadPerformance(metric),
        };
    }

    private reportInitialSlideLoadPerformance(
        metric: WsiInitialSlideLoadPerformance
    ) {
        const telemetryPayload = reportWsiInitialSlideLoadPerformance(metric);
        const {
            slideId: _slideId,
            patientId: _patientId,
            studyId: _studyId,
            ...browserEventDetail
        } = metric;
        if (
            typeof window !== 'undefined' &&
            typeof window.dispatchEvent === 'function'
        ) {
            try {
                window.dispatchEvent(
                    new CustomEvent('wsi-initial-slide-performance', {
                        detail: browserEventDetail,
                    })
                );
            } catch (_) {
                // Ignore environments without CustomEvent support.
            }
        }
        if ((window as any).devContext === true) {
            // eslint-disable-next-line no-console
            console.info(
                '[WSIViewer] initial slide load performance',
                telemetryPayload
            );
        }
    }

    selectSlide(slide: Slide, sample: Sample): Promise<void> {
        return this.controller.selectSlide(slide, sample);
    }

    goToCoordinates() {
        this.controller.goToCoordinates();
    }

    downloadView() {
        this.controller.downloadView();
    }

    async copyViewLink() {
        return this.controller.copyViewLink();
    }

    componentDidMount() {
        window.addEventListener('hashchange', this.handleHashChange);
        void this.controller.loadHierarchy();
    }

    private async selectSlideFromHash(): Promise<void> {
        const hashState = readWsiHashState();
        if (!hashState || !this.hierarchy) return;

        const matching = this.servableSlides.find(
            entry => entry.slide.image_id === hashState.slideId
        );
        if (!matching) return;

        if (this.selectedSlide?.image_id === matching.slide.image_id) {
            this.controller.restoreCurrentViewportFromHash();
            return;
        }

        await this.controller.selectSlide(
            matching.slide,
            matching.sample,
            true
        );
    }

    componentDidUpdate(prev: Props) {
        const preferredSampleChanged =
            prev.preferredSampleId !== this.props.preferredSampleId;
        const pathologyFilterChanged =
            prev.pathologyFilter?.sampleId !==
                this.props.pathologyFilter?.sampleId ||
            prev.pathologyFilter?.matchLevel !==
                this.props.pathologyFilter?.matchLevel ||
            prev.pathologyFilter?.specimenKey !==
                this.props.pathologyFilter?.specimenKey;
        const requiresHierarchyReload =
            prev.url !== this.props.url ||
            (pathologyFilterChanged && !this.canReusePathologyFilterLocally());
        const stainFilterChanged =
            prev.initialStainFilter !== this.props.initialStainFilter;

        if (pathologyFilterChanged) {
            this.matchFilter = getInitialMatchFilter(
                this.props.pathologyFilter
            );
        }

        if (requiresHierarchyReload) {
            if (stainFilterChanged) {
                this.stainFilter = this.props.initialStainFilter || 'all';
            }
            this.controller.dispose();
            void this.controller.loadHierarchy(false);
        } else if (pathologyFilterChanged) {
            if (stainFilterChanged) {
                this.stainFilter = this.props.initialStainFilter || 'all';
            }
            this.applyPathologyFilterFromSourceHierarchy();
        } else if (preferredSampleChanged) {
            void this.reselectPreferredSampleSlide();
        }
        if (
            stainFilterChanged &&
            !requiresHierarchyReload &&
            !pathologyFilterChanged
        ) {
            this.handleFilterChange(this.props.initialStainFilter || 'all');
        }
        if (false) {
        }
    }

    componentWillUnmount() {
        window.removeEventListener('hashchange', this.handleHashChange);
        this.cancelPendingSlideSelection();
        action(() => {
            this.hierarchy = null; // stops the prefetchSlideMetadata loop
        })();
        this.cancelScheduledHierarchyRefresh();
        this.controller.dispose();
        this.handleSidebarResizeEnd();
    }

    // ---- data loading ----

    @action.bound
    private resetHierarchyLoadState() {
        this.loading = true;
        this.error = null;
        this.hierarchy = null;
        this.sourceHierarchy = null;
        this.selectedSlide = null;
        this.selectedSample = null;
        this.selectedMeta = null;
        this.viewerReady = false;
        this.tilesReady = false;
        this.spinnerVisible = false;
        this.cursorPos = null;
        this.coordInputX = '';
        this.coordInputY = '';
    }

    private get controllerProps() {
        return {
            url: this.props.url,
            studyId: this.props.studyId,
            pathologyFilter: this.props.pathologyFilter,
        };
    }

    private canReusePathologyFilterLocally(): boolean {
        return !!this.sourceHierarchy;
    }

    @action.bound
    private applyPathologyFilterFromSourceHierarchy() {
        if (!this.sourceHierarchy) {
            return;
        }

        const nextHierarchy = this.sourceHierarchy;

        this.hierarchy = nextHierarchy;
        this.hierarchyDataVersion++;

        const preferredImageIds = getPathologyPreferredImageIds(
            this.sourceHierarchy,
            this.props.pathologyFilter
        );
        if (preferredImageIds?.size) {
            const currentImageId = this.selectedSlide?.image_id;
            const currentSampleId = this.selectedSample?.sample_id;
            const currentSample = nextHierarchy.samples.find(
                sample => sample.sample_id === currentSampleId
            );
            const firstMatchingSlide = currentSample
                ? getOrderedServableSlidesForSampleReadOnly(currentSample).find(
                      ({ slide }) =>
                          preferredImageIds.has(slide.image_id) &&
                          matchesWsiStainFilter(slide, this.stainFilter)
                  )?.slide
                : undefined;
            if (
                currentImageId &&
                firstMatchingSlide?.image_id === currentImageId
            ) {
                this.selectedSlide = firstMatchingSlide;
                this.selectedSample = currentSample!;
                return;
            }
            void this.reselectSlideForPathologyFilter(preferredImageIds);
            return;
        }

        const currentImageId = this.selectedSlide?.image_id;
        const currentSampleId = this.selectedSample?.sample_id;
        if (!currentImageId || !currentSampleId) {
            void this.reselectSlideForCurrentFilters();
            return;
        }

        const matchingSample = nextHierarchy.samples.find(
            sample =>
                sample.sample_id === currentSampleId &&
                sampleHasServableSlide(sample, currentImageId)
        );
        const matchingSlide = matchingSample
            ? getOrderedServableSlidesForSampleReadOnly(matchingSample).find(
                  ({ slide }) => slide.image_id === currentImageId
              )?.slide
            : undefined;

        if (matchingSample && matchingSlide) {
            this.selectedSlide = matchingSlide;
            this.selectedSample = matchingSample;
            return;
        }

        void this.reselectSlideForCurrentFilters();
    }

    private async reselectSlideForPathologyFilter(
        preferredImageIds: Set<string>
    ): Promise<void> {
        const servableSlides = this.servableSlides;
        if (!this.hierarchy || !servableSlides.length) {
            return;
        }

        const next = chooseInitialMatchingServableSlide(servableSlides, {
            preferredSampleId: this.props.preferredSampleId,
            stainFilter: this.stainFilter,
            matchesEntry: entry => preferredImageIds.has(entry.slide.image_id),
        });

        if (!next) {
            this.controller.clearSelectedSlide();
            return;
        }

        if (
            this.selectedSlide?.image_id === next.slide.image_id &&
            this.selectedSample?.sample_id === next.sample.sample_id
        ) {
            return;
        }

        await this.controller.selectSlide(next.slide, next.sample);
    }

    private chooseInitialServableSlide(
        allSlides: Array<{ slide: Slide; sample: Sample }>
    ) {
        const hashState = readWsiHashState();
        const preferredImageIds = getPathologyPreferredImageIds(
            this.sourceHierarchy || this.hierarchy,
            this.props.pathologyFilter
        );

        if (this.props.preferredSampleId || this.props.pathologyFilter) {
            const filteredSlides = allSlides.filter(({ slide }) => {
                if (
                    preferredImageIds &&
                    !preferredImageIds.has(slide.image_id)
                ) {
                    return false;
                }
                return matchesWsiStainFilter(slide, this.stainFilter);
            });
            return (
                filteredSlides.find(
                    ({ slide }) => slide.image_id === hashState?.slideId
                ) || filteredSlides[0]
            );
        }

        const preferredSlide = chooseInitialMatchingServableSlide(allSlides, {
            preferredSampleId: this.props.preferredSampleId,
            preferredSlideId: hashState?.slideId,
            stainFilter: this.stainFilter,
            matchesEntry: entry =>
                !preferredImageIds ||
                preferredImageIds.has(entry.slide.image_id),
        });
        return preferredSlide;
    }

    @action.bound
    private handleCursorMove(x: number, y: number) {
        this.cursorPos = { x, y };
    }

    @action.bound
    private beginSlideSelection(slide: Slide, sample: Sample) {
        this.selectedSlide = slide;
        this.selectedSample = sample;
        this.selectedMeta = null;
        this.viewerReady = false;
        this.tilesReady = false;
        this.spinnerVisible = true;
        this.error = null;
    }

    @action.bound
    private clearCursorPos() {
        this.cursorPos = null;
    }

    private async reselectPreferredSampleSlide(): Promise<void> {
        if (!this.hierarchy || !this.servableSlides.length) {
            return;
        }

        const next = this.chooseInitialServableSlide(this.servableSlides);
        if (!next) {
            return;
        }

        if (
            this.selectedSlide?.image_id === next.slide.image_id &&
            this.selectedSample?.sample_id === next.sample.sample_id
        ) {
            return;
        }

        await this.controller.selectSlide(next.slide, next.sample);
    }

    private async reselectSlideForCurrentFilters(): Promise<void> {
        const servableSlides = this.servableSlides;
        if (!this.hierarchy || !servableSlides.length) {
            return;
        }

        const associationsByImageId = getServableSlideAssociationsByImageIdReadOnly(
            this.hierarchy.slide_associations
        );
        const matchingSlides = servableSlides.filter(({ slide }) => {
            if (!matchesWsiStainFilter(slide, this.stainFilter)) {
                return false;
            }
            return (
                this.matchFilter === 'all' ||
                associationsByImageId.get(slide.image_id)?.match_level ===
                    this.matchFilter.toUpperCase()
            );
        });
        if (!matchingSlides.length) {
            this.controller.clearSelectedSlide();
            return;
        }

        const next = matchingSlides[0];
        await this.controller.selectSlide(next.slide, next.sample);
    }

    @action.bound
    private setCoordInputs(x: string, y: string) {
        this.coordInputX = x;
        this.coordInputY = y;
    }

    private buildSampleIdentifiers(
        studyId: string,
        sampleIds: string[]
    ): SampleIdentifier[] {
        const identifiers: SampleIdentifier[] = [];
        const seenSampleIds = new Set<string>();
        for (let index = 0; index < sampleIds.length; index += 1) {
            const sampleId = sampleIds[index];
            if (seenSampleIds.has(sampleId)) {
                continue;
            }
            seenSampleIds.add(sampleId);
            identifiers.push({ studyId, sampleId });
        }
        return identifiers;
    }

    private collectSampleEntries<T>(
        getEntries: (sample: Sample) => T[] | undefined,
        includeEntry?: (entry: T) => boolean
    ): T[] {
        const hierarchy = this.hierarchy;
        if (!hierarchy) {
            return [];
        }

        const result: T[] = [];
        for (
            let sampleIndex = 0;
            sampleIndex < hierarchy.samples.length;
            sampleIndex += 1
        ) {
            const entries = getEntries(hierarchy.samples[sampleIndex]);
            if (!entries?.length) {
                continue;
            }
            for (
                let entryIndex = 0;
                entryIndex < entries.length;
                entryIndex += 1
            ) {
                const entry = entries[entryIndex];
                if (!includeEntry || includeEntry(entry)) {
                    result.push(entry);
                }
            }
        }
        return result;
    }

    @computed get servableSlides(): Array<{ slide: Slide; sample: Sample }> {
        if (!this.hierarchy) return [];
        return [...this.hierarchy.samples]
            .sort(compareSamplesByTimepoint)
            .filter(
                sample =>
                    !this.props.preferredSampleId ||
                    sample.sample_id === this.props.preferredSampleId
            )
            .flatMap(sample =>
                getOrderedServableSlidesForSampleReadOnly(
                    sample
                ).map(({ slide }) => ({ slide, sample }))
            );
    }

    private static stripPatientPath(pathname: string): string {
        return pathname.replace(/\/patient\/[^/]+\/?$/, '').replace(/\/$/, '');
    }

    @computed get tileServerBase(): string {
        const parsed = this.resourceUrl;
        if (!parsed) {
            return WSIViewer.stripPatientPath(this.props.url);
        }

        return `${parsed.origin}${WSIViewer.stripPatientPath(parsed.pathname)}`;
    }

    @computed
    private get resourceUrl(): URL | null {
        try {
            return new URL(this.props.url, window.location.href);
        } catch {
            return null;
        }
    }

    @computed
    get coordBarInputX(): string {
        return this.coordInputX;
    }

    @computed
    get coordBarInputY(): string {
        return this.coordInputY;
    }

    @computed
    get coordBarCursorPos(): { x: number; y: number } | null {
        return this.cursorPos;
    }

    @computed
    get coordBarMpp(): { x: number; y: number } | undefined {
        return this.selectedMeta?.mpp;
    }

    @computed
    private get viewerPatientId(): string | undefined {
        return this.hierarchy?.patient_id;
    }

    private get selectedSampleUrl(): string | undefined {
        const studyId = this.props.studyId;
        const sampleId = this.selectedSample?.sample_id;
        const patientId = this.viewerPatientId;
        if (
            this.cachedSelectedSampleUrl &&
            this.cachedSelectedSampleUrl.studyId === studyId &&
            this.cachedSelectedSampleUrl.sampleId === sampleId &&
            this.cachedSelectedSampleUrl.patientId === patientId
        ) {
            return this.cachedSelectedSampleUrl.value;
        }

        const value =
            studyId && sampleId && sampleId !== 'UNMATCHED'
                ? buildSampleUrl(studyId, sampleId, patientId)
                : undefined;
        this.cachedSelectedSampleUrl = {
            studyId,
            sampleId,
            patientId,
            value,
        };
        return value;
    }

    private get selectedThumbSrc(): string | null {
        const slideId = this.selectedSlide?.image_id;
        if (
            this.cachedThumbSrc &&
            this.cachedThumbSrc.slideId === slideId &&
            this.cachedThumbSrc.tileServerBase === this.tileServerBase
        ) {
            return this.cachedThumbSrc.value;
        }

        const value = slideId
            ? `${
                  this.tileServerBase
              }/tiles/${slideId}/thumbnail?studyId=${encodeURIComponent(
                  this.props.studyId || ''
              )}`
            : null;
        this.cachedThumbSrc = {
            slideId,
            tileServerBase: this.tileServerBase,
            value,
        };
        return value;
    }

    private get sidebarThumbSrc(): string | null {
        return this.tilesReady ? this.selectedThumbSrc : null;
    }

    private get sidebarThumbDeferred(): boolean {
        return !!this.selectedSlide && !this.tilesReady;
    }

    private get sidebarImpactSample(): Sample | null {
        return this.tilesReady ? this.selectedSample : null;
    }

    private get sidebarSeqRowsForRender() {
        return this.tilesReady ? this.selectedSeqRows : [];
    }

    private get selectedSeqRows() {
        if (
            this.cachedSeqRows &&
            this.cachedSeqRows.slide === this.selectedSlide &&
            this.cachedSeqRows.sample === this.selectedSample &&
            this.cachedSeqRows.sampleUrl === this.selectedSampleUrl &&
            this.cachedSeqRows.version === this.hierarchyDataVersion
        ) {
            return this.cachedSeqRows.rows;
        }

        const rows =
            this.selectedSlide && this.selectedSample
                ? buildSeqRowsReadOnly(
                      this.selectedSample,
                      this.selectedSampleUrl
                  )
                : [];
        this.cachedSeqRows = {
            slide: this.selectedSlide,
            sample: this.selectedSample,
            sampleUrl: this.selectedSampleUrl,
            version: this.hierarchyDataVersion,
            rows: rows as MetaRow[],
        };
        return this.cachedSeqRows.rows;
    }

    private get selectedWsiRows() {
        if (
            this.cachedWsiRows &&
            this.cachedWsiRows.slide === this.selectedSlide &&
            this.cachedWsiRows.meta === this.selectedMeta &&
            this.cachedWsiRows.version === this.hierarchyDataVersion
        ) {
            return this.cachedWsiRows.rows;
        }

        const rows = this.selectedMeta
            ? buildWsiRowsReadOnly(this.selectedSlide, this.selectedMeta)
            : [];
        this.cachedWsiRows = {
            slide: this.selectedSlide,
            meta: this.selectedMeta,
            version: this.hierarchyDataVersion,
            rows: rows as MetaRow[],
        };
        return this.cachedWsiRows.rows;
    }

    private get selectedPathRows() {
        if (
            this.cachedPathRows &&
            this.cachedPathRows.slide === this.selectedSlide &&
            this.cachedPathRows.sample === this.selectedSample &&
            this.cachedPathRows.patientId === this.viewerPatientId &&
            this.cachedPathRows.studyId === this.props.studyId &&
            this.cachedPathRows.version === this.hierarchyDataVersion
        ) {
            return this.cachedPathRows.rows;
        }

        const rows =
            this.selectedSlide && this.selectedSample
                ? buildPathRowsReadOnly(
                      this.selectedSlide,
                      this.selectedSample,
                      this.viewerPatientId,
                      this.props.studyId,
                      this.hierarchy
                          ? getServableSlideAssociationsByImageIdReadOnly(
                                this.hierarchy.slide_associations
                            ).get(this.selectedSlide.image_id)
                          : undefined
                  )
                : [];
        this.cachedPathRows = {
            slide: this.selectedSlide,
            sample: this.selectedSample,
            patientId: this.viewerPatientId,
            studyId: this.props.studyId,
            version: this.hierarchyDataVersion,
            rows: rows as MetaRow[],
        };
        return this.cachedPathRows.rows;
    }

    @computed
    private get tileServerOrigin(): string {
        return this.resourceUrl?.origin || this.tileServerBase;
    }

    @action.bound
    private updateHierarchy() {
        this.hierarchyRefreshScheduled = false;
        this.hierarchyRefreshRaf = null;
        this.hierarchyRefreshTimer = null;
        if (!this.hierarchy) return;
        this.hierarchy = {
            ...this.hierarchy,
            samples: [...this.hierarchy.samples],
        };
    }

    private cancelScheduledHierarchyRefresh() {
        if (this.hierarchyRefreshRaf !== null) {
            cancelAnimationFrame(this.hierarchyRefreshRaf);
            this.hierarchyRefreshRaf = null;
        }
        if (this.hierarchyRefreshTimer !== null) {
            clearTimeout(this.hierarchyRefreshTimer);
            this.hierarchyRefreshTimer = null;
        }
        this.hierarchyRefreshScheduled = false;
    }

    private scheduleHierarchyRefresh() {
        if (this.hierarchyRefreshScheduled) {
            return;
        }

        this.hierarchyRefreshScheduled = true;
        if (typeof requestAnimationFrame === 'function') {
            this.hierarchyRefreshRaf = requestAnimationFrame(() =>
                this.updateHierarchy()
            );
            return;
        }

        this.hierarchyRefreshTimer = setTimeout(
            () => this.updateHierarchy(),
            0
        );
    }

    private applyHierarchyMutation(mutator: (samples: Sample[]) => void) {
        if (!this.hierarchy) return;
        action(() => {
            mutator(this.hierarchy!.samples);
        })();
        this.hierarchyDataVersion++;
    }

    private applyHierarchyMutationAndRefresh(
        mutator: (samples: Sample[]) => void
    ) {
        this.applyHierarchyMutation(mutator);
        this.scheduleHierarchyRefresh();
    }

    /**
     * Base URL for cBioPortal API calls.
     * When the viewer is embedded inside cBioPortal (PatientViewPageTabs), relative
     * paths work natively.  When the resource URL carries a `cbioUrl` query param
     * (ResourceTab / dev-test setup), we use that value instead.
     */
    @computed private get cbioApiBase(): string {
        return this.resourceUrl?.searchParams.get('cbioUrl') || '';
    }

    /**
     * Enrich sample metadata (TMB, MSI, tumor purity, oncogenic mutations, …) from
     * cBioPortal's REST API so the sidebar reflects the same data shown elsewhere in
     * cBioPortal rather than a potentially-stale Databricks snapshot.
     *
     * Runs as a fire-and-forget background task after the tile-server hierarchy is
     * loaded.  If cBioPortal is unavailable, the tile-server data remains as-is.
     */
    private async runSampleEnrichment(
        base: string,
        studyId: string,
        _patientId: string,
        sampleIds: string[],
        shouldContinue: () => boolean
    ): Promise<void> {
        const sampleIdentifiers = this.buildSampleIdentifiers(
            studyId,
            sampleIds
        );
        if (!sampleIdentifiers.length || !shouldContinue()) return;

        await Promise.allSettled([
            this.fetchAndMergeClinicalData(base, studyId, sampleIdentifiers),
            this.fetchAndMergeMutations(base, studyId, sampleIdentifiers),
        ]);
        if (!shouldContinue()) return;

        await Promise.allSettled([
            this.fetchAndMergeCNA(base, studyId, sampleIdentifiers),
            this.fetchAndMergeStructuralVariants(
                base,
                studyId,
                sampleIdentifiers
            ),
        ]);
        if (!shouldContinue()) return;

        void this.fetchAndMergeOncoKbAnnotations();
        void this.fetchAndMergeCivicAnnotations();
        void this.fetchAndMergeMutationFrequency(base, studyId);
        void this.fetchAndMergeCnaOncoKbAnnotations();
        void this.fetchAndMergeCnaCivicAnnotations();
        void this.fetchAndMergeStructuralVariantOncoKbAnnotations();
    }

    /**
     * Fetch sample-level clinical attributes from cBioPortal and merge them into
     * the in-memory hierarchy samples.  Only attributes present in the response
     * are updated; missing attributes keep their tile-server values.
     */
    private async fetchAndMergeClinicalData(
        base: string,
        _studyId: string,
        sampleIdentifiers: SampleIdentifier[]
    ): Promise<void> {
        const data = await fetchClinicalDataRecordsReadOnly(
            base,
            sampleIdentifiers
        );
        if (!data) return;

        this.applyHierarchyMutation(samples => {
            applyClinicalDataRecords(samples, data);
        });
    }

    /**
     * Fetch somatic mutations from cBioPortal mutations API.
     * Populates `oncogenic_mutations` (the display list) from ALL mutations returned by the
     * API — matching what cBioPortal's patient page shows — and sets `oncogenic_mutation_details`
     * (type, VAF per mutation) for tooltip display.  If the API returns no data, falls back to
     * whatever `fetchAndMergeClinicalData` already placed in `oncogenic_mutations`.
     */
    private async fetchAndMergeMutations(
        base: string,
        studyId: string,
        sampleIdentifiers: SampleIdentifier[]
    ): Promise<void> {
        // Declare maps here so the finally block can always mark details as ready,
        // even when the function returns early due to an error or missing data.
        const allMutsBySample = new Map<
            string,
            Array<{ token: string; vaf: number }>
        >();
        const detailsBySample = new Map<string, Map<string, MutationDetail>>();
        try {
            const mutationData = await fetchMutationDataReadOnly(
                base,
                studyId,
                sampleIdentifiers
            );
            if (!mutationData) return;

            mutationData.allMutsBySample.forEach(
                (value: Array<{ token: string; vaf: number }>, key: string) =>
                    allMutsBySample.set(key, value)
            );
            mutationData.detailsBySample.forEach(
                (value: Map<string, MutationDetail>, key: string) =>
                    detailsBySample.set(key, value)
            );
        } catch (e) {
            console.error('[WSIViewer] fetchAndMergeMutations failed:', e);
        } finally {
            const hasApiMutationData =
                allMutsBySample.size > 0 || detailsBySample.size > 0;
            const hasExistingMutationText = (
                this.hierarchy?.samples ?? []
            ).some(sample => !!sample.oncogenic_mutations);
            if (!hasApiMutationData && !hasExistingMutationText) {
                return;
            }
            this.applyHierarchyMutation(samples => {
                applyMutationData(samples, allMutsBySample, detailsBySample);
            });
        }
    }

    /**
     * Fetch OncoKB annotations for all mutations collected by fetchAndMergeMutations and
     * merge oncogenic / mutationEffect / hotspot / geneSummary / variantSummary into each
     * MutationDetail object in-place so that MutationTable can show rich tooltips.
     *
     * Routes through the tile server's /api/oncokb/annotate endpoint (same origin as the
     * viewer) to avoid CORS restrictions when calling the OncoKB API directly.
     *
     * Silently no-ops when the tile server doesn't have an OncoKB token configured
     * (endpoint returns 503) or when the hierarchy has no mutations with entrezGeneId.
     */
    private async fetchAndMergeOncoKbAnnotations(): Promise<void> {
        const allDetails = this.collectSampleEntries(
            sample => sample.oncogenic_mutation_details,
            detail => !!detail.entrezGeneId
        );
        if (!allDetails.length) return;

        const tileOrigin = this.tileServerOrigin;
        if (!tileOrigin) return;

        const annotations = await fetchOncoKbMutationAnnotationsReadOnly(
            tileOrigin,
            allDetails
        );
        if (!annotations?.length) return;

        this.applyHierarchyMutationAndRefresh(samples => {
            applyOncoKbMutationAnnotations(samples, annotations);
        });
    }

    /**
     * Fetch CIViC gene/variant records for WSI mutation details so the compact
     * metadata table can reuse the same detailed CIViC card used elsewhere.
     */
    private async fetchAndMergeCivicAnnotations(): Promise<void> {
        const allDetails = this.collectSampleEntries(
            sample => sample.oncogenic_mutation_details
        );
        if (!allDetails.length) return;

        const annotations = await fetchCivicMutationAnnotationsReadOnly(
            allDetails
        );
        if (!annotations?.length) return;

        this.applyHierarchyMutationAndRefresh(samples => {
            applyCivicMutationAnnotations(samples, annotations);
        });
    }

    /**
     * Fetch significant discrete copy-number alterations (value ≠ 0) from cBioPortal
     * and merge them into each sample's `cna_alterations` field.
     */
    private async fetchAndMergeCNA(
        base: string,
        studyId: string,
        sampleIdentifiers: SampleIdentifier[]
    ): Promise<void> {
        const bySample = await fetchCnaDataReadOnly(
            base,
            studyId,
            sampleIdentifiers
        );
        if (!bySample) return;

        this.applyHierarchyMutationAndRefresh(samples => {
            applyCnaData(samples, bySample);
        });
    }

    private async fetchAndMergeCnaCivicAnnotations(): Promise<void> {
        const allCnas = this.collectSampleEntries(
            sample => sample.cna_alterations
        );
        if (!allCnas.length) return;

        const annotations = await fetchCivicCnaAnnotationsReadOnly(allCnas);
        if (!annotations?.length) return;

        this.applyHierarchyMutationAndRefresh(samples => {
            applyCivicCnaAnnotations(samples, annotations);
        });
    }

    /**
     * Fetch OncoKB annotations for CNA events so CNA annotation mouseover
     * matches the SNV annotation card.
     */
    private async fetchAndMergeCnaOncoKbAnnotations(): Promise<void> {
        const allCnas = this.collectSampleEntries(
            sample => sample.cna_alterations
        );
        const tileOrigin = this.tileServerOrigin;
        if (!tileOrigin) return;

        const annotations = await fetchOncoKbCnaAnnotationsReadOnly(
            tileOrigin,
            allCnas
        );
        if (!annotations?.length) return;
        this.applyHierarchyMutationAndRefresh(samples => {
            applyOncoKbCnaAnnotations(samples, annotations);
        });
    }
    /**
     * Fetch sample-level structural variants from cBioPortal and merge them into
     * each sample's `structural_variants` field.
     */
    private async fetchAndMergeStructuralVariants(
        base: string,
        studyId: string,
        sampleIdentifiers: SampleIdentifier[]
    ): Promise<void> {
        const bySample = await fetchStructuralVariantDataReadOnly(
            base,
            studyId,
            sampleIdentifiers
        );
        if (!bySample) return;

        this.applyHierarchyMutationAndRefresh(samples => {
            applyStructuralVariantData(samples, bySample);
        });
    }

    private async fetchAndMergeStructuralVariantOncoKbAnnotations(): Promise<
        void
    > {
        const allStructuralVariants = this.collectSampleEntries(
            sample => sample.structural_variants
        );
        const tileOrigin = this.tileServerOrigin;
        if (!tileOrigin) return;

        const annotations = await fetchOncoKbStructuralVariantAnnotationsReadOnly(
            tileOrigin,
            allStructuralVariants
        );
        if (!annotations?.length) return;
        this.applyHierarchyMutationAndRefresh(samples => {
            applyOncoKbStructuralVariantAnnotations(samples, annotations);
        });
    }
    /**
     * Fetch cohort mutation frequencies for all mutations and store as fraction (0–1)
     * in each MutationDetail's `cohortFrequency` field.
     * Uses /api/mutation-counts-by-position/fetch and the study's sequencedSampleCount.
     */
    private async fetchAndMergeMutationFrequency(
        base: string,
        studyId: string
    ): Promise<void> {
        try {
            const mutationFrequencyData = await fetchMutationFrequencyDataReadOnly(
                base,
                studyId,
                this.hierarchy?.samples ?? []
            );
            if (!mutationFrequencyData) return;

            this.applyHierarchyMutation(samples => {
                applyMutationFrequencyData(
                    samples,
                    mutationFrequencyData.counts,
                    mutationFrequencyData.total
                );
            });
        } catch {
            // Non-critical — cohort % simply won't appear
        }
    }

    // ---- render ----

    render() {
        const { height } = this.props;
        const {
            loading,
            error,
            hierarchy,
            selectedSlide,
            selectedSample,
            stainFilter,
            matchFilter,
        } = this;

        if (loading) {
            return (
                <div
                    style={{
                        height,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                >
                    <LoadingIndicator
                        isLoading={true}
                        center={true}
                        size="big"
                    />
                </div>
            );
        }

        if (!hierarchy) {
            return (
                <div
                    style={{
                        height,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#c00',
                    }}
                >
                    {error || 'No data'}
                </div>
            );
        }

        return (
            <div
                style={{
                    display: 'flex',
                    height,
                    overflow: 'hidden',
                    fontFamily: '"Helvetica Neue",Helvetica,Arial,sans-serif',
                    fontSize: 13,
                    color: C.text,
                }}
            >
                {/* Left nav panel */}
                <WsiNavPanel
                    hierarchy={hierarchy}
                    dataVersion={this.hierarchyDataVersion}
                    selectedSlide={selectedSlide}
                    sampleIdFilter={this.props.preferredSampleId}
                    stainFilter={stainFilter}
                    matchFilter={matchFilter}
                    deferOffscreenSamples={!this.tilesReady}
                    onFilterChange={this.handleFilterChange}
                    onMatchFilterChange={this.handleMatchFilterChange}
                    onSelectSlide={this.handleSelectSlide}
                    theme={C}
                    navWidth={NAV_W}
                    sectionTitleStyle={sectionTitleStyle}
                />

                {/* OSD viewer */}
                <div
                    style={{
                        flex: 1,
                        position: 'relative',
                        background: '#e8e8e8',
                    }}
                >
                    <div
                        ref={this.viewerContainerRef}
                        style={{ width: '100%', height: '100%' }}
                    />
                    {/* Custom Bootstrap-styled OSD nav buttons — always in DOM so OSD can adopt them.
                        OSD wires zoom-in/zoom-out/home handlers onto these elements via the
                        zoomInButton/zoomOutButton/homeButton options in mountOSD. */}
                    <div
                        style={{
                            position: 'absolute',
                            top: 8,
                            left: 8,
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 2,
                            zIndex: 100,
                        }}
                    >
                        <button
                            id={`${this.navId}-zoom-in`}
                            className="btn btn-default btn-sm"
                            title="Zoom in"
                            style={{
                                width: 28,
                                padding: '3px 0',
                                lineHeight: 1,
                            }}
                        >
                            <i className="fa fa-plus" />
                        </button>
                        <button
                            id={`${this.navId}-zoom-out`}
                            className="btn btn-default btn-sm"
                            title="Zoom out"
                            style={{
                                width: 28,
                                padding: '3px 0',
                                lineHeight: 1,
                            }}
                        >
                            <i className="fa fa-minus" />
                        </button>
                        <button
                            id={`${this.navId}-home`}
                            className="btn btn-default btn-sm"
                            title="Fit to view"
                            style={{
                                width: 28,
                                padding: '3px 0',
                                lineHeight: 1,
                            }}
                        >
                            <i className="fa fa-home" />
                        </button>
                    </div>
                    {this.spinnerVisible && selectedSlide && (
                        <div
                            data-testid="wsi-loading-spinner"
                            style={{
                                ...overlayStyle,
                                background: 'rgba(232,232,232,0.75)',
                            }}
                        >
                            <i
                                className="fa fa-spinner fa-spin fa-3x"
                                style={{ color: '#888' }}
                            />
                        </div>
                    )}
                    {error && selectedSlide && (
                        <div
                            data-testid="wsi-viewer-error"
                            style={{
                                ...overlayStyle,
                                background: 'rgba(232,232,232,0.92)',
                                zIndex: 110,
                                flexDirection: 'column',
                                gap: 12,
                                padding: 24,
                                textAlign: 'center',
                            }}
                        >
                            <span style={{ color: C.text }}>{error}</span>
                            <button
                                className="btn btn-primary btn-sm"
                                onClick={this.handleRetryViewer}
                            >
                                Retry
                            </button>
                        </div>
                    )}
                    {!selectedSlide && (
                        <div style={overlayStyle}>
                            <span style={{ color: C.muted, fontSize: 13 }}>
                                No viewable slides for this patient
                            </span>
                        </div>
                    )}
                    {this.tilesReady && (
                        <ObservedCoordBar
                            viewer={this}
                            onChangeX={this.handleChangeX}
                            onChangeY={this.handleChangeY}
                            onGo={this.handleGoToCoordinates}
                            onCopyLink={this.handleCopyLink}
                            onDownload={this.handleDownload}
                        />
                    )}
                </div>

                <div
                    role="separator"
                    aria-orientation="vertical"
                    aria-label="Resize metadata sidebar"
                    data-testid="wsi-metadata-resize-handle"
                    onMouseDown={this.beginSidebarResize}
                    style={{
                        width: SIDEBAR_HANDLE_W,
                        cursor: 'col-resize',
                        flexShrink: 0,
                        background: '#f0f0f0',
                        borderRight: `1px solid ${C.border}`,
                        position: 'relative',
                    }}
                >
                    <div
                        style={{
                            position: 'absolute',
                            top: '50%',
                            left: '50%',
                            transform: 'translate(-50%, -50%)',
                            width: 2,
                            height: 36,
                            borderRadius: 2,
                            background: '#c3c3c3',
                            boxShadow: '4px 0 0 #c3c3c3, -4px 0 0 #c3c3c3',
                        }}
                    />
                </div>

                {/* Right metadata sidebar */}
                <WsiMetaSidebar
                    width={this.sidebarWidth}
                    thumbSrc={this.sidebarThumbSrc}
                    thumbDeferred={this.sidebarThumbDeferred}
                    showImageProperties={!!this.selectedMeta}
                    wsiRows={this.selectedWsiRows}
                    showPathology={!!(selectedSlide && selectedSample)}
                    pathRows={this.selectedPathRows}
                    seqRows={this.sidebarSeqRowsForRender}
                    sample={this.sidebarImpactSample}
                />
            </div>
        );
    }
}

// ---- helpers ----

const overlayStyle: React.CSSProperties = {
    position: 'absolute',
    inset: 0,
    zIndex: 10,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    pointerEvents: 'none',
};

// ---- CoordBar ----

interface CoordBarProps {
    inputX: string;
    inputY: string;
    cursorPos: { x: number; y: number } | null;
    mpp?: { x: number; y: number };
    onChangeX: (v: string) => void;
    onChangeY: (v: string) => void;
    onGo: () => void;
    onCopyLink: () => void;
    onDownload: () => void;
}

const ObservedCoordBar = observer(function ObservedCoordBar({
    viewer,
    onChangeX,
    onChangeY,
    onGo,
    onCopyLink,
    onDownload,
}: {
    viewer: CoordBarViewerState;
    onChangeX: (v: string) => void;
    onChangeY: (v: string) => void;
    onGo: () => void;
    onCopyLink: () => void;
    onDownload: () => void;
}) {
    return (
        <CoordBar
            inputX={viewer.coordBarInputX}
            inputY={viewer.coordBarInputY}
            cursorPos={viewer.coordBarCursorPos}
            mpp={viewer.coordBarMpp}
            onChangeX={onChangeX}
            onChangeY={onChangeY}
            onGo={onGo}
            onCopyLink={onCopyLink}
            onDownload={onDownload}
        />
    );
});

function CoordBar({
    inputX,
    inputY,
    cursorPos,
    mpp,
    onChangeX,
    onChangeY,
    onGo,
    onCopyLink,
    onDownload,
}: CoordBarProps) {
    const handleKey = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') onGo();
    };
    const [copied, setCopied] = React.useState(false);

    const handleCopy = () => {
        onCopyLink();
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    let cursorLabel = '';
    if (cursorPos) {
        cursorLabel = `${cursorPos.x.toLocaleString()} × ${cursorPos.y.toLocaleString()} px`;
        if (mpp) {
            const umX = (cursorPos.x * mpp.x).toFixed(1);
            const umY = (cursorPos.y * mpp.y).toFixed(1);
            cursorLabel += `  (${umX} × ${umY} μm)`;
        }
    }

    return (
        <div
            style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '4px 10px',
                background: 'rgba(250,250,250,0.92)',
                borderTop: `1px solid ${C.border}`,
                fontSize: 11,
                color: C.muted,
                backdropFilter: 'blur(2px)',
                zIndex: 10,
            }}
        >
            <span style={{ fontWeight: 600, color: C.text, marginRight: 2 }}>
                Go to:
            </span>
            <div
                className="input-group input-group-sm"
                style={{
                    width: 'auto',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                }}
            >
                <span style={{ color: C.muted }}>X</span>
                <input
                    type="number"
                    value={inputX}
                    placeholder="px"
                    className="form-control input-sm"
                    style={{ width: 88 }}
                    onChange={e => onChangeX(e.target.value)}
                    onKeyDown={handleKey}
                />
                <span style={{ color: C.muted }}>Y</span>
                <input
                    type="number"
                    value={inputY}
                    placeholder="px"
                    className="form-control input-sm"
                    style={{ width: 88 }}
                    onChange={e => onChangeY(e.target.value)}
                    onKeyDown={handleKey}
                />
            </div>
            <button className="btn btn-primary btn-sm" onClick={onGo}>
                Go
            </button>
            <DefaultTooltip
                trigger={['hover']}
                placement="top"
                overlay={
                    <span>
                        Copy a link to this exact view (slide, position, zoom)
                    </span>
                }
            >
                <button
                    className={`btn btn-default btn-sm`}
                    data-testid="wsi-share-button"
                    onClick={handleCopy}
                >
                    {copied ? (
                        <i className="fa fa-check" />
                    ) : (
                        <i className="fa fa-clipboard" />
                    )}
                </button>
            </DefaultTooltip>
            <DefaultTooltip
                trigger={['hover']}
                placement="top"
                overlay={<span>Download current viewport as JPEG</span>}
            >
                <button
                    className="btn btn-default btn-sm"
                    data-testid="wsi-download-button"
                    onClick={onDownload}
                >
                    <i className="fa fa-cloud-download" />
                </button>
            </DefaultTooltip>
            {cursorPos && (
                <span
                    style={{
                        marginLeft: 'auto',
                        color: C.muted,
                        fontFamily: 'monospace',
                        fontSize: 11,
                    }}
                >
                    <i
                        className="fa fa-crosshairs"
                        style={{ marginRight: 3 }}
                    />
                    {cursorLabel}
                </span>
            )}
        </div>
    );
}
