import * as React from 'react';
import _ from 'lodash';
import { action, computed, makeObservable, observable } from 'mobx';
import { observer } from 'mobx-react';
import { ResourceData } from 'cbioportal-ts-api-client';
import LazyMobXTable, {
    Column,
} from 'shared/components/lazyMobXTable/LazyMobXTable';
import TabbedTableLayout from 'shared/components/tabbedTable/TabbedTableLayout';
import CategoricalFilterMenu from 'shared/components/categoricalFilterMenu/CategoricalFilterMenu';
import FilterIconModal from 'shared/components/filterIconModal/FilterIconModal';
import { SimpleGetterLazyMobXTableApplicationDataStore } from 'shared/lib/ILazyMobXTableApplicationDataStore';
import { getFileExtension } from './ResourcesTableUtils';
import {
    buildResourceTableRows,
    getResourceTableMetadataKeys,
    IResourceTableRow,
    IResourceTableTab,
} from 'shared/lib/ResourceTableUtils';

export interface IResourceTableAction {
    label: string;
    href?: string;
    onClick?: () => void;
    target?: string;
    rel?: string;
    iconClassName?: string;
}

export interface IResourceDataTableProps {
    resources: ResourceData[];
    patientIdFallback?: string;
    resourceLabel?: string;
    emptyText?: string;
    searchPlaceholder?: string;
    hideUrlColumn?: boolean;
    columnLabels?: Partial<
        Record<
            | 'patientId'
            | 'sampleId'
            | 'resourceType'
            | 'resourceScope'
            | 'details'
            | 'actions',
            string
        >
    >;
    getPatientHref?: (row: IResourceTableRow) => string | undefined;
    getSampleHref?: (row: IResourceTableRow) => string | undefined;
    getResourceAction?: (
        row: IResourceTableRow
    ) => IResourceTableAction | undefined;
    getPrimaryAction?: (
        row: IResourceTableRow
    ) => IResourceTableAction | undefined;
    selectedResourceId?: string;
    showResourceTabs?: boolean;
}

interface IResourceDataTableContentProps extends IResourceDataTableProps {
    tabs: IResourceTableTab[];
    activeTabId?: string;
    onTabClick: (tabId: string) => void;
}

interface IResourceColumnFilter {
    filterCondition: string;
    filterString: string;
    selections: Set<string>;
}

const DEFAULT_FILTER_CONDITION = 'contains';
const NOT_AVAILABLE = 'Not available';
const NO_DESCRIPTION = 'No description provided';

function icon(resource: ResourceData) {
    let className = '';
    const fileExtension = getFileExtension(resource.url);
    switch (fileExtension) {
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
            } catch (_error) {
                return false;
            }
        default:
            return true;
    }
}

@observer
export default class ResourceDataTableContent extends React.Component<
    IResourceDataTableContentProps,
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

    private readonly dataStore: SimpleGetterLazyMobXTableApplicationDataStore<IResourceTableRow>;
    private readonly tableFilterScopeId: string;

    constructor(props: IResourceDataTableContentProps) {
        super(props);
        makeObservable(this);
        this.tableFilterScopeId = _.uniqueId('resource-table-filter-');
        this.dataStore =
            new SimpleGetterLazyMobXTableApplicationDataStore<IResourceTableRow>(
                () => this.rowsAfterHeaderFilters
            );
    }

    @computed get rows() {
        return buildResourceTableRows(
            this.props.resources,
            this.props.patientIdFallback
        );
    }

    @computed get metadataKeys() {
        return getResourceTableMetadataKeys(this.rows);
    }

    @computed get filteredRows() {
        return this.dataStore.sortedFilteredData;
    }

    @computed get matchingPatientCount() {
        return _.uniq(this.filteredRows.map(row => row.patientId).filter(Boolean))
            .length;
    }

    @computed get matchingSampleCount() {
        return _.uniq(
            this.filteredRows
                .map(row => row.resource.sampleId)
                .filter((sampleId): sampleId is string => !!sampleId)
        ).length;
    }

    @computed get filteredPatientResourceCounts() {
        return _.countBy(this.filteredRows, row => row.patientId);
    }

    @computed get filteredSampleResourceCounts() {
        return _.countBy(
            this.filteredRows.filter(row => !!row.resource.sampleId),
            row => row.resource.sampleId!
        );
    }

    @computed get activeTab() {
        return this.props.tabs.find(tab => tab.id === this.props.activeTabId);
    }

    @computed get shouldShowSampleIdColumn() {
        return this.rows.some(row => !!row.resource.sampleId);
    }

    @computed get columnLabels() {
        return {
            patientId: this.props.columnLabels?.patientId || 'Patient ID',
            sampleId: this.props.columnLabels?.sampleId || 'Sample ID',
            resourceType:
                this.props.columnLabels?.resourceType || 'Resource Type',
            resourceScope: this.props.columnLabels?.resourceScope || 'Scope',
            details: this.props.columnLabels?.details || 'Details',
            actions: this.props.columnLabels?.actions || 'Actions',
        };
    }

    @computed get rowsAfterHeaderFilters() {
        return this.rows.filter(row => this.rowMatchesHeaderFilters(row));
    }

    @computed get tableColumns(): Column<IResourceTableRow>[] {
        const columns: Column<IResourceTableRow>[] = [
            {
                id: 'patientId',
                name: this.columnLabels.patientId,
                render: row =>
                    this.renderLinkOrText(
                        row.patientId,
                        this.props.getPatientHref?.(row)
                    ),
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
                render: row => <span>{this.renderPatientResourceCount(row)}</span>,
                download: row => `${this.renderPatientResourceCount(row)}`,
                sortBy: row => this.renderPatientResourceCount(row),
                filter: (row, _filterString, filterStringUpper) =>
                    `${this.renderPatientResourceCount(row)}`
                        .toUpperCase()
                        .includes(filterStringUpper || ''),
            },
        ];

        if (this.shouldShowSampleIdColumn) {
            columns.push(
                {
                    id: 'sampleId',
                    name: this.columnLabels.sampleId,
                    render: row =>
                        this.renderLinkOrText(
                            row.sampleId,
                            this.props.getSampleHref?.(row)
                        ),
                    download: row => row.sampleId,
                    sortBy: row => [
                        row.sampleId.toLowerCase(),
                        row.patientId.toLowerCase(),
                        row.resourceType.toLowerCase(),
                    ],
                    filter: (row, _filterString, filterStringUpper) =>
                        row.sampleId
                            .toUpperCase()
                            .includes(filterStringUpper || ''),
                },
                {
                    id: 'sampleResourceCount',
                    name: 'Sample resources',
                    render: row => (
                        <span>{this.renderSampleResourceCount(row)}</span>
                    ),
                    download: row => `${this.renderSampleResourceCount(row)}`,
                    sortBy: row => {
                        const sampleCount = this.renderSampleResourceCount(row);
                        return sampleCount === '-' ? -1 : sampleCount;
                    },
                    filter: (row, _filterString, filterStringUpper) =>
                        `${this.renderSampleResourceCount(row)}`
                            .toUpperCase()
                            .includes(filterStringUpper || ''),
                }
            );
        }

        columns.push(
            {
                id: 'resourceType',
                name: this.columnLabels.resourceType,
                render: row => this.renderResourceCell(row),
                download: row => row.resourceType,
                sortBy: row => [
                    row.resourceType.toLowerCase(),
                    row.patientId.toLowerCase(),
                    row.sampleId.toLowerCase(),
                ],
                filter: (row, _filterString, filterStringUpper) =>
                    row.resourceType
                        .toUpperCase()
                        .includes(filterStringUpper || ''),
            },
            {
                id: 'resourceScope',
                name: this.columnLabels.resourceScope,
                render: row => <span>{row.resourceScope}</span>,
                download: row => row.resourceScope,
                sortBy: row => row.resourceScope.toLowerCase(),
                filter: (row, _filterString, filterStringUpper) =>
                    row.resourceScope
                        .toUpperCase()
                        .includes(filterStringUpper || ''),
            }
        );

        this.metadataKeys.forEach(metadataKey => {
            columns.push({
                id: this.getMetadataColumnId(metadataKey),
                name: metadataKey,
                visible: false,
                render: row => (
                    <span>{row.metadata[metadataKey] || NOT_AVAILABLE}</span>
                ),
                download: row => row.metadata[metadataKey] || NOT_AVAILABLE,
                sortBy: row =>
                    (row.metadata[metadataKey] || NOT_AVAILABLE).toLowerCase(),
                filter: (row, _filterString, filterStringUpper) =>
                    (row.metadata[metadataKey] || NOT_AVAILABLE)
                        .toUpperCase()
                        .includes(filterStringUpper || ''),
            });
        });

        columns.push(
            {
                id: 'description',
                name: this.columnLabels.details,
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
                name: this.columnLabels.actions,
                render: row => this.renderActionsCell(row),
                download: row => this.getActionDownloadValue(row),
                sortBy: row => this.getActionDownloadValue(row).toLowerCase(),
                filter: (row, _filterString, filterStringUpper) =>
                    this.getActionDownloadValue(row)
                        .toUpperCase()
                        .includes(filterStringUpper || ''),
                togglable: false,
            }
        );

        return columns;
    }

    @computed get tabs() {
        return this.props.tabs.map(tab => ({
            id: tab.id,
            label: tab.label,
            count: tab.totalCount,
        }));
    }

    private getMetadataColumnId(metadataKey: string) {
        return `metadata:${metadataKey}`;
    }

    private getColumnId(column: Column<IResourceTableRow>) {
        return column.id || column.name;
    }

    private getColumnFilterMenuId(columnId: string) {
        return `${this.tableFilterScopeId}-${columnId}`;
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

    private getColumnSelectionValues(columnId: string, rows: IResourceTableRow[]) {
        return new Set(
            _.sortBy(
                _.uniq(
                    rows
                        .map(row => this.getColumnValue(row, columnId))
                        .filter(Boolean)
                ),
                value => value.toLowerCase()
            )
        );
    }

    private getRowsForColumnOptions(columnId: string) {
        return this.rows.filter(row =>
            Object.entries(this.columnFilters).every(
                ([activeColumnId, filter]) => {
                if (activeColumnId === columnId) {
                    return true;
                }
                return this.rowMatchesSingleColumnFilter(
                    row,
                    activeColumnId,
                    filter
                );
                }
            )
        );
    }

    private rowMatchesSingleColumnFilter(
        row: IResourceTableRow,
        columnId: string,
        filter: IResourceColumnFilter
    ) {
        const value = this.getColumnValue(row, columnId) || NOT_AVAILABLE;
        return (
            filter.selections.has(value) &&
            matchesFilterCondition(value, filter)
        );
    }

    private rowMatchesHeaderFilters(row: IResourceTableRow) {
        return Object.entries(this.columnFilters).every(
            ([columnId, filter]) =>
                this.rowMatchesSingleColumnFilter(row, columnId, filter)
        );
    }

    private normalizeColumnFilter(
        columnId: string,
        filter: IResourceColumnFilter,
        allSelections: Set<string>
    ) {
        const normalizedSelections = new Set(
            Array.from(filter.selections).filter(selection =>
                allSelections.has(selection)
            )
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
            const nextFilters = { ...this.columnFilters };
            delete nextFilters[columnId];
            this.columnFilters = nextFilters;
            return;
        }

        this.columnFilters = {
            ...this.columnFilters,
            [columnId]: effectiveFilter,
        };
    }

    @action.bound
    private updateColumnFilterCondition(
        columnId: string,
        newFilterCondition: string
    ) {
        const allSelections = this.getColumnSelectionValues(
            columnId,
            this.getRowsForColumnOptions(columnId)
        );
        const existingFilter = this.columnFilters[columnId];
        this.normalizeColumnFilter(
            columnId,
            {
                filterCondition: newFilterCondition,
                filterString: existingFilter?.filterString || '',
                selections:
                    existingFilter?.selections || new Set(allSelections),
            },
            allSelections
        );
    }

    @action.bound
    private updateColumnFilterString(columnId: string, newFilterString: string) {
        const allSelections = this.getColumnSelectionValues(
            columnId,
            this.getRowsForColumnOptions(columnId)
        );
        const existingFilter = this.columnFilters[columnId];
        this.normalizeColumnFilter(
            columnId,
            {
                filterCondition:
                    existingFilter?.filterCondition || DEFAULT_FILTER_CONDITION,
                filterString: newFilterString,
                selections:
                    existingFilter?.selections || new Set(allSelections),
            },
            allSelections
        );
    }

    @action.bound
    private toggleColumnFilterSelections(
        columnId: string,
        toggledSelections: Set<string>
    ) {
        const allSelections = this.getColumnSelectionValues(
            columnId,
            this.getRowsForColumnOptions(columnId)
        );
        const existingFilter = this.columnFilters[columnId];
        const nextSelections = new Set(
            existingFilter?.selections || allSelections
        );

        toggledSelections.forEach(selection => {
            if (nextSelections.has(selection)) {
                nextSelections.delete(selection);
            } else {
                nextSelections.add(selection);
            }
        });

        this.normalizeColumnFilter(
            columnId,
            {
                filterCondition:
                    existingFilter?.filterCondition || DEFAULT_FILTER_CONDITION,
                filterString: existingFilter?.filterString || '',
                selections: nextSelections,
            },
            allSelections
        );
    }

    @action.bound
    private deactivateColumnFilter(columnId: string) {
        if (!this.columnFilters[columnId]) {
            return;
        }

        const nextFilters = { ...this.columnFilters };
        delete nextFilters[columnId];
        this.columnFilters = nextFilters;
    }

    private shouldShowColumnFilter(columnId: string) {
        return ![
            'patientResourceCount',
            'sampleResourceCount',
            'actions',
        ].includes(columnId);
    }

    private renderColumnFilterModal(column: Column<IResourceTableRow>) {
        const columnId = this.getColumnId(column);
        if (!this.shouldShowColumnFilter(columnId)) {
            return undefined;
        }

        const allSelections = this.getColumnSelectionValues(
            columnId,
            this.getRowsForColumnOptions(columnId)
        );
        const filter = this.columnFilters[columnId];
        const filterMenuId = this.getColumnFilterMenuId(columnId);

        return (
            <span data-test={`resource-column-filter-${columnId}`}>
                <FilterIconModal
                    id={filterMenuId}
                    label={column.name}
                    filterIsActive={!!filter}
                    deactivateFilter={() =>
                        this.deactivateColumnFilter(columnId)
                    }
                    setupFilter={() => undefined}
                    menuComponent={
                        <CategoricalFilterMenu
                            id={filterMenuId}
                            emptyFilterString={!filter}
                            currSelections={filter?.selections || allSelections}
                            allSelections={allSelections}
                            updateFilterCondition={newFilterCondition =>
                                this.updateColumnFilterCondition(
                                    columnId,
                                    newFilterCondition
                                )
                            }
                            updateFilterString={newFilterString =>
                                this.updateColumnFilterString(
                                    columnId,
                                    newFilterString
                                )
                            }
                            toggleSelections={toggledSelections =>
                                this.toggleColumnFilterSelections(
                                    columnId,
                                    toggledSelections
                                )
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

    private renderAction(action: IResourceTableAction, key: string) {
        const iconElement = action.iconClassName ? (
            <i
                className={`${action.iconClassName} fa-sm`}
                style={{ marginRight: 5, color: 'black' }}
            />
        ) : null;

        if (action.href) {
            return (
                <div key={key}>
                    <a
                        href={action.href}
                        target={action.target}
                        rel={action.rel || 'noopener noreferrer'}
                    >
                        {iconElement}
                        {action.label}
                    </a>
                </div>
            );
        }

        return (
            <div key={key}>
                <a onClick={action.onClick}>
                    {iconElement}
                    {action.label}
                </a>
            </div>
        );
    }

    private renderResourceCell(row: IResourceTableRow) {
        const action = this.props.getResourceAction?.(row);
        const content = (
            <>
                {icon(row.resource)}
                {row.resourceType}
            </>
        );

        if (!action) {
            return <span>{content}</span>;
        }

        if (action.href) {
            return (
                <a
                    href={action.href}
                    target={action.target}
                    rel={action.rel || 'noopener noreferrer'}
                >
                    {content}
                </a>
            );
        }

        return <a onClick={action.onClick}>{content}</a>;
    }

    private renderActionsCell(row: IResourceTableRow) {
        const actions: IResourceTableAction[] = [];
        const primaryAction = this.props.getPrimaryAction?.(row);
        if (primaryAction) {
            actions.push(primaryAction);
        }
        if (!this.props.hideUrlColumn) {
            actions.push({
                label: 'Open in new window',
                href: row.url,
                target: '_blank',
                rel: 'noopener noreferrer',
                iconClassName: 'fa fa-external-link',
            });
        }

        return actions.length > 0 ? (
            <>{actions.map((action, index) => this.renderAction(action, `${row.key}-${index}`))}</>
        ) : (
            <span>-</span>
        );
    }

    private getActionDownloadValue(row: IResourceTableRow) {
        return this.props.hideUrlColumn ? '' : 'Open in new window';
    }

    private renderPatientResourceCount(row: IResourceTableRow) {
        return this.filteredPatientResourceCounts[row.patientId] || 0;
    }

    private renderSampleResourceCount(row: IResourceTableRow) {
        const sampleId = row.resource.sampleId;
        if (!sampleId) {
            return '-';
        }

        return this.filteredSampleResourceCounts[sampleId] || 0;
    }

    render() {
        return (
            <TabbedTableLayout
                tabs={this.tabs}
                activeTabId={this.props.activeTabId}
                onTabClick={this.props.onTabClick}
                testId="resource-data-table"
            >
                <LazyMobXTable
                    dataStore={this.dataStore}
                    columns={this.tableColumns}
                    showCountHeader={true}
                    showColumnVisibility={true}
                    showFilter={true}
                    showFilterClearButton={true}
                    showCopyDownload={false}
                    columnVisibilityProps={{
                        buttonText: 'Add columns',
                    }}
                    columnToHeaderFilterIconModal={
                        this.renderColumnFilterModal.bind(this)
                    }
                    deactivateColumnFilter={this.deactivateColumnFilter}
                    initialSortColumn={this.columnLabels.patientId}
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
            </TabbedTableLayout>
        );
    }
}
