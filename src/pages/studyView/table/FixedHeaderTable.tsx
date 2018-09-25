import * as React from "react";
import {Column, LazyMobXTableStore, SortDirection} from "../../../shared/components/lazyMobXTable/LazyMobXTable";
import {
    Column as RVColumn,
    SortDirection as RVSortDirection,
    Table as RVTable,
    TableCellProps
} from 'react-virtualized';
import 'react-virtualized/styles.css';
import {action, observable} from "mobx";
import styles from "./tables.module.scss";
import * as _ from 'lodash';
import {observer} from "mobx-react";
import classnames from 'classnames';
import {If} from 'react-if';
import {bind} from "bind-decorator";
import {inputBoxChangeTimeoutEvent} from "../../../shared/lib/EventUtils";

export type IFixedHeaderTableProps<T> = {
    columns: Column<T>[],
    data: T[];
    sortBy?: string;
    width?: number;
    height?: number;
    // TODO: These properties are just used to force to rerender the table when selectedGenes is modified.
    // We don't actually use the property anywhere in the table.
    selectedGenes?: string[];
    selectedRows?: number[];
    showSelectSamples?: boolean;
    showCohortComparison?: boolean;
    afterSelectingRows?: () => void;
    isSelectedRow?: (data:T) => boolean;
};

const RVSDTtoStrType = {
    ['desc' as SortDirection]: RVSortDirection.DESC,
    ['asc' as SortDirection]: RVSortDirection.ASC
};

@observer
export default class FixedHeaderTable<T> extends React.Component<IFixedHeaderTableProps<T>, {}> {
    private _store: LazyMobXTableStore<T>;
    @observable private _sortBy: string;
    @observable private _sortDirection: SortDirection;

    public static defaultProps = {
        showSelectSamples: false,
        selectedRows: [],
        selectedGenes: [],
        width : 398,
        height: 350,
        sortBy: ''
    };

    constructor(props: IFixedHeaderTableProps<T>) {
        super(props);
        this._sortBy = props.sortBy!;
        const sortByColumn = _.find(this.props.columns, column => column.name === this._sortBy);
        this._sortDirection = _.isUndefined(sortByColumn) ? 'desc' as 'desc' : sortByColumn.defaultSortDirection || 'desc' as 'desc';

        this.initDataStore();
    }

    @action
    initDataStore() {
        this._store = new LazyMobXTableStore<T>({
            columns: this.props.columns,
            data: this.props.data,
            initialSortColumn: this._sortBy,
            initialSortDirection: this._sortDirection
        });
    }

    @bind
    rowClassName({index}: any) {
        if (index > -1 && this.isSelectedRow(this._store.dataStore.sortedFilteredData[index])) {
            return styles.highlightedRow;
        } else if (index < 0) {
            return styles.headerRow;
        } else {
            return index % 2 === 0 ? styles.evenRow : styles.oddRow;
        }
    }

    @bind
    rowGetter({index}: any) {
        return this._store.dataStore.sortedFilteredData[index];
    }

    @bind
    getColumn(columnKey: string) {
        return _.keyBy(this.props.columns, column => column.name)[columnKey];
    }

    @bind
    @action
    sort({sortBy}: any) {
        this._store.defaultHeaderClick(this.getColumn(sortBy));
        this._sortBy = sortBy;
        this._sortDirection = this._store.dataStore.sortAscending ? 'asc' as 'asc' : 'desc' as 'desc';
    }

    @bind
    @action
    onFilterTextChange() {
        return inputBoxChangeTimeoutEvent((filterValue) => {
            this._store.setFilterString(filterValue);
        }, 400);
    }

    @bind
    afterSelectingRows() {
        if (_.isFunction(this.props.afterSelectingRows)) {
            this.props.afterSelectingRows();
        }
    }

    @bind
    isSelectedRow(data: T) {
        if (_.isFunction(this.props.isSelectedRow)) {
            return this.props.isSelectedRow(data);
        } else {
            return false;
        }
    }

    public render() {
        return (
            <div className={styles.studyViewTablesTable}>
                <RVTable
                    width={this.props.width!}
                    height={this.props.height!}
                    headerHeight={20}
                    rowHeight={25}
                    rowCount={this._store.dataStore.sortedFilteredData.length}
                    rowGetter={this.rowGetter}
                    className={styles.studyViewTablesBody}
                    rowClassName={this.rowClassName}
                    headerClassName={styles.headerColumn}
                    sort={this.sort}
                    sortDirection={RVSDTtoStrType[this._sortDirection]}
                    sortBy={this._sortBy}
                >

                    {
                        this.props.columns.map(column => {
                            return <RVColumn key={column.name} label={column.name} dataKey={column.name} width={Number(column.width)}
                                             cellRenderer={(props: TableCellProps) => {
                                                 return column.render(props.rowData);
                                             }}/>;
                        })
                    }
                </RVTable>
                <div className={classnames(styles.bottomTools)}>
                    <input placeholder={"Search..."} type="text" onInput={this.onFilterTextChange()}
                           className={classnames('form-control', styles.tableSearchInput)}/>
                    <If condition={this.props.showSelectSamples}>
                        <button className={classnames("btn btn-primary btn-sm", styles.selectSamplesBtn)} onClick={this.afterSelectingRows}>Select Samples</button>
                    </If>
                    <If condition={this.props.showCohortComparison}>
                        <button className={classnames("btn btn-primary btn-sm", styles.selectSamplesBtn)} onClick={this.afterSelectingRows}>Compare Groups</button>
                    </If>
                </div>
            </div>
        );
    }
}