import * as React from 'react';
import {Table, Thead, Th, Tr, Td} from "reactable";
import * as _ from 'underscore';
import {IEnhancedReactTableProps, IColumnDefMap, IEnhancedReactTableColumnDef}
    from "IEnhancedReactTableProps";
import {IColumnFormatterData, IColumnSortFunction, IColumnFilterFunction,
    IColumnVisibilityFunction, ColumnVisibility}
    from "./IColumnFormatter";

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
export default class EnhancedReactTable extends React.Component<IEnhancedReactTableProps, {}>
{
    constructor(props:IEnhancedReactTableProps)
    {
        super(props);
        this.state = {};
    }

    public render() {
        let {
            reactTableProps,
            columns,
            rawData
        } = this.props;

        columns = columns || {};
        let visibleCols:IColumnDefMap = this.resolveVisible(columns, rawData);

        // update (override) react table props
        reactTableProps.sortable = this.resolveSortable(visibleCols);
        reactTableProps.filterable = this.resolveFilterable(visibleCols);

        // sort columns
        let sortedCols:Array<IEnhancedReactTableColumnDef> = this.resolveOrder(visibleCols);

        const headers = this.generateHeaders(sortedCols);
        const rows = this.generateRows(sortedCols, rawData);

        return(
            <Table {...reactTableProps}>
                <Thead>
                    {headers}
                </Thead>
                {rows}
            </Table>
        );
    }

    private resolveOrder(columns:IColumnDefMap):Array<IEnhancedReactTableColumnDef>
    {
        return _.map(columns, function(column:IEnhancedReactTableColumnDef) {
            return column;
        }).sort(function(a:IEnhancedReactTableColumnDef, b:IEnhancedReactTableColumnDef):number {
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
        });
    }

    private generateHeaders(columns:Array<IEnhancedReactTableColumnDef>)
    {
        let headers:Array<any> = [];

        _.each(columns, function(columnDef:IEnhancedReactTableColumnDef) {

            headers.push(
                <Th columns={columnDef.name}>
                    {columnDef.name}
                </Th>
            );
        });

        return headers;
    }

    private generateRows(columns:Array<IEnhancedReactTableColumnDef>, tableData:Array<any>)
    {
        let rows:Array<any> = [];
        const self = this;

        _.each(tableData, function(rowData) {
            const cols = self.generateColumns(columns, tableData, rowData);

            rows.push(
                <Tr>
                    {cols}
                </Tr>
            );
        });

        return rows;
    }

    private generateColumns(columns:Array<IEnhancedReactTableColumnDef>, tableData:Array<any>, rowData:any)
    {
        let cols:Array<any> = [];
        const self = this;

        _.each(columns, function(columnDef:IEnhancedReactTableColumnDef) {
            let data:IColumnFormatterData = {
                name: columnDef.name,
                tableData,
                rowData,
                columnData: null
            };

            // get column data (may end up being undefined)
            if (columnDef.columnData) {
                data.columnData = columnDef.columnData(data);
            } else if (columnDef.dataField) {
                data.columnData = rowData[columnDef.dataField];
            }

            cols.push(self.generateColumn(data, columnDef));
        });

        return cols;
    }

    private generateColumn(data:IColumnFormatterData, columnDef:IEnhancedReactTableColumnDef)
    {
        if (columnDef.formatter)
        {
            return columnDef.formatter(data, columnDef.columnProps);
        }
        else
        {
            return (
                <Td column={columnDef.name} value={data.columnData}>
                    {data.columnData}
                </Td>
            );
        }
    }

    /**
     * Resolves the visible columns and returns column definitions for only
     * the visible ones.
     *
     * @param columns   column definitions
     * @param rawData   raw table data
     * @returns {IColumnDefMap} column definitions for visible columns
     */
    private resolveVisible(columns:IColumnDefMap, rawData:Array<any>):IColumnDefMap
    {
        let visibleCols:IColumnDefMap = {};

        _.each(_.keys(columns), function(key:string) {
            let column:IEnhancedReactTableColumnDef = columns[key];

            // every column is visible by default unless otherwise marked as hidden or excluded
            let visibility:ColumnVisibility = "visible";

            if (column.visible)
            {
                if (_.isFunction(column.visible)) {
                    visibility = (column.visible as IColumnVisibilityFunction)(rawData);
                }
                else {
                    visibility = column.visible as ColumnVisibility;
                }
            }

            // TODO currently ignoring the difference between "hidden" and "excluded"
            // include column only if it is visible for now
            // ideally we should only exclude "excluded" ones,
            // and make "hidden" ones initially hidden (later on they can be toggled visible)
            // this requires implementation of show/hide columns feature
            if (visibility === "visible")
            {
                visibleCols[key] = column;
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
                    sortFunction: column.sortable
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
                    filterFunction: column.filterable
                });
            }
            else if (column.filterable) {
                filterable.push(column.name);
            }
        });

        return filterable;
    }
};
