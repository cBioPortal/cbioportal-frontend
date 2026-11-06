import { assert } from 'chai';
import { autorun, observable, runInAction, when } from 'mobx';
import { remoteData } from 'cbioportal-frontend-commons';
import { Sample } from 'cbioportal-ts-api-client';
import { ResourceTableStore } from 'shared/components/resourceTable/ResourceTableStore';
import {
    EMPTY_RESOURCE_COHORT,
    ResourceCohort,
    resourceCohortFields,
} from 'shared/components/resourceTable/resourceTableCohort';
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
            selectedSamples: { result: selected, isComplete: true },
            samples: { result: samples, isComplete: true },
            queriedSampleIdentifiers: { result: [], isComplete: true },
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
        store.selectedSamples.isComplete = false;

        assert.isUndefined(getStudyViewResourceCohort(store));
    });

    it('waits for a refetch rather than pairing the new filter with the old selection', () => {
        // A refetching MobxPromise still returns its previous result.
        const store = studyView(true, samples.slice(0, 1));
        store.selectedSamples.isComplete = false;

        assert.isUndefined(getStudyViewResourceCohort(store));
    });

    it('leaves a table alone when its cohort has not changed', () => {
        const table = new ResourceTableStore();
        const cohort = getStudyViewResourceCohort(studyView(true))!;
        syncStudyViewResourceCohort(table, cohort);
        table.setPage(3);

        syncStudyViewResourceCohort(
            table,
            getStudyViewResourceCohort(studyView(true))!
        );
        assert.equal(table.pageNumber, 3);

        syncStudyViewResourceCohort(
            table,
            getStudyViewResourceCohort(studyView(false))!
        );
        assert.equal(table.pageNumber, 0);
        assert.isUndefined(table.studyViewFilter);
    });

    describe('in a reaction', () => {
        const unfiltered = { studyIds: ['study_a'] };

        /**
         * A study view whose selection is a real MobxPromise, refetched when the filter changes
         * and resolved only when the test says so.
         */
        function fakeStudyView() {
            const state = observable(
                { filters: unfiltered as any, chartsAreFiltered: false },
                { filters: observable.ref }
            );
            const pending: (() => void)[] = [];
            const queried = remoteData({ invoke: () => Promise.resolve([]) });
            // As in StudyViewPageStore, the sample list awaits the queried identifiers.
            const all = remoteData<Sample[]>({
                await: () => [queried],
                invoke: () => Promise.resolve(samples as Sample[]),
            });
            const store = {
                get filters() {
                    return state.filters;
                },
                get chartsAreFiltered() {
                    return state.chartsAreFiltered;
                },
                samples: all,
                queriedSampleIdentifiers: queried,
                selectedSamples: remoteData<Sample[]>({
                    await: () => [all],
                    invoke: () => {
                        const filtered = state.chartsAreFiltered;
                        return new Promise<Sample[]>(resolve =>
                            pending.push(() =>
                                resolve(
                                    (filtered
                                        ? samples.slice(0, 1)
                                        : samples) as Sample[]
                                )
                            )
                        );
                    },
                }),
            };
            const setFilter = (filtered: boolean) =>
                runInAction(() => {
                    state.filters = filtered ? filters : unfiltered;
                    state.chartsAreFiltered = filtered;
                });
            const resolveSelection = async () => {
                // The selection invokes once the sample list resolves.
                while (pending.length === 0) {
                    await new Promise(resolve => setTimeout(resolve));
                }
                pending.splice(0).forEach(resolve => resolve());
                await when(
                    () => getStudyViewResourceCohort(store as any) !== undefined
                );
            };
            return { store: store as any, setFilter, resolveSelection };
        }

        function syncedTable(store: any) {
            const sets: ResourceCohort[] = [];
            const table = {
                cohort: EMPTY_RESOURCE_COHORT,
                setCohort(cohort: ResourceCohort) {
                    sets.push(cohort);
                    table.cohort = cohort;
                },
            };
            const dispose = autorun(() => {
                const cohort = getStudyViewResourceCohort(store);
                if (cohort) syncStudyViewResourceCohort(table, cohort);
            });
            return { sets, dispose };
        }

        it('sets the cohort once per filter change, with its own selection', async () => {
            const view = fakeStudyView();
            const { sets, dispose } = syncedTable(view.store);
            await view.resolveSelection();
            assert.lengthOf(sets, 1);

            view.setFilter(true);
            assert.lengthOf(
                sets,
                1,
                'nothing is set while the selection loads'
            );
            await view.resolveSelection();
            dispose();

            assert.lengthOf(sets, 2);
            assert.deepEqual(sets[1].studyViewFilter, filters as any);
            assert.deepEqual(sets[1].sampleIdentifiers, [
                { studyId: 'study_a', sampleId: 'sample_1' },
            ]);
        });

        it('never sends the filtered identifiers once the filter is cleared', async () => {
            const view = fakeStudyView();
            view.setFilter(true);
            const { sets, dispose } = syncedTable(view.store);
            await view.resolveSelection();
            assert.lengthOf(sets, 1);
            assert.deepEqual(sets[0].studyViewFilter, filters as any);

            view.setFilter(false);
            assert.lengthOf(sets, 1);
            await view.resolveSelection();
            dispose();

            assert.lengthOf(sets, 2);
            assert.deepEqual(resourceCohortFields(sets[1]), {
                studyIds: ['study_a'],
                patientIdentifiers: [],
                sampleIdentifiers: [],
            });
            // No cohort without a filter ever carried the filtered selection.
            sets.filter(c => !c.studyViewFilter).forEach(c =>
                assert.deepEqual(c.sampleIdentifiers, [])
            );
        });
    });
});
