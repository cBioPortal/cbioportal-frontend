import SimpleTable from "../simpleTable/SimpleTable";
import * as React from 'react';
import {action, computed, IReactionDisposer, observable, reaction} from "mobx";
import {observer, Observer} from "mobx-react";
import './styles.scss';
import {
    IPaginationControlsProps,
    PaginationControls,
    SHOW_ALL_PAGE_SIZE as PAGINATION_SHOW_ALL
} from "../paginationControls/PaginationControls";
import {
    ColumnVisibilityControls,
    IColumnVisibilityControlsProps,
    IColumnVisibilityDef
} from "../columnVisibilityControls/ColumnVisibilityControls";
import {CopyDownloadControls, ICopyDownloadData} from "../copyDownloadControls/CopyDownloadControls";
import {resolveColumnVisibility, resolveColumnVisibilityByColumnDefinition} from "public-lib/lib/ColumnVisibilityResolver";
import {ICopyDownloadControlsProps} from "../copyDownloadControls/ICopyDownloadControls";
import {SimpleCopyDownloadControls} from "../copyDownloadControls/SimpleCopyDownloadControls";
import {serializeData} from "shared/lib/Serializer";
import DefaultTooltip from "public-lib/components/defaultTooltip/DefaultTooltip";
import {ButtonToolbar} from "react-bootstrap";
import ColumnResizer from "react-column-resizer";
import {SortMetric} from "../../lib/ISortMetric";
import {
    ILazyMobXTableApplicationDataStore,
    SimpleLazyMobXTableApplicationDataStore
} from "../../lib/ILazyMobXTableApplicationDataStore";
import {ILazyMobXTableApplicationLazyDownloadDataFetcher} from "../../lib/ILazyMobXTableApplicationLazyDownloadDataFetcher";
import {maxPage} from "./utils";
import {inputBoxChangeTimeoutEvent} from "../../lib/EventUtils";

export type SortDirection = 'asc' | 'desc';

export type Column<T> = {
    name: string;
    headerRender?:(name:string)=>JSX.Element;
    headerDownload?:(name:string)=>string;
    width?:string|number;
    align?:"left"|"center"|"right";
    filter?:(data:T, filterString:string, filterStringUpper?:string, filterStringLower?:string)=>boolean;
    visible?:boolean;
    sortBy?:((data:T)=>(number|null)) | ((data:T)=>(string|null)) | ((data:T)=>(number|null)[]) | ((data:T)=>(string|null)[]);
    render:(data:T)=>JSX.Element;
    download?:(data:T)=>string|string[];
    tooltip?:JSX.Element;
    defaultSortDirection?:SortDirection;
    togglable?:boolean;
    resizable?:boolean;
};

type LazyMobXTableProps<T> = {
    className?:string;
    columns:Column<T>[];
    data?:T[];
    dataStore?:ILazyMobXTableApplicationDataStore<T>;
    downloadDataFetcher?:ILazyMobXTableApplicationLazyDownloadDataFetcher;
    initialSortColumn?: string;
    initialSortDirection?:SortDirection;
    initialItemsPerPage?:number;
    itemsLabel?:string;
    itemsLabelPlural?:string;
    showFilter?:boolean;
    showCopyDownload?:boolean;
    copyDownloadProps?:ICopyDownloadControlsProps;
    showPagination?:boolean;
	// used only when showPagination === true (show pagination at bottom otherwise)
	showPaginationAtTop?:boolean;
    paginationProps?:IPaginationControlsProps;
    enableHorizontalScroll?:boolean;
    showColumnVisibility?:boolean;
    columnVisibilityProps?:IColumnVisibilityControlsProps;
    columnVisibility?: {[columnId: string]: boolean};
    pageToHighlight?:boolean;
    showCountHeader?:boolean;
    onRowClick?:(d:T)=>void;
    filterPlaceholder?:string;
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

function getListOfEmptyStrings<T>(maxColLength:number): string[] {
     return Array(maxColLength).join(".").split(".");
}

function getAsList<T>(data: Array<string|string[]>, maxColLength: number): string[][] {
    let returnList: string[][] = [];
    data.forEach((datum: string|string[]) => {
        if (datum instanceof Array) {
            if (maxColLength != datum.length) {
                throw new Error('Not all the arrays returned from the download functions are from the same length.');
            }
            returnList.push(datum);
        } else {
            let arr: string[] = [];
            for (var i=0; i<maxColLength; i++) {
                arr = arr.concat(datum);
            };
            returnList.push(arr);
        }
    })
    return returnList;
}


function getDownloadObject<T>(columns: Column<T>[], rowData: T) {
    let downloadObject: {data: Array<string[]|string>; maxColLength: number} = {data: [], maxColLength: 1};
    columns.forEach((column:Column<T>) => {
        if (column.download) {
            let downloadData = column.download(rowData);
            if (downloadData instanceof Array) {
                downloadObject.data.push(downloadData);
                if (downloadData.length > downloadObject.maxColLength) {
                    downloadObject.maxColLength = downloadData.length;
                }
            } else {
                downloadObject.data.push(downloadData);
            }
        } else {
            downloadObject.data.push("");
        }
    });
    return downloadObject;
}

export class LazyMobXTableStore<T> {
    public filterString:string|undefined;
    @observable private _itemsLabel:string|undefined;
    @observable private _itemsLabelPlural:string|undefined;
    @observable public sortColumn:string;
    @observable public sortAscending:boolean;
    @observable.ref public columns:Column<T>[];
    @observable public dataStore:ILazyMobXTableApplicationDataStore<T>;
    @observable public downloadDataFetcher:ILazyMobXTableApplicationLazyDownloadDataFetcher|undefined;
    @observable private onRowClick:((d:T)=>void)|undefined;

    // this observable is intended to always refer to props.columnVisibility
    @observable private _columnVisibility:{[columnId: string]: boolean}|undefined;
    // this one keeps the state of the latest action (latest user selection)
    @observable private _columnVisibilityOverride:{[columnId: string]: boolean}|undefined;

    @computed public get itemsPerPage() {
        return this.dataStore.itemsPerPage;
    }

    public set itemsPerPage(i:number) {
        this.dataStore.itemsPerPage = i;
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
        return this.dataStore.page;
    }
    public set page(p:number) {
        this.dataStore.page = this.clampPage(p);
    }

    private clampPage(p:number) {
        p = Math.max(p, 0);
        p = Math.min(p, this.maxPage);
        return p;
    }

    @computed get maxPage() {
        return maxPage(this.displayData.length, this.itemsPerPage);
    }

    @computed public get columnVisibility() {
        return resolveColumnVisibility(this.columnVisibilityByColumnDefinition,
            this._columnVisibility,
            this._columnVisibilityOverride);
    }

    @computed public get columnVisibilityByColumnDefinition() {
        return resolveColumnVisibilityByColumnDefinition(this.columns);
    }

    @computed public get downloadData()
    {
        const tableDownloadData:string[][] = [];

        // add header (including hidden columns)
        tableDownloadData[0] = [];
        this.columns.forEach((column:Column<T>) => {
            tableDownloadData[0].push(column.headerDownload ? column.headerDownload(column.name) : column.name);
        });

        // add rows (including hidden columns). The purpose of this part is to ensure that
        // if any element of rowData contains a column with multiple values, rowData is written as
        // multiple rows in tableDownloadData
        this.dataStore.sortedData.forEach((rowData:T) => {
            // retrieve all the download information for each row and store it in an object,
            // and calculate the maxColLength (max number of elements found in a column).
            let downloadObject = getDownloadObject(this.columns, rowData);
            // normalize the length of all columns based on the maxColLength (so that every column contains the
            // same number of elements)
            const rowDownloadData: string[][] = getAsList(downloadObject.data, downloadObject.maxColLength);

            //rowDownloadData is list of lists, containing all the elements per column.
            //processedRowsDownloadData becomes the transposed of rowDownloadData.
            let processedRowsDownloadData = rowDownloadData[0].map(function(row:string, i:number) {
              return rowDownloadData.map(function(col) {
                return col[i];
              })
            });
           //Writing the transposed list to tableDownloadData to build the final table.
           processedRowsDownloadData.forEach((processedRowDownloadData: string[]) => {
              tableDownloadData.push(processedRowDownloadData);
           });
        });
        return tableDownloadData;
    }

    @computed get sortColumnObject():Column<T>|undefined {
        return this.columns.find((col:Column<T>)=>this.isVisible(col) && (col.name === this.sortColumn));
    }

    @computed get visibleData():T[] {
        return this.dataStore.visibleData;
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

    @action
    public defaultHeaderClick(column: Column<T>) {
        this.sortAscending = this.getNextSortAscending(column);
        this.dataStore.sortAscending = this.sortAscending;

        this.sortColumn = column.name;
        this.dataStore.sortMetric = this.sortMetric;
        this.page = 0;
    }

    @computed
    get headers():JSX.Element[] {
        return this.visibleColumns.map((column:Column<T>, index:number)=>{
            const headerProps:{role?:"button",
                className?:"multilineHeader sort-asc"|"multilineHeader sort-des",
                onClick?:()=>void} = {};
            if (column.sortBy) {
                headerProps.role = "button";
                headerProps.onClick = () => this.defaultHeaderClick(column);
            }
            if (this.sortColumn === column.name) {
                headerProps.className = (this.sortAscending ? "multilineHeader sort-asc" : "multilineHeader sort-des");
            }

            let label;
            if (column.headerRender) {
                label = column.headerRender(column.name);
            } else {
                label = (<span>{column.name}</span>);
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
            let style:any = {};
            if (column.align) {
                style.textAlign = column.align;
            }
            if (column.width) {
                style.width = column.width;
            }

            return (
                <React.Fragment key={index}>
                    <th className='multilineHeader' {...headerProps} style={style}>
                        {thContents}
                    </th>
                    {column.resizable && <ColumnResizer className="multilineHeader columnResizer" minWidth={0} />}
                </React.Fragment>
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

        let itemsLabel:string = this.itemsLabel;
        if (itemsLabel.length) {
            // we need to prepend the space here instead of within the actual return value
            // to avoid unnecessary white-space at the end of the string
            itemsLabel = ` ${itemsLabel}`;
        }

        return `Showing ${firstVisibleItemDisp}-${lastVisibleItemDisp} of ${this.displayData.length}${itemsLabel}`;
    }

    @computed get tds():JSX.Element[][] {
        return this.visibleData.map((datum:T)=>{
            return this.visibleColumns.map((column:Column<T>)=>{
                const result = (<td key={column.name}>
                    {column.render(datum)}
                </td>);
                if (column.resizable) {
                    return (
                        <React.Fragment>
                            {result}
                            <ColumnResizer className='columnResizer' minWidth={0}/>
                        </React.Fragment>
                    )
                }
                return result;
            });
        });
    }

    @computed get rows():JSX.Element[] {
        // We separate this so that highlighting isn't such a costly operation
        const ret = [];
        for (let i=0; i<this.visibleData.length; i++) {
            const rowProps:any = {};
            const rowIsHighlighted = this.dataStore.isHighlighted(this.visibleData[i]);
            const classNames = [];
            if (rowIsHighlighted) {
                 classNames.push("highlighted");
            }
            if (this.onRowClick) {
                if (!rowIsHighlighted) {
                    classNames.push("clickable");
                }

                const onRowClick = this.onRowClick; // by the time its called this might be undefined again, so need to save ref
                rowProps.onClick = ()=>{
                    onRowClick(this.visibleData[i]);
                };
            }
            if (classNames.length) {
                rowProps.className = classNames.join(" ");
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
        // we need to keep the filter string value in this store as well as in the data store,
        // because data store gets reset each time the component receives props.
        this.filterString = str;
        this.dataStore.filterString = str;
        this.page = 0;
        this.dataStore.setFilter((d:T, filterString:string, filterStringUpper:string, filterStringLower:string)=>{
            if (!filterString) {
                return true; // dont filter if no input
            }
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

    @computed get itemsLabel() {
        if (this._itemsLabel) {
            // use itemsLabel for plural in case no itemsLabelPlural provided
            if (!this._itemsLabelPlural || this.displayData.length === 1) {
                return this._itemsLabel;
            }
            else {
                return this._itemsLabelPlural;
            }
        } else {
            return "";
        }
    }

    @action setProps(props:LazyMobXTableProps<T>) {
        this.columns = props.columns;
        this._itemsLabel = props.itemsLabel;
        this._itemsLabelPlural = props.itemsLabelPlural;
        this._columnVisibility = props.columnVisibility;
        this.downloadDataFetcher = props.downloadDataFetcher;
        this.onRowClick = props.onRowClick;

        if (props.dataStore) {
            this.dataStore = props.dataStore;
        } else {
            this.dataStore = new SimpleLazyMobXTableApplicationDataStore<T>(props.data || []);
        }
        if(this.dataStore.page === undefined) {
            this.dataStore.page = 0;
        }
        if(this.itemsPerPage === undefined) {
            this.itemsPerPage = props.initialItemsPerPage || 50;
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

        // we would like to keep the previous filter if it exists
        // this is only a problem if table is managing its own data store
        // if not, then the filter state is managed by parent and does not need
        // to be persisted here
        // NOTE: this is very confusing and should be remedied by a refactor
        if (!props.dataStore && this.filterString) {
            this.setFilterString(this.filterString);
        }
    }

    @action updateColumnVisibility(id:string, visible:boolean)
    {
        // no previous action, need to init
        if (this._columnVisibilityOverride === undefined) {
            this._columnVisibilityOverride = resolveColumnVisibility(
                this.columnVisibilityByColumnDefinition, this._columnVisibility);
        }

        // update visibility
        if (this._columnVisibilityOverride[id] !== undefined) {
            this._columnVisibilityOverride[id] = visible;
        }
    }

    public isVisible(column:Column<T>): boolean
    {
        return this.columnVisibility[column.name] || false;
    }

    constructor(lazyMobXTableProps:LazyMobXTableProps<T>) {
        this.sortColumn = lazyMobXTableProps.initialSortColumn || "";
        this.sortAscending = (lazyMobXTableProps.initialSortDirection !== "desc"); // default ascending
        this.setProps(lazyMobXTableProps);
        reaction(()=>this.displayData.length, ()=>{ this.page = this.clampPage(this.page); /* update for possibly reduced maxPage */});
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
		showPaginationAtTop: false,
        showCountHeader: false
    };

    public getDownloadData(): string
    {
        return serializeData(this.store.downloadData);
    }

    public getDownloadDataPromise(): Promise<ICopyDownloadData>
    {
        // returning a promise instead of a string allows us to prevent triggering fetchAndCacheAllLazyData
        // until the copy/download button is clicked.
        return new Promise<ICopyDownloadData>((resolve) => {
            // we need to download all the lazy data before initiating the download process.
            if (this.store.downloadDataFetcher) {
                // populate the cache instances with all available data for the lazy loaded columns
                this.store.downloadDataFetcher.fetchAndCacheAllLazyData().then(allLazyData => {
                    // we don't use allData directly,
                    // we rely on the data cached by the download data fetcher
                    resolve({
                        status: "complete",
                        text: this.getDownloadData()
                    });
                }).catch(() => {
                    // even if loading of all lazy data fails, resolve with partial data
                    resolve({
                        status: "incomplete",
                        text: this.getDownloadData()
                    });
                });
            }
            // no lazy data to preload, just return the current download data
            else {
                resolve({
                    status: "complete",
                    text: this.getDownloadData()
                });
            }
        });
    }

    protected updateColumnVisibility(id: string, visible: boolean)
    {
        // ignore undefined columns
        if (this.store.columnVisibility[id] !== undefined) {
            this.store.updateColumnVisibility(id, visible);
        }
    }

    constructor(props:LazyMobXTableProps<T>) {
        super(props);
        this.store = new LazyMobXTableStore<T>(props);

        this.handlers = {
            onFilterTextChange: (() => {
                return inputBoxChangeTimeoutEvent((filterValue) => {
                    this.store.setFilterString(filterValue);
                }, 400)
            })(),
            visibilityToggle:(columnId: string):void => {
                // toggle visibility
                this.updateColumnVisibility(columnId, !this.store.columnVisibility[columnId]);
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
        this.getDownloadDataPromise = this.getDownloadDataPromise.bind(this);
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
        //if (this.props.showPagination) {
			// default paginationProps
			let paginationProps:IPaginationControlsProps = {
				className:"text-center topPagination",
				itemsPerPage:this.store.itemsPerPage,
                totalItems:this.store.displayData.length,
				currentPage:this.store.page,
				onChangeItemsPerPage:this.handlers.changeItemsPerPage,
                showItemsPerPageSelector: false,
				onPreviousPageClick:this.handlers.decPage,
				onNextPageClick:this.handlers.incPage,
				previousPageDisabled:this.store.page === 0,
				nextPageDisabled:this.store.page === this.store.maxPage,
				textBeforeButtons:this.store.paginationStatusText,
                groupButtons: false,
                bsStyle:"primary"
			};
			// override with given paginationProps if they exist
			if (this.props.paginationProps) {
				// put status text between button if no show more button
				if (this.props.paginationProps.showMoreButton === false) {
					delete paginationProps['textBeforeButtons'];
					paginationProps['textBetweenButtons'] = this.store.paginationStatusText;
				}
				paginationProps = Object.assign(paginationProps, this.props.paginationProps)
			}
            return (
                <PaginationControls
                    {...paginationProps}
                />
            );
        // } else {
        //     return null;
        // }
    }

    private get countHeader() {
        return (
            <span data-test="LazyMobXTable_CountHeader" style={{float:"left", color:"black", fontSize: "16px", fontWeight: "bold"}}>
                {this.store.displayData.length} {this.store.itemsLabel} (page {this.store.page + 1} of {this.store.maxPage + 1})
            </span>
        );
    }

    private getTopToolbar() {
        return (<div>
            { this.props.showCountHeader && this.countHeader }
            <ButtonToolbar style={{marginLeft:0}} className="tableMainToolbar">
                { this.props.showFilter ? (
                    <div className={`pull-right form-group has-feedback input-group-sm tableFilter`} style={{ display:'inline-block', marginLeft: 5}}>
                        <input ref={this.handlers.filterInputRef} placeholder={this.props.filterPlaceholder || ""} type="text" onInput={this.handlers.onFilterTextChange} className="form-control tableSearchInput" style={{ width:200 }}  />
                        <span className="fa fa-search form-control-feedback" aria-hidden="true" style={{zIndex: 0}} />
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
                    ( this.props.downloadDataFetcher ?
                        <CopyDownloadControls
                            className="pull-right"
                            downloadData={this.getDownloadDataPromise}
                            downloadFilename="table.tsv"
                            {...this.props.copyDownloadProps}
                        /> :
                        <SimpleCopyDownloadControls
                            className="pull-right"
                            downloadData={this.getDownloadData}
                            downloadFilename="table.tsv"
                            controlsStyle="BUTTON"
                            {...this.props.copyDownloadProps}
                        />
                    )
                ) : ""}
                {this.props.showPagination && this.props.showPaginationAtTop ? (
                    <Observer>
                        { this.getPaginationControls }
                    </Observer>
                ) : null}
            </ButtonToolbar>
            </div>
        );
    }

    private getBottomToolbar() {
        return (
            <ButtonToolbar style={{marginLeft:0, float:'none'}} className="tableMainToolbar center">
                {(this.props.showPagination) && (
                    <Observer>
                        { this.getPaginationControls }
                    </Observer>
                )}
            </ButtonToolbar>
        );
    }

    private getTable() {
        return (
            <div style={{overflowX: this.props.enableHorizontalScroll ? "auto" : "visible"}}>
                <SimpleTable
                    headers={this.store.headers}
                    rows={this.store.rows}
                    className={this.props.className}
                />
            </div>
        );
    }

    render() {
        return (
            <div data-test="LazyMobXTable">
                <Observer>
                    {this.getTopToolbar}
                </Observer>
                <Observer>
                    {this.getTable}
                </Observer>
                {
                    (!this.props.showPaginationAtTop) && (
                        <Observer>
                            {this.getBottomToolbar}
                        </Observer>
                    )
                }
            </div>
        );
    }
}
