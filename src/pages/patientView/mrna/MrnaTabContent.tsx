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
import ReactSelect from 'react-select';
import LoadingIndicator from 'shared/components/loadingIndicator/LoadingIndicator';
import ChartContainer from 'shared/components/ChartContainer/ChartContainer';
import SampleLabelSVG from 'shared/components/sampleLabel/SampleLabel';
import SampleManager from 'pages/patientView/SampleManager';
import { PatientViewPageStore } from 'pages/patientView/clinicalInformation/PatientViewPageStore';

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

// Deterministic [0,1) hash so jitter is stable across renders.
function hash01(s: string): number {
    let h = 0;
    for (let i = 0; i < s.length; i++) {
        h = (Math.imul(h, 31) + s.charCodeAt(i)) | 0;
    }
    return ((h >>> 0) % 10000) / 10000;
}

// Victory data component: render the numbered sample icon (color + order
// number) at the point, matching the icons used in the patient header.
const HighlightSampleMarker: React.FunctionComponent<any> = props => {
    const { x, y, datum, sampleManager } = props;
    if (x == null || y == null || !datum) {
        return null;
    }
    const sampleId: string = datum.sampleId;
    const label = (sampleManager && sampleManager.sampleLabels[sampleId]) || '';
    const color =
        (sampleManager && sampleManager.sampleColors[sampleId]) || RED;
    return <SampleLabelSVG label={label} color={color} x={x} y={y} r={8} />;
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

    // Gene symbols that actually have data, in selected order, with row index.
    @computed get genes(): { symbol: string; entrezGeneId: number }[] {
        const { store } = this.props;
        const present = new Set(
            store.mrnaExpressionDataForGenes.result.map(d => d.entrezGeneId)
        );
        return store.mrnaTabGeneSymbols
            .map(symbol => {
                const gene = store.mrnaTabGenes.result.find(
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

    @computed get geneOptions(): IGeneOption[] {
        return this.props.store.mrnaTabAllGenes.result.map(g => ({
            label: g.hugoGeneSymbol,
            value: g.hugoGeneSymbol,
        }));
    }

    // Only the matches for the current query, capped, so react-select never
    // renders the full ~20k gene list (which freezes the UI).
    @computed get filteredGeneOptions(): IGeneOption[] {
        const q = this.geneQuery.trim().toLowerCase();
        if (!q) {
            return [];
        }
        const out: IGeneOption[] = [];
        for (const o of this.geneOptions) {
            if (o.label.toLowerCase().includes(q)) {
                out.push(o);
                if (out.length >= MAX_GENE_OPTIONS) {
                    break;
                }
            }
        }
        return out;
    }

    @computed get selectedGeneOptions(): IGeneOption[] {
        return this.props.store.mrnaTabGeneSymbols.map(s => ({
            label: s,
            value: s,
        }));
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
        return this.props.store.mrnaExpressionDataForGenes.result
            .map(d => d.value)
            .filter(v => !isNaN(v));
    }

    // Use a log scale for non-negative data (e.g. TPM/RSEM) with enough spread.
    // Zeros are allowed and rendered at a small positive floor; negatives
    // (z-scores) force a linear scale.
    @computed get useLog(): boolean {
        const vals = this.allValues;
        const positives = vals.filter(v => v > 0);
        return (
            vals.length > 0 &&
            vals.every(v => v >= 0) &&
            positives.length >= 2 &&
            _.max(positives)! / _.min(positives)! > 10
        );
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
            this.props.store.mrnaExpressionDataForGenes.result,
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
            this.props.store.mrnaExpressionDataForGenes.result,
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

    @computed get cohortName(): string {
        const { store } = this.props;
        const study = store.studies.result && store.studies.result[0];
        return study ? study.name : store.studyId;
    }

    @computed get chartTitle(): string {
        const profile = this.props.store.mrnaExpressionMolecularProfile.result;
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
                        isLoading={store.mrnaTabAllGenes.isPending}
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
                                : 'Type to search genes'
                        }
                        onChange={(selected: any) =>
                            store.setMrnaTabGeneSymbols(
                                (selected || []).map(
                                    (o: IGeneOption) => o.value
                                )
                            )
                        }
                    />
                </div>
                {this.renderChart()}
            </div>
        );
    }

    private renderChart() {
        const { store } = this.props;

        if (
            store.mrnaExpressionDataForGenes.isPending ||
            store.mrnaTabGenes.isPending
        ) {
            return <LoadingIndicator isLoading={true} size="big" center />;
        }

        const profile = store.mrnaExpressionMolecularProfile.result;
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
        );
    }
}
