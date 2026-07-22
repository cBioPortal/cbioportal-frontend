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

    /** Anchor gene/pair for comparison alignment. */
    @observable public anchor: ComparisonAnchor | undefined = undefined;

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
    @observable public genomeBuild: GenomeBuild = 'GRCh38';

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
     * Per-sample matrix rows for the top-N filtered pairs.
     * Capped at MATRIX_MAX_PAIRS to keep the grid manageable.
     */
    @computed
    public get sampleRows(): SampleFusionRow[] {
        return buildSampleRows(
            this.filteredEvents,
            this.matrixPairs.map(p => p.key)
        );
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

    /** Replace the entire structural variant list (triggers full recompute). */
    @action
    public setStructuralVariants(svs: StructuralVariant[]): void {
        this.structuralVariants = svs;
        this.filter = defaultCohortFilter();
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
            this.genomeBuild = mapped;
        }
    }

    /** Set the gene-partner filter (replaces the entire list). */
    @action
    public setGenePartnerFilter(symbols: string[]): void {
        this.filter = { ...this.filter, genePartners: symbols };
    }

    /**
     * Toggle a fusion pair key in the filter:
     * if already selected → remove it; if not → add it.
     */
    @action
    public toggleFusionPairKey(key: string): void {
        const current = this.filter.fusionPairKeys;
        const next = current.includes(key)
            ? current.filter(k => k !== key)
            : [...current, key];
        this.filter = { ...this.filter, fusionPairKeys: next };
    }

    /** Set the SV-type filter (replaces the entire list). */
    @action
    public setSvTypeFilter(svTypes: string[]): void {
        this.filter = { ...this.filter, svTypes };
    }

    /** Set the in-frame filter. */
    @action
    public setInFrameFilter(inFrame: FusionCohortFilter['inFrame']): void {
        this.filter = { ...this.filter, inFrame };
    }

    /** Set (or clear) the breakpoint region filter. */
    @action
    public setBreakpointRegion(
        region?: FusionCohortFilter['breakpointRegion']
    ): void {
        this.filter = { ...this.filter, breakpointRegion: region };
    }

    /** Reset all facets to defaults. */
    @action
    public clearFilter(): void {
        this.filter = defaultCohortFilter();
    }

    @action
    public setAnchor(a: ComparisonAnchor): void {
        this.anchor = a;
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
