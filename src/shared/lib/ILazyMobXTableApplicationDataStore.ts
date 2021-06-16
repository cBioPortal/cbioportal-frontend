import { SortMetric } from './ISortMetric';
import { observable, computed, action, makeObservable } from 'mobx';
import {
    Column,
    lazyMobXTableSort,
    NumericalFilterConfig,
} from '../components/lazyMobXTable/LazyMobXTable';
import { SHOW_ALL_PAGE_SIZE as PAGINATION_SHOW_ALL } from 'shared/components/paginationControls/PaginationControls';
import _ from 'lodash';

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
    columnMinMax?: {
        [columnId: string]: {
            min: string;
            max: string;
        };
    };
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
    numericalFilterConfigs?: {
        [columnId: string]: NumericalFilterConfig;
    };
    minMaxColumns?: Set<Column<T>>;
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

    @observable.ref public filterString: string;
    @observable public numericalFilterConfigs: {
        [columnId: string]: NumericalFilterConfig;
    };
    @observable public minMaxColumns: Set<Column<T>>;
    @observable public sortMetric: SortMetric<T> | undefined;
    @observable public sortAscending: boolean | undefined;
    @observable public page: number;
    @observable public itemsPerPage: number;

    protected getSortedData?: () => T[]; // optional, allows overriding by extending classes
    protected getSortedFilteredData?: () => T[]; // optional, allows overriding by extending classes
    protected getTableData?: () => T[]; // optional, allows overriding by extending classes

    @computed get columnMinMax() {
        let minMax: { [columnId: string]: { min: string; max: string } } = {};
        for (let column of this.minMaxColumns) {
            let minText = '0';
            let maxText = '100';

            if (column.sortBy) {
                let min = Infinity;
                let max = -Infinity;
                let dMin, dMax;

                for (let i = 0; i < this.allData.length; i++) {
                    const d = this.allData[i];
                    const val = column.sortBy(d);
                    if (val !== null) {
                        if (+val < min) {
                            min = +val;
                            dMin = d;
                        }
                        if (+val > max) {
                            max = +val;
                            dMax = d;
                        }
                    }
                }

                if (column.download && dMin && dMax) {
                    minText = _.flatten([column.download(dMin)])[0];
                    maxText = _.flatten([column.download(dMax)])[0];
                } else {
                    minText = '' + min;
                    maxText = '' + max;
                }
            }

            minMax[column.name] = { min: minText, max: maxText };
        }
        return minMax;
    }

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
        this.numericalFilterConfigs = {};
    }

    public isHighlighted(d: T) {
        return this.dataHighlighter(d);
    }

    constructor(private getData: () => T[]) {
        this.filterString = '';
        this.numericalFilterConfigs = {};
        this.minMaxColumns = new Set();
        this.dataHighlighter = () => false;
        this.dataSelector = () => false;
        this.dataFilter = () => true;
        makeObservable<
            SimpleGetterLazyMobXTableApplicationDataStore<T>,
            'dataFilter' | 'dataSelector'
        >(this);
    }
}

export class SimpleLazyMobXTableApplicationDataStore<
    T
> extends SimpleGetterLazyMobXTableApplicationDataStore<T> {
    constructor(data: T[]) {
        super(() => data);
    }
}
