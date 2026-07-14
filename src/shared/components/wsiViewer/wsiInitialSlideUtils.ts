import { Sample, Slide } from './wsiViewerTypes';
import { matchesWsiStainFilter, WsiStainFilter } from './wsiSlideUtils';

export interface InitialSlideEntry {
    slide: Slide;
    sample: Sample;
}

export function chooseInitialServableSlide(
    allSlides: InitialSlideEntry[],
    options: {
        preferredSampleId?: string;
        preferredSlideId?: string;
        stainFilter: WsiStainFilter;
    }
): InitialSlideEntry | undefined {
    const fromPreferredSlide = options.preferredSlideId
        ? allSlides.find(s => s.slide.image_id === options.preferredSlideId)
        : undefined;
    const preferredSampleSlides = options.preferredSampleId
        ? allSlides.filter(
              s => s.sample.sample_id === options.preferredSampleId
          )
        : [];
    const preferredSampleFirst =
        preferredSampleSlides.find(s =>
            matchesWsiStainFilter(s.slide, options.stainFilter)
        ) ??
        preferredSampleSlides.find(s => s.slide.is_hne) ??
        preferredSampleSlides[0];

    return (
        fromPreferredSlide ??
        preferredSampleFirst ??
        allSlides.find(s => matchesWsiStainFilter(s.slide, options.stainFilter)) ??
        allSlides.find(s => s.slide.is_hne) ??
        allSlides[0]
    );
}
