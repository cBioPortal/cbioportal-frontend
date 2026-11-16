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
 * `/wsi/patient/{patient}?studyId=..&slideKey=..`. Whole-slide image
 * resource rows link here, and the backend serves this path to the app.
 */
/**
 * The patient id from the path, percent-decoded. The router decodes only part
 * of the path (`decodeURI` leaves reserved escapes such as `%3A`, `%2B` and
 * `%2F` encoded), so an id like `P:1`, linked as `P%3A1`, would otherwise
 * reach the viewer still encoded. A malformed escape is kept as it is.
 */
export function decodePatientIdParam(patientId: string): string {
    try {
        return decodeURIComponent(patientId);
    } catch {
        return patientId;
    }
}

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
            patientId={decodePatientIdParam(match.params.patientId)}
            studyId={studyId}
            tileServerUrl={tileServerUrl}
            height={height}
            requestedSlideKey={requestedSlideKey}
        />
    );
}
