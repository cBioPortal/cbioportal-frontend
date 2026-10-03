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
    partDescriptionCount: number;
    slideKeys: Set<string>;
};

// A normalized hierarchy is never mutated, so everything derived from it is
// memoized by object identity.
const sampleSlideDataCache = new WeakMap<Sample, SampleSlideData>();
const hierarchySlideEntriesCache = new WeakMap<
    PatientHierarchy,
    ServableSlideEntry[]
>();
const servableAssociationsBySlideKeyCache = new WeakMap<
    SlideAssociation[],
    Map<string, SlideAssociation>
>();
const pathologyFilterSlideKeysCache = new WeakMap<
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

export function getServableSlideAssociationsBySlideKeyReadOnly(
    associations: SlideAssociation[] | undefined
): Map<string, SlideAssociation> {
    if (!associations) {
        return new Map<string, SlideAssociation>();
    }

    const cached = servableAssociationsBySlideKeyCache.get(associations);
    if (cached) {
        return cached;
    }

    const result = new Map<string, SlideAssociation>();
    for (const association of associations) {
        if (!association.can_serve_tiles) {
            continue;
        }

        const existing = result.get(association.slide_key);
        if (
            !existing ||
            compareServableAssociationPreference(association, existing) > 0
        ) {
            result.set(association.slide_key, association);
        }
    }

    servableAssociationsBySlideKeyCache.set(associations, result);
    return result;
}

function uniqueSlideKey(
    sampleId: string,
    slide: Pick<Slide, 'slide_key'>
): string {
    return `${sampleId}::${slide.slide_key}`;
}

export function isServableDiagnosticSlide(
    slide: Pick<Slide, 'can_serve_tiles' | 'slide_key' | 'is_hne' | 'is_ihc'>
): boolean {
    return !!(slide.can_serve_tiles && slide.slide_key);
}

/**
 * Classifies a slide's stain. The resolved flags are authoritative; the
 * importer guarantees `slide_type` agrees with them.
 */
export function wsiStainKind(
    slide: Pick<Slide, 'is_hne' | 'is_ihc' | 'slide_type'>
): Exclude<WsiStainFilter, 'all'> {
    if (slide.is_ihc) return 'ihc';
    if (slide.is_hne) return 'hne';
    return slide.slide_type === 'Other' ? 'other' : 'unknown';
}

export function matchesWsiStainFilter(
    slide: Pick<Slide, 'is_hne' | 'is_ihc' | 'slide_type'>,
    stainFilter: WsiStainFilter
): boolean {
    return stainFilter === 'all' || wsiStainKind(slide) === stainFilter;
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
        skipSlideKey?: string;
        isCached?: (slideKey: string) => boolean;
    }
): Slide[] {
    const matching: Slide[] = [];
    const otherStain: Slide[] = [];
    const seen = new Set<string>();
    for (const { slide, sample } of entries) {
        const slideKey = slide.slide_key;
        if (
            sample.sample_id !== options.selectedSampleId ||
            slideKey === options.skipSlideKey ||
            seen.has(slideKey) ||
            options.isCached?.(slideKey)
        ) {
            continue;
        }
        seen.add(slideKey);
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
    const partDescriptions = new Set<string>();
    const slideKeys = new Set<string>();
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
                slideKeys.add(slide.slide_key);
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
        partDescriptionCount: partDescriptions.size,
        slideKeys,
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

export function getServableSlideEntriesForHierarchyReadOnly(
    hierarchy: PatientHierarchy
): ServableSlideEntry[] {
    let entries = hierarchySlideEntriesCache.get(hierarchy);
    if (!entries) {
        entries = hierarchy.samples.flatMap(sample =>
            getCachedServableSlideData(sample).slides.map(slide => ({
                slide,
                sample,
            }))
        );
        hierarchySlideEntriesCache.set(hierarchy, entries);
    }
    return entries;
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
        !!slideId && getCachedServableSlideData(sample).slideKeys.has(slideId)
    );
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
    let byFilterKey = pathologyFilterSlideKeysCache.get(
        hierarchy.slide_associations
    );
    if (!byFilterKey) {
        byFilterKey = new Map();
        pathologyFilterSlideKeysCache.set(
            hierarchy.slide_associations,
            byFilterKey
        );
    }
    const cachedSlideKeys = byFilterKey.get(filterKey);
    if (cachedSlideKeys) {
        return cachedSlideKeys;
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
            association.specimen_key !== filter.specimenKey
        ) {
            return false;
        }
        return true;
    };

    const matchingSlideKeys = new Set(
        hierarchy.slide_associations
            .filter(association => matchesFilter(association, true))
            .map(association => association.slide_key)
    );

    // Older pathology linkouts can carry a source sample ID that is not a
    // portal sample. Keep the explicit specimen and match-level constraints,
    // but allow the hierarchy's unmatched group to satisfy that linkout.
    if (
        matchingSlideKeys.size === 0 &&
        filter.sampleId &&
        filter.specimenKey &&
        !hierarchy.slide_associations.some(
            association => association.sample_id === filter.sampleId
        )
    ) {
        hierarchy.slide_associations
            .filter(association => matchesFilter(association, false))
            .forEach(association =>
                matchingSlideKeys.add(association.slide_key)
            );
    }

    byFilterKey.set(filterKey, matchingSlideKeys);
    return matchingSlideKeys;
}
