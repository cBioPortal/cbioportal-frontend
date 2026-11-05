import { action, computed, makeObservable, observable } from 'mobx';
import { remoteData } from 'cbioportal-frontend-commons';
import {
    fetchResourceTableGroups,
    fetchResourceTableMetadata,
    RESOURCE_GROUPS_MAX_COUNTS,
    RESOURCE_GROUPS_MAX_PAGE_SIZE,
    ResourceColumnFilter,
    ResourceGroupBy,
    ResourceGroupLocator,
    ResourceGroupSort,
    ResourceTableGroup,
    ResourceTableGroupPage,
    ResourceTableMetadataResult,
    ResourceTableQuery,
} from 'shared/api/resourceTableClient';
import {
    EMPTY_RESOURCE_COHORT,
    ResourceCohort,
    resourceCohortFields,
} from './resourceTableCohort';

export const EMPTY_GROUP_PAGE: ResourceTableGroupPage = {
    totalGroups: 0,
    totalRows: 0,
    locatedIndex: null,
    groups: [],
};

const EMPTY_METADATA: ResourceTableMetadataResult = {
    columns: [],
    totalRowCount: 0,
    filteredPatientCount: 0,
    filteredSampleCount: 0,
    facets: {},
    facetRanges: {},
    distinctValueCounts: {},
};

/** Whether groups/fetch accepts `sortBy` under `groupBy`. */
export function isGroupSortValid(
    sortBy: string | undefined,
    groupBy: ResourceGroupBy
): boolean {
    switch (sortBy) {
        case 'patientId':
        case 'studyId':
        case 'rowCount':
            return true;
        case 'sampleId':
            return groupBy === 'sample';
        default:
            return false;
    }
}

/** The group key a locator names under `groupBy`: its sample id or its patient id. */
function locatorKey(
    locate: ResourceGroupLocator,
    groupBy: ResourceGroupBy
): string | undefined {
    return groupBy === 'sample' ? locate.sampleId : locate.patientId;
}

const isBlank = (value: string | undefined) => !value || !value.trim();

/** Whether groups/fetch accepts the locator under `groupBy`: a study and the key it groups on. */
export function isLocatorValid(
    locate: ResourceGroupLocator,
    groupBy: ResourceGroupBy
): boolean {
    return !isBlank(locate.studyId) && !isBlank(locatorKey(locate, groupBy));
}

const METADATA_COLUMN_PREFIX = 'metadata:';

/** Whether groups/fetch can count `columnId`: `resourceId` or `metadata:<key>`. */
export function isGroupCountColumnValid(columnId: string): boolean {
    return (
        columnId === 'resourceId' ||
        (columnId.startsWith(METADATA_COLUMN_PREFIX) &&
            !isBlank(columnId.slice(METADATA_COLUMN_PREFIX.length)))
    );
}

/** groups/fetch rejects a page whose offset, pageNumber * pageSize, exceeds a Java int. */
const MAX_GROUP_OFFSET = 2 ** 31 - 1;

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

export interface ResourceTableGroupsState {
    cohort: ResourceCohort;
    resourceIds: string[];
    groupBy: ResourceGroupBy;
    groupCounts: string[];
    search: string;
    filters: ResourceColumnFilter[];
    sortBy?: ResourceGroupSort;
    direction: 'asc' | 'desc';
    pageNumber: number;
    pageSize: number;
    locate?: ResourceGroupLocator;
}

/**
 * The fields the groups and metadata requests share: which rows, and how they group. Undefined
 * when the state names no study or no resource and so cannot be answered.
 */
function groupedRowsQuery(
    state: ResourceTableGroupsState
): Omit<ResourceTableQuery, 'pageNumber' | 'pageSize'> | undefined {
    if (state.cohort.studyIds.length === 0 || state.resourceIds.length === 0) {
        return undefined;
    }
    return {
        ...resourceCohortFields(state.cohort),
        ...resourceIdFields(state.resourceIds),
        groupBy: state.groupBy,
        search: state.search || undefined,
        filters: state.filters.length > 0 ? state.filters : undefined,
    };
}

/**
 * The groups/fetch request for a grouped table's state, or undefined when it names no study or no
 * resource and so cannot be answered.
 *
 * A sort the grouping cannot order by, and a locator missing its study or the id the grouping
 * keys on, are left out rather than sent, since the backend rejects both.
 */
export function buildResourceTableGroupsQuery(
    state: ResourceTableGroupsState
): ResourceTableQuery | undefined {
    const rows = groupedRowsQuery(state);
    if (!rows) {
        return undefined;
    }
    const sortValid = isGroupSortValid(state.sortBy, state.groupBy);
    const locate =
        state.locate && isLocatorValid(state.locate, state.groupBy)
            ? state.locate
            : undefined;
    return {
        ...rows,
        groupCounts:
            state.groupCounts.length > 0 ? state.groupCounts : undefined,
        locate,
        sortBy: sortValid ? state.sortBy : undefined,
        direction: sortValid ? state.direction : undefined,
        pageNumber: state.pageNumber,
        pageSize: state.pageSize,
    };
}

/**
 * The metadata/fetch request for a grouped table: the same rows, with each facet value counting
 * the groups that carry it. It leaves out paging, sort, counts and locate, none of which changes
 * the metadata, so they do not re-run it.
 */
export function buildResourceTableGroupsMetadataQuery(
    state: ResourceTableGroupsState
): ResourceTableQuery | undefined {
    const rows = groupedRowsQuery(state);
    return rows && { ...rows, pageNumber: 0, pageSize: 0 };
}

/**
 * A resource table read one patient or one sample at a time, for views that list cases with
 * counts of their resources rather than the rows themselves. It renders nothing: a view reads
 * `groups`, `totalGroups` and `locatedIndex`, and drives paging, search, filters and sort through
 * the same requests ResourceTableStore sends.
 *
 * Search and column filters apply to rows before they are grouped, so a group whose rows are all
 * filtered out disappears. Paging and sort apply to groups.
 *
 * `locateGroup` asks for one group's position. The next result moves to the page holding it, once:
 * paging away afterwards stays put, while `locatedIndex` keeps reporting where the group is. Any
 * change the user makes before that result arrives (page, sort, search, filters, cohort, grouping)
 * cancels the move, so a slow answer never overrides it.
 *
 * Setters reject what groups/fetch would reject: an invalid sort or count column throws, rather
 * than being silently dropped from the request.
 */
export class GroupedResourceTableStore {
    @observable.ref cohort: ResourceCohort = EMPTY_RESOURCE_COHORT;
    @observable.ref resourceIds: string[] = [];
    @observable groupBy: ResourceGroupBy = 'patient';
    @observable.ref groupCounts: string[] = [];

    @observable pageNumber: number = 0;
    @observable pageSize: number = 50;
    @observable sortBy: ResourceGroupSort | undefined;
    @observable sortDirection: 'asc' | 'desc' = 'asc';
    @observable searchTerm: string = '';
    @observable.ref filters: ResourceColumnFilter[] = [];
    @observable.ref locate: ResourceGroupLocator | undefined;

    /**
     * Set by locateGroup until a result reports the located group's position, and cleared by
     * any change the user makes meanwhile.
     */
    private followLocate = false;

    /** totalGroups of the latest result for the current rows, or undefined until one arrives. */
    private knownTotalGroups: number | undefined;

    constructor() {
        makeObservable(this);
    }

    /** Sets the cohort; resets paging, search and filters as ResourceTableStore does. */
    @action setCohort(cohort: ResourceCohort) {
        this.cohort = cohort;
        this.resetRows();
        this.searchTerm = '';
        this.filters = [];
    }

    /**
     * The resources to group, read together as one table when there are several. Filters name
     * one resource's columns, so they reset along with search and paging.
     */
    @action setResourceIds(resourceIds: string[]) {
        this.resourceIds = resourceIds;
        this.resetRows();
        this.searchTerm = '';
        this.filters = [];
    }

    /** Changes the grouping; a locator names one grouping's key, so it is cleared too. */
    @action setGroupBy(groupBy: ResourceGroupBy) {
        this.groupBy = groupBy;
        this.resetRows();
        this.locate = undefined;
        if (!isGroupSortValid(this.sortBy, groupBy)) {
            this.sortBy = undefined;
        }
    }

    /**
     * Columns to count values of per group: `resourceId` or `metadata:<key>`. Repeats are
     * dropped; an invalid column, or more than RESOURCE_GROUPS_MAX_COUNTS distinct ones, throws
     * and leaves the counts as they were.
     */
    @action setGroupCounts(columnIds: string[]) {
        const distinct = Array.from(new Set(columnIds));
        const invalid = distinct.filter(id => !isGroupCountColumnValid(id));
        if (invalid.length > 0) {
            throw new Error(
                `groupCounts entries must be 'resourceId' or 'metadata:<key>', not ${invalid
                    .map(id => `'${id}'`)
                    .join(', ')}`
            );
        }
        if (distinct.length > RESOURCE_GROUPS_MAX_COUNTS) {
            throw new Error(
                `groupCounts may name at most ${RESOURCE_GROUPS_MAX_COUNTS} columns`
            );
        }
        this.groupCounts = distinct;
    }

    /**
     * Moves to a page: never below the first, past the last once a result has reported the
     * total, or beyond the offset groups/fetch accepts.
     */
    @action setPage(page: number) {
        let last = Math.floor(MAX_GROUP_OFFSET / this.pageSize);
        if (this.knownTotalGroups !== undefined) {
            last = Math.min(
                last,
                Math.max(
                    Math.ceil(this.knownTotalGroups / this.pageSize) - 1,
                    0
                )
            );
        }
        this.pageNumber = Math.min(Math.max(Math.floor(page), 0), last);
        this.followLocate = false;
    }

    @action setPageSize(size: number) {
        this.pageSize = Math.min(
            Math.max(Math.floor(size), 1),
            RESOURCE_GROUPS_MAX_PAGE_SIZE
        );
        this.pageNumber = 0;
        this.followLocate = false;
    }

    @action setSort(sortBy: ResourceGroupSort, direction: 'asc' | 'desc') {
        if (!isGroupSortValid(sortBy, this.groupBy)) {
            throw new Error(
                `Cannot sort ${this.groupBy} groups by '${sortBy}'`
            );
        }
        this.sortBy = sortBy;
        this.sortDirection = direction;
        this.pageNumber = 0;
        this.followLocate = false;
    }

    @action setSearchTerm(term: string) {
        this.searchTerm = term;
        this.resetRows();
    }

    @action setFilters(filters: ResourceColumnFilter[]) {
        this.filters = filters;
        this.resetRows();
    }

    /** Asks where a group is, and moves to its page when the answer arrives. */
    @action locateGroup(locate: ResourceGroupLocator) {
        // A fresh object, so asking for the same group again still re-requests and re-follows.
        this.locate = { ...locate };
        this.followLocate = true;
    }

    @action clearLocate() {
        this.locate = undefined;
        this.followLocate = false;
    }

    /**
     * After a change to which groups there are: back to the first page, the old total no longer
     * bounds paging, and a pending locate no longer moves the page.
     */
    private resetRows() {
        this.pageNumber = 0;
        this.knownTotalGroups = undefined;
        this.followLocate = false;
    }

    @computed get state(): ResourceTableGroupsState {
        return {
            cohort: this.cohort,
            resourceIds: this.resourceIds,
            groupBy: this.groupBy,
            groupCounts: this.groupCounts,
            search: this.searchTerm,
            filters: this.filters,
            sortBy: this.sortBy,
            direction: this.sortDirection,
            pageNumber: this.pageNumber,
            pageSize: this.pageSize,
            locate: this.locate,
        };
    }

    @computed get groupsQuery(): ResourceTableQuery | undefined {
        return buildResourceTableGroupsQuery(this.state);
    }

    /**
     * Compared structurally: it is derived from `state`, which changes with every page, so a new
     * but equal request must not re-run the metadata fetch.
     */
    @computed.struct get metadataQuery(): ResourceTableQuery | undefined {
        return buildResourceTableGroupsMetadataQuery(this.state);
    }

    /** The page of groups on screen. */
    readonly groups = remoteData<ResourceTableGroupPage>({
        invoke: async () => {
            const query = this.groupsQuery;
            return query ? fetchResourceTableGroups(query) : EMPTY_GROUP_PAGE;
        },
        default: EMPTY_GROUP_PAGE,
        onResult: page => this.onGroupsResult(page),
    });

    /** Columns, filter options and counts, with facet values counting groups. */
    readonly metadata = remoteData<ResourceTableMetadataResult>({
        invoke: async () => {
            const query = this.metadataQuery;
            return query ? fetchResourceTableMetadata(query) : EMPTY_METADATA;
        },
        default: EMPTY_METADATA,
    });

    @computed get groupsForDisplay(): ResourceTableGroup[] {
        return this.groups.result?.groups || [];
    }

    @computed get totalGroups(): number {
        return this.groups.result?.totalGroups || 0;
    }

    @computed get totalRows(): number {
        return this.groups.result?.totalRows || 0;
    }

    /** Position of the located group across every page, or null. */
    @computed get locatedIndex(): number | null {
        const index = this.groups.result?.locatedIndex;
        return index === undefined ? null : index;
    }

    @computed get pageCount(): number {
        return Math.ceil(this.totalGroups / this.pageSize);
    }

    @action private onGroupsResult(page: ResourceTableGroupPage | undefined) {
        if (!page) return;
        this.knownTotalGroups = page.totalGroups;
        if (!this.followLocate || !this.locate) return;
        this.followLocate = false;
        if (page.locatedIndex === null || page.locatedIndex === undefined) {
            return;
        }
        const target = Math.floor(page.locatedIndex / this.pageSize);
        if (target !== this.pageNumber) {
            this.pageNumber = target;
        }
    }
}
