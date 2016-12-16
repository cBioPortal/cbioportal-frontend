import * as React from 'react';
import {Table as DataTable} from "reactableMSK";
import * as _ from 'underscore';
import {IEnhancedReactTableProps, IColumnDefMap, IEnhancedReactTableColumnDef}
    from "IEnhancedReactTableProps";
import {IColumnFormatter, IColumnFormatterData, IColumnSortFunction, IColumnFilterFunction,
    IColumnVisibilityFunction, ColumnVisibility}
    from "./IColumnFormatterProps";

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
        reactTableProps.data = this.convertToTableData(visibleCols, rawData);
        reactTableProps.columnFormatters = this.columnFormatters(visibleCols);
        reactTableProps.sortable = this.resolveSortable(visibleCols);
        reactTableProps.filterable = this.resolveFilterable(visibleCols);

        // TODO column order (add index

        return(
            <DataTable {...reactTableProps} />
        );
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

    private columnFormatters(columns:IColumnDefMap):{[key:string]: IColumnFormatter}
    {
        let formatters:{[key:string]: IColumnFormatter} = {};

        _.each(columns, function(column:IEnhancedReactTableColumnDef) {
            if (column.formatter) {
                formatters[column.name] = column.formatter;
            }
        });

        return formatters;
    }

    private convertToTableData(columns:IColumnDefMap, rawData:Array<any>):Array<any>
    {
        let rows:Array<any> = [];

        _.each(rawData, function(element:any) {
            let row:any = {};

            _.each(columns, function(columnDef:any) {
                let data:IColumnFormatterData = {
                    tableData: rawData,
                    rowData: element,
                    columnData: null
                };

                // get column data (may end up being undefined)
                if (columnDef.dataField) {
                    data.columnData = element[columnDef.dataField];
                }
                // last resort: use name to get data (if there is any matching data field)
                else {
                    data.columnData = element[columnDef.name];
                }

                // here we actually set the same data (same mutation object) for each column.
                // column formatter should extract the required data from the mutation.
                if (columnDef.formatter)
                {
                    if (columnDef.formatter.filterValue)
                    {
                        // this is required for the filters to work properly!
                        data.toString = function() {
                            return columnDef.formatter.filterValue(data);
                        };
                    }

                    row[columnDef.name] = data;
                }
                // if no formatter defined for a column, then try the data field option!
                else {
                    row[columnDef.name] = data.columnData;
                }
            });

            rows.push(row);
        });

        return rows;
    }
};
