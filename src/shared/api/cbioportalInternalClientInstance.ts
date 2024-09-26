import { CBioPortalAPIInternal } from 'cbioportal-ts-api-client';
import { getLoadConfig } from 'config/config';
import { getBrowserWindow, hashString } from 'cbioportal-frontend-commons';
import { toJS } from 'mobx';
import { reportValidationResult, validate } from 'shared/api/validation';
import _ from 'lodash';
import { makeTest, urlChopper } from 'shared/api/testMaker';

// function invokeValidation(func){
//     getBrowserWindow().invokeCache = getBrowserWindow().invokeCache || [];
//
//     getBrowserWindow().invokeCache.push(func);
//
//
//
// }

function proxyColumnStore(client: any, endpoint: string) {
    if (getBrowserWindow().location.search.includes('legacy')) {
        return;
    }

    const method = endpoint.match(
        new RegExp('fetchPatientTreatmentCounts|fetchSampleTreatmentCounts')
    )
        ? `${endpoint}UsingWithHttpInfo`
        : `${endpoint}UsingPOSTWithHttpInfo`;
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
            'PatientTreatmentCounts',
            'SampleTreatmentCounts',
            'GenomicData',
            'GenericAssay',
        ];

        const matchedMethod = method.match(new RegExp(endpoints.join('|')));
        if (localStorage.getItem('LIVE_VALIDATE_KEY') && matchedMethod) {
            this.request = function(...origArgs: any[]) {
                const params = toJS(arguments[2]);

                const oldSuccess = arguments[7];

                arguments[7] = function() {
                    const url =
                        origArgs[1].replace(
                            /column-store\/api/,
                            'column-store'
                        ) +
                        '?' +
                        _.map(origArgs[4], (v, k) => `${k}=${v}&`).join('');

                    setTimeout(() => {
                        makeTest(params, urlChopper(url), matchedMethod[0]);
                    }, 1000);

                    const hash = hashString(
                        JSON.stringify({ data: params, url: urlChopper(url) })
                    );
                    validate(
                        $.ajax,
                        url,
                        params,
                        matchedMethod[0],
                        hash,
                        arguments[0].body,
                        arguments[0].xhr.getResponseHeader('elapsed-time')
                    ).then((result: any) => {
                        reportValidationResult(result, 'LIVE');
                    });

                    return oldSuccess.apply(this, arguments);
                };

                oldRequest.apply(this, arguments);
            };
        }

        params.$domain = method.match(
            new RegExp('PatientTreatmentCounts|SampleTreatmentCounts')
        )
            ? `//${host}`
            : `//${host}/api/column-store`;
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
proxyColumnStore(internalClientColumnStore, 'fetchGenomicDataBinCounts');
proxyColumnStore(internalClientColumnStore, 'fetchGenericAssayDataBinCounts');
proxyColumnStore(internalClientColumnStore, 'fetchGenericAssayDataCounts');

export default internalClient;

export function getInteralClient() {
    return internalClientColumnStore;
}
