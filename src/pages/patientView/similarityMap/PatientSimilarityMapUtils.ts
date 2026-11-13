import _ from 'lodash';
import {
    EmbeddingDataOption,
    SampleEmbeddingData,
} from 'shared/components/embeddings/EmbeddingTypes';
import { makeUniqueColorGetter } from 'shared/components/plots/PlotUtils';
import { RESERVED_CLINICAL_VALUE_COLORS } from 'shared/lib/Colors';
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

export interface MapProjection {
    toScreen: (x: number, y: number) => [number, number];
}

/**
 * Fits the points into width x height with padding, keeping the aspect ratio.
 * Screen y grows downward with data y, as in the study view's map.
 */
export function fitProjection(
    points: { x: number; y: number }[],
    width: number,
    height: number,
    padding: number
): MapProjection {
    const xs = points.map(p => p.x);
    const ys = points.map(p => p.y);
    const minX = _.min(xs) ?? 0;
    const maxX = _.max(xs) ?? 0;
    const minY = _.min(ys) ?? 0;
    const maxY = _.max(ys) ?? 0;
    const innerW = width - 2 * padding;
    const innerH = height - 2 * padding;
    const scale = Math.min(
        maxX > minX ? innerW / (maxX - minX) : 1,
        maxY > minY ? innerH / (maxY - minY) : 1
    );
    const offsetX = padding + (innerW - (maxX - minX) * scale) / 2;
    const offsetY = padding + (innerH - (maxY - minY) * scale) / 2;
    return {
        toScreen: (x, y) => [
            offsetX + (x - minX) * scale,
            offsetY + (y - minY) * scale,
        ],
    };
}

/**
 * Colors for the map's own `referenceData` values of one attribute, most
 * frequent first so the common categories get the palette's first colors.
 */
export function getReferenceCategoryColors(
    points: SampleEmbeddingPoint[],
    attributeId: string
): { category: string; color: string; count: number }[] {
    const counts = _.countBy(
        points.filter(p => p.referenceData?.[attributeId] !== undefined),
        p => String(p.referenceData![attributeId])
    );
    const colorGetter = makeUniqueColorGetter(
        _.values(RESERVED_CLINICAL_VALUE_COLORS)
    );
    return _.orderBy(
        Object.keys(counts),
        [c => counts[c], c => c],
        ['desc', 'asc']
    ).map(category => ({
        category,
        color: RESERVED_CLINICAL_VALUE_COLORS[category] ?? colorGetter(),
        count: counts[category],
    }));
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

export interface LassoPoint {
    x: number;
    y: number;
}

/**
 * Whether a point falls inside a freehand polygon, by ray casting.
 *
 * The polygon is treated as closed, so the stroke does not have to return to
 * where it started.
 */
export function isInsidePolygon(
    point: LassoPoint,
    polygon: LassoPoint[]
): boolean {
    if (polygon.length < 3) {
        return false;
    }
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        const a = polygon[i];
        const b = polygon[j];
        const straddles = a.y > point.y !== b.y > point.y;
        if (
            straddles &&
            point.x < ((b.x - a.x) * (point.y - a.y)) / (b.y - a.y) + a.x
        ) {
            inside = !inside;
        }
    }
    return inside;
}

/** Sample ids whose screen position falls inside the lasso. */
export function getSamplesInLasso(
    points: { sampleId: string; x: number; y: number }[],
    polygon: LassoPoint[],
    toScreen: (x: number, y: number) => [number, number]
): string[] {
    if (polygon.length < 3) {
        return [];
    }
    const selected: string[] = [];
    for (const p of points) {
        const [x, y] = toScreen(p.x, p.y);
        if (isInsidePolygon({ x, y }, polygon)) {
            selected.push(p.sampleId);
        }
    }
    return selected;
}
