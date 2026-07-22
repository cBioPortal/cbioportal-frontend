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
import {
    resolveComparisonRows,
    orientComparisonRowsTo5p,
    snapBreakpointsToAnchorGene,
    ComparisonRow,
} from './data/comparisonRows';
import {
    CollapseKind,
    CollapsedGroup,
    exonStructureKey,
    groupRows,
} from './data/collapseRows';
import FusionRecurrenceTable from './FusionRecurrenceTable';
import { FusionDiagramSVG } from './FusionDiagramSVG';
import { TranscriptData, COLOR_5PRIME, COLOR_3PRIME } from './data/types';
import FusionSummaryTableWidget from 'pages/studyView/charts/fusionSummary/FusionSummaryTableWidget';
import WindowStore from 'shared/components/window/WindowStore';
import {
    computeComparisonFrame,
    sharedPxPerBp,
} from './components/comparisonFrame';
import { JUNCTION_GAP } from './components/fusionProductHelpers';
import { fetchTranscriptsForGeneWithFallback } from './data/genomeNexusTranscriptService';

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

// Transcript cache key: a gene may be fetched as its canonical isoform (empty
// id) AND as one or more caller-selected isoforms. Keyed on genome build too:
// `store.genomeBuild` is set asynchronously from the study, so a fetch before
// the build is known must not shadow the correct-build transcript. After a
// build change, lookups miss under the new key and refetch (stale entries are
// simply unused).
const txKey = (build: string, symbol: string, transcriptId?: string) =>
    `${build}|${symbol}|${transcriptId || ''}`;

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
    // Keyed by `${symbol}|${transcriptId}` — canonical (empty id) plus each
    // caller-selected isoform. Deduped so N samples sharing an isoform store
    // (and, via Genome Nexus per-gene caching, fetch) once.
    @observable.ref transcriptsByKey: Map<string, TranscriptData> = new Map();

    // Full transcript list per gene (feature 1 histogram picker), keyed by
    // `${build}|${symbol}`. Populated from the canonical fetch, which returns
    // every transcript for the gene. Only the histogram picker reads this.
    @observable.ref transcriptOptionsByGene: Map<
        string,
        TranscriptData[]
    > = new Map();
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

    // Deduped (symbol, transcriptId) requests: the canonical isoform of every
    // gene (for the anchor track + fallback) plus each partner's caller-selected
    // isoform.
    @computed get transcriptRequests(): {
        symbol: string;
        transcriptId: string;
    }[] {
        const build = this.props.store.genomeBuild;
        const map = new Map<string, { symbol: string; transcriptId: string }>();
        const add = (symbol: string, transcriptId: string) => {
            if (!symbol) return;
            const k = txKey(build, symbol, transcriptId);
            if (!map.has(k)) map.set(k, { symbol, transcriptId });
        };
        this.props.store.comparisonRows.forEach(r => {
            const e = r.event;
            add(e.gene1.symbol, '');
            add(e.gene1.symbol, e.gene1.selectedTranscriptId || '');
            if (e.gene2) {
                add(e.gene2.symbol, '');
                add(e.gene2.symbol, e.gene2.selectedTranscriptId || '');
            }
        });
        return Array.from(map.values());
    }

    // One segment of the histogram-mode toggle, styled like cBioPortal's
    // axis-scale switch (active = filled grey, inactive = outline).
    trackModeButton(
        mode: 'feature' | 'genomic',
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
        if (!store.anchor && store.pairSummaries.length > 0) {
            store.setAnchor({
                mode: 'pair',
                key: store.pairSummaries[0].key,
            });
        }
    }

    // Transcript fetching is driven by a MobX reaction, NOT componentDidUpdate.
    // Under mobx-react's class @observer, an observable change (e.g. store.anchor
    // on a pair click) re-renders only the inner Observer — the class's
    // componentDidUpdate does NOT fire — so a lifecycle-driven fetch would never
    // run for a newly-selected pair. The reaction tracks the outstanding request
    // set (+ default-anchor need) directly and refires deterministically.
    private fetchReactionDisposer?: () => void;

    componentDidMount() {
        this.fetchReactionDisposer = reaction(
            () => {
                const s = this.props.store;
                const needsDefaultAnchor =
                    !s.anchor && s.pairSummaries.length > 0;
                const outstanding = this.outstandingTranscriptRequests()
                    .map(r => `${r.symbol}|${r.transcriptId}`)
                    .join(',');
                return `${needsDefaultAnchor}|${s.genomeBuild}|${outstanding}`;
            },
            () => {
                this.ensureDefaultAnchor();
                this.fetchTranscripts();
            },
            { fireImmediately: true }
        );
    }

    componentWillUnmount() {
        this.fetchReactionDisposer?.();
    }

    // Transcript keys currently being fetched, so overlapping reaction firings
    // don't launch duplicate requests for the same gene. Tracked PER KEY (not a
    // single boolean) and cleared as each request settles — a hung or failed
    // request can therefore never permanently wedge the fetcher. Commits MERGE
    // into the current map, so overlapping fetches are safe regardless.
    private inFlightTxKeys = new Set<string>();

    private outstandingTranscriptRequests(): {
        symbol: string;
        transcriptId: string;
    }[] {
        const build = this.props.store.genomeBuild;
        return this.transcriptRequests.filter(
            req =>
                !this.transcriptsByKey.has(
                    txKey(build, req.symbol, req.transcriptId)
                )
        );
    }

    async fetchTranscripts() {
        const build = this.props.store.genomeBuild;
        const missing = this.outstandingTranscriptRequests().filter(
            req =>
                !this.inFlightTxKeys.has(
                    txKey(build, req.symbol, req.transcriptId)
                )
        );
        if (missing.length === 0) return;

        const fetched: [string, TranscriptData][] = [];
        const fetchedOptions: [string, TranscriptData[]][] = [];
        for (const { symbol, transcriptId } of missing) {
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
                if (transcriptId === '' && list.length > 0) {
                    fetchedOptions.push([`${build}|${symbol}`, list]);
                }
            } catch {
                // Swallow: an unresolved gene simply stays missing and is
                // retried when the reaction next fires. It must not wedge the
                // other requests.
            } finally {
                // Always release the key so a later firing can retry it — no
                // permanent blacklist, no shared flag that could stick.
                this.inFlightTxKeys.delete(k);
            }
        }

        // Merge newly-resolved transcripts into the CURRENT map (not a stale
        // snapshot), and only when the build hasn't flipped mid-fetch, so a
        // concurrent commit or an anchor/build change is never clobbered.
        if (
            (fetched.length > 0 || fetchedOptions.length > 0) &&
            this.props.store.genomeBuild === build
        ) {
            runInAction(() => {
                if (fetched.length > 0) {
                    const merged = new Map(this.transcriptsByKey);
                    fetched.forEach(([k, v]) => merged.set(k, v));
                    this.transcriptsByKey = merged;
                }
                if (fetchedOptions.length > 0) {
                    const mergedOpts = new Map(this.transcriptOptionsByGene);
                    fetchedOptions.forEach(([g, l]) => mergedOpts.set(g, l));
                    this.transcriptOptionsByGene = mergedOpts;
                }
            });
        }
    }

    // Canonical isoform of a gene — used by the anchor track (one shared
    // coordinate system) and as the per-row fallback.
    transcriptForGene = (gene: string): TranscriptData | undefined =>
        this.transcriptsByKey.get(
            txKey(this.props.store.genomeBuild, gene, '')
        );

    // The isoform the fusion caller selected for one side of a row, falling
    // back to the gene's canonical isoform when the id is missing/unresolved.
    transcriptForRow = (
        row: ComparisonRow,
        is5p: boolean
    ): TranscriptData | undefined => {
        const symbol = is5p ? row.fivePrimeSymbol : row.threePrimeSymbol;
        if (!symbol) return undefined;
        const e = row.event;
        const gene =
            e.gene1.symbol === symbol
                ? e.gene1
                : e.gene2 && e.gene2.symbol === symbol
                ? e.gene2
                : undefined;
        const id = gene?.selectedTranscriptId || '';
        const build = this.props.store.genomeBuild;
        return (
            this.transcriptsByKey.get(txKey(build, symbol, id)) ||
            this.transcriptsByKey.get(txKey(build, symbol, ''))
        );
    };

    // The user-chosen histogram transcript for a gene, if set and loaded.
    // Returns undefined when no override is set (caller falls back to canonical).
    histogramTranscriptForGene = (gene: string): TranscriptData | undefined => {
        const id = this.props.store.histogramTranscriptIdByGene.get(gene);
        if (!id) return undefined;
        const opts = this.transcriptOptionsByGene.get(
            `${this.props.store.genomeBuild}|${gene}`
        );
        return opts?.find(t => t.transcriptId === id);
    };

    // ── Row derivation pipeline ──────────────────────────────────────────
    // Split into @computed getters keyed only on data observables
    // (store.comparisonRows, this.transcriptsByKey) so it recomputes when rows
    // or transcripts change — NOT on window resize or expandedSampleId toggles.
    // Each getter reads this.transcriptsByKey (via transcriptForGene) so MobX
    // re-runs it when transcripts load.

    // Correct each row's 5′/3′ using strand + connectionType, the same resolver
    // the single-sample diagram uses. Falls back to the curated ordering for
    // rows whose transcripts haven't loaded yet.
    @computed get resolvedRows(): ComparisonRow[] {
        // eslint-disable-next-line @typescript-eslint/no-unused-expressions
        this.transcriptsByKey; // observe: re-resolve when transcripts load
        return resolveComparisonRows(this.props.store.comparisonRows, gene => {
            const t = this.transcriptForGene(gene);
            return t ? [t] : [];
        });
    }

    // Consensus 5′ gene for the pair = the majority resolved 5′ symbol.
    @computed get anchorGene(): string {
        const { store } = this.props;
        if (store.anchor && store.anchor.mode === 'driver') {
            return store.anchor.key;
        }
        const resolved = this.resolvedRows;
        if (resolved.length === 0) return '';
        const geneCounts = _.countBy(resolved, r => r.fivePrimeSymbol);
        return Object.entries(geneCounts).sort((a, b) => b[1] - a[1])[0][0];
    }

    @computed get anchorTranscript(): TranscriptData | undefined {
        return this.transcriptForGene(this.anchorGene);
    }

    // Orient EVERY row onto that one 5′ gene, then snap breakpoints to the
    // anchor locus (pattern-B correction) so the anchor track and the strips
    // share a single coordinate system.
    @computed get orientedRows(): ComparisonRow[] {
        const oriented = orientComparisonRowsTo5p(
            this.resolvedRows,
            this.anchorGene
        );
        const anchorTranscript = this.anchorTranscript;
        return anchorTranscript
            ? snapBreakpointsToAnchorGene(
                  oriented,
                  anchorTranscript.txStart,
                  anchorTranscript.txEnd
              )
            : oriented;
    }

    // The dominant 3′ partner of the resolved anchor — used for the directional
    // 5′→3′ caption over the tracks.
    @computed get partnerGene(): string | null {
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
        return {
            bp5: this.anchorTranscript ? sumBp(this.anchorTranscript.exons) : 0,
            bp3: this.partnerTranscript
                ? sumBp(this.partnerTranscript.exons)
                : 0,
        };
    }

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
                return exonStructureKey(
                    t5,
                    row.anchorBreakpoint,
                    this.transcriptForRow(row, false),
                    row.partnerBreakpoint
                );
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
            rows.map(r => r.anchorBreakpoint)
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
        return `${this.anchorGene}→${this.partnerGene || ''} ${pretty}`;
    }

    // Filter the cohort to a collapsed group's samples, reusing the same
    // materialized-identifier path as the histogram-bar click.
    handleSelectGroup = (group: CollapsedGroup): void => {
        const { onFilterCohortBySamples } = this.props;
        if (!onFilterCohortBySamples) return;
        const seen = new Set<string>();
        const samples: CohortSampleIdentifier[] = [];
        group.sampleIds.forEach(sampleId => {
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
            this.groupLabel(group),
            samples
        );
    };

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

    render() {
        const { store } = this.props;
        const anchorGene = this.anchorGene;
        const anchorTranscript = this.anchorTranscript;
        const rows = this.orientedRows;
        const partnerGene = this.partnerGene;
        const partnerTranscript = this.partnerTranscript;
        const histogramAnchorTranscript = this.histogramAnchorTranscript;
        const histogramPartnerTranscript = this.histogramPartnerTranscript;
        const expandedRow = rows.find(
            r => r.sampleId === this.expandedSampleId
        );

        // Responsive: reading WindowStore.size (a MobX observable) inside this
        // @observer render makes the layout reflow on window resize with no
        // extra wiring.
        const contentWidth = Math.max(
            MIN_CONTENT_WIDTH,
            WindowStore.size.width - HORIZONTAL_CHROME
        );
        // Responsive strip-list height: fill most of the window so more samples
        // are visible at once (was a fixed 500px).
        const stripViewportHeight = Math.max(
            MIN_STRIP_VIEWPORT,
            WindowStore.size.height - STRIP_VERTICAL_CHROME
        );
        const frame = computeComparisonFrame(contentWidth);
        // Cheap bp→px division (needs the width-dependent region widths); the
        // absolute per-side scale reference (maxRetainedBp) is a @computed above.
        // Reuses the region math previously inline in FusionStripList.
        const region5W = frame.junctionX - JUNCTION_GAP / 2 - frame.leftX;
        const region3W = frame.rightX - (frame.junctionX + JUNCTION_GAP / 2);
        const { bp5, bp3 } = this.maxRetainedBp;
        const pxPerBp5p = sharedPxPerBp(bp5, region5W);
        const pxPerBp3p = sharedPxPerBp(bp3, region3W);

        return (
            <div>
                <FusionSummaryTableWidget
                    store={store}
                    hasFusionAnnotation={this.hasFusionAnnotation}
                    onSelectAnchor={a => store.setAnchor(a)}
                />
                <FusionRecurrenceTable store={store} />
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
                    </ButtonGroup>
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
                {anchorTranscript && partnerGene && (
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
                                breakpoints={rows.map(r => r.anchorBreakpoint)}
                                drawX={frame.leftX}
                                drawW={frame.junctionX - frame.leftX}
                                labelX={frame.leftX - 10}
                                labelAnchor="end"
                                fill={COLOR_5PRIME}
                                mode={store.trackMode}
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
                                    mode={store.trackMode}
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
                        </svg>
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
                            Fusion product (5′ → 3′ retained exons)
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
                    </div>
                    <FusionStripList
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
                    />
                </div>
                {expandedRow && (
                    <div data-testid="expanded-diagram">
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
