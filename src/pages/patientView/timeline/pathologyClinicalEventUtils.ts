import { ClinicalEvent } from 'cbioportal-ts-api-client';
import { buildClinicalEventAttributesSignature } from './clinicalEventSignatureUtils';
import { PATHOLOGY_EVENT_ATTRIBUTE_KEYS } from './pathologyTimelineUtils';

type CachedWsiPathologyEventEntry = {
    attributesRef?: ClinicalEvent['attributes'];
    attributesSignature: string;
    eventType: string;
    isWsiPathologyEvent: boolean;
};

const wsiPathologyEventCache = new WeakMap<
    ClinicalEvent,
    CachedWsiPathologyEventEntry
>();

export function isWsiPathologyClinicalEvent(event: ClinicalEvent): boolean {
    const attributes = event.attributes;
    const attributesSignature = buildClinicalEventAttributesSignature(attributes);
    const cached = wsiPathologyEventCache.get(event);

    if (
        cached &&
        cached.attributesRef === attributes &&
        cached.attributesSignature === attributesSignature &&
        cached.eventType === event.eventType
    ) {
        return cached.isWsiPathologyEvent;
    }

    let hasPathologyCountAttribute = false;
    for (const attribute of attributes || []) {
        if (
            attribute.key === PATHOLOGY_EVENT_ATTRIBUTE_KEYS.imageCount ||
            attribute.key === PATHOLOGY_EVENT_ATTRIBUTE_KEYS.nonServableImageCount
        ) {
            hasPathologyCountAttribute = true;
            break;
        }
    }

    const nextValue =
        event.eventType === 'PATHOLOGY SLIDES' && hasPathologyCountAttribute;

    wsiPathologyEventCache.set(event, {
        attributesRef: attributes,
        attributesSignature,
        eventType: event.eventType,
        isWsiPathologyEvent: nextValue,
    });

    return nextValue;
}

export function hasWsiPathologyClinicalEvents(
    events: ClinicalEvent[]
): boolean {
    for (let index = 0; index < events.length; index += 1) {
        if (isWsiPathologyClinicalEvent(events[index])) {
            return true;
        }
    }
    return false;
}
