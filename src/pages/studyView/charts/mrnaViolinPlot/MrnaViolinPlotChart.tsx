import * as React from 'react';
import { observer } from 'mobx-react';
import { action, computed, makeObservable, observable } from 'mobx';
import { remoteData } from 'cbioportal-frontend-commons';
import { StudyViewPageStore } from 'pages/studyView/StudyViewPageStore';
import { getClient } from 'shared/api/cbioportalClientInstance';
import LoadingIndicator from 'shared/components/loadingIndicator/LoadingIndicator';
import _ from 'lodash';
import { Gene, MolecularProfile } from 'cbioportal-ts-api-client';
import { DataTypeConstants } from 'shared/constants';
import { MRNA_TAB_GENE_GROUPS } from 'pages/patientView/mrna/mrnaTabGeneGroups';

const MSK_TRIAL_GENES: string[] = MRNA_TAB_GENE_GROUPS.find(
    g => g.id === 'msk-trial'
)!.genes;

const DEFAULT_GENE_COUNT = 10;
const MAX_GENES = 10;
const MAX_SAMPLES = 1000;
const KDE_POINTS = 80;
const TOOLBAR_HEIGHT = 34;

// Profile datatype preference order for multi-profile studies.
const SCALED_DATATYPE_PRIORITY = [
    DataTypeConstants.ZSCORE,
    DataTypeConstants.LOG2VALUE,
    DataTypeConstants.LOGVALUE,
];

function pickBestMrnaProfile(profiles: MolecularProfile[]): MolecularProfile {
    for (const dt of SCALED_DATATYPE_PRIORITY) {
        const m = profiles.find(p => p.datatype === dt);
        if (m) return m;
    }
    // Belt-and-suspenders: profile ID pattern fallback (TCGA naming)
    return (
        profiles.find(p => /zscores?$/i.test(p.molecularProfileId)) ??
        profiles.find(p => /log[\d_]/i.test(p.molecularProfileId)) ??
        profiles[0]
    );
}

function gaussianKernel(u: number): number {
    return Math.exp(-0.5 * u * u) / Math.sqrt(2 * Math.PI);
}

/**
 * Gaussian KDE. Bandwidth = max(Silverman's rule, 5% of data range)
 * so concentrated distributions still produce a visible violin.
 */
function computeKDE(data: number[], nPoints: number): Array<[number, number]> {
    if (data.length < 2) return [];
    const min = Math.min(...data);
    const max = Math.max(...data);
    if (min === max) return [];
    const mean = data.reduce((s, v) => s + v, 0) / data.length;
    const std = Math.sqrt(
        data.reduce((s, v) => s + (v - mean) ** 2, 0) / data.length
    );
    const silverman = std === 0 ? 1 : 1.06 * std * Math.pow(data.length, -0.2);
    const bw = Math.max(silverman, (max - min) * 0.05);
    const step = (max - min) / (nPoints - 1);
    return Array.from({ length: nPoints }, (_, i) => {
        const x = min + i * step;
        const density =
            data.reduce((s, xi) => s + gaussianKernel((x - xi) / bw), 0) /
            (data.length * bw);
        return [x, density] as [number, number];
    });
}

interface BoxStats {
    q1: number;
    median: number;
    q3: number;
    whiskerLow: number;
    whiskerHigh: number;
}

function computeBoxStats(data: number[]): BoxStats {
    const sorted = [...data].sort((a, b) => a - b);
    const n = sorted.length;
    const q1 = sorted[Math.floor(n * 0.25)];
    const q3 = sorted[Math.floor(n * 0.75)];
    const median =
        n % 2 === 0
            ? (sorted[n / 2 - 1] + sorted[n / 2]) / 2
            : sorted[Math.floor(n / 2)];
    const iqr = q3 - q1;
    return {
        q1,
        q3,
        median,
        whiskerLow: Math.max(sorted[0], q1 - 1.5 * iqr),
        whiskerHigh: Math.min(sorted[n - 1], q3 + 1.5 * iqr),
    };
}

export interface IMrnaViolinPlotChartProps {
    store: StudyViewPageStore;
    width: number;
    height: number;
}

@observer
export default class MrnaViolinPlotChart extends React.Component<
    IMrnaViolinPlotChartProps,
    {}
> {
    @observable selectedSymbols: string[] = MSK_TRIAL_GENES.slice(
        0,
        DEFAULT_GENE_COUNT
    );
    @observable logScale = false;
    @observable showGenePicker = false;

    constructor(props: IMrnaViolinPlotChartProps) {
        super(props);
        makeObservable(this);
    }

    /** Resolve selected Hugo symbols → Gene objects (entrezGeneId). */
    readonly resolvedGenes = remoteData<Gene[]>({
        invoke: async () => {
            const symbols = this.selectedSymbols.slice(); // access observable to track it
            return getClient().fetchGenesUsingPOST({
                geneIdType: 'HUGO_GENE_SYMBOL',
                geneIds: symbols,
            });
        },
        default: [],
    });

    readonly mrnaData = remoteData<{
        profilesUsed: MolecularProfile[];
        sampleCount: number;
        /** Ordered list matching the user's gene selection. */
        genes: Array<{ hugoSymbol: string; entrezGeneId: number }>;
        /** Raw API values (no transform), keyed by entrezGeneId. */
        byGene: { [entrezGeneId: number]: number[] };
    }>({
        await: () => [
            this.props.store.molecularProfiles,
            this.props.store.selectedSamples,
            this.resolvedGenes,
        ],
        invoke: async () => {
            const allMrnaProfiles = this.props.store.molecularProfiles.result!.filter(
                p => p.molecularAlterationType === 'MRNA_EXPRESSION'
            );

            console.info(
                '[MrnaViolinPlotChart] Available mRNA profiles:',
                allMrnaProfiles.map(
                    p => `${p.molecularProfileId} (${p.datatype})`
                )
            );

            if (allMrnaProfiles.length === 0) {
                return {
                    profilesUsed: [],
                    sampleCount: 0,
                    genes: [],
                    byGene: {},
                };
            }

            const rawGenes = this.resolvedGenes.result!;
            const geneMap = _.keyBy(rawGenes, g =>
                g.hugoGeneSymbol.toUpperCase()
            );
            const genes = this.selectedSymbols
                .map(s => {
                    const g = geneMap[s.toUpperCase()];
                    return g
                        ? {
                              hugoSymbol: g.hugoGeneSymbol,
                              entrezGeneId: g.entrezGeneId,
                          }
                        : null;
                })
                .filter(Boolean) as Array<{
                hugoSymbol: string;
                entrezGeneId: number;
            }>;

            const samples = this.props.store.selectedSamples.result!;
            const samplesSubset = samples.slice(0, MAX_SAMPLES);

            const profilesByStudy = _.groupBy(allMrnaProfiles, p => p.studyId);
            const chosenProfileByStudy: {
                [studyId: string]: MolecularProfile;
            } = {};
            for (const [studyId, profiles] of Object.entries(profilesByStudy)) {
                chosenProfileByStudy[studyId] = pickBestMrnaProfile(profiles);
            }

            const sampleMolecularIdentifiers = samplesSubset.flatMap(sample => {
                const profile = chosenProfileByStudy[sample.studyId];
                if (!profile) return [];
                return [
                    {
                        molecularProfileId: profile.molecularProfileId,
                        sampleId: sample.sampleId,
                    },
                ];
            });

            if (sampleMolecularIdentifiers.length === 0) {
                return { profilesUsed: [], sampleCount: 0, genes, byGene: {} };
            }

            const profilesUsed = Object.values(chosenProfileByStudy);
            console.info(
                '[MrnaViolinPlotChart] Using profiles:',
                profilesUsed.map(p => `${p.name} (${p.datatype})`)
            );

            const data = await getClient().fetchMolecularDataInMultipleMolecularProfilesUsingPOST(
                {
                    molecularDataMultipleStudyFilter: {
                        entrezGeneIds: genes.map(g => g.entrezGeneId),
                        sampleMolecularIdentifiers,
                    } as any,
                }
            );

            const byGene: { [entrezGeneId: number]: number[] } = {};
            for (const d of data) {
                if (!byGene[d.entrezGeneId]) byGene[d.entrezGeneId] = [];
                byGene[d.entrezGeneId].push(d.value);
            }

            console.info(
                '[MrnaViolinPlotChart] Value ranges per gene:',
                genes.map(g => {
                    const vals = byGene[g.entrezGeneId] || [];
                    if (!vals.length) return `${g.hugoSymbol}: no data`;
                    return `${g.hugoSymbol}: [${Math.min(...vals).toFixed(
                        2
                    )}, ${Math.max(...vals).toFixed(2)}] n=${vals.length}`;
                })
            );

            return {
                profilesUsed,
                sampleCount: sampleMolecularIdentifiers.length,
                genes,
                byGene,
            };
        },
        onError: (e: Error) => {
            console.error('[MrnaViolinPlotChart] fetch error', e);
        },
        default: { profilesUsed: [], sampleCount: 0, genes: [], byGene: {} },
    });

    /**
     * Log scale is valid as long as no values are negative.
     * Zeros are fine because the transform is log₂(x+1), which maps 0 → 0.
     */
    @computed get canLogScale(): boolean {
        if (!this.mrnaData.isComplete) return false;
        for (const vals of Object.values(this.mrnaData.result!.byGene)) {
            if ((vals as number[]).some(v => v < 0)) return false;
        }
        return Object.keys(this.mrnaData.result!.byGene).length > 0;
    }

    /** Values with optional log₂(x+1) transform for display. */
    @computed get displayByGene(): { [entrezGeneId: number]: number[] } {
        if (!this.mrnaData.isComplete) return {};
        const raw = this.mrnaData.result!.byGene;
        if (!this.logScale || !this.canLogScale) return raw;
        const out: { [entrezGeneId: number]: number[] } = {};
        for (const [id, vals] of Object.entries(raw)) {
            out[Number(id)] = (vals as number[]).map(v => Math.log2(v + 1));
        }
        return out;
    }

    @computed get currentGenes(): Array<{
        hugoSymbol: string;
        entrezGeneId: number;
    }> {
        return this.mrnaData.result?.genes ?? [];
    }

    @computed get layout() {
        const marginLeft = 68;
        const marginRight = 16;
        const marginTop = 38;
        const marginBottom = 6;
        const svgHeight = this.props.height - TOOLBAR_HEIGHT;
        const plotW = this.props.width - marginLeft - marginRight;
        const plotH = svgHeight - marginTop - marginBottom;
        const rowH =
            this.currentGenes.length > 0
                ? plotH / this.currentGenes.length
                : plotH / DEFAULT_GENE_COUNT;
        return {
            marginLeft,
            marginRight,
            marginTop,
            marginBottom,
            plotW,
            plotH,
            rowH,
            svgHeight,
        };
    }

    /** 1st–99th percentile range across all genes, to avoid outlier collapse. */
    @computed get globalValueRange(): { min: number; max: number } | null {
        const byGene = this.displayByGene;
        const allVals: number[] = [];
        for (const gene of this.currentGenes) {
            (byGene[gene.entrezGeneId] || []).forEach(v => allVals.push(v));
        }
        if (allVals.length === 0) return null;
        const sorted = [...allVals].sort((a, b) => a - b);
        return {
            min: sorted[Math.floor(sorted.length * 0.01)],
            max: sorted[Math.floor(sorted.length * 0.99)],
        };
    }

    private xScale(value: number): number {
        const range = this.globalValueRange!;
        const { plotW } = this.layout;
        const clamped = Math.min(Math.max(value, range.min), range.max);
        return ((clamped - range.min) / (range.max - range.min)) * plotW;
    }

    @action.bound
    private toggleGene(symbol: string) {
        if (this.selectedSymbols.includes(symbol)) {
            if (this.selectedSymbols.length > 1) {
                this.selectedSymbols = this.selectedSymbols.filter(
                    s => s !== symbol
                );
            }
        } else if (this.selectedSymbols.length < MAX_GENES) {
            this.selectedSymbols = [...this.selectedSymbols, symbol];
        }
    }

    private renderGeneRow(
        gene: { hugoSymbol: string; entrezGeneId: number },
        rowIndex: number
    ): JSX.Element | null {
        const values = this.displayByGene[gene.entrezGeneId] || [];
        const { rowH } = this.layout;
        const centerY = rowH * (rowIndex + 0.5);
        const violinHalfH = rowH * 0.44;
        const boxHalfH = rowH * 0.14;

        if (values.length === 0) {
            return (
                <text
                    key={gene.hugoSymbol}
                    x={this.layout.plotW / 2}
                    y={centerY + 4}
                    textAnchor="middle"
                    fill="#999"
                    fontSize={10}
                >
                    no data
                </text>
            );
        }

        const kdePoints = computeKDE(values, KDE_POINTS);
        const maxDensity =
            kdePoints.length > 0 ? Math.max(...kdePoints.map(p => p[1])) : 1;

        let violinPath = '';
        if (kdePoints.length >= 2 && maxDensity > 0) {
            const scale = violinHalfH / maxDensity;
            const upperPts = kdePoints
                .map(
                    ([x, d]) =>
                        `${this.xScale(x).toFixed(1)},${(
                            centerY -
                            d * scale
                        ).toFixed(1)}`
                )
                .join(' ');
            const lowerPts = [...kdePoints]
                .reverse()
                .map(
                    ([x, d]) =>
                        `${this.xScale(x).toFixed(1)},${(
                            centerY +
                            d * scale
                        ).toFixed(1)}`
                )
                .join(' ');
            violinPath = `M ${upperPts} L ${lowerPts} Z`;
        }

        const box = computeBoxStats(values);
        const x1 = this.xScale(box.q1);
        const x3 = this.xScale(box.q3);
        const xMed = this.xScale(box.median);
        const xWL = this.xScale(box.whiskerLow);
        const xWH = this.xScale(box.whiskerHigh);

        return (
            <g key={gene.hugoSymbol}>
                {violinPath && (
                    <path
                        d={violinPath}
                        fill="#4a90d9"
                        fillOpacity={0.55}
                        stroke="#2a6aad"
                        strokeWidth={0.5}
                    />
                )}
                <line
                    x1={xWL}
                    x2={xWH}
                    y1={centerY}
                    y2={centerY}
                    stroke="#333"
                    strokeWidth={1}
                />
                <line
                    x1={xWL}
                    x2={xWL}
                    y1={centerY - boxHalfH}
                    y2={centerY + boxHalfH}
                    stroke="#333"
                    strokeWidth={1}
                />
                <line
                    x1={xWH}
                    x2={xWH}
                    y1={centerY - boxHalfH}
                    y2={centerY + boxHalfH}
                    stroke="#333"
                    strokeWidth={1}
                />
                <rect
                    x={x1}
                    y={centerY - boxHalfH}
                    width={Math.max(x3 - x1, 1)}
                    height={boxHalfH * 2}
                    fill="#fff"
                    fillOpacity={0.75}
                    stroke="#333"
                    strokeWidth={0.8}
                />
                <line
                    x1={xMed}
                    x2={xMed}
                    y1={centerY - boxHalfH}
                    y2={centerY + boxHalfH}
                    stroke="#e63b3b"
                    strokeWidth={1.5}
                />
            </g>
        );
    }

    private renderXAxis(): JSX.Element {
        const range = this.globalValueRange;
        if (!range) return <g />;
        const { plotW } = this.layout;
        const nTicks = 5;
        const ticks = Array.from({ length: nTicks }, (_, i) => {
            const val =
                range.min + ((range.max - range.min) * i) / (nTicks - 1);
            return {
                val,
                x: ((val - range.min) / (range.max - range.min)) * plotW,
            };
        });
        const result = this.mrnaData.result!;
        const profileName = result.profilesUsed[0]?.name ?? 'mRNA Expression';
        const axisLabel =
            this.logScale && this.canLogScale
                ? `log₂(${profileName}+1)`
                : profileName;
        return (
            <g transform={`translate(0, 0)`}>
                <line
                    x1={0}
                    x2={plotW}
                    y1={0}
                    y2={0}
                    stroke="#aaa"
                    strokeWidth={1}
                />
                {ticks.map(t => (
                    <g key={t.val} transform={`translate(${t.x}, 0)`}>
                        <line
                            x1={0}
                            x2={0}
                            y1={0}
                            y2={-4}
                            stroke="#aaa"
                            strokeWidth={1}
                        />
                        <text
                            x={0}
                            y={-7}
                            textAnchor="middle"
                            fontSize={9}
                            fill="#555"
                        >
                            {t.val.toFixed(1)}
                        </text>
                    </g>
                ))}
                <text
                    x={plotW / 2}
                    y={-20}
                    textAnchor="middle"
                    fontSize={10}
                    fill="#333"
                >
                    {axisLabel}
                </text>
            </g>
        );
    }

    private renderRowSeparators(): JSX.Element {
        const { plotW, rowH } = this.layout;
        return (
            <g>
                {this.currentGenes.map((_, i) => (
                    <line
                        key={i}
                        x1={0}
                        x2={plotW}
                        y1={rowH * i}
                        y2={rowH * i}
                        stroke="#eee"
                        strokeWidth={1}
                    />
                ))}
            </g>
        );
    }

    private renderYLabels(): JSX.Element {
        const { marginTop, rowH } = this.layout;
        return (
            <g>
                {this.currentGenes.map((gene, i) => (
                    <text
                        key={gene.hugoSymbol}
                        x={4}
                        y={marginTop + rowH * (i + 0.5) + 4}
                        textAnchor="start"
                        fontSize={11}
                        fontStyle="normal"
                        fill="#333"
                    >
                        {gene.hugoSymbol}
                    </text>
                ))}
            </g>
        );
    }

    private renderGenePicker(): JSX.Element {
        const { selectedSymbols } = this;
        const atMax = selectedSymbols.length >= MAX_GENES;
        return (
            <div
                style={{
                    position: 'absolute',
                    top: TOOLBAR_HEIGHT,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: '#fff',
                    borderTop: '1px solid #ccc',
                    zIndex: 2,
                    overflowY: 'auto',
                    padding: '6px 8px',
                }}
            >
                <div
                    style={{
                        fontSize: 11,
                        color: '#666',
                        marginBottom: 4,
                    }}
                >
                    Select up to {MAX_GENES} genes &mdash; ADC targets in trial
                    at MSK
                    {atMax && (
                        <span style={{ color: '#c00', marginLeft: 6 }}>
                            (max reached)
                        </span>
                    )}
                </div>
                <div style={{ columnCount: 2, columnGap: 8 }}>
                    {MSK_TRIAL_GENES.map(symbol => {
                        const checked = selectedSymbols.includes(symbol);
                        const disabled = !checked && atMax;
                        return (
                            <label
                                key={symbol}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 4,
                                    fontSize: 11,
                                    cursor: disabled
                                        ? 'not-allowed'
                                        : 'pointer',
                                    color: disabled ? '#aaa' : '#333',
                                    padding: '1px 0',
                                    breakInside: 'avoid',
                                }}
                            >
                                <input
                                    type="checkbox"
                                    checked={checked}
                                    disabled={disabled}
                                    onChange={() => this.toggleGene(symbol)}
                                    style={{ margin: 0 }}
                                />
                                <span>{symbol}</span>
                            </label>
                        );
                    })}
                </div>
            </div>
        );
    }

    render() {
        const { width, height } = this.props;
        const { marginLeft, marginTop, svgHeight } = this.layout;

        const isPending =
            this.mrnaData.isPending || this.resolvedGenes.isPending;
        const isError = this.mrnaData.isError;
        const hasData = !isPending && !isError && !!this.globalValueRange;

        let bodyContent: JSX.Element;
        if (isPending) {
            bodyContent = (
                <div
                    style={{
                        flex: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                >
                    <LoadingIndicator isLoading={true} size={'big'} />
                </div>
            );
        } else if (isError || !hasData) {
            bodyContent = (
                <div
                    style={{
                        flex: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#888',
                        fontSize: 12,
                    }}
                >
                    {isError
                        ? 'Error loading mRNA data.'
                        : 'No mRNA expression data available for this study.'}
                </div>
            );
        } else {
            bodyContent = (
                <svg
                    width={width}
                    height={svgHeight}
                    style={{ display: 'block' }}
                >
                    {this.renderYLabels()}
                    <g transform={`translate(${marginLeft}, ${marginTop})`}>
                        {this.currentGenes.map((gene, i) =>
                            this.renderGeneRow(gene, i)
                        )}
                        {this.renderXAxis()}
                    </g>
                </svg>
            );
        }

        return (
            <div
                style={{
                    width,
                    height,
                    display: 'flex',
                    flexDirection: 'column',
                    position: 'relative',
                    isolation: 'isolate',
                }}
            >
                <div
                    style={{
                        height: TOOLBAR_HEIGHT,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                        padding: '0 8px',
                        borderBottom: '1px solid #eee',
                        fontSize: 11,
                        flexShrink: 0,
                        background: '#fff',
                        position: 'relative',
                        zIndex: 3,
                    }}
                >
                    <label
                        style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                            cursor: this.canLogScale
                                ? 'pointer'
                                : 'not-allowed',
                            color: this.canLogScale ? '#333' : '#999',
                            fontWeight: 'normal',
                            margin: 0,
                        }}
                        title={
                            this.canLogScale
                                ? 'Toggle between log₂ and linear value axis'
                                : 'Linear only — data contains negative values'
                        }
                    >
                        <input
                            type="checkbox"
                            checked={this.logScale && this.canLogScale}
                            disabled={!this.canLogScale}
                            onChange={action(
                                (e: React.ChangeEvent<HTMLInputElement>) => {
                                    this.logScale = e.target.checked;
                                }
                            )}
                            style={{ margin: 0 }}
                        />
                        Log scale
                    </label>
                    <button
                        onClick={action(() => {
                            this.showGenePicker = !this.showGenePicker;
                        })}
                        style={{
                            fontSize: 11,
                            padding: '2px 7px',
                            border: '1px solid #ccc',
                            borderRadius: 3,
                            background: this.showGenePicker
                                ? '#e8f0fc'
                                : '#f5f5f5',
                            cursor: 'pointer',
                        }}
                    >
                        Genes ({this.selectedSymbols.length}) ▾
                    </button>
                </div>
                {bodyContent}
                {this.showGenePicker && this.renderGenePicker()}
            </div>
        );
    }
}
