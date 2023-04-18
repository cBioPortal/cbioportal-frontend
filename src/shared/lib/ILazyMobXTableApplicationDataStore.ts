import { SortMetric } from './ISortMetric';
import { action, computed, makeObservable, observable } from 'mobx';
import { lazyMobXTableSort } from '../components/lazyMobXTable/LazyMobXTable';
import { SHOW_ALL_PAGE_SIZE as PAGINATION_SHOW_ALL } from 'shared/components/paginationControls/PaginationControls';
import { isFirstPage, isLastPage } from 'pages/studyView/StudyViewUtils';
import _ from 'lodash';

export interface ILazyMobXTableApplicationDataStore<T> {
    initialFilterTextSet: boolean;
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
    sortedDownloadedData: T[];
    tableData: T[];
    visibleData: T[];

    // exposed methods for interacting with data
    isHighlighted: (d: T) => boolean;

    // mobX observable public properties (note you can still implement with getter and setter)
    filterString: string;
    sortAscending: boolean;
    sortMetric: SortMetric<T> | undefined;

    /**
     * Query param sent to backend
     */
    sortParam: string | undefined;

    /**
     * Column header name
     */
    sortColumn: string | undefined;

    itemsPerPage: number;
    moreItemsPerPage: number | undefined;
    page: number;
    totalItems: number;
    isLastPage: boolean;
    isFirstPage: boolean;
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
    page: number,
    moreItemsPerPage: number | undefined
): T[] {
    if (itemsPerPage === PAGINATION_SHOW_ALL) {
        return tableData;
    } else {
        const pageStart = page * itemsPerPage;
        const pageSize = moreItemsPerPage ? moreItemsPerPage : itemsPerPage;
        const pageEnd = (page + 1) * pageSize;
        return tableData.slice(pageStart, pageEnd);
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

    @observable.ref public filterString: string;
    @observable public sortMetric: SortMetric<T> | undefined;
    @observable public sortAscending: boolean;
    @observable public page: number;
    @observable public itemsPerPage: number;
    @observable public moreItemsPerPage: number;

    @observable public sortParam: string | undefined;
    @observable public sortColumn: string | undefined;

    protected getSortedData?: () => T[]; // optional, allows overriding by extending classes
    protected getSortedFilteredData?: () => T[]; // optional, allows overriding by extending classes
    protected getTableData?: () => T[]; // optional, allows overriding by extending classes

    @computed get allData() {
        return this.getData();
    }

    @computed get sortedData() {
        if (!this.getSortedData) {
            return getSortedData(
                this.allData,
                this.sortMetric,
                this.sortAscending
            );
        } else {
            return this.getSortedData();
        }
    }

    @computed get sortedDownloadedData() {
        return this.sortedData;
    }

    @computed get sortedFilteredData() {
        if (!this.getSortedFilteredData) {
            return getSortedFilteredData(
                this.sortedData,
                this.filterString,
                this.dataFilter
            );
        } else {
            return this.getSortedFilteredData();
        }
    }

    @computed get sortedFilteredSelectedData() {
        return this.sortedFilteredData.filter(this.dataSelector);
    }

    @computed get tableData() {
        if (!this.getTableData) {
            return getTableData(
                this.sortedFilteredData,
                this.sortedFilteredSelectedData
            );
        } else {
            return this.getTableData();
        }
    }

    @computed get visibleData(): T[] {
        return getVisibileData(
            this.tableData,
            this.itemsPerPage,
            this.page,
            this.moreItemsPerPage
        );
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
        makeObservable<
            SimpleGetterLazyMobXTableApplicationDataStore<T>,
            'dataFilter' | 'dataSelector'
        >(this);
    }

    @computed get totalItems() {
        return this.allData.length;
    }

    @computed get isLastPage() {
        return isLastPage(
            this.page,
            this.itemsPerPage,
            this.totalItems,
            this.moreItemsPerPage
        );
    }
    @computed get isFirstPage() {
        return isFirstPage(this.page);
    }

    @observable initialFilterTextSet: boolean;
}

export class SimpleLazyMobXTableApplicationDataStore<
    T
> extends SimpleGetterLazyMobXTableApplicationDataStore<T> {
    constructor(data: T[]) {
        super(() => data);
    }
}
