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

    it('does not synthesize dated pathology events from the hierarchy', async () => {
        let renderedState:
            | ReturnType<typeof usePathologyAugmentedClinicalEventsState>
            | undefined;
        const originalFetch = global.fetch;
        const fetchMock = jest.fn().mockResolvedValue({
            ok: true,
            json: async () => ({
                referenceSampleId: 'S1',
                sampleGroups: [
                    {
                        sampleId: 'S1',
                        parts: [
                            {
                                partNumber: '1',
                                partDesignator: 'A',
                                partType: 'Tumor',
                                partDescription: 'Lung',
                                subspecialty: '',
                                pathDxTitle: '',
                                blocks: [
                                    {
                                        blockNumber: 'B1',
                                        blockLabel: 'B1',
                                        slides: [
                                            {
                                                imageId: 'I1',
                                                stainName: 'H&E',
                                                stainGroup: 'H&E',
                                                isHne: true,
                                                isIhc: false,
                                                magnification: '20x',
                                                fileSizeBytes: 1,
                                                canServeTiles: true,
                                                barcode: '',
                                                sampleId: 'S1',
                                                matchLevel: 'BLOCK',
                                                specimenKey: '1',
                                                slideType: 'H&E',
                                                procedureDateDays: null,
                                                timepointSource:
                                                    'Procedure date unavailable',
                                                procedureDateKind: 'UNDATED',
                                                procedureDateSource: 'missing_procedure_date',
                                                procedureDateReason: 'unavailable',
                                                procedureDateStatus: 'MISSING_PROCEDURE_DATE',
                                                procedureCoordinateSystem:
                                                    'patient_first_tumor_sequencing_day_zero',
                                            },
                                        ],
                                    },
                                ],
                            },
                        ],
                    },
                ],
            }),
        });
        global.fetch = fetchMock as typeof fetch;

        function StateProbe() {
            renderedState = usePathologyAugmentedClinicalEventsState({
                clinicalEvents: [],
                patientId: 'P-fallback',
                samples: [],
                studyId: 'study-fallback',
                includeUndatedPathology: true,
            });
            return null;
        }

        try {
            await TestRenderer.act(async () => {
                TestRenderer.create(<StateProbe />);
                await new Promise(resolve => setTimeout(resolve, 0));
            });
            expect(fetchMock).toHaveBeenCalledTimes(1);
            expect(renderedState?.events).toEqual([]);
            expect(renderedState?.undatedPathologySlideCount).toBe(1);
        } finally {
            global.fetch = originalFetch;
        }
    });
});
