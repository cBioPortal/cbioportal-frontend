import {
    ClinicalDataBySampleId,
    ClinicalEvent,
} from 'cbioportal-ts-api-client';
import {
    countServableSlidesForSample,
    getServableSlideAssociationsByImageIdReadOnly,
    getServableSlideCountsForHierarchyReadOnly,
    getServableSlideEntriesForHierarchyReadOnly,
} from 'shared/components/wsiViewer/wsiSlideUtils';
import { formatSpecimenLabel } from 'shared/components/wsiViewer/wsiSpecimenUtils';
import { PatientHierarchy } from 'shared/components/wsiViewer/wsiViewerTypes';
import { reportWsiAssociationIntegrity } from 'shared/lib/tracking';
import {
    buildPathologyAssociationSnapshot,
    formatMatchLevel,
    getPathologySlideAssociationsReadOnly,
    matchesPathologySlideType,
    PathologySlideType,
} from './pathologyAssociationUtils';
import { buildClinicalEventsSignature } from './clinicalEventSignatureUtils';

const PATHOLOGY_EVENT_TYPE = 'PATHOLOGY SLIDES';

export const PATHOLOGY_EVENT_ATTRIBUTE_KEYS = {
    imageCount: 'IMAGE_COUNT',
    linkout: 'LINKOUT',
    matchLevel: 'MATCH_LEVEL',
    nonServableImageCount: 'NON_SERVABLE_IMAGE_COUNT',
    sampleId: 'SAMPLE_ID',
    specimen: 'SPECIMEN',
    subtype: 'SUBTYPE',
    timepointSource: 'TIMEPOINT_SOURCE',
    totalImageCount: 'TOTAL_IMAGE_COUNT',
} as const;

const PATHOLOGY_SLIDE_TYPES: PathologySlideType[] = ['H&E', 'IHC'];

type CachedPathologyAssociationGroupsEntry = {
    associationSignature: string | null;
    cacheKey: string;
    hierarchyRef: PatientHierarchy;
    groups: PathologyAssociationGroup[];
};

type CachedPathologyTimelineEventsEntry = {
    associationSignature: string | null;
    cacheKey: string;
    hierarchyRef: PatientHierarchy;
    patientId: string;
    studyId: string;
    groupsRef: PathologyAssociationGroup[];
    events: ClinicalEvent[];
};

type PathologyAssociationGroup = {
    date: number;
    imageCount: number;
    nonServableImageCount: number;
    imageIds: string[];
    sampleId: string | null;
    specimen: string;
    specimenKey: string;
    subtype: PathologySlideType;
    timepointSource: string;
    matchLevel: string;
};

type MutablePathologyAssociationGroup = Omit<
    PathologyAssociationGroup,
    'imageIds'
> & {
    imageIds: Set<string>;
};

type PathologyAssociationIntegrityCounts = {
    hierarchyServableDistinctImages: number;
    hierarchyNonServableDistinctImages: number;
    hierarchyBlockDistinctImages: number;
    hierarchyPartDistinctImages: number;
    hierarchyUnmatchedDistinctImages: number;
    timelineServableDistinctImages: number;
    timelineNonServableDistinctImages: number;
    duplicateServableAssociationRows: number;
    multiBucketServableImages: number;
};

type CachedPathologyAssociationIntegrityEntry = {
    groupsRef: PathologyAssociationGroup[];
    counts: PathologyAssociationIntegrityCounts;
    hasMismatch: boolean;
    reported: boolean;
};

const pathologyAssociationGroupsCache = new WeakMap<
    PatientHierarchy,
    CachedPathologyAssociationGroupsEntry
>();
const pathologyMaterializedEventsCache = new WeakMap<
    PatientHierarchy,
    CachedPathologyTimelineEventsEntry
>();
const pathologyAssociationIntegrityCache = new WeakMap<
    PatientHierarchy,
    CachedPathologyAssociationIntegrityEntry
>();

function freezeClinicalEvent(event: ClinicalEvent): ClinicalEvent {
    if (event.attributes) {
        for (let index = 0; index < event.attributes.length; index += 1) {
            Object.freeze(event.attributes[index]);
        }
    }
    if (event.attributes) {
        Object.freeze(event.attributes);
    }
    return Object.freeze(event) as ClinicalEvent;
}

function freezeClinicalEvents(events: ClinicalEvent[]): ClinicalEvent[] {
    for (let index = 0; index < events.length; index += 1) {
        freezeClinicalEvent(events[index]);
    }
    return Object.freeze(events) as ClinicalEvent[];
}

function freezePathologyAssociationGroup(
    group: MutablePathologyAssociationGroup
): PathologyAssociationGroup {
    const imageIds = new Array<string>(group.imageIds.size);
    let imageIndex = 0;
    for (const imageId of group.imageIds) {
        imageIds[imageIndex] = imageId;
        imageIndex += 1;
    }

    return Object.freeze({
        ...group,
        imageIds: Object.freeze(imageIds),
    }) as PathologyAssociationGroup;
}

function freezePathologyAssociationGroups(
    groups: MutablePathologyAssociationGroup[]
): PathologyAssociationGroup[] {
    const frozenGroups = new Array<PathologyAssociationGroup>(groups.length);
    for (let index = 0; index < groups.length; index += 1) {
        frozenGroups[index] = freezePathologyAssociationGroup(groups[index]);
    }
    return Object.freeze(frozenGroups) as PathologyAssociationGroup[];
}

function getPathologyGroupSampleDisplayValue(
    group: Pick<PathologyAssociationGroup, 'sampleId' | 'matchLevel'>
): string {
    if (group.sampleId) {
        return group.sampleId;
    }
    return group.matchLevel === 'Unmatched' ? 'Unmatched' : '';
}

function createSingletonStringSet(value: string): Set<string> {
    const set = new Set<string>();
    set.add(value);
    return set;
}

function joinDistinctValues(existing: string, value: string): string {
    const entries = existing ? existing.split(', ') : [];
    let hasValue = false;
    let nextCount = 0;

    for (let index = 0; index < entries.length; index += 1) {
        const entry = entries[index];
        if (!entry) {
            continue;
        }
        if (entry === value) {
            hasValue = true;
        }
        entries[nextCount] = entry;
        nextCount += 1;
    }

    if (!hasValue && value) {
        entries[nextCount] = value;
        nextCount += 1;
    }

    if (nextCount === 0) {
        return '';
    }

    let joined = entries[0];
    for (let index = 1; index < nextCount; index += 1) {
        joined += `, ${entries[index]}`;
    }
    return joined;
}

function buildPathologyAssociationsSignature(
    hierarchy: PatientHierarchy
): string {
    const associations = getPathologySlideAssociationsReadOnly(hierarchy);
    if (!associations.length) {
        return '';
    }

    const snapshots = new Array<string>(associations.length);
    for (let index = 0; index < associations.length; index += 1) {
        snapshots[index] = buildPathologyAssociationSnapshot(associations[index]);
    }
    snapshots.sort((left, right) => left.localeCompare(right));
    return snapshots.join('|');
}

export function hasServableDiagnosticSlides(
    hierarchy: PatientHierarchy,
    allowedSampleIds?: Set<string>
): boolean {
    if (hierarchy.slide_associations?.length) {
        return hierarchy.slide_associations.some(
            association =>
                association.can_serve_tiles &&
                (!allowedSampleIds ||
                    association.sample_id == null ||
                    allowedSampleIds.has(association.sample_id))
        );
    }

    if (!allowedSampleIds) {
        return getServableSlideCountsForHierarchyReadOnly(hierarchy).all > 0;
    }

    return hierarchy.samples.some(
        sample =>
            allowedSampleIds.has(sample.sample_id) &&
            countServableSlidesForSample(sample) > 0
    );
}

export function buildPatientHierarchyUrl(
    tileServerBase: string,
    patientId: string,
    studyId: string
): string {
    return `${tileServerBase}/patient/${encodeURIComponent(
        patientId
    )}?studyId=${encodeURIComponent(studyId)}`;
}

function buildPatientWsiTimelineUrl(
    studyId: string,
    patientId: string,
    options?: {
        sampleId?: string | null;
        subtype?: PathologySlideType;
        matchLevel?: string;
        specimenKey?: string;
    }
): string {
    const params = new URLSearchParams({
        studyId,
        caseId: patientId,
    });

    if (options?.sampleId) {
        params.set('sampleId', options.sampleId);
    }
    if (options?.subtype === 'H&E') {
        params.set('stainFilter', 'hne');
    } else if (options?.subtype === 'IHC') {
        params.set('stainFilter', 'ihc');
    }
    if (options?.matchLevel) {
        params.set('matchLevel', options.matchLevel);
    }
    if (options?.specimenKey) {
        params.set('specimenKey', options.specimenKey);
    }

    return `/patient/wsiHESlides?${params.toString()}`;
}

function collectHierarchySlidePresence(hierarchy: PatientHierarchy): {
    allImageIds: Set<string>;
    servableImageIds: Set<string>;
} {
    const allImageIds = new Set<string>();
    const servableImageIds = new Set<string>();

    for (
        let sampleIndex = 0;
        sampleIndex < hierarchy.samples.length;
        sampleIndex += 1
    ) {
        const sample = hierarchy.samples[sampleIndex];
        for (let partIndex = 0; partIndex < sample.parts.length; partIndex += 1) {
            const part = sample.parts[partIndex];
            for (
                let blockIndex = 0;
                blockIndex < part.blocks.length;
                blockIndex += 1
            ) {
                const block = part.blocks[blockIndex];
                for (
                    let slideIndex = 0;
                    slideIndex < block.slides.length;
                    slideIndex += 1
                ) {
                    const slide = block.slides[slideIndex];
                    if (!slide.image_id) {
                        continue;
                    }
                    allImageIds.add(slide.image_id);
                }
            }
        }
    }

    const servableEntries = getServableSlideEntriesForHierarchyReadOnly(hierarchy);
    for (let index = 0; index < servableEntries.length; index += 1) {
        servableImageIds.add(servableEntries[index].slide.image_id);
    }

    return { allImageIds, servableImageIds };
}

export function buildPathologyAssociationGroups(
    hierarchy: PatientHierarchy,
    samples: ClinicalDataBySampleId[]
): PathologyAssociationGroup[] {
    void samples;
    const cacheKey = buildPathologyAssociationsSignature(hierarchy);
    const cached = pathologyAssociationGroupsCache.get(hierarchy);
    if (
        cached &&
        cached.hierarchyRef === hierarchy &&
        cached.cacheKey === cacheKey &&
        cached.associationSignature === cacheKey
    ) {
        return cached.groups;
    }

    const groups = new Map<string, MutablePathologyAssociationGroup>();
    const hierarchySlidePresence = collectHierarchySlidePresence(hierarchy);

    let canonicalServableAssociationSnapshots: Set<string> | null = null;
    if (hierarchy.slide_associations?.length) {
        canonicalServableAssociationSnapshots = new Set<string>();
        const canonicalAssociations =
            getServableSlideAssociationsByImageIdReadOnly(
                hierarchy.slide_associations
            );
        const canonicalAssociationValues = canonicalAssociations.values();
        let currentCanonicalAssociation = canonicalAssociationValues.next();
        while (!currentCanonicalAssociation.done) {
            const association = currentCanonicalAssociation.value;
            canonicalServableAssociationSnapshots!.add(
                buildPathologyAssociationSnapshot(association)
            );
            currentCanonicalAssociation = canonicalAssociationValues.next();
        }
    }

    const slideAssociations = getPathologySlideAssociationsReadOnly(hierarchy);
    for (
        let associationIndex = 0;
        associationIndex < slideAssociations.length;
        associationIndex += 1
    ) {
        const association = slideAssociations[associationIndex];
        if (
            association.can_serve_tiles
                ? !hierarchySlidePresence.servableImageIds.has(
                      association.image_id
                  )
                : !hierarchySlidePresence.allImageIds.has(association.image_id)
        ) {
            continue;
        }
        if (
            association.can_serve_tiles &&
            canonicalServableAssociationSnapshots &&
            !canonicalServableAssociationSnapshots.has(
                buildPathologyAssociationSnapshot(association)
            )
        ) {
            continue;
        }

        const date = association.procedure_date_days;
        const timepointSource = association.timepoint_source || '';

        if (date == null) {
            continue;
        }

        for (
            let slideTypeIndex = 0;
            slideTypeIndex < PATHOLOGY_SLIDE_TYPES.length;
            slideTypeIndex += 1
        ) {
            const slideType = PATHOLOGY_SLIDE_TYPES[slideTypeIndex];
            if (!matchesPathologySlideType(association, slideType)) {
                continue;
            }

            const specimen = formatSpecimenLabel(association);
            const matchLevel = formatMatchLevel(association.match_level);
            const groupKey = [
                date,
                slideType,
                association.sample_id || '',
                association.match_level,
                association.can_serve_tiles
                    ? association.specimen_key
                    : specimen,
            ].join('::');
            const existing = groups.get(groupKey);

            if (existing) {
                if (!existing.imageIds.has(association.image_id)) {
                    existing.imageIds.add(association.image_id);
                    if (association.can_serve_tiles) {
                        existing.imageCount += 1;
                    } else {
                        existing.nonServableImageCount += 1;
                    }
                }
                existing.timepointSource = joinDistinctValues(
                    existing.timepointSource,
                    timepointSource
                );
                continue;
            }

            groups.set(groupKey, {
                date,
                imageCount: association.can_serve_tiles ? 1 : 0,
                imageIds: createSingletonStringSet(association.image_id),
                nonServableImageCount: association.can_serve_tiles ? 0 : 1,
                sampleId: association.sample_id,
                specimen,
                specimenKey: association.specimen_key,
                subtype: slideType,
                timepointSource,
                matchLevel,
            });
        }
    }

    const materializedGroups = new Array<MutablePathologyAssociationGroup>(
        groups.size
    );
    const groupValues = groups.values();
    let currentGroup = groupValues.next();
    let groupIndex = 0;
    while (!currentGroup.done) {
        materializedGroups[groupIndex] = currentGroup.value;
        groupIndex += 1;
        currentGroup = groupValues.next();
    }
    materializedGroups.sort(
        (a, b) =>
            a.date - b.date ||
            getPathologyGroupSampleDisplayValue(a).localeCompare(
                getPathologyGroupSampleDisplayValue(b)
            ) ||
            a.matchLevel.localeCompare(b.matchLevel) ||
            a.specimen.localeCompare(b.specimen) ||
            a.subtype.localeCompare(b.subtype)
    );
    const sortedGroups = freezePathologyAssociationGroups(materializedGroups);

    pathologyAssociationGroupsCache.set(hierarchy, {
        associationSignature: cacheKey,
        cacheKey,
        hierarchyRef: hierarchy,
        groups: sortedGroups,
    });

    return sortedGroups;
}

function collectPathologyAssociationIntegrityCounts(
    hierarchy: PatientHierarchy,
    groups: PathologyAssociationGroup[]
): PathologyAssociationIntegrityCounts {
    const associations = getPathologySlideAssociationsReadOnly(hierarchy);
    const rawAssociations = hierarchy.slide_associations?.length
        ? hierarchy.slide_associations
        : associations;
    const hierarchyServableDistinctImages = new Set<string>();
    const hierarchyNonServableDistinctImages = new Set<string>();
    const hierarchyBlockDistinctImages = new Set<string>();
    const hierarchyPartDistinctImages = new Set<string>();
    const hierarchyUnmatchedDistinctImages = new Set<string>();
    const servableBucketsByImageId = new Map<string, Set<string>>();
    let duplicateServableAssociationRows = 0;

    if (hierarchy.slide_associations?.length) {
        const servableAssociationSnapshots = new Set<string>();
        for (let index = 0; index < rawAssociations.length; index += 1) {
            const association = rawAssociations[index];
            if (!association.can_serve_tiles) {
                continue;
            }

            const snapshot = buildPathologyAssociationSnapshot(association);
            if (servableAssociationSnapshots.has(snapshot)) {
                duplicateServableAssociationRows += 1;
            } else {
                servableAssociationSnapshots.add(snapshot);
            }
        }
    }

    for (let associationIndex = 0; associationIndex < associations.length; associationIndex += 1) {
        const association = associations[associationIndex];
        if (association.can_serve_tiles) {
            hierarchyServableDistinctImages.add(association.image_id);
            let buckets = servableBucketsByImageId.get(association.image_id);
            if (!buckets) {
                buckets = new Set<string>();
                servableBucketsByImageId.set(association.image_id, buckets);
            }
            buckets.add(
                [
                    association.sample_id || '',
                    association.match_level,
                    association.specimen_key,
                ].join('::')
            );
            if (association.match_level === 'BLOCK') {
                hierarchyBlockDistinctImages.add(association.image_id);
            } else if (association.match_level === 'PART') {
                hierarchyPartDistinctImages.add(association.image_id);
            } else if (association.match_level === 'UNMATCHED') {
                hierarchyUnmatchedDistinctImages.add(association.image_id);
            }
            continue;
        }

        hierarchyNonServableDistinctImages.add(association.image_id);
    }

    const timelineServableDistinctImages = new Set<string>();
    const timelineNonServableDistinctImages = new Set<string>();
    for (let groupIndex = 0; groupIndex < groups.length; groupIndex += 1) {
        const group = groups[groupIndex];
        for (let imageIndex = 0; imageIndex < group.imageIds.length; imageIndex += 1) {
            const imageId = group.imageIds[imageIndex];
            if (group.imageCount > 0) {
                timelineServableDistinctImages.add(imageId);
            }
            if (group.nonServableImageCount > 0) {
                timelineNonServableDistinctImages.add(imageId);
            }
        }
    }

    let multiBucketServableImages = 0;
    const servableBucketEntries = servableBucketsByImageId.values();
    let currentBuckets = servableBucketEntries.next();
    while (!currentBuckets.done) {
        const buckets = currentBuckets.value;
        if (buckets.size > 1) {
            multiBucketServableImages += 1;
        }
        currentBuckets = servableBucketEntries.next();
    }

    return {
        hierarchyServableDistinctImages: hierarchyServableDistinctImages.size,
        hierarchyNonServableDistinctImages:
            hierarchyNonServableDistinctImages.size,
        hierarchyBlockDistinctImages: hierarchyBlockDistinctImages.size,
        hierarchyPartDistinctImages: hierarchyPartDistinctImages.size,
        hierarchyUnmatchedDistinctImages: hierarchyUnmatchedDistinctImages.size,
        timelineServableDistinctImages: timelineServableDistinctImages.size,
        timelineNonServableDistinctImages:
            timelineNonServableDistinctImages.size,
        duplicateServableAssociationRows,
        multiBucketServableImages,
    };
}

function maybeReportPathologyAssociationIntegrity(
    hierarchy: PatientHierarchy,
    groups: PathologyAssociationGroup[]
): void {
    const cached = pathologyAssociationIntegrityCache.get(hierarchy);
    if (cached && cached.groupsRef === groups) {
        if (cached.hasMismatch && !cached.reported) {
            reportWsiAssociationIntegrity(cached.counts);
            cached.reported = true;
        }
        return;
    }

    const counts = collectPathologyAssociationIntegrityCounts(
        hierarchy,
        groups
    );
    const hasMismatch =
        counts.hierarchyServableDistinctImages !==
            counts.timelineServableDistinctImages ||
        counts.hierarchyNonServableDistinctImages !==
            counts.timelineNonServableDistinctImages ||
        counts.duplicateServableAssociationRows > 0 ||
        counts.multiBucketServableImages > 0;

    const entry: CachedPathologyAssociationIntegrityEntry = {
        counts,
        groupsRef: groups,
        hasMismatch,
        reported: false,
    };
    pathologyAssociationIntegrityCache.set(hierarchy, entry);

    if (!hasMismatch) {
        return;
    }

    entry.reported = true;
    reportWsiAssociationIntegrity(counts);
}

function buildPathologyEvent(
    studyId: string,
    patientId: string,
    group: PathologyAssociationGroup
): ClinicalEvent {
    const totalCount = group.imageCount + group.nonServableImageCount;
    const sampleDisplayValue = getPathologyGroupSampleDisplayValue(group);
    const isSingleMatchedSample =
        group.sampleId &&
        !group.sampleId.includes(', ');
    const linkout =
        group.imageCount > 0
            ? buildPatientWsiTimelineUrl(studyId, patientId, {
                  sampleId: isSingleMatchedSample ? group.sampleId : null,
                  subtype: group.subtype,
                  matchLevel: group.matchLevel,
                  specimenKey: group.specimenKey,
              })
            : '';

    return {
        attributes: [
            {
                key: PATHOLOGY_EVENT_ATTRIBUTE_KEYS.sampleId,
                value: sampleDisplayValue,
            },
            {
                key: PATHOLOGY_EVENT_ATTRIBUTE_KEYS.subtype,
                value: group.subtype,
            },
            {
                key: PATHOLOGY_EVENT_ATTRIBUTE_KEYS.matchLevel,
                value: group.matchLevel,
            },
            {
                key: PATHOLOGY_EVENT_ATTRIBUTE_KEYS.specimen,
                value: group.specimen,
            },
            {
                key: PATHOLOGY_EVENT_ATTRIBUTE_KEYS.imageCount,
                value: String(group.imageCount),
            },
            {
                key: PATHOLOGY_EVENT_ATTRIBUTE_KEYS.nonServableImageCount,
                value: String(group.nonServableImageCount),
            },
            {
                key: PATHOLOGY_EVENT_ATTRIBUTE_KEYS.totalImageCount,
                value: String(totalCount),
            },
            {
                key: PATHOLOGY_EVENT_ATTRIBUTE_KEYS.timepointSource,
                value: group.timepointSource,
            },
            ...(linkout
                ? [
                      {
                          key: PATHOLOGY_EVENT_ATTRIBUTE_KEYS.linkout,
                          value: linkout,
                      },
                  ]
                : []),
        ],
        endNumberOfDaysSinceDiagnosis: group.date,
        eventType: PATHOLOGY_EVENT_TYPE,
        patientId,
        startNumberOfDaysSinceDiagnosis: group.date,
        studyId,
        uniquePatientKey: `${studyId}_${patientId}`,
        uniqueSampleKey: [
            studyId,
            patientId,
            group.subtype,
            group.date,
            group.matchLevel,
            group.specimenKey || group.specimen,
            group.sampleId || 'UNMATCHED',
        ].join('_'),
    };
}

export function buildPathologyTimelineEvents(
    hierarchy: PatientHierarchy,
    samples: ClinicalDataBySampleId[],
    studyId: string,
    patientId: string
): ClinicalEvent[] {
    void samples;
    const cacheKey = buildPathologyAssociationsSignature(hierarchy);
    const groups = buildPathologyAssociationGroups(hierarchy, samples);
    const cached = pathologyMaterializedEventsCache.get(hierarchy);
    if (
        cached &&
        cached.hierarchyRef === hierarchy &&
        cached.associationSignature === cacheKey &&
        cached.cacheKey === cacheKey &&
        cached.studyId === studyId &&
        cached.patientId === patientId &&
        cached.groupsRef === groups
    ) {
        maybeReportPathologyAssociationIntegrity(hierarchy, groups);
        return cached.events;
    }

    maybeReportPathologyAssociationIntegrity(hierarchy, groups);
    const events = new Array<ClinicalEvent>(groups.length);
    for (let index = 0; index < groups.length; index += 1) {
        events[index] = buildPathologyEvent(studyId, patientId, groups[index]);
    }
    freezeClinicalEvents(events);
    pathologyMaterializedEventsCache.set(hierarchy, {
        associationSignature: cacheKey,
        cacheKey,
        hierarchyRef: hierarchy,
        patientId,
        studyId,
        groupsRef: groups,
        events,
    });
    return events;
}

export function buildTimelineEventsSignature(events: ClinicalEvent[]): string {
    return buildClinicalEventsSignature(events, {
        includeUniqueKeys: false,
    });
}
