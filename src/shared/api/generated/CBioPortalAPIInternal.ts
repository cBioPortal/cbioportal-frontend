import * as request from "superagent";

type CallbackHandler = (err: any, res ? : request.Response) => void;
export type AlterationEnrichment = {
    'alteredCount': number

        'cytoband': string

        'entrezGeneId': number

        'hugoGeneSymbol': string

        'logRatio': string

        'pValue': number

        'qValue': number

        'unalteredCount': number

};
export type ClinicalDataCount = {
    'count': number

        'value': string

};
export type ClinicalDataEqualityFilter = {
    'attributeId': string

        'clinicalDataType': "SAMPLE" | "PATIENT"

        'values': Array < string >

};
export type CoExpression = {
    'cytoband': string

        'entrezGeneId': number

        'hugoGeneSymbol': string

        'pearsonsCorrelation': number

        'spearmansCorrelation': number

};
export type CoExpressionFilter = {
    'sampleIds': Array < string >

        'sampleListId': string

};
export type CopyNumberCountByGene = {
    'alteration': number

        'countByEntity': number

        'cytoband': string

        'entrezGeneId': number

        'frequency': number

        'hugoGeneSymbol': string

        'qValue': number

        'totalCount': number

};
export type CopyNumberGeneFilter = {
    'alterations': Array < CopyNumberGeneFilterElement >

};
export type CopyNumberGeneFilterElement = {
    'alteration': number

        'entrezGeneId': number

};
export type CosmicMutation = {
    'cosmicMutationId': string

        'count': number

        'keyword': string

        'proteinChange': string

};
export type EnrichmentFilter = {
    'alteredIds': Array < string >

        'queryGenes': Array < number >

        'unalteredIds': Array < string >

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
export type FractionGenomeAltered = {
    'patientId': string

        'sampleId': string

        'studyId': string

        'uniquePatientKey': string

        'uniqueSampleKey': string

        'value': number

};
export type FractionGenomeAlteredFilter = {
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
export type GenesetCorrelation = {
    'correlationValue': number

        'entrezGeneId': number

        'expressionGeneticProfileId': string

        'hugoGeneSymbol': string

        'zScoreGeneticProfileId': string

};
export type GenesetDataFilterCriteria = {
    'genesetIds': Array < string >

        'sampleIds': Array < string >

        'sampleListId': string

};
export type GenesetHierarchyInfo = {
    'genesets': Array < Geneset >

        'nodeId': number

        'nodeName': string

        'parentId': number

        'parentNodeName': string

};
export type GenesetMolecularData = {
    'genesetId': string

        'geneticProfileId': string

        'patientId': string

        'sampleId': string

        'studyId': string

        'uniquePatientKey': string

        'uniqueSampleKey': string

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
export type GisticToGene = {
    'entrezGeneId': number

        'hugoGeneSymbol': string

};
export type Info = {
    'dbVersion': string

        'portalVersion': string

};
export type MolecularProfileSampleCount = {
    'numberOfCNAProfiledSamples': number

        'numberOfCNAUnprofiledSamples': number

        'numberOfMutationProfiledSamples': number

        'numberOfMutationUnprofiledSamples': number

};
export type MrnaPercentile = {
    'entrezGeneId': number

        'molecularProfileId': string

        'patientId': string

        'percentile': number

        'sampleId': string

        'studyId': string

        'uniquePatientKey': string

        'uniqueSampleKey': string

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
export type MutationCountByGene = {
    'countByEntity': number

        'entrezGeneId': number

        'frequency': number

        'hugoGeneSymbol': string

        'qValue': number

        'totalCount': number

};
export type MutationGeneFilter = {
    'entrezGeneIds': Array < number >

};
export type MutationSpectrum = {
    'CtoA': number

        'CtoG': number

        'CtoT': number

        'TtoA': number

        'TtoC': number

        'TtoG': number

        'molecularProfileId': string

        'patientId': string

        'sampleId': string

        'studyId': string

        'uniquePatientKey': string

        'uniqueSampleKey': string

};
export type MutationSpectrumFilter = {
    'sampleIds': Array < string >

        'sampleListId': string

};
export type Sample = {
    'cancerTypeId': string

        'copyNumberSegmentPresent': boolean

        'patientId': string

        'sampleId': string

        'sampleType': "Primary Solid Tumor" | "Recurrent Solid Tumor" | "Primary Blood Tumor" | "Recurrent Blood Tumor" | "Metastatic" | "Blood Derived Normal" | "Solid Tissues Normal"

        'sequenced': boolean

        'studyId': string

        'uniquePatientKey': string

        'uniqueSampleKey': string

};
export type SampleIdentifier = {
    'sampleId': string

        'studyId': string

};
export type StudyViewFilter = {
    'clinicalDataEqualityFilters': Array < ClinicalDataEqualityFilter >

        'cnaGenes': Array < CopyNumberGeneFilter >

        'mutatedGenes': Array < MutationGeneFilter >

        'sampleIdentifiers': Array < SampleIdentifier >

        'studyIds': Array < string >

};
export type VariantCount = {
    'entrezGeneId': number

        'keyword': string

        'molecularProfileId': string

        'numberOfSamples': number

        'numberOfSamplesWithKeyword': number

        'numberOfSamplesWithMutationInGene': number

};
export type VariantCountIdentifier = {
    'entrezGeneId': number

        'keyword': string

};

/**
 * A web service for supplying JSON formatted data to cBioPortal clients. Please note that this API is currently in beta and subject to change.
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

    fetchClinicalDataCountsUsingPOSTURL(parameters: {
        'attributeId': string,
        'clinicalDataType' ? : "SAMPLE" | "PATIENT",
        'studyViewFilter': StudyViewFilter,
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/attributes/{attributeId}/clinical-data-counts/fetch';

        path = path.replace('{attributeId}', parameters['attributeId'] + '');
        if (parameters['clinicalDataType'] !== undefined) {
            queryParameters['clinicalDataType'] = parameters['clinicalDataType'];
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
     * Fetch clinical data counts by study view filter
     * @method
     * @name CBioPortalAPIInternal#fetchClinicalDataCountsUsingPOST
     * @param {string} attributeId - Attribute ID e.g. CANCER_TYPE
     * @param {string} clinicalDataType - Type of the clinical data
     * @param {} studyViewFilter - Clinical data count filter
     */
    fetchClinicalDataCountsUsingPOSTWithHttpInfo(parameters: {
        'attributeId': string,
        'clinicalDataType' ? : "SAMPLE" | "PATIENT",
        'studyViewFilter': StudyViewFilter,
        $queryParameters ? : any,
        $domain ? : string
    }): Promise < request.Response > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        const errorHandlers = this.errorHandlers;
        const request = this.request;
        let path = '/attributes/{attributeId}/clinical-data-counts/fetch';
        let body: any;
        let queryParameters: any = {};
        let headers: any = {};
        let form: any = {};
        return new Promise(function(resolve, reject) {
            headers['Accept'] = 'application/json';
            headers['Content-Type'] = 'application/json';

            path = path.replace('{attributeId}', parameters['attributeId'] + '');

            if (parameters['attributeId'] === undefined) {
                reject(new Error('Missing required  parameter: attributeId'));
                return;
            }

            if (parameters['clinicalDataType'] !== undefined) {
                queryParameters['clinicalDataType'] = parameters['clinicalDataType'];
            }

            if (parameters['studyViewFilter'] !== undefined) {
                body = parameters['studyViewFilter'];
            }

            if (parameters['studyViewFilter'] === undefined) {
                reject(new Error('Missing required  parameter: studyViewFilter'));
                return;
            }

            if (parameters.$queryParameters) {
                Object.keys(parameters.$queryParameters).forEach(function(parameterName) {
                    var parameter = parameters.$queryParameters[parameterName];
                    queryParameters[parameterName] = parameter;
                });
            }

            request('POST', domain + path, body, headers, queryParameters, form, reject, resolve, errorHandlers);

        });
    };

    /**
     * Fetch clinical data counts by study view filter
     * @method
     * @name CBioPortalAPIInternal#fetchClinicalDataCountsUsingPOST
     * @param {string} attributeId - Attribute ID e.g. CANCER_TYPE
     * @param {string} clinicalDataType - Type of the clinical data
     * @param {} studyViewFilter - Clinical data count filter
     */
    fetchClinicalDataCountsUsingPOST(parameters: {
            'attributeId': string,
            'clinicalDataType' ? : "SAMPLE" | "PATIENT",
            'studyViewFilter': StudyViewFilter,
            $queryParameters ? : any,
            $domain ? : string
        }): Promise < Array < ClinicalDataCount >
        > {
            return this.fetchClinicalDataCountsUsingPOSTWithHttpInfo(parameters).then(function(response: request.Response) {
                return response.body;
            });
        };
    fetchCNAGenesUsingPOSTURL(parameters: {
        'studyViewFilter': StudyViewFilter,
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/cna-genes/fetch';

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
     * Fetch CNA genes by study view filter
     * @method
     * @name CBioPortalAPIInternal#fetchCNAGenesUsingPOST
     * @param {} studyViewFilter - Study view filter
     */
    fetchCNAGenesUsingPOSTWithHttpInfo(parameters: {
        'studyViewFilter': StudyViewFilter,
        $queryParameters ? : any,
        $domain ? : string
    }): Promise < request.Response > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        const errorHandlers = this.errorHandlers;
        const request = this.request;
        let path = '/cna-genes/fetch';
        let body: any;
        let queryParameters: any = {};
        let headers: any = {};
        let form: any = {};
        return new Promise(function(resolve, reject) {
            headers['Accept'] = 'application/json';
            headers['Content-Type'] = 'application/json';

            if (parameters['studyViewFilter'] !== undefined) {
                body = parameters['studyViewFilter'];
            }

            if (parameters['studyViewFilter'] === undefined) {
                reject(new Error('Missing required  parameter: studyViewFilter'));
                return;
            }

            if (parameters.$queryParameters) {
                Object.keys(parameters.$queryParameters).forEach(function(parameterName) {
                    var parameter = parameters.$queryParameters[parameterName];
                    queryParameters[parameterName] = parameter;
                });
            }

            request('POST', domain + path, body, headers, queryParameters, form, reject, resolve, errorHandlers);

        });
    };

    /**
     * Fetch CNA genes by study view filter
     * @method
     * @name CBioPortalAPIInternal#fetchCNAGenesUsingPOST
     * @param {} studyViewFilter - Study view filter
     */
    fetchCNAGenesUsingPOST(parameters: {
            'studyViewFilter': StudyViewFilter,
            $queryParameters ? : any,
            $domain ? : string
        }): Promise < Array < CopyNumberCountByGene >
        > {
            return this.fetchCNAGenesUsingPOSTWithHttpInfo(parameters).then(function(response: request.Response) {
                return response.body;
            });
        };
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
    fetchCosmicCountsUsingPOSTWithHttpInfo(parameters: {
        'keywords': Array < string > ,
        $queryParameters ? : any,
        $domain ? : string
    }): Promise < request.Response > {
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

        });
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
            return this.fetchCosmicCountsUsingPOSTWithHttpInfo(parameters).then(function(response: request.Response) {
                return response.body;
            });
        };
    fetchFilteredSamplesUsingPOSTURL(parameters: {
        'studyViewFilter': StudyViewFilter,
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/filtered-samples/fetch';

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
     * Fetch sample IDs by study view filter
     * @method
     * @name CBioPortalAPIInternal#fetchFilteredSamplesUsingPOST
     * @param {} studyViewFilter - Study view filter
     */
    fetchFilteredSamplesUsingPOSTWithHttpInfo(parameters: {
        'studyViewFilter': StudyViewFilter,
        $queryParameters ? : any,
        $domain ? : string
    }): Promise < request.Response > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        const errorHandlers = this.errorHandlers;
        const request = this.request;
        let path = '/filtered-samples/fetch';
        let body: any;
        let queryParameters: any = {};
        let headers: any = {};
        let form: any = {};
        return new Promise(function(resolve, reject) {
            headers['Accept'] = 'application/json';
            headers['Content-Type'] = 'application/json';

            if (parameters['studyViewFilter'] !== undefined) {
                body = parameters['studyViewFilter'];
            }

            if (parameters['studyViewFilter'] === undefined) {
                reject(new Error('Missing required  parameter: studyViewFilter'));
                return;
            }

            if (parameters.$queryParameters) {
                Object.keys(parameters.$queryParameters).forEach(function(parameterName) {
                    var parameter = parameters.$queryParameters[parameterName];
                    queryParameters[parameterName] = parameter;
                });
            }

            request('POST', domain + path, body, headers, queryParameters, form, reject, resolve, errorHandlers);

        });
    };

    /**
     * Fetch sample IDs by study view filter
     * @method
     * @name CBioPortalAPIInternal#fetchFilteredSamplesUsingPOST
     * @param {} studyViewFilter - Study view filter
     */
    fetchFilteredSamplesUsingPOST(parameters: {
            'studyViewFilter': StudyViewFilter,
            $queryParameters ? : any,
            $domain ? : string
        }): Promise < Array < Sample >
        > {
            return this.fetchFilteredSamplesUsingPOSTWithHttpInfo(parameters).then(function(response: request.Response) {
                return response.body;
            });
        };
    fetchFractionGenomeAlteredInMultipleStudiesUsingPOSTURL(parameters: {
        'sampleIdentifiers': Array < SampleIdentifier > ,
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/fraction-genome-altered/fetch';

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
     * Fetch fraction genome altered in multiple studies
     * @method
     * @name CBioPortalAPIInternal#fetchFractionGenomeAlteredInMultipleStudiesUsingPOST
     * @param {} sampleIdentifiers - List of Sample Identifiers
     */
    fetchFractionGenomeAlteredInMultipleStudiesUsingPOSTWithHttpInfo(parameters: {
        'sampleIdentifiers': Array < SampleIdentifier > ,
        $queryParameters ? : any,
        $domain ? : string
    }): Promise < request.Response > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        const errorHandlers = this.errorHandlers;
        const request = this.request;
        let path = '/fraction-genome-altered/fetch';
        let body: any;
        let queryParameters: any = {};
        let headers: any = {};
        let form: any = {};
        return new Promise(function(resolve, reject) {
            headers['Accept'] = 'application/json';
            headers['Content-Type'] = 'application/json';

            if (parameters['sampleIdentifiers'] !== undefined) {
                body = parameters['sampleIdentifiers'];
            }

            if (parameters['sampleIdentifiers'] === undefined) {
                reject(new Error('Missing required  parameter: sampleIdentifiers'));
                return;
            }

            if (parameters.$queryParameters) {
                Object.keys(parameters.$queryParameters).forEach(function(parameterName) {
                    var parameter = parameters.$queryParameters[parameterName];
                    queryParameters[parameterName] = parameter;
                });
            }

            request('POST', domain + path, body, headers, queryParameters, form, reject, resolve, errorHandlers);

        });
    };

    /**
     * Fetch fraction genome altered in multiple studies
     * @method
     * @name CBioPortalAPIInternal#fetchFractionGenomeAlteredInMultipleStudiesUsingPOST
     * @param {} sampleIdentifiers - List of Sample Identifiers
     */
    fetchFractionGenomeAlteredInMultipleStudiesUsingPOST(parameters: {
            'sampleIdentifiers': Array < SampleIdentifier > ,
            $queryParameters ? : any,
            $domain ? : string
        }): Promise < Array < FractionGenomeAltered >
        > {
            return this.fetchFractionGenomeAlteredInMultipleStudiesUsingPOSTWithHttpInfo(parameters).then(function(response: request.Response) {
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
    fetchGenesetHierarchyInfoUsingPOSTWithHttpInfo(parameters: {
        'geneticProfileId': string,
        'percentile' ? : number,
        'scoreThreshold' ? : number,
        'pvalueThreshold' ? : number,
        'sampleListId' ? : string,
        'sampleIds' ? : Array < string > ,
        $queryParameters ? : any,
        $domain ? : string
    }): Promise < request.Response > {
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

        });
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
            return this.fetchGenesetHierarchyInfoUsingPOSTWithHttpInfo(parameters).then(function(response: request.Response) {
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
    getAllGenesetsUsingGETWithHttpInfo(parameters: {
        'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
        'pageSize' ? : number,
        'pageNumber' ? : number,
        $queryParameters ? : any,
            $domain ? : string
    }): Promise < request.Response > {
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

        });
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
            return this.getAllGenesetsUsingGETWithHttpInfo(parameters).then(function(response: request.Response) {
                return response.body;
            });
        };
    fetchGenesetsUsingPOSTURL(parameters: {
        'genesetIds': Array < string > ,
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/genesets/fetch';

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
     * Fetch gene sets by ID
     * @method
     * @name CBioPortalAPIInternal#fetchGenesetsUsingPOST
     * @param {} genesetIds - List of Gene set IDs
     */
    fetchGenesetsUsingPOSTWithHttpInfo(parameters: {
        'genesetIds': Array < string > ,
        $queryParameters ? : any,
        $domain ? : string
    }): Promise < request.Response > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        const errorHandlers = this.errorHandlers;
        const request = this.request;
        let path = '/genesets/fetch';
        let body: any;
        let queryParameters: any = {};
        let headers: any = {};
        let form: any = {};
        return new Promise(function(resolve, reject) {
            headers['Accept'] = 'application/json';
            headers['Content-Type'] = 'application/json';

            if (parameters['genesetIds'] !== undefined) {
                body = parameters['genesetIds'];
            }

            if (parameters['genesetIds'] === undefined) {
                reject(new Error('Missing required  parameter: genesetIds'));
                return;
            }

            if (parameters.$queryParameters) {
                Object.keys(parameters.$queryParameters).forEach(function(parameterName) {
                    var parameter = parameters.$queryParameters[parameterName];
                    queryParameters[parameterName] = parameter;
                });
            }

            request('POST', domain + path, body, headers, queryParameters, form, reject, resolve, errorHandlers);

        });
    };

    /**
     * Fetch gene sets by ID
     * @method
     * @name CBioPortalAPIInternal#fetchGenesetsUsingPOST
     * @param {} genesetIds - List of Gene set IDs
     */
    fetchGenesetsUsingPOST(parameters: {
            'genesetIds': Array < string > ,
            $queryParameters ? : any,
            $domain ? : string
        }): Promise < Array < Geneset >
        > {
            return this.fetchGenesetsUsingPOSTWithHttpInfo(parameters).then(function(response: request.Response) {
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
    getGenesetUsingGETWithHttpInfo(parameters: {
        'genesetId': string,
        $queryParameters ? : any,
        $domain ? : string
    }): Promise < request.Response > {
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

        });
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
        return this.getGenesetUsingGETWithHttpInfo(parameters).then(function(response: request.Response) {
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
    fetchCorrelatedGenesUsingPOSTWithHttpInfo(parameters: {
        'genesetId': string,
        'geneticProfileId': string,
        'correlationThreshold' ? : number,
        'sampleListId' ? : string,
        'sampleIds' ? : Array < string > ,
        $queryParameters ? : any,
        $domain ? : string
    }): Promise < request.Response > {
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

        });
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
            return this.fetchCorrelatedGenesUsingPOSTWithHttpInfo(parameters).then(function(response: request.Response) {
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
    fetchGeneticDataItemsUsingPOSTWithHttpInfo(parameters: {
        'geneticProfileId': string,
        'genesetDataFilterCriteria': GenesetDataFilterCriteria,
        $queryParameters ? : any,
        $domain ? : string
    }): Promise < request.Response > {
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

        });
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
        }): Promise < Array < GenesetMolecularData >
        > {
            return this.fetchGeneticDataItemsUsingPOSTWithHttpInfo(parameters).then(function(response: request.Response) {
                return response.body;
            });
        };
    getInfoUsingGETURL(parameters: {
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/info';

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
     * Get information about the running instance
     * @method
     * @name CBioPortalAPIInternal#getInfoUsingGET
     */
    getInfoUsingGETWithHttpInfo(parameters: {
        $queryParameters ? : any,
            $domain ? : string
    }): Promise < request.Response > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        const errorHandlers = this.errorHandlers;
        const request = this.request;
        let path = '/info';
        let body: any;
        let queryParameters: any = {};
        let headers: any = {};
        let form: any = {};
        return new Promise(function(resolve, reject) {
            headers['Accept'] = 'application/json';

            if (parameters.$queryParameters) {
                Object.keys(parameters.$queryParameters).forEach(function(parameterName) {
                    var parameter = parameters.$queryParameters[parameterName];
                    queryParameters[parameterName] = parameter;
                });
            }

            request('GET', domain + path, body, headers, queryParameters, form, reject, resolve, errorHandlers);

        });
    };

    /**
     * Get information about the running instance
     * @method
     * @name CBioPortalAPIInternal#getInfoUsingGET
     */
    getInfoUsingGET(parameters: {
        $queryParameters ? : any,
            $domain ? : string
    }): Promise < Info > {
        return this.getInfoUsingGETWithHttpInfo(parameters).then(function(response: request.Response) {
            return response.body;
        });
    };
    fetchCoExpressionsUsingPOSTURL(parameters: {
        'molecularProfileId': string,
        'coExpressionFilter': CoExpressionFilter,
        'entrezGeneId': number,
        'threshold' ? : number,
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/molecular-profiles/{molecularProfileId}/co-expressions/fetch';

        path = path.replace('{molecularProfileId}', parameters['molecularProfileId'] + '');

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
     * Fetch co-expressions in a molecular profile
     * @method
     * @name CBioPortalAPIInternal#fetchCoExpressionsUsingPOST
     * @param {string} molecularProfileId - Molecular Profile ID e.g. acc_tcga_rna_seq_v2_mrna
     * @param {} coExpressionFilter - List of Sample IDs/Sample List ID
     * @param {integer} entrezGeneId - Entrez Gene ID
     * @param {number} threshold - Threshold
     */
    fetchCoExpressionsUsingPOSTWithHttpInfo(parameters: {
        'molecularProfileId': string,
        'coExpressionFilter': CoExpressionFilter,
        'entrezGeneId': number,
        'threshold' ? : number,
        $queryParameters ? : any,
        $domain ? : string
    }): Promise < request.Response > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        const errorHandlers = this.errorHandlers;
        const request = this.request;
        let path = '/molecular-profiles/{molecularProfileId}/co-expressions/fetch';
        let body: any;
        let queryParameters: any = {};
        let headers: any = {};
        let form: any = {};
        return new Promise(function(resolve, reject) {
            headers['Accept'] = 'application/json';
            headers['Content-Type'] = 'application/json';

            path = path.replace('{molecularProfileId}', parameters['molecularProfileId'] + '');

            if (parameters['molecularProfileId'] === undefined) {
                reject(new Error('Missing required  parameter: molecularProfileId'));
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

            if (parameters.$queryParameters) {
                Object.keys(parameters.$queryParameters).forEach(function(parameterName) {
                    var parameter = parameters.$queryParameters[parameterName];
                    queryParameters[parameterName] = parameter;
                });
            }

            request('POST', domain + path, body, headers, queryParameters, form, reject, resolve, errorHandlers);

        });
    };

    /**
     * Fetch co-expressions in a molecular profile
     * @method
     * @name CBioPortalAPIInternal#fetchCoExpressionsUsingPOST
     * @param {string} molecularProfileId - Molecular Profile ID e.g. acc_tcga_rna_seq_v2_mrna
     * @param {} coExpressionFilter - List of Sample IDs/Sample List ID
     * @param {integer} entrezGeneId - Entrez Gene ID
     * @param {number} threshold - Threshold
     */
    fetchCoExpressionsUsingPOST(parameters: {
            'molecularProfileId': string,
            'coExpressionFilter': CoExpressionFilter,
            'entrezGeneId': number,
            'threshold' ? : number,
            $queryParameters ? : any,
            $domain ? : string
        }): Promise < Array < CoExpression >
        > {
            return this.fetchCoExpressionsUsingPOSTWithHttpInfo(parameters).then(function(response: request.Response) {
                return response.body;
            });
        };
    fetchCopyNumberEnrichmentsUsingPOSTURL(parameters: {
        'molecularProfileId': string,
        'copyNumberEventType' ? : "HOMDEL" | "AMP",
        'enrichmentType' ? : "SAMPLE" | "PATIENT",
        'enrichmentFilter': EnrichmentFilter,
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/molecular-profiles/{molecularProfileId}/copy-number-enrichments/fetch';

        path = path.replace('{molecularProfileId}', parameters['molecularProfileId'] + '');
        if (parameters['copyNumberEventType'] !== undefined) {
            queryParameters['copyNumberEventType'] = parameters['copyNumberEventType'];
        }

        if (parameters['enrichmentType'] !== undefined) {
            queryParameters['enrichmentType'] = parameters['enrichmentType'];
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
     * Fetch copy number enrichments in a molecular profile
     * @method
     * @name CBioPortalAPIInternal#fetchCopyNumberEnrichmentsUsingPOST
     * @param {string} molecularProfileId - Molecular Profile ID e.g. acc_tcga_mutations
     * @param {string} copyNumberEventType - Type of the copy number event
     * @param {string} enrichmentType - Type of the enrichment e.g. SAMPLE or PATIENT
     * @param {} enrichmentFilter - List of altered and unaltered Sample/Patient IDs
     */
    fetchCopyNumberEnrichmentsUsingPOSTWithHttpInfo(parameters: {
        'molecularProfileId': string,
        'copyNumberEventType' ? : "HOMDEL" | "AMP",
        'enrichmentType' ? : "SAMPLE" | "PATIENT",
        'enrichmentFilter': EnrichmentFilter,
        $queryParameters ? : any,
        $domain ? : string
    }): Promise < request.Response > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        const errorHandlers = this.errorHandlers;
        const request = this.request;
        let path = '/molecular-profiles/{molecularProfileId}/copy-number-enrichments/fetch';
        let body: any;
        let queryParameters: any = {};
        let headers: any = {};
        let form: any = {};
        return new Promise(function(resolve, reject) {
            headers['Accept'] = 'application/json';
            headers['Content-Type'] = 'application/json';

            path = path.replace('{molecularProfileId}', parameters['molecularProfileId'] + '');

            if (parameters['molecularProfileId'] === undefined) {
                reject(new Error('Missing required  parameter: molecularProfileId'));
                return;
            }

            if (parameters['copyNumberEventType'] !== undefined) {
                queryParameters['copyNumberEventType'] = parameters['copyNumberEventType'];
            }

            if (parameters['enrichmentType'] !== undefined) {
                queryParameters['enrichmentType'] = parameters['enrichmentType'];
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

        });
    };

    /**
     * Fetch copy number enrichments in a molecular profile
     * @method
     * @name CBioPortalAPIInternal#fetchCopyNumberEnrichmentsUsingPOST
     * @param {string} molecularProfileId - Molecular Profile ID e.g. acc_tcga_mutations
     * @param {string} copyNumberEventType - Type of the copy number event
     * @param {string} enrichmentType - Type of the enrichment e.g. SAMPLE or PATIENT
     * @param {} enrichmentFilter - List of altered and unaltered Sample/Patient IDs
     */
    fetchCopyNumberEnrichmentsUsingPOST(parameters: {
            'molecularProfileId': string,
            'copyNumberEventType' ? : "HOMDEL" | "AMP",
            'enrichmentType' ? : "SAMPLE" | "PATIENT",
            'enrichmentFilter': EnrichmentFilter,
            $queryParameters ? : any,
            $domain ? : string
        }): Promise < Array < AlterationEnrichment >
        > {
            return this.fetchCopyNumberEnrichmentsUsingPOSTWithHttpInfo(parameters).then(function(response: request.Response) {
                return response.body;
            });
        };
    fetchExpressionEnrichmentsUsingPOSTURL(parameters: {
        'molecularProfileId': string,
        'enrichmentType' ? : "SAMPLE" | "PATIENT",
        'enrichmentFilter': EnrichmentFilter,
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/molecular-profiles/{molecularProfileId}/expression-enrichments/fetch';

        path = path.replace('{molecularProfileId}', parameters['molecularProfileId'] + '');
        if (parameters['enrichmentType'] !== undefined) {
            queryParameters['enrichmentType'] = parameters['enrichmentType'];
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
     * Fetch expression enrichments in a molecular profile
     * @method
     * @name CBioPortalAPIInternal#fetchExpressionEnrichmentsUsingPOST
     * @param {string} molecularProfileId - Molecular Profile ID e.g. acc_tcga_rna_seq_v2_mrna
     * @param {string} enrichmentType - Type of the enrichment e.g. SAMPLE or PATIENT
     * @param {} enrichmentFilter - List of altered and unaltered Sample/Patient IDs
     */
    fetchExpressionEnrichmentsUsingPOSTWithHttpInfo(parameters: {
        'molecularProfileId': string,
        'enrichmentType' ? : "SAMPLE" | "PATIENT",
        'enrichmentFilter': EnrichmentFilter,
        $queryParameters ? : any,
        $domain ? : string
    }): Promise < request.Response > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        const errorHandlers = this.errorHandlers;
        const request = this.request;
        let path = '/molecular-profiles/{molecularProfileId}/expression-enrichments/fetch';
        let body: any;
        let queryParameters: any = {};
        let headers: any = {};
        let form: any = {};
        return new Promise(function(resolve, reject) {
            headers['Accept'] = 'application/json';
            headers['Content-Type'] = 'application/json';

            path = path.replace('{molecularProfileId}', parameters['molecularProfileId'] + '');

            if (parameters['molecularProfileId'] === undefined) {
                reject(new Error('Missing required  parameter: molecularProfileId'));
                return;
            }

            if (parameters['enrichmentType'] !== undefined) {
                queryParameters['enrichmentType'] = parameters['enrichmentType'];
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

        });
    };

    /**
     * Fetch expression enrichments in a molecular profile
     * @method
     * @name CBioPortalAPIInternal#fetchExpressionEnrichmentsUsingPOST
     * @param {string} molecularProfileId - Molecular Profile ID e.g. acc_tcga_rna_seq_v2_mrna
     * @param {string} enrichmentType - Type of the enrichment e.g. SAMPLE or PATIENT
     * @param {} enrichmentFilter - List of altered and unaltered Sample/Patient IDs
     */
    fetchExpressionEnrichmentsUsingPOST(parameters: {
            'molecularProfileId': string,
            'enrichmentType' ? : "SAMPLE" | "PATIENT",
            'enrichmentFilter': EnrichmentFilter,
            $queryParameters ? : any,
            $domain ? : string
        }): Promise < Array < ExpressionEnrichment >
        > {
            return this.fetchExpressionEnrichmentsUsingPOSTWithHttpInfo(parameters).then(function(response: request.Response) {
                return response.body;
            });
        };
    fetchMrnaPercentileUsingPOSTURL(parameters: {
        'molecularProfileId': string,
        'sampleId': string,
        'entrezGeneIds': Array < number > ,
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/molecular-profiles/{molecularProfileId}/mrna-percentile/fetch';

        path = path.replace('{molecularProfileId}', parameters['molecularProfileId'] + '');
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
     * @param {string} molecularProfileId - Molecular Profile ID e.g. acc_tcga_rna_seq_v2_mrna
     * @param {string} sampleId - Sample ID e.g. TCGA-OR-A5J2-01
     * @param {} entrezGeneIds - List of Entrez Gene IDs
     */
    fetchMrnaPercentileUsingPOSTWithHttpInfo(parameters: {
        'molecularProfileId': string,
        'sampleId': string,
        'entrezGeneIds': Array < number > ,
        $queryParameters ? : any,
        $domain ? : string
    }): Promise < request.Response > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        const errorHandlers = this.errorHandlers;
        const request = this.request;
        let path = '/molecular-profiles/{molecularProfileId}/mrna-percentile/fetch';
        let body: any;
        let queryParameters: any = {};
        let headers: any = {};
        let form: any = {};
        return new Promise(function(resolve, reject) {
            headers['Accept'] = 'application/json';
            headers['Content-Type'] = 'application/json';

            path = path.replace('{molecularProfileId}', parameters['molecularProfileId'] + '');

            if (parameters['molecularProfileId'] === undefined) {
                reject(new Error('Missing required  parameter: molecularProfileId'));
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

        });
    };

    /**
     * Get mRNA expression percentiles for list of genes for a sample
     * @method
     * @name CBioPortalAPIInternal#fetchMrnaPercentileUsingPOST
     * @param {string} molecularProfileId - Molecular Profile ID e.g. acc_tcga_rna_seq_v2_mrna
     * @param {string} sampleId - Sample ID e.g. TCGA-OR-A5J2-01
     * @param {} entrezGeneIds - List of Entrez Gene IDs
     */
    fetchMrnaPercentileUsingPOST(parameters: {
            'molecularProfileId': string,
            'sampleId': string,
            'entrezGeneIds': Array < number > ,
            $queryParameters ? : any,
            $domain ? : string
        }): Promise < Array < MrnaPercentile >
        > {
            return this.fetchMrnaPercentileUsingPOSTWithHttpInfo(parameters).then(function(response: request.Response) {
                return response.body;
            });
        };
    fetchMutationEnrichmentsUsingPOSTURL(parameters: {
        'molecularProfileId': string,
        'enrichmentType' ? : "SAMPLE" | "PATIENT",
        'enrichmentFilter': EnrichmentFilter,
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/molecular-profiles/{molecularProfileId}/mutation-enrichments/fetch';

        path = path.replace('{molecularProfileId}', parameters['molecularProfileId'] + '');
        if (parameters['enrichmentType'] !== undefined) {
            queryParameters['enrichmentType'] = parameters['enrichmentType'];
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
     * Fetch mutation enrichments in a molecular profile
     * @method
     * @name CBioPortalAPIInternal#fetchMutationEnrichmentsUsingPOST
     * @param {string} molecularProfileId - Molecular Profile ID e.g. acc_tcga_mutations
     * @param {string} enrichmentType - Type of the enrichment e.g. SAMPLE or PATIENT
     * @param {} enrichmentFilter - List of altered and unaltered Sample/Patient IDs
     */
    fetchMutationEnrichmentsUsingPOSTWithHttpInfo(parameters: {
        'molecularProfileId': string,
        'enrichmentType' ? : "SAMPLE" | "PATIENT",
        'enrichmentFilter': EnrichmentFilter,
        $queryParameters ? : any,
        $domain ? : string
    }): Promise < request.Response > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        const errorHandlers = this.errorHandlers;
        const request = this.request;
        let path = '/molecular-profiles/{molecularProfileId}/mutation-enrichments/fetch';
        let body: any;
        let queryParameters: any = {};
        let headers: any = {};
        let form: any = {};
        return new Promise(function(resolve, reject) {
            headers['Accept'] = 'application/json';
            headers['Content-Type'] = 'application/json';

            path = path.replace('{molecularProfileId}', parameters['molecularProfileId'] + '');

            if (parameters['molecularProfileId'] === undefined) {
                reject(new Error('Missing required  parameter: molecularProfileId'));
                return;
            }

            if (parameters['enrichmentType'] !== undefined) {
                queryParameters['enrichmentType'] = parameters['enrichmentType'];
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

        });
    };

    /**
     * Fetch mutation enrichments in a molecular profile
     * @method
     * @name CBioPortalAPIInternal#fetchMutationEnrichmentsUsingPOST
     * @param {string} molecularProfileId - Molecular Profile ID e.g. acc_tcga_mutations
     * @param {string} enrichmentType - Type of the enrichment e.g. SAMPLE or PATIENT
     * @param {} enrichmentFilter - List of altered and unaltered Sample/Patient IDs
     */
    fetchMutationEnrichmentsUsingPOST(parameters: {
            'molecularProfileId': string,
            'enrichmentType' ? : "SAMPLE" | "PATIENT",
            'enrichmentFilter': EnrichmentFilter,
            $queryParameters ? : any,
            $domain ? : string
        }): Promise < Array < AlterationEnrichment >
        > {
            return this.fetchMutationEnrichmentsUsingPOSTWithHttpInfo(parameters).then(function(response: request.Response) {
                return response.body;
            });
        };
    fetchMutationSpectrumsUsingPOSTURL(parameters: {
        'molecularProfileId': string,
        'mutationSpectrumFilter': MutationSpectrumFilter,
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/molecular-profiles/{molecularProfileId}/mutation-spectrums/fetch';

        path = path.replace('{molecularProfileId}', parameters['molecularProfileId'] + '');

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
     * Fetch mutation spectrums in a molecular profile
     * @method
     * @name CBioPortalAPIInternal#fetchMutationSpectrumsUsingPOST
     * @param {string} molecularProfileId - Molecular Profile ID e.g. acc_tcga_mutations
     * @param {} mutationSpectrumFilter - List of Sample IDs/Sample List ID
     */
    fetchMutationSpectrumsUsingPOSTWithHttpInfo(parameters: {
        'molecularProfileId': string,
        'mutationSpectrumFilter': MutationSpectrumFilter,
        $queryParameters ? : any,
        $domain ? : string
    }): Promise < request.Response > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        const errorHandlers = this.errorHandlers;
        const request = this.request;
        let path = '/molecular-profiles/{molecularProfileId}/mutation-spectrums/fetch';
        let body: any;
        let queryParameters: any = {};
        let headers: any = {};
        let form: any = {};
        return new Promise(function(resolve, reject) {
            headers['Accept'] = 'application/json';
            headers['Content-Type'] = 'application/json';

            path = path.replace('{molecularProfileId}', parameters['molecularProfileId'] + '');

            if (parameters['molecularProfileId'] === undefined) {
                reject(new Error('Missing required  parameter: molecularProfileId'));
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

        });
    };

    /**
     * Fetch mutation spectrums in a molecular profile
     * @method
     * @name CBioPortalAPIInternal#fetchMutationSpectrumsUsingPOST
     * @param {string} molecularProfileId - Molecular Profile ID e.g. acc_tcga_mutations
     * @param {} mutationSpectrumFilter - List of Sample IDs/Sample List ID
     */
    fetchMutationSpectrumsUsingPOST(parameters: {
            'molecularProfileId': string,
            'mutationSpectrumFilter': MutationSpectrumFilter,
            $queryParameters ? : any,
            $domain ? : string
        }): Promise < Array < MutationSpectrum >
        > {
            return this.fetchMutationSpectrumsUsingPOSTWithHttpInfo(parameters).then(function(response: request.Response) {
                return response.body;
            });
        };
    fetchVariantCountsUsingPOSTURL(parameters: {
        'molecularProfileId': string,
        'variantCountIdentifiers': Array < VariantCountIdentifier > ,
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/molecular-profiles/{molecularProfileId}/variant-counts/fetch';

        path = path.replace('{molecularProfileId}', parameters['molecularProfileId'] + '');

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
     * Get counts of specific variants within a mutation molecular profile
     * @method
     * @name CBioPortalAPIInternal#fetchVariantCountsUsingPOST
     * @param {string} molecularProfileId - Molecular Profile ID e.g. acc_tcga_mutations
     * @param {} variantCountIdentifiers - List of variant count identifiers
     */
    fetchVariantCountsUsingPOSTWithHttpInfo(parameters: {
        'molecularProfileId': string,
        'variantCountIdentifiers': Array < VariantCountIdentifier > ,
        $queryParameters ? : any,
        $domain ? : string
    }): Promise < request.Response > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        const errorHandlers = this.errorHandlers;
        const request = this.request;
        let path = '/molecular-profiles/{molecularProfileId}/variant-counts/fetch';
        let body: any;
        let queryParameters: any = {};
        let headers: any = {};
        let form: any = {};
        return new Promise(function(resolve, reject) {
            headers['Accept'] = 'application/json';
            headers['Content-Type'] = 'application/json';

            path = path.replace('{molecularProfileId}', parameters['molecularProfileId'] + '');

            if (parameters['molecularProfileId'] === undefined) {
                reject(new Error('Missing required  parameter: molecularProfileId'));
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

        });
    };

    /**
     * Get counts of specific variants within a mutation molecular profile
     * @method
     * @name CBioPortalAPIInternal#fetchVariantCountsUsingPOST
     * @param {string} molecularProfileId - Molecular Profile ID e.g. acc_tcga_mutations
     * @param {} variantCountIdentifiers - List of variant count identifiers
     */
    fetchVariantCountsUsingPOST(parameters: {
            'molecularProfileId': string,
            'variantCountIdentifiers': Array < VariantCountIdentifier > ,
            $queryParameters ? : any,
            $domain ? : string
        }): Promise < Array < VariantCount >
        > {
            return this.fetchVariantCountsUsingPOSTWithHttpInfo(parameters).then(function(response: request.Response) {
                return response.body;
            });
        };
    fetchMutatedGenesUsingPOSTURL(parameters: {
        'studyViewFilter': StudyViewFilter,
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/mutated-genes/fetch';

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
     * Fetch mutated genes by study view filter
     * @method
     * @name CBioPortalAPIInternal#fetchMutatedGenesUsingPOST
     * @param {} studyViewFilter - Study view filter
     */
    fetchMutatedGenesUsingPOSTWithHttpInfo(parameters: {
        'studyViewFilter': StudyViewFilter,
        $queryParameters ? : any,
        $domain ? : string
    }): Promise < request.Response > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        const errorHandlers = this.errorHandlers;
        const request = this.request;
        let path = '/mutated-genes/fetch';
        let body: any;
        let queryParameters: any = {};
        let headers: any = {};
        let form: any = {};
        return new Promise(function(resolve, reject) {
            headers['Accept'] = 'application/json';
            headers['Content-Type'] = 'application/json';

            if (parameters['studyViewFilter'] !== undefined) {
                body = parameters['studyViewFilter'];
            }

            if (parameters['studyViewFilter'] === undefined) {
                reject(new Error('Missing required  parameter: studyViewFilter'));
                return;
            }

            if (parameters.$queryParameters) {
                Object.keys(parameters.$queryParameters).forEach(function(parameterName) {
                    var parameter = parameters.$queryParameters[parameterName];
                    queryParameters[parameterName] = parameter;
                });
            }

            request('POST', domain + path, body, headers, queryParameters, form, reject, resolve, errorHandlers);

        });
    };

    /**
     * Fetch mutated genes by study view filter
     * @method
     * @name CBioPortalAPIInternal#fetchMutatedGenesUsingPOST
     * @param {} studyViewFilter - Study view filter
     */
    fetchMutatedGenesUsingPOST(parameters: {
            'studyViewFilter': StudyViewFilter,
            $queryParameters ? : any,
            $domain ? : string
        }): Promise < Array < MutationCountByGene >
        > {
            return this.fetchMutatedGenesUsingPOSTWithHttpInfo(parameters).then(function(response: request.Response) {
                return response.body;
            });
        };
    fetchMolecularProfileSampleCountsUsingPOSTURL(parameters: {
        'studyViewFilter': StudyViewFilter,
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/sample-counts/fetch';

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
     * Fetch sample IDs by study view filter
     * @method
     * @name CBioPortalAPIInternal#fetchMolecularProfileSampleCountsUsingPOST
     * @param {} studyViewFilter - Study view filter
     */
    fetchMolecularProfileSampleCountsUsingPOSTWithHttpInfo(parameters: {
        'studyViewFilter': StudyViewFilter,
        $queryParameters ? : any,
        $domain ? : string
    }): Promise < request.Response > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        const errorHandlers = this.errorHandlers;
        const request = this.request;
        let path = '/sample-counts/fetch';
        let body: any;
        let queryParameters: any = {};
        let headers: any = {};
        let form: any = {};
        return new Promise(function(resolve, reject) {
            headers['Accept'] = 'application/json';
            headers['Content-Type'] = 'application/json';

            if (parameters['studyViewFilter'] !== undefined) {
                body = parameters['studyViewFilter'];
            }

            if (parameters['studyViewFilter'] === undefined) {
                reject(new Error('Missing required  parameter: studyViewFilter'));
                return;
            }

            if (parameters.$queryParameters) {
                Object.keys(parameters.$queryParameters).forEach(function(parameterName) {
                    var parameter = parameters.$queryParameters[parameterName];
                    queryParameters[parameterName] = parameter;
                });
            }

            request('POST', domain + path, body, headers, queryParameters, form, reject, resolve, errorHandlers);

        });
    };

    /**
     * Fetch sample IDs by study view filter
     * @method
     * @name CBioPortalAPIInternal#fetchMolecularProfileSampleCountsUsingPOST
     * @param {} studyViewFilter - Study view filter
     */
    fetchMolecularProfileSampleCountsUsingPOST(parameters: {
        'studyViewFilter': StudyViewFilter,
        $queryParameters ? : any,
        $domain ? : string
    }): Promise < MolecularProfileSampleCount > {
        return this.fetchMolecularProfileSampleCountsUsingPOSTWithHttpInfo(parameters).then(function(response: request.Response) {
            return response.body;
        });
    };
    fetchFractionGenomeAlteredUsingPOSTURL(parameters: {
        'studyId': string,
        'fractionGenomeAlteredFilter': FractionGenomeAlteredFilter,
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/studies/{studyId}/fraction-genome-altered/fetch';

        path = path.replace('{studyId}', parameters['studyId'] + '');

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
     */
    fetchFractionGenomeAlteredUsingPOSTWithHttpInfo(parameters: {
        'studyId': string,
        'fractionGenomeAlteredFilter': FractionGenomeAlteredFilter,
        $queryParameters ? : any,
        $domain ? : string
    }): Promise < request.Response > {
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

            if (parameters.$queryParameters) {
                Object.keys(parameters.$queryParameters).forEach(function(parameterName) {
                    var parameter = parameters.$queryParameters[parameterName];
                    queryParameters[parameterName] = parameter;
                });
            }

            request('POST', domain + path, body, headers, queryParameters, form, reject, resolve, errorHandlers);

        });
    };

    /**
     * Fetch fraction genome altered
     * @method
     * @name CBioPortalAPIInternal#fetchFractionGenomeAlteredUsingPOST
     * @param {string} studyId - Study ID e.g. acc_tcga
     * @param {} fractionGenomeAlteredFilter - List of Sample IDs/Sample List ID
     */
    fetchFractionGenomeAlteredUsingPOST(parameters: {
            'studyId': string,
            'fractionGenomeAlteredFilter': FractionGenomeAlteredFilter,
            $queryParameters ? : any,
            $domain ? : string
        }): Promise < Array < FractionGenomeAltered >
        > {
            return this.fetchFractionGenomeAlteredUsingPOSTWithHttpInfo(parameters).then(function(response: request.Response) {
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
    getSignificantCopyNumberRegionsUsingGETWithHttpInfo(parameters: {
        'studyId': string,
        'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
        'pageSize' ? : number,
        'pageNumber' ? : number,
        'sortBy' ? : "chromosome" | "cytoband" | "widePeakStart" | "widePeakEnd" | "qValue" | "amp",
        'direction' ? : "ASC" | "DESC",
        $queryParameters ? : any,
        $domain ? : string
    }): Promise < request.Response > {
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

        });
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
            return this.getSignificantCopyNumberRegionsUsingGETWithHttpInfo(parameters).then(function(response: request.Response) {
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
    getSignificantlyMutatedGenesUsingGETWithHttpInfo(parameters: {
        'studyId': string,
        'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
        'pageSize' ? : number,
        'pageNumber' ? : number,
        'sortBy' ? : "entrezGeneId" | "hugoGeneSymbol" | "rank" | "numberOfMutations" | "pValue" | "qValue",
        'direction' ? : "ASC" | "DESC",
        $queryParameters ? : any,
        $domain ? : string
    }): Promise < request.Response > {
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

        });
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
            return this.getSignificantlyMutatedGenesUsingGETWithHttpInfo(parameters).then(function(response: request.Response) {
                return response.body;
            });
        };
}