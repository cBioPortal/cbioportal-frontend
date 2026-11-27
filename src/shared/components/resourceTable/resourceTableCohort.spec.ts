import { assert } from 'chai';
import { StudyViewFilter } from 'cbioportal-ts-api-client';
import {
    cohortFromSamples,
    cohortFromSelection,
    resourceCohortFields,
    studyViewResourceCohort,
} from './resourceTableCohort';

describe('resourceTableCohort', () => {
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
    const filter = ({
        studyIds: ['study_a'],
        clinicalDataFilters: [
            {
                attributeId: 'CANCER_TYPE',
                values: [{ value: 'Breast Cancer' }],
            },
        ],
    } as any) as StudyViewFilter;

    describe('cohortFromSelection', () => {
        it('sends no case identifiers when the whole study is selected', () => {
            const cohort = cohortFromSelection(allSamples, allSamples, true);

            assert.deepEqual(cohort, {
                studyIds: ['study_a'],
                patientIdentifiers: [],
                sampleIdentifiers: [],
            });
        });

        it('sends the selection when it is a subset of the study', () => {
            const cohort = cohortFromSelection(
                allSamples.slice(0, 2),
                allSamples,
                true
            );

            assert.deepEqual(cohort.studyIds, ['study_a']);
            assert.deepEqual(cohort.patientIdentifiers, [
                { studyId: 'study_a', patientId: 'patient_1' },
            ]);
            assert.deepEqual(cohort.sampleIdentifiers, [
                { studyId: 'study_a', sampleId: 'sample_1' },
                { studyId: 'study_a', sampleId: 'sample_2' },
            ]);
        });

        it('sends the selection while the full sample set is still loading', () => {
            const cohort = cohortFromSelection(allSamples, undefined, true);

            assert.deepEqual(cohort.sampleIdentifiers, [
                { studyId: 'study_a', sampleId: 'sample_1' },
                { studyId: 'study_a', sampleId: 'sample_2' },
                { studyId: 'study_a', sampleId: 'sample_3' },
            ]);
        });

        it('keeps every study of a fully selected multi-study cohort', () => {
            const samples = [
                sample('study_a', 'patient_1', 'sample_1'),
                sample('study_b', 'patient_1', 'sample_1'),
            ];

            const cohort = cohortFromSelection(samples, samples, true);

            assert.deepEqual(cohort.studyIds, ['study_a', 'study_b']);
            assert.deepEqual(cohort.sampleIdentifiers, []);
        });

        it('sends the selection when the query does not cover the whole study', () => {
            // A virtual study or case list queries a subset, so `all` is that subset too and the
            // lengths match while the cohorts do not. Taking the shortcut here would widen the
            // request to every sample of the physical study.
            const cohort = cohortFromSelection(allSamples, allSamples, false);

            assert.deepEqual(cohort.studyIds, ['study_a']);
            assert.lengthOf(cohort.sampleIdentifiers, 3);
        });
    });

    describe('cohortFromSamples', () => {
        it('pairs each id with its own study and lists each patient once', () => {
            const cohort = cohortFromSamples([
                ...allSamples,
                sample('study_b', 'patient_1', 'sample_1'),
            ]);

            assert.deepEqual(cohort, {
                studyIds: ['study_a', 'study_b'],
                patientIdentifiers: [
                    { studyId: 'study_a', patientId: 'patient_1' },
                    { studyId: 'study_a', patientId: 'patient_2' },
                    { studyId: 'study_b', patientId: 'patient_1' },
                ],
                sampleIdentifiers: [
                    { studyId: 'study_a', sampleId: 'sample_1' },
                    { studyId: 'study_a', sampleId: 'sample_2' },
                    { studyId: 'study_a', sampleId: 'sample_3' },
                    { studyId: 'study_b', sampleId: 'sample_1' },
                ],
            });
        });
    });

    describe('resourceCohortFields', () => {
        it('sends the identifier lists when there is no filter', () => {
            const fields = resourceCohortFields({
                studyIds: ['study_a'],
                patientIdentifiers: [
                    { studyId: 'study_a', patientId: 'patient_1' },
                ],
                sampleIdentifiers: [
                    { studyId: 'study_a', sampleId: 'sample_1' },
                ],
            });

            assert.deepEqual(fields, {
                studyIds: ['study_a'],
                patientIdentifiers: [
                    { studyId: 'study_a', patientId: 'patient_1' },
                ],
                sampleIdentifiers: [
                    { studyId: 'study_a', sampleId: 'sample_1' },
                ],
            });
            assert.notProperty(fields, 'studyViewFilter');
        });

        it('sends the filter in place of the identifier lists', () => {
            const fields = resourceCohortFields({
                studyIds: ['study_a'],
                patientIdentifiers: [
                    { studyId: 'study_a', patientId: 'patient_1' },
                ],
                sampleIdentifiers: [
                    { studyId: 'study_a', sampleId: 'sample_1' },
                ],
                studyViewFilter: filter,
            });

            assert.deepEqual(fields, {
                studyIds: ['study_a'],
                studyViewFilter: filter,
            });
        });
    });

    describe('studyViewResourceCohort', () => {
        it('sends only the studies when nothing is filtered', () => {
            const cohort = studyViewResourceCohort({
                selected: allSamples,
                all: allSamples,
                coversWholeStudy: true,
                studyViewFilter: filter,
                chartsAreFiltered: false,
            });

            assert.deepEqual(resourceCohortFields(cohort), {
                studyIds: ['study_a'],
                patientIdentifiers: [],
                sampleIdentifiers: [],
            });
        });

        it('sends the filter, not the selection, when charts are filtered', () => {
            const cohort = studyViewResourceCohort({
                selected: allSamples.slice(0, 2),
                all: allSamples,
                coversWholeStudy: true,
                studyViewFilter: filter,
                chartsAreFiltered: true,
            });

            assert.deepEqual(resourceCohortFields(cohort), {
                studyIds: ['study_a'],
                studyViewFilter: filter,
            });
            // The tabs request takes no filter, so the cohort keeps the selection for it.
            assert.deepEqual(cohort.sampleIdentifiers, [
                { studyId: 'study_a', sampleId: 'sample_1' },
                { studyId: 'study_a', sampleId: 'sample_2' },
            ]);
        });

        it('sends one filter for a filtered multi-study view', () => {
            const multiFilter = ({
                ...filter,
                studyIds: ['study_a', 'study_b'],
            } as any) as StudyViewFilter;
            const selected = [
                sample('study_a', 'patient_1', 'sample_1'),
                sample('study_b', 'patient_1', 'sample_1'),
            ];

            const cohort = studyViewResourceCohort({
                selected,
                all: [...allSamples, sample('study_b', 'patient_9', 's_9')],
                coversWholeStudy: true,
                studyViewFilter: multiFilter,
                chartsAreFiltered: true,
            });

            assert.deepEqual(resourceCohortFields(cohort), {
                studyIds: ['study_a', 'study_b'],
                studyViewFilter: multiFilter,
            });
            // The tabs request keeps each id paired with its own study.
            assert.deepEqual(cohort.sampleIdentifiers, [
                { studyId: 'study_a', sampleId: 'sample_1' },
                { studyId: 'study_b', sampleId: 'sample_1' },
            ]);
        });

        it('sends the filter for an unfiltered virtual study', () => {
            // A virtual study queries a subset of its physical study; its filter names that
            // subset, while bare study ids would widen the request to the whole study.
            const cohort = studyViewResourceCohort({
                selected: allSamples,
                all: allSamples,
                coversWholeStudy: false,
                studyViewFilter: filter,
                chartsAreFiltered: false,
            });

            assert.deepEqual(resourceCohortFields(cohort), {
                studyIds: ['study_a'],
                studyViewFilter: filter,
            });
        });
    });
});
