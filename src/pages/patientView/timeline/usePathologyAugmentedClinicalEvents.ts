import { useEffect, useMemo, useState } from 'react';
import {
    ClinicalDataBySampleId,
    ClinicalEvent,
} from 'cbioportal-ts-api-client';
import { getServerConfig } from 'config/config';
import {
    appendPathologyTimelineEvents,
    buildPathologyTimelineSampleSignature,
    getCachedAppendedPathologyTimelineEvents,
} from './pathologyTimelineUtils';

interface IPathologyAugmentedClinicalEventsParams {
    clinicalEvents: ClinicalEvent[];
    errorMessage: string;
    patientId?: string;
    samples: ClinicalDataBySampleId[];
    studyId?: string;
}

export default function usePathologyAugmentedClinicalEvents({
    clinicalEvents,
    errorMessage,
    patientId,
    samples,
    studyId,
}: IPathologyAugmentedClinicalEventsParams) {
    const tileServerBase = getServerConfig().msk_wsi_tile_server_url;
    const sampleSignature = buildPathologyTimelineSampleSignature(samples);
    const cachedEvents = useMemo(
        () =>
            getCachedAppendedPathologyTimelineEvents(
                clinicalEvents,
                tileServerBase,
                patientId,
                studyId,
                samples
            ),
        [clinicalEvents, patientId, sampleSignature, studyId, tileServerBase]
    );
    const [asyncEvents, setAsyncEvents] = useState<ClinicalEvent[]>(cachedEvents);

    useEffect(() => {
        let cancelled = false;

        async function loadAugmentedClinicalEvents() {
            setAsyncEvents(prev =>
                prev === cachedEvents ? prev : cachedEvents
            );

            if (cachedEvents !== clinicalEvents) {
                return;
            }

            if (!tileServerBase || !patientId || !studyId) {
                return;
            }

            let nextEvents = cachedEvents;

            try {
                nextEvents = await appendPathologyTimelineEvents(
                    clinicalEvents,
                    tileServerBase,
                    patientId,
                    studyId,
                    samples
                );
            } catch (error) {
                console.warn(errorMessage, error);
            }

            if (!cancelled) {
                setAsyncEvents(prev =>
                    prev === nextEvents ? prev : nextEvents
                );
            }
        }

        void loadAugmentedClinicalEvents();

        return () => {
            cancelled = true;
        };
    }, [
        clinicalEvents,
        errorMessage,
        patientId,
        sampleSignature,
        studyId,
        tileServerBase,
    ]);

    return cachedEvents !== clinicalEvents ? cachedEvents : asyncEvents;
}
