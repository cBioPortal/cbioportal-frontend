import { ResourceDefinition } from 'cbioportal-ts-api-client';

/**
 * Configuration options for customizing resource display and behavior.
 */
export interface ResourceCustomConfig {
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

export const RESOURCE_CUSTOM_CONFIGS: Record<string, ResourceCustomConfig> = {
    MSK_HNE: {
        columnNameMapping: { 'Type Of Resource': 'View' },
        hideUrlColumn: true,
        openInNewTab: true,
        iframeErrorMessage:
            'This resource requires VPN access. Please connect to VPN and refresh the page.',
    },
};

export function getResourceConfig(
    def: ResourceDefinition
): ResourceCustomConfig {
    let config: ResourceCustomConfig = {};

    // 1. Load from local dictionary
    if (def.resourceId && RESOURCE_CUSTOM_CONFIGS[def.resourceId]) {
        config = { ...RESOURCE_CUSTOM_CONFIGS[def.resourceId] };
    }

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
