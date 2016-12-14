import * as React from 'react';

/**
 * @author Selcuk Onur Sumer
 */
export interface IColumnFormatterProps {
    data:IColumnFormatterData; // column data (set by React Table)
    formatter:React.Component<any, any>; // Column Formatter class
    label:string; // Column label (name)
    onClick?:Function; // onClick handler function
}

export interface IColumnFormatterData {
    tableData?: Array<any>; // entire table data (array of instances)
    rowData?: any; // single instance representing the row data
    columnData?: any; // column specific data
}

export interface IColumnFormatter {
    //render():any;
}

export interface IColumnSortFunction {
    (a:IColumnFormatterData, b:IColumnFormatterData):boolean;
}

export interface IColumnFilterFunction {
    (contents:string, filter:string):boolean;
}

export default IColumnFormatterProps;
