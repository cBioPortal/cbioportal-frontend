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
import {
    clearPatientHierarchyCacheEntry,
    fetchPatientHierarchyReadOnly,
} from 'shared/components/wsiViewer/wsiHierarchyFetchCache';
import { PatientHierarchy } from 'shared/components/wsiViewer/wsiViewerTypes';

interface IPathologyAugmentedClinicalEventsParams {
    clinicalEvents: ClinicalEvent[];
    clinicalEventsSignature?: string;
    patientId?: string;
    samples: ClinicalDataBySampleId[];
    studyId?: string;
    includeUndatedPathology?: boolean;
}

export type PathologyHierarchyLoadState = 'idle' | 'loading' | 'ready' | 'error';

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
    const [hierarchyLoadState, setHierarchyLoadState] =
        useState<PathologyHierarchyLoadState>('idle');
    const [hierarchyError, setHierarchyError] = useState<Error | null>(null);

    useEffect(() => {
        setHierarchy(null);
        setHierarchyError(null);
        if (!includeUndatedPathology || !patientId || !studyId) {
            setHierarchyLoadState('idle');
            return;
        }

        setHierarchyLoadState('loading');
        let cancelled = false;
        const controller = new AbortController();
        const hierarchyUrl = buildPatientHierarchyApiUrl(patientId, studyId);
        clearPatientHierarchyCacheEntry(hierarchyUrl);
        void fetchPatientHierarchyReadOnly(hierarchyUrl, controller.signal)
            .then(nextHierarchy => {
                if (!cancelled) {
                    setHierarchy({ patientId, studyId, data: nextHierarchy });
                    setHierarchyLoadState('ready');
                }
            })
            .catch(error => {
                if (!cancelled && error?.name !== 'AbortError') {
                    setHierarchyLoadState('error');
                    setHierarchyError(
                        error instanceof Error
                            ? error
                            : new Error('Unable to load the WSI hierarchy')
                    );
                }
            });

        return () => {
            cancelled = true;
            controller.abort();
        };
    }, [
        includeUndatedPathology,
        patientId,
        studyId,
    ]);

    const hierarchyMatchesRoute =
        hierarchy?.patientId === patientId && hierarchy?.studyId === studyId;
    const resolvedClinicalEventsSignature =
        clinicalEventsSignature ||
        buildClinicalEventsSignature(clinicalEvents, {
            ignoreOrder: true,
        });
    const undatedPathologySlideCount =
        !includeUndatedPathology
            ? 0
            : hierarchyLoadState === 'ready' && hierarchyMatchesRoute && hierarchy
            ? getUndatedPathologySlideCount(hierarchy.data, samples)
            : undefined;
    return useMemo(
        () => ({
            // Dated pathology events come only from the published clinical
            // event contract. The hierarchy is used here solely for the
            // undated slide count and viewer navigation.
            events: clinicalEvents,
            eventsSignature: resolvedClinicalEventsSignature,
            undatedPathologySlideCount,
            hierarchyLoadState,
            hierarchyError,
        }),
        [
            clinicalEvents,
            resolvedClinicalEventsSignature,
            undatedPathologySlideCount,
            hierarchyLoadState,
            hierarchyError,
        ]
    );
}

export default function usePathologyAugmentedClinicalEvents(
    params: IPathologyAugmentedClinicalEventsParams
) {
    return usePathologyAugmentedClinicalEventsState(params).events;
}
