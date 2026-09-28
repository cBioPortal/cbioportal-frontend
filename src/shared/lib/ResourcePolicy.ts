import { ResourceData } from 'cbioportal-ts-api-client';
import { getServerConfig } from 'config/config';

const LEGACY_HE_RESOURCE_IDS = new Set(['HE', 'MSK_HNE']);
// Whole-slide images are stored as these resources. A large study has one row
// per slide (1.7M for MSK-IMPACT), so study-wide resource listings skip them;
// slides are reached through the Pathology Slides views and patient resources.
const WSI_RESOURCE_IDS = new Set(['WSI_SAMPLE', 'WSI_PATIENT']);
const LEGACY_HE_DISPLAY_NAME_PATTERNS = [
    /^h&e slide(s)?$/i,
    /^samples with h&e slides$/i,
];

function isNonEmptyString(value: string | null | undefined): boolean {
    return (value?.trim().length ?? 0) > 0;
}

function matchesLegacyHeDisplayName(displayName: string): boolean {
    return LEGACY_HE_DISPLAY_NAME_PATTERNS.some(pattern =>
        pattern.test(displayName)
    );
}

export function isWsiResourceId(resourceId: string | undefined): boolean {
    return !!resourceId && WSI_RESOURCE_IDS.has(resourceId);
}

export function isWsiTileServerConfigured(): boolean {
    return isNonEmptyString(getServerConfig().msk_wsi_tile_server_url);
}

export function shouldHideLegacyHeResourceTab(
    resourceId: string | undefined
): boolean {
    return !!resourceId && isWsiTileServerConfigured()
        ? LEGACY_HE_RESOURCE_IDS.has(resourceId)
        : false;
}

export function shouldHideLegacyHeResource(
    resource?: Partial<ResourceData>
): boolean {
    if (!isWsiTileServerConfigured()) {
        return false;
    }

    const resourceId =
        resource?.resourceId || resource?.resourceDefinition?.resourceId;
    const displayName = resource?.resourceDefinition?.displayName?.trim() || '';

    return (
        shouldHideLegacyHeResourceTab(resourceId) ||
        matchesLegacyHeDisplayName(displayName)
    );
}
