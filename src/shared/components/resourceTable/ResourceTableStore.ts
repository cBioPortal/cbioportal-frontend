import _ from 'lodash';
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
    combinedTabOwners,
    IResourceTableRow,
    IResourceTableTab,
    ResourceTableStoreOptions,
    toResourceTableRows,
} from 'shared/lib/ResourceTableUtils';
import { resourceSearchTermForQuery } from 'shared/lib/ResourcePolicy';
import {
    PatientIdentifier,
    SampleIdentifier,
    StudyViewFilter,
} from 'cbioportal-ts-api-client';
import {
    ResourceCohort,
    resourceCohortFields,
    resourceIdFields,
} from './resourceTableCohort';

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

/** A tab of the table: one resource, or several read together (see CombinedResourceTab). */
export interface ResourceTableStoreTab extends ResourceTableTab {
    /** The resources the tab reads; `resourceId` is the tab's id. */
    resourceIds: string[];
}

/**
 * The tabs a table offers for the fetched per-resource tabs: each combined tab replaces the tabs
 * of its resources, at the position of the first of them in the fetched order, and reads those
 * present; then hideResource drops tabs by their id. A combined tab may share its id with one of
 * its members; a fetched resource sharing a combined tab's id without being a member is dropped.
 * A resource two combined tabs list belongs to the first (see combinedTabOwners).
 *
 * A combined tab's totalCount is its resources' sum. Its patient and sample counts are the
 * largest of theirs, a lower bound, since two resources can share a case; the table's header
 * shows the exact counts.
 */
export function buildResourceTableTabs(
    fetched: ResourceTableTab[],
    options: ResourceTableStoreOptions
): ResourceTableStoreTab[] {
    const combinedTabs = options.combinedTabs || [];
    const owners = combinedTabOwners(combinedTabs);
    const combinedIds = new Set(combinedTabs.map(tab => tab.id));
    const tabs: ResourceTableStoreTab[] = [];
    const placed = new Set<string>();
    fetched.forEach(tab => {
        const combined = owners.get(tab.resourceId);
        if (!combined) {
            // A resource that is not a member gives way to a combined tab with its id.
            if (!combinedIds.has(tab.resourceId)) {
                tabs.push({ ...tab, resourceIds: [tab.resourceId] });
            }
            return;
        }
        if (placed.has(combined.id)) {
            return;
        }
        placed.add(combined.id);
        const members = fetched.filter(
            t => owners.get(t.resourceId) === combined
        );
        tabs.push({
            resourceId: combined.id,
            label: combined.label,
            resourceIds: members.map(t => t.resourceId),
            totalCount: _.sumBy(members, t => t.totalCount),
            patientCount: _.max(members.map(t => t.patientCount)) || 0,
            sampleCount: _.max(members.map(t => t.sampleCount)) || 0,
        });
    });
    const hide = options.hideResource;
    return hide ? tabs.filter(tab => !hide(tab.resourceId)) : tabs;
}

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
    /** When set, the row and metadata requests send this as the cohort; see ResourceCohort. */
    @observable.ref studyViewFilter: StudyViewFilter | undefined;
    @observable selectedResourceId: string | undefined;
    /** Whether the store shows only selectedResourceId; see scopeToResource. */
    @observable isScoped = false;

    // Server-side state
    @observable pageNumber: number = 0;
    @observable pageSize: number = 25;
    @observable sortBy: string | undefined;
    @observable sortDirection: 'asc' | 'desc' = 'asc';
    @observable searchTerm: string = '';
    @observable.ref filters: ResourceColumnFilter[] = [];

    private readonly options: ResourceTableStoreOptions;

    constructor(options: ResourceTableStoreOptions = {}) {
        this.options = options;
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
        this.setCohort({ studyIds, patientIdentifiers, sampleIdentifiers });
    }

    /** Sets the cohort, including a study-view filter when it has one; see ResourceCohort. */
    @action
    setCohort(cohort: ResourceCohort) {
        this.studyIds = cohort.studyIds;
        this.patientIdentifiers = cohort.patientIdentifiers;
        this.sampleIdentifiers = cohort.sampleIdentifiers;
        this.studyViewFilter = cohort.studyViewFilter;
        this.pageNumber = 0;
        this.searchTerm = '';
        this.filters = [];
        // selectedResourceId survives a cohort change, so a scoped store stays on its resource.
        // A selection the new cohort's tabs lack resolves as activeResourceId describes.
    }

    @computed get cohort(): ResourceCohort {
        return {
            studyIds: this.studyIds,
            patientIdentifiers: this.patientIdentifiers,
            sampleIdentifiers: this.sampleIdentifiers,
            studyViewFilter: this.studyViewFilter,
        };
    }

    /**
     * Shows only this resource's tab: unlike setSelectedResourceId, the store never falls back to
     * another tab, and reads nothing while the tabs lack this one.
     */
    @action scopeToResource(resourceId: string) {
        this.isScoped = true;
        this.setSelectedResourceId(resourceId);
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

    /** The tabs the table offers; see buildResourceTableTabs. */
    @computed get visibleTabs(): ResourceTableStoreTab[] {
        return buildResourceTableTabs(this.tabs.result || [], this.options);
    }

    /**
     * The active tab's id: a resource id, or a combined tab's id. The selected tab while the tabs
     * load or once they include it. Once they have loaded without it (a cohort change removed
     * it, or the id is hidden, combined into another tab or unknown), a scoped store keeps it,
     * reading nothing, and any other store falls back to the first tab, as it does with no
     * selection.
     */
    @computed get activeResourceId(): string | undefined {
        const selected = this.selectedResourceId;
        if (
            selected &&
            (this.isScoped ||
                !this.tabs.isComplete ||
                this.visibleTabs.some(tab => tab.resourceId === selected))
        ) {
            return selected;
        }
        return this.visibleTabs[0]?.resourceId;
    }

    /**
     * The resources the active tab reads: those of its resources the cohort has, per the tabs.
     * None while the tabs load or when the tabs lack the active one, so a stale, hidden or
     * combined-away id is never read on its own, and none of a combined tab with no members
     * present, since the API rejects a resource that none of the studies holds.
     */
    @computed get activeResourceIds(): string[] {
        const active = this.activeResourceId;
        if (!active || !this.tabs.isComplete) {
            return [];
        }
        return (
            this.visibleTabs.find(tab => tab.resourceId === active)
                ?.resourceIds || []
        );
    }

    /** Whether the active tab's table leaves a metadata key out; see hideMetadataKey. */
    isMetadataKeyHidden(metadataKey: string): boolean {
        const hide = this.options.hideMetadataKey;
        return !!hide && hide(this.activeResourceIds, metadataKey);
    }

    /** The search sent to the backend; see resourceSearchTermForQuery. */
    @computed private get querySearchTerm(): string | undefined {
        return this.searchTerm
            ? resourceSearchTermForQuery(
                  this.activeResourceIds,
                  this.searchTerm
              )
            : undefined;
    }

    /**
     * The request without paging, or undefined when there is nothing to read. Both fetches start
     * from this; only the rows fetch adds pageNumber/pageSize, so turning a page does not re-run
     * the metadata fetch.
     */
    @computed private get baseQuery() {
        const resourceIds = this.activeResourceIds;
        if (resourceIds.length === 0 || this.studyIds.length === 0) {
            return undefined;
        }
        return {
            ...resourceCohortFields(this.cohort),
            ...resourceIdFields(resourceIds),
            sortBy: this.sortBy,
            direction: this.sortDirection,
            search: this.querySearchTerm,
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
            const query = this.baseQuery;
            if (!query) {
                return EMPTY_METADATA;
            }
            return fetchResourceTableMetadata({
                ...query,
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
            const query = this.baseQuery;
            if (!query) {
                return [];
            }
            return fetchResourceTableData({
                ...query,
                pageNumber: this.pageNumber,
                pageSize: this.pageSize,
            });
        },
        default: [],
    });

    /** Rows and columns both resolved, so the table can render in its final shape. */
    @computed get isTableReady(): boolean {
        return this.tableData.isComplete && this.tableMetadata.isComplete;
    }

    /** Display name of the resource currently shown, e.g. "Slide Microscopy". */
    @computed get activeResourceLabel(): string | undefined {
        const active = this.activeResourceId;
        return this.visibleTabs.find(tab => tab.resourceId === active)?.label;
    }

    @computed get tabsForDisplay(): IResourceTableTab[] {
        return this.visibleTabs.map(tab => ({
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
        return toResourceTableRows(this.tableData.result || []);
    }

    /**
     * Every row matching the current search, filters and sort. The table is server-paginated, so
     * downloading "the table" has to go back to the server rather than use the page on screen.
     * Nothing while the tabs load.
     */
    async fetchAllRowsForDownload(): Promise<IResourceTableRow[]> {
        // While the tabs reload, the active tab's resources are the previous cohort's.
        if (!this.tabs.isComplete) {
            return [];
        }
        const query = this.baseQuery;
        if (!query) {
            return [];
        }
        const result = await fetchResourceTableData({
            ...query,
            pageNumber: 0,
            pageSize: Math.min(
                Math.max(this.totalRowCount, 1),
                MAX_DOWNLOAD_ROWS
            ),
        });
        return toResourceTableRows(result);
    }
}
