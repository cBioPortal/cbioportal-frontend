import {
    PatientHierarchy,
    TileMetadata,
    WsiSlideSource,
} from './wsiViewerTypes';
import { hierarchySlides } from './wsiSlideUtils';

const CURRENT_WSI_DECODE_POLICY =
    'geometry-v2;tile-max=16777216;thumbnail-max=16777216';
const CURRENT_WSI_DECODE_PIXELS = 16_777_216;

export function validateWsiTileMetadata(metadata: TileMetadata): void {
    if (
        !metadata ||
        !metadata.dimensions ||
        !Number.isInteger(metadata.dimensions.width) ||
        metadata.dimensions.width <= 0 ||
        !Number.isInteger(metadata.dimensions.height) ||
        metadata.dimensions.height <= 0 ||
        !Number.isInteger(metadata.levels) ||
        metadata.levels <= 0 ||
        !Array.isArray(metadata.level_dimensions) ||
        metadata.level_dimensions.length !== metadata.levels ||
        metadata.level_dimensions.some(
            level =>
                !level ||
                !Number.isInteger(level.width) ||
                level.width <= 0 ||
                !Number.isInteger(level.height) ||
                level.height <= 0
        ) ||
        !Number.isInteger(metadata.max_zoom) ||
        metadata.max_zoom < 0 ||
        !Number.isInteger(metadata.tile_size) ||
        metadata.tile_size <= 0
    ) {
        throw new Error('Invalid WSI tile metadata');
    }

    if (metadata.tile_metadata_schema_version !== 2) {
        throw new Error('Invalid WSI tile metadata schema');
    }
    const safeMinLevel = metadata.safe_min_level;
    if (
        safeMinLevel == null ||
        !Number.isInteger(safeMinLevel) ||
        safeMinLevel < 0 ||
        safeMinLevel > metadata.max_zoom
    ) {
        throw new Error('Invalid WSI safe minimum level');
    }
    if (
        !Array.isArray(metadata.level_downsamples) ||
        metadata.level_downsamples.length !== metadata.levels ||
        metadata.level_downsamples.some(
            value => !Number.isFinite(value) || value <= 0
        )
    ) {
        throw new Error('Invalid WSI level downsamples');
    }
    if (metadata.decode_policy_version !== CURRENT_WSI_DECODE_POLICY) {
        throw new Error('Invalid WSI decode policy');
    }
    for (const [name, value] of [
        ['max_decode_pixels', metadata.max_decode_pixels],
        ['thumbnail_max_decode_pixels', metadata.thumbnail_max_decode_pixels],
    ] as Array<[string, number | null | undefined]>) {
        if (!Number.isInteger(value) || value !== CURRENT_WSI_DECODE_PIXELS) {
            throw new Error(`Invalid WSI ${name}`);
        }
    }
}

export function normalizeWsiAuthScope(scope?: string): string {
    const normalized = scope?.trim();
    return normalized || 'anonymousUser';
}

interface RegisteredSlide {
    patientId: string;
    servingKey?: string;
    sealedSource?: string;
    tileMetadata?: TileMetadata;
}

/**
 * Every slide a loaded hierarchy published, keyed by study and slide key, with
 * its patient and the serving fields of its resource row. Tiles and
 * thumbnails are only ever requested for these slides. Access itself is
 * checked by the portal in front of the tile server, with the session cookie.
 */
const registeredSlides = new Map<string, RegisteredSlide>();

function registryKey(studyId: string, slideKey: string): string {
    return `${studyId}::${slideKey}`;
}

/**
 * Registers the slides of a loaded hierarchy. The hierarchy is authoritative
 * for its study and patient, so slides from an earlier load of the same
 * patient are replaced rather than merged.
 */
export function registerWsiSlideSources(
    studyId: string,
    hierarchy: PatientHierarchy
): void {
    clearWsiSlideSources(studyId, hierarchy.patient_id);
    hierarchySlides(hierarchy).forEach(slide =>
        registeredSlides.set(registryKey(studyId, slide.slide_key), {
            patientId: hierarchy.patient_id,
            servingKey: slide.serving_key,
            sealedSource: slide.sealed_source,
            tileMetadata: slide.tile_metadata,
        })
    );
}

/**
 * Forgets registered slides. With no arguments every slide is forgotten; with
 * a study (and optionally a patient) only matching slides are.
 */
export function clearWsiSlideSources(
    studyId?: string,
    patientId?: string
): void {
    if (studyId === undefined) {
        registeredSlides.clear();
        return;
    }
    for (const [key, slide] of registeredSlides) {
        if (
            key.startsWith(`${studyId}::`) &&
            (patientId === undefined || slide.patientId === patientId)
        ) {
            registeredSlides.delete(key);
        }
    }
}

/**
 * The serving fields of a slide published by a loaded hierarchy. Throws for
 * an unknown slide, one that cannot serve tiles, or invalid tile metadata.
 */
export function getWsiSlideSource(
    studyId: string,
    slideKey: string
): WsiSlideSource {
    if (!studyId || !slideKey) {
        throw new Error('WSI study and slide are required');
    }
    const slide = registeredSlides.get(registryKey(studyId, slideKey));
    if (slide === undefined) {
        throw new Error('WSI resource selection is unavailable');
    }
    const { servingKey, sealedSource, tileMetadata } = slide;
    if (!servingKey || !sealedSource || !tileMetadata) {
        throw new Error('WSI slide cannot serve tiles');
    }
    validateWsiTileMetadata(tileMetadata);
    return {
        slideKey,
        servingKey,
        sealedSource,
        tileMetadata,
    };
}
