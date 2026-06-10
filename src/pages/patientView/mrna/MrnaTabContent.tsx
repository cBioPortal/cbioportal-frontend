import * as React from 'react';
import _ from 'lodash';
import { observer } from 'mobx-react';
import { action, computed, makeObservable, observable } from 'mobx';
import {
    VictoryArea,
    VictoryAxis,
    VictoryChart,
    VictoryContainer,
    VictoryLabel,
    VictoryLine,
    VictoryScatter,
} from 'victory';
import {
    CBIOPORTAL_VICTORY_THEME,
    DefaultTooltip,
} from 'cbioportal-frontend-commons';
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
import { Modal, Button } from 'react-bootstrap';
import LoadingIndicator from 'shared/components/loadingIndicator/LoadingIndicator';
import { Column } from 'shared/components/lazyMobXTable/LazyMobXTable';
import FixedHeaderTable from 'pages/studyView/table/FixedHeaderTable';
import ChartContainer from 'shared/components/ChartContainer/ChartContainer';
import { SampleLabelHTML } from 'shared/components/sampleLabel/SampleLabel';
import SampleInline from 'pages/patientView/patientHeader/SampleInline';
import SampleManager from 'pages/patientView/SampleManager';
import { PatientViewPageStore } from 'pages/patientView/clinicalInformation/PatientViewPageStore';
import { MutatedGenePick } from 'pages/patientView/clinicalInformation/PatientViewPlotsStore';
import ReferenceCohortModal from 'pages/patientView/mrna/ReferenceCohortModal';
import {
    GENE_GROUP_VALUE_PREFIX,
    MRNA_TAB_GENE_GROUPS,
    MRNA_TAB_PATIENT_GENE_GROUPS,
    ALL_GENE_GROUP_LABEL_META,
    getGeneGroupLabelMeta,
} from 'pages/patientView/mrna/mrnaTabGeneGroups';
import styles from 'pages/patientView/mrna/styles.module.scss';

// One row of the expression table: a gene and its per-sample expression values.
type ExpressionTableRow = {
    entrezGeneId: number;
    symbol: string;
    values: { [sampleId: string]: number };
    // Ids of the gene groups (labels) this gene belongs to, in chip order.
    labelIds: string[];
};

// Fixed expression-table column widths so the panel keeps a constant width.
const EXPR_GENE_COL_W = 110;
const EXPR_LABELS_COL_W = 150;
const EXPR_ADD_COL_W = 30;
const EXPR_SAMPLE_COL_W = 80;

// Hard cap on how many genes the chart will draw at once. Selecting more than
// this still works — only the first MAX_PLOT_GENES are plotted, and a message
// tells the user the rest are omitted. Keeps the chart legible and responsive.
const MAX_PLOT_GENES = 50;

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

// Sample standard deviation of an array.
function stdDev(values: number[]): number {
    const n = values.length;
    if (n < 2) return 0;
    const mean = values.reduce((a, b) => a + b, 0) / n;
    const variance =
        values.reduce((a, b) => a + (b - mean) * (b - mean), 0) / (n - 1);
    return Math.sqrt(variance);
}

// Gaussian kernel density estimate of `values` evaluated at each point of
// `grid`. Used to draw the violin shapes.
function gaussianKde(
    values: number[],
    grid: number[],
    bandwidth: number
): number[] {
    const n = values.length;
    if (n === 0 || bandwidth <= 0) {
        return grid.map(() => 0);
    }
    const norm = 1 / (n * bandwidth * Math.sqrt(2 * Math.PI));
    return grid.map(g => {
        let sum = 0;
        for (let i = 0; i < n; i++) {
            const u = (g - values[i]) / bandwidth;
            sum += Math.exp(-0.5 * u * u);
        }
        return norm * sum;
    });
}

// Renders a violin outline as a single filled SVG <path>, drawing the points
// in the given order (unlike VictoryLine, which reorders by the independent
// axis and scrambles the mirrored outline). Used for the swapped layout, where
// VictoryArea — which only fills along the x-axis — can't make a vertical
// violin. Victory injects `scale` into chart children, mapping data → pixels.
const ViolinShape: React.FunctionComponent<any> = props => {
    const { points, scale, style } = props;
    if (!scale || !points || points.length === 0) {
        return null;
    }
    // Victory injects a `parent` style key into children; drop it so it isn't
    // applied as an (invalid) SVG style on the path.
    const { parent, ...pathStyle } = style || {};
    const d =
        points
            .map(
                (p: IPoint, i: number) =>
                    `${i === 0 ? 'M' : 'L'} ${scale.x(p.x)} ${scale.y(p.y)}`
            )
            .join(' ') + ' Z';
    return <path d={d} style={pathStyle} />;
};

// Tooltip overlay with a gene's OncoKB summary and background. `curated` is an
// OncoKB CuratedGene with summary/background strings.
function geneBackgroundOverlay(symbol: string, curated: any): JSX.Element {
    return (
        <div style={{ maxWidth: 360, fontWeight: 'normal' }}>
            <div style={{ fontWeight: 'bold', marginBottom: 4 }}>{symbol}</div>
            {curated.summary && (
                <div style={{ marginBottom: 6 }}>{curated.summary}</div>
            )}
            {curated.background && (
                <div style={{ fontSize: 12, color: '#555' }}>
                    {curated.background}
                </div>
            )}
            <div style={{ fontSize: 11, color: '#888', marginTop: 6 }}>
                Source: OncoKB
            </div>
        </div>
    );
}

// Custom axis tick label for gene rows: a VictoryLabel that, when OncoKB
// curates the gene, also shows the gene's summary/background on hover (no
// icon — hovering the gene name itself triggers it). Victory supplies the
// positioning props (x/y/text/style); the OncoKB lookup comes in as a prop.
const GeneTickLabel: React.FunctionComponent<any> = props => {
    const { oncokbGeneBySymbol, ...labelProps } = props;
    const raw = labelProps.text;
    const symbol = String(Array.isArray(raw) ? raw[0] : raw || '');
    const curated =
        oncokbGeneBySymbol && oncokbGeneBySymbol[symbol.toUpperCase()];
    const label = <VictoryLabel {...labelProps} />;
    if (!curated || (!curated.summary && !curated.background)) {
        return label;
    }
    return (
        <DefaultTooltip
            placement="top"
            mouseEnterDelay={0.2}
            overlay={geneBackgroundOverlay(symbol, curated)}
        >
            <g style={{ cursor: 'pointer' }}>{label}</g>
        </DefaultTooltip>
    );
};

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
    // VictoryContainer's containerRef hands back the wrapper <div>; the <svg>
    // we export for download lives inside it.
    private setSvgContainer = (container: HTMLDivElement | null) => {
        this.svgContainer = container ? container.querySelector('svg') : null;
    };

    constructor(props: IMrnaTabContentProps) {
        super(props);
        makeObservable(this);
    }

    private get plotsStore() {
        return this.props.store.plotsStore;
    }

    // Effective gene rows for the chart, in resolved selection order, deduped,
    // and restricted to genes that actually have expression data.
    // Every selected gene that has expression data, in selection order. This is
    // the full set the user has chosen; the chart draws at most MAX_PLOT_GENES
    // of them (see `genes`).
    @computed get selectedChartGenes(): {
        symbol: string;
        entrezGeneId: number;
    }[] {
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

    // Genes actually drawn on the chart — the selection capped at
    // MAX_PLOT_GENES.
    @computed get genes(): { symbol: string; entrezGeneId: number }[] {
        return this.selectedChartGenes.slice(0, MAX_PLOT_GENES);
    }

    // True when more genes are selected than the chart can draw.
    @computed get exceedsPlotGeneCap(): boolean {
        return this.selectedChartGenes.length > MAX_PLOT_GENES;
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
    // The log / swap-axes / violin toggles and the reference-cohort choice now
    // live on the plots store (PatientViewPlotsStore), which persists them to
    // localStorage as one settings blob. Accessed below via this.plotsStore.

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

    // --- Gene-group "labels" ------------------------------------------------
    // Replaces the old Gene Sets dropdown: each gene group is surfaced as a
    // small chip in the table's Labels column, and a header filter narrows the
    // table to chosen labels. Clicking a chip toggles that group's genes on the
    // chart; clicking a gene row toggles that single gene.

    // gene symbol (UPPER) -> ids of the groups that contain it, in chip order
    // (static presets first, then patient-derived dynamic groups). Membership
    // for the dynamic groups is resolved from the patient's own data.
    @computed get labelIdsBySymbolUpper(): { [symUpper: string]: string[] } {
        const out: { [symUpper: string]: string[] } = {};
        const add = (symbol: string, id: string) => {
            const key = symbol.toUpperCase();
            (out[key] = out[key] || []).push(id);
        };
        MRNA_TAB_GENE_GROUPS.forEach(g =>
            g.genes.forEach(sym => add(sym, g.id))
        );
        const dynamic = this.plotsStore.dynamicGroupSymbols;
        MRNA_TAB_PATIENT_GENE_GROUPS.forEach(g =>
            (dynamic[g.id] || []).forEach(sym => add(sym, g.id))
        );
        return out;
    }

    // Whether a group is currently on the chart (its group token is selected).
    private groupIsOnChart(id: string): boolean {
        return this.plotsStore.mrnaTabSelections.includes(
            `${GENE_GROUP_VALUE_PREFIX}${id}`
        );
    }

    // Clicking a label chip toggles that whole group on the chart by
    // adding/removing its `group:<id>` token (PlotsStore expands the token to
    // its constituent genes).
    @action.bound
    toggleGroupOnChart(id: string) {
        const token = `${GENE_GROUP_VALUE_PREFIX}${id}`;
        const current = this.plotsStore.mrnaTabSelections;
        this.plotsStore.setMrnaTabSelections(
            current.includes(token)
                ? current.filter(x => x !== token)
                : [...current, token]
        );
    }

    // Clicking a gene row toggles that single gene's symbol token on the chart.
    @action.bound
    toggleGeneOnChart(symbol: string) {
        const current = this.plotsStore.mrnaTabSelections;
        if (current.includes(symbol)) {
            this.plotsStore.setMrnaTabSelections(
                current.filter(x => x !== symbol)
            );
        } else {
            this.plotsStore.setMrnaTabSelections([...current, symbol]);
        }
    }

    // A single GitHub-style label chip. Solid (white text) when the group is on
    // the chart, outlined otherwise. Clicking toggles the group on the chart
    // (stopPropagation so it doesn't also fire the row's gene toggle).
    private renderLabelChip(id: string): JSX.Element | null {
        const meta = getGeneGroupLabelMeta(id);
        if (!meta) return null;
        return (
            <DefaultTooltip
                key={id}
                placement="top"
                mouseEnterDelay={0.2}
                overlay={<span>{meta.label} — click to add/remove on chart</span>}
            >
                <span
                    onClick={e => {
                        e.stopPropagation();
                        this.toggleGroupOnChart(id);
                    }}
                    style={{
                        display: 'inline-block',
                        padding: '0 5px',
                        marginRight: 3,
                        borderRadius: 8,
                        fontSize: 9,
                        fontWeight: 'bold',
                        lineHeight: '14px',
                        letterSpacing: 0.3,
                        cursor: 'pointer',
                        border: `1px solid ${meta.color}`,
                        backgroundColor: meta.color,
                        color: '#fff',
                        whiteSpace: 'nowrap',
                    }}
                >
                    {meta.abbrev}
                </span>
            </DefaultTooltip>
        );
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
        // Based on the full selection (not the drawn slice), so a gene that is
        // selected but beyond the plot cap still shows as "Remove" in the table.
        return new Set(this.selectedChartGenes.map(g => g.entrezGeneId));
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
    @computed get expressionTableRows(): ExpressionTableRow[] {
        const sampleIds = new Set(this.expressionTableSampleIds);
        const byGene: {
            [entrezGeneId: number]: { [sampleId: string]: number };
        } = {};
        this.plotsStore.patientSamplesExpression.result.forEach(d => {
            if (!sampleIds.has(d.sampleId) || isNaN(d.value)) return;
            (byGene[d.entrezGeneId] =
                byGene[d.entrezGeneId] || {})[d.sampleId] = d.value;
        });
        const oncoFilter = this.plotsStore.applyOncoGeneFilter;
        const oncoSet = this.plotsStore.oncokbGeneSymbolSet;
        const labelsBySymbol = this.labelIdsBySymbolUpper;
        const rows = Object.keys(byGene)
            .map(k => {
                const entrezGeneId = Number(k);
                const gene = this.plotsStore.allGenesByEntrezId[entrezGeneId];
                const symbol =
                    (gene && gene.hugoGeneSymbol) || `${entrezGeneId}`;
                return {
                    entrezGeneId,
                    symbol,
                    values: byGene[entrezGeneId],
                    labelIds: labelsBySymbol[symbol.toUpperCase()] || [],
                };
            })
            // Restrict to OncoKB cancer genes when the filter is on (and loaded).
            .filter(r => !oncoFilter || oncoSet.has(r.symbol.toUpperCase()))
            // Only genes that belong to at least one labeled gene group appear
            // in the table (the Labels column is the way you interact with the
            // chart, so an unlabeled gene has nothing to show or click).
            .filter(r => r.labelIds.length > 0);
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

    // TEMP DEBUG: stage-by-stage counts for why the expression table may come
    // up empty on a given study. Surfaced in renderExpressionTable's empty
    // branch. Remove once the empty-table cause is understood.
    @computed get expressionTableDiagnostics(): { [k: string]: any } {
        const sampleIdSet = new Set(this.expressionTableSampleIds);
        const raw = this.plotsStore.patientSamplesExpression.result;
        const byGene: { [id: number]: boolean } = {};
        let inSampleValues = 0;
        raw.forEach(d => {
            if (sampleIdSet.has(d.sampleId) && !isNaN(d.value)) {
                byGene[d.entrezGeneId] = true;
                inSampleValues++;
            }
        });
        const labelsBySymbol = this.labelIdsBySymbolUpper;
        let resolvedSymbols = 0;
        let labeledGenes = 0;
        Object.keys(byGene).forEach(k => {
            const gene = this.plotsStore.allGenesByEntrezId[Number(k)];
            const symbol = (gene && gene.hugoGeneSymbol) || `${k}`;
            if (gene && gene.hugoGeneSymbol) resolvedSymbols++;
            if ((labelsBySymbol[symbol.toUpperCase()] || []).length > 0)
                labeledGenes++;
        });
        const profile = this.plotsStore.mrnaExpressionMolecularProfile.result;
        return {
            patientSampleIds: this.expressionTableSampleIds.length,
            patientSamplesExpression_isPending: this.plotsStore
                .patientSamplesExpression.isPending,
            rawExpressionValues: raw.length,
            inSampleValues,
            genesWithData: Object.keys(byGene).length,
            allGenesLoaded: Object.keys(this.plotsStore.allGenesByEntrezId)
                .length,
            resolvedSymbols,
            labelMapSize: Object.keys(labelsBySymbol).length,
            labeledGenes,
            finalRows: this.expressionTableRows.length,
            oncoFilterOn: this.plotsStore.applyOncoGeneFilter,
            profileId: profile && profile.molecularProfileId,
            profileDatatype: profile && profile.datatype,
        };
    }

    // Patient samples that have at least one expression value — the only ones
    // worth a column (the rest are listed in a footnote). Derived from the full
    // row set so the columns stay stable as the table is filtered.
    @computed get expressionTableSamplesWithData(): string[] {
        return this.expressionTableSampleIds.filter(id =>
            this.expressionTableRows.some(r => r.values[id] !== undefined)
        );
    }

    // Column label for a patient sample (uses the sample-manager short label).
    private sampleColumnLabel(id: string): string {
        const sm = this.props.sampleManager;
        return sm ? `Sample ${sm.sampleLabels[id]}` : id;
    }

    // Info icon + tooltip with the gene's OncoKB summary and background, shown
    // next to a gene symbol when OncoKB curates it. Returns null otherwise.
    private renderGeneBackgroundIcon(symbol: string): JSX.Element | null {
        const curated = this.plotsStore.oncokbGeneBySymbol[
            symbol.toUpperCase()
        ];
        if (!curated || (!curated.summary && !curated.background)) {
            return null;
        }
        return (
            <DefaultTooltip
                placement="right"
                mouseEnterDelay={0.2}
                overlay={geneBackgroundOverlay(symbol, curated)}
            >
                <i
                    className="fa fa-info-circle"
                    style={{
                        marginLeft: 5,
                        color: '#888',
                        cursor: 'pointer',
                        fontWeight: 'normal',
                    }}
                />
            </DefaultTooltip>
        );
    }

    // Table columns: a Gene column (filterable, the table's search matches
    // gene symbol) plus one right-aligned value column per sample.
    @computed get expressionTableColumns(): Column<ExpressionTableRow>[] {
        // Keep header labels on a single line (the column widths are fixed, so
        // a wrapped two-line header would misalign with the body rows).
        const noWrapHeader = (name: string) => (
            <span style={{ whiteSpace: 'nowrap' }}>{name}</span>
        );
        const geneCol: Column<ExpressionTableRow> = {
            name: 'Gene',
            width: EXPR_GENE_COL_W,
            headerRender: noWrapHeader,
            render: d => (
                <span style={{ fontWeight: 'bold' }}>
                    {d.symbol}
                    {this.renderGeneBackgroundIcon(d.symbol)}
                </span>
            ),
            sortBy: d => d.symbol,
            filter: (d, _f, filterStringUpper) =>
                !!filterStringUpper &&
                d.symbol.toUpperCase().indexOf(filterStringUpper) > -1,
            download: d => d.symbol,
        };
        // Labels column: GitHub-style chips for the gene groups this gene
        // belongs to. Each chip is clickable (toggles that group on the chart).
        const labelsCol: Column<ExpressionTableRow> = {
            name: 'Labels',
            width: EXPR_LABELS_COL_W,
            headerRender: noWrapHeader,
            render: d => (
                <span style={{ whiteSpace: 'normal', lineHeight: '16px' }}>
                    {d.labelIds.map(id => this.renderLabelChip(id))}
                </span>
            ),
            // Sort by the gene's first (highest-priority) label.
            sortBy: d => d.labelIds[0] || '',
            download: d =>
                d.labelIds
                    .map(id => getGeneGroupLabelMeta(id)?.abbrev || id)
                    .join(', '),
        };
        // Action column: a compact "+" that adds the single gene to the chart,
        // shown as "✓" once it's there (click again to remove).
        const addCol: Column<ExpressionTableRow> = {
            name: '',
            width: EXPR_ADD_COL_W,
            render: d => {
                const onChart = this.chartGeneEntrezIdSet.has(d.entrezGeneId);
                return (
                    <button
                        className="btn btn-default btn-xs"
                        title={
                            onChart ? 'On chart — click to remove' : 'Add to chart'
                        }
                        onClick={e => {
                            e.stopPropagation();
                            this.toggleGeneOnChart(d.symbol);
                        }}
                    >
                        <i
                            className={
                                onChart ? 'fa fa-check' : 'fa fa-plus'
                            }
                            style={{ fontSize: 10 }}
                        />
                    </button>
                );
            },
            sortBy: d =>
                this.chartGeneEntrezIdSet.has(d.entrezGeneId) ? 0 : 1,
            download: () => '',
        };
        const sampleCols = this.expressionTableSamplesWithData.map(
            (id): Column<ExpressionTableRow> => ({
                name: this.sampleColumnLabel(id),
                width: EXPR_SAMPLE_COL_W,
                align: 'right',
                headerRender: noWrapHeader,
                render: d => (
                    <span style={{ fontVariantNumeric: 'tabular-nums' }}>
                        {d.values[id] === undefined
                            ? '—'
                            : d.values[id].toFixed(2)}
                    </span>
                ),
                sortBy: d => (d.values[id] === undefined ? null : d.values[id]),
                download: d =>
                    d.values[id] === undefined ? '' : `${d.values[id]}`,
            })
        );
        return [addCol, geneCol, labelsCol, ...sampleCols];
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
        return this.plotsStore.logScale && this.canRenderLog;
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
            // Whiskers extend to the most extreme in-fence value on each side;
            // the fallback is the corresponding extreme of the data.
            const whiskerLow = sorted.find(v => v >= lowFence) ?? sorted[0];
            const whiskerHigh =
                [...sorted].reverse().find(v => v <= highFence) ??
                sorted[sorted.length - 1];
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
        const swap = this.plotsStore.swapAxes;
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
        const swap = this.plotsStore.swapAxes;
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

    // Per-gene violin shapes: a kernel-density estimate of the cohort's
    // (log/linear-transformed) expression, drawn as a mirrored, filled outline
    // centered on each gene's row. Each violin is normalized to the same max
    // half-width so genes are visually comparable. Computed in the same
    // (value, category) space as boxLines so it honors the log scale and the
    // swap-axes toggle.
    @computed get violinShapes(): JSX.Element[] {
        const swap = this.plotsStore.swapAxes;
        const VIOLIN_HALF = 0.42; // max half-width of a violin, in category units
        const GRID = 48; // density samples across the value range
        const xy = (valueCoord: number, categoryCoord: number) =>
            swap
                ? { x: categoryCoord, y: valueCoord }
                : { x: valueCoord, y: categoryCoord };
        const transform = (v: number) =>
            this.useLog ? Math.log10(Math.max(v, this.logFloor)) : v;
        const invTransform = (t: number) => (this.useLog ? Math.pow(10, t) : t);
        const [tLo, tHi] = [
            transform(this.valueDomain[0]),
            transform(this.valueDomain[1]),
        ];
        const els: JSX.Element[] = [];
        this.genes.forEach((gene, i) => {
            const row = i + 1;
            const stats = this.geneCohortStats[gene.entrezGeneId];
            const all = stats && stats.sortedTransformed;
            if (!all || all.length < 5) {
                return;
            }
            // Subsample very large cohorts — the density estimate is stable on
            // a sample and this keeps the per-render cost bounded.
            const vals =
                all.length > 1500
                    ? all.filter(
                          (_v, idx) => idx % Math.ceil(all.length / 1500) === 0
                      )
                    : all;
            const n = vals.length;
            // Silverman's rule-of-thumb bandwidth (robust to outliers via IQR).
            const spread = Math.min(
                stdDev(vals) || Infinity,
                (quantileSorted(vals, 0.75) - quantileSorted(vals, 0.25)) /
                    1.34 || Infinity
            );
            const h =
                !isFinite(spread) || spread === 0
                    ? (vals[n - 1] - vals[0]) / 10 || 1
                    : 0.9 * spread * Math.pow(n, -1 / 5);
            if (!(h > 0)) {
                return;
            }
            const lo = Math.max(vals[0] - 3 * h, tLo);
            const hi = Math.min(vals[n - 1] + 3 * h, tHi);
            if (!(hi > lo)) {
                return;
            }
            const grid: number[] = [];
            for (let k = 0; k < GRID; k++) {
                grid.push(lo + ((hi - lo) * k) / (GRID - 1));
            }
            const dens = gaussianKde(vals, grid, h);
            const maxD = Math.max(...dens) || 1;
            const half = dens.map(d => (d / maxD) * VIOLIN_HALF);
            const style = {
                data: {
                    fill: '#bdbdbd',
                    fillOpacity: 0.5,
                    stroke: '#8a8a8a',
                    strokeWidth: 0.75,
                },
            };
            if (!swap) {
                // Default orientation: value on x. VictoryArea fills between the
                // upper (y) and lower (y0) density curves around the gene's row
                // — a smooth, properly filled horizontal violin.
                const data = grid.map((t, k) => ({
                    x: invTransform(t),
                    y: row + half[k],
                    y0: row - half[k],
                }));
                els.push(
                    <VictoryArea
                        key={`violin${row}`}
                        data={data}
                        interpolation="natural"
                        style={style}
                    />
                );
            } else {
                // Swapped: value on y. VictoryArea can't fill along y, so trace
                // the mirrored outline as a single filled SVG path (ViolinShape
                // keeps the point order; VictoryLine would reorder by x).
                const pts: IPoint[] = [];
                grid.forEach((t, k) => {
                    pts.push(xy(invTransform(t), row + half[k]));
                });
                for (let k = grid.length - 1; k >= 0; k--) {
                    pts.push(xy(invTransform(grid[k]), row - half[k]));
                }
                els.push(
                    <ViolinShape
                        key={`violin${row}`}
                        points={pts}
                        style={style.data}
                    />
                );
            }
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

    // SVG/PDF download filename. The cohort name is a display string (study
    // name or filter labels) that often contains spaces, slashes, and
    // parentheses, so slugify it to keep the filename clean and valid; fall
    // back to the study id if nothing usable remains.
    @computed get exportFileName(): string {
        const slug = this.cohortName
            .replace(/[^a-z0-9]+/gi, '_')
            .replace(/^_+|_+$/g, '');
        return `mrna_expression_${slug || this.props.store.studyId}`;
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
                {this.renderCohortSummaryBar()}
                {this.isMrnaDataPending ? (
                    <div style={{ marginTop: 16 }}>
                        <LoadingIndicator isLoading={true} size="big" center />
                    </div>
                ) : (
                    <>
                        <div
                            style={{
                                display: 'flex',
                                gap: 24,
                                alignItems: 'flex-start',
                                marginTop: 16,
                                // Don't set overflowX here: per CSS, a
                                // non-visible overflow on one axis forces the
                                // other to compute to 'auto', which would turn
                                // this row into a vertical clipping box and cut
                                // off the chart's bottom axis. The chart
                                // (ChartContainer) and the table each scroll
                                // horizontally on their own.
                            }}
                        >
                            {this.renderExpressionTable()}
                            <div
                                style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'flex-start',
                                }}
                            >
                                {this.renderPlotGeneCapMessage()}
                                {this.renderChart()}
                            </div>
                        </div>
                    </>
                )}
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

    // All data the chart and the table need. We await all of it before
    // rendering either, so we never show a placeholder sized from a guessed
    // column count (the table's columns depend on which samples have data,
    // which isn't known until the expression results arrive).
    @computed get isMrnaDataPending(): boolean {
        return (
            this.plotsStore.patientSamplesExpression.isPending ||
            this.plotsStore.mrnaExpressionDataForGenes.isPending ||
            this.plotsStore.mrnaTabGenes.isPending ||
            // When the OncoKB filter is on, wait for the curated-gene list so
            // we don't briefly render the unfiltered set, then filter it.
            (this.plotsStore.oncoGenesOnly &&
                this.plotsStore.oncokbCuratedGenes.isPending)
        );
    }

    // A table of every gene with expression data, one column per patient
    // sample, sorted by |value| in the first sample column.
    private renderExpressionTable() {
        const sampleIds = this.expressionTableSampleIds;
        const labelFor = (id: string) => this.sampleColumnLabel(id);
        // Extra room reserved to the right of the fixed-width table for the
        // vertical scrollbar, so it never overlaps the last number column.
        const SCROLLBAR_W = 16;
        const allRows = this.expressionTableRows;
        if (sampleIds.length === 0 || allRows.length === 0) {
            // TEMP DEBUG: instead of silently rendering nothing, show why the
            // table is empty so we can diagnose study-specific failures.
            return (
                <div
                    style={{
                        flexShrink: 0,
                        fontSize: 11,
                        color: '#a00',
                        border: '1px dashed #a00',
                        padding: 8,
                        maxWidth: 360,
                        whiteSpace: 'pre-wrap',
                    }}
                >
                    {'Expression table empty — debug:\n' +
                        JSON.stringify(
                            this.expressionTableDiagnostics,
                            null,
                            2
                        )}
                </div>
            );
        }
        // Show up to MAX_TABLE_ROWS genes with the table sized to fit them all
        // (no internal scrolling). The rest are reachable by sorting/filtering.
        const MAX_TABLE_ROWS = 50;
        const ROW_H = 25;
        const HEADER_H = 25;
        const visibleRows = allRows.slice(0, MAX_TABLE_ROWS);
        const tableHeight = HEADER_H + visibleRows.length * ROW_H;
        const samplesWithData = this.expressionTableSamplesWithData;
        const tableWidth =
            EXPR_GENE_COL_W +
            EXPR_ADD_COL_W +
            EXPR_LABELS_COL_W +
            samplesWithData.length * EXPR_SAMPLE_COL_W;
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
        // Initial sort: the first sample column, highest expression first.
        const firstSampleCol =
            samplesWithData.length > 0
                ? this.sampleColumnLabel(samplesWithData[0])
                : 'Gene';
        return (
            <div
                className={styles.expressionTable}
                style={{
                    flexShrink: 0,
                    width: tableWidth + SCROLLBAR_W,
                    position: 'relative',
                }}
            >
                <FixedHeaderTable<ExpressionTableRow>
                    columns={this.expressionTableColumns}
                    data={visibleRows}
                    width={tableWidth}
                    height={tableHeight}
                    rowHeight={ROW_H}
                    headerHeight={HEADER_H}
                    sortBy={firstSampleCol}
                    sortDirection="desc"
                    numberOfSelectedRows={0}
                    showControlsAtTop={true}
                    extraFooterElements={[
                        <span key="gene-sets" style={{ marginLeft: 'auto' }}>
                            {this.renderGeneSetsButton()}
                        </span>,
                    ]}
                />
                <div style={{ fontSize: 11, color: '#888', marginTop: 6 }}>
                    Showing {visibleRows.length} genes of {allRows.length} with
                    mRNA data.
                    {allRows.length > visibleRows.length &&
                        ' Filter/sort to explore.'}
                </div>
                {noDataMessage && (
                    <div style={{ fontSize: 11, color: '#888', marginTop: 6 }}>
                        {noDataMessage}
                    </div>
                )}
            </div>
        );
    }

    // Label ids that appear on at least one gene in the (unfiltered) table —
    // the only labels worth offering as filter options. Dynamic patient groups
    // with no genes for this patient are thus omitted.
    @computed get presentLabelIds(): string[] {
        const present = new Set<string>();
        this.expressionTableRows.forEach(r =>
            r.labelIds.forEach(id => present.add(id))
        );
        return ALL_GENE_GROUP_LABEL_META.filter(m => present.has(m.id)).map(
            m => m.id
        );
    }

    // "+ gene sets" button + click menu. Each row is a button that toggles a
    // whole gene set (preset or patient-derived) onto the chart; a check marks
    // the sets already plotted.
    private renderGeneSetsButton(): JSX.Element | null {
        const presentIds = this.presentLabelIds;
        if (presentIds.length === 0) {
            return null;
        }
        const overlay = (
            <div style={{ minWidth: 240, padding: '4px 2px' }}>
                {presentIds.map(id => {
                    const meta = getGeneGroupLabelMeta(id)!;
                    const onChart = this.groupIsOnChart(id);
                    return (
                        <div
                            key={id}
                            onClick={() => this.toggleGroupOnChart(id)}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 6,
                                margin: '2px 0',
                                padding: '2px 4px',
                                borderRadius: 3,
                                cursor: 'pointer',
                                backgroundColor: onChart
                                    ? '#eaf5ea'
                                    : 'transparent',
                            }}
                        >
                            <span
                                style={{
                                    display: 'inline-block',
                                    padding: '0 5px',
                                    borderRadius: 8,
                                    fontSize: 9,
                                    fontWeight: 'bold',
                                    lineHeight: '14px',
                                    backgroundColor: meta.color,
                                    color: '#fff',
                                    whiteSpace: 'nowrap',
                                }}
                            >
                                {meta.abbrev}
                            </span>
                            <span style={{ fontSize: 12, flex: 1 }}>
                                {meta.label}
                            </span>
                            <i
                                className={
                                    onChart ? 'fa fa-check' : 'fa fa-plus'
                                }
                                style={{
                                    fontSize: 11,
                                    color: onChart ? '#5aa454' : '#2986cc',
                                }}
                            />
                        </div>
                    );
                })}
            </div>
        );
        return (
            <DefaultTooltip
                trigger={['click']}
                placement="bottomLeft"
                destroyTooltipOnHide={true}
                overlay={overlay}
            >
                <button
                    className="btn btn-default"
                    style={{
                        height: 25,
                        padding: '0 8px',
                        fontSize: 13,
                        lineHeight: '23px',
                        boxSizing: 'border-box',
                    }}
                >
                    <i className="fa fa-plus" style={{ marginRight: 4 }} />
                    Add gene sets to plot
                </button>
            </DefaultTooltip>
        );
    }

    // Banner shown when the user has selected more genes than the chart can
    // draw. The chart plots the first MAX_PLOT_GENES; this explains the rest
    // are omitted and offers a one-click way to trim the selection to the cap.
    private renderPlotGeneCapMessage(): JSX.Element | null {
        if (!this.exceedsPlotGeneCap) {
            return null;
        }
        const total = this.selectedChartGenes.length;
        return (
            <div className="alert alert-warning">
                <i
                    className="fa fa-exclamation-triangle"
                    style={{ marginRight: 6 }}
                />
                {total} genes selected — only the first {MAX_PLOT_GENES} can be
                plotted. Remove some genes or narrow your selection to see the
                rest.
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
                    Use the "Add to plot" button on a gene in the table to plot
                    its expression across the cohort.
                </div>
            );
        }

        const n = this.genes.length;
        const swap = this.plotsStore.swapAxes;
        // Per-gene size along the category axis, the same in both orientations
        // so the row/column spacing — and, since the box/jitter extents are in
        // category units, each gene's box extent — stay compact and identical
        // whether the axes are flipped or not. VALUE_AXIS_SIZE fixes the value
        // axis length in the swapped layout.
        const VALUE_AXIS_SIZE = 520;
        const PER_GENE = 30;
        const chartWidth = swap ? 170 + n * PER_GENE : 720;
        const chartHeight = swap ? VALUE_AXIS_SIZE : 140 + n * PER_GENE;
        // .borderedChart (ChartContainer) adds 10px padding + 1px dashed border
        // on each side. The wrapper below must include this chrome, otherwise
        // the fixed-width SVG overflows ChartContainer's inner scroll div,
        // which adds a horizontal scrollbar that — combined with that div's
        // overflowY:hidden — overlays and clips the bottom x-axis.
        const BORDERED_CHART_CHROME = 22;
        // Non-swapped: the gene names are the left-axis tick labels, so the
        // left padding only needs to fit the longest one (~7px/char at
        // fontSize 12, plus room for the tick mark) — no need for a big fixed
        // gutter. Swapped layout needs more left padding (so the rotated
        // value-axis label clears the tick numbers) and more bottom padding (so
        // the angled gene tick labels fit beneath the axis without overlapping).
        const maxGeneLabelLen = this.genes.reduce(
            (m, g) => Math.max(m, g.symbol.length),
            0
        );
        const geneAxisPad = Math.min(140, Math.max(50, maxGeneLabelLen * 7 + 16));
        const padding = swap
            ? { top: 30, bottom: 110, left: 90, right: 25 }
            : { top: 20, bottom: 80, left: geneAxisPad, right: 25 };
        const valueLabel = profile.name;
        const valueScale = this.useLog ? 'log' : 'linear';
        const categoryDomain: [number, number] = [0, n + 0.5];
        const categoryTickValues = this.genes.map((g, i) => i + 1);
        const categoryTickFormat = this.genes.map(g => g.symbol);
        // GeneTickLabel renders the gene symbol and, when OncoKB curates the
        // gene, shows its summary/background on hover.
        const oncokbGeneBySymbol = this.plotsStore.oncokbGeneBySymbol;
        const categoryTickLabel = (
            <GeneTickLabel
                style={{ fontSize: 12, fill: '#333' } as any}
                oncokbGeneBySymbol={oncokbGeneBySymbol}
            />
        );
        // Swapped layout: the gene labels are the angled -45° x-axis labels.
        // Nudge them left (dx) so the end of each label lines up with its tick
        // — the rotated-baseline padding otherwise drifts the label's end to
        // the right of the tick.
        const categoryTickLabelSwap = (
            <GeneTickLabel
                style={{ fontSize: 12, fill: '#333' } as any}
                dx={-8}
                oncokbGeneBySymbol={oncokbGeneBySymbol}
            />
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
                  tickLabelComponent: categoryTickLabelSwap,
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
                exportFileName={this.exportFileName}
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
                                this.plotsStore.setLogScale(e.target.checked)
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
                            checked={this.plotsStore.swapAxes}
                            onChange={e =>
                                this.plotsStore.setSwapAxes(e.target.checked)
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
                        title="Show the cohort distribution as a violin (kernel density) instead of a scatter cloud"
                    >
                        <input
                            type="checkbox"
                            checked={this.plotsStore.violin}
                            onChange={e =>
                                this.plotsStore.setViolin(e.target.checked)
                            }
                            style={{ marginRight: 6 }}
                        />
                        Violin
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
                        <VictoryContainer
                            containerRef={this.setSvgContainer}
                            responsive={false}
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
                    {/* violin (KDE) sits at the bottom in violin mode */}
                    {this.plotsStore.violin ? this.violinShapes : null}
                    {/* box drawn here so it sits under the scatter cloud (and
                        over the violin fill) */}
                    {this.boxLines}
                    {/* scatter cloud on top of the box in scatter mode */}
                    {this.plotsStore.violin ? null : (
                        <VictoryScatter
                            data={this.cohortPoints}
                            size={2}
                            style={{
                                data: { fill: '#7e7e7e', fillOpacity: 0.25 },
                            }}
                        />
                    )}
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
