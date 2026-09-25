import * as React from 'react';
import { parse } from 'query-string';
import { getServerConfig } from 'config/config';
import WsiPatientViewEntryPoint from './WsiPatientViewEntryPoint';

interface Props {
    match: { params: { patientId: string } };
    location: { search?: string };
}

/** Minimal standalone route used by the foundation smoke flow. */
export default function WsiPatientViewRoute({ match, location }: Props) {
    const query = parse(location.search || '');
    const studyId = typeof query.studyId === 'string' ? query.studyId : '';
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
        <WsiPatientViewEntryPoint
            patientId={match.params.patientId}
            studyId={studyId}
            tileServerUrl={tileServerUrl}
            authScope={getServerConfig().user_display_name || 'anonymousUser'}
            height={height}
        />
    );
}
