import { ResourceCount, ResourceDefinition } from 'cbioportal-ts-api-client';

/**
 * Checks if any resource definition has a non-empty description.
 * @param definitions Array of resource definitions to check
 * @returns true if at least one definition has a non-empty description
 */
export function hasNonEmptyDescriptionInDefinitions(
    definitions: ResourceDefinition[] | undefined
): boolean {
    return (
        definitions?.some(def => (def.description?.trim().length ?? 0) > 0) ??
        false
    );
}

/**
 * Checks if any resource has a non-empty description in its resource definition.
 * @param resources Array of resource data to check
 * @returns true if at least one resource has a non-empty description
 */
export function hasNonEmptyDescriptionInResources(
    resources: { resourceDefinition?: ResourceDefinition }[]
): boolean {
    return resources.some(
        r => (r.resourceDefinition?.description?.trim().length ?? 0) > 0
    );
}

export function getStudyResourceCount(
    resource?: Partial<ResourceCount>
): number {
    if (!resource) {
        return 0;
    }

    return resource.resourceType === 'PATIENT'
        ? resource.patientCount ?? 0
        : resource.sampleCount ?? 0;
}
