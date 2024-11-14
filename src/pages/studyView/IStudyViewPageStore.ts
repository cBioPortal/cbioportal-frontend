// Which components do we need to adapt to IStudyViewPageStore:
// StudyPageHeader - YES
// StudySummaryTab - YES
// StudyResultsSummary - NO. Is "X patients Y samples" thing in header.
// ActionButtons - NO. For now, we won't show the bookmark modal either because that would entail the creation of a virtual study
// SettingsMenu - NO. This is not enabled by default, allows you to filter based on annotations for a study.
// - Needs custom driver annotations to be enabled.
// AddChartButton - YES. Is the "Charts" button.
// StudyViewPageSettingsMenu - YES? Disabling autosubmit for the StudyViewFilter is something also applicable to Enclave.

import {
    CancerStudy,
    Sample,
    SampleIdentifier,
    StudyViewFilter,
} from 'cbioportal-ts-api-client';
import { StudyViewURLQuery } from './StudyViewPageStore';
import { StudyViewPageTabKeyEnum } from './StudyViewPageTabs';
import { MobxPromise } from 'cbioportal-frontend-commons';
import { ClinicalDataCountSummary, DataBin } from './StudyViewUtils';

export interface IStudyViewPageStore {
    // **Applicable**

    readonly clinicalDataBinPromises: {
        [id: string]: MobxPromise<DataBin[]>;
    };
    readonly clinicalDataCountPromises: {
        [id: string]: MobxPromise<ClinicalDataCountSummary[]>;
    };

    // Sets up reactions
    initializeReaction(): void;

    // Self-explanatory
    resetToDefaultChartSettings(): void;

    // Disposes reactions
    destroy(): void;

    // The StudyViewFilter submitted in the POST data
    // If autosubmit is disabled, then `filtersProxy` is set instead. Then we will only "flush" changes from filtersProxy to filters when the "Submit" button is clicked.
    filters: StudyViewFilter;

    // **Kind of applicable**

    readonly currentTab: StudyViewPageTabKeyEnum;

    // Contains the study view filter passed from
    // (1) URL params
    // (2) window.studyPageFilter (where is this coming from?)
    // (3) window.postData
    studyViewQueryFilter: StudyViewURLQuery;

    // Applies the StudyViewFilter passed via URL to this study
    updateStoreFromURL(query: StudyViewURLQuery): Promise<void>;

    // queriedPhysicalStudies: all physical studies either specified directly OR spanned by one of the virtual studies
    readonly queriedPhysicalStudies: MobxPromise<CancerStudy[]>;
    // queriedPhysicalStudyIds: the study IDs of ^
    readonly queriedPhysicalStudyIds: MobxPromise<string[]>;
    // unknownQueriedIds: in studyIds, but not in filteredPhysicalStudies / filteredVirtualStudies
    readonly unknownQueriedIds: MobxPromise<string[]>;
    // displayedStudies: special-cased for a single virtual study, else is equivalent to queriedPhysicalStudies
    readonly displayedStudies: MobxPromise<CancerStudy[]>;

    // **Not really applicable / needs triage** (but we're including them anyways, for now)

    // studyIds: string[] are all studies that have been parsed from the URL by StudyViewQueryExtractor
    // filteredPhysicalStudies: all physical studies specified directly in studyIds
    // filteredVirtualStudies: all virtual studies specified directly in studyIds

    // queriedSampleIdentifiers: union of all sample IDs in physical studies + virtual studies from studyIds.
    //                           not necessarily restricted to the samples that fall within the StudyViewFilter-- this is more like the "range" of possible samples based on the studies
    readonly queriedSampleIdentifiers: MobxPromise<SampleIdentifier[]>;
    // samples: sample list returned from /api/filtered-samples
    //          if the user narrows the selection, this will still contain the selection defined by the original StudyViewFilter
    readonly samples: MobxPromise<Sample[]>;
    // selectedSamples: sample list returned from /api/filtered-samples
    //                  if the user narrows the selection, this will contain the selection defined by the updated StudyViewFilter
    readonly selectedSamples: MobxPromise<Sample[]>;
    // invalidSampleIds: in samples, but not in queriedSampleIdentifiers
    readonly invalidSampleIds: MobxPromise<SampleIdentifier[]>;
}
