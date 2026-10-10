import { getWsiViewerRuntime } from './wsiViewerConfig';
import { PatientHierarchy, WsiSlideAccess } from './wsiViewerTypes';
import { createPromiseCache } from './wsiCacheUtils';

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
/**
 * Patient of every slide a loaded hierarchy published, keyed by study and
 * slide key. Access is only ever requested for these slides.
 */
const slidePatients = new Map<string, string>();

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
    hierarchy.samples.forEach(sample =>
        sample.parts.forEach(part =>
            part.blocks.forEach(block =>
                block.slides.forEach(slide => {
                    slidePatients.set(
                        registryKey(studyId, slide.slide_key),
                        hierarchy.patient_id
                    );
                })
            )
        )
    );
}

/** Registers one slide when a caller already has it selected. */
export function registerWsiResourceAccessTarget(
    studyId: string,
    slideKey: string,
    patientId: string
): void {
    slidePatients.set(registryKey(studyId, slideKey), patientId);
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
        slidePatients.clear();
        return;
    }
    for (const [key, slidePatient] of slidePatients) {
        if (
            key.startsWith(`${studyId}::`) &&
            (patientId === undefined || slidePatient === patientId)
        ) {
            slidePatients.delete(key);
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
    return fetchImpl(url.toString(), {
        credentials: 'same-origin',
        cache: 'no-store',
    });
}

async function requestSlideAccess(
    studyId: string,
    patientId: string,
    slideKey: string
): Promise<WsiSlideAccess> {
    const response = await fetchSlideAccess(studyId, patientId, slideKey);
    if (!response.ok) {
        throw new Error(`WSI authorization failed (${response.status})`);
    }
    const payload = (await response.json()) as WsiSlideAccess;
    if (
        !payload ||
        payload.slideKey !== slideKey ||
        !payload.accessToken ||
        !payload.tileMetadata ||
        !Number.isFinite(payload.expiresIn) ||
        payload.expiresIn <= 0
    ) {
        throw new Error('Invalid WSI slide access response');
    }
    validateWsiTileMetadata(payload.tileMetadata);
    // Copy only the contract fields so nothing else from the response is
    // retained client-side.
    return {
        slideKey,
        tileMetadata: payload.tileMetadata,
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
    const patientId = slidePatients.get(registryKey(studyId, slideKey));
    if (patientId === undefined) {
        return Promise.reject(
            new Error('WSI resource selection is unavailable')
        );
    }
    const key = [
        normalizeWsiAuthScope(authScope),
        studyId,
        patientId,
        slideKey,
    ].join('::');
    return slideAccess.get(
        key,
        () => requestSlideAccess(studyId, patientId, slideKey),
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
