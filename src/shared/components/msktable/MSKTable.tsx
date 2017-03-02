import SimpleTable from "../simpleTable/SimpleTable";
import * as React from 'react';
import {observable, computed, action} from "mobx";
import {observer} from "mobx-react";
import './styles.scss';

export type Column<T> = {
    name: string;
    filter?:(data:T, filterString:string)=>boolean;
    sort?:(a:T, b:T)=>number;
    render:(data:T)=>JSX.Element;
};

type MSKTableProps<T> = {
    columns:Column<T>[];
    data:T[];
};

class MSKTableStore<T> {
    @observable public filterString:string;
    @observable public page:number;
    @observable public itemsPerPage:number;
    @observable public sortColumn:string;
    @observable public sortAscending:boolean;
    @observable public columns:Column<T>[];
    @observable.ref public data:T[];
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
            let cmp = column.sort;
            if (!this.sortAscending) {
                cmp = (a:T, b:T)=>-1*column.sort!(a,b);
            }
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
            return (
                <th {...headerProps}>
                    <span>{column.name}</span>
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
        return (<SimpleTable
                    headers={this.store.headers}
                    rows={this.store.rows}
                />);
    }
}