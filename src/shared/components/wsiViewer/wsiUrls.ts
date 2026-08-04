import { buildCBioPortalAPIUrl } from 'shared/api/urls';

/** Build the backend-owned hierarchy URL from a resource tile URL. */
export function buildWsiHierarchyUrl(
    resourceUrl: string,
    studyId?: string
): string {
    if (!studyId) {
        throw new Error('WSI hierarchy requires a study ID');
    }

    const baseUrl =
        typeof window === 'undefined' ? 'http://localhost' : window.location.href;
    const parsed = new URL(resourceUrl, baseUrl);
    const match = parsed.pathname.match(/\/patient\/([^/]+)\/?$/);
    if (!match) {
        throw new Error('WSI resource URL does not contain a patient ID');
    }

    return buildCBioPortalAPIUrl(
        `api/wsi/v2/hierarchy/${encodeURIComponent(studyId)}/${encodeURIComponent(match[1])}`
    );
}
