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
import {
    MRNA_TAB_GENE_GROUPS,
    STUDY_VIEW_DEFAULT_GENE_SPECIFIC_VIOLIN_GROUP_ID,
} from 'pages/patientView/mrna/mrnaTabGeneGroups';
import { getSuffixOfMolecularProfile } from 'shared/lib/molecularProfileUtils';

const DEFAULT_GENE_GROUP =
    MRNA_TAB_GENE_GROUPS.find(
        g => g.id === STUDY_VIEW_DEFAULT_GENE_SPECIFIC_VIOLIN_GROUP_ID
    ) ?? MRNA_TAB_GENE_GROUPS[0];
const DEFAULT_MRNA_GENES: string[] = DEFAULT_GENE_GROUP.genes;
const DEFAULT_MRNA_GENE_GROUP_LABEL = DEFAULT_GENE_GROUP.label;

const DEFAULT_GENE_COUNT = 10;
const MAX_GENES = 10;
/** Cap per-gene track height when fewer than MAX_GENES genes fill the plot. */
const MAX_ROW_HEIGHT = 50;
/** Fixed per-gene row height in gene-specific mode; enables scrolling over resize. */
const GENE_SPECIFIC_FIXED_ROW_HEIGHT = 27;
/** Width reserved for the vertical scrollbar in gene-specific mode. */
const SCROLLBAR_WIDTH = 17;
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
        const matches = profiles.filter(p => p.datatype === dt);
        if (matches.length > 0) {
            // Among z-score profiles, prefer "all-sample" z-scores: they are
            // standardized across the study cohort and stay bounded (~±√n),
            // which keeps the shared cross-gene axis sane. Diploid/normal-
            // reference z-scores can explode for genes silent in normal tissue
            // (e.g. MAGEA4 reaches z > 200), wrecking the shared axis.
            return (
                matches.find(p =>
                    /all[_]?sample/i.test(p.molecularProfileId)
                ) ?? matches[0]
            );
        }
    }
    // Belt-and-suspenders: profile ID pattern fallback (TCGA naming)
    return (
        profiles.find(p =>
            /all[_]?sample_zscores?$/i.test(p.molecularProfileId)
        ) ??
        profiles.find(p => /zscores?$/i.test(p.molecularProfileId)) ??
        profiles.find(p => /log[\d_]/i.test(p.molecularProfileId)) ??
        profiles[0]
    );
}

function gaussianKernel(u: number): number {
    return Math.exp(-0.5 * u * u) / Math.sqrt(2 * Math.PI);
}

/** Percentile of an ascending-sorted array (nearest-rank). */
function percentile(sortedAsc: number[], p: number): number {
    if (sortedAsc.length === 0) return NaN;
    const i = Math.min(
        Math.max(Math.floor(p * sortedAsc.length), 0),
        sortedAsc.length - 1
    );
    return sortedAsc[i];
}

/**
 * Gaussian KDE evaluated over an explicit [min, max] domain. The caller passes
 * a robust per-gene domain (e.g. 1st–99th percentile) so a few extreme
 * outliers can't stretch the domain and collapse the violin into a spike.
 * Bandwidth = max(Silverman's rule, 5% of the domain) so concentrated
 * distributions still produce a visible violin.
 */
function computeKDE(
    data: number[],
    nPoints: number,
    min: number,
    max: number
): Array<[number, number]> {
    if (data.length < 2 || min === max) return [];
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

/** Deterministic pseudo-random jitter in [-1, 1] from an integer index. */
function jitterFraction(i: number): number {
    const v = Math.sin(i * 12.9898) * 43758.5453;
    return (v - Math.floor(v)) * 2 - 1;
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
    // Gene-specific mode: when both are supplied the chart plots exactly these
    // genes on the given molecular-profile suffix (any continuous-numeric
    // profile, not just mRNA) and the built-in gene picker is hidden. When
    // omitted, the chart runs in its original auto-added mRNA mode.
    genes?: string[];
    profileType?: string;
    // Log scale is controlled by the chart-header options menu (like other
    // charts), so it comes in as a prop rather than living in the toolbar.
    logScale?: boolean;
}

@observer
export default class MrnaViolinPlotChart extends React.Component<
    IMrnaViolinPlotChartProps,
    {}
> {
    @observable selectedSymbols: string[] = DEFAULT_MRNA_GENES.slice(
        0,
        DEFAULT_GENE_COUNT
    );
    @observable showGenePicker = false;

    // Drag-selection state. A drag is locked to a single gene row (track) for
    // its whole lifetime, so selections can never span across tracks.
    @observable private dragRowIndex: number | null = null;
    @observable private dragStartX: number | null = null;
    @observable private dragCurrentX: number | null = null;
    // Plot-relative x of the cursor while hovering, for the dashed guide line,
    // plus the row it is over so the line spans only that one track.
    @observable private hoverX: number | null = null;
    @observable private hoverRowIndex: number | null = null;

    private svgRef = React.createRef<SVGSVGElement>();

    constructor(props: IMrnaViolinPlotChartProps) {
        super(props);
        if (props.genes && props.genes.length > 0) {
            this.selectedSymbols = props.genes.slice();
        }
        makeObservable(this);
    }

    /** Gene-specific mode: fixed gene list + explicit profile, no gene picker. */
    @computed private get isGeneSpecificMode(): boolean {
        return !!this.props.profileType;
    }

    /** Log scale is driven by the chart-header options menu. */
    @computed private get logScale(): boolean {
        return !!this.props.logScale;
    }

    /**
     * The toolbar only carries the gene picker, which exists in the legacy
     * auto-added mRNA mode. Gene-specific mode has no toolbar (log scale moved
     * to the chart-header menu), so its plot reclaims that vertical space.
     */
    @computed private get showToolbar(): boolean {
        return !this.isGeneSpecificMode;
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

    /**
     * Sample cohort the violin distribution is drawn from: filtered by every
     * other chart but not by this violin's own gene range selections. Keyed by
     * profile + gene set, so toggling genes resolves to the right cohort.
     */
    get distributionSamplesPromise() {
        return this.props.store.getMrnaViolinDistributionSamples(
            this.props.profileType ?? null,
            this.selectedSymbols
        );
    }

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
            // Non-anchor genes follow every filter (the conditional cohort);
            // the anchor gene keeps its full distribution from a cohort that
            // excludes only its own range selection.
            this.props.store.selectedSamples,
            this.distributionSamplesPromise,
            this.resolvedGenes,
        ],
        invoke: async () => {
            const profileType = this.props.profileType;
            // Gene-specific mode keys off the chosen profile suffix; auto-added
            // mRNA mode falls back to any mRNA-expression profile.
            const allMrnaProfiles = this.props.store.molecularProfiles.result!.filter(
                p =>
                    profileType
                        ? getSuffixOfMolecularProfile(p) === profileType
                        : p.molecularAlterationType === 'MRNA_EXPRESSION'
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

            const profilesByStudy = _.groupBy(allMrnaProfiles, p => p.studyId);
            const chosenProfileByStudy: {
                [studyId: string]: MolecularProfile;
            } = {};
            for (const [studyId, profiles] of Object.entries(profilesByStudy)) {
                // A profile suffix maps to one profile per study, so in
                // gene-specific mode take it directly; otherwise pick the best
                // mRNA profile by datatype priority.
                chosenProfileByStudy[studyId] = profileType
                    ? profiles[0]
                    : pickBestMrnaProfile(profiles);
            }

            // Fetch z-scores for a set of genes over a sample cohort, grouped by
            // gene. Used twice: the conditional cohort (all filters) for the
            // non-anchor genes, and the anchor's own full cohort.
            const fetchByGene = async (
                cohort: { studyId: string; sampleId: string }[],
                entrezGeneIds: number[]
            ): Promise<{
                byGene: { [entrezGeneId: number]: number[] };
                count: number;
            }> => {
                const ids = cohort.slice(0, MAX_SAMPLES).flatMap(sample => {
                    const profile = chosenProfileByStudy[sample.studyId];
                    if (!profile) return [];
                    return [
                        {
                            molecularProfileId: profile.molecularProfileId,
                            sampleId: sample.sampleId,
                        },
                    ];
                });
                if (ids.length === 0 || entrezGeneIds.length === 0) {
                    return { byGene: {}, count: 0 };
                }
                const data = await getClient().fetchMolecularDataInMultipleMolecularProfilesUsingPOST(
                    {
                        molecularDataMultipleStudyFilter: {
                            entrezGeneIds,
                            sampleMolecularIdentifiers: ids,
                        } as any,
                    }
                );
                const byGene: { [entrezGeneId: number]: number[] } = {};
                for (const d of data) {
                    if (!byGene[d.entrezGeneId]) byGene[d.entrezGeneId] = [];
                    byGene[d.entrezGeneId].push(d.value);
                }
                return { byGene, count: ids.length };
            };

            // Non-anchor genes follow every filter (including the anchor's
            // range): their violins are the conditional distribution
            // P(gene | anchor ∈ selected range).
            const base = await fetchByGene(
                this.props.store.selectedSamples.result!,
                genes.map(g => g.entrezGeneId)
            );
            const byGene = base.byGene;

            // The single selected "anchor" gene keeps its FULL distribution,
            // drawn from the cohort filtered by everything except its own range,
            // so its shape is stable and the selected slice is highlighted.
            const anchor = this.profileType
                ? genes.find(
                      g =>
                          this.props.store.getMrnaViolinSelection(
                              g.hugoSymbol,
                              this.profileType!
                          ) !== undefined
                  )
                : undefined;
            if (anchor) {
                const anchorData = await fetchByGene(
                    this.distributionSamplesPromise.result!,
                    [anchor.entrezGeneId]
                );
                byGene[anchor.entrezGeneId] =
                    anchorData.byGene[anchor.entrezGeneId] || [];
            }

            return {
                profilesUsed: Object.values(chosenProfileByStudy),
                sampleCount: base.count,
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
        const marginLeft = 80;
        const marginRight = 16;
        const marginTop = 38;
        const marginBottom = 9;
        const geneCount = Math.max(1, this.selectedSymbols.length);

        // In gene-specific mode the scrollbar sits inside the container, so
        // the SVG must be narrower than the panel to avoid being clipped.
        const svgWidth = this.isGeneSpecificMode
            ? this.props.width - SCROLLBAR_WIDTH
            : this.props.width;
        const plotW = svgWidth - marginLeft - marginRight;

        let rowH: number;
        let svgHeight: number;

        if (this.isGeneSpecificMode) {
            // Fixed row height so the violin shape stays consistent regardless
            // of how many genes are shown or how the panel is resized. The SVG
            // grows with the gene count and the container scrolls.
            rowH = GENE_SPECIFIC_FIXED_ROW_HEIGHT;
            svgHeight = marginTop + geneCount * rowH + marginBottom;
        } else {
            svgHeight =
                this.props.height - (this.showToolbar ? TOOLBAR_HEIGHT : 0);
            const plotH = svgHeight - marginTop - marginBottom;
            // With a full slate of genes the rows divide the plot evenly. With
            // fewer, scale each row up to fill the space instead of leaving it
            // empty, but cap the height so a couple of genes don't produce
            // absurdly tall tracks. More than MAX_GENES shrinks the rows to fit.
            rowH =
                geneCount >= MAX_GENES
                    ? plotH / geneCount
                    : Math.min(MAX_ROW_HEIGHT, plotH / geneCount);
        }

        const plotH = svgHeight - marginTop - marginBottom;
        return {
            marginLeft,
            marginRight,
            marginTop,
            marginBottom,
            plotW,
            plotH,
            rowH,
            svgHeight,
            svgWidth,
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

    /**
     * Profile suffix used as the cross-study key for genomic-data filters
     * (e.g. "rna_seq_v2_mrna_median_Zscores"). Null until data has loaded.
     */
    @computed get profileType(): string | null {
        if (this.props.profileType) return this.props.profileType;
        const profile = this.mrnaData.result?.profilesUsed[0];
        return profile ? getSuffixOfMolecularProfile(profile) : null;
    }

    /** Inverse of xScale: plot pixel x → display-space value. */
    private xToDisplayValue(px: number): number {
        const range = this.globalValueRange!;
        const { plotW } = this.layout;
        const frac = Math.min(Math.max(px / plotW, 0), 1);
        return range.min + frac * (range.max - range.min);
    }

    /** Undo the optional log₂(x+1) display transform to get a raw profile value. */
    private displayToRaw(displayValue: number): number {
        return this.logScale && this.canLogScale
            ? Math.pow(2, displayValue) - 1
            : displayValue;
    }

    /** Apply the optional log₂(x+1) display transform to a raw profile value. */
    private rawToDisplay(rawValue: number): number {
        return this.logScale && this.canLogScale
            ? Math.log2(rawValue + 1)
            : rawValue;
    }

    /** Plot-relative x of a pointer event, clamped to [0, plotW]. */
    private clientXToPlotX(clientX: number): number {
        const svg = this.svgRef.current;
        const { marginLeft, plotW } = this.layout;
        if (!svg) return 0;
        const rect = svg.getBoundingClientRect();
        const x = clientX - rect.left - marginLeft;
        return Math.min(Math.max(x, 0), plotW);
    }

    @action.bound
    private onRowMouseDown(e: React.MouseEvent, rowIndex: number) {
        // Left-button drags only; ignore modifier-clicks.
        if (e.button !== 0) return;
        e.preventDefault();
        const x = this.clientXToPlotX(e.clientX);
        this.dragRowIndex = rowIndex;
        this.dragStartX = x;
        this.dragCurrentX = x;
        window.addEventListener('mousemove', this.onDragMove);
        window.addEventListener('mouseup', this.onDragEnd);
    }

    @action.bound
    private onDragMove(e: MouseEvent) {
        if (this.dragRowIndex === null) return;
        // X is clamped to the plot, so the selection stays within this one
        // track no matter where the cursor wanders vertically.
        this.dragCurrentX = this.clientXToPlotX(e.clientX);
    }

    @action.bound
    private onDragEnd() {
        window.removeEventListener('mousemove', this.onDragMove);
        window.removeEventListener('mouseup', this.onDragEnd);

        const rowIndex = this.dragRowIndex;
        const startX = this.dragStartX;
        const endX = this.dragCurrentX;
        this.dragRowIndex = null;
        this.dragStartX = null;
        this.dragCurrentX = null;

        if (rowIndex === null || startX === null || endX === null) return;
        const gene = this.currentGenes[rowIndex];
        if (!gene || !this.profileType) return;

        const lo = Math.min(startX, endX);
        const hi = Math.max(startX, endX);

        // Treat a negligible drag as a click → clear this track's selection.
        if (hi - lo < 3) {
            this.props.store.updateMrnaViolinSelection(
                gene.hugoSymbol,
                this.profileType,
                null
            );
            return;
        }

        const { plotW } = this.layout;
        // Open-end the bound when the drag reaches an axis edge, so clipped
        // outliers beyond the 1st/99th percentile range are still included.
        const start =
            lo <= plotW * 0.005
                ? undefined
                : this.displayToRaw(this.xToDisplayValue(lo));
        const end =
            hi >= plotW * 0.995
                ? undefined
                : this.displayToRaw(this.xToDisplayValue(hi));

        // Single-anchor model: only one gene may be selected at a time. Clear
        // any other gene's selection so the rest stay conditional on this one.
        this.clearOtherViolinSelections(gene.hugoSymbol);
        this.props.store.updateMrnaViolinSelection(
            gene.hugoSymbol,
            this.profileType,
            { start, end }
        );
    }

    /** Clear committed selections on every gene in this chart except one. */
    private clearOtherViolinSelections(exceptSymbol: string) {
        if (!this.profileType) return;
        for (const g of this.currentGenes) {
            if (
                g.hugoSymbol !== exceptSymbol &&
                this.props.store.getMrnaViolinSelection(
                    g.hugoSymbol,
                    this.profileType
                ) !== undefined
            ) {
                this.props.store.updateMrnaViolinSelection(
                    g.hugoSymbol,
                    this.profileType,
                    null
                );
            }
        }
    }

    @action.bound
    private onHoverMove(e: React.MouseEvent, rowIndex: number) {
        this.hoverX = this.clientXToPlotX(e.clientX);
        this.hoverRowIndex = rowIndex;
    }

    @action.bound
    private onHoverLeave() {
        this.hoverX = null;
        this.hoverRowIndex = null;
    }

    componentWillUnmount() {
        window.removeEventListener('mousemove', this.onDragMove);
        window.removeEventListener('mouseup', this.onDragEnd);
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
        const { rowH, plotW } = this.layout;
        const centerY = rowH * (rowIndex + 0.5);
        const violinHalfH = rowH * 0.44;
        const boxHalfH = rowH * 0.14;

        // Committed selection on this gene → recolor the in-range slice of the
        // distribution rather than filtering it away. selPx is the pixel band
        // [lo, hi] along the value axis; null when nothing is selected here.
        const selection = this.profileType
            ? this.props.store.getMrnaViolinSelection(
                  gene.hugoSymbol,
                  this.profileType
              )
            : undefined;
        let selPx: { lo: number; hi: number } | null = null;
        if (selection) {
            const xs =
                selection.start === undefined
                    ? 0
                    : this.xScale(this.rawToDisplay(selection.start));
            const xe =
                selection.end === undefined
                    ? plotW
                    : this.xScale(this.rawToDisplay(selection.end));
            selPx = { lo: Math.min(xs, xe), hi: Math.max(xs, xe) };
        }
        // When a range is selected the base distribution fades to grey and the
        // selected slice keeps the prominent blue; with no selection the whole
        // violin stays blue.
        const baseFill = selPx ? '#EAEAEA' : '#D6E6F9';
        const baseStroke = selPx ? '#BDBDBD' : '#1A5DAB';
        const selFill = '#D6E6F9';
        const selStroke = '#1A5DAB';
        const inSel = (v: number) =>
            !selPx ||
            (this.xScale(v) >= selPx.lo && this.xScale(v) <= selPx.hi);

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

        const box = computeBoxStats(values);

        // Count distinct values to detect near-constant distributions (e.g.
        // cancer-testis antigens silent in nearly every sample). A KDE can't
        // meaningfully represent these, so we fall back to a strip plot.
        const sorted = [...values].sort((a, b) => a - b);
        let uniqueCount = sorted.length > 0 ? 1 : 0;
        for (let i = 1; i < sorted.length; i++) {
            if (sorted[i] !== sorted[i - 1]) uniqueCount++;
        }
        const isDegenerate = uniqueCount <= 2 || box.q3 - box.q1 === 0;

        let shape: JSX.Element | null = null;
        if (isDegenerate) {
            // Strip plot: draw each sample as a jittered dot. Off-scale
            // outliers clamp to the plot edge via xScale.
            shape = (
                <g>
                    {values.map((v, i) => (
                        <circle
                            key={i}
                            cx={this.xScale(v)}
                            cy={centerY + jitterFraction(i) * violinHalfH}
                            r={1.5}
                            fill={inSel(v) ? '#1A5DAB' : '#C8C8C8'}
                            fillOpacity={0.45}
                        />
                    ))}
                </g>
            );
        } else {
            // Robust per-gene domain: trim to the 1st–99th percentile so a few
            // extreme values don't blow up the KDE domain.
            const lo = percentile(sorted, 0.01);
            const hi = percentile(sorted, 0.99);
            const trimmed = values.filter(v => v >= lo && v <= hi);
            const kdePoints = computeKDE(trimmed, KDE_POINTS, lo, hi);
            const maxDensity =
                kdePoints.length > 0
                    ? Math.max(...kdePoints.map(p => p[1]))
                    : 1;

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
                const pathD = `M ${upperPts} L ${lowerPts} Z`;
                const clipId = `violin-sel-${gene.entrezGeneId}`;
                shape = (
                    <g>
                        <path
                            d={pathD}
                            fill={baseFill}
                            stroke={baseStroke}
                            strokeWidth={1}
                        />
                        {selPx && (
                            <>
                                <clipPath id={clipId}>
                                    <rect
                                        x={selPx.lo}
                                        y={centerY - violinHalfH}
                                        width={Math.max(selPx.hi - selPx.lo, 0)}
                                        height={violinHalfH * 2}
                                    />
                                </clipPath>
                                <path
                                    d={pathD}
                                    fill={selFill}
                                    stroke={selStroke}
                                    strokeWidth={1}
                                    clipPath={`url(#${clipId})`}
                                />
                            </>
                        )}
                    </g>
                );
            }
        }
        const x1 = this.xScale(box.q1);
        const x3 = this.xScale(box.q3);
        const xMed = this.xScale(box.median);
        const xWL = this.xScale(box.whiskerLow);
        const xWH = this.xScale(box.whiskerHigh);

        return (
            <g key={gene.hugoSymbol}>
                {shape}
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

    /**
     * Per-row interaction layer: a transparent capture rect that starts a
     * drag, the committed selection highlight (read back from the store), and
     * the live drag rectangle while this row is being dragged.
     */
    private renderRowOverlay(
        gene: { hugoSymbol: string; entrezGeneId: number },
        rowIndex: number
    ): JSX.Element {
        const { rowH, plotW } = this.layout;
        const bandTop = rowH * rowIndex + 2;
        const bandH = rowH - 4;

        // Committed selection for this track, mapped raw → display → pixel.
        let committed: JSX.Element | null = null;
        const selection = this.profileType
            ? this.props.store.getMrnaViolinSelection(
                  gene.hugoSymbol,
                  this.profileType
              )
            : undefined;
        if (selection) {
            const xs =
                selection.start === undefined
                    ? 0
                    : this.xScale(this.rawToDisplay(selection.start));
            const xe =
                selection.end === undefined
                    ? plotW
                    : this.xScale(this.rawToDisplay(selection.end));
            const lo = Math.min(xs, xe);
            const hi = Math.max(xs, xe);
            // The recolored violin slice carries the selection; here we add a
            // faint band and dashed edges so the chosen window stays legible
            // even where the distribution is thin.
            committed = (
                <g pointerEvents="none">
                    <rect
                        x={lo}
                        y={bandTop}
                        width={Math.max(hi - lo, 1)}
                        height={bandH}
                        fill="#1A5DAB"
                        fillOpacity={0.06}
                    />
                    {selection.start !== undefined && (
                        <line
                            x1={lo}
                            x2={lo}
                            y1={bandTop}
                            y2={bandTop + bandH}
                            stroke="#1A5DAB"
                            strokeWidth={1}
                            strokeDasharray="3,2"
                        />
                    )}
                    {selection.end !== undefined && (
                        <line
                            x1={hi}
                            x2={hi}
                            y1={bandTop}
                            y2={bandTop + bandH}
                            stroke="#1A5DAB"
                            strokeWidth={1}
                            strokeDasharray="3,2"
                        />
                    )}
                </g>
            );
        }

        // Live drag rectangle (only for the row currently being dragged).
        let dragRect: JSX.Element | null = null;
        if (
            this.dragRowIndex === rowIndex &&
            this.dragStartX !== null &&
            this.dragCurrentX !== null
        ) {
            const lo = Math.min(this.dragStartX, this.dragCurrentX);
            const hi = Math.max(this.dragStartX, this.dragCurrentX);
            dragRect = (
                <rect
                    x={lo}
                    y={bandTop}
                    width={Math.max(hi - lo, 1)}
                    height={bandH}
                    fill="#2986E2"
                    fillOpacity={0.2}
                    stroke="#2986E2"
                    strokeWidth={1}
                    pointerEvents="none"
                />
            );
        }

        return (
            <g key={`overlay-${gene.hugoSymbol}`}>
                {committed}
                {dragRect}
                <rect
                    x={0}
                    y={rowH * rowIndex}
                    width={plotW}
                    height={rowH}
                    fill="transparent"
                    style={{ cursor: 'default' }}
                    onMouseDown={e => this.onRowMouseDown(e, rowIndex)}
                    onMouseMove={e => this.onHoverMove(e, rowIndex)}
                />
            </g>
        );
    }

    /** Vertical dashed guide line tracking the cursor within the hovered track. */
    private renderHoverLine(): JSX.Element | null {
        if (this.hoverX === null || this.hoverRowIndex === null) return null;
        const { rowH } = this.layout;
        return (
            <line
                x1={this.hoverX}
                x2={this.hoverX}
                y1={rowH * this.hoverRowIndex}
                y2={rowH * (this.hoverRowIndex + 1)}
                stroke="#000"
                strokeWidth={2}
                strokeDasharray="4,3"
                pointerEvents="none"
            />
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
        const rawLabel =
            this.logScale && this.canLogScale
                ? `log₂(${profileName}+1)`
                : profileName;
        // Truncate only when the estimated text width (fontSize 10 ≈ 5.5px/char) exceeds the axis.
        const maxChars = Math.floor(plotW / 5.5);
        const isTruncated = rawLabel.length > maxChars;
        const axisLabel = isTruncated
            ? rawLabel.slice(0, maxChars - 1) + '…'
            : rawLabel;
        return (
            <g transform={`translate(0, 0)`}>
                <line
                    x1={0}
                    x2={plotW}
                    y1={0}
                    y2={0}
                    stroke="black"
                    strokeWidth={1}
                />
                {ticks.map(t => (
                    <g key={t.val} transform={`translate(${t.x}, 0)`}>
                        <line
                            x1={0}
                            x2={0}
                            y1={0}
                            y2={-4}
                            stroke="black"
                            strokeWidth={1}
                        />
                        <text
                            x={0}
                            y={-7}
                            textAnchor="middle"
                            fontSize={9}
                            fill="black"
                        >
                            {t.val.toFixed(1)}
                        </text>
                    </g>
                ))}
                {/* In gene-specific mode the profile name is already shown as
                    the chart title, so skip the redundant axis label. */}
                {!this.isGeneSpecificMode && (
                    <text
                        x={plotW / 2}
                        y={-20}
                        textAnchor="middle"
                        fontSize={10}
                        fill="black"
                    >
                        {isTruncated && <title>{rawLabel}</title>}
                        {axisLabel}
                    </text>
                )}
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
                        x={10}
                        y={marginTop + rowH * (i + 0.5) + 4}
                        textAnchor="start"
                        fontSize={13}
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
                    Select up to {MAX_GENES} genes &mdash;{' '}
                    {DEFAULT_MRNA_GENE_GROUP_LABEL}
                    {atMax && (
                        <span style={{ color: '#c00', marginLeft: 6 }}>
                            (max reached)
                        </span>
                    )}
                </div>
                <div style={{ columnCount: 2, columnGap: 8 }}>
                    {DEFAULT_MRNA_GENES.map(symbol => {
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
        const {
            marginLeft,
            marginTop,
            svgHeight,
            svgWidth,
            rowH,
        } = this.layout;

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
                    <LoadingIndicator isLoading={true} size={'small'} />
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
                        ? 'Error loading data.'
                        : this.isGeneSpecificMode
                        ? 'No data available for this study.'
                        : 'No mRNA expression data available for this study.'}
                </div>
            );
        } else {
            const svgEl = (
                <svg
                    ref={this.svgRef}
                    width={svgWidth}
                    height={svgHeight}
                    style={{ display: 'block' }}
                    onMouseLeave={this.onHoverLeave}
                >
                    {this.renderYLabels()}
                    <g transform={`translate(${marginLeft}, ${marginTop})`}>
                        {this.currentGenes.map((gene, i) =>
                            this.renderGeneRow(gene, i)
                        )}
                        {/* Y-axis line — height matches the number of active gene rows */}
                        <line
                            x1={0}
                            x2={0}
                            y1={0}
                            y2={rowH * this.currentGenes.length}
                            stroke="black"
                            strokeWidth={1}
                        />
                        {this.renderXAxis()}
                        {/* Drag-selection layer sits on top of the violins. */}
                        {this.currentGenes.map((gene, i) =>
                            this.renderRowOverlay(gene, i)
                        )}
                        {this.renderHoverLine()}
                    </g>
                </svg>
            );
            // Gene-specific mode: rows have a fixed height so the SVG may be
            // taller than the panel. Wrap it in a scrollable container so the
            // user can reach all genes without distorting the violin shapes.
            bodyContent = this.isGeneSpecificMode ? (
                <div
                    style={{
                        flex: 1,
                        overflowY: 'auto',
                        overflowX: 'hidden',
                    }}
                >
                    {svgEl}
                </div>
            ) : (
                svgEl
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
                {this.showToolbar && (
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
                        onClick={action(() => {
                            // Close picker when clicking anywhere in the toolbar
                            // (the Genes button stops propagation to toggle itself)
                            this.showGenePicker = false;
                        })}
                    >
                        <button
                            onClick={action((e: React.MouseEvent) => {
                                e.stopPropagation(); // don't let toolbar's close-handler fire
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
                )}
                {bodyContent}
                {this.showGenePicker && (
                    <>
                        {/* Invisible overlay to catch outside clicks */}
                        <div
                            style={{
                                position: 'fixed',
                                top: 0,
                                left: 0,
                                right: 0,
                                bottom: 0,
                                zIndex: 1,
                            }}
                            onClick={action(() => {
                                this.showGenePicker = false;
                            })}
                        />
                        {this.renderGenePicker()}
                    </>
                )}
            </div>
        );
    }
}
