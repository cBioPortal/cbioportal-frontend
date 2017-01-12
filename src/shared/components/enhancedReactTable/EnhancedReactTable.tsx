import * as React from 'react';
import {Table, Thead, Th, Tr, Td} from "reactable";
import * as _ from 'underscore';
import TableHeaderControls from "shared/components/tableHeaderControls/TableHeaderControls";
import {
    IEnhancedReactTableProps, IColumnDefMap, IEnhancedReactTableColumnDef, IColumnVisibilityState,
    IEnhancedReactTableState, IColumnVisibilityDef
} from "IEnhancedReactTableProps";
import {
    IColumnFormatterData, IColumnSortFunction, IColumnFilterFunction, IColumnVisibilityFunction, ColumnVisibility
} from "./IColumnFormatter";
import './styles.css';

type IColumnSort = {
    column: string,
    sortFunction: IColumnSortFunction
};

type IColumnFilter = {
    column: string,
    filterFunction: IColumnFilterFunction
};

/**
 * @author Selcuk Onur Sumer
 */
export default class EnhancedReactTable<T> extends React.Component<IEnhancedReactTableProps<T>, IEnhancedReactTableState>
{
    /**
     * Resolves the visible columns and returns the state for the ones except "excluded".
     *
     * @param columns   column definitions
     * @param tableData raw table data
     * @returns {IColumnVisibilityState} column visibility state for not excluded columns
     */
    public static resolveVisibility<T>(columns:IColumnDefMap|undefined, tableData:Array<T>):IColumnVisibilityState
    {
        let visibilityState:IColumnVisibilityState = {};

        if (!columns) {
            return visibilityState;
        }

        _.each(_.keys(columns), function(key:string) {
            let column:IEnhancedReactTableColumnDef = columns[key];

            // every column is visible by default unless otherwise marked as hidden or excluded
            let visibility:ColumnVisibility = "visible";

            if (column.visible)
            {
                if (_.isFunction(column.visible)) {
                    visibility = (column.visible as IColumnVisibilityFunction)(tableData, column.columnProps);
                }
                else {
                    visibility = column.visible as ColumnVisibility;
                }
            }

            // do not include "excluded" columns in the state, they will always remain hidden
            // ones set initially to "hidden" can be toggled visible later on.
            if (visibility !== "excluded")
            {
                visibilityState[key] = visibility;
            }
        });

        return visibilityState;
    }

    public static columnSort(a:IEnhancedReactTableColumnDef, b:IEnhancedReactTableColumnDef):number
    {
        if (a.priority && b.priority) {
            return a.priority - b.priority;
        }
        else if (a.priority) {
            return -1;
        }
        else if (b.priority) {
            return 1;
        }
        // sort alphabetically in case of no priority
        else if (a.name > b.name) {
            return 1;
        }
        else {
            return -1;
        }
    }

    // mapping of column name to column id
    private colNameToId:{[key:string]: string};

    // sorted list of columns (by priority)
    private sortedColumns:Array<IEnhancedReactTableColumnDef>;

    private filteredDataLength:number;

    private shouldSetState:boolean;

    constructor(props:IEnhancedReactTableProps<T>)
    {
        super(props);

        this.state = {
            columnVisibility: EnhancedReactTable.resolveVisibility(props.columns, props.rawData),
            filter: "",
            itemsPerPage: this.props.initItemsPerPage || 25,
            currentPage: this.props.initPage || 0
        };

        // Begin code designed to get around the fact that data filtering happens inside Table
        // but we need that information to properly paginate.

        // Monkey patch to get access to filtered data for pagination num pages calculation
        this.filteredDataLength = props.rawData.length;
        this.shouldSetState = false;

        const setFilteredDataLength = (n:number) => {
            if (n !== this.filteredDataLength) {
                this.filteredDataLength = n;
                this.shouldSetState = true;
            }
        };

        const Table_applyFilter = Table.prototype.applyFilter;
        Table.prototype.applyFilter = function(){
            const result = Table_applyFilter.apply(this, arguments);
            setFilteredDataLength(result.length);
            return result;
        };
        //


        this.colNameToId = this.mapColNameToId(props.columns);
        this.sortedColumns = this.resolveOrder(props.columns);

        // binding "this" to handler functions
        this.handleFilterInput = this.handleFilterInput.bind(this);
        this.handleVisibilityToggle = this.handleVisibilityToggle.bind(this);
        this.handleChangeItemsPerPage = this.handleChangeItemsPerPage.bind(this);
        this.handlePreviousPageClick = this.handlePreviousPageClick.bind(this);
        this.handleNextPageClick = this.handleNextPageClick.bind(this);
    }

    public render() {
        let {
            reactTableProps,
            headerControlsProps,
            columns,
            rawData
        } = this.props;

        columns = columns || {};
        let visibleCols:IColumnDefMap = this.resolveVisible(columns, this.state.columnVisibility);

        // dynamic reactable props (depends on the columnVisibility state)
        let sortable:Array<string|IColumnSort> = this.resolveSortable(visibleCols);
        let filterable:Array<string|IColumnFilter> = this.resolveFilterable(visibleCols);

        // sort columns
        let sortedCols:Array<IEnhancedReactTableColumnDef> = this.resolveOrder(visibleCols);

        // always use the initially sorted columns (this.sortedColumns),
        // otherwise already hidden columns will never appear in the dropdown menu!
        let columnVisibility:Array<IColumnVisibilityDef> = this.resolveColumnVisibility(
            this.colNameToId, this.sortedColumns, this.state.columnVisibility);

        // column headers: an array of Th components
        const headers = this.generateHeaders(sortedCols);

        // table rows: an array of Tr components
        const rows = this.generateRows(sortedCols, rawData);

        let firstItemShownIndex:number;
        if (this.filteredDataLength === 0) {
            firstItemShownIndex = 0;
        } else {
            firstItemShownIndex = (this.state.itemsPerPage === -1 ? 0 : this.state.itemsPerPage*this.state.currentPage) + 1;
        }
        const lastItemShownIndex:number = (this.state.itemsPerPage === -1 ? this.filteredDataLength : Math.min(this.filteredDataLength, firstItemShownIndex + this.state.itemsPerPage - 1));

        return(
            <div>
                <TableHeaderControls
                    showCopyAndDownload={true}
                    showHideShowColumnButton={true}
                    columnVisibility={columnVisibility}
                    handleInput={this.handleFilterInput}
                    onColumnToggled={this.handleVisibilityToggle}
                    showSearch={true}
                    className="pull-right"
                    paginationProps={{itemsPerPage:this.state.itemsPerPage,
                                        currentPage: this.state.currentPage,
                                        onChangeItemsPerPage: this.handleChangeItemsPerPage,
                                        onPreviousPageClick: this.handlePreviousPageClick,
                                        onNextPageClick: this.handleNextPageClick,
                                        textBetweenButtons: `${firstItemShownIndex}-${lastItemShownIndex} of ${this.filteredDataLength}`,
                                        previousPageDisabled: (this.state.currentPage === 0),
                                        nextPageDisabled: (this.state.currentPage >= this.numPages()-1)}}
                    {...headerControlsProps}
                />
                <Table
                    sortable={sortable}
                    filterable={filterable}
                    filterBy={this.state.filter}
                    itemsPerPage={this.state.itemsPerPage === -1 ? undefined : this.state.itemsPerPage}
                    currentPage={this.state.currentPage}
                    {...reactTableProps}
                >
                    <Thead>
                        {headers}
                    </Thead>
                    {rows}
                </Table>
            </div>
        );
    }

    componentWillUpdate(nextProps:IEnhancedReactTableProps<T>, nextState:IEnhancedReactTableState) {
        if (nextState.filter.length === 0) {
            // Normally, the way we update this.filteredDataLength is when Table.applyFilter is
            // called (see "monkey patching" of Table.prototype.applyFilter).
            // But if the filter text is empty, Table.applyFilter is not called and the
            // entire input data is used, so we have to manually catch and handle this case here
            // to keep this.filteredDataLength up to date.
            this.filteredDataLength = this.props.rawData.length;
        }
    }
    componentDidUpdate() {
        if (this.shouldSetState) {
            this.shouldSetState = false;
            this.setState({
                currentPage: Math.max(0, Math.min(this.state.currentPage, this.numPages() - 1))
            } as IEnhancedReactTableState);
        }
    }

    private numPages(itemsPerPage?:number) {
        itemsPerPage = itemsPerPage || this.state.itemsPerPage;
        if (itemsPerPage === -1) {
            return 1;
        } else {
            return Math.ceil(this.filteredDataLength / itemsPerPage);
        }
    }

    private mapColNameToId(columns:IColumnDefMap|undefined):{[key:string]: string}
    {
        let colNameToId:{[key:string]:string} = {};

        if (columns)
        {
            _.each(columns, function(value:IEnhancedReactTableColumnDef, key:string) {
                if (value.name) {
                    if (colNameToId[value.name] != null) {
                        // TODO console.log("[EnhancedReactTable] Warning: Duplicate column name: " + value.name);
                    }
                    colNameToId[value.name] = key;
                }
            });
        }

        return colNameToId;
    }

    private resolveOrder(columns:IColumnDefMap|undefined):Array<IEnhancedReactTableColumnDef>
    {
        if (columns) {
            return _.values(columns).sort(EnhancedReactTable.columnSort);
        }
        else {
            return [];
        }
    }

    /**
     * Resolves the IColumnVisibilityDef to be passed to the TableHeaderControls.
     *
     * @param colNameToId
     * @param sortedCols
     * @param columnVisibility
     * @returns {Array<IColumnVisibilityDef>}
     */
    private resolveColumnVisibility(colNameToId:{[key:string]:string},
                                    sortedCols:Array<IEnhancedReactTableColumnDef>,
                                    columnVisibility: IColumnVisibilityState):Array<IColumnVisibilityDef>
    {
        let colVis:Array<IColumnVisibilityDef>  = [];

        _.each(sortedCols, function(col:IEnhancedReactTableColumnDef) {
            let id:string = colNameToId[col.name];

            if (columnVisibility[id])
            {
                colVis.push({
                    id,
                    name: col.name,
                    visibility: columnVisibility[id]
                });
            }
        });

        return colVis;
    }

    private generateHeaders(columns:Array<IEnhancedReactTableColumnDef>)
    {
        let headers:Array<any> = [];

        _.each(columns, function(columnDef:IEnhancedReactTableColumnDef) {

            headers.push(
                <Th key={columnDef.name} columns={columnDef.name}>
                    {columnDef.name}
                </Th>
            );
        });

        return headers;
    }

    private generateRows(columns:Array<IEnhancedReactTableColumnDef>, tableData:Array<T>)
    {
        let rows:Array<any> = [];
        const self = this;

        _.each(tableData, function(rowData:T, index:number) {
            // columns for this row: an array of Td elements
            const cols = self.generateColumns(columns, tableData, rowData);

            rows.push(
                <Tr key={index}>
                    {cols}
                </Tr>
            );
        });

        return rows;
    }

    private generateColumns(columns:Array<IEnhancedReactTableColumnDef>, tableData:Array<T>, rowData:T)
    {
        let cols:Array<any> = [];
        const self = this;

        _.each(columns, function(columnDef:IEnhancedReactTableColumnDef) {
            let data:IColumnFormatterData<T> = {
                name: columnDef.name,
                tableData,
                rowData,
                columnData: null
            };

            // get column data (may end up being undefined)
            if (columnDef.columnData) {
                data.columnData = columnDef.columnData(data);
            }
            else if (columnDef.dataField)
            {
                // also taking into account that row data might be an array of instances
                // (instead of a single instance)
                // this converts row data into an array in case it refers to a single instance
                const instances:Array<any> = new Array<any>().concat(data.rowData);

                // In case row data is an array of instances, by default retrieving only the first
                // element's data as the column data. For advanced combining of all elements' data,
                // one needs to provide a custom columnData function.
                if (instances.length > 0) {
                    data.columnData = instances[0][columnDef.dataField];
                }
            }

            cols.push(self.generateColumn(data, columnDef));
        });

        return cols;
    }

    private generateColumn(data:IColumnFormatterData<T>, columnDef:IEnhancedReactTableColumnDef)
    {
        if (columnDef.formatter)
        {
            return columnDef.formatter(data, columnDef.columnProps);
        }
        else
        {
            return (
                <Td key={columnDef.name} column={columnDef.name} value={data.columnData}>
                    {data.columnData}
                </Td>
            );
        }
    }

    private resolveVisible(columns:IColumnDefMap, visibility:IColumnVisibilityState):IColumnDefMap
    {
        let visibleCols:IColumnDefMap = {};

        _.each(_.keys(visibility), function(key:string) {
            if (visibility[key] === "visible") {
                visibleCols[key] = columns[key];
            }
        });

        return visibleCols;
    }

    private resolveSortable(columns:IColumnDefMap):Array<string|IColumnSort>
    {
        let sortable:Array<string|IColumnSort> = [];

        _.each(columns, function(column:IEnhancedReactTableColumnDef) {
            if (_.isFunction(column.sortable)) {
                sortable.push({
                    column: column.name,
                    sortFunction: column.sortable as IColumnSortFunction
                });
            }
            else if (column.sortable) {
                sortable.push(column.name);
            }
        });

        return sortable;
    }

    private resolveFilterable(columns:IColumnDefMap):Array<string|IColumnFilter>
    {
        let filterable:Array<string|IColumnFilter> = [];

        _.each(columns, function(column:IEnhancedReactTableColumnDef) {
            if (_.isFunction(column.filterable)) {
                filterable.push({
                    column: column.name,
                    filterFunction: column.filterable as IColumnFilterFunction
                });
            }
            else if (column.filterable) {
                filterable.push(column.name);
            }
        });

        return filterable;
    }

    private handleFilterInput(filter: string):void
    {
        this.setState({
            ...this.state,
            filter
        });
    }

    private handleVisibilityToggle(columnId: String):void
    {
        const key:string = columnId as string;

        let visibility:ColumnVisibility = this.state.columnVisibility[key];
        let columnVisibility:IColumnVisibilityState = this.state.columnVisibility;

        if (visibility === "hidden") {
            visibility = "visible";
        }
        else if (visibility === "visible") {
            visibility = "hidden";
        }

        columnVisibility[key] = visibility;

        this.setState({
            columnVisibility,
            ...this.state
        });
    }

    private handleChangeItemsPerPage(itemsPerPage:number) {
        this.setState({
            itemsPerPage: itemsPerPage,
            currentPage: Math.min(this.state.currentPage, this.numPages(itemsPerPage)-1)
        } as IEnhancedReactTableState);
    }

    private handlePreviousPageClick() {
        this.setState({
            currentPage: Math.max(0, this.state.currentPage - 1)
        } as IEnhancedReactTableState);
    }

    private handleNextPageClick() {
        this.setState({
            currentPage: Math.min(this.state.currentPage + 1, this.numPages() - 1)
        } as IEnhancedReactTableState);
    }
};
