export interface ILazyMobXTableApplicationLazyDownloadDataFetcher<T = any> {
    // fetch and cache all lazy the data (from API) required for download
    fetchAndCacheAllLazyData: () => Promise<T[]>;
}
