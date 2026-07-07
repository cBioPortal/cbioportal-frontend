import { PatientHierarchy, Sample, Slide } from './wsiViewerTypes';

export type WsiStainFilter = 'all' | 'hne' | 'ihc';

export interface ServableSlideEntry {
    slide: Slide;
    sample: Sample;
}

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
    const seen = new Set<string>();
    const deduped: Slide[] = [];
    for (const part of sample.parts) {
        for (const block of part.blocks) {
            for (const slide of block.slides) {
                if (!isServableDiagnosticSlide(slide)) continue;
                const key = uniqueSlideKey(sample.sample_id, slide);
                if (seen.has(key)) continue;
                seen.add(key);
                deduped.push(slide);
            }
        }
    }
    return deduped;
}

export function getServableSlideEntriesForHierarchy(
    hierarchy: PatientHierarchy
): ServableSlideEntry[] {
    const seen = new Set<string>();
    const result: ServableSlideEntry[] = [];
    for (const sample of hierarchy.samples) {
        for (const part of sample.parts) {
            for (const block of part.blocks) {
                for (const slide of block.slides) {
                    if (!isServableDiagnosticSlide(slide)) continue;
                    const key = uniqueSlideKey(sample.sample_id, slide);
                    if (seen.has(key)) continue;
                    seen.add(key);
                    result.push({ slide, sample });
                }
            }
        }
    }
    return result;
}

export function countServableSlidesForSample(
    sample: Sample,
    stainFilter: Exclude<WsiStainFilter, 'all'> | 'all' = 'all'
): number {
    return getServableSlidesForSample(sample).filter(slide =>
        matchesWsiStainFilter(slide, stainFilter)
    ).length;
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
    const seen = new Set<string>();
    for (const part of sample.parts) {
        for (const block of part.blocks) {
            for (const slide of block.slides) {
                if (!isServableDiagnosticSlide(slide)) continue;
                if (!matchesWsiStainFilter(slide, stainFilter)) continue;
                seen.add(uniqueBlockKey(sample.sample_id, slide));
            }
        }
    }
    return seen.size;
}
