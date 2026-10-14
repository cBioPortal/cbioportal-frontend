import * as React from 'react';
import { observer } from 'mobx-react';
import { observable, action, computed, makeObservable } from 'mobx';
import { DefaultTooltip } from 'cbioportal-frontend-commons';
import {
    PathologySlideFilter,
    PathologySlideMatchFilter,
    Slide,
    Sample,
    PatientHierarchy,
    TileMetadata,
    WsiClinicalRow,
    WsiStainFilter,
} from './wsiViewerTypes';
import {
    getOrderedServableSlidesForSampleReadOnly,
    getServableSlideIdsForPathologyFilterReadOnly,
    matchesMatchFilter,
    matchesWsiStainFilter,
    normalizeMatchLevel,
    sampleHasServableSlide,
} from './wsiSlideUtils';
import { chooseInitialServableSlide } from './wsiInitialSlideUtils';
import { MetaRow, WsiMetaSidebar } from './wsiMetaSidebar';
import { buildPathRows, buildWsiRows } from './wsiMetaUtils';
import { hashUrlState } from './wsiViewStateUtils';
import { compareSamplesForNavigation } from './wsiNavUtils';
import { WsiNavPanel } from './wsiNavPanel';
import {
    WsiInitialSlideLoadPerformance,
    WsiViewerController,
    WsiViewerControllerHost,
} from './wsiViewerController';
import { loadOpenSeadragon } from './wsiOpenSeadragonLoader';
import { clearPatientHierarchyCache } from './wsiHierarchyFetchCache';
import { clearWsiSlideAccess } from './wsiAuth';
import { clearWsiThumbnailFetchCache } from './wsiThumbnailFetchCache';
import {
    chooseScaleBar,
    formatMagnification,
    nativeObjectivePower,
} from './wsiScaleUtils';
import {
    WSI_FONT_FAMILY,
    WSI_MONO_FONT_FAMILY,
    WSI_SIDEBAR_MAX_WIDTH,
    WSI_SIDEBAR_MIN_WIDTH,
    WSI_SIDEBAR_WIDTH,
    WSI_THEME as C,
} from './wsiTheme';
import {
    readWsiPanelFlag,
    WsiCollapsedRail,
    writeWsiPanelFlag,
} from './wsiPanelChrome';

const SIDEBAR_HANDLE_W = 8;
const SLIDE_SELECTION_DEBOUNCE_MS = 120;

/** Browser-stored hidden state of the slide list and the details sidebar. */
export const WSI_NAV_COLLAPSED_KEY = 'wsi.viewer.navCollapsed';
export const WSI_METADATA_COLLAPSED_KEY = 'wsi.viewer.metadataCollapsed';

export interface WsiViewerProps {
    /** Tile-server base URL (never a patient-scoped or resource URL). */
    tileServerUrl: string;
    patientId: string;
    height: number;
    studyId: string;
    initialStainFilter?: WsiStainFilter;
    initialMatchFilter?: PathologySlideMatchFilter;
    preferredSampleId?: string;
    pathologyFilter?: PathologySlideFilter;
    /** Subject that isolates protected in-memory caches (the user name). */
    authScope: string;
    /**
     * Slide named by a `slideKey` viewer link. A URL hash selection wins over
     * it; an ID absent from the loaded hierarchy shows a notice and falls
     * back to the default slide without any backend lookup.
     */
    requestedSlideKey?: string;
    /**
     * Clinical rows for the sidebar, in display order. Rows with a `sampleId`
     * show only for that sample's slides. Unset hides the section; an empty
     * list shows it with no values.
     */
    clinicalRows?: ReadonlyArray<WsiClinicalRow>;
    /** Shows the "download view" control. */
    showDownload?: boolean;
    /** Indicator shown while the hierarchy loads. */
    renderLoading?: () => React.ReactNode;
    /**
     * Hides the slide list. Unset, the viewer keeps the user's choice in
     * browser storage.
     */
    navCollapsed?: boolean;
    onNavCollapsedChange?: (collapsed: boolean) => void;
    /**
     * Hides the image details sidebar. Unset, the viewer keeps the user's
     * choice in browser storage.
     */
    metadataCollapsed?: boolean;
    onMetadataCollapsedChange?: (collapsed: boolean) => void;
    /**
     * The host hides the viewer without unmounting it (e.g. an inactive
     * tab). Background work such as token refresh pauses meanwhile.
     */
    hidden?: boolean;
}

function DefaultLoadingIndicator() {
    return (
        <i
            role="status"
            aria-label="Loading"
            className="fa fa-spinner fa-spin fa-3x"
            style={{ color: '#888' }}
        />
    );
}

/** What the status bar reads from the viewer. */
interface StatusBarViewerState {
    coordInputX: string;
    coordInputY: string;
    cursorPos: { x: number; y: number } | null;
    viewScale: number | null;
    readonly selectedMpp?: { x: number; y: number };
    readonly selectedObjectivePower?: number;
}

function getInitialMatchFilter(
    pathologyFilter?: PathologySlideFilter
): PathologySlideMatchFilter {
    const matchLevel = normalizeMatchLevel(pathologyFilter?.matchLevel);
    return matchLevel
        ? (matchLevel.toLowerCase() as PathologySlideMatchFilter)
        : 'all';
}

/**
 * Patient slide viewer: loads the patient's slide hierarchy from the portal
 * and shows the selected slide.
 */
@observer
export default class WSIViewer extends React.Component<WsiViewerProps, {}> {
    @observable private hierarchy: PatientHierarchy | null = null;
    @observable private selectedSlide: Slide | null = null;
    @observable private selectedSample: Sample | null = null;
    @observable private selectedMeta: TileMetadata | null = null;
    @observable private loading = true;
    @observable private error: string | null = null;
    @observable private viewerReady = false;
    /** True once OSD has loaded the first tile; used to release deferred
     *  sidebar content after the initial viewer work settles. */
    @observable private tilesReady = false;
    /** Separate flag that controls spinner visibility; set true on slide select,
     *  set false after viewerReady AND at least MIN_SPINNER_MS have elapsed.
     *  Decoupled from viewerReady so viewport setup isn't delayed. */
    @observable private spinnerVisible = false;
    @observable private thumbnailPreviewUrl: string | null = null;
    @observable private stainFilter: WsiStainFilter = 'all';
    @observable private matchFilter: PathologySlideMatchFilter = 'all';
    @observable private linkoutScopeActive = false;
    @observable private sidebarWidth = WSI_SIDEBAR_WIDTH;
    @observable private storedNavCollapsed = readWsiPanelFlag(
        WSI_NAV_COLLAPSED_KEY
    );
    @observable private storedMetadataCollapsed = readWsiPanelFlag(
        WSI_METADATA_COLLAPSED_KEY
    );
    /** Coordinate bar — input field values */
    @observable coordInputX = '';
    @observable coordInputY = '';
    /** Current cursor position in image pixels (null when viewer not ready or cursor outside) */
    @observable cursorPos: { x: number; y: number } | null = null;
    /** Screen pixels per image pixel at the current zoom. */
    @observable viewScale: number | null = null;

    private viewerContainerRef = React.createRef<HTMLDivElement>();
    private resizeStartX = 0;
    private resizeStartWidth = 0;
    private isResizingSidebar = false;
    private controller: WsiViewerController;
    @observable private requestedSlideNoticeDismissed = false;
    private slideSelectionTimer: ReturnType<typeof setTimeout> | null = null;

    /** Per-instance ID prefix of the OSD zoom buttons. */
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

    private readonly releaseLinkoutScope = action(() => {
        if (!this.linkoutScopeActive) {
            return false;
        }
        this.linkoutScopeActive = false;
        return true;
    });

    private readonly handleFilterChange = action((f: WsiStainFilter) => {
        const releasedScope = this.releaseLinkoutScope();
        if (this.stainFilter === f && !releasedScope) {
            return;
        }
        this.cancelPendingSlideSelection();
        this.stainFilter = f;
        void this.reselectSlideForCurrentFilters();
    });
    private readonly handleMatchFilterChange = action(
        (f: PathologySlideMatchFilter) => {
            const releasedScope = this.releaseLinkoutScope();
            if (this.matchFilter === f && !releasedScope) {
                return;
            }
            this.cancelPendingSlideSelection();
            this.matchFilter = f;
            void this.reselectSlideForCurrentFilters();
        }
    );
    private readonly handleClearFilters = action(() => {
        this.cancelPendingSlideSelection();
        this.linkoutScopeActive = false;
        this.stainFilter = 'all';
        this.matchFilter = 'all';
        void this.reselectSlideForCurrentFilters();
    });
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
    private unsubscribeUrlState: (() => void) | null = null;
    private readonly handleRetryViewer = () => {
        void this.controller.retrySelectedSlide();
    };
    private readonly handleChangeX = action((v: string) => {
        this.coordInputX = v;
    });
    private readonly handleChangeY = action((v: string) => {
        this.coordInputY = v;
    });
    private readonly handleCopyLink = () => this.controller.copyViewLink();
    private readonly handleDownload = () => this.controller.downloadView();
    private readonly handleGoToCoordinates = () =>
        this.controller.goToCoordinates();
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

    constructor(props: WsiViewerProps) {
        super(props);
        makeObservable(this);
        if (props.initialStainFilter) {
            this.stainFilter = props.initialStainFilter;
        }
        this.matchFilter =
            props.initialMatchFilter ||
            getInitialMatchFilter(props.pathologyFilter);
        this.linkoutScopeActive = !!props.pathologyFilter;
        this.controller = new WsiViewerController(
            this.createControllerHost(),
            loadOpenSeadragon
        );
    }

    @computed private get navCollapsed(): boolean {
        return this.props.navCollapsed ?? this.storedNavCollapsed;
    }

    @computed private get metadataCollapsed(): boolean {
        return this.props.metadataCollapsed ?? this.storedMetadataCollapsed;
    }

    @action.bound
    private setNavCollapsed(collapsed: boolean) {
        if (this.props.navCollapsed === undefined) {
            this.storedNavCollapsed = collapsed;
            writeWsiPanelFlag(WSI_NAV_COLLAPSED_KEY, collapsed);
        }
        this.props.onNavCollapsedChange?.(collapsed);
        this.resizeAfterLayout();
    }

    @action.bound
    private setMetadataCollapsed(collapsed: boolean) {
        if (this.props.metadataCollapsed === undefined) {
            this.storedMetadataCollapsed = collapsed;
            writeWsiPanelFlag(WSI_METADATA_COLLAPSED_KEY, collapsed);
        }
        this.props.onMetadataCollapsedChange?.(collapsed);
        this.resizeAfterLayout();
    }

    private readonly hideNav = () => this.setNavCollapsed(true);
    private readonly showNav = () => this.setNavCollapsed(false);
    private readonly hideMetadata = () => this.setMetadataCollapsed(true);
    private readonly showMetadata = () => this.setMetadataCollapsed(false);

    /** Lets OpenSeadragon pick up the viewer's new size after a panel toggles. */
    private resizeAfterLayout() {
        if (typeof window.requestAnimationFrame === 'function') {
            window.requestAnimationFrame(() => this.controller.forceResize());
        } else {
            this.controller.forceResize();
        }
    }

    @action.bound
    private setSidebarWidth(width: number) {
        const clamped = Math.max(
            WSI_SIDEBAR_MIN_WIDTH,
            Math.min(WSI_SIDEBAR_MAX_WIDTH, width)
        );
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
            setHierarchy: hierarchy => {
                this.hierarchy = hierarchy;
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
            setThumbnailPreview: action(objectUrl => {
                this.thumbnailPreviewUrl = objectUrl;
            }),
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
                this.thumbnailPreviewUrl = null;
                this.viewScale = null;
            },
            getPatientId: () => this.hierarchy?.patient_id,
            setCoordInputs: (x, y) => this.setCoordInputs(x, y),
            getCoordInputs: () => ({
                x: this.coordInputX,
                y: this.coordInputY,
            }),
            updateCursorPos: (x, y) => this.handleCursorMove(x, y),
            clearCursorPos: () => this.clearCursorPos(),
            setViewScale: scale => this.setViewScale(scale),
            reportInitialSlideLoadPerformance: metric =>
                this.reportInitialSlideLoadPerformance(metric),
        };
    }

    /** Announces how the first slide loaded, for browser-side monitoring. */
    private reportInitialSlideLoadPerformance(
        metric: WsiInitialSlideLoadPerformance
    ) {
        window.dispatchEvent(
            new CustomEvent('wsi-initial-slide-performance', {
                detail: metric,
            })
        );
    }

    componentDidMount() {
        this.unsubscribeUrlState = hashUrlState.subscribe(
            this.handleHashChange
        );
        if (typeof document !== 'undefined') {
            document.addEventListener(
                'visibilitychange',
                this.updateControllerVisibility
            );
        }
        this.updateControllerVisibility();
        void this.controller.loadHierarchy();
    }

    private readonly updateControllerVisibility = () => {
        const pageHidden =
            typeof document !== 'undefined' &&
            document.visibilityState === 'hidden';
        this.controller.setVisible(!this.props.hidden && !pageHidden);
    };

    private async selectSlideFromHash(): Promise<void> {
        const hashState = hashUrlState.read();
        if (!hashState || !this.hierarchy) return;

        const preferredSlideKeys = this.preferredSlideKeys;
        const matching = this.servableSlides.find(
            entry =>
                entry.slide.slide_key === hashState.slideId &&
                (!preferredSlideKeys ||
                    preferredSlideKeys.has(entry.slide.slide_key))
        );
        if (!matching) return;

        if (this.selectedSlide?.slide_key === matching.slide.slide_key) {
            this.controller.restoreCurrentViewportFromHash();
            return;
        }

        await this.controller.selectSlide(
            matching.slide,
            matching.sample,
            true
        );
    }

    componentDidUpdate(prev: WsiViewerProps) {
        const authScopeChanged = prev.authScope !== this.props.authScope;
        const preferredSampleChanged =
            prev.preferredSampleId !== this.props.preferredSampleId;
        const requestedSlideKeyChanged =
            prev.requestedSlideKey !== this.props.requestedSlideKey;
        const pathologyFilterChanged =
            !!prev.pathologyFilter !== !!this.props.pathologyFilter ||
            prev.pathologyFilter?.sampleId !==
                this.props.pathologyFilter?.sampleId ||
            prev.pathologyFilter?.matchLevel !==
                this.props.pathologyFilter?.matchLevel ||
            prev.pathologyFilter?.specimenKey !==
                this.props.pathologyFilter?.specimenKey;
        const initialMatchFilterChanged =
            prev.initialMatchFilter !== this.props.initialMatchFilter;
        const requiresHierarchyReload =
            authScopeChanged ||
            prev.studyId !== this.props.studyId ||
            prev.tileServerUrl !== this.props.tileServerUrl ||
            prev.patientId !== this.props.patientId ||
            (pathologyFilterChanged && !this.hierarchy);
        const stainFilterChanged =
            prev.initialStainFilter !== this.props.initialStainFilter;

        if (prev.hidden !== this.props.hidden) {
            this.updateControllerVisibility();
        }

        if (requestedSlideKeyChanged) {
            this.requestedSlideNoticeDismissed = false;
        }

        if (authScopeChanged) {
            clearPatientHierarchyCache();
            clearWsiSlideAccess();
            clearWsiThumbnailFetchCache();
        }

        if (pathologyFilterChanged) {
            this.linkoutScopeActive = !!this.props.pathologyFilter;
            this.matchFilter =
                this.props.initialMatchFilter ||
                getInitialMatchFilter(this.props.pathologyFilter);
            if (stainFilterChanged) {
                this.stainFilter = this.props.initialStainFilter || 'all';
            }
        } else if (initialMatchFilterChanged) {
            this.matchFilter =
                this.props.initialMatchFilter || this.matchFilter;
        } else if (stainFilterChanged) {
            this.stainFilter = this.props.initialStainFilter || 'all';
        }

        if (requiresHierarchyReload) {
            this.controller.dispose();
            void this.controller.loadHierarchy(false);
        } else if (pathologyFilterChanged) {
            this.applyPathologyFilterFromSourceHierarchy();
        } else if (initialMatchFilterChanged || stainFilterChanged) {
            void this.reselectSlideForCurrentFilters();
        } else if (preferredSampleChanged || requestedSlideKeyChanged) {
            void this.reselectPreferredSampleSlide();
        }
    }

    componentWillUnmount() {
        this.unsubscribeUrlState?.();
        this.unsubscribeUrlState = null;
        if (typeof document !== 'undefined') {
            document.removeEventListener(
                'visibilitychange',
                this.updateControllerVisibility
            );
        }
        this.cancelPendingSlideSelection();
        action(() => {
            this.hierarchy = null; // stops the prefetchSlideMetadata loop
        })();
        this.controller.dispose();
        this.handleSidebarResizeEnd();
    }

    // ---- data loading ----

    @action.bound
    private resetHierarchyLoadState() {
        this.loading = true;
        this.error = null;
        this.hierarchy = null;
        this.selectedSlide = null;
        this.selectedSample = null;
        this.selectedMeta = null;
        this.viewerReady = false;
        this.tilesReady = false;
        this.spinnerVisible = false;
        this.thumbnailPreviewUrl = null;
        this.cursorPos = null;
        this.viewScale = null;
        this.coordInputX = '';
        this.coordInputY = '';
    }

    private get controllerProps() {
        return {
            studyId: this.props.studyId,
            patientId: this.props.patientId,
            authScope: this.props.authScope,
        };
    }

    private get activePathologyFilter(): PathologySlideFilter | undefined {
        return this.linkoutScopeActive ? this.props.pathologyFilter : undefined;
    }

    /** Slides the active linkout scope allows; undefined when unscoped. */
    @computed private get preferredSlideKeys(): Set<string> | undefined {
        const filter = this.activePathologyFilter;
        return this.hierarchy && filter
            ? getServableSlideIdsForPathologyFilterReadOnly(
                  this.hierarchy,
                  filter
              )
            : undefined;
    }

    /**
     * The sample a sample-only link scopes the slide list to. A specimen or
     * match-level link can name a source sample that is not a portal sample
     * and fall back to unmatched slides, so only a scope with nothing but a
     * sample hides the other samples outright.
     */
    private get scopedSampleId(): string | undefined {
        const filter = this.activePathologyFilter;
        return filter?.sampleId && !filter.matchLevel && !filter.specimenKey
            ? filter.sampleId
            : undefined;
    }

    @action.bound
    private applyPathologyFilterFromSourceHierarchy() {
        const hierarchy = this.hierarchy;
        if (!hierarchy) {
            return;
        }

        const preferredSlideKeys = this.preferredSlideKeys;
        if (preferredSlideKeys) {
            const currentSlideKey = this.selectedSlide?.slide_key;
            const currentSampleId = this.selectedSample?.sample_id;
            const currentSample = hierarchy.samples.find(
                sample => sample.sample_id === currentSampleId
            );
            const firstMatchingSlide = currentSample
                ? getOrderedServableSlidesForSampleReadOnly(currentSample).find(
                      ({ slide }) =>
                          preferredSlideKeys.has(slide.slide_key) &&
                          matchesWsiStainFilter(slide, this.stainFilter)
                  )?.slide
                : undefined;
            if (
                currentSlideKey &&
                firstMatchingSlide?.slide_key === currentSlideKey
            ) {
                this.selectedSlide = firstMatchingSlide;
                this.selectedSample = currentSample!;
                return;
            }
            void this.reselectSlideForPathologyFilter(preferredSlideKeys);
            return;
        }

        const currentSlideKey = this.selectedSlide?.slide_key;
        const currentSampleId = this.selectedSample?.sample_id;
        if (!currentSlideKey || !currentSampleId) {
            void this.reselectSlideForCurrentFilters();
            return;
        }

        const matchingSample = hierarchy.samples.find(
            sample =>
                sample.sample_id === currentSampleId &&
                sampleHasServableSlide(sample, currentSlideKey)
        );
        const matchingSlide = matchingSample
            ? getOrderedServableSlidesForSampleReadOnly(matchingSample).find(
                  ({ slide }) => slide.slide_key === currentSlideKey
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
        preferredSlideKeys: Set<string>
    ): Promise<void> {
        const servableSlides = this.servableSlides;
        if (!this.hierarchy || !servableSlides.length) {
            return;
        }

        const next = chooseInitialServableSlide(servableSlides, {
            preferredSampleId: this.props.preferredSampleId,
            stainFilter: this.stainFilter,
            matchesEntry: entry =>
                preferredSlideKeys.has(entry.slide.slide_key),
        });

        if (!next) {
            this.controller.clearSelectedSlide();
            return;
        }

        if (
            this.selectedSlide?.slide_key === next.slide.slide_key &&
            this.selectedSample?.sample_id === next.sample.sample_id
        ) {
            return;
        }

        await this.controller.selectSlide(next.slide, next.sample);
    }

    private chooseInitialServableSlide(
        allSlides: Array<{ slide: Slide; sample: Sample }>
    ) {
        const hashState = hashUrlState.read();
        const preferredSlideKeys = this.preferredSlideKeys;

        return chooseInitialServableSlide(allSlides, {
            preferredSampleId: this.props.preferredSampleId,
            preferredSlideId: hashState?.slideId,
            requestedSlideKey: this.props.requestedSlideKey,
            stainFilter: this.stainFilter,
            matchesEntry: entry =>
                !preferredSlideKeys ||
                preferredSlideKeys.has(entry.slide.slide_key),
        });
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

    /** Skips changes too small to move the scale bar or magnification. */
    @action.bound
    private setViewScale(scale: number | null) {
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

    private async reselectPreferredSampleSlide(): Promise<void> {
        if (!this.hierarchy || !this.servableSlides.length) {
            return;
        }

        const next = this.chooseInitialServableSlide(this.servableSlides);
        if (!next) {
            return;
        }

        if (
            this.selectedSlide?.slide_key === next.slide.slide_key &&
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

        const preferredSlideKeys = this.preferredSlideKeys;
        const matchingSlides = servableSlides.filter(({ slide }) => {
            if (
                preferredSlideKeys &&
                !preferredSlideKeys.has(slide.slide_key)
            ) {
                return false;
            }
            if (!matchesWsiStainFilter(slide, this.stainFilter)) {
                return false;
            }
            return matchesMatchFilter(slide, this.matchFilter);
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

    @computed get servableSlides(): Array<{ slide: Slide; sample: Sample }> {
        if (!this.hierarchy) return [];
        return [...this.hierarchy.samples]
            .sort(compareSamplesForNavigation)
            .flatMap(sample =>
                getOrderedServableSlidesForSampleReadOnly(
                    sample
                ).map(({ slide }) => ({ slide, sample }))
            );
    }

    /** True when a `slideKey` link names a slide this patient cannot serve. */
    @computed get requestedSlideUnavailable(): boolean {
        const requestedSlideKey = this.props.requestedSlideKey;
        return (
            !!requestedSlideKey &&
            !!this.hierarchy &&
            !this.servableSlides.some(
                entry => entry.slide.slide_key === requestedSlideKey
            )
        );
    }

    @action.bound
    private dismissRequestedSlideNotice() {
        this.requestedSlideNoticeDismissed = true;
    }

    /** Patient rows plus the selected sample's rows. */
    @computed get selectedClinicalRows(): WsiClinicalRow[] | undefined {
        const rows = this.props.clinicalRows;
        if (!rows) return undefined;
        const sampleId = this.selectedSample?.sample_id;
        return rows.filter(row => !row.sampleId || row.sampleId === sampleId);
    }

    @computed get tileServerBase(): string {
        return this.props.tileServerUrl.replace(/\/$/, '');
    }

    get selectedMpp(): { x: number; y: number } | undefined {
        return this.selectedMeta?.mpp;
    }

    get selectedObjectivePower(): number | undefined {
        return nativeObjectivePower(this.selectedMeta);
    }

    @computed
    private get selectedWsiRows(): MetaRow[] {
        return this.selectedMeta
            ? buildWsiRows(this.selectedSlide, this.selectedMeta)
            : [];
    }

    @computed
    private get selectedPathRows(): MetaRow[] {
        if (!this.selectedSlide || !this.selectedSample) {
            return [];
        }
        return buildPathRows(
            this.selectedSlide,
            this.selectedSample,
            this.props.patientId,
            this.props.studyId
        );
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
            thumbnailPreviewUrl,
            stainFilter,
            matchFilter,
        } = this;
        const showClearFilters =
            !!this.activePathologyFilter ||
            !!this.props.preferredSampleId ||
            this.props.initialStainFilter === 'hne' ||
            this.props.initialStainFilter === 'ihc' ||
            stainFilter !== 'all' ||
            matchFilter !== 'all';

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
                    {this.props.renderLoading ? (
                        this.props.renderLoading()
                    ) : (
                        <DefaultLoadingIndicator />
                    )}
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
                    fontFamily: WSI_FONT_FAMILY,
                    fontSize: 13,
                    color: C.text,
                }}
            >
                {/* Left nav panel */}
                {this.navCollapsed ? (
                    <WsiCollapsedRail
                        side="left"
                        title="Slides"
                        showLabel="Show slide list"
                        onExpand={this.showNav}
                        background={C.navBg}
                        testId="wsi-nav-rail"
                    />
                ) : (
                    <WsiNavPanel
                        hierarchy={hierarchy}
                        selectedSlide={selectedSlide}
                        sampleIdFilter={this.scopedSampleId}
                        slideIdFilter={this.preferredSlideKeys}
                        linkoutScopeActive={this.linkoutScopeActive}
                        stainFilter={stainFilter}
                        matchFilter={matchFilter}
                        showClearFilters={showClearFilters}
                        deferOffscreenSamples={!this.tilesReady}
                        onFilterChange={this.handleFilterChange}
                        onMatchFilterChange={this.handleMatchFilterChange}
                        onClearFilters={this.handleClearFilters}
                        onSelectSlide={this.handleSelectSlide}
                        tileServerBase={this.tileServerBase}
                        studyId={this.props.studyId}
                        authScope={this.props.authScope}
                        onHide={this.hideNav}
                    />
                )}

                {/* OSD viewer */}
                <div
                    style={{
                        flex: 1,
                        position: 'relative',
                        background: C.stageBg,
                    }}
                >
                    {selectedSlide && thumbnailPreviewUrl && (
                        <img
                            data-testid="wsi-thumbnail-preview"
                            src={thumbnailPreviewUrl}
                            alt=""
                            aria-hidden="true"
                            style={{
                                position: 'absolute',
                                inset: 0,
                                width: '100%',
                                height: '100%',
                                objectFit: 'contain',
                                pointerEvents: 'none',
                                zIndex: 0,
                            }}
                        />
                    )}
                    <div
                        ref={this.viewerContainerRef}
                        style={{
                            width: '100%',
                            height: '100%',
                            position: 'relative',
                            zIndex: 1,
                            background: 'transparent',
                        }}
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
                        {ZOOM_BUTTONS.map(({ id, title, icon }) => (
                            <button
                                key={id}
                                id={`${this.navId}-${id}`}
                                className="btn btn-default btn-sm"
                                title={title}
                                style={{
                                    width: 28,
                                    padding: '3px 0',
                                    lineHeight: 1,
                                }}
                            >
                                <i className={`fa ${icon}`} />
                            </button>
                        ))}
                    </div>
                    {this.requestedSlideUnavailable &&
                        !this.requestedSlideNoticeDismissed && (
                            <div
                                role="status"
                                data-testid="wsi-requested-slide-unavailable"
                                style={{
                                    position: 'absolute',
                                    top: 8,
                                    left: '50%',
                                    transform: 'translateX(-50%)',
                                    zIndex: 120,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 8,
                                    padding: '6px 10px',
                                    borderRadius: 3,
                                    color: C.text,
                                    background: '#fcf8e3',
                                    border: '1px solid #faebcc',
                                    boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
                                    fontSize: 12,
                                }}
                            >
                                <span>
                                    The requested slide is not available.
                                    Showing the default slide instead.
                                </span>
                                <button
                                    type="button"
                                    className="close"
                                    aria-label="Dismiss"
                                    onClick={this.dismissRequestedSlideNotice}
                                    style={{ float: 'none', fontSize: 16 }}
                                >
                                    &times;
                                </button>
                            </div>
                        )}
                    {this.spinnerVisible && selectedSlide && (
                        <div
                            data-testid="wsi-loading-spinner"
                            style={{
                                ...overlayStyle,
                                background: thumbnailPreviewUrl
                                    ? 'rgba(43,45,49,0.12)'
                                    : 'rgba(43,45,49,0.6)',
                            }}
                        >
                            {thumbnailPreviewUrl ? (
                                <div
                                    role="status"
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 8,
                                        padding: '7px 10px',
                                        borderRadius: 3,
                                        color: C.stageText,
                                        background: 'rgba(28,30,33,0.85)',
                                        boxShadow: '0 1px 4px rgba(0,0,0,0.35)',
                                        fontSize: 12,
                                    }}
                                >
                                    <i
                                        className="fa fa-spinner fa-spin"
                                        style={{ color: C.stageMuted }}
                                    />
                                    <span>Loading full-resolution image…</span>
                                </div>
                            ) : (
                                <i
                                    className="fa fa-spinner fa-spin fa-3x"
                                    style={{ color: C.stageMuted }}
                                />
                            )}
                        </div>
                    )}
                    {error && selectedSlide && (
                        <div
                            data-testid="wsi-viewer-error"
                            style={{
                                ...overlayStyle,
                                background: 'rgba(43,45,49,0.94)',
                                zIndex: 110,
                                pointerEvents: 'auto',
                                flexDirection: 'column',
                                gap: 12,
                                padding: 24,
                                textAlign: 'center',
                            }}
                        >
                            <span style={{ color: C.stageText }}>{error}</span>
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
                            <span style={{ color: C.stageMuted, fontSize: 13 }}>
                                No viewable slides for this patient
                            </span>
                        </div>
                    )}
                    {this.tilesReady && (
                        <ViewerStatusBar
                            viewer={this}
                            onChangeX={this.handleChangeX}
                            onChangeY={this.handleChangeY}
                            onGo={this.handleGoToCoordinates}
                            onCopyLink={this.handleCopyLink}
                            onDownload={this.handleDownload}
                            showDownload={!!this.props.showDownload}
                        />
                    )}
                </div>

                {this.metadataCollapsed ? (
                    <WsiCollapsedRail
                        side="right"
                        title="Details"
                        showLabel="Show image details"
                        onExpand={this.showMetadata}
                        background={C.sidebarBg}
                        testId="wsi-metadata-rail"
                    />
                ) : (
                    <>
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
                                    boxShadow:
                                        '4px 0 0 #c3c3c3, -4px 0 0 #c3c3c3',
                                }}
                            />
                        </div>

                        {/* Right metadata sidebar */}
                        <WsiMetaSidebar
                            width={this.sidebarWidth}
                            showImageProperties={!!this.selectedMeta}
                            wsiRows={this.selectedWsiRows}
                            showPathology={!!(selectedSlide && selectedSample)}
                            pathRows={this.selectedPathRows}
                            clinicalRows={this.selectedClinicalRows}
                            onHide={this.hideMetadata}
                        />
                    </>
                )}
            </div>
        );
    }
}

// ---- helpers ----

/** OSD adopts these by id (`zoomInButton`, `zoomOutButton`, `homeButton`). */
const ZOOM_BUTTONS = [
    { id: 'zoom-in', title: 'Zoom in', icon: 'fa-plus' },
    { id: 'zoom-out', title: 'Zoom out', icon: 'fa-minus' },
    { id: 'home', title: 'Fit to view', icon: 'fa-home' },
];

const overlayStyle: React.CSSProperties = {
    position: 'absolute',
    inset: 0,
    zIndex: 10,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    pointerEvents: 'none',
};

// ---- ViewerStatusBar ----

interface ViewerStatusBarProps {
    viewer: StatusBarViewerState;
    onChangeX: (v: string) => void;
    onChangeY: (v: string) => void;
    onGo: () => void;
    onCopyLink: () => void;
    onDownload: () => void;
    showDownload: boolean;
}

const statusIconButtonStyle: React.CSSProperties = {
    width: 26,
    height: 24,
    padding: 0,
    border: '1px solid rgba(255,255,255,0.18)',
    borderRadius: 3,
    background: 'rgba(255,255,255,0.06)',
    color: C.stageText,
    lineHeight: '22px',
};

const statusInputStyle: React.CSSProperties = {
    width: 76,
    height: 22,
    padding: '0 5px',
    border: '1px solid rgba(255,255,255,0.25)',
    borderRadius: 3,
    background: 'rgba(0,0,0,0.25)',
    color: C.stageText,
    fontFamily: WSI_MONO_FONT_FAMILY,
    fontSize: 11,
};

/**
 * The strip along the bottom of the slide: the on-screen magnification and a
 * scale bar on the left, the cursor's position and the view tools on the right.
 */
const ViewerStatusBar = observer(function ViewerStatusBar({
    viewer,
    onChangeX,
    onChangeY,
    onGo,
    onCopyLink,
    onDownload,
    showDownload,
}: ViewerStatusBarProps) {
    const {
        coordInputX: inputX,
        coordInputY: inputY,
        cursorPos,
        viewScale,
        selectedMpp: mpp,
        selectedObjectivePower,
    } = viewer;
    const [copied, setCopied] = React.useState(false);
    const [goToOpen, setGoToOpen] = React.useState(false);
    const handleKey = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') onGo();
        if (e.key === 'Escape') setGoToOpen(false);
    };

    const handleCopy = () => {
        onCopyLink();
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const magnification =
        viewScale !== null
            ? formatMagnification(selectedObjectivePower, viewScale)
            : undefined;
    const scaleBar =
        viewScale !== null && mpp?.x
            ? chooseScaleBar(mpp.x / viewScale)
            : undefined;

    let cursorLabel = '';
    if (cursorPos) {
        cursorLabel = mpp
            ? `${formatMicronPosition(
                  cursorPos.x * mpp.x
              )}, ${formatMicronPosition(cursorPos.y * mpp.y)}`
            : `${cursorPos.x.toLocaleString()}, ${cursorPos.y.toLocaleString()} px`;
    }

    return (
        <div
            data-testid="wsi-status-bar"
            style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '5px 10px',
                background:
                    'linear-gradient(to top, rgba(24,25,28,0.88), rgba(24,25,28,0.72))',
                borderTop: '1px solid rgba(255,255,255,0.08)',
                fontSize: 11,
                color: C.stageText,
                fontFamily: WSI_MONO_FONT_FAMILY,
                fontVariantNumeric: 'tabular-nums',
                zIndex: 10,
            }}
        >
            {magnification && (
                <span
                    data-testid="wsi-magnification"
                    title="Magnification on screen"
                    style={{
                        minWidth: 44,
                        padding: '1px 6px',
                        borderRadius: 3,
                        background: 'rgba(255,255,255,0.1)',
                        fontWeight: 700,
                        textAlign: 'center',
                    }}
                >
                    {magnification}
                </span>
            )}
            {scaleBar && (
                <span
                    data-testid="wsi-scale-bar"
                    title="Scale"
                    style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                    }}
                >
                    <span
                        aria-hidden="true"
                        style={{
                            display: 'inline-block',
                            width: scaleBar.widthPx,
                            height: 6,
                            borderLeft: `2px solid ${C.stageText}`,
                            borderRight: `2px solid ${C.stageText}`,
                            borderBottom: `2px solid ${C.stageText}`,
                            transition: 'width 120ms',
                        }}
                    />
                    <span>{scaleBar.label}</span>
                </span>
            )}
            <span style={{ flex: 1 }} />
            {cursorPos && (
                <span
                    data-testid="wsi-cursor-position"
                    style={{ color: C.stageMuted, whiteSpace: 'nowrap' }}
                >
                    {cursorLabel}
                </span>
            )}
            {goToOpen && (
                <span
                    style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                    }}
                >
                    <input
                        type="number"
                        aria-label="X in image pixels"
                        value={inputX}
                        placeholder="x px"
                        autoFocus
                        style={statusInputStyle}
                        onChange={e => onChangeX(e.target.value)}
                        onKeyDown={handleKey}
                    />
                    <input
                        type="number"
                        aria-label="Y in image pixels"
                        value={inputY}
                        placeholder="y px"
                        style={statusInputStyle}
                        onChange={e => onChangeY(e.target.value)}
                        onKeyDown={handleKey}
                    />
                    <button
                        type="button"
                        className="btn btn-primary btn-xs"
                        style={{ height: 22 }}
                        onClick={onGo}
                    >
                        Go
                    </button>
                </span>
            )}
            <DefaultTooltip
                trigger={['hover']}
                placement="top"
                overlay={<span>Go to a position (image pixels)</span>}
            >
                <button
                    type="button"
                    data-testid="wsi-goto-button"
                    aria-label="Go to a position"
                    aria-expanded={goToOpen}
                    style={{
                        ...statusIconButtonStyle,
                        ...(goToOpen
                            ? { background: 'rgba(255,255,255,0.2)' }
                            : {}),
                    }}
                    onClick={() => setGoToOpen(open => !open)}
                >
                    <i className="fa fa-crosshairs" />
                </button>
            </DefaultTooltip>
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
                    type="button"
                    data-testid="wsi-share-button"
                    aria-label="Copy a link to this view"
                    style={statusIconButtonStyle}
                    onClick={handleCopy}
                >
                    {copied ? (
                        <i className="fa fa-check" />
                    ) : (
                        <i className="fa fa-link" />
                    )}
                </button>
            </DefaultTooltip>
            {showDownload && (
                <DefaultTooltip
                    trigger={['hover']}
                    placement="top"
                    overlay={<span>Download current viewport as JPEG</span>}
                >
                    <button
                        type="button"
                        data-testid="wsi-download-button"
                        aria-label="Download this view"
                        style={statusIconButtonStyle}
                        onClick={onDownload}
                    >
                        <i className="fa fa-download" />
                    </button>
                </DefaultTooltip>
            )}
        </div>
    );
});

/** A position on the tissue: µm below a millimetre, mm from there. */
function formatMicronPosition(microns: number): string {
    return microns >= 1000
        ? `${(microns / 1000).toFixed(2)} mm`
        : `${microns.toFixed(0)} µm`;
}
