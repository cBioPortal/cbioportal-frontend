import * as React from 'react';
import _ from 'lodash';
import { observer } from 'mobx-react';
import { action, computed, makeObservable, observable } from 'mobx';
import {
    VictoryAxis,
    VictoryChart,
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
    return (
        <foreignObject
            x={x - BUBBLE_SIZE / 2}
            y={y - BUBBLE_SIZE / 2}
            width={BUBBLE_SIZE}
            height={BUBBLE_SIZE}
            style={{ overflow: 'visible' }}
        >
            {sample ? (
                <SampleInline sample={sample}>{bubble}</SampleInline>
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
    // and restricted to genes that actually have expression data.
    @computed get genes(): { symbol: string; entrezGeneId: number }[] {
        const present = new Set(
            this.plotsStore.mrnaExpressionDataForGenes.result.map(
                d => d.entrezGeneId
            )
        );
        return this.plotsStore.effectiveGeneSymbols
            .map(symbol => {
                const gene = this.plotsStore.mrnaTabGenes.result.find(
                    g => g.hugoGeneSymbol.toUpperCase() === symbol.toUpperCase()
                );
                return gene && present.has(gene.entrezGeneId)
                    ? { symbol, entrezGeneId: gene.entrezGeneId }
                    : null;
            })
            .filter((g): g is { symbol: string; entrezGeneId: number } => !!g);
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

    // Default suggestions (when the picker has no query): the top 50 most-
    // mutated genes in the current effective cohort, labelled with their
    // mutation frequency so the user can pick interesting candidates without
    // typing.
    @computed get topAlteredGeneOptions(): IGeneOption[] {
        return this.plotsStore.topAlteredGenes.result.map(g => {
            const profiled = g.numberOfProfiledCases;
            const pct =
                profiled > 0
                    ? (g.numberOfAlteredCases / profiled) * 100
                    : 0;
            return {
                value: g.hugoGeneSymbol,
                label: `${g.hugoGeneSymbol} (${pct.toFixed(1)}% mutated)`,
            };
        });
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

    // Picker sections: "Gene groups" (preset group items) on top, then a
    // section of individual genes — top altered when the query is empty, or
    // substring matches across all genes when the user is typing.
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
        let genes: IGeneOption[];
        if (!q) {
            genes = this.topAlteredGeneOptions;
        } else {
            genes = [];
            for (const o of this.geneOptions) {
                if (o.label.toLowerCase().includes(q)) {
                    genes.push(o);
                    if (genes.length >= MAX_GENE_OPTIONS) {
                        break;
                    }
                }
            }
        }
        if (genes.length > 0) {
            out.push({
                label: q ? 'Search results' : 'Top mutated in cohort',
                options: genes,
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
                // value on x, gene row on y (manual horizontal layout)
                points.push({
                    sampleId: d.sampleId,
                    x: this.clamp(d.value),
                    y: rowIndex + 1 + offset,
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
            // whisker min -> max
            seg(`w${row}`, { x: box.min, y: row }, { x: box.max, y: row }, 1);
            // IQR box outline
            seg(
                `t${row}`,
                { x: box.q1, y: row + h },
                { x: box.q3, y: row + h },
                1
            );
            seg(
                `bt${row}`,
                { x: box.q1, y: row - h },
                { x: box.q3, y: row - h },
                1
            );
            seg(
                `l${row}`,
                { x: box.q1, y: row - h },
                { x: box.q1, y: row + h },
                1
            );
            seg(
                `r${row}`,
                { x: box.q3, y: row - h },
                { x: box.q3, y: row + h },
                1
            );
            // median
            seg(
                `m${row}`,
                { x: box.median, y: row - h },
                { x: box.median, y: row + h },
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
                style={{ padding: 20, maxWidth: 760 }}
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
                            this.plotsStore.topAlteredGenes.isPending
                        }
                        components={{ MenuList: GenePickerMenuList }}
                        options={this.filteredGeneOptions}
                        value={this.selectedGeneOptions}
                        placeholder="Add genes…"
                        closeMenuOnSelect={false}
                        filterOption={() => true}
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

    // Compact, always-visible summary of the reference cohort: live sample
    // count, a chip per active attribute:value pair (× removes a single chip),
    // an "Add filter" button that opens the chooser modal, and "Clear all"
    // when filters are active.
    private renderCohortSummaryBar() {
        const filters = this.plotsStore.selectedClinicalFilters;
        const attrs =
            this.plotsStore.filterableClinicalAttributes.result || [];
        const attrById = _.keyBy(attrs, a => a.clinicalAttributeId);
        const cohort = this.plotsStore.effectiveCohortSamples;
        const hasFilters = this.plotsStore.hasAnyFilter;
        const sampleCount = cohort.isComplete
            ? cohort.result!.length.toLocaleString('en-US')
            : '…';
        const clinicalChips: {
            attrId: string;
            value: DataFilterValue;
            label: string;
        }[] = [];
        Object.keys(filters).forEach(attrId => {
            const attr = attrById[attrId];
            filters[attrId].forEach(v => {
                const valueLabel =
                    v.value !== undefined && v.value !== ''
                        ? v.value
                        : formatRange(v.start, v.end);
                const prefix = attr ? attr.displayName : attrId;
                clinicalChips.push({
                    attrId,
                    value: v,
                    label: `${prefix}: ${valueLabel}`,
                });
            });
        });
        const alterationChips: Array<{
            key: string;
            label: string;
            color: string;
            background: string;
            border: string;
            gene: MutatedGenePick;
            remove: () => void;
        }> = [];
        this.plotsStore.selectedMutatedGenes.forEach(g =>
            alterationChips.push({
                key: `mut:${g.entrezGeneId}`,
                label: `Mutated: ${g.hugoGeneSymbol}`,
                color: '#a04020',
                background: '#fce7df',
                border: '#f0c8b8',
                gene: g,
                remove: () => this.plotsStore.toggleMutatedGene(g),
            })
        );
        this.plotsStore.selectedCNAGenes.forEach(g =>
            alterationChips.push({
                key: `cna:${g.entrezGeneId}`,
                label: `CNA: ${g.hugoGeneSymbol}`,
                color: '#205aa0',
                background: '#e0e9f3',
                border: '#c2d3eb',
                gene: g,
                remove: () => this.plotsStore.toggleCNAGene(g),
            })
        );
        this.plotsStore.selectedSVGenes.forEach(g =>
            alterationChips.push({
                key: `sv:${g.entrezGeneId}`,
                label: `SV: ${g.hugoGeneSymbol}`,
                color: '#208040',
                background: '#e0efe5',
                border: '#c2dccb',
                gene: g,
                remove: () => this.plotsStore.toggleSVGene(g),
            })
        );
        return (
            <div
                style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                    gap: 6,
                    marginBottom: 16,
                    maxWidth: 720,
                }}
            >
                <strong style={{ fontSize: 13 }}>Reference cohort</strong>
                <span style={{ fontSize: 13, color: '#666' }}>
                    &bull; {sampleCount} sample{sampleCount === '1' ? '' : 's'}
                    {!hasFilters && (
                        <span style={{ marginLeft: 4 }}>(whole study)</span>
                    )}
                </span>
                {clinicalChips.map((c, i) => (
                    <span
                        key={`${c.attrId}:${i}`}
                        style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            background: '#e6f0fa',
                            color: '#0b5fae',
                            border: '1px solid #c7dcee',
                            borderRadius: 12,
                            padding: '1px 4px 1px 10px',
                            fontSize: 12,
                            lineHeight: 1.5,
                        }}
                    >
                        {c.label}
                        <button
                            onClick={() =>
                                this.plotsStore.removeClinicalFilterValue(
                                    c.attrId,
                                    c.value
                                )
                            }
                            title="Remove filter"
                            style={{
                                marginLeft: 4,
                                border: 'none',
                                background: 'transparent',
                                color: '#0b5fae',
                                cursor: 'pointer',
                                fontSize: 14,
                                lineHeight: 1,
                                padding: '0 4px',
                            }}
                        >
                            ×
                        </button>
                    </span>
                ))}
                {alterationChips.map(c => (
                    <span
                        key={c.key}
                        style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            background: c.background,
                            color: c.color,
                            border: `1px solid ${c.border}`,
                            borderRadius: 12,
                            padding: '1px 4px 1px 10px',
                            fontSize: 12,
                            lineHeight: 1.5,
                        }}
                    >
                        {c.label}
                        <button
                            onClick={c.remove}
                            title="Remove gene"
                            style={{
                                marginLeft: 4,
                                border: 'none',
                                background: 'transparent',
                                color: c.color,
                                cursor: 'pointer',
                                fontSize: 14,
                                lineHeight: 1,
                                padding: '0 4px',
                            }}
                        >
                            ×
                        </button>
                    </span>
                ))}
                <button
                    type="button"
                    className="btn btn-default"
                    style={{ marginLeft: 4 }}
                    onClick={this.openCohortModal}
                >
                    + Add filter
                </button>
                {hasFilters && (
                    <a
                        href="#"
                        style={{ fontSize: 12, marginLeft: 4 }}
                        onClick={e => {
                            e.preventDefault();
                            this.plotsStore.clearAllFilters();
                        }}
                    >
                        Clear all
                    </a>
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
        const height = 140 + n * 70;
        const valueLabel = profile.name;

        return (
            <div>
                <label
                    style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        fontSize: 12,
                        fontWeight: 'normal',
                        marginBottom: 8,
                        cursor: this.canRenderLog ? 'pointer' : 'not-allowed',
                        color: this.canRenderLog ? '#333' : '#999',
                    }}
                    title={
                        this.canRenderLog
                            ? 'Toggle between log and linear x-axis'
                            : 'Linear only — data contains non-positive values'
                    }
                >
                    <input
                        type="checkbox"
                        checked={this.useLog}
                        disabled={!this.canRenderLog}
                        onChange={e => this.setLogScale(e.target.checked)}
                        style={{ marginRight: 6 }}
                    />
                    Log scale
                </label>
            <ChartContainer
                getSVGElement={this.getSvg}
                exportFileName={`mrna_expression_${this.cohortName}`}
            >
                <VictoryChart
                    theme={CBIOPORTAL_VICTORY_THEME}
                    height={height}
                    width={720}
                    domain={{ x: this.valueDomain, y: [0, n + 0.5] }}
                    domainPadding={{ y: [0, 18] }}
                    padding={{ top: 20, bottom: 80, left: 70, right: 25 }}
                    scale={{
                        x: this.useLog ? 'log' : 'linear',
                        y: 'linear',
                    }}
                    containerComponent={
                        <svg
                            ref={(el: SVGSVGElement | null) => {
                                this.svgContainer = el;
                            }}
                        />
                    }
                >
                    {/* expression value (x) */}
                    <VictoryAxis
                        label={valueLabel}
                        tickValues={this.valueTicks}
                        tickFormat={(t: number) =>
                            t >= 1 ? Number(t).toLocaleString('en-US') : `${t}`
                        }
                        style={{ axisLabel: { padding: 38 } }}
                    />
                    {/* gene rows (y) */}
                    <VictoryAxis
                        dependentAxis
                        tickValues={this.genes.map((g, i) => i + 1)}
                        tickFormat={this.genes.map(g => g.symbol)}
                    />
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
            </div>
        );
    }
}
