import * as React from 'react';
import { parse } from 'query-string';
import { getServerConfig } from 'config/config';
import { AppWsiViewer } from 'shared/components/wsiViewer/wsiAppConfig';

interface Props {
    match: { params: { patientId: string } };
    location: { search?: string };
}

/** Minimal standalone route used by the foundation smoke flow. */
export default function WsiPatientViewRoute({ match, location }: Props) {
    const query = parse(location.search || '');
    const studyId = typeof query.studyId === 'string' ? query.studyId : '';
    // Viewer links name one slide by its opaque key:
    // /wsi/patient/{patient}?studyId=..&slideKey=..
    // The router basename supplies any deployment context path.
    const requestedSlideKey =
        typeof query.slideKey === 'string' && query.slideKey
            ? query.slideKey
            : undefined;
    const tileServerUrl = getServerConfig().msk_wsi_tile_server_url;

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
            : Math.max(480, window.innerHeight - 120);

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
