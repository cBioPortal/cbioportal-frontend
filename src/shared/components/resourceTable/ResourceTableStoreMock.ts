/**
 * Mock implementation of ResourceTableStore for development and manual testing.
 *
 * Implements the same public interface as ResourceTableStore but uses in-memory
 * data from mockData.ts instead of hitting the backend.  Pagination, sort and
 * search all work locally so you can exercise every UI branch without a server.
 *
 * Usage – swap in FilesAndLinks.tsx or ResourcesTab.tsx:
 *
 *   // Replace:  private readonly resourceTableStore = new ResourceTableStore();
 *   // With:     private readonly resourceTableStore = new ResourceTableStoreMock();
 *
 * To revert: just swap back.  Never commit this swap to main.
 */

import { action, computed, makeObservable, observable } from 'mobx';
import { MOCK_ALL_ROWS, MOCK_COLUMNS, MOCK_TABS, buildMockResult } from './mockData';
import { ResourceTableResult, ResourceTableTab } from 'shared/api/resourceTableClient';

/** Minimal remoteData-compatible wrapper for a synchronously available value. */
function syncData<T>(value: T) {
    return {
        result: value,
        isPending: false,
        isError: false,
        isComplete: true,
    };
}

export class ResourceTableStoreMock {
    // ── Context (ignored – mock is study-agnostic) ────────────────────────────
    @observable studyIds: string[] = ['study_tcga_brca'];
    @observable patientIds: string[] = [];
    @observable sampleIds: string[] = [];

    // ── Table state ────────────────────────────────────────────────────────────
    @observable selectedResourceId: string = 'HE_SLIDE';
    @observable pageNumber: number = 0;
    @observable pageSize: number = 20;
    @observable searchTerm: string = '';
    @observable sortBy: string = '';
    @observable sortDirection: 'asc' | 'desc' = 'asc';

    constructor() {
        makeObservable(this);
    }

    // ── Tabs (static) ─────────────────────────────────────────────────────────
    readonly tabs = syncData<ResourceTableTab[]>(MOCK_TABS);

    // ── Table data (reactive: recomputes when observables change) ─────────────
    @computed get tableData() {
        return syncData<ResourceTableResult>(
            buildMockResult(
                this.selectedResourceId,
                this.pageNumber,
                this.pageSize,
                this.searchTerm || undefined,
                this.sortBy || undefined,
                this.sortDirection
            )
        );
    }

    // ── Actions ───────────────────────────────────────────────────────────────
    @action
    setContext(studyIds: string[], patientIds: string[], sampleIds: string[]) {
        this.studyIds = studyIds;
        this.patientIds = patientIds;
        this.sampleIds = sampleIds;
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
}

export default ResourceTableStoreMock;
