import React from 'react';
import TestRenderer from 'react-test-renderer';
import { ClinicalEvent } from 'cbioportal-ts-api-client';
import usePathologyAugmentedClinicalEvents, {
    usePathologyAugmentedClinicalEventsState,
} from './usePathologyAugmentedClinicalEvents';

const clinicalEvents = [
    {
        eventType: 'PATHOLOGY SLIDES',
        patientId: 'P-1',
        studyId: 'study',
        startNumberOfDaysSinceDiagnosis: -5,
        attributes: [
            { key: 'SUBTYPE', value: 'H&E' },
            { key: 'IMAGE_COUNT', value: '2' },
            { key: 'TOTAL_IMAGE_COUNT', value: '3' },
            { key: 'TIMEPOINT_SOURCE', value: 'Procedure date' },
        ],
    },
    {
        eventType: 'TREATMENT',
        patientId: 'P-1',
        studyId: 'study',
        startNumberOfDaysSinceDiagnosis: 1,
    },
] as ClinicalEvent[];

function HookProbe({
    onEvents,
}: {
    onEvents: (events: ClinicalEvent[]) => void;
}) {
    const events = usePathologyAugmentedClinicalEvents({
        clinicalEvents,
        patientId: 'P-1',
        samples: [],
        studyId: 'study',
    });
    onEvents(events);
    return <div>{events.length}</div>;
}

describe('usePathologyAugmentedClinicalEvents', () => {
    it('preserves backend pathology events and their timepoints', () => {
        let renderedEvents: ClinicalEvent[] | undefined;
        const originalFetch = global.fetch;
        const fetchMock = jest.fn();
        global.fetch = fetchMock as typeof fetch;

        try {
            const renderer = TestRenderer.create(
                <HookProbe onEvents={events => (renderedEvents = events)} />
            );

            expect(renderedEvents).toBe(clinicalEvents);
            expect(renderedEvents).toHaveLength(2);
            expect(renderedEvents?.[0].eventType).toBe('PATHOLOGY SLIDES');
            expect(renderedEvents?.[0].startNumberOfDaysSinceDiagnosis).toBe(
                -5
            );
            expect(renderer.root.findByType('div').children).toEqual(['2']);
            expect(fetchMock).not.toHaveBeenCalled();
        } finally {
            global.fetch = originalFetch;
        }
    });
});

describe('usePathologyAugmentedClinicalEventsState', () => {
    it('uses a supplied event signature without changing the event list', () => {
        let renderedState:
            | ReturnType<typeof usePathologyAugmentedClinicalEventsState>
            | undefined;

        function StateProbe() {
            renderedState = usePathologyAugmentedClinicalEventsState({
                clinicalEvents,
                clinicalEventsSignature: 'backend-signature',
                patientId: 'P-1',
                samples: [],
                studyId: 'study',
            });
            return null;
        }

        TestRenderer.create(<StateProbe />);
        expect(renderedState?.events).toBe(clinicalEvents);
        expect(renderedState?.eventsSignature).toBe('backend-signature');
    });
});
