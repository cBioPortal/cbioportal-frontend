import { ICivicEntry } from 'cbioportal-utils';

export interface Slide {
    /** Opaque 12-hex de-identified slide key (never the source image id). */
    slide_key: string;
    stain_name: string;
    stain_group: string;
    stain_kind: WsiStainKind;
    magnification: string;
    file_size_bytes: string;
    can_serve_tiles: boolean;
    block_label: string;
    block_number: string;
    /** Anatomical site / part description propagated from the parent Part (e.g. "Lung, left") */
    part_description?: string;
    /** Number of the parent Part. */
    part_number?: string;
    /** Association fields carried by the nested v2 slide placement. A slide
     *  belongs to exactly one sample. */
    sample_id?: string | null;
    match_level?: MatchLevel;
    specimen_key?: string;
    /** Resource the slide's row belongs to: `WSI_SAMPLE` or `WSI_PATIENT`. */
    resource_id?: string;
    /** The slide's key on the tile server (`metadata.serving.key`); present
     *  only for a slide that can serve tiles. */
    serving_key?: string;
    /** Opaque source the tile server opens (`metadata.serving.sealed_source`).
     *  Sent with tile and thumbnail requests only; never displayed. */
    sealed_source?: string;
    /** Tile metadata of a slide that can serve tiles, from its resource row. */
    tile_metadata?: TileMetadata;
}

export type MatchLevel = 'PART' | 'BLOCK' | 'UNMATCHED';

/** The sample that holds slides not matched to any sample. */
export const UNMATCHED_SAMPLE_ID = 'UNMATCHED';
/** A slide's stain, classified once when the hierarchy is normalized. */
export type WsiStainKind = 'hne' | 'ihc' | 'other' | 'unknown';

export type WsiStainFilter = 'all' | WsiStainKind;
export type PathologySlideMatchFilter = 'all' | 'part' | 'block' | 'unmatched';
export type WsiMutationDataStatus = 'idle' | 'loading' | 'ready' | 'error';

export interface Block {
    block_number: string;
    block_label: string;
    slides: Slide[];
}

export interface Part {
    part_number: string;
    part_type: string;
    part_description: string;
    subspecialty: string;
    blocks: Block[];
}

export interface MutationDetail {
    token: string;
    type?: string; // human-readable mutation type, e.g. "Missense"
    vaf?: number; // 0–100 percent
    annotation?: string; // driverFilterAnnotation, e.g. "KRAS G13D is a hotspot"
    cohortFrequency?: number; // fraction 0–1: how often this position mutated in study cohort
    // OncoKB annotation fields (populated by fetchAndMergeOncoKbAnnotations)
    oncogenic?: string; // "Oncogenic" | "Likely Oncogenic" | "Likely Neutral" | "Unknown"
    mutationEffect?: string; // "Gain-of-function" | "Loss-of-function" | "Unknown"
    hotspot?: boolean;
    hasCivic?: boolean; // true when OncoKB variantExist=true (CIViC DB has an entry)
    civicEntry?: ICivicEntry | null;
    geneSummary?: string;
    variantSummary?: string;
    // Fields used internally to build the OncoKB batch request (not displayed)
    entrezGeneId?: number;
    consequence?: string; // e.g. "Missense_Mutation"
    proteinStart?: number;
    proteinEnd?: number;
}

/** Single discrete copy-number alteration event from the study's CNA profile. */
export interface CNADetail {
    gene: string;
    entrezGeneId?: number;
    /** GISTIC value: -2=DeepDel, -1=ShallowDel, 1=Gain, 2=Amp */
    cnaValue: number;
    cytoband?: string;
    cohortAlteredCount?: number;
    cohortProfiledCount?: number;
    cohortFrequency?: number;
    oncogenic?: string;
    mutationEffect?: string;
    civicEntry?: ICivicEntry | null;
    hasCivicVariants?: boolean;
    geneSummary?: string;
    variantSummary?: string;
}

export interface StructuralVariantDetail {
    gene1: string;
    gene2: string;
    site1EntrezGeneId?: number;
    site2EntrezGeneId?: number;
    variantClass: string;
    annotation?: string;
    breakpointType?: string;
    connectionType?: string;
    eventInfo?: string;
    length?: number;
    comments?: string;
    svStatus?: string;
    dnaSupport?: string;
    rnaSupport?: string;
    tumorVariantCount?: number;
    normalVariantCount?: number;
    tumorReadCount?: number;
    normalReadCount?: number;
    tumorPairedEndReadCount?: number;
    tumorSplitReadCount?: number;
    site1Description?: string;
    site2Description?: string;
    site1Chromosome?: string;
    site1Position?: number;
    site2Chromosome?: string;
    site2Position?: number;
    ncbiBuild?: string;
    oncogenic?: string;
    mutationEffect?: string;
    geneSummary?: string;
    variantSummary?: string;
}

export interface Sample {
    sample_id: string;
    cancer_type: string;
    cancer_type_detailed: string;
    oncotree_code: string;
    primary_site: string;
    sample_type: string;
    metastatic_site?: string;
    tumor_purity?: string;
    oncogenic_mutations?: string;
    oncogenic_mutation_details?: MutationDetail[];
    num_oncogenic_mutations?: string;
    tmb_score?: string;
    msi_type?: string;
    /** Significant CNA events (value ≠ 0) from the study's GISTIC/CNA profile. */
    cna_alterations?: CNADetail[];
    /** Structural variants with tumor evidence from the study's SV profile. */
    structural_variants?: StructuralVariantDetail[];
    parts: Part[];
}

export interface PatientHierarchy {
    patient_id: string;
    samples: Sample[];
    reference_sample_id?: string | null;
}

/**
 * One slide row of the WSI_SAMPLE or WSI_PATIENT resource, as the portal's
 * resource table API returns it. `metadata` holds the slide fields the data
 * provider wrote, with tile serving data under `serving` for a slide that can
 * serve tiles.
 */
export interface WsiResourceRow {
    resourceId: string;
    patientId: string;
    sampleId: string | null;
    metadata: Record<string, unknown> | null;
}

export type PathologySlideFilter = {
    sampleId?: string;
    matchLevel?: string;
    specimenKey?: string;
};

export interface TileMetadata {
    dimensions: { width: number; height: number };
    levels: number;
    level_dimensions: Array<{ width: number; height: number }>;
    level_downsamples?: number[];
    max_zoom: number;
    /** Version of the offline tile metadata contract; the viewer requires 2. */
    tile_metadata_schema_version?: number | null;
    /** Versioned bounded-read policy. */
    decode_policy_version?: string | null;
    max_decode_pixels?: number | null;
    thumbnail_max_decode_pixels?: number | null;
    /** Lowest safe ZXY level under the audited decode policy. */
    safe_min_level?: number | null;
    tile_size: number;
    mpp?: { x: number; y: number };
    objective_power?: number;
    vendor?: string;
}

/**
 * What tile and thumbnail requests name a slide by: its key and sealed source
 * from its resource row, never the source image id.
 */
export interface WsiSlideSource {
    slideKey: string;
    servingKey: string;
    sealedSource: string;
    tileMetadata: TileMetadata;
}

/** A label/value row for the sidebar's Clinical section, built by the host. */
export interface WsiClinicalRow {
    label: string;
    value: string;
    labelTip?: string;
    /** Set for a sample attribute: shown only while that sample is selected. */
    sampleId?: string;
    /** Set for a non-default attribute: shown after "Show more". */
    more?: boolean;
}
