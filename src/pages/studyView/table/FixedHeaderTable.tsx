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
import {action, computed, observable} from "mobx";
import styles from "./tables.module.scss";
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
    sortDirection?: SortDirection;
    width?: number;
    height?: number;
    showSelectSamples?: boolean;
    afterSelectingRows?: () => void;
    showControls?: boolean;
    // used only when showControlsAtTop === true (show controls at bottom otherwise)
    showControlsAtTop?: boolean;
    showAddRemoveAllButtons?: boolean;
    addAll?: (data: T[]) => void;
    removeAll?: (data: T[]) => void;
    showSelectableNumber?: boolean;
    isSelectedRow?: (data: T) => boolean;
    autoFocusSearchAfterRendering?:boolean;
    afterSorting?: (sortBy: string, sortDirection: SortDirection) => void;
};

const RVSDTtoStrType = {
    ['desc' as SortDirection]: RVSortDirection.DESC,
    ['asc' as SortDirection]: RVSortDirection.ASC
};

@observer
export default class FixedHeaderTable<T> extends React.Component<IFixedHeaderTableProps<T>, {}> {
    private _store: LazyMobXTableStore<T>;
    inputElement:HTMLSpanElement;

    @observable private _sortBy: string;
    @observable private _sortDirection: SortDirection;

    public static defaultProps = {
        showControls: true,
        showControlsAtTop: false,
        showSelectSamples: false,
        showAddRemoveAllButtons: false,
        autoFocusSearchAfterRendering: false,
        width: 398,
        height: 350,
        showSelectableNumber: false,
        sortBy: ''
    };

    constructor(props: IFixedHeaderTableProps<T>) {
        super(props);
        this._sortBy = props.sortBy!;
        const sortByColumn = _.find(this.props.columns, column => column.name === this._sortBy);
        this._sortDirection = props.sortDirection === undefined ? (_.isUndefined(sortByColumn) ? 'desc' as 'desc' : sortByColumn.defaultSortDirection || 'desc' as 'desc') : props.sortDirection;

        this.initDataStore();
    }

    componentWillReceiveProps(nextProps: any) {
        this.updateDataStore(nextProps);
    }

    updateDataStore(nextProps: any) {
        this._store.setProps({
            columns: nextProps.columns,
            data: nextProps.data,
            initialSortColumn: this._sortBy,
            initialSortDirection: this._sortDirection
        });
    }

    initDataStore() {
        this._store = new LazyMobXTableStore<T>({
            columns: this.props.columns,
            data: this.props.data,
            initialSortColumn: this._sortBy,
            initialSortDirection: this._sortDirection
        });
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
        if (this.props.afterSorting) {
            this.props.afterSorting(this._sortBy, this._sortDirection);
        }
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

    @autobind
    onAddAll() {
        if (this.props.addAll) {
            this.props.addAll(this._store.dataStore.sortedFilteredData);
        }
    }

    @autobind
    onRemoveAll() {
        if (this.props.removeAll) {
            this.props.removeAll(this._store.dataStore.sortedFilteredData);
        }
    }

    @computed
    get columnHeaders() {
        return this.props.columns.map(column => {
            return (props: TableHeaderProps) => {
                let label = [];

                if (column.headerRender) {
                    label.push(column.headerRender(column.name));
                } else {
                    label.push(<span key={column.name}>{column.name}</span>);
                }

                if (column.name === this._sortBy) {
                    label.push(<i
                        className={classnames(styles.headerSortingIcon, 'fa', this._sortDirection === 'desc' ? 'fa-sort-desc' : 'fa-sort-asc')}></i>);
                }

                const content = <div style={{display: 'flex'}}>{label}</div>
                if (column.tooltip) {
                    return (
                        <DefaultTooltip placement="top" overlay={column.tooltip}>
                            {content}
                        </DefaultTooltip>
                    );
                } else {
                    return content;
                }
            };
        });
    }

    @autobind
    setInputRef(el: any ) {
        this.inputElement = el;
    }

    componentDidMount(): void {
        if (this.props.autoFocusSearchAfterRendering) {
            this.inputElement.focus();
        }
    }

    getControls() {
        return <div className={classnames(styles.controls)}>
            {!this.props.showControlsAtTop &&
            <input placeholder={"Search..."} type="text" onInput={this.onFilterTextChange()}
                   className={classnames('form-control', styles.tableSearchInput)}/>}
            <If condition={this.props.showAddRemoveAllButtons}>
                <div className={"btn-group"} role={"group"}>
                    {this.props.addAll && (
                        <button className="btn btn-default btn-xs" onClick={this.onAddAll} data-test="fixed-header-table-add-all">
                        {`Select all${this.props.showSelectableNumber ? ` (${this._store.dataStore.sortedFilteredData.length})` : ''}`}
                        </button>
                    )}
                    {this.props.removeAll && (
                        <button className="btn btn-default btn-xs"
                                data-test="fixed-header-table-remove-all"
                                onClick={this.onRemoveAll}>Deselect all</button>
                    )}
                </div>
            </If>

            <If condition={this.props.showSelectSamples}>
                <button className={classnames("btn btn-primary btn-xs", styles.controlsBtn)}
                        data-test="fixed-header-table-select-sample"
                        onClick={this.afterSelectingRows}>Select Sample
                </button>
            </If>
            {this.props.showControlsAtTop &&
            <input placeholder={"Search..."} type="text" onInput={this.onFilterTextChange()}
                   ref={this.setInputRef}
                   data-test="fixed-header-table-search-input"
                   className={classnames('form-control', styles.tableSearchInput)}/>}
        </div>
    }

    public render() {
        return (
            <div className={styles.studyViewTablesTable}>
                {this.props.showControlsAtTop && this.getControls()}
                <RVTable
                    width={this.props.width!}
                    height={this.props.height!}
                    headerHeight={25}
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
                        this.props.columns.map((column, index) => {
                            return <RVColumn key={column.name} label={column.name} dataKey={column.name}
                                             width={Number(column.width)}
                                             className={styles.columnCell}
                                             headerRenderer={this.columnHeaders[index]}
                                             cellRenderer={(props: TableCellProps) => {
                                                 return column.render(props.rowData);
                                             }}/>;
                        })
                    }
                </RVTable>
                {!this.props.showControlsAtTop && this.getControls()}
            </div>
        );
    }
}