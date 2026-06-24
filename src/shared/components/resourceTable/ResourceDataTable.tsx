import * as React from 'react';
import _ from 'lodash';
import { action, computed, makeObservable, observable } from 'mobx';
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
import {
    IResourceTableRow,
    getResourceTableMetadataKeys,
} from 'shared/lib/ResourceTableUtils';

export interface IResourceDataTableProps {
    store: ResourceTableStore;
    resourceLabel?: string;
    emptyText?: string;
    searchPlaceholder?: string;
}

interface IResourceColumnFilter {
    filterCondition: string;
    filterString: string;
    selections: Set<string>;
}

const DEFAULT_FILTER_CONDITION = 'contains';
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

function normalizeText(text: string) {
    return text.toLowerCase();
}

function matchesFilterCondition(value: string, filter: IResourceColumnFilter) {
    const normalizedValue = normalizeText(value);
    const normalizedFilterString = normalizeText(filter.filterString);
    if (!normalizedFilterString) return true;
    switch (filter.filterCondition) {
        case 'contains':
            return normalizedValue.includes(normalizedFilterString);
        case 'doesNotContain':
            return !normalizedValue.includes(normalizedFilterString);
        case 'equals':
            return normalizedValue === normalizedFilterString;
        case 'doesNotEqual':
            return normalizedValue !== normalizedFilterString;
        case 'beginsWith':
            return normalizedValue.startsWith(normalizedFilterString);
        case 'doesNotBeginWith':
            return !normalizedValue.startsWith(normalizedFilterString);
        case 'endsWith':
            return normalizedValue.endsWith(normalizedFilterString);
        case 'doesNotEndWith':
            return !normalizedValue.endsWith(normalizedFilterString);
        case 'regex':
            try {
                return new RegExp(filter.filterString, 'i').test(value);
            } catch {
                return false;
            }
        default:
            return true;
    }
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

    @observable.ref private columnFilters: Record<
        string,
        IResourceColumnFilter
    > = {};

    private dataStore: SimpleGetterLazyMobXTableApplicationDataStore<IResourceTableRow>;
    private readonly tableFilterScopeId: string;

    constructor(props: IResourceDataTableProps) {
        super(props);
        makeObservable(this);
        this.tableFilterScopeId = _.uniqueId('resource-table-filter-');
        this.dataStore =
            new SimpleGetterLazyMobXTableApplicationDataStore<IResourceTableRow>(
                () => this.rowsAfterHeaderFilters
            );
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

    @computed get rowsAfterHeaderFilters() {
        if (Object.keys(this.columnFilters).length === 0) {
            return this.rows;
        }
        return this.rows.filter(row => this.rowMatchesHeaderFilters(row));
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
        return this.props.store.tabsForDisplay.map(tab => ({
            id: tab.id,
            label: tab.label,
        }));
    }

    @computed get activeTabId() {
        return this.props.store.activeResourceId;
    }

    // -- Column filter logic (client-side on current page) --

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

    private getColumnSelectionValues(columnId: string, rows: IResourceTableRow[]) {
        return new Set(
            _.sortBy(
                _.uniq(rows.map(row => this.getColumnValue(row, columnId)).filter(Boolean)),
                value => value.toLowerCase()
            )
        );
    }

    private getRowsForColumnOptions(columnId: string) {
        return this.rows.filter(row =>
            Object.entries(this.columnFilters).every(([activeColumnId, filter]) => {
                if (activeColumnId === columnId) return true;
                return this.rowMatchesSingleColumnFilter(row, activeColumnId, filter);
            })
        );
    }

    private rowMatchesSingleColumnFilter(
        row: IResourceTableRow,
        columnId: string,
        filter: IResourceColumnFilter
    ) {
        const value = this.getColumnValue(row, columnId) || NOT_AVAILABLE;
        return filter.selections.has(value) && matchesFilterCondition(value, filter);
    }

    private rowMatchesHeaderFilters(row: IResourceTableRow) {
        return Object.entries(this.columnFilters).every(([columnId, filter]) =>
            this.rowMatchesSingleColumnFilter(row, columnId, filter)
        );
    }

    @action.bound
    private normalizeColumnFilter(
        columnId: string,
        filter: IResourceColumnFilter,
        allSelections: Set<string>
    ) {
        const normalizedSelections = new Set(
            Array.from(filter.selections).filter(s => allSelections.has(s))
        );
        const effectiveFilter: IResourceColumnFilter = {
            filterCondition: filter.filterCondition || DEFAULT_FILTER_CONDITION,
            filterString: filter.filterString,
            selections: normalizedSelections,
        };
        if (
            effectiveFilter.filterCondition === DEFAULT_FILTER_CONDITION &&
            !effectiveFilter.filterString &&
            effectiveFilter.selections.size === allSelections.size
        ) {
            const next = { ...this.columnFilters };
            delete next[columnId];
            this.columnFilters = next;
            return;
        }
        this.columnFilters = { ...this.columnFilters, [columnId]: effectiveFilter };
    }

    @action.bound
    private updateColumnFilterCondition(columnId: string, condition: string) {
        const allSelections = this.getColumnSelectionValues(
            columnId,
            this.getRowsForColumnOptions(columnId)
        );
        const existing = this.columnFilters[columnId];
        this.normalizeColumnFilter(
            columnId,
            {
                filterCondition: condition,
                filterString: existing?.filterString || '',
                selections: existing?.selections || new Set(allSelections),
            },
            allSelections
        );
    }

    @action.bound
    private updateColumnFilterString(columnId: string, filterString: string) {
        const allSelections = this.getColumnSelectionValues(
            columnId,
            this.getRowsForColumnOptions(columnId)
        );
        const existing = this.columnFilters[columnId];
        this.normalizeColumnFilter(
            columnId,
            {
                filterCondition: existing?.filterCondition || DEFAULT_FILTER_CONDITION,
                filterString,
                selections: existing?.selections || new Set(allSelections),
            },
            allSelections
        );
    }

    @action.bound
    private toggleColumnFilterSelections(columnId: string, toggled: Set<string>) {
        const allSelections = this.getColumnSelectionValues(
            columnId,
            this.getRowsForColumnOptions(columnId)
        );
        const existing = this.columnFilters[columnId];
        const nextSelections = new Set(existing?.selections || allSelections);
        toggled.forEach(s => {
            if (nextSelections.has(s)) nextSelections.delete(s);
            else nextSelections.add(s);
        });
        this.normalizeColumnFilter(
            columnId,
            {
                filterCondition: existing?.filterCondition || DEFAULT_FILTER_CONDITION,
                filterString: existing?.filterString || '',
                selections: nextSelections,
            },
            allSelections
        );
    }

    @action.bound
    private deactivateColumnFilter(columnId: string) {
        if (!this.columnFilters[columnId]) return;
        const next = { ...this.columnFilters };
        delete next[columnId];
        this.columnFilters = next;
    }

    private shouldShowColumnFilter(columnId: string) {
        return !['actions'].includes(columnId);
    }

    private renderColumnFilterModal(column: Column<IResourceTableRow>) {
        const columnId = column.id || column.name;
        if (!this.shouldShowColumnFilter(columnId)) return undefined;

        const allSelections = this.getColumnSelectionValues(
            columnId,
            this.getRowsForColumnOptions(columnId)
        );
        const filter = this.columnFilters[columnId];
        const filterMenuId = `${this.tableFilterScopeId}-${columnId}`;

        return (
            <span data-test={`resource-column-filter-${columnId}`}>
                <FilterIconModal
                    id={filterMenuId}
                    label={column.name}
                    filterIsActive={!!filter}
                    deactivateFilter={() => this.deactivateColumnFilter(columnId)}
                    setupFilter={() => undefined}
                    menuComponent={
                        <CategoricalFilterMenu
                            id={filterMenuId}
                            emptyFilterString={!filter}
                            currSelections={filter?.selections || allSelections}
                            allSelections={allSelections}
                            updateFilterCondition={(c: string) =>
                                this.updateColumnFilterCondition(columnId, c)
                            }
                            updateFilterString={(s: string) =>
                                this.updateColumnFilterString(columnId, s)
                            }
                            toggleSelections={(t: Set<string>) =>
                                this.toggleColumnFilterSelections(columnId, t)
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
        this.columnFilters = {};
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

        if (store.tabs.isPending) {
            return <LoadingIndicator isLoading={true} center={true} size="big" />;
        }

        if (store.tabs.isError) {
            return <div className="alert alert-danger">Error loading resource tabs.</div>;
        }

        if (store.tabsForDisplay.length === 0) {
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
