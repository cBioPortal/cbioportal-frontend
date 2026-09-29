import * as React from 'react';
import { DownloadControlOption } from 'cbioportal-frontend-commons';
import { WsiViewerConfig, WsiViewerProps } from 'cbioportal-wsi-viewer';
import { getServerConfig } from 'config/config';
import { buildCBioPortalAPIUrl } from 'shared/api/urls';
import LoadingIndicator from 'shared/components/loadingIndicator/LoadingIndicator';

const WSI_OSD_PREFIX_URL = '/reactapp/osd-images/';

function renderWsiLoading() {
    return <LoadingIndicator isLoading={true} center={true} size="big" />;
}

/** SAML portals, or portals that opt in, authenticate WSI users. */
export function isPortalWsiAuthEnabled(): boolean {
    const config = getServerConfig() as ReturnType<typeof getServerConfig> & {
        msk_wsi_authentication_enabled?: boolean;
    };
    // Portals without authentication report `authenticate=false` as a boolean.
    const authenticationMethod =
        typeof config.authenticationMethod === 'string'
            ? config.authenticationMethod.toLowerCase()
            : undefined;
    return (
        authenticationMethod === 'saml' ||
        authenticationMethod === 'saml_plus_basic' ||
        config.msk_wsi_authentication_enabled === true
    );
}

/**
 * Viewer services and settings from the portal configuration. The signed-in
 * user name scopes the viewer caches; without one, the configured display
 * name or the anonymous user does.
 */
export function buildWsiViewerConfig(userName?: string): WsiViewerConfig {
    const serverConfig = getServerConfig();
    return {
        buildApiUrl: (path: string) => buildCBioPortalAPIUrl(path),
        authEnabled: isPortalWsiAuthEnabled(),
        authScope:
            userName || serverConfig.user_display_name || 'anonymousUser',
        showDownload:
            serverConfig.skin_hide_download_controls ===
            DownloadControlOption.SHOW_ALL,
        osdPrefixUrl: WSI_OSD_PREFIX_URL,
        renderLoading: renderWsiLoading,
    };
}

// The viewer is its own async chunk, and OpenSeadragon another one loaded on
// first slide open: most patient pages have no slides.
export const LazyWsiViewer = React.lazy(() => {
    // The project TypeScript module target predates dynamic import syntax;
    // rspack still emits this as an async chunk.
    // @ts-ignore
    return import('cbioportal-wsi-viewer/viewer');
});

export type AppWsiViewerProps = Omit<WsiViewerProps, 'config'> & {
    /** Signed-in user name, when the page knows it. */
    userName?: string;
};

/** The package viewer configured for this portal, loaded lazily. */
export function AppWsiViewer({ userName, ...viewerProps }: AppWsiViewerProps) {
    const config = React.useMemo(() => buildWsiViewerConfig(userName), [
        userName,
    ]);
    return (
        <React.Suspense
            fallback={
                <div role="status" data-testid="wsi-viewer-loading">
                    Loading pathology slides…
                </div>
            }
        >
            <LazyWsiViewer config={config} {...viewerProps} />
        </React.Suspense>
    );
}
