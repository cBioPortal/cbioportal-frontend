import { ClinicalEvent } from 'cbioportal-ts-api-client';
import {
    hasWsiPathologyClinicalEvents,
    isWsiPathologyClinicalEvent,
} from './pathologyClinicalEventUtils';

function makeEvent(
    eventType = 'PATHOLOGY SLIDES',
    attributes: Array<{ key: string; value: string }> = []
): ClinicalEvent {
    return ({ eventType, attributes } as unknown) as ClinicalEvent;
}

describe('pathologyClinicalEventUtils', () => {
    it('recognizes canonical backend WSI pathology events', () => {
        const event = makeEvent('PATHOLOGY SLIDES', [
            { key: 'IMAGE_COUNT', value: '2' },
            { key: 'NON_SERVABLE_IMAGE_COUNT', value: '1' },
            { key: 'TOTAL_IMAGE_COUNT', value: '3' },
        ]);

        expect(isWsiPathologyClinicalEvent(event)).toBe(true);
        expect(hasWsiPathologyClinicalEvents([event])).toBe(true);
    });

    it('recognizes non-viewable and unmatched WSI events with zero viewable slides', () => {
        const event = makeEvent('PATHOLOGY SLIDES', [
            { key: 'IMAGE_COUNT', value: '0' },
            { key: 'NON_SERVABLE_IMAGE_COUNT', value: '2' },
            { key: 'MATCH_LEVEL', value: 'Unmatched' },
        ]);

        expect(isWsiPathologyClinicalEvent(event)).toBe(true);
    });

    it('does not classify generic pathology events as WSI events', () => {
        const event = makeEvent('PATHOLOGY', [
            { key: 'IMAGE_COUNT', value: '2' },
        ]);

        expect(isWsiPathologyClinicalEvent(event)).toBe(false);
        expect(hasWsiPathologyClinicalEvents([event])).toBe(false);
    });

    it('does not classify slide events without WSI count attributes', () => {
        const event = makeEvent('PATHOLOGY SLIDES', [
            { key: 'SUBTYPE', value: 'H&E' },
        ]);

        expect(isWsiPathologyClinicalEvent(event)).toBe(false);
    });

    it('recomputes classification when event attributes mutate in place', () => {
        const event = makeEvent('PATHOLOGY SLIDES', [
            { key: 'IMAGE_COUNT', value: '1' },
        ]);

        expect(isWsiPathologyClinicalEvent(event)).toBe(true);
        event.attributes = [{ key: 'SUBTYPE', value: 'H&E' }];
        expect(isWsiPathologyClinicalEvent(event)).toBe(false);
    });
});
