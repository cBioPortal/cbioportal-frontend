import * as React from 'react';
import {Table as DataTable} from "reactableMSK";
import * as _ from 'underscore';
import IEnhancedReactTableProps from "IEnhancedReactTableProps";
import {IColumnFormatterData} from "./IColumnFormatterProps";

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

        // update (override) react table props
        reactTableProps.data = this.convertToTableData(columns, rawData);
        reactTableProps.columnFormatters = this.columnFormatters(columns);
        reactTableProps.sortable = this.resolveSortable(columns);
        reactTableProps.filterable = this.resolveFilterable(columns);

        // TODO future work: column order, column visibility

        return(
            <DataTable {...reactTableProps} />
        );
    }

    private resolveSortable(columns:Array<any>)
    {
        let sortable:Array<any> = []; // Array<string|function>

        _.each(columns, function(column:any) {
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

    private resolveFilterable(columns:Array<any>)
    {
        let filterable:Array<any> = []; // Array<string|function>

        _.each(columns, function(column:any) {
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

    private columnFormatters(columns:Array<any>)
    {
        let formatters:any = {};

        _.each(columns, function(column:any) {
            formatters[column.name] = column.formatter;
        });

        return formatters;
    }

    private convertToTableData(columns:Array<any>, rawData:Array<any>)
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
                if (columnDef.formatter) {
                    // this is required for the filters to work properly!
                    data.toString = function() {
                        return columnDef.formatter.filterValue(data);
                    };
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
