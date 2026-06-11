import { action, computed, makeObservable, observable } from 'mobx';
import { StructuralVariant } from 'cbioportal-ts-api-client';
import {
    FusionCohortFilter,
    FusionEvent,
    FusionPairSummary,
    SampleFusionRow,
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
}
