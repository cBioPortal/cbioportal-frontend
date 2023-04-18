import { action, computed, makeObservable, observable } from 'mobx';
import { SortMetric } from 'shared/lib/ISortMetric';
import {
    DataFilterFunction,
    getSortedData,
    getSortedFilteredData,
    getTableData,
    ILazyMobXTableApplicationDataStore,
} from 'shared/lib/ILazyMobXTableApplicationDataStore';
import { TablePaginationStore } from 'shared/components/lazyMobXTable/TablePaginationStore';

/**
 * Wrapper around ${@link TablePaginationStore}
 * for paginated data loading in ${@link LazyMobXTable}s
 */
export class TablePaginationStoreAdaptor<T>
    implements ILazyMobXTableApplicationDataStore<T> {
    private pageStore: TablePaginationStore<T>;

    @observable protected dataFilter: DataFilterFunction<T>;
    @observable protected dataSelector: (d: T) => boolean;
    @observable public dataHighlighter: (d: T) => boolean;
    @observable public downloadedData: T[];
    @observable public sortMetric: SortMetric<T> | undefined;
    @observable public sortColumn: string | undefined;

    constructor(pageStore: TablePaginationStore<T>) {
        this.pageStore = pageStore;
        this.filterString = '';
        this.dataHighlighter = () => false;
        this.dataSelector = () => false;
        this.dataFilter = () => true;
        makeObservable<
            TablePaginationStoreAdaptor<T>,
            'dataFilter' | 'dataSelector'
        >(this);
    }

    @computed get allData() {
        if (!this.pageStore.pageItems.result) {
            return [];
        }
        return this.pageStore.pageItems.result;
    }

    @computed get sortParam() {
        return this.pageStore.sortParam;
    }

    set sortParam(sortParam: string | undefined) {
        this.pageStore.sortParam = sortParam;
    }

    @computed get page() {
        return this.pageStore.pageNumber;
    }

    set page(page: number) {
        this.pageStore.pageNumber = page;
    }

    @computed get itemsPerPage() {
        return this.pageStore.pageSize;
    }

    set itemsPerPage(itemsPerPage: number) {
        this.pageStore.pageSize = itemsPerPage;
    }

    @computed get direction() {
        return this.pageStore.direction;
    }

    set direction(newDirection) {
        this.pageStore.direction = newDirection;
    }

    @computed get sortAscending(): boolean {
        return this.pageStore.direction === 'ASC';
    }

    set sortAscending(isAscending: boolean) {
        this.pageStore.direction = isAscending ? 'ASC' : 'DESC';
    }

    @computed get filterString(): string {
        return this.pageStore.searchTerm || '';
    }

    set filterString(newFilterString: string) {
        this.pageStore.searchTerm = newFilterString;
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
        return this.tableData;
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

    @computed get isFirstPage() {
        return this.pageStore.isFirst;
    }

    @computed get isLastPage() {
        return this.pageStore.isLast;
    }

    @computed get totalItems() {
        return this.pageStore.totalItems;
    }

    @observable initialFilterTextSet: boolean;

    @computed get moreItemsPerPage(): number | undefined {
        return this.pageStore.moreItemsPerPage;
    }
    set moreItemsPerPage(newSize: number | undefined) {
        this.pageStore.moreItemsPerPage = newSize;
    }

    @computed get sortedDownloadedData(): T[] {
        return getSortedData(
            this.downloadedData,
            this.sortMetric,
            this.sortAscending
        );
    }
}
