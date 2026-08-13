import { buildCBioPortalAPIUrl } from 'shared/api/urls';

const DEFAULT_THUMBNAIL_WIDTH = 128;
const DEFAULT_THUMBNAIL_HEIGHT = 96;

/** Build the backend-owned hierarchy URL from a resource tile URL. */
export function buildWsiHierarchyUrl(
    resourceUrl: string,
    studyId?: string
): string {
    if (!studyId) {
        throw new Error('WSI hierarchy requires a study ID');
    }

    const baseUrl =
        typeof window === 'undefined'
            ? 'http://localhost'
            : window.location.href;
    const parsed = new URL(resourceUrl, baseUrl);
    const match = parsed.pathname.match(/\/patient\/([^/]+)\/?$/);
    if (!match) {
        throw new Error('WSI resource URL does not contain a patient ID');
    }

    let patientId = match[1];
    try {
        patientId = decodeURIComponent(patientId);
    } catch {
        // Keep malformed escapes literal so the resulting API URL remains safe.
    }

    return buildCBioPortalAPIUrl(
        `api/wsi/v2/hierarchy/${encodeURIComponent(
            studyId
        )}/${encodeURIComponent(patientId)}`
    );
}

/** Build a slide thumbnail URL from the tile-server base URL. */
export function buildWsiThumbnailUrl(
    tileServerBase: string,
    _imageId: string,
    _studyId?: string,
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
    url.searchParams.set('source', sourceUrl);
    return url.toString();
}
