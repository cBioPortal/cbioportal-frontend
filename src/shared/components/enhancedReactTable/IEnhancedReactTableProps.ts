import {
    IColumnRenderFunction, IColumnSortFunction, IColumnFilterFunction, IColumnVisibilityFunction, ColumnVisibility,
    IColumnDataFunction
} from "./IColumnFormatter";
import {ITableExportButtonsProps} from "../tableHeaderControls/TableHeaderControls";

/**
 * @author Selcuk Onur Sumer
 */
export interface IEnhancedReactTableProps<T> {
    reactTableProps?: any; // any available reactable props
    headerControlsProps?: ITableExportButtonsProps;
    columns?: IColumnDefMap; // column definitions (including component renderers)
    rawData: Array<T>; // raw data
    initItemsPerPage?: number; // initial number of items per page
    initPage?:number; // initial page
    itemsName?:string; // name of items, e.g. "mutations"
    onVisibleRowsChange?:(data:T[]) => void; // executed whenever the visible rows change (sorting or paginating), argument is the row data of visible rows, in order
}

export interface IEnhancedReactTableState {
    columnVisibility: IColumnVisibilityState;
    filter: string;
    itemsPerPage:number;
    currentPage:number;
}

export interface IColumnDefMap {
    [key: string]: IEnhancedReactTableColumnDef;
}

export interface IColumnVisibilityState {
    [key: string]: ColumnVisibility;
}

export interface IColumnVisibilityDef {
    id: string;
    name: string;
    visibility: ColumnVisibility;
}

export interface IEnhancedReactTableColumnDef {
    name: string; // display name for the column header
    description?: string | JSX.Element; // column description (used as a column header tooltip value)
    formatter?: IColumnRenderFunction; // actual renderer function
    sortable?: IColumnSortFunction | boolean; // boolean indicator, or a custom sort function
    filterable?: IColumnFilterFunction | boolean; // boolean indicator, or a custom filter function
    visible?: IColumnVisibilityFunction | ColumnVisibility; // visibility value, or visibility function
    priority?: number; // column priority (used for column ordering)
    columnProps?: any; // any additional column props (passed as argument to the formatter)
    dataField?: string; // data field to retrieve display data (in case no formatter provided, otherwise ignored)
    columnData?:IColumnDataFunction; // column data function to retrieve display data (in case no formatter provided)
}

export default IEnhancedReactTableProps;
