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
    blob: Blob;
};

type PendingThumbnail = {
    expiresAt: number;
    promise: Promise<Blob>;
    controller: AbortController;
    consumerCount: number;
    settled: boolean;
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
const pendingThumbnailRequests = new Map<string, PendingThumbnail>();

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

function abortError(): DOMException {
    return new DOMException('Aborted', 'AbortError');
}

function releaseThumbnailConsumer(key: string, entry: PendingThumbnail): void {
    entry.consumerCount = Math.max(0, entry.consumerCount - 1);
    if (entry.consumerCount !== 0 || entry.settled) return;

    if (pendingThumbnailRequests.get(key) === entry) {
        pendingThumbnailRequests.delete(key);
    }
    entry.controller.abort();
}

function subscribeToThumbnail(
    key: string,
    entry: PendingThumbnail,
    signal?: AbortSignal
): Promise<Blob> {
    if (signal?.aborted) {
        return Promise.reject(abortError());
    }

    entry.consumerCount += 1;
    let released = false;
    const release = () => {
        if (released) return;
        released = true;
        releaseThumbnailConsumer(key, entry);
    };

    return new Promise<Blob>((resolve, reject) => {
        const onAbort = () => {
            cleanup();
            release();
            reject(abortError());
        };
        const cleanup = () => signal?.removeEventListener('abort', onAbort);
        signal?.addEventListener('abort', onAbort, { once: true });
        entry.promise.then(
            value => {
                cleanup();
                release();
                resolve(value);
            },
            error => {
                cleanup();
                release();
                reject(error);
            }
        );
    });
}

function evictExpiredAndOldest(now: number): void {
    for (const [key, entry] of thumbnailCache) {
        if (entry.expiresAt <= now) thumbnailCache.delete(key);
    }
    for (const [key, entry] of pendingThumbnailRequests) {
        if (entry.expiresAt <= now && entry.consumerCount === 0) {
            pendingThumbnailRequests.delete(key);
            entry.controller.abort();
        }
    }
    while (thumbnailCache.size > THUMBNAIL_CACHE_CAPACITY) {
        const key = thumbnailCache.keys().next().value;
        if (key === undefined) return;
        thumbnailCache.delete(key);
    }
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
        WSI_THUMBNAIL_HEIGHT,
        access.thumbnail.sourceUrl
    );
    const response = await fetch(url, {
        cache: cacheMode,
        signal,
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
): PendingThumbnail {
    const key = cacheKey(tileServerBase, studyId, imageId, access);
    const now = Date.now();
    evictExpiredAndOldest(now);
    const pending = pendingThumbnailRequests.get(key);
    if (pending && pending.expiresAt > now) return pending;
    if (pending) {
        pendingThumbnailRequests.delete(key);
        if (pending.consumerCount === 0) pending.controller.abort();
    }

    const accessExpiresAt =
        access.expiresAt ?? now + Math.max(1, access.expiresIn) * 1000;
    const initialExpiry = Math.min(
        now + THUMBNAIL_CACHE_TTL_MS,
        accessExpiresAt
    );
    const controller = new AbortController();
    let entry: PendingThumbnail;
    const promise = requestThumbnail(
        tileServerBase,
        access,
        cacheMode,
        controller.signal
    )
        .then(result => {
            if (controller.signal.aborted) throw abortError();
            entry.settled = true;
            const current = pendingThumbnailRequests.get(key);
            if (current?.promise === promise) {
                pendingThumbnailRequests.delete(key);
                thumbnailCache.delete(key);
                thumbnailCache.set(key, {
                    blob: result.blob,
                    expiresAt: Math.min(
                        initialExpiry,
                        Date.now() + (result.maxAgeMs ?? THUMBNAIL_CACHE_TTL_MS)
                    ),
                });
                evictExpiredAndOldest(Date.now());
            }
            return result.blob;
        })
        .catch(error => {
            entry.settled = true;
            const current = pendingThumbnailRequests.get(key);
            if (current?.promise === promise)
                pendingThumbnailRequests.delete(key);
            throw error;
        });

    entry = {
        expiresAt: initialExpiry,
        promise,
        controller,
        consumerCount: 0,
        settled: false,
    };
    pendingThumbnailRequests.set(key, entry);
    return entry;
}

export function fetchWsiThumbnailBlob(
    tileServerBase: string,
    studyId: string,
    imageId: string,
    access: WsiSlideAccess,
    signal?: AbortSignal,
    cacheMode: RequestCache = 'default'
): Promise<Blob> {
    if (signal?.aborted) return Promise.reject(abortError());
    const key = cacheKey(tileServerBase, studyId, imageId, access);
    const now = Date.now();
    evictExpiredAndOldest(now);
    const cached = thumbnailCache.get(key);
    if (cached && cached.expiresAt > now) {
        thumbnailCache.delete(key);
        thumbnailCache.set(key, cached);
        return Promise.resolve(cached.blob);
    }
    if (cached) thumbnailCache.delete(key);
    const entry = getOrCreateThumbnailRequest(
        tileServerBase,
        studyId,
        imageId,
        access,
        cacheMode
    );
    const subscriber = subscribeToThumbnail(key, entry, signal);
    evictExpiredAndOldest(Date.now());
    return subscriber;
}

export function clearWsiThumbnailFetchCache(): void {
    for (const entry of pendingThumbnailRequests.values())
        entry.controller.abort();
    pendingThumbnailRequests.clear();
    thumbnailCache.clear();
}
