import autobind from "autobind-decorator";
import {
    resolveColumnVisibility,
    resolveColumnVisibilityByColumnDefinition
} from "cbioportal-frontend-commons";
import classnames from "classnames";
import _ from "lodash";
import {action, computed, IReactionPublic, observable, reaction} from "mobx";
import {observer} from "mobx-react";
import * as React from 'react';
import ReactTable, {Column, RowInfo, TableProps} from "react-table";

import {ColumnSelectorProps, ColumnVisibilityDef} from "./component/ColumnSelector";
import DataTableToolbar from "./component/toolbar/DataTableToolbar";
import {DataFilter} from "./model/DataFilter";
import {DataStore} from "./model/DataStore";
import {RemoteData} from "./model/RemoteData";
import {getRemoteDataGroupStatus} from "./util/RemoteDataUtils";
import './defaultDataTable.scss';

export type DataTableColumn<T> = Column<T> & {
    name?: string;
    togglable? : boolean;
}

export type DataTableProps<T> =
{
    data?: T[];
    dataStore?: DataStore;
    columns?: DataTableColumn<T>[];
    className?: string;
    reactTableProps?: Partial<TableProps<T>>;

    initialSortColumnData?: (RemoteData<any>|undefined)[];
    initialSortColumn?: string;
    initialSortDirection?: 'asc'|'desc';
    initialItemsPerPage?: number;

    highlightColorLight?: string;
    highlightColorDark?: string;

    showColumnVisibility?: boolean;
    columnVisibility?: {[columnId: string]: boolean};
    columnSelectorProps?: ColumnSelectorProps;
};

export function getInitialColumnDataStatus(initialSortColumnData?: (RemoteData<any>|undefined)[]) {
    return initialSortColumnData ? getRemoteDataGroupStatus(_.compact(initialSortColumnData)) : "complete";
}

function getColumnVisibilityDef<T>(columns: DataTableColumn<T>[], columnVisibility: {[columnId: string]: boolean}) {
    const colVisProp: ColumnVisibilityDef[] = [];

    (columns || [])
        .filter(column => column.id)
        .forEach(column => colVisProp.push({
                id: column.id!,
                name: column.name || column.id!,
                visible: columnVisibility[column.id!],
                togglable: column.togglable !== undefined ? column.togglable : true
            })
        );

    return colVisProp;
}

@observer
export default class DataTable<T> extends React.Component<DataTableProps<T>, {}>
{
    public static defaultProps = {
        data: [],
        initialSortDirection: "desc",
        initialItemsPerPage: 10,
        highlightColorLight: "#B0BED9",
        highlightColorDark: "#9FAFD1"
    };

    // this keeps the state of the latest action (latest user selection)
    @observable
    private _columnVisibilityOverride:{[columnId: string]: boolean} | undefined;

    @observable
    private expanded: {[index: number] : boolean} = {};

    @computed
    get tableData(): T[] | undefined
    {
        let data = this.props.data;

        if (this.props.dataStore) {
            data = this.props.dataStore.sortedFilteredSelectedData.length > 0 ?
                this.props.dataStore.sortedFilteredSelectedData : this.props.dataStore.sortedFilteredData;
        }

        return data;
    }

    @computed
    get columns(): Column[] {
        return (this.props.columns || []).map(
            c => ({...c, show: c.id ? this.columnVisibility[c.id] : c.show})
        );
    }

    @computed
    get needToCustomizeRowStyle() {
        return this.props.dataStore && this.props.dataStore.highlightFilters;
    }

    @computed
    get showPagination() {
        const initialItemsPerPage = this.props.initialItemsPerPage;

        return (
            this.tableData !== undefined &&
            this.tableData.length > initialItemsPerPage!
        );
    }

    @computed
    get defaultPageSize() {
        const initialItemsPerPage = this.props.initialItemsPerPage;

        return this.tableData ?
            (this.tableData.length > initialItemsPerPage! ? initialItemsPerPage : this.tableData.length) : 1;
    }

    @computed
    get initialColumnDataStatus() {
        return getInitialColumnDataStatus(this.props.initialSortColumnData);
    }

    @computed
    get defaultSorted() {
        const {
            initialSortColumn,
            initialSortDirection
        } = this.props;

        if (initialSortColumn === undefined || this.initialColumnDataStatus === "pending") {
            return undefined;
        }
        else {
            return [{
                id: initialSortColumn,
                desc: initialSortDirection === 'desc'
            }];
        }
    }

    @computed
    public get columnVisibility(): {[columnId: string]: boolean}
    {
        return resolveColumnVisibility(this.columnVisibilityByColumnDefinition,
            this.props.columnVisibility,
            this._columnVisibilityOverride);
    }

    @computed
    public get columnVisibilityDef(): ColumnVisibilityDef[]
    {
        return getColumnVisibilityDef(this.props.columns || [], this.columnVisibility);
    }

    @computed
    public get columnVisibilityByColumnDefinition() {
        return resolveColumnVisibilityByColumnDefinition(
            (this.props.columns || [])
                .filter(c => c.id)
                .map(c => ({name: c.name || c.id!, id: c.id, visible: c.show}))
        );
    }

    public render()
    {
        return (
            <div className='cbioportal-frontend'>
                <DataTableToolbar
                    visibilityToggle={this.onVisibilityToggle}
                    columnVisibility={this.columnVisibilityDef}
                    columnSelectorProps={this.props.columnSelectorProps}
                />
                <div className={classnames(this.props.className, 'cbioportal-frontend', 'default-data-table')}>
                    <ReactTable
                        data={this.tableData}
                        columns={this.columns}
                        getTrProps={this.needToCustomizeRowStyle ? this.getTrProps : undefined}
                        defaultSorted={this.defaultSorted}
                        defaultPageSize={this.defaultPageSize}
                        showPagination={this.showPagination}
                        className="-striped -highlight"
                        previousText="<"
                        nextText=">"
                        expanded={this.expanded}
                        onExpandedChange={this.onExpandedChange}
                        onPageChange={this.resetExpander}
                        onPageSizeChange={this.resetExpander}
                        onSortedChange={this.resetExpander}
                        {...this.props.reactTableProps}
                    />
                </div>
            </div>
        );
    }

    componentWillReceiveProps(nextProps: Readonly<DataTableProps<T>>)
    {
        if (nextProps.dataStore) {
            // this is to reset expander component every time the data or selection filters update
            // it would be cleaner if we could do this with a ReactTable callback (something like onDataChange),
            // but no such callback exists
            reaction(
                () => [nextProps.dataStore!.selectionFilters, nextProps.dataStore!.dataFilters],
                (filters: DataFilter[][], disposer: IReactionPublic) => {
                    if (filters.length > 0) {
                        this.resetExpander();
                    }
                    disposer.dispose();
                }
            );
        }
    }

    @autobind
    protected getTrProps(state: any, row?: RowInfo)
    {
        return {
            style: {
                background: state && row && this.getRowBackground(row)
            }
        };
    }

    @action.bound
    protected onVisibilityToggle(selectedColumnIds: string[])
    {
        // reset all column visibility
        Object.keys(this.columnVisibility).forEach(
            columnId => this.updateColumnVisibility(columnId, false));

        // make selected columns visible
        selectedColumnIds.forEach(columnId => this.updateColumnVisibility(columnId, true));
    }

    @action.bound
    protected updateColumnVisibility(id: string, visible: boolean)
    {
        // no previous action, need to init
        if (this._columnVisibilityOverride === undefined) {
            this._columnVisibilityOverride = resolveColumnVisibility(
                this.columnVisibilityByColumnDefinition, this.props.columnVisibility);
        }

        // update visibility
        if (this._columnVisibilityOverride &&
            this._columnVisibilityOverride[id] !== undefined)
        {
            this._columnVisibilityOverride[id] = visible;
        }
    }

    @action.bound
    protected onExpandedChange(expanded: {[index: number] : boolean}) {
        this.expanded = expanded;
    }

    @action.bound
    protected resetExpander() {
        this.expanded = {};
    }

    protected isRowHighlighted(datum: T) {
        return this.props.dataStore && this.props.dataStore.dataHighlightFilter(datum);
    }

    protected getRowBackground(row: RowInfo)
    {
        let background: string | undefined;

        if (this.isRowHighlighted(row.original)) {
            background = row.viewIndex % 2 === 1 ? this.props.highlightColorDark : this.props.highlightColorLight;
        }

        return background;
    }
}
