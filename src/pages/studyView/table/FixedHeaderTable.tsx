import * as React from "react";
import {Column, LazyMobXTableStore, SortDirection} from "../../../shared/components/lazyMobXTable/LazyMobXTable";
import {
    Column as RVColumn,
    SortDirection as RVSortDirection,
    Table as RVTable,
    TableCellProps,
    TableHeaderProps
} from 'react-virtualized';
import 'react-virtualized/styles.css';
import {action, observable} from "mobx";
import styles from "./tables.module.scss";
import studyViewStyles from "pages/studyView/styles.module.scss";
import * as _ from 'lodash';
import {observer} from "mobx-react";
import classnames from 'classnames';
import {If} from 'react-if';
import autobind from 'autobind-decorator';
import {inputBoxChangeTimeoutEvent} from "../../../shared/lib/EventUtils";
import DefaultTooltip from "../../../shared/components/defaultTooltip/DefaultTooltip";

export type IFixedHeaderTableProps<T> = {
    columns: Column<T>[],
    data: T[];
    sortBy?: string;
    width?: number;
    height?: number;
    showSelectSamples?: boolean;
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

    componentWillReceiveProps() {
        this.updateDataStore();
    }

    get storeProps() {
        return {
            columns: this.props.columns,
            data: this.props.data,
            initialSortColumn: this._sortBy,
            initialSortDirection: this._sortDirection
        };
    }

    updateDataStore() {
        this._store.setProps(this.storeProps);
    }

    initDataStore() {
        this._store = new LazyMobXTableStore<T>(this.storeProps);
    }

    @autobind
    rowClassName({index}: any) {
        if (index > -1 && this.isSelectedRow(this._store.dataStore.sortedFilteredData[index])) {
            return classnames(styles.row, styles.highlightedRow);
        } else if (index < 0) {
            return styles.headerRow;
        } else {
            return classnames(styles.row, index % 2 === 0 ? styles.evenRow : styles.oddRow);
        }
    }

    @autobind
    rowGetter({index}: any) {
        return this._store.dataStore.sortedFilteredData[index];
    }

    @autobind
    getColumn(columnKey: string) {
        return _.keyBy(this.props.columns, column => column.name)[columnKey];
    }

    @autobind
    @action
    sort({sortBy}: any) {
        this._store.defaultHeaderClick(this.getColumn(sortBy));
        this._sortBy = sortBy;
        this._sortDirection = this._store.dataStore.sortAscending ? 'asc' as 'asc' : 'desc' as 'desc';
    }

    @autobind
    @action
    onFilterTextChange() {
        return inputBoxChangeTimeoutEvent((filterValue) => {
            this._store.setFilterString(filterValue);
        }, 400);
    }

    @autobind
    afterSelectingRows() {
        if (_.isFunction(this.props.afterSelectingRows)) {
            this.props.afterSelectingRows();
        }
    }

    @autobind
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
                            return <RVColumn key={column.name} label={column.name} dataKey={column.name}
                                             width={Number(column.width)}
                                             headerRenderer={(props: TableHeaderProps) => {
                                                 let label;
                                                 if (column.headerRender) {
                                                     label = column.headerRender(column.name);
                                                 } else {
                                                     label = (<span>{column.name}</span>);
                                                 }

                                                 if (column.tooltip) {
                                                     return (
                                                         <DefaultTooltip placement="top" overlay={column.tooltip}>
                                                             {label}
                                                         </DefaultTooltip>
                                                     );
                                                 } else {
                                                     return label;
                                                 }
                                             }}
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
                        <button className={classnames("btn btn-primary btn-sm", studyViewStyles.studyViewBtn)} onClick={this.afterSelectingRows}>Select Samples</button>
                    </If>
                </div>
            </div>
        );
    }
}