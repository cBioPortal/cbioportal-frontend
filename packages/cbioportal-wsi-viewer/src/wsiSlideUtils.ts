import {
    formatDaysSinceDiagnosis,
    getSlideTimepointDays,
    normalizeBlockLabel,
    timepointText,
} from './wsiNavUtils';
import {
    PathologySlideFilter,
    PatientHierarchy,
    Sample,
    Slide,
    SlideAssociation,
    WsiTimepointSelection,
} from './wsiViewerTypes';

export type WsiStainFilter = 'all' | 'hne' | 'ihc' | 'other' | 'unknown';

export type WsiTimepointOption = {
    days: WsiTimepointSelection;
    label: string;
};

export function getServableSlideTimepointDays(
    slide: Pick<Slide, 'slide_timepoint_days'>,
    _association?: Pick<SlideAssociation, 'procedure_date_days'>
): number | undefined {
    return getSlideTimepointDays(slide);
}

export function getServableSlideTimepointSource(
    slide: Pick<Slide, 'slide_timepoint_source'>,
    _association?: Pick<SlideAssociation, 'timepoint_source'>
): string | undefined {
    return slide.slide_timepoint_source || undefined;
}

export function getWsiTimepointOptions(
    entries: Array<{
        slide: Pick<Slide, 'slide_timepoint_days' | 'slide_timepoint_source'>;
        association?: Pick<
            SlideAssociation,
            'procedure_date_days' | 'timepoint_source'
        >;
    }>
): WsiTimepointOption[] {
    const optionsByDays = new Map<number, WsiTimepointOption>();
    let hasUndated = false;
    entries.forEach(({ slide, association }) => {
        const days = getServableSlideTimepointDays(slide, association);
        if (days == null) {
            hasUndated = true;
            return;
        }
        if (optionsByDays.has(days)) {
            return;
        }
        const source = getServableSlideTimepointSource(slide, association);
        optionsByDays.set(days, {
            days,
            label:
                timepointText(days, source) || formatDaysSinceDiagnosis(days),
        });
    });

    const options = Array.from(optionsByDays.values()).sort(
        (left, right) => Number(left.days) - Number(right.days)
    );
    if (hasUndated) {
        options.push({ days: 'undated', label: 'Undated' });
    }
    return options;
}

export function matchesWsiTimepointFilter(
    slide: Pick<Slide, 'slide_timepoint_days' | 'slide_timepoint_source'>,
    association:
        | Pick<SlideAssociation, 'procedure_date_days' | 'timepoint_source'>
        | undefined,
    timepointDays?: WsiTimepointSelection
): boolean {
    return (
        timepointDays == null ||
        (timepointDays === 'undated'
            ? getServableSlideTimepointDays(slide, association) == null
            : getServableSlideTimepointDays(slide, association) ===
              timepointDays)
    );
}

export interface ServableSlideEntry {
    slide: Slide;
    sample: Sample;
}

export interface ServableSlideCounts {
    all: number;
    hne: number;
    ihc: number;
    other: number;
    unknown: number;
}

export interface OrderedServableSlideEntry {
    slide: Slide;
    blockLabel: string | null;
}

type SampleSlideData = {
    slides: Slide[];
    orderedSlides: OrderedServableSlideEntry[];
    slideCounts: ServableSlideCounts;
    blockCounts: ServableSlideCounts;
    partDescriptionCount: number;
    slideImageIds: Set<string>;
};

type HierarchySlideData = {
    entries: ServableSlideEntry[];
    counts: ServableSlideCounts;
};

// A normalized hierarchy is never mutated, so everything derived from it is
// memoized by object identity.
const sampleSlideDataCache = new WeakMap<Sample, SampleSlideData>();
const hierarchySlideDataCache = new WeakMap<
    PatientHierarchy,
    HierarchySlideData
>();
const servableAssociationsByImageIdCache = new WeakMap<
    SlideAssociation[],
    Map<string, SlideAssociation>
>();
const pathologyFilterImageIdsCache = new WeakMap<
    SlideAssociation[],
    Map<string, Set<string>>
>();
const DUMMY_BLOCK_LABELS = new Set(['0', '']);
const MATCH_LEVEL_PRIORITY = {
    UNMATCHED: 0,
    PART: 1,
    BLOCK: 2,
};

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

export function getServableSlideAssociationsByImageIdReadOnly(
    associations: SlideAssociation[] | undefined
): Map<string, SlideAssociation> {
    if (!associations) {
        return new Map<string, SlideAssociation>();
    }

    const cached = servableAssociationsByImageIdCache.get(associations);
    if (cached) {
        return cached;
    }

    const result = new Map<string, SlideAssociation>();
    for (const association of associations) {
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

    servableAssociationsByImageIdCache.set(associations, result);
    return result;
}

function uniqueSlideKey(
    sampleId: string,
    slide: Pick<Slide, 'image_id'>
): string {
    return `${sampleId}::${slide.image_id}`;
}

export function isServableDiagnosticSlide(
    slide: Pick<Slide, 'can_serve_tiles' | 'image_id' | 'is_hne' | 'is_ihc'>
): boolean {
    return !!(slide.can_serve_tiles && slide.image_id);
}

export function matchesWsiStainFilter(
    slide: Pick<Slide, 'is_hne' | 'is_ihc' | 'slide_type'>,
    stainFilter: WsiStainFilter
): boolean {
    const slideType = slide.slide_type;
    return (
        stainFilter === 'all' ||
        (stainFilter === 'hne' && slide.is_hne) ||
        (stainFilter === 'ihc' && slide.is_ihc) ||
        (stainFilter === 'other' &&
            !slide.is_hne &&
            !slide.is_ihc &&
            slideType === 'Other') ||
        (stainFilter === 'unknown' &&
            !slide.is_hne &&
            !slide.is_ihc &&
            slideType === 'Unknown')
    );
}

/**
 * Picks the slides whose metadata is worth fetching ahead of a click: the
 * selected sample's slides, matching stain first, capped at `limit`. Each
 * metadata fetch costs a slide-access request, so other samples load on demand.
 */
export function selectMetadataPrefetchSlides(
    entries: ReadonlyArray<ServableSlideEntry>,
    options: {
        selectedSampleId: string | undefined;
        stainFilter: WsiStainFilter;
        limit: number;
        skipImageId?: string;
        isCached?: (imageId: string) => boolean;
    }
): Slide[] {
    const matching: Slide[] = [];
    const otherStain: Slide[] = [];
    const seen = new Set<string>();
    for (const { slide, sample } of entries) {
        const imageId = slide.image_id;
        if (
            sample.sample_id !== options.selectedSampleId ||
            imageId === options.skipImageId ||
            seen.has(imageId) ||
            options.isCached?.(imageId)
        ) {
            continue;
        }
        seen.add(imageId);
        (matchesWsiStainFilter(slide, options.stainFilter)
            ? matching
            : otherStain
        ).push(slide);
    }
    return matching.concat(otherStain).slice(0, options.limit);
}

function buildSampleSlideData(sample: Sample): SampleSlideData {
    const seen = new Set<string>();
    const deduped: Slide[] = [];
    const orderedSlides: OrderedServableSlideEntry[] = [];
    const slideCounts: ServableSlideCounts = {
        all: 0,
        hne: 0,
        ihc: 0,
        other: 0,
        unknown: 0,
    };
    const seenBlocks = {
        all: new Set<string>(),
        hne: new Set<string>(),
        ihc: new Set<string>(),
        other: new Set<string>(),
        unknown: new Set<string>(),
    };
    const partDescriptions = new Set<string>();
    const slideImageIds = new Set<string>();
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
                if (
                    !slide.is_hne &&
                    !slide.is_ihc &&
                    slide.slide_type === 'Other'
                ) {
                    slideCounts.other += 1;
                }
                if (
                    !slide.is_hne &&
                    !slide.is_ihc &&
                    slide.slide_type === 'Unknown'
                ) {
                    slideCounts.unknown += 1;
                }
                const blockKey = uniqueBlockKey(sample.sample_id, slide);
                seenBlocks.all.add(blockKey);
                if (slide.is_hne) {
                    seenBlocks.hne.add(blockKey);
                }
                if (slide.is_ihc) {
                    seenBlocks.ihc.add(blockKey);
                }
                if (
                    !slide.is_hne &&
                    !slide.is_ihc &&
                    slide.slide_type === 'Other'
                ) {
                    seenBlocks.other.add(blockKey);
                }
                if (
                    !slide.is_hne &&
                    !slide.is_ihc &&
                    slide.slide_type === 'Unknown'
                ) {
                    seenBlocks.unknown.add(blockKey);
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
    return {
        slides: deduped,
        orderedSlides,
        slideCounts,
        blockCounts: {
            all: seenBlocks.all.size,
            hne: seenBlocks.hne.size,
            ihc: seenBlocks.ihc.size,
            other: seenBlocks.other.size,
            unknown: seenBlocks.unknown.size,
        },
        partDescriptionCount: partDescriptions.size,
        slideImageIds,
    };
}

function getCachedServableSlideData(sample: Sample): SampleSlideData {
    let data = sampleSlideDataCache.get(sample);
    if (!data) {
        data = buildSampleSlideData(sample);
        sampleSlideDataCache.set(sample, data);
    }
    return data;
}

export function getServableSlidesForSampleReadOnly(sample: Sample): Slide[] {
    return getCachedServableSlideData(sample).slides;
}

function getHierarchySlideData(
    hierarchy: PatientHierarchy
): HierarchySlideData {
    const cached = hierarchySlideDataCache.get(hierarchy);
    if (cached) {
        return cached;
    }

    const entries: ServableSlideEntry[] = [];
    const counts: ServableSlideCounts = {
        all: 0,
        hne: 0,
        ihc: 0,
        other: 0,
        unknown: 0,
    };
    for (const sample of hierarchy.samples) {
        const sampleData = getCachedServableSlideData(sample);
        counts.all += sampleData.slideCounts.all;
        counts.hne += sampleData.slideCounts.hne;
        counts.ihc += sampleData.slideCounts.ihc;
        counts.other += sampleData.slideCounts.other;
        counts.unknown += sampleData.slideCounts.unknown;
        for (const slide of sampleData.slides) {
            entries.push({ slide, sample });
        }
    }

    const data = { entries, counts };
    hierarchySlideDataCache.set(hierarchy, data);
    return data;
}

export function getServableSlideEntriesForHierarchyReadOnly(
    hierarchy: PatientHierarchy
): ServableSlideEntry[] {
    return getHierarchySlideData(hierarchy).entries;
}

export function getServableSlideCountsForHierarchyReadOnly(
    hierarchy: PatientHierarchy
): ServableSlideCounts {
    return getHierarchySlideData(hierarchy).counts;
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

function startsWithNumericOrLabelToken(value: string, token: string): boolean {
    if (!value || !token) {
        return false;
    }
    const normalizedValue = value.toLowerCase();
    const normalizedToken = token.toLowerCase();
    if (normalizedValue === normalizedToken) {
        return true;
    }
    if (!normalizedValue.startsWith(normalizedToken)) {
        return false;
    }
    return !/^\d/.test(normalizedValue.slice(normalizedToken.length));
}

function matchesPartToken(
    association: SlideAssociation,
    requestedPart: string
): boolean {
    const normalizedRequestedPart = requestedPart.replace(/^part:/i, '');
    const associationPart = association.part_number || '';
    const normalizedAssociationPart = associationPart.replace(/^part:/i, '');
    return (
        associationPart === requestedPart ||
        associationPart === normalizedRequestedPart ||
        normalizedAssociationPart === normalizedRequestedPart
    );
}

/**
 * Preserve compatibility with timeline links generated before the hierarchy
 * API exposed canonical specimen_key values. New links use the exact key.
 */
function matchesLegacySpecimenKey(
    association: SlideAssociation,
    specimenKey: string
): boolean {
    const parts = specimenKey.split('::');
    const matchLevel = parts[0]?.toUpperCase();
    if (matchLevel !== association.match_level) {
        return false;
    }

    if (matchLevel === 'PART') {
        if (parts.length === 2 || parts.length === 3) {
            return (
                !!association.part_number &&
                matchesPartToken(association, parts[1])
            );
        }
        return false;
    }
    if (matchLevel !== 'BLOCK' && matchLevel !== 'UNMATCHED') {
        return false;
    }
    if (parts.length !== 3 || parts[1].includes(':')) {
        return false;
    }
    const requestedPart = parts[1];
    if (
        requestedPart !== '?' &&
        association.part_number &&
        association.part_number !== requestedPart
    ) {
        return false;
    }

    const requestedBlock = parts[2];
    if (requestedBlock === '?') {
        return true;
    }
    const blockNumber = association.block_number || '';
    const blockLabel = association.block_label || '';
    const blockNumberSuffix = blockNumber.split('/').pop() || blockNumber;
    return (
        startsWithNumericOrLabelToken(blockLabel, requestedBlock) ||
        startsWithNumericOrLabelToken(blockNumberSuffix, requestedBlock)
    );
}

function matchesPathologySpecimenKey(
    association: SlideAssociation,
    specimenKey: string
): boolean {
    return (
        association.specimen_key === specimenKey ||
        matchesLegacySpecimenKey(association, specimenKey)
    );
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
    let byFilterKey = pathologyFilterImageIdsCache.get(
        hierarchy.slide_associations
    );
    if (!byFilterKey) {
        byFilterKey = new Map();
        pathologyFilterImageIdsCache.set(
            hierarchy.slide_associations,
            byFilterKey
        );
    }
    const cachedImageIds = byFilterKey.get(filterKey);
    if (cachedImageIds) {
        return cachedImageIds;
    }

    const normalizedMatchLevel = normalizeMatchLevel(filter.matchLevel);

    const matchesFilter = (
        association: SlideAssociation,
        includeSampleId: boolean
    ): boolean => {
        if (!association.can_serve_tiles) {
            return false;
        }
        if (
            includeSampleId &&
            filter.sampleId &&
            association.sample_id !== filter.sampleId
        ) {
            return false;
        }
        if (
            normalizedMatchLevel &&
            association.match_level !== normalizedMatchLevel
        ) {
            return false;
        }
        if (
            filter.specimenKey &&
            !matchesPathologySpecimenKey(association, filter.specimenKey)
        ) {
            return false;
        }
        return true;
    };

    const matchingImageIds = new Set(
        hierarchy.slide_associations
            .filter(association => matchesFilter(association, true))
            .map(association => association.image_id)
    );

    // Older pathology linkouts can carry a source sample ID that is not a
    // portal sample. Keep the explicit specimen and match-level constraints,
    // but allow the hierarchy's unmatched group to satisfy that linkout.
    if (
        matchingImageIds.size === 0 &&
        filter.sampleId &&
        filter.specimenKey &&
        !hierarchy.slide_associations.some(
            association => association.sample_id === filter.sampleId
        )
    ) {
        hierarchy.slide_associations
            .filter(association => matchesFilter(association, false))
            .forEach(association => matchingImageIds.add(association.image_id));
    }

    byFilterKey.set(filterKey, matchingImageIds);
    return matchingImageIds;
}
