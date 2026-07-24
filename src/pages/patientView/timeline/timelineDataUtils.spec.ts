import { ClinicalEvent } from 'cbioportal-ts-api-client';
import * as clinicalEventSignatureUtils from './clinicalEventSignatureUtils';
import { groupTimelineData } from './timelineDataUtils';

function makeEvent(
    overrides: Partial<ClinicalEvent> = {},
    attributes: Array<{ key: string; value: string }> = []
): ClinicalEvent {
    return {
        eventType: 'TREATMENT',
        patientId: 'P-1',
        studyId: 'study',
        uniquePatientKey: 'patient-key',
        uniqueSampleKey: 'sample-key',
        startNumberOfDaysSinceDiagnosis: 5,
        endNumberOfDaysSinceDiagnosis: 5,
        attributes,
        ...overrides,
    } as ClinicalEvent;
}

describe('groupTimelineData', () => {
    it('reuses the grouped event-type payload for equivalent same-order events', () => {
        const firstEvents = [
            makeEvent({}, [
                { key: 'B', value: '2' },
                { key: 'A', value: '1' },
            ]),
        ];
        const secondEvents = [
            makeEvent({}, [
                { key: 'A', value: '1' },
                { key: 'B', value: '2' },
            ]),
        ];

        const firstData = groupTimelineData(firstEvents);
        const secondData = groupTimelineData(secondEvents);

        expect(secondData).toBe(firstData);
    });

    it('reuses cached row arrays for equivalent same-order events', () => {
        const firstEvents = [
            makeEvent({}, [
                { key: 'B', value: '2' },
                { key: 'A', value: '1' },
            ]),
        ];
        const secondEvents = [
            makeEvent({}, [
                { key: 'A', value: '1' },
                { key: 'B', value: '2' },
            ]),
        ];

        const firstData = groupTimelineData(firstEvents);
        const secondData = groupTimelineData(secondEvents);

        expect(secondData.TREATMENT).toBe(firstData.TREATMENT);
    });

    it('reuses grouped data when the caller provides the same content signature', () => {
        const firstEvents = [
            makeEvent({}, [
                { key: 'B', value: '2' },
                { key: 'A', value: '1' },
            ]),
        ];
        const secondEvents = [
            makeEvent({}, [
                { key: 'A', value: '1' },
                { key: 'B', value: '2' },
            ]),
        ];
        const sharedSignature =
            'TREATMENT::P-1::study::patient-key::sample-key::5::5::A:1|B:2';

        const firstData = groupTimelineData(firstEvents, sharedSignature);
        const secondData = groupTimelineData(secondEvents, sharedSignature);

        expect(secondData).toBe(firstData);
        expect(secondData.TREATMENT).toBe(firstData.TREATMENT);
    });

    it('rebuilds row arrays when event content changes in place', () => {
        const mutableEvents = [
            makeEvent({}, [{ key: 'A', value: '1' }]),
        ];

        const firstData = groupTimelineData(mutableEvents);

        mutableEvents[0] = makeEvent(
            { startNumberOfDaysSinceDiagnosis: 6, endNumberOfDaysSinceDiagnosis: 6 },
            [{ key: 'A', value: '9' }]
        );

        const secondData = groupTimelineData(mutableEvents);

        expect(secondData.TREATMENT).not.toBe(firstData.TREATMENT);
        expect(secondData.TREATMENT).toEqual([
            ['PATIENT_ID', 'START_DATE', 'STOP_DATE', 'EVENT_TYPE', 'A'],
            ['P-1', '6', '6', 'TREATMENT', '9'],
        ]);
    });

    it('preserves first-seen attribute column order across multiple events', () => {
        const data = groupTimelineData([
            makeEvent({}, [
                { key: 'B', value: '2' },
                { key: 'A', value: '1' },
            ]),
            makeEvent({}, [{ key: 'C', value: '3' }]),
        ]);

        expect(data.TREATMENT).toEqual([
            ['PATIENT_ID', 'START_DATE', 'STOP_DATE', 'EVENT_TYPE', 'B', 'A', 'C'],
            ['P-1', '5', '5', 'TREATMENT', '2', '1', ''],
            ['P-1', '5', '5', 'TREATMENT', '', '', '3'],
        ]);
    });

    it('builds grouped signatures in one pass across mixed event types', () => {
        const buildClinicalEventSignatureSpy = jest.spyOn(
            clinicalEventSignatureUtils,
            'buildClinicalEventSignature'
        );
        const events = [
            makeEvent({ eventType: 'TREATMENT' }, [{ key: 'A', value: '1' }]),
            makeEvent({ eventType: 'STATUS' }, [{ key: 'B', value: '2' }]),
            makeEvent({ eventType: 'TREATMENT' }, [{ key: 'C', value: '3' }]),
        ];

        groupTimelineData(events);

        expect(buildClinicalEventSignatureSpy).toHaveBeenCalledTimes(
            events.length
        );
    });
});
