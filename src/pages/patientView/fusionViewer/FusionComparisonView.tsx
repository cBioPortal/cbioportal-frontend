import * as React from 'react';
import * as _ from 'lodash';
import { observer } from 'mobx-react';
import {
    observable,
    action,
    computed,
    makeObservable,
    runInAction,
    reaction,
} from 'mobx';
import { ButtonGroup } from 'react-bootstrap';
import classNames from 'classnames';
import { DefaultTooltip } from 'cbioportal-frontend-commons';
import { FusionCohortStore } from './FusionCohortStore';
import AnchorGeneTrackRuler, {
    getAnchorTrackHeight,
    assignBreakpointsToFeatures,
} from './components/AnchorGeneTrackRuler';
import FusionStripList from './components/FusionStripList';
import ExonRuler from './components/ExonRuler';
import {
    orientComparisonRowsTo5p,
    splitCallerReciprocals,
    callerFivePrimeSymbol,
    snapBreakpointsToAnchorGene,
    ComparisonRow,
    AnchorSide,
    anchorEndpoint,
    partnerCategory,
    snapBreakpointsToGeneSide,
    NO_PARTNER,
    INTRAGENIC,
} from './data/comparisonRows';
import {
    CollapseKind,
    CollapsedGroup,
    exonStructureKey,
    groupRows,
} from './data/collapseRows';
import AnchorModeBar from './components/AnchorModeBar';
import FusionRecurrenceTable from './FusionRecurrenceTable';
import { FusionDiagramSVG } from './FusionDiagramSVG';
import { txKey } from './data/transcriptKeys';
import {
    TranscriptData,
    COLOR_5PRIME,
    COLOR_3PRIME,
    FrameStatus,
} from './data/types';
import WindowStore from 'shared/components/window/WindowStore';
import {
    computeComparisonFrame,
    sharedPxPerBp,
    RIGHT_GUTTER,
    PARTNER_RIGHT_GUTTER,
} from './components/comparisonFrame';
import { groupPartnerLabel } from './data/anchorSummaries';
import { JUNCTION_GAP } from './components/fusionProductHelpers';
import { fetchTranscriptsForGeneWithFallback } from './data/genomeNexusTranscriptService';
import { frameStatusStyle } from './components/frameStatusStyle';
import { sampleFusionViewerHref } from './data/cohortLinks';
import {
    featureSlotLayout,
    pixelBinLayout,
    TrackLayout,
} from './data/trackGeometry';
import {
    buildLinkGroups,
    buildLollipopSticks,
    slotLabel,
    LinkGroup,
    LinkMatcher,
    litBarKeys,
    matchBar,
    matchLinkIds,
} from './data/linkAggregation';
import { LinkHover } from './components/LinkHover';
import AnchorLollipopTrack from './components/AnchorLollipopTrack';
import { colorFor, rankedColorMap } from './data/partnerPalette';
import BreakpointLinkArcs, {
    ARC_BAND_HEIGHT,
} from './components/BreakpointLinkArcs';

// Horizontal chrome (page padding + patient-view rails) subtracted from the
// window width to get the drawable content width. Floored so the view stays
// usable on narrow windows.
const HORIZONTAL_CHROME = 90;
const MIN_CONTENT_WIDTH = 900;
// Vertical chrome above the strip list (page header, summary/recurrence tables,
// histogram, legend) subtracted from the window height so the virtualized strip
// viewport fills most of the remaining screen. Floored so it stays usable on
// short windows.
const STRIP_VERTICAL_CHROME = 240;
const MIN_STRIP_VIEWPORT = 600;
// Seam gap between the 5′ and 3′ gene tracks at the junction.
const PARTNER_TRACK_GAP = 8;

const exonLen = (e: { start: number; end: number }) =>
    Math.max(1, e.end - e.start);
const sumBp = (exons: { start: number; end: number }[]) =>
    exons.reduce((s, e) => s + exonLen(e), 0);

/** A sample-identifier the studyView cohort filter understands. */
export interface CohortSampleIdentifier {
    studyId: string;
    sampleId: string;
}

export interface FusionComparisonViewProps {
    store: FusionCohortStore;
    /**
     * When provided, clicking a breakpoint histogram bar filters the studyView
     * cohort to the given samples. `filterKey` is a stable chart/filter key,
     * `label` a human-readable description for the filter pill. Omitted in the
     * standalone patient-view context (no cohort to filter).
     */
    onFilterCohortBySamples?: (
        filterKey: string,
        label: string,
        samples: CohortSampleIdentifier[]
    ) => void;
}

/** Stable studyView filter key for the fusion breakpoint-bar cohort filter. */
export const FUSION_BREAKPOINT_FILTER_KEY = 'FUSION_BREAKPOINT_BAR';

@observer
export default class FusionComparisonView extends React.Component<
    FusionComparisonViewProps
> {
    // The cache lives in the store (D13) so it survives remounts; these
    // accessors keep the view's call sites and specs unchanged.
    get transcriptsByKey(): Map<string, TranscriptData> {
        return this.props.store.transcriptsByKey;
    }
    set transcriptsByKey(m: Map<string, TranscriptData>) {
        this.props.store.setTranscriptsByKey(m);
    }
    get transcriptOptionsByGene(): Map<string, TranscriptData[]> {
        return this.props.store.transcriptOptionsByGene;
    }
    set transcriptOptionsByGene(m: Map<string, TranscriptData[]>) {
        this.props.store.setTranscriptOptionsByGene(m);
    }
    @observable expandedSampleId: string | undefined = undefined;

    constructor(props: FusionComparisonViewProps) {
        super(props);
        makeObservable(this);
    }

    @computed get hasFusionAnnotation(): boolean {
        return this.props.store.allEvents.some(
            e =>
                !!e.frameCallMethod &&
                e.frameCallMethod !== 'NA' &&
                e.frameCallMethod !== ''
        );
    }

    // One segment of the histogram-mode toggle, styled like cBioPortal's
    // axis-scale switch (active = filled grey, inactive = outline).
    trackModeButton(
        mode: 'feature' | 'genomic' | 'lollipop',
        label: string,
        tooltip: string
    ): JSX.Element {
        const active = this.props.store.trackMode === mode;
        return (
            <DefaultTooltip overlay={tooltip} placement="top">
                <button
                    data-testid={`trackmode-${mode}`}
                    className={classNames(
                        { 'btn-secondary': active, 'btn-default': !active },
                        'btn',
                        'btn-xs'
                    )}
                    style={{
                        lineHeight: 1,
                        cursor: active ? 'default' : 'pointer',
                        fontWeight: active ? 'bolder' : 'normal',
                        color: active ? '#fff' : '#6c757d',
                        backgroundColor: active ? '#6c757d' : '#fff',
                    }}
                    onClick={() => this.props.store.setTrackMode(mode)}
                >
                    {label}
                </button>
            </DefaultTooltip>
        );
    }

    // A segmented button, styled like the histogram-mode toggle. `active`
    // drives the filled/outline treatment; onClick fires the mode change.
    segmentButton(
        active: boolean,
        testId: string,
        label: string,
        tooltip: string,
        onClick: () => void
    ): JSX.Element {
        return (
            <DefaultTooltip overlay={tooltip} placement="top">
                <button
                    data-testid={testId}
                    className={classNames(
                        { 'btn-secondary': active, 'btn-default': !active },
                        'btn',
                        'btn-xs'
                    )}
                    style={{
                        lineHeight: 1,
                        cursor: active ? 'default' : 'pointer',
                        fontWeight: active ? 'bolder' : 'normal',
                        color: active ? '#fff' : '#6c757d',
                        backgroundColor: active ? '#6c757d' : '#fff',
                    }}
                    onClick={onClick}
                >
                    {label}
                </button>
            </DefaultTooltip>
        );
    }

    // Default the anchor to the most recurrent pair so the comparison renders
    // as soon as the tab opens, without requiring the user to first click a row.
    @action.bound ensureDefaultAnchor() {
        const { store } = this.props;
        if (
            !store.hasAnchorSelection &&
            !store.seedPending &&
            store.pairSummaries.length > 0
        ) {
            store.setAnchor(
                { mode: 'pair', key: store.pairSummaries[0].key },
                { source: 'auto' }
            );
        }
    }

    // Transcript fetching is driven by a MobX reaction, NOT componentDidUpdate.
    // Under mobx-react's class @observer, an observable change (e.g. store.anchor
    // on a pair click) re-renders only the inner Observer — the class's
    // componentDidUpdate does NOT fire — so a lifecycle-driven fetch would never
    // run for a newly-selected pair. The reaction tracks the outstanding request
    // set (+ default-anchor need) directly and refires deterministically.
    private fetchReactionDisposer?: () => void;
    private hoverResetDisposer?: () => void;

    componentDidMount() {
        this.fetchReactionDisposer = reaction(
            () => {
                const s = this.props.store;
                const needsDefaultAnchor =
                    !s.hasAnchorSelection &&
                    !s.seedPending &&
                    s.pairSummaries.length > 0;
                const outstanding = this.props.store.outstandingTranscriptRequests
                    .map(r => `${r.build}|${r.symbol}|${r.transcriptId}`)
                    .join(',');
                return `${needsDefaultAnchor}|${s.genomeBuild}|${outstanding}`;
            },
            () => {
                this.ensureDefaultAnchor();
                this.fetchTranscripts();
            },
            { fireImmediately: true }
        );
        this.hoverResetDisposer = reaction(
            () => [
                this.props.store.anchor,
                this.props.store.trackMode,
                this.orientedRows,
                this.histogramAnchorTranscript,
                this.histogramPartnerTranscript,
                this.contentWidth,
            ],
            () => this.linkHover.clear()
        );
    }

    componentWillUnmount() {
        this.fetchReactionDisposer?.();
        this.hoverResetDisposer?.();
        this.linkHover.clear();
    }

    // Transcript keys currently being fetched, so overlapping reaction firings
    // don't launch duplicate requests for the same gene. Tracked PER KEY (not a
    // single boolean) and released as each request settles, so one hung request
    // cannot block other keys. Failed/empty fetches are recorded in the store's
    // failedTranscriptKeys (markTranscriptsFailed) and not retried this session.
    // Commits MERGE into the current map, so overlapping fetches are safe.
    private inFlightTxKeys = new Set<string>();

    async fetchTranscripts() {
        const missing = this.props.store.outstandingTranscriptRequests.filter(
            req =>
                !this.inFlightTxKeys.has(
                    txKey(req.build, req.symbol, req.transcriptId)
                )
        );
        if (missing.length === 0) return;

        // Snapshot for the stale-commit guard below: results are discarded if
        // the COHORT build flips mid-fetch. Individual requests carry their own
        // build, which cannot change once the request exists.
        const cohortBuildAtStart = this.props.store.genomeBuild;

        const fetched: [string, TranscriptData][] = [];
        const fetchedOptions: [string, TranscriptData[]][] = [];
        const failed: string[] = [];
        for (const { symbol, transcriptId, build } of missing) {
            const k = txKey(build, symbol, transcriptId);
            this.inFlightTxKeys.add(k);
            try {
                const list = await fetchTranscriptsForGeneWithFallback(
                    symbol,
                    transcriptId,
                    build
                );
                const chosen = list.find(t => t.isForteSelected) || list[0];
                if (chosen) fetched.push([k, chosen]);
                else failed.push(k);
                if (transcriptId === '' && list.length > 0) {
                    fetchedOptions.push([`${build}|${symbol}`, list]);
                }
            } catch {
                failed.push(k);
            } finally {
                // Release the in-flight marker; whether the key may be fetched
                // again is decided by the store (failedTranscriptKeys).
                this.inFlightTxKeys.delete(k);
            }
        }

        if (this.props.store.genomeBuild === cohortBuildAtStart) {
            runInAction(() => {
                this.props.store.mergeTranscripts(fetched);
                this.props.store.mergeTranscriptOptions(fetchedOptions);
                this.props.store.markTranscriptsFailed(failed);
            });
        }
    }

    // Canonical isoform of a gene — used by the anchor track (one shared
    // coordinate system) and as the per-row fallback.
    transcriptForGene = (gene: string): TranscriptData | undefined =>
        this.props.store.transcriptForGene(gene);

    transcriptForRow = (
        row: ComparisonRow,
        is5p: boolean
    ): TranscriptData | undefined =>
        this.props.store.transcriptForRow(row, is5p);

    histogramTranscriptForGene = (gene: string): TranscriptData | undefined =>
        this.props.store.histogramTranscriptForGene(gene);

    // Per-gene histogram transcript picker. Lists every Genome Nexus transcript
    // for the gene; the MSK-canonical isoform is the default. Hidden when the
    // gene has ≤1 transcript (nothing to choose).
    renderTranscriptPicker(gene: string): JSX.Element | null {
        if (!gene) return null;
        const opts = this.transcriptOptionsByGene.get(
            `${this.props.store.genomeBuild}|${gene}`
        );
        if (!opts || opts.length <= 1) return null;
        const defaultTx = this.transcriptForGene(gene);
        const defaultId = defaultTx
            ? defaultTx.transcriptId
            : (opts.find(t => t.displayName.includes('(canonical)')) || opts[0])
                  .transcriptId;
        const value =
            this.props.store.histogramTranscriptIdByGene.get(gene) ?? defaultId;
        return (
            <select
                data-testid={`histogram-tx-${gene}`}
                aria-label={`Histogram transcript for ${gene}`}
                value={value}
                onChange={e =>
                    this.props.store.setHistogramTranscript(
                        gene,
                        e.target.value
                    )
                }
                style={{ fontSize: 11 }}
            >
                {opts.map(t => (
                    <option key={t.transcriptId} value={t.transcriptId}>
                        {t.displayName}
                    </option>
                ))}
            </select>
        );
    }

    // ── Row derivation pipeline ──────────────────────────────────────────
    // Split into @computed getters keyed only on data observables
    // (store.anchorRows, this.transcriptsByKey) so it recomputes when rows
    // or transcripts change — NOT on window resize or expandedSampleId toggles.
    // Each getter reads this.transcriptsByKey (via transcriptForGene) so MobX
    // re-runs it when transcripts load.

    // 5′/3′ resolution (strand + connectionType) happens in the store (D13);
    // these are the rendered rows.
    @computed get resolvedRows(): ComparisonRow[] {
        return this.props.store.anchorRows;
    }

    @computed get isGeneMode(): boolean {
        return this.props.store.anchor?.mode === 'gene';
    }

    /** Which half holds the shared anchor ladder. Pair mode: always 5′. */
    @computed get anchorSide(): AnchorSide {
        const a = this.props.store.anchor;
        return a && a.mode === 'gene' ? a.side : '5p';
    }

    // Gene mode: the chosen gene. Pair mode: the majority resolved 5′ symbol.
    @computed get anchorGene(): string {
        const a = this.props.store.anchor;
        if (a && a.mode === 'gene') return a.gene;
        const resolved = this.resolvedRows;
        if (resolved.length === 0) return '';
        const geneCounts = _.countBy(resolved, r => r.fivePrimeSymbol);
        return Object.entries(geneCounts).sort((x, y) => y[1] - x[1])[0][0];
    }

    @computed get anchorTranscript(): TranscriptData | undefined {
        return this.transcriptForGene(this.anchorGene);
    }

    // Pair mode: rows the caller explicitly called with the partner as 5′
    // (reciprocals) are excluded rather than flipped; the rest are drawn.
    @computed get pairSplit(): {
        rows: ComparisonRow[];
        reciprocal: ComparisonRow[];
    } {
        if (this.isGeneMode) {
            return { rows: this.resolvedRows, reciprocal: [] };
        }
        return splitCallerReciprocals(this.resolvedRows, this.anchorGene);
    }

    // Pair mode: orient every row onto one 5′ gene, then snap (pattern B).
    // Gene mode: rows are already resolved 5′→3′ and side-filtered; only snap
    // the anchor-side position into the anchor gene (D20).
    @computed get orientedRows(): ComparisonRow[] {
        const t = this.anchorTranscript;
        if (this.isGeneMode) {
            return t
                ? snapBreakpointsToGeneSide(
                      this.resolvedRows,
                      t.txStart,
                      t.txEnd,
                      this.anchorSide
                  )
                : this.resolvedRows;
        }
        const oriented = orientComparisonRowsTo5p(
            this.pairSplit.rows,
            this.anchorGene
        );
        return t
            ? snapBreakpointsToAnchorGene(oriented, t.txStart, t.txEnd)
            : oriented;
    }

    // The dominant 3′ partner of the resolved anchor — used for the directional
    // 5′→3′ caption over the tracks.
    @computed get partnerGene(): string | null {
        if (this.isGeneMode) return null;
        const anchorGene = this.anchorGene;
        const partners = this.orientedRows
            .filter(r => r.fivePrimeSymbol === anchorGene && r.threePrimeSymbol)
            .map(r => r.threePrimeSymbol as string);
        if (partners.length === 0) return null;
        return Object.entries(_.countBy(partners)).sort(
            (a, b) => b[1] - a[1]
        )[0][0];
    }

    @computed get partnerTranscript(): TranscriptData | undefined {
        return this.partnerGene
            ? this.transcriptForGene(this.partnerGene)
            : undefined;
    }

    // Histogram-only transcript overrides. Default to the canonical anchor /
    // partner transcript (unchanged snapping + strips); swap only what the two
    // AnchorGeneTrackRuler instances bin against.
    @computed get histogramAnchorTranscript(): TranscriptData | undefined {
        return (
            this.histogramTranscriptForGene(this.anchorGene) ??
            this.anchorTranscript
        );
    }

    @computed get histogramPartnerTranscript(): TranscriptData | undefined {
        return this.partnerGene
            ? this.histogramTranscriptForGene(this.partnerGene) ??
                  this.partnerTranscript
            : this.partnerTranscript;
    }

    // Per-side bp→px scale reference = the FULL exon length of the anchor /
    // partner reference transcript, NOT the largest retained length among the
    // currently-shown rows. This makes the scale absolute: a given exon is drawn
    // at the same pixel width regardless of which samples are filtered in — so
    // filtering to e.g. "exon 1 only" no longer stretches exon 1 to fill the
    // whole 5′ region. A full-length retention fills the region; any subset is
    // proportionally smaller. (Per-sample isoforms longer than the canonical
    // reference simply overflow and get clamped by computeJunctionAlignedLayout.)
    @computed get maxRetainedBp(): { bp5: number; bp3: number } {
        const anchorBp = this.anchorTranscript
            ? sumBp(this.anchorTranscript.exons)
            : 0;
        if (!this.isGeneMode) {
            return {
                bp5: anchorBp,
                bp3: this.partnerTranscript
                    ? sumBp(this.partnerTranscript.exons)
                    : 0,
            };
        }
        // Varying partner side: the longest loaded partner transcript, so every
        // partner fits its half. Partnerless/intragenic rows have no partner.
        const side = this.anchorSide;
        const partnerIs5p = side === '3p';
        let partnerBp = 0;
        this.orientedRows.forEach(r => {
            const c = partnerCategory(r, this.anchorGene, side);
            if (c === NO_PARTNER || c === INTRAGENIC) return;
            const t = this.transcriptForRow(r, partnerIs5p);
            if (t) partnerBp = Math.max(partnerBp, sumBp(t.exons));
        });
        return side === '5p'
            ? { bp5: anchorBp, bp3: partnerBp }
            : { bp5: partnerBp, bp3: anchorBp };
    }

    readonly linkHover = new LinkHover();

    // Width-dependent geometry as computeds so hover re-renders don't rebuild
    // link groups (render reads the same values).
    @computed get contentWidth(): number {
        return Math.max(
            MIN_CONTENT_WIDTH,
            WindowStore.size.width - HORIZONTAL_CHROME
        );
    }

    /** Gene mode widens the right gutter to fit the Partner column. */
    @computed get rightGutter(): number {
        return this.isGeneMode ? PARTNER_RIGHT_GUTTER : RIGHT_GUTTER;
    }

    /** Partner column label per strip; Gene mode only. */
    @computed get partnerLabelFor():
        | ((
              row: ComparisonRow,
              group?: CollapsedGroup
          ) => { text: string; color: string } | undefined)
        | undefined {
        if (!this.isGeneMode) return undefined;
        const gene = this.anchorGene;
        const side = this.anchorSide;
        const map = this.props.store.partnerColorMap;
        return (row, group) => {
            const cats = (group ? group.members : [row]).map(r =>
                partnerCategory(r, gene, side)
            );
            const text = groupPartnerLabel(cats);
            // "EML4 +2" is coloured by its leading (most common) category.
            return {
                text,
                color: colorFor(map, text.replace(/ \+\d+$/, '')),
            };
        };
    }

    @computed get frame() {
        return computeComparisonFrame(this.contentWidth, this.rightGutter);
    }

    private layoutFor(
        t: TranscriptData,
        drawX: number,
        drawW: number
    ): TrackLayout {
        return this.props.store.trackMode === 'genomic'
            ? pixelBinLayout(t, drawX, drawW)
            : featureSlotLayout(t, drawX, drawW);
    }

    /** Pair-mode links; undefined when arcs are off or a side has no transcript. */
    @computed get linkData():
        | {
              groups: LinkGroup[];
              rowLinkIds: (string | undefined)[];
              idByRow: Map<ComparisonRow, string>;
              groupById: Map<string, LinkGroup>;
          }
        | undefined {
        const { store } = this.props;
        const t5 = this.histogramAnchorTranscript;
        const t3 = this.histogramPartnerTranscript;
        if (
            this.isGeneMode ||
            !store.showLinks ||
            !t5 ||
            !t3 ||
            // each ruler (and so each arc end) renders only with its canonical
            // transcript; histogram overrides alone must not draw arcs
            !this.anchorTranscript ||
            !this.partnerTranscript
        )
            return undefined;
        const f = this.frame;
        const layout5 = this.layoutFor(t5, f.leftX, f.junctionX - f.leftX);
        const layout3 = this.layoutFor(
            t3,
            f.junctionX + PARTNER_TRACK_GAP,
            f.rightX - f.junctionX - PARTNER_TRACK_GAP
        );
        const rows = this.orientedRows;
        const { groups, rowLinkIds } = buildLinkGroups(rows, layout5, layout3);
        const idByRow = new Map<ComparisonRow, string>();
        rows.forEach((r, i) => {
            const id = rowLinkIds[i];
            if (id) idByRow.set(r, id);
        });
        const groupById = new Map(groups.map(g => [g.id, g]));
        return { groups, rowLinkIds, idByRow, groupById };
    }

    @computed get litBars():
        | { lit5: Set<string>; lit3: Set<string> }
        | undefined {
        const m = this.linkHover.matcher;
        const d = this.linkData;
        return m && d ? litBarKeys(d.groups, m) : undefined;
    }

    private barOpacityFrom = (
        lit: { lit5: Set<string>; lit3: Set<string> } | undefined,
        side: '5p' | '3p'
    ) => (key: string): number | undefined => {
        if (!lit) return undefined;
        return (side === '5p' ? lit.lit5 : lit.lit3).has(key) ? 1 : 0.2;
    };

    barOpacity = (side: '5p' | '3p') => this.barOpacityFrom(this.litBars, side);

    onBarHover = (side: '5p' | '3p') => (key: string | undefined): void => {
        const m = key ? matchBar(side, key) : undefined;
        // a bar with no links must not start a hover (it would dim everything)
        this.linkHover.set(m && this.linkData?.groups.some(m) ? m : undefined);
    };

    private idsFor(row: ComparisonRow, group?: CollapsedGroup): string[] {
        const d = this.linkData;
        if (!d) return [];
        const members = group ? group.members : [row];
        return members
            .map(m => d.idByRow.get(m))
            .filter((x): x is string => !!x);
    }

    onRowHover = (row?: ComparisonRow, group?: CollapsedGroup): void => {
        const ids = row ? this.idsFor(row, group) : [];
        this.linkHover.set(ids.length ? matchLinkIds(ids) : undefined);
    };

    private rowOpacityFrom = (m: LinkMatcher | undefined) => (
        row: ComparisonRow,
        group?: CollapsedGroup
    ): number => {
        const d = this.linkData;
        if (!m || !d) return 1;
        const hit = this.idsFor(row, group).some(id => {
            const g = d.groupById.get(id);
            return !!g && m(g);
        });
        return hit ? 1 : 0.2;
    };

    rowOpacity = (row: ComparisonRow, group?: CollapsedGroup): number =>
        this.rowOpacityFrom(this.linkHover.matcher)(row, group);

    // Map sampleId → studyId from the raw SVs. ComparisonRow only carries
    // sampleId (via FusionEvent.tumorId), but the studyView sample-identifier
    // filter needs {studyId, sampleId}. The raw SVs preserve studyId.
    @computed get studyIdBySampleId(): Map<string, string> {
        const map = new Map<string, string>();
        this.props.store.structuralVariants.forEach(sv => {
            if (sv.sampleId && !map.has(sv.sampleId)) {
                map.set(sv.sampleId, sv.studyId);
            }
        });
        return map;
    }

    // Effective collapse key: user override, else data-type-driven (fusion →
    // exon structure, SV → breakpoint feature).
    @computed get collapseKind(): CollapseKind {
        return (
            this.props.store.collapseKindOverride ??
            (this.hasFusionAnnotation ? 'exonStructure' : 'breakpointFeature')
        );
    }

    // Structural groups for the collapsed strip view. Keyed on data observables
    // (orientedRows, transcriptsByKey, collapseKind) so it only recomputes when
    // rows/transcripts/kind change — not on scroll or window resize. Rows whose
    // transcripts haven't loaded degrade to their own singleton group.
    @computed get collapsedGroups(): CollapsedGroup[] {
        const rows = this.orientedRows;
        if (this.collapseKind === 'exonStructure') {
            return groupRows(rows, row => {
                const t5 = this.transcriptForRow(row, true);
                if (!t5) return `raw:${row.sampleId}`;
                const key = exonStructureKey(
                    t5,
                    row.anchorBreakpoint,
                    this.transcriptForRow(row, false),
                    row.partnerBreakpoint
                );
                // exonStructureKey holds exon numbers only, so different
                // partners with the same numbers would merge in Gene mode.
                return this.isGeneMode
                    ? `${partnerCategory(
                          row,
                          this.anchorGene,
                          this.anchorSide
                      )}|${key}`
                    : key;
            });
        }
        // breakpointFeature: one pass over the anchor transcript's features so
        // the label lookup stays O(rows), matched to iteration order by index.
        const anchorTranscript = this.anchorTranscript;
        if (!anchorTranscript) {
            return groupRows(rows, row => `raw:${row.sampleId}`);
        }
        const labelByIndex = rows.map(() => 'off-transcript');
        const { features } = assignBreakpointsToFeatures(
            anchorTranscript,
            rows.map(r => anchorEndpoint(r, this.anchorSide).breakpoint)
        );
        features.forEach(f =>
            f.members.forEach(m => {
                labelByIndex[m] = f.label;
            })
        );
        return groupRows(rows, (_row, i) => labelByIndex[i]);
    }

    // Human-readable label for a collapsed group's cohort filter pill.
    groupLabel(group: CollapsedGroup): string {
        if (this.collapseKind === 'breakpointFeature') {
            return `${this.anchorGene} ${group.key}`;
        }
        const pretty = group.key
            .replace('5p:', '5′E')
            .replace('|3p:', ' · 3′E');
        if (this.isGeneMode) {
            // Gene-mode keys are `<category>|5p:…|3p:…` and partnerGene is null.
            const sep = pretty.indexOf('|');
            const gene = this.anchorGene;
            if (sep < 0) return `${gene} ${pretty}`;
            const cat = pretty.slice(0, sep);
            const rest = pretty.slice(sep + 1);
            if (cat === NO_PARTNER || cat === INTRAGENIC) {
                return `${gene} ${cat} ${rest}`;
            }
            return this.anchorSide === '5p'
                ? `${gene}→${cat} ${rest}`
                : `${cat}→${gene} ${rest}`;
        }
        return `${this.anchorGene}→${this.partnerGene || ''} ${pretty}`;
    }

    @computed get lollipopCategoryOf(): (r: ComparisonRow) => string {
        const by = this.props.store.lollipopColorBy;
        if (by === 'frame') return r => r.frame;
        if (by === 'svType') return r => r.event.callMethod || 'unknown';
        return r => partnerCategory(r, this.anchorGene, this.anchorSide);
    }

    @computed get lollipopColorOf(): (c: string) => string {
        const { store } = this.props;
        if (store.lollipopColorBy === 'frame') {
            return c => {
                const st = frameStatusStyle(c as FrameStatus);
                return st.hollow ? '#ced4da' : st.fill;
            };
        }
        if (store.lollipopColorBy === 'svType') {
            const bySamples = new Map<string, Set<string>>();
            store.sideRows.kept.forEach(r => {
                const c = r.event.callMethod || 'unknown';
                bySamples.set(
                    c,
                    (bySamples.get(c) ?? new Set<string>()).add(r.sampleId)
                );
            });
            const m = rankedColorMap(
                Array.from(bySamples.keys()).sort(
                    (a, b) =>
                        bySamples.get(b)!.size - bySamples.get(a)!.size ||
                        a.localeCompare(b)
                )
            );
            return c => colorFor(m, c);
        }
        return c => colorFor(store.partnerColorMap, c);
    }

    @computed get lollipopCategoryLabel(): (c: string) => string {
        return this.props.store.lollipopColorBy === 'frame'
            ? c => frameStatusStyle(c as FrameStatus).label
            : c => c;
    }

    /** Gene mode + Lollipop track selected (gates the track, select, legend). */
    @computed get lollipopOn(): boolean {
        return this.isGeneMode && this.props.store.trackMode === 'lollipop';
    }

    /** Frame / SV-type categories present, with their swatch colours. */
    @computed get lollipopLegend(): { label: string; color: string }[] {
        const { store } = this.props;
        if (store.lollipopColorBy === 'partner') return [];
        const cats = _.uniq(store.sideRows.kept.map(this.lollipopCategoryOf));
        return cats.sort().map(c => ({
            label: this.lollipopCategoryLabel(c),
            color: this.lollipopColorOf(c),
        }));
    }

    handleSelectSamples = (sampleIds: string[], label: string): void => {
        const { onFilterCohortBySamples } = this.props;
        if (!onFilterCohortBySamples) return;
        const samples = Array.from(new Set(sampleIds.filter(Boolean))).map(
            sampleId => ({
                studyId: this.studyIdBySampleId.get(sampleId) || '',
                sampleId,
            })
        );
        if (samples.length === 0) return;
        onFilterCohortBySamples(FUSION_BREAKPOINT_FILTER_KEY, label, samples);
    };

    // Filter the cohort to a collapsed group's samples, reusing the same
    // materialized-identifier path as the histogram-bar click.
    handleSelectGroup = (group: CollapsedGroup): void =>
        this.handleSelectSamples(group.sampleIds, this.groupLabel(group));

    // Turn a clicked bar's member row-indices into distinct SampleIdentifiers
    // and hand them to the studyView cohort filter. `rows` is the same oriented
    // row array whose breakpoints were binned, so member index === row index.
    // Works for both tracks: the caller passes the sampleId list aligned to the
    // breakpoints it fed the ruler (5′ = all rows; 3′ = rows with a partner
    // breakpoint), so members index into that same list.
    handleSelectBar = (
        sampleIdsByBreakpointIndex: string[],
        selection: { members: number[]; label: string },
        trackLabel: string
    ): void => {
        const { onFilterCohortBySamples } = this.props;
        if (!onFilterCohortBySamples) return;
        const seen = new Set<string>();
        const samples: CohortSampleIdentifier[] = [];
        selection.members.forEach(i => {
            const sampleId = sampleIdsByBreakpointIndex[i];
            if (!sampleId || seen.has(sampleId)) return;
            seen.add(sampleId);
            samples.push({
                studyId: this.studyIdBySampleId.get(sampleId) || '',
                sampleId,
            });
        });
        if (samples.length === 0) return;
        onFilterCohortBySamples(
            FUSION_BREAKPOINT_FILTER_KEY,
            `${trackLabel} breakpoint: ${selection.label}`,
            samples
        );
    };

    // The fusion-viewer deep link for a sample, or undefined when its studyId
    // is unknown (so the header can omit a dead link).
    expandedSampleLink = (sampleId: string): string | undefined => {
        const studyId = this.studyIdBySampleId.get(sampleId);
        if (!studyId) return undefined;
        return sampleFusionViewerHref(studyId, sampleId);
    };

    private renderReciprocalNote() {
        const reciprocal = this.pairSplit.reciprocal;
        if (reciprocal.length === 0) return null;
        const five =
            callerFivePrimeSymbol(
                reciprocal[0].event.annotation,
                reciprocal[0].event.eventLabel
            ) || '';
        const three = this.anchorGene;
        const n = reciprocal.length;
        return (
            <div style={{ fontSize: 11, margin: '0 0 4px' }}>
                <a
                    data-testid="pair-reciprocal-note"
                    style={{ cursor: 'pointer' }}
                    onClick={() =>
                        this.props.store.setAnchor({
                            mode: 'gene',
                            gene: five,
                            side: '5p',
                        })
                    }
                >
                    {n} reciprocal {five} → {three} event{n === 1 ? '' : 's'}{' '}
                    (called with {five} as 5′) not shown — view {five} as 5′
                </a>
            </div>
        );
    }

    render() {
        const { store } = this.props;
        const anchorGene = this.anchorGene;
        const anchorTranscript = this.anchorTranscript;
        const rows = this.orientedRows;
        const partnerGene = this.partnerGene;
        const partnerTranscript = this.partnerTranscript;
        const side = this.anchorSide;
        const histogramAnchorTranscript = this.histogramAnchorTranscript;
        const histogramPartnerTranscript = this.histogramPartnerTranscript;
        const anchorPicker = this.renderTranscriptPicker(anchorGene);
        const partnerPicker = partnerGene
            ? this.renderTranscriptPicker(partnerGene)
            : null;
        const expandedRow = rows.find(
            r => r.sampleId === this.expandedSampleId
        );

        // Responsive: reading WindowStore.size (a MobX observable) inside this
        // @observer render makes the layout reflow on window resize with no
        // extra wiring.
        const contentWidth = this.contentWidth;
        // Read hover state once here: these reads make the view re-render on
        // hover, and the children's opacity callbacks close over them.
        const lit = this.litBars;
        const matcher = this.linkHover.matcher;
        const linksOn = !!this.linkData;
        // Responsive strip-list height: fill most of the window so more samples
        // are visible at once (was a fixed 500px).
        const stripViewportHeight = Math.max(
            MIN_STRIP_VIEWPORT,
            WindowStore.size.height - STRIP_VERTICAL_CHROME
        );
        const frame = this.frame;
        // Cheap bp→px division (needs the width-dependent region widths); the
        // absolute per-side scale reference (maxRetainedBp) is a @computed above.
        // Reuses the region math previously inline in FusionStripList.
        const region5W = frame.junctionX - JUNCTION_GAP / 2 - frame.leftX;
        const region3W = frame.rightX - (frame.junctionX + JUNCTION_GAP / 2);
        const { bp5, bp3 } = this.maxRetainedBp;
        const pxPerBp5p = sharedPxPerBp(bp5, region5W);
        const pxPerBp3p = sharedPxPerBp(bp3, region3W);

        const anchorHalf =
            side === '5p'
                ? {
                      drawX: frame.leftX,
                      drawW: frame.junctionX - frame.leftX,
                      labelX: frame.leftX - 10,
                      labelAnchor: 'end' as const,
                      fill: COLOR_5PRIME,
                  }
                : {
                      drawX: frame.junctionX + PARTNER_TRACK_GAP,
                      drawW: frame.rightX - frame.junctionX - PARTNER_TRACK_GAP,
                      labelX: frame.rightX + 10,
                      labelAnchor: 'start' as const,
                      fill: COLOR_3PRIME,
                  };
        const anchorBreakpoints = rows.map(
            r => anchorEndpoint(r, side).breakpoint
        );

        return (
            <div>
                <AnchorModeBar store={store} />
                <FusionRecurrenceTable
                    store={store}
                    hasFusionAnnotation={this.hasFusionAnnotation}
                />
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        margin: '8px 0 2px',
                    }}
                >
                    <span style={{ fontSize: 11, color: '#6c757d' }}>
                        Breakpoint histogram
                    </span>
                    <ButtonGroup>
                        {this.trackModeButton(
                            'feature',
                            'By feature',
                            "Bin breakpoints by the reference transcript's exons, introns and promoter"
                        )}
                        {this.trackModeButton(
                            'genomic',
                            'Genomic',
                            'Bin breakpoints by fixed genomic width (drawn to scale)'
                        )}
                        {this.isGeneMode &&
                            this.trackModeButton(
                                'lollipop',
                                'Lollipop',
                                'One stick per exon/intron: height = samples, head split by partner'
                            )}
                    </ButtonGroup>
                    {this.lollipopOn && (
                        <select
                            data-testid="lollipop-colorby"
                            aria-label="Colour lollipop by"
                            value={store.lollipopColorBy}
                            onChange={e =>
                                store.setLollipopColorBy(
                                    e.target
                                        .value as typeof store.lollipopColorBy
                                )
                            }
                            style={{ fontSize: 11 }}
                        >
                            <option value="partner">Colour: partner</option>
                            <option value="frame">Colour: frame</option>
                            <option value="svType">Colour: SV type</option>
                        </select>
                    )}
                    {this.lollipopOn && this.lollipopLegend.length > 0 && (
                        <span
                            data-testid="lollipop-legend"
                            style={{ fontSize: 11, color: '#495057' }}
                        >
                            {this.lollipopLegend.map(l => (
                                <span key={l.label} style={{ marginRight: 8 }}>
                                    <span
                                        style={{
                                            display: 'inline-block',
                                            width: 9,
                                            height: 9,
                                            borderRadius: '50%',
                                            background: l.color,
                                            border: '1px solid #999',
                                            marginRight: 3,
                                        }}
                                    />
                                    {l.label}
                                </span>
                            ))}
                        </span>
                    )}
                    {!this.isGeneMode && (
                        <ButtonGroup>
                            {this.segmentButton(
                                store.showLinks,
                                'links-toggle',
                                'Links',
                                'Show arcs joining each 5′ breakpoint location to the 3′ location it fused with',
                                () => store.setShowLinks(!store.showLinks)
                            )}
                        </ButtonGroup>
                    )}
                    <span
                        style={{
                            fontSize: 11,
                            color: '#6c757d',
                            marginLeft: 12,
                        }}
                    >
                        Rows
                    </span>
                    <ButtonGroup>
                        {this.segmentButton(
                            store.stripMode === 'sample',
                            'stripmode-sample',
                            'Per sample',
                            'One labeled row per sample',
                            () => store.setStripMode('sample')
                        )}
                        {this.segmentButton(
                            store.stripMode === 'dense',
                            'stripmode-dense',
                            'Dense',
                            'One thin row per sample — hover for the sample, click to expand',
                            () => store.setStripMode('dense')
                        )}
                        {this.segmentButton(
                            store.stripMode === 'collapsed',
                            'stripmode-collapsed',
                            'Collapsed',
                            'Group structurally-identical products, ranked ×N; click a group to filter the cohort',
                            () => store.setStripMode('collapsed')
                        )}
                    </ButtonGroup>
                    <span
                        style={{
                            fontSize: 11,
                            color: '#6c757d',
                            marginLeft: 12,
                        }}
                    >
                        Exons
                    </span>
                    <ButtonGroup>
                        {this.segmentButton(
                            store.exonMode === 'retained',
                            'exonmode-retained',
                            'Retained',
                            'Draw only the exons kept by the fusion',
                            () => store.setExonMode('retained')
                        )}
                        {this.segmentButton(
                            store.exonMode === 'full',
                            'exonmode-full',
                            'Full transcript',
                            'Draw every exon of both partners, greying out the ones the fusion excludes',
                            () => store.setExonMode('full')
                        )}
                    </ButtonGroup>
                    {store.exonMode === 'full' && (
                        <>
                            <span
                                style={{
                                    fontSize: 11,
                                    color: '#6c757d',
                                    marginLeft: 12,
                                }}
                            >
                                Ladder
                            </span>
                            <ButtonGroup>
                                {this.segmentButton(
                                    store.ladderMode === 'reference',
                                    'laddermode-reference',
                                    'Reference',
                                    'Use the canonical isoform for every row so exon columns align down the list',
                                    () => store.setLadderMode('reference')
                                )}
                                {this.segmentButton(
                                    store.ladderMode === 'perRow',
                                    'laddermode-perRow',
                                    'Per-row',
                                    "Use each sample's own caller-selected isoform — faithful per sample, ragged across rows",
                                    () => store.setLadderMode('perRow')
                                )}
                            </ButtonGroup>
                        </>
                    )}
                    <span
                        style={{
                            fontSize: 11,
                            color: '#6c757d',
                            marginLeft: 12,
                        }}
                    >
                        Junction labels
                    </span>
                    <ButtonGroup>
                        {this.segmentButton(
                            store.junctionLabelMode === 'inline-tooltip',
                            'junctionmode-inline-tooltip',
                            'Inline + tip',
                            'Exon label at the seam; dense mode shows it in the hover tooltip',
                            () => store.setJunctionLabelMode('inline-tooltip')
                        )}
                        {this.segmentButton(
                            store.junctionLabelMode === 'inline-both',
                            'junctionmode-inline-both',
                            'Inline',
                            'Exon label at the seam in every row mode (dense floats it above)',
                            () => store.setJunctionLabelMode('inline-both')
                        )}
                        {this.segmentButton(
                            store.junctionLabelMode === 'gutter',
                            'junctionmode-gutter',
                            'Gutter',
                            'Exon label in the right gutter in every row mode',
                            () => store.setJunctionLabelMode('gutter')
                        )}
                    </ButtonGroup>
                    {store.stripMode === 'collapsed' && (
                        <>
                            <span
                                style={{
                                    fontSize: 11,
                                    color: '#6c757d',
                                    marginLeft: 12,
                                }}
                            >
                                Group by
                            </span>
                            <ButtonGroup>
                                {this.segmentButton(
                                    this.collapseKind === 'exonStructure',
                                    'collapsekind-exonStructure',
                                    'Product',
                                    'Group by retained 5′/3′ exon structure (the drawn fusion product)',
                                    () =>
                                        store.setCollapseKindOverride(
                                            'exonStructure'
                                        )
                                )}
                                {this.segmentButton(
                                    this.collapseKind === 'breakpointFeature',
                                    'collapsekind-breakpointFeature',
                                    'Breakpoint',
                                    'Group by the anchor breakpoint feature (exon / intron / promoter)',
                                    () =>
                                        store.setCollapseKindOverride(
                                            'breakpointFeature'
                                        )
                                )}
                            </ButtonGroup>
                        </>
                    )}
                </div>
                {anchorTranscript && this.isGeneMode && (
                    <div
                        data-testid="gene-anchor-label"
                        style={{ fontWeight: 600, margin: '8px 0 4px' }}
                    >
                        {anchorGene}{' '}
                        <span
                            style={{
                                color: '#888',
                                fontWeight: 400,
                                fontSize: '0.85em',
                            }}
                        >
                            (as {side === '5p' ? '5′' : '3′'} partner — all
                            partners)
                        </span>
                    </div>
                )}
                {anchorTranscript && !this.isGeneMode && partnerGene && (
                    <div
                        data-testid="fusion-direction-label"
                        style={{ fontWeight: 600, margin: '8px 0 4px' }}
                    >
                        {anchorGene} → {partnerGene}{' '}
                        <span
                            style={{
                                color: '#888',
                                fontWeight: 400,
                                fontSize: '0.85em',
                            }}
                        >
                            (5′ → 3′)
                        </span>
                    </div>
                )}
                {this.renderReciprocalNote()}
                {anchorTranscript && (anchorPicker || partnerPicker) && (
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                            margin: '2px 0 4px',
                            fontSize: 11,
                            color: '#6c757d',
                        }}
                    >
                        <span>Histogram transcript:</span>
                        {anchorPicker && (
                            <>
                                <span>{anchorGene}</span>
                                {anchorPicker}
                            </>
                        )}
                        {partnerGene && partnerPicker && (
                            <>
                                <span style={{ marginLeft: 8 }}>
                                    {partnerGene}
                                </span>
                                {partnerPicker}
                            </>
                        )}
                    </div>
                )}
                <div style={{ width: contentWidth }}>
                    {/* Rows exist but the anchor gene's transcript isn't
                        available yet (still fetching, or Genome Nexus has no
                        transcript for it in this build) — show a note instead of
                        a silent blank. */}
                    {!anchorTranscript && rows.length > 0 && (
                        <div
                            data-testid="anchor-transcript-pending"
                            style={{
                                padding: '12px 0',
                                color: '#6c757d',
                                fontSize: 12,
                            }}
                        >
                            Loading transcript for{' '}
                            {anchorGene || 'the anchor gene'}…
                        </div>
                    )}
                    {anchorTranscript && (
                        <svg
                            width={contentWidth}
                            height={getAnchorTrackHeight(rows)}
                        >
                            {/* 5′ anchor gene — left half, breakpoints fan to
                                the junction, label in the left gutter */}
                            <AnchorGeneTrackRuler
                                transcript={
                                    histogramAnchorTranscript ||
                                    anchorTranscript
                                }
                                symbol={anchorGene}
                                breakpoints={anchorBreakpoints}
                                drawX={anchorHalf.drawX}
                                drawW={anchorHalf.drawW}
                                labelX={anchorHalf.labelX}
                                labelAnchor={anchorHalf.labelAnchor}
                                fill={anchorHalf.fill}
                                mode={
                                    store.trackMode === 'lollipop'
                                        ? 'feature'
                                        : store.trackMode
                                }
                                hideHistogram={this.lollipopOn}
                                barOpacity={
                                    linksOn
                                        ? this.barOpacityFrom(lit, '5p')
                                        : undefined
                                }
                                onBarHover={
                                    this.linkData
                                        ? this.onBarHover('5p')
                                        : undefined
                                }
                                onSelectBar={
                                    this.props.onFilterCohortBySamples
                                        ? sel =>
                                              this.handleSelectBar(
                                                  rows.map(r => r.sampleId),
                                                  sel,
                                                  anchorGene
                                              )
                                        : undefined
                                }
                            />
                            {this.lollipopOn &&
                                (histogramAnchorTranscript ||
                                    anchorTranscript) && (
                                    <AnchorLollipopTrack
                                        sticks={buildLollipopSticks(
                                            rows,
                                            featureSlotLayout(
                                                (histogramAnchorTranscript ||
                                                    anchorTranscript)!,
                                                anchorHalf.drawX,
                                                anchorHalf.drawW
                                            ),
                                            side,
                                            this.lollipopCategoryOf
                                        )}
                                        colorOf={this.lollipopColorOf}
                                        categoryLabel={
                                            this.lollipopCategoryLabel
                                        }
                                        onSelect={
                                            this.props.onFilterCohortBySamples
                                                ? s =>
                                                      this.handleSelectSamples(
                                                          s.sampleIds,
                                                          `${anchorGene} breakpoint: ${slotLabel(
                                                              s.key
                                                          )}`
                                                      )
                                                : undefined
                                        }
                                    />
                                )}
                            {/* 3′ partner gene — right half, its own breakpoint
                                density, label in the right gutter */}
                            {partnerTranscript && (
                                <AnchorGeneTrackRuler
                                    transcript={
                                        histogramPartnerTranscript ||
                                        partnerTranscript
                                    }
                                    symbol={partnerGene || ''}
                                    breakpoints={rows
                                        .filter(
                                            r => r.partnerBreakpoint !== null
                                        )
                                        .map(
                                            r => r.partnerBreakpoint as number
                                        )}
                                    drawX={frame.junctionX + PARTNER_TRACK_GAP}
                                    drawW={
                                        frame.rightX -
                                        frame.junctionX -
                                        PARTNER_TRACK_GAP
                                    }
                                    labelX={frame.rightX + 10}
                                    labelAnchor="start"
                                    fill={COLOR_3PRIME}
                                    mode={
                                        store.trackMode === 'lollipop'
                                            ? 'feature'
                                            : store.trackMode
                                    }
                                    barOpacity={
                                        linksOn
                                            ? this.barOpacityFrom(lit, '3p')
                                            : undefined
                                    }
                                    onBarHover={
                                        this.linkData
                                            ? this.onBarHover('3p')
                                            : undefined
                                    }
                                    onSelectBar={
                                        this.props.onFilterCohortBySamples
                                            ? sel =>
                                                  this.handleSelectBar(
                                                      rows
                                                          .filter(
                                                              r =>
                                                                  r.partnerBreakpoint !==
                                                                  null
                                                          )
                                                          .map(r => r.sampleId),
                                                      sel,
                                                      partnerGene || ''
                                                  )
                                            : undefined
                                    }
                                />
                            )}
                            {this.isGeneMode && (
                                <text
                                    data-testid="partners-vary-caption"
                                    x={
                                        side === '5p'
                                            ? (frame.junctionX + frame.rightX) /
                                              2
                                            : (frame.leftX + frame.junctionX) /
                                              2
                                    }
                                    y={60}
                                    textAnchor="middle"
                                    fontSize={11}
                                    fontStyle="italic"
                                    fill="#999"
                                >
                                    partners vary — see table
                                </text>
                            )}
                        </svg>
                    )}
                    {this.linkData && (
                        <BreakpointLinkArcs
                            groups={this.linkData.groups}
                            width={contentWidth}
                            height={ARC_BAND_HEIGHT}
                            matcher={matcher}
                            onHover={g =>
                                this.linkHover.set(
                                    g ? matchLinkIds([g.id]) : undefined
                                )
                            }
                        />
                    )}
                    {/* Column legend for the per-sample strips below. Columns
                        align to the strip geometry: sample IDs are right-aligned
                        to the left gutter; the fusion product spans the drawable
                        region (centered here); the right gutter shows predicted
                        reading frame + supporting-read count (Nr). */}
                    <div
                        style={{
                            position: 'relative',
                            height: 18,
                            fontSize: 11,
                            fontWeight: 600,
                            color: '#6c757d',
                            width: contentWidth,
                            borderBottom: '1px solid #e5e5e5',
                            paddingBottom: 3,
                            marginBottom: 4,
                        }}
                    >
                        <span
                            style={{
                                position: 'absolute',
                                left: 0,
                                width: frame.leftX - 10,
                                textAlign: 'right',
                            }}
                        >
                            {store.stripMode === 'collapsed'
                                ? 'Count'
                                : store.stripMode === 'dense'
                                ? ''
                                : 'Sample'}
                        </span>
                        <span
                            style={{
                                position: 'absolute',
                                left: (frame.leftX + frame.rightX) / 2,
                                transform: 'translateX(-50%)',
                            }}
                        >
                            {store.exonMode === 'full'
                                ? 'Fusion product (5′ → 3′ full transcripts, lost exons greyed)'
                                : 'Fusion product (5′ → 3′ retained exons)'}
                        </span>
                        <DefaultTooltip
                            overlay="Predicted reading frame at the junction (e.g. In-frame / Unknown), and the number of sequencing reads supporting the event (Nr)"
                            placement="topRight"
                        >
                            <span
                                style={{
                                    position: 'absolute',
                                    left: frame.rightX + 8,
                                    cursor: 'help',
                                    borderBottom: '1px dotted #adb5bd',
                                }}
                            >
                                {store.stripMode === 'collapsed'
                                    ? 'Frame'
                                    : 'Frame · reads'}
                            </span>
                        </DefaultTooltip>
                        {this.isGeneMode && (
                            <span
                                data-testid="partner-header"
                                style={{
                                    position: 'absolute',
                                    left: frame.rightX + 8 + 112,
                                }}
                            >
                                Partner
                            </span>
                        )}
                    </div>
                    {store.exonMode === 'full' &&
                        store.ladderMode === 'reference' &&
                        side === '5p' &&
                        anchorTranscript && (
                            <ExonRuler
                                transcript5p={anchorTranscript}
                                transcript3p={this.partnerTranscript}
                                width={contentWidth}
                                leftX={frame.leftX}
                                junctionX={frame.junctionX}
                                rightX={frame.rightX}
                                pxPerBp5p={pxPerBp5p}
                                pxPerBp3p={pxPerBp3p}
                            />
                        )}
                    <FusionStripList
                        rowOpacity={
                            linksOn ? this.rowOpacityFrom(matcher) : undefined
                        }
                        onRowHover={this.linkData ? this.onRowHover : undefined}
                        anchorSide={side}
                        rightGutter={this.rightGutter}
                        partnerLabelFor={this.partnerLabelFor}
                        rows={rows}
                        transcriptForRow={this.transcriptForRow}
                        width={contentWidth}
                        viewportHeight={stripViewportHeight}
                        pxPerBp5p={pxPerBp5p}
                        pxPerBp3p={pxPerBp3p}
                        alignment={store.alignment}
                        mode={store.stripMode}
                        junctionLabelMode={store.junctionLabelMode}
                        groups={
                            store.stripMode === 'collapsed'
                                ? this.collapsedGroups
                                : undefined
                        }
                        onSelectGroup={
                            this.props.onFilterCohortBySamples
                                ? this.handleSelectGroup
                                : undefined
                        }
                        onExpand={id =>
                            runInAction(() => {
                                this.expandedSampleId = id;
                            })
                        }
                        exonMode={store.exonMode}
                        ladderMode={store.ladderMode}
                        referenceTranscript5p={
                            side === '5p'
                                ? anchorTranscript
                                : this.partnerTranscript
                        }
                        referenceTranscript3p={
                            side === '3p'
                                ? anchorTranscript
                                : this.partnerTranscript
                        }
                    />
                </div>
                {expandedRow && (
                    <div data-testid="expanded-diagram">
                        {(() => {
                            const sampleId = expandedRow.sampleId;
                            const pair = expandedRow.threePrimeSymbol
                                ? `${expandedRow.fivePrimeSymbol} → ${expandedRow.threePrimeSymbol}`
                                : expandedRow.fivePrimeSymbol;
                            const link = this.expandedSampleLink(sampleId);
                            return (
                                <div
                                    data-testid="expanded-header"
                                    style={{
                                        display: 'flex',
                                        alignItems: 'baseline',
                                        gap: 12,
                                        margin: '10px 0 2px',
                                        fontSize: 12,
                                    }}
                                >
                                    <span style={{ fontWeight: 600 }}>
                                        {sampleId}
                                    </span>
                                    <span style={{ color: '#495057' }}>
                                        {pair}
                                    </span>
                                    <span style={{ color: '#6c757d' }}>
                                        {expandedRow.frame === 'unknown'
                                            ? 'Unknown frame status'
                                            : frameStatusStyle(
                                                  expandedRow.frame
                                              ).label}
                                    </span>
                                    {link && (
                                        <a
                                            data-testid="expanded-fusion-link"
                                            href={link}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                        >
                                            Open in fusion viewer ↗
                                        </a>
                                    )}
                                </div>
                            );
                        })()}
                        {(() => {
                            // The sample's caller-selected isoforms (canonical
                            // fallback), so the expanded diagram opens on the
                            // transcript the caller actually reported.
                            const t5 = this.transcriptForRow(expandedRow, true);
                            const t3 = this.transcriptForRow(
                                expandedRow,
                                false
                            );
                            if (!t5) return null;
                            // Orient the event so gene1 = the resolved 5′
                            // partner and gene2 = the 3′ partner, with the
                            // resolved breakpoints. Without this the diagram
                            // draws the 5′ transcript (TMPRSS2) but labels it
                            // with the raw gene1 (ERG) position.
                            const e = expandedRow.event;
                            const g5IsGene1 =
                                e.gene1.symbol === expandedRow.fivePrimeSymbol;
                            const g5Raw = g5IsGene1 ? e.gene1 : e.gene2!;
                            const g3Raw = g5IsGene1 ? e.gene2 : e.gene1;
                            const orientedEvent = {
                                ...e,
                                gene1: {
                                    ...g5Raw,
                                    position: expandedRow.anchorBreakpoint,
                                },
                                gene2: g3Raw
                                    ? {
                                          ...g3Raw,
                                          position:
                                              expandedRow.partnerBreakpoint ??
                                              g3Raw.position,
                                      }
                                    : null,
                                fusion: g3Raw
                                    ? `${expandedRow.fivePrimeSymbol}::${expandedRow.threePrimeSymbol}`
                                    : expandedRow.fivePrimeSymbol,
                            };
                            return (
                                <FusionDiagramSVG
                                    fusion={orientedEvent}
                                    forteTranscript5p={t5}
                                    forteTranscript3p={t3}
                                    activeTranscript5p={t5}
                                    activeTranscript3p={t3}
                                    onActivate5p={() => undefined}
                                    onActivate3p={() => undefined}
                                />
                            );
                        })()}
                    </div>
                )}
            </div>
        );
    }
}
