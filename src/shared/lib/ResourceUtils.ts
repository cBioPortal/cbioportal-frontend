import { ResourceDefinition } from 'cbioportal-ts-api-client';
import _ from 'lodash';

/**
 * Helper function to check if a string is non-empty
 */
function isNonEmptyString(value: string | undefined): boolean {
    return !_.isEmpty(value);
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
