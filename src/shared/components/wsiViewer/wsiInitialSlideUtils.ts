import { Sample, Slide } from './wsiViewerTypes';
import { matchesWsiStainFilter, WsiStainFilter } from './wsiSlideUtils';

export interface InitialSlideEntry {
    slide: Slide;
    sample: Sample;
}

function chooseInitialServableSlideInternal(
    allSlides: Iterable<InitialSlideEntry>,
    options: {
        preferredSampleId?: string;
        preferredSlideId?: string;
        stainFilter: WsiStainFilter;
        matchesEntry?: (entry: InitialSlideEntry) => boolean;
    }
): InitialSlideEntry | undefined {
    let preferredSampleMatchingStain: InitialSlideEntry | undefined;
    let preferredSampleHne: InitialSlideEntry | undefined;
    let preferredSampleAny: InitialSlideEntry | undefined;
    let matchingStain: InitialSlideEntry | undefined;
    let hne: InitialSlideEntry | undefined;
    let first: InitialSlideEntry | undefined;

    for (const entry of allSlides) {
        if (!first) {
            first = entry;
        }

        if (options.matchesEntry && !options.matchesEntry(entry)) {
            continue;
        }

        if (
            options.preferredSlideId &&
            entry.slide.image_id === options.preferredSlideId
        ) {
            return entry;
        }

        const inPreferredSample =
            !!options.preferredSampleId &&
            entry.sample.sample_id === options.preferredSampleId;
        const matchesRequestedStain = matchesWsiStainFilter(
            entry.slide,
            options.stainFilter
        );

        if (inPreferredSample) {
            preferredSampleAny ??= entry;
            if (matchesRequestedStain) {
                preferredSampleMatchingStain ??= entry;
            }
            if (entry.slide.is_hne) {
                preferredSampleHne ??= entry;
            }
        }

        if (matchesRequestedStain) {
            matchingStain ??= entry;
        }
        if (entry.slide.is_hne) {
            hne ??= entry;
        }
    }

    return (
        preferredSampleMatchingStain ??
        preferredSampleHne ??
        preferredSampleAny ??
        matchingStain ??
        hne ??
        first
    );
}

export function chooseInitialServableSlide(
    allSlides: InitialSlideEntry[],
    options: {
        preferredSampleId?: string;
        preferredSlideId?: string;
        stainFilter: WsiStainFilter;
    }
): InitialSlideEntry | undefined {
    return chooseInitialServableSlideInternal(allSlides, options);
}

export function chooseInitialMatchingServableSlide(
    allSlides: Iterable<InitialSlideEntry>,
    options: {
        preferredSampleId?: string;
        preferredSlideId?: string;
        stainFilter: WsiStainFilter;
        matchesEntry: (entry: InitialSlideEntry) => boolean;
    }
): InitialSlideEntry | undefined {
    return chooseInitialServableSlideInternal(allSlides, options);
}
