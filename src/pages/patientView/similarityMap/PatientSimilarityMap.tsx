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

const MAP_HEIGHT = 560;
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
    private readonly viewport = new EmbeddingViewportState();
    @observable.ref private lassoSelection: string[] = [];
    @observable.ref private lassoSampleIdentifiers: SampleIdentifier[] = [];
    @observable private isResolvingLasso = false;
    private readonly categoryVisibility = new EmbeddingCategoryVisibility();
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

    // Every sample of every study the map covers, fetched once and shared by
    // all attributes. It supplies the identifiers the clinical fetch needs and
    // doubles as the point's study, which a map's bare sample id never carries.
    private readonly mapSamples = new MobxPromiseCache<
        { studyIds: string[] },
        Sample[]
    >(
        q => ({
            invoke: () =>
                internalClient.fetchFilteredSamplesUsingPOST({
                    studyViewFilter: { studyIds: q.studyIds } as StudyViewFilter,
                }),
        }),
        q => q.studyIds.join(',')
    );

    // The study view's fetch, chunked. The patient view's own clinical cache
    // holds this study alone, which on a map built from many studies colours a
    // sliver of the points and greys the rest.
    private readonly mapClinicalData = new MobxPromiseCache<
        { attribute: ClinicalAttribute; studyIds: string[] },
        MapColoringEntry
    >(
        q => ({
            await: () => [this.mapSamples.get({ studyIds: q.studyIds })],
            invoke: async () => {
                const samples =
                    this.mapSamples.get({ studyIds: q.studyIds }).result ?? [];
                const chunks = _.chunk(samples, CLINICAL_FETCH_CHUNK_SIZE);
                let failedSampleCount = 0;
                const perChunk = await mapWithConcurrency(
                    chunks,
                    CLINICAL_FETCH_CONCURRENCY,
                    async chunk => {
                        for (let attempt = 0; ; attempt++) {
                            try {
                                return await getClient().fetchClinicalDataUsingPOST(
                                    {
                                        clinicalDataType: 'SAMPLE',
                                        projection: 'SUMMARY',
                                        clinicalDataMultiStudyFilter: {
                                            attributeIds: [
                                                q.attribute.clinicalAttributeId,
                                            ],
                                            identifiers: chunk.map(s => ({
                                                entityId: s.sampleId,
                                                studyId: s.studyId,
                                            })),
                                        },
                                    }
                                );
                            } catch (e) {
                                if (attempt + 1 >= CLINICAL_FETCH_ATTEMPTS) {
                                    failedSampleCount += chunk.length;
                                    return [] as ClinicalData[];
                                }
                                await sleep(
                                    CLINICAL_FETCH_BACKOFF_MS * (attempt + 1)
                                );
                            }
                        }
                    }
                );
                const data = _.flatten(perChunk);
                return {
                    data,
                    failedSampleCount,
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

    @computed get failedSampleCount(): number {
        return this.coloringEntry?.failedSampleCount ?? 0;
    }

    // Which study each sample of the map belongs to. Empty until the sample
    // list has loaded.
    @computed get sampleStudyIds(): Map<string, string> {
        const index = new Map<string, string>();
        const option = this.selectedOption;
        if (option) {
            this.mapSamples
                .get({ studyIds: option.data.studyIds })
                .result?.forEach(s => index.set(s.sampleId, s.studyId));
        }
        return index;
    }

    // Every study the map was built from, so the study view opens the same
    // cohort rather than whichever one this patient happens to be in.
    @computed get mapStudyIds(): string[] {
        return this.selectedOption?.data.studyIds ?? [this.props.studyId];
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
                MAP_HEIGHT
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
    private onSelectColoring(option: { value: string } | null) {
        this.selectedColoringAttributeId = option?.value || undefined;
        this.categoryVisibility.reset();
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
                {this.failedSampleCount > 0 && (
                    <div
                        style={{ color: '#a94442', fontSize: 11 }}
                        data-test="patient-similarity-map-coloring-incomplete"
                    >
                        {`Colors for ${this.failedSampleCount.toLocaleString()} samples could not be loaded; those points are grey.`}
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
                        {this.renderStudyViewLink()}
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
                            viewState={this.viewport.current}
                            onViewStateChange={this.viewport.set}
                            selectionMode={this.selectionMode}
                            onSelectionModeChange={this.onSelectionModeChange}
                            onPointSelection={this.onPointSelection}
                            renderControls={renderNoControls}
                            showLegend={true}
                            colorByLabel={this.coloringAttribute?.displayName}
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
                                    {`Loading ${this.coloringAttribute
                                        ?.displayName ?? 'colors'} for ${this
                                        .coloringQuery?.studyIds.length ??
                                        0} studies…`}
                                </span>
                            </div>
                        )}
                    </div>
                </div>
                <div style={{ color: '#666', marginTop: 8 }}>
                    {option.data.description.replace(/\.?\s*$/, '.')} Icons mark
                    this patient's samples. Switch to Select and drag to pick a
                    neighbourhood; the study view opens the same map, across
                    every study it covers, with the selected samples carried
                    over, where they can be filtered and recoloured.
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
