import { TileMetadata } from './wsiViewerTypes';
import {
    getWsiSessionStorage,
    getWsiSlideAccess,
    validateWsiTileMetadata,
} from './wsiAuth';

const METADATA_CACHE_TTL_MS = 5 * 60 * 1000;
const METADATA_STORAGE_KEY_PREFIX = 'wsi-metadata-cache::';

type CachedMetadataEntry = {
    expiresAt: number;
    promise: Promise<TileMetadata>;
};

const metadataCache = new Map<string, CachedMetadataEntry>();

function buildMetadataCacheKey(
    tileServerBase: string,
    imageId: string,
    studyId?: string
): string {
    return `${tileServerBase}::${studyId || ''}::${imageId}`;
}

function getMetadataStorageKey(
    tileServerBase: string,
    imageId: string,
    studyId?: string
): string {
    return `${METADATA_STORAGE_KEY_PREFIX}${buildMetadataCacheKey(
        tileServerBase,
        imageId,
        studyId
    )}`;
}

function readPersistedMetadata(
    tileServerBase: string,
    imageId: string,
    studyId?: string
): CachedMetadataEntry | undefined {
    const storage = getWsiSessionStorage();
    if (!storage) {
        return undefined;
    }

    try {
        const storageKey = getMetadataStorageKey(
            tileServerBase,
            imageId,
            studyId
        );
        const raw = storage.getItem(storageKey);
        if (!raw) {
            return undefined;
        }

        const parsed = JSON.parse(raw) as {
            expiresAt?: number;
            data?: TileMetadata;
        };
        if (
            !parsed ||
            typeof parsed.expiresAt !== 'number' ||
            !parsed.data ||
            parsed.expiresAt <= Date.now()
        ) {
            storage.removeItem(storageKey);
            return undefined;
        }

        try {
            validateWsiTileMetadata(parsed.data);
        } catch (_) {
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

function persistMetadata(
    tileServerBase: string,
    imageId: string,
    expiresAt: number,
    metadata: TileMetadata,
    studyId?: string
): void {
    const storage = getWsiSessionStorage();
    if (!storage) {
        return;
    }

    try {
        const storageKey = getMetadataStorageKey(
            tileServerBase,
            imageId,
            studyId
        );
        storage.setItem(
            storageKey,
            JSON.stringify({
                expiresAt,
                data: metadata,
            })
        );
    } catch (_) {
        // Ignore storage quota or serialization failures.
    }
}

function cloneTileMetadata(metadata: TileMetadata): TileMetadata {
    // Metadata is a small fixed JSON shape, so clone it directly to keep the
    // shared cache immutable without paying generic clone/serialization costs.
    const levelDimensions = new Array(metadata.level_dimensions.length);
    for (let index = 0; index < metadata.level_dimensions.length; index += 1) {
        const level = metadata.level_dimensions[index];
        levelDimensions[index] = {
            width: level.width,
            height: level.height,
        };
    }

    return {
        dimensions: {
            width: metadata.dimensions.width,
            height: metadata.dimensions.height,
        },
        levels: metadata.levels,
        level_dimensions: levelDimensions,
        level_downsamples: metadata.level_downsamples
            ? [...metadata.level_downsamples]
            : undefined,
        max_zoom: metadata.max_zoom,
        tile_metadata_schema_version: metadata.tile_metadata_schema_version,
        decode_policy_version: metadata.decode_policy_version,
        max_decode_pixels: metadata.max_decode_pixels,
        thumbnail_max_decode_pixels: metadata.thumbnail_max_decode_pixels,
        safe_min_level: metadata.safe_min_level,
        tile_size: metadata.tile_size,
        mpp: metadata.mpp
            ? {
                  x: metadata.mpp.x,
                  y: metadata.mpp.y,
              }
            : undefined,
        objective_power: metadata.objective_power,
        vendor: metadata.vendor,
    };
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

function getOrCreateMetadataRequest(
    tileServerBase: string,
    imageId: string,
    studyId?: string
): Promise<TileMetadata> {
    const cacheKey = buildMetadataCacheKey(tileServerBase, imageId, studyId);
    const now = Date.now();
    const cached = metadataCache.get(cacheKey);
    if (cached && cached.expiresAt > now) {
        return cached.promise;
    }

    const persisted = readPersistedMetadata(tileServerBase, imageId, studyId);
    if (persisted) {
        metadataCache.set(cacheKey, persisted);
        return persisted.promise;
    }

    const expiresAt = now + METADATA_CACHE_TTL_MS;

    if (!studyId) {
        const promise = Promise.reject(
            new Error('WSI slide metadata requires a study ID')
        );
        metadataCache.set(cacheKey, { expiresAt, promise });
        return promise;
    }
    const promise = getWsiSlideAccess(studyId, imageId)
        .then(access => access.tileMetadata)
        .then(metadata => {
            validateWsiTileMetadata(metadata);
            persistMetadata(tileServerBase, imageId, expiresAt, metadata, studyId);
            return metadata;
        })
        .catch(error => {
            const current = metadataCache.get(cacheKey);
            if (current?.promise === promise) {
                metadataCache.delete(cacheKey);
            }
            throw error;
        });

    metadataCache.set(cacheKey, {
        expiresAt,
        promise,
    });
    return promise;
}

export function seedSlideMetadataCache(
    tileServerBase: string,
    imageId: string,
    metadata: TileMetadata,
    studyId?: string
): void {
    const expiresAt = Date.now() + METADATA_CACHE_TTL_MS;
    const cloned = cloneTileMetadata(metadata);
    validateWsiTileMetadata(cloned);
    metadataCache.set(buildMetadataCacheKey(tileServerBase, imageId, studyId), {
        expiresAt,
        promise: Promise.resolve(cloned),
    });
    persistMetadata(tileServerBase, imageId, expiresAt, cloned, studyId);
}

export async function fetchSlideMetadataCached(
    tileServerBase: string,
    imageId: string,
    signal?: AbortSignal,
    studyId?: string
): Promise<TileMetadata> {
    const metadata = await wrapWithAbort(
        getOrCreateMetadataRequest(tileServerBase, imageId, studyId),
        signal
    );
    return cloneTileMetadata(metadata);
}

export async function fetchSlideMetadataCachedReadOnly(
    tileServerBase: string,
    imageId: string,
    signal?: AbortSignal,
    studyId?: string
): Promise<TileMetadata> {
    return wrapWithAbort(
        getOrCreateMetadataRequest(tileServerBase, imageId, studyId),
        signal
    );
}

export async function preloadSlideMetadata(
    tileServerBase: string,
    imageId: string,
    studyId?: string
): Promise<void> {
    await getOrCreateMetadataRequest(tileServerBase, imageId, studyId);
}

export function hasCachedSlideMetadata(
    tileServerBase: string,
    imageId: string,
    studyId?: string
): boolean {
    const cacheKey = buildMetadataCacheKey(tileServerBase, imageId, studyId);
    const cached = metadataCache.get(cacheKey);
    return (
        (!!cached && cached.expiresAt > Date.now()) ||
        !!readPersistedMetadata(tileServerBase, imageId, studyId)
    );
}

export function evictSlideMetadataCache(
    tileServerBase: string,
    imageId: string,
    studyId?: string
): void {
    metadataCache.delete(buildMetadataCacheKey(tileServerBase, imageId, studyId));

    const storage = getWsiSessionStorage();
    if (!storage) {
        return;
    }

    try {
        storage.removeItem(
            getMetadataStorageKey(tileServerBase, imageId, studyId)
        );
    } catch (_) {
        // Ignore storage access failures.
    }
}

export function clearSlideMetadataCache() {
    metadataCache.clear();
    const storage = getWsiSessionStorage();
    if (!storage) {
        return;
    }

    try {
        for (let index = storage.length - 1; index >= 0; index -= 1) {
            const key = storage.key(index);
            if (key?.startsWith(METADATA_STORAGE_KEY_PREFIX)) {
                storage.removeItem(key);
            }
        }
    } catch (_) {
        // Ignore storage access failures.
    }
}
