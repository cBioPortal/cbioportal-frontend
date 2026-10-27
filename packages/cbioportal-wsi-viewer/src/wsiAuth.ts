import { getWsiViewerRuntime } from './wsiViewerConfig';
import {
    PatientHierarchy,
    TileMetadata,
    WsiSlideAccess,
} from './wsiViewerTypes';
import { createPromiseCache } from './wsiCacheUtils';
import { hierarchySlides } from './wsiSlideUtils';

const CURRENT_WSI_DECODE_POLICY =
    'geometry-v2;tile-max=16777216;thumbnail-max=16777216';
const CURRENT_WSI_DECODE_PIXELS = 16_777_216;

export function validateWsiTileMetadata(
    metadata: WsiSlideAccess['tileMetadata']
): void {
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

// An access is reused until 30 s before its token expires.
const slideAccess = createPromiseCache<WsiSlideAccess>(
    access => access.expiresAt - 30_000
);
interface RegisteredSlide {
    patientId: string;
    tileMetadata?: TileMetadata;
}

/**
 * Every slide a loaded hierarchy published, keyed by study and slide key, with
 * its patient and the tile metadata from its resource row. Access is only ever
 * requested for these slides.
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
export function registerWsiResourceAccess(
    studyId: string,
    hierarchy: PatientHierarchy
): void {
    clearWsiResourceAccessTargets(studyId, hierarchy.patient_id);
    hierarchySlides(hierarchy).forEach(slide =>
        registeredSlides.set(registryKey(studyId, slide.slide_key), {
            patientId: hierarchy.patient_id,
            tileMetadata: slide.tile_metadata,
        })
    );
}

/**
 * Forgets registered slides. With no arguments every slide is forgotten; with
 * a study (and optionally a patient) only matching slides are.
 */
export function clearWsiResourceAccessTargets(
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

function fetchSlideAccess(
    studyId: string,
    patientId: string,
    slideKey: string
): Promise<Response> {
    const { buildApiUrl, fetchImpl } = getWsiViewerRuntime();
    // The host builds only the path: the portal's URL builder encodes a `?`
    // inside it, so the slide key is added as a query parameter afterwards.
    const url = new URL(
        buildApiUrl(
            `api/wsi/v2/resources/${encodeURIComponent(
                studyId
            )}/${encodeURIComponent(patientId)}/access`
        ),
        typeof window === 'undefined'
            ? 'http://localhost'
            : window.location.origin
    );
    url.search = `?slideKey=${encodeURIComponent(slideKey)}`;
    // `include`, like the slide rows request: the API may be on another origin.
    return fetchImpl(url.toString(), {
        credentials: 'include',
        cache: 'no-store',
    });
}

async function requestSlideAccess(
    studyId: string,
    slideKey: string,
    slide: RegisteredSlide
): Promise<WsiSlideAccess> {
    // The tile metadata comes from the slide's resource row; a slide that
    // cannot serve tiles has none.
    if (!slide.tileMetadata) {
        throw new Error('WSI slide cannot serve tiles');
    }
    validateWsiTileMetadata(slide.tileMetadata);
    const response = await fetchSlideAccess(studyId, slide.patientId, slideKey);
    if (!response.ok) {
        throw new Error(`WSI authorization failed (${response.status})`);
    }
    const payload = await response.json();
    if (
        !payload ||
        payload.slideKey !== slideKey ||
        !payload.accessToken ||
        !Number.isFinite(payload.expiresIn) ||
        payload.expiresIn <= 0
    ) {
        throw new Error('Invalid WSI slide access response');
    }
    return {
        slideKey,
        tileMetadata: slide.tileMetadata,
        accessToken: payload.accessToken,
        expiresIn: payload.expiresIn,
        expiresAt: Date.now() + payload.expiresIn * 1000,
    };
}

export function getWsiSlideAccess(
    studyId: string,
    slideKey: string,
    forceRefresh = false,
    authScope = 'anonymousUser'
): Promise<WsiSlideAccess> {
    if (!studyId || !slideKey) {
        return Promise.reject(new Error('WSI study and slide are required'));
    }
    // Unknown slides fail here, before any request or cached capability:
    // access is only ever used for a slide published by a loaded hierarchy.
    const slide = registeredSlides.get(registryKey(studyId, slideKey));
    if (slide === undefined) {
        return Promise.reject(
            new Error('WSI resource selection is unavailable')
        );
    }
    const key = [
        normalizeWsiAuthScope(authScope),
        studyId,
        slide.patientId,
        slideKey,
    ].join('::');
    return slideAccess.get(
        key,
        () => requestSlideAccess(studyId, slideKey, slide),
        forceRefresh
    );
}

export function clearWsiSlideAccess(studyId?: string): void {
    if (studyId) {
        slideAccess.clear(key => key.includes(`::${studyId}::`));
        clearWsiResourceAccessTargets(studyId);
        return;
    }
    slideAccess.clear();
    clearWsiResourceAccessTargets();
}
