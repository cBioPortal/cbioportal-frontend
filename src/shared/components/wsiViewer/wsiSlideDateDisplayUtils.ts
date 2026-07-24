import {
    cleanStain,
    normalizeBlockLabel,
    procedureSlideTimepointText,
} from './wsiNavUtils';
import { Sample, Slide } from './wsiViewerTypes';

function getSlideDisplayName(slide: Slide): string {
    const cleanedStain = cleanStain(slide.stain_name);
    if (cleanedStain) {
        return cleanedStain;
    }
    if (slide.is_hne) {
        return 'H&E';
    }
    if (slide.is_ihc) {
        return 'IHC';
    }
    return 'Slide';
}

export function formatSampleSlideDateLine(
    slide: Slide,
    sample: Sample
): string {
    const blockLabel = normalizeBlockLabel(
        slide.block_label,
        slide.block_number
    );
    const timepoint = procedureSlideTimepointText(slide) || 'No relative date';
    const servabilitySuffix = slide.can_serve_tiles ? '' : ', non-viewable';

    return `Slide ${slide.image_id} (${getSlideDisplayName(
        slide
    )}, block ${blockLabel}${servabilitySuffix}): ${timepoint}`;
}
