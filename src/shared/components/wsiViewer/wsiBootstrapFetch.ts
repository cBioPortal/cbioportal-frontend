import { getServerConfig } from 'config/config';
import {
    hasCachedPatientHierarchy,
    fetchPatientHierarchyReadOnly,
    seedPatientHierarchyCache,
    seedPatientHierarchyCachePromise,
} from './wsiHierarchyFetchCache';
import {
    hasCachedSlideMetadata,
    seedSlideMetadataCache,
} from './wsiMetadataFetchCache';
import {
    PatientBootstrapResponse,
    PatientHierarchy,
    TileMetadata,
} from './wsiViewerTypes';
import { fetchWsi, getWsiSessionStorage } from './wsiAuth';

const BOOTSTRAP_CACHE_TTL_MS = 5 * 60 * 1000;
const BOOTSTRAP_STORAGE_KEY_PREFIX = 'wsi-bootstrap-cache-v3::';

export function isWsiBootstrapEnabled(): boolean {
    return getServerConfig().msk_wsi_enable_bootstrap === true;
}

export interface WsiBootstrapRequestOptions {
    hierarchyUrl: string;
}

export type WsiBootstrapStatus =
    | 'disabled'
    | 'success'
    | 'missing-initial'
    | 'failed'
    | 'skipped-cache-hit';

export interface WsiHierarchyLoadResult {
    hierarchy: PatientHierarchy;
    initial: PatientBootstrapResponse['initial'];
    source: 'bootstrap' | 'hierarchy';
    bootstrapStatus: WsiBootstrapStatus;
    bootstrapFallbackReason?: string;
    cacheHit: boolean;
}

type CachedBootstrapEntry = {
    expiresAt: number;
    promise: Promise<PatientBootstrapResponse>;
};

const bootstrapCache = new Map<string, CachedBootstrapEntry>();

function isFiniteNumber(value: unknown): value is number {
    return typeof value === 'number' && Number.isFinite(value);
}

function isPositiveFiniteNumber(value: unknown): value is number {
    return isFiniteNumber(value) && value > 0;
}

function isImageDimensions(
    value: unknown
): value is TileMetadata['dimensions'] {
    const candidate = value as TileMetadata['dimensions'] | null;
    return (
        !!candidate &&
        isPositiveFiniteNumber(candidate.width) &&
        isPositiveFiniteNumber(candidate.height)
    );
}

function isMpp(value: unknown): value is NonNullable<TileMetadata['mpp']> {
    const candidate = value as NonNullable<TileMetadata['mpp']> | null;
    return (
        !!candidate &&
        isPositiveFiniteNumber(candidate.x) &&
        isPositiveFiniteNumber(candidate.y)
    );
}

function isTileMetadata(value: unknown): value is TileMetadata {
    const candidate = value as TileMetadata | null;
    if (
        !candidate ||
        !isImageDimensions(candidate.dimensions) ||
        !Array.isArray(candidate.level_dimensions) ||
        candidate.level_dimensions.length === 0 ||
        !isPositiveFiniteNumber(candidate.levels) ||
        !isPositiveFiniteNumber(candidate.max_zoom) ||
        !isPositiveFiniteNumber(candidate.tile_size) ||
        (candidate.mpp !== undefined && !isMpp(candidate.mpp)) ||
        (candidate.objective_power !== undefined &&
            !isPositiveFiniteNumber(candidate.objective_power))
    ) {
        return false;
    }

    for (let index = 0; index < candidate.level_dimensions.length; index += 1) {
        if (!isImageDimensions(candidate.level_dimensions[index])) {
            return false;
        }
    }

    return true;
}

function isPatientHierarchy(value: unknown): value is PatientHierarchy {
    const candidate = value as PatientHierarchy | null;
    return (
        !!candidate &&
        typeof candidate.patient_id === 'string' &&
        Array.isArray(candidate.samples)
    );
}

function cloneBootstrapResponse(
    payload: PatientBootstrapResponse
): PatientBootstrapResponse {
    if (typeof structuredClone === 'function') {
        return structuredClone(payload) as PatientBootstrapResponse;
    }
    return JSON.parse(JSON.stringify(payload)) as PatientBootstrapResponse;
}

export function buildPatientBootstrapUrl({
    hierarchyUrl,
}: WsiBootstrapRequestOptions): string {
    const url = new URL(hierarchyUrl);
    url.pathname = `${url.pathname.replace(/\/$/, '')}/bootstrap`;
    return url.toString();
}

function getBootstrapStorageKey(url: string): string {
    return `${BOOTSTRAP_STORAGE_KEY_PREFIX}${url}`;
}

function readPersistedBootstrap(url: string): CachedBootstrapEntry | undefined {
    const storage = getWsiSessionStorage();
    if (!storage) {
        return undefined;
    }

    try {
        const storageKey = getBootstrapStorageKey(url);
        const raw = storage.getItem(storageKey);
        if (!raw) {
            return undefined;
        }

        const parsed = JSON.parse(raw) as {
            expiresAt?: number;
            data?: PatientBootstrapResponse;
        };
        if (
            !parsed ||
            typeof parsed.expiresAt !== 'number' ||
            !parsed.data ||
            parsed.expiresAt <= Date.now() ||
            !isValidPatientBootstrapResponse(parsed.data)
        ) {
            storage.removeItem(storageKey);
            return undefined;
        }

        return {
            expiresAt: parsed.expiresAt,
            promise: Promise.resolve(parsed.data),
        };
    } catch (_) {
        return undefined;
    }
}

function persistBootstrap(
    url: string,
    expiresAt: number,
    payload: PatientBootstrapResponse
): void {
    const storage = getWsiSessionStorage();
    if (!storage) {
        return;
    }

    try {
        const storageKey = getBootstrapStorageKey(url);
        storage.setItem(
            storageKey,
            JSON.stringify({
                expiresAt,
                data: payload,
            })
        );
    } catch (_) {
        // Ignore storage quota or serialization failures.
    }
}

function wrapWithAbort<T>(
    promise: Promise<T>,
    signal?: AbortSignal
): Promise<T> {
    if (!signal) {
        return promise;
    }

    if (signal.aborted) {
        return Promise.reject(new DOMException('Aborted', 'AbortError'));
    }

    return new Promise<T>((resolve, reject) => {
        const onAbort = () => {
            cleanup();
            reject(new DOMException('Aborted', 'AbortError'));
        };
        const cleanup = () => {
            signal.removeEventListener('abort', onAbort);
        };

        signal.addEventListener('abort', onAbort, { once: true });
        promise.then(
            value => {
                cleanup();
                resolve(value);
            },
            error => {
                cleanup();
                reject(error);
            }
        );
    });
}

function getOrCreateBootstrapRequest(
    options: WsiBootstrapRequestOptions
): Promise<PatientBootstrapResponse> {
    const url = buildPatientBootstrapUrl(options);
    const now = Date.now();
    const cached = bootstrapCache.get(url);
    if (cached && cached.expiresAt > now) {
        return cached.promise;
    }

    const persisted = readPersistedBootstrap(url);
    if (persisted) {
        bootstrapCache.set(url, persisted);
        return persisted.promise;
    }

    const expiresAt = now + BOOTSTRAP_CACHE_TTL_MS;
    const promise = fetchWsi(url, {
        cache: 'no-store',
    })
        .then(async response => {
            if (!response.ok) {
                throw new Error(`Server returned ${response.status}`);
            }
            const payload = (await response.json()) as unknown;
            if (!isValidPatientBootstrapResponse(payload)) {
                throw new Error('Invalid bootstrap response');
            }

            const cloned = cloneBootstrapResponse(payload);
            persistBootstrap(url, expiresAt, cloned);
            return cloned;
        })
        .catch(error => {
            const current = bootstrapCache.get(url);
            if (current?.promise === promise) {
                bootstrapCache.delete(url);
            }
            throw error;
        });

    bootstrapCache.set(url, {
        expiresAt,
        promise,
    });

    if (!hasCachedPatientHierarchy(options.hierarchyUrl)) {
        seedPatientHierarchyCachePromise(
            options.hierarchyUrl,
            promise.then(payload => payload.hierarchy)
        );
    }

    return promise;
}

export function isValidPatientBootstrapResponse(
    value: unknown
): value is PatientBootstrapResponse {
    const candidate = value as PatientBootstrapResponse | null;
    if (!candidate || !isPatientHierarchy(candidate.hierarchy)) {
        return false;
    }
    if (candidate.initial == null) {
        return true;
    }

    return (
        (candidate.initial.sample_id === null ||
            typeof candidate.initial.sample_id === 'string') &&
        typeof candidate.initial.image_id === 'string' &&
        candidate.initial.image_id.length > 0 &&
        isTileMetadata(candidate.initial.metadata)
    );
}

export async function fetchPatientBootstrap(
    options: WsiBootstrapRequestOptions,
    signal?: AbortSignal
): Promise<PatientBootstrapResponse> {
    const payload = await wrapWithAbort(
        getOrCreateBootstrapRequest(options),
        signal
    );
    return cloneBootstrapResponse(payload);
}

export async function fetchPatientBootstrapReadOnly(
    options: WsiBootstrapRequestOptions,
    signal?: AbortSignal
): Promise<PatientBootstrapResponse> {
    return wrapWithAbort(getOrCreateBootstrapRequest(options), signal);
}

export async function fetchPatientHierarchyWithBootstrap(
    options: WsiBootstrapRequestOptions & { tileServerBase: string },
    signal?: AbortSignal
): Promise<WsiHierarchyLoadResult> {
    const hierarchyCacheHit = hasCachedPatientHierarchy(options.hierarchyUrl);
    const bootstrapEnabled = isWsiBootstrapEnabled();
    const bootstrapCacheHit = bootstrapEnabled
        ? hasCachedPatientBootstrap(options)
        : false;

    if (bootstrapEnabled && !hierarchyCacheHit) {
        try {
            const payload = await fetchPatientBootstrapReadOnly(
                options,
                signal
            );
            hydratePatientBootstrapCaches(
                options.hierarchyUrl,
                options.tileServerBase,
                payload
            );
            return {
                hierarchy: payload.hierarchy,
                initial: payload.initial,
                source: 'bootstrap',
                bootstrapStatus:
                    payload.initial == null ? 'missing-initial' : 'success',
                cacheHit: bootstrapCacheHit,
            };
        } catch (error) {
            if (signal?.aborted) {
                throw error;
            }

            const hierarchy = await fetchPatientHierarchyReadOnly(
                options.hierarchyUrl,
                signal
            );
            return {
                hierarchy,
                initial: null,
                source: 'hierarchy',
                bootstrapStatus: 'failed',
                bootstrapFallbackReason:
                    error instanceof Error ? error.message : String(error),
                cacheHit: hierarchyCacheHit,
            };
        }
    }

    const hierarchy = await fetchPatientHierarchyReadOnly(
        options.hierarchyUrl,
        signal
    );
    return {
        hierarchy,
        initial: null,
        source: 'hierarchy',
        bootstrapStatus: bootstrapEnabled ? 'skipped-cache-hit' : 'disabled',
        cacheHit: hierarchyCacheHit,
    };
}

export function hasCachedPatientBootstrap(
    options: WsiBootstrapRequestOptions
): boolean {
    const url = buildPatientBootstrapUrl(options);
    const cached = bootstrapCache.get(url);
    return (
        (!!cached && cached.expiresAt > Date.now()) ||
        !!readPersistedBootstrap(url)
    );
}

export function hydratePatientBootstrapCaches(
    hierarchyUrl: string,
    tileServerBase: string,
    payload: PatientBootstrapResponse
): void {
    const studyId =
        new URL(hierarchyUrl).searchParams.get('studyId') || undefined;
    if (!hasCachedPatientHierarchy(hierarchyUrl)) {
        seedPatientHierarchyCache(hierarchyUrl, payload.hierarchy);
    }
    if (payload.initial?.image_id && payload.initial.metadata) {
        if (
            !hasCachedSlideMetadata(
                tileServerBase,
                payload.initial.image_id,
                studyId
            )
        ) {
            seedSlideMetadataCache(
                tileServerBase,
                payload.initial.image_id,
                payload.initial.metadata,
                studyId
            );
        }
    }
}

export function clearPatientBootstrapCache(): void {
    bootstrapCache.clear();
    const storage = getWsiSessionStorage();
    if (!storage) {
        return;
    }

    try {
        for (let index = storage.length - 1; index >= 0; index -= 1) {
            const key = storage.key(index);
            if (key?.startsWith(BOOTSTRAP_STORAGE_KEY_PREFIX)) {
                storage.removeItem(key);
            }
        }
    } catch (_) {
        // Ignore storage access failures.
    }
}
