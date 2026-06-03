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
import {
    DataFilterValue,
    DiscreteCopyNumberData,
    Gene,
    Mutation,
    StructuralVariant,
} from 'cbioportal-ts-api-client';
import {
    tooltipMutationsSection,
    tooltipCnaSection,
    tooltipSvSection,
} from 'shared/components/plots/PlotsTabUtils';
import ReactSelect from 'react-select';
import { Modal, Button } from 'react-bootstrap';
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
    isGroupValue,
    GENE_GROUP_VALUE_PREFIX,
    MRNA_TAB_GENE_GROUPS,
    MRNA_TAB_PATIENT_GENE_GROUPS,
} from 'pages/patientView/mrna/mrnaTabGeneGroups';
import styles from 'pages/patientView/mrna/styles.module.scss';

interface IGeneOption {
    label: string;
    value: string;
}

interface IOutlierGene {
    symbol: string;
    entrezGeneId: number;
    // Most extreme cohort percentile across the patient's highlighted samples,
    // and which sample produced it.
    percentile: number;
    direction: 'high' | 'low';
    sampleId: string;
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
    // expression value, the gene, and the patient z-score vs cohort, plus
    // look up co-expression suggestions keyed by entrez id.
    rawValue?: number;
    geneSymbol?: string;
    entrezGeneId?: number;
    zScore?: number;
    percentile?: number;
    // The sample's other alterations in this row's gene, for the bubble
    // tooltip (only attached to highlighted points). Shaped by the plots store
    // for the plots-tab tooltip section helpers.
    mutations?: Mutation[];
    copyNumberAlterations?: DiscreteCopyNumberData[];
    structuralVariants?: StructuralVariant[];
}

const RED = '#e8493a';
// Half-height of the jitter band around a gene row. Kept below the box
// half-height (h in boxLines) so the jittered cohort dots stay inside the box.
const BOX_BAND = 0.18;
const OUTLIER_HI_PERCENTILE = 0.95; // patient ≥ 95th percentile = over-expressed
const OUTLIER_LO_PERCENTILE = 0.05; // patient ≤ 5th percentile = under-expressed

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
// the bubble color and size match the header strip. The hover tooltip drops
// SampleInline's clinical-data table in favor of this gene's expression value,
// the patient z-score, and the sample's other alterations in the gene
// (mutations / CNA / SVs), rendered with the Plots-tab tooltip section helpers.
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
    // This sample's other alterations in the row's gene, rendered with the same
    // section helpers the results-view Plots tab uses. The minimal datum is
    // marked profiled so the helpers list only alterations that exist (rather
    // than emitting "Not profiled" lines). Cast to any: the patient's raw
    // mutation/CNA data is structurally compatible with what the helpers read,
    // but not the fully-annotated plot types.
    const altDatum: any = {
        mutations: datum.mutations || [],
        copyNumberAlterations: datum.copyNumberAlterations || [],
        structuralVariants: datum.structuralVariants || [],
        isProfiledMutations: true,
        isProfiledCna: true,
        isProfiledStructuralVariants: true,
    };
    const mutationsSection = tooltipMutationsSection(altDatum);
    const cnaSection = tooltipCnaSection(altDatum);
    const svSection = tooltipSvSection(altDatum);
    if (mutationsSection || cnaSection || svSection) {
        lines.push(
            <div
                key="alts"
                style={{
                    marginTop: 5,
                    paddingTop: 4,
                    borderTop: '1px solid #eee',
                }}
            >
                <div style={{ color: '#888', marginBottom: 2 }}>
                    Alterations in {datum.geneSymbol}:
                </div>
                {mutationsSection}
                {!!mutationsSection && (!!cnaSection || !!svSection) && <br />}
                {cnaSection}
                {!!cnaSection && !!svSection && <br />}
                {svSection}
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
            {/* Flex-center the bubble in the box (and zero the line-height) so
                the inline <svg> isn't pushed down by the line-box baseline/
                descender gap, which otherwise makes the icon sit too low. */}
            <div
                style={{
                    width: BUBBLE_SIZE,
                    height: BUBBLE_SIZE,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    lineHeight: 0,
                }}
            >
                {sample ? (
                    <SampleInline
                        sample={sample}
                        extraTooltipBody={extraBody}
                        hideClinicalTable={true}
                    >
                        {bubble}
                    </SampleInline>
                ) : (
                    bubble
                )}
            </div>
        </foreignObject>
    );
};

// Two-pane dialog for finding genes co-expressed with anything currently on
// the chart. Left pane lists the chart's genes; clicking one triggers a lazy
// per-gene fetch and reveals top-correlated genes on the right. The user
// checks any subset and confirms to add them as new chart rows.
const CoExpressionDialog: React.FunctionComponent<{
    isOpen: boolean;
    onClose: () => void;
    chartGenes: { symbol: string; entrezGeneId: number }[];
    plotsStore: any;
    allGenesByEntrezId: { [k: number]: Gene };
    onAddGenes: (symbols: string[]) => void;
}> = observer(props => {
    const {
        isOpen,
        onClose,
        chartGenes,
        plotsStore,
        allGenesByEntrezId,
        onAddGenes,
    } = props;
    const [selectedEnt, setSelectedEnt] = React.useState<number | undefined>(
        undefined
    );
    const [picked, setPicked] = React.useState<Set<string>>(new Set());
    React.useEffect(() => {
        if (!isOpen) {
            setSelectedEnt(undefined);
            setPicked(new Set());
        }
    }, [isOpen]);
    const promise =
        selectedEnt !== undefined
            ? plotsStore.peekCoExpressionsForGene(selectedEnt)
            : undefined;
    const chips: any[] = (promise && promise.result) || [];
    const pending = !!(promise && promise.isPending);
    const selectedGene =
        selectedEnt !== undefined ? allGenesByEntrezId[selectedEnt] : undefined;
    const chipSymbols: string[] = chips
        .map(
            c =>
                allGenesByEntrezId[Number(c.geneticEntityId)] &&
                allGenesByEntrezId[Number(c.geneticEntityId)].hugoGeneSymbol
        )
        .filter(Boolean) as string[];
    const allPicked =
        chipSymbols.length > 0 && chipSymbols.every(s => picked.has(s));
    const togglePick = (sym: string) => {
        const next = new Set(picked);
        if (next.has(sym)) next.delete(sym);
        else next.add(sym);
        setPicked(next);
    };
    const togglePickAll = () => {
        const next = new Set(picked);
        if (allPicked) chipSymbols.forEach(s => next.delete(s));
        else chipSymbols.forEach(s => next.add(s));
        setPicked(next);
    };
    return (
        <Modal show={isOpen} onHide={onClose} bsSize="large">
            <Modal.Header closeButton>
                <Modal.Title>Find co-expressed genes</Modal.Title>
            </Modal.Header>
            <Modal.Body style={{ minHeight: 420 }}>
                <div style={{ display: 'flex', gap: 16 }}>
                    <div
                        style={{
                            flex: '0 0 200px',
                            borderRight: '1px solid #eee',
                            paddingRight: 12,
                            maxHeight: 480,
                            overflowY: 'auto',
                        }}
                    >
                        <div style={{ fontWeight: 'bold', marginBottom: 8 }}>
                            Chart genes
                        </div>
                        <ul
                            style={{
                                listStyle: 'none',
                                padding: 0,
                                margin: 0,
                            }}
                        >
                            {chartGenes.map(g => (
                                <li
                                    key={g.entrezGeneId}
                                    onClick={() => {
                                        setSelectedEnt(g.entrezGeneId);
                                        plotsStore.requestCoExpressionsForGene(
                                            g.entrezGeneId
                                        );
                                    }}
                                    style={{
                                        padding: '6px 8px',
                                        cursor: 'pointer',
                                        borderRadius: 3,
                                        background:
                                            selectedEnt === g.entrezGeneId
                                                ? '#e8f0ff'
                                                : 'transparent',
                                        fontWeight:
                                            selectedEnt === g.entrezGeneId
                                                ? 'bold'
                                                : 'normal',
                                    }}
                                >
                                    {g.symbol}
                                </li>
                            ))}
                        </ul>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                        {selectedEnt === undefined && (
                            <div style={{ color: '#888', padding: 12 }}>
                                Select a gene to see its top-correlated genes
                                in the cohort.
                            </div>
                        )}
                        {selectedEnt !== undefined && pending && (
                            <LoadingIndicator
                                isLoading={true}
                                size="big"
                                center
                            />
                        )}
                        {selectedEnt !== undefined && !pending && (
                            <>
                                <div
                                    style={{
                                        fontWeight: 'bold',
                                        marginBottom: 8,
                                    }}
                                >
                                    Top correlated with{' '}
                                    {(selectedGene &&
                                        selectedGene.hugoGeneSymbol) ||
                                        selectedEnt}
                                    <span
                                        style={{
                                            fontWeight: 'normal',
                                            color: '#888',
                                            marginLeft: 6,
                                        }}
                                    >
                                        ({chipSymbols.length} genes)
                                    </span>
                                </div>
                                {chipSymbols.length === 0 ? (
                                    <div style={{ color: '#888' }}>
                                        No strong correlations in this cohort.
                                    </div>
                                ) : (
                                    <>
                                        <label
                                            style={{
                                                display: 'block',
                                                marginBottom: 8,
                                                fontWeight: 'normal',
                                            }}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={allPicked}
                                                onChange={togglePickAll}
                                                style={{ marginRight: 6 }}
                                            />
                                            Select all
                                        </label>
                                        <ul
                                            style={{
                                                listStyle: 'none',
                                                padding: 0,
                                                margin: 0,
                                            }}
                                        >
                                            {chips.map((c: any) => {
                                                const ent = Number(
                                                    c.geneticEntityId
                                                );
                                                const sym =
                                                    (allGenesByEntrezId[ent] &&
                                                        allGenesByEntrezId[ent]
                                                            .hugoGeneSymbol) ||
                                                    `${ent}`;
                                                const rho =
                                                    c.spearmansCorrelation;
                                                const sign = rho >= 0
                                                    ? '+'
                                                    : '−';
                                                const onChart = chartGenes.some(
                                                    g =>
                                                        g.entrezGeneId === ent
                                                );
                                                return (
                                                    <li
                                                        key={ent}
                                                        style={{
                                                            padding: '4px 0',
                                                        }}
                                                    >
                                                        <label
                                                            style={{
                                                                display:
                                                                    'flex',
                                                                alignItems:
                                                                    'center',
                                                                gap: 8,
                                                                fontWeight:
                                                                    'normal',
                                                                cursor:
                                                                    onChart
                                                                        ? 'default'
                                                                        : 'pointer',
                                                                opacity:
                                                                    onChart
                                                                        ? 0.55
                                                                        : 1,
                                                            }}
                                                        >
                                                            <input
                                                                type="checkbox"
                                                                disabled={
                                                                    onChart
                                                                }
                                                                checked={picked.has(
                                                                    sym
                                                                )}
                                                                onChange={() =>
                                                                    togglePick(
                                                                        sym
                                                                    )
                                                                }
                                                            />
                                                            <span
                                                                style={{
                                                                    fontWeight:
                                                                        'bold',
                                                                    minWidth: 110,
                                                                }}
                                                            >
                                                                {sym}
                                                            </span>
                                                            <span
                                                                style={{
                                                                    color:
                                                                        '#888',
                                                                    fontVariantNumeric:
                                                                        'tabular-nums',
                                                                }}
                                                            >
                                                                ρ = {sign}
                                                                {Math.abs(
                                                                    rho
                                                                ).toFixed(2)}
                                                            </span>
                                                            {onChart && (
                                                                <span
                                                                    style={{
                                                                        color:
                                                                            '#888',
                                                                        fontSize: 11,
                                                                    }}
                                                                >
                                                                    already on
                                                                    chart
                                                                </span>
                                                            )}
                                                        </label>
                                                    </li>
                                                );
                                            })}
                                        </ul>
                                    </>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </Modal.Body>
            <Modal.Footer>
                <Button onClick={onClose}>Cancel</Button>
                <Button
                    bsStyle="primary"
                    disabled={picked.size === 0}
                    onClick={() => {
                        onAddGenes([...picked]);
                        onClose();
                    }}
                >
                    Add {picked.size} gene{picked.size === 1 ? '' : 's'} to
                    chart
                </Button>
            </Modal.Footer>
        </Modal>
    );
});

// Dialog that surfaces genes where the patient's highlighted sample(s) sit in
// the tail of the cohort expression distribution (top or bottom 5% by
// percentile). The user checks any subset and confirms to add them as new
// chart rows. Mirrors CoExpressionDialog's checklist/add affordances.
const OutlierGeneDialog: React.FunctionComponent<{
    isOpen: boolean;
    onClose: () => void;
    isLoading: boolean;
    outlierGenes: IOutlierGene[];
    chartGeneEntrezIds: Set<number>;
    sampleManager: SampleManager | null;
    multipleSamples: boolean;
    onAddGenes: (symbols: string[]) => void;
}> = observer(props => {
    const {
        isOpen,
        onClose,
        isLoading,
        outlierGenes,
        chartGeneEntrezIds,
        sampleManager,
        multipleSamples,
        onAddGenes,
    } = props;
    const [picked, setPicked] = React.useState<Set<string>>(new Set());
    React.useEffect(() => {
        if (!isOpen) {
            setPicked(new Set());
        }
    }, [isOpen]);

    const high = outlierGenes.filter(g => g.direction === 'high');
    const low = outlierGenes.filter(g => g.direction === 'low');
    // Genes not already on the chart are the only ones "Select all" touches.
    const addable = outlierGenes.filter(
        g => !chartGeneEntrezIds.has(g.entrezGeneId)
    );
    const allPicked =
        addable.length > 0 && addable.every(g => picked.has(g.symbol));
    const togglePick = (sym: string) => {
        const next = new Set(picked);
        if (next.has(sym)) next.delete(sym);
        else next.add(sym);
        setPicked(next);
    };
    const togglePickAll = () => {
        const next = new Set(picked);
        if (allPicked) addable.forEach(g => next.delete(g.symbol));
        else addable.forEach(g => next.add(g.symbol));
        setPicked(next);
    };

    const subject = multipleSamples ? 'patient' : 'sample';

    const renderRow = (g: IOutlierGene) => {
        const onChart = chartGeneEntrezIds.has(g.entrezGeneId);
        const pct = Math.round(g.percentile * 100);
        const sampleLabel =
            multipleSamples && sampleManager
                ? sampleManager.sampleLabels[g.sampleId]
                : undefined;
        return (
            <li key={g.entrezGeneId} style={{ padding: '4px 0' }}>
                <label
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        fontWeight: 'normal',
                        cursor: onChart ? 'default' : 'pointer',
                        opacity: onChart ? 0.55 : 1,
                    }}
                >
                    <input
                        type="checkbox"
                        disabled={onChart}
                        checked={picked.has(g.symbol)}
                        onChange={() => togglePick(g.symbol)}
                    />
                    <span style={{ fontWeight: 'bold', minWidth: 110 }}>
                        {g.symbol}
                    </span>
                    <span
                        style={{
                            color: '#888',
                            fontVariantNumeric: 'tabular-nums',
                        }}
                    >
                        {pct}th percentile
                    </span>
                    {sampleLabel && (
                        <span style={{ color: '#888', fontSize: 11 }}>
                            sample {sampleLabel}
                        </span>
                    )}
                    {onChart && (
                        <span style={{ color: '#888', fontSize: 11 }}>
                            already on chart
                        </span>
                    )}
                </label>
            </li>
        );
    };

    const section = (title: string, genes: IOutlierGene[]) => (
        <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 'bold', marginBottom: 8 }}>
                {title}
                <span
                    style={{
                        fontWeight: 'normal',
                        color: '#888',
                        marginLeft: 6,
                    }}
                >
                    ({genes.length} gene{genes.length === 1 ? '' : 's'})
                </span>
            </div>
            {genes.length === 0 ? (
                <div style={{ color: '#888' }}>None</div>
            ) : (
                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                    {genes.map(renderRow)}
                </ul>
            )}
        </div>
    );

    return (
        <Modal show={isOpen} onHide={onClose} bsSize="large">
            <Modal.Header closeButton>
                <Modal.Title>Find outlier genes</Modal.Title>
            </Modal.Header>
            <Modal.Body style={{ minHeight: 420 }}>
                {isLoading ? (
                    <LoadingIndicator isLoading={true} size="big" center />
                ) : outlierGenes.length === 0 ? (
                    <div style={{ color: '#888', padding: 12 }}>
                        No genes where this {subject} falls in the top or bottom
                        5% of expression across the study.
                    </div>
                ) : (
                    <>
                        <div style={{ marginBottom: 12, color: '#666' }}>
                            Genes where this {subject} sits in the tail of the
                            study's expression distribution (top or bottom 5%).
                            Percentiles are computed across all profiled samples
                            in the study, not the selected reference cohort.
                        </div>
                        <label
                            style={{
                                display: 'block',
                                marginBottom: 8,
                                fontWeight: 'normal',
                            }}
                        >
                            <input
                                type="checkbox"
                                checked={allPicked}
                                onChange={togglePickAll}
                                style={{ marginRight: 6 }}
                            />
                            Select all
                        </label>
                        <div style={{ display: 'flex', gap: 24 }}>
                            {section('Over-expressed (top 5%)', high)}
                            {section('Under-expressed (bottom 5%)', low)}
                        </div>
                    </>
                )}
            </Modal.Body>
            <Modal.Footer>
                <Button onClick={onClose}>Cancel</Button>
                <Button
                    bsStyle="primary"
                    disabled={picked.size === 0}
                    onClick={() => {
                        onAddGenes([...picked]);
                        onClose();
                    }}
                >
                    Add {picked.size} gene{picked.size === 1 ? '' : 's'} to chart
                </Button>
            </Modal.Footer>
        </Modal>
    );
});

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

    // Picker options: one row per gene set — the static preset groups plus the
    // patient-derived dynamic sets (mutations / SVs / CNA) that have at least
    // one gene. Filtered by the current query against the set label. The picker
    // offers sets only; individual genes are not selectable.
    @computed get groupOptions(): IGeneOption[] {
        const q = this.geneQuery.trim().toLowerCase();
        const staticOpts = MRNA_TAB_GENE_GROUPS.filter(
            g => g.genes.length > 0 && (!q || g.label.toLowerCase().includes(q))
        ).map(g => ({
            value: groupValue(g),
            label: `${g.label} (${g.genes.length} genes)`,
        }));
        const dynamic = this.plotsStore.dynamicGroupSymbols;
        const dynamicOpts = MRNA_TAB_PATIENT_GENE_GROUPS.filter(g => {
            const count = (dynamic[g.id] || []).length;
            return count > 0 && (!q || g.label.toLowerCase().includes(q));
        }).map(g => ({
            value: `${GENE_GROUP_VALUE_PREFIX}${g.id}`,
            label: `${g.label} (${(dynamic[g.id] || []).length} genes)`,
        }));
        return [...staticOpts, ...dynamicOpts];
    }

    // Flat list of every available gene set. Returned ungrouped (not wrapped in
    // a { label, options } section) since sets are now the only option type, so
    // react-select renders no section header.
    @computed get filteredGeneOptions(): IGeneOption[] {
        return this.groupOptions;
    }

    // The single active gene set (the picker is single-select — one list at a
    // time). Resolves the selected group token to its display label, or null
    // when no set is active.
    @computed get selectedGroupOption(): IGeneOption | null {
        const item = this.plotsStore.mrnaTabSelections.find(i =>
            isGroupValue(i)
        );
        if (!item) {
            return null;
        }
        const group = findGroupByValue(item);
        if (group) {
            return { value: item, label: group.label };
        }
        const id = item.slice(GENE_GROUP_VALUE_PREFIX.length);
        const dyn = MRNA_TAB_PATIENT_GENE_GROUPS.find(g => g.id === id);
        return { value: item, label: dyn ? dyn.label : item };
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

    // Adds one or more hugo symbols to the picker's selection list, skipping
    // any that are already on the chart. Used by the co-expression dialog
    // when the user confirms a multi-select.
    @action.bound
    addGeneSymbolsToChart(symbols: string[]) {
        const onChart = new Set(this.plotsStore.effectiveGeneSymbols);
        const current = this.plotsStore.mrnaTabSelections;
        const currentSet = new Set(current);
        const toAdd = symbols.filter(
            s => !onChart.has(s) && !currentSet.has(s)
        );
        if (toAdd.length === 0) return;
        this.plotsStore.setMrnaTabSelections([...current, ...toAdd]);
    }

    @observable coExpressionDialogOpen: boolean = false;

    @action.bound
    openCoExpressionDialog() {
        this.coExpressionDialogOpen = true;
    }

    @action.bound
    closeCoExpressionDialog() {
        this.coExpressionDialogOpen = false;
    }

    @observable outlierDialogOpen: boolean = false;

    @action.bound
    openOutlierDialog() {
        this.outlierDialogOpen = true;
    }

    @action.bound
    closeOutlierDialog() {
        this.outlierDialogOpen = false;
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

    // Entrez ids of the genes currently on the chart, used so the bubble
    // tooltip can quickly tell whether a co-expressed gene is also on chart.
    @computed get chartGeneEntrezIdSet(): Set<number> {
        return new Set(this.genes.map(g => g.entrezGeneId));
    }

    // The patient's own sample ids, in sample-manager display order, used as
    // the per-sample columns of the expression table.
    @computed get expressionTableSampleIds(): string[] {
        const sm = this.props.sampleManager;
        const patientSampleIds = new Set(this.props.store.sampleIds);
        if (sm) {
            return sm
                .getSampleIdsInOrder()
                .filter(id => patientSampleIds.has(id));
        }
        return this.props.store.sampleIds;
    }

    // One row per gene that has expression data for the patient's sample(s),
    // each carrying the gene symbol and a per-sample expression value. Sorted
    // by |value| in the first sample column, descending.
    @computed get expressionTableRows(): {
        entrezGeneId: number;
        symbol: string;
        values: { [sampleId: string]: number };
    }[] {
        const sampleIds = new Set(this.expressionTableSampleIds);
        const byGene: {
            [entrezGeneId: number]: { [sampleId: string]: number };
        } = {};
        this.plotsStore.patientSamplesExpression.result.forEach(d => {
            if (!sampleIds.has(d.sampleId) || isNaN(d.value)) return;
            (byGene[d.entrezGeneId] =
                byGene[d.entrezGeneId] || {})[d.sampleId] = d.value;
        });
        const rows = Object.keys(byGene).map(k => {
            const entrezGeneId = Number(k);
            const gene = this.plotsStore.allGenesByEntrezId[entrezGeneId];
            return {
                entrezGeneId,
                symbol: (gene && gene.hugoGeneSymbol) || `${entrezGeneId}`,
                values: byGene[entrezGeneId],
            };
        });
        // Sort by the first sample column that actually has data — a sample
        // with no values for any gene is skipped as a sort key.
        const sortSample = this.expressionTableSampleIds.find(id =>
            rows.some(r => r.values[id] !== undefined)
        );
        return _.orderBy(
            rows,
            r => {
                const v =
                    sortSample !== undefined ? r.values[sortSample] : undefined;
                return v === undefined ? -Infinity : Math.abs(v);
            },
            'desc'
        );
    }

    // Genes where the patient's highlighted sample(s) fall in the top or bottom
    // 5% of expression. Percentiles come from the server-side /mrna-percentile
    // endpoint (0–100 scale, relative to the full ranking-profile population),
    // so no matrix is transferred. For a multi-sample patient, each gene is
    // judged by its most extreme sample. Sorted by how far into the tail the
    // patient sits. Only evaluated (and thus only triggers the fetch) when the
    // dialog observes it.
    @computed get outlierGenes(): IOutlierGene[] {
        const rows = this.plotsStore.mrnaSamplePercentiles.result;
        if (!rows || rows.length === 0) return [];
        const symbolByEntrez = this.plotsStore.allGenesByEntrezId;
        const byEntrez = _.groupBy(rows, r => r.entrezGeneId);
        const out: IOutlierGene[] = [];
        Object.keys(byEntrez).forEach(k => {
            const entrezId = Number(k);
            let best: { percentile: number; sampleId: string } | undefined;
            byEntrez[entrezId].forEach(r => {
                if (!Number.isFinite(r.percentile)) return;
                const percentile = r.percentile / 100; // 0–100 → 0–1
                if (
                    !best ||
                    Math.abs(percentile - 0.5) >
                        Math.abs(best.percentile - 0.5)
                ) {
                    best = { percentile, sampleId: r.sampleId };
                }
            });
            if (!best) return;
            if (
                best.percentile >= OUTLIER_HI_PERCENTILE ||
                best.percentile <= OUTLIER_LO_PERCENTILE
            ) {
                const gene = symbolByEntrez[entrezId];
                out.push({
                    symbol: (gene && gene.hugoGeneSymbol) || `${entrezId}`,
                    entrezGeneId: entrezId,
                    percentile: best.percentile,
                    direction:
                        best.percentile >= OUTLIER_HI_PERCENTILE
                            ? 'high'
                            : 'low',
                    sampleId: best.sampleId,
                });
            }
        });
        return _.orderBy(out, o => Math.abs(o.percentile - 0.5), 'desc');
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
                // Only highlighted points get a tooltip, so only they need the
                // sample's alterations in this gene.
                const alterations = highlighted
                    ? this.plotsStore.geneAlterationsForSample(
                          d.sampleId,
                          gene.entrezGeneId
                      )
                    : undefined;
                // In the default orientation, value is on x and the gene
                // category on y; swapped flips them.
                points.push({
                    sampleId: d.sampleId,
                    x: swap ? categoryCoord : valueCoord,
                    y: swap ? valueCoord : categoryCoord,
                    rawValue: d.value,
                    geneSymbol: gene.symbol,
                    entrezGeneId: gene.entrezGeneId,
                    zScore: sampleScore ? sampleScore.z : undefined,
                    percentile: sampleScore
                        ? sampleScore.percentile
                        : undefined,
                    mutations: alterations && alterations.mutations,
                    copyNumberAlterations:
                        alterations && alterations.copyNumberAlterations,
                    structuralVariants:
                        alterations && alterations.structuralVariants,
                });
            });
        });
        return points;
    }

    // Box drawn manually as line segments in (x=value, y=geneRow) space so it
    // stays consistent with the scatter; VictoryBoxPlot's horizontal mode
    // mis-scales its category against the log value axis.
    @computed get boxLines(): JSX.Element[] {
        const h = 0.2268;
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

    // Value-axis ticks, kept deliberately sparse so the bottom axis labels
    // don't crowd (Victory's auto-ticks, and a naive 1-2-5-per-decade rule,
    // are too dense for this chart's width).
    @computed get valueTicks(): number[] | undefined {
        const [lo, hi] = this.valueDomain;
        if (this.useLog) {
            const startExp = Math.floor(Math.log10(lo));
            const endExp = Math.ceil(Math.log10(hi));
            const decades = endExp - startExp;
            // Few decades: 1-2-5 per decade. Many decades: powers of ten only
            // (optionally every other decade) so the axis stays readable.
            const mantissas = decades <= 2 ? [1, 2, 5] : [1];
            const expStep = decades > 6 ? 2 : 1;
            const ticks: number[] = [];
            for (let e = startExp; e <= endExp; e += expStep) {
                mantissas.forEach(m => {
                    const v = m * Math.pow(10, e);
                    if (v >= lo && v <= hi) {
                        ticks.push(v);
                    }
                });
            }
            return ticks.length ? ticks : undefined;
        }
        const span = hi - lo;
        if (!(span > 0)) {
            return undefined;
        }
        // Round the raw step (span / targetTicks) UP to the next 1-2-5 value so
        // the tick count never exceeds the target (rounding down would double
        // it). ~5 ticks across the domain.
        const targetTicks = 5;
        const rawStep = span / targetTicks;
        const mag = Math.pow(10, Math.floor(Math.log10(rawStep)));
        const norm = rawStep / mag;
        const niceMul = norm <= 1 ? 1 : norm <= 2 ? 2 : norm <= 5 ? 5 : 10;
        const step = niceMul * mag;
        const ticks: number[] = [];
        const start = Math.ceil(lo / step) * step;
        for (let v = start; v <= hi + step * 1e-9; v += step) {
            // Snap away float fuzz (and -0) so ticks land on clean values.
            ticks.push(Number(v.toFixed(10)));
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
                    // No outer maxWidth: the chart has a fixed width and the
                    // expression table sits to its left, so the tab needs room
                    // for both side by side (the chart grows horizontally in
                    // swapped mode as well).
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
                        Gene Sets
                    </label>
                    <ReactSelect
                        isClearable
                        isLoading={
                            this.props.store.mutationData.isPending ||
                            this.props.store.structuralVariantData.isPending ||
                            this.props.store.discreteCNAData.isPending
                        }
                        options={this.filteredGeneOptions}
                        value={this.selectedGroupOption}
                        placeholder="Select a gene set…"
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
                                ? 'No matching gene sets'
                                : 'No gene sets available'
                        }
                        onChange={(selected: any) =>
                            this.plotsStore.setMrnaTabSelections(
                                selected ? [selected.value] : []
                            )
                        }
                    />
                </div>
                {this.renderCohortSummaryBar()}
                <div
                    style={{
                        display: 'flex',
                        gap: 24,
                        alignItems: 'flex-start',
                        marginTop: 16,
                        // Don't set overflowX here: per CSS, a non-visible
                        // overflow on one axis forces the other to compute to
                        // 'auto', which would turn this row into a vertical
                        // clipping box and cut off the chart's bottom axis. The
                        // chart (ChartContainer) and the table each scroll
                        // horizontally on their own.
                    }}
                >
                    {this.renderExpressionTable()}
                    {this.renderChart()}
                </div>
                <CoExpressionDialog
                    isOpen={this.coExpressionDialogOpen}
                    onClose={this.closeCoExpressionDialog}
                    chartGenes={this.genes}
                    plotsStore={this.plotsStore}
                    allGenesByEntrezId={this.plotsStore.allGenesByEntrezId}
                    onAddGenes={this.addGeneSymbolsToChart}
                />
                <OutlierGeneDialog
                    isOpen={this.outlierDialogOpen}
                    onClose={this.closeOutlierDialog}
                    isLoading={
                        this.outlierDialogOpen &&
                        this.plotsStore.mrnaSamplePercentiles.isPending
                    }
                    outlierGenes={
                        this.outlierDialogOpen ? this.outlierGenes : []
                    }
                    chartGeneEntrezIds={this.chartGeneEntrezIdSet}
                    sampleManager={this.props.sampleManager}
                    multipleSamples={this.highlightedSampleIds.size > 1}
                    onAddGenes={this.addGeneSymbolsToChart}
                />
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

    // A table of every gene with expression data, one column per patient
    // sample, sorted by |value| in the first sample column.
    private renderExpressionTable() {
        const sm = this.props.sampleManager;
        const sampleIds = this.expressionTableSampleIds;
        const labelFor = (id: string) =>
            sm ? `Sample ${sm.sampleLabels[id]}` : id;
        const numCell: React.CSSProperties = {
            textAlign: 'right',
            fontVariantNumeric: 'tabular-nums',
        };
        const heading = (count: React.ReactNode) => (
            <h5 style={{ marginBottom: 8 }}>
                Expression values
                <span
                    style={{
                        fontWeight: 'normal',
                        color: '#888',
                        marginLeft: 6,
                    }}
                >
                    ({count})
                </span>
            </h5>
        );
        if (this.plotsStore.patientSamplesExpression.isPending) {
            // Skeleton loader: same column shape as the real table, with
            // shimmering placeholder bars in place of values.
            const colIds = sampleIds.length > 0 ? sampleIds : [''];
            return (
                <div style={{ flexShrink: 0 }}>
                    {heading(
                        <span
                            className={styles.skeletonBar}
                            style={{ width: 48, verticalAlign: 'middle' }}
                        />
                    )}
                    <table
                        className={`table table-striped ${styles.expressionTable}`}
                    >
                        <thead>
                            <tr>
                                <th>Gene</th>
                                {colIds.map((id, i) => (
                                    <th key={i} style={numCell}>
                                        {sampleIds.length > 0
                                            ? labelFor(id)
                                            : ' '}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {Array.from({ length: 12 }).map((_unused, row) => (
                                <tr key={row}>
                                    <td>
                                        <span
                                            className={styles.skeletonBar}
                                            style={{ width: 70 + (row % 4) * 14 }}
                                        />
                                    </td>
                                    {colIds.map((id, i) => (
                                        <td key={i} style={numCell}>
                                            <span
                                                className={styles.skeletonBar}
                                                style={{
                                                    width: 36 + (i % 3) * 8,
                                                }}
                                            />
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            );
        }
        const rows = this.expressionTableRows;
        if (sampleIds.length === 0 || rows.length === 0) {
            return null;
        }
        // Only show columns for samples that have at least one value; list the
        // rest in a footnote rather than rendering dead all-dash columns.
        const samplesWithData = sampleIds.filter(id =>
            rows.some(r => r.values[id] !== undefined)
        );
        const samplesWithoutData = sampleIds.filter(
            id => !samplesWithData.includes(id)
        );
        const noDataLabels = samplesWithoutData.map(labelFor);
        const noDataMessage =
            noDataLabels.length === 0
                ? null
                : `${
                      noDataLabels.length <= 1
                          ? noDataLabels.join('')
                          : noDataLabels.slice(0, -1).join(', ') +
                            ' and ' +
                            noDataLabels[noDataLabels.length - 1]
                  } ${
                      noDataLabels.length === 1 ? 'has' : 'have'
                  } no expression data.`;
        return (
            <div style={{ flexShrink: 0 }}>
                {heading(`${rows.length} gene${rows.length === 1 ? '' : 's'}`)}
                <div style={{ maxHeight: 420, overflowY: 'auto' }}>
                    <table
                        className={`table table-striped ${styles.expressionTable}`}
                    >
                        <thead>
                            <tr>
                                <th>Gene</th>
                                {samplesWithData.map(id => (
                                    <th key={id} style={numCell}>
                                        {labelFor(id)}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map(r => {
                                const onChart = this.chartGeneEntrezIdSet.has(
                                    r.entrezGeneId
                                );
                                return (
                                    <tr
                                        key={r.entrezGeneId}
                                        onClick={
                                            onChart
                                                ? undefined
                                                : () =>
                                                      this.addGeneSymbolsToChart(
                                                          [r.symbol]
                                                      )
                                        }
                                        // Highlight + hover are data-driven CSS
                                        // classes (the class only changes when
                                        // the chart selection changes, and hover
                                        // is pure CSS — see styles.module.scss),
                                        // so mousing over rows triggers no
                                        // render.
                                        className={
                                            onChart
                                                ? styles.selected
                                                : styles.clickable
                                        }
                                        style={{
                                            cursor: onChart
                                                ? 'default'
                                                : 'pointer',
                                        }}
                                        title={
                                            onChart
                                                ? 'Already on chart'
                                                : 'Click to add this gene to the chart'
                                        }
                                    >
                                        <td style={{ fontWeight: 'bold' }}>
                                            {r.symbol}
                                        </td>
                                        {samplesWithData.map(id => {
                                            const v = r.values[id];
                                            return (
                                                <td key={id} style={numCell}>
                                                    {v === undefined
                                                        ? '—'
                                                        : v.toFixed(2)}
                                                </td>
                                            );
                                        })}
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
                {noDataMessage && (
                    <div
                        style={{
                            fontSize: 11,
                            color: '#888',
                            marginTop: 6,
                        }}
                    >
                        {noDataMessage}
                    </div>
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
        if (!profile) {
            return (
                <div style={{ padding: '10px 0' }}>
                    No mRNA expression data is available.
                </div>
            );
        }
        // No genes on the chart yet — show an empty plot area prompting the
        // user to pick a gene (the table on the left stays populated).
        if (this.genes.length === 0) {
            return (
                <div
                    style={{
                        flexShrink: 0,
                        width: 720,
                        height: 360,
                        border: '1px dashed #ccc',
                        borderRadius: 4,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#888',
                        textAlign: 'center',
                        padding: 24,
                    }}
                >
                    Select a gene above, or click a gene in the table, to plot
                    its expression across the cohort.
                </div>
            );
        }

        const n = this.genes.length;
        const swap = this.axesSwapped;
        // Each gene needs roughly the same per-row/column space regardless of
        // orientation; pick a fixed cross-axis size for the value axis. The
        // non-swapped per-row size is deliberately compact (30px) to keep the
        // vertically stacked gene rows from making the chart too tall — this
        // sets both the row spacing and, since the box/jitter extents are in
        // category units, each gene's vertical box extent.
        const VALUE_AXIS_SIZE = 520;
        const PER_GENE = swap ? 90 : 30;
        const chartWidth = swap ? 170 + n * PER_GENE : 720;
        const chartHeight = swap ? VALUE_AXIS_SIZE : 140 + n * PER_GENE;
        // .borderedChart (ChartContainer) adds 10px padding + 1px dashed border
        // on each side. The wrapper below must include this chrome, otherwise
        // the fixed-width SVG overflows ChartContainer's inner scroll div,
        // which adds a horizontal scrollbar that — combined with that div's
        // overflowY:hidden — overlays and clips the bottom x-axis.
        const BORDERED_CHART_CHROME = 22;
        // Swapped layout needs more left padding (so the rotated value-axis
        // label clears the tick numbers) and more bottom padding (so the
        // angled gene tick labels fit beneath the axis without overlapping).
        const padding = swap
            ? { top: 30, bottom: 110, left: 90, right: 25 }
            : { top: 20, bottom: 80, left: 140, right: 25 };
        const valueLabel = profile.name;
        const valueScale = this.useLog ? 'log' : 'linear';
        const categoryDomain: [number, number] = [0, n + 0.5];
        const categoryTickValues = this.genes.map((g, i) => i + 1);
        const categoryTickFormat = this.genes.map(g => g.symbol);
        const categoryTickLabel = (
            <VictoryLabel style={{ fontSize: 12, fill: '#333' } as any} />
        );
        // Abbreviate thousands so 4+ digit ticks stay compact: 2000 -> "2k",
        // 1500 -> "1.5k", 12000 -> "12k".
        const valueTickFormat = (t: number) => {
            if (Math.abs(t) >= 1000) {
                const k = t / 1000;
                return `${Number.isInteger(k) ? k : k.toFixed(1)}k`;
            }
            return t >= 1 ? Number(t).toLocaleString('en-US') : `${t}`;
        };
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
                          padding: 14,
                      },
                  },
              }
            : {
                  tickValues: categoryTickValues,
                  tickFormat: categoryTickFormat,
                  tickLabelComponent: categoryTickLabel,
              };

        return (
            // Pin the wrapper to the chart's intrinsic width (plus the bordered
            // chart's padding/border chrome) so the `.borderedChart
            // { max-width: 100% }` rule resolves to the real chart width (not
            // the shrunken flex width next to the table). Including the chrome
            // keeps the SVG from overflowing into a horizontal scrollbar that
            // would clip the bottom x-axis.
            <div
                style={{
                    width: chartWidth + BORDERED_CHART_CHROME,
                    flexShrink: 0,
                }}
            >
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
                            data: { fill: '#7e7e7e', fillOpacity: 0.25 },
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
