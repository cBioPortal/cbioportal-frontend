import * as React from 'react';
import {
    Column,
    LazyMobXTableStore,
    SortDirection,
    lazyMobXTableSort,
} from '../../../shared/components/lazyMobXTable/LazyMobXTable';
import {
    Column as RVColumn,
    SortDirection as RVSortDirection,
    Table as RVTable,
    TableCellProps,
    TableHeaderProps,
} from 'react-virtualized';
import 'react-virtualized/styles.css';
import { action, computed, observable, toJS, makeObservable } from 'mobx';
import styles from './tables.module.scss';
import * as _ from 'lodash';
import { Observer, observer } from 'mobx-react';
import classnames from 'classnames';
import { If } from 'react-if';
import autobind from 'autobind-decorator';
import { inputBoxChangeTimeoutEvent } from '../../../shared/lib/EventUtils';
import { DefaultTooltip } from 'cbioportal-frontend-commons';
import { SimpleGetterLazyMobXTableApplicationDataStore } from 'shared/lib/ILazyMobXTableApplicationDataStore';
import { SelectionOperatorEnum } from '../TableUtils';
import { DropdownButton, MenuItem } from 'react-bootstrap';

export type IFixedHeaderTableProps<T> = {
    columns: Column<T>[];
    fixedTopRowsData?: T[];
    data: T[];
    sortBy?: string;
    sortDirection?: SortDirection;
    defaultSelectionOperator?: SelectionOperatorEnum;
    width?: number;
    height?: number;
    headerHeight?: number;
    rowHeight?: number;
    numberOfSelectedRows: number;
    showSetOperationsButton?: boolean;
    afterSelectingRows?: () => void;
    toggleSelectionOperator?: () => void;
    // used only when showControlsAtTop === true (show controls at bottom otherwise)
    showControlsAtTop?: boolean;
    hideControls?: boolean;
    extraButtons?: {
        content: any;
        onClick: () => void;
        isDisabled: () => boolean;
    }[];
    showAddRemoveAllButton?: boolean;
    addAll?: (data: T[]) => void;
    removeAll?: (data: T[]) => void;
    showSelectableNumber?: boolean;
    isSelectedRow?: (data: T) => boolean;
    highlightedRowClassName?: (data: T) => string;
    autoFocusSearchAfterRendering?: boolean;
    afterSorting?: (sortBy: string, sortDirection: SortDirection) => void;
};

const RVSDTtoStrType = {
    ['desc' as SortDirection]: RVSortDirection.DESC,
    ['asc' as SortDirection]: RVSortDirection.ASC,
};

export class FixedHeaderTableDataStore extends SimpleGetterLazyMobXTableApplicationDataStore<
    any
> {
    constructor(getData: () => any[], fixedTopRowsData: any[]) {
        super(getData);
        makeObservable(this);
        this.fixedTopRowsData = fixedTopRowsData;
    }

    private fixedTopRowsData: any[];

    protected getSortedData = () => {
        // if not defined, use default values for sortMetric and sortAscending
        const sortMetric = this.sortMetric || (() => 0);
        const sortAscending =
            this.sortAscending !== undefined ? this.sortAscending : true;

        return [
            ...this.fixedTopRowsData,
            ...lazyMobXTableSort(this.allData, sortMetric, sortAscending),
        ];
    };
}

@observer
export default class FixedHeaderTable<T> extends React.Component<
    IFixedHeaderTableProps<T>,
    {}
> {
    private _store: LazyMobXTableStore<T>;
    inputElement: HTMLSpanElement;

    @observable.ref private _sortBy: string;
    @observable private _sortDirection: SortDirection;

    public static defaultProps = {
        showControlsAtTop: false,
        showAddRemoveAllButton: false,
        autoFocusSearchAfterRendering: false,
        width: 398,
        height: 350,
        headerHeight: 25,
        rowHeight: 25,
        showSelectableNumber: false,
        sortBy: '',
        numberOfSelectedRows: 0,
        hideControls: false,
    };

    constructor(props: IFixedHeaderTableProps<T>) {
        super(props);
        makeObservable(this);
        this._sortBy = props.sortBy!;
        const sortByColumn = _.find(
            this.props.columns,
            column => column.name === this._sortBy
        );
        this._sortDirection =
            props.sortDirection === undefined
                ? _.isUndefined(sortByColumn)
                    ? ('desc' as 'desc')
                    : sortByColumn.defaultSortDirection || ('desc' as 'desc')
                : props.sortDirection;

        this.initDataStore();
    }

    componentWillReceiveProps(nextProps: IFixedHeaderTableProps<T>) {
        this.updateDataStore(nextProps);
    }

    updateDataStore(nextProps: IFixedHeaderTableProps<T>) {
        const tableDataStore = new FixedHeaderTableDataStore(() => {
            return this.props.data;
        }, this.props.fixedTopRowsData || []);
        const filterString = toJS(this._store.filterString);
        this._store.setProps({
            columns: nextProps.columns,
            dataStore: tableDataStore,
            initialSortColumn: this._sortBy,
            initialSortDirection: this._sortDirection,
        });
        // From https://github.com/cBioPortal/cbioportal-frontend/blob/e88efa37d15f0a59cbe75c8239ffad7c9d45af76/src/shared/components/lazyMobXTable/LazyMobXTable.tsx#L704
        // Looks like filter on the table is cleared whenever table is managing its own data store.
        // To fix the issue set filter whenever a new tableDataStore is created
        if (filterString !== undefined) {
            this._store.setFilterString(filterString);
        }
    }

    initDataStore() {
        const tableDataStore = new FixedHeaderTableDataStore(() => {
            return this.props.data;
        }, this.props.fixedTopRowsData || []);
        this._store = new LazyMobXTableStore<T>({
            columns: this.props.columns,
            dataStore: tableDataStore,
            initialSortColumn: this._sortBy,
            initialSortDirection: this._sortDirection,
        });
    }

    @autobind
    rowClassName({ index }: any) {
        if (
            index > -1 &&
            this.isSelectedRow(this._store.dataStore.sortedFilteredData[index])
        ) {
            const classNames: string[] = [styles.row];
            if (this.props.highlightedRowClassName) {
                const className = this.props.highlightedRowClassName(
                    this._store.dataStore.sortedFilteredData[index]
                );
                classNames.push(className);
            } else {
                classNames.push(styles.highlightedRow);
            }
            return classnames(classNames);
        } else if (index < 0) {
            return styles.headerRow;
        } else {
            return classnames(
                styles.row,
                index % 2 === 0 ? styles.evenRow : styles.oddRow
            );
        }
    }

    @autobind
    rowGetter({ index }: any) {
        return this._store.dataStore.sortedFilteredData[index];
    }

    @autobind
    getColumn(columnKey: string) {
        return _.keyBy(this.props.columns, column => column.name)[columnKey];
    }

    @action.bound
    sort({ sortBy }: any) {
        this._store.defaultHeaderClick(this.getColumn(sortBy));
        this._sortBy = sortBy;
        this._sortDirection = this._store.dataStore.sortAscending
            ? ('asc' as 'asc')
            : ('desc' as 'desc');
        if (this.props.afterSorting) {
            this.props.afterSorting(this._sortBy, this._sortDirection);
        }
    }

    @action.bound
    onFilterTextChange() {
        return inputBoxChangeTimeoutEvent(filterValue => {
            this._store.setFilterString(filterValue);
        }, 400);
    }

    @action.bound
    afterSelectingRows() {
        if (this.props.afterSelectingRows) {
            this.props.afterSelectingRows();
        }
    }

    @action.bound
    changeSelectionType(selectionOperator?: SelectionOperatorEnum) {
        if (
            this.props.toggleSelectionOperator &&
            this.props.defaultSelectionOperator !== selectionOperator
        ) {
            this.props.toggleSelectionOperator();
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
                    label.push(
                        <i
                            className={classnames(
                                styles.headerSortingIcon,
                                'fa',
                                this._sortDirection === 'desc'
                                    ? 'fa-sort-desc'
                                    : 'fa-sort-asc'
                            )}
                        ></i>
                    );
                }

                const content = <div style={{ display: 'flex' }}>{label}</div>;
                if (column.tooltip) {
                    return (
                        <DefaultTooltip
                            placement="top"
                            overlay={column.tooltip}
                        >
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
    setInputRef(el: any) {
        this.inputElement = el;
    }

    componentDidMount(): void {
        if (
            !this.props.hideControls &&
            this.props.autoFocusSearchAfterRendering
        ) {
            this.inputElement.focus();
        }
    }

    private getSelectionOptions() {
        return Object.keys(SelectionOperatorEnum).map(selectionType => {
            const selectionOperation =
                SelectionOperatorEnum[
                    selectionType as keyof typeof SelectionOperatorEnum
                ];
            return (
                <MenuItem
                    onClick={() => this.changeSelectionType(selectionOperation)}
                    active={
                        this.props.defaultSelectionOperator === selectionType
                    }
                >
                    <DefaultTooltip
                        overlay={`${selectionOperation} of samples in the newly selected rows`}
                    >
                        <div>
                            {selectionOperation}{' '}
                            <i
                                className={
                                    (styles as any)[
                                        selectionOperation.toLowerCase()
                                    ]
                                }
                            ></i>
                        </div>
                    </DefaultTooltip>
                </MenuItem>
            );
        });
    }

    getAddRemoveAllButton() {
        const allSelected =
            this.props.numberOfSelectedRows === this.props.data.length;

        let dataTest: string, onClick: () => void, content: string;
        let showButton = false;

        if (allSelected && this.props.removeAll) {
            dataTest = 'fixed-header-table-remove-all';
            onClick = this.onRemoveAll;
            content = 'Deselect all';
            showButton = true;
        } else if (this.props.addAll) {
            dataTest = 'fixed-header-table-add-all';
            onClick = this.onAddAll;
            content = `Select all${
                this.props.showSelectableNumber
                    ? ` (${this._store.dataStore.sortedFilteredData.length})`
                    : ''
            }`;
            showButton = true;
        }

        if (showButton) {
            return (
                <button
                    className="btn btn-default btn-xs"
                    data-test={dataTest!}
                    onClick={onClick!}
                >
                    {content!}
                </button>
            );
        } else {
            return null;
        }
    }

    getControls() {
        return (
            <div
                className={classnames(styles.controls, {
                    [styles.controlsAtTop]: !!this.props.showControlsAtTop,
                })}
            >
                {!this.props.showControlsAtTop && (
                    <input
                        placeholder={'Search...'}
                        type="text"
                        onInput={this.onFilterTextChange()}
                        className={classnames(
                            'form-control',
                            styles.tableSearchInput
                        )}
                    />
                )}
                {this.props.showAddRemoveAllButton &&
                    this.getAddRemoveAllButton()}
                <If
                    condition={
                        this.props.showSetOperationsButton &&
                        this.props.numberOfSelectedRows > 0
                    }
                >
                    <div className="btn-group">
                        <button
                            className="btn btn-default btn-xs"
                            onClick={this.afterSelectingRows}
                        >
                            Select Samples{' '}
                            <If condition={this.props.numberOfSelectedRows > 1}>
                                <i
                                    style={{ marginTop: '-2px' }}
                                    className={
                                        this.props.defaultSelectionOperator ===
                                        SelectionOperatorEnum.INTERSECTION
                                            ? styles.intersection
                                            : styles.union
                                    }
                                ></i>
                            </If>
                        </button>

                        <If condition={this.props.numberOfSelectedRows > 1}>
                            <DropdownButton
                                bsSize="xsmall"
                                title={''}
                                id={`selectButton`}
                                pullRight={true}
                            >
                                {this.getSelectionOptions()}
                            </DropdownButton>
                        </If>
                    </div>
                </If>
                {this.props.extraButtons &&
                    this.props.extraButtons.map(btn => (
                        <button
                            className="btn btn-default btn-xs"
                            onClick={btn.onClick}
                            disabled={btn.isDisabled()}
                        >
                            {btn.content}
                        </button>
                    ))}
                {this.props.showControlsAtTop && (
                    <input
                        placeholder={'Search...'}
                        type="text"
                        onInput={this.onFilterTextChange()}
                        ref={this.setInputRef}
                        data-test="fixed-header-table-search-input"
                        className={classnames(
                            'form-control',
                            styles.tableSearchInput
                        )}
                    />
                )}
            </div>
        );
    }

    public render() {
        return (
            <div className={styles.studyViewTablesTable}>
                {!this.props.hideControls &&
                    this.props.showControlsAtTop &&
                    this.getControls()}
                <Observer>
                    {() => (
                        <RVTable
                            width={this.props.width!}
                            height={this.props.height!}
                            headerHeight={this.props.headerHeight!}
                            rowHeight={this.props.rowHeight!}
                            rowCount={
                                this._store.dataStore.sortedFilteredData.length
                            }
                            rowGetter={this.rowGetter}
                            rowClassName={this.rowClassName}
                            headerClassName={styles.headerColumn}
                            sort={this.sort}
                            sortDirection={RVSDTtoStrType[this._sortDirection]}
                            sortBy={this._sortBy}
                        >
                            {this.props.columns.map((column, index) => {
                                return (
                                    <RVColumn
                                        key={column.name}
                                        label={column.name}
                                        dataKey={column.name}
                                        width={Number(column.width)}
                                        headerRenderer={
                                            this.columnHeaders[index]
                                        }
                                        cellRenderer={(
                                            props: TableCellProps
                                        ) => {
                                            return column.render(props.rowData);
                                        }}
                                    />
                                );
                            })}
                        </RVTable>
                    )}
                </Observer>
                {!this.props.hideControls &&
                    !this.props.showControlsAtTop &&
                    this.getControls()}
            </div>
        );
    }
}
