import { action, computed, makeObservable, observable } from 'mobx';
import { remoteData } from 'cbioportal-frontend-commons';
import {
    fetchResourceTableTabs,
    fetchResourceTableData,
    fetchResourceTableMetadata,
    ResourceColumnFilter,
    ResourceColumnInfo,
    ResourceFacetOption,
    ResourceNumericRange,
    ResourceTableTab,
    ResourceTableMetadataResult,
    ResourceTableRow,
} from 'shared/api/resourceTableClient';
import {
    IResourceTableRow,
    IResourceTableTab,
} from 'shared/lib/ResourceTableUtils';
import {
    PatientIdentifier,
    Sample,
    SampleIdentifier,
} from 'cbioportal-ts-api-client';
import _ from 'lodash';

// Guards against a pathological resource pulling an unbounded result set into the browser.
const MAX_DOWNLOAD_ROWS = 100000;

const EMPTY_METADATA: ResourceTableMetadataResult = {
    columns: [],
    totalRowCount: 0,
    filteredPatientCount: 0,
    filteredSampleCount: 0,
    facets: {},
    facetRanges: {},
    distinctValueCounts: {},
};

/**
 * Server-side resource table store.
 * Pagination, sorting, search, and column filters are all delegated
 * to the backend. Facet options for filter dropdowns come from the
 * backend response.
 */
export class ResourceTableStore {
    @observable studyIds: string[] = [];
    @observable patientIdentifiers: PatientIdentifier[] = [];
    @observable sampleIdentifiers: SampleIdentifier[] = [];
    @observable selectedResourceId: string | undefined;

    // Server-side state
    @observable pageNumber: number = 0;
    @observable pageSize: number = 25;
    @observable sortBy: string | undefined;
    @observable sortDirection: 'asc' | 'desc' = 'asc';
    @observable searchTerm: string = '';
    @observable.ref filters: ResourceColumnFilter[] = [];

    constructor() {
        makeObservable(this);
    }

    /**
     * The cohort travels as (studyId, id) pairs rather than bare id lists: stable ids are unique
     * only within a study, so flat lists would let the backend match the cross product of the
     * selected studies and ids. See ResourceTabsRequest.
     */
    @action
    setContext(
        studyIds: string[],
        patientIdentifiers: PatientIdentifier[] = [],
        sampleIdentifiers: SampleIdentifier[] = []
    ) {
        this.studyIds = studyIds;
        this.patientIdentifiers = patientIdentifiers;
        this.sampleIdentifiers = sampleIdentifiers;
        this.selectedResourceId = undefined;
        this.pageNumber = 0;
        this.searchTerm = '';
        this.filters = [];
    }

    /**
     * Sets the cohort from a study view selection.
     *
     * The backend reads a request carrying no patient or sample identifiers as the whole of
     * `studyIds`, so when every sample is selected the identifiers describe the same cohort at a
     * cost that grows with the study. A study view opened without filters is exactly that case,
     * and it is also the largest: the identifiers would be sent again on every page turn, sort and
     * filter change. Passing `all` as undefined (the sample set has not loaded yet) keeps the
     * explicit list, which is correct either way.
     */
    @action
    setContextFromSelection(
        selected: Pick<Sample, 'studyId' | 'patientId' | 'sampleId'>[],
        all: Pick<Sample, 'studyId'>[] | undefined
    ) {
        if (all !== undefined && selected.length === all.length) {
            this.setContext(_.uniq(selected.map(s => s.studyId)));
        } else {
            this.setContextFromSamples(selected);
        }
    }

    /**
     * Derives the whole cohort from a sample set, keeping each id paired with its own study. Use
     * this wherever the cohort *is* the samples, so a call site cannot flatten the pairing away.
     * The patient view builds its context explicitly instead, because a patient with no samples
     * still has patient-level resources to show.
     */
    @action
    setContextFromSamples(
        samples: Pick<Sample, 'studyId' | 'patientId' | 'sampleId'>[]
    ) {
        this.setContext(
            _.uniq(samples.map(s => s.studyId)),
            _.uniqBy(
                samples.map(s => ({
                    studyId: s.studyId,
                    patientId: s.patientId,
                })),
                d => `${d.studyId}_${d.patientId}`
            ),
            samples.map(s => ({ studyId: s.studyId, sampleId: s.sampleId }))
        );
    }

    @action setSelectedResourceId(resourceId: string) {
        this.selectedResourceId = resourceId;
        this.pageNumber = 0;
        this.searchTerm = '';
        this.filters = [];
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

    @action setFilters(filters: ResourceColumnFilter[]) {
        this.filters = filters;
        this.pageNumber = 0;
    }

    readonly tabs = remoteData<ResourceTableTab[]>({
        invoke: async () => {
            if (this.studyIds.length === 0) return [];
            return fetchResourceTableTabs({
                studyIds: this.studyIds,
                patientIdentifiers: this.patientIdentifiers,
                sampleIdentifiers: this.sampleIdentifiers,
            });
        },
        default: [],
    });

    @computed get activeResourceId(): string | undefined {
        return this.selectedResourceId || this.tabs.result?.[0]?.resourceId;
    }

    /**
     * The cohort-scoped request, without paging. Both fetches start from this; only the rows
     * fetch adds pageNumber/pageSize, which is what keeps the metadata fetch from re-running
     * when the user turns a page.
     */
    @computed private get baseQuery() {
        return {
            studyIds: this.studyIds,
            patientIdentifiers: this.patientIdentifiers,
            sampleIdentifiers: this.sampleIdentifiers,
            sortBy: this.sortBy,
            direction: this.sortDirection,
            search: this.searchTerm || undefined,
            filters: this.filters.length > 0 ? this.filters : undefined,
        };
    }

    /**
     * Columns, filter options and counts. Deliberately does not read pageNumber or pageSize, so
     * MobX will not re-run it when the user pages. It is the expensive half of the response and
     * cannot change between pages of the same query.
     */
    readonly tableMetadata = remoteData<ResourceTableMetadataResult>({
        await: () => [this.tabs],
        invoke: async () => {
            const resourceId = this.activeResourceId;
            if (!resourceId || this.studyIds.length === 0) {
                return EMPTY_METADATA;
            }
            return fetchResourceTableMetadata({
                ...this.baseQuery,
                resourceId,
                pageNumber: 0,
                pageSize: 0,
            });
        },
        default: EMPTY_METADATA,
    });

    /** Just the page on screen. */
    readonly tableData = remoteData<ResourceTableRow[]>({
        await: () => [this.tabs],
        invoke: async () => {
            const resourceId = this.activeResourceId;
            if (!resourceId || this.studyIds.length === 0) {
                return [];
            }
            return fetchResourceTableData({
                ...this.baseQuery,
                resourceId,
                pageNumber: this.pageNumber,
                pageSize: this.pageSize,
            });
        },
        default: [],
    });

    /** Display name of the resource currently shown, e.g. "Slide Microscopy". */
    @computed get activeResourceLabel(): string | undefined {
        const active = this.activeResourceId;
        return (this.tabs.result || []).find(tab => tab.resourceId === active)
            ?.label;
    }

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
        return this.tableMetadata.result?.totalRowCount || 0;
    }

    @computed get filteredPatientCount(): number {
        return this.tableMetadata.result?.filteredPatientCount || 0;
    }

    @computed get filteredSampleCount(): number {
        return this.tableMetadata.result?.filteredSampleCount || 0;
    }

    @computed get distinctValueCounts(): Record<string, number> {
        return this.tableMetadata.result?.distinctValueCounts || {};
    }

    @computed get columns(): ResourceColumnInfo[] {
        return this.tableMetadata.result?.columns || [];
    }

    @computed get facets(): Record<string, ResourceFacetOption[]> {
        return this.tableMetadata.result?.facets || {};
    }

    @computed get facetRanges(): Record<string, ResourceNumericRange> {
        return this.tableMetadata.result?.facetRanges || {};
    }

    @computed get rowsForDisplay(): IResourceTableRow[] {
        return this.toDisplayRows(this.tableData.result || []);
    }

    /**
     * Every row matching the current search, filters and sort. The table is server-paginated, so
     * downloading "the table" has to go back to the server rather than use the page on screen.
     */
    async fetchAllRowsForDownload(): Promise<IResourceTableRow[]> {
        const resourceId = this.activeResourceId;
        if (!resourceId || this.studyIds.length === 0) {
            return [];
        }
        const result = await fetchResourceTableData({
            studyIds: this.studyIds,
            resourceId,
            patientIdentifiers: this.patientIdentifiers,
            sampleIdentifiers: this.sampleIdentifiers,
            pageNumber: 0,
            pageSize: Math.min(
                Math.max(this.totalRowCount, 1),
                MAX_DOWNLOAD_ROWS
            ),
            sortBy: this.sortBy,
            direction: this.sortDirection,
            search: this.searchTerm || undefined,
            filters: this.filters.length > 0 ? this.filters : undefined,
        });
        return this.toDisplayRows(result);
    }

    /** Maps API rows onto the shape the table renders. Shared by the page and the download. */
    private toDisplayRows(rows: ResourceTableRow[]): IResourceTableRow[] {
        return rows.map((row: ResourceTableRow, index: number) => {
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
                key: `${row.resourceId}::${row.patientId ||
                    'study'}::${row.sampleId || row.resourceType}::${index}`,
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
                studyId: row.studyId,
                patientStableId: row.patientId || undefined,
                sampleStableId: row.sampleId || undefined,
            } as IResourceTableRow;
        });
    }
}
