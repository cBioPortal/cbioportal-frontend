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
    name: string;
    formatter?: IColumnRenderFunction;
    sortable?: IColumnSortFunction | boolean;
    filterable?: IColumnFilterFunction | boolean;
    visible?: IColumnVisibilityFunction | ColumnVisibility;
    priority?: number;
    columnProps?: any;
    dataField?: string;
    columnData?:IColumnDataFunction;
}

export default IEnhancedReactTableProps;
