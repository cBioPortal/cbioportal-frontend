import {
    IColumnRenderFunction, IColumnSortFunction, IColumnFilterFunction, IColumnVisibilityFunction, ColumnVisibility,
    IColumnDataFunction
} from "./IColumnFormatter";

/**
 * @author Selcuk Onur Sumer
 */
export interface IEnhancedReactTableProps {
    reactTableProps?: any; // any available reactable props
    columns?: IColumnDefMap; // column definitions (including component renderers)
    rawData: Array<any>; // raw data
}

export interface IEnhancedReactTableState {
    columnVisibility: IColumnVisibilityState;
}

export interface IColumnDefMap {
    [key: string]: IEnhancedReactTableColumnDef;
}

export interface IColumnVisibilityState {
    [key: string]: ColumnVisibility
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
