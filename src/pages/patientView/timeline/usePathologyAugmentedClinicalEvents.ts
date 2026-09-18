import { useEffect, useMemo, useState } from 'react';
import {
    ClinicalDataBySampleId,
    ClinicalEvent,
} from 'cbioportal-ts-api-client';
import { buildClinicalEventsSignature } from './clinicalEventSignatureUtils';
import {
    buildPatientHierarchyApiUrl,
    buildPathologyTimelineEvents,
    getUndatedPathologySlideCount,
} from './pathologyTimelineUtils';
import { isWsiPathologyClinicalEvent } from './pathologyClinicalEventUtils';
import { fetchPatientHierarchyReadOnly } from 'shared/components/wsiViewer/wsiHierarchyFetchCache';
import { PatientHierarchy } from 'shared/components/wsiViewer/wsiViewerTypes';

interface IPathologyAugmentedClinicalEventsParams {
    clinicalEvents: ClinicalEvent[];
    clinicalEventsSignature?: string;
    patientId?: string;
    samples: ClinicalDataBySampleId[];
    studyId?: string;
    includeUndatedPathology?: boolean;
}

export function usePathologyAugmentedClinicalEventsState({
    clinicalEvents,
    clinicalEventsSignature,
    patientId,
    samples,
    studyId,
    includeUndatedPathology = false,
}: IPathologyAugmentedClinicalEventsParams) {
    const hasBackendPathologyEvents = useMemo(
        () => clinicalEvents.some(isWsiPathologyClinicalEvent),
        [clinicalEvents]
    );
    const [hierarchy, setHierarchy] = useState<{
        patientId: string;
        studyId: string;
        data: PatientHierarchy;
    } | null>(null);

    useEffect(() => {
        setHierarchy(null);
        if (
            (!includeUndatedPathology && hasBackendPathologyEvents) ||
            !patientId ||
            !studyId
        ) {
            setHierarchy(null);
            return;
        }

        let cancelled = false;
        const controller = new AbortController();
        const hierarchyUrl = buildPatientHierarchyApiUrl(patientId, studyId);
        void fetchPatientHierarchyReadOnly(hierarchyUrl, controller.signal)
            .then(nextHierarchy => {
                if (!cancelled) {
                    setHierarchy({ patientId, studyId, data: nextHierarchy });
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
    }, [
        hasBackendPathologyEvents,
        includeUndatedPathology,
        patientId,
        studyId,
    ]);

    const hierarchyMatchesRoute =
        hierarchy?.patientId === patientId && hierarchy?.studyId === studyId;
    const materializedClinicalEvents = useMemo(() => {
        if (
            hasBackendPathologyEvents ||
            !hierarchyMatchesRoute ||
            !hierarchy ||
            !patientId ||
            !studyId
        ) {
            return clinicalEvents;
        }
        const pathologyEvents = buildPathologyTimelineEvents(
            hierarchy.data,
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
        hierarchyMatchesRoute,
        patientId,
        samples,
        studyId,
    ]);
    const resolvedClinicalEventsSignature =
        clinicalEventsSignature ||
        buildClinicalEventsSignature(materializedClinicalEvents, {
            ignoreOrder: true,
        });
    const undatedPathologySlideCount =
        includeUndatedPathology && hierarchyMatchesRoute && hierarchy
            ? getUndatedPathologySlideCount(hierarchy.data, samples)
            : 0;
    return useMemo(
        () => ({
            events: materializedClinicalEvents,
            eventsSignature: resolvedClinicalEventsSignature,
            undatedPathologySlideCount,
        }),
        [
            materializedClinicalEvents,
            resolvedClinicalEventsSignature,
            undatedPathologySlideCount,
        ]
    );
}

export default function usePathologyAugmentedClinicalEvents(
    params: IPathologyAugmentedClinicalEventsParams
) {
    return usePathologyAugmentedClinicalEventsState(params).events;
}
