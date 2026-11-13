import { assert } from 'chai';
import { EmbeddingDataOption } from 'shared/components/embeddings/EmbeddingTypes';
import {
    fitProjection,
    getEmbeddingOptionsForSamples,
    getReferenceCategoryColors,
    getClinicalColorsBySampleId,
    getSamplesInLasso,
    isInsidePolygon,
    getStudyViewMapUrl,
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

describe('getStudyViewMapUrl', () => {
    it('carries the study, the map and the samples as a selection', () => {
        const url = getStudyViewMapUrl(
            'msktarget',
            ['P-1-T01-IM7', 'P-1-T02-IM7'],
            'msktarget_rna_tsne_mpath'
        );
        assert.include(url, 'study/embeddings');
        assert.include(url, 'id=msktarget');
        assert.include(url, 'embeddings_map=msktarget_rna_tsne_mpath');

        const [query, hash] = url.split('#');
        assert.notInclude(
            query,
            'filterJson',
            'the selection stays out of the query string'
        );
        const filters = JSON.parse(
            decodeURIComponent(hash.replace('filterJson=', ''))
        );
        assert.deepEqual(filters, {
            sampleIdentifiers: [
                { studyId: 'msktarget', sampleId: 'P-1-T01-IM7' },
                { studyId: 'msktarget', sampleId: 'P-1-T02-IM7' },
            ],
        });
    });

    it('omits the map when none is given', () => {
        const url = getStudyViewMapUrl('msktarget', ['P-1-T01-IM7']);
        assert.notInclude(url.split('#')[0], 'embeddings_map');
    });
});

describe('getClinicalColorsBySampleId', () => {
    const data = [
        { studyId: 'msktarget', sampleId: 'S1', value: 'Male' },
        { studyId: 'msktarget', sampleId: 'S2', value: 'Female' },
        { studyId: 'other', sampleId: 'S3', value: 'Male' },
    ];

    it('keys by bare sample id and drops studies the map does not cover', () => {
        const { colors, values } = getClinicalColorsBySampleId(
            data,
            { Male: '#111111', Female: '#222222' },
            undefined,
            ['msktarget']
        );
        assert.deepEqual(Array.from(values.entries()).sort(), [
            ['S1', 'Male'],
            ['S2', 'Female'],
        ].sort());
        assert.equal(colors.get('S1'), '#111111');
        assert.equal(colors.get('S2'), '#222222');
        assert.isUndefined(colors.get('S3'), 'other studies are excluded');
    });

    it('keeps every study the map covers', () => {
        const { colors, values } = getClinicalColorsBySampleId(
            data,
            { Male: '#111111', Female: '#222222' },
            undefined,
            ['msktarget', 'other']
        );
        assert.equal(values.get('S3'), 'Male');
        assert.equal(colors.get('S3'), '#111111');
    });

    it('leaves samples with no value absent so the caller can grey them', () => {
        const { colors } = getClinicalColorsBySampleId(
            [{ studyId: 'msktarget', sampleId: 'S1', value: 'Male' }],
            { Male: '#111111' },
            undefined,
            ['msktarget']
        );
        assert.isUndefined(colors.get('S_not_in_cohort'));
    });
});

describe('isInsidePolygon', () => {
    const square = [
        { x: 0, y: 0 },
        { x: 10, y: 0 },
        { x: 10, y: 10 },
        { x: 0, y: 10 },
    ];

    it('accepts a point inside and rejects one outside', () => {
        assert.isTrue(isInsidePolygon({ x: 5, y: 5 }, square));
        assert.isFalse(isInsidePolygon({ x: 15, y: 5 }, square));
    });

    it('handles a concave shape', () => {
        const u = [
            { x: 0, y: 0 },
            { x: 10, y: 0 },
            { x: 10, y: 10 },
            { x: 6, y: 10 },
            { x: 6, y: 3 },
            { x: 4, y: 3 },
            { x: 4, y: 10 },
            { x: 0, y: 10 },
        ];
        assert.isTrue(isInsidePolygon({ x: 2, y: 8 }, u), 'left arm');
        assert.isFalse(isInsidePolygon({ x: 5, y: 8 }, u), 'the notch');
    });

    it('rejects everything for a degenerate polygon', () => {
        assert.isFalse(isInsidePolygon({ x: 1, y: 1 }, []));
        assert.isFalse(
            isInsidePolygon({ x: 1, y: 1 }, [{ x: 0, y: 0 }, { x: 2, y: 2 }])
        );
    });
});

describe('getSamplesInLasso', () => {
    it('selects the points whose screen position is enclosed', () => {
        const points = [
            { sampleId: 'A', x: 0, y: 0 },
            { sampleId: 'B', x: 100, y: 100 },
        ];
        // identity projection
        const toScreen = (x: number, y: number): [number, number] => [x, y];
        const selected = getSamplesInLasso(
            points,
            [
                { x: -5, y: -5 },
                { x: 5, y: -5 },
                { x: 5, y: 5 },
                { x: -5, y: 5 },
            ],
            toScreen
        );
        assert.deepEqual(selected, ['A']);
    });

    it('selects nothing for a stroke too short to enclose anything', () => {
        const toScreen = (x: number, y: number): [number, number] => [x, y];
        assert.deepEqual(
            getSamplesInLasso([{ sampleId: 'A', x: 0, y: 0 }], [], toScreen),
            []
        );
    });
});
