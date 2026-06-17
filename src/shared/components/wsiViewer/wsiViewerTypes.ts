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
    type?: string;      // human-readable mutation type, e.g. "Missense"
    vaf?: number;       // 0–100 percent
    annotation?: string; // driverFilterAnnotation, e.g. "KRAS G13D is a hotspot"
    cohortFrequency?: number; // fraction 0–1: how often this position mutated in study cohort
    // OncoKB annotation fields (populated by fetchAndMergeOncoKbAnnotations)
    oncogenic?: string;      // "Oncogenic" | "Likely Oncogenic" | "Likely Neutral" | "Unknown"
    mutationEffect?: string; // "Gain-of-function" | "Loss-of-function" | "Unknown"
    hotspot?: boolean;
    hasCivic?: boolean;   // true when OncoKB variantExist=true (CIViC DB has an entry)
    geneSummary?: string;
    variantSummary?: string;
    // Fields used internally to build the OncoKB batch request (not displayed)
    entrezGeneId?: number;
    consequence?: string;    // e.g. "Missense_Mutation"
    proteinStart?: number;
    proteinEnd?: number;
}

/** Single discrete copy-number alteration event from MSK-IMPACT. */
export interface CNADetail {
    gene: string;
    /** GISTIC value: -2=DeepDel, -1=ShallowDel, 1=Gain, 2=Amp */
    cnaValue: number;
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
    parts: Part[];
}

export interface PatientHierarchy {
    patient_id: string;
    samples: Sample[];
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
