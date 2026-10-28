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
import { WsiViewerState } from './wsiViewerState';
import { loadOpenSeadragon } from './wsiOpenSeadragonLoader';
import { clearPatientHierarchyCache } from './wsiHierarchyFetchCache';
import { clearWsiSlideAccess } from './wsiAuth';
import { clearWsiThumbnailFetchCache } from './wsiThumbnailFetchCache';
import { chooseScaleBar, formatMagnification } from './wsiScaleUtils';
import {
    WSI_FONT_FAMILY,
    WSI_SIDEBAR_MAX_WIDTH,
    WSI_SIDEBAR_MIN_WIDTH,
    WSI_SIDEBAR_WIDTH,
    WSI_THEME as C,
} from './wsiTheme';
import {
    readWsiPanelFlag,
    WSI_METADATA_COLLAPSED_KEY,
    WSI_NAV_COLLAPSED_KEY,
    WsiCollapsedRail,
    WsiRailSection,
    writeWsiPanelFlag,
} from './wsiPanelChrome';
import { getStainDotColor } from './wsiMetaUtils';

const SIDEBAR_HANDLE_W = 8;
const SLIDE_SELECTION_DEBOUNCE_MS = 120;

export { WSI_METADATA_COLLAPSED_KEY, WSI_NAV_COLLAPSED_KEY };

/** Keys that show or hide the slide list and the details sidebar. */
const NAV_TOGGLE_KEY = '|';
const METADATA_TOGGLE_KEY = '.';

function isTypingTarget(target: EventTarget | null): boolean {
    const element = target as HTMLElement | null;
    if (!element || !element.tagName) {
        return false;
    }
    const tag = element.tagName.toLowerCase();
    return (
        tag === 'input' ||
        tag === 'textarea' ||
        tag === 'select' ||
        element.isContentEditable
    );
}

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
    /**
     * The host owns the `pathologyFilter` sample (e.g. the patient page's
     * sample filter shows and widens it). The slide list then shows no
     * "Sample …" chip, counts its filters within that sample, and its
     * filters and their reset ("Clear filters") never widen past it.
     */
    hostOwnsSampleScope?: boolean;
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
    /**
     * The host's own hidden panels, shown above the slide list's when that
     * is hidden too, so the two read as one rail.
     */
    leadingRailSections?: ReadonlyArray<WsiRailSection>;
    /** The host's badge for a sample in the slide list, e.g. patient view's numbered sample icon. */
    renderSampleLabel?: (sampleId: string) => React.ReactNode;
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
    private readonly viewerState = new WsiViewerState();
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
        if (!this.linkoutScopeActive || this.hostOwnsScopedSample) {
            return false;
        }
        this.linkoutScopeActive = false;
        return true;
    });

    private readonly applyFilters = action(
        (
            stainFilter: WsiStainFilter,
            matchFilter: PathologySlideMatchFilter
        ) => {
            const releasedScope = this.releaseLinkoutScope();
            if (
                this.stainFilter === stainFilter &&
                this.matchFilter === matchFilter &&
                !releasedScope
            ) {
                return;
            }
            this.cancelPendingSlideSelection();
            this.stainFilter = stainFilter;
            this.matchFilter = matchFilter;
            void this.reselectSlideForCurrentFilters();
        }
    );
    private readonly handleFilterChange = (f: WsiStainFilter) =>
        this.applyFilters(f, this.matchFilter);
    private readonly handleMatchFilterChange = (f: PathologySlideMatchFilter) =>
        this.applyFilters(this.stainFilter, f);
    private readonly handleClearFilters = () => this.applyFilters('all', 'all');
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
        this.viewerState.coordInputX = v;
    });
    private readonly handleChangeY = action((v: string) => {
        this.viewerState.coordInputY = v;
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
            this.viewerState,
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
    }

    @action.bound
    private setMetadataCollapsed(collapsed: boolean) {
        if (this.props.metadataCollapsed === undefined) {
            this.storedMetadataCollapsed = collapsed;
            writeWsiPanelFlag(WSI_METADATA_COLLAPSED_KEY, collapsed);
        }
        this.props.onMetadataCollapsedChange?.(collapsed);
    }

    private readonly hideNav = () => this.setNavCollapsed(true);
    private readonly showNav = () => this.setNavCollapsed(false);
    private readonly hideMetadata = () => this.setMetadataCollapsed(true);
    private readonly showMetadata = () => this.setMetadataCollapsed(false);

    @action.bound
    private setSidebarWidth(width: number) {
        const clamped = Math.max(
            WSI_SIDEBAR_MIN_WIDTH,
            Math.min(WSI_SIDEBAR_MAX_WIDTH, width)
        );
        this.sidebarWidth = clamped;
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
            getServableSlides: () => this.servableSlides,
            getStainFilter: () => this.stainFilter,
            getTileServerBase: () => this.tileServerBase,
            getViewerContainerElement: () => this.viewerContainerRef.current,
            chooseInitialServableSlide: allSlides =>
                this.chooseInitialServableSlide(allSlides),
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
        if (typeof document !== 'undefined') {
            document.addEventListener('keydown', this.handlePanelKey);
        }
        void this.controller.loadHierarchy();
    }

    private readonly handlePanelKey = (event: KeyboardEvent) => {
        if (
            this.props.hidden ||
            event.altKey ||
            event.ctrlKey ||
            event.metaKey ||
            isTypingTarget(event.target)
        ) {
            return;
        }
        if (event.key === NAV_TOGGLE_KEY) {
            this.setNavCollapsed(!this.navCollapsed);
        } else if (event.key === METADATA_TOGGLE_KEY) {
            this.setMetadataCollapsed(!this.metadataCollapsed);
        }
    };

    private readonly updateControllerVisibility = () => {
        const pageHidden =
            typeof document !== 'undefined' &&
            document.visibilityState === 'hidden';
        this.controller.setVisible(!this.props.hidden && !pageHidden);
    };

    private async selectSlideFromHash(): Promise<void> {
        const hashState = hashUrlState.read();
        if (!hashState || !this.viewerState.hierarchy) return;

        const preferredSlideKeys = this.preferredSlideKeys;
        const matching = this.servableSlides.find(
            entry =>
                entry.slide.slide_key === hashState.slideId &&
                (!preferredSlideKeys ||
                    preferredSlideKeys.has(entry.slide.slide_key))
        );
        if (!matching) return;

        if (
            this.viewerState.selectedSlide?.slide_key ===
            matching.slide.slide_key
        ) {
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
            (pathologyFilterChanged && !this.viewerState.hierarchy);
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
            // A queued click belongs to the old hierarchy; firing it after
            // the reload would open the previous patient's slide.
            this.cancelPendingSlideSelection();
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
            document.removeEventListener('keydown', this.handlePanelKey);
        }
        this.cancelPendingSlideSelection();
        action(() => {
            this.viewerState.hierarchy = null; // stops the prefetchSlideMetadata loop
        })();
        this.controller.dispose();
        this.handleSidebarResizeEnd();
    }

    // ---- data loading ----

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
        return this.viewerState.hierarchy && filter
            ? getServableSlideIdsForPathologyFilterReadOnly(
                  this.viewerState.hierarchy,
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

    /** Whether a link scope the viewer may release hides any viewable slide. */
    @computed private get linkScopeHidesSlides(): boolean {
        const hierarchy = this.viewerState.hierarchy;
        if (
            !hierarchy ||
            !this.activePathologyFilter ||
            this.hostOwnsScopedSample
        ) {
            return false;
        }
        const sampleId = this.scopedSampleId;
        const slideKeys = this.preferredSlideKeys;
        return hierarchy.samples.some(sample =>
            getOrderedServableSlidesForSampleReadOnly(sample).some(
                ({ slide }) =>
                    (!!sampleId && sample.sample_id !== sampleId) ||
                    (!!slideKeys && !slideKeys.has(slide.slide_key))
            )
        );
    }

    /**
     * The sample the slide list is narrowed to (and names in its scope chip):
     * a host-owned sample always, a link's sample only while it hides slides,
     * so the chip's clear button is never offered when it would do nothing.
     */
    private get listSampleId(): string | undefined {
        return this.hostOwnsScopedSample || this.linkScopeHidesSlides
            ? this.scopedSampleId
            : undefined;
    }

    /** A sample scope that only the host may widen. */
    private get hostOwnsScopedSample(): boolean {
        return !!this.props.hostOwnsSampleScope && !!this.scopedSampleId;
    }

    @action.bound
    private applyPathologyFilterFromSourceHierarchy() {
        const hierarchy = this.viewerState.hierarchy;
        if (!hierarchy) {
            return;
        }

        const preferredSlideKeys = this.preferredSlideKeys;
        if (preferredSlideKeys) {
            const currentSlideKey = this.viewerState.selectedSlide?.slide_key;
            const currentSampleId = this.viewerState.selectedSample?.sample_id;
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
                this.viewerState.selectedSlide = firstMatchingSlide;
                this.viewerState.selectedSample = currentSample!;
                return;
            }
            void this.reselectSlideForPathologyFilter(preferredSlideKeys);
            return;
        }

        const currentSlideKey = this.viewerState.selectedSlide?.slide_key;
        const currentSampleId = this.viewerState.selectedSample?.sample_id;
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
            this.viewerState.selectedSlide = matchingSlide;
            this.viewerState.selectedSample = matchingSample;
            return;
        }

        void this.reselectSlideForCurrentFilters();
    }

    private async reselectSlideForPathologyFilter(
        preferredSlideKeys: Set<string>
    ): Promise<void> {
        const servableSlides = this.servableSlides;
        if (!this.viewerState.hierarchy || !servableSlides.length) {
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
            this.viewerState.selectedSlide?.slide_key ===
                next.slide.slide_key &&
            this.viewerState.selectedSample?.sample_id === next.sample.sample_id
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

    private async reselectPreferredSampleSlide(): Promise<void> {
        if (!this.viewerState.hierarchy || !this.servableSlides.length) {
            return;
        }

        const next = this.chooseInitialServableSlide(this.servableSlides);
        if (!next) {
            return;
        }

        if (
            this.viewerState.selectedSlide?.slide_key ===
                next.slide.slide_key &&
            this.viewerState.selectedSample?.sample_id === next.sample.sample_id
        ) {
            return;
        }

        await this.controller.selectSlide(next.slide, next.sample);
    }

    private async reselectSlideForCurrentFilters(): Promise<void> {
        const servableSlides = this.servableSlides;
        if (!this.viewerState.hierarchy || !servableSlides.length) {
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

    @computed get servableSlides(): Array<{ slide: Slide; sample: Sample }> {
        if (!this.viewerState.hierarchy) return [];
        return [...this.viewerState.hierarchy.samples]
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
            !!this.viewerState.hierarchy &&
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
        const sampleId = this.viewerState.selectedSample?.sample_id;
        return rows.filter(row => !row.sampleId || row.sampleId === sampleId);
    }

    @computed get tileServerBase(): string {
        return this.props.tileServerUrl.replace(/\/$/, '');
    }

    @computed
    private get selectedWsiRows(): MetaRow[] {
        return this.viewerState.selectedMeta
            ? buildWsiRows(
                  this.viewerState.selectedSlide,
                  this.viewerState.selectedMeta
              )
            : [];
    }

    @computed
    private get selectedPathRows(): MetaRow[] {
        if (
            !this.viewerState.selectedSlide ||
            !this.viewerState.selectedSample
        ) {
            return [];
        }
        return buildPathRows(
            this.viewerState.selectedSlide,
            this.viewerState.selectedSample,
            this.props.patientId,
            this.props.studyId
        );
    }

    // ---- render ----

    /** The hidden slide list's rail, led by the host's own hidden panels. */
    private renderNavRail() {
        const { selectedSlide, hierarchy } = this.viewerState;
        return (
            <WsiCollapsedRail
                side="left"
                title="Slides"
                detail={
                    hierarchy ? String(this.servableSlides.length) : undefined
                }
                accent={
                    selectedSlide ? getStainDotColor(selectedSlide) : undefined
                }
                showLabel={`Show slide list (${NAV_TOGGLE_KEY})`}
                onExpand={this.showNav}
                background={C.navBg}
                testId="wsi-nav-rail"
                leadingSections={this.props.leadingRailSections}
            />
        );
    }

    render() {
        const { height } = this.props;
        const {
            loading,
            error,
            hierarchy,
            selectedSlide,
            selectedSample,
            thumbnailPreviewUrl,
        } = this.viewerState;
        const { stainFilter, matchFilter } = this;
        // Only offered when it changes the list: a filter is set, or a link
        // scope it would release hides some of the patient's slides.
        const showClearFilters =
            this.linkScopeHidesSlides ||
            stainFilter !== 'all' ||
            matchFilter !== 'all';

        if (loading || !hierarchy) {
            // A hidden slide list keeps its rail (and any host sections on
            // it) while slides load or fail, so the host's controls stay put.
            return (
                <div style={{ display: 'flex', height }}>
                    {this.navCollapsed && this.renderNavRail()}
                    <div
                        style={{
                            flex: 1,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: loading ? undefined : '#c00',
                        }}
                    >
                        {loading ? (
                            this.props.renderLoading ? (
                                this.props.renderLoading()
                            ) : (
                                <DefaultLoadingIndicator />
                            )
                        ) : (
                            error || 'No data'
                        )}
                    </div>
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
                    this.renderNavRail()
                ) : (
                    <WsiNavPanel
                        hierarchy={hierarchy}
                        selectedSlide={selectedSlide}
                        sampleIdFilter={this.listSampleId}
                        slideIdFilter={this.preferredSlideKeys}
                        linkoutScopeActive={this.linkoutScopeActive}
                        hostOwnsSampleScope={this.props.hostOwnsSampleScope}
                        stainFilter={stainFilter}
                        matchFilter={matchFilter}
                        showClearFilters={showClearFilters}
                        deferOffscreenSamples={!this.viewerState.tilesReady}
                        onFilterChange={this.handleFilterChange}
                        onMatchFilterChange={this.handleMatchFilterChange}
                        onClearFilters={this.handleClearFilters}
                        onSelectSlide={this.handleSelectSlide}
                        tileServerBase={this.tileServerBase}
                        studyId={this.props.studyId}
                        authScope={this.props.authScope}
                        onHide={this.hideNav}
                        renderSampleLabel={this.props.renderSampleLabel}
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
                            <DefaultTooltip
                                key={id}
                                trigger={['hover']}
                                placement="right"
                                overlay={<span>{title}</span>}
                            >
                                <button
                                    type="button"
                                    id={`${this.navId}-${id}`}
                                    aria-label={title}
                                    className="btn btn-default btn-sm"
                                    style={{
                                        width: 28,
                                        padding: '3px 0',
                                        lineHeight: 1,
                                    }}
                                >
                                    <i className={`fa ${icon}`} />
                                </button>
                            </DefaultTooltip>
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
                    {this.viewerState.spinnerVisible && selectedSlide && (
                        <div
                            data-testid="wsi-loading-spinner"
                            style={{
                                ...overlayStyle,
                                background: thumbnailPreviewUrl
                                    ? 'rgba(232,232,232,0.18)'
                                    : 'rgba(232,232,232,0.75)',
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
                                        color: C.text,
                                        background: 'rgba(255,255,255,0.92)',
                                        border: `1px solid ${C.border}`,
                                        boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
                                        fontSize: 13,
                                    }}
                                >
                                    <i
                                        className="fa fa-spinner fa-spin"
                                        style={{ color: C.muted }}
                                    />
                                    <span>Loading full-resolution image…</span>
                                </div>
                            ) : this.props.renderLoading ? (
                                this.props.renderLoading()
                            ) : (
                                <DefaultLoadingIndicator />
                            )}
                        </div>
                    )}
                    {error && selectedSlide && (
                        <div
                            data-testid="wsi-viewer-error"
                            style={{
                                ...overlayStyle,
                                background: 'rgba(232,232,232,0.92)',
                                zIndex: 110,
                                pointerEvents: 'auto',
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
                    {this.viewerState.tilesReady && (
                        <ViewerStatusBar
                            viewer={this.viewerState}
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
                        showLabel={`Show details (${METADATA_TOGGLE_KEY})`}
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
                            showImageProperties={
                                !!this.viewerState.selectedMeta
                            }
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
    viewer: WsiViewerState;
    onChangeX: (v: string) => void;
    onChangeY: (v: string) => void;
    onGo: () => void;
    onCopyLink: () => void;
    onDownload: () => void;
    showDownload: boolean;
}

/** A status bar tool: a Bootstrap button with a portal tooltip. */
function StatusBarButton({
    label,
    icon,
    testId,
    pressed,
    onClick,
}: {
    label: string;
    icon: string;
    testId: string;
    pressed?: boolean;
    onClick: () => void;
}) {
    return (
        <DefaultTooltip
            trigger={['hover']}
            placement="top"
            overlay={<span>{label}</span>}
        >
            <button
                type="button"
                className={`btn btn-default btn-xs${pressed ? ' active' : ''}`}
                data-testid={testId}
                aria-label={label}
                aria-pressed={pressed}
                onClick={onClick}
            >
                <i className={`fa ${icon}`} />
            </button>
        </DefaultTooltip>
    );
}

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
                padding: '4px 10px',
                background: 'rgba(250,250,250,0.94)',
                borderTop: `1px solid ${C.border}`,
                fontSize: 12,
                color: C.text,
                fontVariantNumeric: 'tabular-nums',
                zIndex: 10,
            }}
        >
            {magnification && (
                <span
                    data-testid="wsi-magnification"
                    title="Magnification on screen"
                    style={{ minWidth: 36, fontWeight: 700 }}
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
                            borderLeft: `2px solid ${C.text}`,
                            borderRight: `2px solid ${C.text}`,
                            borderBottom: `2px solid ${C.text}`,
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
                    style={{ color: C.muted, whiteSpace: 'nowrap' }}
                >
                    {cursorLabel}
                </span>
            )}
            {goToOpen && (
                <span
                    className="input-group input-group-sm"
                    style={{
                        width: 'auto',
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
                        className="form-control input-sm"
                        style={{ width: 84, height: 24 }}
                        onChange={e => onChangeX(e.target.value)}
                        onKeyDown={handleKey}
                    />
                    <input
                        type="number"
                        aria-label="Y in image pixels"
                        value={inputY}
                        placeholder="y px"
                        className="form-control input-sm"
                        style={{ width: 84, height: 24 }}
                        onChange={e => onChangeY(e.target.value)}
                        onKeyDown={handleKey}
                    />
                    <button
                        type="button"
                        className="btn btn-primary btn-xs"
                        onClick={onGo}
                    >
                        Go
                    </button>
                </span>
            )}
            <StatusBarButton
                label="Go to a position (image pixels)"
                icon="fa-crosshairs"
                testId="wsi-goto-button"
                pressed={goToOpen}
                onClick={() => setGoToOpen(open => !open)}
            />
            <StatusBarButton
                label="Copy a link to this exact view (slide, position, zoom)"
                icon={copied ? 'fa-check' : 'fa-link'}
                testId="wsi-share-button"
                onClick={handleCopy}
            />
            {showDownload && (
                <StatusBarButton
                    label="Download current viewport as JPEG"
                    icon="fa-download"
                    testId="wsi-download-button"
                    onClick={onDownload}
                />
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
