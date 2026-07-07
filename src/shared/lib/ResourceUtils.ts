import {
    ResourceCount,
    ResourceData,
    ResourceDefinition,
} from 'cbioportal-ts-api-client';
import { getServerConfig } from 'config/config';

/**
 * Helper function to check if a string is non-empty
 */
function isNonEmptyString(value: string | null | undefined): boolean {
    return (value?.trim().length ?? 0) > 0;
}

/**
 * Checks if any resource definition has a non-empty description.
 * @param definitions Array of resource definitions to check
 * @returns true if at least one definition has a non-empty description
 */
export function hasNonEmptyDescriptionInDefinitions(
    definitions: ResourceDefinition[] | undefined
): boolean {
    return definitions?.some(def => isNonEmptyString(def.description)) ?? false;
}

/**
 * Checks if any resource has a non-empty description in its resource definition.
 * @param resources Array of resource data to check
 * @returns true if at least one resource has a non-empty description
 */
export function hasNonEmptyDescriptionInResources(
    resources: { resourceDefinition?: ResourceDefinition }[]
): boolean {
    return resources.some(r =>
        isNonEmptyString(r.resourceDefinition?.description)
    );
}

export function isWsiTileServerConfigured(): boolean {
    return (
        getServerConfig().msk_wsi_tile_server_url !== null &&
        getServerConfig().msk_wsi_tile_server_url !== undefined
    );
}

export function shouldHideLegacyHeResourceTab(
    resourceId: string | undefined
): boolean {
    return (
        isWsiTileServerConfigured() &&
        !!resourceId &&
        ['HE', 'MSK_HNE'].includes(resourceId)
    );
}

export function shouldHideLegacyHeResource(
    resource?: Partial<ResourceData>
): boolean {
    if (!isWsiTileServerConfigured()) {
        return false;
    }

    const resourceId =
        resource?.resourceId || resource?.resourceDefinition?.resourceId || '';
    const displayName = resource?.resourceDefinition?.displayName?.trim() || '';

    return (
        shouldHideLegacyHeResourceTab(resourceId) ||
        /^h&e slide(s)?$/i.test(displayName) ||
        /^samples with h&e slides$/i.test(displayName)
    );
}

export function getStudyResourceCount(resource?: Partial<ResourceCount>): number {
    if (!resource) {
        return 0;
    }

    return resource.resourceType === 'PATIENT'
        ? resource.patientCount ?? 0
        : resource.sampleCount ?? 0;
}
