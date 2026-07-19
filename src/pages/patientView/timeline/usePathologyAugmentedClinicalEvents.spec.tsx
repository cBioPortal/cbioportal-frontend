import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import {
    ClinicalDataBySampleId,
    ClinicalEvent,
} from 'cbioportal-ts-api-client';
import usePathologyAugmentedClinicalEvents, {
    usePathologyAugmentedClinicalEventsState,
} from './usePathologyAugmentedClinicalEvents';

const samples = [
    ({
        id: 'S-1',
        uniquePatientKey: 'patient-key',
        uniqueSampleKey: 'sample-key',
        clinicalData: [],
    } as unknown) as ClinicalDataBySampleId,
];

const clinicalEvents = [
    {
        eventType: 'TREATMENT',
        patientId: 'P-1',
        startNumberOfDaysSinceDiagnosis: 1,
        studyId: 'study',
    },
] as ClinicalEvent[];

function HookProbe({
    hookSamples = samples,
    hookClinicalEvents = clinicalEvents,
    hookPatientId = 'P-1',
    hookStudyId = 'study',
    onEvents,
}: {
    hookSamples?: ClinicalDataBySampleId[];
    hookClinicalEvents?: ClinicalEvent[];
    hookPatientId?: string;
    hookStudyId?: string;
    onEvents?: (events: ClinicalEvent[]) => void;
}) {
    const events = usePathologyAugmentedClinicalEvents({
        clinicalEvents: hookClinicalEvents,
        errorMessage: 'failed',
        patientId: hookPatientId,
        samples: hookSamples,
        studyId: hookStudyId,
    });
    onEvents?.(events);

    return <div>{events.length}</div>;
}

describe('usePathologyAugmentedClinicalEvents', () => {
    it('returns backend clinical events unchanged when no backend pathology events are present', async () => {
        let renderedEvents: ClinicalEvent[] = [];
        let renderer: TestRenderer.ReactTestRenderer;

        await act(async () => {
            renderer = TestRenderer.create(
                <HookProbe onEvents={events => (renderedEvents = events)} />
            );
        });

        expect(renderedEvents).toBe(clinicalEvents);
        expect(renderer!.root.findByType('div').children).toEqual(['1']);
    });

    it('keeps backend pathology events without client-side augmentation', async () => {
        const backendPathologyEvents = [
            clinicalEvents[0],
            {
                eventType: 'PATHOLOGY SLIDES',
                patientId: 'P-1',
                startNumberOfDaysSinceDiagnosis: -5,
                endNumberOfDaysSinceDiagnosis: -5,
                studyId: 'study',
                uniquePatientKey: 'study_P-1',
                uniqueSampleKey: 'study_P-1_pathology',
                attributes: [
                    { key: 'SAMPLE_ID', value: 'S-1' },
                    { key: 'SUBTYPE', value: 'H&E' },
                    { key: 'MATCH_LEVEL', value: 'BLOCK' },
                    { key: 'SPECIMEN', value: 'Part 1 / Block A1' },
                    { key: 'IMAGE_COUNT', value: '1' },
                    { key: 'NON_SERVABLE_IMAGE_COUNT', value: '0' },
                    { key: 'TOTAL_IMAGE_COUNT', value: '1' },
                ],
            },
        ] as ClinicalEvent[];

        let renderedEvents: ClinicalEvent[] = [];
        let renderer: TestRenderer.ReactTestRenderer;

        await act(async () => {
            renderer = TestRenderer.create(
                <HookProbe
                    hookClinicalEvents={backendPathologyEvents}
                    onEvents={events => (renderedEvents = events)}
                />
            );
        });

        expect(renderedEvents).toBe(backendPathologyEvents);
        expect(renderer!.root.findByType('div').children).toEqual(['2']);
    });
});

describe('usePathologyAugmentedClinicalEventsState', () => {
    it('returns the provided signature when one is supplied', () => {
        let state:
            | ReturnType<typeof usePathologyAugmentedClinicalEventsState>
            | undefined;

        function Probe() {
            state = usePathologyAugmentedClinicalEventsState({
                clinicalEvents,
                clinicalEventsSignature: 'provided-signature',
                errorMessage: 'failed',
                patientId: 'P-1',
                samples,
                studyId: 'study',
            });
            return null;
        }

        act(() => {
            TestRenderer.create(<Probe />);
        });

        expect(state!.events).toBe(clinicalEvents);
        expect(state!.eventsSignature).toBe('provided-signature');
    });

    it('computes a stable signature from backend clinical events when none is provided', () => {
        let state:
            | ReturnType<typeof usePathologyAugmentedClinicalEventsState>
            | undefined;

        function Probe() {
            state = usePathologyAugmentedClinicalEventsState({
                clinicalEvents,
                errorMessage: 'failed',
                patientId: 'P-1',
                samples,
                studyId: 'study',
            });
            return null;
        }

        act(() => {
            TestRenderer.create(<Probe />);
        });

        expect(state!.events).toBe(clinicalEvents);
        expect(state!.eventsSignature).toBeTruthy();
    });
});
