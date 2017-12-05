export interface IMobXApplicationDataDownloadStore {
    // load all the data (from API) required for download
    loadAllData: () => Promise<boolean>;
}