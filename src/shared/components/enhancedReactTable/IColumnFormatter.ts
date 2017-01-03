import * as React from 'react';

/**
 * @author Selcuk Onur Sumer
 */

export interface IColumnFormatterData {
    name:string; // column name
    tableData?:Array<any>; // entire table data (array of instances)
    rowData?:any; // single instance representing the row data
    columnData?:any; // column specific data
}

export interface IColumnFormatter {
    //render();
}

export interface IColumnSortFunction {
    (a:any, b:any):boolean;
}

export interface IColumnFilterFunction {
    (contents:string, filter:string):boolean;
}

export interface IColumnRenderFunction {
    (a:IColumnFormatterData, props:any):any; // TODO this should return Reactable.Td!
}

export interface IColumnVisibilityFunction {
    (tableData:Array<any>):ColumnVisibility;
}

export type ColumnVisibility = "visible" | "hidden" | "excluded";

export default IColumnFormatter;
