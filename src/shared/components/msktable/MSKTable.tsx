import SimpleTable from "../simpleTable/SimpleTable";
import * as React from 'react';
import {observable, computed, action} from "mobx";
import {observer} from "mobx-react";
import './styles.scss';
import {SHOW_ALL_PAGE_SIZE as PAGINATION_SHOW_ALL, PaginationControls} from "../paginationControls/PaginationControls";
import {ColumnVisibilityControls, IColumnVisibilityDef} from "../columnVisibilityControls/ColumnVisibilityControls";
import {CopyDownloadControls} from "../copyDownloadControls/CopyDownloadControls";
import {serializeData} from "shared/lib/Serializer";
import DefaultTooltip from "../DefaultTooltip";
import {ButtonToolbar} from "react-bootstrap";
import * as _ from "lodash";
import { If } from 'react-if';

export type Column<T> = {
    name: string;
    filter?:(data:T, filterString:string, filterStringUpper?:string, filterStringLower?:string)=>boolean;
    visible?:boolean;
    sortBy?:((data:T)=>(number|null)) | ((data:T)=>(string|null)) | ((data:T)=>(number|null)[]) | ((data:T)=>(string|null)[]);
    render:(data:T)=>JSX.Element;
    download?:(data:T)=>string;
    tooltip?:JSX.Element;
};

type MSKTableProps<T> = {
    columns:Column<T>[];
    data:T[];
    initialSortColumn?: string;
    initialSortDirection?: 'asc'|'desc';
    initialItemsPerPage?:number;
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

type SortMetric<T> = ((d:T)=>number|null) | ((d:T)=>(number|null)[]) | ((d:T)=>string|null) | ((d:T)=>(string|null)[]);
export function mskTableSort<T>(data:T[], metric:SortMetric<T>, ascending:boolean = true):T[] {
    // Separating this for testing, so that classes can test their comparators
    //  against how the table will sort.
    const dataAndValue:{data:T, sortBy:any[]}[] = [];

    for (let i=0; i<data.length; i++) {
        // Have to do this loop instead of using data.map because we need dataAndValue to be mutable,
        //  and Immutable.js makes .map return another immutable structure;
        const d = data[i];
        dataAndValue.push({
            data:d,
            sortBy:([] as any[]).concat(metric(d)) // ensure it's wrapped in an array, even if metric is number or string
        });
    };
    dataAndValue.sort((a,b)=>{
        return compareLists(a.sortBy, b.sortBy, ascending);
    });
    return dataAndValue.map(x=>x.data);
}

class MSKTableStore<T> {
    @observable public filterString:string;
    @observable private _page:number;
    @observable private _itemsPerPage:number;
    @observable public sortColumn:string;
    @observable public sortAscending:boolean;
    @observable.ref public columns:Column<T>[];
    @observable private _columnVisibility:{[columnId: string]: boolean};
    @observable.ref public data:T[];

    @computed public get itemsPerPage() {
        return this._itemsPerPage;
    }

    public set itemsPerPage(i:number) {
        this._itemsPerPage = i;
        this.page = this.page; // trigger clamping in page setter
    }

    @computed get showingAllRows(): Boolean {
        return this.sortedFilteredData.length <= this.itemsPerPage || this.itemsPerPage === -1
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
            return Math.floor(this.sortedFilteredData.length / this.itemsPerPage);
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
        this.data.forEach((rowData:T) => {
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

    @computed get sortedData():T[] {
        let ret = this.data;
        const column = this.sortColumnObject;
        if (column && column.sortBy) {
            ret = mskTableSort(ret, column.sortBy, this.sortAscending);
        }
        return ret;
    }

    @computed get sortedFilteredData():T[] {
        let filtered:T[] = this.sortedData;
        if (this.filterString) {
            filtered = filtered.filter((datum:T)=>{
                let match = false;
                for (const column of this.visibleColumns) {
                    match = (column.filter && column.filter(datum, this.filterString, this.filterStringUpper, this.filterStringLower)) || false;
                    if (match) {
                        break;
                    }
                }
                return match;
            });
        }
        return filtered;
    }
    @computed get visibleData():T[] {
        if (this.itemsPerPage === PAGINATION_SHOW_ALL) {
            return this.sortedFilteredData;
        } else {
            return this.sortedFilteredData.slice(this.page*this.itemsPerPage, (this.page+1)*this.itemsPerPage);
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
                    this.sortAscending = (this.sortColumn === column.name ? !this.sortAscending : true);
                    this.sortColumn = column.name;
                    this.page = 0;
                };
            }
            if (this.sortColumn === column.name) {
                headerProps.className = (this.sortAscending ? "sort-asc" : "sort-des");
            }
            const label = (<span>{column.name}</span>);
            let thContents;
            if (column.tooltip) {
                thContents = (<DefaultTooltip placement="top" overlay={column.tooltip}>
                    {label}
                </DefaultTooltip>);
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
    public get rows():JSX.Element[] {
        return this.visibleData.map((datum:T)=>{
                const tds = this.visibleColumns.map((column:Column<T>)=>{
                    return (<td key={column.name}>
                        {column.render(datum)}
                    </td>);
                });
                return (
                    <tr>
                        {tds}
                    </tr>
                );
            });
    }

    @action setProps(props:MSKTableProps<T>) {
        this.columns = props.columns;
        this.data = props.data;
        this._columnVisibility = this.resolveColumnVisibility(props.columns);
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

    constructor(mskTableProps:MSKTableProps<T>) {
        this.setProps(mskTableProps);
        this.filterString = "";
        this.sortColumn = mskTableProps.initialSortColumn || "";
        this.sortAscending = (mskTableProps.initialSortDirection !== "desc"); // default ascending
        this._page = 0;
        this.itemsPerPage = mskTableProps.initialItemsPerPage || 50;
    }
}

@observer
export default class MSKTable<T> extends React.Component<MSKTableProps<T>, {}> {
    private store:MSKTableStore<T>;
    private handlers:{[fnName:string]:(...args:any[])=>void};

    /**
     * Generates column visibility definition array for ColumnVisibilityControls
     * by using the columnVisibility value of the store.
     *
     * @returns {IColumnVisibilityDef[]}
     */
    @computed get colVisProp(): IColumnVisibilityDef[]
    {
        const colVisProp: IColumnVisibilityDef[] = [];

        this.store.columns.forEach((column:Column<T>) => {
            colVisProp.push({
                id: column.name,
                name: column.name,
                visible: this.store.columnVisibility[column.name]
            });
        });

        return colVisProp;
    }

    public getDownloadData(): string
    {
        return serializeData(this.store.downloadData);
    }

    constructor(props:MSKTableProps<T>) {
        super(props);
        this.store = new MSKTableStore<T>(props);

        this.handlers = {
            filterInput: (() => {
                let searchTimeout:number|null = null;
                return (evt:any)=>{
                    if (searchTimeout !== null) {
                        window.clearTimeout(searchTimeout);
                        searchTimeout = null;
                    }

                    const filterValue = evt.currentTarget.value;
                    searchTimeout = window.setTimeout(()=>{
                        this.store.filterString = filterValue;
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
            }
        };
        this.getDownloadData = this.getDownloadData.bind(this);
    }

    @action componentWillReceiveProps(nextProps:MSKTableProps<T>) {
        this.store.setProps(nextProps);
    }

    buildPaginationControls(className:string | undefined, style: {[k:string]:string | number}, textBetweenButtons:string ): JSX.Element {
        return <PaginationControls
            className={className}
            itemsPerPage={this.store.itemsPerPage}
            currentPage={this.store.page}
            onChangeItemsPerPage={this.handlers.changeItemsPerPage}
            onPreviousPageClick={this.handlers.decPage}
            onNextPageClick={this.handlers.incPage}
            textBetweenButtons={textBetweenButtons}
            previousPageDisabled={this.store.page === 0}
            style={style}
            nextPageDisabled={this.store.page === this.store.maxPage}
        />
    }

    render() {
        let firstVisibleItemDisp;
        let lastVisibleItemDisp;
        if (this.store.rows.length === 0) {
            firstVisibleItemDisp = 0;
            lastVisibleItemDisp = 0;
        } else {
            firstVisibleItemDisp = (this.store.itemsPerPage === PAGINATION_SHOW_ALL ? 1 : (this.store.page*this.store.itemsPerPage) + 1);
            lastVisibleItemDisp = (this.store.itemsPerPage === PAGINATION_SHOW_ALL ? this.store.rows.length : firstVisibleItemDisp + this.store.rows.length - 1);
        }
        const textBetweenButtons = `${firstVisibleItemDisp}-${lastVisibleItemDisp} of ${this.store.sortedFilteredData.length}`;
        return (<div>
            <ButtonToolbar style={{marginLeft:0}}>
                <div className={`form-group has-feedback input-group-sm`} style={{ display:'inline-block' }}>
                    <input type="text" onInput={this.handlers.filterInput} className="form-control tableSearchInput" style={{ width:200 }}  />
                    <span className="fa fa-search form-control-feedback" aria-hidden="true"></span>
                </div>
                { this.buildPaginationControls('pull-right topPagination', {marginLeft:5}, textBetweenButtons) }
                <ColumnVisibilityControls
                    className="pull-right"
                    columnVisibility={this.colVisProp}
                    onColumnToggled={this.handlers.visibilityToggle}
                />
                <CopyDownloadControls
                    className="pull-right"
                    downloadData={this.getDownloadData}
                    downloadFilename="table.csv"
                />
            </ButtonToolbar>
            <SimpleTable
                headers={this.store.headers}
                rows={this.store.rows}
            />

            <If condition={this.store.showingAllRows === false}>
            <ButtonToolbar style={{marginLeft:0}} className='text-center'>
                { this.buildPaginationControls('bottomPagination', {display:'inline-block'}, textBetweenButtons) }
            </ButtonToolbar>
            </If>

        </div>);
    }
}