import { ClinicalEvent } from 'cbioportal-ts-api-client';
import { TimelineEvent } from 'cbioportal-clinical-timeline';
import {
    buildClinicalEventAttributesSignature,
    buildClinicalEventSignature,
} from './clinicalEventSignatureUtils';
import { PATHOLOGY_EVENT_ATTRIBUTE_KEYS } from './pathologyTimelineUtils';

export type PathologyPresentationItem = Readonly<{
    date: number | null | undefined;
    linkout: string;
    matchLevel: string;
    nonServableCount: number;
    sampleId: string;
    specimen: string;
    subtype: string;
    timepointSource: string;
    totalCount: number;
    servableCount: number;
}>;

export type PathologyPresentationBucket = Readonly<{
    key: string;
    date: number | null | undefined;
    linkout: string;
    matchLevel: string;
    nonServableCount: number;
    sampleId: string;
    specimens: readonly string[];
    subtype: string;
    timepointSource: string;
    totalCount: number;
    servableCount: number;
}>;

export type PathologyPresentationLinkRow = Readonly<{
    href: string;
    label: string;
    matchLevel: string;
    sampleId: string;
    servableCount: number;
    specimens: readonly string[];
}>;

export type PathologyPresentationSummary = Readonly<{
    date: number | null | undefined;
    eventLinkRows: readonly PathologyPresentationLinkRow[];
    linkout?: string;
    linkouts: readonly string[];
    matchLevels: readonly string[];
    nonServableCount: number;
    sampleIds: readonly string[];
    servableCount: number;
    source: string;
    specimens: readonly string[];
}>;

type CachedPathologyPresentationItemEntry = {
    attributesRef?: ClinicalEvent['attributes'];
    attributesSignature: string;
    date: number | null | undefined;
    item: PathologyPresentationItem;
};

const pathologyPresentationItemCache = new WeakMap<
    ClinicalEvent,
    CachedPathologyPresentationItemEntry
>();

export function buildPathologyPresentationGroupKey(
    item: Pick<
        PathologyPresentationItem,
        'date' | 'sampleId' | 'matchLevel' | 'subtype'
    >
): string {
    return [
        item.date == null ? 'Unknown' : String(item.date),
        item.sampleId,
        item.matchLevel,
        item.subtype,
    ].join('||');
}

export function sanitizePathologyLinkout(linkout: string): string {
    if (!linkout || !linkout.includes('specimenKey=')) {
        return linkout;
    }

    const [pathname, rawQuery = ''] = linkout.split('?', 2);
    const params = new URLSearchParams(rawQuery);
    params.delete('specimenKey');
    const nextQuery = params.toString();
    return nextQuery ? `${pathname}?${nextQuery}` : pathname;
}

function getPathologyLinkoutSpecimenKey(linkout: string): string | undefined {
    if (!linkout) {
        return undefined;
    }
    try {
        return (
            new URL(linkout, 'http://wsi-linkout.invalid').searchParams.get(
                'specimenKey'
            ) || undefined
        );
    } catch (_) {
        return undefined;
    }
}

function resolveGroupedPathologyLinkout(
    linkout: string,
    specimenKeys: Set<string>,
    hasBroadLinkout: boolean
): string {
    return hasBroadLinkout || specimenKeys.size > 1
        ? sanitizePathologyLinkout(linkout)
        : linkout;
}

/** Mark legacy internal WSI links as scoped before exposing them to users. */
export function markPathologyLinkoutScope(
    linkout: string,
    timepointDays?: number | null
): string {
    if (!linkout || !linkout.startsWith('/patient/wsiHESlides')) {
        return linkout;
    }

    try {
        const target = new URL(linkout, 'http://wsi-linkout.invalid');
        if (target.pathname !== '/patient/wsiHESlides') {
            return linkout;
        }
        target.searchParams.set('wsiScope', 'linkout');
        if (
            !target.searchParams.has('timepointDays') &&
            timepointDays != null &&
            Number.isFinite(timepointDays)
        ) {
            target.searchParams.set('timepointDays', String(timepointDays));
        }
        return `${target.pathname}?${target.searchParams.toString()}${
            target.hash
        }`;
    } catch (_) {
        return linkout;
    }
}

export function joinDistinctPathologyValues(values: readonly string[]): string {
    const seen = new Set<string>();
    const ordered: string[] = [];

    for (let index = 0; index < values.length; index += 1) {
        const value = values[index];
        if (!value || seen.has(value)) {
            continue;
        }
        seen.add(value);
        ordered.push(value);
    }

    return ordered.join(', ');
}

export function distinctPathologyValues(
    values: readonly string[]
): readonly string[] {
    const seen = new Set<string>();
    const ordered: string[] = [];

    for (let index = 0; index < values.length; index += 1) {
        const value = values[index];
        if (!value || seen.has(value)) {
            continue;
        }
        seen.add(value);
        ordered.push(value);
    }

    return Object.freeze(ordered);
}

export function joinDistinctPathologyValuesPair(
    existing: string,
    nextValue: string
): string {
    if (!nextValue) {
        return existing;
    }
    return joinDistinctPathologyValues(
        existing ? [existing, nextValue] : [nextValue]
    );
}

function readPathologyAttributeValue(
    attributes: ClinicalEvent['attributes'],
    key: string
): string {
    for (let index = 0; index < (attributes || []).length; index += 1) {
        if (attributes![index].key === key) {
            return attributes![index].value || '';
        }
    }
    return '';
}

export function extractPathologyPresentationItemFromAttributes(
    attributes: ClinicalEvent['attributes'],
    date: number | null | undefined
): PathologyPresentationItem {
    const servableCount =
        Number(
            readPathologyAttributeValue(
                attributes,
                PATHOLOGY_EVENT_ATTRIBUTE_KEYS.imageCount
            )
        ) || 0;
    const totalCountValue = Number(
        readPathologyAttributeValue(
            attributes,
            PATHOLOGY_EVENT_ATTRIBUTE_KEYS.totalImageCount
        )
    );
    const nonServableCountValue = Number(
        readPathologyAttributeValue(
            attributes,
            PATHOLOGY_EVENT_ATTRIBUTE_KEYS.nonServableImageCount
        )
    );
    const totalCount = Number.isFinite(totalCountValue)
        ? totalCountValue
        : servableCount +
          (Number.isFinite(nonServableCountValue) ? nonServableCountValue : 0);
    const nonServableCount = Number.isFinite(nonServableCountValue)
        ? nonServableCountValue
        : Math.max(0, totalCount - servableCount);

    return Object.freeze({
        date,
        linkout:
            readPathologyAttributeValue(
                attributes,
                PATHOLOGY_EVENT_ATTRIBUTE_KEYS.linkout
            ) || '',
        matchLevel:
            readPathologyAttributeValue(
                attributes,
                PATHOLOGY_EVENT_ATTRIBUTE_KEYS.matchLevel
            ) || '',
        nonServableCount,
        sampleId:
            readPathologyAttributeValue(
                attributes,
                PATHOLOGY_EVENT_ATTRIBUTE_KEYS.sampleId
            ) || '',
        specimen:
            readPathologyAttributeValue(
                attributes,
                PATHOLOGY_EVENT_ATTRIBUTE_KEYS.specimen
            ) || '',
        subtype:
            readPathologyAttributeValue(
                attributes,
                PATHOLOGY_EVENT_ATTRIBUTE_KEYS.subtype
            ) || '',
        timepointSource:
            readPathologyAttributeValue(
                attributes,
                PATHOLOGY_EVENT_ATTRIBUTE_KEYS.timepointSource
            ) || '',
        totalCount,
        servableCount,
    }) as PathologyPresentationItem;
}

export function extractPathologyPresentationItemFromClinicalEvent(
    event: ClinicalEvent
): PathologyPresentationItem {
    const attributes = event.attributes;
    const attributesSignature = buildClinicalEventAttributesSignature(
        attributes
    );
    const cached = pathologyPresentationItemCache.get(event);

    if (
        cached &&
        cached.attributesRef === attributes &&
        cached.attributesSignature === attributesSignature &&
        cached.date === event.startNumberOfDaysSinceDiagnosis
    ) {
        return cached.item;
    }

    const item = extractPathologyPresentationItemFromAttributes(
        attributes,
        event.startNumberOfDaysSinceDiagnosis
    );
    pathologyPresentationItemCache.set(event, {
        attributesRef: attributes,
        attributesSignature,
        date: event.startNumberOfDaysSinceDiagnosis,
        item,
    });
    return item;
}

export function extractPathologyPresentationItemFromTimelineEvent(
    event: TimelineEvent
): PathologyPresentationItem {
    return extractPathologyPresentationItemFromAttributes(
        event.event.attributes,
        event.event.startNumberOfDaysSinceDiagnosis
    );
}

export function buildPathologyPresentationLinkLabel(
    row: Pick<
        PathologyPresentationLinkRow,
        'servableCount' | 'matchLevel' | 'specimens'
    >
): string {
    const pieces = [String(row.servableCount)];
    if (row.matchLevel) {
        pieces.push(row.matchLevel);
    }
    const specimenLabel = joinDistinctPathologyValues(row.specimens);
    if (specimenLabel) {
        pieces.push(specimenLabel);
    }
    return pieces.join(' - ');
}

export function formatPathologyLinkoutLabel(
    servableCount: number,
    totalCount: number
): string {
    return `View ${servableCount} of ${totalCount}`;
}

export function groupPathologyPresentationItems(
    items: readonly PathologyPresentationItem[]
): PathologyPresentationBucket[] {
    const grouped = new Map<
        string,
        {
            key: string;
            date: number | null | undefined;
            linkout: string;
            matchLevel: string;
            nonServableCount: number;
            sampleId: string;
            specimens: string[];
            subtype: string;
            timepointSource: string;
            totalCount: number;
            servableCount: number;
            specimenKeys: Set<string>;
            hasBroadLinkout: boolean;
        }
    >();

    for (let index = 0; index < items.length; index += 1) {
        const item = items[index];
        const key = buildPathologyPresentationGroupKey(item);
        const existing = grouped.get(key);

        if (existing) {
            existing.totalCount += item.totalCount;
            existing.servableCount += item.servableCount;
            existing.nonServableCount += item.nonServableCount;
            if (item.specimen) {
                existing.specimens.push(item.specimen);
            }
            if (!existing.linkout && item.linkout) {
                existing.linkout = item.linkout;
            }
            const specimenKey = getPathologyLinkoutSpecimenKey(item.linkout);
            if (specimenKey) {
                existing.specimenKeys.add(specimenKey);
            } else if (item.linkout) {
                existing.hasBroadLinkout = true;
            }
            if (item.timepointSource) {
                existing.timepointSource = joinDistinctPathologyValuesPair(
                    existing.timepointSource,
                    item.timepointSource
                );
            }
            continue;
        }

        const specimenKey = getPathologyLinkoutSpecimenKey(item.linkout);
        grouped.set(key, {
            key,
            date: item.date,
            linkout: item.linkout,
            matchLevel: item.matchLevel,
            nonServableCount: item.nonServableCount,
            sampleId: item.sampleId,
            specimens: item.specimen ? [item.specimen] : [],
            subtype: item.subtype,
            timepointSource: item.timepointSource,
            totalCount: item.totalCount,
            servableCount: item.servableCount,
            specimenKeys: new Set(specimenKey ? [specimenKey] : []),
            hasBroadLinkout: !!item.linkout && !specimenKey,
        });
    }

    const buckets = Array.from(grouped.values());
    buckets.sort(
        (a, b) =>
            (a.date ?? Number.POSITIVE_INFINITY) -
                (b.date ?? Number.POSITIVE_INFINITY) ||
            a.sampleId.localeCompare(b.sampleId) ||
            a.matchLevel.localeCompare(b.matchLevel) ||
            a.subtype.localeCompare(b.subtype)
    );

    return Object.freeze(
        buckets.map(bucket => {
            const {
                specimenKeys,
                hasBroadLinkout,
                ...presentationBucket
            } = bucket;
            return Object.freeze({
                ...presentationBucket,
                linkout: resolveGroupedPathologyLinkout(
                    bucket.linkout,
                    specimenKeys,
                    hasBroadLinkout
                ),
                specimens: distinctPathologyValues(bucket.specimens),
            }) as PathologyPresentationBucket;
        })
    ) as PathologyPresentationBucket[];
}

export function summarizePathologyPresentationItems(
    items: readonly PathologyPresentationItem[]
): PathologyPresentationSummary {
    const firstDate = items[0]?.date;
    const hasSingleDate = items.every(item => item.date === firstDate);
    let servableCount = 0;
    let nonServableCount = 0;
    const sources = new Set<string>();
    const sampleIdsSet = new Set<string>();
    const matchLevelsSet = new Set<string>();
    const specimensSet = new Set<string>();
    const groupedLinkRows = new Map<
        string,
        {
            href: string;
            matchLevel: string;
            sampleId: string;
            servableCount: number;
            specimens: string[];
            specimenKeys: Set<string>;
            hasBroadLinkout: boolean;
        }
    >();

    for (let index = 0; index < items.length; index += 1) {
        const item = items[index];
        servableCount += item.servableCount;
        nonServableCount += item.nonServableCount;

        if (item.timepointSource) {
            sources.add(item.timepointSource);
        }
        if (item.sampleId) {
            sampleIdsSet.add(item.sampleId);
        }
        if (item.matchLevel) {
            matchLevelsSet.add(item.matchLevel);
        }
        if (item.specimen) {
            specimensSet.add(item.specimen);
        }
        if (item.linkout) {
            const sanitizedHref = sanitizePathologyLinkout(item.linkout);
            const groupedKey = [
                item.sampleId,
                item.matchLevel,
                sanitizedHref,
            ].join('||');
            const existing = groupedLinkRows.get(groupedKey);
            if (existing) {
                existing.servableCount += item.servableCount;
                if (item.specimen) {
                    existing.specimens.push(item.specimen);
                }
                const specimenKey = getPathologyLinkoutSpecimenKey(
                    item.linkout
                );
                if (specimenKey) {
                    existing.specimenKeys.add(specimenKey);
                } else {
                    existing.hasBroadLinkout = true;
                }
            } else {
                const specimenKey = getPathologyLinkoutSpecimenKey(
                    item.linkout
                );
                groupedLinkRows.set(groupedKey, {
                    href: item.linkout,
                    matchLevel: item.matchLevel,
                    sampleId: item.sampleId,
                    servableCount: item.servableCount,
                    specimens: item.specimen ? [item.specimen] : [],
                    specimenKeys: new Set(specimenKey ? [specimenKey] : []),
                    hasBroadLinkout: !specimenKey,
                });
            }
        }
    }

    const sampleIds = Array.from(sampleIdsSet).sort((a, b) =>
        a.localeCompare(b)
    );
    const matchLevels = Array.from(matchLevelsSet).sort((a, b) =>
        a.localeCompare(b)
    );
    const specimens = Array.from(specimensSet).sort((a, b) =>
        a.localeCompare(b)
    );
    const linkouts =
        servableCount > 0
            ? Array.from(groupedLinkRows.values()).map(row =>
                  resolveGroupedPathologyLinkout(
                      row.href,
                      row.specimenKeys,
                      row.hasBroadLinkout
                  )
              )
            : [];
    linkouts.sort((a, b) => a.localeCompare(b));
    const linkout = linkouts.length === 1 ? linkouts[0] : undefined;

    let eventLinkRows: PathologyPresentationLinkRow[] = [];
    if (!linkout && linkouts.length > 0) {
        eventLinkRows = Array.from(groupedLinkRows.values())
            .map(row => {
                const specimens = distinctPathologyValues(row.specimens);
                return Object.freeze({
                    href: resolveGroupedPathologyLinkout(
                        row.href,
                        row.specimenKeys,
                        row.hasBroadLinkout
                    ),
                    label: buildPathologyPresentationLinkLabel({
                        servableCount: row.servableCount,
                        matchLevel: row.matchLevel,
                        specimens,
                    }),
                    matchLevel: row.matchLevel,
                    sampleId: row.sampleId,
                    servableCount: row.servableCount,
                    specimens,
                }) as PathologyPresentationLinkRow;
            })
            .sort(
                (left, right) =>
                    left.label.localeCompare(right.label) ||
                    left.href.localeCompare(right.href)
            );
    }

    return Object.freeze({
        date: hasSingleDate ? firstDate : undefined,
        eventLinkRows: Object.freeze(eventLinkRows),
        linkout,
        linkouts: Object.freeze(linkouts),
        matchLevels: Object.freeze(matchLevels),
        nonServableCount,
        sampleIds: Object.freeze(sampleIds),
        servableCount,
        source: Array.from(sources)
            .sort((a, b) => a.localeCompare(b))
            .join(', '),
        specimens: Object.freeze(specimens),
    }) as PathologyPresentationSummary;
}

export function buildPathologyPresentationItemsSignature(
    items: readonly PathologyPresentationItem[]
): string {
    const signatures = new Array<string>(items.length);
    for (let index = 0; index < items.length; index += 1) {
        const item = items[index];
        signatures[index] = [
            item.date ?? '',
            item.sampleId,
            item.matchLevel,
            item.specimen,
            item.subtype,
            item.servableCount,
            item.nonServableCount,
            item.totalCount,
            item.linkout,
            item.timepointSource,
        ].join('|');
    }
    signatures.sort((left, right) => left.localeCompare(right));
    return signatures.join('||');
}

export function buildPathologyPresentationItemsFromClinicalEvents(
    events: readonly ClinicalEvent[]
): PathologyPresentationItem[] {
    const items = new Array<PathologyPresentationItem>(events.length);
    for (let index = 0; index < events.length; index += 1) {
        items[index] = extractPathologyPresentationItemFromClinicalEvent(
            events[index]
        );
    }
    return items;
}

export function buildPathologyPresentationItemsFromTimelineEvents(
    events: readonly TimelineEvent[]
): PathologyPresentationItem[] {
    const items = new Array<PathologyPresentationItem>(events.length);
    for (let index = 0; index < events.length; index += 1) {
        items[index] = extractPathologyPresentationItemFromTimelineEvent(
            events[index]
        );
    }
    return items;
}

export function buildPathologyPresentationItemClinicalEventSignature(
    event: ClinicalEvent
): string {
    return buildClinicalEventSignature(event, {
        includeUniqueKeys: false,
    });
}
