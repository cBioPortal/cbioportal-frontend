import { action, computed, makeObservable, observable } from 'mobx';
import { remoteData } from 'cbioportal-frontend-commons';
import {
    fetchResourceTableTabs,
    fetchResourceTableData,
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
 * Fetches tabs and rows from the resource-table v2 API.
 * Rows are loaded in bulk so the UI can do client-side
 * filtering / sorting / pagination via LazyMobXTable.
 */
export class ResourceTableStore {
    @observable studyIds: string[] = [];
    @observable patientIds: string[] = [];
    @observable sampleIds: string[] = [];
    @observable selectedResourceId: string | undefined;

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
    }

    @action
    setSelectedResourceId(resourceId: string) {
        this.selectedResourceId = resourceId;
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

    readonly tableData = remoteData<ResourceTableResult>({
        await: () => [this.tabs],
        invoke: async () => {
            const resourceId =
                this.selectedResourceId ||
                this.tabs.result?.[0]?.resourceId;
            if (!resourceId || this.studyIds.length === 0) {
                return EMPTY_RESULT;
            }
            return fetchResourceTableData({
                studyIds: this.studyIds,
                resourceId,
                patientIds: this.patientIds,
                sampleIds: this.sampleIds,
                pageNumber: 0,
                pageSize: 100000,
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

    @computed get rowsForDisplay(): IResourceTableRow[] {
        const result = this.tableData.result;
        if (!result) return [];

        return result.rows.map(
            (row: ResourceTableRow, index: number) => {
                const metadata: Record<string, string> = {};
                if (row.metadata) {
                    Object.entries(row.metadata).forEach(
                        ([key, value]) => {
                            if (value != null) {
                                metadata[key] = String(value);
                            }
                        }
                    );
                }

                // Derived metadata for file-type icons and host display
                metadata['resource_scope'] = row.resourceType || '';
                try {
                    const url = new URL(
                        row.url,
                        'https://www.cbioportal.org'
                    );
                    metadata['host'] = url.hostname;
                    const ext = url.pathname.split('.').pop();
                    metadata['file_type'] =
                        ext && ext.length <= 5
                            ? ext.toLowerCase()
                            : 'link';
                } catch {
                    metadata['file_type'] = 'link';
                }

                const patientId =
                    row.patientId || 'Study-wide';
                const sampleId =
                    row.sampleId ||
                    (row.resourceType === 'SAMPLE'
                        ? 'Sample-level'
                        : row.resourceType === 'PATIENT'
                        ? 'Patient-level'
                        : 'Study-level');

                return {
                    key: `${row.resourceId}::${row.patientId || 'study'}::${row.sampleId || row.resourceType}::${index}`,
                    patientId,
                    sampleId,
                    resourceType:
                        row.resourceDisplayName || row.resourceId,
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
            }
        );
    }
}
