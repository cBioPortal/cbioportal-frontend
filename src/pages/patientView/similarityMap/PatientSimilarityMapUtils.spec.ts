import { assert } from 'chai';
import { EmbeddingDataOption } from 'shared/components/embeddings/EmbeddingTypes';
import {
    fitProjection,
    getEmbeddingOptionsForSamples,
    getReferenceCategoryColors,
    SampleEmbeddingPoint,
} from './PatientSimilarityMapUtils';

function option(
    value: string,
    studyIds: string[],
    sampleIds: string[],
    embedding_type: 'samples' | 'patients' = 'samples'
): EmbeddingDataOption {
    const data =
        embedding_type === 'samples'
            ? sampleIds.map(sampleId => ({ sampleId, x: 0, y: 0 }))
            : sampleIds.map(patientId => ({ patientId, x: 0, y: 0 }));
    return {
        value,
        label: value,
        data: {
            studyIds,
            title: value,
            description: '',
            totalPatients: 0,
            sampleSize: data.length,
            embedding_type,
            data,
        } as any,
    };
}

describe('getEmbeddingOptionsForSamples', () => {
    const options = [
        option('match', ['study_a'], ['S1', 'S9']),
        option('other_study', ['study_b'], ['S1']),
        option('no_sample', ['study_a'], ['S9']),
        option('patient_level', ['study_a'], ['S1'], 'patients'),
    ];

    it('keeps sample maps of the study that contain one of the samples', () => {
        assert.deepEqual(
            getEmbeddingOptionsForSamples(options, 'study_a', ['S1', 'S2']).map(
                o => o.value
            ),
            ['match']
        );
    });

    it('returns nothing when no map holds the samples', () => {
        assert.lengthOf(
            getEmbeddingOptionsForSamples(options, 'study_a', ['S2']),
            0
        );
    });
});

describe('fitProjection', () => {
    it('maps the bounding box into the padded area with y growing downward', () => {
        const { toScreen } = fitProjection(
            [
                { x: 0, y: 0 },
                { x: 10, y: 10 },
            ],
            120,
            120,
            10
        );
        assert.deepEqual(toScreen(0, 0), [10, 10]);
        assert.deepEqual(toScreen(10, 10), [110, 110]);
        assert.deepEqual(toScreen(5, 0), [60, 10]);
    });

    it('keeps the aspect ratio and centres the short axis', () => {
        const { toScreen } = fitProjection(
            [
                { x: 0, y: 0 },
                { x: 10, y: 5 },
            ],
            100,
            100,
            0
        );
        assert.deepEqual(toScreen(0, 0), [0, 25]);
        assert.deepEqual(toScreen(10, 5), [100, 75]);
    });

    it('handles a single point', () => {
        const { toScreen } = fitProjection([{ x: 3, y: 4 }], 100, 100, 10);
        assert.deepEqual(toScreen(3, 4), [50, 50]);
    });
});

describe('getReferenceCategoryColors', () => {
    const points: SampleEmbeddingPoint[] = [
        { sampleId: 'a', x: 0, y: 0, referenceData: { CANCER_TYPE: 'B' } },
        { sampleId: 'b', x: 0, y: 0, referenceData: { CANCER_TYPE: 'A' } },
        { sampleId: 'c', x: 0, y: 0, referenceData: { CANCER_TYPE: 'A' } },
        { sampleId: 'd', x: 0, y: 0, referenceData: { OTHER: 'x' } },
        { sampleId: 'e', x: 0, y: 0 },
    ];

    it('lists categories most frequent first, each with a distinct color', () => {
        const colors = getReferenceCategoryColors(points, 'CANCER_TYPE');
        assert.deepEqual(
            colors.map(c => [c.category, c.count]),
            [
                ['A', 2],
                ['B', 1],
            ]
        );
        assert.notEqual(colors[0].color, colors[1].color);
    });

    it('is empty when the map carries no such attribute', () => {
        assert.lengthOf(getReferenceCategoryColors(points, 'MISSING'), 0);
    });
});
