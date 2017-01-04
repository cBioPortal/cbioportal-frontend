import {IColumnFormatter, IColumnSortFunction, IColumnFilterFunction, IColumnVisibilityFunction, ColumnVisibility}
    from "./IColumnFormatterProps";

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
    formatter?: IColumnFormatter;
    sortable?: IColumnSortFunction | boolean;
    filterable?: IColumnFilterFunction | boolean;
    visible?: IColumnVisibilityFunction | ColumnVisibility;
    dataField?: string;
}

export default IEnhancedReactTableProps;
