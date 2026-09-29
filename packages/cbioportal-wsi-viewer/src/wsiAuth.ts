import { getWsiViewerRuntime } from './wsiViewerConfig';
import { PatientHierarchy, WsiSlideAccess } from './wsiViewerTypes';

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

    const schema = metadata.tile_metadata_schema_version;
    if (schema == null) return;
    if (!Number.isInteger(schema) || schema !== 2) {
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

const WSI_SESSION_CACHE_PREFIXES = [
    'wsi-hierarchy-cache-',
    'wsi-metadata-cache-',
    'wsi-bootstrap-cache-',
];
let protectedSessionCachePurged = false;

export function normalizeWsiAuthScope(scope?: string): string {
    const normalized = scope?.trim();
    return normalized || 'anonymousUser';
}

export function isWsiAuthConfigured(): boolean {
    return getWsiViewerRuntime().authEnabled;
}

export function isWsiAuthEnabled(): boolean {
    // The capability backend contract is mandatory for every deployed viewer mode.
    return true;
}

export function getWsiSessionStorage(): Storage | null {
    if (typeof window === 'undefined') {
        return null;
    }

    try {
        const storage = window.sessionStorage;
        if (!isWsiAuthConfigured()) {
            return storage;
        }
        if (!protectedSessionCachePurged) {
            for (let index = storage.length - 1; index >= 0; index -= 1) {
                const key = storage.key(index);
                if (
                    key &&
                    WSI_SESSION_CACHE_PREFIXES.some(prefix =>
                        key.startsWith(prefix)
                    )
                ) {
                    storage.removeItem(key);
                }
            }
            protectedSessionCachePurged = true;
        }
        return null;
    } catch (_) {
        return null;
    }
}

const slideAccess = new Map<string, WsiSlideAccess>();
const pendingSlideAccess = new Map<string, Promise<WsiSlideAccess>>();
export type ResourceAccessTarget = {
    patientId: string;
    resourceId: string;
    resourceDataId: string;
};
const resourceAccessTargets = new Map<string, ResourceAccessTarget>();
/** Hierarchy refreshers keyed by study and patient, used after a stale 404. */
const resourceAccessRefreshers = new Map<string, () => Promise<unknown>>();
const pendingResourceAccessRefreshes = new Map<string, Promise<unknown>>();
/**
 * Targets that a completed refresh re-published unchanged or introduced. A
 * 404 for one of them cannot be fixed by reloading the hierarchy again.
 */
const refreshedResourceAccessTargets = new Map<string, ResourceAccessTarget>();
type FailedSlideAccess = {
    studyId: string;
    imageId: string;
    target: ResourceAccessTarget;
    status: number;
};
/**
 * Slides whose access still returned 404 after a refresh, keyed like cached
 * access. They fail fast until their target is cleared or re-registered with
 * a different identity.
 */
const failedSlideAccess = new Map<string, FailedSlideAccess>();

function resourceAccessKey(studyId: string, imageId: string): string {
    return `${studyId}::${imageId}`;
}

function resourcePatientKey(studyId: string, patientId: string): string {
    return `${studyId}::${patientId}`;
}

function isSameResourceAccessTarget(
    a: ResourceAccessTarget | undefined,
    b: ResourceAccessTarget
): boolean {
    return (
        !!a &&
        a.patientId === b.patientId &&
        a.resourceId === b.resourceId &&
        a.resourceDataId === b.resourceDataId
    );
}

/** Forgets refresh outcomes for slides whose registered target changed. */
function pruneResourceAccessOutcomes(studyId: string): void {
    for (const [key, target] of refreshedResourceAccessTargets) {
        if (
            key.startsWith(`${studyId}::`) &&
            !isSameResourceAccessTarget(resourceAccessTargets.get(key), target)
        ) {
            refreshedResourceAccessTargets.delete(key);
        }
    }
    for (const [key, failure] of failedSlideAccess) {
        if (
            failure.studyId === studyId &&
            !isSameResourceAccessTarget(
                resourceAccessTargets.get(
                    resourceAccessKey(studyId, failure.imageId)
                ),
                failure.target
            )
        ) {
            failedSlideAccess.delete(key);
        }
    }
}

/**
 * Registers the resource identity of every slide in a loaded hierarchy. The
 * hierarchy is authoritative for its study and patient, so targets from an
 * earlier load of the same patient are replaced rather than merged; this
 * prunes resource-data row IDs that a reimport has removed.
 */
export function registerWsiResourceAccess(
    studyId: string,
    hierarchy: PatientHierarchy,
    refresh?: () => Promise<unknown>
): void {
    removeResourceAccessTargets(studyId, hierarchy.patient_id);
    hierarchy.samples.forEach(sample =>
        sample.parts.forEach(part =>
            part.blocks.forEach(block =>
                block.slides.forEach(slide => {
                    if (slide.resource_id && slide.resource_data_id) {
                        resourceAccessTargets.set(
                            resourceAccessKey(studyId, slide.image_id),
                            {
                                patientId: hierarchy.patient_id,
                                resourceId: slide.resource_id,
                                resourceDataId: slide.resource_data_id,
                            }
                        );
                    }
                })
            )
        )
    );
    if (refresh) {
        resourceAccessRefreshers.set(
            resourcePatientKey(studyId, hierarchy.patient_id),
            refresh
        );
    }
    pruneResourceAccessOutcomes(studyId);
}

/** Registers a resource identity when a caller already has a selected slide. */
export function registerWsiResourceAccessTarget(
    studyId: string,
    imageId: string,
    target: ResourceAccessTarget
): void {
    resourceAccessTargets.set(resourceAccessKey(studyId, imageId), target);
    pruneResourceAccessOutcomes(studyId);
}

/**
 * Removes registered resource identities. With no arguments every target is
 * removed; with a study (and optionally a patient) only matching targets are.
 */
export function clearWsiResourceAccessTargets(
    studyId?: string,
    patientId?: string
): void {
    removeResourceAccessTargets(studyId, patientId);
    if (studyId === undefined) {
        refreshedResourceAccessTargets.clear();
        failedSlideAccess.clear();
        return;
    }
    for (const [key, target] of refreshedResourceAccessTargets) {
        if (
            key.startsWith(`${studyId}::`) &&
            (patientId === undefined || target.patientId === patientId)
        ) {
            refreshedResourceAccessTargets.delete(key);
        }
    }
    for (const [key, failure] of failedSlideAccess) {
        if (
            failure.studyId === studyId &&
            (patientId === undefined || failure.target.patientId === patientId)
        ) {
            failedSlideAccess.delete(key);
        }
    }
}

/**
 * Removes targets and refreshers without forgetting refresh outcomes, so a
 * re-registration that keeps a slide's identity keeps failing it fast.
 */
function removeResourceAccessTargets(
    studyId?: string,
    patientId?: string
): void {
    if (studyId === undefined) {
        resourceAccessTargets.clear();
        resourceAccessRefreshers.clear();
        pendingResourceAccessRefreshes.clear();
        return;
    }
    for (const [key, target] of resourceAccessTargets) {
        if (
            key.startsWith(`${studyId}::`) &&
            (patientId === undefined || target.patientId === patientId)
        ) {
            resourceAccessTargets.delete(key);
        }
    }
    const patientPrefix =
        patientId === undefined
            ? `${studyId}::`
            : resourcePatientKey(studyId, patientId);
    for (const refreshers of [
        resourceAccessRefreshers,
        pendingResourceAccessRefreshes,
    ] as Array<Map<string, unknown>>) {
        for (const key of refreshers.keys()) {
            if (
                patientId === undefined
                    ? key.startsWith(patientPrefix)
                    : key === patientPrefix
            ) {
                refreshers.delete(key);
            }
        }
    }
}

function refreshResourceAccessTargets(
    studyId: string,
    patientId: string
): Promise<unknown> | undefined {
    const key = resourcePatientKey(studyId, patientId);
    const pending = pendingResourceAccessRefreshes.get(key);
    if (pending) return pending;
    const refresh = resourceAccessRefreshers.get(key);
    if (!refresh) return undefined;
    const request = refresh()
        .then(() => {
            // Whatever the reload published is current: another 404 for one
            // of these targets is not a stale identity.
            for (const [targetKey, target] of resourceAccessTargets) {
                if (
                    targetKey.startsWith(`${studyId}::`) &&
                    target.patientId === patientId
                ) {
                    refreshedResourceAccessTargets.set(targetKey, target);
                }
            }
        })
        .finally(() => {
            if (pendingResourceAccessRefreshes.get(key) === request) {
                pendingResourceAccessRefreshes.delete(key);
            }
        });
    pendingResourceAccessRefreshes.set(key, request);
    return request;
}

function getResourceAccessTarget(
    studyId: string,
    imageId: string
): ResourceAccessTarget {
    const target = resourceAccessTargets.get(
        resourceAccessKey(studyId, imageId)
    );
    if (!target) {
        throw new Error('WSI resource selection is unavailable');
    }
    return target;
}

function fetchResourceAccess(
    studyId: string,
    target: ResourceAccessTarget
): Promise<Response> {
    const { buildApiUrl, fetchImpl } = getWsiViewerRuntime();
    const url = new URL(
        buildApiUrl(
            `api/wsi/v2/resources/${encodeURIComponent(
                studyId
            )}/${encodeURIComponent(target.patientId)}/${encodeURIComponent(
                target.resourceId
            )}/${encodeURIComponent(target.resourceDataId)}/access`
        ),
        typeof window === 'undefined'
            ? 'http://localhost'
            : window.location.origin
    );
    return fetchImpl(url.toString(), {
        credentials: 'same-origin',
        cache: 'no-store',
    });
}

/**
 * Access is cached per subject, slide and resource identity, so a capability
 * issued for a resource-data row that a reimport replaced is never reused.
 */
function slideAccessKey(
    studyId: string,
    imageId: string,
    authScope: string,
    target: ResourceAccessTarget
): string {
    return [
        normalizeWsiAuthScope(authScope),
        studyId,
        imageId,
        target.patientId,
        target.resourceId,
        target.resourceDataId,
    ].join('::');
}

async function requestSlideAccess(
    studyId: string,
    imageId: string,
    authScope: string
): Promise<WsiSlideAccess> {
    let target = getResourceAccessTarget(studyId, imageId);
    const failure = failedSlideAccess.get(
        slideAccessKey(studyId, imageId, authScope, target)
    );
    if (failure) {
        throw new Error(`WSI authorization failed (${failure.status})`);
    }
    let response = await fetchResourceAccess(studyId, target);
    if (response.status === 404) {
        // A reimport can replace resource-data rows. Reload the hierarchy,
        // bypassing its cache, at most once per slide target and retry only
        // when the reload changed this slide's identity. Other 404 causes
        // (allowlist, metadata, thumbnail) persist across reloads.
        const targetKey = resourceAccessKey(studyId, imageId);
        let refreshed = false;
        if (
            isSameResourceAccessTarget(
                resourceAccessTargets.get(targetKey),
                target
            ) &&
            !isSameResourceAccessTarget(
                refreshedResourceAccessTargets.get(targetKey),
                target
            )
        ) {
            const refresh = refreshResourceAccessTargets(
                studyId,
                target.patientId
            );
            if (refresh) {
                await refresh;
                refreshed = true;
            }
        } else {
            refreshed = true;
        }
        if (refreshed) {
            const current = getResourceAccessTarget(studyId, imageId);
            if (!isSameResourceAccessTarget(current, target)) {
                target = current;
                response = await fetchResourceAccess(studyId, target);
            }
            if (response.status === 404) {
                failedSlideAccess.set(
                    slideAccessKey(studyId, imageId, authScope, target),
                    { studyId, imageId, target, status: response.status }
                );
            }
        }
    }
    if (!response.ok) {
        throw new Error(`WSI authorization failed (${response.status})`);
    }
    const payload = (await response.json()) as WsiSlideAccess;
    if (
        !payload.accessToken ||
        !payload.sourceUrl ||
        !payload.tileMetadata ||
        !payload.thumbnail?.sourceUrl ||
        !Number.isFinite(payload.thumbnail.width) ||
        !Number.isFinite(payload.thumbnail.height) ||
        !Number.isFinite(payload.expiresIn) ||
        payload.expiresIn <= 0
    ) {
        throw new Error('Invalid WSI slide access response');
    }
    validateWsiTileMetadata(payload.tileMetadata);
    const access: WsiSlideAccess = {
        ...payload,
        expiresAt: Date.now() + payload.expiresIn * 1000,
    };
    slideAccess.set(
        slideAccessKey(studyId, imageId, authScope, target),
        access
    );
    return access;
}

export function getWsiSlideAccess(
    studyId: string,
    imageId: string,
    forceRefresh = false,
    authScope = 'anonymousUser'
): Promise<WsiSlideAccess> {
    if (!studyId || !imageId) {
        return Promise.reject(new Error('WSI study and slide are required'));
    }
    const scopedAuth = normalizeWsiAuthScope(authScope);
    let target: ResourceAccessTarget;
    try {
        // Unknown images fail here, before any request or cached capability:
        // access is only ever used for a resource identity published by a
        // loaded hierarchy.
        target = getResourceAccessTarget(studyId, imageId);
    } catch (error) {
        return Promise.reject(error);
    }
    const key = slideAccessKey(studyId, imageId, scopedAuth, target);
    if (!forceRefresh) {
        const cached = slideAccess.get(key);
        if (
            cached &&
            cached.expiresAt &&
            cached.expiresAt > Date.now() + 30_000
        ) {
            return Promise.resolve(cached);
        }
    }
    slideAccess.delete(key);
    let request = pendingSlideAccess.get(key);
    if (!request) {
        request = requestSlideAccess(studyId, imageId, scopedAuth).finally(
            () => {
                pendingSlideAccess.delete(key);
            }
        );
        pendingSlideAccess.set(key, request);
    }
    return request;
}

export function clearWsiSlideAccess(studyId?: string): void {
    if (studyId) {
        for (const key of slideAccess.keys()) {
            if (key.includes(`::${studyId}::`)) slideAccess.delete(key);
        }
        for (const key of pendingSlideAccess.keys()) {
            if (key.includes(`::${studyId}::`)) pendingSlideAccess.delete(key);
        }
        clearWsiResourceAccessTargets(studyId);
        return;
    }
    slideAccess.clear();
    pendingSlideAccess.clear();
    clearWsiResourceAccessTargets();
}
