import { ClinicalEvent } from 'cbioportal-ts-api-client';
import {
    buildClinicalEventAttributesSignature,
    buildClinicalEventSignature,
    buildClinicalEventsSignature,
} from './clinicalEventSignatureUtils';
import * as clinicalEventSignatureUtils from './clinicalEventSignatureUtils';

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

describe('clinicalEventSignatureUtils', () => {
    it('builds the same attribute signature regardless of attribute order', () => {
        const firstAttributes = [
            { key: 'B', value: '2' },
            { key: 'A', value: '1' },
        ];
        const secondAttributes = [
            { key: 'A', value: '1' },
            { key: 'B', value: '2' },
        ];

        expect(
            buildClinicalEventAttributesSignature(firstAttributes)
        ).toBe(buildClinicalEventAttributesSignature(secondAttributes));
    });

    it('recomputes the cached attribute signature when attribute values mutate in place', () => {
        const attributes = [
            { key: 'A', value: '1' },
            { key: 'B', value: '2' },
        ];

        expect(buildClinicalEventAttributesSignature(attributes)).toBe('A:1|B:2');

        attributes[1].value = '9';
        expect(buildClinicalEventAttributesSignature(attributes)).toBe('A:1|B:9');
    });

    it('can omit unique keys for pathology-style signatures', () => {
        const first = makeEvent(
            {
                uniquePatientKey: 'patient-a',
                uniqueSampleKey: 'sample-a',
            },
            [{ key: 'A', value: '1' }]
        );
        const second = makeEvent(
            {
                uniquePatientKey: 'patient-b',
                uniqueSampleKey: 'sample-b',
            },
            [{ key: 'A', value: '1' }]
        );

        expect(
            buildClinicalEventSignature(first, { includeUniqueKeys: false })
        ).toBe(
            buildClinicalEventSignature(second, { includeUniqueKeys: false })
        );
        expect(buildClinicalEventSignature(first)).not.toBe(
            buildClinicalEventSignature(second)
        );
    });

    it('builds order-preserving event-array signatures from cached per-event signatures', () => {
        const firstEvents = [
            makeEvent({ eventType: 'A' }, [{ key: 'X', value: '1' }]),
            makeEvent({ eventType: 'B' }, [{ key: 'Y', value: '2' }]),
        ];
        const secondEvents = [
            makeEvent({ eventType: 'A' }, [{ key: 'X', value: '1' }]),
            makeEvent({ eventType: 'B' }, [{ key: 'Y', value: '2' }]),
        ];

        expect(buildClinicalEventsSignature(firstEvents)).toBe(
            buildClinicalEventsSignature(secondEvents)
        );
    });

    it('reuses the cached event-array signature for the same array snapshot', () => {
        const events = [
            makeEvent({ eventType: 'A' }, [{ key: 'X', value: '1' }]),
            makeEvent({ eventType: 'B' }, [{ key: 'Y', value: '2' }]),
        ];

        const first = buildClinicalEventsSignature(events);
        const second = buildClinicalEventsSignature(events);

        expect(second).toBe(first);
    });

    it('recomputes the cached event-array signature when event content changes in place', () => {
        const events = [
            makeEvent({ eventType: 'A' }, [{ key: 'X', value: '1' }]),
            makeEvent({ eventType: 'B' }, [{ key: 'Y', value: '2' }]),
        ];

        const first = buildClinicalEventsSignature(events);
        events[1].attributes = [{ key: 'Y', value: '9' }];

        const second = buildClinicalEventsSignature(events);

        expect(second).not.toBe(first);
        expect(second).toContain('Y:9');
    });

    it('can build order-insensitive event-array signatures when requested', () => {
        const firstEvents = [
            makeEvent({ eventType: 'A' }, [{ key: 'X', value: '1' }]),
            makeEvent({ eventType: 'B' }, [{ key: 'Y', value: '2' }]),
        ];
        const secondEvents = [firstEvents[1], firstEvents[0]];

        expect(
            buildClinicalEventsSignature(firstEvents, { ignoreOrder: true })
        ).toBe(
            buildClinicalEventsSignature(secondEvents, { ignoreOrder: true })
        );
        expect(buildClinicalEventsSignature(firstEvents)).not.toBe(
            buildClinicalEventsSignature(secondEvents)
        );
    });
});
