import { useEffect, useMemo, useState } from 'react';
import {
    ClinicalDataBySampleId,
    ClinicalEvent,
} from 'cbioportal-ts-api-client';
import { buildClinicalEventsSignature } from './clinicalEventSignatureUtils';
import {
    buildPatientHierarchyApiUrl,
    getUndatedPathologySlideCount,
} from './pathologyTimelineUtils';
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
    const [hierarchy, setHierarchy] = useState<{
        patientId: string;
        studyId: string;
        data: PatientHierarchy;
    } | null>(null);

    useEffect(() => {
        setHierarchy(null);
        if (!includeUndatedPathology || !patientId || !studyId) {
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
    }, [includeUndatedPathology, patientId, studyId]);

    const materializedClinicalEvents = clinicalEvents;
    const resolvedClinicalEventsSignature =
        clinicalEventsSignature ||
        buildClinicalEventsSignature(materializedClinicalEvents, {
            ignoreOrder: true,
        });
    const undatedPathologySlideCount =
        includeUndatedPathology &&
        hierarchy?.patientId === patientId &&
        hierarchy?.studyId === studyId &&
        hierarchy
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
