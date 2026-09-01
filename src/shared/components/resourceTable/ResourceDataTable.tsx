import * as React from 'react';
import pluralize from 'pluralize';
import {
    action,
    autorun,
    computed,
    IReactionDisposer,
    makeObservable,
    observable,
} from 'mobx';
import { observer } from 'mobx-react';
import LoadingIndicator from 'shared/components/loadingIndicator/LoadingIndicator';
import ServerDrivenTable, {
    ServerDrivenTableColumn,
    ServerDrivenTableNumericRange,
} from 'shared/components/serverDrivenTable/ServerDrivenTable';
import TabbedTableLayout from 'shared/components/tabbedTable/TabbedTableLayout';
import {
    getPatientViewUrlWithPathname,
    getSampleViewUrlWithPathname,
} from 'shared/api/urls';
import {
    ResourceColumnFilter,
    ResourceColumnInfo,
} from 'shared/api/resourceTableClient';
import {
    IResourceTableRow,
    getResourceTableMetadataKeys,
} from 'shared/lib/ResourceTableUtils';
import { ResourceTableStore } from './ResourceTableStore';

export interface IResourceDataTableProps {
    store: ResourceTableStore;
    resourceLabel?: string;
    emptyText?: string;
    searchPlaceholder?: string;
    hideTabs?: boolean;
    scopedResourceId?: string;
}

// Matches the study view's Clinical Data tab, so a wide or long resource table
// scrolls inside its own viewport rather than pushing the page.
const RESOURCE_TABLE_MAX_HEIGHT = 'calc(100vh - 220px)';
const NOT_AVAILABLE = '';
const NO_DESCRIPTION = 'No description provided';
const BACKEND_SCOPE_COLUMN_ID = 'type';
const SORT_FIELD_MAP: Record<string, string> = {
    patientId: 'patientId',
    sampleId: 'sampleId',
    resourceType: 'resourceDisplayName',
    resourceScope: BACKEND_SCOPE_COLUMN_ID,
    description: 'displayName',
};
const SORT_COLUMN_MAP: Record<string, string> = {
    patientId: 'patientId',
    sampleId: 'sampleId',
    resourceDisplayName: 'resourceType',
    type: 'resourceScope',
    displayName: 'description',
};

function getFileExtension(url: string): string | undefined {
    try {
        const urlObj = new URL(url, 'https://www.cbioportal.org');
        const match = urlObj.pathname.match(/.+\.(.+)/);
        return match ? match[1].toLowerCase() : undefined;
    } catch {
        return undefined;
    }
}

function icon(url: string) {
    const ext = getFileExtension(url);
    const className =
        ext === 'pdf'
            ? 'fa fa-file-pdf-o'
            : ['png', 'jpeg', 'jpg', 'gif'].includes(ext || '')
            ? 'fa fa-file-image-o'
            : ['m4a', 'flac', 'mp3', 'mp4', 'wav'].includes(ext || '')
            ? 'fa fa-file-audio-o'
            : '';

    return className ? (
        <i
            className={`${className} fa-sm`}
            style={{ marginRight: 5, color: 'black' }}
        />
    ) : null;
}

@observer
export class ResourceDataTable extends React.Component<
    IResourceDataTableProps
> {
    public static defaultProps = {
        resourceLabel: 'resources',
        emptyText: 'There are no matching resources.',
        searchPlaceholder:
            'Search patient ID, sample ID, resource, or metadata...',
    };

    @observable.ref private activeFilters: Record<string, Set<string>> = {};
    @observable.ref private activeRangeFilters: Record<
        string,
        ServerDrivenTableNumericRange
    > = {};
    private scopedResourceDisposer: IReactionDisposer | null = null;

    constructor(props: IResourceDataTableProps) {
        super(props);
        makeObservable(this);
    }

    public componentDidMount() {
        this.syncScopedResourceId();
    }

    public componentDidUpdate(prevProps: IResourceDataTableProps) {
        if (prevProps.scopedResourceId !== this.props.scopedResourceId) {
            this.clearActiveFilters();
            this.syncScopedResourceId();
        }
    }

    public componentWillUnmount() {
        this.scopedResourceDisposer?.();
        this.scopedResourceDisposer = null;
    }

    @computed get rows(): IResourceTableRow[] {
        return this.props.store.rowsForDisplay || [];
    }

    /**
     * Metadata columns as the backend describes them: discovered from the data, then decorated
     * with the resource's `custom_metadata` contract where it declares a label, description,
     * type or filterability. Ordering is the backend's too — contract-declared fields first, in
     * declaration order.
     */
    @computed get metadataColumnInfos(): ResourceColumnInfo[] {
        return this.props.store.columns.filter(
            column => column.source === 'metadata'
        );
    }

    /**
     * Fallback for responses that carry no metadata column info: derive the keys from the facets,
     * else from the rows themselves, and sort alphabetically.
     */
    @computed get metadataKeys(): string[] {
        const facetKeys = Object.keys(this.props.store.facets)
            .filter(key => key.startsWith('metadata:'))
            .map(key => key.slice('metadata:'.length));
        const rangeKeys = Object.keys(this.props.store.facetRanges)
            .filter(key => key.startsWith('metadata:'))
            .map(key => key.slice('metadata:'.length));
        const allKeys = Array.from(new Set([...facetKeys, ...rangeKeys]));
        return allKeys.length > 0
            ? allKeys.sort((a, b) =>
                  a.toLowerCase().localeCompare(b.toLowerCase())
              )
            : getResourceTableMetadataKeys(this.rows);
    }

    @computed get metadataColumns(): ServerDrivenTableColumn<
        IResourceTableRow
    >[] {
        const infos = this.metadataColumnInfos;
        if (infos.length > 0) {
            return infos.map(info =>
                this.createMetadataColumn(
                    info.id.slice('metadata:'.length),
                    info.label,
                    {
                        visible: info.visibleByDefault,
                        sortable: info.sortable,
                        filterable: info.filterable,
                        dataType:
                            info.dataType === 'number' ? 'number' : 'string',
                        description: info.description || undefined,
                    }
                )
            );
        }
        return this.metadataKeys.map(metadataKey =>
            this.createMetadataColumn(metadataKey, metadataKey, {
                visible: false,
                dataType: this.isNumericMetadataKey(metadataKey)
                    ? 'number'
                    : 'string',
            })
        );
    }

    private createMetadataColumn(
        metadataKey: string,
        label: string,
        overrides: Partial<ServerDrivenTableColumn<IResourceTableRow>>
    ): ServerDrivenTableColumn<IResourceTableRow> {
        return this.createColumn(
            `metadata:${metadataKey}`,
            label,
            row => <span>{row.metadata[metadataKey] || NOT_AVAILABLE}</span>,
            row => row.metadata[metadataKey] || NOT_AVAILABLE,
            overrides
        );
    }

    private isNumericMetadataKey(metadataKey: string): boolean {
        return !!this.props.store.facetRanges[`metadata:${metadataKey}`];
    }

    /**
     * A builtin column carrying the same value in every row of the filtered set tells the user
     * nothing, so it starts hidden and stays available under "Add columns". In a single-resource
     * tab "Resource Type" is always the resource's own name, "Scope" is usually one entity type,
     * and "Details" is often blank throughout. The counts come from the backend, so this reflects
     * the whole result set rather than just the page on screen.
     */
    private isSingleValuedColumn(columnId: string): boolean {
        const backendField = SORT_FIELD_MAP[columnId];
        const distinct = backendField
            ? this.props.store.distinctValueCounts[backendField]
            : undefined;
        return distinct !== undefined && distinct <= 1;
    }

    @computed get shouldShowSampleIdColumn() {
        return this.rows.some(row => !!row.resource?.sampleId);
    }

    @computed get tabs() {
        return this.props.hideTabs
            ? []
            : this.props.store.tabsForDisplay.map(tab => ({
                  id: tab.id,
                  label: tab.label,
                  count: tab.totalCount,
              }));
    }

    @computed get activeTabId() {
        return this.props.scopedResourceId || this.props.store.activeResourceId;
    }

    @computed get currentSortColumn() {
        const backendSortBy = this.props.store.sortBy;
        return backendSortBy
            ? SORT_COLUMN_MAP[backendSortBy] || backendSortBy
            : 'patientId';
    }

    @computed get remappedFacets() {
        const remapped: Record<string, { value: string; count: number }[]> = {};
        Object.entries(this.props.store.facets).forEach(
            ([columnId, options]) => {
                remapped[
                    columnId === BACKEND_SCOPE_COLUMN_ID
                        ? 'resourceScope'
                        : columnId
                ] = options;
            }
        );
        return remapped;
    }

    @computed get remappedFacetRanges() {
        // no builtin column currently uses a numeric range facet, so no
        // BACKEND_SCOPE_COLUMN_ID-style remapping is needed here (unlike
        // remappedFacets) — metadata:* keys already match column ids as-is.
        return this.props.store.facetRanges;
    }

    @computed
    get tableColumns(): ServerDrivenTableColumn<IResourceTableRow>[] {
        return [
            this.createColumn(
                'patientId',
                'Patient ID',
                this.renderPatientId,
                row => row.patientId,
                {
                    filterable: false,
                }
            ),
            ...(this.shouldShowSampleIdColumn
                ? [
                      this.createColumn(
                          'sampleId',
                          'Sample ID',
                          this.renderSampleId,
                          row => row.sampleId,
                          { filterable: false }
                      ),
                  ]
                : []),
            this.createColumn(
                'resourceType',
                'Resource Type',
                row => (
                    <span>
                        {icon(row.url)}
                        {row.resourceType}
                    </span>
                ),
                row => row.resourceType,
                { visible: !this.isSingleValuedColumn('resourceType') }
            ),
            this.createColumn(
                'resourceScope',
                'Scope',
                row => <span>{row.resourceScope}</span>,
                row => row.resourceScope,
                { visible: !this.isSingleValuedColumn('resourceScope') }
            ),
            ...this.metadataColumns,
            this.createColumn(
                'description',
                'Details',
                row => <span>{row.description || NO_DESCRIPTION}</span>,
                row => row.description || NO_DESCRIPTION,
                { visible: !this.isSingleValuedColumn('description') }
            ),
            this.createColumn(
                'actions',
                'Actions',
                row => (
                    <a href={row.url} target="_blank" rel="noopener noreferrer">
                        <i
                            className="fa fa-external-link fa-sm"
                            style={{ marginRight: 5, color: 'black' }}
                        />
                        Open in new window
                    </a>
                ),
                () => 'Open in new window',
                { sortable: false, filterable: false, togglable: false }
            ),
        ];
    }

    /**
     * What to call the rows. The resource's own display name reads far better than a generic
     * "resources" — "3,074 Slide Microscopies" rather than "3,074 resources" — so use it when the
     * tab has loaded and fall back to the caller's label otherwise.
     */
    @computed get itemsLabel(): string {
        const resourceName = this.props.store.activeResourceLabel;
        return resourceName
            ? pluralize(resourceName, this.props.store.totalRowCount)
            : this.props.resourceLabel || 'items';
    }

    private downloadAllRows = () => this.props.store.fetchAllRowsForDownload();

    @computed get downloadFilename(): string {
        const name = this.props.store.activeResourceLabel || 'resources';
        return `${name.replace(/[^\w.-]+/g, '_').toLowerCase()}.tsv`;
    }

    @computed get headerContent() {
        const {
            filteredPatientCount,
            filteredSampleCount,
            pageNumber,
            pageSize,
            totalRowCount,
        } = this.props.store;
        const startRow = totalRowCount === 0 ? 0 : pageNumber * pageSize + 1;
        const endRow =
            totalRowCount === 0
                ? 0
                : Math.min(totalRowCount, startRow + this.rows.length - 1);

        return (
            <div
                style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    minHeight: 30,
                    fontWeight: 'bold',
                    marginLeft: 6,
                    flexWrap: 'wrap',
                    gap: 6,
                }}
            >
                <span>
                    {startRow}-{endRow} of {totalRowCount} {this.itemsLabel}
                </span>
                <span style={{ color: '#666', fontWeight: 'normal' }}>·</span>
                <span>
                    {filteredPatientCount}{' '}
                    {pluralize('patient', filteredPatientCount)}
                    {/* Resources attached at patient level have no sample-linked rows at all, so
                        this count is permanently zero for them — say nothing rather than "0
                        samples". */}
                    {filteredSampleCount > 0 && (
                        <>
                            {' / '}
                            {filteredSampleCount}{' '}
                            {pluralize('sample', filteredSampleCount)}
                        </>
                    )}
                </span>
            </div>
        );
    }

    private syncScopedResourceId() {
        this.scopedResourceDisposer?.();
        this.scopedResourceDisposer = null;

        if (!this.props.scopedResourceId) {
            return;
        }

        this.scopedResourceDisposer = autorun(() => {
            if (
                this.props.store.tabs.isComplete &&
                this.props.store.activeResourceId !==
                    this.props.scopedResourceId
            ) {
                this.clearActiveFilters();
                this.props.store.setSelectedResourceId(
                    this.props.scopedResourceId!
                );
            }
        });
    }

    private createColumn(
        id: string,
        name: string,
        render: (row: IResourceTableRow) => React.ReactNode,
        download: (row: IResourceTableRow) => string,
        overrides: Partial<ServerDrivenTableColumn<IResourceTableRow>> = {}
    ): ServerDrivenTableColumn<IResourceTableRow> {
        return {
            id,
            name,
            visible: true,
            sortable: true,
            filterable: true,
            render,
            download,
            ...overrides,
        };
    }

    private renderLinkOrText(text: string, href?: string) {
        return href ? (
            <a href={href} target="_blank" rel="noopener noreferrer">
                {text}
            </a>
        ) : (
            <span>{text}</span>
        );
    }

    private renderPatientId = (row: IResourceTableRow) => {
        const href =
            row.resource?.studyId && row.resource?.patientId
                ? getPatientViewUrlWithPathname(
                      row.resource.studyId,
                      row.patientId,
                      'patient/filesAndLinks'
                  )
                : undefined;
        return this.renderLinkOrText(row.patientId, href);
    };

    private renderSampleId = (row: IResourceTableRow) => {
        const href =
            row.resource?.studyId && row.resource?.sampleId
                ? getSampleViewUrlWithPathname(
                      row.resource.studyId,
                      row.resource.sampleId,
                      'patient/filesAndLinks'
                  )
                : undefined;
        return this.renderLinkOrText(row.sampleId, href);
    };

    private getBackendColumnId(columnId: string) {
        return columnId === 'resourceScope'
            ? BACKEND_SCOPE_COLUMN_ID
            : columnId;
    }

    private syncStoreFilters() {
        const categoricalFilters: ResourceColumnFilter[] = Object.entries(
            this.activeFilters
        ).map(([columnId, selectedValues]) => ({
            columnId: this.getBackendColumnId(columnId),
            operator: 'in',
            values: Array.from(selectedValues),
        }));
        const rangeFilters: ResourceColumnFilter[] = Object.entries(
            this.activeRangeFilters
        ).map(([columnId, range]) => ({
            columnId: this.getBackendColumnId(columnId),
            operator: 'between',
            values: [String(range.min), String(range.max)],
        }));
        this.props.store.setFilters([...categoricalFilters, ...rangeFilters]);
    }

    @action.bound
    private clearActiveFilters() {
        this.activeFilters = {};
        this.activeRangeFilters = {};
    }

    @action.bound
    private onTabClick(tabId: string) {
        this.clearActiveFilters();
        this.props.store.setSelectedResourceId(tabId);
    }

    @action.bound
    private onSortChange(columnId: string, direction: 'asc' | 'desc') {
        this.props.store.setSort(
            SORT_FIELD_MAP[columnId] || columnId,
            direction
        );
    }

    @action.bound
    private onFilterChange(
        columnId: string,
        selectedValues: Set<string>,
        allValues: Set<string>
    ) {
        if (selectedValues.size === allValues.size) {
            this.onFilterDeactivate(columnId);
            return;
        }

        this.activeFilters = {
            ...this.activeFilters,
            [columnId]: new Set(selectedValues),
        };
        this.syncStoreFilters();
    }

    @action.bound
    private onFilterDeactivate(columnId: string) {
        if (!this.activeFilters[columnId]) {
            return;
        }

        const nextFilters = { ...this.activeFilters };
        delete nextFilters[columnId];
        this.activeFilters = nextFilters;
        this.syncStoreFilters();
    }

    @action.bound
    private onRangeFilterChange(
        columnId: string,
        selectedRange: { min: number; max: number }
    ) {
        this.activeRangeFilters = {
            ...this.activeRangeFilters,
            [columnId]: selectedRange,
        };
        this.syncStoreFilters();
    }

    @action.bound
    private onRangeFilterDeactivate(columnId: string) {
        if (!this.activeRangeFilters[columnId]) {
            return;
        }

        const nextRangeFilters = { ...this.activeRangeFilters };
        delete nextRangeFilters[columnId];
        this.activeRangeFilters = nextRangeFilters;
        this.syncStoreFilters();
    }

    public render() {
        const { store } = this.props;

        if (!this.props.hideTabs && store.tabs.isPending) {
            return (
                <LoadingIndicator isLoading={true} center={true} size="big" />
            );
        }
        if (!this.props.hideTabs && store.tabs.isError) {
            return (
                <div className="alert alert-danger">
                    Error loading resource tabs.
                </div>
            );
        }
        if (!this.props.hideTabs && store.tabsForDisplay.length === 0) {
            return (
                <div className="alert alert-info">
                    {this.props.emptyText || 'No resources available.'}
                </div>
            );
        }

        return (
            <TabbedTableLayout
                tabs={this.tabs.length > 1 ? this.tabs : []}
                activeTabId={this.activeTabId}
                onTabClick={this.onTabClick}
                testId="resource-data-table"
            >
                <ServerDrivenTable<IResourceTableRow>
                    rows={this.rows}
                    columns={this.tableColumns}
                    totalRowCount={store.totalRowCount}
                    itemsLabel={this.itemsLabel}
                    currentPage={store.pageNumber}
                    pageSize={store.pageSize}
                    pageSizeOptions={[25, 50, 100]}
                    onPageChange={(page: number) => store.setPage(page)}
                    onPageSizeChange={(size: number) => store.setPageSize(size)}
                    sortColumn={this.currentSortColumn}
                    sortDirection={store.sortDirection}
                    onSortChange={this.onSortChange}
                    searchPlaceholder={this.props.searchPlaceholder}
                    onSearchChange={(term: string) => store.setSearchTerm(term)}
                    facets={this.remappedFacets}
                    activeFilters={this.activeFilters}
                    onFilterChange={this.onFilterChange}
                    onFilterDeactivate={this.onFilterDeactivate}
                    facetRanges={this.remappedFacetRanges}
                    activeRangeFilters={this.activeRangeFilters}
                    onRangeFilterChange={(columnId, selectedRange) =>
                        this.onRangeFilterChange(columnId, selectedRange)
                    }
                    onRangeFilterDeactivate={this.onRangeFilterDeactivate}
                    showColumnVisibility={true}
                    columnVisibilityButtonText="Add columns"
                    isLoading={store.tableData.isPending}
                    headerContent={this.headerContent}
                    tableMaxHeight={RESOURCE_TABLE_MAX_HEIGHT}
                    downloadAllRows={this.downloadAllRows}
                    downloadFilename={this.downloadFilename}
                    testId="resource-data-table"
                />
            </TabbedTableLayout>
        );
    }
}

export default ResourceDataTable;
