import _ from 'lodash';
import { toJS } from 'mobx';
import { StudyViewPageStore } from 'pages/studyView/StudyViewPageStore';
import {
    ResourceCohort,
    sameCohort,
    studyViewResourceCohort,
} from 'shared/components/resourceTable/resourceTableCohort';

/**
 * The resource-table cohort of a study view, or undefined while its selection is loading. Read it
 * inside a reaction: it tracks the selection and the filter.
 *
 * Undefined means "leave the cohort as it is". A MobxPromise keeps its previous result while it
 * refetches, so pairing the new filter with that result would set a cohort whose filter and
 * identifier lists disagree, and clearing the last filter would briefly send the old filtered
 * identifiers with no filter. Waiting for every promise the cohort reads to complete sets it
 * once per filter change, from a consistent selection.
 *
 * In hesitate mode, chart changes queue in `filtersProxy` until submitted, while `store.filters`
 * holds the submitted filter. The selection the charts show is fetched with the submitted filter,
 * so sending `store.filters`, not the queued one, keeps the table on the same cases as the charts.
 */
export function getStudyViewResourceCohort(
    store: Pick<
        StudyViewPageStore,
        | 'selectedSamples'
        | 'samples'
        | 'queriedSampleIdentifiers'
        | 'filters'
        | 'chartsAreFiltered'
    >
): ResourceCohort | undefined {
    if (
        !store.selectedSamples.isComplete ||
        !store.samples.isComplete ||
        !store.queriedSampleIdentifiers.isComplete
    ) {
        return undefined;
    }
    return studyViewResourceCohort({
        selected: store.selectedSamples.result!,
        all: store.samples.result,
        // store.samples is itself filtered to the queried identifiers for a virtual study or
        // case list, so "every sample is selected" does not mean "the whole study" there.
        coversWholeStudy: _.isEmpty(store.queriedSampleIdentifiers.result),
        // The same object the study-view chart requests send, as a plain snapshot.
        studyViewFilter: toJS(store.filters),
        chartsAreFiltered: store.chartsAreFiltered,
    });
}

/**
 * Gives a store the study view's cohort when it differs from the one it has. Setting a cohort
 * resets the table's paging, search and filters, so an unchanged cohort is not set again when the
 * reaction re-runs for an unrelated change.
 */
export function syncStudyViewResourceCohort(
    target: {
        cohort: ResourceCohort;
        setCohort: (cohort: ResourceCohort) => void;
    },
    cohort: ResourceCohort
) {
    if (!sameCohort(target.cohort, cohort)) {
        target.setCohort(cohort);
    }
}
