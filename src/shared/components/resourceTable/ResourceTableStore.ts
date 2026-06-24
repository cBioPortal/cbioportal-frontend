import { action, computed, makeObservable, observable } from 'mobx';
import { remoteData } from 'cbioportal-frontend-commons';
import {
    fetchResourceTableTabs,
    fetchResourceTableData,
    ResourceColumnFilter,
    ResourceTableTab,
    ResourceTableResult,
    ResourceTableRow,
} from 'shared/api/resourceTableClient';
import {
    IResourceTableRow,
    IResourceTableTab,
} from 'shared/lib/ResourceTableUtils';

const EMPTY_RESULT: ResourceTableResult = {
    tabs: [],
    columns: [],
    rows: [],
    totalRowCount: 0,
    filteredPatientCount: 0,
    filteredSampleCount: 0,
    facets: {},
};

/**
 * Server-side resource table store.
 * Pagination, sorting, and search are delegated to the backend.
 * The LazyMobXTable handles client-side column filters on the
 * current page data for responsive UX.
 */
export class ResourceTableStore {
    @observable studyIds: string[] = [];
    @observable patientIds: string[] = [];
    @observable sampleIds: string[] = [];
    @observable selectedResourceId: string | undefined;

    // Server-side state
    @observable pageNumber: number = 0;
    @observable pageSize: number = 25;
    @observable sortBy: string | undefined;
    @observable sortDirection: 'asc' | 'desc' = 'asc';
    @observable searchTerm: string = '';

    constructor() {
        makeObservable(this);
    }

    @action
    setContext(
        studyIds: string[],
        patientIds: string[] = [],
        sampleIds: string[] = []
    ) {
        this.studyIds = studyIds;
        this.patientIds = patientIds;
        this.sampleIds = sampleIds;
        this.selectedResourceId = undefined;
        this.pageNumber = 0;
        this.searchTerm = '';
    }

    @action setSelectedResourceId(resourceId: string) {
        this.selectedResourceId = resourceId;
        this.pageNumber = 0;
        this.searchTerm = '';
    }

    @action setPage(page: number) {
        this.pageNumber = page;
    }

    @action setPageSize(size: number) {
        this.pageSize = size;
        this.pageNumber = 0;
    }

    @action setSort(sortBy: string, direction: 'asc' | 'desc') {
        this.sortBy = sortBy;
        this.sortDirection = direction;
        this.pageNumber = 0;
    }

    @action setSearchTerm(term: string) {
        this.searchTerm = term;
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
    });

    @computed get activeResourceId(): string | undefined {
        return this.selectedResourceId || this.tabs.result?.[0]?.resourceId;
    }

    readonly tableData = remoteData<ResourceTableResult>({
        await: () => [this.tabs],
        invoke: async () => {
            const resourceId = this.activeResourceId;
                return EMPTY_RESULT;
            }
            return fetchResourceTableData({
                studyIds: this.studyIds,
                resourceId,
                patientIds: this.patientIds,
                sampleIds: this.sampleIds,
                pageNumber: this.pageNumber,
                pageSize: this.pageSize,
                sortBy: this.sortBy,
                direction: this.sortDirection,
                search: this.searchTerm || undefined,
            });
        },
        default: EMPTY_RESULT,
    });

    @computed get tabsForDisplay(): IResourceTableTab[] {
        return (this.tabs.result || []).map(tab => ({
            id: tab.resourceId,
            label: tab.label,
            totalCount: tab.totalCount,
            patientCount: tab.patientCount,
            sampleCount: tab.sampleCount,
        }));
    }

    @computed get totalRowCount(): number {
        return this.tableData.result?.totalRowCount || 0;
    }

    @computed get filteredPatientCount(): number {
        return this.tableData.result?.filteredPatientCount || 0;
    }

    @computed get filteredSampleCount(): number {
        return this.tableData.result?.filteredSampleCount || 0;
    }

    @computed get rowsForDisplay(): IResourceTableRow[] {
        const result = this.tableData.result;

        return result.rows.map((row: ResourceTableRow, index: number) => {
            const metadata: Record<string, string> = {};
            if (row.metadata) {
                Object.entries(row.metadata).forEach(([key, value]) => {
                    if (value != null) {
                        metadata[key] = String(value);
                    }
                });
            }
            metadata['resource_scope'] = row.resourceType || '';
            try {
                const url = new URL(row.url, 'https://www.cbioportal.org');
                metadata['host'] = url.hostname;
                const ext = url.pathname.split('.').pop();
                metadata['file_type'] =
                    ext && ext.length <= 5 ? ext.toLowerCase() : 'link';
            } catch {
                metadata['file_type'] = 'link';
            }

            return {
                key: `${row.resourceId}::${row.patientId || 'study'}::${row.sampleId || row.resourceType}::${index}`,
                patientId: row.patientId || 'Study-wide',
                sampleId:
                    row.sampleId ||
                    (row.resourceType === 'SAMPLE'
                        ? 'Sample-level'
                        : row.resourceType === 'PATIENT'
                        ? 'Patient-level'
                        : 'Study-level'),
                resourceType: row.resourceDisplayName || row.resourceId,
                resourceScope: row.resourceType,
                resourceId: row.resourceId,
                description: row.displayName || '',
                url: row.url,
                metadata,
                resource: {
                    resourceId: row.resourceId,
                    url: row.url,
                    patientId: row.patientId || undefined,
                    sampleId: row.sampleId || undefined,
                    studyId: row.studyId,
                    resourceDefinition: {
                        resourceId: row.resourceId,
                        displayName: row.resourceDisplayName,
                        resourceType: row.resourceType,
                        description: row.displayName || '',
                        openByDefault: false,
                        priority: String(row.priority),
                    },
                } as any,
            } as IResourceTableRow;
        });
    }
}
