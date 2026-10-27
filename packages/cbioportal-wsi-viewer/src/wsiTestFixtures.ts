// Test data shared by the package specs.
import { registerWsiResourceAccess } from './wsiAuth';
import {
    Block,
    Part,
    PatientHierarchy,
    Sample,
    Slide,
    TileMetadata,
    UNMATCHED_SAMPLE_ID,
    WsiResourceRow,
    WsiStainKind,
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
        resourceId: 'WSI_SAMPLE',
        key: 'slide-1',
        accessToken: 'test-token',
        tokenType: 'Bearer',
        expiresIn: 300,
        ...overrides,
    };
}

/** Publishes one slide for a patient, as a loaded hierarchy would. */
export function registerTestSlideAccess(
    studyId: string,
    patientId: string,
    slideKey: string,
    tileMetadata: TileMetadata = makeTileMetadata()
): void {
    registerWsiResourceAccess(studyId, {
        patient_id: patientId,
        samples: [
            makeSample('S-1', [
                makeSlide({
                    slide_key: slideKey,
                    resource_id: 'WSI_SAMPLE',
                    serving_key: slideKey,
                    tile_metadata: tileMetadata,
                }),
            ]),
        ],
    });
}

const WIRE_SLIDE_TYPES: Record<WsiStainKind, string> = {
    hne: 'H&E',
    ihc: 'IHC',
    other: 'Other',
    unknown: 'Unknown',
};

export type TestSlideRow = WsiResourceRow;

function orderKey(prefix: string, index: number): string {
    return `${prefix}-${String(index).padStart(4, '0')}`;
}

/**
 * The slide rows the resource table API returns for a hierarchy: the
 * builder's inverse. Servable slides carry tile metadata (the slide's own, or
 * a valid default) under `serving`, keyed by the slide key.
 */
export function toResourceRows(hierarchy: PatientHierarchy): TestSlideRow[] {
    const rows: TestSlideRow[] = [];
    hierarchy.samples.forEach(sample => {
        const unmatched = sample.sample_id === UNMATCHED_SAMPLE_ID;
        sample.parts.forEach((part, partIndex) => {
            const partKey = orderKey(`part:${sample.sample_id}`, partIndex);
            part.blocks.forEach((block, blockIndex) => {
                const blockKey = orderKey(`block:${partKey}`, blockIndex);
                block.slides.forEach(slide => {
                    const metadata: Record<string, unknown> = {
                        slide_key: slide.slide_key,
                        reference_sample_id:
                            hierarchy.reference_sample_id || undefined,
                        part_key: partKey,
                        part_number: part.part_number,
                        part_type: part.part_type,
                        part_description: part.part_description,
                        subspecialty: part.subspecialty,
                        block_key: blockKey,
                        block_number: block.block_number,
                        block_label: block.block_label,
                        stain_name: slide.stain_name,
                        stain_group: slide.stain_group,
                        is_hne: slide.stain_kind === 'hne',
                        is_ihc: slide.stain_kind === 'ihc',
                        slide_type: WIRE_SLIDE_TYPES[slide.stain_kind],
                        magnification: slide.magnification,
                        file_size_bytes: slide.file_size_bytes
                            ? Number(slide.file_size_bytes)
                            : undefined,
                        can_serve_tiles: slide.can_serve_tiles,
                        match_level:
                            slide.match_level ||
                            (unmatched ? 'UNMATCHED' : 'BLOCK'),
                        specimen_key: slide.specimen_key || 'specimen-1',
                    };
                    if (slide.can_serve_tiles) {
                        metadata.serving = {
                            key: slide.serving_key || slide.slide_key,
                            sealed_source: 'sealed',
                            tile_metadata_json:
                                slide.tile_metadata || makeTileMetadata(),
                            thumbnail_width: 128,
                            thumbnail_height: 96,
                            thumbnail_content_type: 'image/jpeg',
                        };
                    }
                    rows.push({
                        resourceId:
                            slide.resource_id ||
                            (unmatched ? 'WSI_PATIENT' : 'WSI_SAMPLE'),
                        patientId: hierarchy.patient_id,
                        sampleId: unmatched
                            ? null
                            : slide.sample_id ?? sample.sample_id,
                        metadata,
                    });
                });
            });
        });
    });
    return rows;
}

/** Whether a request is the resource table rows request the viewer sends. */
export function isSlideRowsRequest(url: string): boolean {
    return url.includes('/resource-table/query/fetch');
}

/**
 * The rows of one resource table request: those of the resource named in its
 * body.
 */
export function slideRowsFor(
    hierarchy: PatientHierarchy,
    init?: RequestInit
): TestSlideRow[] {
    const resourceId = init?.body
        ? JSON.parse(String(init.body)).resourceId
        : undefined;
    return toResourceRows(hierarchy).filter(
        row => resourceId === undefined || row.resourceId === resourceId
    );
}
