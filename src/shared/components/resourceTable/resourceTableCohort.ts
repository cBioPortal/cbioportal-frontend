import _ from 'lodash';
import {
    PatientIdentifier,
    Sample,
    SampleIdentifier,
    StudyViewFilter,
} from 'cbioportal-ts-api-client';
import { ResourceTableQuery } from 'shared/api/resourceTableClient';

/**
 * Which cases a resource table reads.
 *
 * The identifier lists travel as (studyId, id) pairs rather than bare id lists: stable ids are
 * unique only within a study, so flat lists would let the backend match the cross product of the
 * selected studies and ids. Empty lists mean every case in `studyIds`.
 *
 * `studyViewFilter`, when set, is the cohort for the row, metadata and groups requests, which send
 * it in place of the lists. The tabs request takes no filter, so it still reads the lists.
 */
export interface ResourceCohort {
    studyIds: string[];
    patientIdentifiers: PatientIdentifier[];
    sampleIdentifiers: SampleIdentifier[];
    studyViewFilter?: StudyViewFilter;
}

export const EMPTY_RESOURCE_COHORT: ResourceCohort = {
    studyIds: [],
    patientIdentifiers: [],
    sampleIdentifiers: [],
};

type CohortSample = Pick<Sample, 'studyId' | 'patientId' | 'sampleId'>;

/**
 * The cohort fields of a row, metadata or groups request: the study-view filter when the cohort
 * has one, the identifier lists otherwise. Never both, so a filtered study view does not also
 * send every selected sample.
 */
export function resourceCohortFields(
    cohort: ResourceCohort
): Pick<
    ResourceTableQuery,
    'studyIds' | 'patientIdentifiers' | 'sampleIdentifiers' | 'studyViewFilter'
> {
    if (cohort.studyViewFilter) {
        return {
            studyIds: cohort.studyIds,
            studyViewFilter: cohort.studyViewFilter,
        };
    }
    return {
        studyIds: cohort.studyIds,
        patientIdentifiers: cohort.patientIdentifiers,
        sampleIdentifiers: cohort.sampleIdentifiers,
    };
}

/**
 * The whole cohort derived from a sample set, keeping each id paired with its own study. The
 * patient view builds its cohort explicitly instead, because a patient with no samples still has
 * patient-level resources to show.
 */
export function cohortFromSamples(samples: CohortSample[]): ResourceCohort {
    return {
        studyIds: _.uniq(samples.map(s => s.studyId)),
        patientIdentifiers: _.uniqBy(
            samples.map(s => ({ studyId: s.studyId, patientId: s.patientId })),
            d => `${d.studyId}_${d.patientId}`
        ),
        sampleIdentifiers: samples.map(s => ({
            studyId: s.studyId,
            sampleId: s.sampleId,
        })),
    };
}

/**
 * The cohort of a study view selection, as identifier lists.
 *
 * The backend reads a request carrying no patient or sample identifiers as the whole of
 * `studyIds`, so sending none is cheaper when the selection already is the whole study. That
 * shortcut is only equivalent when the query covers the whole physical study: a virtual study or
 * case list queries a subset, and `all` is then that subset too, so the counts match while the
 * cohorts do not. `coversWholeStudy` false, or `all` not yet loaded, keeps the explicit list,
 * which is correct either way.
 */
export function cohortFromSelection(
    selected: CohortSample[],
    all: Pick<Sample, 'studyId'>[] | undefined,
    coversWholeStudy: boolean = false
): ResourceCohort {
    if (
        coversWholeStudy &&
        all !== undefined &&
        selected.length === all.length
    ) {
        return {
            studyIds: _.uniq(selected.map(s => s.studyId)),
            patientIdentifiers: [],
            sampleIdentifiers: [],
        };
    }
    return cohortFromSamples(selected);
}

/** Whether two cohorts name the same cases the same way. */
export function sameCohort(a: ResourceCohort, b: ResourceCohort): boolean {
    return (
        _.isEqual(a.studyIds, b.studyIds) &&
        _.isEqual(a.patientIdentifiers, b.patientIdentifiers) &&
        _.isEqual(a.sampleIdentifiers, b.sampleIdentifiers) &&
        _.isEqual(a.studyViewFilter, b.studyViewFilter)
    );
}

export interface StudyViewCohortInput {
    /** The samples the study view's filters select. */
    selected: CohortSample[];
    /** Every sample the study view queries; undefined while loading. */
    all: Pick<Sample, 'studyId'>[] | undefined;
    /** False for a virtual study or case list, which queries a subset of its physical studies. */
    coversWholeStudy: boolean;
    /** The study view's filter, the object its chart requests send. */
    studyViewFilter: StudyViewFilter;
    /** Whether any chart filter is applied. */
    chartsAreFiltered: boolean;
}

/**
 * The cohort of the study view.
 *
 * Unfiltered and over whole studies, it is just the studies: requests send neither identifiers nor
 * a filter. Otherwise the row, metadata and groups requests send the study view's filter and the
 * backend resolves it, rather than the browser expanding the selection into one identifier per
 * sample. The identifier lists are kept for the tabs request, which takes no filter.
 */
export function studyViewResourceCohort(
    input: StudyViewCohortInput
): ResourceCohort {
    const cohort = cohortFromSelection(
        input.selected,
        input.all,
        input.coversWholeStudy
    );
    if (!input.chartsAreFiltered && input.coversWholeStudy) {
        return cohort;
    }
    return { ...cohort, studyViewFilter: input.studyViewFilter };
}

/**
 * The resources a request reads: one goes in `resourceId`, several in `resourceIds`, which the
 * backend reads together as one table.
 */
export function resourceIdFields(
    resourceIds: string[]
): Pick<ResourceTableQuery, 'resourceId' | 'resourceIds'> {
    return resourceIds.length === 1
        ? { resourceId: resourceIds[0] }
        : { resourceIds };
}
