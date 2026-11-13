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
import {
    getLoadedEmbeddingOptions,
    isAnyEmbeddingPending,
} from 'shared/components/embeddings/embeddingSources';
import {
    fitProjection,
    getEmbeddingOptionsForSamples,
    getClinicalColorsBySampleId,
    getReferenceCategoryColors,
    getSamplesInLasso,
    LassoPoint,
    mapWithConcurrency,
    getStudyViewMapUrl,
    SampleEmbeddingOption,
} from './PatientSimilarityMapUtils';

const MAP_WIDTH = 800;
const MAP_HEIGHT = 560;
const MAP_PADDING = 16;
const POINT_RADIUS = 2.5;
const UNCOLORED_POINT_COLOR = '#bbbbbb';
const POINT_ALPHA = 0.55;
// The study view colours by this attribute by default; a map that carries it
// for its own samples can show the same picture here.
const REFERENCE_COLOR_ATTRIBUTE_ID = 'CANCER_TYPE';
// SampleLabelHTML draws a 12px icon; enlarged so it stands out on a dense map.
const SAMPLE_ICON_SIZE = 12;
const SAMPLE_ICON_SCALE = 1.5;
const DIMMED_ALPHA = 0.12;
const REFERENCE_COLORING_VALUE = '';
// A pan-cancer map has hundreds of detailed types; the rest sit behind a count.
const LEGEND_MAX_ENTRIES = 20;
// The API answers a burst of per-study requests with 429s, which would leave
// whole studies uncoloured, so they go a few at a time and a failure is retried.
const CLINICAL_FETCH_CONCURRENCY = 3;
const CLINICAL_FETCH_ATTEMPTS = 3;
const CLINICAL_FETCH_BACKOFF_MS = 400;
const COLORING_SELECT_STYLES = {
    control: (base: any) => ({
        ...base,
        fontSize: '12px',
        minHeight: '30px',
        boxShadow: 'none',
        border: '1px solid #ccc',
    }),
    menu: (base: any) => ({ ...base, fontSize: '12px' }),
    menuPortal: (base: any) => ({ ...base, zIndex: 20 }),
    container: (base: any) => ({ ...base, width: '220px' }),
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
    @observable private coloringAttributeId: string | undefined;
    @observable.ref private lassoPath: LassoPoint[] = [];
    @observable.ref private lassoSelection: string[] = [];
    @observable.ref private lassoStudySampleIds: string[] = [];
    @observable private isResolvingLasso = false;
    @observable private isLassoing = false;

    private lassoDisposer?: () => void;
    private lassoToken = 0;

    constructor(props: IPatientSimilarityMapProps) {
        super(props);
        makeObservable(this);
    }

    componentDidMount() {
        this.lassoDisposer = autorun(() => this.paintLasso());
    }

    componentWillUnmount() {
        this.lassoDisposer?.();
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

    // Sample-level only: a point is a sample, and a patient attribute would
    // colour every sample of a patient alike without saying so.
    @computed get coloringAttributes(): ClinicalAttribute[] {
        return _.sortBy(
            this.props.clinicalAttributes.filter(a => !a.patientAttribute),
            a => a.displayName
        );
    }

    @computed get coloringOptions(): { value: string; label: string }[] {
        return [
            { value: REFERENCE_COLORING_VALUE, label: 'Reference map' },
            ...this.coloringAttributes.map(a => ({
                value: a.clinicalAttributeId,
                label: a.displayName,
            })),
        ];
    }

    @computed get selectedColoringOption() {
        return (
            this.coloringOptions.find(
                o => o.value === (this.coloringAttributeId || REFERENCE_COLORING_VALUE)
            ) || this.coloringOptions[0]
        );
    }

    @computed get coloringAttribute(): ClinicalAttribute | undefined {
        return this.coloringAttributes.find(
            a => a.clinicalAttributeId === this.coloringAttributeId
        );
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

    @computed get clinicalColors():
        | { colors: Map<string, string>; values: Map<string, string> }
        | undefined {
        const query = this.coloringQuery;
        if (!query) {
            return undefined;
        }
        const entry = this.mapClinicalData.get(query);
        if (!entry.isComplete || !entry.result) {
            return undefined;
        }
        return getClinicalColorsBySampleId(
            entry.result.data as any,
            entry.result.categoryToColor,
            entry.result.numericalValueToColor,
            query.studyIds
        );
    }

    @computed get isColoringPending(): boolean {
        const query = this.coloringQuery;
        return !!query && this.mapClinicalData.get(query).isPending;
    }

    @computed get failedStudyCount(): number {
        const query = this.coloringQuery;
        if (!query) {
            return 0;
        }
        const entry = this.mapClinicalData.get(query);
        return entry.result?.failedStudyIds.length ?? 0;
    }

    @computed get selectedOption(): SampleEmbeddingOption | undefined {
        return (
            this.options.find(o => o.value === this.selectedValue) ??
            this.options[0]
        );
    }

    @computed get projection() {
        return fitProjection(
            this.selectedOption?.data.data ?? [],
            MAP_WIDTH,
            MAP_HEIGHT,
            MAP_PADDING
        );
    }

    @computed get categoryColors() {
        return getReferenceCategoryColors(
            this.selectedOption?.data.data ?? [],
            REFERENCE_COLOR_ATTRIBUTE_ID
        );
    }

    @computed get placedSamples(): {
        sampleId: string;
        left: number;
        top: number;
    }[] {
        const option = this.selectedOption;
        if (!option) {
            return [];
        }
        const byId = new Map(option.data.data.map(p => [p.sampleId, p]));
        return this.sampleIds
            .filter(id => byId.has(id))
            .map(sampleId => {
                const p = byId.get(sampleId)!;
                const [left, top] = this.projection.toScreen(p.x, p.y);
                return { sampleId, left, top };
            });
    }

    @computed get unplacedSampleIds(): string[] {
        const placed = new Set(this.placedSamples.map(s => s.sampleId));
        return this.sampleIds.filter(id => !placed.has(id));
    }

    @action.bound
    private onSelectMap(event: React.ChangeEvent<HTMLSelectElement>) {
        this.selectedValue = event.target.value;
    }

    @action.bound
    private onSelectColoring(option: { value: string } | null) {
        this.coloringAttributeId = option?.value || undefined;
    }

    private lassoPointFrom(event: React.MouseEvent): LassoPoint {
        const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
        return {
            x: event.clientX - rect.left,
            y: event.clientY - rect.top,
        };
    }

    @action.bound
    private onLassoStart(event: React.MouseEvent) {
        if (event.button !== 0) {
            return;
        }
        event.preventDefault();
        this.isLassoing = true;
        this.lassoPath = [this.lassoPointFrom(event)];
    }

    @action.bound
    private onLassoMove(event: React.MouseEvent) {
        if (!this.isLassoing) {
            return;
        }
        this.lassoPath = [...this.lassoPath, this.lassoPointFrom(event)];
    }

    @action.bound
    private onLassoEnd() {
        if (!this.isLassoing) {
            return;
        }
        this.isLassoing = false;
        const option = this.selectedOption;
        this.lassoSelection = option
            ? getSamplesInLasso(
                  option.data.data,
                  this.lassoPath,
                  this.projection.toScreen
              )
            : [];
        this.lassoPath = [];
        this.resolveLassoSelection(this.lassoSelection);
    }

    // A map can cover many studies, so a lassoed point need not be a sample of
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
    private clearLasso() {
        this.lassoToken++;
        this.lassoSelection = [];
        this.lassoStudySampleIds = [];
        this.isResolvingLasso = false;
        this.lassoPath = [];
    }

    // The link carries the lasso when there is one, so a neighbourhood picked
    // here opens as a selection there; otherwise it carries the patient.
    @computed get studyViewSampleIds(): string[] {
        return this.lassoSelection.length > 0
            ? this.lassoStudySampleIds
            : this.sampleIds;
    }

    private drawPoints = (canvas: HTMLCanvasElement | null) => {
        const option = this.selectedOption;
        if (!canvas || !option) {
            return;
        }
        const ratio = window.devicePixelRatio || 1;
        canvas.width = MAP_WIDTH * ratio;
        canvas.height = MAP_HEIGHT * ratio;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
            return;
        }
        ctx.scale(ratio, ratio);
        ctx.clearRect(0, 0, MAP_WIDTH, MAP_HEIGHT);
        ctx.globalAlpha = POINT_ALPHA;
        const colorByCategory = new Map(
            this.categoryColors.map(c => [c.category, c.color])
        );
        const clinical = this.clinicalColors;
        const selected = new Set(this.lassoSelection);
        for (const p of option.data.data) {
            const category = p.referenceData?.[REFERENCE_COLOR_ATTRIBUTE_ID];
            ctx.fillStyle = clinical
                ? clinical.colors.get(p.sampleId) || UNCOLORED_POINT_COLOR
                : (category !== undefined &&
                      colorByCategory.get(String(category))) ||
                  UNCOLORED_POINT_COLOR;
            const [x, y] = this.projection.toScreen(p.x, p.y);
            const isSelected = selected.has(p.sampleId);
            ctx.globalAlpha =
                selected.size > 0 && !isSelected ? DIMMED_ALPHA : POINT_ALPHA;
            ctx.beginPath();
            ctx.arc(
                x,
                y,
                isSelected ? POINT_RADIUS + 1 : POINT_RADIUS,
                0,
                2 * Math.PI
            );
            ctx.fill();
            if (isSelected) {
                ctx.globalAlpha = 1;
                ctx.lineWidth = 1;
                ctx.strokeStyle = '#333333';
                ctx.stroke();
            }
        }
        ctx.globalAlpha = 1;
    };

    private drawLasso = (canvas: HTMLCanvasElement | null) => {
        this.lassoCanvas = canvas;
        this.paintLasso();
    };

    private lassoCanvas: HTMLCanvasElement | null = null;

    private paintLasso() {
        const path = this.lassoPath;
        const canvas = this.lassoCanvas;
        if (!canvas) {
            return;
        }
        const ratio = window.devicePixelRatio || 1;
        canvas.width = MAP_WIDTH * ratio;
        canvas.height = MAP_HEIGHT * ratio;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
            return;
        }
        ctx.scale(ratio, ratio);
        ctx.clearRect(0, 0, MAP_WIDTH, MAP_HEIGHT);
        if (path.length < 2) {
            return;
        }
        ctx.strokeStyle = '#2a78d6';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 3]);
        ctx.beginPath();
        ctx.moveTo(path[0].x, path[0].y);
        for (const point of path.slice(1)) {
            ctx.lineTo(point.x, point.y);
        }
        ctx.closePath();
        ctx.stroke();
    }

    @computed get legendEntries(): {
        category: string;
        color: string;
        count: number;
    }[] {
        const clinical = this.clinicalColors;
        if (!clinical) {
            return this.categoryColors;
        }
        // Over the map's points: the studies hold more samples than the map
        // draws, and counting those would describe a different cohort.
        const counts: { [c: string]: { color: string; count: number } } = {};
        for (const point of this.selectedOption?.data.data ?? []) {
            const value = clinical.values.get(point.sampleId);
            const color = clinical.colors.get(point.sampleId);
            if (value === undefined || !color) {
                continue;
            }
            counts[value] = counts[value] || { color, count: 0 };
            counts[value].count += 1;
        }
        return _.orderBy(
            Object.keys(counts).map(category => ({
                category,
                color: counts[category].color,
                count: counts[category].count,
            })),
            e => e.count,
            'desc'
        );
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

    private renderColoringSelector() {
        if (this.coloringAttributes.length === 0) {
            return null;
        }
        return (
            <div style={{ marginBottom: 8 }}>
                <div style={{ fontWeight: 'bold', marginBottom: 4 }}>
                    Color samples by
                </div>
                <Select
                    name="patient-similarity-map-coloring"
                    className="patient-similarity-map-coloring"
                    value={this.selectedColoringOption}
                    options={this.coloringOptions}
                    onChange={this.onSelectColoring}
                    isSearchable={true}
                    isClearable={false}
                    placeholder="Search for a clinical attribute"
                    styles={COLORING_SELECT_STYLES}
                    menuPortalTarget={
                        typeof document !== 'undefined'
                            ? document.body
                            : undefined
                    }
                />
                {this.isColoringPending && (
                    <div
                        style={{ color: '#666', marginTop: 2 }}
                        data-test="patient-similarity-map-coloring-pending"
                    >
                        loading…
                    </div>
                )}
            </div>
        );
    }

    private renderLegend() {
        if (this.legendEntries.length === 0) {
            return null;
        }
        return (
            <div
                data-test="patient-similarity-map-legend"
                style={{ fontSize: 12, maxHeight: MAP_HEIGHT, overflowY: 'auto' }}
            >
                <div style={{ fontWeight: 'bold', marginBottom: 4 }}>
                    {this.coloringAttribute
                        ? this.coloringAttribute.displayName
                        : 'Cancer Type (reference map)'}
                </div>
                {this.legendEntries
                    .slice(0, LEGEND_MAX_ENTRIES)
                    .map(({ category, color, count }) => (
                    <div
                        key={category}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                        }}
                    >
                        <span
                            style={{
                                width: 10,
                                height: 10,
                                borderRadius: '50%',
                                background: color,
                                opacity: POINT_ALPHA,
                                flexShrink: 0,
                            }}
                        />
                        <span>{category}</span>
                        <span style={{ color: '#999' }}>{count}</span>
                    </div>
                ))}
                {this.legendEntries.length > LEGEND_MAX_ENTRIES && (
                    <div style={{ color: '#999', marginTop: 4 }}>
                        {`+ ${this.legendEntries.length -
                            LEGEND_MAX_ENTRIES} more`}
                    </div>
                )}
                {this.failedStudyCount > 0 && (
                    <div
                        style={{ color: '#a94442', marginTop: 6 }}
                        data-test="patient-similarity-map-coloring-incomplete"
                    >
                        {`${this.failedStudyCount} of ${this.coloringQuery
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
        return (
            <div data-test="patient-similarity-map">
                <div style={{ marginBottom: 10 }}>
                    {this.options.length > 1 ? (
                        <select
                            className="form-control input-sm"
                            style={{ width: 'auto', display: 'inline-block' }}
                            value={option.value}
                            onChange={this.onSelectMap}
                        >
                            {this.options.map(o => (
                                <option key={o.value} value={o.value}>
                                    {o.label}
                                </option>
                            ))}
                        </select>
                    ) : (
                        <strong>{option.label}</strong>
                    )}
                    {this.renderStudyViewLink(option.value)}
                    {this.lassoSelection.length > 0 && (
                        <a
                            data-test="patient-similarity-map-clear-lasso"
                            onClick={this.clearLasso}
                            style={{ marginLeft: 8, cursor: 'pointer' }}
                        >
                            Clear selection
                        </a>
                    )}
                    <div style={{ color: '#666', marginTop: 4 }}>
                        {option.data.description.replace(/\.?\s*$/, '.')}{' '}
                        Icons mark this patient's samples. Drag on the map to
                        select a neighbourhood; the study view opens the same
                        map with whichever of the selected samples belong to
                        this study, where they can be filtered and recoloured.
                    </div>
                </div>
                <div style={{ display: 'flex', gap: 20 }}>
                    <div
                        style={{
                            position: 'relative',
                            width: MAP_WIDTH,
                            height: MAP_HEIGHT,
                            flexShrink: 0,
                            border: '1px solid #eee',
                        }}
                    >
                        <canvas
                            key={`${option.value}:${this.coloringAttributeId ||
                                ''}:${this.clinicalColors ? 'c' : 'r'}:${
                                this.lassoSelection.length
                            }`}
                            ref={this.drawPoints}
                            style={{ width: MAP_WIDTH, height: MAP_HEIGHT }}
                        />
                        <canvas
                            ref={this.drawLasso}
                            data-test="patient-similarity-map-lasso"
                            onMouseDown={this.onLassoStart}
                            onMouseMove={this.onLassoMove}
                            onMouseUp={this.onLassoEnd}
                            onMouseLeave={this.onLassoEnd}
                            style={{
                                position: 'absolute',
                                inset: 0,
                                width: MAP_WIDTH,
                                height: MAP_HEIGHT,
                                cursor: 'crosshair',
                            }}
                        />
                        {this.placedSamples.map(({ sampleId, left, top }) => (
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
                                {sampleManager.getComponentForSample(sampleId)}
                            </div>
                        ))}
                    </div>
                    <div>
                        {this.renderColoringSelector()}
                        {this.renderLegend()}
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
