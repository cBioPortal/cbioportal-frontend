import * as request from "superagent";
import {
    SuperAgentStatic
}
from "superagent";

type CallbackHandler = (err: any, res ? : request.Response) => void;
export type VariantCountIdentifier = {
    'entrezGeneId': number

        'keyword': string

};
export type CosmicMutation = {
    'cosmicMutationId': string

        'count': number

        'keyword': string

        'proteinChange': string

};
export type VariantCount = {
    'entrezGeneId': number

        'geneticProfileId': string

        'keyword': string

        'numberOfSamples': number

        'numberOfSamplesWithKeyword': number

        'numberOfSamplesWithMutationInGene': number

};
export type MrnaPercentile = {
    'entrezGeneId': number

        'geneticProfileId': string

        'percentile': number

        'sampleId': string

        'zScore': number

};
export type MutSig = {
    'entrezGeneId': number

        'hugoGeneSymbol': string

        'numberOfMutations': number

        'pValue': number

        'qValue': number

        'rank': number

        'studyId': string

};

/**
 * A web service for supplying JSON formatted data to cBioPortal clients.
 * @class CBioPortalAPIInternal
 * @param {(string)} [domainOrOptions] - The project domain.
 */
export default class CBioPortalAPIInternal {

    private domain: string = "";
    private errorHandlers: CallbackHandler[] = [];

    constructor(domain ? : string) {
        if (domain) {
            this.domain = domain;
        }
    }

    getDomain() {
        return this.domain;
    }

    addErrorHandler(handler: CallbackHandler) {
        this.errorHandlers.push(handler);
    }

    private request(method: string, url: string, body: any, headers: any, queryParameters: any, form: any, reject: CallbackHandler, resolve: CallbackHandler, errorHandlers: CallbackHandler[]) {
        let req = (new(request as any).Request(method, url) as request.Request)
            .query(queryParameters);
        Object.keys(headers).forEach(key => {
            req.set(key, headers[key]);
        });

        if (body) {
            req.send(body);
        }

        if (typeof(body) === 'object' && !(body.constructor.name === 'Buffer')) {
            req.set('Content-Type', 'application/json');
        }

        if (Object.keys(form).length > 0) {
            req.type('form');
            req.send(form);
        }

        req.end((error, response) => {
            if (error || !response.ok) {
                reject(error);
                errorHandlers.forEach(handler => handler(error));
            } else {
                resolve(response);
            }
        });
    }

    fetchCosmicCountsUsingPOSTURL(parameters: {
        'keywords': Array < string > | string

        ,
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/cosmic-counts/fetch';

        if (parameters.$queryParameters) {
            Object.keys(parameters.$queryParameters).forEach(function(parameterName) {
                var parameter = parameters.$queryParameters[parameterName];
                queryParameters[parameterName] = parameter;
            });
        }
        let keys = Object.keys(queryParameters);
        return this.domain + path + (keys.length > 0 ? '?' + (keys.map(key => key + '=' + encodeURIComponent(queryParameters[key])).join('&')) : '');
    };

    /**
     * Get counts within the COSMIC database by keywords
     * @method
     * @name CBioPortalAPIInternal#fetchCosmicCountsUsingPOST
     * @param {} keywords - List of keywords
     */
    fetchCosmicCountsUsingPOST(parameters: {
            'keywords': Array < string > | string

            ,
            $queryParameters ? : any,
            $domain ? : string
        }): Promise < Array < CosmicMutation >
        > {
            const domain = parameters.$domain ? parameters.$domain : this.domain;
            const errorHandlers = this.errorHandlers;
            const request = this.request;
            let path = '/cosmic-counts/fetch';
            let body: any;
            let queryParameters: any = {};
            let headers: any = {};
            let form: any = {};
            return new Promise(function(resolve, reject) {
                headers['Accept'] = 'application/json';
                headers['Content-Type'] = 'application/json';

                if (parameters['keywords'] !== undefined) {
                    body = parameters['keywords'];
                }

                if (parameters['keywords'] === undefined) {
                    reject(new Error('Missing required  parameter: keywords'));
                    return;
                }

                if (parameters.$queryParameters) {
                    Object.keys(parameters.$queryParameters).forEach(function(parameterName) {
                        var parameter = parameters.$queryParameters[parameterName];
                        queryParameters[parameterName] = parameter;
                    });
                }

                request('POST', domain + path, body, headers, queryParameters, form, reject, resolve, errorHandlers);

            }).then(function(response: request.Response) {
                return response.body;
            });
        };

    fetchMrnaPercentileUsingPOSTURL(parameters: {
        'geneticProfileId': string,
        'sampleId': string,
        'entrezGeneIds': Array < number > | number

        ,
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/genetic-profiles/{geneticProfileId}/mrna-percentile/fetch';

        path = path.replace('{geneticProfileId}', parameters['geneticProfileId']);
        if (parameters['sampleId'] !== undefined) {
            queryParameters['sampleId'] = parameters['sampleId'];
        }

        if (parameters.$queryParameters) {
            Object.keys(parameters.$queryParameters).forEach(function(parameterName) {
                var parameter = parameters.$queryParameters[parameterName];
                queryParameters[parameterName] = parameter;
            });
        }
        let keys = Object.keys(queryParameters);
        return this.domain + path + (keys.length > 0 ? '?' + (keys.map(key => key + '=' + encodeURIComponent(queryParameters[key])).join('&')) : '');
    };

    /**
     * Get mRNA expression percentiles for list of genes for a sample
     * @method
     * @name CBioPortalAPIInternal#fetchMrnaPercentileUsingPOST
     * @param {string} geneticProfileId - Genetic Profile ID e.g. acc_tcga_rna_seq_v2_mrna
     * @param {string} sampleId - Sample ID e.g. TCGA-OR-A5J2-01
     * @param {} entrezGeneIds - List of Entrez Gene IDs
     */
    fetchMrnaPercentileUsingPOST(parameters: {
            'geneticProfileId': string,
            'sampleId': string,
            'entrezGeneIds': Array < number > | number

            ,
            $queryParameters ? : any,
            $domain ? : string
        }): Promise < Array < MrnaPercentile >
        > {
            const domain = parameters.$domain ? parameters.$domain : this.domain;
            const errorHandlers = this.errorHandlers;
            const request = this.request;
            let path = '/genetic-profiles/{geneticProfileId}/mrna-percentile/fetch';
            let body: any;
            let queryParameters: any = {};
            let headers: any = {};
            let form: any = {};
            return new Promise(function(resolve, reject) {
                headers['Accept'] = 'application/json';
                headers['Content-Type'] = 'application/json';

                path = path.replace('{geneticProfileId}', parameters['geneticProfileId']);

                if (parameters['geneticProfileId'] === undefined) {
                    reject(new Error('Missing required  parameter: geneticProfileId'));
                    return;
                }

                if (parameters['sampleId'] !== undefined) {
                    queryParameters['sampleId'] = parameters['sampleId'];
                }

                if (parameters['sampleId'] === undefined) {
                    reject(new Error('Missing required  parameter: sampleId'));
                    return;
                }

                if (parameters['entrezGeneIds'] !== undefined) {
                    body = parameters['entrezGeneIds'];
                }

                if (parameters['entrezGeneIds'] === undefined) {
                    reject(new Error('Missing required  parameter: entrezGeneIds'));
                    return;
                }

                if (parameters.$queryParameters) {
                    Object.keys(parameters.$queryParameters).forEach(function(parameterName) {
                        var parameter = parameters.$queryParameters[parameterName];
                        queryParameters[parameterName] = parameter;
                    });
                }

                request('POST', domain + path, body, headers, queryParameters, form, reject, resolve, errorHandlers);

            }).then(function(response: request.Response) {
                return response.body;
            });
        };

    getVariantCountsUsingPOSTURL(parameters: {
        'geneticProfileId': string,
        'variantCountIdentifiers': Array < VariantCountIdentifier > | VariantCountIdentifier

        ,
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/genetic-profiles/{geneticProfileId}/variant-counts/fetch';

        path = path.replace('{geneticProfileId}', parameters['geneticProfileId']);

        if (parameters.$queryParameters) {
            Object.keys(parameters.$queryParameters).forEach(function(parameterName) {
                var parameter = parameters.$queryParameters[parameterName];
                queryParameters[parameterName] = parameter;
            });
        }
        let keys = Object.keys(queryParameters);
        return this.domain + path + (keys.length > 0 ? '?' + (keys.map(key => key + '=' + encodeURIComponent(queryParameters[key])).join('&')) : '');
    };

    /**
     * Get counts of specific variants within a mutation genetic profile
     * @method
     * @name CBioPortalAPIInternal#getVariantCountsUsingPOST
     * @param {string} geneticProfileId - Genetic Profile ID e.g. acc_tcga_mutations
     * @param {} variantCountIdentifiers - List of Entrez Gene IDs
     */
    getVariantCountsUsingPOST(parameters: {
            'geneticProfileId': string,
            'variantCountIdentifiers': Array < VariantCountIdentifier > | VariantCountIdentifier

            ,
            $queryParameters ? : any,
            $domain ? : string
        }): Promise < Array < VariantCount >
        > {
            const domain = parameters.$domain ? parameters.$domain : this.domain;
            const errorHandlers = this.errorHandlers;
            const request = this.request;
            let path = '/genetic-profiles/{geneticProfileId}/variant-counts/fetch';
            let body: any;
            let queryParameters: any = {};
            let headers: any = {};
            let form: any = {};
            return new Promise(function(resolve, reject) {
                headers['Accept'] = 'application/json';
                headers['Content-Type'] = 'application/json';

                path = path.replace('{geneticProfileId}', parameters['geneticProfileId']);

                if (parameters['geneticProfileId'] === undefined) {
                    reject(new Error('Missing required  parameter: geneticProfileId'));
                    return;
                }

                if (parameters['variantCountIdentifiers'] !== undefined) {
                    body = parameters['variantCountIdentifiers'];
                }

                if (parameters['variantCountIdentifiers'] === undefined) {
                    reject(new Error('Missing required  parameter: variantCountIdentifiers'));
                    return;
                }

                if (parameters.$queryParameters) {
                    Object.keys(parameters.$queryParameters).forEach(function(parameterName) {
                        var parameter = parameters.$queryParameters[parameterName];
                        queryParameters[parameterName] = parameter;
                    });
                }

                request('POST', domain + path, body, headers, queryParameters, form, reject, resolve, errorHandlers);

            }).then(function(response: request.Response) {
                return response.body;
            });
        };

    getSignificantlyMutatedGenesUsingGETURL(parameters: {
        'studyId': string,
        'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
        'pageSize' ? : number,
        'pageNumber' ? : number,
        'sortBy' ? : "entrezGeneId" | "hugoGeneSymbol" | "rank" | "numberOfMutations" | "pValue" | "qValue",
        'direction' ? : "ASC" | "DESC",
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/studies/{studyId}/significantly-mutated-genes';

        path = path.replace('{studyId}', parameters['studyId']);
        if (parameters['projection'] !== undefined) {
            queryParameters['projection'] = parameters['projection'];
        }

        if (parameters['pageSize'] !== undefined) {
            queryParameters['pageSize'] = parameters['pageSize'];
        }

        if (parameters['pageNumber'] !== undefined) {
            queryParameters['pageNumber'] = parameters['pageNumber'];
        }

        if (parameters['sortBy'] !== undefined) {
            queryParameters['sortBy'] = parameters['sortBy'];
        }

        if (parameters['direction'] !== undefined) {
            queryParameters['direction'] = parameters['direction'];
        }

        if (parameters.$queryParameters) {
            Object.keys(parameters.$queryParameters).forEach(function(parameterName) {
                var parameter = parameters.$queryParameters[parameterName];
                queryParameters[parameterName] = parameter;
            });
        }
        let keys = Object.keys(queryParameters);
        return this.domain + path + (keys.length > 0 ? '?' + (keys.map(key => key + '=' + encodeURIComponent(queryParameters[key])).join('&')) : '');
    };

    /**
     * Get significantly mutated genes in a study
     * @method
     * @name CBioPortalAPIInternal#getSignificantlyMutatedGenesUsingGET
     * @param {string} studyId - Study ID e.g. acc_tcga
     * @param {string} projection - Level of detail of the response
     * @param {integer} pageSize - Page size of the result list
     * @param {integer} pageNumber - Page number of the result list
     * @param {string} sortBy - Name of the property that the result list is sorted by
     * @param {string} direction - Direction of the sort
     */
    getSignificantlyMutatedGenesUsingGET(parameters: {
            'studyId': string,
            'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
            'pageSize' ? : number,
            'pageNumber' ? : number,
            'sortBy' ? : "entrezGeneId" | "hugoGeneSymbol" | "rank" | "numberOfMutations" | "pValue" | "qValue",
            'direction' ? : "ASC" | "DESC",
            $queryParameters ? : any,
            $domain ? : string
        }): Promise < Array < MutSig >
        > {
            const domain = parameters.$domain ? parameters.$domain : this.domain;
            const errorHandlers = this.errorHandlers;
            const request = this.request;
            let path = '/studies/{studyId}/significantly-mutated-genes';
            let body: any;
            let queryParameters: any = {};
            let headers: any = {};
            let form: any = {};
            return new Promise(function(resolve, reject) {
                headers['Accept'] = 'application/json';
                headers['Content-Type'] = 'application/json';

                path = path.replace('{studyId}', parameters['studyId']);

                if (parameters['studyId'] === undefined) {
                    reject(new Error('Missing required  parameter: studyId'));
                    return;
                }

                if (parameters['projection'] !== undefined) {
                    queryParameters['projection'] = parameters['projection'];
                }

                if (parameters['pageSize'] !== undefined) {
                    queryParameters['pageSize'] = parameters['pageSize'];
                }

                if (parameters['pageNumber'] !== undefined) {
                    queryParameters['pageNumber'] = parameters['pageNumber'];
                }

                if (parameters['sortBy'] !== undefined) {
                    queryParameters['sortBy'] = parameters['sortBy'];
                }

                if (parameters['direction'] !== undefined) {
                    queryParameters['direction'] = parameters['direction'];
                }

                if (parameters.$queryParameters) {
                    Object.keys(parameters.$queryParameters).forEach(function(parameterName) {
                        var parameter = parameters.$queryParameters[parameterName];
                        queryParameters[parameterName] = parameter;
                    });
                }

                request('GET', domain + path, body, headers, queryParameters, form, reject, resolve, errorHandlers);

            }).then(function(response: request.Response) {
                return response.body;
            });
        };

}