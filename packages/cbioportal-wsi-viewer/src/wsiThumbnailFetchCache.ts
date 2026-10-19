import { WsiSlideAccess } from './wsiViewerTypes';
import {
    buildWsiRequestHeaders,
    buildWsiThumbnailUrl,
    WSI_THUMBNAIL_HEIGHT,
    WSI_THUMBNAIL_WIDTH,
} from './wsiUrls';
import { normalizeWsiAuthScope } from './wsiAuth';
import { getWsiViewerRuntime } from './wsiViewerConfig';
import { abortError, createPromiseCache, withAbort } from './wsiCacheUtils';

const THUMBNAIL_CACHE_TTL_MS = 5 * 60 * 1000;

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

// A thumbnail is kept for five minutes at most, and no longer than its
// Cache-Control max-age or the access it was fetched with.
const thumbnailCache = createPromiseCache<{ blob: Blob; expiresAt: number }>(
    thumbnail => thumbnail.expiresAt
);

/**
 * The request behind each pending cache entry and how many callers still
 * wait on it. Once none do, the request is cancelled so an abandoned
 * download stops holding the network.
 */
interface PendingThumbnail {
    promise: Promise<unknown>;
    controller: AbortController;
    waiters: number;
    settled: boolean;
}

const pendingThumbnails = new Map<string, PendingThumbnail>();

export function parseMaxAgeMs(cacheControl: string | null): number | undefined {
    const match = cacheControl?.match(/(?:^|,)\s*max-age\s*=\s*(\d+)/i);
    if (!match) return undefined;
    const seconds = Number(match[1]);
    return Number.isFinite(seconds) ? seconds * 1000 : undefined;
}

async function requestThumbnail(
    tileServerBase: string,
    access: WsiSlideAccess,
    cacheMode: RequestCache,
    signal: AbortSignal
): Promise<{ blob: Blob; maxAgeMs?: number }> {
    const url = buildWsiThumbnailUrl(
        tileServerBase,
        WSI_THUMBNAIL_WIDTH,
        WSI_THUMBNAIL_HEIGHT
    );
    const response = await getWsiViewerRuntime().fetchImpl(url, {
        cache: cacheMode,
        headers: buildWsiRequestHeaders(access.accessToken),
        signal,
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

/** Stops one caller waiting; the last one to leave cancels the request. */
function leavePendingThumbnail(key: string, pending: PendingThumbnail): void {
    pending.waiters -= 1;
    if (pending.waiters > 0 || pending.settled) {
        return;
    }
    // Forget the entry first so a caller arriving now starts a fresh request
    // instead of joining the cancelled one. A cleared cache may already hold
    // a newer request for the key, which is left alone.
    if (pendingThumbnails.get(key) === pending) {
        pendingThumbnails.delete(key);
        thumbnailCache.clear(cachedKey => cachedKey === key);
    }
    pending.controller.abort();
}

/**
 * The slide's published thumbnail, shared by every caller. The access token
 * is left out of the cache key so a refreshed token keeps the thumbnail; an
 * aborted caller stops waiting, and the request is cancelled only once no
 * caller is left waiting on it.
 */
export function fetchWsiThumbnailBlob(
    tileServerBase: string,
    studyId: string,
    slideKey: string,
    access: WsiSlideAccess,
    signal?: AbortSignal,
    cacheMode: RequestCache = 'default',
    authScope?: string
): Promise<Blob> {
    if (signal?.aborted) {
        return Promise.reject(abortError());
    }
    const key = [
        normalizeWsiAuthScope(authScope),
        tileServerBase,
        studyId,
        slideKey,
    ].join('::');
    const thumbnail = thumbnailCache.get(key, () => {
        const controller = new AbortController();
        const promise = (async () => {
            const startedAt = Date.now();
            const result = await requestThumbnail(
                tileServerBase,
                access,
                cacheMode,
                controller.signal
            );
            return {
                blob: result.blob,
                expiresAt: Math.min(
                    startedAt + THUMBNAIL_CACHE_TTL_MS,
                    access.expiresAt,
                    Date.now() + (result.maxAgeMs ?? THUMBNAIL_CACHE_TTL_MS)
                ),
            };
        })();
        const pending: PendingThumbnail = {
            promise,
            controller,
            waiters: 0,
            settled: false,
        };
        pendingThumbnails.set(key, pending);
        const settle = () => {
            pending.settled = true;
            if (pendingThumbnails.get(key) === pending) {
                pendingThumbnails.delete(key);
            }
        };
        promise.then(settle, settle);
        return promise;
    });
    const blob = thumbnail.then(({ blob }) => blob);
    const pending = pendingThumbnails.get(key);
    if (!pending || pending.promise !== thumbnail) {
        // Already settled: nothing left to cancel.
        return withAbort(blob, signal);
    }

    pending.waiters += 1;
    if (!signal) {
        // A caller without a signal waits until the request settles.
        return blob;
    }
    return new Promise<Blob>((resolve, reject) => {
        const onAbort = () => {
            leavePendingThumbnail(key, pending);
            reject(abortError());
        };
        signal.addEventListener('abort', onAbort, { once: true });
        blob.then(resolve, reject).finally(() => {
            signal.removeEventListener('abort', onAbort);
        });
    });
}

export function clearWsiThumbnailFetchCache(): void {
    // A pending request keeps running until its last caller stops waiting.
    pendingThumbnails.clear();
    thumbnailCache.clear();
}
