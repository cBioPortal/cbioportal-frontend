import * as request from "superagent";
import {
    SuperAgentStatic
}
from "superagent";

type CallbackHandler = (err: any, res ? : request.Response) => void;
export type ClinicalData = {
    'clinicalAttribute': ClinicalAttribute

        'clinicalAttributeId': string

        'entityId': string

        'value': string

};
export type SampleIdentifier = {
    'sampleId': string

        'studyId': string

};
export type Sample = {
    'cancerTypeId': string

        'patientId': string

        'sampleId': string

        'sampleType': "Primary Solid Tumor" | "Recurrent Solid Tumor" | "Primary Blood Tumor" | "Recurrent Blood Tumor" | "Metastatic" | "Blood Derived Normal" | "Solid Tissues Normal"

        'studyId': string

};
export type CopyNumberSeg = {
    'chromosome': string

        'end': number

        'numberOfProbes': number

        'sampleId': string

        'segmentMean': number

        'start': number

        'studyId': string

};
export type GeneticProfile = {
    'datatype': string

        'description': string

        'geneticAlterationType': "MUTATION_EXTENDED" | "FUSION" | "STRUCTURAL_VARIANT" | "COPY_NUMBER_ALTERATION" | "MICRO_RNA_EXPRESSION" | "MRNA_EXPRESSION" | "MRNA_EXPRESSION_NORMALS" | "RNA_EXPRESSION" | "METHYLATION" | "METHYLATION_BINARY" | "PHOSPHORYLATION" | "PROTEIN_LEVEL" | "PROTEIN_ARRAY_PROTEIN_LEVEL" | "PROTEIN_ARRAY_PHOSPHORYLATION"

        'geneticProfileId': string

        'name': string

        'showProfileInAnalysisTab': boolean

        'study': CancerStudy

        'studyId': string

};
export type Patient = {
    'patientId': string

        'studyId': string

};
export type TypeOfCancer = {
    'cancerTypeId': string

        'clinicalTrialKeywords': string

        'dedicatedColor': string

        'name': string

        'parent': string

        'shortName': string

};
export type ClinicalDataIdentifier = {
    'entityId': string

        'studyId': string

};
export type PatientIdentifier = {
    'patientId': string

        'studyId': string

};
export type Gene = {
    'chromosome': string

        'cytoband': string

        'entrezGeneId': number

        'hugoGeneSymbol': string

        'length': number

        'type': string

};
export type DiscreteCopyNumberData = {
    'alteration': number

        'entrezGeneId': number

        'gene': Gene

        'geneticProfileId': string

        'sampleId': string

};
export type CancerStudy = {
    'allSampleCount': number

        'cancerType': TypeOfCancer

        'cancerTypeId': string

        'citation': string

        'cnaSampleCount': number

        'completeSampleCount': number

        'description': string

        'groups': string

        'importDate': string

        'methylationHm27SampleCount': number

        'miRnaSampleCount': number

        'mrnaMicroarraySampleCount': number

        'mrnaRnaSeqV2SampleCount': number

        'name': string

        'pmid': string

        'publicStudy': boolean

        'rppaSampleCount': number

        'sequencedSampleCount': number

        'shortName': string

        'status': number

        'studyId': string

};
export type GeneticData = {
    'entrezGeneId': number

        'gene': Gene

        'value': string

};
export type Mutation = {
    'aminoAcidChange': string

        'center': string

        'endPosition': number

        'entrezGeneId': number

        'fisValue': number

        'functionalImpactScore': string

        'gene': Gene

        'geneticProfileId': string

        'keyword': string

        'linkMsa': string

        'linkPdb': string

        'linkXvar': string

        'mutationStatus': string

        'mutationType': string

        'ncbiBuild': string

        'normalAltCount': number

        'normalRefCount': number

        'proteinChange': string

        'proteinPosEnd': number

        'proteinPosStart': number

        'referenceAllele': string

        'refseqMrnaId': string

        'sampleId': string

        'startPosition': number

        'tumorAltCount': number

        'tumorRefCount': number

        'validationStatus': string

        'variantAllele': string

        'variantType': string

};
export type ClinicalAttribute = {
    'clinicalAttributeId': string

        'datatype': string

        'description': string

        'displayName': string

        'patientAttribute': boolean

        'priority': string

};
export type SampleList = {
    'category': string

        'description': string

        'name': string

        'sampleListId': string

        'studyId': string

};

/**
 * A web service for supplying JSON formatted data to cBioPortal clients.
 * @class CBioPortalAPI
 * @param {(string)} [domainOrOptions] - The project domain.
 */
export default class CBioPortalAPI {

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

    getAllCancerTypesUsingGETURL(parameters: {
        'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
        'pageSize' ? : number,
        'pageNumber' ? : number,
        'sortBy' ? : "cancerTypeId" | "name" | "clinicalTrialKeywords" | "dedicatedColor" | "shortName" | "parent",
        'direction' ? : "ASC" | "DESC",
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/cancer-types';
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
     * Get all cancer types
     * @method
     * @name CBioPortalAPI#getAllCancerTypesUsingGET
     * @param {string} projection - Level of detail of the response
     * @param {integer} pageSize - Page size of the result list
     * @param {integer} pageNumber - Page number of the result list
     * @param {string} sortBy - Name of the property that the result list is sorted by
     * @param {string} direction - Direction of the sort
     */
    getAllCancerTypesUsingGET(parameters: {
            'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
            'pageSize' ? : number,
            'pageNumber' ? : number,
            'sortBy' ? : "cancerTypeId" | "name" | "clinicalTrialKeywords" | "dedicatedColor" | "shortName" | "parent",
            'direction' ? : "ASC" | "DESC",
            $queryParameters ? : any,
                $domain ? : string
        }): Promise < Array < TypeOfCancer >
        > {
            const domain = parameters.$domain ? parameters.$domain : this.domain;
            const errorHandlers = this.errorHandlers;
            const request = this.request;
            let path = '/cancer-types';
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

    getCancerTypeUsingGETURL(parameters: {
        'cancerTypeId': string,
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/cancer-types/{cancerTypeId}';

        path = path.replace('{cancerTypeId}', parameters['cancerTypeId']);

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
     * Get a cancer type
     * @method
     * @name CBioPortalAPI#getCancerTypeUsingGET
     * @param {string} cancerTypeId - Cancer Type ID e.g. acc
     */
    getCancerTypeUsingGET(parameters: {
        'cancerTypeId': string,
        $queryParameters ? : any,
        $domain ? : string
    }): Promise < TypeOfCancer > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        const errorHandlers = this.errorHandlers;
        const request = this.request;
        let path = '/cancer-types/{cancerTypeId}';
        let body: any;
        let queryParameters: any = {};
        let headers: any = {};
        let form: any = {};
        return new Promise(function(resolve, reject) {
            headers['Accept'] = 'application/json';
            headers['Content-Type'] = 'application/json';

            path = path.replace('{cancerTypeId}', parameters['cancerTypeId']);

            if (parameters['cancerTypeId'] === undefined) {
                reject(new Error('Missing required  parameter: cancerTypeId'));
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

    getAllClinicalAttributesUsingGETURL(parameters: {
        'studyId' ? : string,
        'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
        'pageSize' ? : number,
        'pageNumber' ? : number,
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/clinical-attributes';
        if (parameters['studyId'] !== undefined) {
            queryParameters['studyId'] = parameters['studyId'];
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
     * Get all clinical attributes
     * @method
     * @name CBioPortalAPI#getAllClinicalAttributesUsingGET
     * @param {string} studyId - studyId
     * @param {string} projection - projection
     * @param {integer} pageSize - pageSize
     * @param {integer} pageNumber - pageNumber
     */
    getAllClinicalAttributesUsingGET(parameters: {
            'studyId' ? : string,
            'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
            'pageSize' ? : number,
            'pageNumber' ? : number,
            $queryParameters ? : any,
                $domain ? : string
        }): Promise < Array < ClinicalAttribute >
        > {
            const domain = parameters.$domain ? parameters.$domain : this.domain;
            const errorHandlers = this.errorHandlers;
            const request = this.request;
            let path = '/clinical-attributes';
            let body: any;
            let queryParameters: any = {};
            let headers: any = {};
            let form: any = {};
            return new Promise(function(resolve, reject) {
                headers['Accept'] = '*/*';
                headers['Content-Type'] = 'application/json';

                if (parameters['studyId'] !== undefined) {
                    queryParameters['studyId'] = parameters['studyId'];
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

    getClinicalAttributeUsingGETURL(parameters: {
        'clinicalAttributeId': string,
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/clinical-attributes/{clinicalAttributeId}';

        path = path.replace('{clinicalAttributeId}', parameters['clinicalAttributeId']);

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
     * Get a clinical attribute
     * @method
     * @name CBioPortalAPI#getClinicalAttributeUsingGET
     * @param {string} clinicalAttributeId - clinicalAttributeId
     */
    getClinicalAttributeUsingGET(parameters: {
        'clinicalAttributeId': string,
        $queryParameters ? : any,
        $domain ? : string
    }): Promise < ClinicalAttribute > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        const errorHandlers = this.errorHandlers;
        const request = this.request;
        let path = '/clinical-attributes/{clinicalAttributeId}';
        let body: any;
        let queryParameters: any = {};
        let headers: any = {};
        let form: any = {};
        return new Promise(function(resolve, reject) {
            headers['Accept'] = '*/*';
            headers['Content-Type'] = 'application/json';

            path = path.replace('{clinicalAttributeId}', parameters['clinicalAttributeId']);

            if (parameters['clinicalAttributeId'] === undefined) {
                reject(new Error('Missing required  parameter: clinicalAttributeId'));
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

    fetchClinicalDataUsingPOSTURL(parameters: {
        'attributeId' ? : string,
        'clinicalDataType' ? : "SAMPLE" | "PATIENT",
        'identifiers': Array < ClinicalDataIdentifier > | ClinicalDataIdentifier

        ,
        'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/clinical-data/fetch';
        if (parameters['attributeId'] !== undefined) {
            queryParameters['attributeId'] = parameters['attributeId'];
        }

        if (parameters['clinicalDataType'] !== undefined) {
            queryParameters['clinicalDataType'] = parameters['clinicalDataType'];
        }

        if (parameters['projection'] !== undefined) {
            queryParameters['projection'] = parameters['projection'];
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
     * Fetch clinical data by patient IDs or sample IDs
     * @method
     * @name CBioPortalAPI#fetchClinicalDataUsingPOST
     * @param {string} attributeId - Attribute ID e.g. CANCER_TYPE
     * @param {string} clinicalDataType - Type of the clinical data
     * @param {} identifiers - List of patient or sample identifiers
     * @param {string} projection - Level of detail of the response
     */
    fetchClinicalDataUsingPOST(parameters: {
            'attributeId' ? : string,
            'clinicalDataType' ? : "SAMPLE" | "PATIENT",
            'identifiers': Array < ClinicalDataIdentifier > | ClinicalDataIdentifier

            ,
            'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
            $queryParameters ? : any,
                $domain ? : string
        }): Promise < Array < ClinicalData >
        > {
            const domain = parameters.$domain ? parameters.$domain : this.domain;
            const errorHandlers = this.errorHandlers;
            const request = this.request;
            let path = '/clinical-data/fetch';
            let body: any;
            let queryParameters: any = {};
            let headers: any = {};
            let form: any = {};
            return new Promise(function(resolve, reject) {
                headers['Accept'] = 'application/json';
                headers['Content-Type'] = 'application/json';

                if (parameters['attributeId'] !== undefined) {
                    queryParameters['attributeId'] = parameters['attributeId'];
                }

                if (parameters['clinicalDataType'] !== undefined) {
                    queryParameters['clinicalDataType'] = parameters['clinicalDataType'];
                }

                if (parameters['identifiers'] !== undefined) {
                    body = parameters['identifiers'];
                }

                if (parameters['identifiers'] === undefined) {
                    reject(new Error('Missing required  parameter: identifiers'));
                    return;
                }

                if (parameters['projection'] !== undefined) {
                    queryParameters['projection'] = parameters['projection'];
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

    fetchCopyNumberSegmentsUsingPOSTURL(parameters: {
        'sampleIdentifiers': Array < SampleIdentifier > | SampleIdentifier

        ,
        'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/copy-number-segments/fetch';

        if (parameters['projection'] !== undefined) {
            queryParameters['projection'] = parameters['projection'];
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
     * Fetch copy number segments by sample ID
     * @method
     * @name CBioPortalAPI#fetchCopyNumberSegmentsUsingPOST
     * @param {} sampleIdentifiers - List of sample identifiers
     * @param {string} projection - Level of detail of the response
     */
    fetchCopyNumberSegmentsUsingPOST(parameters: {
            'sampleIdentifiers': Array < SampleIdentifier > | SampleIdentifier

            ,
            'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
            $queryParameters ? : any,
            $domain ? : string
        }): Promise < Array < CopyNumberSeg >
        > {
            const domain = parameters.$domain ? parameters.$domain : this.domain;
            const errorHandlers = this.errorHandlers;
            const request = this.request;
            let path = '/copy-number-segments/fetch';
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

                if (parameters['projection'] !== undefined) {
                    queryParameters['projection'] = parameters['projection'];
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

    getAllGenesUsingGETURL(parameters: {
        'alias' ? : string,
        'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
        'pageSize' ? : number,
        'pageNumber' ? : number,
        'sortBy' ? : "entrezGeneId" | "hugoGeneSymbol" | "type" | "cytoband" | "length",
        'direction' ? : "ASC" | "DESC",
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/genes';
        if (parameters['alias'] !== undefined) {
            queryParameters['alias'] = parameters['alias'];
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
        let keys = Object.keys(queryParameters);
        return this.domain + path + (keys.length > 0 ? '?' + (keys.map(key => key + '=' + encodeURIComponent(queryParameters[key])).join('&')) : '');
    };

    /**
     * Get all genes
     * @method
     * @name CBioPortalAPI#getAllGenesUsingGET
     * @param {string} alias - Alias of the gene
     * @param {string} projection - Level of detail of the response
     * @param {integer} pageSize - Page size of the result list
     * @param {integer} pageNumber - Page number of the result list
     * @param {string} sortBy - Name of the property that the result list is sorted by
     * @param {string} direction - Direction of the sort
     */
    getAllGenesUsingGET(parameters: {
            'alias' ? : string,
            'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
            'pageSize' ? : number,
            'pageNumber' ? : number,
            'sortBy' ? : "entrezGeneId" | "hugoGeneSymbol" | "type" | "cytoband" | "length",
            'direction' ? : "ASC" | "DESC",
            $queryParameters ? : any,
                $domain ? : string
        }): Promise < Array < Gene >
        > {
            const domain = parameters.$domain ? parameters.$domain : this.domain;
            const errorHandlers = this.errorHandlers;
            const request = this.request;
            let path = '/genes';
            let body: any;
            let queryParameters: any = {};
            let headers: any = {};
            let form: any = {};
            return new Promise(function(resolve, reject) {
                headers['Accept'] = 'application/json';
                headers['Content-Type'] = 'application/json';

                if (parameters['alias'] !== undefined) {
                    queryParameters['alias'] = parameters['alias'];
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

    fetchGenesUsingPOSTURL(parameters: {
        'geneIdType' ? : "ENTREZ_GENE_ID" | "HUGO_GENE_SYMBOL",
        'geneIds': Array < string > | string

        ,
        'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/genes/fetch';
        if (parameters['geneIdType'] !== undefined) {
            queryParameters['geneIdType'] = parameters['geneIdType'];
        }

        if (parameters['projection'] !== undefined) {
            queryParameters['projection'] = parameters['projection'];
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
     * Fetch genes by ID
     * @method
     * @name CBioPortalAPI#fetchGenesUsingPOST
     * @param {string} geneIdType - Type of gene ID
     * @param {} geneIds - List of Entrez Gene IDs or Hugo Gene Symbols
     * @param {string} projection - Level of detail of the response
     */
    fetchGenesUsingPOST(parameters: {
            'geneIdType' ? : "ENTREZ_GENE_ID" | "HUGO_GENE_SYMBOL",
            'geneIds': Array < string > | string

            ,
            'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
            $queryParameters ? : any,
                $domain ? : string
        }): Promise < Array < Gene >
        > {
            const domain = parameters.$domain ? parameters.$domain : this.domain;
            const errorHandlers = this.errorHandlers;
            const request = this.request;
            let path = '/genes/fetch';
            let body: any;
            let queryParameters: any = {};
            let headers: any = {};
            let form: any = {};
            return new Promise(function(resolve, reject) {
                headers['Accept'] = 'application/json';
                headers['Content-Type'] = 'application/json';

                if (parameters['geneIdType'] !== undefined) {
                    queryParameters['geneIdType'] = parameters['geneIdType'];
                }

                if (parameters['geneIds'] !== undefined) {
                    body = parameters['geneIds'];
                }

                if (parameters['geneIds'] === undefined) {
                    reject(new Error('Missing required  parameter: geneIds'));
                    return;
                }

                if (parameters['projection'] !== undefined) {
                    queryParameters['projection'] = parameters['projection'];
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

    getGeneUsingGETURL(parameters: {
        'geneId': string,
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/genes/{geneId}';

        path = path.replace('{geneId}', parameters['geneId']);

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
     * Get a gene
     * @method
     * @name CBioPortalAPI#getGeneUsingGET
     * @param {string} geneId - Entrez Gene ID or Hugo Gene Symbol e.g. 1 or A1BG
     */
    getGeneUsingGET(parameters: {
        'geneId': string,
        $queryParameters ? : any,
        $domain ? : string
    }): Promise < Gene > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        const errorHandlers = this.errorHandlers;
        const request = this.request;
        let path = '/genes/{geneId}';
        let body: any;
        let queryParameters: any = {};
        let headers: any = {};
        let form: any = {};
        return new Promise(function(resolve, reject) {
            headers['Accept'] = 'application/json';
            headers['Content-Type'] = 'application/json';

            path = path.replace('{geneId}', parameters['geneId']);

            if (parameters['geneId'] === undefined) {
                reject(new Error('Missing required  parameter: geneId'));
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

    getAliasesOfGeneUsingGETURL(parameters: {
        'geneId': string,
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/genes/{geneId}/aliases';

        path = path.replace('{geneId}', parameters['geneId']);

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
     * Get aliases of a gene
     * @method
     * @name CBioPortalAPI#getAliasesOfGeneUsingGET
     * @param {string} geneId - Entrez Gene ID or Hugo Gene Symbol e.g. 1 or A1BG
     */
    getAliasesOfGeneUsingGET(parameters: {
            'geneId': string,
            $queryParameters ? : any,
            $domain ? : string
        }): Promise < Array < string >
        > {
            const domain = parameters.$domain ? parameters.$domain : this.domain;
            const errorHandlers = this.errorHandlers;
            const request = this.request;
            let path = '/genes/{geneId}/aliases';
            let body: any;
            let queryParameters: any = {};
            let headers: any = {};
            let form: any = {};
            return new Promise(function(resolve, reject) {
                headers['Accept'] = 'application/json';
                headers['Content-Type'] = 'application/json';

                path = path.replace('{geneId}', parameters['geneId']);

                if (parameters['geneId'] === undefined) {
                    reject(new Error('Missing required  parameter: geneId'));
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

    queryGeneticDataByExampleUsingPOSTURL(parameters: {
        'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
        'pageSize' ? : number,
        'pageNumber' ? : number,
        'exampleGenericData': GeneticData,
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/genetic-data/query';
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
     * Query genetic data by example
     * @method
     * @name CBioPortalAPI#queryGeneticDataByExampleUsingPOST
     * @param {string} projection - projection
     * @param {integer} pageSize - pageSize
     * @param {integer} pageNumber - pageNumber
     * @param {} exampleGenericData - exampleGenericData
     */
    queryGeneticDataByExampleUsingPOST(parameters: {
            'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
            'pageSize' ? : number,
            'pageNumber' ? : number,
            'exampleGenericData': GeneticData,
            $queryParameters ? : any,
                $domain ? : string
        }): Promise < Array < GeneticData >
        > {
            const domain = parameters.$domain ? parameters.$domain : this.domain;
            const errorHandlers = this.errorHandlers;
            const request = this.request;
            let path = '/genetic-data/query';
            let body: any;
            let queryParameters: any = {};
            let headers: any = {};
            let form: any = {};
            return new Promise(function(resolve, reject) {
                headers['Accept'] = '*/*';
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

                if (parameters['exampleGenericData'] !== undefined) {
                    body = parameters['exampleGenericData'];
                }

                if (parameters['exampleGenericData'] === undefined) {
                    reject(new Error('Missing required  parameter: exampleGenericData'));
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

    getAllGeneticProfilesUsingGETURL(parameters: {
        'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
        'pageSize' ? : number,
        'pageNumber' ? : number,
        'sortBy' ? : "geneticProfileId" | "geneticAlterationType" | "datatype" | "name" | "description" | "showProfileInAnalysisTab",
        'direction' ? : "ASC" | "DESC",
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/genetic-profiles';
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
     * Get all genetic profiles
     * @method
     * @name CBioPortalAPI#getAllGeneticProfilesUsingGET
     * @param {string} projection - Level of detail of the response
     * @param {integer} pageSize - Page size of the result list
     * @param {integer} pageNumber - Page number of the result list
     * @param {string} sortBy - Name of the property that the result list is sorted by
     * @param {string} direction - Direction of the sort
     */
    getAllGeneticProfilesUsingGET(parameters: {
            'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
            'pageSize' ? : number,
            'pageNumber' ? : number,
            'sortBy' ? : "geneticProfileId" | "geneticAlterationType" | "datatype" | "name" | "description" | "showProfileInAnalysisTab",
            'direction' ? : "ASC" | "DESC",
            $queryParameters ? : any,
                $domain ? : string
        }): Promise < Array < GeneticProfile >
        > {
            const domain = parameters.$domain ? parameters.$domain : this.domain;
            const errorHandlers = this.errorHandlers;
            const request = this.request;
            let path = '/genetic-profiles';
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

    getGeneticProfileUsingGETURL(parameters: {
        'geneticProfileId': string,
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/genetic-profiles/{geneticProfileId}';

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
     * Get genetic profile
     * @method
     * @name CBioPortalAPI#getGeneticProfileUsingGET
     * @param {string} geneticProfileId - Genetic Profile ID e.g. acc_tcga_mutations
     */
    getGeneticProfileUsingGET(parameters: {
        'geneticProfileId': string,
        $queryParameters ? : any,
        $domain ? : string
    }): Promise < GeneticProfile > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        const errorHandlers = this.errorHandlers;
        const request = this.request;
        let path = '/genetic-profiles/{geneticProfileId}';
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

    getDiscreteCopyNumbersInGeneticProfileUsingGETURL(parameters: {
        'geneticProfileId': string,
        'sampleId': string,
        'discreteCopyNumberEventType' ? : "HOMDEL_AND_AMP" | "HOMDEL" | "AMP" | "GAIN" | "HETLOSS" | "DIPLOID" | "ALL",
        'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/genetic-profiles/{geneticProfileId}/discrete-copy-number';

        path = path.replace('{geneticProfileId}', parameters['geneticProfileId']);
        if (parameters['sampleId'] !== undefined) {
            queryParameters['sampleId'] = parameters['sampleId'];
        }

        if (parameters['discreteCopyNumberEventType'] !== undefined) {
            queryParameters['discreteCopyNumberEventType'] = parameters['discreteCopyNumberEventType'];
        }

        if (parameters['projection'] !== undefined) {
            queryParameters['projection'] = parameters['projection'];
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
     * Get discrete copy number alterations in a genetic profile
     * @method
     * @name CBioPortalAPI#getDiscreteCopyNumbersInGeneticProfileUsingGET
     * @param {string} geneticProfileId - Genetic Profile ID e.g. acc_tcga_gistic
     * @param {string} sampleId - Sample ID e.g. TCGA-OR-A5J2-01
     * @param {string} discreteCopyNumberEventType - Type of the copy number event
     * @param {string} projection - Level of detail of the response
     */
    getDiscreteCopyNumbersInGeneticProfileUsingGET(parameters: {
            'geneticProfileId': string,
            'sampleId': string,
            'discreteCopyNumberEventType' ? : "HOMDEL_AND_AMP" | "HOMDEL" | "AMP" | "GAIN" | "HETLOSS" | "DIPLOID" | "ALL",
            'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
            $queryParameters ? : any,
            $domain ? : string
        }): Promise < Array < DiscreteCopyNumberData >
        > {
            const domain = parameters.$domain ? parameters.$domain : this.domain;
            const errorHandlers = this.errorHandlers;
            const request = this.request;
            let path = '/genetic-profiles/{geneticProfileId}/discrete-copy-number';
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

                if (parameters['discreteCopyNumberEventType'] !== undefined) {
                    queryParameters['discreteCopyNumberEventType'] = parameters['discreteCopyNumberEventType'];
                }

                if (parameters['projection'] !== undefined) {
                    queryParameters['projection'] = parameters['projection'];
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

    fetchDiscreteCopyNumbersInGeneticProfileUsingPOSTURL(parameters: {
        'geneticProfileId': string,
        'discreteCopyNumberEventType' ? : "HOMDEL_AND_AMP" | "HOMDEL" | "AMP" | "GAIN" | "HETLOSS" | "DIPLOID" | "ALL",
        'sampleIds': Array < string > | string

        ,
        'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/genetic-profiles/{geneticProfileId}/discrete-copy-number/fetch';

        path = path.replace('{geneticProfileId}', parameters['geneticProfileId']);
        if (parameters['discreteCopyNumberEventType'] !== undefined) {
            queryParameters['discreteCopyNumberEventType'] = parameters['discreteCopyNumberEventType'];
        }

        if (parameters['projection'] !== undefined) {
            queryParameters['projection'] = parameters['projection'];
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
     * Fetch discrete copy number alterations in a genetic profile by sample ID
     * @method
     * @name CBioPortalAPI#fetchDiscreteCopyNumbersInGeneticProfileUsingPOST
     * @param {string} geneticProfileId - Genetic Profile ID e.g. acc_tcga_gistic
     * @param {string} discreteCopyNumberEventType - Type of the copy number event
     * @param {} sampleIds - List of Sample IDs
     * @param {string} projection - Level of detail of the response
     */
    fetchDiscreteCopyNumbersInGeneticProfileUsingPOST(parameters: {
            'geneticProfileId': string,
            'discreteCopyNumberEventType' ? : "HOMDEL_AND_AMP" | "HOMDEL" | "AMP" | "GAIN" | "HETLOSS" | "DIPLOID" | "ALL",
            'sampleIds': Array < string > | string

            ,
            'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
            $queryParameters ? : any,
            $domain ? : string
        }): Promise < Array < DiscreteCopyNumberData >
        > {
            const domain = parameters.$domain ? parameters.$domain : this.domain;
            const errorHandlers = this.errorHandlers;
            const request = this.request;
            let path = '/genetic-profiles/{geneticProfileId}/discrete-copy-number/fetch';
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

                if (parameters['discreteCopyNumberEventType'] !== undefined) {
                    queryParameters['discreteCopyNumberEventType'] = parameters['discreteCopyNumberEventType'];
                }

                if (parameters['sampleIds'] !== undefined) {
                    body = parameters['sampleIds'];
                }

                if (parameters['sampleIds'] === undefined) {
                    reject(new Error('Missing required  parameter: sampleIds'));
                    return;
                }

                if (parameters['projection'] !== undefined) {
                    queryParameters['projection'] = parameters['projection'];
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

    getAllGeneticDataInGeneticProfileUsingGETURL(parameters: {
        'geneticProfileId': string,
        'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
        'pageSize' ? : number,
        'pageNumber' ? : number,
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/genetic-profiles/{geneticProfileId}/genetic-data';

        path = path.replace('{geneticProfileId}', parameters['geneticProfileId']);
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
     * Get all genetic data in a genetic profile
     * @method
     * @name CBioPortalAPI#getAllGeneticDataInGeneticProfileUsingGET
     * @param {string} geneticProfileId - geneticProfileId
     * @param {string} projection - projection
     * @param {integer} pageSize - pageSize
     * @param {integer} pageNumber - pageNumber
     */
    getAllGeneticDataInGeneticProfileUsingGET(parameters: {
            'geneticProfileId': string,
            'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
            'pageSize' ? : number,
            'pageNumber' ? : number,
            $queryParameters ? : any,
            $domain ? : string
        }): Promise < Array < GeneticData >
        > {
            const domain = parameters.$domain ? parameters.$domain : this.domain;
            const errorHandlers = this.errorHandlers;
            const request = this.request;
            let path = '/genetic-profiles/{geneticProfileId}/genetic-data';
            let body: any;
            let queryParameters: any = {};
            let headers: any = {};
            let form: any = {};
            return new Promise(function(resolve, reject) {
                headers['Accept'] = '*/*';
                headers['Content-Type'] = 'application/json';

                path = path.replace('{geneticProfileId}', parameters['geneticProfileId']);

                if (parameters['geneticProfileId'] === undefined) {
                    reject(new Error('Missing required  parameter: geneticProfileId'));
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

    getMutationsInGeneticProfileUsingGETURL(parameters: {
        'geneticProfileId': string,
        'sampleId': string,
        'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
        'pageSize' ? : number,
        'pageNumber' ? : number,
        'sortBy' ? : "entrezGeneId" | "center" | "mutationStatus" | "validationStatus" | "tumorAltCount" | "tumorRefCount" | "normalAltCount" | "normalRefCount" | "aminoAcidChange" | "startPosition" | "endPosition" | "referenceAllele" | "variantAllele" | "proteinChange" | "mutationType" | "ncbiBuild" | "variantType" | "refseqMrnaId" | "proteinPosStart" | "proteinPosEnd" | "keyword",
        'direction' ? : "ASC" | "DESC",
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/genetic-profiles/{geneticProfileId}/mutations';

        path = path.replace('{geneticProfileId}', parameters['geneticProfileId']);
        if (parameters['sampleId'] !== undefined) {
            queryParameters['sampleId'] = parameters['sampleId'];
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
        let keys = Object.keys(queryParameters);
        return this.domain + path + (keys.length > 0 ? '?' + (keys.map(key => key + '=' + encodeURIComponent(queryParameters[key])).join('&')) : '');
    };

    /**
     * Get mutations in a genetic profile
     * @method
     * @name CBioPortalAPI#getMutationsInGeneticProfileUsingGET
     * @param {string} geneticProfileId - Genetic Profile ID e.g. acc_tcga_mutations
     * @param {string} sampleId - Sample ID e.g. TCGA-OR-A5J2-01
     * @param {string} projection - Level of detail of the response
     * @param {integer} pageSize - Page size of the result list
     * @param {integer} pageNumber - Page number of the result list
     * @param {string} sortBy - Name of the property that the result list is sorted by
     * @param {string} direction - Direction of the sort
     */
    getMutationsInGeneticProfileUsingGET(parameters: {
            'geneticProfileId': string,
            'sampleId': string,
            'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
            'pageSize' ? : number,
            'pageNumber' ? : number,
            'sortBy' ? : "entrezGeneId" | "center" | "mutationStatus" | "validationStatus" | "tumorAltCount" | "tumorRefCount" | "normalAltCount" | "normalRefCount" | "aminoAcidChange" | "startPosition" | "endPosition" | "referenceAllele" | "variantAllele" | "proteinChange" | "mutationType" | "ncbiBuild" | "variantType" | "refseqMrnaId" | "proteinPosStart" | "proteinPosEnd" | "keyword",
            'direction' ? : "ASC" | "DESC",
            $queryParameters ? : any,
            $domain ? : string
        }): Promise < Array < Mutation >
        > {
            const domain = parameters.$domain ? parameters.$domain : this.domain;
            const errorHandlers = this.errorHandlers;
            const request = this.request;
            let path = '/genetic-profiles/{geneticProfileId}/mutations';
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

    fetchMutationsInGeneticProfileUsingPOSTURL(parameters: {
        'geneticProfileId': string,
        'sampleIds': Array < string > | string

        ,
        'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
        'pageSize' ? : number,
        'pageNumber' ? : number,
        'sortBy' ? : "entrezGeneId" | "center" | "mutationStatus" | "validationStatus" | "tumorAltCount" | "tumorRefCount" | "normalAltCount" | "normalRefCount" | "aminoAcidChange" | "startPosition" | "endPosition" | "referenceAllele" | "variantAllele" | "proteinChange" | "mutationType" | "ncbiBuild" | "variantType" | "refseqMrnaId" | "proteinPosStart" | "proteinPosEnd" | "keyword",
        'direction' ? : "ASC" | "DESC",
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/genetic-profiles/{geneticProfileId}/mutations/fetch';

        path = path.replace('{geneticProfileId}', parameters['geneticProfileId']);

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
     * Fetch mutations in a genetic profile by sample ID
     * @method
     * @name CBioPortalAPI#fetchMutationsInGeneticProfileUsingPOST
     * @param {string} geneticProfileId - Genetic Profile ID e.g. acc_tcga_mutations
     * @param {} sampleIds - List of Sample IDs
     * @param {string} projection - Level of detail of the response
     * @param {integer} pageSize - Page size of the result list
     * @param {integer} pageNumber - Page number of the result list
     * @param {string} sortBy - Name of the property that the result list is sorted by
     * @param {string} direction - Direction of the sort
     */
    fetchMutationsInGeneticProfileUsingPOST(parameters: {
            'geneticProfileId': string,
            'sampleIds': Array < string > | string

            ,
            'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
            'pageSize' ? : number,
            'pageNumber' ? : number,
            'sortBy' ? : "entrezGeneId" | "center" | "mutationStatus" | "validationStatus" | "tumorAltCount" | "tumorRefCount" | "normalAltCount" | "normalRefCount" | "aminoAcidChange" | "startPosition" | "endPosition" | "referenceAllele" | "variantAllele" | "proteinChange" | "mutationType" | "ncbiBuild" | "variantType" | "refseqMrnaId" | "proteinPosStart" | "proteinPosEnd" | "keyword",
            'direction' ? : "ASC" | "DESC",
            $queryParameters ? : any,
            $domain ? : string
        }): Promise < Array < Mutation >
        > {
            const domain = parameters.$domain ? parameters.$domain : this.domain;
            const errorHandlers = this.errorHandlers;
            const request = this.request;
            let path = '/genetic-profiles/{geneticProfileId}/mutations/fetch';
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

                if (parameters['sampleIds'] !== undefined) {
                    body = parameters['sampleIds'];
                }

                if (parameters['sampleIds'] === undefined) {
                    reject(new Error('Missing required  parameter: sampleIds'));
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

                request('POST', domain + path, body, headers, queryParameters, form, reject, resolve, errorHandlers);

            }).then(function(response: request.Response) {
                return response.body;
            });
        };

    fetchPatientsUsingPOSTURL(parameters: {
        'patientIdentifiers': Array < PatientIdentifier > | PatientIdentifier

        ,
        'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/patients/fetch';

        if (parameters['projection'] !== undefined) {
            queryParameters['projection'] = parameters['projection'];
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
     * Fetch patients by ID
     * @method
     * @name CBioPortalAPI#fetchPatientsUsingPOST
     * @param {} patientIdentifiers - List of patient identifiers
     * @param {string} projection - Level of detail of the response
     */
    fetchPatientsUsingPOST(parameters: {
            'patientIdentifiers': Array < PatientIdentifier > | PatientIdentifier

            ,
            'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
            $queryParameters ? : any,
            $domain ? : string
        }): Promise < Array < Patient >
        > {
            const domain = parameters.$domain ? parameters.$domain : this.domain;
            const errorHandlers = this.errorHandlers;
            const request = this.request;
            let path = '/patients/fetch';
            let body: any;
            let queryParameters: any = {};
            let headers: any = {};
            let form: any = {};
            return new Promise(function(resolve, reject) {
                headers['Accept'] = 'application/json';
                headers['Content-Type'] = 'application/json';

                if (parameters['patientIdentifiers'] !== undefined) {
                    body = parameters['patientIdentifiers'];
                }

                if (parameters['patientIdentifiers'] === undefined) {
                    reject(new Error('Missing required  parameter: patientIdentifiers'));
                    return;
                }

                if (parameters['projection'] !== undefined) {
                    queryParameters['projection'] = parameters['projection'];
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

    getAllSampleListsUsingGETURL(parameters: {
        'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
        'pageSize' ? : number,
        'pageNumber' ? : number,
        'sortBy' ? : "sampleListId" | "category" | "cancerStudyId" | "name" | "description",
        'direction' ? : "ASC" | "DESC",
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/sample-lists';
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
     * Get all sample lists
     * @method
     * @name CBioPortalAPI#getAllSampleListsUsingGET
     * @param {string} projection - Level of detail of the response
     * @param {integer} pageSize - Page size of the result list
     * @param {integer} pageNumber - Page number of the result list
     * @param {string} sortBy - Name of the property that the result list is sorted by
     * @param {string} direction - Direction of the sort
     */
    getAllSampleListsUsingGET(parameters: {
            'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
            'pageSize' ? : number,
            'pageNumber' ? : number,
            'sortBy' ? : "sampleListId" | "category" | "cancerStudyId" | "name" | "description",
            'direction' ? : "ASC" | "DESC",
            $queryParameters ? : any,
                $domain ? : string
        }): Promise < Array < SampleList >
        > {
            const domain = parameters.$domain ? parameters.$domain : this.domain;
            const errorHandlers = this.errorHandlers;
            const request = this.request;
            let path = '/sample-lists';
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

    getSampleListUsingGETURL(parameters: {
        'sampleListId': string,
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/sample-lists/{sampleListId}';

        path = path.replace('{sampleListId}', parameters['sampleListId']);

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
     * Get sample list
     * @method
     * @name CBioPortalAPI#getSampleListUsingGET
     * @param {string} sampleListId - Sample List ID e.g. acc_tcga_all
     */
    getSampleListUsingGET(parameters: {
        'sampleListId': string,
        $queryParameters ? : any,
        $domain ? : string
    }): Promise < SampleList > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        const errorHandlers = this.errorHandlers;
        const request = this.request;
        let path = '/sample-lists/{sampleListId}';
        let body: any;
        let queryParameters: any = {};
        let headers: any = {};
        let form: any = {};
        return new Promise(function(resolve, reject) {
            headers['Accept'] = 'application/json';
            headers['Content-Type'] = 'application/json';

            path = path.replace('{sampleListId}', parameters['sampleListId']);

            if (parameters['sampleListId'] === undefined) {
                reject(new Error('Missing required  parameter: sampleListId'));
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

    getAllSampleIdsInSampleListUsingGETURL(parameters: {
        'sampleListId': string,
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/sample-lists/{sampleListId}/sample-ids';

        path = path.replace('{sampleListId}', parameters['sampleListId']);

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
     * Get all sample IDs in a sample list
     * @method
     * @name CBioPortalAPI#getAllSampleIdsInSampleListUsingGET
     * @param {string} sampleListId - Sample List ID e.g. acc_tcga_all
     */
    getAllSampleIdsInSampleListUsingGET(parameters: {
            'sampleListId': string,
            $queryParameters ? : any,
            $domain ? : string
        }): Promise < Array < string >
        > {
            const domain = parameters.$domain ? parameters.$domain : this.domain;
            const errorHandlers = this.errorHandlers;
            const request = this.request;
            let path = '/sample-lists/{sampleListId}/sample-ids';
            let body: any;
            let queryParameters: any = {};
            let headers: any = {};
            let form: any = {};
            return new Promise(function(resolve, reject) {
                headers['Accept'] = 'application/json';
                headers['Content-Type'] = 'application/json';

                path = path.replace('{sampleListId}', parameters['sampleListId']);

                if (parameters['sampleListId'] === undefined) {
                    reject(new Error('Missing required  parameter: sampleListId'));
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

    fetchSamplesUsingPOSTURL(parameters: {
        'sampleIdentifiers': Array < SampleIdentifier > | SampleIdentifier

        ,
        'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/samples/fetch';

        if (parameters['projection'] !== undefined) {
            queryParameters['projection'] = parameters['projection'];
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
     * Fetch samples by ID
     * @method
     * @name CBioPortalAPI#fetchSamplesUsingPOST
     * @param {} sampleIdentifiers - List of sample identifiers
     * @param {string} projection - Level of detail of the response
     */
    fetchSamplesUsingPOST(parameters: {
            'sampleIdentifiers': Array < SampleIdentifier > | SampleIdentifier

            ,
            'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
            $queryParameters ? : any,
            $domain ? : string
        }): Promise < Array < Sample >
        > {
            const domain = parameters.$domain ? parameters.$domain : this.domain;
            const errorHandlers = this.errorHandlers;
            const request = this.request;
            let path = '/samples/fetch';
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

                if (parameters['projection'] !== undefined) {
                    queryParameters['projection'] = parameters['projection'];
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

    getAllStudiesUsingGETURL(parameters: {
        'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
        'pageSize' ? : number,
        'pageNumber' ? : number,
        'sortBy' ? : "cancerStudyId" | "cancerTypeId" | "name" | "shortName" | "description" | "publicStudy" | "pmid" | "citation" | "groups" | "status" | "importDate",
        'direction' ? : "ASC" | "DESC",
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/studies';
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
     * Get all studies
     * @method
     * @name CBioPortalAPI#getAllStudiesUsingGET
     * @param {string} projection - Level of detail of the response
     * @param {integer} pageSize - Page size of the result list
     * @param {integer} pageNumber - Page number of the result list
     * @param {string} sortBy - Name of the property that the result list is sorted by
     * @param {string} direction - Direction of the sort
     */
    getAllStudiesUsingGET(parameters: {
            'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
            'pageSize' ? : number,
            'pageNumber' ? : number,
            'sortBy' ? : "cancerStudyId" | "cancerTypeId" | "name" | "shortName" | "description" | "publicStudy" | "pmid" | "citation" | "groups" | "status" | "importDate",
            'direction' ? : "ASC" | "DESC",
            $queryParameters ? : any,
                $domain ? : string
        }): Promise < Array < CancerStudy >
        > {
            const domain = parameters.$domain ? parameters.$domain : this.domain;
            const errorHandlers = this.errorHandlers;
            const request = this.request;
            let path = '/studies';
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

    getStudyUsingGETURL(parameters: {
        'studyId': string,
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/studies/{studyId}';

        path = path.replace('{studyId}', parameters['studyId']);

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
     * Get a study
     * @method
     * @name CBioPortalAPI#getStudyUsingGET
     * @param {string} studyId - Study ID e.g. acc_tcga
     */
    getStudyUsingGET(parameters: {
        'studyId': string,
        $queryParameters ? : any,
        $domain ? : string
    }): Promise < CancerStudy > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        const errorHandlers = this.errorHandlers;
        const request = this.request;
        let path = '/studies/{studyId}';
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

    getAllClinicalDataInStudyUsingGETURL(parameters: {
        'studyId': string,
        'attributeId' ? : string,
        'clinicalDataType' ? : "SAMPLE" | "PATIENT",
        'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
        'pageSize' ? : number,
        'pageNumber' ? : number,
        'sortBy' ? : "clinicalAttributeId" | "value",
        'direction' ? : "ASC" | "DESC",
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/studies/{studyId}/clinical-data';

        path = path.replace('{studyId}', parameters['studyId']);
        if (parameters['attributeId'] !== undefined) {
            queryParameters['attributeId'] = parameters['attributeId'];
        }

        if (parameters['clinicalDataType'] !== undefined) {
            queryParameters['clinicalDataType'] = parameters['clinicalDataType'];
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
        let keys = Object.keys(queryParameters);
        return this.domain + path + (keys.length > 0 ? '?' + (keys.map(key => key + '=' + encodeURIComponent(queryParameters[key])).join('&')) : '');
    };

    /**
     * Get all clinical data in a study
     * @method
     * @name CBioPortalAPI#getAllClinicalDataInStudyUsingGET
     * @param {string} studyId - Study ID e.g. acc_tcga
     * @param {string} attributeId - Attribute ID e.g. CANCER_TYPE
     * @param {string} clinicalDataType - Type of the clinical data
     * @param {string} projection - Level of detail of the response
     * @param {integer} pageSize - Page size of the result list
     * @param {integer} pageNumber - Page number of the result list
     * @param {string} sortBy - Name of the property that the result list is sorted by
     * @param {string} direction - Direction of the sort
     */
    getAllClinicalDataInStudyUsingGET(parameters: {
            'studyId': string,
            'attributeId' ? : string,
            'clinicalDataType' ? : "SAMPLE" | "PATIENT",
            'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
            'pageSize' ? : number,
            'pageNumber' ? : number,
            'sortBy' ? : "clinicalAttributeId" | "value",
            'direction' ? : "ASC" | "DESC",
            $queryParameters ? : any,
            $domain ? : string
        }): Promise < Array < ClinicalData >
        > {
            const domain = parameters.$domain ? parameters.$domain : this.domain;
            const errorHandlers = this.errorHandlers;
            const request = this.request;
            let path = '/studies/{studyId}/clinical-data';
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

                if (parameters['attributeId'] !== undefined) {
                    queryParameters['attributeId'] = parameters['attributeId'];
                }

                if (parameters['clinicalDataType'] !== undefined) {
                    queryParameters['clinicalDataType'] = parameters['clinicalDataType'];
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

    getAllGeneticProfilesInStudyUsingGETURL(parameters: {
        'studyId': string,
        'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
        'pageSize' ? : number,
        'pageNumber' ? : number,
        'sortBy' ? : "geneticProfileId" | "geneticAlterationType" | "datatype" | "name" | "description" | "showProfileInAnalysisTab",
        'direction' ? : "ASC" | "DESC",
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/studies/{studyId}/genetic-profiles';

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
     * Get all genetic profiles in a study
     * @method
     * @name CBioPortalAPI#getAllGeneticProfilesInStudyUsingGET
     * @param {string} studyId - Study ID e.g. acc_tcga
     * @param {string} projection - Level of detail of the response
     * @param {integer} pageSize - Page size of the result list
     * @param {integer} pageNumber - Page number of the result list
     * @param {string} sortBy - Name of the property that the result list is sorted by
     * @param {string} direction - Direction of the sort
     */
    getAllGeneticProfilesInStudyUsingGET(parameters: {
            'studyId': string,
            'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
            'pageSize' ? : number,
            'pageNumber' ? : number,
            'sortBy' ? : "geneticProfileId" | "geneticAlterationType" | "datatype" | "name" | "description" | "showProfileInAnalysisTab",
            'direction' ? : "ASC" | "DESC",
            $queryParameters ? : any,
            $domain ? : string
        }): Promise < Array < GeneticProfile >
        > {
            const domain = parameters.$domain ? parameters.$domain : this.domain;
            const errorHandlers = this.errorHandlers;
            const request = this.request;
            let path = '/studies/{studyId}/genetic-profiles';
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

    getAllPatientsInStudyUsingGETURL(parameters: {
        'studyId': string,
        'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
        'pageSize' ? : number,
        'pageNumber' ? : number,
        'direction' ? : "ASC" | "DESC",
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/studies/{studyId}/patients';

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

        queryParameters['sortBy'] = 'patientId';

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
    * Get all patients in a study
    * @method
    * @name CBioPortalAPI#getAllPatientsInStudyUsingGET
         * @param {string} studyId - Study ID e.g. acc_tcga
         * @param {string} projection - Level of detail of the response
         * @param {integer} pageSize - Page size of the result list
         * @param {integer} pageNumber - Page number of the result list
        
         * @param {string} direction - Direction of the sort
    */
    getAllPatientsInStudyUsingGET(parameters: {
            'studyId': string,
            'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
            'pageSize' ? : number,
            'pageNumber' ? : number,
            'direction' ? : "ASC" | "DESC",
            $queryParameters ? : any,
            $domain ? : string
        }): Promise < Array < Patient >
        > {
            const domain = parameters.$domain ? parameters.$domain : this.domain;
            const errorHandlers = this.errorHandlers;
            const request = this.request;
            let path = '/studies/{studyId}/patients';
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

                queryParameters['sortBy'] = 'patientId';

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

    getPatientInStudyUsingGETURL(parameters: {
        'studyId': string,
        'patientId': string,
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/studies/{studyId}/patients/{patientId}';

        path = path.replace('{studyId}', parameters['studyId']);

        path = path.replace('{patientId}', parameters['patientId']);

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
     * Get a patient in a study
     * @method
     * @name CBioPortalAPI#getPatientInStudyUsingGET
     * @param {string} studyId - Study ID e.g. acc_tcga
     * @param {string} patientId - Patient ID e.g. TCGA-OR-A5J2
     */
    getPatientInStudyUsingGET(parameters: {
        'studyId': string,
        'patientId': string,
        $queryParameters ? : any,
        $domain ? : string
    }): Promise < Patient > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        const errorHandlers = this.errorHandlers;
        const request = this.request;
        let path = '/studies/{studyId}/patients/{patientId}';
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

            path = path.replace('{patientId}', parameters['patientId']);

            if (parameters['patientId'] === undefined) {
                reject(new Error('Missing required  parameter: patientId'));
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

    getAllClinicalDataOfPatientInStudyUsingGETURL(parameters: {
        'studyId': string,
        'patientId': string,
        'attributeId' ? : string,
        'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
        'pageSize' ? : number,
        'pageNumber' ? : number,
        'sortBy' ? : "clinicalAttributeId" | "value",
        'direction' ? : "ASC" | "DESC",
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/studies/{studyId}/patients/{patientId}/clinical-data';

        path = path.replace('{studyId}', parameters['studyId']);

        path = path.replace('{patientId}', parameters['patientId']);
        if (parameters['attributeId'] !== undefined) {
            queryParameters['attributeId'] = parameters['attributeId'];
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
        let keys = Object.keys(queryParameters);
        return this.domain + path + (keys.length > 0 ? '?' + (keys.map(key => key + '=' + encodeURIComponent(queryParameters[key])).join('&')) : '');
    };

    /**
     * Get all clinical data of a patient in a study
     * @method
     * @name CBioPortalAPI#getAllClinicalDataOfPatientInStudyUsingGET
     * @param {string} studyId - Study ID e.g. acc_tcga
     * @param {string} patientId - Patient ID e.g. TCGA-OR-A5J2
     * @param {string} attributeId - Attribute ID e.g. AGE
     * @param {string} projection - Level of detail of the response
     * @param {integer} pageSize - Page size of the result list
     * @param {integer} pageNumber - Page number of the result list
     * @param {string} sortBy - Name of the property that the result list is sorted by
     * @param {string} direction - Direction of the sort
     */
    getAllClinicalDataOfPatientInStudyUsingGET(parameters: {
            'studyId': string,
            'patientId': string,
            'attributeId' ? : string,
            'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
            'pageSize' ? : number,
            'pageNumber' ? : number,
            'sortBy' ? : "clinicalAttributeId" | "value",
            'direction' ? : "ASC" | "DESC",
            $queryParameters ? : any,
            $domain ? : string
        }): Promise < Array < ClinicalData >
        > {
            const domain = parameters.$domain ? parameters.$domain : this.domain;
            const errorHandlers = this.errorHandlers;
            const request = this.request;
            let path = '/studies/{studyId}/patients/{patientId}/clinical-data';
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

                path = path.replace('{patientId}', parameters['patientId']);

                if (parameters['patientId'] === undefined) {
                    reject(new Error('Missing required  parameter: patientId'));
                    return;
                }

                if (parameters['attributeId'] !== undefined) {
                    queryParameters['attributeId'] = parameters['attributeId'];
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

    getAllGeneticDataInPatientInStudyUsingGETURL(parameters: {
        'studyId': string,
        'patientId': string,
        'geneticProfileId': string,
        'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
        'pageSize' ? : number,
        'pageNumber' ? : number,
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/studies/{studyId}/patients/{patientId}/genetic-data';

        path = path.replace('{studyId}', parameters['studyId']);

        path = path.replace('{patientId}', parameters['patientId']);
        if (parameters['geneticProfileId'] !== undefined) {
            queryParameters['geneticProfileId'] = parameters['geneticProfileId'];
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
     * Get all genetic data of a patient in a study
     * @method
     * @name CBioPortalAPI#getAllGeneticDataInPatientInStudyUsingGET
     * @param {string} studyId - studyId
     * @param {string} patientId - patientId
     * @param {string} geneticProfileId - geneticProfileId
     * @param {string} projection - projection
     * @param {integer} pageSize - pageSize
     * @param {integer} pageNumber - pageNumber
     */
    getAllGeneticDataInPatientInStudyUsingGET(parameters: {
            'studyId': string,
            'patientId': string,
            'geneticProfileId': string,
            'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
            'pageSize' ? : number,
            'pageNumber' ? : number,
            $queryParameters ? : any,
            $domain ? : string
        }): Promise < Array < GeneticData >
        > {
            const domain = parameters.$domain ? parameters.$domain : this.domain;
            const errorHandlers = this.errorHandlers;
            const request = this.request;
            let path = '/studies/{studyId}/patients/{patientId}/genetic-data';
            let body: any;
            let queryParameters: any = {};
            let headers: any = {};
            let form: any = {};
            return new Promise(function(resolve, reject) {
                headers['Accept'] = '*/*';
                headers['Content-Type'] = 'application/json';

                path = path.replace('{studyId}', parameters['studyId']);

                if (parameters['studyId'] === undefined) {
                    reject(new Error('Missing required  parameter: studyId'));
                    return;
                }

                path = path.replace('{patientId}', parameters['patientId']);

                if (parameters['patientId'] === undefined) {
                    reject(new Error('Missing required  parameter: patientId'));
                    return;
                }

                if (parameters['geneticProfileId'] !== undefined) {
                    queryParameters['geneticProfileId'] = parameters['geneticProfileId'];
                }

                if (parameters['geneticProfileId'] === undefined) {
                    reject(new Error('Missing required  parameter: geneticProfileId'));
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

    getAllSamplesOfPatientInStudyUsingGETURL(parameters: {
        'studyId': string,
        'patientId': string,
        'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
        'pageSize' ? : number,
        'pageNumber' ? : number,
        'sortBy' ? : "sampleId" | "sampleType" | "cancerTypeId",
        'direction' ? : "ASC" | "DESC",
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/studies/{studyId}/patients/{patientId}/samples';

        path = path.replace('{studyId}', parameters['studyId']);

        path = path.replace('{patientId}', parameters['patientId']);
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
     * Get all samples of a patient in a study
     * @method
     * @name CBioPortalAPI#getAllSamplesOfPatientInStudyUsingGET
     * @param {string} studyId - Study ID e.g. acc_tcga
     * @param {string} patientId - Patient ID e.g. TCGA-OR-A5J2
     * @param {string} projection - Level of detail of the response
     * @param {integer} pageSize - Page size of the result list
     * @param {integer} pageNumber - Page number of the result list
     * @param {string} sortBy - Name of the property that the result list is sorted by
     * @param {string} direction - Direction of the sort
     */
    getAllSamplesOfPatientInStudyUsingGET(parameters: {
            'studyId': string,
            'patientId': string,
            'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
            'pageSize' ? : number,
            'pageNumber' ? : number,
            'sortBy' ? : "sampleId" | "sampleType" | "cancerTypeId",
            'direction' ? : "ASC" | "DESC",
            $queryParameters ? : any,
            $domain ? : string
        }): Promise < Array < Sample >
        > {
            const domain = parameters.$domain ? parameters.$domain : this.domain;
            const errorHandlers = this.errorHandlers;
            const request = this.request;
            let path = '/studies/{studyId}/patients/{patientId}/samples';
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

                path = path.replace('{patientId}', parameters['patientId']);

                if (parameters['patientId'] === undefined) {
                    reject(new Error('Missing required  parameter: patientId'));
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

    getAllSampleListsInStudyUsingGETURL(parameters: {
        'studyId': string,
        'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
        'pageSize' ? : number,
        'pageNumber' ? : number,
        'sortBy' ? : "sampleListId" | "category" | "cancerStudyId" | "name" | "description",
        'direction' ? : "ASC" | "DESC",
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/studies/{studyId}/sample-lists';

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
     * Get all sample lists in a study
     * @method
     * @name CBioPortalAPI#getAllSampleListsInStudyUsingGET
     * @param {string} studyId - Study ID e.g. acc_tcga
     * @param {string} projection - Level of detail of the response
     * @param {integer} pageSize - Page size of the result list
     * @param {integer} pageNumber - Page number of the result list
     * @param {string} sortBy - Name of the property that the result list is sorted by
     * @param {string} direction - Direction of the sort
     */
    getAllSampleListsInStudyUsingGET(parameters: {
            'studyId': string,
            'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
            'pageSize' ? : number,
            'pageNumber' ? : number,
            'sortBy' ? : "sampleListId" | "category" | "cancerStudyId" | "name" | "description",
            'direction' ? : "ASC" | "DESC",
            $queryParameters ? : any,
            $domain ? : string
        }): Promise < Array < SampleList >
        > {
            const domain = parameters.$domain ? parameters.$domain : this.domain;
            const errorHandlers = this.errorHandlers;
            const request = this.request;
            let path = '/studies/{studyId}/sample-lists';
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

    getAllSamplesInStudyUsingGETURL(parameters: {
        'studyId': string,
        'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
        'pageSize' ? : number,
        'pageNumber' ? : number,
        'sortBy' ? : "sampleId" | "sampleType" | "cancerTypeId",
        'direction' ? : "ASC" | "DESC",
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/studies/{studyId}/samples';

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
     * Get all samples in a study
     * @method
     * @name CBioPortalAPI#getAllSamplesInStudyUsingGET
     * @param {string} studyId - Study ID e.g. acc_tcga
     * @param {string} projection - Level of detail of the response
     * @param {integer} pageSize - Page size of the result list
     * @param {integer} pageNumber - Page number of the result list
     * @param {string} sortBy - Name of the property that the result list is sorted by
     * @param {string} direction - Direction of the sort
     */
    getAllSamplesInStudyUsingGET(parameters: {
            'studyId': string,
            'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
            'pageSize' ? : number,
            'pageNumber' ? : number,
            'sortBy' ? : "sampleId" | "sampleType" | "cancerTypeId",
            'direction' ? : "ASC" | "DESC",
            $queryParameters ? : any,
            $domain ? : string
        }): Promise < Array < Sample >
        > {
            const domain = parameters.$domain ? parameters.$domain : this.domain;
            const errorHandlers = this.errorHandlers;
            const request = this.request;
            let path = '/studies/{studyId}/samples';
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

    getSampleInStudyUsingGETURL(parameters: {
        'studyId': string,
        'sampleId': string,
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/studies/{studyId}/samples/{sampleId}';

        path = path.replace('{studyId}', parameters['studyId']);

        path = path.replace('{sampleId}', parameters['sampleId']);

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
     * Get a sample in a study
     * @method
     * @name CBioPortalAPI#getSampleInStudyUsingGET
     * @param {string} studyId - Study ID e.g. acc_tcga
     * @param {string} sampleId - Sample ID e.g. TCGA-OR-A5J2-01
     */
    getSampleInStudyUsingGET(parameters: {
        'studyId': string,
        'sampleId': string,
        $queryParameters ? : any,
        $domain ? : string
    }): Promise < Sample > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        const errorHandlers = this.errorHandlers;
        const request = this.request;
        let path = '/studies/{studyId}/samples/{sampleId}';
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

            path = path.replace('{sampleId}', parameters['sampleId']);

            if (parameters['sampleId'] === undefined) {
                reject(new Error('Missing required  parameter: sampleId'));
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

    getAllClinicalDataOfSampleInStudyUsingGETURL(parameters: {
        'studyId': string,
        'sampleId': string,
        'attributeId' ? : string,
        'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
        'pageSize' ? : number,
        'pageNumber' ? : number,
        'sortBy' ? : "clinicalAttributeId" | "value",
        'direction' ? : "ASC" | "DESC",
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/studies/{studyId}/samples/{sampleId}/clinical-data';

        path = path.replace('{studyId}', parameters['studyId']);

        path = path.replace('{sampleId}', parameters['sampleId']);
        if (parameters['attributeId'] !== undefined) {
            queryParameters['attributeId'] = parameters['attributeId'];
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
        let keys = Object.keys(queryParameters);
        return this.domain + path + (keys.length > 0 ? '?' + (keys.map(key => key + '=' + encodeURIComponent(queryParameters[key])).join('&')) : '');
    };

    /**
     * Get all clinical data of a sample in a study
     * @method
     * @name CBioPortalAPI#getAllClinicalDataOfSampleInStudyUsingGET
     * @param {string} studyId - Study ID e.g. acc_tcga
     * @param {string} sampleId - Sample ID e.g. TCGA-OR-A5J2-01
     * @param {string} attributeId - Attribute ID e.g. CANCER_TYPE
     * @param {string} projection - Level of detail of the response
     * @param {integer} pageSize - Page size of the result list
     * @param {integer} pageNumber - Page number of the result list
     * @param {string} sortBy - Name of the property that the result list is sorted by
     * @param {string} direction - Direction of the sort
     */
    getAllClinicalDataOfSampleInStudyUsingGET(parameters: {
            'studyId': string,
            'sampleId': string,
            'attributeId' ? : string,
            'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
            'pageSize' ? : number,
            'pageNumber' ? : number,
            'sortBy' ? : "clinicalAttributeId" | "value",
            'direction' ? : "ASC" | "DESC",
            $queryParameters ? : any,
            $domain ? : string
        }): Promise < Array < ClinicalData >
        > {
            const domain = parameters.$domain ? parameters.$domain : this.domain;
            const errorHandlers = this.errorHandlers;
            const request = this.request;
            let path = '/studies/{studyId}/samples/{sampleId}/clinical-data';
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

                path = path.replace('{sampleId}', parameters['sampleId']);

                if (parameters['sampleId'] === undefined) {
                    reject(new Error('Missing required  parameter: sampleId'));
                    return;
                }

                if (parameters['attributeId'] !== undefined) {
                    queryParameters['attributeId'] = parameters['attributeId'];
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

    getCopyNumberSegmentsInSampleInStudyUsingGETURL(parameters: {
        'studyId': string,
        'sampleId': string,
        'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
        'pageSize' ? : number,
        'pageNumber' ? : number,
        'sortBy' ? : "chromosome" | "start" | "end" | "numberOfProbes" | "segmentMean",
        'direction' ? : "ASC" | "DESC",
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/studies/{studyId}/samples/{sampleId}/copy-number-segments';

        path = path.replace('{studyId}', parameters['studyId']);

        path = path.replace('{sampleId}', parameters['sampleId']);
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
     * Get copy number segments in a sample in a study
     * @method
     * @name CBioPortalAPI#getCopyNumberSegmentsInSampleInStudyUsingGET
     * @param {string} studyId - Study ID e.g. acc_tcga
     * @param {string} sampleId - Sample ID e.g. TCGA-OR-A5J2-01
     * @param {string} projection - Level of detail of the response
     * @param {integer} pageSize - Page size of the result list
     * @param {integer} pageNumber - Page number of the result list
     * @param {string} sortBy - Name of the property that the result list is sorted by
     * @param {string} direction - Direction of the sort
     */
    getCopyNumberSegmentsInSampleInStudyUsingGET(parameters: {
            'studyId': string,
            'sampleId': string,
            'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
            'pageSize' ? : number,
            'pageNumber' ? : number,
            'sortBy' ? : "chromosome" | "start" | "end" | "numberOfProbes" | "segmentMean",
            'direction' ? : "ASC" | "DESC",
            $queryParameters ? : any,
            $domain ? : string
        }): Promise < Array < CopyNumberSeg >
        > {
            const domain = parameters.$domain ? parameters.$domain : this.domain;
            const errorHandlers = this.errorHandlers;
            const request = this.request;
            let path = '/studies/{studyId}/samples/{sampleId}/copy-number-segments';
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

                path = path.replace('{sampleId}', parameters['sampleId']);

                if (parameters['sampleId'] === undefined) {
                    reject(new Error('Missing required  parameter: sampleId'));
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

    getAllGeneticDataInSampleInStudyUsingGETURL(parameters: {
        'studyId': string,
        'sampleId': string,
        'geneticProfileId': string,
        'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
        'pageSize' ? : number,
        'pageNumber' ? : number,
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/studies/{studyId}/samples/{sampleId}/genetic-data';

        path = path.replace('{studyId}', parameters['studyId']);

        path = path.replace('{sampleId}', parameters['sampleId']);
        if (parameters['geneticProfileId'] !== undefined) {
            queryParameters['geneticProfileId'] = parameters['geneticProfileId'];
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
     * Get all genetic data of a sample in a study
     * @method
     * @name CBioPortalAPI#getAllGeneticDataInSampleInStudyUsingGET
     * @param {string} studyId - studyId
     * @param {string} sampleId - sampleId
     * @param {string} geneticProfileId - geneticProfileId
     * @param {string} projection - projection
     * @param {integer} pageSize - pageSize
     * @param {integer} pageNumber - pageNumber
     */
    getAllGeneticDataInSampleInStudyUsingGET(parameters: {
            'studyId': string,
            'sampleId': string,
            'geneticProfileId': string,
            'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
            'pageSize' ? : number,
            'pageNumber' ? : number,
            $queryParameters ? : any,
            $domain ? : string
        }): Promise < Array < GeneticData >
        > {
            const domain = parameters.$domain ? parameters.$domain : this.domain;
            const errorHandlers = this.errorHandlers;
            const request = this.request;
            let path = '/studies/{studyId}/samples/{sampleId}/genetic-data';
            let body: any;
            let queryParameters: any = {};
            let headers: any = {};
            let form: any = {};
            return new Promise(function(resolve, reject) {
                headers['Accept'] = '*/*';
                headers['Content-Type'] = 'application/json';

                path = path.replace('{studyId}', parameters['studyId']);

                if (parameters['studyId'] === undefined) {
                    reject(new Error('Missing required  parameter: studyId'));
                    return;
                }

                path = path.replace('{sampleId}', parameters['sampleId']);

                if (parameters['sampleId'] === undefined) {
                    reject(new Error('Missing required  parameter: sampleId'));
                    return;
                }

                if (parameters['geneticProfileId'] !== undefined) {
                    queryParameters['geneticProfileId'] = parameters['geneticProfileId'];
                }

                if (parameters['geneticProfileId'] === undefined) {
                    reject(new Error('Missing required  parameter: geneticProfileId'));
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