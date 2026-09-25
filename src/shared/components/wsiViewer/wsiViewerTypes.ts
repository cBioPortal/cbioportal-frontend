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
    /** RECORDED, ESTIMATED, or UNDATED. */
    slide_timepoint_kind?: string;
    /** Machine-readable timing source. */
    slide_timepoint_date_source?: string;
    /** Why a relative date is unavailable, when undated. */
    slide_timepoint_reason?: string;
    /** Published timing status and coordinate system. */
    slide_timepoint_status?: string;
    slide_timepoint_coordinate_system?: string;
    /** Association fields carried by the nested v2 slide placement. */
    sample_id?: string | null;
    match_level?: MatchLevel;
    specimen_key?: string;
    slide_type?: WsiSlideType;
}

export type MatchLevel = 'PART' | 'BLOCK' | 'UNMATCHED';
export type WsiSlideType = 'H&E' | 'IHC' | 'Other' | 'Unknown';
export type WsiTimepointSelection = number | 'undated';

export type WsiStainFilter = 'all' | 'hne' | 'ihc' | 'other' | 'unknown';
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
    slide_type: WsiSlideType;
    stain_name?: string | null;
    procedure_date_days?: number | null;
    timepoint_source?: string | null;
    timepoint_kind?: string | null;
    timepoint_date_source?: string | null;
    timepoint_reason?: string | null;
    timepoint_status?: string | null;
    timepoint_coordinate_system?: string | null;
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

export interface Sample {
    sample_id: string;
    cancer_type: string;
    cancer_type_detailed: string;
    oncotree_code: string;
    primary_site: string;
    sample_type: string;
    sequencing_date?: string;
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
    imageId: string;
    stainName: string;
    stainGroup: string;
    isHne: boolean;
    isIhc: boolean;
    magnification: string;
    fileSizeBytes: number | null;
    canServeTiles: boolean;
    barcode: string;
    /** Nullable in older materialized WSI snapshots; derive from the flags. */
    slideType: string | null;
    sampleId: string | null;
    matchLevel: MatchLevel;
    specimenKey: string;
    procedureDateDays: number | null;
    timepointSource: string | null;
    procedureDateKind: string | null;
    procedureDateSource: string | null;
    procedureDateReason: string | null;
    procedureDateStatus: string | null;
    procedureCoordinateSystem: string | null;
}

export interface WsiV2Block {
    blockNumber: string;
    blockLabel: string;
    slides: WsiV2Slide[];
}

export interface WsiV2Part {
    partNumber: string;
    partDesignator: string;
    partType: string;
    partDescription: string;
    subspecialty: string;
    pathDxTitle: string;
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
    imageId: string;
    sourceUrl: string;
    tileMetadata: TileMetadata;
    thumbnail: {
        sourceUrl: string;
        width: number;
        height: number;
        contentType: string;
    };
    accessToken: string;
    tokenType: string;
    expiresIn: number;
    expiresAt?: number;
}
