import {
    action,
    computed,
    makeObservable,
    observable,
    ObservableMap,
} from 'mobx';
import { StructuralVariant } from 'cbioportal-ts-api-client';
import {
    FusionCohortFilter,
    FusionEvent,
    FusionPairSummary,
    SampleFusionRow,
    JunctionLabelMode,
} from './data/types';
import { convertStructuralVariantsToFusionEvents } from './data/structuralVariantAdapter';
import {
    buildPairSummaries,
    buildSampleRows,
    defaultCohortFilter,
    eventMatchesFilter,
    extractGenePartnerOptions,
    extractPairKeyOptions,
    extractSvTypeOptions,
} from './data/cohortAggregation';
import {
    buildComparisonRows,
    sortComparisonRows,
    ComparisonAnchor,
    ComparisonRow,
} from './data/comparisonRows';
import { CollapseKind } from './data/collapseRows';
import { GenomeBuild } from './data/genomeNexusTranscriptService';
import { GENOME_ID_TO_GENOME_BUILD } from 'shared/lib/referenceGenomeUtils';

/**
 * Maximum number of pair rows to show in the cohort matrix.
 * The recurrence table remains full and paginated.
 */
export const MATRIX_MAX_PAIRS = 50;
export const MATRIX_MAX_SAMPLES = 150;

/**
 * MobX store for the Fusion Cohort Builder.
 *
 * Accepts a multi-sample StructuralVariant array (from Results View or any
 * caller), derives FusionEvents via the shared adapter, and exposes filtered
 * aggregates for the recurrence table and per-sample matrix.
 *
 * This store is intentionally separate from FusionViewerStore, which remains
 * per-sample and per-fusion. The cohort store only knows about the aggregate;
 * individual samples are handed off to the single-patient viewer via deep links.
 */
export class FusionCohortStore {
    /** All structural variants across the cohort. Set by the caller. */
    @observable.ref public structuralVariants: StructuralVariant[] = [];

    /** Active faceted filter (mutations reflect in all computed aggregates). */
    @observable public filter: FusionCohortFilter = defaultCohortFilter();

    /**
     * Anchor gene/pair the user last picked. Read through the `anchor` getter,
     * which repairs this selection when the filter orphans it.
     */
    @observable private anchorSelection:
        | ComparisonAnchor
        | undefined = undefined;

    /** Alignment mode for the comparison track ruler. */
    @observable public alignment: 'junction' | 'coordinate' = 'junction';

    /**
     * Anchor-track histogram mode: 'feature' bins breakpoints by the reference
     * transcript's exons/introns/promoter; 'genomic' bins by fixed genomic width.
     */
    @observable public trackMode: 'feature' | 'genomic' = 'feature';

    /**
     * Row-display mode for the per-sample fusion-product strips, independent of
     * the histogram `trackMode`:
     *  - 'sample'    → one labeled row per sample (raw).
     *  - 'dense'     → one thin unlabeled row per sample (wall view).
     *  - 'collapsed' → structurally-identical products grouped, ranked ×N.
     * Defaults to 'collapsed' (cohort-first summary).
     */
    @observable public stripMode: 'sample' | 'dense' | 'collapsed' =
        'collapsed';

    /**
     * Placement strategy for junction exon labels on the strips (feature 2).
     * Three options so the user can compare and choose:
     *  - 'inline-tooltip' → text at the seam in sample/collapsed; dense folds it
     *    into the hover <title>.
     *  - 'inline-both'    → text at the seam in every mode (dense floats it above).
     *  - 'gutter'         → a thin label in the right gutter in every mode.
     */
    @observable public junctionLabelMode: JunctionLabelMode = 'inline-tooltip';

    /**
     * User override for the collapse key. When undefined the key is chosen
     * automatically from the data type (fusion → exon structure, SV →
     * breakpoint feature). Set to force one or the other.
     */
    @observable public collapseKindOverride:
        | CollapseKind
        | undefined = undefined;

    /**
     * Exon rendering mode for the strips, orthogonal to `stripMode`:
     *  - 'retained' → only the exons kept by the fusion (default).
     *  - 'full'     → the complete transcript ladder, excluded exons greyed.
     */
    @observable public exonMode: 'retained' | 'full' = 'retained';

    /**
     * Which transcript supplies each side's ladder in `exonMode === 'full'`:
     *  - 'reference' → the canonical isoform, shared by every row, so exon
     *                  columns align down the list (default).
     *  - 'perRow'    → each sample's caller-selected isoform: faithful, ragged.
     * Ignored when `exonMode === 'retained'`.
     */
    @observable public ladderMode: 'reference' | 'perRow' = 'reference';

    /**
     * Per-gene override for the transcript the breakpoint histogram bins
     * against (feature 1). Keyed by gene HUGO symbol → Ensembl transcript id.
     * Absent/empty ⇒ the gene's MSK-canonical isoform (the default). Scoped to
     * the histogram only; the strips still use each sample's caller isoform.
     */
    @observable public histogramTranscriptIdByGene: ObservableMap<
        string,
        string
    > = observable.map<string, string>();

    /**
     * Genome build for the cohort's breakpoint coordinates. Transcripts must be
     * fetched in this build or they won't align with the SV positions. Set from
     * the study's reference genome; defaults to GRCh38.
     */
    // Build declared by the STUDY. Only a fallback -- see the genomeBuild
    // computed below.
    @observable public studyGenomeBuild: GenomeBuild = 'GRCh38';

    constructor() {
        makeObservable(this);
    }

    // -----------------------------------------------------------------------
    // Core derived collections
    // -----------------------------------------------------------------------

    /** All FusionEvents converted from structuralVariants (multi-sample). */
    @computed
    public get allEvents(): FusionEvent[] {
        return convertStructuralVariantsToFusionEvents(this.structuralVariants);
    }

    /** Events that pass the active filter. */
    @computed
    public get filteredEvents(): FusionEvent[] {
        return this.allEvents.filter(ev => eventMatchesFilter(ev, this.filter));
    }

    /** Recurrence summaries for filtered events, sorted by sampleCount desc. */
    @computed
    public get pairSummaries(): FusionPairSummary[] {
        return buildPairSummaries(this.filteredEvents);
    }

    /**
     * Pair summaries for the recurrence TABLE, which doubles as the pair facet's
     * own option list.
     *
     * Standard faceted-filter semantics: a facet must not remove its own
     * unselected options. Driving the table off `pairSummaries` collapsed it to
     * exactly the checked rows, so a second pair could never be checked --
     * the multi-select the checkbox advertises was impossible. Every other
     * facet still applies, so checking a pair narrows the strips below without
     * narrowing the table.
     */
    @computed
    public get pairSummariesForFacet(): FusionPairSummary[] {
        const withoutPairFacet: FusionCohortFilter = {
            ...this.filter,
            fusionPairKeys: [],
        };
        return buildPairSummaries(
            this.allEvents.filter(ev =>
                eventMatchesFilter(ev, withoutPairFacet)
            )
        );
    }

    /**
     * Per-sample matrix rows for the top-N filtered pairs. Both axes are
     * capped — pairs at MATRIX_MAX_PAIRS, samples at MATRIX_MAX_SAMPLES — so a
     * large cohort cannot blow out the rendered grid.
     */
    @computed
    public get sampleRows(): SampleFusionRow[] {
        return this.allSampleRows.slice(0, MATRIX_MAX_SAMPLES);
    }

    /** Every sample with a fusion in the visible pairs, before the column cap. */
    @computed
    public get allSampleRows(): SampleFusionRow[] {
        return buildSampleRows(
            this.filteredEvents,
            this.matrixPairs.map(p => p.key)
        );
    }

    /** Whether the sample (column) axis was capped. */
    @computed
    public get sampleAxisIsCapped(): boolean {
        return this.allSampleRows.length > MATRIX_MAX_SAMPLES;
    }

    /** Whether the matrix was capped (more pairs exist than shown). */
    @computed
    public get matrixIsCapped(): boolean {
        return this.pairSummaries.length > MATRIX_MAX_PAIRS;
    }

    /** Pair summaries visible in the matrix (top-N). */
    @computed
    public get matrixPairs(): FusionPairSummary[] {
        return this.pairSummaries.slice(0, MATRIX_MAX_PAIRS);
    }

    // -----------------------------------------------------------------------
    // Facet option lists (derived from allEvents so they don't narrow themselves)
    // -----------------------------------------------------------------------

    @computed
    public get genePartnerOptions(): string[] {
        return extractGenePartnerOptions(this.allEvents);
    }

    @computed
    public get svTypeOptions(): string[] {
        return extractSvTypeOptions(this.allEvents);
    }

    @computed
    public get pairKeyOptions(): string[] {
        return extractPairKeyOptions(this.allEvents);
    }

    // -----------------------------------------------------------------------
    // Actions — one per filter facet, mirroring FusionViewerStore's toggle*
    // -----------------------------------------------------------------------

    /**
     * Replace the structural variant list and reset the filter to defaults.
     * For an explicit data swap (e.g. loading a different study), not for
     * cohort recomputes.
     */
    @action
    public setStructuralVariants(svs: StructuralVariant[]): void {
        this.structuralVariants = svs;
        this.filter = defaultCohortFilter();
    }

    /**
     * Replace the structural variant list but keep the user's current filter.
     * The studyView cohort recomputes on any filter change in the study, and
     * that must not wipe the Comparison tab's own filter state.
     */
    @action
    public updateStructuralVariants(svs: StructuralVariant[]): void {
        this.structuralVariants = svs;
    }

    /**
     * Set the genome build from a study reference-genome id (e.g. 'hg19',
     * 'GRCh37', 'grch38'). Unknown ids are ignored (build stays as-is).
     */
    @action
    public setReferenceGenome(referenceGenome: string | undefined): void {
        if (!referenceGenome) return;
        const mapped =
            GENOME_ID_TO_GENOME_BUILD[
                referenceGenome as keyof typeof GENOME_ID_TO_GENOME_BUILD
            ];
        if (mapped === 'GRCh37' || mapped === 'GRCh38') {
            this.studyGenomeBuild = mapped;
        }
    }

    /**
     * The build transcripts are resolved against for cohort-level tracks (the
     * anchor gene track, the histogram, the build badge).
     *
     * The ROWS outrank the study when they unanimously say otherwise. A
     * cBioPortal study declares only one referenceGenome, and msktarget
     * declares GRCh37 while every RNA fusion row carries GRCh38 coordinates --
     * resolving those against GRCh37 compares a breakpoint to exon bounds
     * ~200-290kb away. Exon selection is a plain coordinate filter, so it does
     * not degrade gracefully: it returns either NO retained exons (a blank
     * strip, which then collapses with every other empty row into one big
     * blank group at the top of the list) or the entire gene.
     *
     * When rows disagree with each other the MAJORITY wins, not the study.
     * msktarget is exactly that case, and deferring to the study there put the
     * shared anchor ladder on GRCh37 for a mostly-GRCh38 cohort -- which then
     * de-aligned every RNA row through the ladderTranscript build guard,
     * turning a rare escape hatch into the common path. Majority rule leaves
     * only the minority rows to the per-row path in FusionComparisonView,
     * which exists to absorb exactly them. An exact tie keeps the study build.
     */
    @computed
    public get genomeBuild(): GenomeBuild {
        const counts = new Map<string, number>();
        this.allEvents.forEach(ev => {
            if (ev.ncbiBuild) {
                counts.set(ev.ncbiBuild, (counts.get(ev.ncbiBuild) || 0) + 1);
            }
        });
        if (counts.size === 0) return this.studyGenomeBuild;

        let best = this.studyGenomeBuild;
        let bestCount = counts.get(this.studyGenomeBuild) || 0;
        counts.forEach((count, build) => {
            if (
                count > bestCount &&
                (build === 'GRCh37' || build === 'GRCh38')
            ) {
                best = build;
                bestCount = count;
            }
        });
        return best;
    }

    /** Set the gene-partner filter (replaces the entire list). */
    /**
     * Apply a filter, dropping any pair key the OTHER facets have made
     * unreachable.
     *
     * The recurrence table lists pairs from `pairSummariesForFacet`, which
     * ignores the pair facet but honours the rest. So another facet can hide
     * a checked pair's row while `fusionPairKeys` still holds it: the cohort
     * filters down to nothing, the comparison blanks, and the checkbox that
     * would undo it is off-screen. Pruning here keeps every active pair key
     * visible in the table by construction. Only the other facets route
     * through here; a direct pair pick is authoritative.
     */
    @action
    private applyFilter(next: FusionCohortFilter): void {
        // With no cohort loaded every key looks unreachable, so pruning would
        // silently discard a filter set before the data arrives.
        if (next.fusionPairKeys.length === 0 || this.allEvents.length === 0) {
            this.filter = next;
            return;
        }
        const reachable = new Set(
            buildPairSummaries(
                this.allEvents.filter(ev =>
                    eventMatchesFilter(ev, { ...next, fusionPairKeys: [] })
                )
            ).map(p => p.key)
        );
        this.filter = {
            ...next,
            fusionPairKeys: next.fusionPairKeys.filter(k => reachable.has(k)),
        };
    }

    @action
    public setGenePartnerFilter(symbols: string[]): void {
        this.applyFilter({ ...this.filter, genePartners: symbols });
    }

    /**
     * Toggle a fusion pair key in the filter:
     * if already selected → remove it; if not → add it.
     */
    @action
    /**
     * Select exactly one pair as the cohort filter, or clear it when that pair
     * is already the selection.
     *
     * Single-select, not multi: the comparison below anchors on one pair at a
     * time, so a second checked pair would filter the cohort to events the
     * anchor cannot show.
     */
    @action
    public selectOnlyFusionPairKey(key: string): void {
        const current = this.filter.fusionPairKeys;
        const next = current.length === 1 && current[0] === key ? [] : [key];
        // Direct pick: no pruning. The table only offers reachable pairs, and
        // pruning here would veto the user's own selection.
        this.filter = { ...this.filter, fusionPairKeys: next };
    }

    /** Set the SV-type filter (replaces the entire list). */
    @action
    public setSvTypeFilter(svTypes: string[]): void {
        this.applyFilter({ ...this.filter, svTypes });
    }

    /** Set the in-frame filter. */
    @action
    public setInFrameFilter(inFrame: FusionCohortFilter['inFrame']): void {
        this.applyFilter({ ...this.filter, inFrame });
    }

    /** Set (or clear) the breakpoint region filter. */
    @action
    public setBreakpointRegion(
        region?: FusionCohortFilter['breakpointRegion']
    ): void {
        this.applyFilter({ ...this.filter, breakpointRegion: region });
    }

    /** Reset all facets to defaults. */
    @action
    public clearFilter(): void {
        this.filter = defaultCohortFilter();
    }

    @action
    public setAnchor(a: ComparisonAnchor): void {
        this.anchorSelection = a;
        // An explicit pick beats an older pair filter. Without this the
        // repairing getter below sees a pick the filter excludes, treats it as
        // orphaned, and silently substitutes the filtered pair -- so clicking
        // a row while a different pair is checked did nothing at all.
        if (buildComparisonRows(this.filteredEvents, a).length === 0) {
            this.applyFilter({ ...this.filter, fusionPairKeys: [] });
        }
    }

    /**
     * The anchor actually used by the comparison views.
     *
     * A filter change can orphan the user's pick -- e.g. checking a pair in the
     * recurrence table filters out the pair the anchor points at. Nothing
     * repaired that: FusionComparisonView's bootstrap only fires when the
     * anchor is unset, so a set-but-orphaned anchor left `comparisonRows` empty
     * and the strips/track/histogram blank with no explanation. Fall back to
     * the most recurrent surviving pair, or nothing when nothing survives.
     */
    @computed
    public get anchor(): ComparisonAnchor | undefined {
        const selected = this.anchorSelection;
        if (!selected) return undefined;
        if (buildComparisonRows(this.filteredEvents, selected).length > 0) {
            return selected;
        }
        const survivor = this.pairSummaries[0];
        return survivor ? { mode: 'pair', key: survivor.key } : undefined;
    }

    @action
    public setAlignment(a: 'junction' | 'coordinate'): void {
        this.alignment = a;
    }

    @action
    public setTrackMode(m: 'feature' | 'genomic'): void {
        this.trackMode = m;
    }

    @action
    public setStripMode(m: 'sample' | 'dense' | 'collapsed'): void {
        this.stripMode = m;
    }

    @action
    public setJunctionLabelMode(m: JunctionLabelMode): void {
        this.junctionLabelMode = m;
    }

    @action
    public setCollapseKindOverride(k: CollapseKind | undefined): void {
        this.collapseKindOverride = k;
    }

    @action
    public setExonMode(m: 'retained' | 'full'): void {
        this.exonMode = m;
    }

    @action
    public setLadderMode(m: 'reference' | 'perRow'): void {
        this.ladderMode = m;
    }

    @action
    public setHistogramTranscript(
        geneSymbol: string,
        transcriptId: string
    ): void {
        this.histogramTranscriptIdByGene.set(geneSymbol, transcriptId);
    }

    @computed
    public get comparisonRows(): ComparisonRow[] {
        if (!this.anchor) return [];
        const rows = buildComparisonRows(this.filteredEvents, this.anchor);
        return sortComparisonRows(rows);
    }
}
