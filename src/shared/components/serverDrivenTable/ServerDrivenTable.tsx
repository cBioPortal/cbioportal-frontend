import * as React from 'react';
import classNames from 'classnames';
import { action, computed, makeObservable, observable } from 'mobx';
import { observer } from 'mobx-react';
import { ButtonToolbar } from 'react-bootstrap';
import CategoricalFilterMenu from 'shared/components/categoricalFilterMenu/CategoricalFilterMenu';
import {
    ColumnVisibilityControls,
    IColumnVisibilityDef,
} from 'shared/components/columnVisibilityControls/ColumnVisibilityControls';
import FilterIconModal from 'shared/components/filterIconModal/FilterIconModal';
import LoadingIndicator from 'shared/components/loadingIndicator/LoadingIndicator';
import { PaginationControls } from 'shared/components/paginationControls/PaginationControls';
import 'shared/components/lazyMobXTable/styles.scss';

type SortDirection = 'asc' | 'desc';
type FacetFilterCondition =
    | 'contains'
    | 'doesNotContain'
    | 'equals'
    | 'doesNotEqual'
    | 'beginsWith'
    | 'doesNotBeginWith'
    | 'endsWith'
    | 'doesNotEndWith'
    | 'regex';

export interface ServerDrivenTableColumn<T> {
    id: string;
    name: string;
    visible?: boolean;
    togglable?: boolean;
    sortable?: boolean;
    filterable?: boolean;
    render: (row: T) => React.ReactNode;
    download?: (row: T) => string;
}

export interface ServerDrivenTableProps<T> {
    rows: T[];
    columns: ServerDrivenTableColumn<T>[];
    totalRowCount: number;
    itemsLabel?: string;
    currentPage: number;
    pageSize: number;
    pageSizeOptions?: number[];
    onPageChange: (page: number) => void;
    onPageSizeChange: (size: number) => void;
    sortColumn?: string;
    sortDirection?: SortDirection;
    onSortChange: (columnId: string, direction: SortDirection) => void;
    searchPlaceholder?: string;
    onSearchChange: (term: string) => void;
    searchDebounceMs?: number;
    facets?: Record<string, { value: string; count: number }[]>;
    activeFilters?: Record<string, Set<string>>;
    onFilterChange: (
        columnId: string,
        selectedValues: Set<string>,
        allValues: Set<string>
    ) => void;
    onFilterDeactivate: (columnId: string) => void;
    showColumnVisibility?: boolean;
    columnVisibilityButtonText?: string;
    isLoading?: boolean;
    headerContent?: React.ReactNode;
    testId?: string;
}

@observer
export default class ServerDrivenTable<T> extends React.Component<
    ServerDrivenTableProps<T>,
    {}
> {
    public static defaultProps = {
        itemsLabel: 'items',
        pageSizeOptions: [25, 50, 100],
        searchPlaceholder: 'Search',
        searchDebounceMs: 300,
        showColumnVisibility: true,
        columnVisibilityButtonText: 'Add columns',
        isLoading: false,
    };

    @observable.ref private columnVisibility: Record<string, boolean> = {};
    @observable private searchTerm = '';
    @observable.ref private facetFilterStrings: Record<string, string> = {};
    @observable.ref private facetFilterConditions: Record<
        string,
        FacetFilterCondition
    > = {};

    private searchTimeout: number | undefined;

    constructor(props: ServerDrivenTableProps<T>) {
        super(props);
        makeObservable(this);
        this.syncColumnVisibility(props.columns);
    }

    public componentDidUpdate(prevProps: ServerDrivenTableProps<T>) {
        if (prevProps.columns !== this.props.columns) {
            this.syncColumnVisibility(this.props.columns);
        }
    }

    public componentWillUnmount() {
        if (this.searchTimeout !== undefined) {
            window.clearTimeout(this.searchTimeout);
        }
    }

    @computed
    private get visibleColumns(): ServerDrivenTableColumn<T>[] {
        return this.props.columns.filter(column =>
            this.isColumnVisible(column)
        );
    }

    @computed
    private get columnVisibilityDefs(): IColumnVisibilityDef[] {
        return this.props.columns.map(column => ({
            id: column.id,
            name: column.name,
            visible: this.isColumnVisible(column),
            togglable: column.togglable !== false,
        }));
    }

    @computed
    private get totalPages(): number {
        if (this.props.pageSize <= 0) {
            return 1;
        }

        return Math.max(
            1,
            Math.ceil(this.props.totalRowCount / this.props.pageSize)
        );
    }

    @computed
    private get pageNumberText(): string {
        return `${this.props.currentPage + 1} / ${this.totalPages}`;
    }

    @computed
    private get countSummary(): React.ReactNode {
        const itemsLabel = this.props.itemsLabel || 'items';
        if (this.props.totalRowCount === 0) {
            return <span>{`0 ${itemsLabel}`}</span>;
        }

        const startRow = this.props.currentPage * this.props.pageSize + 1;
        const endRow = Math.min(
            this.props.totalRowCount,
            startRow + this.props.rows.length - 1
        );

        return (
            <span>
                {startRow}-{Math.max(startRow, endRow)} of{' '}
                {this.props.totalRowCount} {itemsLabel}
            </span>
        );
    }

    @action.bound
    private syncColumnVisibility(columns: ServerDrivenTableColumn<T>[]) {
        const nextVisibility: Record<string, boolean> = {};

        columns.forEach(column => {
            nextVisibility[column.id] =
                this.columnVisibility[column.id] ?? column.visible !== false;
        });

        this.columnVisibility = nextVisibility;
    }

    @action.bound
    private onSearchInputChange(evt: React.FormEvent<HTMLInputElement>) {
        const nextValue = evt.currentTarget.value;
        this.searchTerm = nextValue;

        if (this.searchTimeout !== undefined) {
            window.clearTimeout(this.searchTimeout);
        }

        this.searchTimeout = window.setTimeout(() => {
            this.props.onSearchChange(nextValue);
        }, this.props.searchDebounceMs || 300);
    }

    @action.bound
    private clearSearch() {
        this.searchTerm = '';
        if (this.searchTimeout !== undefined) {
            window.clearTimeout(this.searchTimeout);
            this.searchTimeout = undefined;
        }
        this.props.onSearchChange('');
    }

    @action.bound
    private toggleColumnVisibility(columnId: string) {
        this.columnVisibility = {
            ...this.columnVisibility,
            [columnId]: !this.columnVisibility[columnId],
        };
    }

    @action.bound
    private updateFacetFilterCondition(
        columnId: string,
        condition: FacetFilterCondition
    ) {
        this.facetFilterConditions = {
            ...this.facetFilterConditions,
            [columnId]: condition,
        };
    }

    @action.bound
    private updateFacetFilterString(columnId: string, filterString: string) {
        this.facetFilterStrings = {
            ...this.facetFilterStrings,
            [columnId]: filterString,
        };
    }

    @action.bound
    private toggleFacetSelections(
        columnId: string,
        toggledValues: Set<string>
    ) {
        const allValues = this.getAllFacetValues(columnId);
        const nextSelections = this.getCurrentSelections(columnId, allValues);

        toggledValues.forEach(value => {
            if (nextSelections.has(value)) {
                nextSelections.delete(value);
            } else if (allValues.has(value)) {
                nextSelections.add(value);
            }
        });

        if (this.areSetsEqual(nextSelections, allValues)) {
            this.props.onFilterDeactivate(columnId);
            return;
        }

        this.props.onFilterChange(columnId, nextSelections, allValues);
    }

    @action.bound
    private onHeaderClick(column: ServerDrivenTableColumn<T>) {
        if (!this.isColumnSortable(column)) {
            return;
        }

        this.props.onSortChange(
            column.id,
            this.getNextSortDirection(column.id)
        );
    }

    private isColumnVisible(column: ServerDrivenTableColumn<T>) {
        return this.columnVisibility[column.id] ?? column.visible !== false;
    }

    private isColumnSortable(column: ServerDrivenTableColumn<T>) {
        return column.sortable !== false;
    }

    private isColumnFilterable(column: ServerDrivenTableColumn<T>) {
        return (
            column.filterable !== false &&
            this.getFacetOptions(column.id).length > 0
        );
    }

    private isColumnSorted(columnId: string) {
        return this.props.sortColumn === columnId;
    }

    private getNextSortDirection(columnId: string): SortDirection {
        if (this.props.sortColumn === columnId) {
            return this.props.sortDirection === 'asc' ? 'desc' : 'asc';
        }

        return 'asc';
    }

    private getSortClassName(columnId: string) {
        if (!this.isColumnSorted(columnId)) {
            return undefined;
        }

        return this.props.sortDirection === 'desc' ? 'sort-des' : 'sort-asc';
    }

    private getSortIcon(columnId: string) {
        if (!this.isColumnSorted(columnId)) {
            return null;
        }

        return this.props.sortDirection === 'desc' ? (
            <i className="fa fa-sort-desc lazyMobxTableSortArrowDesc" />
        ) : (
            <i className="fa fa-sort-asc lazyMobxTableSortArrowAsc" />
        );
    }

    private getFacetOptions(columnId: string) {
        return this.props.facets?.[columnId] || [];
    }

    private getAllFacetValues(columnId: string) {
        return new Set(
            this.getFacetOptions(columnId).map(option => option.value)
        );
    }

    private getCurrentSelections(columnId: string, allValues?: Set<string>) {
        const resolvedAllValues = allValues || this.getAllFacetValues(columnId);
        const activeSelection = this.props.activeFilters?.[columnId];

        return activeSelection
            ? new Set(activeSelection)
            : new Set(resolvedAllValues);
    }

    private getFacetFilterCondition(columnId: string): FacetFilterCondition {
        return this.facetFilterConditions[columnId] || 'contains';
    }

    private getFacetFilterString(columnId: string): string {
        return this.facetFilterStrings[columnId] || '';
    }

    private getFilteredFacetValues(columnId: string) {
        const filterString = this.getFacetFilterString(columnId);
        const filterCondition = this.getFacetFilterCondition(columnId);

        return this.getFacetOptions(columnId)
            .filter(option =>
                this.matchesFacetOption(
                    option.value,
                    filterString,
                    filterCondition
                )
            )
            .map(option => option.value);
    }

    private matchesFacetOption(
        value: string,
        filterString: string,
        filterCondition: FacetFilterCondition
    ) {
        if (!filterString) {
            return true;
        }

        const normalizedValue = value.toLowerCase();
        const normalizedFilter = filterString.toLowerCase();

        switch (filterCondition) {
            case 'contains':
                return normalizedValue.includes(normalizedFilter);
            case 'doesNotContain':
                return !normalizedValue.includes(normalizedFilter);
            case 'equals':
                return normalizedValue === normalizedFilter;
            case 'doesNotEqual':
                return normalizedValue !== normalizedFilter;
            case 'beginsWith':
                return normalizedValue.startsWith(normalizedFilter);
            case 'doesNotBeginWith':
                return !normalizedValue.startsWith(normalizedFilter);
            case 'endsWith':
                return normalizedValue.endsWith(normalizedFilter);
            case 'doesNotEndWith':
                return !normalizedValue.endsWith(normalizedFilter);
            case 'regex':
                try {
                    return new RegExp(filterString, 'i').test(value);
                } catch (error) {
                    return true;
                }
            default:
                return true;
        }
    }

    private isFilterActive(columnId: string) {
        const activeSelection = this.props.activeFilters?.[columnId];
        if (!activeSelection) {
            return false;
        }

        return !this.areSetsEqual(
            activeSelection,
            this.getAllFacetValues(columnId)
        );
    }

    private areSetsEqual(a: Set<string>, b: Set<string>) {
        if (a.size !== b.size) {
            return false;
        }

        for (const value of a) {
            if (!b.has(value)) {
                return false;
            }
        }

        return true;
    }

    private renderFilterControl(column: ServerDrivenTableColumn<T>) {
        if (!this.isColumnFilterable(column)) {
            return null;
        }

        const columnId = column.id;
        const allValues = this.getAllFacetValues(columnId);
        const currentSelections = this.getCurrentSelections(
            columnId,
            allValues
        );
        const filteredValues = new Set(this.getFilteredFacetValues(columnId));
        const displayedSelections = new Set(
            Array.from(currentSelections).filter(value =>
                filteredValues.has(value)
            )
        );
        const menuId = `${this.props.testId ||
            'server-driven-table'}-${columnId}`;

        return (
            <FilterIconModal
                id={menuId}
                label={column.name}
                filterIsActive={this.isFilterActive(columnId)}
                deactivateFilter={() => this.props.onFilterDeactivate(columnId)}
                setupFilter={() => undefined}
                menuComponent={
                    <CategoricalFilterMenu
                        id={menuId}
                        currSelections={displayedSelections}
                        allSelections={filteredValues}
                        updateFilterCondition={(condition: string) =>
                            this.updateFacetFilterCondition(
                                columnId,
                                condition as FacetFilterCondition
                            )
                        }
                        updateFilterString={(filterString: string) =>
                            this.updateFacetFilterString(columnId, filterString)
                        }
                        toggleSelections={(toggledSelections: Set<string>) =>
                            this.toggleFacetSelections(
                                columnId,
                                toggledSelections
                            )
                        }
                    />
                }
            />
        );
    }

    private renderHeaders() {
        return this.visibleColumns.map(column => {
            const sortClassName = this.getSortClassName(column.id);
            const filterControl = this.renderFilterControl(column);
            const isSortable = this.isColumnSortable(column);

            return (
                <th
                    key={column.id}
                    className={classNames('multilineHeader', sortClassName)}
                    style={{ verticalAlign: 'top' }}
                >
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'flex-start',
                            justifyContent: 'space-between',
                            gap: 6,
                        }}
                    >
                        <span
                            role={isSortable ? 'button' : undefined}
                            onClick={
                                isSortable
                                    ? () => this.onHeaderClick(column)
                                    : undefined
                            }
                            style={{
                                cursor: isSortable ? 'pointer' : 'default',
                                display: 'inline-flex',
                                alignItems: 'flex-start',
                            }}
                        >
                            <span>{column.name}</span>
                            {this.getSortIcon(column.id)}
                        </span>
                        {filterControl}
                    </div>
                </th>
            );
        });
    }

    private renderRows() {
        const colSpan = Math.max(this.visibleColumns.length, 1);

        if (this.visibleColumns.length === 0) {
            return (
                <tr>
                    <td style={{ textAlign: 'center' }} colSpan={1}>
                        No columns selected
                    </td>
                </tr>
            );
        }

        if (!this.props.isLoading && this.props.rows.length === 0) {
            return (
                <tr>
                    <td style={{ textAlign: 'center' }} colSpan={colSpan}>
                        No data available
                    </td>
                </tr>
            );
        }

        return this.props.rows.map((row, rowIndex) => (
            <tr key={rowIndex}>
                {this.visibleColumns.map(column => (
                    <td key={column.id}>{column.render(row)}</td>
                ))}
            </tr>
        ));
    }

    private renderTopToolbar() {
        const headerContent = this.props.headerContent || (
            <div
                style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    minHeight: 30,
                    fontWeight: 'bold',
                    marginLeft: 6,
                }}
            >
                {this.countSummary}
            </div>
        );

        return (
            <div className="clearfix">
                <ButtonToolbar
                    style={{
                        marginLeft: 0,
                        display: 'flex',
                        width: '100%',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        gap: 12,
                        flexWrap: 'wrap',
                    }}
                    className="tableMainToolbar"
                >
                    <div>{headerContent}</div>
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: 8,
                            flexWrap: 'wrap',
                            marginLeft: 'auto',
                        }}
                    >
                        <div
                            className="form-group has-feedback"
                            style={{
                                marginBottom: 0,
                                width: 240,
                                position: 'relative',
                            }}
                        >
                            <input
                                type="text"
                                className="form-control input-sm"
                                value={this.searchTerm}
                                onChange={this.onSearchInputChange}
                                placeholder={this.props.searchPlaceholder}
                            />
                            {this.searchTerm ? (
                                <span
                                    style={{
                                        fontSize: 18,
                                        cursor: 'pointer',
                                        color: 'rgb(153, 153, 153)',
                                        position: 'absolute',
                                        right: 9,
                                        top: 2,
                                        zIndex: 10,
                                    }}
                                    onClick={this.clearSearch}
                                >
                                    x
                                </span>
                            ) : (
                                <span
                                    className="fa fa-search form-control-feedback"
                                    aria-hidden="true"
                                    style={{
                                        zIndex: 0,
                                        width: 30,
                                        height: 30,
                                        lineHeight: '30px',
                                    }}
                                />
                            )}
                        </div>
                        {this.props.showColumnVisibility && (
                            <ColumnVisibilityControls
                                className="pull-right"
                                buttonText={
                                    this.props.columnVisibilityButtonText
                                }
                                columnVisibility={this.columnVisibilityDefs}
                                onColumnToggled={this.toggleColumnVisibility}
                            />
                        )}
                    </div>
                </ButtonToolbar>
            </div>
        );
    }

    private renderPagination() {
        const isFirstPage = this.props.currentPage <= 0;
        const isLastPage =
            this.props.totalRowCount === 0 ||
            this.props.currentPage >= this.totalPages - 1;

        return (
            <ButtonToolbar
                style={{ marginLeft: 0, float: 'none' }}
                className="tableMainToolbar center"
            >
                <PaginationControls
                    currentPage={this.props.currentPage}
                    totalItems={this.props.totalRowCount}
                    itemsPerPage={this.props.pageSize}
                    itemsPerPageOptions={this.props.pageSizeOptions}
                    showItemsPerPageSelector={true}
                    showAllOption={false}
                    showFirstPage={true}
                    showLastPage={true}
                    showMoreButton={false}
                    hidePaginationIfOnePage={false}
                    textBetweenButtons={this.pageNumberText}
                    onChangeItemsPerPage={this.props.onPageSizeChange}
                    previousPageDisabled={isFirstPage}
                    nextPageDisabled={isLastPage}
                    firstPageDisabled={isFirstPage}
                    lastPageDisabled={isLastPage}
                    onFirstPageClick={() => this.props.onPageChange(0)}
                    onPreviousPageClick={() =>
                        this.props.onPageChange(
                            Math.max(0, this.props.currentPage - 1)
                        )
                    }
                    onNextPageClick={() =>
                        this.props.onPageChange(
                            Math.min(
                                this.totalPages - 1,
                                this.props.currentPage + 1
                            )
                        )
                    }
                    onLastPageClick={() =>
                        this.props.onPageChange(this.totalPages - 1)
                    }
                />
            </ButtonToolbar>
        );
    }

    public render() {
        return (
            <div
                className="lazy-mobx-table"
                data-test={this.props.testId || 'ServerDrivenTable'}
            >
                {this.renderTopToolbar()}
                <div style={{ position: 'relative' }}>
                    {this.props.isLoading && (
                        <div
                            style={{
                                position: 'absolute',
                                inset: 0,
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
                    <table className="table table-striped">
                        <thead>
                            <tr>{this.renderHeaders()}</tr>
                        </thead>
                        <tbody>{this.renderRows()}</tbody>
                    </table>
                </div>
                {this.renderPagination()}
            </div>
        );
    }
}
