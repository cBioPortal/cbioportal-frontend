import { CBioPortalAPIInternal } from 'cbioportal-ts-api-client';
import { getLoadConfig } from 'config/config';
import { getBrowserWindow } from 'cbioportal-frontend-commons';
import { toJS } from 'mobx';
import { validate } from 'shared/api/validation';
import _ from 'lodash';
import { makeTest } from 'shared/api/testMaker';

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
            'MutationDataCounts',
            'GenomicDataCounts',
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

                setTimeout(() => {
                    makeTest(params, url);
                }, 1000);

                // validate(url, params, matchedMethod[0]).then((result)=>{
                //
                //     !result.status && console.group(`${result.label} failed :(`);
                //
                //     !result.status &&
                //     console.log({
                //         url,
                //         legacyDuration: result.legacyDuration,
                //         chDuration: result.chDuration,
                //         equal: result.status,
                //     });
                //
                //     result.status &&
                //     console.log(
                //         `${result.label} passed :) ch: ${result.chDuration.toFixed(
                //             0
                //         )} legacy: ${result.legacyDuration.toFixed(0)}`
                //     );
                //
                //     if (!result.status) {
                //         _.forEach(result.clDataSorted, (cl: any, i: number) => {
                //             if (
                //                 JSON.stringify(cl) !==
                //                 JSON.stringify(result.legacyDataSorted[i])
                //             ) {
                //                 console.log(
                //                     `First invalid item (${result.label})`,
                //                     'Clickhouse:',
                //                     cl,
                //                     'Legacy:',
                //                     result.legacyDataSorted[i]
                //                 );
                //                 return false;
                //             }
                //         });
                //         console.log('legacy', result.legacyDataSorted);
                //         console.log('CH', result.clDataSorted);
                //     }
                //
                //     !result.status && console.groupEnd();
                //
                // });
                //
                //
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
proxyColumnStore(internalClientColumnStore, 'fetchClinicalDataDensityPlot');
proxyColumnStore(internalClientColumnStore, 'getClinicalEventTypeCounts');
proxyColumnStore(internalClientColumnStore, 'fetchMutationDataCounts');
proxyColumnStore(internalClientColumnStore, 'fetchGenomicDataCounts');

export default internalClient;

export function getInteralClient() {
    return internalClientColumnStore;
}
