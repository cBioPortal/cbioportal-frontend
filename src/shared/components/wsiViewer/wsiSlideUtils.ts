import { getSlideTimepointDays, normalizeBlockLabel } from './wsiNavUtils';
import {
    PathologySlideFilter,
    PatientHierarchy,
    Sample,
    Slide,
    SlideAssociation,
} from './wsiViewerTypes';

export type WsiStainFilter = 'all' | 'hne' | 'ihc';

export interface ServableSlideEntry {
    slide: Slide;
    sample: Sample;
}

export interface ServableSlideCounts {
    all: number;
    hne: number;
    ihc: number;
}

export interface OrderedServableSlideEntry {
    slide: Slide;
    blockLabel: string | null;
}

type CachedServableSlidesEntry = {
    partsRef: Sample['parts'];
    sampleId: string;
    slideSignature: string;
    slides: Slide[];
    orderedSlides: OrderedServableSlideEntry[];
    slideCounts: ServableSlideCounts;
    blockCounts: ServableSlideCounts;
    partDescriptionCount: number;
    slideImageIds: Set<string>;
};

type CachedHierarchyEntries = {
    samplesRef: PatientHierarchy['samples'];
    sampleIds: string[];
    samplePartsRefs: Array<Sample['parts']>;
    sampleSlideSignatures: string[];
    entries?: ServableSlideEntry[];
    counts: ServableSlideCounts;
};

type CachedServableAssociationsByImageId = {
    associationSnapshotSignature: string;
    associationsRef: SlideAssociation[];
    associationsByImageId: Map<string, SlideAssociation>;
};

type CachedAssociationSnapshotSignatureEntry = {
    orderedSnapshot: string;
    signature: string;
};

type CachedPathologyFilterImageIds = {
    associationSnapshotSignature: string;
    slideAssociationsRef: PatientHierarchy['slide_associations'];
    byFilterKey: Map<string, Set<string> | undefined>;
};

type CachedFilteredHierarchy = {
    associationSnapshotSignature: string;
    samplesRef: PatientHierarchy['samples'];
    sampleIds: string[];
    samplePartsRefs: Array<Sample['parts']>;
    sampleSlideSignatures: string[];
    slideAssociationsRef: PatientHierarchy['slide_associations'];
    byImageIdsKey: Map<string, PatientHierarchy>;
};

type CachedServableSlideSnapshotSignatureEntry = {
    orderedSnapshot: string;
    signature: string;
};

const servableSlidesBySampleCache = new WeakMap<
    Sample,
    CachedServableSlidesEntry
>();
const servableSlideSnapshotSignatureCache = new WeakMap<
    Sample['parts'],
    CachedServableSlideSnapshotSignatureEntry
>();
const servableSlideEntriesByHierarchyCache = new WeakMap<
    PatientHierarchy,
    CachedHierarchyEntries
>();
const servableAssociationsByImageIdCache = new WeakMap<
    SlideAssociation[],
    CachedServableAssociationsByImageId
>();
const associationSnapshotSignatureCache = new WeakMap<
    SlideAssociation[],
    CachedAssociationSnapshotSignatureEntry
>();
const pathologyFilterImageIdsCache = new WeakMap<
    PatientHierarchy,
    CachedPathologyFilterImageIds
>();
const filteredHierarchyCache = new WeakMap<
    PatientHierarchy,
    CachedFilteredHierarchy
>();
const DUMMY_BLOCK_LABELS = new Set(['0', '']);
const MATCH_LEVEL_PRIORITY = {
    UNMATCHED: 0,
    PART: 1,
    BLOCK: 2,
};

function cloneSlideAssociationMap(
    associationsByImageId: Map<string, SlideAssociation>
): Map<string, SlideAssociation> {
    return new Map(
        [...associationsByImageId].map(([imageId, association]) => [
            imageId,
            { ...association },
        ])
    );
}

function cloneImageIdSet(imageIds: Set<string>): Set<string> {
    return new Set(imageIds);
}

function clonePatientHierarchy(hierarchy: PatientHierarchy): PatientHierarchy {
    if (typeof structuredClone === 'function') {
        return structuredClone(hierarchy) as PatientHierarchy;
    }
    return JSON.parse(JSON.stringify(hierarchy)) as PatientHierarchy;
}

function compareServableAssociationPreference(
    left: Pick<
        SlideAssociation,
        'match_level' | 'sample_id' | 'specimen_key' | 'slide_type'
    >,
    right: Pick<
        SlideAssociation,
        'match_level' | 'sample_id' | 'specimen_key' | 'slide_type'
    >
): number {
    const priorityDifference =
        MATCH_LEVEL_PRIORITY[left.match_level] -
        MATCH_LEVEL_PRIORITY[right.match_level];
    if (priorityDifference !== 0) {
        return priorityDifference;
    }

    const leftHasSampleId = left.sample_id ? 1 : 0;
    const rightHasSampleId = right.sample_id ? 1 : 0;
    if (leftHasSampleId !== rightHasSampleId) {
        return leftHasSampleId - rightHasSampleId;
    }

    return (
        (right.sample_id || '').localeCompare(left.sample_id || '') ||
        (right.specimen_key || '').localeCompare(left.specimen_key || '') ||
        (right.slide_type || '').localeCompare(left.slide_type || '')
    );
}

function hierarchySampleSnapshotIsCurrent(
    hierarchy: PatientHierarchy,
    samplesRef: PatientHierarchy['samples'],
    sampleIds: string[],
    samplePartsRefs: Array<Sample['parts']>,
    sampleSlideSignatures: string[]
): boolean {
    return (
        samplesRef === hierarchy.samples &&
        sampleIds.length === hierarchy.samples.length &&
        sampleIds.every(
            (sampleId, index) =>
                sampleId === hierarchy.samples[index]?.sample_id
        ) &&
        samplePartsRefs.every(
            (partsRef, index) => partsRef === hierarchy.samples[index]?.parts
        ) &&
        sampleSlideSignatures.every(
            (slideSignature, index) =>
                slideSignature ===
                buildServableSlideSnapshotSignature(
                    hierarchy.samples[index]?.parts || []
                )
        )
    );
}

function hierarchySamplesCacheIsCurrent(
    hierarchy: PatientHierarchy,
    cached: CachedHierarchyEntries | undefined
): cached is CachedHierarchyEntries {
    return !!(
        cached &&
        hierarchySampleSnapshotIsCurrent(
            hierarchy,
            cached.samplesRef,
            cached.sampleIds,
            cached.samplePartsRefs,
            cached.sampleSlideSignatures
        )
    );
}

function buildSlideAssociationSnapshot(
    association: Pick<
        SlideAssociation,
        | 'image_id'
        | 'sample_id'
        | 'match_level'
        | 'specimen_key'
        | 'slide_type'
        | 'can_serve_tiles'
    >
): string {
    return [
        association.image_id || '',
        association.sample_id || '',
        association.match_level || '',
        association.specimen_key || '',
        association.slide_type || '',
        association.can_serve_tiles ? '1' : '0',
    ].join('::');
}

function cacheAssociationSnapshotSignature(
    associations: SlideAssociation[],
    orderedSnapshot: string,
    snapshots: string[]
): string {
    const sortedSnapshots = snapshots.slice();
    sortedSnapshots.sort((left, right) => left.localeCompare(right));
    let signature = '';
    for (let index = 0; index < sortedSnapshots.length; index += 1) {
        if (index > 0) {
            signature += '|';
        }
        signature += sortedSnapshots[index];
    }

    associationSnapshotSignatureCache.set(associations, {
        orderedSnapshot,
        signature,
    });

    return signature;
}

function buildSlideAssociationSnapshotSignature(
    associations: SlideAssociation[] | undefined
): string {
    if (!associations?.length) {
        return '';
    }

    const orderedSnapshots = new Array<string>(associations.length);
    let orderedSnapshot = '';
    for (let index = 0; index < associations.length; index += 1) {
        const snapshot = buildSlideAssociationSnapshot(associations[index]);
        orderedSnapshots[index] = snapshot;
        if (index > 0) {
            orderedSnapshot += '|';
        }
        orderedSnapshot += snapshot;
    }
    const cached = associationSnapshotSignatureCache.get(associations);
    if (cached && cached.orderedSnapshot === orderedSnapshot) {
        return cached.signature;
    }

    return cacheAssociationSnapshotSignature(
        associations,
        orderedSnapshot,
        orderedSnapshots
    );
}

function associationSnapshotsAreCurrent(
    associations: SlideAssociation[] | undefined,
    associationsRef: SlideAssociation[] | undefined,
    snapshotSignature: string
): boolean {
    if (!associations) {
        return !associationsRef && snapshotSignature.length === 0;
    }

    return (
        associationsRef === associations &&
        snapshotSignature ===
            buildSlideAssociationSnapshotSignature(associations)
    );
}

export function getServableSlideAssociationsByImageIdReadOnly(
    associations: SlideAssociation[] | undefined
): Map<string, SlideAssociation> {
    if (!associations) {
        return new Map<string, SlideAssociation>();
    }

    const cached = servableAssociationsByImageIdCache.get(associations);
    if (
        cached &&
        associationSnapshotsAreCurrent(
            associations,
            cached.associationsRef,
            cached.associationSnapshotSignature
        )
    ) {
        return cached.associationsByImageId;
    }

    const result = new Map<string, SlideAssociation>();
    const associationSnapshots: string[] = [];
    for (let index = 0; index < associations.length; index += 1) {
        const association = associations[index];
        associationSnapshots.push(buildSlideAssociationSnapshot(association));
        if (!association.can_serve_tiles) {
            continue;
        }

        const existing = result.get(association.image_id);
        if (
            !existing ||
            compareServableAssociationPreference(association, existing) > 0
        ) {
            result.set(association.image_id, association);
        }
    }

    servableAssociationsByImageIdCache.set(associations, {
        associationSnapshotSignature: cacheAssociationSnapshotSignature(
            associations,
            associationSnapshots.join('|'),
            associationSnapshots
        ),
        associationsRef: associations,
        associationsByImageId: result,
    });

    return result;
}

export function getServableSlideAssociationsByImageId(
    associations: SlideAssociation[] | undefined
): Map<string, SlideAssociation> {
    return cloneSlideAssociationMap(
        getServableSlideAssociationsByImageIdReadOnly(associations)
    );
}

function uniqueSlideKey(
    sampleId: string,
    slide: Pick<Slide, 'image_id'>
): string {
    return `${sampleId}::${slide.image_id}`;
}

function buildServableSlideSnapshot(
    slide: Pick<
        Slide,
        | 'image_id'
        | 'can_serve_tiles'
        | 'is_hne'
        | 'is_ihc'
        | 'block_number'
        | 'block_label'
        | 'stain_name'
        | 'slide_timepoint_days'
    >
): string {
    return [
        slide.image_id || '',
        slide.can_serve_tiles ? '1' : '0',
        slide.is_hne ? '1' : '0',
        slide.is_ihc ? '1' : '0',
        slide.block_number || '',
        slide.block_label || '',
        slide.stain_name || '',
        slide.slide_timepoint_days ?? '',
    ].join('::');
}

function cacheServableSlideSnapshotSignature(
    parts: Sample['parts'],
    orderedSnapshot: string,
    snapshots: string[]
): string {
    const sortedSnapshots = snapshots.slice();
    sortedSnapshots.sort((left, right) => left.localeCompare(right));
    let signature = '';
    for (let index = 0; index < sortedSnapshots.length; index += 1) {
        if (index > 0) {
            signature += '|';
        }
        signature += sortedSnapshots[index];
    }

    servableSlideSnapshotSignatureCache.set(parts, {
        orderedSnapshot,
        signature,
    });

    return signature;
}

function buildServableSlideSnapshotSignature(parts: Sample['parts']): string {
    const snapshots: string[] = [];

    for (const part of parts) {
        for (const block of part.blocks) {
            for (const slide of block.slides) {
                snapshots.push(buildServableSlideSnapshot(slide));
            }
        }
    }

    const orderedSnapshot = snapshots.join('|');
    const cached = servableSlideSnapshotSignatureCache.get(parts);
    if (cached && cached.orderedSnapshot === orderedSnapshot) {
        return cached.signature;
    }

    return cacheServableSlideSnapshotSignature(
        parts,
        orderedSnapshot,
        snapshots
    );
}

export function isServableDiagnosticSlide(
    slide: Pick<Slide, 'can_serve_tiles' | 'image_id' | 'is_hne' | 'is_ihc'>
): boolean {
    return !!(slide.can_serve_tiles && slide.image_id);
}

export function matchesWsiStainFilter(
    slide: Pick<Slide, 'is_hne' | 'is_ihc'>,
    stainFilter: WsiStainFilter
): boolean {
    return (
        stainFilter === 'all' ||
        (stainFilter === 'hne' && slide.is_hne) ||
        (stainFilter === 'ihc' && slide.is_ihc)
    );
}

export function getServableSlidesForSampleReadOnly(sample: Sample): Slide[] {
    const cached = servableSlidesBySampleCache.get(sample);
    if (
        cached &&
        cached.partsRef === sample.parts &&
        cached.sampleId === sample.sample_id
    ) {
        const slideSignature = buildServableSlideSnapshotSignature(
            sample.parts
        );
        if (cached.slideSignature === slideSignature) {
            return cached.slides;
        }
    }

    const seen = new Set<string>();
    const deduped: Slide[] = [];
    const orderedSlides: OrderedServableSlideEntry[] = [];
    const slideCounts: ServableSlideCounts = { all: 0, hne: 0, ihc: 0 };
    const seenBlocks = {
        all: new Set<string>(),
        hne: new Set<string>(),
        ihc: new Set<string>(),
    };
    const partDescriptions = new Set<string>();
    const slideImageIds = new Set<string>();
    const slideSnapshots: string[] = [];
    for (const part of sample.parts) {
        for (const block of part.blocks) {
            const normalizedBlockLabel = normalizeBlockLabel(
                block.block_label,
                block.block_number
            );
            const blockLabel = DUMMY_BLOCK_LABELS.has(normalizedBlockLabel)
                ? null
                : normalizedBlockLabel;
            for (const slide of block.slides) {
                slideSnapshots.push(buildServableSlideSnapshot(slide));
                if (!isServableDiagnosticSlide(slide)) continue;
                const key = uniqueSlideKey(sample.sample_id, slide);
                if (seen.has(key)) continue;
                seen.add(key);
                deduped.push(slide);
                orderedSlides.push({ slide, blockLabel });
                slideCounts.all += 1;
                slideImageIds.add(slide.image_id);
                if (slide.part_description) {
                    partDescriptions.add(slide.part_description);
                }
                if (slide.is_hne) {
                    slideCounts.hne += 1;
                }
                if (slide.is_ihc) {
                    slideCounts.ihc += 1;
                }
                const blockKey = uniqueBlockKey(sample.sample_id, slide);
                seenBlocks.all.add(blockKey);
                if (slide.is_hne) {
                    seenBlocks.hne.add(blockKey);
                }
                if (slide.is_ihc) {
                    seenBlocks.ihc.add(blockKey);
                }
            }
        }
    }
    orderedSlides.sort((a, b) => {
        const aTimepoint = getSlideTimepointDays(a.slide);
        const bTimepoint = getSlideTimepointDays(b.slide);
        if (
            aTimepoint != null &&
            bTimepoint != null &&
            aTimepoint !== bTimepoint
        ) {
            return aTimepoint - bTimepoint;
        }
        if ((aTimepoint != null) !== (bTimepoint != null)) {
            return aTimepoint != null ? -1 : 1;
        }

        const aBlockNumber = Number(a.slide.block_number) || 0;
        const bBlockNumber = Number(b.slide.block_number) || 0;
        if (aBlockNumber !== bBlockNumber) {
            return aBlockNumber - bBlockNumber;
        }
        return (a.slide.stain_name || '').localeCompare(
            b.slide.stain_name || ''
        );
    });
    const slideSignature = cacheServableSlideSnapshotSignature(
        sample.parts,
        slideSnapshots.join('|'),
        slideSnapshots
    );

    servableSlidesBySampleCache.set(sample, {
        partsRef: sample.parts,
        sampleId: sample.sample_id,
        slideSignature,
        slides: deduped,
        orderedSlides,
        slideCounts,
        blockCounts: {
            all: seenBlocks.all.size,
            hne: seenBlocks.hne.size,
            ihc: seenBlocks.ihc.size,
        },
        partDescriptionCount: partDescriptions.size,
        slideImageIds,
    });
    return deduped;
}

export function getServableSlidesForSample(sample: Sample): Slide[] {
    return getServableSlidesForSampleReadOnly(sample).slice();
}

function getCachedServableSlideData(sample: Sample): CachedServableSlidesEntry {
    getServableSlidesForSampleReadOnly(sample);
    return servableSlidesBySampleCache.get(sample)!;
}

export function getServableSlideEntriesForHierarchyReadOnly(
    hierarchy: PatientHierarchy
): ServableSlideEntry[] {
    const cached = servableSlideEntriesByHierarchyCache.get(hierarchy);
    const cacheIsCurrent = hierarchySamplesCacheIsCurrent(hierarchy, cached);
    if (cacheIsCurrent && cached.entries) {
        return cached.entries;
    }

    const result: ServableSlideEntry[] = [];
    const sampleDataEntries: Array<{
        sample: Sample;
        sampleData: CachedServableSlidesEntry;
    }> = new Array(hierarchy.samples.length);
    const counts = cacheIsCurrent ? cached.counts : { all: 0, hne: 0, ihc: 0 };
    for (let index = 0; index < hierarchy.samples.length; index += 1) {
        const sample = hierarchy.samples[index];
        const sampleData = getCachedServableSlideData(sample);
        sampleDataEntries[index] = { sample, sampleData };
        if (!cacheIsCurrent) {
            const sampleCounts = sampleData.slideCounts;
            counts.all += sampleCounts.all;
            counts.hne += sampleCounts.hne;
            counts.ihc += sampleCounts.ihc;
        }
        for (const slide of sampleData.slides) {
            result.push({ slide, sample });
        }
    }

    const sampleIds = new Array<string>(sampleDataEntries.length);
    const samplePartsRefs = new Array<Sample['parts']>(
        sampleDataEntries.length
    );
    const sampleSlideSignatures = new Array<string>(sampleDataEntries.length);
    for (let index = 0; index < sampleDataEntries.length; index += 1) {
        const entry = sampleDataEntries[index];
        sampleIds[index] = entry.sample.sample_id;
        samplePartsRefs[index] = entry.sample.parts;
        sampleSlideSignatures[index] = entry.sampleData.slideSignature;
    }

    servableSlideEntriesByHierarchyCache.set(hierarchy, {
        samplesRef: hierarchy.samples,
        sampleIds,
        samplePartsRefs,
        sampleSlideSignatures,
        entries: result,
        counts,
    });
    return result;
}

export function getServableSlideEntriesForHierarchy(
    hierarchy: PatientHierarchy
): ServableSlideEntry[] {
    return getServableSlideEntriesForHierarchyReadOnly(hierarchy).map(
        entry => ({
            ...entry,
        })
    );
}

export function getServableSlideCountsForHierarchyReadOnly(
    hierarchy: PatientHierarchy
): ServableSlideCounts {
    const cached = servableSlideEntriesByHierarchyCache.get(hierarchy);
    if (hierarchySamplesCacheIsCurrent(hierarchy, cached)) {
        return cached.counts;
    }

    const counts: ServableSlideCounts = { all: 0, hne: 0, ihc: 0 };
    const sampleDataEntries: Array<{
        sample: Sample;
        sampleData: CachedServableSlidesEntry;
    }> = new Array(hierarchy.samples.length);

    for (let index = 0; index < hierarchy.samples.length; index += 1) {
        const sample = hierarchy.samples[index];
        const sampleData = getCachedServableSlideData(sample);
        sampleDataEntries[index] = { sample, sampleData };
        const sampleCounts = sampleData.slideCounts;
        counts.all += sampleCounts.all;
        counts.hne += sampleCounts.hne;
        counts.ihc += sampleCounts.ihc;
    }

    const sampleIds = new Array<string>(sampleDataEntries.length);
    const samplePartsRefs = new Array<Sample['parts']>(
        sampleDataEntries.length
    );
    const sampleSlideSignatures = new Array<string>(sampleDataEntries.length);
    for (let index = 0; index < sampleDataEntries.length; index += 1) {
        const entry = sampleDataEntries[index];
        sampleIds[index] = entry.sample.sample_id;
        samplePartsRefs[index] = entry.sample.parts;
        sampleSlideSignatures[index] = entry.sampleData.slideSignature;
    }

    servableSlideEntriesByHierarchyCache.set(hierarchy, {
        samplesRef: hierarchy.samples,
        sampleIds,
        samplePartsRefs,
        sampleSlideSignatures,
        counts,
    });

    return counts;
}

export function getServableSlideCountsForHierarchy(
    hierarchy: PatientHierarchy
): ServableSlideCounts {
    return { ...getServableSlideCountsForHierarchyReadOnly(hierarchy) };
}

export function countServableSlidesForSample(
    sample: Sample,
    stainFilter: Exclude<WsiStainFilter, 'all'> | 'all' = 'all'
): number {
    return getCachedServableSlideData(sample).slideCounts[stainFilter];
}

export function getOrderedServableSlidesForSampleReadOnly(
    sample: Sample
): OrderedServableSlideEntry[] {
    return getCachedServableSlideData(sample).orderedSlides;
}

export function getOrderedServableSlidesForSample(
    sample: Sample
): OrderedServableSlideEntry[] {
    return getOrderedServableSlidesForSampleReadOnly(sample).map(entry => ({
        ...entry,
    }));
}

export function sampleHasMultiplePartDescriptions(sample: Sample): boolean {
    return getCachedServableSlideData(sample).partDescriptionCount > 1;
}

export function sampleHasServableSlide(
    sample: Sample,
    slideId: string | null | undefined
): boolean {
    return (
        !!slideId &&
        getCachedServableSlideData(sample).slideImageIds.has(slideId)
    );
}

function uniqueBlockKey(
    sampleId: string,
    slide: Pick<Slide, 'block_number' | 'block_label'>
): string {
    return `${sampleId}::${slide.block_number || ''}::${slide.block_label ||
        ''}`;
}

export function countServableBlocksForSample(
    sample: Sample,
    stainFilter: Exclude<WsiStainFilter, 'all'> | 'all' = 'all'
): number {
    return getCachedServableSlideData(sample).blockCounts[stainFilter];
}

function normalizeMatchLevel(
    value: string | null | undefined
): string | undefined {
    if (!value) {
        return undefined;
    }
    const normalized = value.toUpperCase();
    if (normalized === 'UNMATCHED') {
        return 'UNMATCHED';
    }
    if (normalized === 'PART' || normalized === 'BLOCK') {
        return normalized;
    }
    return undefined;
}

function buildPathologyFilterCacheKey(
    filter: PathologySlideFilter
): string | undefined {
    const normalizedMatchLevel = normalizeMatchLevel(filter.matchLevel);
    const hasFilter =
        !!filter.sampleId || !!normalizedMatchLevel || !!filter.specimenKey;
    if (!hasFilter) {
        return undefined;
    }

    return [
        filter.sampleId || '',
        normalizedMatchLevel || '',
        filter.specimenKey || '',
    ].join('::');
}

export function getServableSlideIdsForPathologyFilterReadOnly(
    hierarchy: PatientHierarchy,
    filter: PathologySlideFilter
): Set<string> | undefined {
    if (!hierarchy.slide_associations?.length) {
        return undefined;
    }

    const filterKey = buildPathologyFilterCacheKey(filter);
    if (!filterKey) {
        return undefined;
    }
    const cached = pathologyFilterImageIdsCache.get(hierarchy);
    const cacheIsCurrent =
        cached &&
        associationSnapshotsAreCurrent(
            hierarchy.slide_associations,
            cached.slideAssociationsRef,
            cached.associationSnapshotSignature
        );
    const cachedImageIds = cacheIsCurrent
        ? cached?.byFilterKey.get(filterKey)
        : undefined;
    if (cacheIsCurrent && cached.byFilterKey.has(filterKey)) {
        return cachedImageIds;
    }

    const normalizedMatchLevel = normalizeMatchLevel(filter.matchLevel);

    const matchingImageIds = new Set<string>();
    hierarchy.slide_associations.forEach(association => {
        if (!association.can_serve_tiles) {
            return;
        }
        if (filter.sampleId && association.sample_id !== filter.sampleId) {
            return;
        }
        if (
            normalizedMatchLevel &&
            association.match_level !== normalizedMatchLevel
        ) {
            return;
        }
        if (
            filter.specimenKey &&
            association.specimen_key !== filter.specimenKey
        ) {
            return;
        }
        matchingImageIds.add(association.image_id);
    });

    const nextByFilterKey =
        cacheIsCurrent && cached ? cached.byFilterKey : new Map();
    nextByFilterKey.set(filterKey, matchingImageIds);
    pathologyFilterImageIdsCache.set(hierarchy, {
        associationSnapshotSignature: buildSlideAssociationSnapshotSignature(
            hierarchy.slide_associations
        ),
        slideAssociationsRef: hierarchy.slide_associations,
        byFilterKey: nextByFilterKey,
    });

    return matchingImageIds;
}

export function getServableSlideIdsForPathologyFilter(
    hierarchy: PatientHierarchy,
    filter: PathologySlideFilter
): Set<string> | undefined {
    const imageIds = getServableSlideIdsForPathologyFilterReadOnly(
        hierarchy,
        filter
    );
    return imageIds ? cloneImageIdSet(imageIds) : undefined;
}

function buildAllowedImageIdsKey(allowedImageIds: Set<string>): string {
    return [...allowedImageIds].sort().join('::');
}

export function filterHierarchyToServableSlideIdsReadOnly(
    hierarchy: PatientHierarchy,
    allowedImageIds: Set<string>
): PatientHierarchy {
    const imageIdsKey = buildAllowedImageIdsKey(allowedImageIds);
    const snapshotSignature = buildSlideAssociationSnapshotSignature(
        hierarchy.slide_associations
    );
    const cached = filteredHierarchyCache.get(hierarchy);
    const cacheIsCurrent =
        cached &&
        hierarchySampleSnapshotIsCurrent(
            hierarchy,
            cached.samplesRef,
            cached.sampleIds,
            cached.samplePartsRefs,
            cached.sampleSlideSignatures
        ) &&
        cached.associationSnapshotSignature === snapshotSignature;
    if (cacheIsCurrent) {
        const cachedHierarchy = cached.byImageIdsKey.get(imageIdsKey);
        if (cachedHierarchy) {
            return cachedHierarchy;
        }
    }

    const filteredSamples = hierarchy.samples
        .map(sample => ({
            ...sample,
            parts: sample.parts
                .map(part => ({
                    ...part,
                    blocks: part.blocks
                        .map(block => ({
                            ...block,
                            slides: block.slides.filter(
                                slide =>
                                    slide.can_serve_tiles &&
                                    allowedImageIds.has(slide.image_id)
                            ),
                        }))
                        .filter(block => block.slides.length > 0),
                }))
                .filter(part => part.blocks.length > 0),
        }))
        .filter(sample => sample.parts.length > 0);
    const filteredHierarchy = {
        ...hierarchy,
        samples: filteredSamples,
        slide_associations: hierarchy.slide_associations?.filter(
            association =>
                association.can_serve_tiles &&
                allowedImageIds.has(association.image_id)
        ),
    };
    const sampleIds = hierarchy.samples.map(sample => sample.sample_id);
    const samplePartsRefs = hierarchy.samples.map(sample => sample.parts);
    const sampleSlideSignatures = hierarchy.samples.map(sample =>
        buildServableSlideSnapshotSignature(sample.parts)
    );
    const byImageIdsKey =
        cacheIsCurrent && cached ? cached.byImageIdsKey : new Map();
    byImageIdsKey.set(imageIdsKey, filteredHierarchy);
    filteredHierarchyCache.set(hierarchy, {
        associationSnapshotSignature: snapshotSignature,
        samplesRef: hierarchy.samples,
        sampleIds,
        samplePartsRefs,
        sampleSlideSignatures,
        slideAssociationsRef: hierarchy.slide_associations,
        byImageIdsKey,
    });
    return filteredHierarchy;
}

export function filterHierarchyToServableSlideIds(
    hierarchy: PatientHierarchy,
    allowedImageIds: Set<string>
): PatientHierarchy {
    return clonePatientHierarchy(
        filterHierarchyToServableSlideIdsReadOnly(hierarchy, allowedImageIds)
    );
}
