/**
 * @author Selcuk Onur Sumer
 */
export interface IColumnFormatterProps {
    data:IColumnFormatterData; // column data (set by React Table)
    formatter:any; // Column Formatter class
    label:string; // Column label (name)
    onClick:any; // onClick handler function
}

export interface IColumnFormatterData {
    tableData: Array<any>; // entire table data (array of instances)
    rowData: any; // single instance representing the row data
    columnData: any; // column specific data
}

export default IColumnFormatterProps;
