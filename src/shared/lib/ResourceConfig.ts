import { ResourceDefinition } from 'cbioportal-ts-api-client';
import { isWsiTileServerConfigured } from './ResourcePolicy';

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
     * Use a native viewer component instead of IFrameLoader.
     * 'wsi' renders WSIViewer (OpenSeadragon whole-slide image viewer)
     * and expects resource URL to be https://tile-server/patient/{patient_id}
     * Used in: Patient View (resource tab)
     */
    nativeViewer?: 'wsi';
}

export const RESOURCE_CUSTOM_CONFIGS: Record<string, ResourceCustomConfig> = {
    MSK_HNE: {
        customizedDisplayName: 'Samples with H&E Slides',
        hidePerPatientColumn: true,
        columnNameMapping: { 'Type Of Resource': 'View' },
        hideUrlColumn: true,
        openInNewTab: true,
        iframeErrorMessage:
            'This resource requires VPN access. Please connect to VPN and refresh the page.',
    },
    // Native OpenSeadragon WSI viewer — resource URL must be
    // https://<tile-server>/patient/{patient_id}
    HE: {
        customizedDisplayName: 'Pathology Slides',
        nativeViewer: 'wsi',
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

    // 3. nativeViewer: 'wsi' requires the tile server to be configured.
    //    If msk_wsi_tile_server_url is not set, fall back to iframe so that
    //    HE resources on other cBioPortal instances still render correctly.
    if (config.nativeViewer === 'wsi' && !isWsiTileServerConfigured()) {
        delete config.nativeViewer;
    }

    return config;
}
