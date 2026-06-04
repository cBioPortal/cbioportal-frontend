import { action, makeObservable, observable } from 'mobx';
import { remoteData } from 'cbioportal-frontend-commons';
import {
    fetchResourceTableTabs,
    fetchResourceTableData,
    ResourceTableResult,
    ResourceTableTab,
} from 'shared/api/resourceTableClient';

const EMPTY_RESULT: ResourceTableResult = {
    tabs: [],
    columns: [],
    rows: [],
    totalRowCount: 0,
    filteredPatientCount: 0,
    filteredSampleCount: 0,
    facets: {},
};

export class ResourceTableStore {
    // ── Context inputs ─────────────────────────────────────────────────────────
    @observable studyIds: string[] = [];
    @observable patientIds: string[] = [];
    @observable sampleIds: string[] = [];

    // ── Table state ────────────────────────────────────────────────────────────
    @observable selectedResourceId: string = '';
    @observable pageNumber: number = 0;
    @observable pageSize: number = 20;
    @observable searchTerm: string = '';
    @observable sortBy: string = '';
    @observable sortDirection: 'asc' | 'desc' = 'asc';

    constructor() {
        makeObservable(this);
    }

    @action
    setContext(
        studyIds: string[],
        patientIds: string[],
        sampleIds: string[]
    ) {
        this.studyIds = studyIds;
        this.patientIds = patientIds;
        this.sampleIds = sampleIds;
        this.selectedResourceId = '';
        this.pageNumber = 0;
        this.searchTerm = '';
    }

    @action
    selectTab(resourceId: string) {
        this.selectedResourceId = resourceId;
        this.pageNumber = 0;
        this.searchTerm = '';
        this.sortBy = '';
        this.sortDirection = 'asc';
    }

    @action
    setPage(page: number) {
        this.pageNumber = page;
    }

    @action
    setPageSize(size: number) {
        this.pageSize = size;
        this.pageNumber = 0;
    }

    @action
    setSearch(term: string) {
        this.searchTerm = term;
        this.pageNumber = 0;
    }

    @action
    setSort(columnId: string, direction: 'asc' | 'desc') {
        this.sortBy = columnId;
        this.sortDirection = direction;
        this.pageNumber = 0;
    }

    readonly tabs = remoteData<ResourceTableTab[]>({
        invoke: async () => {
            if (this.studyIds.length === 0) return [];
            return fetchResourceTableTabs({
                studyIds: this.studyIds,
                patientIds: this.patientIds,
                sampleIds: this.sampleIds,
            });
        },
        default: [],
        onResult: action((tabs: ResourceTableTab[]) => {
            // auto-select the first tab when tabs load and none is selected yet
            if (tabs.length > 0 && !this.selectedResourceId) {
                this.selectTab(tabs[0].resourceId);
            }
        }),
    });

    readonly tableData = remoteData<ResourceTableResult>({
        await: () => [this.tabs],
        invoke: async () => {
            if (!this.selectedResourceId || this.studyIds.length === 0) {
                return EMPTY_RESULT;
            }
            return fetchResourceTableData({
                studyIds: this.studyIds,
                resourceId: this.selectedResourceId,
                patientIds: this.patientIds,
                sampleIds: this.sampleIds,
                search: this.searchTerm || undefined,
                pageNumber: this.pageNumber,
                pageSize: this.pageSize,
                sortBy: this.sortBy || undefined,
                direction: this.sortBy ? this.sortDirection : undefined,
            });
        },
        default: EMPTY_RESULT,
    });
}
