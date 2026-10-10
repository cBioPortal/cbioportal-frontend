// Test data shared by the package specs.
import {
    Block,
    Part,
    PatientHierarchy,
    Sample,
    Slide,
    SlideAssociation,
    TileMetadata,
} from './wsiViewerTypes';

export function makeSlide(overrides: Partial<Slide> = {}): Slide {
    return {
        slide_key: '1000',
        stain_name: 'H&E',
        stain_group: 'Histology',
        is_hne: true,
        is_ihc: false,
        magnification: '20x',
        file_size_bytes: '100000000',
        can_serve_tiles: true,
        block_label: 'A1',
        block_number: '1',
        ...overrides,
    };
}

export function makeBlock(slides: Slide[], blockNumber = '1'): Block {
    return {
        block_number: blockNumber,
        block_label: 'A1',
        slides,
    };
}

export function makePart(blocks: Block[]): Part {
    return {
        part_number: '1',
        part_type: 'Resection',
        part_description: 'Test part',
        subspecialty: 'GI',
        blocks,
    };
}

/** A sample whose slides sit in one part and block, unless `parts` is set. */
export function makeSample(
    sampleId: string,
    slides: Slide[] = [],
    overrides: Partial<Sample> = {}
): Sample {
    return {
        sample_id: sampleId,
        cancer_type: '',
        cancer_type_detailed: '',
        oncotree_code: '',
        primary_site: '',
        sample_type: 'Primary',
        parts: [makePart([makeBlock(slides)])],
        ...overrides,
    };
}

export function makeHierarchy(
    samples: Sample[],
    slideAssociations?: SlideAssociation[]
): PatientHierarchy {
    return {
        patient_id: 'P-1',
        samples,
        slide_associations: slideAssociations,
    };
}

/** Tile metadata that passes validateWsiTileMetadata. */
export function makeTileMetadata(
    overrides: Partial<TileMetadata> = {}
): TileMetadata {
    return {
        dimensions: { width: 1000, height: 800 },
        levels: 1,
        level_dimensions: [{ width: 1000, height: 800 }],
        level_downsamples: [1],
        max_zoom: 6,
        tile_size: 256,
        tile_metadata_schema_version: 2,
        decode_policy_version:
            'geometry-v2;tile-max=16777216;thumbnail-max=16777216',
        max_decode_pixels: 16_777_216,
        thumbnail_max_decode_pixels: 16_777_216,
        safe_min_level: 0,
        ...overrides,
    };
}
