import * as request from "superagent";

type CallbackHandler = (err: any, res ? : request.Response) => void;
export type ClinicalData = {
    'clinicalAttribute': ClinicalAttribute

        'clinicalAttributeId': string

        'patientId': string

        'sampleId': string

        'studyId': string

        'uniquePatientKey': string

        'uniqueSampleKey': string

        'value': string

};
export type GeneMolecularData = {
    'entrezGeneId': number

        'gene': Gene

        'molecularProfileId': string

        'patientId': string

        'sampleId': string

        'studyId': string

        'uniquePatientKey': string

        'uniqueSampleKey': string

        'value': string

};
export type ClinicalDataSingleStudyFilter = {
    'attributeIds': Array < string >

        'ids': Array < string >

};
export type MolecularProfileFilter = {
    'molecularProfileIds': Array < string >

        'studyIds': Array < string >

};
export type GenePanelDataFilter = {
    'entrezGeneIds': Array < number >

        'sampleIds': Array < string >

        'sampleListId': string

};
export type CopyNumberCount = {
    'alteration': number

        'entrezGeneId': number

        'molecularProfileId': string

        'numberOfSamples': number

        'numberOfSamplesWithAlterationInGene': number

};
export type CopyNumberCountIdentifier = {
    'alteration': number

        'entrezGeneId': number

};
export type MolecularDataFilter = {
    'entrezGeneIds': Array < number >

        'sampleIds': Array < string >

        'sampleListId': string

};
export type ClinicalDataIdentifier = {
    'entityId': string

        'studyId': string

};
export type MolecularProfile = {
    'datatype': string

        'description': string

        'molecularAlterationType': "MUTATION_EXTENDED" | "FUSION" | "STRUCTURAL_VARIANT" | "COPY_NUMBER_ALTERATION" | "MICRO_RNA_EXPRESSION" | "MRNA_EXPRESSION" | "MRNA_EXPRESSION_NORMALS" | "RNA_EXPRESSION" | "METHYLATION" | "METHYLATION_BINARY" | "PHOSPHORYLATION" | "PROTEIN_LEVEL" | "PROTEIN_ARRAY_PROTEIN_LEVEL" | "PROTEIN_ARRAY_PHOSPHORYLATION" | "GENESET_SCORE"

        'molecularProfileId': string

        'name': string

        'showProfileInAnalysisTab': boolean

        'study': CancerStudy

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
export type MutationPositionIdentifier = {
    'entrezGeneId': number

        'proteinPosEnd': number

        'proteinPosStart': number

};
export type ClinicalEventData = {
    'key': string

        'value': string

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

        'mrnaRnaSeqSampleCount': number

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
export type SampleFilter = {
    'sampleIdentifiers': Array < SampleIdentifier >

        'sampleListIds': Array < string >

};
export type SampleList = {
    'category': string

        'description': string

        'name': string

        'sampleCount': number

        'sampleIds': Array < string >

        'sampleListId': string

        'studyId': string

};
export type MutationCount = {
    'molecularProfileId': string

        'mutationCount': number

        'patientId': string

        'sampleId': string

        'studyId': string

        'uniquePatientKey': string

        'uniqueSampleKey': string

};
export type GenePanelData = {
    'entrezGeneIds': Array < number >

        'genePanelId': string

        'molecularProfileId': string

        'patientId': string

        'sampleId': string

        'studyId': string

        'uniquePatientKey': string

        'uniqueSampleKey': string

};
export type GenePanelToGene = {
    'entrezGeneId': number

        'hugoGeneSymbol': string

};
export type GenePanel = {
    'description': string

        'genePanelId': string

        'genes': Array < GenePanelToGene >

};
export type MolecularDataMultipleStudyFilter = {
    'entrezGeneIds': Array < number >

        'molecularProfileIds': Array < string >

        'sampleMolecularIdentifiers': Array < SampleMolecularIdentifier >

};
export type SampleIdentifier = {
    'sampleId': string

        'studyId': string

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
export type CopyNumberSeg = {
    'chromosome': string

        'end': number

        'numberOfProbes': number

        'patientId': string

        'sampleId': string

        'segmentMean': number

        'start': number

        'studyId': string

        'uniquePatientKey': string

        'uniqueSampleKey': string

};
export type Patient = {
    'patientId': string

        'studyId': string

        'uniquePatientKey': string

        'uniqueSampleKey': string

};
export type TypeOfCancer = {
    'cancerTypeId': string

        'clinicalTrialKeywords': string

        'dedicatedColor': string

        'name': string

        'parent': string

        'shortName': string

};
export type MutationCountByPosition = {
    'count': number

        'entrezGeneId': number

        'proteinPosEnd': number

        'proteinPosStart': number

};
export type ClinicalEvent = {
    'attributes': Array < ClinicalEventData >

        'endNumberOfDaysSinceDiagnosis': number

        'eventType': string

        'patientId': string

        'startNumberOfDaysSinceDiagnosis': number

        'studyId': string

        'uniquePatientKey': string

        'uniqueSampleKey': string

};
export type PatientIdentifier = {
    'patientId': string

        'studyId': string

};
export type MutationMultipleStudyFilter = {
    'entrezGeneIds': Array < number >

        'molecularProfileIds': Array < string >

        'sampleMolecularIdentifiers': Array < SampleMolecularIdentifier >

};
export type DiscreteCopyNumberData = {
    'alteration': number

        'entrezGeneId': number

        'gene': Gene

        'molecularProfileId': string

        'patientId': string

        'sampleId': string

        'studyId': string

        'uniquePatientKey': string

        'uniqueSampleKey': string

};
export type MutationFilter = {
    'entrezGeneIds': Array < number >

        'sampleIds': Array < string >

        'sampleListId': string

};
export type ClinicalDataMultiStudyFilter = {
    'attributeIds': Array < string >

        'identifiers': Array < ClinicalDataIdentifier >

};
export type SampleMolecularIdentifier = {
    'molecularProfileId': string

        'sampleId': string

};
export type Mutation = {
    'aminoAcidChange': string

        'center': string

        'driverFilter': string

        'driverFilterAnnotation': string

        'driverTiersFilter': string

        'driverTiersFilterAnnotation': string

        'endPosition': number

        'entrezGeneId': number

        'fisValue': number

        'functionalImpactScore': string

        'gene': Gene

        'keyword': string

        'linkMsa': string

        'linkPdb': string

        'linkXvar': string

        'molecularProfileId': string

        'mutationStatus': string

        'mutationType': string

        'ncbiBuild': string

        'normalAltCount': number

        'normalRefCount': number

        'patientId': string

        'proteinChange': string

        'proteinPosEnd': number

        'proteinPosStart': number

        'referenceAllele': string

        'refseqMrnaId': string

        'sampleId': string

        'startPosition': number

        'studyId': string

        'tumorAltCount': number

        'tumorRefCount': number

        'uniquePatientKey': string

        'uniqueSampleKey': string

        'validationStatus': string

        'variantAllele': string

        'variantType': string

};
export type DiscreteCopyNumberFilter = {
    'entrezGeneIds': Array < number >

        'sampleIds': Array < string >

        'sampleListId': string

};
export type ClinicalAttribute = {
    'clinicalAttributeId': string

        'datatype': string

        'description': string

        'displayName': string

        'patientAttribute': boolean

        'priority': string

        'studyId': string

};

/**
 * A web service for supplying JSON formatted data to cBioPortal clients. Please note that this API is currently in beta and subject to change.
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

        path = path.replace('{cancerTypeId}', parameters['cancerTypeId'] + '');

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

            path = path.replace('{cancerTypeId}', parameters['cancerTypeId'] + '');

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
        'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
        'pageSize' ? : number,
        'pageNumber' ? : number,
        'sortBy' ? : "clinicalAttributeId" | "displayName" | "description" | "datatype" | "patientAttribute" | "priority" | "studyId",
        'direction' ? : "ASC" | "DESC",
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/clinical-attributes';
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
     * Get all clinical attributes
     * @method
     * @name CBioPortalAPI#getAllClinicalAttributesUsingGET
     * @param {string} projection - Level of detail of the response
     * @param {integer} pageSize - Page size of the result list
     * @param {integer} pageNumber - Page number of the result list
     * @param {string} sortBy - Name of the property that the result list is sorted by
     * @param {string} direction - Direction of the sort
     */
    getAllClinicalAttributesUsingGET(parameters: {
            'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
            'pageSize' ? : number,
            'pageNumber' ? : number,
            'sortBy' ? : "clinicalAttributeId" | "displayName" | "description" | "datatype" | "patientAttribute" | "priority" | "studyId",
            'direction' ? : "ASC" | "DESC",
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

    fetchClinicalDataUsingPOSTURL(parameters: {
        'clinicalDataType' ? : "SAMPLE" | "PATIENT",
        'clinicalDataMultiStudyFilter': ClinicalDataMultiStudyFilter,
        'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/clinical-data/fetch';
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
     * Fetch clinical data by patient IDs or sample IDs (all studies)
     * @method
     * @name CBioPortalAPI#fetchClinicalDataUsingPOST
     * @param {string} clinicalDataType - Type of the clinical data
     * @param {} clinicalDataMultiStudyFilter - List of patient or sample identifiers and attribute IDs
     * @param {string} projection - Level of detail of the response
     */
    fetchClinicalDataUsingPOST(parameters: {
            'clinicalDataType' ? : "SAMPLE" | "PATIENT",
            'clinicalDataMultiStudyFilter': ClinicalDataMultiStudyFilter,
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

                if (parameters['clinicalDataType'] !== undefined) {
                    queryParameters['clinicalDataType'] = parameters['clinicalDataType'];
                }

                if (parameters['clinicalDataMultiStudyFilter'] !== undefined) {
                    body = parameters['clinicalDataMultiStudyFilter'];
                }

                if (parameters['clinicalDataMultiStudyFilter'] === undefined) {
                    reject(new Error('Missing required  parameter: clinicalDataMultiStudyFilter'));
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
        'sampleIdentifiers': Array < SampleIdentifier > ,
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
            'sampleIdentifiers': Array < SampleIdentifier > ,
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

    getAllGenePanelsUsingGETURL(parameters: {
        'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
        'pageSize' ? : number,
        'pageNumber' ? : number,
        'sortBy' ? : "genePanelId" | "description",
        'direction' ? : "ASC" | "DESC",
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/gene-panels';
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
     * Get all gene panels
     * @method
     * @name CBioPortalAPI#getAllGenePanelsUsingGET
     * @param {string} projection - Level of detail of the response
     * @param {integer} pageSize - Page size of the result list
     * @param {integer} pageNumber - Page number of the result list
     * @param {string} sortBy - Name of the property that the result list is sorted by
     * @param {string} direction - Direction of the sort
     */
    getAllGenePanelsUsingGET(parameters: {
            'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
            'pageSize' ? : number,
            'pageNumber' ? : number,
            'sortBy' ? : "genePanelId" | "description",
            'direction' ? : "ASC" | "DESC",
            $queryParameters ? : any,
                $domain ? : string
        }): Promise < Array < GenePanel >
        > {
            const domain = parameters.$domain ? parameters.$domain : this.domain;
            const errorHandlers = this.errorHandlers;
            const request = this.request;
            let path = '/gene-panels';
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

    getGenePanelUsingGETURL(parameters: {
        'genePanelId': string,
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/gene-panels/{genePanelId}';

        path = path.replace('{genePanelId}', parameters['genePanelId'] + '');

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
     * Get gene panel
     * @method
     * @name CBioPortalAPI#getGenePanelUsingGET
     * @param {string} genePanelId - Gene Panel ID e.g. NSCLC_UNITO_2016_PANEL
     */
    getGenePanelUsingGET(parameters: {
        'genePanelId': string,
        $queryParameters ? : any,
        $domain ? : string
    }): Promise < GenePanel > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        const errorHandlers = this.errorHandlers;
        const request = this.request;
        let path = '/gene-panels/{genePanelId}';
        let body: any;
        let queryParameters: any = {};
        let headers: any = {};
        let form: any = {};
        return new Promise(function(resolve, reject) {
            headers['Accept'] = 'application/json';
            headers['Content-Type'] = 'application/json';

            path = path.replace('{genePanelId}', parameters['genePanelId'] + '');

            if (parameters['genePanelId'] === undefined) {
                reject(new Error('Missing required  parameter: genePanelId'));
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
        'geneIds': Array < string > ,
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
            'geneIds': Array < string > ,
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

        path = path.replace('{geneId}', parameters['geneId'] + '');

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

            path = path.replace('{geneId}', parameters['geneId'] + '');

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

        path = path.replace('{geneId}', parameters['geneId'] + '');

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

                path = path.replace('{geneId}', parameters['geneId'] + '');

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

    fetchMolecularDataInMultipleMolecularProfilesUsingPOSTURL(parameters: {
        'molecularDataMultipleStudyFilter': MolecularDataMultipleStudyFilter,
        'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/molecular-data/fetch';

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
     * Fetch molecular data
     * @method
     * @name CBioPortalAPI#fetchMolecularDataInMultipleMolecularProfilesUsingPOST
     * @param {} molecularDataMultipleStudyFilter - List of Molecular Profile ID and Sample ID pairs and Entrez Gene IDs
     * @param {string} projection - Level of detail of the response
     */
    fetchMolecularDataInMultipleMolecularProfilesUsingPOST(parameters: {
            'molecularDataMultipleStudyFilter': MolecularDataMultipleStudyFilter,
            'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
            $queryParameters ? : any,
            $domain ? : string
        }): Promise < Array < GeneMolecularData >
        > {
            const domain = parameters.$domain ? parameters.$domain : this.domain;
            const errorHandlers = this.errorHandlers;
            const request = this.request;
            let path = '/molecular-data/fetch';
            let body: any;
            let queryParameters: any = {};
            let headers: any = {};
            let form: any = {};
            return new Promise(function(resolve, reject) {
                headers['Accept'] = 'application/json';
                headers['Content-Type'] = 'application/json';

                if (parameters['molecularDataMultipleStudyFilter'] !== undefined) {
                    body = parameters['molecularDataMultipleStudyFilter'];
                }

                if (parameters['molecularDataMultipleStudyFilter'] === undefined) {
                    reject(new Error('Missing required  parameter: molecularDataMultipleStudyFilter'));
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

    getAllMolecularProfilesUsingGETURL(parameters: {
        'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
        'pageSize' ? : number,
        'pageNumber' ? : number,
        'sortBy' ? : "molecularProfileId" | "molecularAlterationType" | "datatype" | "name" | "description" | "showProfileInAnalysisTab",
        'direction' ? : "ASC" | "DESC",
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/molecular-profiles';
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
     * Get all molecular profiles
     * @method
     * @name CBioPortalAPI#getAllMolecularProfilesUsingGET
     * @param {string} projection - Level of detail of the response
     * @param {integer} pageSize - Page size of the result list
     * @param {integer} pageNumber - Page number of the result list
     * @param {string} sortBy - Name of the property that the result list is sorted by
     * @param {string} direction - Direction of the sort
     */
    getAllMolecularProfilesUsingGET(parameters: {
            'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
            'pageSize' ? : number,
            'pageNumber' ? : number,
            'sortBy' ? : "molecularProfileId" | "molecularAlterationType" | "datatype" | "name" | "description" | "showProfileInAnalysisTab",
            'direction' ? : "ASC" | "DESC",
            $queryParameters ? : any,
                $domain ? : string
        }): Promise < Array < MolecularProfile >
        > {
            const domain = parameters.$domain ? parameters.$domain : this.domain;
            const errorHandlers = this.errorHandlers;
            const request = this.request;
            let path = '/molecular-profiles';
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

    fetchMolecularProfilesUsingPOSTURL(parameters: {
        'molecularProfileFilter': MolecularProfileFilter,
        'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/molecular-profiles/fetch';

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
     * Fetch molecular profiles
     * @method
     * @name CBioPortalAPI#fetchMolecularProfilesUsingPOST
     * @param {} molecularProfileFilter - List of Molecular Profile IDs or List of Study IDs
     * @param {string} projection - Level of detail of the response
     */
    fetchMolecularProfilesUsingPOST(parameters: {
            'molecularProfileFilter': MolecularProfileFilter,
            'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
            $queryParameters ? : any,
            $domain ? : string
        }): Promise < Array < MolecularProfile >
        > {
            const domain = parameters.$domain ? parameters.$domain : this.domain;
            const errorHandlers = this.errorHandlers;
            const request = this.request;
            let path = '/molecular-profiles/fetch';
            let body: any;
            let queryParameters: any = {};
            let headers: any = {};
            let form: any = {};
            return new Promise(function(resolve, reject) {
                headers['Accept'] = 'application/json';
                headers['Content-Type'] = 'application/json';

                if (parameters['molecularProfileFilter'] !== undefined) {
                    body = parameters['molecularProfileFilter'];
                }

                if (parameters['molecularProfileFilter'] === undefined) {
                    reject(new Error('Missing required  parameter: molecularProfileFilter'));
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

    getMolecularProfileUsingGETURL(parameters: {
        'molecularProfileId': string,
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/molecular-profiles/{molecularProfileId}';

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
     * Get molecular profile
     * @method
     * @name CBioPortalAPI#getMolecularProfileUsingGET
     * @param {string} molecularProfileId - Molecular Profile ID e.g. acc_tcga_mutations
     */
    getMolecularProfileUsingGET(parameters: {
        'molecularProfileId': string,
        $queryParameters ? : any,
        $domain ? : string
    }): Promise < MolecularProfile > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        const errorHandlers = this.errorHandlers;
        const request = this.request;
        let path = '/molecular-profiles/{molecularProfileId}';
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

    getDiscreteCopyNumbersInMolecularProfileUsingGETURL(parameters: {
        'molecularProfileId': string,
        'sampleListId': string,
        'discreteCopyNumberEventType' ? : "HOMDEL_AND_AMP" | "HOMDEL" | "AMP" | "GAIN" | "HETLOSS" | "DIPLOID" | "ALL",
        'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/molecular-profiles/{molecularProfileId}/discrete-copy-number';

        path = path.replace('{molecularProfileId}', parameters['molecularProfileId'] + '');
        if (parameters['sampleListId'] !== undefined) {
            queryParameters['sampleListId'] = parameters['sampleListId'];
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
     * Get discrete copy number alterations in a molecular profile
     * @method
     * @name CBioPortalAPI#getDiscreteCopyNumbersInMolecularProfileUsingGET
     * @param {string} molecularProfileId - Molecular Profile ID e.g. acc_tcga_gistic
     * @param {string} sampleListId - Sample List ID e.g. acc_tcga_all
     * @param {string} discreteCopyNumberEventType - Type of the copy number event
     * @param {string} projection - Level of detail of the response
     */
    getDiscreteCopyNumbersInMolecularProfileUsingGET(parameters: {
            'molecularProfileId': string,
            'sampleListId': string,
            'discreteCopyNumberEventType' ? : "HOMDEL_AND_AMP" | "HOMDEL" | "AMP" | "GAIN" | "HETLOSS" | "DIPLOID" | "ALL",
            'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
            $queryParameters ? : any,
            $domain ? : string
        }): Promise < Array < DiscreteCopyNumberData >
        > {
            const domain = parameters.$domain ? parameters.$domain : this.domain;
            const errorHandlers = this.errorHandlers;
            const request = this.request;
            let path = '/molecular-profiles/{molecularProfileId}/discrete-copy-number';
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

                if (parameters['sampleListId'] !== undefined) {
                    queryParameters['sampleListId'] = parameters['sampleListId'];
                }

                if (parameters['sampleListId'] === undefined) {
                    reject(new Error('Missing required  parameter: sampleListId'));
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

    fetchCopyNumberCountsUsingPOSTURL(parameters: {
        'molecularProfileId': string,
        'copyNumberCountIdentifiers': Array < CopyNumberCountIdentifier > ,
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/molecular-profiles/{molecularProfileId}/discrete-copy-number-counts/fetch';

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
     * Get counts of specific genes and alterations within a CNA molecular profile
     * @method
     * @name CBioPortalAPI#fetchCopyNumberCountsUsingPOST
     * @param {string} molecularProfileId - Molecular Profile ID e.g. acc_tcga_mutations
     * @param {} copyNumberCountIdentifiers - List of copy number count identifiers
     */
    fetchCopyNumberCountsUsingPOST(parameters: {
            'molecularProfileId': string,
            'copyNumberCountIdentifiers': Array < CopyNumberCountIdentifier > ,
            $queryParameters ? : any,
            $domain ? : string
        }): Promise < Array < CopyNumberCount >
        > {
            const domain = parameters.$domain ? parameters.$domain : this.domain;
            const errorHandlers = this.errorHandlers;
            const request = this.request;
            let path = '/molecular-profiles/{molecularProfileId}/discrete-copy-number-counts/fetch';
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

                if (parameters['copyNumberCountIdentifiers'] !== undefined) {
                    body = parameters['copyNumberCountIdentifiers'];
                }

                if (parameters['copyNumberCountIdentifiers'] === undefined) {
                    reject(new Error('Missing required  parameter: copyNumberCountIdentifiers'));
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

    fetchDiscreteCopyNumbersInMolecularProfileUsingPOSTURL(parameters: {
        'molecularProfileId': string,
        'discreteCopyNumberEventType' ? : "HOMDEL_AND_AMP" | "HOMDEL" | "AMP" | "GAIN" | "HETLOSS" | "DIPLOID" | "ALL",
        'discreteCopyNumberFilter': DiscreteCopyNumberFilter,
        'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/molecular-profiles/{molecularProfileId}/discrete-copy-number/fetch';

        path = path.replace('{molecularProfileId}', parameters['molecularProfileId'] + '');
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
     * Fetch discrete copy number alterations in a molecular profile by sample ID
     * @method
     * @name CBioPortalAPI#fetchDiscreteCopyNumbersInMolecularProfileUsingPOST
     * @param {string} molecularProfileId - Molecular Profile ID e.g. acc_tcga_gistic
     * @param {string} discreteCopyNumberEventType - Type of the copy number event
     * @param {} discreteCopyNumberFilter - List of Sample IDs/Sample List ID and Entrez Gene IDs
     * @param {string} projection - Level of detail of the response
     */
    fetchDiscreteCopyNumbersInMolecularProfileUsingPOST(parameters: {
            'molecularProfileId': string,
            'discreteCopyNumberEventType' ? : "HOMDEL_AND_AMP" | "HOMDEL" | "AMP" | "GAIN" | "HETLOSS" | "DIPLOID" | "ALL",
            'discreteCopyNumberFilter': DiscreteCopyNumberFilter,
            'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
            $queryParameters ? : any,
            $domain ? : string
        }): Promise < Array < DiscreteCopyNumberData >
        > {
            const domain = parameters.$domain ? parameters.$domain : this.domain;
            const errorHandlers = this.errorHandlers;
            const request = this.request;
            let path = '/molecular-profiles/{molecularProfileId}/discrete-copy-number/fetch';
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

                if (parameters['discreteCopyNumberEventType'] !== undefined) {
                    queryParameters['discreteCopyNumberEventType'] = parameters['discreteCopyNumberEventType'];
                }

                if (parameters['discreteCopyNumberFilter'] !== undefined) {
                    body = parameters['discreteCopyNumberFilter'];
                }

                if (parameters['discreteCopyNumberFilter'] === undefined) {
                    reject(new Error('Missing required  parameter: discreteCopyNumberFilter'));
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

    getGenePanelDataUsingPOSTURL(parameters: {
        'molecularProfileId': string,
        'genePanelDataFilter': GenePanelDataFilter,
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/molecular-profiles/{molecularProfileId}/gene-panel-data/fetch';

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
     * Get gene panel data
     * @method
     * @name CBioPortalAPI#getGenePanelDataUsingPOST
     * @param {string} molecularProfileId - Molecular Profile ID e.g. nsclc_unito_2016_mutations
     * @param {} genePanelDataFilter - List of Sample IDs/Sample List ID and Entrez Gene IDs
     */
    getGenePanelDataUsingPOST(parameters: {
            'molecularProfileId': string,
            'genePanelDataFilter': GenePanelDataFilter,
            $queryParameters ? : any,
            $domain ? : string
        }): Promise < Array < GenePanelData >
        > {
            const domain = parameters.$domain ? parameters.$domain : this.domain;
            const errorHandlers = this.errorHandlers;
            const request = this.request;
            let path = '/molecular-profiles/{molecularProfileId}/gene-panel-data/fetch';
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

                if (parameters['genePanelDataFilter'] !== undefined) {
                    body = parameters['genePanelDataFilter'];
                }

                if (parameters['genePanelDataFilter'] === undefined) {
                    reject(new Error('Missing required  parameter: genePanelDataFilter'));
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

    getAllMolecularDataInMolecularProfileUsingGETURL(parameters: {
        'molecularProfileId': string,
        'sampleListId': string,
        'entrezGeneId': number,
        'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/molecular-profiles/{molecularProfileId}/molecular-data';

        path = path.replace('{molecularProfileId}', parameters['molecularProfileId'] + '');
        if (parameters['sampleListId'] !== undefined) {
            queryParameters['sampleListId'] = parameters['sampleListId'];
        }

        if (parameters['entrezGeneId'] !== undefined) {
            queryParameters['entrezGeneId'] = parameters['entrezGeneId'];
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
     * Get all molecular data in a molecular profile
     * @method
     * @name CBioPortalAPI#getAllMolecularDataInMolecularProfileUsingGET
     * @param {string} molecularProfileId - Molecular Profile ID e.g. acc_tcga_rna_seq_v2_mrna
     * @param {string} sampleListId - Sample List ID e.g. acc_tcga_all
     * @param {integer} entrezGeneId - Entrez Gene ID e.g. 1
     * @param {string} projection - Level of detail of the response
     */
    getAllMolecularDataInMolecularProfileUsingGET(parameters: {
            'molecularProfileId': string,
            'sampleListId': string,
            'entrezGeneId': number,
            'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
            $queryParameters ? : any,
            $domain ? : string
        }): Promise < Array < GeneMolecularData >
        > {
            const domain = parameters.$domain ? parameters.$domain : this.domain;
            const errorHandlers = this.errorHandlers;
            const request = this.request;
            let path = '/molecular-profiles/{molecularProfileId}/molecular-data';
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

                if (parameters['sampleListId'] !== undefined) {
                    queryParameters['sampleListId'] = parameters['sampleListId'];
                }

                if (parameters['sampleListId'] === undefined) {
                    reject(new Error('Missing required  parameter: sampleListId'));
                    return;
                }

                if (parameters['entrezGeneId'] !== undefined) {
                    queryParameters['entrezGeneId'] = parameters['entrezGeneId'];
                }

                if (parameters['entrezGeneId'] === undefined) {
                    reject(new Error('Missing required  parameter: entrezGeneId'));
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

                request('GET', domain + path, body, headers, queryParameters, form, reject, resolve, errorHandlers);

            }).then(function(response: request.Response) {
                return response.body;
            });
        };

    fetchAllMolecularDataInMolecularProfileUsingPOSTURL(parameters: {
        'molecularProfileId': string,
        'molecularDataFilter': MolecularDataFilter,
        'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/molecular-profiles/{molecularProfileId}/molecular-data/fetch';

        path = path.replace('{molecularProfileId}', parameters['molecularProfileId'] + '');

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
     * Fetch molecular data in a molecular profile
     * @method
     * @name CBioPortalAPI#fetchAllMolecularDataInMolecularProfileUsingPOST
     * @param {string} molecularProfileId - Molecular Profile ID e.g. acc_tcga_rna_seq_v2_mrna
     * @param {} molecularDataFilter - List of Sample IDs/Sample List ID and Entrez Gene IDs
     * @param {string} projection - Level of detail of the response
     */
    fetchAllMolecularDataInMolecularProfileUsingPOST(parameters: {
            'molecularProfileId': string,
            'molecularDataFilter': MolecularDataFilter,
            'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
            $queryParameters ? : any,
            $domain ? : string
        }): Promise < Array < GeneMolecularData >
        > {
            const domain = parameters.$domain ? parameters.$domain : this.domain;
            const errorHandlers = this.errorHandlers;
            const request = this.request;
            let path = '/molecular-profiles/{molecularProfileId}/molecular-data/fetch';
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

                if (parameters['molecularDataFilter'] !== undefined) {
                    body = parameters['molecularDataFilter'];
                }

                if (parameters['molecularDataFilter'] === undefined) {
                    reject(new Error('Missing required  parameter: molecularDataFilter'));
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

    getMutationCountsInMolecularProfileBySampleListIdUsingGETURL(parameters: {
        'molecularProfileId': string,
        'sampleListId': string,
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/molecular-profiles/{molecularProfileId}/mutation-counts';

        path = path.replace('{molecularProfileId}', parameters['molecularProfileId'] + '');
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
     * Get mutation counts in a molecular profile by Sample List ID
     * @method
     * @name CBioPortalAPI#getMutationCountsInMolecularProfileBySampleListIdUsingGET
     * @param {string} molecularProfileId - Molecular Profile ID e.g. acc_tcga_mutations
     * @param {string} sampleListId - Sample List ID e.g. acc_tcga_all
     */
    getMutationCountsInMolecularProfileBySampleListIdUsingGET(parameters: {
            'molecularProfileId': string,
            'sampleListId': string,
            $queryParameters ? : any,
            $domain ? : string
        }): Promise < Array < MutationCount >
        > {
            const domain = parameters.$domain ? parameters.$domain : this.domain;
            const errorHandlers = this.errorHandlers;
            const request = this.request;
            let path = '/molecular-profiles/{molecularProfileId}/mutation-counts';
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

                if (parameters['sampleListId'] !== undefined) {
                    queryParameters['sampleListId'] = parameters['sampleListId'];
                }

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

    fetchMutationCountsInMolecularProfileUsingPOSTURL(parameters: {
        'molecularProfileId': string,
        'sampleIds': Array < string > ,
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/molecular-profiles/{molecularProfileId}/mutation-counts/fetch';

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
     * Fetch mutation counts in a molecular profile by sample IDs
     * @method
     * @name CBioPortalAPI#fetchMutationCountsInMolecularProfileUsingPOST
     * @param {string} molecularProfileId - Molecular Profile ID e.g. acc_tcga_mutations
     * @param {} sampleIds - List of Sample IDs
     */
    fetchMutationCountsInMolecularProfileUsingPOST(parameters: {
            'molecularProfileId': string,
            'sampleIds': Array < string > ,
            $queryParameters ? : any,
            $domain ? : string
        }): Promise < Array < MutationCount >
        > {
            const domain = parameters.$domain ? parameters.$domain : this.domain;
            const errorHandlers = this.errorHandlers;
            const request = this.request;
            let path = '/molecular-profiles/{molecularProfileId}/mutation-counts/fetch';
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

                if (parameters['sampleIds'] !== undefined) {
                    body = parameters['sampleIds'];
                }

                if (parameters['sampleIds'] === undefined) {
                    reject(new Error('Missing required  parameter: sampleIds'));
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

    getMutationsInMolecularProfileBySampleListIdUsingGETURL(parameters: {
        'molecularProfileId': string,
        'sampleListId': string,
        'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
        'pageSize' ? : number,
        'pageNumber' ? : number,
        'sortBy' ? : "entrezGeneId" | "center" | "mutationStatus" | "validationStatus" | "tumorAltCount" | "tumorRefCount" | "normalAltCount" | "normalRefCount" | "aminoAcidChange" | "startPosition" | "endPosition" | "referenceAllele" | "variantAllele" | "proteinChange" | "mutationType" | "ncbiBuild" | "variantType" | "refseqMrnaId" | "proteinPosStart" | "proteinPosEnd" | "keyword",
        'direction' ? : "ASC" | "DESC",
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/molecular-profiles/{molecularProfileId}/mutations';

        path = path.replace('{molecularProfileId}', parameters['molecularProfileId'] + '');
        if (parameters['sampleListId'] !== undefined) {
            queryParameters['sampleListId'] = parameters['sampleListId'];
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
     * Get mutations in a molecular profile by Sample List ID
     * @method
     * @name CBioPortalAPI#getMutationsInMolecularProfileBySampleListIdUsingGET
     * @param {string} molecularProfileId - Molecular Profile ID e.g. acc_tcga_mutations
     * @param {string} sampleListId - Sample List ID e.g. acc_tcga_all
     * @param {string} projection - Level of detail of the response
     * @param {integer} pageSize - Page size of the result list
     * @param {integer} pageNumber - Page number of the result list
     * @param {string} sortBy - Name of the property that the result list is sorted by
     * @param {string} direction - Direction of the sort
     */
    getMutationsInMolecularProfileBySampleListIdUsingGET(parameters: {
            'molecularProfileId': string,
            'sampleListId': string,
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
            let path = '/molecular-profiles/{molecularProfileId}/mutations';
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

                if (parameters['sampleListId'] !== undefined) {
                    queryParameters['sampleListId'] = parameters['sampleListId'];
                }

                if (parameters['sampleListId'] === undefined) {
                    reject(new Error('Missing required  parameter: sampleListId'));
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

    fetchMutationsInMolecularProfileUsingPOSTURL(parameters: {
        'molecularProfileId': string,
        'mutationFilter': MutationFilter,
        'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
        'pageSize' ? : number,
        'pageNumber' ? : number,
        'sortBy' ? : "entrezGeneId" | "center" | "mutationStatus" | "validationStatus" | "tumorAltCount" | "tumorRefCount" | "normalAltCount" | "normalRefCount" | "aminoAcidChange" | "startPosition" | "endPosition" | "referenceAllele" | "variantAllele" | "proteinChange" | "mutationType" | "ncbiBuild" | "variantType" | "refseqMrnaId" | "proteinPosStart" | "proteinPosEnd" | "keyword",
        'direction' ? : "ASC" | "DESC",
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/molecular-profiles/{molecularProfileId}/mutations/fetch';

        path = path.replace('{molecularProfileId}', parameters['molecularProfileId'] + '');

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
     * Fetch mutations in a molecular profile
     * @method
     * @name CBioPortalAPI#fetchMutationsInMolecularProfileUsingPOST
     * @param {string} molecularProfileId - Molecular Profile ID e.g. acc_tcga_mutations
     * @param {} mutationFilter - List of Sample IDs/Sample List ID and Entrez Gene IDs
     * @param {string} projection - Level of detail of the response
     * @param {integer} pageSize - Page size of the result list
     * @param {integer} pageNumber - Page number of the result list
     * @param {string} sortBy - Name of the property that the result list is sorted by
     * @param {string} direction - Direction of the sort
     */
    fetchMutationsInMolecularProfileUsingPOST(parameters: {
            'molecularProfileId': string,
            'mutationFilter': MutationFilter,
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
            let path = '/molecular-profiles/{molecularProfileId}/mutations/fetch';
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

                if (parameters['mutationFilter'] !== undefined) {
                    body = parameters['mutationFilter'];
                }

                if (parameters['mutationFilter'] === undefined) {
                    reject(new Error('Missing required  parameter: mutationFilter'));
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

    fetchMutationCountsByPositionUsingPOSTURL(parameters: {
        'mutationPositionIdentifiers': Array < MutationPositionIdentifier > ,
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/mutation-counts-by-position/fetch';

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
     * Fetch mutation counts in all studies by gene and position
     * @method
     * @name CBioPortalAPI#fetchMutationCountsByPositionUsingPOST
     * @param {} mutationPositionIdentifiers - List of gene and positions
     */
    fetchMutationCountsByPositionUsingPOST(parameters: {
            'mutationPositionIdentifiers': Array < MutationPositionIdentifier > ,
            $queryParameters ? : any,
            $domain ? : string
        }): Promise < Array < MutationCountByPosition >
        > {
            const domain = parameters.$domain ? parameters.$domain : this.domain;
            const errorHandlers = this.errorHandlers;
            const request = this.request;
            let path = '/mutation-counts-by-position/fetch';
            let body: any;
            let queryParameters: any = {};
            let headers: any = {};
            let form: any = {};
            return new Promise(function(resolve, reject) {
                headers['Accept'] = 'application/json';
                headers['Content-Type'] = 'application/json';

                if (parameters['mutationPositionIdentifiers'] !== undefined) {
                    body = parameters['mutationPositionIdentifiers'];
                }

                if (parameters['mutationPositionIdentifiers'] === undefined) {
                    reject(new Error('Missing required  parameter: mutationPositionIdentifiers'));
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

    fetchMutationsInMultipleMolecularProfilesUsingPOSTURL(parameters: {
        'mutationMultipleStudyFilter': MutationMultipleStudyFilter,
        'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
        'pageSize' ? : number,
        'pageNumber' ? : number,
        'sortBy' ? : "entrezGeneId" | "center" | "mutationStatus" | "validationStatus" | "tumorAltCount" | "tumorRefCount" | "normalAltCount" | "normalRefCount" | "aminoAcidChange" | "startPosition" | "endPosition" | "referenceAllele" | "variantAllele" | "proteinChange" | "mutationType" | "ncbiBuild" | "variantType" | "refseqMrnaId" | "proteinPosStart" | "proteinPosEnd" | "keyword",
        'direction' ? : "ASC" | "DESC",
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/mutations/fetch';

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
     * Fetch mutations in multiple molecular profiles by sample IDs
     * @method
     * @name CBioPortalAPI#fetchMutationsInMultipleMolecularProfilesUsingPOST
     * @param {} mutationMultipleStudyFilter - List of Molecular Profile ID and Sample ID pairs and Entrez Gene IDs
     * @param {string} projection - Level of detail of the response
     * @param {integer} pageSize - Page size of the result list
     * @param {integer} pageNumber - Page number of the result list
     * @param {string} sortBy - Name of the property that the result list is sorted by
     * @param {string} direction - Direction of the sort
     */
    fetchMutationsInMultipleMolecularProfilesUsingPOST(parameters: {
            'mutationMultipleStudyFilter': MutationMultipleStudyFilter,
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
            let path = '/mutations/fetch';
            let body: any;
            let queryParameters: any = {};
            let headers: any = {};
            let form: any = {};
            return new Promise(function(resolve, reject) {
                headers['Accept'] = 'application/json';
                headers['Content-Type'] = 'application/json';

                if (parameters['mutationMultipleStudyFilter'] !== undefined) {
                    body = parameters['mutationMultipleStudyFilter'];
                }

                if (parameters['mutationMultipleStudyFilter'] === undefined) {
                    reject(new Error('Missing required  parameter: mutationMultipleStudyFilter'));
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
        'patientIdentifiers': Array < PatientIdentifier > ,
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
            'patientIdentifiers': Array < PatientIdentifier > ,
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
        'sortBy' ? : "sampleListId" | "category" | "studyId" | "name" | "description",
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
            'sortBy' ? : "sampleListId" | "category" | "studyId" | "name" | "description",
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

    fetchSampleListsUsingPOSTURL(parameters: {
        'sampleListIds': Array < string > ,
        'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/sample-lists/fetch';

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
     * Fetch sample lists by ID
     * @method
     * @name CBioPortalAPI#fetchSampleListsUsingPOST
     * @param {} sampleListIds - List of sample list IDs
     * @param {string} projection - Level of detail of the response
     */
    fetchSampleListsUsingPOST(parameters: {
            'sampleListIds': Array < string > ,
            'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
            $queryParameters ? : any,
            $domain ? : string
        }): Promise < Array < SampleList >
        > {
            const domain = parameters.$domain ? parameters.$domain : this.domain;
            const errorHandlers = this.errorHandlers;
            const request = this.request;
            let path = '/sample-lists/fetch';
            let body: any;
            let queryParameters: any = {};
            let headers: any = {};
            let form: any = {};
            return new Promise(function(resolve, reject) {
                headers['Accept'] = 'application/json';
                headers['Content-Type'] = 'application/json';

                if (parameters['sampleListIds'] !== undefined) {
                    body = parameters['sampleListIds'];
                }

                if (parameters['sampleListIds'] === undefined) {
                    reject(new Error('Missing required  parameter: sampleListIds'));
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

    getSampleListUsingGETURL(parameters: {
        'sampleListId': string,
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/sample-lists/{sampleListId}';

        path = path.replace('{sampleListId}', parameters['sampleListId'] + '');

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

            path = path.replace('{sampleListId}', parameters['sampleListId'] + '');

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

        path = path.replace('{sampleListId}', parameters['sampleListId'] + '');

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

                path = path.replace('{sampleListId}', parameters['sampleListId'] + '');

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
        'sampleFilter': SampleFilter,
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
     * @param {} sampleFilter - List of sample identifiers
     * @param {string} projection - Level of detail of the response
     */
    fetchSamplesUsingPOST(parameters: {
            'sampleFilter': SampleFilter,
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

                if (parameters['sampleFilter'] !== undefined) {
                    body = parameters['sampleFilter'];
                }

                if (parameters['sampleFilter'] === undefined) {
                    reject(new Error('Missing required  parameter: sampleFilter'));
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
        'sortBy' ? : "studyId" | "cancerTypeId" | "name" | "shortName" | "description" | "publicStudy" | "pmid" | "citation" | "groups" | "status" | "importDate",
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
            'sortBy' ? : "studyId" | "cancerTypeId" | "name" | "shortName" | "description" | "publicStudy" | "pmid" | "citation" | "groups" | "status" | "importDate",
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

            path = path.replace('{studyId}', parameters['studyId'] + '');

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

    getAllClinicalAttributesInStudyUsingGETURL(parameters: {
        'studyId': string,
        'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
        'pageSize' ? : number,
        'pageNumber' ? : number,
        'sortBy' ? : "clinicalAttributeId" | "displayName" | "description" | "datatype" | "patientAttribute" | "priority" | "studyId",
        'direction' ? : "ASC" | "DESC",
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/studies/{studyId}/clinical-attributes';

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
     * Get all clinical attributes in the specified study
     * @method
     * @name CBioPortalAPI#getAllClinicalAttributesInStudyUsingGET
     * @param {string} studyId - Study ID e.g. acc_tcga
     * @param {string} projection - Level of detail of the response
     * @param {integer} pageSize - Page size of the result list
     * @param {integer} pageNumber - Page number of the result list
     * @param {string} sortBy - Name of the property that the result list is sorted by
     * @param {string} direction - Direction of the sort
     */
    getAllClinicalAttributesInStudyUsingGET(parameters: {
            'studyId': string,
            'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
            'pageSize' ? : number,
            'pageNumber' ? : number,
            'sortBy' ? : "clinicalAttributeId" | "displayName" | "description" | "datatype" | "patientAttribute" | "priority" | "studyId",
            'direction' ? : "ASC" | "DESC",
            $queryParameters ? : any,
            $domain ? : string
        }): Promise < Array < ClinicalAttribute >
        > {
            const domain = parameters.$domain ? parameters.$domain : this.domain;
            const errorHandlers = this.errorHandlers;
            const request = this.request;
            let path = '/studies/{studyId}/clinical-attributes';
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

    getClinicalAttributeInStudyUsingGETURL(parameters: {
        'studyId': string,
        'clinicalAttributeId': string,
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/studies/{studyId}/clinical-attributes/{clinicalAttributeId}';

        path = path.replace('{studyId}', parameters['studyId'] + '');

        path = path.replace('{clinicalAttributeId}', parameters['clinicalAttributeId'] + '');

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
     * Get specified clinical attribute
     * @method
     * @name CBioPortalAPI#getClinicalAttributeInStudyUsingGET
     * @param {string} studyId - Study ID e.g. acc_tcga
     * @param {string} clinicalAttributeId - Clinical Attribute ID e.g. CANCER_TYPE
     */
    getClinicalAttributeInStudyUsingGET(parameters: {
        'studyId': string,
        'clinicalAttributeId': string,
        $queryParameters ? : any,
        $domain ? : string
    }): Promise < ClinicalAttribute > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        const errorHandlers = this.errorHandlers;
        const request = this.request;
        let path = '/studies/{studyId}/clinical-attributes/{clinicalAttributeId}';
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

            path = path.replace('{clinicalAttributeId}', parameters['clinicalAttributeId'] + '');

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

        path = path.replace('{studyId}', parameters['studyId'] + '');
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

                path = path.replace('{studyId}', parameters['studyId'] + '');

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

    fetchAllClinicalDataInStudyUsingPOSTURL(parameters: {
        'studyId': string,
        'clinicalDataType' ? : "SAMPLE" | "PATIENT",
        'clinicalDataSingleStudyFilter': ClinicalDataSingleStudyFilter,
        'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/studies/{studyId}/clinical-data/fetch';

        path = path.replace('{studyId}', parameters['studyId'] + '');
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
     * Fetch clinical data by patient IDs or sample IDs (specific study)
     * @method
     * @name CBioPortalAPI#fetchAllClinicalDataInStudyUsingPOST
     * @param {string} studyId - Study ID e.g. acc_tcga
     * @param {string} clinicalDataType - Type of the clinical data
     * @param {} clinicalDataSingleStudyFilter - List of patient or sample IDs and attribute IDs
     * @param {string} projection - Level of detail of the response
     */
    fetchAllClinicalDataInStudyUsingPOST(parameters: {
            'studyId': string,
            'clinicalDataType' ? : "SAMPLE" | "PATIENT",
            'clinicalDataSingleStudyFilter': ClinicalDataSingleStudyFilter,
            'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
            $queryParameters ? : any,
            $domain ? : string
        }): Promise < Array < ClinicalData >
        > {
            const domain = parameters.$domain ? parameters.$domain : this.domain;
            const errorHandlers = this.errorHandlers;
            const request = this.request;
            let path = '/studies/{studyId}/clinical-data/fetch';
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

                if (parameters['clinicalDataType'] !== undefined) {
                    queryParameters['clinicalDataType'] = parameters['clinicalDataType'];
                }

                if (parameters['clinicalDataSingleStudyFilter'] !== undefined) {
                    body = parameters['clinicalDataSingleStudyFilter'];
                }

                if (parameters['clinicalDataSingleStudyFilter'] === undefined) {
                    reject(new Error('Missing required  parameter: clinicalDataSingleStudyFilter'));
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

    getAllMolecularProfilesInStudyUsingGETURL(parameters: {
        'studyId': string,
        'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
        'pageSize' ? : number,
        'pageNumber' ? : number,
        'sortBy' ? : "molecularProfileId" | "molecularAlterationType" | "datatype" | "name" | "description" | "showProfileInAnalysisTab",
        'direction' ? : "ASC" | "DESC",
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/studies/{studyId}/molecular-profiles';

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
     * Get all molecular profiles in a study
     * @method
     * @name CBioPortalAPI#getAllMolecularProfilesInStudyUsingGET
     * @param {string} studyId - Study ID e.g. acc_tcga
     * @param {string} projection - Level of detail of the response
     * @param {integer} pageSize - Page size of the result list
     * @param {integer} pageNumber - Page number of the result list
     * @param {string} sortBy - Name of the property that the result list is sorted by
     * @param {string} direction - Direction of the sort
     */
    getAllMolecularProfilesInStudyUsingGET(parameters: {
            'studyId': string,
            'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
            'pageSize' ? : number,
            'pageNumber' ? : number,
            'sortBy' ? : "molecularProfileId" | "molecularAlterationType" | "datatype" | "name" | "description" | "showProfileInAnalysisTab",
            'direction' ? : "ASC" | "DESC",
            $queryParameters ? : any,
            $domain ? : string
        }): Promise < Array < MolecularProfile >
        > {
            const domain = parameters.$domain ? parameters.$domain : this.domain;
            const errorHandlers = this.errorHandlers;
            const request = this.request;
            let path = '/studies/{studyId}/molecular-profiles';
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

        path = path.replace('{studyId}', parameters['studyId'] + '');

        path = path.replace('{patientId}', parameters['patientId'] + '');

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

            path = path.replace('{studyId}', parameters['studyId'] + '');

            if (parameters['studyId'] === undefined) {
                reject(new Error('Missing required  parameter: studyId'));
                return;
            }

            path = path.replace('{patientId}', parameters['patientId'] + '');

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

        path = path.replace('{studyId}', parameters['studyId'] + '');

        path = path.replace('{patientId}', parameters['patientId'] + '');
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

                path = path.replace('{studyId}', parameters['studyId'] + '');

                if (parameters['studyId'] === undefined) {
                    reject(new Error('Missing required  parameter: studyId'));
                    return;
                }

                path = path.replace('{patientId}', parameters['patientId'] + '');

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

    getAllClinicalEventsOfPatientInStudyUsingGETURL(parameters: {
        'studyId': string,
        'patientId': string,
        'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
        'pageSize' ? : number,
        'pageNumber' ? : number,
        'sortBy' ? : "eventType" | "startNumberOfDaysSinceDiagnosis" | "endNumberOfDaysSinceDiagnosis",
        'direction' ? : "ASC" | "DESC",
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/studies/{studyId}/patients/{patientId}/clinical-events';

        path = path.replace('{studyId}', parameters['studyId'] + '');

        path = path.replace('{patientId}', parameters['patientId'] + '');
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
     * Get all clinical events of a patient in a study
     * @method
     * @name CBioPortalAPI#getAllClinicalEventsOfPatientInStudyUsingGET
     * @param {string} studyId - Study ID e.g. lgg_ucsf_2014
     * @param {string} patientId - Patient ID e.g. P01
     * @param {string} projection - Level of detail of the response
     * @param {integer} pageSize - Page size of the result list
     * @param {integer} pageNumber - Page number of the result list
     * @param {string} sortBy - Name of the property that the result list is sorted by
     * @param {string} direction - Direction of the sort
     */
    getAllClinicalEventsOfPatientInStudyUsingGET(parameters: {
            'studyId': string,
            'patientId': string,
            'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
            'pageSize' ? : number,
            'pageNumber' ? : number,
            'sortBy' ? : "eventType" | "startNumberOfDaysSinceDiagnosis" | "endNumberOfDaysSinceDiagnosis",
            'direction' ? : "ASC" | "DESC",
            $queryParameters ? : any,
            $domain ? : string
        }): Promise < Array < ClinicalEvent >
        > {
            const domain = parameters.$domain ? parameters.$domain : this.domain;
            const errorHandlers = this.errorHandlers;
            const request = this.request;
            let path = '/studies/{studyId}/patients/{patientId}/clinical-events';
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

                path = path.replace('{patientId}', parameters['patientId'] + '');

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

        path = path.replace('{studyId}', parameters['studyId'] + '');

        path = path.replace('{patientId}', parameters['patientId'] + '');
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

                path = path.replace('{studyId}', parameters['studyId'] + '');

                if (parameters['studyId'] === undefined) {
                    reject(new Error('Missing required  parameter: studyId'));
                    return;
                }

                path = path.replace('{patientId}', parameters['patientId'] + '');

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
        'sortBy' ? : "sampleListId" | "category" | "studyId" | "name" | "description",
        'direction' ? : "ASC" | "DESC",
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/studies/{studyId}/sample-lists';

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
            'sortBy' ? : "sampleListId" | "category" | "studyId" | "name" | "description",
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

    getSampleInStudyUsingGETURL(parameters: {
        'studyId': string,
        'sampleId': string,
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/studies/{studyId}/samples/{sampleId}';

        path = path.replace('{studyId}', parameters['studyId'] + '');

        path = path.replace('{sampleId}', parameters['sampleId'] + '');

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

            path = path.replace('{studyId}', parameters['studyId'] + '');

            if (parameters['studyId'] === undefined) {
                reject(new Error('Missing required  parameter: studyId'));
                return;
            }

            path = path.replace('{sampleId}', parameters['sampleId'] + '');

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

        path = path.replace('{studyId}', parameters['studyId'] + '');

        path = path.replace('{sampleId}', parameters['sampleId'] + '');
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

                path = path.replace('{studyId}', parameters['studyId'] + '');

                if (parameters['studyId'] === undefined) {
                    reject(new Error('Missing required  parameter: studyId'));
                    return;
                }

                path = path.replace('{sampleId}', parameters['sampleId'] + '');

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

        path = path.replace('{studyId}', parameters['studyId'] + '');

        path = path.replace('{sampleId}', parameters['sampleId'] + '');
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

                path = path.replace('{studyId}', parameters['studyId'] + '');

                if (parameters['studyId'] === undefined) {
                    reject(new Error('Missing required  parameter: studyId'));
                    return;
                }

                path = path.replace('{sampleId}', parameters['sampleId'] + '');

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

}