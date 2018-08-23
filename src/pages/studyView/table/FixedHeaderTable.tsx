import * as React from "react";
import {Column, LazyMobXTableStore} from "../../../shared/components/lazyMobXTable/LazyMobXTable";
import {
    Column as RVColumn,
    SortDirection as RVSortDirection,
    SortDirectionType as RVSortDirectionType,
    Table as RVTable,
    TableCellProps
} from 'react-virtualized';
import 'react-virtualized/styles.css';
import {action, observable} from "mobx";
import styles from "./tables.module.scss";
import * as _ from 'lodash';
import {observer} from "mobx-react";
import classnames from 'classnames';

export type IFixedHeaderTableProps<T> = {
    columns: Column<T>[],
    data: T[];
    sortBy?: string;
    width?: number;
    height?: number;
    // This property is just used to force to rerender the table when selectedGenes is modified.
    // We don't actually use the property anywhere in the table.
    selectedGenes?: string[]
};

@observer
export default class FixedHeaderTable<T> extends React.Component<IFixedHeaderTableProps<T>, {}> {
    private _store: LazyMobXTableStore<T>;
    @observable private _sortBy: string;
    @observable private _sortDirection: RVSortDirectionType;

    constructor(props: IFixedHeaderTableProps<T>) {
        super(props);
        this._rowGetter = this._rowGetter.bind(this);
        this._sort = this._sort.bind(this);
        this._getColumn = this._getColumn.bind(this);
        this._onFilterTextChange = this._onFilterTextChange.bind(this);
        this._sortBy = props.sortBy || 'Freq';
        this._sortDirection = RVSortDirection.DESC;

        this.initDataStore();
    }

    @action
    initDataStore() {
        this._store = new LazyMobXTableStore<T>({
            columns: this.props.columns,
            data: this.props.data
        });
    }


    static _rowClassName({index}: any) {
        if (index < 0) {
            return styles.headerRow;
        } else {
            return index % 2 === 0 ? styles.evenRow : styles.oddRow;
        }
    }

    _rowGetter({index}: any) {
        return this._store.dataStore.sortedFilteredData[index];
    }

    _getColumn(columnKey: string) {
        return _.keyBy(this.props.columns, column => column.name)[columnKey];
    }

    @action
    _sort({sortBy}: any) {
        this._store.defaultHeaderClick(this._getColumn(sortBy));
        this._sortBy = sortBy;
        this._sortDirection = this._store.dataStore.sortAscending ? RVSortDirection.ASC : RVSortDirection.DESC;
    }

    @action
    _onFilterTextChange() {
        let searchTimeout: number | null = null;
        return (evt: any) => {
            if (searchTimeout !== null) {
                window.clearTimeout(searchTimeout);
                searchTimeout = null;
            }

            const filterValue = evt.currentTarget.value;
            searchTimeout = window.setTimeout(() => {
                this._store.setFilterString(filterValue);
            }, 400);
        };
    }

    public render() {
        return (
            <div className={styles.studyViewTablesTable}>
                <RVTable
                    width={this.props.width || 398}
                    height={this.props.height || 350}
                    headerHeight={20}
                    rowHeight={25}
                    rowCount={this._store.dataStore.sortedFilteredData.length}
                    rowGetter={this._rowGetter}
                    className={styles.studyViewTablesBody}
                    rowClassName={FixedHeaderTable._rowClassName}
                    headerClassName={styles.headerColumn}
                    sort={this._sort}
                    sortDirection={this._sortDirection}
                    sortBy={this._sortBy}
                >

                    {
                        this.props.columns.map(column => {
                            return <RVColumn label={column.name} dataKey={column.name} width={Number(column.width)}
                                             cellRenderer={function (props: TableCellProps) {
                                                 return column.render(props.rowData);
                                             }.bind(this)}/>;
                        })
                    }
                </RVTable>
                <input placeholder={"Search..."} type="text" onInput={this._onFilterTextChange()}
                       className={classnames('form-control', styles.tableSearchInput)} style={{width: 200}}/>
            </div>
        );
    }
}