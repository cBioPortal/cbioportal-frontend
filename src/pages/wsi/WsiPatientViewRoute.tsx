import * as React from 'react';
import { parse } from 'query-string';
import { ClinicalEvent } from 'cbioportal-ts-api-client';
import { getServerConfig } from 'config/config';
import internalClient from 'shared/api/cbioportalInternalClientInstance';
import {
    AppWsiViewer,
    wsiAuthScope,
} from 'shared/components/wsiViewer/wsiAppConfig';
import {
    capWsiViewerHeight,
    fetchWsiPatientHierarchy,
    UNMATCHED_SAMPLE_ID,
} from 'cbioportal-wsi-viewer';

/**
 * Loads the patient's clinical events for sample acquisition/sequencing
 * days, once the patient's slides are known to include a sequenced sample:
 * the days are only shown for those. The slide hierarchy request is the
 * viewer's own, shared through its cache. The viewer renders without the
 * events, and a failed request leaves them unset, so it shows no sample days.
 */
function usePatientClinicalEvents(
    studyId: string,
    patientId: string
): ClinicalEvent[] | undefined {
    const [events, setEvents] = React.useState<ClinicalEvent[] | undefined>();
    React.useEffect(() => {
        setEvents(undefined);
        if (!studyId || !patientId) {
            return;
        }
        let cancelled = false;
        fetchWsiPatientHierarchy(studyId, patientId, wsiAuthScope())
            .then(hierarchy => {
                if (
                    cancelled ||
                    !hierarchy.samples.some(
                        sample => sample.sample_id !== UNMATCHED_SAMPLE_ID
                    )
                ) {
                    return undefined;
                }
                // The API has no event-type filter; the days are read from
                // the patient's specimen and sequencing events.
                return internalClient.getAllClinicalEventsOfPatientInStudyUsingGET(
                    { studyId, patientId, projection: 'DETAILED' }
                );
            })
            .then(
                result => {
                    if (!cancelled && result) {
                        setEvents(result);
                    }
                },
                error => {
                    console.debug(
                        'Pathology slides: no sample days, the clinical events are unavailable',
                        error
                    );
                }
            );
        return () => {
            cancelled = true;
        };
    }, [studyId, patientId]);
    return events;
}

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
    const clinicalEvents = usePatientClinicalEvents(
        tileServerUrl ? studyId : '',
        match.params.patientId
    );

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
            clinicalEvents={clinicalEvents}
        />
    );
}
