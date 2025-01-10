import { CBioPortalAPIInternal } from 'cbioportal-ts-api-client';
import { getLoadConfig, getServerConfig } from 'config/config';
import _ from 'lodash';

// function proxyFederated(client: any, endpoint: string) {
//     const methodName = `${endpoint}UsingPOSTWithHttpInfo`;
//     const oldMethod = client[methodName];

//     client[methodName] = function(params: any) {
//         const host = getLoadConfig().baseUrl;

//         const oldRequest = this.request;

//         params.$domain = `//${host}/api-fed`;
//         const url = oldRequest.apply(this, [params]);

//         this.request = oldRequest;

//         return url;
//     };
// }

function constructResponse(value: any) {
    return {
        status: 200,
        ok: true,
        text: JSON.stringify(value),
        body: value,
    };
}

function stubFederated(client: any, endpoint: string, value: any) {
    const methodName = `${endpoint}UsingPOSTWithHttpInfo`;

    client[methodName] = function(params: any) {
        console.log(`${methodName} called, stubbing out value: ${value}`);
        return Promise.resolve(constructResponse(value));
    };
}

const internalClient = new CBioPortalAPIInternal();

const federatedInternalClient = new CBioPortalAPIInternal();

const oldRequest = (federatedInternalClient as any).request;
(federatedInternalClient as any).request = function(...args: any) {
    args[1] = args[1].replace(/\/api\//, '/api-fed/');
    return oldRequest.apply(this, args);
};

// proxyFederated(federatedClient, 'fetchClinicalDataCounts');
// proxyFederated(federatedClient, 'fetchClinicalDataBinCounts');

stubFederated(federatedInternalClient, 'getClinicalEventTypeCounts', []);
stubFederated(federatedInternalClient, 'getContainsSampleTreatmentData', false);
stubFederated(federatedInternalClient, 'getContainsTreatmentData', false);
// this needs to have at least 1 sample for the dash pg to render
stubFederated(federatedInternalClient, 'fetchFilteredSamples', [
    {
        uniqueSampleKey: 'UC0wMDAwMDEyLVQwMi1JTTM6bXNrX2Nob3JkXzIwMjQ',
        uniquePatientKey: 'UC0wMDAwMDEyOm1za19jaG9yZF8yMDI0',
        sampleId: 'P-0000012-T02-IM3',
        patientId: 'P-0000012',
        studyId: 'federated_data',
    },
]);
stubFederated(
    federatedInternalClient,
    'fetchAlterationDriverAnnotationReport',
    []
);
stubFederated(federatedInternalClient, 'fetchMolecularProfileSampleCounts', []);
stubFederated(federatedInternalClient, 'fetchCaseListCounts', []);
stubFederated(federatedInternalClient, 'fetchClinicalDataDensityPlot', []);

export default internalClient;

export { federatedInternalClient };

export function getInternalClient(name: string) {
    if (name === 'base') {
        return internalClient;
    } else if (name === 'federated') {
        return federatedInternalClient;
    } else {
        throw new Error('unrecognized client name');
    }
}
