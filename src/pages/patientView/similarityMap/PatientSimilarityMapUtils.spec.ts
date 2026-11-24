import { assert } from 'chai';
import { EmbeddingDataOption } from 'shared/components/embeddings/EmbeddingTypes';
import {
    getEmbeddingOptionsForSamples,
    getStudyViewMapHandoff,
    STUDY_VIEW_URL_SELECTION_LIMIT,
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

describe('getStudyViewMapHandoff', () => {
    it('carries the study, the map and the samples as a selection', () => {
        const { href, needsHandoff } = getStudyViewMapHandoff(
            ['msktarget'],
            [
                { studyId: 'msktarget', sampleId: 'P-1-T01-IM7' },
                { studyId: 'msktarget', sampleId: 'P-1-T02-IM7' },
            ],
            'msktarget_rna_tsne_mpath'
        );
        assert.isFalse(needsHandoff);
        assert.include(href, 'study/embeddings');
        assert.include(href, 'id=msktarget');
        assert.include(href, 'embeddings_map=msktarget_rna_tsne_mpath');

        const [query, hash] = href.split('#');
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
        const { href } = getStudyViewMapHandoff(['msktarget'], [
            { studyId: 'msktarget', sampleId: 'P-1-T01-IM7' },
        ]);
        assert.notInclude(href.split('#')[0], 'embeddings_map');
    });

    it('opens every study the map covers, keeping each sample with its own', () => {
        const { href } = getStudyViewMapHandoff(
            ['brca_tcga', 'luad_tcga', 'msk_impact_50k_2026'],
            [
                { studyId: 'brca_tcga', sampleId: 'TCGA-A1-A0SB-01' },
                { studyId: 'msk_impact_50k_2026', sampleId: 'P-0000012-T03' },
            ],
            'msk_mosaic_2026_he'
        );
        assert.include(href, 'id=brca_tcga%2Cluad_tcga%2Cmsk_impact_50k_2026');
        const filters = JSON.parse(
            decodeURIComponent(href.split('#')[1].replace('filterJson=', ''))
        );
        assert.deepEqual(filters.sampleIdentifiers, [
            { studyId: 'brca_tcga', sampleId: 'TCGA-A1-A0SB-01' },
            { studyId: 'msk_impact_50k_2026', sampleId: 'P-0000012-T03' },
        ]);
    });

    it('leaves a selection no URL could hold for the opened window', () => {
        const sampleIdentifiers = [];
        for (let i = 0; i < 20000; i++) {
            sampleIdentifiers.push({
                studyId: 'msk_impact_50k_2026',
                sampleId: `P-${i}-T01-IM7`,
            });
        }
        const { href, needsHandoff } = getStudyViewMapHandoff(
            ['msk_impact_50k_2026'],
            sampleIdentifiers,
            'msk_mosaic_2026_he'
        );
        assert.isTrue(needsHandoff);
        assert.notInclude(href, 'filterJson');
        assert.include(href, 'id=msk_impact_50k_2026');
        assert.isBelow(href.length, STUDY_VIEW_URL_SELECTION_LIMIT);
    });
});
