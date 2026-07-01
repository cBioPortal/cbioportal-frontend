import * as React from 'react';
import _ from 'lodash';
import { action, autorun, computed, IReactionDisposer, makeObservable, observable } from 'mobx';
import { observer } from 'mobx-react';
import LazyMobXTable, {
    Column,
} from 'shared/components/lazyMobXTable/LazyMobXTable';
import TabbedTableLayout from 'shared/components/tabbedTable/TabbedTableLayout';
import CategoricalFilterMenu from 'shared/components/categoricalFilterMenu/CategoricalFilterMenu';
import FilterIconModal from 'shared/components/filterIconModal/FilterIconModal';
import { SimpleGetterLazyMobXTableApplicationDataStore } from 'shared/lib/ILazyMobXTableApplicationDataStore';
import LoadingIndicator from 'shared/components/loadingIndicator/LoadingIndicator';
import {
    PaginationControls,
} from 'shared/components/paginationControls/PaginationControls';
import {
    getPatientViewUrlWithPathname,
    getSampleViewUrlWithPathname,
} from 'shared/api/urls';
import { ResourceTableStore } from './ResourceTableStore';
import { ResourceColumnFilter } from 'shared/api/resourceTableClient';
import {
    IResourceTableRow,
    getResourceTableMetadataKeys,
} from 'shared/lib/ResourceTableUtils';

export interface IResourceDataTableProps {
    store: ResourceTableStore;
    resourceLabel?: string;
    emptyText?: string;
    searchPlaceholder?: string;
    hideTabs?: boolean;
    scopedResourceId?: string;
}

interface IColumnFilterState {
    selectedValues: Set<string>;
    allValues: Set<string>;
}
const NOT_AVAILABLE = 'Not available';
const NO_DESCRIPTION = 'No description provided';

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
    let className = '';
    const ext = getFileExtension(url);
    switch (ext) {
        case 'pdf':
            className = 'fa fa-file-pdf-o';
            break;
        case 'png':
        case 'jpeg':
        case 'jpg':
        case 'gif':
            className = 'fa fa-file-image-o';
            break;
        case 'm4a':
        case 'flac':
        case 'mp3':
        case 'mp4':
        case 'wav':
            className = 'fa fa-file-audio-o';
            break;
    }
    if (className) {
        return (
            <i
                className={`${className} fa-sm`}
                style={{ marginRight: 5, color: 'black' }}
            />
        );
    }
    return null;
}

// Column ID to backend sortBy field mapping
const SORT_FIELD_MAP: Record<string, string> = {
    patientId: 'patientId',
    sampleId: 'sampleId',
    resourceType: 'resourceDisplayName',
    resourceScope: 'type',
    description: 'displayName',
};

@observer
export class ResourceDataTable extends React.Component<
    IResourceDataTableProps,
    {}
> {
    public static defaultProps = {
        resourceLabel: 'resources',
        emptyText: 'There are no matching resources.',
        searchPlaceholder:
            'Search patient ID, sample ID, resource, or metadata...',
    };

    @observable.ref private columnFilterState: Record<
        string,
        IColumnFilterState
    > = {};

    private dataStore: SimpleGetterLazyMobXTableApplicationDataStore<IResourceTableRow>;
    private readonly tableFilterScopeId: string;
    private scopedResourceDisposer: IReactionDisposer | null = null;
    private filterSyncDisposer: IReactionDisposer | null = null;
    private debouncedSearch: (term: string) => void;

    constructor(props: IResourceDataTableProps) {
        super(props);
        makeObservable(this);
        this.tableFilterScopeId = _.uniqueId('resource-table-filter-');
        this.dataStore =
            new SimpleGetterLazyMobXTableApplicationDataStore<IResourceTableRow>(
                () => this.rows
            );
        this.debouncedSearch = _.debounce(
            (term: string) => this.props.store.setSearchTerm(term),
            300
        );
    }

    componentDidMount() {
        this.syncScopedResourceId();
        this.filterSyncDisposer = autorun(() => {
            const serverFilters = this.computeServerFilters();
            this.props.store.setFilters(serverFilters);
        });
    }

    componentDidUpdate(prevProps: IResourceDataTableProps) {
        if (prevProps.scopedResourceId !== this.props.scopedResourceId) {
            this.syncScopedResourceId();
        }
    }

    componentWillUnmount() {
        if (this.scopedResourceDisposer) {
            this.scopedResourceDisposer();
            this.scopedResourceDisposer = null;
        }
        if (this.filterSyncDisposer) {
            this.filterSyncDisposer();
            this.filterSyncDisposer = null;
        }
    }

    private syncScopedResourceId() {
        if (this.scopedResourceDisposer) {
            this.scopedResourceDisposer();
            this.scopedResourceDisposer = null;
        }
        if (this.props.scopedResourceId) {
            this.scopedResourceDisposer = autorun(() => {
                if (this.props.store.tabs.isComplete) {
                    this.props.store.setSelectedResourceId(
                        this.props.scopedResourceId!
                    );
                }
            });
        }
    }

    @computed get rows(): IResourceTableRow[] {
        return this.props.store.rowsForDisplay || [];
    }

    @computed get metadataKeys() {
        return getResourceTableMetadataKeys(this.rows);
    }

    @computed get matchingPatientCount() {
        return this.props.store.filteredPatientCount;
    }

    @computed get matchingSampleCount() {
        return this.props.store.filteredSampleCount;
    }

    @computed get shouldShowSampleIdColumn() {
        return this.rows.some(row => !!row.resource?.sampleId);
    }

    private computeServerFilters(): ResourceColumnFilter[] {
        const filters: ResourceColumnFilter[] = [];
        for (const [columnId, state] of Object.entries(this.columnFilterState)) {
            if (state.selectedValues.size < state.allValues.size && state.selectedValues.size > 0) {
                filters.push({
                    columnId,
                    operator: 'in',
                    values: Array.from(state.selectedValues),
                });
            }
        }
        return filters;
    }

    @computed get tableColumns(): Column<IResourceTableRow>[] {
        const columns: Column<IResourceTableRow>[] = [
            {
                id: 'patientId',
                name: 'Patient ID',
                render: (row: IResourceTableRow) => {
                    const href =
                        row.resource?.studyId && row.resource?.patientId
                            ? getPatientViewUrlWithPathname(
                                  row.resource.studyId,
                                  row.patientId,
                                  'patient/filesAndLinks'
                              )
                            : undefined;
                    return this.renderLinkOrText(row.patientId, href);
                },
                download: (row: IResourceTableRow) => row.patientId,
                sortBy: (row: IResourceTableRow) => row.patientId.toLowerCase(),
                filter: (row: IResourceTableRow, _filterString: string, filterStringUpper?: string) =>
                    row.patientId.toUpperCase().includes(filterStringUpper || ''),
            },
        ];

        if (this.shouldShowSampleIdColumn) {
            columns.push({
                id: 'sampleId',
                name: 'Sample ID',
                render: (row: IResourceTableRow) => {
                    const href =
                        row.resource?.studyId && row.resource?.sampleId
                            ? getSampleViewUrlWithPathname(
                                  row.resource.studyId,
                                  row.resource.sampleId,
                                  'patient/filesAndLinks'
                              )
                            : undefined;
                    return this.renderLinkOrText(row.sampleId, href);
                },
                download: (row: IResourceTableRow) => row.sampleId,
                sortBy: (row: IResourceTableRow) => row.sampleId.toLowerCase(),
                filter: (row: IResourceTableRow, _filterString: string, filterStringUpper?: string) =>
                    row.sampleId.toUpperCase().includes(filterStringUpper || ''),
            });
        }

        columns.push(
            {
                id: 'resourceType',
                name: 'Resource Type',
                render: (row: IResourceTableRow) => (
                    <span>
                        {icon(row.url)}
                        {row.resourceType}
                    </span>
                ),
                download: (row: IResourceTableRow) => row.resourceType,
                sortBy: (row: IResourceTableRow) => row.resourceType.toLowerCase(),
                filter: (row: IResourceTableRow, _filterString: string, filterStringUpper?: string) =>
                    row.resourceType.toUpperCase().includes(filterStringUpper || ''),
            },
            {
                id: 'resourceScope',
                name: 'Scope',
                render: (row: IResourceTableRow) => <span>{row.resourceScope}</span>,
                download: (row: IResourceTableRow) => row.resourceScope,
                sortBy: (row: IResourceTableRow) => row.resourceScope.toLowerCase(),
                filter: (row: IResourceTableRow, _filterString: string, filterStringUpper?: string) =>
                    row.resourceScope.toUpperCase().includes(filterStringUpper || ''),
            }
        );

        // Dynamic metadata columns
        this.metadataKeys.forEach(metadataKey => {
            columns.push({
                id: `metadata:${metadataKey}`,
                name: metadataKey,
                visible: false,
                render: (row: IResourceTableRow) => (
                    <span>{row.metadata[metadataKey] || NOT_AVAILABLE}</span>
                ),
                download: (row: IResourceTableRow) => row.metadata[metadataKey] || NOT_AVAILABLE,
                sortBy: (row: IResourceTableRow) =>
                    (row.metadata[metadataKey] || NOT_AVAILABLE).toLowerCase(),
                filter: (row: IResourceTableRow, _filterString: string, filterStringUpper?: string) =>
                    (row.metadata[metadataKey] || NOT_AVAILABLE)
                        .toUpperCase()
                        .includes(filterStringUpper || ''),
            });
        });

        columns.push(
            {
                id: 'description',
                name: 'Details',
                render: (row: IResourceTableRow) => (
                    <span>{row.description || NO_DESCRIPTION}</span>
                ),
                download: (row: IResourceTableRow) => row.description || NO_DESCRIPTION,
                sortBy: (row: IResourceTableRow) =>
                    (row.description || NO_DESCRIPTION).toLowerCase(),
                filter: (row: IResourceTableRow, _filterString: string, filterStringUpper?: string) =>
                    (row.description || NO_DESCRIPTION)
                        .toUpperCase()
                        .includes(filterStringUpper || ''),
            },
            {
                id: 'actions',
                name: 'Actions',
                render: (row: IResourceTableRow) => (
                    <a href={row.url} target="_blank" rel="noopener noreferrer">
                        <i
                            className="fa fa-external-link fa-sm"
                            style={{ marginRight: 5, color: 'black' }}
                        />
                        Open in new window
                    </a>
                ),
                download: () => 'Open in new window',
                sortBy: (row: IResourceTableRow) => row.url.toLowerCase(),
                togglable: false,
            }
        );

        return columns;
    }

    @computed get tabs() {
        if (this.props.hideTabs) return [];
        return this.props.store.tabsForDisplay.map(tab => ({
            id: tab.id,
            label: tab.label,
        }));
    }

    @computed get activeTabId() {
        return this.props.scopedResourceId || this.props.store.activeResourceId;
    }

    // -- Column filter logic (server-side via backend facets) --

    private getFacetOptions(columnId: string): Set<string> {
        const facets = this.props.store.facets[columnId];
        if (facets && facets.length > 0) {
            return new Set(facets.map(f => f.value));
        }
        return new Set(
            _.sortBy(
                _.uniq(this.rows.map(row => this.getColumnValue(row, columnId)).filter(Boolean)),
                v => v.toLowerCase()
            )
        );
    }

    private getColumnValue(row: IResourceTableRow, columnId: string) {
        switch (columnId) {
            case 'patientId':
                return row.patientId;
            case 'sampleId':
                return row.sampleId;
            case 'resourceType':
                return row.resourceType;
            case 'resourceScope':
                return row.resourceScope;
            case 'description':
                return row.description || NO_DESCRIPTION;
            default:
                if (columnId.startsWith('metadata:')) {
                    return row.metadata[columnId.slice('metadata:'.length)] || NOT_AVAILABLE;
                }
                return '';
        }
    }

    @action.bound
    private updateColumnFilterSelections(columnId: string, toggled: Set<string>) {
        const allValues = this.getFacetOptions(columnId);
        const existing = this.columnFilterState[columnId];
        const currentSelections = new Set(existing?.selectedValues || allValues);
        toggled.forEach(s => {
            if (currentSelections.has(s)) currentSelections.delete(s);
            else currentSelections.add(s);
        });
        if (currentSelections.size === allValues.size) {
            const next = { ...this.columnFilterState };
            delete next[columnId];
            this.columnFilterState = next;
        } else {
            this.columnFilterState = {
                ...this.columnFilterState,
                [columnId]: { selectedValues: currentSelections, allValues },
            };
        }
    }

    @action.bound
    private deactivateColumnFilter(columnId: string) {
        if (!this.columnFilterState[columnId]) return;
        const next = { ...this.columnFilterState };
        delete next[columnId];
        this.columnFilterState = next;
    }

    private shouldShowColumnFilter(columnId: string) {
        // No categorical filter for high-cardinality ID columns or actions
        return !['patientId', 'sampleId', 'actions'].includes(columnId);
    }

    private renderColumnFilterModal(column: Column<IResourceTableRow>) {
        const columnId = column.id || column.name;
        if (!this.shouldShowColumnFilter(columnId)) return undefined;

        const allValues = this.getFacetOptions(columnId);
        const filterState = this.columnFilterState[columnId];
        const currentSelections = filterState?.selectedValues || allValues;
        const filterIsActive = !!filterState;
        const filterMenuId = `${this.tableFilterScopeId}-${columnId}`;

        return (
            <span data-test={`resource-column-filter-${columnId}`}>
                <FilterIconModal
                    id={filterMenuId}
                    label={column.name}
                    filterIsActive={filterIsActive}
                    deactivateFilter={() => this.deactivateColumnFilter(columnId)}
                    setupFilter={() => undefined}
                    menuComponent={
                        <CategoricalFilterMenu
                            id={filterMenuId}
                            emptyFilterString={true}
                            currSelections={currentSelections}
                            allSelections={allValues}
                            updateFilterCondition={() => {}}
                            updateFilterString={() => {}}
                            toggleSelections={(t: Set<string>) =>
                                this.updateColumnFilterSelections(columnId, t)
                            }
                        />
                    }
                />
            </span>
        );
    }

    private renderLinkOrText(text: string, href?: string) {
        if (href) {
            return (
                <a href={href} target="_blank" rel="noopener noreferrer">
                    {text}
                </a>
            );
        }
        return <span>{text}</span>;
    }

    @action.bound
    private onTabClick(tabId: string) {
        this.props.store.setSelectedResourceId(tabId);
        this.columnFilterState = {};
    }

    @action.bound
    private onSortDirectionChange(columnName: string, direction: 'asc' | 'desc') {
        // Map column name to backend sort field
        const col = this.tableColumns.find(c => c.name === columnName);
        const columnId = col?.id || columnName;
        const backendField = SORT_FIELD_MAP[columnId] || columnId;
        this.props.store.setSort(backendField, direction);
    }

    render() {
        const { store } = this.props;

        if (!this.props.hideTabs && store.tabs.isPending) {
            return <LoadingIndicator isLoading={true} center={true} size="big" />;
        }

        if (!this.props.hideTabs && store.tabs.isError) {
            return <div className="alert alert-danger">Error loading resource tabs.</div>;
        }

        if (!this.props.hideTabs && store.tabsForDisplay.length === 0) {
            return (
                <div className="alert alert-info">
                    {this.props.emptyText || 'No resources available.'}
                </div>
            );
        }

        const isLoading = store.tableData.isPending;
        const totalRowCount = store.totalRowCount;
        const currentPage = store.pageNumber;
        const pageSize = store.pageSize;
        const totalPages = Math.ceil(totalRowCount / pageSize);

        return (
            <TabbedTableLayout
                tabs={this.tabs.length > 1 ? this.tabs : []}
                activeTabId={this.activeTabId}
                onTabClick={this.onTabClick}
                testId="resource-data-table"
            >
                <div style={{ position: 'relative' }}>
                    {isLoading && (
                        <div
                            style={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                right: 0,
                                bottom: 0,
                                background: 'rgba(255,255,255,0.6)',
                                zIndex: 10,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}
                        >
                            <LoadingIndicator isLoading={true} size="big" />
                        </div>
                    )}
                    <LazyMobXTable
                        dataStore={this.dataStore}
                        columns={this.tableColumns}
                        showCountHeader={false}
                        showColumnVisibility={true}
                        showFilter={true}
                        showFilterClearButton={true}
                        showCopyDownload={false}
                        showPagination={false}
                        onFilterTextChange={this.debouncedSearch}
                        columnVisibilityProps={{ buttonText: 'Add columns' }}
                        columnToHeaderFilterIconModal={this.renderColumnFilterModal.bind(this)}
                        deactivateColumnFilter={this.deactivateColumnFilter}
                        onSortDirectionChange={this.onSortDirectionChange}
                        initialSortColumn="Patient ID"
                        initialSortDirection="asc"
                        initialItemsPerPage={pageSize}
                        itemsLabel="resource"
                        itemsLabelPlural={this.props.resourceLabel}
                        filterPlaceholder={this.props.searchPlaceholder}
                        customControls={
                            <div
                                className="pull-left"
                                style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    minHeight: 30,
                                    fontWeight: 'bold',
                                    marginLeft: 6,
                                }}
                            >
                                <span>
                                    {Math.min(pageSize, totalRowCount)} {this.props.resourceLabel} of{' '}
                                    {totalRowCount}
                                    {totalPages > 1 && (
                                        <span style={{ fontWeight: 'normal', color: '#666' }}>
                                            {' '}(page {currentPage + 1} of {totalPages})
                                        </span>
                                    )}
                                </span>
                            </div>
                        }
                    />
                    {/* Server-side pagination */}
                    <PaginationControls
                        currentPage={currentPage}
                        totalItems={totalRowCount}
                        itemsPerPage={pageSize}
                        itemsPerPageOptions={[25, 50, 100]}
                        showItemsPerPageSelector={true}
                        showAllOption={false}
                        showFirstPage={true}
                        showLastPage={true}
                        showMoreButton={false}
                        textBetweenButtons={`${currentPage + 1} / ${totalPages}`}
                        onChangeItemsPerPage={(size: number) => store.setPageSize(size)}
                        previousPageDisabled={currentPage === 0}
                        nextPageDisabled={currentPage >= totalPages - 1}
                        firstPageDisabled={currentPage === 0}
                        lastPageDisabled={currentPage >= totalPages - 1}
                        onFirstPageClick={() => store.setPage(0)}
                        onPreviousPageClick={() => store.setPage(currentPage - 1)}
                        onNextPageClick={() => store.setPage(currentPage + 1)}
                        onLastPageClick={() => store.setPage(totalPages - 1)}
                    />
                </div>
            </TabbedTableLayout>
        );
    }
}

export default ResourceDataTable;
