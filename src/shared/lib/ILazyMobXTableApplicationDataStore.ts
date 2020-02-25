import { SortMetric } from './ISortMetric';
import { observable, computed, action } from 'mobx';
import { lazyMobXTableSort } from '../components/lazyMobXTable/LazyMobXTable';
import { SHOW_ALL_PAGE_SIZE as PAGINATION_SHOW_ALL } from 'shared/components/paginationControls/PaginationControls';

export interface ILazyMobXTableApplicationDataStore<T> {
    // setter
    setFilter: (
        fn: (
            d: T,
            filterString?: string,
            filterStringUpper?: string,
            filterStringLower?: string
        ) => boolean
    ) => void;

    // mobX computed getters
    allData: T[];
    sortedData: T[];
    sortedFilteredData: T[];
    sortedFilteredSelectedData: T[];
    tableData: T[];
    visibleData: T[];

    // exposed methods for interacting with data
    isHighlighted: (d: T) => boolean;

    // mobX observable public properties (note you can still implement with getter and setter)
    filterString: string;
    sortAscending: boolean | undefined;
    sortMetric: SortMetric<T> | undefined;
    itemsPerPage: number;
    page: number;
}

export type DataFilterFunction<T> = (
    d: T,
    filterString?: string,
    filterStringUpper?: string,
    filterStringLower?: string
) => boolean;

// if not defined, use default values for sortMetric and sortAscending
export function getSortedData<T>(
    data: T[],
    sortMetric: SortMetric<T> = () => 0,
    sortAscending: boolean | undefined
): T[] {
    const ascending = sortAscending !== undefined ? sortAscending : true;

    return lazyMobXTableSort(data, sortMetric, ascending);
}

export function getSortedFilteredData<T>(
    sortedData: T[],
    filterString: string,
    dataFilter: DataFilterFunction<T>
): T[] {
    const filterStringUpper = filterString.toUpperCase();
    const filterStringLower = filterString.toLowerCase();
    return sortedData.filter((d: T) =>
        dataFilter(d, filterString, filterStringUpper, filterStringLower)
    );
}

export function getVisibileData<T>(
    tableData: T[],
    itemsPerPage: number,
    page: number
): T[] {
    if (itemsPerPage === PAGINATION_SHOW_ALL) {
        return tableData;
    } else {
        return tableData.slice(page * itemsPerPage, (page + 1) * itemsPerPage);
    }
}

export function getTableData<T>(
    sortedFilteredData: T[],
    sortedFilteredSelectedData: T[]
): T[] {
    if (sortedFilteredSelectedData.length) {
        return sortedFilteredSelectedData;
    } else {
        return sortedFilteredData;
    }
}

export class SimpleGetterLazyMobXTableApplicationDataStore<T>
    implements ILazyMobXTableApplicationDataStore<T> {
    @observable protected dataFilter: DataFilterFunction<T>;
    @observable protected dataSelector: (d: T) => boolean;
    @observable public dataHighlighter: (d: T) => boolean;

    @observable public filterString: string;
    @observable public sortMetric: SortMetric<T> | undefined;
    @observable public sortAscending: boolean | undefined;
    @observable public page: number;
    @observable public itemsPerPage: number;

    @computed get allData() {
        return this.getData();
    }
    @computed get sortedData() {
        return getSortedData(this.allData, this.sortMetric, this.sortAscending);
    }

    @computed get sortedFilteredData() {
        return getSortedFilteredData(
            this.sortedData,
            this.filterString,
            this.dataFilter
        );
    }

    @computed get sortedFilteredSelectedData() {
        return this.sortedFilteredData.filter(this.dataSelector);
    }

    @computed get tableData() {
        return getTableData(
            this.sortedFilteredData,
            this.sortedFilteredSelectedData
        );
    }

    @computed get visibleData(): T[] {
        return getVisibileData(this.tableData, this.itemsPerPage, this.page);
    }

    @computed get showingAllData() {
        return this.tableData.length === this.allData.length;
    }

    @action public setFilter(
        fn: (
            d: T,
            filterString?: string,
            filterStringUpper?: string,
            filterStringLower?: string
        ) => boolean
    ) {
        this.dataFilter = fn;
    }

    public getFilter() {
        return this.dataFilter;
    }

    @action public resetFilter() {
        this.dataFilter = () => true;
        this.filterString = '';
    }

    public isHighlighted(d: T) {
        return this.dataHighlighter(d);
    }

    constructor(private getData: () => T[]) {
        this.filterString = '';
        this.dataHighlighter = () => false;
        this.dataSelector = () => false;
        this.dataFilter = () => true;
    }
}

export class SimpleLazyMobXTableApplicationDataStore<
    T
> extends SimpleGetterLazyMobXTableApplicationDataStore<T> {
    constructor(data: T[]) {
        super(() => data);
    }
}
