import { ClinicalEvent } from 'cbioportal-ts-api-client';

type CachedAttributeSignatureEntry = {
    orderedSnapshot: string;
    unorderedSignature: string;
};

type CachedEventSignatureEntry = {
    attributeRef?: ClinicalEvent['attributes'];
    attributeSignature: string;
    includeUniqueKeys: boolean;
    signature: string;
};

type CachedEventsSignatureEntry = {
    ignoreOrder: boolean;
    orderedSnapshot: string;
    includeUniqueKeys: boolean;
    signature: string;
};

const attributeSignatureCache = new WeakMap<
    NonNullable<ClinicalEvent['attributes']>,
    CachedAttributeSignatureEntry
>();
const eventSignatureCache = new WeakMap<ClinicalEvent, CachedEventSignatureEntry>();
const eventsSignatureCache = new WeakMap<
    ClinicalEvent[],
    CachedEventsSignatureEntry
>();

export function buildClinicalEventAttributesSignature(
    attributes: ClinicalEvent['attributes']
): string {
    if (!attributes?.length) {
        return '';
    }

    const entries = new Array<string>(attributes.length);
    for (let index = 0; index < attributes.length; index += 1) {
        const attribute = attributes[index];
        entries[index] = `${attribute.key}:${attribute.value}`;
    }
    const orderedSnapshot = entries.join('|');

    const cached = attributeSignatureCache.get(attributes);
    if (cached && cached.orderedSnapshot === orderedSnapshot) {
        return cached.unorderedSignature;
    }

    entries.sort((left, right) => left.localeCompare(right));
    const unorderedSignature = entries.join('|');

    attributeSignatureCache.set(attributes, {
        orderedSnapshot,
        unorderedSignature,
    });

    return unorderedSignature;
}

export function buildClinicalEventSignature(
    event: ClinicalEvent,
    { includeUniqueKeys = true }: { includeUniqueKeys?: boolean } = {}
): string {
    const attributes = event.attributes;
    const attributeSignature = buildClinicalEventAttributesSignature(attributes);
    const cached = eventSignatureCache.get(event);

    if (
        cached &&
        cached.attributeRef === attributes &&
        cached.attributeSignature === attributeSignature &&
        cached.includeUniqueKeys === includeUniqueKeys
    ) {
        return cached.signature;
    }

    const signature = [
        event.eventType || '',
        event.patientId || '',
        event.studyId || '',
        ...(includeUniqueKeys
            ? [event.uniquePatientKey || '', event.uniqueSampleKey || '']
            : []),
        event.startNumberOfDaysSinceDiagnosis ?? '',
        event.endNumberOfDaysSinceDiagnosis ?? '',
        attributeSignature,
    ].join('::');

    eventSignatureCache.set(event, {
        attributeRef: attributes,
        attributeSignature,
        includeUniqueKeys,
        signature,
    });

    return signature;
}

export function buildClinicalEventsSignature(
    events: ClinicalEvent[],
    options?: { includeUniqueKeys?: boolean; ignoreOrder?: boolean }
): string {
    const includeUniqueKeys = options?.includeUniqueKeys ?? true;
    const ignoreOrder = options?.ignoreOrder ?? false;
    const cached = eventsSignatureCache.get(events);
    const eventSignatures = new Array<string>(events.length);

    for (let index = 0; index < events.length; index += 1) {
        eventSignatures[index] = buildClinicalEventSignature(
            events[index],
            options
        );
    }
    const orderedSnapshot = eventSignatures.join('||');

    if (
        cached &&
        cached.includeUniqueKeys === includeUniqueKeys &&
        cached.ignoreOrder === ignoreOrder &&
        cached.orderedSnapshot === orderedSnapshot
    ) {
        return cached.signature;
    }

    let signature = orderedSnapshot;
    if (ignoreOrder && eventSignatures.length > 1) {
        const unorderedEventSignatures = [...eventSignatures];
        unorderedEventSignatures.sort((left, right) => left.localeCompare(right));
        signature = unorderedEventSignatures.join('||');
    }

    eventsSignatureCache.set(events, {
        ignoreOrder,
        orderedSnapshot,
        includeUniqueKeys,
        signature,
    });

    return signature;
}
