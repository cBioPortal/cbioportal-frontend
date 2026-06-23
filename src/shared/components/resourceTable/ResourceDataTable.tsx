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
        const pathName = urlObj.pathname;
        const match = pathName.match(/.+\.(.+)/);
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

    if (!normalizedFilterString) {
        return true;
    }

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

    @observable.ref private columnFilters: Record<string, IResourceColumnFilter> =
        {};

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
        return _.uniq(
            this.rowsAfterHeaderFilters
                .map(row => row.patientId)
                .filter(Boolean)
        ).length;
    }

    @computed get matchingSampleCount() {
        return _.uniq(
            this.rowsAfterHeaderFilters
                .map(row => row.resource?.sampleId)
                .filter((id): id is string => !!id)
        ).length;
    }

    @computed get filteredPatientResourceCounts() {
        return _.countBy(this.rowsAfterHeaderFilters, row => row.patientId);
    }

    @computed get filteredSampleResourceCounts() {
        return _.countBy(
            this.rowsAfterHeaderFilters.filter(
                row => !!row.resource?.sampleId
            ),
            row => row.resource.sampleId!
        );
    }

    @computed get shouldShowSampleIdColumn() {
        return this.rows.some(row => !!row.resource?.sampleId);
    }

    @computed get rowsAfterHeaderFilters() {
        return this.rows.filter(row => this.rowMatchesHeaderFilters(row));
    }

    @computed get tableColumns(): Column<IResourceTableRow>[] {
        const columns: Column<IResourceTableRow>[] = [
            {
                id: 'patientId',
                name: 'Patient ID',
                render: row => {
                    const href = row.resource?.studyId && row.resource?.patientId
                        ? getPatientViewUrlWithPathname(row.resource.studyId, row.patientId, 'patient/filesAndLinks')
                        : undefined;
                    return this.renderLinkOrText(row.patientId, href);
                },
                download: row => row.patientId,
                sortBy: row => [
                    row.patientId.toLowerCase(),
                    row.sampleId.toLowerCase(),
                    row.resourceType.toLowerCase(),
                ],
                filter: (row, _filterString, filterStringUpper) =>
                    row.patientId.toUpperCase().includes(filterStringUpper || ''),
            },
            {
                id: 'patientResourceCount',
                name: 'Patient resources',
                render: row => <span>{this.filteredPatientResourceCounts[row.patientId] || 0}</span>,
                download: row => `${this.filteredPatientResourceCounts[row.patientId] || 0}`,
                sortBy: row => this.filteredPatientResourceCounts[row.patientId] || 0,
                filter: (row, _filterString, filterStringUpper) =>
                    `${this.filteredPatientResourceCounts[row.patientId] || 0}`
                        .toUpperCase()
                        .includes(filterStringUpper || ''),
            },
        ];

        if (this.shouldShowSampleIdColumn) {
            columns.push(
                {
                    id: 'sampleId',
                    name: 'Sample ID',
                    render: row => {
                        const href = row.resource?.studyId && row.resource?.sampleId
                            ? getSampleViewUrlWithPathname(row.resource.studyId, row.resource.sampleId, 'patient/filesAndLinks')
                            : undefined;
                        return this.renderLinkOrText(row.sampleId, href);
                    },
                    download: row => row.sampleId,
                    sortBy: row => [
                        row.sampleId.toLowerCase(),
                        row.patientId.toLowerCase(),
                        row.resourceType.toLowerCase(),
                    ],
                    filter: (row, _filterString, filterStringUpper) =>
                        row.sampleId.toUpperCase().includes(filterStringUpper || ''),
                },
                {
                    id: 'sampleResourceCount',
                    name: 'Sample resources',
                    render: row => {
                        const sampleId = row.resource?.sampleId;
                        if (!sampleId) return <span>-</span>;
                        return <span>{this.filteredSampleResourceCounts[sampleId] || 0}</span>;
                    },
                    download: row => {
                        const sampleId = row.resource?.sampleId;
                        return sampleId ? `${this.filteredSampleResourceCounts[sampleId] || 0}` : '-';
                    },
                    sortBy: row => {
                        const sampleId = row.resource?.sampleId;
                        return sampleId ? (this.filteredSampleResourceCounts[sampleId] || 0) : -1;
                    },
                    filter: (row, _filterString, filterStringUpper) => {
                        const sampleId = row.resource?.sampleId;
                        const count = sampleId ? (this.filteredSampleResourceCounts[sampleId] || 0) : '-';
                        return `${count}`.toUpperCase().includes(filterStringUpper || '');
                    },
                }
            );
        }

        columns.push(
            {
                id: 'resourceType',
                name: 'Resource Type',
                render: row => (
                    <span>
                        {icon(row.url)}
                        {row.resourceType}
                    </span>
                ),
                download: row => row.resourceType,
                sortBy: row => [
                    row.resourceType.toLowerCase(),
                    row.patientId.toLowerCase(),
                    row.sampleId.toLowerCase(),
                ],
                filter: (row, _filterString, filterStringUpper) =>
                    row.resourceType.toUpperCase().includes(filterStringUpper || ''),
            },
            {
                id: 'resourceScope',
                name: 'Scope',
                render: row => <span>{row.resourceScope}</span>,
                download: row => row.resourceScope,
                sortBy: row => row.resourceScope.toLowerCase(),
                filter: (row, _filterString, filterStringUpper) =>
                    row.resourceScope.toUpperCase().includes(filterStringUpper || ''),
            }
        );

        // Dynamic metadata columns
        this.metadataKeys.forEach(metadataKey => {
            columns.push({
                id: `metadata:${metadataKey}`,
                name: metadataKey,
                visible: false,
                render: row => <span>{row.metadata[metadataKey] || NOT_AVAILABLE}</span>,
                download: row => row.metadata[metadataKey] || NOT_AVAILABLE,
                sortBy: row => (row.metadata[metadataKey] || NOT_AVAILABLE).toLowerCase(),
                filter: (row, _filterString, filterStringUpper) =>
                    (row.metadata[metadataKey] || NOT_AVAILABLE)
                        .toUpperCase()
                        .includes(filterStringUpper || ''),
            });
        });

        columns.push(
            {
                id: 'description',
                name: 'Details',
                render: row => <span>{row.description || NO_DESCRIPTION}</span>,
                download: row => row.description || NO_DESCRIPTION,
                sortBy: row => (row.description || NO_DESCRIPTION).toLowerCase(),
                filter: (row, _filterString, filterStringUpper) =>
                    (row.description || NO_DESCRIPTION)
                        .toUpperCase()
                        .includes(filterStringUpper || ''),
            },
            {
                id: 'actions',
                name: 'Actions',
                render: row => (
                    <a href={row.url} target="_blank" rel="noopener noreferrer">
                        <i className="fa fa-external-link fa-sm" style={{ marginRight: 5, color: 'black' }} />
                        Open in new window
                    </a>
                ),
                download: row => 'Open in new window',
                sortBy: row => row.url.toLowerCase(),
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
        const store = this.props.store;
        if (store.selectedResourceId) {
            return store.selectedResourceId;
        }
        return this.props.store.tabsForDisplay[0]?.id;
    }

    // ── Column filter logic (client-side, same as PR 5595) ──

    private getColumnValue(row: IResourceTableRow, columnId: string) {
        switch (columnId) {
            case 'patientId': return row.patientId;
            case 'sampleId': return row.sampleId;
            case 'resourceType': return row.resourceType;
            case 'resourceScope': return row.resourceScope;
            case 'description': return row.description || NO_DESCRIPTION;
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

    private rowMatchesSingleColumnFilter(row: IResourceTableRow, columnId: string, filter: IResourceColumnFilter) {
        const value = this.getColumnValue(row, columnId) || NOT_AVAILABLE;
        return filter.selections.has(value) && matchesFilterCondition(value, filter);
    }

    private rowMatchesHeaderFilters(row: IResourceTableRow) {
        return Object.entries(this.columnFilters).every(
            ([columnId, filter]) => this.rowMatchesSingleColumnFilter(row, columnId, filter)
        );
    }

    @action.bound
    private normalizeColumnFilter(columnId: string, filter: IResourceColumnFilter, allSelections: Set<string>) {
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
        const allSelections = this.getColumnSelectionValues(columnId, this.getRowsForColumnOptions(columnId));
        const existing = this.columnFilters[columnId];
        this.normalizeColumnFilter(columnId, {
            filterCondition: condition,
            filterString: existing?.filterString || '',
            selections: existing?.selections || new Set(allSelections),
        }, allSelections);
    }

    @action.bound
    private updateColumnFilterString(columnId: string, filterString: string) {
        const allSelections = this.getColumnSelectionValues(columnId, this.getRowsForColumnOptions(columnId));
        const existing = this.columnFilters[columnId];
        this.normalizeColumnFilter(columnId, {
            filterCondition: existing?.filterCondition || DEFAULT_FILTER_CONDITION,
            filterString,
            selections: existing?.selections || new Set(allSelections),
        }, allSelections);
    }

    @action.bound
    private toggleColumnFilterSelections(columnId: string, toggled: Set<string>) {
        const allSelections = this.getColumnSelectionValues(columnId, this.getRowsForColumnOptions(columnId));
        const existing = this.columnFilters[columnId];
        const nextSelections = new Set(existing?.selections || allSelections);
        toggled.forEach(s => {
            if (nextSelections.has(s)) nextSelections.delete(s);
            else nextSelections.add(s);
        });
        this.normalizeColumnFilter(columnId, {
            filterCondition: existing?.filterCondition || DEFAULT_FILTER_CONDITION,
            filterString: existing?.filterString || '',
            selections: nextSelections,
        }, allSelections);
    }

    @action.bound
    private deactivateColumnFilter(columnId: string) {
        if (!this.columnFilters[columnId]) return;
        const next = { ...this.columnFilters };
        delete next[columnId];
        this.columnFilters = next;
    }

    private shouldShowColumnFilter(columnId: string) {
        return !['patientResourceCount', 'sampleResourceCount', 'actions'].includes(columnId);
    }

    private renderColumnFilterModal(column: Column<IResourceTableRow>) {
        const columnId = column.id || column.name;
        if (!this.shouldShowColumnFilter(columnId)) return undefined;

        const allSelections = this.getColumnSelectionValues(columnId, this.getRowsForColumnOptions(columnId));
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
                            updateFilterCondition={c => this.updateColumnFilterCondition(columnId, c)}
                            updateFilterString={s => this.updateColumnFilterString(columnId, s)}
                            toggleSelections={t => this.toggleColumnFilterSelections(columnId, t)}
                        />
                    }
                />
            </span>
        );
    }

    private renderLinkOrText(text: string, href?: string) {
        if (href) {
            return <a href={href} target="_blank" rel="noopener noreferrer">{text}</a>;
        }
        return <span>{text}</span>;
    }

    @action.bound
    private onTabClick(tabId: string) {
        this.props.store.setSelectedResourceId(tabId);
        this.columnFilters = {};
    }

    render() {
        const { store } = this.props;

        if (store.tabs.isPending || store.tableData.isPending) {
            return <LoadingIndicator isLoading={true} center={true} size="big" />;
        }

        if (store.tabs.isError) {
            return <div className="alert alert-danger">Error loading resource tabs.</div>;
        }

        if (store.tabsForDisplay.length === 0) {
            return <div className="alert alert-info">{this.props.emptyText || 'No resources available.'}</div>;
        }

        return (
            <TabbedTableLayout
                tabs={this.tabs.length > 1 ? this.tabs : []}
                activeTabId={this.activeTabId}
                onTabClick={this.onTabClick}
                testId="resource-data-table"
            >
                {store.tableData.isError ? (
                    <div className="alert alert-danger">Error loading resource data.</div>
                ) : (
                    <LazyMobXTable
                        dataStore={this.dataStore}
                        columns={this.tableColumns}
                        showCountHeader={true}
                        showColumnVisibility={true}
                        showFilter={true}
                        showFilterClearButton={true}
                        showCopyDownload={false}
                        columnVisibilityProps={{ buttonText: 'Add columns' }}
                        columnToHeaderFilterIconModal={this.renderColumnFilterModal.bind(this)}
                        deactivateColumnFilter={this.deactivateColumnFilter}
                        initialSortColumn="Patient ID"
                        initialSortDirection="asc"
                        initialItemsPerPage={25}
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
                                    color: '#666',
                                    marginLeft: 12,
                                }}
                            >
                                {this.matchingPatientCount} patients /{' '}
                                {this.matchingSampleCount} samples
                            </div>
                        }
                    />
                )}
            </TabbedTableLayout>
        );
    }
}

export default ResourceDataTable;
