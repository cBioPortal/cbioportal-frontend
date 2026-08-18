const DEFAULT_THUMBNAIL_WIDTH = 128;
const DEFAULT_THUMBNAIL_HEIGHT = 96;

/** Build a slide thumbnail URL from the tile-server base URL. */
export function buildWsiThumbnailUrl(
    tileServerBase: string,
    width = DEFAULT_THUMBNAIL_WIDTH,
    height = DEFAULT_THUMBNAIL_HEIGHT,
    sourceUrl: string = ''
): string {
    if (!sourceUrl) {
        throw new Error('WSI thumbnail URLs require a source URL');
    }
    const baseUrl =
        typeof window === 'undefined'
            ? 'http://localhost'
            : window.location.href;
    const parsed = new URL(tileServerBase, baseUrl);
    const path = `${parsed.pathname.replace(/\/$/, '')}/thumbnails`;
    const url = new URL(path, parsed.origin);
    url.searchParams.set('width', String(Math.max(1, Math.round(width))));
    url.searchParams.set('height', String(Math.max(1, Math.round(height))));
    // The source is sent in X-WSI-Source so it does not enter browser history,
    // proxy access logs, or referrer URLs.
    return url.toString();
}

export function buildWsiRequestHeaders(
    sourceUrl?: string,
    accessToken?: string
): Record<string, string> {
    const headers: Record<string, string> = {};
    if (sourceUrl) headers['X-WSI-Source'] = sourceUrl;
    if (accessToken) headers.Authorization = `Bearer ${accessToken}`;
    return headers;
}
