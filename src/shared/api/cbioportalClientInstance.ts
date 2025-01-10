import { CBioPortalAPI } from 'cbioportal-ts-api-client';
import { getLoadConfig, getServerConfig } from 'config/config';
import _ from 'lodash';

// function proxyFederated(client: any, endpoint: string) {
//     const method = `${endpoint}UsingPOSTWithHttpInfo`;
//     const old = client[method];

//     client[method] = function(params: any) {
//         const host = getLoadConfig().baseUrl;

//         const oldRequest = this.request;

//         params.$domain = `//${host}/api-fed`;
//         const url = old.apply(this, [params]);

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

function stubFederated(cli: any, endpoint: string, value: any) {
    let methodName = `${endpoint}UsingPOSTWithHttpInfo`;
    if (typeof cli[methodName] !== 'function') {
        methodName = `${endpoint}UsingGET`;
    }

    cli[methodName] = function(params: any) {
        return Promise.resolve(constructResponse(value));
    };
}

const client = new CBioPortalAPI();

const federatedClient = new CBioPortalAPI();

const oldRequest = (federatedClient as any).request;
(federatedClient as any).request = function(...args: any) {
    args[1] = args[1].replace(/\/api\//, '/api-fed/');
    return oldRequest.apply(this, args);
};

// proxyFederated(federatedClient, 'fetchClinicalAttributes');

// TODO this is needed currently as a stub for the federated data
stubFederated(federatedClient, 'getAllStudies', {
    name: 'Federated Data (STUB)',
    description: 'Fake study ID for federated data',
    publicStudy: true,
    groups: 'PUBLIC',
    studyId: 'federated_data',
    cancerTypeId: 'mixed',
    referenceGenome: 'hg19',
});
stubFederated(federatedClient, 'fetchMolecularProfiles', []);
stubFederated(federatedClient, 'fetchClinicalData', []);

export default client;

export { federatedClient };

export function getClient(name: string) {
    if (name === 'base') {
        return client;
    } else if (name === 'federated') {
        return federatedClient;
    } else {
        throw new Error('unrecognized client name');
    }
}
