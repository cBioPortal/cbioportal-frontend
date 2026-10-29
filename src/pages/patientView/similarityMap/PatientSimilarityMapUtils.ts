import _ from 'lodash';
import {
    EmbeddingDataOption,
    SampleEmbeddingData,
} from 'shared/components/embeddings/EmbeddingTypes';
import { makeUniqueColorGetter } from 'shared/components/plots/PlotUtils';
import { RESERVED_CLINICAL_VALUE_COLORS } from 'shared/lib/Colors';

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
