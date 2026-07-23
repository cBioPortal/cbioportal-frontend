import { useEffect, useMemo, useState } from 'react';
import {
    ClinicalDataBySampleId,
    ClinicalEvent,
} from 'cbioportal-ts-api-client';
import { getServerConfig } from 'config/config';
import { buildClinicalEventsSignature } from './clinicalEventSignatureUtils';
import { fetchPatientHierarchyReadOnly } from 'shared/components/wsiViewer/wsiHierarchyFetchCache';
import {
    buildPathologyTimelineEvents,
    buildPatientHierarchyUrl,
} from './pathologyTimelineUtils';
import { isWsiPathologyClinicalEvent } from './pathologyClinicalEventUtils';

type PathologyAugmentedClinicalEventsState = {
    events: ClinicalEvent[];
    eventsSignature: string;
};

interface IPathologyAugmentedClinicalEventsParams {
    clinicalEvents: ClinicalEvent[];
    clinicalEventsSignature?: string;
    errorMessage: string;
    patientId?: string;
    samples: ClinicalDataBySampleId[];
    studyId?: string;
}

export function usePathologyAugmentedClinicalEventsState({
    clinicalEvents,
    clinicalEventsSignature,
    errorMessage,
    patientId,
    samples,
    studyId,
}: IPathologyAugmentedClinicalEventsParams) {
    void errorMessage;
    const resolvedClinicalEventsSignature =
        clinicalEventsSignature ||
        buildClinicalEventsSignature(clinicalEvents, { ignoreOrder: true });

    const baseState = useMemo(
        () => ({
            events: clinicalEvents,
            eventsSignature: resolvedClinicalEventsSignature,
        }),
        [clinicalEvents, resolvedClinicalEventsSignature]
    );
    const [state, setState] = useState<PathologyAugmentedClinicalEventsState>(
        baseState
    );
    const tileServerUrl = getServerConfig().msk_wsi_tile_server_url;

    useEffect(() => {
        let cancelled = false;
        setState(baseState);

        if (!tileServerUrl || !patientId || !studyId) {
            return () => {
                cancelled = true;
            };
        }

        const hierarchyUrl = buildPatientHierarchyUrl(
            tileServerUrl,
            patientId,
            studyId
        );
        void fetchPatientHierarchyReadOnly(hierarchyUrl)
            .then(hierarchy => {
                if (cancelled) {
                    return;
                }

                const pathologyEvents = buildPathologyTimelineEvents(
                    hierarchy,
                    samples,
                    studyId,
                    patientId
                );
                if (!pathologyEvents.length) {
                    return;
                }

                const events = [
                    ...clinicalEvents.filter(
                        event => !isWsiPathologyClinicalEvent(event)
                    ),
                    ...pathologyEvents,
                ].sort(
                    (left, right) =>
                        (left.startNumberOfDaysSinceDiagnosis ?? 0) -
                        (right.startNumberOfDaysSinceDiagnosis ?? 0)
                );
                setState({
                    events,
                    eventsSignature: buildClinicalEventsSignature(events, {
                        ignoreOrder: true,
                    }),
                });
            })
            .catch(() => {
                // Keep base clinical events when pathology data is unavailable.
            });

        return () => {
            cancelled = true;
        };
    }, [baseState, clinicalEvents, patientId, samples, studyId, tileServerUrl]);

    return state;
}

export default function usePathologyAugmentedClinicalEvents(
    params: IPathologyAugmentedClinicalEventsParams
) {
    return usePathologyAugmentedClinicalEventsState(params).events;
}
