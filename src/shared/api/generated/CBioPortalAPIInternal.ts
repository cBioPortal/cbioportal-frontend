import * as request from "superagent";

type CallbackHandler = (err: any, res ? : request.Response) => void;
export type GenesetDataFilterCriteria = {
    'genesetIds': Array < string >

        'sampleIds': Array < string >

        'sampleListId': string

};
export type MutationSpectrumFilter = {
    'sampleIds': Array < string >

        'sampleListId': string

};
export type GisticToGene = {
    'entrezGeneId': number

        'hugoGeneSymbol': string

};
export type EnrichmentFilter = {
    'alteredSampleIds': Array < string >

        'unalteredSampleIds': Array < string >

};
export type VariantCountIdentifier = {
    'entrezGeneId': number

        'keyword': string

};
export type FractionGenomeAlteredFilter = {
    'sampleIds': Array < string >

        'sampleListId': string

};
export type FractionGenomeAltered = {
    'sampleId': string

        'studyId': string

        'value': number

};
export type MutationSpectrum = {
    'CtoA': number

        'CtoG': number

        'CtoT': number

        'TtoA': number

        'TtoC': number

        'TtoG': number

        'geneticProfileId': string

        'sampleId': string

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
export type CoExpression = {
    'cytoband': string

        'entrezGeneId': number

        'hugoGeneSymbol': string

        'pearsonsCorrelation': number

        'spearmansCorrelation': number

};
export type GenesetGeneticData = {
    'genesetId': string

        'geneticProfileId': string

        'sampleId': string

        'value': string

};
export type Gistic = {
    'amp': boolean

        'chromosome': number

        'cytoband': string

        'genes': Array < GisticToGene >

        'qValue': number

        'studyId': string

        'widePeakEnd': number

        'widePeakStart': number

};
export type GenesetHierarchyInfo = {
    'genesets': Array < Geneset >

        'nodeId': number

        'nodeName': string

        'parentId': number

        'parentNodeName': string

};
export type CosmicMutation = {
    'cosmicMutationId': string

        'count': number

        'keyword': string

        'proteinChange': string

};
export type ExpressionEnrichment = {
    'cytoband': string

        'entrezGeneId': number

        'hugoGeneSymbol': string

        'meanExpressionInAlteredGroup': number

        'meanExpressionInUnalteredGroup': number

        'pValue': number

        'qValue': number

        'standardDeviationInAlteredGroup': number

        'standardDeviationInUnalteredGroup': number

};
export type VariantCount = {
    'entrezGeneId': number

        'geneticProfileId': string

        'keyword': string

        'numberOfSamples': number

        'numberOfSamplesWithKeyword': number

        'numberOfSamplesWithMutationInGene': number

};
export type CoExpressionFilter = {
    'sampleIds': Array < string >

        'sampleListId': string

};
export type Geneset = {
    'description': string

        'genesetId': string

        'name': string

        'refLink': string

        'representativePvalue': number

        'representativeScore': number

};
export type AlterationEnrichment = {
    'cytoband': string

        'entrezGeneId': number

        'hugoGeneSymbol': string

        'logRatio': string

        'numberOfSamplesInAlteredGroup': number

        'numberOfSamplesInUnalteredGroup': number

        'pValue': number

        'qValue': number

};
export type MrnaPercentile = {
    'entrezGeneId': number

        'geneticProfileId': string

        'percentile': number

        'sampleId': string

        'zScore': number

};
export type GenesetCorrelation = {
    'correlationValue': number

        'entrezGeneId': number

        'expressionGeneticProfileId': string

        'hugoGeneSymbol': string

        'zScoreGeneticProfileId': string

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
        'keywords': Array < string > ,
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
            'keywords': Array < string > ,
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

    fetchGenesetHierarchyInfoUsingPOSTURL(parameters: {
        'geneticProfileId': string,
        'percentile' ? : number,
        'scoreThreshold' ? : number,
        'pvalueThreshold' ? : number,
        'sampleListId' ? : string,
        'sampleIds' ? : Array < string > ,
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/geneset-hierarchy/fetch';
        if (parameters['geneticProfileId'] !== undefined) {
            queryParameters['geneticProfileId'] = parameters['geneticProfileId'];
        }

        if (parameters['percentile'] !== undefined) {
            queryParameters['percentile'] = parameters['percentile'];
        }

        if (parameters['scoreThreshold'] !== undefined) {
            queryParameters['scoreThreshold'] = parameters['scoreThreshold'];
        }

        if (parameters['pvalueThreshold'] !== undefined) {
            queryParameters['pvalueThreshold'] = parameters['pvalueThreshold'];
        }

        if (parameters['sampleListId'] !== undefined) {
            queryParameters['sampleListId'] = parameters['sampleListId'];
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
     * Get gene set hierarchical organization information. I.e. how different gene sets relate to other gene sets, in a hierarchy
     * @method
     * @name CBioPortalAPIInternal#fetchGenesetHierarchyInfoUsingPOST
     * @param {string} geneticProfileId - Genetic Profile ID e.g. gbm_tcga_gsva_scores. The final hierarchy  will only include gene sets scored in the specified profile.
     * @param {integer} percentile - Percentile (for score calculation). Which percentile to use when determining the *representative score*
     * @param {number} scoreThreshold - Gene set score threshold (for absolute score value). Filters out gene sets where the GSVA(like) *representative score* is under this threshold.
     * @param {number} pvalueThreshold - p-value threshold. Filters out gene sets for which the score p-value is higher than this threshold.
     * @param {string} sampleListId - Identifier of pre-defined sample list with samples to query, e.g. brca_tcga_all
     * @param {} sampleIds - Fill this one if you want to specify a subset of samples: sampleIds: custom list of samples or patients to query, e.g. ["TCGA-A1-A0SD-01", "TCGA-A1-A0SE-01"]
     */
    fetchGenesetHierarchyInfoUsingPOST(parameters: {
            'geneticProfileId': string,
            'percentile' ? : number,
            'scoreThreshold' ? : number,
            'pvalueThreshold' ? : number,
            'sampleListId' ? : string,
            'sampleIds' ? : Array < string > ,
            $queryParameters ? : any,
            $domain ? : string
        }): Promise < Array < GenesetHierarchyInfo >
        > {
            const domain = parameters.$domain ? parameters.$domain : this.domain;
            const errorHandlers = this.errorHandlers;
            const request = this.request;
            let path = '/geneset-hierarchy/fetch';
            let body: any;
            let queryParameters: any = {};
            let headers: any = {};
            let form: any = {};
            return new Promise(function(resolve, reject) {
                headers['Accept'] = 'application/json';
                headers['Content-Type'] = 'application/json';

                if (parameters['geneticProfileId'] !== undefined) {
                    queryParameters['geneticProfileId'] = parameters['geneticProfileId'];
                }

                if (parameters['geneticProfileId'] === undefined) {
                    reject(new Error('Missing required  parameter: geneticProfileId'));
                    return;
                }

                if (parameters['percentile'] !== undefined) {
                    queryParameters['percentile'] = parameters['percentile'];
                }

                if (parameters['scoreThreshold'] !== undefined) {
                    queryParameters['scoreThreshold'] = parameters['scoreThreshold'];
                }

                if (parameters['pvalueThreshold'] !== undefined) {
                    queryParameters['pvalueThreshold'] = parameters['pvalueThreshold'];
                }

                if (parameters['sampleListId'] !== undefined) {
                    queryParameters['sampleListId'] = parameters['sampleListId'];
                }

                if (parameters['sampleIds'] !== undefined) {
                    body = parameters['sampleIds'];
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

    getAllGenesetsUsingGETURL(parameters: {
        'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
        'pageSize' ? : number,
        'pageNumber' ? : number,
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/genesets';
        if (parameters['projection'] !== undefined) {
            queryParameters['projection'] = parameters['projection'];
        }

        if (parameters['pageSize'] !== undefined) {
            queryParameters['pageSize'] = parameters['pageSize'];
        }

        if (parameters['pageNumber'] !== undefined) {
            queryParameters['pageNumber'] = parameters['pageNumber'];
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
     * Get all gene sets
     * @method
     * @name CBioPortalAPIInternal#getAllGenesetsUsingGET
     * @param {string} projection - Level of detail of the response
     * @param {integer} pageSize - Page size of the result list
     * @param {integer} pageNumber - Page number of the result list
     */
    getAllGenesetsUsingGET(parameters: {
            'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
            'pageSize' ? : number,
            'pageNumber' ? : number,
            $queryParameters ? : any,
                $domain ? : string
        }): Promise < Array < Geneset >
        > {
            const domain = parameters.$domain ? parameters.$domain : this.domain;
            const errorHandlers = this.errorHandlers;
            const request = this.request;
            let path = '/genesets';
            let body: any;
            let queryParameters: any = {};
            let headers: any = {};
            let form: any = {};
            return new Promise(function(resolve, reject) {
                headers['Accept'] = 'application/json';
                headers['Content-Type'] = 'application/json';

                if (parameters['projection'] !== undefined) {
                    queryParameters['projection'] = parameters['projection'];
                }

                if (parameters['pageSize'] !== undefined) {
                    queryParameters['pageSize'] = parameters['pageSize'];
                }

                if (parameters['pageNumber'] !== undefined) {
                    queryParameters['pageNumber'] = parameters['pageNumber'];
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

    getGenesetUsingGETURL(parameters: {
        'genesetId': string,
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/genesets/{genesetId}';

        path = path.replace('{genesetId}', parameters['genesetId'] + '');

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
     * Get a gene set
     * @method
     * @name CBioPortalAPIInternal#getGenesetUsingGET
     * @param {string} genesetId - Gene set ID e.g. GNF2_ZAP70
     */
    getGenesetUsingGET(parameters: {
        'genesetId': string,
        $queryParameters ? : any,
        $domain ? : string
    }): Promise < Geneset > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        const errorHandlers = this.errorHandlers;
        const request = this.request;
        let path = '/genesets/{genesetId}';
        let body: any;
        let queryParameters: any = {};
        let headers: any = {};
        let form: any = {};
        return new Promise(function(resolve, reject) {
            headers['Accept'] = 'application/json';
            headers['Content-Type'] = 'application/json';

            path = path.replace('{genesetId}', parameters['genesetId'] + '');

            if (parameters['genesetId'] === undefined) {
                reject(new Error('Missing required  parameter: genesetId'));
                return;
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

    fetchCorrelatedGenesUsingPOSTURL(parameters: {
        'genesetId': string,
        'geneticProfileId': string,
        'correlationThreshold' ? : number,
        'sampleListId' ? : string,
        'sampleIds' ? : Array < string > ,
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/genesets/{genesetId}/expression-correlation/fetch';

        path = path.replace('{genesetId}', parameters['genesetId'] + '');
        if (parameters['geneticProfileId'] !== undefined) {
            queryParameters['geneticProfileId'] = parameters['geneticProfileId'];
        }

        if (parameters['correlationThreshold'] !== undefined) {
            queryParameters['correlationThreshold'] = parameters['correlationThreshold'];
        }

        if (parameters['sampleListId'] !== undefined) {
            queryParameters['sampleListId'] = parameters['sampleListId'];
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
     * Get the genes in a gene set that have expression correlated to the gene set scores (calculated using Spearman's correlation)
     * @method
     * @name CBioPortalAPIInternal#fetchCorrelatedGenesUsingPOST
     * @param {string} genesetId - Gene set ID, e.g. HINATA_NFKB_MATRIX.
     * @param {string} geneticProfileId - Genetic Profile ID e.g. gbm_tcga_gsva_scores
     * @param {number} correlationThreshold - Correlation threshold (for absolute correlation value, Spearman correlation)
     * @param {string} sampleListId - Identifier of pre-defined sample list with samples to query, e.g. brca_tcga_all
     * @param {} sampleIds - Fill this one if you want to specify a subset of samples: sampleIds: custom list of samples or patients to query, e.g. ["TCGA-A1-A0SD-01", "TCGA-A1-A0SE-01"]
     */
    fetchCorrelatedGenesUsingPOST(parameters: {
            'genesetId': string,
            'geneticProfileId': string,
            'correlationThreshold' ? : number,
            'sampleListId' ? : string,
            'sampleIds' ? : Array < string > ,
            $queryParameters ? : any,
            $domain ? : string
        }): Promise < Array < GenesetCorrelation >
        > {
            const domain = parameters.$domain ? parameters.$domain : this.domain;
            const errorHandlers = this.errorHandlers;
            const request = this.request;
            let path = '/genesets/{genesetId}/expression-correlation/fetch';
            let body: any;
            let queryParameters: any = {};
            let headers: any = {};
            let form: any = {};
            return new Promise(function(resolve, reject) {
                headers['Accept'] = 'application/json';
                headers['Content-Type'] = 'application/json';

                path = path.replace('{genesetId}', parameters['genesetId'] + '');

                if (parameters['genesetId'] === undefined) {
                    reject(new Error('Missing required  parameter: genesetId'));
                    return;
                }

                if (parameters['geneticProfileId'] !== undefined) {
                    queryParameters['geneticProfileId'] = parameters['geneticProfileId'];
                }

                if (parameters['geneticProfileId'] === undefined) {
                    reject(new Error('Missing required  parameter: geneticProfileId'));
                    return;
                }

                if (parameters['correlationThreshold'] !== undefined) {
                    queryParameters['correlationThreshold'] = parameters['correlationThreshold'];
                }

                if (parameters['sampleListId'] !== undefined) {
                    queryParameters['sampleListId'] = parameters['sampleListId'];
                }

                if (parameters['sampleIds'] !== undefined) {
                    body = parameters['sampleIds'];
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

    fetchCoExpressionsUsingPOSTURL(parameters: {
        'geneticProfileId': string,
        'coExpressionFilter': CoExpressionFilter,
        'entrezGeneId': number,
        'threshold': number,
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/genetic-profiles/{geneticProfileId}/co-expressions/fetch';

        path = path.replace('{geneticProfileId}', parameters['geneticProfileId'] + '');

        if (parameters['entrezGeneId'] !== undefined) {
            queryParameters['entrezGeneId'] = parameters['entrezGeneId'];
        }

        if (parameters['threshold'] !== undefined) {
            queryParameters['threshold'] = parameters['threshold'];
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
     * Fetch co-expressions in a genetic profile
     * @method
     * @name CBioPortalAPIInternal#fetchCoExpressionsUsingPOST
     * @param {string} geneticProfileId - Genetic Profile ID e.g. acc_tcga_rna_seq_v2_mrna
     * @param {} coExpressionFilter - List of Sample IDs/Sample List ID
     * @param {integer} entrezGeneId - Entrez Gene ID
     * @param {number} threshold - Threshold
     */
    fetchCoExpressionsUsingPOST(parameters: {
            'geneticProfileId': string,
            'coExpressionFilter': CoExpressionFilter,
            'entrezGeneId': number,
            'threshold': number,
            $queryParameters ? : any,
            $domain ? : string
        }): Promise < Array < CoExpression >
        > {
            const domain = parameters.$domain ? parameters.$domain : this.domain;
            const errorHandlers = this.errorHandlers;
            const request = this.request;
            let path = '/genetic-profiles/{geneticProfileId}/co-expressions/fetch';
            let body: any;
            let queryParameters: any = {};
            let headers: any = {};
            let form: any = {};
            return new Promise(function(resolve, reject) {
                headers['Accept'] = 'application/json';
                headers['Content-Type'] = 'application/json';

                path = path.replace('{geneticProfileId}', parameters['geneticProfileId'] + '');

                if (parameters['geneticProfileId'] === undefined) {
                    reject(new Error('Missing required  parameter: geneticProfileId'));
                    return;
                }

                if (parameters['coExpressionFilter'] !== undefined) {
                    body = parameters['coExpressionFilter'];
                }

                if (parameters['coExpressionFilter'] === undefined) {
                    reject(new Error('Missing required  parameter: coExpressionFilter'));
                    return;
                }

                if (parameters['entrezGeneId'] !== undefined) {
                    queryParameters['entrezGeneId'] = parameters['entrezGeneId'];
                }

                if (parameters['entrezGeneId'] === undefined) {
                    reject(new Error('Missing required  parameter: entrezGeneId'));
                    return;
                }

                if (parameters['threshold'] !== undefined) {
                    queryParameters['threshold'] = parameters['threshold'];
                }

                if (parameters['threshold'] === undefined) {
                    reject(new Error('Missing required  parameter: threshold'));
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

    fetchCopyNumberEnrichmentsUsingPOSTURL(parameters: {
        'geneticProfileId': string,
        'copyNumberEnrichmentEventType' ? : "HOMDEL" | "AMP",
        'enrichmentFilter': EnrichmentFilter,
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/genetic-profiles/{geneticProfileId}/copy-number-enrichments/fetch';

        path = path.replace('{geneticProfileId}', parameters['geneticProfileId'] + '');
        if (parameters['copyNumberEnrichmentEventType'] !== undefined) {
            queryParameters['copyNumberEnrichmentEventType'] = parameters['copyNumberEnrichmentEventType'];
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
     * Fetch copy number enrichments in a genetic profile
     * @method
     * @name CBioPortalAPIInternal#fetchCopyNumberEnrichmentsUsingPOST
     * @param {string} geneticProfileId - Genetic Profile ID e.g. acc_tcga_mutations
     * @param {string} copyNumberEnrichmentEventType - Type of the copy number event
     * @param {} enrichmentFilter - List of altered and unaltered Sample IDs and Entrez Gene IDs
     */
    fetchCopyNumberEnrichmentsUsingPOST(parameters: {
            'geneticProfileId': string,
            'copyNumberEnrichmentEventType' ? : "HOMDEL" | "AMP",
            'enrichmentFilter': EnrichmentFilter,
            $queryParameters ? : any,
            $domain ? : string
        }): Promise < Array < AlterationEnrichment >
        > {
            const domain = parameters.$domain ? parameters.$domain : this.domain;
            const errorHandlers = this.errorHandlers;
            const request = this.request;
            let path = '/genetic-profiles/{geneticProfileId}/copy-number-enrichments/fetch';
            let body: any;
            let queryParameters: any = {};
            let headers: any = {};
            let form: any = {};
            return new Promise(function(resolve, reject) {
                headers['Accept'] = 'application/json';
                headers['Content-Type'] = 'application/json';

                path = path.replace('{geneticProfileId}', parameters['geneticProfileId'] + '');

                if (parameters['geneticProfileId'] === undefined) {
                    reject(new Error('Missing required  parameter: geneticProfileId'));
                    return;
                }

                if (parameters['copyNumberEnrichmentEventType'] !== undefined) {
                    queryParameters['copyNumberEnrichmentEventType'] = parameters['copyNumberEnrichmentEventType'];
                }

                if (parameters['enrichmentFilter'] !== undefined) {
                    body = parameters['enrichmentFilter'];
                }

                if (parameters['enrichmentFilter'] === undefined) {
                    reject(new Error('Missing required  parameter: enrichmentFilter'));
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

    fetchExpressionEnrichmentsUsingPOSTURL(parameters: {
        'geneticProfileId': string,
        'enrichmentFilter': EnrichmentFilter,
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/genetic-profiles/{geneticProfileId}/expression-enrichments/fetch';

        path = path.replace('{geneticProfileId}', parameters['geneticProfileId'] + '');

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
     * Fetch expression enrichments in a genetic profile
     * @method
     * @name CBioPortalAPIInternal#fetchExpressionEnrichmentsUsingPOST
     * @param {string} geneticProfileId - Genetic Profile ID e.g. acc_tcga_rna_seq_v2_mrna
     * @param {} enrichmentFilter - List of altered and unaltered Sample IDs and Entrez Gene IDs
     */
    fetchExpressionEnrichmentsUsingPOST(parameters: {
            'geneticProfileId': string,
            'enrichmentFilter': EnrichmentFilter,
            $queryParameters ? : any,
            $domain ? : string
        }): Promise < Array < ExpressionEnrichment >
        > {
            const domain = parameters.$domain ? parameters.$domain : this.domain;
            const errorHandlers = this.errorHandlers;
            const request = this.request;
            let path = '/genetic-profiles/{geneticProfileId}/expression-enrichments/fetch';
            let body: any;
            let queryParameters: any = {};
            let headers: any = {};
            let form: any = {};
            return new Promise(function(resolve, reject) {
                headers['Accept'] = 'application/json';
                headers['Content-Type'] = 'application/json';

                path = path.replace('{geneticProfileId}', parameters['geneticProfileId'] + '');

                if (parameters['geneticProfileId'] === undefined) {
                    reject(new Error('Missing required  parameter: geneticProfileId'));
                    return;
                }

                if (parameters['enrichmentFilter'] !== undefined) {
                    body = parameters['enrichmentFilter'];
                }

                if (parameters['enrichmentFilter'] === undefined) {
                    reject(new Error('Missing required  parameter: enrichmentFilter'));
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

    fetchGeneticDataItemsUsingPOSTURL(parameters: {
        'geneticProfileId': string,
        'genesetDataFilterCriteria': GenesetDataFilterCriteria,
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/genetic-profiles/{geneticProfileId}/geneset-genetic-data/fetch';

        path = path.replace('{geneticProfileId}', parameters['geneticProfileId'] + '');

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
     * Fetch gene set "genetic data" items (gene set scores) by profile Id, gene set ids and sample ids
     * @method
     * @name CBioPortalAPIInternal#fetchGeneticDataItemsUsingPOST
     * @param {string} geneticProfileId - Genetic profile ID, e.g. gbm_tcga_gsva_scores
     * @param {} genesetDataFilterCriteria - Search criteria to return the values for a given set of samples and gene set items. genesetIds: The list of identifiers for the gene sets of interest, e.g. HINATA_NFKB_MATRIX. Use one of these if you want to specify a subset of samples:(1) sampleListId: Identifier of pre-defined sample list with samples to query, e.g. brca_tcga_all or (2) sampleIds: custom list of samples or patients to query, e.g. TCGA-BH-A1EO-01, TCGA-AR-A1AR-01
     */
    fetchGeneticDataItemsUsingPOST(parameters: {
            'geneticProfileId': string,
            'genesetDataFilterCriteria': GenesetDataFilterCriteria,
            $queryParameters ? : any,
            $domain ? : string
        }): Promise < Array < GenesetGeneticData >
        > {
            const domain = parameters.$domain ? parameters.$domain : this.domain;
            const errorHandlers = this.errorHandlers;
            const request = this.request;
            let path = '/genetic-profiles/{geneticProfileId}/geneset-genetic-data/fetch';
            let body: any;
            let queryParameters: any = {};
            let headers: any = {};
            let form: any = {};
            return new Promise(function(resolve, reject) {
                headers['Accept'] = 'application/json';
                headers['Content-Type'] = 'application/json';

                path = path.replace('{geneticProfileId}', parameters['geneticProfileId'] + '');

                if (parameters['geneticProfileId'] === undefined) {
                    reject(new Error('Missing required  parameter: geneticProfileId'));
                    return;
                }

                if (parameters['genesetDataFilterCriteria'] !== undefined) {
                    body = parameters['genesetDataFilterCriteria'];
                }

                if (parameters['genesetDataFilterCriteria'] === undefined) {
                    reject(new Error('Missing required  parameter: genesetDataFilterCriteria'));
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
        'entrezGeneIds': Array < number > ,
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/genetic-profiles/{geneticProfileId}/mrna-percentile/fetch';

        path = path.replace('{geneticProfileId}', parameters['geneticProfileId'] + '');
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
            'entrezGeneIds': Array < number > ,
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

                path = path.replace('{geneticProfileId}', parameters['geneticProfileId'] + '');

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

    fetchMutationEnrichmentsUsingPOSTURL(parameters: {
        'geneticProfileId': string,
        'enrichmentFilter': EnrichmentFilter,
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/genetic-profiles/{geneticProfileId}/mutation-enrichments/fetch';

        path = path.replace('{geneticProfileId}', parameters['geneticProfileId'] + '');

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
     * Fetch mutation enrichments in a genetic profile
     * @method
     * @name CBioPortalAPIInternal#fetchMutationEnrichmentsUsingPOST
     * @param {string} geneticProfileId - Genetic Profile ID e.g. acc_tcga_mutations
     * @param {} enrichmentFilter - List of altered and unaltered Sample IDs and Entrez Gene IDs
     */
    fetchMutationEnrichmentsUsingPOST(parameters: {
            'geneticProfileId': string,
            'enrichmentFilter': EnrichmentFilter,
            $queryParameters ? : any,
            $domain ? : string
        }): Promise < Array < AlterationEnrichment >
        > {
            const domain = parameters.$domain ? parameters.$domain : this.domain;
            const errorHandlers = this.errorHandlers;
            const request = this.request;
            let path = '/genetic-profiles/{geneticProfileId}/mutation-enrichments/fetch';
            let body: any;
            let queryParameters: any = {};
            let headers: any = {};
            let form: any = {};
            return new Promise(function(resolve, reject) {
                headers['Accept'] = 'application/json';
                headers['Content-Type'] = 'application/json';

                path = path.replace('{geneticProfileId}', parameters['geneticProfileId'] + '');

                if (parameters['geneticProfileId'] === undefined) {
                    reject(new Error('Missing required  parameter: geneticProfileId'));
                    return;
                }

                if (parameters['enrichmentFilter'] !== undefined) {
                    body = parameters['enrichmentFilter'];
                }

                if (parameters['enrichmentFilter'] === undefined) {
                    reject(new Error('Missing required  parameter: enrichmentFilter'));
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

    fetchMutationSpectrumsUsingPOSTURL(parameters: {
        'geneticProfileId': string,
        'mutationSpectrumFilter': MutationSpectrumFilter,
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/genetic-profiles/{geneticProfileId}/mutation-spectrums/fetch';

        path = path.replace('{geneticProfileId}', parameters['geneticProfileId'] + '');

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
     * Fetch mutation spectrums in a genetic profile
     * @method
     * @name CBioPortalAPIInternal#fetchMutationSpectrumsUsingPOST
     * @param {string} geneticProfileId - Genetic Profile ID e.g. acc_tcga_mutations
     * @param {} mutationSpectrumFilter - List of Sample IDs/Sample List ID
     */
    fetchMutationSpectrumsUsingPOST(parameters: {
            'geneticProfileId': string,
            'mutationSpectrumFilter': MutationSpectrumFilter,
            $queryParameters ? : any,
            $domain ? : string
        }): Promise < Array < MutationSpectrum >
        > {
            const domain = parameters.$domain ? parameters.$domain : this.domain;
            const errorHandlers = this.errorHandlers;
            const request = this.request;
            let path = '/genetic-profiles/{geneticProfileId}/mutation-spectrums/fetch';
            let body: any;
            let queryParameters: any = {};
            let headers: any = {};
            let form: any = {};
            return new Promise(function(resolve, reject) {
                headers['Accept'] = 'application/json';
                headers['Content-Type'] = 'application/json';

                path = path.replace('{geneticProfileId}', parameters['geneticProfileId'] + '');

                if (parameters['geneticProfileId'] === undefined) {
                    reject(new Error('Missing required  parameter: geneticProfileId'));
                    return;
                }

                if (parameters['mutationSpectrumFilter'] !== undefined) {
                    body = parameters['mutationSpectrumFilter'];
                }

                if (parameters['mutationSpectrumFilter'] === undefined) {
                    reject(new Error('Missing required  parameter: mutationSpectrumFilter'));
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

    fetchVariantCountsUsingPOSTURL(parameters: {
        'geneticProfileId': string,
        'variantCountIdentifiers': Array < VariantCountIdentifier > ,
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/genetic-profiles/{geneticProfileId}/variant-counts/fetch';

        path = path.replace('{geneticProfileId}', parameters['geneticProfileId'] + '');

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
     * @name CBioPortalAPIInternal#fetchVariantCountsUsingPOST
     * @param {string} geneticProfileId - Genetic Profile ID e.g. acc_tcga_mutations
     * @param {} variantCountIdentifiers - List of variant count identifiers
     */
    fetchVariantCountsUsingPOST(parameters: {
            'geneticProfileId': string,
            'variantCountIdentifiers': Array < VariantCountIdentifier > ,
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

                path = path.replace('{geneticProfileId}', parameters['geneticProfileId'] + '');

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

    fetchFractionGenomeAlteredUsingPOSTURL(parameters: {
        'studyId': string,
        'fractionGenomeAlteredFilter': FractionGenomeAlteredFilter,
        'cutoff': number,
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/studies/{studyId}/fraction-genome-altered/fetch';

        path = path.replace('{studyId}', parameters['studyId'] + '');

        if (parameters['cutoff'] !== undefined) {
            queryParameters['cutoff'] = parameters['cutoff'];
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
     * Fetch fraction genome altered
     * @method
     * @name CBioPortalAPIInternal#fetchFractionGenomeAlteredUsingPOST
     * @param {string} studyId - Study ID e.g. acc_tcga
     * @param {} fractionGenomeAlteredFilter - List of Sample IDs/Sample List ID
     * @param {number} cutoff - Cutoff
     */
    fetchFractionGenomeAlteredUsingPOST(parameters: {
            'studyId': string,
            'fractionGenomeAlteredFilter': FractionGenomeAlteredFilter,
            'cutoff': number,
            $queryParameters ? : any,
            $domain ? : string
        }): Promise < Array < FractionGenomeAltered >
        > {
            const domain = parameters.$domain ? parameters.$domain : this.domain;
            const errorHandlers = this.errorHandlers;
            const request = this.request;
            let path = '/studies/{studyId}/fraction-genome-altered/fetch';
            let body: any;
            let queryParameters: any = {};
            let headers: any = {};
            let form: any = {};
            return new Promise(function(resolve, reject) {
                headers['Accept'] = 'application/json';
                headers['Content-Type'] = 'application/json';

                path = path.replace('{studyId}', parameters['studyId'] + '');

                if (parameters['studyId'] === undefined) {
                    reject(new Error('Missing required  parameter: studyId'));
                    return;
                }

                if (parameters['fractionGenomeAlteredFilter'] !== undefined) {
                    body = parameters['fractionGenomeAlteredFilter'];
                }

                if (parameters['fractionGenomeAlteredFilter'] === undefined) {
                    reject(new Error('Missing required  parameter: fractionGenomeAlteredFilter'));
                    return;
                }

                if (parameters['cutoff'] !== undefined) {
                    queryParameters['cutoff'] = parameters['cutoff'];
                }

                if (parameters['cutoff'] === undefined) {
                    reject(new Error('Missing required  parameter: cutoff'));
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

    getSignificantCopyNumberRegionsUsingGETURL(parameters: {
        'studyId': string,
        'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
        'pageSize' ? : number,
        'pageNumber' ? : number,
        'sortBy' ? : "chromosome" | "cytoband" | "widePeakStart" | "widePeakEnd" | "qValue" | "amp",
        'direction' ? : "ASC" | "DESC",
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/studies/{studyId}/significant-copy-number-regions';

        path = path.replace('{studyId}', parameters['studyId'] + '');
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
     * Get significant copy number alteration regions in a study
     * @method
     * @name CBioPortalAPIInternal#getSignificantCopyNumberRegionsUsingGET
     * @param {string} studyId - Study ID e.g. acc_tcga
     * @param {string} projection - Level of detail of the response
     * @param {integer} pageSize - Page size of the result list
     * @param {integer} pageNumber - Page number of the result list
     * @param {string} sortBy - Name of the property that the result list is sorted by
     * @param {string} direction - Direction of the sort
     */
    getSignificantCopyNumberRegionsUsingGET(parameters: {
            'studyId': string,
            'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
            'pageSize' ? : number,
            'pageNumber' ? : number,
            'sortBy' ? : "chromosome" | "cytoband" | "widePeakStart" | "widePeakEnd" | "qValue" | "amp",
            'direction' ? : "ASC" | "DESC",
            $queryParameters ? : any,
            $domain ? : string
        }): Promise < Array < Gistic >
        > {
            const domain = parameters.$domain ? parameters.$domain : this.domain;
            const errorHandlers = this.errorHandlers;
            const request = this.request;
            let path = '/studies/{studyId}/significant-copy-number-regions';
            let body: any;
            let queryParameters: any = {};
            let headers: any = {};
            let form: any = {};
            return new Promise(function(resolve, reject) {
                headers['Accept'] = 'application/json';
                headers['Content-Type'] = 'application/json';

                path = path.replace('{studyId}', parameters['studyId'] + '');

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

        path = path.replace('{studyId}', parameters['studyId'] + '');
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

                path = path.replace('{studyId}', parameters['studyId'] + '');

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