import { CBioPortalAPIInternal } from 'cbioportal-ts-api-client';
import { getLoadConfig } from 'config/config';
import { getBrowserWindow } from 'cbioportal-frontend-commons';
import { toJS } from 'mobx';
import { validate } from 'shared/api/validation';
import _ from 'lodash';

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

        const oldRequest = this.request;

        const endpoints = [
            'ClinicalDataCounts',
            'MutatedGenes',
            'CaseList',
            'ClinicalDataBin',
            'MolecularProfileSample',
            'CNAGenes',
            'StructuralVariantGenes',
            'FilteredSamples',
            'ClinicalDataDensity',
        ];

        const matchedMethod = method.match(new RegExp(endpoints.join('|')));
        if (localStorage.validateClickhouse && matchedMethod) {
            this.request = function() {
                const params = toJS(arguments[2]);

                oldRequest.apply(this, arguments);

                const url =
                    arguments[1].replace(/column-store\/api/, 'column-store') +
                    '?' +
                    _.map(arguments[4], (v, k) => `${k}=${v}&`).join('');

                validate(url, params, matchedMethod[0]);
            };
        }

        params.$domain = `//${host}/api/column-store`;
        const url = old.apply(this, [params]);

        this.request = oldRequest;

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
proxyColumnStore(internalClientColumnStore, 'fetchMutationDataCounts');
proxyColumnStore(internalClientColumnStore, 'fetchPatientTreatmentCounts');
proxyColumnStore(internalClientColumnStore, 'fetchSampleTreatmentCounts');

export default internalClient;
