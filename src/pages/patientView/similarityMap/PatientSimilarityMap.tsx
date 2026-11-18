import * as React from 'react';
import _ from 'lodash';
import {
    action,
    autorun,
    computed,
    makeObservable,
    observable,
    runInAction,
} from 'mobx';
import { observer } from 'mobx-react';
import { remoteData } from 'cbioportal-frontend-commons';
import SampleManager from 'pages/patientView/SampleManager';
import Select from 'react-select';
import {
    ClinicalAttribute,
    ClinicalData,
    Gene,
    MolecularProfile,
    Sample,
    SampleFilter,
    SampleIdentifier,
    StudyViewFilter,
} from 'cbioportal-ts-api-client';
import { getClient } from 'shared/api/cbioportalClientInstance';
import internalClient from 'shared/api/cbioportalInternalClientInstance';
import MobxPromiseCache from 'shared/lib/MobxPromiseCache';
import { getClinicalAttributeColoring } from 'shared/cache/ClinicalDataCacheUtils';
import { ClinicalDataCacheEntry } from 'shared/cache/ClinicalDataCache';
import LoadingIndicator from 'shared/components/loadingIndicator/LoadingIndicator';
import { EmbeddingDeckGLVisualization } from 'shared/components/embeddings';
import { EmbeddingPoint } from 'shared/components/embeddings/EmbeddingTypes';
import { SelectionControls } from 'shared/components/embeddings/controls/SelectionControls';
import {
    calculateContextPointBoost,
    calculatePointScale,
    calculateSparseMapPointFactor,
} from 'shared/components/embeddings/utils/dataUtils';
import {
    getLoadedEmbeddingOptions,
    isAnyEmbeddingPending,
} from 'shared/components/embeddings/embeddingSources';
import { makeEmbeddingScatterPlotData } from 'shared/components/plots/EmbeddingPlotUtils';
import { ColoringMenuOmnibarOption } from 'shared/components/plots/PlotsTabTypes';
import ColorSamplesByDropdown from 'shared/components/colorSamplesByDropdown/ColorSamplesByDropdown';
import { EmbeddingControlStack } from 'shared/components/embeddings/controls/EmbeddingControlStack';
import { MapColoringContext } from './MapColoringContext';
import { PatientViewPageStore } from '../clinicalInformation/PatientViewPageStore';
import { EmbeddingViewportState } from 'shared/components/embeddings/state/EmbeddingViewportState';
import { EmbeddingCategoryVisibility } from 'shared/components/embeddings/state/EmbeddingCategoryVisibility';
import {
    getEmbeddingOptionsForSamples,
    getClinicalColorsBySampleId,
    getStudyViewMapUrl,
    mapWithConcurrency,
    projectToScreen,
    SampleEmbeddingOption,
    SampleEmbeddingPoint,
} from './PatientSimilarityMapUtils';

// Floor for the map when the window is short; normally it takes whatever
// height is left below it.
const MIN_MAP_HEIGHT = 420;
const MAP_BOTTOM_MARGIN = 16;
const UNCOLORED_POINT_COLOR = '#bbbbbb';
const NO_DATA_LABEL = 'No data';
// What the study view colours by; on a pan-cancer map it is the one attribute
// whose legend still reads as a map.
const DEFAULT_COLORING_ATTRIBUTE_ID = 'CANCER_TYPE';
// SampleLabelHTML draws a 12px icon; enlarged so it stands out on a dense map.
const SAMPLE_ICON_SIZE = 12;
const SAMPLE_ICON_SCALE = 1.5;
// The study view's own fetch, one POST per cohort, scales poorly at this size:
// resolving every identifier of a 30-study map in one request is slower than
// splitting it. A few chunks in parallel beat both that and a request per
// study. The API answers a burst with 429s, so a failure is retried.
const CLINICAL_FETCH_CHUNK_SIZE = 15000;
const CLINICAL_FETCH_CONCURRENCY = 5;
const CLINICAL_FETCH_ATTEMPTS = 3;
const CLINICAL_FETCH_BACKOFF_MS = 400;

const ROW_LABEL_STYLE: React.CSSProperties = {
    fontSize: '9px',
    textTransform: 'uppercase',
    letterSpacing: '0.03em',
    color: '#888',
    lineHeight: '12px',
};

const SELECT_STYLES = {
    control: (base: any) => ({
        ...base,
        fontSize: '12px',
        minHeight: '32px',
        boxShadow: 'none',
        border: '1px solid #ccc',
    }),
    menu: (base: any) => ({ ...base, fontSize: '12px', zIndex: 9999 }),
    container: (base: any) => ({ ...base, width: '100%' }),
};

// How many samples the colouring could not be read for, so the map can say so
// instead of showing those points as though they had no value.
type MapColoringEntry = ClinicalDataCacheEntry & { failedSampleCount: number };

function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// The map's own control cluster is replaced by this page's own, and a stable
// identity keeps panning from re-rendering the plot's subtree each frame.
const renderNoControls = () => null;

export interface IPatientSimilarityMapProps {
    studyId: string;
    patientViewPageStore: PatientViewPageStore;
    sampleManager: SampleManager;
    hasEmbeddingsFeatureFlag: boolean;
    clinicalAttributes: ClinicalAttribute[];
}

@observer
export default class PatientSimilarityMap extends React.Component<
    IPatientSimilarityMapProps,
    {}
> {
    @observable private selectedValue: string | undefined;
    @observable.ref private selectedColoringOption?: ColoringMenuOmnibarOption;
    @observable private mutationTypeEnabled = true;
    @observable private copyNumberEnabled = true;
    @observable private structuralVariantEnabled = true;
    @observable private selectionMode: 'none' | 'lasso' = 'none';
    private readonly viewport = new EmbeddingViewportState();
    @observable.ref private lassoSelection: string[] = [];
    @observable.ref private lassoSampleIdentifiers: SampleIdentifier[] = [];
    @observable private isResolvingLasso = false;
    private readonly categoryVisibility = new EmbeddingCategoryVisibility();
    @observable.ref private pinnedPoint: EmbeddingPoint | null = null;
    @observable private mapWidth = 0;
    @observable private mapHeight = MIN_MAP_HEIGHT;
    // Bumped to remount the plot, the only way to drop the selection it keeps
    // in its own state.
    @observable private plotInstance = 0;

    private container: HTMLDivElement | null = null;
    private centeredMapValue: string | undefined;
    private centerDisposer?: () => void;
    private lassoToken = 0;

    constructor(props: IPatientSimilarityMapProps) {
        super(props);
        makeObservable(this);
    }

    componentDidMount() {
        this.measure();
        window.addEventListener('resize', this.measure);
        // The map arrives from a shared fetch, so the first points can show up
        // well after mount.
        this.centerDisposer = autorun(() => {
            const option = this.selectedOption;
            if (option && this.centeredMapValue !== option.value) {
                this.centeredMapValue = option.value;
                this.centerView();
            }
        });
    }

    componentWillUnmount() {
        window.removeEventListener('resize', this.measure);
        this.centerDisposer?.();
    }

    private setContainer = (element: HTMLDivElement | null) => {
        this.container = element;
        this.measure();
    };

    @action.bound
    private measure() {
        if (this.container) {
            this.mapWidth = this.container.clientWidth;
            const top = this.container.getBoundingClientRect().top;
            this.mapHeight = Math.max(
                MIN_MAP_HEIGHT,
                window.innerHeight - top - MAP_BOTTOM_MARGIN
            );
        }
    }

    @computed get sampleIds(): string[] {
        return this.props.sampleManager.getSampleIdsInOrder();
    }

    @computed get embeddingScope() {
        return {
            studyIds: [this.props.studyId],
            hasFeatureFlag: this.props.hasEmbeddingsFeatureFlag,
        };
    }

    @computed get options(): SampleEmbeddingOption[] {
        return getEmbeddingOptionsForSamples(
            getLoadedEmbeddingOptions(this.embeddingScope),
            this.props.studyId,
            this.sampleIds
        );
    }

    @computed get selectedOption(): SampleEmbeddingOption | undefined {
        return (
            this.options.find(o => o.value === this.selectedValue) ??
            this.options[0]
        );
    }

    // Sample-level only: a point is a sample, and a patient attribute would
    // colour every sample of a patient alike without saying so.
    private readonly coloring = new MapColoringContext(
        this.props.patientViewPageStore,
        () => this.selectedOption?.data.studyIds ?? []
    );

    @computed get mapStudyIds(): string[] {
        return this.selectedOption?.data.studyIds ?? [this.props.studyId];
    }

    // Which study each sample of the map belongs to, for turning a lasso into
    // a study view selection. A map's points carry a bare sample id.
    @computed get sampleStudyIds(): Map<string, string> {
        const index = new Map<string, string>();
        this.coloring.samples.result?.forEach(s =>
            index.set(s.sampleId, s.studyId)
        );
        return index;
    }

    @computed get colorableGenes(): Gene[] {
        return this.props.patientViewPageStore.allGenes.result ?? [];
    }

    @computed get mapProfiles(): MolecularProfile[] {
        return this.coloring.molecularProfiles.result ?? [];
    }

    @computed get mutationDataExists(): boolean {
        return this.mapProfiles.some(
            p => p.molecularAlterationType === 'MUTATION_EXTENDED'
        );
    }

    @computed get cnaDataExists(): boolean {
        return this.mapProfiles.some(
            p => p.molecularAlterationType === 'COPY_NUMBER_ALTERATION'
        );
    }

    @computed get svDataExists(): boolean {
        return this.mapProfiles.some(
            p => p.molecularAlterationType === 'STRUCTURAL_VARIANT'
        );
    }

    @computed get coloringAttributes(): ClinicalAttribute[] {
        return _.sortBy(
            this.props.clinicalAttributes.filter(a => !a.patientAttribute),
            a => a.displayName
        );
    }

    // Defaults to cancer type, the one attribute whose legend still reads as a
    // map on a pan-cancer embedding.
    @computed get coloringOption(): ColoringMenuOmnibarOption | undefined {
        if (this.selectedColoringOption) {
            return this.selectedColoringOption;
        }
        const attribute = this.coloringAttributes.find(
            a => a.clinicalAttributeId === DEFAULT_COLORING_ATTRIBUTE_ID
        );
        return attribute
            ? ({
                  label: attribute.displayName,
                  info: { clinicalAttribute: attribute },
              } as ColoringMenuOmnibarOption)
            : undefined;
    }

    // The caches are read synchronously while colouring, and report nothing
    // until they are complete, so a map drawn too early says every sample is
    // unaltered. Waiting on them here keeps that state off the screen.
    readonly molecularDataForColoring = remoteData({
        await: () => {
            const entrezGeneId = this.coloringOption?.info?.entrezGeneId;
            if (entrezGeneId === undefined || entrezGeneId === -3) {
                return [];
            }
            const store = this.coloring.plotsStore;
            const settings = this.props.patientViewPageStore
                .driverAnnotationSettings;
            const queries = [{ entrezGeneId }];
            const toAwait: any[] = [];
            if (settings?.oncoKb) {
                toAwait.push(store.oncoKbMutationAnnotationForOncoprint);
            }
            if (settings?.hotspots) {
                toAwait.push(store.isHotspotForOncoprint);
            }
            toAwait.push(store.getMutationPutativeDriverInfo);
            if (this.mutationTypeEnabled) {
                toAwait.push(
                    ...this.coloring.mapMutationCache.getAll(queries)
                );
            }
            if (this.copyNumberEnabled) {
                toAwait.push(...store.annotatedCnaCache.getAll(queries));
            }
            if (this.structuralVariantEnabled) {
                toAwait.push(...store.structuralVariantCache.getAll(queries));
            }
            return toAwait;
        },
        invoke: () => Promise.resolve(true),
    });

    @computed get isColoringPending(): boolean {
        if (!this.selectedOption) {
            return false;
        }
        const gene = this.coloringOption?.info?.entrezGeneId;
        const base = [
            this.coloring.samples,
            this.coloring.molecularProfiles,
            this.coloring.studies,
        ];
        if (base.some(p => p.isPending)) {
            return true;
        }
        if (gene !== undefined) {
            return (
                this.coloring.plotsStore.coverageInformation.isPending ||
                this.molecularDataForColoring.isPending
            );
        }
        return false;
    }

    @computed get coloringClinicalAttribute(): ClinicalAttribute | undefined {
        return this.coloringOption?.info?.clinicalAttribute as
            | ClinicalAttribute
            | undefined;
    }

    @computed get isNumericColoring(): boolean {
        return this.coloringClinicalAttribute?.datatype === 'NUMBER';
    }

    // Supplies the legend's gradient; the points themselves are already
    // coloured by the shared helper.
    @computed get clinicalColoringEntry() {
        const attribute = this.coloringClinicalAttribute;
        if (!attribute) {
            return undefined;
        }
        const entry = this.coloring.clinicalDataCache.get(attribute as any);
        return entry.isComplete ? entry.result : undefined;
    }

    @computed get allPoints(): EmbeddingPoint[] {
        const option = this.selectedOption;
        if (!option) {
            return [];
        }
        return makeEmbeddingScatterPlotData(
            option.data,
            this.coloring,
            this.coloringOption,
            this.mutationTypeEnabled,
            this.copyNumberEnabled,
            this.structuralVariantEnabled
        ) as EmbeddingPoint[];
    }


    @computed get plotData(): EmbeddingPoint[] {
        const hidden = this.categoryVisibility.hidden;
        if (hidden.size === 0) {
            return this.allPoints;
        }
        return this.allPoints.filter(
            p => !p.displayLabel || !hidden.has(p.displayLabel)
        );
    }

    @computed get categoryCounts(): Map<string, number> {
        const counts = new Map<string, number>();
        for (const point of this.allPoints) {
            const category = point.displayLabel || '';
            counts.set(category, (counts.get(category) || 0) + 1);
        }
        return counts;
    }

    @computed get visibleCategoryCounts(): Map<string, number> {
        const counts = new Map<string, number>();
        for (const point of this.plotData) {
            const category = point.displayLabel || '';
            counts.set(category, (counts.get(category) || 0) + 1);
        }
        return counts;
    }

    @computed get categoryColors(): Map<
        string,
        { fillColor: string; strokeColor: string; hasStroke: boolean }
    > {
        const colors = new Map<
            string,
            { fillColor: string; strokeColor: string; hasStroke: boolean }
        >();
        for (const point of this.allPoints) {
            if (point.displayLabel && point.color) {
                if (!colors.has(point.displayLabel)) {
                    colors.set(point.displayLabel, {
                        fillColor: point.color,
                        strokeColor: point.color,
                        hasStroke: false,
                    });
                }
            }
        }
        return colors;
    }

    // From the whole map rather than what is plotted, so hiding a category
    // leaves the remaining points' size unchanged.
    @computed get pointScale(): number {
        const points = this.selectedOption?.data.data ?? [];
        return (
            calculatePointScale(points) *
            calculateSparseMapPointFactor(points.length)
        );
    }

    @computed get contextPointBoost(): number {
        const pointCount = this.selectedOption?.data.data.length ?? 0;
        return (
            calculateContextPointBoost(pointCount) /
            calculateSparseMapPointFactor(pointCount)
        );
    }

    // Only this patient's points, so panning reprojects a handful rather than
    // indexing the whole map on every frame.
    @computed get patientPoints(): SampleEmbeddingPoint[] {
        const option = this.selectedOption;
        if (!option) {
            return [];
        }
        const wanted = new Set(this.sampleIds);
        return option.data.data.filter(p => wanted.has(p.sampleId));
    }

    @computed get placedSamples(): {
        sampleId: string;
        left: number;
        top: number;
    }[] {
        if (this.mapWidth === 0) {
            return [];
        }
        return this.patientPoints.map(p => {
            const [left, top] = projectToScreen(
                p.x,
                p.y,
                this.viewport.current,
                this.mapWidth,
                this.mapHeight
            );
            return { sampleId: p.sampleId, left, top };
        });
    }

    @computed get unplacedSampleIds(): string[] {
        const option = this.selectedOption;
        if (!option) {
            return this.sampleIds;
        }
        const inMap = new Set(option.data.data.map(p => p.sampleId));
        return this.sampleIds.filter(id => !inMap.has(id));
    }

    @action.bound
    private centerView() {
        this.viewport.centerOn(
            (this.selectedOption?.data.data ?? []) as EmbeddingPoint[]
        );
    }

    @action.bound
    private onSelectMap(option: { value: string } | null) {
        if (option) {
            this.selectedValue = option.value;
            this.clearSelection();
        }
    }

    @action.bound
    private onMutationTypeToggle(enabled: boolean) {
        this.mutationTypeEnabled = enabled;
    }

    @action.bound
    private onCopyNumberToggle(enabled: boolean) {
        this.copyNumberEnabled = enabled;
    }

    @action.bound
    private onStructuralVariantToggle(enabled: boolean) {
        this.structuralVariantEnabled = enabled;
    }

    @action.bound
    private onColoringSelectionChange(option?: ColoringMenuOmnibarOption) {
        this.selectedColoringOption = option;
        this.categoryVisibility.reset();
        this.syncColoringGene();
    }

    // The context fetches and annotates whichever gene it is told about, so a
    // driver call reaches the map only if this stays in step with the menu.
    @action.bound
    private syncColoringGene() {
        const entrezGeneId = this.coloringOption?.info?.entrezGeneId;
        const gene = this.colorableGenes.find(
            g => g.entrezGeneId === entrezGeneId
        );
        this.coloring.setColoringGenes(gene ? [gene] : []);
    }

    @action.bound
    private onSelectionModeChange(mode: 'none' | 'lasso') {
        this.selectionMode = mode;
    }

    @action.bound
    private onToggleAllCategories() {
        this.categoryVisibility.toggleAll(this.categoryCounts.keys());
    }

    @action.bound
    private onPinPoint(point: EmbeddingPoint) {
        this.pinnedPoint = point;
    }

    @action.bound
    private onUnpinPoint() {
        this.pinnedPoint = null;
    }

    @action.bound
    private onPointSelection(points: EmbeddingPoint[]) {
        this.lassoSelection = points
            .map(p => p.sampleId)
            .filter((id): id is string => !!id);
        this.resolveLassoSelection(this.lassoSelection);
    }

    // A map's points carry a bare sample id, but the study view needs each one
    // paired with its study. The colouring fetch already returns every study's
    // clinical data, so it doubles as that index at no extra cost; anything it
    // does not cover is asked for against this study.
    private async resolveLassoSelection(sampleIds: string[]) {
        const token = ++this.lassoToken;
        runInAction(() => {
            this.isResolvingLasso = sampleIds.length > 0;
            this.lassoSampleIdentifiers = [];
        });
        if (sampleIds.length === 0) {
            return;
        }
        const index = this.sampleStudyIds;
        const found: SampleIdentifier[] = [];
        const unknown: string[] = [];
        sampleIds.forEach(sampleId => {
            const studyId = index.get(sampleId);
            if (studyId) {
                found.push({ sampleId, studyId } as SampleIdentifier);
            } else {
                unknown.push(sampleId);
            }
        });
        if (unknown.length > 0) {
            try {
                const samples = await getClient().fetchSamplesUsingPOST({
                    projection: 'ID',
                    sampleFilter: {
                        sampleIdentifiers: unknown.map(sampleId => ({
                            sampleId,
                            studyId: this.props.studyId,
                        })),
                    } as SampleFilter,
                });
                samples.forEach(s =>
                    found.push({
                        sampleId: s.sampleId,
                        studyId: s.studyId,
                    } as SampleIdentifier)
                );
            } catch (e) {
                // Leave the unresolved ids out rather than sending the study
                // view identifiers it would silently drop.
            }
        }
        if (token !== this.lassoToken) {
            return;
        }
        runInAction(() => {
            this.lassoSampleIdentifiers = found;
            this.isResolvingLasso = false;
        });
    }

    @action.bound
    private clearSelection() {
        this.lassoToken++;
        this.lassoSelection = [];
        this.lassoSampleIdentifiers = [];
        this.isResolvingLasso = false;
        this.plotInstance++;
    }

    // The link carries the selection when there is one, so a neighbourhood
    // picked here opens as a selection there; otherwise it carries the patient.
    @computed get studyViewSampleIdentifiers(): SampleIdentifier[] {
        return this.lassoSelection.length > 0
            ? this.lassoSampleIdentifiers
            : this.sampleIds.map(
                  sampleId =>
                      ({
                          sampleId,
                          studyId: this.props.studyId,
                      } as SampleIdentifier)
              );
    }

    // Held as a computed because a selection of thousands is serialised into
    // it, which should happen when the selection changes and not on every
    // frame of a pan.
    @computed get studyViewUrl(): string {
        return getStudyViewMapUrl(
            this.mapStudyIds,
            this.studyViewSampleIdentifiers,
            this.selectedOption?.value
        );
    }

    private renderStudyViewLink() {
        const style = { marginLeft: 10, color: '#666' };
        if (this.lassoSelection.length === 0) {
            return (
                <a
                    data-test="patient-similarity-map-study-view-link"
                    href={this.studyViewUrl}
                    style={{ marginLeft: 10 }}
                >
                    Open in study view
                </a>
            );
        }
        if (this.isResolvingLasso) {
            return <span style={style}>Checking the selection…</span>;
        }
        if (this.lassoSampleIdentifiers.length === 0) {
            return (
                <span
                    style={style}
                    data-test="patient-similarity-map-empty-selection"
                >
                    No selected sample could be matched to a study
                </span>
            );
        }
        return (
            <a
                data-test="patient-similarity-map-study-view-link"
                href={this.studyViewUrl}
                style={{ marginLeft: 10 }}
            >
                {`Open ${this.lassoSampleIdentifiers.length} selected in study view`}
            </a>
        );
    }

    private renderControlStack() {
        return (
            <div
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 6,
                    width: 190,
                    flexShrink: 0,
                    padding: 8,
                    borderRadius: 4,
                    // Floats over the points, so it carries its own backdrop.
                    backgroundColor: 'rgba(255, 255, 255, 0.85)',
                    border: '1px solid #ddd',
                }}
            >
                <div className="patient-similarity-map-coloring">
                    <span style={ROW_LABEL_STYLE}>Color by</span>
                    <ColorSamplesByDropdown
                        genes={this.colorableGenes}
                        clinicalAttributes={this.coloringAttributes}
                        selectedOption={this.coloringOption}
                        hasNoQueriedGenes={true}
                        isLoading={this.isColoringPending}
                        mutationDataExists={this.mutationDataExists}
                        cnaDataExists={this.cnaDataExists}
                        svDataExists={this.svDataExists}
                        mutationTypeEnabled={this.mutationTypeEnabled}
                        copyNumberEnabled={this.copyNumberEnabled}
                        structuralVariantEnabled={
                            this.structuralVariantEnabled
                        }
                        // The map's largest study has no expression profile,
                        // so the option would grey out most of the points.
                        mrnaDataExists={false}
                        onSelectionChange={this.onColoringSelectionChange}
                        onMutationTypeToggle={this.onMutationTypeToggle}
                        onCopyNumberToggle={this.onCopyNumberToggle}
                        onStructuralVariantToggle={
                            this.onStructuralVariantToggle
                        }
                    />
                </div>
                <div>
                    <span style={{ ...ROW_LABEL_STYLE, paddingLeft: 2 }}>
                        Viewport
                    </span>
                    <button
                        onClick={this.centerView}
                        style={{
                            display: 'block',
                            width: '100%',
                            marginTop: 2,
                            padding: '4px 8px',
                            fontSize: 11,
                            backgroundColor: 'rgba(255, 255, 255, 0.95)',
                            border: '1px solid #ccc',
                            borderRadius: 4,
                            cursor: 'pointer',
                        }}
                    >
                        Center
                    </button>
                </div>
            </div>
        );
    }

    render() {
        const option = this.selectedOption;
        if (!option) {
            return isAnyEmbeddingPending(this.embeddingScope) ? (
                <LoadingIndicator isLoading={true} size={'big'} center={true} />
            ) : (
                <div data-test="patient-similarity-map-empty">
                    None of this patient's samples are in a similarity map.
                </div>
            );
        }
        const { sampleManager } = this.props;
        const mapOptions = this.options.map(o => ({
            value: o.value,
            label: o.label,
        }));
        return (
            <div data-test="patient-similarity-map">
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        padding: '6px 8px',
                        marginBottom: 8,
                        background: '#f8f9fa',
                        border: '1px solid #e3e3e3',
                        borderRadius: 4,
                    }}
                >
                    <SelectionControls
                        selectionMode={this.selectionMode}
                        onSelectionModeChange={this.onSelectionModeChange}
                    />
                    {this.lassoSelection.length > 0 && (
                        <a
                            data-test="patient-similarity-map-clear-lasso"
                            onClick={this.clearSelection}
                            style={{ cursor: 'pointer', fontSize: 12 }}
                        >
                            Clear selection
                        </a>
                    )}
                    <div style={{ marginLeft: 'auto', fontSize: 12 }}>
                        <Select
                            name="patient-similarity-map-select"
                            value={
                                mapOptions.find(
                                    o => o.value === option.value
                                ) || null
                            }
                            options={mapOptions}
                            onChange={this.onSelectMap}
                            isSearchable={false}
                            isDisabled={mapOptions.length < 2}
                            styles={{
                                ...SELECT_STYLES,
                                container: (base: any) => ({
                                    ...base,
                                    width: 260,
                                    display: 'inline-block',
                                    verticalAlign: 'middle',
                                }),
                            }}
                        />
                        {this.renderStudyViewLink()}
                    </div>
                </div>
                <div>
                    <div
                        ref={this.setContainer}
                        style={{
                            position: 'relative',
                            minWidth: 0,
                            height: this.mapHeight,
                            overflow: 'hidden',
                            border: '1px solid #eee',
                        }}
                    >
                        <EmbeddingDeckGLVisualization
                            key={this.plotInstance}
                            data={this.plotData}
                            height={this.mapHeight}
                            embeddingType="samples"
                            pointScale={this.pointScale}
                            contextPointBoost={this.contextPointBoost}
                            viewState={this.viewport.current}
                            onViewStateChange={this.viewport.set}
                            selectionMode={this.selectionMode}
                            onSelectionModeChange={this.onSelectionModeChange}
                            onPointSelection={this.onPointSelection}
                            renderControls={renderNoControls}
                            showLegend={true}
                            colorByLabel={this.coloringOption?.label}
                            categoryCounts={this.categoryCounts}
                            visibleCategoryCounts={this.visibleCategoryCounts}
                            categoryColors={this.categoryColors}
                            hiddenCategories={this.categoryVisibility.hidden}
                            onToggleCategoryVisibility={
                                this.categoryVisibility.toggle
                            }
                            onToggleAllCategories={this.onToggleAllCategories}
                            totalSampleCount={this.allPoints.length}
                            visibleSampleCount={this.plotData.length}
                            totalCategoryCount={this.categoryCounts.size}
                            visibleCategoryCount={
                                this.categoryCounts.size -
                                this.categoryVisibility.hidden.size
                            }
                            isNumericAttribute={this.isNumericColoring}
                            numericalValueRange={
                                this.clinicalColoringEntry?.numericalValueRange
                            }
                            numericalValueToColor={
                                this.clinicalColoringEntry
                                    ?.numericalValueToColor
                            }
                            pinnedPoint={this.pinnedPoint}
                            onPinPoint={this.onPinPoint}
                            onUnpinPoint={this.onUnpinPoint}
                            filename={`${option.value}_${this.props.studyId}`}
                        />
                        <div
                            style={{
                                position: 'absolute',
                                inset: 0,
                                pointerEvents: 'none',
                            }}
                        >
                            {this.placedSamples.map(
                                ({ sampleId, left, top }) => (
                                    <div
                                        key={sampleId}
                                        data-test="patient-similarity-map-sample"
                                        style={{
                                            position: 'absolute',
                                            left: left - SAMPLE_ICON_SIZE / 2,
                                            top: top - SAMPLE_ICON_SIZE / 2,
                                            lineHeight: 0,
                                            transform: `scale(${SAMPLE_ICON_SCALE})`,
                                            filter:
                                                'drop-shadow(0 0 1px white) drop-shadow(0 0 1px white)',
                                        }}
                                    >
                                        {sampleManager.getComponentForSample(
                                            sampleId
                                        )}
                                    </div>
                                )
                            )}
                        </div>
                        {this.isColoringPending && (
                            <div
                                data-test="patient-similarity-map-coloring-pending"
                                style={{
                                    position: 'absolute',
                                    inset: 0,
                                    zIndex: 2,
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: 8,
                                    backgroundColor: '#fff',
                                }}
                            >
                                <LoadingIndicator
                                    isLoading={true}
                                    size={'big'}
                                />
                                <span style={{ color: '#666' }}>
                                    {`Loading ${this.coloringOption?.label ??
                                        'colors'} for ${
                                        this.mapStudyIds.length
                                    } studies…`}
                                </span>
                            </div>
                        )}
                        <div
                            style={{
                                position: 'absolute',
                                top: 10,
                                left: 10,
                                zIndex: 3,
                            }}
                        >
                            {this.renderControlStack()}
                        </div>
                    </div>
                </div>
                {this.unplacedSampleIds.length > 0 && (
                    <div style={{ marginTop: 8, color: '#666' }}>
                        Not in this map:{' '}
                        {this.unplacedSampleIds.map(sampleId => (
                            <span key={sampleId} style={{ marginRight: 6 }}>
                                {sampleManager.getComponentForSample(sampleId)}{' '}
                                {sampleId}
                            </span>
                        ))}
                    </div>
                )}
            </div>
        );
    }
}
