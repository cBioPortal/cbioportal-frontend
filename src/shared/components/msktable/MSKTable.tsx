import SimpleTable from "../simpleTable/SimpleTable";
import * as React from 'react';
import {observable, computed, action} from "mobx";
import {observer} from "mobx-react";
import './styles.scss';
import {PaginationControls} from "../paginationControls/PaginationControls";
import DefaultTooltip from "../DefaultTooltip";

export type Column<T> = {
    name: string;
    filter?:(data:T, filterString:string)=>boolean;
    sort?:(a:T, b:T, ascending:boolean)=>number;
    render:(data:T)=>JSX.Element;
    tooltip?:JSX.Element;
};

type MSKTableProps<T> = {
    columns:Column<T>[];
    data:T[];
};

class MSKTableStore<T> {
    @observable public filterString:string;
    @observable private _page:number;
    @observable public itemsPerPage:number;
    @observable public sortColumn:string;
    @observable public sortAscending:boolean;
    @observable public columns:Column<T>[];
    @observable.ref public data:T[];

    @computed public get page() {
        return this._page;
    }
    public set page(p:number) {
        this._page = p;
    }

    @computed get sortedFilteredData():T[] {
        let filtered:T[];
        if (this.filterString) {
            filtered = this.data.filter((datum:T)=>{
                let match = false;
                for (const column of this.columns) {
                    match = (column.filter && column.filter(datum, this.filterString)) || false;
                    if (match) {
                        break;
                    }
                }
                return match;
            });
        } else {
            filtered = this.data.slice(); // force mobx to recognize change
        }
        const column = this.columns.find((col:Column<T>)=>col.name === this.sortColumn);
        if (column && column.sort) {
            const cmp = (a:T, b:T) => column.sort!(a,b,this.sortAscending);
            return filtered.sort(cmp);
        } else {
            return filtered;
        }
    }
    @computed get visibleData():T[] {
        return this.sortedFilteredData.slice(this.page*this.itemsPerPage, (this.page+1)*this.itemsPerPage);
    }

    @computed get headers():JSX.Element[] {
        return this.columns.map((column:Column<T>)=>{
            const headerProps:{role?:"button",
                className?:"sort-asc"|"sort-des",
                onClick?:()=>void} = {};
            if (column.sort) {
                headerProps.role = "button";
                headerProps.onClick = ()=>{
                    this.sortAscending = (this.sortColumn === column.name ? !this.sortAscending : true);
                    this.sortColumn = column.name;
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
    @computed get rows():JSX.Element[] {
        return this.visibleData.map((datum:T)=>{
                const tds = this.columns.map((column:Column<T>)=>{
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
    }

    constructor() {
        this.page = 0;
        this.itemsPerPage = 50;
    }
}

@observer
export default class MSKTable<T> extends React.Component<MSKTableProps<T>, {}> {
    private store:MSKTableStore<T>;

    constructor(props:MSKTableProps<T>) {
        super(props);
        this.store = new MSKTableStore<T>();
        this.store.setProps(props);
    }

    @action componentWillReceiveProps(nextProps:MSKTableProps<T>) {
        this.store.setProps(nextProps);
    }

    render() {
        return (<div>
            <PaginationControls
                currentPage={this.store.page}
                previousButtonContent={<span>Prev</span>}
                nextButtonContent={<span>Next</span>}
                textBetweenButtons={"Page "+this.store.page}
                onPreviousPageClick={()=>{this.store.page -= 1}}
                onNextPageClick={()=>{this.store.page += 1}}
            />
            <SimpleTable
                    headers={this.store.headers}
                    rows={this.store.rows}
                />
        </div>);
    }
}