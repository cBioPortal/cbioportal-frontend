import { normalizeBlockLabel } from './wsiNavUtils';
import { PatientHierarchy, Sample, Slide } from './wsiViewerTypes';

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
    slides: Slide[];
    orderedSlides: OrderedServableSlideEntry[];
    slideCounts: ServableSlideCounts;
    blockCounts: ServableSlideCounts;
    partDescriptionCount: number;
    slideImageIds: Set<string>;
};

type CachedHierarchyEntries = {
    samplesRef: PatientHierarchy['samples'];
    entries: ServableSlideEntry[];
    counts: ServableSlideCounts;
};

const servableSlidesBySampleCache = new WeakMap<
    Sample,
    CachedServableSlidesEntry
>();
const servableSlideEntriesByHierarchyCache = new WeakMap<
    PatientHierarchy,
    CachedHierarchyEntries
>();
const DUMMY_BLOCK_LABELS = new Set(['0', '']);

function uniqueSlideKey(sampleId: string, slide: Pick<Slide, 'image_id'>): string {
    return `${sampleId}::${slide.image_id}`;
}

export function isServableDiagnosticSlide(
    slide: Pick<Slide, 'can_serve_tiles' | 'image_id' | 'is_hne' | 'is_ihc'>
): boolean {
    return !!(
        slide.can_serve_tiles &&
        slide.image_id &&
        (slide.is_hne || slide.is_ihc)
    );
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

export function getServableSlidesForSample(sample: Sample): Slide[] {
    const cached = servableSlidesBySampleCache.get(sample);
    if (
        cached &&
        cached.partsRef === sample.parts &&
        cached.sampleId === sample.sample_id
    ) {
        return cached.slides;
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
        const aBlockNumber = Number(a.slide.block_number) || 0;
        const bBlockNumber = Number(b.slide.block_number) || 0;
        if (aBlockNumber !== bBlockNumber) {
            return aBlockNumber - bBlockNumber;
        }
        return (a.slide.stain_name || '').localeCompare(
            b.slide.stain_name || ''
        );
    });

    servableSlidesBySampleCache.set(sample, {
        partsRef: sample.parts,
        sampleId: sample.sample_id,
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

function getCachedServableSlideData(sample: Sample): CachedServableSlidesEntry {
    getServableSlidesForSample(sample);
    return servableSlidesBySampleCache.get(sample)!;
}

export function getServableSlideEntriesForHierarchy(
    hierarchy: PatientHierarchy
): ServableSlideEntry[] {
    const cached = servableSlideEntriesByHierarchyCache.get(hierarchy);
    if (cached && cached.samplesRef === hierarchy.samples) {
        return cached.entries;
    }

    const result: ServableSlideEntry[] = [];
    const counts: ServableSlideCounts = { all: 0, hne: 0, ihc: 0 };
    for (const sample of hierarchy.samples) {
        const sampleCounts = getCachedServableSlideData(sample).slideCounts;
        counts.all += sampleCounts.all;
        counts.hne += sampleCounts.hne;
        counts.ihc += sampleCounts.ihc;
        for (const slide of getServableSlidesForSample(sample)) {
            result.push({ slide, sample });
        }
    }
    servableSlideEntriesByHierarchyCache.set(hierarchy, {
        samplesRef: hierarchy.samples,
        entries: result,
        counts,
    });
    return result;
}

export function getServableSlideCountsForHierarchy(
    hierarchy: PatientHierarchy
): ServableSlideCounts {
    const cached = servableSlideEntriesByHierarchyCache.get(hierarchy);
    if (cached && cached.samplesRef === hierarchy.samples) {
        return cached.counts;
    }

    getServableSlideEntriesForHierarchy(hierarchy);
    return servableSlideEntriesByHierarchyCache.get(hierarchy)!.counts;
}

export function countServableSlidesForSample(
    sample: Sample,
    stainFilter: Exclude<WsiStainFilter, 'all'> | 'all' = 'all'
): number {
    return getCachedServableSlideData(sample).slideCounts[stainFilter];
}

export function getOrderedServableSlidesForSample(
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
        !!slideId && getCachedServableSlideData(sample).slideImageIds.has(slideId)
    );
}

function uniqueBlockKey(
    sampleId: string,
    slide: Pick<Slide, 'block_number' | 'block_label'>
): string {
    return `${sampleId}::${slide.block_number || ''}::${slide.block_label || ''}`;
}

export function countServableBlocksForSample(
    sample: Sample,
    stainFilter: Exclude<WsiStainFilter, 'all'> | 'all' = 'all'
): number {
    return getCachedServableSlideData(sample).blockCounts[stainFilter];
}
