import { assert } from 'chai';
import { StudyViewFilter } from 'cbioportal-ts-api-client';
import {
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
