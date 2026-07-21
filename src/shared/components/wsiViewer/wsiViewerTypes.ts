import { ICivicEntry } from 'cbioportal-utils';

export interface Slide {
    image_id: string;
    stain_name: string;
    stain_group: string;
    is_hne: boolean;
    is_ihc: boolean;
    magnification: string;
    file_size_bytes: string;
    can_serve_tiles: boolean;
    barcode: string;
    block_label: string;
    block_number: string;
    /** Anatomical site / part description propagated from the parent Part (e.g. "Lung, left") */
    part_description?: string;
    /** Pathological diagnosis title from the part (may differ from part_description) */
    path_dx_title?: string;
    /** Preferred slide timepoint in days relative to tumor sequencing. */
    slide_timepoint_days?: number;
    /** Source of the preferred slide timepoint. */
    slide_timepoint_source?: string;
}

export type MatchLevel = 'PART' | 'BLOCK' | 'UNMATCHED';
export type PathologySlideMatchFilter = 'all' | 'part' | 'block' | 'unmatched';

export interface SlideAssociation {
    image_id: string;
    sample_id: string | null;
    match_level: MatchLevel;
    specimen_key: string;
    part_number?: string | null;
    part_description?: string | null;
    block_number?: string | null;
    block_label?: string | null;
    slide_type: 'H&E' | 'IHC';
    stain_name?: string | null;
    procedure_date_days?: number | null;
    timepoint_source?: string | null;
    can_serve_tiles: boolean;
}

export interface Block {
    block_number: string;
    block_label: string;
    slides: Slide[];
}

export interface Part {
    part_number: string;
    part_designator: string;
    part_type: string;
    part_description: string;
    subspecialty: string;
    path_dx_title: string;
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

/** Single discrete copy-number alteration event from MSK-IMPACT. */
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
    /** Legacy acquisition-event offset retained for compatibility with older data paths. */
    sample_acquisition_days?: number;
    /** Legacy sequencing-event offset retained for compatibility with older data paths. */
    sequencing_days?: number;
    /** Preferred WSI timepoint in days relative to tumor sequencing. */
    sample_timepoint_days?: number;
    /** Source of the preferred WSI timepoint. */
    sample_timepoint_source?: string;
    /** Significant CNA events (value ≠ 0) from the study's GISTIC/CNA profile. */
    cna_alterations?: CNADetail[];
    /** Structural variants with tumor evidence from the study's SV profile. */
    structural_variants?: StructuralVariantDetail[];
    parts: Part[];
}

export interface PatientHierarchy {
    patient_id: string;
    samples: Sample[];
    slide_associations?: SlideAssociation[];
    reference_sample_id?: string | null;
    reference_sequencing_date?: string | null;
}

export interface PatientBootstrapInitialSlide {
    sample_id: string | null;
    image_id: string;
    metadata: TileMetadata;
}

export interface PatientBootstrapResponse {
    hierarchy: PatientHierarchy;
    initial: PatientBootstrapInitialSlide | null;
}

export type PathologySlideFilter = {
    sampleId?: string;
    matchLevel?: string;
    specimenKey?: string;
};

export function buildPathologySlideFilterSignature(
    pathologyFilter?: PathologySlideFilter
): string {
    return [
        pathologyFilter?.sampleId || '',
        pathologyFilter?.matchLevel || '',
        pathologyFilter?.specimenKey || '',
    ].join('|');
}

export interface TileMetadata {
    dimensions: { width: number; height: number };
    levels: number;
    level_dimensions: Array<{ width: number; height: number }>;
    max_zoom: number;
    tile_size: number;
    mpp?: { x: number; y: number };
    objective_power?: number;
}
