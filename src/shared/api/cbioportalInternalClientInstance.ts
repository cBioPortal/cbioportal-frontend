import { CBioPortalAPIInternal } from 'cbioportal-ts-api-client';
import { getLoadConfig } from 'config/config';

function proxyColumnStore(client: any, endpoint: string) {
    const method = `${endpoint}UsingPOSTWithHttpInfo`;
    const old = client[method];
    client[method] = function(params: any) {
        params.$domain = `//${getLoadConfig().baseUrl}/api/column-store`;
        const url = old.apply(this, [params]);
        return url;
    };
}

const internalClient = new CBioPortalAPIInternal();

export const internalClientColumnStore = new CBioPortalAPIInternal();

proxyColumnStore(internalClientColumnStore, 'fetchMutatedGenes');
proxyColumnStore(internalClientColumnStore, 'fetchFilteredSamples');
proxyColumnStore(internalClientColumnStore, 'fetchClinicalDataCounts');
proxyColumnStore(internalClientColumnStore, 'fetchClinicalDataBinCounts');

export default internalClient;
