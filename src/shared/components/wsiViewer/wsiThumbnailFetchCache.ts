import { WsiSlideAccess } from './wsiViewerTypes';
import {
    buildWsiRequestHeaders,
    buildWsiThumbnailUrl,
    WSI_THUMBNAIL_HEIGHT,
    WSI_THUMBNAIL_WIDTH,
} from './wsiUrls';

const THUMBNAIL_CACHE_TTL_MS = 5 * 60 * 1000;
const THUMBNAIL_CACHE_CAPACITY = 128;

type CachedThumbnail = {
    expiresAt: number;
    promise: Promise<Blob>;
};

export class WsiThumbnailFetchError extends Error {
    readonly response?: Response;
    readonly reason?: string;
    readonly retryable: boolean;

    constructor(
        message: string,
        options: {
            response?: Response;
            reason?: string;
            retryable?: boolean;
        } = {}
    ) {
        super(message);
        this.name = 'WsiThumbnailFetchError';
        this.response = options.response;
        this.reason = options.reason;
        this.retryable = options.retryable ?? false;
    }
}

const thumbnailCache = new Map<string, CachedThumbnail>();

function cacheKey(
    tileServerBase: string,
    studyId: string,
    imageId: string,
    access: WsiSlideAccess
): string {
    return [
        tileServerBase,
        studyId,
        imageId,
        access.thumbnail.sourceUrl,
        access.accessToken,
    ].join('::');
}

function parseMaxAgeMs(cacheControl: string | null): number | undefined {
    const match = cacheControl?.match(/(?:^|,)\s*max-age\s*=\s*(\d+)/i);
    if (!match) return undefined;
    const seconds = Number(match[1]);
    return Number.isFinite(seconds) ? seconds * 1000 : undefined;
}

function wrapWithAbort<T>(
    promise: Promise<T>,
    signal?: AbortSignal
): Promise<T> {
    if (!signal) return promise;
    if (signal.aborted) {
        return Promise.reject(new DOMException('Aborted', 'AbortError'));
    }

    return new Promise<T>((resolve, reject) => {
        const onAbort = () => {
            cleanup();
            reject(new DOMException('Aborted', 'AbortError'));
        };
        const cleanup = () => signal.removeEventListener('abort', onAbort);
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

function evictExpiredAndOldest(now: number): void {
    for (const [key, entry] of thumbnailCache) {
        if (entry.expiresAt <= now) thumbnailCache.delete(key);
    }
    while (thumbnailCache.size > THUMBNAIL_CACHE_CAPACITY) {
        const oldest = thumbnailCache.keys().next().value;
        if (oldest === undefined) return;
        thumbnailCache.delete(oldest);
    }
}

async function requestThumbnail(
    tileServerBase: string,
    access: WsiSlideAccess,
    cacheMode: RequestCache
): Promise<{ blob: Blob; maxAgeMs?: number }> {
    const url = buildWsiThumbnailUrl(
        tileServerBase,
        WSI_THUMBNAIL_WIDTH,
        WSI_THUMBNAIL_HEIGHT,
        access.thumbnail.sourceUrl
    );
    const response = await fetch(url, {
        cache: cacheMode,
        headers: buildWsiRequestHeaders(
            access.thumbnail.sourceUrl,
            access.accessToken
        ),
    });
    const reason = response.headers
        .get('X-Thumbnail-Reason')
        ?.trim()
        ?.toLowerCase();
    if (!response.ok) {
        throw new WsiThumbnailFetchError(
            `thumbnail request failed (${response.status})`,
            {
                response,
                reason,
                retryable:
                    response.status === 408 ||
                    response.status === 429 ||
                    response.status >= 500,
            }
        );
    }
    if (
        response.headers
            .get('X-Thumbnail-Status')
            ?.trim()
            ?.toLowerCase() === 'placeholder'
    ) {
        throw new WsiThumbnailFetchError('published thumbnail is not ready', {
            response,
            reason,
            retryable: true,
        });
    }
    if (
        !response.headers
            .get('Content-Type')
            ?.trim()
            ?.toLowerCase()
            .startsWith('image/')
    ) {
        throw new WsiThumbnailFetchError(
            'published thumbnail has an invalid content type',
            { response, reason }
        );
    }

    const blob = await response.blob();
    if (!blob.size) {
        throw new WsiThumbnailFetchError('published thumbnail is empty', {
            response,
            reason,
        });
    }
    return {
        blob,
        maxAgeMs: parseMaxAgeMs(response.headers.get('Cache-Control')),
    };
}

function getOrCreateThumbnailRequest(
    tileServerBase: string,
    studyId: string,
    imageId: string,
    access: WsiSlideAccess,
    cacheMode: RequestCache
): Promise<Blob> {
    const key = cacheKey(tileServerBase, studyId, imageId, access);
    const now = Date.now();
    evictExpiredAndOldest(now);
    const cached = thumbnailCache.get(key);
    if (cached && cached.expiresAt > now) {
        thumbnailCache.delete(key);
        thumbnailCache.set(key, cached);
        return cached.promise;
    }

    const accessExpiresAt =
        access.expiresAt ?? now + Math.max(1, access.expiresIn) * 1000;
    const initialExpiry = Math.min(
        now + THUMBNAIL_CACHE_TTL_MS,
        accessExpiresAt
    );
    const promise = requestThumbnail(tileServerBase, access, cacheMode)
        .then(result => {
            const current = thumbnailCache.get(key);
            if (current?.promise === promise) {
                current.expiresAt = Math.min(
                    initialExpiry,
                    Date.now() + (result.maxAgeMs ?? THUMBNAIL_CACHE_TTL_MS)
                );
            }
            return result.blob;
        })
        .catch(error => {
            const current = thumbnailCache.get(key);
            if (current?.promise === promise) thumbnailCache.delete(key);
            throw error;
        });

    thumbnailCache.set(key, { expiresAt: initialExpiry, promise });
    evictExpiredAndOldest(Date.now());
    return promise;
}

export function fetchWsiThumbnailBlob(
    tileServerBase: string,
    studyId: string,
    imageId: string,
    access: WsiSlideAccess,
    signal?: AbortSignal,
    cacheMode: RequestCache = 'default'
): Promise<Blob> {
    return wrapWithAbort(
        getOrCreateThumbnailRequest(
            tileServerBase,
            studyId,
            imageId,
            access,
            cacheMode
        ),
        signal
    );
}

export function clearWsiThumbnailFetchCache(): void {
    thumbnailCache.clear();
}
