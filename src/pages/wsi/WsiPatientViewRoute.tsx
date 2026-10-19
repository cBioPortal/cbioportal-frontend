import * as React from 'react';
import { parse } from 'query-string';
import { getServerConfig } from 'config/config';
import { AppWsiViewer } from 'shared/components/wsiViewer/wsiAppConfig';
import { capWsiViewerHeight } from 'cbioportal-wsi-viewer';

interface Props {
    match: { params: { patientId: string } };
    location: { search?: string };
}

/**
 * The full-page slide viewer that slide permalinks open:
 * `/wsi/patient/{patient}?studyId=..&slideKey=..`. cbioportal-core writes
 * these links as the WSI_SAMPLE resource URLs, and the backend serves this
 * path to the app.
 */
export default function WsiPatientViewRoute({ match, location }: Props) {
    const query = parse(location.search || '');
    const studyId = typeof query.studyId === 'string' ? query.studyId : '';
    // The router basename supplies any deployment context path.
    const requestedSlideKey =
        typeof query.slideKey === 'string' && query.slideKey
            ? query.slideKey
            : undefined;
    const tileServerUrl = getServerConfig().wsi_tile_server_url;

    if (!studyId || !tileServerUrl) {
        return (
            <div role="alert" data-testid="wsi-route-unavailable">
                WSI viewer configuration is unavailable.
            </div>
        );
    }

    const height =
        typeof window === 'undefined'
            ? 720
            : capWsiViewerHeight(
                  Math.max(480, window.innerHeight - 120),
                  window.innerWidth
              );

    return (
        <AppWsiViewer
            patientId={match.params.patientId}
            studyId={studyId}
            tileServerUrl={tileServerUrl}
            height={height}
            requestedSlideKey={requestedSlideKey}
        />
    );
}
