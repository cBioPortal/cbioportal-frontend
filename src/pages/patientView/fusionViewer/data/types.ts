export interface Exon {
    number: number;
    start: number;
    end: number;
    ensemblId?: string;
}

export interface ProteinDomain {
    name: string;
    pfamId: string;
    startGenomic: number;
    endGenomic: number;
    startAA: number;
    endAA: number;
    source: string;
}

export interface TranscriptData {
    transcriptId: string;
    displayName: string;
    gene: string;
    biotype: string;
    exons: Exon[];
    strand: '+' | '-';
    txStart: number;
    txEnd: number;
    isForteSelected: boolean;
    proteinLength?: number;
    domains: ProteinDomain[];
    utrs: { start: number; end: number; type: 'five_prime' | 'three_prime' }[];
}

export interface GenePartner {
    symbol: string;
    chromosome: string;
    position: number;
    selectedTranscriptId: string;
    siteDescription: string;
}

export interface FusionEvent {
    id: string;
    tumorId: string;
    gene1: GenePartner;
    gene2: GenePartner | null;
    fusion: string;
    totalReadSupport: number;
    callMethod: string;
    frameCallMethod: string;
    annotation: string;
    position: string;
    significance: string;
    note: string;
    /**
     * Direction of the SV breakpoint joining, as reported by the caller.
     * One of '5to3', '3to5', '3to3', '5to5', or '' when missing.
     * Used by the partner-orientation resolver to decide which site is
     * the canonical 5' partner.
     */
    connectionType: string;
}

export const COLOR_5PRIME = '#5A73B3';
export const COLOR_3PRIME = '#60187D';
export const COLOR_BREAKPOINT = '#FF6B6B';

// ---------------------------------------------------------------------------
// Cohort-level aggregate types (v1 Fusion Cohort Builder)
// ---------------------------------------------------------------------------

/** Classification of frameCallMethod into a 3-state frame status. */
export type FrameStatus = 'inFrame' | 'outOfFrame' | 'unknown';

/**
 * A recurrence-aggregated fusion pair across the cohort.
 * One row in the FusionRecurrenceTable.
 */
export interface FusionPairSummary {
    /** Canonical "GENE5::GENE3" key (or "GENE::-" for intragenic events). */
    key: string;
    gene5: string;
    gene3: string | null;
    /** Distinct samples carrying >= 1 event of this pair. */
    sampleCount: number;
    /** Total events (one sample may contribute > 1 breakpoint). */
    eventCount: number;
    /** True if any member event is classified as in-frame. */
    anyInFrame: boolean;
    /** Distinct sample IDs, for the per-sample grid and deep links. */
    sampleIds: string[];
    /** FusionEvent.id members. */
    eventIds: string[];
}

/**
 * Per-sample row in the cohort matrix:
 * which pair keys that sample carries (and at what frame status).
 */
export interface SampleFusionRow {
    sampleId: string;
    /** Map from pair key → frame status for that sample (best = inFrame > outOfFrame > unknown). */
    pairFrameStatus: Record<string, FrameStatus>;
}

/** Faceted filter state driving the cohort view. */
export interface FusionCohortFilter {
    /**
     * Gene partner filter: at least one partner symbol must match.
     * OR within this list; empty = no constraint.
     */
    genePartners: string[];
    /**
     * Canonical pair keys to include. Empty = no constraint.
     */
    fusionPairKeys: string[];
    /**
     * callMethod / variantClass values to include. Empty = no constraint.
     */
    svTypes: string[];
    /**
     * In-frame filter. 'any' = no constraint.
     */
    inFrame: 'any' | 'inFrame' | 'outOfFrame' | 'unknown';
    /**
     * Optional genomic window; match events where either breakpoint falls inside.
     */
    breakpointRegion?: {
        chromosome: string;
        start: number;
        end: number;
    };
}
