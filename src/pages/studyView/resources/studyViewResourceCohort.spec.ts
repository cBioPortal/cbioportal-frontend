import { assert } from 'chai';
import { ResourceTableStore } from 'shared/components/resourceTable/ResourceTableStore';
import { resourceCohortFields } from 'shared/components/resourceTable/resourceTableCohort';
import {
    getStudyViewResourceCohort,
    syncStudyViewResourceCohort,
} from './studyViewResourceCohort';

describe('studyViewResourceCohort', () => {
    const samples = [
        { studyId: 'study_a', patientId: 'patient_1', sampleId: 'sample_1' },
        { studyId: 'study_a', patientId: 'patient_2', sampleId: 'sample_2' },
    ];
    const filters = {
        studyIds: ['study_a'],
        clinicalDataFilters: [
            { attributeId: 'SEX', values: [{ value: 'Female' }] },
        ],
    };

    const studyView = (chartsAreFiltered: boolean, selected = samples) =>
        ({
            selectedSamples: { result: selected },
            samples: { result: samples },
            queriedSampleIdentifiers: { result: [] },
            filters,
            chartsAreFiltered,
        } as any);

    it('sends the study-view filter when charts are filtered', () => {
        const cohort = getStudyViewResourceCohort(
            studyView(true, samples.slice(0, 1))
        )!;

        assert.deepEqual(resourceCohortFields(cohort), {
            studyIds: ['study_a'],
            studyViewFilter: filters as any,
        });
    });

    it('sends only the studies when nothing is filtered', () => {
        const cohort = getStudyViewResourceCohort(studyView(false))!;

        assert.deepEqual(resourceCohortFields(cohort), {
            studyIds: ['study_a'],
            patientIdentifiers: [],
            sampleIdentifiers: [],
        });
    });

    it('waits for the selection', () => {
        const store = studyView(false);
        store.selectedSamples.result = undefined;

        assert.isUndefined(getStudyViewResourceCohort(store));
    });

    it('leaves a table alone when its cohort has not changed', () => {
        const table = new ResourceTableStore();
        const cohort = getStudyViewResourceCohort(studyView(true))!;
        syncStudyViewResourceCohort(table, cohort);
        table.setSearchTerm('TCGA');

        syncStudyViewResourceCohort(
            table,
            getStudyViewResourceCohort(studyView(true))!
        );
        assert.equal(table.searchTerm, 'TCGA');

        syncStudyViewResourceCohort(
            table,
            getStudyViewResourceCohort(studyView(false))!
        );
        assert.equal(table.searchTerm, '');
        assert.isUndefined(table.studyViewFilter);
    });
});
