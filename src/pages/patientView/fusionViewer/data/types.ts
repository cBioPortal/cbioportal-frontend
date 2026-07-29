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
    /**
     * The "default driver" transcript flag — set on a genuine caller match, or
     * else the canonical / first-protein-coding fallback. Load-bearing for
     * rendering (drives forteTranscript5p/3p → the product diagram). NOT a
     * truthful "the caller picked this" signal; use {@link isCallerSelected}
     * for the "Called" tag.
     */
    isForteSelected: boolean;
    /**
     * True only when this transcript genuinely matches the id the caller/SV
     * reported (Genome Nexus returned it). Unlike isForteSelected this is never
     * set by a fallback, so it is safe to surface as a "Called" tag.
     */
    isCallerSelected: boolean;
    /** True when this is the MSK canonical isoform for the gene. */
    isCanonical: boolean;
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

/**
 * High-level idiom discriminator for a StructuralVariant.
 * Derived in `data/svClassification.ts` from the SV fields; stored on FusionEvent
 * so rendering components can branch without re-inspecting the raw SV.
 *
 * Priority order when multiple signals are present:
 *   1. Same vs different gene symbols (overrides variantClass for idiom selection)
 *   2. Same vs different chromosomes
 *   3. variantClass synonym map (DEL/DUP/INV/INS/TRA/BND)
 */
export type SvIdiom =
    | 'INTERGENIC_FUSION' // different genes, cross-chromosome (TRA/BND)
    | 'INTRACHROM_FUSION' // different genes, same chromosome
    | 'INTRAGENIC_DELETION' // same gene, variantClass ≈ DEL
    | 'INTRAGENIC_DUPLICATION' // same gene, variantClass ≈ DUP/ITD
    | 'INTRAGENIC_INVERSION' // same gene, variantClass ≈ INV
    | 'INSERTION' // variantClass ≈ INS
    | 'INTERGENIC_REGION' // no valid gene2 (IGR / missing partner)
    | 'UNKNOWN_SV'; // nothing matches

/**
 * Coding-frame plausibility of the chimeric junction.
 * Derived from `site2EffectOnFrame`; used to gate protein-product rendering.
 */
export type FramePlausibility =
    | 'IN_FRAME'
    | 'OUT_OF_FRAME'
    | 'UTR'
    | 'NONCODING'
    | 'UNKNOWN';

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
    /** Derived idiom — what kind of structural variant this is. */
    svIdiom: SvIdiom;
    /** Derived coding-frame plausibility for the chimeric junction. */
    frame: FramePlausibility;
    /**
     * True when the event is an RNA-derived fusion call (the caller chose the
     * transcripts), false for a DNA-level structural variant. Computed once in
     * the structural-variant adapter from the best available source signal
     * (rnaSupport/dnaSupport, falling back to the molecular profile). Downstream
     * code branches on this flag alone, so migrating the data source (e.g. to
     * different ClickHouse tables) only changes the adapter mapping.
     */
    isRnaDerived: boolean;
}

export const COLOR_5PRIME = '#5A73B3';
export const COLOR_3PRIME = '#60187D';
export const COLOR_BREAKPOINT = '#FF6B6B';
export const COLOR_ACTIVE_OUTLINE = '#e03131';
/** Fill for exons excluded from the fusion product in full-ladder mode. */
export const COLOR_EXON_LOST = '#dee2e6';

// ---------------------------------------------------------------------------
// Cohort-level aggregate types (v1 Fusion Cohort Builder)
// ---------------------------------------------------------------------------

/** Classification of frameCallMethod into a 3-state frame status. */
export type FrameStatus = 'inFrame' | 'outOfFrame' | 'unknown';

/** Placement strategy for the junction exon labels on fusion-product strips. */
export type JunctionLabelMode = 'inline-tooltip' | 'inline-both' | 'gutter';

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

/**
 * A domain projected onto one side of a fusion product, with clipping
 * applied when the breakpoint falls inside the domain's genomic footprint.
 * Produced by selectRetained5PrimeDomains / selectRetained3PrimeDomains.
 */
export interface RetainedDomain {
    domain: ProteinDomain;
    side: '5p' | '3p';
    /** Clipped lower bound in protein AA space (first retained residue). */
    retainedStartAA: number;
    /** Clipped upper bound in protein AA space (last retained residue). */
    retainedEndAA: number;
    /** True when the breakpoint genomic coordinate falls inside the domain. */
    isTruncated: boolean;
    /**
     * Fraction of the full domain retained: (retainedEndAA - retainedStartAA + 1)
     * / (domain.endAA - domain.startAA + 1). Clamped to [0, 1].
     */
    retainedFraction: number;
    /** Start of the cut-away span in AA space (for the ghost stub). */
    lostStartAA: number;
    /** End of the cut-away span in AA space. */
    lostEndAA: number;
}
