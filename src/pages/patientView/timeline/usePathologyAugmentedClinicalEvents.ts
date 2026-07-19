import { useMemo } from 'react';
import {
    ClinicalDataBySampleId,
    ClinicalEvent,
} from 'cbioportal-ts-api-client';
import { buildClinicalEventsSignature } from './clinicalEventSignatureUtils';

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
    void patientId;
    void samples;
    void studyId;

    const resolvedClinicalEventsSignature =
        clinicalEventsSignature ||
        buildClinicalEventsSignature(clinicalEvents, { ignoreOrder: true });

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
