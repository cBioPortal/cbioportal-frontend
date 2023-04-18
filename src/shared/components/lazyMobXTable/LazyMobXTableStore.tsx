import { action, computed, makeObservable, observable, reaction } from 'mobx';
import {
    ILazyMobXTableApplicationDataStore,
    SimpleLazyMobXTableApplicationDataStore,
} from 'shared/lib/ILazyMobXTableApplicationDataStore';
import * as React from 'react';
import { ILazyMobXTableApplicationLazyDownloadDataFetcher } from 'shared/lib/ILazyMobXTableApplicationLazyDownloadDataFetcher';
import {
    DefaultTooltip,
    resolveColumnVisibility,
    resolveColumnVisibilityByColumnDefinition,
} from 'cbioportal-frontend-commons';
import { SortMetric } from 'shared/lib/ISortMetric';
import $ from 'jquery';
import ColumnResizer from 'react-column-resizer';
import { IColumnVisibilityDef } from 'shared/components/columnVisibilityControls/ColumnVisibilityControls';
import { SHOW_ALL_PAGE_SIZE as PAGINATION_SHOW_ALL } from 'shared/components/paginationControls/PaginationControls';
import {
    Column,
    getAsList,
    getDownloadObject,
    LazyMobXTableProps,
    SortDirection,
} from 'shared/components/lazyMobXTable/LazyMobXTable';
import { maxPage } from './utils';

export class LazyMobXTableStore<T> {
    @computed get filterString() {
        return this.dataStore.filterString;
    }

    set filterString(filterString: string) {
        this.dataStore.filterString = filterString;
    }
    @observable.ref private _itemsLabel: string | undefined = undefined;
    @observable.ref private _itemsLabelPlural: string | undefined;
    @observable.ref public columns: Column<T>[];
    @observable public dataStore: ILazyMobXTableApplicationDataStore<T>;
    @observable public headerRefs: React.RefObject<any>[];
    @observable public downloadDataFetcher:
        | ILazyMobXTableApplicationLazyDownloadDataFetcher<T>
        | undefined;
    @observable private onRowClick: ((d: T) => void) | undefined;
    @observable private onRowMouseEnter: ((d: T) => void) | undefined;
    @observable private onRowMouseLeave: ((d: T) => void) | undefined;

    // this observable is intended to always refer to props.columnToHeaderFilterIconModal
    @observable private _columnToHeaderFilterIconModal:
        | ((column: Column<T>) => JSX.Element | undefined)
        | undefined;
    // this observable is intended to always refer to props.columnVisibility
    // except possibly once "Reset columns" has been clicked
    @observable private _columnVisibility:
        | { [columnId: string]: boolean }
        | undefined;
    // this one keeps the state of the latest action (latest user selection)
    @observable private _columnVisibilityOverride:
        | { [columnId: string]: boolean }
        | undefined;

    @computed get initialFilterTextSet() {
        return this.dataStore.initialFilterTextSet;
    }

    set initialFilterTextSet(initialFilterTextSet: boolean) {
        this.dataStore.initialFilterTextSet = initialFilterTextSet;
    }

    @computed public get itemsPerPage() {
        return this.dataStore.itemsPerPage;
    }

    @computed public get moreItemsPerPage() {
        return this.dataStore.moreItemsPerPage;
    }

    @action
    public showMore(itemsPerPage: number) {
        this.dataStore.moreItemsPerPage = itemsPerPage;
    }

    public set itemsPerPage(i: number) {
        this.dataStore.itemsPerPage = i;
        this.page = this.page; // trigger clamping in page setter
    }

    @computed get firstHighlightedRowIndex() {
        let index = -1;
        for (let i = 0; i < this.displayData.length; i++) {
            if (this.dataStore.isHighlighted(this.displayData[i])) {
                index = i;
                break;
            }
        }
        return index;
    }

    @computed get displayData(): T[] {
        return this.dataStore.tableData;
    }

    @computed get showingAllRows(): boolean {
        return (
            this.dataStore.totalItems <= this.itemsPerPage ||
            this.itemsPerPage === -1
        );
    }

    @computed public get page() {
        return this.dataStore.page;
    }

    public set page(p: number) {
        this.dataStore.page = p;
    }

    @computed public get sortColumn() {
        return this.dataStore.sortColumn;
    }

    public set sortColumn(sortColumn: string | undefined) {
        this.dataStore.sortColumn = sortColumn;
    }

    @computed public get sortAscending(): boolean {
        return this.dataStore.sortAscending;
    }

    public set sortAscending(sortAscending: boolean) {
        this.dataStore.sortAscending = sortAscending;
    }

    private clampPage(p: number) {
        p = Math.max(p, 0);
        p = Math.min(p, this.maxPage);
        return p;
    }

    @computed get maxPage() {
        return maxPage(this.dataStore.totalItems, this.itemsPerPage);
    }

    @computed public get columnVisibility() {
        return resolveColumnVisibility(
            this.columnVisibilityByColumnDefinition,
            this._columnVisibility,
            this._columnVisibilityOverride
        );
    }

    @computed public get columnVisibilityByColumnDefinition() {
        return resolveColumnVisibilityByColumnDefinition(this.columns);
    }

    @computed public get showResetColumnsButton() {
        return (
            JSON.stringify(this.columnVisibility) !==
            JSON.stringify(this.columnVisibilityByColumnDefinition)
        );
    }

    @computed public get downloadData() {
        const tableDownloadData: string[][] = [];

        // add header (including hidden columns)
        tableDownloadData[0] = this.columns
            .filter(c => c.download)
            .map(c => (c.headerDownload ? c.headerDownload(c.name) : c.name));

        // add rows (including hidden columns). The purpose of this part is to ensure that
        // if any element of rowData contains a column with multiple values, rowData is written as
        // multiple rows in tableDownloadData
        this.dataStore.sortedDownloadedData.forEach((rowData: T) => {
            // retrieve all the download information for each row and store it in an object,
            // and calculate the maxColLength (max number of elements found in a column).
            let downloadObject = getDownloadObject(this.columns, rowData);
            // normalize the length of all columns based on the maxColLength (so that every column contains the
            // same number of elements)
            const rowDownloadData: string[][] = getAsList(
                downloadObject.data,
                downloadObject.maxColLength
            );

            //rowDownloadData is list of lists, containing all the elements per column.
            //processedRowsDownloadData becomes the transposed of rowDownloadData.
            let processedRowsDownloadData = rowDownloadData[0].map(function(
                row: string,
                i: number
            ) {
                return rowDownloadData.map(function(col) {
                    return col[i];
                });
            });
            //Writing the transposed list to tableDownloadData to build the final table.
            processedRowsDownloadData.forEach(
                (processedRowDownloadData: string[]) => {
                    tableDownloadData.push(processedRowDownloadData);
                }
            );
        });
        return tableDownloadData;
    }

    @computed get sortColumnObject(): Column<T> | undefined {
        return this.columns.find(
            (col: Column<T>) => col.name === this.sortColumn
        );
    }

    @computed get visibleData(): T[] {
        return this.dataStore.visibleData;
    }

    private getNextSortAscending(clickedColumn: Column<T>) {
        if (this.sortColumn === clickedColumn.name) {
            // if current sort column is clicked column, simply toggle
            return !this.sortAscending;
        } else {
            // otherwise, use columns initial sort direction, or default ascending
            const sortDirection: SortDirection =
                clickedColumn.defaultSortDirection || 'asc';
            return sortDirection === 'asc';
        }
    }

    @computed get sortMetric(): SortMetric<T> {
        const sortColumnObject = this.sortColumnObject;
        if (sortColumnObject && sortColumnObject.sortBy) {
            return sortColumnObject.sortBy;
        } else {
            return () => 0;
        }
    }

    @action
    public defaultHeaderClick(column: Column<T>) {
        this.sortAscending = this.getNextSortAscending(column);
        this.dataStore.sortAscending = this.sortAscending;

        this.sortColumn = column.name;
        this.dataStore.sortMetric = this.sortMetric;
        this.dataStore.sortParam = column.sortParam;
        this.page = 0;
    }

    @computed
    get headers(): JSX.Element[] {
        return this.visibleColumns.map((column: Column<T>, index: number) => {
            const headerProps: {
                role?: 'button';
                className?: 'sort-asc' | 'sort-des';
                onClick?: (e: React.MouseEvent) => void;
            } = {};
            if (column.sortBy) {
                headerProps.role = 'button';
                headerProps.onClick = (e: React.MouseEvent) => {
                    const target = e.target as HTMLElement;
                    // Click of rc-tooltip in the header element bubbles the
                    // on-click event, even though it is not a child of the
                    // header cell in the DOM. The check below make sure the
                    // click event originated from a true child in the DOM.
                    const parent = $(target).closest('.multilineHeader');
                    if (parent && parent.length > 0) {
                        this.defaultHeaderClick(column);
                    }
                };
            }

            let sortIcon = null;
            if (this.sortColumn === column.name) {
                if (this.sortAscending) {
                    headerProps.className = 'sort-asc';
                    sortIcon = (
                        <i
                            className={
                                'fa fa-sort-asc lazyMobxTableSortArrowAsc'
                            }
                        />
                    );
                } else {
                    headerProps.className = 'sort-des';
                    sortIcon = (
                        <i
                            className={
                                'fa fa-sort-desc lazyMobxTableSortArrowDesc'
                            }
                        />
                    );
                }
            }

            let label;
            if (column.headerRender) {
                label = column.headerRender(column.name);
            } else {
                label = <span>{column.name}</span>;
            }
            let thContents;

            if (column.tooltip) {
                thContents = (
                    <DefaultTooltip placement="top" overlay={column.tooltip}>
                        {label}
                    </DefaultTooltip>
                );
            } else {
                thContents = label;
            }

            thContents = (
                <span {...headerProps}>
                    {thContents}
                    {sortIcon}
                </span>
            );

            if (
                this._columnToHeaderFilterIconModal &&
                this._columnToHeaderFilterIconModal(column)
            ) {
                const alignToJustify = {
                    left: 'flex-start',
                    center: 'center',
                    right: 'flex-end',
                };
                thContents = (
                    <div
                        style={{
                            display: 'flex',
                            justifyContent: column.align
                                ? alignToJustify[column.align]
                                : 'flex-start',
                        }}
                    >
                        {thContents}
                        {this._columnToHeaderFilterIconModal(column)}
                    </div>
                );
            }

            let style: any = {};
            if (column.align) {
                style.textAlign = column.align;
            }
            if (column.width) {
                style.width = column.width;
            }

            return (
                <React.Fragment key={index}>
                    <th
                        ref={this.headerRefs[index]}
                        className="multilineHeader"
                        style={style}
                    >
                        {thContents}
                    </th>
                    {column.resizable && (
                        <ColumnResizer
                            className="multilineHeader columnResizer"
                            minWidth={0}
                        />
                    )}
                </React.Fragment>
            );
        });
    }

    @computed get visibleColumns(): Column<T>[] {
        return this.columns.filter(column => this.isVisible(column));
    }

    @computed get colVisProp(): IColumnVisibilityDef[] {
        const colVisProp: IColumnVisibilityDef[] = [];

        this.columns.forEach((column: Column<T>) => {
            colVisProp.push({
                id: column.hasOwnProperty('id') ? column.id! : column.name,
                name: column.name,
                visible: this.isVisible(column),
                togglable: column.hasOwnProperty('togglable')
                    ? column.togglable
                    : true,
            });
        });

        return colVisProp;
    }

    @computed get paginationStatusText(): string {
        let firstVisibleItemDisp;
        let lastVisibleItemDisp;

        if (this.rows.length === 0) {
            firstVisibleItemDisp = 0;
            lastVisibleItemDisp = 0;
        } else {
            firstVisibleItemDisp =
                this.itemsPerPage === PAGINATION_SHOW_ALL
                    ? 1
                    : this.page * this.itemsPerPage + 1;

            const currentPageSize =
                this.dataStore.moreItemsPerPage || this.dataStore.itemsPerPage;
            lastVisibleItemDisp =
                this.itemsPerPage === PAGINATION_SHOW_ALL
                    ? this.dataStore.totalItems
                    : firstVisibleItemDisp + currentPageSize - 1;
        }

        let itemsLabel: string = this.itemsLabel;
        if (itemsLabel.length) {
            // we need to prepend the space here instead of within the actual return value
            // to avoid unnecessary white-space at the end of the string
            itemsLabel = ` ${itemsLabel}`;
        }

        return `Showing ${firstVisibleItemDisp}-${lastVisibleItemDisp} of ${this.dataStore.totalItems}${itemsLabel}`;
    }

    @computed get tds(): JSX.Element[][] {
        return this.visibleData.map((datum: T, rowIndex: number) => {
            return this.visibleColumns.map((column: Column<T>) => {
                const cellProps: any = {
                    key: column.name,
                };

                if (column.resizable && column.truncateOnResize) {
                    cellProps.className = 'lazyMobXTableTruncatedCell';
                }

                const result = (
                    <td {...cellProps}>{column.render(datum, rowIndex)}</td>
                );

                if (column.resizable) {
                    return (
                        <React.Fragment>
                            {result}
                            <ColumnResizer
                                className="columnResizer"
                                minWidth={0}
                            />
                        </React.Fragment>
                    );
                }
                return result;
            });
        });
    }

    @computed get rows(): JSX.Element[] {
        // We separate this so that highlighting isn't such a costly operation
        const ret = [];
        for (let i = 0; i < this.visibleData.length; i++) {
            const rowProps: any = {};
            const rowIsHighlighted = this.dataStore.isHighlighted(
                this.visibleData[i]
            );
            const classNames = [];
            if (rowIsHighlighted) {
                classNames.push('highlighted');
            }
            if (this.onRowClick) {
                classNames.push('clickable');

                const onRowClick = this.onRowClick; // by the time its called this might be undefined again, so need to save ref
                rowProps.onClick = () => {
                    onRowClick(this.visibleData[i]);
                };
            }
            if (this.onRowMouseEnter) {
                const onRowMouseEnter = this.onRowMouseEnter; // by the time its called this might be undefined again, so need to save ref
                rowProps.onMouseEnter = () => {
                    onRowMouseEnter!(this.visibleData[i]);
                };
            }
            if (this.onRowMouseLeave) {
                const onRowMouseLeave = this.onRowMouseLeave; // by the time its called this might be undefined again, so need to save ref
                rowProps.onMouseLeave = () => {
                    onRowMouseLeave!(this.visibleData[i]);
                };
            }
            if (classNames.length) {
                rowProps.className = classNames.join(' ');
            }
            ret.push(
                <tr key={i} {...rowProps}>
                    {this.tds[i]}
                </tr>
            );
        }
        return ret;
    }

    @action pageToRowIndex(index: number) {
        this.page = Math.floor(index / this.itemsPerPage);
    }

    @action setFilterString(str: string) {
        if (str === this.dataStore.filterString) {
            return;
        }
        // we need to keep the filter string value in this store as well as in the data store,
        // because data store gets reset each time the component receives props.
        this.dataStore.filterString = str;
        this.dataStore.page = 0;
        this.dataStore.setFilter(
            (
                d: T,
                filterString: string,
                filterStringUpper: string,
                filterStringLower: string
            ) => {
                if (!filterString) {
                    return true; // dont filter if no input
                }
                let match = false;
                for (const column of this.visibleColumns) {
                    match =
                        (column.filter &&
                            column.filter(
                                d,
                                filterString,
                                filterStringUpper,
                                filterStringLower
                            )) ||
                        false;
                    if (match) {
                        break;
                    }
                }
                return match;
            }
        );
    }

    @computed get itemsLabel() {
        if (this._itemsLabel) {
            // use itemsLabel for plural in case no itemsLabelPlural provided
            if (!this._itemsLabelPlural || this.displayData.length === 1) {
                return this._itemsLabel;
            } else {
                return this._itemsLabelPlural;
            }
        } else {
            return '';
        }
    }

    @action initDataStore(props: LazyMobXTableProps<T>) {
        if (props.dataStore) {
            this.dataStore = props.dataStore;
        } else {
            this.dataStore = new SimpleLazyMobXTableApplicationDataStore<T>(
                props.data || []
            );
        }
    }

    @action setProps(props: LazyMobXTableProps<T>) {
        this.columns = props.columns;
        this._itemsLabel = props.itemsLabel;
        this._itemsLabelPlural = props.itemsLabelPlural;
        this._columnVisibility = props.columnVisibility;
        this.downloadDataFetcher = props.downloadDataFetcher;
        this.onRowClick = props.onRowClick;
        this.onRowMouseEnter = props.onRowMouseEnter;
        this.onRowMouseLeave = props.onRowMouseLeave;

        if (this.dataStore.page === undefined) {
            this.dataStore.page = 0;
        }
        if (this.itemsPerPage === undefined) {
            this.itemsPerPage = props.initialItemsPerPage || 50;
        }
        // even if dataStore passed in, we need to initialize sort props if undefined
        // otherwise we lose the functionality of 'initialSortColumn' and 'initialSortDirection' props
        if (this.dataStore.sortAscending === undefined) {
            this.dataStore.sortAscending = this.sortAscending;
        } else {
            // inherit the current state if defined
            this.sortAscending = this.dataStore.sortAscending;
        }

        if (this.dataStore.sortMetric === undefined) {
            this.dataStore.sortMetric = this.sortMetric;
        }

        // we would like to keep the previous filter if it exists
        // this is only a problem if table is managing its own data store
        // if not, then the filter state is managed by parent and does not need
        // to be persisted here
        // NOTE: this is very confusing and should be remedied by a refactor
        if (!props.dataStore && this.filterString) {
            this.setFilterString(this.filterString);
        }
    }

    @action updateColumnVisibility(id: string, visible: boolean) {
        // no previous action, need to init
        if (this._columnVisibilityOverride === undefined) {
            this._columnVisibilityOverride = resolveColumnVisibility(
                this.columnVisibilityByColumnDefinition,
                this._columnVisibility
            );
        }

        // update visibility
        if (this._columnVisibilityOverride[id] !== undefined) {
            this._columnVisibilityOverride[id] = visible;
        }
    }

    @action.bound
    resetColumnVisibility() {
        this._columnVisibility = undefined;
        this._columnVisibilityOverride = undefined;
    }

    public isVisible(column: Column<T>): boolean {
        const index = column.hasOwnProperty('id') ? column.id! : column.name;
        return this.columnVisibility[index] || false;
    }

    constructor(lazyMobXTableProps: LazyMobXTableProps<T>) {
        makeObservable(this);
        this.initDataStore(lazyMobXTableProps);
        if (this.sortColumn === undefined) {
            this.sortColumn = lazyMobXTableProps.initialSortColumn || '';
        }
        if (this.sortAscending === undefined) {
            this.sortAscending =
                lazyMobXTableProps.initialSortDirection !== 'desc'; // default ascending
        }
        this.headerRefs = lazyMobXTableProps.columns.map(x =>
            React.createRef()
        );
        this._columnToHeaderFilterIconModal =
            lazyMobXTableProps.columnToHeaderFilterIconModal;
        this.setProps(lazyMobXTableProps);

        // TODO: reuse?
        // reaction(
        //     () => this.dataStore.totalItems,
        //     () => {
        //         this.page = this.clampPage(
        //             this.page
        //         ); /* update for possibly reduced maxPage */
        //     }
        // );
    }
}
