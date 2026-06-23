import * as React from 'react';
import _ from 'lodash';
import { action, computed, makeObservable, observable } from 'mobx';
import { observer } from 'mobx-react';
import TabbedTableLayout from 'shared/components/tabbedTable/TabbedTableLayout';
import LoadingIndicator from 'shared/components/loadingIndicator/LoadingIndicator';
import {
    PaginationControls,
} from 'shared/components/paginationControls/PaginationControls';
import {
    getPatientViewUrlWithPathname,
    getSampleViewUrlWithPathname,
} from 'shared/api/urls';
import { ResourceTableStore } from './ResourceTableStore';
import { IResourceTableRow } from 'shared/lib/ResourceTableUtils';

export interface IResourceDataTableProps {
    store: ResourceTableStore;
    resourceLabel?: string;
    emptyText?: string;
    searchPlaceholder?: string;
}

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

interface SortState {
    column: string;
    direction: 'asc' | 'desc';
}

@observer
export class ResourceDataTable extends React.Component<
    IResourceDataTableProps,
    {}
> {
    @observable private searchInput: string = '';
    @observable private sortState: SortState = {
        column: 'patientId',
        direction: 'asc',
    };

    private searchDebounceTimer: any = null;

    constructor(props: IResourceDataTableProps) {
        super(props);
        makeObservable(this);
    }

    componentWillUnmount() {
        if (this.searchDebounceTimer) {
            clearTimeout(this.searchDebounceTimer);
        }
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

    @computed get rows(): IResourceTableRow[] {
        return this.props.store.rowsForDisplay || [];
    }

    @computed get shouldShowSampleIdColumn() {
        return this.rows.some(row => !!row.resource?.sampleId);
    }

    @action.bound
    private onTabClick(tabId: string) {
        this.props.store.setSelectedResourceId(tabId);
        this.searchInput = '';
    }

    @action.bound
    private onSearchChange(e: React.ChangeEvent<HTMLInputElement>) {
        this.searchInput = e.target.value;
        if (this.searchDebounceTimer) {
            clearTimeout(this.searchDebounceTimer);
        }
        this.searchDebounceTimer = setTimeout(() => {
            this.props.store.setSearchTerm(this.searchInput);
        }, 400);
    }

    @action.bound
    private onSortClick(column: string) {
        const newDirection =
            this.sortState.column === column && this.sortState.direction === 'asc'
                ? 'desc'
                : 'asc';
        this.sortState = { column, direction: newDirection };
        this.props.store.setSort(column, newDirection);
    }

    private renderSortIcon(column: string) {
        if (this.sortState.column !== column) {
            return (
                <i
                    className="fa fa-sort"
                    style={{ marginLeft: 4, opacity: 0.4 }}
                />
            );
        }
        return this.sortState.direction === 'asc' ? (
            <i className="fa fa-sort-asc" style={{ marginLeft: 4 }} />
        ) : (
            <i className="fa fa-sort-desc" style={{ marginLeft: 4 }} />
        );
    }

    private renderHeader(label: string, columnId: string, sortable = true) {
        if (!sortable) {
            return <span>{label}</span>;
        }
        return (
            <span
                style={{ cursor: 'pointer', userSelect: 'none' }}
                onClick={() => this.onSortClick(columnId)}
            >
                {label}
                {this.renderSortIcon(columnId)}
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

    private renderCell(row: IResourceTableRow, columnId: string) {
        switch (columnId) {
            case 'patientId': {
                const href =
                    row.resource?.studyId && row.resource?.patientId
                        ? getPatientViewUrlWithPathname(
                              row.resource.studyId,
                              row.patientId,
                              'patient/filesAndLinks'
                          )
                        : undefined;
                return this.renderLinkOrText(row.patientId, href);
            }
            case 'sampleId': {
                const href =
                    row.resource?.studyId && row.resource?.sampleId
                        ? getSampleViewUrlWithPathname(
                              row.resource.studyId,
                              row.resource.sampleId,
                              'patient/filesAndLinks'
                          )
                        : undefined;
                return this.renderLinkOrText(row.sampleId, href);
            }
            case 'resourceType':
                return (
                    <span>
                        {icon(row.url)}
                        {row.resourceType}
                    </span>
                );
            case 'resourceScope':
                return <span>{row.resourceScope}</span>;
            case 'description':
                return <span>{row.description || '-'}</span>;
            case 'actions':
                return (
                    <a
                        href={row.url}
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        <i
                            className="fa fa-external-link fa-sm"
                            style={{ marginRight: 5 }}
                        />
                        Open
                    </a>
                );
            default:
                return <span>-</span>;
        }
    }

    private get columns() {
        const cols = [
            { id: 'patientId', label: 'Patient ID', sortable: true },
            { id: 'sampleId', label: 'Sample ID', sortable: true },
            { id: 'resourceType', label: 'Resource Type', sortable: false },
            { id: 'resourceScope', label: 'Scope', sortable: false },
            { id: 'description', label: 'Details', sortable: false },
            { id: 'actions', label: 'Actions', sortable: false },
        ];

        if (!this.shouldShowSampleIdColumn) {
            return cols.filter(c => c.id !== 'sampleId');
        }
        return cols;
    }

    render() {
        const { store } = this.props;

        if (store.tabs.isPending) {
            return (
                <LoadingIndicator isLoading={true} center={true} size="big" />
            );
        }

        if (store.tabs.isError) {
            return (
                <div className="alert alert-danger">
                    Error loading resource tabs.
                </div>
            );
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
        const patientCount = store.filteredPatientCount;
        const sampleCount = store.filteredSampleCount;
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
                <div>
                    {/* Toolbar */}
                    <div
                        style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: 10,
                            flexWrap: 'wrap',
                            gap: 8,
                        }}
                    >
                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 12,
                            }}
                        >
                            <span style={{ fontWeight: 500 }}>
                                {totalRowCount} resources
                            </span>
                            <span style={{ color: '#666' }}>
                                {patientCount} patients / {sampleCount}{' '}
                                samples
                            </span>
                        </div>
                        <div>
                            <input
                                type="text"
                                className="form-control"
                                placeholder={
                                    this.props.searchPlaceholder ||
                                    'Search...'
                                }
                                value={this.searchInput}
                                onChange={this.onSearchChange}
                                style={{
                                    width: 280,
                                    display: 'inline-block',
                                }}
                            />
                        </div>
                    </div>

                    {/* Table */}
                    <div style={{ position: 'relative', minHeight: 100 }}>
                        {isLoading && (
                            <div
                                style={{
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    right: 0,
                                    bottom: 0,
                                    background: 'rgba(255,255,255,0.7)',
                                    zIndex: 10,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                }}
                            >
                                <LoadingIndicator
                                    isLoading={true}
                                    size="big"
                                />
                            </div>
                        )}
                        <table className="table table-striped table-border-top">
                            <thead>
                                <tr>
                                    {this.columns.map(col => (
                                        <th key={col.id}>
                                            {this.renderHeader(
                                                col.label,
                                                col.id,
                                                col.sortable
                                            )}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {this.rows.length === 0 && !isLoading ? (
                                    <tr>
                                        <td
                                            colSpan={this.columns.length}
                                            style={{
                                                textAlign: 'center',
                                                padding: 20,
                                            }}
                                        >
                                            No matching resources.
                                        </td>
                                    </tr>
                                ) : (
                                    this.rows.map(row => (
                                        <tr key={row.key}>
                                            {this.columns.map(col => (
                                                <td key={col.id}>
                                                    {this.renderCell(
                                                        row,
                                                        col.id
                                                    )}
                                                </td>
                                            ))}
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {totalRowCount > 0 && (
                        <div
                            style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                marginTop: 10,
                            }}
                        >
                            <span style={{ color: '#666' }}>
                                Showing{' '}
                                {currentPage * pageSize + 1}-
                                {Math.min(
                                    (currentPage + 1) * pageSize,
                                    totalRowCount
                                )}{' '}
                                of {totalRowCount}
                            </span>
                            <PaginationControls
                                currentPage={currentPage}
                                totalItems={totalRowCount}
                                itemsPerPage={pageSize}
                                itemsPerPageOptions={[25, 50, 100]}
                                showItemsPerPageSelector={true}
                                onChangeItemsPerPage={(size: number) =>
                                    store.setPageSize(size)
                                }
                                previousPageDisabled={currentPage === 0}
                                nextPageDisabled={
                                    currentPage >= totalPages - 1
                                }
                                onPreviousPageClick={() =>
                                    store.setPage(currentPage - 1)
                                }
                                onNextPageClick={() =>
                                    store.setPage(currentPage + 1)
                                }
                            />
                        </div>
                    )}
                </div>
            </TabbedTableLayout>
        );
    }
}

export default ResourceDataTable;
