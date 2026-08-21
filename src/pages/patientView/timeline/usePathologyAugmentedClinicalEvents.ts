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
    buildPatientHierarchyApiUrl,
} from './pathologyTimelineUtils';
import { isWsiPathologyClinicalEvent } from './pathologyClinicalEventUtils';

type PathologyAugmentedClinicalEventsState = {
    events: ClinicalEvent[];
    eventsSignature: string;
};

interface IPathologyAugmentedClinicalEventsParams {
    clinicalEvents: ClinicalEvent[];
    clinicalEventsSignature?: string;
    patientId?: string;
    samples: ClinicalDataBySampleId[];
    studyId?: string;
}

export function usePathologyAugmentedClinicalEventsState({
    clinicalEvents,
    clinicalEventsSignature,
    patientId,
    samples,
    studyId,
}: IPathologyAugmentedClinicalEventsParams) {
    const nonWsiClinicalEvents = useMemo(() => {
        const nonWsiEvents = clinicalEvents.filter(
            event => !isWsiPathologyClinicalEvent(event)
        );
        return nonWsiEvents;
    }, [clinicalEvents]);
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

        const hierarchyUrl = buildPatientHierarchyApiUrl(patientId, studyId);
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
                const events = [
                    ...nonWsiClinicalEvents,
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
    }, [
        baseState,
        clinicalEvents,
        nonWsiClinicalEvents,
        patientId,
        samples,
        studyId,
        tileServerUrl,
    ]);

    return state;
}

export default function usePathologyAugmentedClinicalEvents(
    params: IPathologyAugmentedClinicalEventsParams
) {
    return usePathologyAugmentedClinicalEventsState(params).events;
}
