import {
    IColumnRenderFunction, IColumnSortFunction, IColumnFilterFunction, IColumnVisibilityFunction, ColumnVisibility,
    IColumnFormatterData
}
    from "./IColumnFormatter";

/**
 * @author Selcuk Onur Sumer
 */
export interface IEnhancedReactTableProps {
    reactTableProps?: any; // any available reactable props
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
    priority?: number;
    props?: any;
    dataField?: string;
    columnData?:(d:IColumnFormatterData)=>any;
}

export default IEnhancedReactTableProps;
