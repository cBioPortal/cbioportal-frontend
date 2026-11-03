import chai, { assert, expect } from 'chai';
import deepEqualInAnyOrder from 'deep-equal-in-any-order';
import { PatientIdentifier, SampleIdentifier } from 'cbioportal-ts-api-client';
import {
    filterGroupsByName,
    getStudiesAttr,
} from './ComparisonGroupManagerUtils';
chai.use(deepEqualInAnyOrder);

describe('ComparisonGroupManagerUtils', () => {
    describe('filterGroupsByName', () => {
        const groups = [
            { name: 'Lung Cancer Study' },
            { name: 'breast cancer study' },
            { name: 'Colorectal Cancer' },
            { name: 'Lung (NSCLC) group' },
            { name: 'Brain Tumor Study' },
            { name: 'KRAS mutant' },
            { name: 'NRAS mutant' },
            { name: 'TP53 altered' },
            { name: 'TP63 altered' },
            { name: 'Group 1' },
            { name: 'Group 2' },
            { name: 'Group 10' },
            { name: '[Cluster] A+' },
        ];
        const names = (filter: string) =>
            filterGroupsByName(groups, filter).map(group => group.name);
        const allSorted = [
            '[Cluster] A+',
            'Brain Tumor Study',
            'breast cancer study',
            'Colorectal Cancer',
            'Group 1',
            'Group 10',
            'Group 2',
            'KRAS mutant',
            'Lung (NSCLC) group',
            'Lung Cancer Study',
            'NRAS mutant',
            'TP53 altered',
            'TP63 altered',
        ];

        it('returns all groups sorted case-insensitively for empty filter', () => {
            assert.deepEqual(names(''), allSorted);
        });
        it('treats a whitespace-only filter as empty', () => {
            assert.deepEqual(names('   '), allSorted);
            assert.deepEqual(names('\t '), allSorted);
        });
        it('matches exact names', () => {
            assert.deepEqual(names('Colorectal Cancer'), ['Colorectal Cancer']);
        });
        it('matches partial names case-insensitively, in alphabetical order', () => {
            assert.deepEqual(names('CANCER'), [
                'breast cancer study',
                'Colorectal Cancer',
                'Lung Cancer Study',
            ]);
            assert.deepEqual(names(' lung '), [
                'Lung (NSCLC) group',
                'Lung Cancer Study',
            ]);
        });
        it('does not add near-miss groups when the filter text is found', () => {
            assert.deepEqual(names('kras'), ['KRAS mutant']);
            assert.deepEqual(names('TP53'), ['TP53 altered']);
            assert.deepEqual(names('group 1'), ['Group 1', 'Group 10']);
        });
        it('falls back to fuzzy matching for typos', () => {
            assert.deepEqual(names('brest'), ['breast cancer study']);
            assert.deepEqual(names('colrectal'), ['Colorectal Cancer']);
            assert.deepEqual(names('grop 1'), ['Group 1', 'Group 10']);
        });
        it('orders fuzzy matches by relevance rather than alphabetically', () => {
            assert.deepEqual(names('grup 10'), ['Group 10', 'Group 1']);
        });
        it('does not fuzzy match unrelated groups for short filters', () => {
            assert.deepEqual(names('rsa'), []);
        });
        it('treats regex special characters literally instead of throwing', () => {
            assert.deepEqual(names('Lung (NSCLC'), ['Lung (NSCLC) group']);
            assert.deepEqual(names('[cluster] a+'), ['[Cluster] A+']);
            for (const filter of [
                '(',
                ')',
                '[',
                '+',
                '?',
                '*',
                '\\',
                '.*',
                '|',
            ]) {
                assert.doesNotThrow(() => names(filter), filter);
            }
            assert.deepEqual(names('.*'), []);
        });
        it('returns no groups when nothing matches', () => {
            assert.deepEqual(names('zzzzzzz'), []);
        });
        it('does not mutate the input', () => {
            const copy = groups.slice();
            filterGroupsByName(groups, 'lung');
            filterGroupsByName(groups, 'brest');
            assert.deepEqual(groups, copy);
        });
    });

    describe('getStudiesAttr', () => {
        it('empty for empty', () => {
            assert.deepEqual(getStudiesAttr([]), []);
        });
        it('fills with samples, no patients attr when patients not given', () => {
            (expect(
                getStudiesAttr([
                    { studyId: 'study1', sampleId: 'sample1' },
                    { studyId: 'study1', sampleId: 'sample2' },
                    { studyId: 'study2', sampleId: 'sample1' },
                    { studyId: 'study2', sampleId: 'sample2' },
                    { studyId: 'study2', sampleId: 'sample3' },
                    { studyId: 'study3', sampleId: 'sample1' },
                ])
            ).to.deep as any).equalInAnyOrder([
                { id: 'study1', samples: ['sample1', 'sample2'] },
                { id: 'study2', samples: ['sample1', 'sample2', 'sample3'] },
                { id: 'study3', samples: ['sample1'] },
            ]);
        });
        it('fills with samples and patients when both given', () => {
            (expect(
                getStudiesAttr(
                    [
                        { studyId: 'study1', sampleId: 'sample1' },
                        { studyId: 'study1', sampleId: 'sample2' },
                        { studyId: 'study2', sampleId: 'sample1' },
                        { studyId: 'study2', sampleId: 'sample2' },
                        { studyId: 'study2', sampleId: 'sample3' },
                        { studyId: 'study3', sampleId: 'sample1' },
                    ],
                    [
                        { studyId: 'study2', patientId: 'patient2' },
                        { studyId: 'study2', patientId: 'patient3' },
                        { studyId: 'study2', patientId: 'patient1' },
                        { studyId: 'study3', patientId: 'patient2' },
                        { studyId: 'study3', patientId: 'patient1' },
                        { studyId: 'study1', patientId: 'patient1' },
                    ]
                )
            ).to.deep as any).equalInAnyOrder([
                {
                    id: 'study1',
                    samples: ['sample1', 'sample2'],
                    patients: ['patient1'],
                },
                {
                    id: 'study2',
                    samples: ['sample1', 'sample2', 'sample3'],
                    patients: ['patient1', 'patient2', 'patient3'],
                },
                {
                    id: 'study3',
                    samples: ['sample1'],
                    patients: ['patient1', 'patient2'],
                },
            ]);
        });
    });
});
