import * as React from 'react';
import { DownloadControlOption } from 'cbioportal-frontend-commons';
import { WsiViewerConfig, WsiViewerProps } from 'cbioportal-wsi-viewer';
import { getServerConfig } from 'config/config';
import { buildCBioPortalAPIUrl } from 'shared/api/urls';
import LoadingIndicator from 'shared/components/loadingIndicator/LoadingIndicator';
import { useWsiClinicalRows, WsiPatientClinicalData } from './wsiClinicalRows';

const WSI_OSD_PREFIX_URL = '/reactapp/osd-images/';

function renderWsiLoading() {
    return <LoadingIndicator isLoading={true} center={true} size="big" />;
}

/** Viewer services from the portal configuration, installed at startup. */
export function buildWsiViewerConfig(): WsiViewerConfig {
    return {
        buildApiUrl: (path: string) => buildCBioPortalAPIUrl(path),
        osdPrefixUrl: WSI_OSD_PREFIX_URL,
    };
}

/**
 * Subject that scopes the viewer caches: the signed-in user name, else the
 * configured display name, else the anonymous user.
 */
export function wsiAuthScope(userName?: string): string {
    return userName || getServerConfig().user_display_name || 'anonymousUser';
}

// The viewer is its own async chunk, and OpenSeadragon another one loaded on
// first slide open: most patient pages have no slides.
export const LazyWsiViewer = React.lazy(() => {
    // The project TypeScript module target predates dynamic import syntax;
    // rspack still emits this as an async chunk.
    // @ts-ignore
    return import('cbioportal-wsi-viewer/viewer');
});

export type AppWsiViewerProps = Omit<
    WsiViewerProps,
    'authScope' | 'showDownload' | 'renderLoading' | 'clinicalRows'
> & {
    /** Signed-in user name, when the page knows it. */
    userName?: string;
    /**
     * The patient's clinical data for the sidebar, when the page has loaded
     * it (`null` while loading); fetched by the viewer when unset.
     */
    clinicalData?: WsiPatientClinicalData | null;
};

/** The package viewer configured for this portal, loaded lazily. */
export function AppWsiViewer({
    userName,
    clinicalData,
    ...viewerProps
}: AppWsiViewerProps) {
    const clinicalRows = useWsiClinicalRows(
        viewerProps.studyId,
        viewerProps.patientId,
        clinicalData
    );
    return (
        <React.Suspense
            fallback={
                <div role="status" data-testid="wsi-viewer-loading">
                    Loading pathology slides…
                </div>
            }
        >
            <LazyWsiViewer
                {...viewerProps}
                authScope={wsiAuthScope(userName)}
                showDownload={
                    getServerConfig().skin_hide_download_controls ===
                    DownloadControlOption.SHOW_ALL
                }
                renderLoading={renderWsiLoading}
                clinicalRows={clinicalRows}
            />
        </React.Suspense>
    );
}
