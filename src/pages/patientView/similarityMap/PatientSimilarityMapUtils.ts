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

/**
 * Link to the same map in the study view, with these samples selected.
 *
 * The study view is where filtering, colouring and selection live; this page
 * deliberately loads none of that, so it hands off rather than reimplementing.
 * Every study the map covers is opened together, so the study view shows the
 * same cohort the map was drawn from rather than one study out of many.
 * The selection travels as a StudyViewFilter in the `filters` query parameter.
 */
export function getStudyViewMapUrl(
    studyIds: string[],
    sampleIdentifiers: { studyId: string; sampleId: string }[],
    mapValue?: string
): string {
    const query: { [key: string]: string } = { id: studyIds.join(',') };
    if (mapValue) {
        query.embeddings_map = mapValue;
    }
    // The selection rides in the fragment, which the browser never sends: a
    // few thousand sample ids in the query string exceed what a server accepts.
    const filterJson = encodeURIComponent(JSON.stringify({ sampleIdentifiers }));
    return buildCBioPortalPageUrl(
        'study/embeddings',
        query,
        `filterJson=${filterJson}`
    );
}
