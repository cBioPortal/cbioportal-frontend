import SimpleTable from "../simpleTable/SimpleTable";
import * as React from 'react';
import {observable, computed, action, reaction, IReactionDisposer} from "mobx";
import {observer, Observer} from "mobx-react";
import './styles.scss';
import {
    SHOW_ALL_PAGE_SIZE as PAGINATION_SHOW_ALL, PaginationControls, IPaginationControlsProps
} from "../paginationControls/PaginationControls";
import {
    ColumnVisibilityControls, IColumnVisibilityDef, IColumnVisibilityControlsProps
} from "../columnVisibilityControls/ColumnVisibilityControls";
import {CopyDownloadControls, ICopyDownloadControlsProps} from "../copyDownloadControls/CopyDownloadControls";
import {serializeData} from "shared/lib/Serializer";
import DefaultTooltip from "../defaultTooltip/DefaultTooltip";
import {ButtonToolbar} from "react-bootstrap";
import { If } from 'react-if';
import {SortMetric} from "../../lib/ISortMetric";
import {IMobXApplicationDataStore, SimpleMobXApplicationDataStore} from "../../lib/IMobXApplicationDataStore";

export type SortDirection = 'asc' | 'desc';

export type Column<T> = {
    name: string;
    headerRender?:(name:string)=>JSX.Element;
    filter?:(data:T, filterString:string, filterStringUpper?:string, filterStringLower?:string)=>boolean;
    visible?:boolean;
    sortBy?:((data:T)=>(number|null)) | ((data:T)=>(string|null)) | ((data:T)=>(number|null)[]) | ((data:T)=>(string|null)[]);
    render:(data:T)=>JSX.Element;
    download?:(data:T)=>string;
    tooltip?:JSX.Element;
    defaultSortDirection?:SortDirection;
    togglable?:boolean;
};

type LazyMobXTableProps<T> = {
    className?:string;
    columns:Column<T>[];
    data?:T[];
    dataStore?:IMobXApplicationDataStore<T>;
    initialSortColumn?: string;
    initialSortDirection?:SortDirection;
    initialItemsPerPage?:number;
    itemsLabel?:string;
    itemsLabelPlural?:string;
    showFilter?:boolean;
    showCopyDownload?:boolean;
    copyDownloadProps?:ICopyDownloadControlsProps;
    showPagination?:boolean;
    paginationProps?:IPaginationControlsProps;
    showColumnVisibility?:boolean;
    columnVisibilityProps?:IColumnVisibilityControlsProps;
    highlightColor?:"yellow"|"bluegray";
    pageToHighlight?:boolean;
};

function compareValues<U extends number|string>(a:U|null, b:U|null, asc:boolean):number {
    let ret:number = 0;
    if (a !== b) {
        if (a === null) {
            // a sorted to end
            ret = 1;
        } else if (b === null) {
            // b sorted to end
            ret = -1;
        } else {
            // neither are null
            if (typeof a === "number") {
                // sort numbers
                if (a < b) {
                    ret = (asc ? -1 : 1);
                } else {
                    // we know a !== b here so this case is a > b
                    ret = (asc ? 1 : -1);
                }
            } else if (typeof a === "string") {
                // sort strings
                ret = (asc ? 1 : -1)*((a as string).localeCompare(b as string));
            }
        }
    }
    return ret;
}
function compareLists<U extends number|string>(a:(U|null)[], b:(U|null)[], asc:boolean):number {
    let ret = 0;
    const loopLength = Math.min(a.length, b.length);
    for (let i=0; i<loopLength; i++) {
        ret = compareValues(a[i], b[i], asc);
        if (ret !== 0) {
            break;
        }
    }
    if (ret === 0) {
        if (a.length < b.length) {
            ret = (asc ? -1 : 1);
        } else if (a.length > b.length) {
            ret = (asc ? 1 : -1);
        }
    }
    return ret;
}

export function lazyMobXTableSort<T>(data:T[], metric:SortMetric<T>, ascending:boolean = true):T[] {
    // Separating this for testing, so that classes can test their comparators
    //  against how the table will sort.
    const dataAndValue:{data:T, initialPosition:number, sortBy:any[]}[] = [];

    for (let i=0; i<data.length; i++) {
        // Have to do this loop instead of using data.map because we need dataAndValue to be mutable,
        //  and Immutable.js makes .map return another immutable structure;
        const d = data[i];
        dataAndValue.push({
            data:d,
            initialPosition: i, // for stable sorting
            sortBy:([] as any[]).concat(metric(d)) // ensure it's wrapped in an array, even if metric is number or string
        });
    };
    let cmp:number, initialPositionA:number, initialPositionB:number;
    dataAndValue.sort((a,b)=>{
         cmp = compareLists(a.sortBy, b.sortBy, ascending);
         if (cmp === 0) {
             // stable sort
             initialPositionA = a.initialPosition;
             initialPositionB = b.initialPosition;
             if (initialPositionA < initialPositionB) {
                 cmp = -1;
             } else {
                 cmp = 1;
             }
         }
         return cmp;
    });
    return dataAndValue.map(x=>x.data);
}

class LazyMobXTableStore<T> {
    @observable public filterString:string;
    @observable private _page:number;
    @observable private _itemsPerPage:number;
    @observable private _itemsLabel:string|undefined;
    @observable private _itemsLabelPlural:string|undefined;
    @observable public sortColumn:string;
    @observable public sortAscending:boolean;
    @observable.ref public columns:Column<T>[];
    @observable private _columnVisibility:{[columnId: string]: boolean};
    @observable public dataStore:IMobXApplicationDataStore<T>;
    @observable private highlightColor:string;

    @computed public get itemsPerPage() {
        return this._itemsPerPage;
    }

    public set itemsPerPage(i:number) {
        this._itemsPerPage = i;
        this.page = this.page; // trigger clamping in page setter
    }

    @computed get firstHighlightedRowIndex() {
        let index = -1;
        for (let i=0; i<this.displayData.length; i++) {
            if (this.dataStore.isHighlighted(this.displayData[i])) {
                index = i;
                break;
            }
        }
        return index;
    }

    @computed get displayData():T[] {
        return this.dataStore.tableData;
    }

    @computed get showingAllRows(): boolean {
        return this.displayData.length <= this.itemsPerPage || this.itemsPerPage === -1
    }

    @computed public get page() {
        return this._page;
    }
    public set page(p:number) {
        this._page = this.clampPage(p);
    }

    private clampPage(p:number) {
        p = Math.max(p, 0);
        p = Math.min(p, this.maxPage);
        return p;
    }

    @computed get maxPage() {
        if (this.itemsPerPage === PAGINATION_SHOW_ALL) {
            return 0;
        } else {
            return Math.floor(this.displayData.length / this.itemsPerPage);
        }
    }

    @computed get filterStringUpper() {
        return this.filterString.toUpperCase();
    }

    @computed get filterStringLower() {
        return this.filterString.toLowerCase();
    }

    @computed public get columnVisibility() {
        return this._columnVisibility;
    }

    @computed public get downloadData()
    {
        const tableDownloadData:string[][] = [];

        // add header (including hidden columns)
        tableDownloadData[0] = [];
        this.columns.forEach((column:Column<T>) => {
            tableDownloadData[0].push(column.name);
        });

        // add rows (including hidden columns)
        this.dataStore.sortedData.forEach((rowData:T) => {
            const rowDownloadData:string[] = [];

            this.columns.forEach((column:Column<T>) => {
                if (column.download) {
                    rowDownloadData.push(column.download(rowData));
                }
                else {
                    rowDownloadData.push("");
                }
            });

            tableDownloadData.push(rowDownloadData);
        });

        return tableDownloadData;
    }

    @computed get sortColumnObject():Column<T>|undefined {
        return this.columns.find((col:Column<T>)=>this.isVisible(col) && (col.name === this.sortColumn));
    }

    @computed get visibleData():T[] {
        if (this.itemsPerPage === PAGINATION_SHOW_ALL) {
            return this.displayData;
        } else {
            return this.displayData.slice(this.page*this.itemsPerPage, (this.page+1)*this.itemsPerPage);
        }
    }

    private getNextSortAscending(clickedColumn:Column<T>) {
        if (this.sortColumn === clickedColumn.name) {
            // if current sort column is clicked column, simply toggle
            return !this.sortAscending;
        } else {
            // otherwise, use columns initial sort direction, or default ascending
            const sortDirection:SortDirection = clickedColumn.defaultSortDirection || "asc";
            return (sortDirection === "asc");
        }
    }

    @computed get sortMetric():SortMetric<T> {
        const sortColumnObject = this.sortColumnObject;
        if (sortColumnObject && sortColumnObject.sortBy) {
            return sortColumnObject.sortBy;
        } else {
            return ()=>0;
        }
    }

    @computed get headers():JSX.Element[] {
        return this.visibleColumns.map((column:Column<T>)=>{
            const headerProps:{role?:"button",
                className?:"sort-asc"|"sort-des",
                onClick?:()=>void} = {};
            if (column.sortBy) {
                headerProps.role = "button";
                headerProps.onClick = ()=>{
                    this.sortAscending = this.getNextSortAscending(column);
                    this.dataStore.sortAscending = this.sortAscending;

                    this.sortColumn = column.name;
                    this.dataStore.sortMetric = this.sortMetric;

                    this.page = 0;
                };
            }
            if (this.sortColumn === column.name) {
                headerProps.className = (this.sortAscending ? "sort-asc" : "sort-des");
            }

            const label = column.headerRender ? column.headerRender(column.name) : (<span>{column.name}</span>);
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
            return (
                <th {...headerProps}>
                    {thContents}
                </th>
            );
        });
    }

    @computed get visibleColumns():Column<T>[] {
        return this.columns.filter(column=>this.isVisible(column));
    }

    @computed get colVisProp(): IColumnVisibilityDef[]
    {
        const colVisProp: IColumnVisibilityDef[] = [];

        this.columns.forEach((column:Column<T>) => {
            colVisProp.push({
                id: column.name,
                name: column.name,
                visible: this.columnVisibility[column.name],
                togglable:(column.hasOwnProperty(('togglable')) ? column.togglable : true)
            });
        });

        return colVisProp;
    }

    @computed get paginationStatusText(): string
    {
        let firstVisibleItemDisp;
        let lastVisibleItemDisp;
        let itemsLabel:string = "";

        if (this.rows.length === 0) {
            firstVisibleItemDisp = 0;
            lastVisibleItemDisp = 0;
        } else {
            firstVisibleItemDisp = (
                this.itemsPerPage === PAGINATION_SHOW_ALL ?
                    1 : (this.page * this.itemsPerPage) + 1
            );

            lastVisibleItemDisp = (
                this.itemsPerPage === PAGINATION_SHOW_ALL ?
                    this.rows.length : firstVisibleItemDisp + this.rows.length - 1
            );
        }

        if (this._itemsLabel) {
            // use itemsLabel for plural in case no itemsLabelPlural provided
            if (!this._itemsLabelPlural || this.displayData.length === 1) {
                itemsLabel = this._itemsLabel;
            }
            else {
                itemsLabel = this._itemsLabelPlural;
            }

            // we need to prepend the space here instead of within the actual return value
            // to avoid unnecessary white-space at the end of the string
            itemsLabel = ` ${itemsLabel}`;
        }

        return `${firstVisibleItemDisp}-${lastVisibleItemDisp} of ${this.displayData.length}${itemsLabel}`;
    }

    @computed get tds():JSX.Element[][] {
        return this.visibleData.map((datum:T)=>{
            const _tds:JSX.Element[] = this.visibleColumns.map((column:Column<T>)=>{
                return (<td key={column.name}>
                    {column.render(datum)}
                </td>);
            });
            return _tds;
        });
    }

    @computed get highlightClassName() {
        if (this.highlightColor === "yellow") {
            return "highlight";
        } else if (this.highlightColor === "bluegray") {
            return "highlight-bluegray";
        }
    }

    @computed get rows():JSX.Element[] {
        // We separate this so that highlighting isn't such a costly operation
        const ret = [];
        for (let i=0; i<this.visibleData.length; i++) {
            const rowProps:any = {};
            if (this.dataStore.isHighlighted(this.visibleData[i])) {
                rowProps.className = this.highlightClassName;
            }
            ret.push(
                <tr key={i} {...rowProps}>
                    {this.tds[i]}
                </tr>
            );
        }
        return ret;
    }

    @action pageToRowIndex(index:number) {
        this.page = Math.floor(index / this.itemsPerPage);
    }

    @action setFilterString(str:string) {
        this.dataStore.filterString = str;
        this.page = 0;
        this.dataStore.setFilter((d:T, filterString:string, filterStringUpper:string, filterStringLower:string)=>{
            let match = false;
            for (const column of this.visibleColumns) {
                match = (column.filter && column.filter(d, filterString, filterStringUpper, filterStringLower)) || false;
                if (match) {
                    break;
                }
            }
            return match;
        });
    }

    @action setProps(props:LazyMobXTableProps<T>) {
        this.columns = props.columns;
        this._itemsLabel = props.itemsLabel;
        this._itemsLabelPlural = props.itemsLabelPlural;
        this._columnVisibility = this.resolveColumnVisibility(props.columns);
        this.highlightColor = props.highlightColor!;

        if (props.dataStore) {
            this.dataStore = props.dataStore;
        } else {
            this.dataStore = new SimpleMobXApplicationDataStore<T>(props.data || []);
        }

        // even if dataStore passed in, we need to initialize sort props if undefined
        // otherwise we lose the functionality of 'initialSortColumn' and 'initialSortDirection' props
        if (this.dataStore.sortAscending === undefined) {
            this.dataStore.sortAscending = this.sortAscending;
        }
        else {
            // inherit the current state if defined
            this.sortAscending = this.dataStore.sortAscending;
        }

        if (this.dataStore.sortMetric === undefined) {
            this.dataStore.sortMetric = this.sortMetric;
        }
    }

    @action public updateColumnVisibility(id:string, visible:boolean)
    {
        if (this._columnVisibility[id] !== undefined) {
            this._columnVisibility[id] = visible;
        }
    }

    public isVisible(column:Column<T>): boolean
    {
        return this.columnVisibility[column.name] || false;
    }

    resolveColumnVisibility(columns:Array<Column<T>>): {[columnId: string]: boolean}
    {
        const colVis:{[columnId: string]: boolean} = {};

        columns.forEach((column:Column<T>) => {
            // every column is visible by default unless it is flagged otherwise
            let visible:boolean = true;

            if (column.visible !== undefined) {
                visible = column.visible;
            }

            colVis[column.name] = visible;
        });

        return colVis;
    }

    constructor(lazyMobXTableProps:LazyMobXTableProps<T>) {
        this.filterString = "";
        this.sortColumn = lazyMobXTableProps.initialSortColumn || "";
        this.sortAscending = (lazyMobXTableProps.initialSortDirection !== "desc"); // default ascending
        this.setProps(lazyMobXTableProps);

        this._page = 0;
        this.itemsPerPage = lazyMobXTableProps.initialItemsPerPage || 50;
    }
}

@observer
export default class LazyMobXTable<T> extends React.Component<LazyMobXTableProps<T>, {}> {
    private store:LazyMobXTableStore<T>;
    private handlers:{[fnName:string]:(...args:any[])=>void};
    private filterInput:HTMLInputElement;
    private filterInputReaction:IReactionDisposer;
    private pageToHighlightReaction:IReactionDisposer;

    public static defaultProps = {
        showFilter: true,
        showCopyDownload: true,
        showPagination: true,
        showColumnVisibility: true,
        highlightColor: "yellow"
    };

    public getDownloadData(): string
    {
        return serializeData(this.store.downloadData);
    }

    constructor(props:LazyMobXTableProps<T>) {
        super(props);
        this.store = new LazyMobXTableStore<T>(props);

        this.handlers = {
            onFilterTextChange: (() => {
                let searchTimeout:number|null = null;
                return (evt:any)=>{
                    if (searchTimeout !== null) {
                        window.clearTimeout(searchTimeout);
                        searchTimeout = null;
                    }

                    const filterValue = evt.currentTarget.value;
                    searchTimeout = window.setTimeout(()=>{
                        this.store.setFilterString(filterValue);
                    }, 400);
                };
            })(),
            visibilityToggle:(columnId: string):void => {
                // ignore undefined columns
                if (this.store.columnVisibility[columnId] !== undefined) {
                    // toggle visibility
                    this.store.updateColumnVisibility(columnId, !this.store.columnVisibility[columnId]);
                }
            },
            changeItemsPerPage:(ipp:number)=>{
                this.store.itemsPerPage=ipp;
            },
            incPage:()=>{
                this.store.page += 1;
            },
            decPage:()=>{
                this.store.page -= 1;
            },
            filterInputRef: (input:HTMLInputElement)=>{
                this.filterInput = input;
            }
        };
        this.getDownloadData = this.getDownloadData.bind(this);
        this.getTopToolbar = this.getTopToolbar.bind(this);
        this.getBottomToolbar = this.getBottomToolbar.bind(this);
        this.getTable = this.getTable.bind(this);
        this.getPaginationControls = this.getPaginationControls.bind(this);
        this.filterInputReaction = reaction(
            ()=>this.store.dataStore.filterString,
            str=>{ this.filterInput && (this.filterInput.value = str); }
        );
        this.pageToHighlightReaction = reaction(
            ()=>this.store.firstHighlightedRowIndex,
            (index:number)=>{
                if (this.props.pageToHighlight) {
                    this.store.pageToRowIndex(this.store.firstHighlightedRowIndex);
                }
            }
        );
    }

    componentWillUnmount() {
        this.filterInputReaction();
        this.pageToHighlightReaction();
    }

    @action componentWillReceiveProps(nextProps:LazyMobXTableProps<T>) {
        this.store.setProps(nextProps);
    }

    private getPaginationControls() {
        if (this.props.showPagination) {
            return (
                <PaginationControls
                    className="text-center topPagination"
                    itemsPerPage={this.store.itemsPerPage}
                    currentPage={this.store.page}
                    onChangeItemsPerPage={this.handlers.changeItemsPerPage}
                    onPreviousPageClick={this.handlers.decPage}
                    onNextPageClick={this.handlers.incPage}
                    textBeforeButtons={this.store.paginationStatusText}
                    showMoreButton={true}
                    previousPageDisabled={this.store.page === 0}
                    nextPageDisabled={this.store.page === this.store.maxPage}
                    {...this.props.paginationProps}
                />
            );
        } else {
            return null;
        }
    }

    private getTopToolbar() {
        return (
            <ButtonToolbar style={{marginLeft:0}} className="tableMainToolbar">
                { this.props.showFilter ? (
                    <div className={`pull-right form-group has-feedback input-group-sm tableFilter`} style={{ display:'inline-block', marginLeft: 5}}>
                        <input ref={this.handlers.filterInputRef} type="text" onInput={this.handlers.onFilterTextChange} className="form-control tableSearchInput" style={{ width:200 }}  />
                        <span className="fa fa-search form-control-feedback" aria-hidden="true"></span>
                    </div>
                ) : ""}
                {this.props.showColumnVisibility ? (
					<ColumnVisibilityControls
						className="pull-right"
						columnVisibility={this.store.colVisProp}
						onColumnToggled={this.handlers.visibilityToggle}
						{...this.props.columnVisibilityProps}
					/>) : ""}
                {this.props.showCopyDownload ? (
                    <CopyDownloadControls
                        className="pull-right"
                        downloadData={this.getDownloadData}
                        downloadFilename="table.csv"
                        {...this.props.copyDownloadProps}
                    />) : ""}
            </ButtonToolbar>
        );
    }

    private getBottomToolbar() {
        return (
            <ButtonToolbar style={{marginLeft:0, float:'none'}} className="tableMainToolbar center">
                <Observer>
                    { this.getPaginationControls }
                </Observer>
            </ButtonToolbar>
        );
    }

    private getTable() {
        return (
            <SimpleTable
                headers={this.store.headers}
                rows={this.store.rows}
                className={this.props.className}
            />
        );
    }

    render() {
        return (
            <div>
                <Observer>
                    {this.getTopToolbar}
                </Observer>
                <Observer>
                    {this.getTable}
                </Observer>
                <Observer>
                    {this.getBottomToolbar}
                </Observer>
            </div>
        );
    }
}
