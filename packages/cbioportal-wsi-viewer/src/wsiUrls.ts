export const WSI_THUMBNAIL_WIDTH = 128;
export const WSI_THUMBNAIL_HEIGHT = 96;

/**
 * Hierarchy endpoint for one patient. A same-origin URL is returned without
 * its origin.
 */
export function buildWsiHierarchyApiUrl(
    buildApiUrl: (path: string) => string,
    studyId: string,
    patientId: string
): string {
    const apiUrl = buildApiUrl(
        `api/wsi/v2/hierarchy/${encodeURIComponent(
            studyId
        )}/${encodeURIComponent(patientId)}`
    );
    if (typeof window !== 'undefined') {
        const parsed = new URL(apiUrl, window.location.origin);
        if (parsed.origin === window.location.origin) {
            return `${parsed.pathname}${parsed.search}${parsed.hash}`;
        }
    }
    return apiUrl;
}

/** Build a slide thumbnail URL from the tile-server base URL. */
export function buildWsiThumbnailUrl(
    tileServerBase: string,
    width = WSI_THUMBNAIL_WIDTH,
    height = WSI_THUMBNAIL_HEIGHT
): string {
    const baseUrl =
        typeof window === 'undefined'
            ? 'http://localhost'
            : window.location.href;
    const parsed = new URL(tileServerBase, baseUrl);
    const path = `${parsed.pathname.replace(/\/$/, '')}/thumbnails`;
    const url = new URL(path, parsed.origin);
    url.searchParams.set('width', String(Math.max(1, Math.round(width))));
    url.searchParams.set('height', String(Math.max(1, Math.round(height))));
    // The slide is identified only by the bearer token; no slide identifier or
    // source location is ever placed in the URL or in request headers.
    return url.toString();
}

export function buildWsiRequestHeaders(
    accessToken?: string
): Record<string, string> {
    const headers: Record<string, string> = {};
    if (accessToken) headers.Authorization = `Bearer ${accessToken}`;
    return headers;
}
