import { WsiSlideAccess } from './wsiViewerTypes';
import {
    buildWsiRequestHeaders,
    buildWsiThumbnailUrl,
    WSI_THUMBNAIL_HEIGHT,
    WSI_THUMBNAIL_WIDTH,
} from './wsiUrls';
import { normalizeWsiAuthScope } from './wsiAuth';
import { getWsiViewerRuntime } from './wsiViewerConfig';
import { createPromiseCache, withAbort } from './wsiCacheUtils';

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

export function parseMaxAgeMs(cacheControl: string | null): number | undefined {
    const match = cacheControl?.match(/(?:^|,)\s*max-age\s*=\s*(\d+)/i);
    if (!match) return undefined;
    const seconds = Number(match[1]);
    return Number.isFinite(seconds) ? seconds * 1000 : undefined;
}

async function requestThumbnail(
    tileServerBase: string,
    access: WsiSlideAccess,
    cacheMode: RequestCache
): Promise<{ blob: Blob; maxAgeMs?: number }> {
    const url = buildWsiThumbnailUrl(
        tileServerBase,
        WSI_THUMBNAIL_WIDTH,
        WSI_THUMBNAIL_HEIGHT
    );
    const response = await getWsiViewerRuntime().fetchImpl(url, {
        cache: cacheMode,
        headers: buildWsiRequestHeaders(access.accessToken),
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

/**
 * The slide's published thumbnail, shared by every caller. The access token
 * is left out of the cache key so a refreshed token keeps the thumbnail; an
 * aborted caller stops waiting without cancelling the request for others.
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
    const key = [
        normalizeWsiAuthScope(authScope),
        tileServerBase,
        studyId,
        slideKey,
    ].join('::');
    const thumbnail = thumbnailCache.get(key, async () => {
        const startedAt = Date.now();
        const result = await requestThumbnail(
            tileServerBase,
            access,
            cacheMode
        );
        return {
            blob: result.blob,
            expiresAt: Math.min(
                startedAt + THUMBNAIL_CACHE_TTL_MS,
                access.expiresAt,
                Date.now() + (result.maxAgeMs ?? THUMBNAIL_CACHE_TTL_MS)
            ),
        };
    });
    return withAbort(
        thumbnail.then(({ blob }) => blob),
        signal
    );
}

export function clearWsiThumbnailFetchCache(): void {
    thumbnailCache.clear();
}
