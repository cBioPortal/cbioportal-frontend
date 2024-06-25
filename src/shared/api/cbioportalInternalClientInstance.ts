import { CBioPortalAPIInternal } from 'cbioportal-ts-api-client';
import { getLoadConfig } from 'config/config';
import { getBrowserWindow } from 'cbioportal-frontend-commons';

function proxyColumnStore(client: any, endpoint: string) {
    if (getBrowserWindow().location.search.includes('legacy')) {
        return;
    }

    const method = `${endpoint}UsingPOSTWithHttpInfo`;
    const old = client[method];

    client[method] = function(params: any) {
        const host =
            getBrowserWindow().location.hostname ===
            'genie-public-beta.cbioportal.org'
                ? 'genie-public-beta1.cbioportal.org'
                : getLoadConfig().baseUrl;

        params.$domain = `//${host}/api/column-store`;
        const url = old.apply(this, [params]);
        return url;
    };
}

const internalClient = new CBioPortalAPIInternal();

export const internalClientColumnStore = new CBioPortalAPIInternal();

const oldRequest = (internalClientColumnStore as any).request;
(internalClientColumnStore as any).request = function(...args: any) {
    args[1] = args[1].replace(/column-store\/api/, 'column-store');
    return oldRequest.apply(this, args);
};

proxyColumnStore(internalClientColumnStore, 'fetchCNAGenes');
proxyColumnStore(internalClientColumnStore, 'fetchStructuralVariantGenes');
proxyColumnStore(internalClientColumnStore, 'fetchCaseListCounts');
proxyColumnStore(
    internalClientColumnStore,
    'fetchMolecularProfileSampleCounts'
);
proxyColumnStore(internalClientColumnStore, 'fetchMutatedGenes');
proxyColumnStore(internalClientColumnStore, 'fetchFilteredSamples');
proxyColumnStore(internalClientColumnStore, 'fetchClinicalDataCounts');
proxyColumnStore(internalClientColumnStore, 'fetchClinicalDataBinCounts');
proxyColumnStore(internalClientColumnStore, 'fetchClinicalDataDensityPlot');
proxyColumnStore(internalClientColumnStore, 'fetchClinicalDataViolinPlots');

export default internalClient;
