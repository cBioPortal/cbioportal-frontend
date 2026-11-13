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
import SampleManager from 'pages/patientView/SampleManager';
import Select from 'react-select';
import {
    ClinicalAttribute,
    ClinicalData,
    SampleFilter,
} from 'cbioportal-ts-api-client';
import { getClient } from 'shared/api/cbioportalClientInstance';
import MobxPromiseCache from 'shared/lib/MobxPromiseCache';
import { getClinicalAttributeColoring } from 'shared/cache/ClinicalDataCacheUtils';
import { ClinicalDataCacheEntry } from 'shared/cache/ClinicalDataCache';
import LoadingIndicator from 'shared/components/loadingIndicator/LoadingIndicator';
import { EmbeddingDeckGLVisualization } from 'shared/components/embeddings';
import {
    EmbeddingPoint,
    ViewState,
} from 'shared/components/embeddings/EmbeddingTypes';
import { SelectionControls } from 'shared/components/embeddings/controls/SelectionControls';
import {
    calculateContextPointBoost,
    calculateDataBounds,
    calculatePointScale,
    calculateSparseMapPointFactor,
} from 'shared/components/embeddings/utils/dataUtils';
import {
    getLoadedEmbeddingOptions,
    isAnyEmbeddingPending,
} from 'shared/components/embeddings/embeddingSources';
import {
    getEmbeddingOptionsForSamples,
    getClinicalColorsBySampleId,
    getStudyViewMapUrl,
    mapWithConcurrency,
    projectToScreen,
    SampleEmbeddingOption,
} from './PatientSimilarityMapUtils';

const MAP_HEIGHT = 560;
const UNCOLORED_POINT_COLOR = '#bbbbbb';
const NO_DATA_LABEL = 'No data';
// What the study view colours by; on a pan-cancer map it is the one attribute
// whose legend still reads as a map.
const DEFAULT_COLORING_ATTRIBUTE_ID = 'CANCER_TYPE';
// SampleLabelHTML draws a 12px icon; enlarged so it stands out on a dense map.
const SAMPLE_ICON_SIZE = 12;
const SAMPLE_ICON_SCALE = 1.5;
// The API answers a burst of per-study requests with 429s, which would leave
// whole studies uncoloured, so they go a few at a time and a failure is retried.
const CLINICAL_FETCH_CONCURRENCY = 3;
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

// Which studies the colouring could not be read from, so the map can say so
// instead of showing their samples as though they had no value.
type MapColoringEntry = ClinicalDataCacheEntry & { failedStudyIds: string[] };

function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export interface IPatientSimilarityMapProps {
    studyId: string;
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
    @observable private selectedColoringAttributeId: string | undefined;
    @observable private selectionMode: 'none' | 'lasso' = 'none';
    @observable.ref private viewState: ViewState = {
        target: [0, 0, 0],
        zoom: 0,
        minZoom: -5,
        maxZoom: 10,
    };
    @observable.ref private lassoSelection: string[] = [];
    @observable.ref private lassoStudySampleIds: string[] = [];
    @observable private isResolvingLasso = false;
    @observable.ref private hiddenCategories = new Set<string>();
    @observable.ref private pinnedPoint: EmbeddingPoint | null = null;
    @observable private mapWidth = 0;
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
    @computed get coloringAttributes(): ClinicalAttribute[] {
        return _.sortBy(
            this.props.clinicalAttributes.filter(a => !a.patientAttribute),
            a => a.displayName
        );
    }

    @computed get coloringOptions(): { value: string; label: string }[] {
        return this.coloringAttributes.map(a => ({
            value: a.clinicalAttributeId,
            label: a.displayName,
        }));
    }

    @computed get coloringAttributeId(): string | undefined {
        if (this.selectedColoringAttributeId) {
            return this.selectedColoringAttributeId;
        }
        const hasDefault = this.coloringAttributes.some(
            a => a.clinicalAttributeId === DEFAULT_COLORING_ATTRIBUTE_ID
        );
        return hasDefault ? DEFAULT_COLORING_ATTRIBUTE_ID : undefined;
    }

    @computed get coloringAttribute(): ClinicalAttribute | undefined {
        return this.coloringAttributes.find(
            a => a.clinicalAttributeId === this.coloringAttributeId
        );
    }

    @computed get selectedColoringOption() {
        return (
            this.coloringOptions.find(
                o => o.value === this.coloringAttributeId
            ) || null
        );
    }

    @computed get isNumericColoring(): boolean {
        return this.coloringAttribute?.datatype === 'NUMBER';
    }

    // One request per study the map covers, kept per attribute. The patient
    // view's own cache holds this study alone, which on a map built from many
    // studies colours a sliver of the points and greys the rest.
    private readonly mapClinicalData = new MobxPromiseCache<
        { attribute: ClinicalAttribute; studyIds: string[] },
        MapColoringEntry
    >(
        q => ({
            invoke: async () => {
                const failedStudyIds: string[] = [];
                const perStudy = await mapWithConcurrency(
                    q.studyIds,
                    CLINICAL_FETCH_CONCURRENCY,
                    async studyId => {
                        for (let attempt = 0; ; attempt++) {
                            try {
                                return await getClient().getAllClinicalDataInStudyUsingGET(
                                    {
                                        studyId,
                                        attributeId:
                                            q.attribute.clinicalAttributeId,
                                        clinicalDataType: 'SAMPLE',
                                        projection: 'SUMMARY',
                                    }
                                );
                            } catch (e) {
                                if (attempt + 1 >= CLINICAL_FETCH_ATTEMPTS) {
                                    failedStudyIds.push(studyId);
                                    return [] as ClinicalData[];
                                }
                                await sleep(
                                    CLINICAL_FETCH_BACKOFF_MS * (attempt + 1)
                                );
                            }
                        }
                    }
                );
                const data = _.flatten(perStudy);
                return {
                    data,
                    failedStudyIds,
                    ...getClinicalAttributeColoring(data, q.attribute.datatype),
                };
            },
        }),
        q => `${q.attribute.clinicalAttributeId}|${q.studyIds.join(',')}`
    );

    @computed get coloringQuery():
        | { attribute: ClinicalAttribute; studyIds: string[] }
        | undefined {
        const attribute = this.coloringAttribute;
        const option = this.selectedOption;
        if (!attribute || !option) {
            return undefined;
        }
        return { attribute, studyIds: option.data.studyIds };
    }

    @computed get coloringEntry(): MapColoringEntry | undefined {
        const query = this.coloringQuery;
        if (!query) {
            return undefined;
        }
        const entry = this.mapClinicalData.get(query);
        return entry.isComplete ? entry.result : undefined;
    }

    @computed get clinicalColors():
        | { colors: Map<string, string>; values: Map<string, string> }
        | undefined {
        const query = this.coloringQuery;
        const result = this.coloringEntry;
        if (!query || !result) {
            return undefined;
        }
        return getClinicalColorsBySampleId(
            result.data as any,
            this.isNumericColoring ? undefined : result.categoryToColor,
            result.numericalValueToColor,
            query.studyIds
        );
    }

    @computed get isColoringPending(): boolean {
        const query = this.coloringQuery;
        return !!query && this.mapClinicalData.get(query).isPending;
    }

    @computed get failedStudyIds(): string[] {
        return this.coloringEntry?.failedStudyIds ?? [];
    }

    // Every point the map draws, coloured. Kept separate from what is plotted
    // so hiding a category leaves the legend's totals alone.
    @computed get allPoints(): EmbeddingPoint[] {
        const option = this.selectedOption;
        if (!option) {
            return [];
        }
        const clinical = this.clinicalColors;
        const categoryLabel = this.isNumericColoring
            ? this.coloringAttribute?.displayName ?? NO_DATA_LABEL
            : undefined;
        return option.data.data.map(p => {
            const color = clinical?.colors.get(p.sampleId);
            const value = clinical?.values.get(p.sampleId);
            return {
                x: p.x,
                y: p.y,
                sampleId: p.sampleId,
                color: color || UNCOLORED_POINT_COLOR,
                displayLabel:
                    value === undefined
                        ? NO_DATA_LABEL
                        : categoryLabel ?? value,
                isInCohort: true,
            } as EmbeddingPoint;
        });
    }

    @computed get plotData(): EmbeddingPoint[] {
        const hidden = this.hiddenCategories;
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

    @computed get placedSamples(): {
        sampleId: string;
        left: number;
        top: number;
    }[] {
        const option = this.selectedOption;
        if (!option || this.mapWidth === 0) {
            return [];
        }
        const byId = new Map(option.data.data.map(p => [p.sampleId, p]));
        return this.sampleIds
            .filter(id => byId.has(id))
            .map(sampleId => {
                const p = byId.get(sampleId)!;
                const [left, top] = projectToScreen(
                    p.x,
                    p.y,
                    this.viewState,
                    this.mapWidth,
                    MAP_HEIGHT
                );
                return { sampleId, left, top };
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
        const bounds = calculateDataBounds(
            (this.selectedOption?.data.data ?? []) as EmbeddingPoint[]
        );
        this.viewState = {
            target: [bounds.centerX, bounds.centerY, 0],
            zoom: bounds.zoom,
            minZoom: -5,
            maxZoom: 10,
        };
    }

    @action.bound
    private onViewStateChange(viewState: ViewState) {
        this.viewState = viewState;
    }

    @action.bound
    private onSelectMap(option: { value: string } | null) {
        if (option) {
            this.selectedValue = option.value;
            this.clearSelection();
        }
    }

    @action.bound
    private onSelectColoring(option: { value: string } | null) {
        this.selectedColoringAttributeId = option?.value || undefined;
        this.hiddenCategories = new Set();
    }

    @action.bound
    private onSelectionModeChange(mode: 'none' | 'lasso') {
        this.selectionMode = mode;
    }

    @action.bound
    private onToggleCategoryVisibility(category: string) {
        const hidden = new Set(this.hiddenCategories);
        if (hidden.has(category)) {
            hidden.delete(category);
        } else {
            hidden.add(category);
        }
        this.hiddenCategories = hidden;
    }

    @action.bound
    private onToggleAllCategories() {
        this.hiddenCategories =
            this.hiddenCategories.size === 0
                ? new Set(this.categoryCounts.keys())
                : new Set();
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

    // A map can cover many studies, so a selected point need not be a sample of
    // this one. The study view is opened on this study, so ask which of them it
    // actually holds rather than sending ids it would silently drop.
    private async resolveLassoSelection(sampleIds: string[]) {
        const token = ++this.lassoToken;
        runInAction(() => {
            this.isResolvingLasso = sampleIds.length > 0;
            this.lassoStudySampleIds = [];
        });
        if (sampleIds.length === 0) {
            return;
        }
        let found: string[] = [];
        try {
            const samples = await getClient().fetchSamplesUsingPOST({
                projection: 'ID',
                sampleFilter: {
                    sampleIdentifiers: sampleIds.map(sampleId => ({
                        sampleId,
                        studyId: this.props.studyId,
                    })),
                } as SampleFilter,
            });
            found = samples.map(s => s.sampleId);
        } catch (e) {
            found = [];
        }
        if (token !== this.lassoToken) {
            return;
        }
        runInAction(() => {
            this.lassoStudySampleIds = found;
            this.isResolvingLasso = false;
        });
    }

    @action.bound
    private clearSelection() {
        this.lassoToken++;
        this.lassoSelection = [];
        this.lassoStudySampleIds = [];
        this.isResolvingLasso = false;
        this.plotInstance++;
    }

    // The link carries the selection when there is one, so a neighbourhood
    // picked here opens as a selection there; otherwise it carries the patient.
    @computed get studyViewSampleIds(): string[] {
        return this.lassoSelection.length > 0
            ? this.lassoStudySampleIds
            : this.sampleIds;
    }

    private renderStudyViewLink(mapValue: string) {
        const style = { marginLeft: 10, color: '#666' };
        if (this.lassoSelection.length === 0) {
            return (
                <a
                    data-test="patient-similarity-map-study-view-link"
                    href={getStudyViewMapUrl(
                        this.props.studyId,
                        this.studyViewSampleIds,
                        mapValue
                    )}
                    style={{ marginLeft: 10 }}
                >
                    Open in study view
                </a>
            );
        }
        if (this.isResolvingLasso) {
            return <span style={style}>Checking the selection…</span>;
        }
        if (this.lassoStudySampleIds.length === 0) {
            return (
                <span
                    style={style}
                    data-test="patient-similarity-map-empty-selection"
                >
                    No selected sample belongs to this study
                </span>
            );
        }
        return (
            <a
                data-test="patient-similarity-map-study-view-link"
                href={getStudyViewMapUrl(
                    this.props.studyId,
                    this.studyViewSampleIds,
                    mapValue
                )}
                style={{ marginLeft: 10 }}
            >
                {`Open ${this.lassoStudySampleIds.length} selected in study view`}
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
                }}
            >
                {this.coloringOptions.length > 0 && (
                    <div>
                        <span style={ROW_LABEL_STYLE}>Color by</span>
                        <Select
                            name="patient-similarity-map-coloring"
                            className="patient-similarity-map-coloring"
                            value={this.selectedColoringOption}
                            options={this.coloringOptions}
                            onChange={this.onSelectColoring}
                            isSearchable={true}
                            isClearable={false}
                            placeholder="Search for an attribute"
                            styles={SELECT_STYLES}
                        />
                    </div>
                )}
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
                {this.isColoringPending && (
                    <div
                        style={{ color: '#666', fontSize: 11 }}
                        data-test="patient-similarity-map-coloring-pending"
                    >
                        Loading colors for{' '}
                        {this.coloringQuery?.studyIds.length ?? 0} studies…
                    </div>
                )}
                {this.failedStudyIds.length > 0 && (
                    <div
                        style={{ color: '#a94442', fontSize: 11 }}
                        data-test="patient-similarity-map-coloring-incomplete"
                    >
                        {`${this.failedStudyIds.length} of ${this.coloringQuery
                            ?.studyIds.length ??
                            0} studies could not be loaded; their samples are grey.`}
                    </div>
                )}
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
                        {mapOptions.length > 1 ? (
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
                                styles={{
                                    ...SELECT_STYLES,
                                    container: (base: any) => ({
                                        ...base,
                                        width: 220,
                                        display: 'inline-block',
                                        verticalAlign: 'middle',
                                    }),
                                }}
                            />
                        ) : (
                            <strong>{option.label}</strong>
                        )}
                        {this.renderStudyViewLink(option.value)}
                    </div>
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                    {this.renderControlStack()}
                    <div
                        ref={this.setContainer}
                        style={{
                            position: 'relative',
                            flexGrow: 1,
                            minWidth: 0,
                            height: MAP_HEIGHT,
                            overflow: 'hidden',
                            border: '1px solid #eee',
                        }}
                    >
                        <EmbeddingDeckGLVisualization
                            key={this.plotInstance}
                            data={this.plotData}
                            height={MAP_HEIGHT}
                            embeddingType="samples"
                            pointScale={this.pointScale}
                            contextPointBoost={this.contextPointBoost}
                            viewState={this.viewState}
                            onViewStateChange={this.onViewStateChange}
                            selectionMode={this.selectionMode}
                            onSelectionModeChange={this.onSelectionModeChange}
                            onPointSelection={this.onPointSelection}
                            renderControls={() => null}
                            showLegend={true}
                            colorByLabel={this.coloringAttribute?.displayName}
                            categoryCounts={this.categoryCounts}
                            visibleCategoryCounts={this.visibleCategoryCounts}
                            categoryColors={this.categoryColors}
                            hiddenCategories={this.hiddenCategories}
                            onToggleCategoryVisibility={
                                this.onToggleCategoryVisibility
                            }
                            onToggleAllCategories={this.onToggleAllCategories}
                            totalSampleCount={this.allPoints.length}
                            visibleSampleCount={this.plotData.length}
                            totalCategoryCount={this.categoryCounts.size}
                            visibleCategoryCount={
                                this.categoryCounts.size -
                                this.hiddenCategories.size
                            }
                            isNumericAttribute={this.isNumericColoring}
                            numericalValueRange={
                                this.coloringEntry?.numericalValueRange
                            }
                            numericalValueToColor={
                                this.coloringEntry?.numericalValueToColor
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
                    </div>
                </div>
                <div style={{ color: '#666', marginTop: 8 }}>
                    {option.data.description.replace(/\.?\s*$/, '.')} Icons mark
                    this patient's samples. Switch to Select and drag to pick a
                    neighbourhood; the study view opens the same map with
                    whichever of the selected samples belong to this study,
                    where they can be filtered and recoloured.
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
