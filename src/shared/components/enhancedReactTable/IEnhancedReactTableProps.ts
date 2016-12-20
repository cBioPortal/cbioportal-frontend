import {IColumnRenderFunction, IColumnSortFunction, IColumnFilterFunction, IColumnVisibilityFunction, ColumnVisibility}
    from "./IColumnFormatter";

/**
 * @author Selcuk Onur Sumer
 */
export interface IEnhancedReactTableProps {
    reactTableProps?: any; // any available reactableMSK props
    columns?: IColumnDefMap; // column definitions (including component renderers)
    rawData: Array<any>; // raw data
}

export interface IColumnDefMap {
    [key: string]: IEnhancedReactTableColumnDef;
}

export interface IEnhancedReactTableColumnDef {
    name: string;
    formatter?: IColumnRenderFunction;
    sortable?: IColumnSortFunction | boolean;
    filterable?: IColumnFilterFunction | boolean;
    visible?: IColumnVisibilityFunction | ColumnVisibility;
    dataField?: string;
}

export default IEnhancedReactTableProps;
