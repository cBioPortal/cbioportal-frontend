// Test data shared by the package specs.
import { registerWsiResourceAccess } from './wsiAuth';
import {
    Block,
    Part,
    PatientHierarchy,
    Sample,
    Slide,
    TileMetadata,
    WsiStainKind,
    WsiV2Hierarchy,
} from './wsiViewerTypes';

export function makeSlide(overrides: Partial<Slide> = {}): Slide {
    return {
        slide_key: '1000',
        stain_name: 'H&E',
        stain_group: 'Histology',
        stain_kind: 'hne',
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
        parts: [makePart([makeBlock(slides)])],
        ...overrides,
    };
}

export function makeHierarchy(samples: Sample[]): PatientHierarchy {
    return { patient_id: 'P-1', samples };
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

/** A slide-access response body, as the backend sends it. */
export function makeAccessPayload(overrides: Record<string, unknown> = {}) {
    return {
        slideKey: 'slide-1',
        tileMetadata: makeTileMetadata(),
        accessToken: 'test-token',
        expiresIn: 300,
        ...overrides,
    };
}

/** Publishes one slide for a patient, as a loaded hierarchy would. */
export function registerTestSlideAccess(
    studyId: string,
    patientId: string,
    slideKey: string
): void {
    registerWsiResourceAccess(studyId, {
        patient_id: patientId,
        samples: [makeSample('S-1', [makeSlide({ slide_key: slideKey })])],
    });
}

const WIRE_SLIDE_TYPES: Record<WsiStainKind, string> = {
    hne: 'H&E',
    ihc: 'IHC',
    other: 'Other',
    unknown: 'Unknown',
};

/** A hierarchy as the v2 endpoint sends it: the normalizer's inverse. */
export function toWireHierarchy(hierarchy: PatientHierarchy): WsiV2Hierarchy {
    return {
        referenceSampleId: hierarchy.reference_sample_id || null,
        sampleGroups: hierarchy.samples.map(sample => ({
            sampleId:
                sample.sample_id === 'UNMATCHED' ? null : sample.sample_id,
            parts: sample.parts.map(part => ({
                partNumber: part.part_number,
                partType: part.part_type,
                partDescription: part.part_description,
                subspecialty: part.subspecialty,
                blocks: part.blocks.map(block => ({
                    blockNumber: block.block_number,
                    blockLabel: block.block_label,
                    slides: block.slides.map(slide => ({
                        slideKey: slide.slide_key,
                        stainName: slide.stain_name,
                        stainGroup: slide.stain_group,
                        isHne: slide.stain_kind === 'hne',
                        isIhc: slide.stain_kind === 'ihc',
                        magnification: slide.magnification,
                        fileSizeBytes: slide.file_size_bytes
                            ? Number(slide.file_size_bytes)
                            : null,
                        canServeTiles: slide.can_serve_tiles,
                        slideType: WIRE_SLIDE_TYPES[slide.stain_kind],
                        sampleId: slide.sample_id ?? sample.sample_id,
                        matchLevel:
                            slide.match_level ||
                            (sample.sample_id === 'UNMATCHED'
                                ? 'UNMATCHED'
                                : 'BLOCK'),
                        specimenKey: slide.specimen_key || 'specimen-1',
                    })),
                })),
            })),
        })),
    };
}
