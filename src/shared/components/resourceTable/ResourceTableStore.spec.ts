import { assert } from 'chai';
import { ResourceTableStore } from './ResourceTableStore';

describe('ResourceTableStore cohort context', () => {
    const sample = (studyId: string, patientId: string, sampleId: string) => ({
        studyId,
        patientId,
        sampleId,
    });

    const allSamples = [
        sample('study_a', 'patient_1', 'sample_1'),
        sample('study_a', 'patient_1', 'sample_2'),
        sample('study_a', 'patient_2', 'sample_3'),
    ];

    it('sends no case identifiers when the whole study is selected', () => {
        const store = new ResourceTableStore();

        store.setContextFromSelection(allSamples, allSamples);

        assert.deepEqual(store.studyIds, ['study_a']);
        assert.deepEqual(store.patientIdentifiers, []);
        assert.deepEqual(store.sampleIdentifiers, []);
    });

    it('sends the selection when it is a subset of the study', () => {
        const store = new ResourceTableStore();

        store.setContextFromSelection(allSamples.slice(0, 2), allSamples);

        assert.deepEqual(store.studyIds, ['study_a']);
        assert.deepEqual(store.patientIdentifiers, [
            { studyId: 'study_a', patientId: 'patient_1' },
        ]);
        assert.deepEqual(store.sampleIdentifiers, [
            { studyId: 'study_a', sampleId: 'sample_1' },
            { studyId: 'study_a', sampleId: 'sample_2' },
        ]);
    });

    it('sends the selection while the full sample set is still loading', () => {
        const store = new ResourceTableStore();

        store.setContextFromSelection(allSamples, undefined);

        assert.deepEqual(store.sampleIdentifiers, [
            { studyId: 'study_a', sampleId: 'sample_1' },
            { studyId: 'study_a', sampleId: 'sample_2' },
            { studyId: 'study_a', sampleId: 'sample_3' },
        ]);
    });

    it('keeps every study of a fully selected multi-study cohort', () => {
        const store = new ResourceTableStore();
        const samples = [
            sample('study_a', 'patient_1', 'sample_1'),
            sample('study_b', 'patient_1', 'sample_1'),
        ];

        store.setContextFromSelection(samples, samples);

        assert.deepEqual(store.studyIds, ['study_a', 'study_b']);
        assert.deepEqual(store.sampleIdentifiers, []);
    });
});
