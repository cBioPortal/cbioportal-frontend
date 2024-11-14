import { MobxPromise } from 'cbioportal-frontend-commons';
import {
    StudyViewFilter,
    CancerStudy,
    SampleIdentifier,
    Sample,
} from 'cbioportal-ts-api-client';
import { IStudyViewPageStore } from './IStudyViewPageStore';
import { StudyViewURLQuery } from './StudyViewPageStore';
import { StudyViewPageTabKeyEnum } from './StudyViewPageTabs';
import { DataBin, ClinicalDataCountSummary } from './StudyViewUtils';

export class DashboardPageStore implements IStudyViewPageStore {
    clinicalDataBinPromises: { [id: string]: MobxPromise<DataBin[]> };
    clinicalDataCountPromises: {
        [id: string]: MobxPromise<ClinicalDataCountSummary[]>;
    };
    initializeReaction(): void {
        // no-op
    }
    resetToDefaultChartSettings(): void {
        // TODO
    }
    destroy(): void {
        // no-op
    }
    filters: StudyViewFilter;
    currentTab: StudyViewPageTabKeyEnum;
    studyViewQueryFilter: StudyViewURLQuery;
    updateStoreFromURL(query: StudyViewURLQuery): Promise<void> {
        throw new Error('Method not implemented.');
    }
    queriedPhysicalStudies: MobxPromise<CancerStudy[]>;
    queriedPhysicalStudyIds: MobxPromise<string[]>;
    unknownQueriedIds: MobxPromise<string[]>;
    displayedStudies: MobxPromise<CancerStudy[]>;
    queriedSampleIdentifiers: MobxPromise<SampleIdentifier[]>;
    samples: MobxPromise<Sample[]>;
    selectedSamples: MobxPromise<Sample[]>;
    invalidSampleIds: MobxPromise<SampleIdentifier[]>;
}
