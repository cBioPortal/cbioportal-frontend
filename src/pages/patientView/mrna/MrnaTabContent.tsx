import * as React from 'react';
import _ from 'lodash';
import { observer } from 'mobx-react';
import { action, computed, makeObservable, observable } from 'mobx';
import {
    VictoryAxis,
    VictoryChart,
    VictoryLabel,
    VictoryLine,
    VictoryScatter,
} from 'victory';
import { CBIOPORTAL_VICTORY_THEME } from 'cbioportal-frontend-commons';
import { DataFilterValue } from 'cbioportal-ts-api-client';
import ReactSelect, { components as reactSelectComponents } from 'react-select';
import LoadingIndicator from 'shared/components/loadingIndicator/LoadingIndicator';
import ChartContainer from 'shared/components/ChartContainer/ChartContainer';
import { SampleLabelHTML } from 'shared/components/sampleLabel/SampleLabel';
import SampleInline from 'pages/patientView/patientHeader/SampleInline';
import SampleManager from 'pages/patientView/SampleManager';
import { PatientViewPageStore } from 'pages/patientView/clinicalInformation/PatientViewPageStore';
import { MutatedGenePick } from 'pages/patientView/clinicalInformation/PatientViewPlotsStore';
import ReferenceCohortModal from 'pages/patientView/mrna/ReferenceCohortModal';
import {
    findGroupByValue,
    groupValue,
    MRNA_TAB_GENE_GROUPS,
} from 'pages/patientView/mrna/mrnaTabGeneGroups';

interface IGeneOption {
    label: string;
    value: string;
}

interface IMrnaTabContentProps {
    store: PatientViewPageStore;
    sampleManager: SampleManager | null;
}

interface IBoxDatum {
    x: number;
    min: number;
    q1: number;
    median: number;
    q3: number;
    max: number;
}

interface IPoint {
    x: number;
    y: number;
    sampleId?: string;
    // Carried for the highlighted-sample tooltip so it can show the raw
    // expression value, the gene, and the patient z-score vs cohort.
    rawValue?: number;
    geneSymbol?: string;
    zScore?: number;
    percentile?: number;
}

const RED = '#e8493a';
const BOX_BAND = 0.34; // half-height of the jitter band around a gene row
const MAX_GENE_OPTIONS = 50; // cap rendered options so react-select stays fast

// Linear-interpolation quantile over an already-sorted ascending array.
function quantileSorted(sorted: number[], q: number): number {
    if (sorted.length === 0) {
        return 0;
    }
    const pos = (sorted.length - 1) * q;
    const base = Math.floor(pos);
    const rest = pos - base;
    const next = sorted[base + 1];
    return next !== undefined
        ? sorted[base] + rest * (next - sorted[base])
        : sorted[base];
}

// Median absolute deviation — robust spread measure used by the patient
// z-score score.
function madOf(values: number[], median: number): number {
    if (values.length === 0) return 0;
    const dev = values.map(v => Math.abs(v - median));
    dev.sort((a, b) => a - b);
    return quantileSorted(dev, 0.5);
}

// Fraction of cohort values <= the patient value, using a binary search on
// an already-sorted ascending array.
function percentileOf(value: number, sorted: number[]): number {
    if (sorted.length === 0) return 0;
    let lo = 0;
    let hi = sorted.length;
    while (lo < hi) {
        const mid = (lo + hi) >>> 1;
        if (sorted[mid] <= value) lo = mid + 1;
        else hi = mid;
    }
    return lo / sorted.length;
}

// Modified z-score: 0.6745·(x − median)/MAD. The 0.6745 calibrates MAD so the
// score is on the same scale as the classical z for normally-distributed data
// while staying robust to long tails common in expression data.
function robustZ(value: number, median: number, mad: number): number {
    const denom = mad > 0 ? mad : 1e-9;
    return (0.6745 * (value - median)) / denom;
}

// Custom MenuList for the Genes react-select that pins a small hint at the
// top of the dropdown explaining the search-vs-select affordance.
const GenePickerMenuList: React.FunctionComponent<any> = props => (
    <reactSelectComponents.MenuList {...props}>
        <div
            style={{
                padding: '6px 12px',
                fontSize: 11,
                color: '#888',
                borderBottom: '1px solid #eee',
            }}
        >
            Search for any gene or select below
        </div>
        {props.children}
    </reactSelectComponents.MenuList>
);

// Short, readable rendering of an mRNA expression value for the bubble
// tooltip — uses up to 3 significant digits and falls back to fixed notation
// for typical microarray/log-ratio ranges.
function formatExpressionValue(v: number): string {
    if (!Number.isFinite(v)) return String(v);
    const abs = Math.abs(v);
    if (abs >= 100) return v.toFixed(0);
    if (abs >= 10) return v.toFixed(1);
    return v.toFixed(2);
}

// Compact text for a numeric range from a DataFilterValue ({start,end}).
function formatRange(start?: number, end?: number): string {
    const lo =
        start !== undefined && !isNaN(start as number) ? String(start) : '−∞';
    const hi =
        end !== undefined && !isNaN(end as number) ? String(end) : '+∞';
    return `${lo}–${hi}`;
}

// Deterministic [0,1) hash so jitter is stable across renders.
function hash01(s: string): number {
    let h = 0;
    for (let i = 0; i < s.length; i++) {
        h = (Math.imul(h, 31) + s.charCodeAt(i)) | 0;
    }
    return ((h >>> 0) % 10000) / 10000;
}

// Victory data component: render the numbered sample bubble at the point.
// Reuses the same SampleInline + SampleLabelHTML the patient header uses, so
// the bubble color, size, and hover tooltip (sample id + clinical data table)
// are identical to the bubbles in the header strip.
const BUBBLE_SIZE = 12;
const HighlightSampleMarker: React.FunctionComponent<any> = props => {
    const { x, y, datum, sampleManager } = props;
    if (x == null || y == null || !datum) {
        return null;
    }
    const sampleId: string = datum.sampleId;
    const label = (sampleManager && sampleManager.sampleLabels[sampleId]) || '';
    const color =
        (sampleManager && sampleManager.sampleColors[sampleId]) || RED;
    const sample =
        sampleManager &&
        sampleManager.samples.find((s: any) => s.id === sampleId);
    const bubble = (
        <SampleLabelHTML label={label} color={color} fillOpacity={1} />
    );
    // Build a body block for the tooltip: gene + value, plus a robust z and
    // cohort percentile when we have them. Falls back to undefined otherwise
    // so SampleInline behaves identically to its other call sites.
    const lines: React.ReactNode[] = [];
    if (datum.geneSymbol && datum.rawValue !== undefined) {
        lines.push(
            <div key="value">
                {datum.geneSymbol} expression:{' '}
                {formatExpressionValue(datum.rawValue)}
            </div>
        );
    }
    if (datum.zScore !== undefined && datum.percentile !== undefined) {
        const sign = datum.zScore >= 0 ? '+' : '−';
        const pct = Math.round(datum.percentile * 100);
        lines.push(
            <div key="z">
                z = {sign}
                {Math.abs(datum.zScore).toFixed(2)} ({pct}th percentile in
                cohort)
            </div>
        );
    }
    const extraBody = lines.length > 0 ? <>{lines}</> : undefined;
    return (
        <foreignObject
            x={x - BUBBLE_SIZE / 2}
            y={y - BUBBLE_SIZE / 2}
            width={BUBBLE_SIZE}
            height={BUBBLE_SIZE}
            style={{ overflow: 'visible' }}
        >
            {sample ? (
                <SampleInline
                    sample={sample}
                    extraTooltipBody={extraBody}
                >
                    {bubble}
                </SampleInline>
            ) : (
                bubble
            )}
        </foreignObject>
    );
};

@observer
export default class MrnaTabContent extends React.Component<
    IMrnaTabContentProps,
    {}
> {
    private svgContainer: SVGElement | null = null;
    private getSvg = () => this.svgContainer;

    constructor(props: IMrnaTabContentProps) {
        super(props);
        makeObservable(this);
    }

    private get plotsStore() {
        return this.props.store.plotsStore;
    }

    // Effective gene rows for the chart, in resolved selection order, deduped,
    // and restricted to genes that actually have expression data. When the
    // sort-by-z-score toggle is on, rows are reordered by max(|z|) across
    // the patient's samples desc.
    @computed get genes(): { symbol: string; entrezGeneId: number }[] {
        const present = new Set(
            this.plotsStore.mrnaExpressionDataForGenes.result.map(
                d => d.entrezGeneId
            )
        );
        const base = this.plotsStore.effectiveGeneSymbols
            .map(symbol => {
                const gene = this.plotsStore.mrnaTabGenes.result.find(
                    g => g.hugoGeneSymbol.toUpperCase() === symbol.toUpperCase()
                );
                return gene && present.has(gene.entrezGeneId)
                    ? { symbol, entrezGeneId: gene.entrezGeneId }
                    : null;
            })
            .filter((g): g is { symbol: string; entrezGeneId: number } => !!g);
        if (!this.sortByZScore) return base;
        const outlier = this.geneMaxAbsZ;
        return [...base].sort(
            (a, b) =>
                (outlier[b.entrezGeneId] || 0) -
                (outlier[a.entrezGeneId] || 0)
        );
    }

    @observable geneQuery: string = '';

    @action.bound
    setGeneQuery(q: string) {
        this.geneQuery = q;
    }

    @observable isCohortModalOpen: boolean = false;

    @action.bound
    openCohortModal() {
        this.isCohortModalOpen = true;
    }

    @action.bound
    closeCohortModal() {
        this.isCohortModalOpen = false;
    }

    @computed get geneOptions(): IGeneOption[] {
        return this.plotsStore.mrnaTabAllGenes.result.map(g => ({
            label: g.hugoGeneSymbol,
            value: g.hugoGeneSymbol,
        }));
    }

    // Patient-mutated genes annotated with their mutation frequency in the
    // current reference cohort. Ordered by cohort frequency desc; genes the
    // cohort never mutates fall to the bottom with "—".
    @computed get patientMutatedWithCohortFreqOptions(): IGeneOption[] {
        const byEntrez = this.plotsStore.cohortMutatedGenesByEntrez;
        const annotated = this.plotsStore.patientMutatedGenes.map(g => {
            const c = byEntrez[g.entrezGeneId];
            const profiled = c ? c.numberOfProfiledCases : 0;
            const altered = c ? c.numberOfAlteredCases : 0;
            const pct = profiled > 0 ? (altered / profiled) * 100 : -1;
            return { gene: g, pct };
        });
        return _.orderBy(
            annotated,
            ['pct', 'gene.hugoGeneSymbol'],
            ['desc', 'asc']
        ).map(({ gene, pct }) => ({
            value: gene.hugoGeneSymbol,
            label:
                pct >= 0
                    ? `${gene.hugoGeneSymbol} (${pct.toFixed(
                          1
                      )}% mutated in cohort)`
                    : `${gene.hugoGeneSymbol} (— in cohort)`,
        }));
    }

    // Group "preset" options (one row per non-empty predefined group),
    // filtered by the current query against the group label. Always pinned
    // at the top of the picker.
    @computed get groupOptions(): IGeneOption[] {
        const q = this.geneQuery.trim().toLowerCase();
        return MRNA_TAB_GENE_GROUPS.filter(
            g => g.genes.length > 0 && (!q || g.label.toLowerCase().includes(q))
        ).map(g => ({
            value: groupValue(g),
            label: `${g.label} (${g.genes.length} genes)`,
        }));
    }

    @computed private get patientMutatedSectionLabel(): string {
        return this.props.store.pageMode === 'sample'
            ? 'Mutated in this sample'
            : 'Mutated in this patient';
    }

    // Picker sections: "Gene groups" (preset group items), then the
    // patient-mutated section annotated with cohort frequency (empty query),
    // or substring search results (typed query).
    @computed get filteredGeneOptions(): Array<{
        label: string;
        options: IGeneOption[];
    }> {
        const q = this.geneQuery.trim().toLowerCase();
        const out: Array<{ label: string; options: IGeneOption[] }> = [];
        const groupOpts = this.groupOptions;
        if (groupOpts.length > 0) {
            out.push({ label: 'Gene groups', options: groupOpts });
        }
        if (q) {
            const matches: IGeneOption[] = [];
            for (const o of this.geneOptions) {
                if (o.label.toLowerCase().includes(q)) {
                    matches.push(o);
                    if (matches.length >= MAX_GENE_OPTIONS) {
                        break;
                    }
                }
            }
            if (matches.length > 0) {
                out.push({ label: 'Search results', options: matches });
            }
            return out;
        }
        const patientGenes = this.patientMutatedWithCohortFreqOptions;
        if (patientGenes.length > 0) {
            out.push({
                label: this.patientMutatedSectionLabel,
                options: patientGenes,
            });
        }
        return out;
    }

    @computed get selectedGeneOptions(): IGeneOption[] {
        return this.plotsStore.mrnaTabSelections.map(item => {
            const group = findGroupByValue(item);
            return {
                value: item,
                label: group ? group.label : item,
            };
        });
    }

    // Samples to highlight: in patient mode, all of the patient's samples;
    // in sample mode, only the focused sample.
    @computed get highlightedSampleIds(): Set<string> {
        const { store } = this.props;
        return store.pageMode === 'sample'
            ? new Set([store.sampleId])
            : new Set(store.sampleIds);
    }

    @computed get allValues(): number[] {
        return this.plotsStore.mrnaExpressionDataForGenes.result
            .map(d => d.value)
            .filter(v => !isNaN(v));
    }

    // User-controlled log-scale toggle; defaults to log. When data has
    // negatives (e.g. z-scores), the toggle is force-disabled and the chart
    // falls back to linear regardless of the user's preference.
    @observable userLogScale: boolean = true;

    @action.bound
    setLogScale(v: boolean) {
        this.userLogScale = v;
    }

    // When true, gene rows become columns (categories on the x-axis) and
    // expression values run on the y-axis.
    @observable axesSwapped: boolean = false;

    @action.bound
    setAxesSwapped(v: boolean) {
        this.axesSwapped = v;
    }

    // When true, the chart's gene rows are reordered by patient
    // z-score (max |robust z-score| across the patient's samples).
    @observable sortByZScore: boolean = false;

    @action.bound
    setSortByZScore(v: boolean) {
        this.sortByZScore = v;
    }

    // Per-gene cohort stats (median + MAD) computed on log-transformed values
    // when the log toggle is on, so the z-score lives on the same axis the
    // user is looking at. Keyed by entrezGeneId.
    @computed get geneCohortStats(): {
        [entrezGeneId: number]: {
            median: number;
            mad: number;
            sortedTransformed: number[];
        };
    } {
        const result: {
            [entrezGeneId: number]: {
                median: number;
                mad: number;
                sortedTransformed: number[];
            };
        } = {};
        const transform = (v: number) =>
            this.useLog ? Math.log10(Math.max(v, this.logFloor)) : v;
        const byEntrez = _.groupBy(
            this.plotsStore.mrnaExpressionDataForGenes.result,
            d => d.entrezGeneId
        );
        Object.keys(byEntrez).forEach(k => {
            const entrezId = Number(k);
            const transformed = byEntrez[entrezId]
                .map(d => transform(d.value))
                .filter(Number.isFinite)
                .sort((a, b) => a - b);
            if (transformed.length === 0) {
                result[entrezId] = {
                    median: 0,
                    mad: 0,
                    sortedTransformed: [],
                };
                return;
            }
            const median = quantileSorted(transformed, 0.5);
            const mad = madOf(transformed, median);
            result[entrezId] = {
                median,
                mad,
                sortedTransformed: transformed,
            };
        });
        return result;
    }

    // For each (entrezGeneId, patient sampleId), the patient's expression
    // value, its robust z, and its cohort percentile (fraction ≤). Empty if
    // the sample wasn't profiled for that gene.
    @computed get patientSampleScores(): {
        [entrezGeneId: number]: {
            [sampleId: string]: {
                value: number;
                z: number;
                percentile: number;
            };
        };
    } {
        const out: {
            [entrezGeneId: number]: {
                [sampleId: string]: {
                    value: number;
                    z: number;
                    percentile: number;
                };
            };
        } = {};
        const transform = (v: number) =>
            this.useLog ? Math.log10(Math.max(v, this.logFloor)) : v;
        this.plotsStore.mrnaExpressionDataForGenes.result.forEach(d => {
            if (!this.highlightedSampleIds.has(d.sampleId)) return;
            if (!Number.isFinite(d.value)) return;
            const stats = this.geneCohortStats[d.entrezGeneId];
            if (!stats || stats.sortedTransformed.length < 5) return;
            const tv = transform(d.value);
            const z = robustZ(tv, stats.median, stats.mad);
            const percentile = percentileOf(tv, stats.sortedTransformed);
            (out[d.entrezGeneId] = out[d.entrezGeneId] || {})[d.sampleId] = {
                value: d.value,
                z,
                percentile,
            };
        });
        return out;
    }

    // Max(|z|) across the patient's samples for each gene, used to sort rows
    // when sortByZScore is on.
    @computed get geneMaxAbsZ(): { [entrezGeneId: number]: number } {
        const out: { [entrezGeneId: number]: number } = {};
        Object.keys(this.patientSampleScores).forEach(k => {
            const entrezId = Number(k);
            const samples = this.patientSampleScores[entrezId];
            let max = 0;
            Object.values(samples).forEach(s => {
                if (Math.abs(s.z) > max) max = Math.abs(s.z);
            });
            out[entrezId] = max;
        });
        return out;
    }

    @computed get canRenderLog(): boolean {
        const vals = this.allValues;
        const positives = vals.filter(v => v > 0);
        return (
            vals.length > 0 &&
            vals.every(v => v >= 0) &&
            positives.length >= 2
        );
    }

    @computed get useLog(): boolean {
        return this.userLogScale && this.canRenderLog;
    }

    // Smallest positive value; the lower bound for the log scale so zeros and
    // tiny values have somewhere to render.
    @computed get logFloor(): number {
        return _.min(this.allValues.filter(v => v > 0)) ?? 1;
    }

    // Clamp a value into the plottable range (log can't render <= 0).
    private clamp(v: number): number {
        return this.useLog ? Math.max(v, this.logFloor) : v;
    }

    @computed get boxData(): IBoxDatum[] {
        const byEntrez = _.groupBy(
            this.plotsStore.mrnaExpressionDataForGenes.result,
            d => d.entrezGeneId
        );
        return this.genes.map((gene, rowIndex) => {
            const sorted = _.sortBy(
                (byEntrez[gene.entrezGeneId] || [])
                    .map(d => d.value)
                    .filter(v => !isNaN(v))
            );
            const q1 = quantileSorted(sorted, 0.25);
            const median = quantileSorted(sorted, 0.5);
            const q3 = quantileSorted(sorted, 0.75);
            // Tukey whiskers: extend to the most extreme value within 1.5*IQR;
            // anything beyond stays as an outlier scatter point.
            const iqr = q3 - q1;
            const lowFence = q1 - 1.5 * iqr;
            const highFence = q3 + 1.5 * iqr;
            const whiskerLow = sorted.find(v => v >= lowFence) ?? sorted[0];
            let whiskerHigh = sorted[0];
            for (const v of sorted) {
                if (v <= highFence) {
                    whiskerHigh = v;
                }
            }
            return {
                x: rowIndex + 1,
                min: this.clamp(whiskerLow),
                q1: this.clamp(q1),
                median: this.clamp(median),
                q3: this.clamp(q3),
                max: this.clamp(whiskerHigh),
            };
        });
    }

    @computed get cohortPoints(): IPoint[] {
        return this.pointsFor(false);
    }

    @computed get patientPoints(): IPoint[] {
        return this.pointsFor(true);
    }

    private pointsFor(highlighted: boolean): IPoint[] {
        const byEntrez = _.groupBy(
            this.plotsStore.mrnaExpressionDataForGenes.result,
            d => d.entrezGeneId
        );
        const points: IPoint[] = [];
        const swap = this.axesSwapped;
        this.genes.forEach((gene, rowIndex) => {
            (byEntrez[gene.entrezGeneId] || []).forEach(d => {
                const isHighlighted = this.highlightedSampleIds.has(d.sampleId);
                if (isHighlighted !== highlighted) {
                    return;
                }
                const offset = highlighted
                    ? 0
                    : (hash01(d.sampleId + ':' + d.entrezGeneId) - 0.5) *
                      2 *
                      BOX_BAND;
                const valueCoord = this.clamp(d.value);
                const categoryCoord = rowIndex + 1 + offset;
                const sampleScore =
                    highlighted &&
                    this.patientSampleScores[gene.entrezGeneId] &&
                    this.patientSampleScores[gene.entrezGeneId][d.sampleId];
                // In the default orientation, value is on x and the gene
                // category on y; swapped flips them.
                points.push({
                    sampleId: d.sampleId,
                    x: swap ? categoryCoord : valueCoord,
                    y: swap ? valueCoord : categoryCoord,
                    rawValue: d.value,
                    geneSymbol: gene.symbol,
                    zScore: sampleScore ? sampleScore.z : undefined,
                    percentile: sampleScore
                        ? sampleScore.percentile
                        : undefined,
                });
            });
        });
        return points;
    }

    // Box drawn manually as line segments in (x=value, y=geneRow) space so it
    // stays consistent with the scatter; VictoryBoxPlot's horizontal mode
    // mis-scales its category against the log value axis.
    @computed get boxLines(): JSX.Element[] {
        const h = 0.28;
        const stroke = '#333333';
        const els: JSX.Element[] = [];
        const swap = this.axesSwapped;
        // Each box has a (value, category) coordinate. In the default layout
        // value goes on x and category on y; swap transposes the segment.
        const xy = (valueCoord: number, categoryCoord: number) =>
            swap
                ? { x: categoryCoord, y: valueCoord }
                : { x: valueCoord, y: categoryCoord };
        this.boxData.forEach(box => {
            const row = box.x;
            const seg = (key: string, a: IPoint, b: IPoint, width: number) =>
                els.push(
                    <VictoryLine
                        key={key}
                        data={[a, b]}
                        style={{ data: { stroke, strokeWidth: width } }}
                    />
                );
            // whisker min -> max along the value axis
            seg(`w${row}`, xy(box.min, row), xy(box.max, row), 1);
            // IQR box outline (two horizontal sides + two vertical sides)
            seg(`t${row}`, xy(box.q1, row + h), xy(box.q3, row + h), 1);
            seg(`bt${row}`, xy(box.q1, row - h), xy(box.q3, row - h), 1);
            seg(`l${row}`, xy(box.q1, row - h), xy(box.q1, row + h), 1);
            seg(`r${row}`, xy(box.q3, row - h), xy(box.q3, row + h), 1);
            // median tick
            seg(
                `m${row}`,
                xy(box.median, row - h),
                xy(box.median, row + h),
                1.8
            );
        });
        return els;
    }

    @computed get valueDomain(): [number, number] {
        const vals = this.allValues;
        const min = _.min(vals) ?? 0;
        const max = _.max(vals) ?? 1;
        if (this.useLog) {
            // pad in log space so the data fills the axis; floor at smallest
            // positive value so clamped zeros sit just inside the left edge
            const logMin = Math.log10(this.logFloor);
            const logMax = Math.log10(max);
            const pad = Math.max((logMax - logMin) * 0.05, 0.02);
            return [Math.pow(10, logMin - pad), Math.pow(10, logMax + pad)];
        }
        const pad = (max - min) * 0.05 || 1;
        return [min - pad, max + pad];
    }

    // 1-2-5 ticks per decade across the value domain (clean even when the
    // range spans less than a full decade).
    @computed get valueTicks(): number[] | undefined {
        if (!this.useLog) {
            return undefined;
        }
        const [lo, hi] = this.valueDomain;
        const ticks: number[] = [];
        const startExp = Math.floor(Math.log10(lo));
        const endExp = Math.ceil(Math.log10(hi));
        for (let e = startExp; e <= endExp; e++) {
            [1, 2, 5].forEach(m => {
                const v = m * Math.pow(10, e);
                if (v >= lo && v <= hi) {
                    ticks.push(v);
                }
            });
        }
        return ticks.length ? ticks : undefined;
    }

    @computed get studyName(): string {
        const { store } = this.props;
        const study = store.studies.result && store.studies.result[0];
        return study ? study.name : store.studyId;
    }

    // Human-readable name of the active reference cohort, used in the title
    // and export filename. When the user has filters selected, we list the
    // chosen values/ranges/genes; otherwise we show the study name.
    @computed get cohortName(): string {
        const filters = this.plotsStore.selectedClinicalFilters;
        const labels: string[] = [];
        Object.keys(filters).forEach(k => {
            filters[k].forEach(v => {
                if (v.value !== undefined && v.value !== '') {
                    labels.push(v.value);
                } else {
                    labels.push(`${formatRange(v.start, v.end)}`);
                }
            });
        });
        this.plotsStore.selectedMutatedGenes.forEach(g =>
            labels.push(`mutated ${g.hugoGeneSymbol}`)
        );
        this.plotsStore.selectedCNAGenes.forEach(g =>
            labels.push(`CNA ${g.hugoGeneSymbol}`)
        );
        this.plotsStore.selectedSVGenes.forEach(g =>
            labels.push(`SV ${g.hugoGeneSymbol}`)
        );
        if (labels.length === 0) {
            return this.studyName;
        }
        return _.uniq(labels).join(' or ');
    }

    @computed get chartTitle(): string {
        const profile = this.plotsStore.mrnaExpressionMolecularProfile.result;
        const label = profile ? profile.name : 'mRNA expression';
        return `${label} - ${this.cohortName}`;
    }

    render() {
        const { store } = this.props;
        return (
            <div
                className="mrnaTabContent"
                style={{
                    padding: 20,
                    // No outer maxWidth when axes are swapped — the chart
                    // grows horizontally with the number of genes.
                    maxWidth: this.axesSwapped ? undefined : 760,
                }}
            >
                <h3 style={{ marginTop: 0, marginBottom: 16 }}>
                    {this.chartTitle}
                </h3>
                <div style={{ maxWidth: 460, marginBottom: 16 }}>
                    <label
                        style={{
                            fontSize: 12,
                            fontWeight: 'bold',
                            display: 'block',
                            marginBottom: 4,
                        }}
                    >
                        Genes
                    </label>
                    <ReactSelect
                        isMulti
                        isLoading={
                            this.plotsStore.mrnaTabAllGenes.isPending ||
                            this.plotsStore.cohortMutatedGenes.isPending
                        }
                        components={{ MenuList: GenePickerMenuList }}
                        options={this.filteredGeneOptions}
                        value={this.selectedGeneOptions}
                        placeholder="Add genes…"
                        closeMenuOnSelect={false}
                        filterOption={() => true}
                        menuPortalTarget={
                            typeof document !== 'undefined'
                                ? document.body
                                : undefined
                        }
                        styles={{
                            menuPortal: (base: any) => ({
                                ...base,
                                zIndex: 9999,
                            }),
                        }}
                        onInputChange={(input: string) =>
                            this.setGeneQuery(input)
                        }
                        noOptionsMessage={() =>
                            this.geneQuery
                                ? 'No matching genes'
                                : 'No mutation data available'
                        }
                        onChange={(selected: any) =>
                            this.plotsStore.setMrnaTabSelections(
                                (selected || []).map(
                                    (o: IGeneOption) => o.value
                                )
                            )
                        }
                    />
                </div>
                {this.renderCohortSummaryBar()}
                {this.renderChart()}
                <ReferenceCohortModal
                    plotsStore={this.plotsStore}
                    studyId={store.studyId}
                    isOpen={this.isCohortModalOpen}
                    onClose={this.closeCohortModal}
                />
            </div>
        );
    }

    // Simplified reference-cohort summary bar: the live sample count plus a
    // three-radio selector ("All samples" / "Same cancer type" / "Same
    // cancer type detailed"). Cancer-type options only render when the
    // current patient or sample actually carries that value. The
    // modal-trigger button and chips are hidden for now.
    private renderCohortSummaryBar() {
        const cohort = this.plotsStore.effectiveCohortSamples;
        const sampleCount = cohort.isComplete
            ? cohort.result!.length.toLocaleString('en-US')
            : '…';
        const mode = this.plotsStore.referenceCohortMode;
        const cancerTypes = this.plotsStore.currentSampleCancerTypes;
        const cancerTypesDetailed = this.plotsStore
            .currentSampleCancerTypesDetailed;
        const radioStyle: React.CSSProperties = {
            display: 'inline-flex',
            alignItems: 'center',
            fontSize: 13,
            fontWeight: 'normal',
            cursor: 'pointer',
            margin: 0,
            whiteSpace: 'nowrap',
        };
        return (
            <div
                style={{
                    display: 'flex',
                    flexWrap: 'nowrap',
                    alignItems: 'center',
                    gap: 14,
                    marginBottom: 16,
                    whiteSpace: 'nowrap',
                }}
            >
                <strong style={{ fontSize: 13 }}>Reference cohort</strong>
                <span style={{ fontSize: 13, color: '#666' }}>
                    &bull; {sampleCount} sample{sampleCount === '1' ? '' : 's'}
                </span>
                <label style={radioStyle}>
                    <input
                        type="radio"
                        name="reference-cohort-mode"
                        checked={mode === 'all'}
                        onChange={() =>
                            this.plotsStore.setReferenceCohortMode('all')
                        }
                        style={{ marginRight: 5 }}
                    />
                    All samples
                </label>
                {cancerTypes.length > 0 && (
                    <label style={radioStyle}>
                        <input
                            type="radio"
                            name="reference-cohort-mode"
                            checked={mode === 'cancer-type'}
                            onChange={() =>
                                this.plotsStore.setReferenceCohortMode(
                                    'cancer-type'
                                )
                            }
                            style={{ marginRight: 5 }}
                        />
                        Same cancer type
                        <span
                            style={{
                                marginLeft: 4,
                                color: '#666',
                            }}
                        >
                            ({cancerTypes.join(' or ')})
                        </span>
                    </label>
                )}
                {cancerTypesDetailed.length > 0 && (
                    <label style={radioStyle}>
                        <input
                            type="radio"
                            name="reference-cohort-mode"
                            checked={mode === 'cancer-type-detailed'}
                            onChange={() =>
                                this.plotsStore.setReferenceCohortMode(
                                    'cancer-type-detailed'
                                )
                            }
                            style={{ marginRight: 5 }}
                        />
                        Same cancer type detailed
                        <span
                            style={{
                                marginLeft: 4,
                                color: '#666',
                            }}
                        >
                            ({cancerTypesDetailed.join(' or ')})
                        </span>
                    </label>
                )}
            </div>
        );
    }

    private renderChart() {
        const { store } = this.props;

        if (
            this.plotsStore.mrnaExpressionDataForGenes.isPending ||
            this.plotsStore.mrnaTabGenes.isPending
        ) {
            return <LoadingIndicator isLoading={true} size="big" center />;
        }

        const profile = this.plotsStore.mrnaExpressionMolecularProfile.result;
        if (!profile || this.genes.length === 0) {
            return (
                <div style={{ padding: '10px 0' }}>
                    No mRNA expression data is available for the selected genes.
                </div>
            );
        }

        const n = this.genes.length;
        const swap = this.axesSwapped;
        // Each gene needs roughly the same per-row/column space regardless of
        // orientation; pick a fixed cross-axis size for the value axis.
        const VALUE_AXIS_SIZE = 520;
        const PER_GENE = swap ? 90 : 80;
        const chartWidth = swap ? 170 + n * PER_GENE : 720;
        const chartHeight = swap ? VALUE_AXIS_SIZE : 140 + n * PER_GENE;
        // Swapped layout needs more left padding (so the rotated value-axis
        // label clears the tick numbers) and more bottom padding (so the
        // angled two-line gene tick labels fit beneath the axis).
        const padding = swap
            ? { top: 30, bottom: 170, left: 90, right: 25 }
            : { top: 20, bottom: 80, left: 140, right: 25 };
        const valueLabel = profile.name;
        const valueScale = this.useLog ? 'log' : 'linear';
        const categoryDomain: [number, number] = [0, n + 0.5];
        const categoryTickValues = this.genes.map((g, i) => i + 1);
        // Always-on two-line tick label: gene symbol on top, per-sample z
        // on a second muted line below. Single sample: "TP53\n+3.2 σ".
        // Multi-sample (uses the bubble numbers): "FOLR1\n1:+2.7, 2:−0.7 σ".
        const sampleManager = this.props.sampleManager;
        const categoryTickFormat = this.genes.map(g => {
            const perSample = this.patientSampleScores[g.entrezGeneId] || {};
            const entries = Object.keys(perSample);
            if (entries.length === 0) return g.symbol;
            const formatted = entries
                .map(sid => {
                    const z = perSample[sid].z;
                    const sign = z >= 0 ? '+' : '−';
                    const num = `${sign}${Math.abs(z).toFixed(1)}`;
                    const label =
                        (sampleManager &&
                            sampleManager.sampleLabels[sid]) ||
                        '';
                    return entries.length > 1 && label
                        ? `${label}:${num}`
                        : num;
                })
                .join(', ');
            return `${g.symbol}\n${formatted} σ`;
        });
        // Custom VictoryLabel that styles the two lines independently — the
        // gene name in the default color, the z line in a smaller muted grey
        // so the name visually dominates.
        const categoryTickLabel = (
            <VictoryLabel
                style={
                    [
                        { fontSize: 16, fill: '#333' },
                        { fontSize: 13, fill: '#888' },
                    ] as any
                }
                lineHeight={[1, 1.2] as any}
            />
        );
        const valueTickFormat = (t: number) =>
            t >= 1 ? Number(t).toLocaleString('en-US') : `${t}`;
        // The value-axis label rotates with the axis. When it's on the left
        // (swapped layout), it needs more outward padding so it sits clear of
        // the tick numbers.
        const valueAxisProps = {
            label: valueLabel,
            tickValues: this.valueTicks,
            tickFormat: valueTickFormat,
            style: { axisLabel: { padding: swap ? 55 : 38 } },
        };
        // When the gene axis is on the bottom (swapped), rotate the gene
        // labels -45° so they don't run into each other across narrow columns.
        const categoryAxisProps: any = swap
            ? {
                  tickValues: categoryTickValues,
                  tickFormat: categoryTickFormat,
                  tickLabelComponent: categoryTickLabel,
                  style: {
                      tickLabels: {
                          angle: -45,
                          textAnchor: 'end',
                          padding: 4,
                      },
                  },
              }
            : {
                  tickValues: categoryTickValues,
                  tickFormat: categoryTickFormat,
                  tickLabelComponent: categoryTickLabel,
              };

        return (
            <ChartContainer
                getSVGElement={this.getSvg}
                exportFileName={`mrna_expression_${this.cohortName}`}
            >
                <div
                    style={{
                        position: 'absolute',
                        top: 12,
                        right: 50,
                        zIndex: 10,
                        display: 'flex',
                        gap: 12,
                        alignItems: 'center',
                        background: 'white',
                        padding: '0 4px',
                    }}
                >
                    <label
                        style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            fontSize: 12,
                            fontWeight: 'normal',
                            margin: 0,
                            cursor: this.canRenderLog
                                ? 'pointer'
                                : 'not-allowed',
                            color: this.canRenderLog ? '#333' : '#999',
                        }}
                        title={
                            this.canRenderLog
                                ? 'Toggle between log and linear value axis'
                                : 'Linear only — data contains non-positive values'
                        }
                    >
                        <input
                            type="checkbox"
                            checked={this.useLog}
                            disabled={!this.canRenderLog}
                            onChange={e =>
                                this.setLogScale(e.target.checked)
                            }
                            style={{ marginRight: 6 }}
                        />
                        Log scale
                    </label>
                    <label
                        style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            fontSize: 12,
                            fontWeight: 'normal',
                            margin: 0,
                            cursor: 'pointer',
                            color: '#333',
                        }}
                        title="Rotate the chart so genes run along the x-axis"
                    >
                        <input
                            type="checkbox"
                            checked={this.axesSwapped}
                            onChange={e =>
                                this.setAxesSwapped(e.target.checked)
                            }
                            style={{ marginRight: 6 }}
                        />
                        Swap axes
                    </label>
                    <label
                        style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            fontSize: 12,
                            fontWeight: 'normal',
                            margin: 0,
                            cursor: 'pointer',
                            color: '#333',
                        }}
                        title="Reorder gene rows by how far the patient is from the cohort (max |robust z-score|)"
                    >
                        <input
                            type="checkbox"
                            checked={this.sortByZScore}
                            onChange={e =>
                                this.setSortByZScore(e.target.checked)
                            }
                            style={{ marginRight: 6 }}
                        />
                        Sort by z-score
                    </label>
                </div>
                <VictoryChart
                    theme={CBIOPORTAL_VICTORY_THEME}
                    height={chartHeight}
                    width={chartWidth}
                    domain={
                        swap
                            ? { x: categoryDomain, y: this.valueDomain }
                            : { x: this.valueDomain, y: categoryDomain }
                    }
                    domainPadding={
                        swap ? { x: [0, 18] } : { y: [0, 18] }
                    }
                    padding={padding}
                    scale={{
                        x: swap ? 'linear' : valueScale,
                        y: swap ? valueScale : 'linear',
                    }}
                    containerComponent={
                        <svg
                            ref={(el: SVGSVGElement | null) => {
                                this.svgContainer = el;
                            }}
                        />
                    }
                >
                    {/* independent (bottom) axis */}
                    {swap ? (
                        <VictoryAxis {...categoryAxisProps} />
                    ) : (
                        <VictoryAxis {...valueAxisProps} />
                    )}
                    {/* dependent (left) axis */}
                    {swap ? (
                        <VictoryAxis dependentAxis {...valueAxisProps} />
                    ) : (
                        <VictoryAxis dependentAxis {...categoryAxisProps} />
                    )}
                    {/* cohort */}
                    <VictoryScatter
                        data={this.cohortPoints}
                        size={2}
                        style={{
                            data: { fill: '#9e9e9e', fillOpacity: 0.25 },
                        }}
                    />
                    {/* distribution (boxes drawn as line segments) */}
                    {this.boxLines}
                    {/* highlighted samples (numbered sample icons) */}
                    <VictoryScatter
                        data={this.patientPoints}
                        dataComponent={
                            <HighlightSampleMarker
                                sampleManager={this.props.sampleManager}
                            />
                        }
                    />
                </VictoryChart>
            </ChartContainer>
        );
    }
}
