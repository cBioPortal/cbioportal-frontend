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

    /**
     * False when the display name is not something a row is one of, such as a technique
     * (CyCIF) whose rows are regions of one slide. The count then reads "1-12 of 12 · CyCIF"
     * rather than "1-12 of 12 CyCIFs".
     * Used in: resource table count summary
     */
    pluralizeDisplayName?: boolean;

    /** Name for one row in the resource table count, pluralized by count. */
    itemsLabel?: string;
}

/**
 * Per-resource overrides keyed by resource id. A resource can also supply them through its own
 * customMetaData, which wins; that column currently also carries the metadata contract, so a
 * resource setting an option there must declare `fields` as well. Options that only apply to a
 * resource the portal already knows about are easier to keep here until the contract has a place
 * for them.
 */
export const RESOURCE_CUSTOM_CONFIGS: Record<string, ResourceCustomConfig> = {
    MSK_HNE: {
        iframeErrorMessage:
            'This resource requires VPN access. Please connect to VPN and refresh the page.',
    },
    CYCIF: {
        pluralizeDisplayName: false,
    },
    IDC_SLIM: {
        itemsLabel: 'Slide',
    },
};

export function getResourceConfig(
    def: Pick<ResourceDefinition, 'resourceId'> &
        Partial<Pick<ResourceDefinition, 'customMetaData'>>
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
