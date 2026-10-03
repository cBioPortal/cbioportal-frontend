import { TileMetadata } from './wsiViewerTypes';
import {
    getWsiSessionStorage,
    getWsiSlideAccess,
    normalizeWsiAuthScope,
    validateWsiTileMetadata,
} from './wsiAuth';
import { deleteExpiredEntries, withAbort } from './wsiCacheUtils';

const METADATA_CACHE_TTL_MS = 5 * 60 * 1000;
const METADATA_STORAGE_KEY_PREFIX = 'wsi-metadata-cache::';

type CachedMetadataEntry = {
    expiresAt: number;
    promise: Promise<TileMetadata>;
};

const metadataCache = new Map<string, CachedMetadataEntry>();

function buildMetadataCacheKey(
    tileServerBase: string,
    slideKey: string,
    studyId?: string,
    authScope?: string
): string {
    return `${normalizeWsiAuthScope(authScope)}::${tileServerBase}::${studyId ||
        ''}::${slideKey}`;
}

function getMetadataStorageKey(
    tileServerBase: string,
    slideKey: string,
    studyId?: string,
    authScope?: string
): string {
    return `${METADATA_STORAGE_KEY_PREFIX}${buildMetadataCacheKey(
        tileServerBase,
        slideKey,
        studyId,
        authScope
    )}`;
}

function readPersistedMetadata(
    tileServerBase: string,
    slideKey: string,
    studyId?: string,
    authScope?: string
): CachedMetadataEntry | undefined {
    const storage = getWsiSessionStorage();
    if (!storage) {
        return undefined;
    }

    try {
        const storageKey = getMetadataStorageKey(
            tileServerBase,
            slideKey,
            studyId,
            authScope
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
    slideKey: string,
    expiresAt: number,
    metadata: TileMetadata,
    studyId?: string,
    authScope?: string
): void {
    const storage = getWsiSessionStorage();
    if (!storage) {
        return;
    }

    try {
        const storageKey = getMetadataStorageKey(
            tileServerBase,
            slideKey,
            studyId,
            authScope
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

function getOrCreateMetadataRequest(
    tileServerBase: string,
    slideKey: string,
    studyId?: string,
    authScope?: string
): Promise<TileMetadata> {
    const cacheKey = buildMetadataCacheKey(
        tileServerBase,
        slideKey,
        studyId,
        authScope
    );
    const now = Date.now();
    const cached = metadataCache.get(cacheKey);
    if (cached && cached.expiresAt > now) {
        return cached.promise;
    }

    const persisted = readPersistedMetadata(
        tileServerBase,
        slideKey,
        studyId,
        authScope
    );
    if (persisted) {
        metadataCache.set(cacheKey, persisted);
        return persisted.promise;
    }

    const expiresAt = now + METADATA_CACHE_TTL_MS;
    deleteExpiredEntries(metadataCache, now);

    if (!studyId) {
        const promise = Promise.reject(
            new Error('WSI slide metadata requires a study ID')
        );
        metadataCache.set(cacheKey, { expiresAt, promise });
        return promise;
    }
    const promise = getWsiSlideAccess(studyId, slideKey, false, authScope)
        .then(access => access.tileMetadata)
        .then(metadata => {
            validateWsiTileMetadata(metadata);
            persistMetadata(
                tileServerBase,
                slideKey,
                expiresAt,
                metadata,
                studyId,
                authScope
            );
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

export async function fetchSlideMetadataCachedReadOnly(
    tileServerBase: string,
    slideKey: string,
    signal?: AbortSignal,
    studyId?: string,
    authScope?: string
): Promise<TileMetadata> {
    return withAbort(
        getOrCreateMetadataRequest(
            tileServerBase,
            slideKey,
            studyId,
            authScope
        ),
        signal
    );
}

export function hasCachedSlideMetadata(
    tileServerBase: string,
    slideKey: string,
    studyId?: string,
    authScope?: string
): boolean {
    const cacheKey = buildMetadataCacheKey(
        tileServerBase,
        slideKey,
        studyId,
        authScope
    );
    const cached = metadataCache.get(cacheKey);
    return (
        (!!cached && cached.expiresAt > Date.now()) ||
        !!readPersistedMetadata(tileServerBase, slideKey, studyId, authScope)
    );
}

export function evictSlideMetadataCache(
    tileServerBase: string,
    slideKey: string,
    studyId?: string,
    authScope?: string
): void {
    metadataCache.delete(
        buildMetadataCacheKey(tileServerBase, slideKey, studyId, authScope)
    );

    const storage = getWsiSessionStorage();
    if (!storage) {
        return;
    }

    try {
        storage.removeItem(
            getMetadataStorageKey(tileServerBase, slideKey, studyId, authScope)
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
