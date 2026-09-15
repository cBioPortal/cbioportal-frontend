import { useMemo } from 'react';
import {
    ClinicalDataBySampleId,
    ClinicalEvent,
} from 'cbioportal-ts-api-client';
import { buildClinicalEventsSignature } from './clinicalEventSignatureUtils';

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
}: IPathologyAugmentedClinicalEventsParams) {
    const resolvedClinicalEventsSignature =
        clinicalEventsSignature ||
        buildClinicalEventsSignature(clinicalEvents, { ignoreOrder: true });
    // WSI pathology events are materialized by the backend alongside the
    // other clinical events. Keeping them here is important: deriving them
    // again from the hierarchy can drop valid unmatched/timepoint events.
    return useMemo(
        () => ({
            events: clinicalEvents,
            eventsSignature: resolvedClinicalEventsSignature,
        }),
        [clinicalEvents, resolvedClinicalEventsSignature]
    );
}

export default function usePathologyAugmentedClinicalEvents(
    params: IPathologyAugmentedClinicalEventsParams
) {
    return usePathologyAugmentedClinicalEventsState(params).events;
}
