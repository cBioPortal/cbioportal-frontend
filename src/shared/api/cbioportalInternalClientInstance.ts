import { CBioPortalAPIInternal } from 'cbioportal-ts-api-client';

function proxyColumnStore(client: any, endpoint: string) {
    const method = `${endpoint}UsingPOSTWithHttpInfo`;
    const old = client[method];
    client[method] = function(params: any) {
        params.$domain = `http://localhost:8080/cbioportal_war/api/column-store`;
        const url = old.apply(this, [params]);
        return url;
    };
}

const internalClient = new CBioPortalAPIInternal();

export const internalClientColumnStore = new CBioPortalAPIInternal();

proxyColumnStore(internalClientColumnStore, 'fetchMutatedGenes');
proxyColumnStore(internalClientColumnStore, 'fetchFilteredSamples');

export default internalClient;
