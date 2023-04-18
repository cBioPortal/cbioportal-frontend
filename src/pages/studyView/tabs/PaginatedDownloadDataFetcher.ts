import { ILazyMobXTableApplicationLazyDownloadDataFetcher } from 'shared/lib/ILazyMobXTableApplicationLazyDownloadDataFetcher';
import { TablePaginationStore } from 'shared/components/lazyMobXTable/TablePaginationStore';
import { computed, makeObservable } from 'mobx';
import { TablePaginationStoreAdaptor } from 'shared/components/lazyMobXTable/TablePaginationStoreAdaptor';
import { onMobxPromise } from 'cbioportal-frontend-commons';
import { TablePaginationParams } from 'shared/components/lazyMobXTable/TablePaginationParams';

export default class PaginatedDownloadDataFetcher<T>
    implements ILazyMobXTableApplicationLazyDownloadDataFetcher {
    /**
     * Use pageStore to download paginated
     */
    private pageStore: TablePaginationStore<T>;

    /**
     * Store downloaded data in dataStore
     */
    private dataStore: TablePaginationStoreAdaptor<T>;

    constructor(
        pageStore: TablePaginationStore<T>,
        pageParams: TablePaginationParams,
        dataStore: TablePaginationStoreAdaptor<T>
    ) {
        this.pageStore = pageStore;
        this.dataStore = dataStore;
        this.setPageParams(this.pageStore, pageParams);
        makeObservable(this);
    }

    @computed get totalItems(): number | undefined {
        return this.pageStore.totalItems;
    }

    fetchAndCacheAllLazyData(): Promise<T[]> {
        if (this.dataStore.downloadedData) {
            return Promise.resolve(this.dataStore.downloadedData);
        }
        return new Promise<T[]>(resolve => {
            // Fetch first page to know totalItems:
            onMobxPromise(this.pageStore.pageItems, () => {
                this.pageStore.moreItemsPerPage = this.pageStore.totalItems;
                // Fetch all items:
                onMobxPromise(this.pageStore.pageItems, data => {
                    this.dataStore.downloadedData = data;
                    resolve(data);
                });
            });
        });
    }

    private setPageParams(
        pageStore: TablePaginationStore<T>,
        pageParams: TablePaginationParams
    ) {
        pageStore.pageSize = pageParams.pageSize;
        pageStore.pageNumber = pageParams.pageNumber;
        pageStore.sortParam = pageParams.sortParam;
        pageStore.direction = pageParams.direction;
    }
}
