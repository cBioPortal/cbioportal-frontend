import {
    EmbeddingDataOption,
    SampleEmbeddingData,
} from 'shared/components/embeddings/EmbeddingTypes';
import { buildCBioPortalPageUrl } from 'shared/api/urls';

export type SampleEmbeddingPoint = SampleEmbeddingData['data'][number];

export interface SampleEmbeddingOption extends EmbeddingDataOption {
    data: SampleEmbeddingData;
}

/**
 * The sample-level embeddings that belong to the study and contain at least
 * one of the given samples.
 */
export function getEmbeddingOptionsForSamples(
    options: EmbeddingDataOption[],
    studyId: string,
    sampleIds: string[]
): SampleEmbeddingOption[] {
    const wanted = new Set(sampleIds);
    return options.filter(
        (option): option is SampleEmbeddingOption =>
            option.data.embedding_type === 'samples' &&
            option.data.studyIds.includes(studyId) &&
            option.data.data.some(p => wanted.has(p.sampleId))
    );
}

export interface StudyViewSampleIdentifier {
    studyId: string;
    sampleId: string;
}

/**
 * How large a selection a link may carry.
 *
 * The ids ride in the fragment, which the browser never sends, so no server
 * limit applies - but Safari stops honouring a URL past roughly 80,000
 * characters, and a lasso of 15,000 samples already encodes to 1.4 MB.
 */
export const STUDY_VIEW_URL_SELECTION_LIMIT = 60000;

/**
 * Link to the same map in the study view, with these samples selected.
 *
 * The study view is where filtering, colouring and comparison live; this page
 * deliberately loads none of that, so it hands off rather than reimplementing.
 * Every study the map covers is opened together, so the study view shows the
 * same cohort the map was drawn from rather than one study out of many.
 *
 * A selection too large for a URL is left out of `href` and reported by
 * `needsHandoff`, for the caller to pass through the opened window instead.
 */
export function getStudyViewMapHandoff(
    studyIds: string[],
    sampleIdentifiers: StudyViewSampleIdentifier[],
    mapValue?: string
): { href: string; needsHandoff: boolean } {
    const query: { [key: string]: string } = { id: studyIds.join(',') };
    if (mapValue) {
        query.embeddings_map = mapValue;
    }
    const filterJson = encodeURIComponent(
        JSON.stringify({ sampleIdentifiers })
    );
    const needsHandoff = filterJson.length > STUDY_VIEW_URL_SELECTION_LIMIT;
    return {
        href: buildCBioPortalPageUrl(
            'study/embeddings',
            query,
            needsHandoff ? undefined : `filterJson=${filterJson}`
        ),
        needsHandoff,
    };
}

/**
 * Opens the study view and hands it a selection no URL could carry.
 *
 * `studyPageFilter` is the property the study view reads once at bootstrap,
 * and is how the rest of the portal passes a large case list to a new tab.
 */
export function openStudyViewMapWithSelection(
    href: string,
    sampleIdentifiers: StudyViewSampleIdentifier[]
): void {
    const studyPage = window.open(href, '_blank');
    if (studyPage) {
        (studyPage as any).studyPageFilter = `filterJson=${JSON.stringify({
            sampleIdentifiers,
        })}`;
    }
}
