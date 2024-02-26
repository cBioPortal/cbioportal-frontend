import { StudyViewPageStore } from 'pages/studyView/StudyViewPageStore';
import { MobxPromise } from 'cbioportal-frontend-commons';
import { ClinicalDataCountSummary } from 'pages/studyView/StudyViewUtils';

class ChildStore<IParentStore> {
    constructor(public parentStore: IParentStore) {}
}

export class ChartStore {
    constructor(public parentStore: StudyViewPageStore) {}

    public promises: {
        [id: string]: MobxPromise<ClinicalDataCountSummary[]>;
    } = {};
}
