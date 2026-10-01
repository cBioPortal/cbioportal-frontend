import { ResourceData } from 'cbioportal-ts-api-client';
import { getServerConfig } from 'config/config';

// H&E slide resources that the native viewer replaces. Every H&E resource on
// the public and MSK portals uses one of these IDs.
const LEGACY_HE_RESOURCE_IDS = new Set(['HE', 'MSK_HNE']);
// Whole-slide images are stored as these resources, one row per slide (1.7M
// for MSK-IMPACT). Files & Links and the resource tabs leave them out; slides
// are reached through the Pathology Slides views.
const WSI_RESOURCE_IDS = new Set(['WSI_SAMPLE', 'WSI_PATIENT']);

function isNonEmptyString(value: string | null | undefined): boolean {
    return (value?.trim().length ?? 0) > 0;
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
    return shouldHideLegacyHeResourceTab(
        resource?.resourceId || resource?.resourceDefinition?.resourceId
    );
}
