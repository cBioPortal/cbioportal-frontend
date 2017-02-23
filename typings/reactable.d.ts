declare module 'reactable' {

    interface IntrinsicElementProps {
        table: React.HTMLProps<HTMLTableElement>;
        td: React.HTMLProps<HTMLTableDataCellElement>;
        tfoot: React.HTMLProps<HTMLTableSectionElement>;
        th: React.HTMLProps<HTMLTableHeaderCellElement>;
        thead: React.HTMLProps<HTMLTableSectionElement>;
        tr: React.HTMLProps<HTMLTableRowElement>;
    }

    export interface IColumnSortFunction {
        (a:any, b:any):number;
    }

    export interface IColumnFilterFunction {
        (contents:string, filter:string):boolean;
    }

    export type IColumnFilter = {
        column: string;
        filterFunction: IColumnFilterFunction;
    };

    export type ISortDirection = -1 | 1 | 'desc' | 'asc';

    export type ICurrentSort = {
        column: string,
        direction: ISortDirection
    }

    export type TableProps = IntrinsicElementProps['table'] & {
        data?: any,
        sortBy?: boolean,
        defaultSort?: string | ICurrentSort,
        defaultSortDescending?: boolean,
        itemsPerPage?: number,
        filterBy?: string,
        hideFilterInput?: boolean,
        pageButtonLimit?: number,
        noDataText?: React.ReactChild,
        filterClassName?: string,
        onFilter?: (filter?: string) => void,
        currentPage?: number,
        hideTableHeader?: boolean,
        sortable?: true | Array< string | { column: string, sortFunction?: IColumnSortFunction } >,
        onPageChange?: (page: number) => void,
        onSort?: (currentSort: ICurrentSort) => void,
        columns?: Array< string | { key: string, label: string, sortable?: true | IColumnSortFunction } >,
        filterable?: Array< string | { column: string, filterFunction?: IColumnFilterFunction } >,
        filterPlaceholder?: string,
        previousPageLabel?: React.ReactChild,
        nextPageLabel?: React.ReactChild,
    }

    export type TdProps = IntrinsicElementProps['td'] & {
        column: string;
        value?: any;
    }

    export type TfootProps = IntrinsicElementProps['tfoot'] & {
    }

    export type ThProps = IntrinsicElementProps['th'] & {
        column: string;
    }

    export type TheadProps = IntrinsicElementProps['thead'] & {
    }

    export type TrProps = IntrinsicElementProps['tr'] & {
        rowData?: any;
    }

    export var Table:React.ComponentClass<TableProps>;
    export var Td:React.ComponentClass<TdProps>;
    export var Tfoot:React.ComponentClass<TheadProps>;
    export var Th:React.ComponentClass<ThProps>;
    export var Thead:React.ComponentClass<TheadProps>;
    export var Tr:React.ComponentClass<TrProps>;
}
