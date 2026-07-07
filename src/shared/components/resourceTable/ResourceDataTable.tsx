import * as React from 'react';
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
} from 'shared/components/serverDrivenTable/ServerDrivenTable';
import TabbedTableLayout from 'shared/components/tabbedTable/TabbedTableLayout';
import {
    getPatientViewUrlWithPathname,
    getSampleViewUrlWithPathname,
} from 'shared/api/urls';
import { ResourceColumnFilter } from 'shared/api/resourceTableClient';
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

    @computed get metadataKeys(): string[] {
        const facetKeys = Object.keys(this.props.store.facets)
            .filter(key => key.startsWith('metadata:'))
            .map(key => key.slice('metadata:'.length));
        return facetKeys.length > 0
            ? facetKeys.sort((a, b) =>
                  a.toLowerCase().localeCompare(b.toLowerCase())
              )
            : getResourceTableMetadataKeys(this.rows);
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
                row => row.resourceType
            ),
            this.createColumn(
                'resourceScope',
                'Scope',
                row => <span>{row.resourceScope}</span>,
                row => row.resourceScope
            ),
            ...this.metadataKeys.map(metadataKey =>
                this.createColumn(
                    `metadata:${metadataKey}`,
                    metadataKey,
                    row => (
                        <span>
                            {row.metadata[metadataKey] || NOT_AVAILABLE}
                        </span>
                    ),
                    row => row.metadata[metadataKey] || NOT_AVAILABLE,
                    { visible: false }
                )
            ),
            this.createColumn(
                'description',
                'Details',
                row => <span>{row.description || NO_DESCRIPTION}</span>,
                row => row.description || NO_DESCRIPTION
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
                    {startRow}-{endRow} of {totalRowCount}{' '}
                    {this.props.resourceLabel}
                </span>
                <span style={{ color: '#666', fontWeight: 'normal' }}>·</span>
                <span>
                    {filteredPatientCount} patients / {filteredSampleCount}{' '}
                    samples
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

    private syncStoreFilters(activeFilters: Record<string, Set<string>>) {
        const filters: ResourceColumnFilter[] = Object.entries(
            activeFilters
        ).map(([columnId, selectedValues]) => ({
            columnId: this.getBackendColumnId(columnId),
            operator: 'in',
            values: Array.from(selectedValues),
        }));
        this.props.store.setFilters(filters);
    }

    @action.bound
    private clearActiveFilters() {
        this.activeFilters = {};
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

        const nextFilters = {
            ...this.activeFilters,
            [columnId]: new Set(selectedValues),
        };
        this.activeFilters = nextFilters;
        this.syncStoreFilters(nextFilters);
    }

    @action.bound
    private onFilterDeactivate(columnId: string) {
        if (!this.activeFilters[columnId]) {
            return;
        }

        const nextFilters = { ...this.activeFilters };
        delete nextFilters[columnId];
        this.activeFilters = nextFilters;
        this.syncStoreFilters(nextFilters);
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
                    itemsLabel={this.props.resourceLabel}
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
                    showColumnVisibility={true}
                    columnVisibilityButtonText="Add columns"
                    isLoading={store.tableData.isPending}
                    headerContent={this.headerContent}
                    testId="resource-data-table"
                />
            </TabbedTableLayout>
        );
    }
}

export default ResourceDataTable;
