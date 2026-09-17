import { useEffect, useMemo, useState } from 'react';
import {
    ClinicalDataBySampleId,
    ClinicalEvent,
} from 'cbioportal-ts-api-client';
import { buildClinicalEventsSignature } from './clinicalEventSignatureUtils';
import {
    buildPatientHierarchyApiUrl,
    buildPathologyTimelineEvents,
} from './pathologyTimelineUtils';
import { fetchPatientHierarchyReadOnly } from 'shared/components/wsiViewer/wsiHierarchyFetchCache';
import { PatientHierarchy } from 'shared/components/wsiViewer/wsiViewerTypes';

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
    const hasBackendPathologyEvents = useMemo(
        () => clinicalEvents.some(event => event.eventType === 'PATHOLOGY SLIDES'),
        [clinicalEvents]
    );
    const [hierarchy, setHierarchy] = useState<PatientHierarchy | null>(null);

    useEffect(() => {
        if (hasBackendPathologyEvents || !patientId || !studyId) {
            setHierarchy(null);
            return;
        }

        let cancelled = false;
        const controller = new AbortController();
        const hierarchyUrl = buildPatientHierarchyApiUrl(patientId, studyId);
        void fetchPatientHierarchyReadOnly(hierarchyUrl, controller.signal)
            .then(nextHierarchy => {
                if (!cancelled) {
                    setHierarchy(nextHierarchy);
                }
            })
            .catch(() => {
                // A hierarchy failure must not hide the ordinary clinical
                // timeline. The pathology tab reports the availability state
                // separately and can retry the same cached request.
            });

        return () => {
            cancelled = true;
            controller.abort();
        };
    }, [hasBackendPathologyEvents, patientId, studyId]);

    const materializedClinicalEvents = useMemo(() => {
        if (hasBackendPathologyEvents || !hierarchy || !patientId || !studyId) {
            return clinicalEvents;
        }
        const pathologyEvents = buildPathologyTimelineEvents(
            hierarchy,
            samples,
            studyId,
            patientId
        );
        return pathologyEvents.length
            ? [...clinicalEvents, ...pathologyEvents]
            : clinicalEvents;
    }, [
        clinicalEvents,
        hasBackendPathologyEvents,
        hierarchy,
        patientId,
        samples,
        studyId,
    ]);
    const resolvedClinicalEventsSignature =
        hierarchy && !hasBackendPathologyEvents
            ? buildClinicalEventsSignature(materializedClinicalEvents, {
                  ignoreOrder: true,
              })
            : clinicalEventsSignature ||
              buildClinicalEventsSignature(materializedClinicalEvents, {
                  ignoreOrder: true,
              });
    // WSI pathology events are materialized by the backend alongside the
    // other clinical events. Keeping them here is important: deriving them
    // again from the hierarchy can drop valid unmatched/timepoint events.
    return useMemo(
        () => ({
            events: materializedClinicalEvents,
            eventsSignature: resolvedClinicalEventsSignature,
        }),
        [materializedClinicalEvents, resolvedClinicalEventsSignature]
    );
}

export default function usePathologyAugmentedClinicalEvents(
    params: IPathologyAugmentedClinicalEventsParams
) {
    return usePathologyAugmentedClinicalEventsState(params).events;
}
