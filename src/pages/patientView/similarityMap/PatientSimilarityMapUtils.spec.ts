import { assert } from 'chai';
import { EmbeddingDataOption } from 'shared/components/embeddings/EmbeddingTypes';
import {
    getEmbeddingOptionsForSamples,
    getClinicalColorsBySampleId,
    getStudyViewMapUrl,
    mapWithConcurrency,
    projectToScreen,
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

describe('mapWithConcurrency', () => {
    it('keeps input order and never exceeds the limit', async () => {
        let inFlight = 0;
        let peak = 0;
        const result = await mapWithConcurrency([1, 2, 3, 4, 5, 6], 2, async n => {
            inFlight++;
            peak = Math.max(peak, inFlight);
            await new Promise(resolve => setTimeout(resolve, (7 - n) * 5));
            inFlight--;
            return n * 10;
        });
        assert.deepEqual(result, [10, 20, 30, 40, 50, 60]);
        assert.isAtMost(peak, 2);
    });

    it('returns an empty array for no items', async () => {
        assert.deepEqual(await mapWithConcurrency([], 3, async () => 1), []);
    });
});

describe('projectToScreen', () => {
    const viewState = { target: [0, 0, 0], zoom: 0 };

    it('puts the view target at the centre', () => {
        assert.deepEqual(projectToScreen(0, 0, viewState, 800, 560), [
            400,
            280,
        ]);
    });

    it('grows y downward, as the viewer draws it', () => {
        const [, top] = projectToScreen(0, 10, viewState, 800, 560);
        assert.isAbove(top, 280);
    });

    it('scales by two per zoom step', () => {
        assert.deepEqual(
            projectToScreen(10, 0, { target: [0, 0, 0], zoom: 1 }, 800, 560),
            [420, 280]
        );
    });
});
