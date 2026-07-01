import * as React from 'react';
import { observer } from 'mobx-react';
import { observable, action, computed, makeObservable } from 'mobx';
import LoadingIndicator from 'shared/components/loadingIndicator/LoadingIndicator';
import * as OpenSeadragonLib from 'openseadragon';
import {
    DefaultTooltip,
} from 'cbioportal-frontend-commons';
import {
    Slide,
    Sample,
    PatientHierarchy,
    TileMetadata,
    MutationDetail,
} from './wsiViewerTypes';
import { getServableSlideEntriesForHierarchy, matchesWsiStainFilter } from './wsiSlideUtils';
import {
} from './wsiMolecularUtils';
import { WsiMetaSidebar } from './wsiMetaSidebar';
import {
    buildPathRows,
    buildSampleUrl,
    buildSeqRows,
    buildWsiRows,
} from './wsiMetaUtils';
import {
    readWsiHashState,
} from './wsiViewStateUtils';
import {
    SampleIdentifier,
} from './wsiDataMergeUtils';
import {
    BLOCK_LABEL_TIP,
} from './wsiNavUtils';
import { WsiNavPanel } from './wsiNavPanel';
import {
    WsiViewerController,
    WsiViewerControllerHost,
} from './wsiViewerController';
import {
    fetchClinicalDataRecords,
    fetchCnaData,
    fetchMutationData,
    fetchMutationFrequencyData,
    fetchSampleTimepointMaps,
    fetchStructuralVariantData,
} from './wsiCbioportalDataUtils';
import {
    fetchCivicCnaAnnotations,
    fetchCivicMutationAnnotations,
    fetchOncoKbCnaAnnotations,
    fetchOncoKbMutationAnnotations,
    fetchOncoKbStructuralVariantAnnotations,
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
    applySampleTimepointMaps,
    applyStructuralVariantData,
} from './wsiHierarchyUpdateUtils';

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

const sectionTitleStyle: React.CSSProperties = {
    fontSize: 10,
    fontWeight: 700,
    color: C.muted,
    textTransform: 'uppercase',
    letterSpacing: '.8px',
};

// ---- shared utility functions ----

// OpenSeadragon is a CommonJS module; handle both CJS and ESM bundle shapes.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const OpenSeadragon: typeof import('openseadragon') =
    (OpenSeadragonLib as any).default ?? (OpenSeadragonLib as any);

interface Props {
    /** URL of the form https://tile-server/patient/{patient_id} */
    url: string;
    height: number;
    /** cBioPortal study ID — used to build sample links in the sidebar */
    studyId?: string;
    initialStainFilter?: 'all' | 'hne' | 'ihc';
    allowedSampleIds?: string[];
    preferredSampleId?: string;
}

@observer
export default class WSIViewer extends React.Component<Props, {}> {
    @observable private hierarchy: PatientHierarchy | null = null;
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

    private get navId() {
        return this.controller.navId;
    }

    // ---- stable callbacks (prevent prop-equality churn on child components) ----
    private readonly handleFilterChange = action((f: 'all' | 'hne' | 'ihc') => {
        this.stainFilter = f;
    });
    private readonly handleSelectSlide = (slide: Slide, sample: Sample) =>
        this.controller.selectSlide(slide, sample);
    private readonly handleChangeX = action((v: string) => {
        this.coordInputX = v;
    });
    private readonly handleChangeY = action((v: string) => {
        this.coordInputY = v;
    });
    private readonly handleCopyLink = () => this.copyViewLink();
    private readonly handleDownload = () => this.downloadView();
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
        this.controller = new WsiViewerController(
            this.createControllerHost(),
            OpenSeadragon
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
            getSelectedMeta: () => this.selectedMeta,
            getPatientId: () => this.hierarchy?.patient_id,
            setCoordInputs: (x, y) => this.setCoordInputs(x, y),
            getCoordInputs: () => ({
                x: this.coordInputX,
                y: this.coordInputY,
            }),
            updateCursorPos: (x, y) => this.handleCursorMove(x, y),
            clearCursorPos: () => this.clearCursorPos(),
            buildSampleIdentifiers: studyId =>
                this.buildSampleIdentifiers(studyId),
            triggerPostMutationAnnotationFetches: (base, studyId) =>
                this.triggerPostMutationAnnotationFetches(base, studyId),
            triggerPostCnaAnnotationFetches: () =>
                this.triggerPostCnaAnnotationFetches(),
            triggerPostStructuralVariantAnnotationFetches: () =>
                this.triggerPostStructuralVariantAnnotationFetches(),
            fetchAndMergeSampleTimepoints: (base, studyId, patientId) =>
                this.fetchAndMergeSampleTimepoints(base, studyId, patientId),
            fetchAndMergeClinicalData: (base, studyId, sampleIdentifiers) =>
                this.fetchAndMergeClinicalData(
                    base,
                    studyId,
                    sampleIdentifiers
                ),
            fetchAndMergeMutations: (base, studyId, sampleIdentifiers) =>
                this.fetchAndMergeMutations(base, studyId, sampleIdentifiers),
            fetchAndMergeCNA: (base, studyId, sampleIdentifiers) =>
                this.fetchAndMergeCNA(base, studyId, sampleIdentifiers),
            fetchAndMergeStructuralVariants: (
                base,
                studyId,
                sampleIdentifiers
            ) =>
                this.fetchAndMergeStructuralVariants(
                    base,
                    studyId,
                    sampleIdentifiers
                ),
        };
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
        void this.controller.loadHierarchy();
    }

    componentDidUpdate(prev: Props) {
        const prevAllowed = (prev.allowedSampleIds || []).join('|');
        const nextAllowed = (this.props.allowedSampleIds || []).join('|');
        if (
            prev.url !== this.props.url ||
            prevAllowed !== nextAllowed ||
            prev.preferredSampleId !== this.props.preferredSampleId
        ) {
            this.controller.dispose();
            void this.controller.loadHierarchy();
        }
        if (prev.initialStainFilter !== this.props.initialStainFilter) {
            this.handleFilterChange(this.props.initialStainFilter || 'all');
        }
    }

    componentWillUnmount() {
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
        this.cursorPos = null;
        this.coordInputX = '';
        this.coordInputY = '';
    }

    private get controllerProps() {
        return {
            url: this.props.url,
            studyId: this.props.studyId,
            allowedSampleIds: this.props.allowedSampleIds,
            preferredSampleId: this.props.preferredSampleId,
        };
    }

    private chooseInitialServableSlide(
        allSlides: Array<{ slide: Slide; sample: Sample }>
    ) {
        const hashState = readWsiHashState();
        const fromHash = hashState
            ? allSlides.find(s => s.slide.image_id === hashState.slideId)
            : undefined;
        const preferredSampleSlides = this.props.preferredSampleId
            ? allSlides.filter(
                  s => s.sample.sample_id === this.props.preferredSampleId
              )
            : [];
        const preferredSampleFirst =
            preferredSampleSlides.find(s =>
                matchesWsiStainFilter(s.slide, this.stainFilter)
            ) ??
            preferredSampleSlides.find(s => s.slide.is_hne) ??
            preferredSampleSlides[0];
        return (
            fromHash ??
            preferredSampleFirst ??
            allSlides.find(s =>
                matchesWsiStainFilter(s.slide, this.stainFilter)
            ) ??
            allSlides.find(s => s.slide.is_hne) ??
            allSlides[0]
        );
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

    @action.bound
    private setCoordInputs(x: string, y: string) {
        this.coordInputX = x;
        this.coordInputY = y;
    }

    private buildSampleIdentifiers(studyId: string): SampleIdentifier[] {
        return (this.hierarchy?.samples ?? [])
            .filter(sample => sample.sample_id)
            .map(sample => ({ studyId, sampleId: sample.sample_id }));
    }

    private triggerPostMutationAnnotationFetches(base: string, studyId: string) {
        void this.fetchAndMergeOncoKbAnnotations();
        void this.fetchAndMergeCivicAnnotations();
        void this.fetchAndMergeMutationFrequency(base, studyId);
    }

    private triggerPostCnaAnnotationFetches() {
        void this.fetchAndMergeCnaOncoKbAnnotations();
        void this.fetchAndMergeCnaCivicAnnotations();
    }

    private triggerPostStructuralVariantAnnotationFetches() {
        void this.fetchAndMergeStructuralVariantOncoKbAnnotations();
    }

    @computed get servableSlides(): Array<{ slide: Slide; sample: Sample }> {
        if (!this.hierarchy) return [];
        return getServableSlideEntriesForHierarchy(this.hierarchy);
    }

    private static stripPatientPath(pathname: string): string {
        return pathname
            .replace(/\/patient\/[^/]+\/?$/, '')
            .replace(/\/$/, '');
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
    private get tileServerOrigin(): string {
        return this.resourceUrl?.origin || this.tileServerBase;
    }

    @action.bound
    private updateHierarchy() {
        if (!this.hierarchy) return;
        this.hierarchy = {
            ...this.hierarchy,
            samples: [...this.hierarchy.samples],
        };
    }

    private applyHierarchyMutation(mutator: (samples: Sample[]) => void) {
        if (!this.hierarchy) return;
        action(() => {
            mutator(this.hierarchy!.samples);
        })();
    }

    private applyHierarchyMutationAndRefresh(
        mutator: (samples: Sample[]) => void
    ) {
        this.applyHierarchyMutation(mutator);
        this.updateHierarchy();
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
    /**
     * Fetch patient-level clinical timeline events from cBioPortal and merge
     * sample acquisition / sequencing day offsets into the WSI hierarchy.
     *
     * The preferred WSI proxy timepoint is:
     *   1. Sample acquisition / specimen event for that sample
     *   2. Sequencing event for that sample
     */
    private async fetchAndMergeSampleTimepoints(
        base: string,
        studyId: string,
        patientId: string
    ): Promise<void> {
        const timepointMaps = await fetchSampleTimepointMaps(
            base,
            studyId,
            patientId
        );
        if (!timepointMaps) return;

        this.applyHierarchyMutation(samples => {
            applySampleTimepointMaps(
                samples,
                timepointMaps.acquisitionBySample,
                timepointMaps.sequencingBySample
            );
        });
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
        const data = await fetchClinicalDataRecords(base, sampleIdentifiers);
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
            const mutationData = await fetchMutationData(
                base,
                studyId,
                sampleIdentifiers
            );
            if (!mutationData) return;

            mutationData.allMutsBySample.forEach((value, key) =>
                allMutsBySample.set(key, value)
            );
            mutationData.detailsBySample.forEach((value, key) =>
                detailsBySample.set(key, value)
            );
        } catch (e) {
            console.error('[WSIViewer] fetchAndMergeMutations failed:', e);
        } finally {
            this.applyHierarchyMutation(samples => {
                applyMutationData(
                    samples,
                    allMutsBySample,
                    detailsBySample
                );
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
        const allDetails: MutationDetail[] = [];
        for (const sample of this.hierarchy?.samples ?? []) {
            for (const d of sample.oncogenic_mutation_details ?? []) {
                if (d.entrezGeneId) allDetails.push(d);
            }
        }
        if (!allDetails.length) return;

        const tileOrigin = this.tileServerOrigin;
        if (!tileOrigin) return;

        const annotations = await fetchOncoKbMutationAnnotations(
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
        const allDetails = (this.hierarchy?.samples ?? []).flatMap(
            sample => sample.oncogenic_mutation_details ?? []
        );
        if (!allDetails.length) return;

        const annotations = await fetchCivicMutationAnnotations(allDetails);
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
        const bySample = await fetchCnaData(
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
        const allCnas = (this.hierarchy?.samples ?? []).flatMap(
            sample => sample.cna_alterations ?? []
        );
        if (!allCnas.length) return;

        const annotations = await fetchCivicCnaAnnotations(allCnas);
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
        const allCnas = (this.hierarchy?.samples ?? []).flatMap(
            sample => sample.cna_alterations ?? []
        );
        const tileOrigin = this.tileServerOrigin;
        if (!tileOrigin) return;

        const annotations = await fetchOncoKbCnaAnnotations(tileOrigin, allCnas);
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
        const bySample = await fetchStructuralVariantData(
            base,
            studyId,
            sampleIdentifiers
        );
        if (!bySample) return;

        this.applyHierarchyMutationAndRefresh(samples => {
            applyStructuralVariantData(samples, bySample);
        });
    }

    private async fetchAndMergeStructuralVariantOncoKbAnnotations(): Promise<void> {
        const allStructuralVariants = (this.hierarchy?.samples ?? []).flatMap(
            sample => sample.structural_variants ?? []
        );
        const tileOrigin = this.tileServerOrigin;
        if (!tileOrigin) return;

        const annotations = await fetchOncoKbStructuralVariantAnnotations(
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
            const mutationFrequencyData = await fetchMutationFrequencyData(
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
            selectedMeta,
            stainFilter,
        } = this;
        const patientId = hierarchy?.patient_id;
        const sampleUrl =
            this.props.studyId && selectedSample?.sample_id
                ? buildSampleUrl(
                      this.props.studyId,
                      selectedSample.sample_id,
                      patientId
                  )
                : undefined;
        const thumbSrc = selectedSlide
            ? `${this.tileServerBase}/tiles/${selectedSlide.image_id}/thumbnail`
            : null;
        const seqRows =
            selectedSlide && selectedSample
                ? buildSeqRows(selectedSample, sampleUrl)
                : [];
        const wsiRows = selectedMeta
            ? buildWsiRows(selectedSlide, selectedMeta)
            : [];
        const pathRows =
            selectedSlide && selectedSample
                ? buildPathRows(
                      selectedSlide,
                      selectedSample,
                      patientId,
                      this.props.studyId
                  )
                : [];

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

        if (error || !hierarchy) {
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
                    selectedSlide={selectedSlide}
                    stainFilter={stainFilter}
                    onFilterChange={this.handleFilterChange}
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
                    {!selectedSlide && (
                        <div style={overlayStyle}>
                            <span style={{ color: C.muted, fontSize: 13 }}>
                                No servable slides for this patient
                            </span>
                        </div>
                    )}
                    {this.tilesReady && (
                        <CoordBar
                            inputX={this.coordInputX}
                            inputY={this.coordInputY}
                            cursorPos={this.cursorPos}
                            mpp={selectedMeta?.mpp}
                            onChangeX={this.handleChangeX}
                            onChangeY={this.handleChangeY}
                            onGo={this.goToCoordinates}
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
                    thumbSrc={thumbSrc}
                    showImageProperties={!!selectedMeta}
                    wsiRows={wsiRows}
                    showPathology={!!(selectedSlide && selectedSample)}
                    pathRows={pathRows}
                    seqRows={seqRows}
                    sample={selectedSample}
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
