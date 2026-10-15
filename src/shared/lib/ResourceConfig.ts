import { ResourceDefinition } from 'cbioportal-ts-api-client';

/**
 * Configuration options for customizing resource display and behavior.
 */
export interface ResourceCustomConfig {
    /**
     * Custom display name for the resource (e.g., "Samples with H&E Slides")
     * Used in: Study View (tab name and count header)
     */
    customizedDisplayName?: string;

    /**
     * Whether to hide the "Resources per Patient" column
     * Used in: Study View (Files & Links tab)
     */
    hidePerPatientColumn?: boolean;

    /**
     * Mapping to rename column headers (e.g., { 'Type Of Resource': 'View' })
     * Used in: Study View (Files & Links tab)
     */
    columnNameMapping?: Record<string, string>;

    /**
     * Whether to hide the "Resource URL" column
     * Used in: Study View (Files & Links tab)
     */
    hideUrlColumn?: boolean;

    /**
     * Whether resource links should open in a new tab
     * Used in: Study View (Files & Links tab)
     */
    openInNewTab?: boolean;

    /**
     * Custom error message to show when iframe fails to load
     * Used in: Patient View (resource iframe)
     */
    iframeErrorMessage?: string;
}

/**
 * Per-resource overrides keyed by resource id. Empty: the entry that lived here configured the
 * table that the server-driven resource table replaced, and a curator now sets a resource's
 * display name on resource_definition and its metadata columns through CUSTOM_METADATA.
 * A resource can still supply overrides through its own customMetaData.
 */
export const RESOURCE_CUSTOM_CONFIGS: Record<string, ResourceCustomConfig> = {};

export function getResourceConfig(
    def: ResourceDefinition
): ResourceCustomConfig {
    // 1. Load from local dictionary
    let config: ResourceCustomConfig =
        def.resourceId && RESOURCE_CUSTOM_CONFIGS[def.resourceId]
            ? { ...RESOURCE_CUSTOM_CONFIGS[def.resourceId] }
            : {};

    // 2. Override with customMetaData
    if (def.customMetaData) {
        try {
            const customConfig = JSON.parse(def.customMetaData) as Partial<
                ResourceCustomConfig
            >;
            Object.assign(config, customConfig);
        } catch (e) {
            console.warn(
                `Failed to parse customMetaData for resource ${def.resourceId}`,
                e
            );
        }
    }

    return config;
}
