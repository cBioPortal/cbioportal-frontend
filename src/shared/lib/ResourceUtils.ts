import { ResourceDefinition } from 'cbioportal-ts-api-client';

export interface ResourceCustomConfig {
    customizedDisplayName?: string;
    columnHeader?: string;
    hideResourcesPerPatientColumn?: boolean;
}

export const RESOURCE_CUSTOM_CONFIGS: Record<string, ResourceCustomConfig> = {
    HE: {
        customizedDisplayName: 'H&E Samples with Slides',
        columnHeader: 'H&E Slides per Sample',
        hideResourcesPerPatientColumn: true,
    },
};

// Extend ResourceDefinition to include customMetaData if it's missing in the types
interface ExtendedResourceDefinition extends ResourceDefinition {
    customMetaData?: string;
}

export function getResourceConfig(
    def: ResourceDefinition
): ResourceCustomConfig {
    let config: ResourceCustomConfig = {};
    const extendedDef = def as ExtendedResourceDefinition;

    // 1. Load from local dictionary
    if (def.resourceId && RESOURCE_CUSTOM_CONFIGS[def.resourceId]) {
        config = { ...RESOURCE_CUSTOM_CONFIGS[def.resourceId] };
    }

    // 2. Override with customMetaData
    if (extendedDef.customMetaData) {
        try {
            const customConfig = JSON.parse(extendedDef.customMetaData);
            if (customConfig.customizedDisplayName) {
                config.customizedDisplayName =
                    customConfig.customizedDisplayName;
            } else if (customConfig.tabLabel) {
                // Fallback for backward compatibility
                config.customizedDisplayName = customConfig.tabLabel;
            }
            if (customConfig.columnHeader) {
                config.columnHeader = customConfig.columnHeader;
            }
            if (customConfig.hideResourcesPerPatientColumn !== undefined) {
                config.hideResourcesPerPatientColumn =
                    customConfig.hideResourcesPerPatientColumn;
            }
        } catch (e) {
            console.warn(
                `Failed to parse customMetaData for resource ${def.resourceId}`,
                e
            );
        }
    }

    return config;
}
