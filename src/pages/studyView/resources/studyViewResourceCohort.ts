import _ from 'lodash';
import { toJS } from 'mobx';
import { StudyViewPageStore } from 'pages/studyView/StudyViewPageStore';
import {
    ResourceCohort,
    sameCohort,
    studyViewResourceCohort,
} from 'shared/components/resourceTable/resourceTableCohort';

/**
 * The resource-table cohort of a study view, or undefined until its selection has loaded. Read it
 * inside a reaction: it tracks the selection and the filter.
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
    const selected = store.selectedSamples.result;
    if (!selected) return undefined;
    return studyViewResourceCohort({
        selected,
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
