import { Sample, Slide } from './wsiViewerTypes';
import { matchesWsiStainFilter, WsiStainFilter } from './wsiSlideUtils';

export interface InitialSlideEntry {
    slide: Slide;
    sample: Sample;
}

export interface InitialSlideOptions {
    preferredSampleId?: string;
    /** Slide restored from the URL hash; takes precedence over all others. */
    preferredSlideId?: string;
    /** Slide named by an `imageId` link; used when no hash slide matches. */
    requestedImageId?: string;
    stainFilter: WsiStainFilter;
}

/**
 * Picks the initial slide. Precedence: the hash slide, then the requested
 * link slide, then the default ranking (preferred sample and stain, H&E,
 * first). Unknown IDs fall through to the next level.
 */
function chooseInitialServableSlideInternal(
    allSlides: Iterable<InitialSlideEntry>,
    options: InitialSlideOptions & {
        matchesEntry?: (entry: InitialSlideEntry) => boolean;
    }
): InitialSlideEntry | undefined {
    let requested: InitialSlideEntry | undefined;
    let preferredSampleMatchingStain: InitialSlideEntry | undefined;
    let preferredSampleHne: InitialSlideEntry | undefined;
    let preferredSampleAny: InitialSlideEntry | undefined;
    let matchingStain: InitialSlideEntry | undefined;
    let hne: InitialSlideEntry | undefined;
    let first: InitialSlideEntry | undefined;

    for (const entry of allSlides) {
        if (options.matchesEntry && !options.matchesEntry(entry)) {
            continue;
        }

        if (!first) {
            first = entry;
        }

        if (
            options.preferredSlideId &&
            entry.slide.image_id === options.preferredSlideId
        ) {
            return entry;
        }

        if (
            options.requestedImageId &&
            entry.slide.image_id === options.requestedImageId
        ) {
            requested ??= entry;
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
        requested ??
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
    options: InitialSlideOptions
): InitialSlideEntry | undefined {
    return chooseInitialServableSlideInternal(allSlides, options);
}

export function chooseInitialMatchingServableSlide(
    allSlides: Iterable<InitialSlideEntry>,
    options: InitialSlideOptions & {
        matchesEntry: (entry: InitialSlideEntry) => boolean;
    }
): InitialSlideEntry | undefined {
    return chooseInitialServableSlideInternal(allSlides, options);
}
