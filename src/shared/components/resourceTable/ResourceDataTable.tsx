import * as React from 'react';
import { observer } from 'mobx-react';
import { computed, makeObservable, observable, action } from 'mobx';
import { ResourceTableStore } from './ResourceTableStore';
import { ResourceTableRow, ResourceColumnInfo } from 'shared/api/resourceTableClient';
import LoadingIndicator from 'shared/components/loadingIndicator/LoadingIndicator';
import {
    PaginationControls,
} from 'shared/components/paginationControls/PaginationControls';
import {
    getPatientViewUrlWithPathname,
    getSampleViewUrlWithPathname,
} from 'shared/api/urls';

export interface IResourceDataTableProps {
    store: ResourceTableStore;
}

@observer
export class ResourceDataTable extends React.Component<
    IResourceDataTableProps,
    {}
> {
    @observable private searchInput: string = '';

    constructor(props: IResourceDataTableProps) {
        super(props);
        makeObservable(this);
    }

    @action.bound
    private onSearchChange(e: React.ChangeEvent<HTMLInputElement>) {
        this.searchInput = e.target.value;
    }

    @action.bound
    private onSearchSubmit(e: React.FormEvent) {
        e.preventDefault();
        this.props.store.setSearch(this.searchInput);
    }

    @action.bound
    private onSearchClear() {
        this.searchInput = '';
        this.props.store.setSearch('');
    }

    private onColumnSort(columnId: string) {
        const store = this.props.store;
        if (store.sortBy === columnId) {
            store.setSort(columnId, store.sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            store.setSort(columnId, 'asc');
        }
    }

    @computed private get visibleColumns(): ResourceColumnInfo[] {
        const result = this.props.store.tableData.result;
        if (!result) return [];
        return result.columns.filter(c => c.visibleByDefault);
    }

    private renderSortIcon(columnId: string) {
        const store = this.props.store;
        if (store.sortBy !== columnId) {
            return <i className="fa fa-sort" style={{ marginLeft: 4, opacity: 0.4 }} />;
        }
        return store.sortDirection === 'asc' ? (
            <i className="fa fa-sort-asc" style={{ marginLeft: 4 }} />
        ) : (
            <i className="fa fa-sort-desc" style={{ marginLeft: 4 }} />
        );
    }

    private renderCell(row: ResourceTableRow, col: ResourceColumnInfo) {
        if (col.source === 'builtin') {
            switch (col.id) {
                case 'patientId':
                    return row.patientId ? (
                        <a
                            href={getPatientViewUrlWithPathname(
                                row.studyId,
                                row.patientId,
                                'patient/filesAndLinks'
                            )}
                            target="_blank"
                        >
                            {row.patientId}
                        </a>
                    ) : null;
                case 'sampleId':
                    return row.sampleId ? (
                        <a
                            href={getSampleViewUrlWithPathname(
                                row.studyId,
                                row.sampleId,
                                'patient/filesAndLinks'
                            )}
                            target="_blank"
                        >
                            {row.sampleId}
                        </a>
                    ) : null;
                case 'url':
                    return (
                        <a href={row.url} target="_blank" rel="noopener noreferrer">
                            <i
                                className="fa fa-external-link fa-sm"
                                style={{ marginRight: 5 }}
                            />
                            Open
                        </a>
                    );
                case 'displayName':
                    return <span>{row.displayName || row.resourceDisplayName}</span>;
                case 'type':
                    return <span>{row.type || row.resourceType}</span>;
                case 'priority':
                    return <span>{row.priority}</span>;
                default:
                    return null;
            }
        }
        // metadata column
        const val = row.metadata?.[col.id];
        return val != null ? <span>{String(val)}</span> : null;
    }

    private renderTabs() {
        const store = this.props.store;
        const tabs = store.tabs.result || [];

        if (tabs.length === 0) return null;

        return (
            <ul className="nav nav-tabs" style={{ marginBottom: 10 }}>
                {tabs.map(tab => (
                    <li
                        key={tab.resourceId}
                        className={
                            store.selectedResourceId === tab.resourceId
                                ? 'active'
                                : ''
                        }
                    >
                        <a
                            onClick={() => store.selectTab(tab.resourceId)}
                            style={{ cursor: 'pointer' }}
                        >
                            {tab.label}
                            <span
                                className="badge"
                                style={{ marginLeft: 6 }}
                            >
                                {tab.totalCount}
                            </span>
                        </a>
                    </li>
                ))}
            </ul>
        );
    }

    private renderSearchBar() {
        const store = this.props.store;
        return (
            <form
                onSubmit={this.onSearchSubmit}
                style={{ display: 'inline-flex', alignItems: 'center', marginBottom: 8 }}
            >
                <input
                    className="form-control input-sm"
                    type="text"
                    placeholder="Search..."
                    value={this.searchInput}
                    onChange={this.onSearchChange}
                    style={{ width: 200, marginRight: 4 }}
                />
                <button className="btn btn-sm btn-default" type="submit">
                    Search
                </button>
                {store.searchTerm && (
                    <button
                        className="btn btn-sm btn-link"
                        type="button"
                        onClick={this.onSearchClear}
                    >
                        Clear
                    </button>
                )}
            </form>
        );
    }

    private renderTable() {
        const store = this.props.store;
        const result = store.tableData.result!;
        const columns = this.visibleColumns;
        const rows = result.rows;

        return (
            <table className="table table-striped table-bordered table-sm">
                <thead>
                    <tr>
                        {columns.map(col => (
                            <th
                                key={col.id}
                                style={{
                                    cursor: col.sortable ? 'pointer' : 'default',
                                    whiteSpace: 'nowrap',
                                }}
                                onClick={
                                    col.sortable
                                        ? () => this.onColumnSort(col.id)
                                        : undefined
                                }
                            >
                                {col.label}
                                {col.sortable && this.renderSortIcon(col.id)}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {rows.length === 0 ? (
                        <tr>
                            <td
                                colSpan={columns.length}
                                style={{ textAlign: 'center', color: '#888' }}
                            >
                                No data found
                            </td>
                        </tr>
                    ) : (
                        rows.map((row, i) => (
                            <tr key={`${row.patientId}-${row.sampleId}-${i}`}>
                                {columns.map(col => (
                                    <td key={col.id}>
                                        {this.renderCell(row, col)}
                                    </td>
                                ))}
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        );
    }

    render() {
        const store = this.props.store;
        const result = store.tableData.result!;
        const totalCount = result?.totalRowCount ?? 0;
        const currentPage = store.pageNumber;
        const pageSize = store.pageSize;
        const totalPages = pageSize > 0 ? Math.ceil(totalCount / pageSize) : 1;

        return (
            <div>
                {this.renderTabs()}

                <div
                    style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: 8,
                    }}
                >
                    {this.renderSearchBar()}
                    <span style={{ color: '#555', fontSize: 12 }}>
                        <strong>{totalCount}</strong> resource
                        {totalCount !== 1 ? 's' : ''}
                        {result?.filteredPatientCount != null && (
                            <span>
                                {' '}
                                across{' '}
                                <strong>
                                    {result.filteredPatientCount}
                                </strong>{' '}
                                patient
                                {result.filteredPatientCount !== 1 ? 's' : ''}
                            </span>
                        )}
                    </span>
                </div>

                {store.tableData.isPending ? (
                    <LoadingIndicator isLoading center size="big" />
                ) : (
                    this.renderTable()
                )}

                {totalPages > 1 && (
                    <PaginationControls
                        currentPage={currentPage}
                        totalItems={totalCount}
                        itemsPerPage={pageSize}
                        onPreviousPageClick={() =>
                            store.setPage(Math.max(0, currentPage - 1))
                        }
                        onNextPageClick={() =>
                            store.setPage(
                                Math.min(totalPages - 1, currentPage + 1)
                            )
                        }
                        onFirstPageClick={() => store.setPage(0)}
                        onLastPageClick={() =>
                            store.setPage(totalPages - 1)
                        }
                        previousPageDisabled={currentPage === 0}
                        nextPageDisabled={currentPage >= totalPages - 1}
                        firstPageDisabled={currentPage === 0}
                        lastPageDisabled={currentPage >= totalPages - 1}
                        showFirstPage
                        showLastPage
                        itemsPerPageOptions={[10, 20, 50, 100]}
                        onChangeItemsPerPage={n => store.setPageSize(n)}
                        showItemsPerPageSelector
                    />
                )}
            </div>
        );
    }
}

export default ResourceDataTable;
