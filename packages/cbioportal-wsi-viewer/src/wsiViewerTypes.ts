export interface Slide {
    /** Opaque 32-hex de-identified slide key (never the source image id). */
    slide_key: string;
    stain_name: string;
    stain_group: string;
    is_hne: boolean;
    is_ihc: boolean;
    magnification: string;
    file_size_bytes: string;
    can_serve_tiles: boolean;
    block_label: string;
    block_number: string;
    /** Anatomical site / part description propagated from the parent Part (e.g. "Lung, left") */
    part_description?: string;
    /** Association fields carried by the nested v2 slide placement. */
    sample_id?: string | null;
    match_level?: MatchLevel;
    specimen_key?: string;
    slide_type?: WsiSlideType;
}

export type MatchLevel = 'PART' | 'BLOCK' | 'UNMATCHED';
export type WsiSlideType = 'H&E' | 'IHC' | 'Other' | 'Unknown';

export type WsiStainFilter = 'all' | 'hne' | 'ihc' | 'other' | 'unknown';
export type PathologySlideMatchFilter = 'all' | 'part' | 'block' | 'unmatched';
export interface SlideAssociation {
    slide_key: string;
    sample_id: string | null;
    match_level: MatchLevel;
    specimen_key: string;
    part_number?: string | null;
    part_description?: string | null;
    block_number?: string | null;
    block_label?: string | null;
    slide_type: WsiSlideType;
    stain_name?: string | null;
    can_serve_tiles: boolean;
}

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

export interface Sample {
    sample_id: string;
    cancer_type: string;
    cancer_type_detailed: string;
    oncotree_code: string;
    primary_site: string;
    sample_type: string;
    metastatic_site?: string;
    parts: Part[];
}

export interface PatientHierarchy {
    patient_id: string;
    samples: Sample[];
    slide_associations?: SlideAssociation[];
    reference_sample_id?: string | null;
}

/** Wire format returned by the normalized WSI v2 hierarchy endpoint. */
export interface WsiV2Slide {
    /** Opaque 32-hex de-identified slide key. */
    slideKey: string;
    stainName: string;
    stainGroup: string;
    isHne: boolean;
    isIhc: boolean;
    magnification: string;
    fileSizeBytes: number | null;
    canServeTiles: boolean;
    /** Nullable in older materialized WSI snapshots; derive from the flags. */
    slideType: string | null;
    sampleId: string | null;
    matchLevel: MatchLevel;
    specimenKey: string;
}

export interface WsiV2Block {
    blockNumber: string;
    blockLabel: string;
    slides: WsiV2Slide[];
}

export interface WsiV2Part {
    partNumber: string;
    partType: string;
    partDescription: string;
    subspecialty: string;
    blocks: WsiV2Block[];
}

export interface WsiV2SampleGroup {
    sampleId: string | null;
    parts: WsiV2Part[];
}

export interface WsiV2Hierarchy {
    referenceSampleId: string | null;
    sampleGroups: WsiV2SampleGroup[];
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
    /** Version of the offline tile metadata contract, when supplied. */
    tile_metadata_schema_version?: number | null;
    /** Versioned bounded-read policy, when supplied. */
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

export interface WsiSlideAccess {
    slideKey: string;
    tileMetadata: TileMetadata;
    thumbnail: {
        width: number;
        height: number;
        contentType: string;
    };
    accessToken: string;
    tokenType: string;
    expiresIn: number;
    expiresAt?: number;
}

/** A label/value row for the sidebar's Clinical section, built by the host. */
export interface WsiClinicalRow {
    label: string;
    value: string;
    labelTip?: string;
    /** Set for a sample attribute: shown only while that sample is selected. */
    sampleId?: string;
}
