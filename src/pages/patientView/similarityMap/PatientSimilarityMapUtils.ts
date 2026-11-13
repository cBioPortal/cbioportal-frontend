import _ from 'lodash';
import {
    EmbeddingDataOption,
    SampleEmbeddingData,
} from 'shared/components/embeddings/EmbeddingTypes';
import { preComputeClinicalDataMaps } from 'shared/lib/PatientMolecularDataUtils';
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
 * The selection travels as a StudyViewFilter in the `filters` query parameter.
 */
export function getStudyViewMapUrl(
    studyId: string,
    sampleIds: string[],
    mapValue?: string
): string {
    const query: { [key: string]: string } = { id: studyId };
    if (mapValue) {
        query.embeddings_map = mapValue;
    }
    // The selection rides in the fragment, which the browser never sends: a
    // few thousand sample ids in the query string exceed what a server accepts.
    const filterJson = encodeURIComponent(
        JSON.stringify({
            sampleIdentifiers: sampleIds.map(sampleId => ({
                studyId,
                sampleId,
            })),
        })
    );
    return buildCBioPortalPageUrl(
        'study/embeddings',
        query,
        `filterJson=${filterJson}`
    );
}

/**
 * Colour per sample id for a clinical attribute. Keys drop the study prefix
 * the cache uses, since a map's points carry a bare sample id.
 *
 * Takes every study the map covers, not just the patient's: on a map built
 * from many studies, one study's samples are a sliver of the points, and
 * colouring only those leaves the picture grey where it matters.
 *
 * Samples with no value are absent, and the caller greys them.
 */
export function getClinicalColorsBySampleId(
    clinicalData: { studyId: string; sampleId: string; value: string }[],
    categoryToColor: { [value: string]: string } | undefined,
    numericalValueToColor: ((x: number) => string) | undefined,
    studyIds: string[]
): { colors: Map<string, string>; values: Map<string, string> } {
    const { colorMap, valueMap } = preComputeClinicalDataMaps(
        clinicalData,
        categoryToColor,
        numericalValueToColor
    );
    const prefixes = studyIds.map(studyId => `${studyId}:`);
    const bareId = (key: string) => {
        const prefix = prefixes.find(p => key.startsWith(p));
        return prefix === undefined ? undefined : key.slice(prefix.length);
    };
    const colors = new Map<string, string>();
    const values = new Map<string, string>();
    colorMap.forEach((color, key) => {
        const id = bareId(key);
        if (id !== undefined) {
            colors.set(id, color);
        }
    });
    valueMap.forEach((value, key) => {
        const id = bareId(key);
        if (id !== undefined) {
            values.set(id, value);
        }
    });
    return { colors, values };
}

/**
 * Runs `fn` over `items` with at most `limit` in flight, keeping input order.
 *
 * The API rate-limits a burst: firing one request per study at once loses
 * several to 429 and silently leaves those samples uncoloured.
 */
export async function mapWithConcurrency<T, R>(
    items: T[],
    limit: number,
    fn: (item: T) => Promise<R>
): Promise<R[]> {
    const results = new Array<R>(items.length);
    let next = 0;
    const worker = async () => {
        while (true) {
            const index = next++;
            if (index >= items.length) {
                return;
            }
            results[index] = await fn(items[index]);
        }
    };
    await Promise.all(
        _.range(Math.min(Math.max(limit, 1), items.length)).map(worker)
    );
    return results;
}

/**
 * Where a map point lands on screen in the viewer's OrthographicView: a
 * top-left origin with data y growing downward, which is how the embeddings
 * are drawn and is the opposite of a plotting library's default.
 */
export function projectToScreen(
    x: number,
    y: number,
    viewState: { target: number[]; zoom: number },
    width: number,
    height: number
): [number, number] {
    const scale = Math.pow(2, viewState.zoom);
    return [
        width / 2 + (x - viewState.target[0]) * scale,
        height / 2 + (y - viewState.target[1]) * scale,
    ];
}
