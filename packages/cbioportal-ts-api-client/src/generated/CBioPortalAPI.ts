import * as request from "superagent";

type CallbackHandler = (err: any, res ? : request.Response) => void;
export type AlleleSpecificCopyNumber = {
    'ascnIntegerCopyNumber': number

        'ascnMethod': string

        'ccfExpectedCopies': number

        'ccfExpectedCopiesUpper': number

        'clonal': string

        'expectedAltCopies': number

        'minorCopyNumber': number

        'totalCopyNumber': number

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

        'referenceGenome': string

        'rppaSampleCount': number

        'sequencedSampleCount': number

        'shortName': string

        'status': number

        'studyId': string

};
export type CancerStudyTags = {
    'cancerStudyId': number

        'tags': string

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
export type ClinicalAttributeCount = {
    'clinicalAttributeId': string

        'count': number

};
export type ClinicalAttributeCountFilter = {
    'sampleIdentifiers': Array < SampleIdentifier >

        'sampleListId': string

};
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
export type ClinicalDataIdentifier = {
    'entityId': string

        'studyId': string

};
export type ClinicalDataMultiStudyFilter = {
    'attributeIds': Array < string >

        'identifiers': Array < ClinicalDataIdentifier >

};
export type ClinicalDataSingleStudyFilter = {
    'attributeIds': Array < string >

        'ids': Array < string >

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
export type ClinicalEventData = {
    'key': string

        'value': string

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
export type DiscreteCopyNumberFilter = {
    'entrezGeneIds': Array < number >

        'sampleIds': Array < string >

        'sampleListId': string

};
export type Gene = {
    'entrezGeneId': number

        'geneticEntityId': number

        'hugoGeneSymbol': string

        'type': string

};
export type GenePanel = {
    'description': string

        'genePanelId': string

        'genes': Array < GenePanelToGene >

};
export type GenePanelData = {
    'genePanelId': string

        'molecularProfileId': string

        'patientId': string

        'profiled': boolean

        'sampleId': string

        'studyId': string

        'uniquePatientKey': string

        'uniqueSampleKey': string

};
export type GenePanelDataFilter = {
    'sampleIds': Array < string >

        'sampleListId': string

};
export type GenePanelToGene = {
    'entrezGeneId': number

        'hugoGeneSymbol': string

};
export type GenericAssayData = {
    'genericAssayStableId': string

        'molecularProfileId': string

        'patientId': string

        'sampleId': string

        'stableId': string

        'studyId': string

        'uniquePatientKey': string

        'uniqueSampleKey': string

        'value': string

};
export type GenericAssayDataFilter = {
    'genericAssayStableIds': Array < string >

        'sampleIds': Array < string >

        'sampleListId': string

};
export type GenericAssayDataMultipleStudyFilter = {
    'genericAssayStableIds': Array < string >

        'molecularProfileIds': Array < string >

        'sampleMolecularIdentifiers': Array < SampleMolecularIdentifier >

};
export type GenericAssayMeta = {
    'entityType': string

        'genericEntityMetaProperties': {}

        'stableId': string

};
export type GenericAssayMetaFilter = {
    'genericAssayStableIds': Array < string >

        'molecularProfileIds': Array < string >

};
export type MolecularDataFilter = {
    'entrezGeneIds': Array < number >

        'sampleIds': Array < string >

        'sampleListId': string

};
export type MolecularDataMultipleStudyFilter = {
    'entrezGeneIds': Array < number >

        'molecularProfileIds': Array < string >

        'sampleMolecularIdentifiers': Array < SampleMolecularIdentifier >

};
export type MolecularProfile = {
    'datatype': string

        'description': string

        'genericAssayType': string

        'molecularAlterationType': "MUTATION_EXTENDED" | "MUTATION_UNCALLED" | "STRUCTURAL_VARIANT" | "COPY_NUMBER_ALTERATION" | "MICRO_RNA_EXPRESSION" | "MRNA_EXPRESSION" | "MRNA_EXPRESSION_NORMALS" | "RNA_EXPRESSION" | "METHYLATION" | "METHYLATION_BINARY" | "PHOSPHORYLATION" | "PROTEIN_LEVEL" | "PROTEIN_ARRAY_PROTEIN_LEVEL" | "PROTEIN_ARRAY_PHOSPHORYLATION" | "GENESET_SCORE" | "GENERIC_ASSAY"

        'molecularProfileId': string

        'name': string

        'pivotThreshold': number

        'showProfileInAnalysisTab': boolean

        'sortOrder': string

        'study': CancerStudy

        'studyId': string

};
export type MolecularProfileFilter = {
    'molecularProfileIds': Array < string >

        'studyIds': Array < string >

};
export type Mutation = {
    'alleleSpecificCopyNumber': AlleleSpecificCopyNumber

        'aminoAcidChange': string

        'center': string

        'chr': string

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
export type MutationCountByPosition = {
    'count': number

        'entrezGeneId': number

        'proteinPosEnd': number

        'proteinPosStart': number

};
export type MutationFilter = {
    'entrezGeneIds': Array < number >

        'sampleIds': Array < string >

        'sampleListId': string

};
export type MutationMultipleStudyFilter = {
    'entrezGeneIds': Array < number >

        'molecularProfileIds': Array < string >

        'sampleMolecularIdentifiers': Array < SampleMolecularIdentifier >

};
export type MutationPositionIdentifier = {
    'entrezGeneId': number

        'proteinPosEnd': number

        'proteinPosStart': number

};
export type NumericGeneMolecularData = {
    'entrezGeneId': number

        'gene': Gene

        'molecularProfileId': string

        'patientId': string

        'sampleId': string

        'studyId': string

        'uniquePatientKey': string

        'uniqueSampleKey': string

        'value': number

};
export type Patient = {
    'cancerStudy': CancerStudy

        'patientId': string

        'studyId': string

        'uniquePatientKey': string

        'uniqueSampleKey': string

};
export type PatientFilter = {
    'patientIdentifiers': Array < PatientIdentifier >

        'uniquePatientKeys': Array < string >

};
export type PatientIdentifier = {
    'patientId': string

        'studyId': string

};
export type ReferenceGenomeGene = {
    'chromosome': string

        'cytoband': string

        'end': number

        'entrezGeneId': number

        'hugoGeneSymbol': string

        'length': number

        'referenceGenomeId': number

        'start': number

};
export type ResourceData = {
    'patientId': string

        'resourceDefinition': ResourceDefinition

        'resourceId': string

        'sampleId': string

        'studyId': string

        'uniquePatientKey': string

        'uniqueSampleKey': string

        'url': string

};
export type ResourceDefinition = {
    'description': string

        'displayName': string

        'openByDefault': boolean

        'priority': string

        'resourceId': string

        'resourceType': "STUDY" | "SAMPLE" | "PATIENT"

        'studyId': string

};
export type Sample = {
    'copyNumberSegmentPresent': boolean

        'patientId': string

        'profiledForFusions': boolean

        'sampleId': string

        'sampleType': "Primary Solid Tumor" | "Recurrent Solid Tumor" | "Primary Blood Tumor" | "Recurrent Blood Tumor" | "Metastatic" | "Blood Derived Normal" | "Solid Tissues Normal"

        'sequenced': boolean

        'studyId': string

        'uniquePatientKey': string

        'uniqueSampleKey': string

};
export type SampleFilter = {
    'sampleIdentifiers': Array < SampleIdentifier >

        'sampleListIds': Array < string >

        'uniqueSampleKeys': Array < string >

};
export type SampleIdentifier = {
    'sampleId': string

        'studyId': string

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
export type SampleMolecularIdentifier = {
    'molecularProfileId': string

        'sampleId': string

};
export type StructuralVariant = {
    'annotation': string

        'breakpointType': string

        'center': string

        'comments': string

        'connectionType': string

        'dnaSupport': string

        'driverFilter': string

        'driverFilterAnn': string

        'driverTiersFilter': string

        'driverTiersFilterAnn': string

        'eventInfo': string

        'externalAnnotation': string

        'length': number

        'molecularProfileId': string

        'ncbiBuild': string

        'normalPairedEndReadCount': number

        'normalReadCount': number

        'normalSplitReadCount': number

        'normalVariantCount': number

        'patientId': string

        'rnaSupport': string

        'sampleId': string

        'site1Chromosome': string

        'site1Description': string

        'site1EnsemblTranscriptId': string

        'site1EntrezGeneId': number

        'site1Exon': number

        'site1HugoSymbol': string

        'site1Position': number

        'site2Chromosome': string

        'site2Description': string

        'site2EffectOnFrame': string

        'site2EnsemblTranscriptId': string

        'site2EntrezGeneId': number

        'site2Exon': number

        'site2HugoSymbol': string

        'site2Position': number

        'studyId': string

        'tumorPairedEndReadCount': number

        'tumorReadCount': number

        'tumorSplitReadCount': number

        'tumorVariantCount': number

        'uniquePatientKey': string

        'uniqueSampleKey': string

        'variantClass': string

};
export type StructuralVariantFilter = {
    'entrezGeneIds': Array < number >

        'molecularProfileIds': Array < string >

        'sampleMolecularIdentifiers': Array < SampleMolecularIdentifier >

};
export type TypeOfCancer = {
    'cancerTypeId': string

        'clinicalTrialKeywords': string

        'dedicatedColor': string

        'name': string

        'parent': string

        'shortName': string

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
        'direction' ? : "ASC" | "DESC",
        'pageNumber' ? : number,
        'pageSize' ? : number,
        'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
        'sortBy' ? : "cancerTypeId" | "name" | "clinicalTrialKeywords" | "dedicatedColor" | "shortName" | "parent",
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/cancer-types';
        if (parameters['direction'] !== undefined) {
            queryParameters['direction'] = parameters['direction'];
        }

        if (parameters['pageNumber'] !== undefined) {
            queryParameters['pageNumber'] = parameters['pageNumber'];
        }

        if (parameters['pageSize'] !== undefined) {
            queryParameters['pageSize'] = parameters['pageSize'];
        }

        if (parameters['projection'] !== undefined) {
            queryParameters['projection'] = parameters['projection'];
        }

        if (parameters['sortBy'] !== undefined) {
            queryParameters['sortBy'] = parameters['sortBy'];
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
     * @param {string} direction - Direction of the sort
     * @param {integer} pageNumber - Page number of the result list
     * @param {integer} pageSize - Page size of the result list
     * @param {string} projection - Level of detail of the response
     * @param {string} sortBy - Name of the property that the result list is sorted by
     */
    getAllCancerTypesUsingGETWithHttpInfo(parameters: {
        'direction' ? : "ASC" | "DESC",
        'pageNumber' ? : number,
        'pageSize' ? : number,
        'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
        'sortBy' ? : "cancerTypeId" | "name" | "clinicalTrialKeywords" | "dedicatedColor" | "shortName" | "parent",
        $queryParameters ? : any,
            $domain ? : string
    }): Promise < request.Response > {
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

            if (parameters['direction'] !== undefined) {
                queryParameters['direction'] = parameters['direction'];
            }

            if (parameters['pageNumber'] !== undefined) {
                queryParameters['pageNumber'] = parameters['pageNumber'];
            }

            if (parameters['pageSize'] !== undefined) {
                queryParameters['pageSize'] = parameters['pageSize'];
            }

            if (parameters['projection'] !== undefined) {
                queryParameters['projection'] = parameters['projection'];
            }

            if (parameters['sortBy'] !== undefined) {
                queryParameters['sortBy'] = parameters['sortBy'];
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
     * Get all cancer types
     * @method
     * @name CBioPortalAPI#getAllCancerTypesUsingGET
     * @param {string} direction - Direction of the sort
     * @param {integer} pageNumber - Page number of the result list
     * @param {integer} pageSize - Page size of the result list
     * @param {string} projection - Level of detail of the response
     * @param {string} sortBy - Name of the property that the result list is sorted by
     */
    getAllCancerTypesUsingGET(parameters: {
            'direction' ? : "ASC" | "DESC",
            'pageNumber' ? : number,
            'pageSize' ? : number,
            'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
            'sortBy' ? : "cancerTypeId" | "name" | "clinicalTrialKeywords" | "dedicatedColor" | "shortName" | "parent",
            $queryParameters ? : any,
                $domain ? : string
        }): Promise < Array < TypeOfCancer >
        > {
            return this.getAllCancerTypesUsingGETWithHttpInfo(parameters).then(function(response: request.Response) {
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
    getCancerTypeUsingGETWithHttpInfo(parameters: {
        'cancerTypeId': string,
        $queryParameters ? : any,
        $domain ? : string
    }): Promise < request.Response > {
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

        });
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
        return this.getCancerTypeUsingGETWithHttpInfo(parameters).then(function(response: request.Response) {
            return response.body;
        });
    };
    getAllClinicalAttributesUsingGETURL(parameters: {
        'direction' ? : "ASC" | "DESC",
        'pageNumber' ? : number,
        'pageSize' ? : number,
        'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
        'sortBy' ? : "clinicalAttributeId" | "displayName" | "description" | "datatype" | "patientAttribute" | "priority" | "studyId",
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/clinical-attributes';
        if (parameters['direction'] !== undefined) {
            queryParameters['direction'] = parameters['direction'];
        }

        if (parameters['pageNumber'] !== undefined) {
            queryParameters['pageNumber'] = parameters['pageNumber'];
        }

        if (parameters['pageSize'] !== undefined) {
            queryParameters['pageSize'] = parameters['pageSize'];
        }

        if (parameters['projection'] !== undefined) {
            queryParameters['projection'] = parameters['projection'];
        }

        if (parameters['sortBy'] !== undefined) {
            queryParameters['sortBy'] = parameters['sortBy'];
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
     * @param {string} direction - Direction of the sort
     * @param {integer} pageNumber - Page number of the result list
     * @param {integer} pageSize - Page size of the result list
     * @param {string} projection - Level of detail of the response
     * @param {string} sortBy - Name of the property that the result list is sorted by
     */
    getAllClinicalAttributesUsingGETWithHttpInfo(parameters: {
        'direction' ? : "ASC" | "DESC",
        'pageNumber' ? : number,
        'pageSize' ? : number,
        'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
        'sortBy' ? : "clinicalAttributeId" | "displayName" | "description" | "datatype" | "patientAttribute" | "priority" | "studyId",
        $queryParameters ? : any,
            $domain ? : string
    }): Promise < request.Response > {
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

            if (parameters['direction'] !== undefined) {
                queryParameters['direction'] = parameters['direction'];
            }

            if (parameters['pageNumber'] !== undefined) {
                queryParameters['pageNumber'] = parameters['pageNumber'];
            }

            if (parameters['pageSize'] !== undefined) {
                queryParameters['pageSize'] = parameters['pageSize'];
            }

            if (parameters['projection'] !== undefined) {
                queryParameters['projection'] = parameters['projection'];
            }

            if (parameters['sortBy'] !== undefined) {
                queryParameters['sortBy'] = parameters['sortBy'];
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
     * Get all clinical attributes
     * @method
     * @name CBioPortalAPI#getAllClinicalAttributesUsingGET
     * @param {string} direction - Direction of the sort
     * @param {integer} pageNumber - Page number of the result list
     * @param {integer} pageSize - Page size of the result list
     * @param {string} projection - Level of detail of the response
     * @param {string} sortBy - Name of the property that the result list is sorted by
     */
    getAllClinicalAttributesUsingGET(parameters: {
            'direction' ? : "ASC" | "DESC",
            'pageNumber' ? : number,
            'pageSize' ? : number,
            'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
            'sortBy' ? : "clinicalAttributeId" | "displayName" | "description" | "datatype" | "patientAttribute" | "priority" | "studyId",
            $queryParameters ? : any,
                $domain ? : string
        }): Promise < Array < ClinicalAttribute >
        > {
            return this.getAllClinicalAttributesUsingGETWithHttpInfo(parameters).then(function(response: request.Response) {
                return response.body;
            });
        };
    getClinicalAttributeCountsUsingPOSTURL(parameters: {
        'clinicalAttributeCountFilter': ClinicalAttributeCountFilter,
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/clinical-attributes/counts/fetch';

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
     * Get counts for clinical attributes according to their data availability for selected samples/patients
     * @method
     * @name CBioPortalAPI#getClinicalAttributeCountsUsingPOST
     * @param {} clinicalAttributeCountFilter - List of SampleIdentifiers or Sample List ID
     */
    getClinicalAttributeCountsUsingPOSTWithHttpInfo(parameters: {
        'clinicalAttributeCountFilter': ClinicalAttributeCountFilter,
        $queryParameters ? : any,
        $domain ? : string
    }): Promise < request.Response > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        const errorHandlers = this.errorHandlers;
        const request = this.request;
        let path = '/clinical-attributes/counts/fetch';
        let body: any;
        let queryParameters: any = {};
        let headers: any = {};
        let form: any = {};
        return new Promise(function(resolve, reject) {
            headers['Accept'] = 'application/json';
            headers['Content-Type'] = 'application/json';

            if (parameters['clinicalAttributeCountFilter'] !== undefined) {
                body = parameters['clinicalAttributeCountFilter'];
            }

            if (parameters['clinicalAttributeCountFilter'] === undefined) {
                reject(new Error('Missing required  parameter: clinicalAttributeCountFilter'));
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
     * Get counts for clinical attributes according to their data availability for selected samples/patients
     * @method
     * @name CBioPortalAPI#getClinicalAttributeCountsUsingPOST
     * @param {} clinicalAttributeCountFilter - List of SampleIdentifiers or Sample List ID
     */
    getClinicalAttributeCountsUsingPOST(parameters: {
            'clinicalAttributeCountFilter': ClinicalAttributeCountFilter,
            $queryParameters ? : any,
            $domain ? : string
        }): Promise < Array < ClinicalAttributeCount >
        > {
            return this.getClinicalAttributeCountsUsingPOSTWithHttpInfo(parameters).then(function(response: request.Response) {
                return response.body;
            });
        };
    fetchClinicalAttributesUsingPOSTURL(parameters: {
        'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
        'studyIds': Array < string > ,
            $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/clinical-attributes/fetch';
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
     * Fetch clinical attributes
     * @method
     * @name CBioPortalAPI#fetchClinicalAttributesUsingPOST
     * @param {string} projection - Level of detail of the response
     * @param {} studyIds - List of Study IDs
     */
    fetchClinicalAttributesUsingPOSTWithHttpInfo(parameters: {
        'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
        'studyIds': Array < string > ,
            $queryParameters ? : any,
            $domain ? : string
    }): Promise < request.Response > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        const errorHandlers = this.errorHandlers;
        const request = this.request;
        let path = '/clinical-attributes/fetch';
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

            if (parameters['studyIds'] !== undefined) {
                body = parameters['studyIds'];
            }

            if (parameters['studyIds'] === undefined) {
                reject(new Error('Missing required  parameter: studyIds'));
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
     * Fetch clinical attributes
     * @method
     * @name CBioPortalAPI#fetchClinicalAttributesUsingPOST
     * @param {string} projection - Level of detail of the response
     * @param {} studyIds - List of Study IDs
     */
    fetchClinicalAttributesUsingPOST(parameters: {
            'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
            'studyIds': Array < string > ,
                $queryParameters ? : any,
                $domain ? : string
        }): Promise < Array < ClinicalAttribute >
        > {
            return this.fetchClinicalAttributesUsingPOSTWithHttpInfo(parameters).then(function(response: request.Response) {
                return response.body;
            });
        };
    fetchClinicalDataUsingPOSTURL(parameters: {
        'clinicalDataMultiStudyFilter': ClinicalDataMultiStudyFilter,
        'clinicalDataType' ? : "SAMPLE" | "PATIENT",
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
     * @param {} clinicalDataMultiStudyFilter - List of patient or sample identifiers and attribute IDs
     * @param {string} clinicalDataType - Type of the clinical data
     * @param {string} projection - Level of detail of the response
     */
    fetchClinicalDataUsingPOSTWithHttpInfo(parameters: {
        'clinicalDataMultiStudyFilter': ClinicalDataMultiStudyFilter,
        'clinicalDataType' ? : "SAMPLE" | "PATIENT",
        'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
        $queryParameters ? : any,
        $domain ? : string
    }): Promise < request.Response > {
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

            if (parameters['clinicalDataMultiStudyFilter'] !== undefined) {
                body = parameters['clinicalDataMultiStudyFilter'];
            }

            if (parameters['clinicalDataMultiStudyFilter'] === undefined) {
                reject(new Error('Missing required  parameter: clinicalDataMultiStudyFilter'));
                return;
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

            request('POST', domain + path, body, headers, queryParameters, form, reject, resolve, errorHandlers);

        });
    };

    /**
     * Fetch clinical data by patient IDs or sample IDs (all studies)
     * @method
     * @name CBioPortalAPI#fetchClinicalDataUsingPOST
     * @param {} clinicalDataMultiStudyFilter - List of patient or sample identifiers and attribute IDs
     * @param {string} clinicalDataType - Type of the clinical data
     * @param {string} projection - Level of detail of the response
     */
    fetchClinicalDataUsingPOST(parameters: {
            'clinicalDataMultiStudyFilter': ClinicalDataMultiStudyFilter,
            'clinicalDataType' ? : "SAMPLE" | "PATIENT",
            'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
            $queryParameters ? : any,
            $domain ? : string
        }): Promise < Array < ClinicalData >
        > {
            return this.fetchClinicalDataUsingPOSTWithHttpInfo(parameters).then(function(response: request.Response) {
                return response.body;
            });
        };
    fetchCopyNumberSegmentsUsingPOSTURL(parameters: {
        'chromosome' ? : string,
        'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
        'sampleIdentifiers': Array < SampleIdentifier > ,
            $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/copy-number-segments/fetch';
        if (parameters['chromosome'] !== undefined) {
            queryParameters['chromosome'] = parameters['chromosome'];
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
     * Fetch copy number segments by sample ID
     * @method
     * @name CBioPortalAPI#fetchCopyNumberSegmentsUsingPOST
     * @param {string} chromosome - Chromosome
     * @param {string} projection - Level of detail of the response
     * @param {} sampleIdentifiers - List of sample identifiers
     */
    fetchCopyNumberSegmentsUsingPOSTWithHttpInfo(parameters: {
        'chromosome' ? : string,
        'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
        'sampleIdentifiers': Array < SampleIdentifier > ,
            $queryParameters ? : any,
            $domain ? : string
    }): Promise < request.Response > {
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

            if (parameters['chromosome'] !== undefined) {
                queryParameters['chromosome'] = parameters['chromosome'];
            }

            if (parameters['projection'] !== undefined) {
                queryParameters['projection'] = parameters['projection'];
            }

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
     * Fetch copy number segments by sample ID
     * @method
     * @name CBioPortalAPI#fetchCopyNumberSegmentsUsingPOST
     * @param {string} chromosome - Chromosome
     * @param {string} projection - Level of detail of the response
     * @param {} sampleIdentifiers - List of sample identifiers
     */
    fetchCopyNumberSegmentsUsingPOST(parameters: {
            'chromosome' ? : string,
            'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
            'sampleIdentifiers': Array < SampleIdentifier > ,
                $queryParameters ? : any,
                $domain ? : string
        }): Promise < Array < CopyNumberSeg >
        > {
            return this.fetchCopyNumberSegmentsUsingPOSTWithHttpInfo(parameters).then(function(response: request.Response) {
                return response.body;
            });
        };
    fetchGenePanelDataInMultipleMolecularProfilesUsingPOSTURL(parameters: {
        'sampleMolecularIdentifiers': Array < SampleMolecularIdentifier > ,
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/gene-panel-data/fetch';

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
     * Fetch gene panel data
     * @method
     * @name CBioPortalAPI#fetchGenePanelDataInMultipleMolecularProfilesUsingPOST
     * @param {} sampleMolecularIdentifiers - List of Molecular Profile ID and Sample ID pairs
     */
    fetchGenePanelDataInMultipleMolecularProfilesUsingPOSTWithHttpInfo(parameters: {
        'sampleMolecularIdentifiers': Array < SampleMolecularIdentifier > ,
        $queryParameters ? : any,
        $domain ? : string
    }): Promise < request.Response > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        const errorHandlers = this.errorHandlers;
        const request = this.request;
        let path = '/gene-panel-data/fetch';
        let body: any;
        let queryParameters: any = {};
        let headers: any = {};
        let form: any = {};
        return new Promise(function(resolve, reject) {
            headers['Accept'] = 'application/json';
            headers['Content-Type'] = 'application/json';

            if (parameters['sampleMolecularIdentifiers'] !== undefined) {
                body = parameters['sampleMolecularIdentifiers'];
            }

            if (parameters['sampleMolecularIdentifiers'] === undefined) {
                reject(new Error('Missing required  parameter: sampleMolecularIdentifiers'));
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
     * Fetch gene panel data
     * @method
     * @name CBioPortalAPI#fetchGenePanelDataInMultipleMolecularProfilesUsingPOST
     * @param {} sampleMolecularIdentifiers - List of Molecular Profile ID and Sample ID pairs
     */
    fetchGenePanelDataInMultipleMolecularProfilesUsingPOST(parameters: {
            'sampleMolecularIdentifiers': Array < SampleMolecularIdentifier > ,
            $queryParameters ? : any,
            $domain ? : string
        }): Promise < Array < GenePanelData >
        > {
            return this.fetchGenePanelDataInMultipleMolecularProfilesUsingPOSTWithHttpInfo(parameters).then(function(response: request.Response) {
                return response.body;
            });
        };
    getAllGenePanelsUsingGETURL(parameters: {
        'direction' ? : "ASC" | "DESC",
        'pageNumber' ? : number,
        'pageSize' ? : number,
        'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
        'sortBy' ? : "genePanelId" | "description",
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/gene-panels';
        if (parameters['direction'] !== undefined) {
            queryParameters['direction'] = parameters['direction'];
        }

        if (parameters['pageNumber'] !== undefined) {
            queryParameters['pageNumber'] = parameters['pageNumber'];
        }

        if (parameters['pageSize'] !== undefined) {
            queryParameters['pageSize'] = parameters['pageSize'];
        }

        if (parameters['projection'] !== undefined) {
            queryParameters['projection'] = parameters['projection'];
        }

        if (parameters['sortBy'] !== undefined) {
            queryParameters['sortBy'] = parameters['sortBy'];
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
     * @param {string} direction - Direction of the sort
     * @param {integer} pageNumber - Page number of the result list
     * @param {integer} pageSize - Page size of the result list
     * @param {string} projection - Level of detail of the response
     * @param {string} sortBy - Name of the property that the result list is sorted by
     */
    getAllGenePanelsUsingGETWithHttpInfo(parameters: {
        'direction' ? : "ASC" | "DESC",
        'pageNumber' ? : number,
        'pageSize' ? : number,
        'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
        'sortBy' ? : "genePanelId" | "description",
        $queryParameters ? : any,
            $domain ? : string
    }): Promise < request.Response > {
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

            if (parameters['direction'] !== undefined) {
                queryParameters['direction'] = parameters['direction'];
            }

            if (parameters['pageNumber'] !== undefined) {
                queryParameters['pageNumber'] = parameters['pageNumber'];
            }

            if (parameters['pageSize'] !== undefined) {
                queryParameters['pageSize'] = parameters['pageSize'];
            }

            if (parameters['projection'] !== undefined) {
                queryParameters['projection'] = parameters['projection'];
            }

            if (parameters['sortBy'] !== undefined) {
                queryParameters['sortBy'] = parameters['sortBy'];
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
     * Get all gene panels
     * @method
     * @name CBioPortalAPI#getAllGenePanelsUsingGET
     * @param {string} direction - Direction of the sort
     * @param {integer} pageNumber - Page number of the result list
     * @param {integer} pageSize - Page size of the result list
     * @param {string} projection - Level of detail of the response
     * @param {string} sortBy - Name of the property that the result list is sorted by
     */
    getAllGenePanelsUsingGET(parameters: {
            'direction' ? : "ASC" | "DESC",
            'pageNumber' ? : number,
            'pageSize' ? : number,
            'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
            'sortBy' ? : "genePanelId" | "description",
            $queryParameters ? : any,
                $domain ? : string
        }): Promise < Array < GenePanel >
        > {
            return this.getAllGenePanelsUsingGETWithHttpInfo(parameters).then(function(response: request.Response) {
                return response.body;
            });
        };
    fetchGenePanelsUsingPOSTURL(parameters: {
        'genePanelIds': Array < string > ,
        'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/gene-panels/fetch';

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
     * Get gene panel
     * @method
     * @name CBioPortalAPI#fetchGenePanelsUsingPOST
     * @param {} genePanelIds - List of Gene Panel IDs
     * @param {string} projection - Level of detail of the response
     */
    fetchGenePanelsUsingPOSTWithHttpInfo(parameters: {
        'genePanelIds': Array < string > ,
        'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
        $queryParameters ? : any,
        $domain ? : string
    }): Promise < request.Response > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        const errorHandlers = this.errorHandlers;
        const request = this.request;
        let path = '/gene-panels/fetch';
        let body: any;
        let queryParameters: any = {};
        let headers: any = {};
        let form: any = {};
        return new Promise(function(resolve, reject) {
            headers['Accept'] = 'application/json';
            headers['Content-Type'] = 'application/json';

            if (parameters['genePanelIds'] !== undefined) {
                body = parameters['genePanelIds'];
            }

            if (parameters['genePanelIds'] === undefined) {
                reject(new Error('Missing required  parameter: genePanelIds'));
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

        });
    };

    /**
     * Get gene panel
     * @method
     * @name CBioPortalAPI#fetchGenePanelsUsingPOST
     * @param {} genePanelIds - List of Gene Panel IDs
     * @param {string} projection - Level of detail of the response
     */
    fetchGenePanelsUsingPOST(parameters: {
            'genePanelIds': Array < string > ,
            'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
            $queryParameters ? : any,
            $domain ? : string
        }): Promise < Array < GenePanel >
        > {
            return this.fetchGenePanelsUsingPOSTWithHttpInfo(parameters).then(function(response: request.Response) {
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
    getGenePanelUsingGETWithHttpInfo(parameters: {
        'genePanelId': string,
        $queryParameters ? : any,
        $domain ? : string
    }): Promise < request.Response > {
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

        });
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
        return this.getGenePanelUsingGETWithHttpInfo(parameters).then(function(response: request.Response) {
            return response.body;
        });
    };
    fetchGenericAssayDataInMultipleMolecularProfilesUsingPOSTURL(parameters: {
        'genericAssayDataMultipleStudyFilter': GenericAssayDataMultipleStudyFilter,
        'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/generic_assay_data/fetch';

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
     * Fetch generic_assay_data
     * @method
     * @name CBioPortalAPI#fetchGenericAssayDataInMultipleMolecularProfilesUsingPOST
     * @param {} genericAssayDataMultipleStudyFilter - List of Molecular Profile ID and Sample ID pairs or List of MolecularProfile IDs and Generic Assay IDs
     * @param {string} projection - Level of detail of the response
     */
    fetchGenericAssayDataInMultipleMolecularProfilesUsingPOSTWithHttpInfo(parameters: {
        'genericAssayDataMultipleStudyFilter': GenericAssayDataMultipleStudyFilter,
        'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
        $queryParameters ? : any,
        $domain ? : string
    }): Promise < request.Response > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        const errorHandlers = this.errorHandlers;
        const request = this.request;
        let path = '/generic_assay_data/fetch';
        let body: any;
        let queryParameters: any = {};
        let headers: any = {};
        let form: any = {};
        return new Promise(function(resolve, reject) {
            headers['Accept'] = 'application/json';
            headers['Content-Type'] = 'application/json';

            if (parameters['genericAssayDataMultipleStudyFilter'] !== undefined) {
                body = parameters['genericAssayDataMultipleStudyFilter'];
            }

            if (parameters['genericAssayDataMultipleStudyFilter'] === undefined) {
                reject(new Error('Missing required  parameter: genericAssayDataMultipleStudyFilter'));
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

        });
    };

    /**
     * Fetch generic_assay_data
     * @method
     * @name CBioPortalAPI#fetchGenericAssayDataInMultipleMolecularProfilesUsingPOST
     * @param {} genericAssayDataMultipleStudyFilter - List of Molecular Profile ID and Sample ID pairs or List of MolecularProfile IDs and Generic Assay IDs
     * @param {string} projection - Level of detail of the response
     */
    fetchGenericAssayDataInMultipleMolecularProfilesUsingPOST(parameters: {
            'genericAssayDataMultipleStudyFilter': GenericAssayDataMultipleStudyFilter,
            'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
            $queryParameters ? : any,
            $domain ? : string
        }): Promise < Array < GenericAssayData >
        > {
            return this.fetchGenericAssayDataInMultipleMolecularProfilesUsingPOSTWithHttpInfo(parameters).then(function(response: request.Response) {
                return response.body;
            });
        };
    fetchGenericAssayDataInMolecularProfileUsingPOSTURL(parameters: {
        'genericAssayDataFilter': GenericAssayDataFilter,
        'molecularProfileId': string,
        'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/generic_assay_data/{molecularProfileId}/fetch';

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
     * fetch generic_assay_data in a molecular profile
     * @method
     * @name CBioPortalAPI#fetchGenericAssayDataInMolecularProfileUsingPOST
     * @param {} genericAssayDataFilter - List of Sample IDs/Sample List ID and Generic Assay IDs
     * @param {string} molecularProfileId - Molecular Profile ID
     * @param {string} projection - Level of detail of the response
     */
    fetchGenericAssayDataInMolecularProfileUsingPOSTWithHttpInfo(parameters: {
        'genericAssayDataFilter': GenericAssayDataFilter,
        'molecularProfileId': string,
        'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
        $queryParameters ? : any,
        $domain ? : string
    }): Promise < request.Response > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        const errorHandlers = this.errorHandlers;
        const request = this.request;
        let path = '/generic_assay_data/{molecularProfileId}/fetch';
        let body: any;
        let queryParameters: any = {};
        let headers: any = {};
        let form: any = {};
        return new Promise(function(resolve, reject) {
            headers['Accept'] = 'application/json';
            headers['Content-Type'] = 'application/json';

            if (parameters['genericAssayDataFilter'] !== undefined) {
                body = parameters['genericAssayDataFilter'];
            }

            if (parameters['genericAssayDataFilter'] === undefined) {
                reject(new Error('Missing required  parameter: genericAssayDataFilter'));
                return;
            }

            path = path.replace('{molecularProfileId}', parameters['molecularProfileId'] + '');

            if (parameters['molecularProfileId'] === undefined) {
                reject(new Error('Missing required  parameter: molecularProfileId'));
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

        });
    };

    /**
     * fetch generic_assay_data in a molecular profile
     * @method
     * @name CBioPortalAPI#fetchGenericAssayDataInMolecularProfileUsingPOST
     * @param {} genericAssayDataFilter - List of Sample IDs/Sample List ID and Generic Assay IDs
     * @param {string} molecularProfileId - Molecular Profile ID
     * @param {string} projection - Level of detail of the response
     */
    fetchGenericAssayDataInMolecularProfileUsingPOST(parameters: {
            'genericAssayDataFilter': GenericAssayDataFilter,
            'molecularProfileId': string,
            'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
            $queryParameters ? : any,
            $domain ? : string
        }): Promise < Array < GenericAssayData >
        > {
            return this.fetchGenericAssayDataInMolecularProfileUsingPOSTWithHttpInfo(parameters).then(function(response: request.Response) {
                return response.body;
            });
        };
    fetchGenericAssayMetaDataUsingPOSTURL(parameters: {
        'genericAssayMetaFilter': GenericAssayMetaFilter,
        'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/generic_assay_meta/fetch';

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
     * Fetch meta data for generic-assay by ID
     * @method
     * @name CBioPortalAPI#fetchGenericAssayMetaDataUsingPOST
     * @param {} genericAssayMetaFilter - List of Molecular Profile ID or List of Stable ID
     * @param {string} projection - Level of detail of the response
     */
    fetchGenericAssayMetaDataUsingPOSTWithHttpInfo(parameters: {
        'genericAssayMetaFilter': GenericAssayMetaFilter,
        'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
        $queryParameters ? : any,
        $domain ? : string
    }): Promise < request.Response > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        const errorHandlers = this.errorHandlers;
        const request = this.request;
        let path = '/generic_assay_meta/fetch';
        let body: any;
        let queryParameters: any = {};
        let headers: any = {};
        let form: any = {};
        return new Promise(function(resolve, reject) {
            headers['Accept'] = 'application/json';
            headers['Content-Type'] = 'application/json';

            if (parameters['genericAssayMetaFilter'] !== undefined) {
                body = parameters['genericAssayMetaFilter'];
            }

            if (parameters['genericAssayMetaFilter'] === undefined) {
                reject(new Error('Missing required  parameter: genericAssayMetaFilter'));
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

        });
    };

    /**
     * Fetch meta data for generic-assay by ID
     * @method
     * @name CBioPortalAPI#fetchGenericAssayMetaDataUsingPOST
     * @param {} genericAssayMetaFilter - List of Molecular Profile ID or List of Stable ID
     * @param {string} projection - Level of detail of the response
     */
    fetchGenericAssayMetaDataUsingPOST(parameters: {
            'genericAssayMetaFilter': GenericAssayMetaFilter,
            'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
            $queryParameters ? : any,
            $domain ? : string
        }): Promise < Array < GenericAssayMeta >
        > {
            return this.fetchGenericAssayMetaDataUsingPOSTWithHttpInfo(parameters).then(function(response: request.Response) {
                return response.body;
            });
        };
    getAllGenesUsingGETURL(parameters: {
        'alias' ? : string,
        'direction' ? : "ASC" | "DESC",
        'keyword' ? : string,
        'pageNumber' ? : number,
        'pageSize' ? : number,
        'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
        'sortBy' ? : "entrezGeneId" | "hugoGeneSymbol" | "type" | "cytoband" | "length",
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/genes';
        if (parameters['alias'] !== undefined) {
            queryParameters['alias'] = parameters['alias'];
        }

        if (parameters['direction'] !== undefined) {
            queryParameters['direction'] = parameters['direction'];
        }

        if (parameters['keyword'] !== undefined) {
            queryParameters['keyword'] = parameters['keyword'];
        }

        if (parameters['pageNumber'] !== undefined) {
            queryParameters['pageNumber'] = parameters['pageNumber'];
        }

        if (parameters['pageSize'] !== undefined) {
            queryParameters['pageSize'] = parameters['pageSize'];
        }

        if (parameters['projection'] !== undefined) {
            queryParameters['projection'] = parameters['projection'];
        }

        if (parameters['sortBy'] !== undefined) {
            queryParameters['sortBy'] = parameters['sortBy'];
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
     * @param {string} direction - Direction of the sort
     * @param {string} keyword - Search keyword that applies to hugo gene symbol of the genes
     * @param {integer} pageNumber - Page number of the result list
     * @param {integer} pageSize - Page size of the result list
     * @param {string} projection - Level of detail of the response
     * @param {string} sortBy - Name of the property that the result list is sorted by
     */
    getAllGenesUsingGETWithHttpInfo(parameters: {
        'alias' ? : string,
        'direction' ? : "ASC" | "DESC",
        'keyword' ? : string,
        'pageNumber' ? : number,
        'pageSize' ? : number,
        'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
        'sortBy' ? : "entrezGeneId" | "hugoGeneSymbol" | "type" | "cytoband" | "length",
        $queryParameters ? : any,
            $domain ? : string
    }): Promise < request.Response > {
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

            if (parameters['alias'] !== undefined) {
                queryParameters['alias'] = parameters['alias'];
            }

            if (parameters['direction'] !== undefined) {
                queryParameters['direction'] = parameters['direction'];
            }

            if (parameters['keyword'] !== undefined) {
                queryParameters['keyword'] = parameters['keyword'];
            }

            if (parameters['pageNumber'] !== undefined) {
                queryParameters['pageNumber'] = parameters['pageNumber'];
            }

            if (parameters['pageSize'] !== undefined) {
                queryParameters['pageSize'] = parameters['pageSize'];
            }

            if (parameters['projection'] !== undefined) {
                queryParameters['projection'] = parameters['projection'];
            }

            if (parameters['sortBy'] !== undefined) {
                queryParameters['sortBy'] = parameters['sortBy'];
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
     * Get all genes
     * @method
     * @name CBioPortalAPI#getAllGenesUsingGET
     * @param {string} alias - Alias of the gene
     * @param {string} direction - Direction of the sort
     * @param {string} keyword - Search keyword that applies to hugo gene symbol of the genes
     * @param {integer} pageNumber - Page number of the result list
     * @param {integer} pageSize - Page size of the result list
     * @param {string} projection - Level of detail of the response
     * @param {string} sortBy - Name of the property that the result list is sorted by
     */
    getAllGenesUsingGET(parameters: {
            'alias' ? : string,
            'direction' ? : "ASC" | "DESC",
            'keyword' ? : string,
            'pageNumber' ? : number,
            'pageSize' ? : number,
            'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
            'sortBy' ? : "entrezGeneId" | "hugoGeneSymbol" | "type" | "cytoband" | "length",
            $queryParameters ? : any,
                $domain ? : string
        }): Promise < Array < Gene >
        > {
            return this.getAllGenesUsingGETWithHttpInfo(parameters).then(function(response: request.Response) {
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
    fetchGenesUsingPOSTWithHttpInfo(parameters: {
        'geneIdType' ? : "ENTREZ_GENE_ID" | "HUGO_GENE_SYMBOL",
        'geneIds': Array < string > ,
            'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
            $queryParameters ? : any,
            $domain ? : string
    }): Promise < request.Response > {
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

        });
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
            return this.fetchGenesUsingPOSTWithHttpInfo(parameters).then(function(response: request.Response) {
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
    getGeneUsingGETWithHttpInfo(parameters: {
        'geneId': string,
        $queryParameters ? : any,
        $domain ? : string
    }): Promise < request.Response > {
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

        });
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
        return this.getGeneUsingGETWithHttpInfo(parameters).then(function(response: request.Response) {
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
    getAliasesOfGeneUsingGETWithHttpInfo(parameters: {
        'geneId': string,
        $queryParameters ? : any,
        $domain ? : string
    }): Promise < request.Response > {
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

        });
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
            return this.getAliasesOfGeneUsingGETWithHttpInfo(parameters).then(function(response: request.Response) {
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
     * @param {} molecularDataMultipleStudyFilter - List of Molecular Profile ID and Sample ID pairs or List of MolecularProfile IDs and Entrez Gene IDs
     * @param {string} projection - Level of detail of the response
     */
    fetchMolecularDataInMultipleMolecularProfilesUsingPOSTWithHttpInfo(parameters: {
        'molecularDataMultipleStudyFilter': MolecularDataMultipleStudyFilter,
        'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
        $queryParameters ? : any,
        $domain ? : string
    }): Promise < request.Response > {
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

        });
    };

    /**
     * Fetch molecular data
     * @method
     * @name CBioPortalAPI#fetchMolecularDataInMultipleMolecularProfilesUsingPOST
     * @param {} molecularDataMultipleStudyFilter - List of Molecular Profile ID and Sample ID pairs or List of MolecularProfile IDs and Entrez Gene IDs
     * @param {string} projection - Level of detail of the response
     */
    fetchMolecularDataInMultipleMolecularProfilesUsingPOST(parameters: {
            'molecularDataMultipleStudyFilter': MolecularDataMultipleStudyFilter,
            'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
            $queryParameters ? : any,
            $domain ? : string
        }): Promise < Array < NumericGeneMolecularData >
        > {
            return this.fetchMolecularDataInMultipleMolecularProfilesUsingPOSTWithHttpInfo(parameters).then(function(response: request.Response) {
                return response.body;
            });
        };
    getAllMolecularProfilesUsingGETURL(parameters: {
        'direction' ? : "ASC" | "DESC",
        'pageNumber' ? : number,
        'pageSize' ? : number,
        'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
        'sortBy' ? : "molecularProfileId" | "molecularAlterationType" | "datatype" | "name" | "description" | "showProfileInAnalysisTab",
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/molecular-profiles';
        if (parameters['direction'] !== undefined) {
            queryParameters['direction'] = parameters['direction'];
        }

        if (parameters['pageNumber'] !== undefined) {
            queryParameters['pageNumber'] = parameters['pageNumber'];
        }

        if (parameters['pageSize'] !== undefined) {
            queryParameters['pageSize'] = parameters['pageSize'];
        }

        if (parameters['projection'] !== undefined) {
            queryParameters['projection'] = parameters['projection'];
        }

        if (parameters['sortBy'] !== undefined) {
            queryParameters['sortBy'] = parameters['sortBy'];
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
     * @param {string} direction - Direction of the sort
     * @param {integer} pageNumber - Page number of the result list
     * @param {integer} pageSize - Page size of the result list
     * @param {string} projection - Level of detail of the response
     * @param {string} sortBy - Name of the property that the result list is sorted by
     */
    getAllMolecularProfilesUsingGETWithHttpInfo(parameters: {
        'direction' ? : "ASC" | "DESC",
        'pageNumber' ? : number,
        'pageSize' ? : number,
        'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
        'sortBy' ? : "molecularProfileId" | "molecularAlterationType" | "datatype" | "name" | "description" | "showProfileInAnalysisTab",
        $queryParameters ? : any,
            $domain ? : string
    }): Promise < request.Response > {
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

            if (parameters['direction'] !== undefined) {
                queryParameters['direction'] = parameters['direction'];
            }

            if (parameters['pageNumber'] !== undefined) {
                queryParameters['pageNumber'] = parameters['pageNumber'];
            }

            if (parameters['pageSize'] !== undefined) {
                queryParameters['pageSize'] = parameters['pageSize'];
            }

            if (parameters['projection'] !== undefined) {
                queryParameters['projection'] = parameters['projection'];
            }

            if (parameters['sortBy'] !== undefined) {
                queryParameters['sortBy'] = parameters['sortBy'];
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
     * Get all molecular profiles
     * @method
     * @name CBioPortalAPI#getAllMolecularProfilesUsingGET
     * @param {string} direction - Direction of the sort
     * @param {integer} pageNumber - Page number of the result list
     * @param {integer} pageSize - Page size of the result list
     * @param {string} projection - Level of detail of the response
     * @param {string} sortBy - Name of the property that the result list is sorted by
     */
    getAllMolecularProfilesUsingGET(parameters: {
            'direction' ? : "ASC" | "DESC",
            'pageNumber' ? : number,
            'pageSize' ? : number,
            'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
            'sortBy' ? : "molecularProfileId" | "molecularAlterationType" | "datatype" | "name" | "description" | "showProfileInAnalysisTab",
            $queryParameters ? : any,
                $domain ? : string
        }): Promise < Array < MolecularProfile >
        > {
            return this.getAllMolecularProfilesUsingGETWithHttpInfo(parameters).then(function(response: request.Response) {
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
    fetchMolecularProfilesUsingPOSTWithHttpInfo(parameters: {
        'molecularProfileFilter': MolecularProfileFilter,
        'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
        $queryParameters ? : any,
        $domain ? : string
    }): Promise < request.Response > {
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

        });
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
            return this.fetchMolecularProfilesUsingPOSTWithHttpInfo(parameters).then(function(response: request.Response) {
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
    getMolecularProfileUsingGETWithHttpInfo(parameters: {
        'molecularProfileId': string,
        $queryParameters ? : any,
        $domain ? : string
    }): Promise < request.Response > {
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

        });
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
        return this.getMolecularProfileUsingGETWithHttpInfo(parameters).then(function(response: request.Response) {
            return response.body;
        });
    };
    getDiscreteCopyNumbersInMolecularProfileUsingGETURL(parameters: {
        'discreteCopyNumberEventType' ? : "HOMDEL_AND_AMP" | "HOMDEL" | "AMP" | "GAIN" | "HETLOSS" | "DIPLOID" | "ALL",
        'molecularProfileId': string,
        'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
        'sampleListId': string,
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/molecular-profiles/{molecularProfileId}/discrete-copy-number';
        if (parameters['discreteCopyNumberEventType'] !== undefined) {
            queryParameters['discreteCopyNumberEventType'] = parameters['discreteCopyNumberEventType'];
        }

        path = path.replace('{molecularProfileId}', parameters['molecularProfileId'] + '');
        if (parameters['projection'] !== undefined) {
            queryParameters['projection'] = parameters['projection'];
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
     * Get discrete copy number alterations in a molecular profile
     * @method
     * @name CBioPortalAPI#getDiscreteCopyNumbersInMolecularProfileUsingGET
     * @param {string} discreteCopyNumberEventType - Type of the copy number event
     * @param {string} molecularProfileId - Molecular Profile ID e.g. acc_tcga_gistic
     * @param {string} projection - Level of detail of the response
     * @param {string} sampleListId - Sample List ID e.g. acc_tcga_all
     */
    getDiscreteCopyNumbersInMolecularProfileUsingGETWithHttpInfo(parameters: {
        'discreteCopyNumberEventType' ? : "HOMDEL_AND_AMP" | "HOMDEL" | "AMP" | "GAIN" | "HETLOSS" | "DIPLOID" | "ALL",
        'molecularProfileId': string,
        'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
        'sampleListId': string,
        $queryParameters ? : any,
            $domain ? : string
    }): Promise < request.Response > {
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

            if (parameters['discreteCopyNumberEventType'] !== undefined) {
                queryParameters['discreteCopyNumberEventType'] = parameters['discreteCopyNumberEventType'];
            }

            path = path.replace('{molecularProfileId}', parameters['molecularProfileId'] + '');

            if (parameters['molecularProfileId'] === undefined) {
                reject(new Error('Missing required  parameter: molecularProfileId'));
                return;
            }

            if (parameters['projection'] !== undefined) {
                queryParameters['projection'] = parameters['projection'];
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

        });
    };

    /**
     * Get discrete copy number alterations in a molecular profile
     * @method
     * @name CBioPortalAPI#getDiscreteCopyNumbersInMolecularProfileUsingGET
     * @param {string} discreteCopyNumberEventType - Type of the copy number event
     * @param {string} molecularProfileId - Molecular Profile ID e.g. acc_tcga_gistic
     * @param {string} projection - Level of detail of the response
     * @param {string} sampleListId - Sample List ID e.g. acc_tcga_all
     */
    getDiscreteCopyNumbersInMolecularProfileUsingGET(parameters: {
            'discreteCopyNumberEventType' ? : "HOMDEL_AND_AMP" | "HOMDEL" | "AMP" | "GAIN" | "HETLOSS" | "DIPLOID" | "ALL",
            'molecularProfileId': string,
            'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
            'sampleListId': string,
            $queryParameters ? : any,
                $domain ? : string
        }): Promise < Array < DiscreteCopyNumberData >
        > {
            return this.getDiscreteCopyNumbersInMolecularProfileUsingGETWithHttpInfo(parameters).then(function(response: request.Response) {
                return response.body;
            });
        };
    fetchCopyNumberCountsUsingPOSTURL(parameters: {
        'copyNumberCountIdentifiers': Array < CopyNumberCountIdentifier > ,
        'molecularProfileId': string,
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
     * @param {} copyNumberCountIdentifiers - List of copy number count identifiers
     * @param {string} molecularProfileId - Molecular Profile ID e.g. acc_tcga_gistic
     */
    fetchCopyNumberCountsUsingPOSTWithHttpInfo(parameters: {
        'copyNumberCountIdentifiers': Array < CopyNumberCountIdentifier > ,
        'molecularProfileId': string,
        $queryParameters ? : any,
        $domain ? : string
    }): Promise < request.Response > {
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

            if (parameters['copyNumberCountIdentifiers'] !== undefined) {
                body = parameters['copyNumberCountIdentifiers'];
            }

            if (parameters['copyNumberCountIdentifiers'] === undefined) {
                reject(new Error('Missing required  parameter: copyNumberCountIdentifiers'));
                return;
            }

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

            request('POST', domain + path, body, headers, queryParameters, form, reject, resolve, errorHandlers);

        });
    };

    /**
     * Get counts of specific genes and alterations within a CNA molecular profile
     * @method
     * @name CBioPortalAPI#fetchCopyNumberCountsUsingPOST
     * @param {} copyNumberCountIdentifiers - List of copy number count identifiers
     * @param {string} molecularProfileId - Molecular Profile ID e.g. acc_tcga_gistic
     */
    fetchCopyNumberCountsUsingPOST(parameters: {
            'copyNumberCountIdentifiers': Array < CopyNumberCountIdentifier > ,
            'molecularProfileId': string,
            $queryParameters ? : any,
            $domain ? : string
        }): Promise < Array < CopyNumberCount >
        > {
            return this.fetchCopyNumberCountsUsingPOSTWithHttpInfo(parameters).then(function(response: request.Response) {
                return response.body;
            });
        };
    fetchDiscreteCopyNumbersInMolecularProfileUsingPOSTURL(parameters: {
        'discreteCopyNumberEventType' ? : "HOMDEL_AND_AMP" | "HOMDEL" | "AMP" | "GAIN" | "HETLOSS" | "DIPLOID" | "ALL",
        'discreteCopyNumberFilter': DiscreteCopyNumberFilter,
        'molecularProfileId': string,
        'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/molecular-profiles/{molecularProfileId}/discrete-copy-number/fetch';
        if (parameters['discreteCopyNumberEventType'] !== undefined) {
            queryParameters['discreteCopyNumberEventType'] = parameters['discreteCopyNumberEventType'];
        }

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
     * Fetch discrete copy number alterations in a molecular profile by sample ID
     * @method
     * @name CBioPortalAPI#fetchDiscreteCopyNumbersInMolecularProfileUsingPOST
     * @param {string} discreteCopyNumberEventType - Type of the copy number event
     * @param {} discreteCopyNumberFilter - List of Sample IDs/Sample List ID and Entrez Gene IDs
     * @param {string} molecularProfileId - Molecular Profile ID e.g. acc_tcga_gistic
     * @param {string} projection - Level of detail of the response
     */
    fetchDiscreteCopyNumbersInMolecularProfileUsingPOSTWithHttpInfo(parameters: {
        'discreteCopyNumberEventType' ? : "HOMDEL_AND_AMP" | "HOMDEL" | "AMP" | "GAIN" | "HETLOSS" | "DIPLOID" | "ALL",
        'discreteCopyNumberFilter': DiscreteCopyNumberFilter,
        'molecularProfileId': string,
        'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
        $queryParameters ? : any,
            $domain ? : string
    }): Promise < request.Response > {
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

            path = path.replace('{molecularProfileId}', parameters['molecularProfileId'] + '');

            if (parameters['molecularProfileId'] === undefined) {
                reject(new Error('Missing required  parameter: molecularProfileId'));
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

        });
    };

    /**
     * Fetch discrete copy number alterations in a molecular profile by sample ID
     * @method
     * @name CBioPortalAPI#fetchDiscreteCopyNumbersInMolecularProfileUsingPOST
     * @param {string} discreteCopyNumberEventType - Type of the copy number event
     * @param {} discreteCopyNumberFilter - List of Sample IDs/Sample List ID and Entrez Gene IDs
     * @param {string} molecularProfileId - Molecular Profile ID e.g. acc_tcga_gistic
     * @param {string} projection - Level of detail of the response
     */
    fetchDiscreteCopyNumbersInMolecularProfileUsingPOST(parameters: {
            'discreteCopyNumberEventType' ? : "HOMDEL_AND_AMP" | "HOMDEL" | "AMP" | "GAIN" | "HETLOSS" | "DIPLOID" | "ALL",
            'discreteCopyNumberFilter': DiscreteCopyNumberFilter,
            'molecularProfileId': string,
            'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
            $queryParameters ? : any,
                $domain ? : string
        }): Promise < Array < DiscreteCopyNumberData >
        > {
            return this.fetchDiscreteCopyNumbersInMolecularProfileUsingPOSTWithHttpInfo(parameters).then(function(response: request.Response) {
                return response.body;
            });
        };
    getGenePanelDataUsingPOSTURL(parameters: {
        'genePanelDataFilter': GenePanelDataFilter,
        'molecularProfileId': string,
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
     * @param {} genePanelDataFilter - List of Sample IDs/Sample List ID and Entrez Gene IDs
     * @param {string} molecularProfileId - Molecular Profile ID e.g. nsclc_unito_2016_mutations
     */
    getGenePanelDataUsingPOSTWithHttpInfo(parameters: {
        'genePanelDataFilter': GenePanelDataFilter,
        'molecularProfileId': string,
        $queryParameters ? : any,
        $domain ? : string
    }): Promise < request.Response > {
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

            if (parameters['genePanelDataFilter'] !== undefined) {
                body = parameters['genePanelDataFilter'];
            }

            if (parameters['genePanelDataFilter'] === undefined) {
                reject(new Error('Missing required  parameter: genePanelDataFilter'));
                return;
            }

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

            request('POST', domain + path, body, headers, queryParameters, form, reject, resolve, errorHandlers);

        });
    };

    /**
     * Get gene panel data
     * @method
     * @name CBioPortalAPI#getGenePanelDataUsingPOST
     * @param {} genePanelDataFilter - List of Sample IDs/Sample List ID and Entrez Gene IDs
     * @param {string} molecularProfileId - Molecular Profile ID e.g. nsclc_unito_2016_mutations
     */
    getGenePanelDataUsingPOST(parameters: {
            'genePanelDataFilter': GenePanelDataFilter,
            'molecularProfileId': string,
            $queryParameters ? : any,
            $domain ? : string
        }): Promise < Array < GenePanelData >
        > {
            return this.getGenePanelDataUsingPOSTWithHttpInfo(parameters).then(function(response: request.Response) {
                return response.body;
            });
        };
    getAllMolecularDataInMolecularProfileUsingGETURL(parameters: {
        'entrezGeneId': number,
        'molecularProfileId': string,
        'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
        'sampleListId': string,
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/molecular-profiles/{molecularProfileId}/molecular-data';
        if (parameters['entrezGeneId'] !== undefined) {
            queryParameters['entrezGeneId'] = parameters['entrezGeneId'];
        }

        path = path.replace('{molecularProfileId}', parameters['molecularProfileId'] + '');
        if (parameters['projection'] !== undefined) {
            queryParameters['projection'] = parameters['projection'];
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
     * Get all molecular data in a molecular profile
     * @method
     * @name CBioPortalAPI#getAllMolecularDataInMolecularProfileUsingGET
     * @param {integer} entrezGeneId - Entrez Gene ID e.g. 1
     * @param {string} molecularProfileId - Molecular Profile ID e.g. acc_tcga_rna_seq_v2_mrna
     * @param {string} projection - Level of detail of the response
     * @param {string} sampleListId - Sample List ID e.g. acc_tcga_all
     */
    getAllMolecularDataInMolecularProfileUsingGETWithHttpInfo(parameters: {
        'entrezGeneId': number,
        'molecularProfileId': string,
        'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
        'sampleListId': string,
        $queryParameters ? : any,
        $domain ? : string
    }): Promise < request.Response > {
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

            if (parameters['entrezGeneId'] !== undefined) {
                queryParameters['entrezGeneId'] = parameters['entrezGeneId'];
            }

            if (parameters['entrezGeneId'] === undefined) {
                reject(new Error('Missing required  parameter: entrezGeneId'));
                return;
            }

            path = path.replace('{molecularProfileId}', parameters['molecularProfileId'] + '');

            if (parameters['molecularProfileId'] === undefined) {
                reject(new Error('Missing required  parameter: molecularProfileId'));
                return;
            }

            if (parameters['projection'] !== undefined) {
                queryParameters['projection'] = parameters['projection'];
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

        });
    };

    /**
     * Get all molecular data in a molecular profile
     * @method
     * @name CBioPortalAPI#getAllMolecularDataInMolecularProfileUsingGET
     * @param {integer} entrezGeneId - Entrez Gene ID e.g. 1
     * @param {string} molecularProfileId - Molecular Profile ID e.g. acc_tcga_rna_seq_v2_mrna
     * @param {string} projection - Level of detail of the response
     * @param {string} sampleListId - Sample List ID e.g. acc_tcga_all
     */
    getAllMolecularDataInMolecularProfileUsingGET(parameters: {
            'entrezGeneId': number,
            'molecularProfileId': string,
            'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
            'sampleListId': string,
            $queryParameters ? : any,
            $domain ? : string
        }): Promise < Array < NumericGeneMolecularData >
        > {
            return this.getAllMolecularDataInMolecularProfileUsingGETWithHttpInfo(parameters).then(function(response: request.Response) {
                return response.body;
            });
        };
    fetchAllMolecularDataInMolecularProfileUsingPOSTURL(parameters: {
        'molecularDataFilter': MolecularDataFilter,
        'molecularProfileId': string,
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
     * @param {} molecularDataFilter - List of Sample IDs/Sample List ID and Entrez Gene IDs
     * @param {string} molecularProfileId - Molecular Profile ID e.g. acc_tcga_rna_seq_v2_mrna
     * @param {string} projection - Level of detail of the response
     */
    fetchAllMolecularDataInMolecularProfileUsingPOSTWithHttpInfo(parameters: {
        'molecularDataFilter': MolecularDataFilter,
        'molecularProfileId': string,
        'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
        $queryParameters ? : any,
        $domain ? : string
    }): Promise < request.Response > {
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

            if (parameters['molecularDataFilter'] !== undefined) {
                body = parameters['molecularDataFilter'];
            }

            if (parameters['molecularDataFilter'] === undefined) {
                reject(new Error('Missing required  parameter: molecularDataFilter'));
                return;
            }

            path = path.replace('{molecularProfileId}', parameters['molecularProfileId'] + '');

            if (parameters['molecularProfileId'] === undefined) {
                reject(new Error('Missing required  parameter: molecularProfileId'));
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

        });
    };

    /**
     * Fetch molecular data in a molecular profile
     * @method
     * @name CBioPortalAPI#fetchAllMolecularDataInMolecularProfileUsingPOST
     * @param {} molecularDataFilter - List of Sample IDs/Sample List ID and Entrez Gene IDs
     * @param {string} molecularProfileId - Molecular Profile ID e.g. acc_tcga_rna_seq_v2_mrna
     * @param {string} projection - Level of detail of the response
     */
    fetchAllMolecularDataInMolecularProfileUsingPOST(parameters: {
            'molecularDataFilter': MolecularDataFilter,
            'molecularProfileId': string,
            'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
            $queryParameters ? : any,
            $domain ? : string
        }): Promise < Array < NumericGeneMolecularData >
        > {
            return this.fetchAllMolecularDataInMolecularProfileUsingPOSTWithHttpInfo(parameters).then(function(response: request.Response) {
                return response.body;
            });
        };
    getMutationsInMolecularProfileBySampleListIdUsingGETURL(parameters: {
        'direction' ? : "ASC" | "DESC",
        'entrezGeneId' ? : number,
        'molecularProfileId': string,
        'pageNumber' ? : number,
        'pageSize' ? : number,
        'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
        'sampleListId': string,
        'sortBy' ? : "entrezGeneId" | "center" | "mutationStatus" | "validationStatus" | "tumorAltCount" | "tumorRefCount" | "normalAltCount" | "normalRefCount" | "aminoAcidChange" | "startPosition" | "endPosition" | "referenceAllele" | "variantAllele" | "proteinChange" | "mutationType" | "ncbiBuild" | "variantType" | "refseqMrnaId" | "proteinPosStart" | "proteinPosEnd" | "keyword",
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/molecular-profiles/{molecularProfileId}/mutations';
        if (parameters['direction'] !== undefined) {
            queryParameters['direction'] = parameters['direction'];
        }

        if (parameters['entrezGeneId'] !== undefined) {
            queryParameters['entrezGeneId'] = parameters['entrezGeneId'];
        }

        path = path.replace('{molecularProfileId}', parameters['molecularProfileId'] + '');
        if (parameters['pageNumber'] !== undefined) {
            queryParameters['pageNumber'] = parameters['pageNumber'];
        }

        if (parameters['pageSize'] !== undefined) {
            queryParameters['pageSize'] = parameters['pageSize'];
        }

        if (parameters['projection'] !== undefined) {
            queryParameters['projection'] = parameters['projection'];
        }

        if (parameters['sampleListId'] !== undefined) {
            queryParameters['sampleListId'] = parameters['sampleListId'];
        }

        if (parameters['sortBy'] !== undefined) {
            queryParameters['sortBy'] = parameters['sortBy'];
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
     * @param {string} direction - Direction of the sort
     * @param {integer} entrezGeneId - Entrez Gene ID
     * @param {string} molecularProfileId - Molecular Profile ID e.g. acc_tcga_mutations
     * @param {integer} pageNumber - Page number of the result list
     * @param {integer} pageSize - Page size of the result list
     * @param {string} projection - Level of detail of the response
     * @param {string} sampleListId - Sample List ID e.g. acc_tcga_all
     * @param {string} sortBy - Name of the property that the result list is sorted by
     */
    getMutationsInMolecularProfileBySampleListIdUsingGETWithHttpInfo(parameters: {
        'direction' ? : "ASC" | "DESC",
        'entrezGeneId' ? : number,
        'molecularProfileId': string,
        'pageNumber' ? : number,
        'pageSize' ? : number,
        'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
        'sampleListId': string,
        'sortBy' ? : "entrezGeneId" | "center" | "mutationStatus" | "validationStatus" | "tumorAltCount" | "tumorRefCount" | "normalAltCount" | "normalRefCount" | "aminoAcidChange" | "startPosition" | "endPosition" | "referenceAllele" | "variantAllele" | "proteinChange" | "mutationType" | "ncbiBuild" | "variantType" | "refseqMrnaId" | "proteinPosStart" | "proteinPosEnd" | "keyword",
        $queryParameters ? : any,
            $domain ? : string
    }): Promise < request.Response > {
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

            if (parameters['direction'] !== undefined) {
                queryParameters['direction'] = parameters['direction'];
            }

            if (parameters['entrezGeneId'] !== undefined) {
                queryParameters['entrezGeneId'] = parameters['entrezGeneId'];
            }

            path = path.replace('{molecularProfileId}', parameters['molecularProfileId'] + '');

            if (parameters['molecularProfileId'] === undefined) {
                reject(new Error('Missing required  parameter: molecularProfileId'));
                return;
            }

            if (parameters['pageNumber'] !== undefined) {
                queryParameters['pageNumber'] = parameters['pageNumber'];
            }

            if (parameters['pageSize'] !== undefined) {
                queryParameters['pageSize'] = parameters['pageSize'];
            }

            if (parameters['projection'] !== undefined) {
                queryParameters['projection'] = parameters['projection'];
            }

            if (parameters['sampleListId'] !== undefined) {
                queryParameters['sampleListId'] = parameters['sampleListId'];
            }

            if (parameters['sampleListId'] === undefined) {
                reject(new Error('Missing required  parameter: sampleListId'));
                return;
            }

            if (parameters['sortBy'] !== undefined) {
                queryParameters['sortBy'] = parameters['sortBy'];
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
     * Get mutations in a molecular profile by Sample List ID
     * @method
     * @name CBioPortalAPI#getMutationsInMolecularProfileBySampleListIdUsingGET
     * @param {string} direction - Direction of the sort
     * @param {integer} entrezGeneId - Entrez Gene ID
     * @param {string} molecularProfileId - Molecular Profile ID e.g. acc_tcga_mutations
     * @param {integer} pageNumber - Page number of the result list
     * @param {integer} pageSize - Page size of the result list
     * @param {string} projection - Level of detail of the response
     * @param {string} sampleListId - Sample List ID e.g. acc_tcga_all
     * @param {string} sortBy - Name of the property that the result list is sorted by
     */
    getMutationsInMolecularProfileBySampleListIdUsingGET(parameters: {
            'direction' ? : "ASC" | "DESC",
            'entrezGeneId' ? : number,
            'molecularProfileId': string,
            'pageNumber' ? : number,
            'pageSize' ? : number,
            'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
            'sampleListId': string,
            'sortBy' ? : "entrezGeneId" | "center" | "mutationStatus" | "validationStatus" | "tumorAltCount" | "tumorRefCount" | "normalAltCount" | "normalRefCount" | "aminoAcidChange" | "startPosition" | "endPosition" | "referenceAllele" | "variantAllele" | "proteinChange" | "mutationType" | "ncbiBuild" | "variantType" | "refseqMrnaId" | "proteinPosStart" | "proteinPosEnd" | "keyword",
            $queryParameters ? : any,
                $domain ? : string
        }): Promise < Array < Mutation >
        > {
            return this.getMutationsInMolecularProfileBySampleListIdUsingGETWithHttpInfo(parameters).then(function(response: request.Response) {
                return response.body;
            });
        };
    fetchMutationsInMolecularProfileUsingPOSTURL(parameters: {
        'direction' ? : "ASC" | "DESC",
        'molecularProfileId': string,
        'mutationFilter': MutationFilter,
        'pageNumber' ? : number,
        'pageSize' ? : number,
        'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
        'sortBy' ? : "entrezGeneId" | "center" | "mutationStatus" | "validationStatus" | "tumorAltCount" | "tumorRefCount" | "normalAltCount" | "normalRefCount" | "aminoAcidChange" | "startPosition" | "endPosition" | "referenceAllele" | "variantAllele" | "proteinChange" | "mutationType" | "ncbiBuild" | "variantType" | "refseqMrnaId" | "proteinPosStart" | "proteinPosEnd" | "keyword",
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/molecular-profiles/{molecularProfileId}/mutations/fetch';
        if (parameters['direction'] !== undefined) {
            queryParameters['direction'] = parameters['direction'];
        }

        path = path.replace('{molecularProfileId}', parameters['molecularProfileId'] + '');

        if (parameters['pageNumber'] !== undefined) {
            queryParameters['pageNumber'] = parameters['pageNumber'];
        }

        if (parameters['pageSize'] !== undefined) {
            queryParameters['pageSize'] = parameters['pageSize'];
        }

        if (parameters['projection'] !== undefined) {
            queryParameters['projection'] = parameters['projection'];
        }

        if (parameters['sortBy'] !== undefined) {
            queryParameters['sortBy'] = parameters['sortBy'];
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
     * @param {string} direction - Direction of the sort
     * @param {string} molecularProfileId - Molecular Profile ID e.g. acc_tcga_mutations
     * @param {} mutationFilter - List of Sample IDs/Sample List ID and Entrez Gene IDs
     * @param {integer} pageNumber - Page number of the result list
     * @param {integer} pageSize - Page size of the result list
     * @param {string} projection - Level of detail of the response
     * @param {string} sortBy - Name of the property that the result list is sorted by
     */
    fetchMutationsInMolecularProfileUsingPOSTWithHttpInfo(parameters: {
        'direction' ? : "ASC" | "DESC",
        'molecularProfileId': string,
        'mutationFilter': MutationFilter,
        'pageNumber' ? : number,
        'pageSize' ? : number,
        'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
        'sortBy' ? : "entrezGeneId" | "center" | "mutationStatus" | "validationStatus" | "tumorAltCount" | "tumorRefCount" | "normalAltCount" | "normalRefCount" | "aminoAcidChange" | "startPosition" | "endPosition" | "referenceAllele" | "variantAllele" | "proteinChange" | "mutationType" | "ncbiBuild" | "variantType" | "refseqMrnaId" | "proteinPosStart" | "proteinPosEnd" | "keyword",
        $queryParameters ? : any,
            $domain ? : string
    }): Promise < request.Response > {
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

            if (parameters['direction'] !== undefined) {
                queryParameters['direction'] = parameters['direction'];
            }

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

            if (parameters['pageNumber'] !== undefined) {
                queryParameters['pageNumber'] = parameters['pageNumber'];
            }

            if (parameters['pageSize'] !== undefined) {
                queryParameters['pageSize'] = parameters['pageSize'];
            }

            if (parameters['projection'] !== undefined) {
                queryParameters['projection'] = parameters['projection'];
            }

            if (parameters['sortBy'] !== undefined) {
                queryParameters['sortBy'] = parameters['sortBy'];
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
     * Fetch mutations in a molecular profile
     * @method
     * @name CBioPortalAPI#fetchMutationsInMolecularProfileUsingPOST
     * @param {string} direction - Direction of the sort
     * @param {string} molecularProfileId - Molecular Profile ID e.g. acc_tcga_mutations
     * @param {} mutationFilter - List of Sample IDs/Sample List ID and Entrez Gene IDs
     * @param {integer} pageNumber - Page number of the result list
     * @param {integer} pageSize - Page size of the result list
     * @param {string} projection - Level of detail of the response
     * @param {string} sortBy - Name of the property that the result list is sorted by
     */
    fetchMutationsInMolecularProfileUsingPOST(parameters: {
            'direction' ? : "ASC" | "DESC",
            'molecularProfileId': string,
            'mutationFilter': MutationFilter,
            'pageNumber' ? : number,
            'pageSize' ? : number,
            'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
            'sortBy' ? : "entrezGeneId" | "center" | "mutationStatus" | "validationStatus" | "tumorAltCount" | "tumorRefCount" | "normalAltCount" | "normalRefCount" | "aminoAcidChange" | "startPosition" | "endPosition" | "referenceAllele" | "variantAllele" | "proteinChange" | "mutationType" | "ncbiBuild" | "variantType" | "refseqMrnaId" | "proteinPosStart" | "proteinPosEnd" | "keyword",
            $queryParameters ? : any,
                $domain ? : string
        }): Promise < Array < Mutation >
        > {
            return this.fetchMutationsInMolecularProfileUsingPOSTWithHttpInfo(parameters).then(function(response: request.Response) {
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
    fetchMutationCountsByPositionUsingPOSTWithHttpInfo(parameters: {
        'mutationPositionIdentifiers': Array < MutationPositionIdentifier > ,
        $queryParameters ? : any,
        $domain ? : string
    }): Promise < request.Response > {
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

        });
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
            return this.fetchMutationCountsByPositionUsingPOSTWithHttpInfo(parameters).then(function(response: request.Response) {
                return response.body;
            });
        };
    fetchMutationsInMultipleMolecularProfilesUsingPOSTURL(parameters: {
        'direction' ? : "ASC" | "DESC",
        'mutationMultipleStudyFilter': MutationMultipleStudyFilter,
        'pageNumber' ? : number,
        'pageSize' ? : number,
        'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
        'sortBy' ? : "entrezGeneId" | "center" | "mutationStatus" | "validationStatus" | "tumorAltCount" | "tumorRefCount" | "normalAltCount" | "normalRefCount" | "aminoAcidChange" | "startPosition" | "endPosition" | "referenceAllele" | "variantAllele" | "proteinChange" | "mutationType" | "ncbiBuild" | "variantType" | "refseqMrnaId" | "proteinPosStart" | "proteinPosEnd" | "keyword",
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/mutations/fetch';
        if (parameters['direction'] !== undefined) {
            queryParameters['direction'] = parameters['direction'];
        }

        if (parameters['pageNumber'] !== undefined) {
            queryParameters['pageNumber'] = parameters['pageNumber'];
        }

        if (parameters['pageSize'] !== undefined) {
            queryParameters['pageSize'] = parameters['pageSize'];
        }

        if (parameters['projection'] !== undefined) {
            queryParameters['projection'] = parameters['projection'];
        }

        if (parameters['sortBy'] !== undefined) {
            queryParameters['sortBy'] = parameters['sortBy'];
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
     * @param {string} direction - Direction of the sort
     * @param {} mutationMultipleStudyFilter - List of Molecular Profile IDs or List of Molecular Profile ID / Sample ID pairs, and List of Entrez Gene IDs
     * @param {integer} pageNumber - Page number of the result list
     * @param {integer} pageSize - Page size of the result list
     * @param {string} projection - Level of detail of the response
     * @param {string} sortBy - Name of the property that the result list is sorted by
     */
    fetchMutationsInMultipleMolecularProfilesUsingPOSTWithHttpInfo(parameters: {
        'direction' ? : "ASC" | "DESC",
        'mutationMultipleStudyFilter': MutationMultipleStudyFilter,
        'pageNumber' ? : number,
        'pageSize' ? : number,
        'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
        'sortBy' ? : "entrezGeneId" | "center" | "mutationStatus" | "validationStatus" | "tumorAltCount" | "tumorRefCount" | "normalAltCount" | "normalRefCount" | "aminoAcidChange" | "startPosition" | "endPosition" | "referenceAllele" | "variantAllele" | "proteinChange" | "mutationType" | "ncbiBuild" | "variantType" | "refseqMrnaId" | "proteinPosStart" | "proteinPosEnd" | "keyword",
        $queryParameters ? : any,
            $domain ? : string
    }): Promise < request.Response > {
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

            if (parameters['direction'] !== undefined) {
                queryParameters['direction'] = parameters['direction'];
            }

            if (parameters['mutationMultipleStudyFilter'] !== undefined) {
                body = parameters['mutationMultipleStudyFilter'];
            }

            if (parameters['mutationMultipleStudyFilter'] === undefined) {
                reject(new Error('Missing required  parameter: mutationMultipleStudyFilter'));
                return;
            }

            if (parameters['pageNumber'] !== undefined) {
                queryParameters['pageNumber'] = parameters['pageNumber'];
            }

            if (parameters['pageSize'] !== undefined) {
                queryParameters['pageSize'] = parameters['pageSize'];
            }

            if (parameters['projection'] !== undefined) {
                queryParameters['projection'] = parameters['projection'];
            }

            if (parameters['sortBy'] !== undefined) {
                queryParameters['sortBy'] = parameters['sortBy'];
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
     * Fetch mutations in multiple molecular profiles by sample IDs
     * @method
     * @name CBioPortalAPI#fetchMutationsInMultipleMolecularProfilesUsingPOST
     * @param {string} direction - Direction of the sort
     * @param {} mutationMultipleStudyFilter - List of Molecular Profile IDs or List of Molecular Profile ID / Sample ID pairs, and List of Entrez Gene IDs
     * @param {integer} pageNumber - Page number of the result list
     * @param {integer} pageSize - Page size of the result list
     * @param {string} projection - Level of detail of the response
     * @param {string} sortBy - Name of the property that the result list is sorted by
     */
    fetchMutationsInMultipleMolecularProfilesUsingPOST(parameters: {
            'direction' ? : "ASC" | "DESC",
            'mutationMultipleStudyFilter': MutationMultipleStudyFilter,
            'pageNumber' ? : number,
            'pageSize' ? : number,
            'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
            'sortBy' ? : "entrezGeneId" | "center" | "mutationStatus" | "validationStatus" | "tumorAltCount" | "tumorRefCount" | "normalAltCount" | "normalRefCount" | "aminoAcidChange" | "startPosition" | "endPosition" | "referenceAllele" | "variantAllele" | "proteinChange" | "mutationType" | "ncbiBuild" | "variantType" | "refseqMrnaId" | "proteinPosStart" | "proteinPosEnd" | "keyword",
            $queryParameters ? : any,
                $domain ? : string
        }): Promise < Array < Mutation >
        > {
            return this.fetchMutationsInMultipleMolecularProfilesUsingPOSTWithHttpInfo(parameters).then(function(response: request.Response) {
                return response.body;
            });
        };
    getAllPatientsUsingGETURL(parameters: {
        'direction' ? : "ASC" | "DESC",
        'keyword' ? : string,
        'pageNumber' ? : number,
        'pageSize' ? : number,
        'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/patients';
        if (parameters['direction'] !== undefined) {
            queryParameters['direction'] = parameters['direction'];
        }

        if (parameters['keyword'] !== undefined) {
            queryParameters['keyword'] = parameters['keyword'];
        }

        if (parameters['pageNumber'] !== undefined) {
            queryParameters['pageNumber'] = parameters['pageNumber'];
        }

        if (parameters['pageSize'] !== undefined) {
            queryParameters['pageSize'] = parameters['pageSize'];
        }

        if (parameters['projection'] !== undefined) {
            queryParameters['projection'] = parameters['projection'];
        }

        queryParameters['sortBy'] = 'patientId';

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
    * Get all patients
    * @method
    * @name CBioPortalAPI#getAllPatientsUsingGET
         * @param {string} direction - Direction of the sort
         * @param {string} keyword - Search keyword that applies to ID of the patients
         * @param {integer} pageNumber - Page number of the result list
         * @param {integer} pageSize - Page size of the result list
         * @param {string} projection - Level of detail of the response
        
    */
    getAllPatientsUsingGETWithHttpInfo(parameters: {
        'direction' ? : "ASC" | "DESC",
        'keyword' ? : string,
        'pageNumber' ? : number,
        'pageSize' ? : number,
        'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
        $queryParameters ? : any,
            $domain ? : string
    }): Promise < request.Response > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        const errorHandlers = this.errorHandlers;
        const request = this.request;
        let path = '/patients';
        let body: any;
        let queryParameters: any = {};
        let headers: any = {};
        let form: any = {};
        return new Promise(function(resolve, reject) {
            headers['Accept'] = 'application/json';

            if (parameters['direction'] !== undefined) {
                queryParameters['direction'] = parameters['direction'];
            }

            if (parameters['keyword'] !== undefined) {
                queryParameters['keyword'] = parameters['keyword'];
            }

            if (parameters['pageNumber'] !== undefined) {
                queryParameters['pageNumber'] = parameters['pageNumber'];
            }

            if (parameters['pageSize'] !== undefined) {
                queryParameters['pageSize'] = parameters['pageSize'];
            }

            if (parameters['projection'] !== undefined) {
                queryParameters['projection'] = parameters['projection'];
            }

            queryParameters['sortBy'] = 'patientId';

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
    * Get all patients
    * @method
    * @name CBioPortalAPI#getAllPatientsUsingGET
         * @param {string} direction - Direction of the sort
         * @param {string} keyword - Search keyword that applies to ID of the patients
         * @param {integer} pageNumber - Page number of the result list
         * @param {integer} pageSize - Page size of the result list
         * @param {string} projection - Level of detail of the response
        
    */
    getAllPatientsUsingGET(parameters: {
            'direction' ? : "ASC" | "DESC",
            'keyword' ? : string,
            'pageNumber' ? : number,
            'pageSize' ? : number,
            'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
            $queryParameters ? : any,
                $domain ? : string
        }): Promise < Array < Patient >
        > {
            return this.getAllPatientsUsingGETWithHttpInfo(parameters).then(function(response: request.Response) {
                return response.body;
            });
        };
    fetchPatientsUsingPOSTURL(parameters: {
        'patientFilter': PatientFilter,
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
     * fetchPatients
     * @method
     * @name CBioPortalAPI#fetchPatientsUsingPOST
     * @param {} patientFilter - List of patient identifiers
     * @param {string} projection - Level of detail of the response
     */
    fetchPatientsUsingPOSTWithHttpInfo(parameters: {
        'patientFilter': PatientFilter,
        'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
        $queryParameters ? : any,
        $domain ? : string
    }): Promise < request.Response > {
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

            if (parameters['patientFilter'] !== undefined) {
                body = parameters['patientFilter'];
            }

            if (parameters['patientFilter'] === undefined) {
                reject(new Error('Missing required  parameter: patientFilter'));
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

        });
    };

    /**
     * fetchPatients
     * @method
     * @name CBioPortalAPI#fetchPatientsUsingPOST
     * @param {} patientFilter - List of patient identifiers
     * @param {string} projection - Level of detail of the response
     */
    fetchPatientsUsingPOST(parameters: {
            'patientFilter': PatientFilter,
            'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
            $queryParameters ? : any,
            $domain ? : string
        }): Promise < Array < Patient >
        > {
            return this.fetchPatientsUsingPOSTWithHttpInfo(parameters).then(function(response: request.Response) {
                return response.body;
            });
        };
    getAllReferenceGenomeGenesUsingGETURL(parameters: {
        'genomeName': string,
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/reference-genome-genes/{genomeName}';

        path = path.replace('{genomeName}', parameters['genomeName'] + '');

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
     * Get all reference genes
     * @method
     * @name CBioPortalAPI#getAllReferenceGenomeGenesUsingGET
     * @param {string} genomeName - Name of Reference Genome hg19
     */
    getAllReferenceGenomeGenesUsingGETWithHttpInfo(parameters: {
        'genomeName': string,
        $queryParameters ? : any,
        $domain ? : string
    }): Promise < request.Response > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        const errorHandlers = this.errorHandlers;
        const request = this.request;
        let path = '/reference-genome-genes/{genomeName}';
        let body: any;
        let queryParameters: any = {};
        let headers: any = {};
        let form: any = {};
        return new Promise(function(resolve, reject) {
            headers['Accept'] = 'application/json';

            path = path.replace('{genomeName}', parameters['genomeName'] + '');

            if (parameters['genomeName'] === undefined) {
                reject(new Error('Missing required  parameter: genomeName'));
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
     * Get all reference genes
     * @method
     * @name CBioPortalAPI#getAllReferenceGenomeGenesUsingGET
     * @param {string} genomeName - Name of Reference Genome hg19
     */
    getAllReferenceGenomeGenesUsingGET(parameters: {
            'genomeName': string,
            $queryParameters ? : any,
            $domain ? : string
        }): Promise < Array < ReferenceGenomeGene >
        > {
            return this.getAllReferenceGenomeGenesUsingGETWithHttpInfo(parameters).then(function(response: request.Response) {
                return response.body;
            });
        };
    fetchReferenceGenomeGenesUsingPOSTURL(parameters: {
        'geneIds': Array < string > ,
        'genomeName': string,
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/reference-genome-genes/{genomeName}/fetch';

        path = path.replace('{genomeName}', parameters['genomeName'] + '');

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
     * Fetch genes of reference genome of interest
     * @method
     * @name CBioPortalAPI#fetchReferenceGenomeGenesUsingPOST
     * @param {} geneIds - List of Entrez Gene IDs
     * @param {string} genomeName - Name of Reference Genome hg19
     */
    fetchReferenceGenomeGenesUsingPOSTWithHttpInfo(parameters: {
        'geneIds': Array < string > ,
        'genomeName': string,
        $queryParameters ? : any,
        $domain ? : string
    }): Promise < request.Response > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        const errorHandlers = this.errorHandlers;
        const request = this.request;
        let path = '/reference-genome-genes/{genomeName}/fetch';
        let body: any;
        let queryParameters: any = {};
        let headers: any = {};
        let form: any = {};
        return new Promise(function(resolve, reject) {
            headers['Accept'] = 'application/json';
            headers['Content-Type'] = 'application/json';

            if (parameters['geneIds'] !== undefined) {
                body = parameters['geneIds'];
            }

            if (parameters['geneIds'] === undefined) {
                reject(new Error('Missing required  parameter: geneIds'));
                return;
            }

            path = path.replace('{genomeName}', parameters['genomeName'] + '');

            if (parameters['genomeName'] === undefined) {
                reject(new Error('Missing required  parameter: genomeName'));
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
     * Fetch genes of reference genome of interest
     * @method
     * @name CBioPortalAPI#fetchReferenceGenomeGenesUsingPOST
     * @param {} geneIds - List of Entrez Gene IDs
     * @param {string} genomeName - Name of Reference Genome hg19
     */
    fetchReferenceGenomeGenesUsingPOST(parameters: {
            'geneIds': Array < string > ,
            'genomeName': string,
            $queryParameters ? : any,
            $domain ? : string
        }): Promise < Array < ReferenceGenomeGene >
        > {
            return this.fetchReferenceGenomeGenesUsingPOSTWithHttpInfo(parameters).then(function(response: request.Response) {
                return response.body;
            });
        };
    getReferenceGenomeGeneUsingGETURL(parameters: {
        'geneId': number,
        'genomeName': string,
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/reference-genome-genes/{genomeName}/{geneId}';

        path = path.replace('{geneId}', parameters['geneId'] + '');

        path = path.replace('{genomeName}', parameters['genomeName'] + '');

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
     * Get a gene of a reference genome of interest
     * @method
     * @name CBioPortalAPI#getReferenceGenomeGeneUsingGET
     * @param {integer} geneId - Entrez Gene ID 207
     * @param {string} genomeName - Name of Reference Genome hg19
     */
    getReferenceGenomeGeneUsingGETWithHttpInfo(parameters: {
        'geneId': number,
        'genomeName': string,
        $queryParameters ? : any,
        $domain ? : string
    }): Promise < request.Response > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        const errorHandlers = this.errorHandlers;
        const request = this.request;
        let path = '/reference-genome-genes/{genomeName}/{geneId}';
        let body: any;
        let queryParameters: any = {};
        let headers: any = {};
        let form: any = {};
        return new Promise(function(resolve, reject) {
            headers['Accept'] = 'application/json';

            path = path.replace('{geneId}', parameters['geneId'] + '');

            if (parameters['geneId'] === undefined) {
                reject(new Error('Missing required  parameter: geneId'));
                return;
            }

            path = path.replace('{genomeName}', parameters['genomeName'] + '');

            if (parameters['genomeName'] === undefined) {
                reject(new Error('Missing required  parameter: genomeName'));
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
     * Get a gene of a reference genome of interest
     * @method
     * @name CBioPortalAPI#getReferenceGenomeGeneUsingGET
     * @param {integer} geneId - Entrez Gene ID 207
     * @param {string} genomeName - Name of Reference Genome hg19
     */
    getReferenceGenomeGeneUsingGET(parameters: {
        'geneId': number,
        'genomeName': string,
        $queryParameters ? : any,
        $domain ? : string
    }): Promise < ReferenceGenomeGene > {
        return this.getReferenceGenomeGeneUsingGETWithHttpInfo(parameters).then(function(response: request.Response) {
            return response.body;
        });
    };
    getAllSampleListsUsingGETURL(parameters: {
        'direction' ? : "ASC" | "DESC",
        'pageNumber' ? : number,
        'pageSize' ? : number,
        'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
        'sortBy' ? : "sampleListId" | "category" | "studyId" | "name" | "description",
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/sample-lists';
        if (parameters['direction'] !== undefined) {
            queryParameters['direction'] = parameters['direction'];
        }

        if (parameters['pageNumber'] !== undefined) {
            queryParameters['pageNumber'] = parameters['pageNumber'];
        }

        if (parameters['pageSize'] !== undefined) {
            queryParameters['pageSize'] = parameters['pageSize'];
        }

        if (parameters['projection'] !== undefined) {
            queryParameters['projection'] = parameters['projection'];
        }

        if (parameters['sortBy'] !== undefined) {
            queryParameters['sortBy'] = parameters['sortBy'];
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
     * @param {string} direction - Direction of the sort
     * @param {integer} pageNumber - Page number of the result list
     * @param {integer} pageSize - Page size of the result list
     * @param {string} projection - Level of detail of the response
     * @param {string} sortBy - Name of the property that the result list is sorted by
     */
    getAllSampleListsUsingGETWithHttpInfo(parameters: {
        'direction' ? : "ASC" | "DESC",
        'pageNumber' ? : number,
        'pageSize' ? : number,
        'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
        'sortBy' ? : "sampleListId" | "category" | "studyId" | "name" | "description",
        $queryParameters ? : any,
            $domain ? : string
    }): Promise < request.Response > {
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

            if (parameters['direction'] !== undefined) {
                queryParameters['direction'] = parameters['direction'];
            }

            if (parameters['pageNumber'] !== undefined) {
                queryParameters['pageNumber'] = parameters['pageNumber'];
            }

            if (parameters['pageSize'] !== undefined) {
                queryParameters['pageSize'] = parameters['pageSize'];
            }

            if (parameters['projection'] !== undefined) {
                queryParameters['projection'] = parameters['projection'];
            }

            if (parameters['sortBy'] !== undefined) {
                queryParameters['sortBy'] = parameters['sortBy'];
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
     * Get all sample lists
     * @method
     * @name CBioPortalAPI#getAllSampleListsUsingGET
     * @param {string} direction - Direction of the sort
     * @param {integer} pageNumber - Page number of the result list
     * @param {integer} pageSize - Page size of the result list
     * @param {string} projection - Level of detail of the response
     * @param {string} sortBy - Name of the property that the result list is sorted by
     */
    getAllSampleListsUsingGET(parameters: {
            'direction' ? : "ASC" | "DESC",
            'pageNumber' ? : number,
            'pageSize' ? : number,
            'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
            'sortBy' ? : "sampleListId" | "category" | "studyId" | "name" | "description",
            $queryParameters ? : any,
                $domain ? : string
        }): Promise < Array < SampleList >
        > {
            return this.getAllSampleListsUsingGETWithHttpInfo(parameters).then(function(response: request.Response) {
                return response.body;
            });
        };
    fetchSampleListsUsingPOSTURL(parameters: {
        'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
        'sampleListIds': Array < string > ,
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
     * @param {string} projection - Level of detail of the response
     * @param {} sampleListIds - List of sample list IDs
     */
    fetchSampleListsUsingPOSTWithHttpInfo(parameters: {
        'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
        'sampleListIds': Array < string > ,
            $queryParameters ? : any,
            $domain ? : string
    }): Promise < request.Response > {
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

            if (parameters['projection'] !== undefined) {
                queryParameters['projection'] = parameters['projection'];
            }

            if (parameters['sampleListIds'] !== undefined) {
                body = parameters['sampleListIds'];
            }

            if (parameters['sampleListIds'] === undefined) {
                reject(new Error('Missing required  parameter: sampleListIds'));
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
     * Fetch sample lists by ID
     * @method
     * @name CBioPortalAPI#fetchSampleListsUsingPOST
     * @param {string} projection - Level of detail of the response
     * @param {} sampleListIds - List of sample list IDs
     */
    fetchSampleListsUsingPOST(parameters: {
            'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
            'sampleListIds': Array < string > ,
                $queryParameters ? : any,
                $domain ? : string
        }): Promise < Array < SampleList >
        > {
            return this.fetchSampleListsUsingPOSTWithHttpInfo(parameters).then(function(response: request.Response) {
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
    getSampleListUsingGETWithHttpInfo(parameters: {
        'sampleListId': string,
        $queryParameters ? : any,
        $domain ? : string
    }): Promise < request.Response > {
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

        });
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
        return this.getSampleListUsingGETWithHttpInfo(parameters).then(function(response: request.Response) {
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
    getAllSampleIdsInSampleListUsingGETWithHttpInfo(parameters: {
        'sampleListId': string,
        $queryParameters ? : any,
        $domain ? : string
    }): Promise < request.Response > {
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

        });
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
            return this.getAllSampleIdsInSampleListUsingGETWithHttpInfo(parameters).then(function(response: request.Response) {
                return response.body;
            });
        };
    getSamplesByKeywordUsingGETURL(parameters: {
        'direction' ? : "ASC" | "DESC",
        'keyword' ? : string,
        'pageNumber' ? : number,
        'pageSize' ? : number,
        'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
        'sortBy' ? : "sampleId" | "sampleType",
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/samples';
        if (parameters['direction'] !== undefined) {
            queryParameters['direction'] = parameters['direction'];
        }

        if (parameters['keyword'] !== undefined) {
            queryParameters['keyword'] = parameters['keyword'];
        }

        if (parameters['pageNumber'] !== undefined) {
            queryParameters['pageNumber'] = parameters['pageNumber'];
        }

        if (parameters['pageSize'] !== undefined) {
            queryParameters['pageSize'] = parameters['pageSize'];
        }

        if (parameters['projection'] !== undefined) {
            queryParameters['projection'] = parameters['projection'];
        }

        if (parameters['sortBy'] !== undefined) {
            queryParameters['sortBy'] = parameters['sortBy'];
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
     * Get all samples matching keyword
     * @method
     * @name CBioPortalAPI#getSamplesByKeywordUsingGET
     * @param {string} direction - Direction of the sort
     * @param {string} keyword - Search keyword that applies to the study ID
     * @param {integer} pageNumber - Page number of the result list
     * @param {integer} pageSize - Page size of the result list
     * @param {string} projection - Level of detail of the response
     * @param {string} sortBy - Name of the property that the result list is sorted by
     */
    getSamplesByKeywordUsingGETWithHttpInfo(parameters: {
        'direction' ? : "ASC" | "DESC",
        'keyword' ? : string,
        'pageNumber' ? : number,
        'pageSize' ? : number,
        'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
        'sortBy' ? : "sampleId" | "sampleType",
        $queryParameters ? : any,
            $domain ? : string
    }): Promise < request.Response > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        const errorHandlers = this.errorHandlers;
        const request = this.request;
        let path = '/samples';
        let body: any;
        let queryParameters: any = {};
        let headers: any = {};
        let form: any = {};
        return new Promise(function(resolve, reject) {
            headers['Accept'] = 'application/json';

            if (parameters['direction'] !== undefined) {
                queryParameters['direction'] = parameters['direction'];
            }

            if (parameters['keyword'] !== undefined) {
                queryParameters['keyword'] = parameters['keyword'];
            }

            if (parameters['pageNumber'] !== undefined) {
                queryParameters['pageNumber'] = parameters['pageNumber'];
            }

            if (parameters['pageSize'] !== undefined) {
                queryParameters['pageSize'] = parameters['pageSize'];
            }

            if (parameters['projection'] !== undefined) {
                queryParameters['projection'] = parameters['projection'];
            }

            if (parameters['sortBy'] !== undefined) {
                queryParameters['sortBy'] = parameters['sortBy'];
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
     * Get all samples matching keyword
     * @method
     * @name CBioPortalAPI#getSamplesByKeywordUsingGET
     * @param {string} direction - Direction of the sort
     * @param {string} keyword - Search keyword that applies to the study ID
     * @param {integer} pageNumber - Page number of the result list
     * @param {integer} pageSize - Page size of the result list
     * @param {string} projection - Level of detail of the response
     * @param {string} sortBy - Name of the property that the result list is sorted by
     */
    getSamplesByKeywordUsingGET(parameters: {
            'direction' ? : "ASC" | "DESC",
            'keyword' ? : string,
            'pageNumber' ? : number,
            'pageSize' ? : number,
            'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
            'sortBy' ? : "sampleId" | "sampleType",
            $queryParameters ? : any,
                $domain ? : string
        }): Promise < Array < Sample >
        > {
            return this.getSamplesByKeywordUsingGETWithHttpInfo(parameters).then(function(response: request.Response) {
                return response.body;
            });
        };
    fetchSamplesUsingPOSTURL(parameters: {
        'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
        'sampleFilter': SampleFilter,
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
     * @param {string} projection - Level of detail of the response
     * @param {} sampleFilter - List of sample identifiers
     */
    fetchSamplesUsingPOSTWithHttpInfo(parameters: {
        'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
        'sampleFilter': SampleFilter,
        $queryParameters ? : any,
            $domain ? : string
    }): Promise < request.Response > {
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

            if (parameters['projection'] !== undefined) {
                queryParameters['projection'] = parameters['projection'];
            }

            if (parameters['sampleFilter'] !== undefined) {
                body = parameters['sampleFilter'];
            }

            if (parameters['sampleFilter'] === undefined) {
                reject(new Error('Missing required  parameter: sampleFilter'));
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
     * Fetch samples by ID
     * @method
     * @name CBioPortalAPI#fetchSamplesUsingPOST
     * @param {string} projection - Level of detail of the response
     * @param {} sampleFilter - List of sample identifiers
     */
    fetchSamplesUsingPOST(parameters: {
            'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
            'sampleFilter': SampleFilter,
            $queryParameters ? : any,
                $domain ? : string
        }): Promise < Array < Sample >
        > {
            return this.fetchSamplesUsingPOSTWithHttpInfo(parameters).then(function(response: request.Response) {
                return response.body;
            });
        };
    fetchStructuralVariantsUsingPOSTURL(parameters: {
        'entrezGeneIds' ? : Array < number > ,
            'molecularProfileIds' ? : Array < string > ,
            'sampleMolecularIdentifiers0MolecularProfileId' ? : string,
            'sampleMolecularIdentifiers0SampleId' ? : string,
            'structuralVariantFilter': StructuralVariantFilter,
            $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/structuralvariant/fetch';
        if (parameters['entrezGeneIds'] !== undefined) {
            queryParameters['entrezGeneIds'] = parameters['entrezGeneIds'];
        }

        if (parameters['molecularProfileIds'] !== undefined) {
            queryParameters['molecularProfileIds'] = parameters['molecularProfileIds'];
        }

        if (parameters['sampleMolecularIdentifiers0MolecularProfileId'] !== undefined) {
            queryParameters['sampleMolecularIdentifiers[0].molecularProfileId'] = parameters['sampleMolecularIdentifiers0MolecularProfileId'];
        }

        if (parameters['sampleMolecularIdentifiers0SampleId'] !== undefined) {
            queryParameters['sampleMolecularIdentifiers[0].sampleId'] = parameters['sampleMolecularIdentifiers0SampleId'];
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
     * Fetch structural variants for entrezGeneIds and molecularProfileIds or sampleMolecularIdentifiers
     * @method
     * @name CBioPortalAPI#fetchStructuralVariantsUsingPOST
     * @param {array} entrezGeneIds - A web service for supplying JSON formatted data to cBioPortal clients. Please note that this API is currently in beta and subject to change.
     * @param {array} molecularProfileIds - A web service for supplying JSON formatted data to cBioPortal clients. Please note that this API is currently in beta and subject to change.
     * @param {string} sampleMolecularIdentifiers0MolecularProfileId - A web service for supplying JSON formatted data to cBioPortal clients. Please note that this API is currently in beta and subject to change.
     * @param {string} sampleMolecularIdentifiers0SampleId - A web service for supplying JSON formatted data to cBioPortal clients. Please note that this API is currently in beta and subject to change.
     * @param {} structuralVariantFilter - List of entrezGeneIds and molecularProfileIds or sampleMolecularIdentifiers
     */
    fetchStructuralVariantsUsingPOSTWithHttpInfo(parameters: {
        'entrezGeneIds' ? : Array < number > ,
            'molecularProfileIds' ? : Array < string > ,
            'sampleMolecularIdentifiers0MolecularProfileId' ? : string,
            'sampleMolecularIdentifiers0SampleId' ? : string,
            'structuralVariantFilter': StructuralVariantFilter,
            $queryParameters ? : any,
            $domain ? : string
    }): Promise < request.Response > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        const errorHandlers = this.errorHandlers;
        const request = this.request;
        let path = '/structuralvariant/fetch';
        let body: any;
        let queryParameters: any = {};
        let headers: any = {};
        let form: any = {};
        return new Promise(function(resolve, reject) {
            headers['Accept'] = 'application/json';
            headers['Content-Type'] = 'application/json';

            if (parameters['entrezGeneIds'] !== undefined) {
                queryParameters['entrezGeneIds'] = parameters['entrezGeneIds'];
            }

            if (parameters['molecularProfileIds'] !== undefined) {
                queryParameters['molecularProfileIds'] = parameters['molecularProfileIds'];
            }

            if (parameters['sampleMolecularIdentifiers0MolecularProfileId'] !== undefined) {
                queryParameters['sampleMolecularIdentifiers[0].molecularProfileId'] = parameters['sampleMolecularIdentifiers0MolecularProfileId'];
            }

            if (parameters['sampleMolecularIdentifiers0SampleId'] !== undefined) {
                queryParameters['sampleMolecularIdentifiers[0].sampleId'] = parameters['sampleMolecularIdentifiers0SampleId'];
            }

            if (parameters['structuralVariantFilter'] !== undefined) {
                body = parameters['structuralVariantFilter'];
            }

            if (parameters['structuralVariantFilter'] === undefined) {
                reject(new Error('Missing required  parameter: structuralVariantFilter'));
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
     * Fetch structural variants for entrezGeneIds and molecularProfileIds or sampleMolecularIdentifiers
     * @method
     * @name CBioPortalAPI#fetchStructuralVariantsUsingPOST
     * @param {array} entrezGeneIds - A web service for supplying JSON formatted data to cBioPortal clients. Please note that this API is currently in beta and subject to change.
     * @param {array} molecularProfileIds - A web service for supplying JSON formatted data to cBioPortal clients. Please note that this API is currently in beta and subject to change.
     * @param {string} sampleMolecularIdentifiers0MolecularProfileId - A web service for supplying JSON formatted data to cBioPortal clients. Please note that this API is currently in beta and subject to change.
     * @param {string} sampleMolecularIdentifiers0SampleId - A web service for supplying JSON formatted data to cBioPortal clients. Please note that this API is currently in beta and subject to change.
     * @param {} structuralVariantFilter - List of entrezGeneIds and molecularProfileIds or sampleMolecularIdentifiers
     */
    fetchStructuralVariantsUsingPOST(parameters: {
            'entrezGeneIds' ? : Array < number > ,
                'molecularProfileIds' ? : Array < string > ,
                'sampleMolecularIdentifiers0MolecularProfileId' ? : string,
                'sampleMolecularIdentifiers0SampleId' ? : string,
                'structuralVariantFilter': StructuralVariantFilter,
                $queryParameters ? : any,
                $domain ? : string
        }): Promise < Array < StructuralVariant >
        > {
            return this.fetchStructuralVariantsUsingPOSTWithHttpInfo(parameters).then(function(response: request.Response) {
                return response.body;
            });
        };
    getAllStudiesUsingGETURL(parameters: {
        'direction' ? : "ASC" | "DESC",
        'keyword' ? : string,
        'pageNumber' ? : number,
        'pageSize' ? : number,
        'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
        'sortBy' ? : "studyId" | "cancerTypeId" | "name" | "shortName" | "description" | "publicStudy" | "pmid" | "citation" | "groups" | "status" | "importDate",
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/studies';
        if (parameters['direction'] !== undefined) {
            queryParameters['direction'] = parameters['direction'];
        }

        if (parameters['keyword'] !== undefined) {
            queryParameters['keyword'] = parameters['keyword'];
        }

        if (parameters['pageNumber'] !== undefined) {
            queryParameters['pageNumber'] = parameters['pageNumber'];
        }

        if (parameters['pageSize'] !== undefined) {
            queryParameters['pageSize'] = parameters['pageSize'];
        }

        if (parameters['projection'] !== undefined) {
            queryParameters['projection'] = parameters['projection'];
        }

        if (parameters['sortBy'] !== undefined) {
            queryParameters['sortBy'] = parameters['sortBy'];
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
     * @param {string} direction - Direction of the sort
     * @param {string} keyword - Search keyword that applies to name and cancer type of the studies
     * @param {integer} pageNumber - Page number of the result list
     * @param {integer} pageSize - Page size of the result list
     * @param {string} projection - Level of detail of the response
     * @param {string} sortBy - Name of the property that the result list is sorted by
     */
    getAllStudiesUsingGETWithHttpInfo(parameters: {
        'direction' ? : "ASC" | "DESC",
        'keyword' ? : string,
        'pageNumber' ? : number,
        'pageSize' ? : number,
        'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
        'sortBy' ? : "studyId" | "cancerTypeId" | "name" | "shortName" | "description" | "publicStudy" | "pmid" | "citation" | "groups" | "status" | "importDate",
        $queryParameters ? : any,
            $domain ? : string
    }): Promise < request.Response > {
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

            if (parameters['direction'] !== undefined) {
                queryParameters['direction'] = parameters['direction'];
            }

            if (parameters['keyword'] !== undefined) {
                queryParameters['keyword'] = parameters['keyword'];
            }

            if (parameters['pageNumber'] !== undefined) {
                queryParameters['pageNumber'] = parameters['pageNumber'];
            }

            if (parameters['pageSize'] !== undefined) {
                queryParameters['pageSize'] = parameters['pageSize'];
            }

            if (parameters['projection'] !== undefined) {
                queryParameters['projection'] = parameters['projection'];
            }

            if (parameters['sortBy'] !== undefined) {
                queryParameters['sortBy'] = parameters['sortBy'];
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
     * Get all studies
     * @method
     * @name CBioPortalAPI#getAllStudiesUsingGET
     * @param {string} direction - Direction of the sort
     * @param {string} keyword - Search keyword that applies to name and cancer type of the studies
     * @param {integer} pageNumber - Page number of the result list
     * @param {integer} pageSize - Page size of the result list
     * @param {string} projection - Level of detail of the response
     * @param {string} sortBy - Name of the property that the result list is sorted by
     */
    getAllStudiesUsingGET(parameters: {
            'direction' ? : "ASC" | "DESC",
            'keyword' ? : string,
            'pageNumber' ? : number,
            'pageSize' ? : number,
            'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
            'sortBy' ? : "studyId" | "cancerTypeId" | "name" | "shortName" | "description" | "publicStudy" | "pmid" | "citation" | "groups" | "status" | "importDate",
            $queryParameters ? : any,
                $domain ? : string
        }): Promise < Array < CancerStudy >
        > {
            return this.getAllStudiesUsingGETWithHttpInfo(parameters).then(function(response: request.Response) {
                return response.body;
            });
        };
    fetchStudiesUsingPOSTURL(parameters: {
        'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
        'studyIds': Array < string > ,
            $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/studies/fetch';
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
     * Fetch studies by IDs
     * @method
     * @name CBioPortalAPI#fetchStudiesUsingPOST
     * @param {string} projection - Level of detail of the response
     * @param {} studyIds - List of Study IDs
     */
    fetchStudiesUsingPOSTWithHttpInfo(parameters: {
        'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
        'studyIds': Array < string > ,
            $queryParameters ? : any,
            $domain ? : string
    }): Promise < request.Response > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        const errorHandlers = this.errorHandlers;
        const request = this.request;
        let path = '/studies/fetch';
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

            if (parameters['studyIds'] !== undefined) {
                body = parameters['studyIds'];
            }

            if (parameters['studyIds'] === undefined) {
                reject(new Error('Missing required  parameter: studyIds'));
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
     * Fetch studies by IDs
     * @method
     * @name CBioPortalAPI#fetchStudiesUsingPOST
     * @param {string} projection - Level of detail of the response
     * @param {} studyIds - List of Study IDs
     */
    fetchStudiesUsingPOST(parameters: {
            'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
            'studyIds': Array < string > ,
                $queryParameters ? : any,
                $domain ? : string
        }): Promise < Array < CancerStudy >
        > {
            return this.fetchStudiesUsingPOSTWithHttpInfo(parameters).then(function(response: request.Response) {
                return response.body;
            });
        };
    getTagsForMultipleStudiesUsingPOSTURL(parameters: {
        'studyIds': Array < string > ,
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/studies/tags/fetch';

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
     * Get the study tags by IDs
     * @method
     * @name CBioPortalAPI#getTagsForMultipleStudiesUsingPOST
     * @param {} studyIds - List of Study IDs
     */
    getTagsForMultipleStudiesUsingPOSTWithHttpInfo(parameters: {
        'studyIds': Array < string > ,
        $queryParameters ? : any,
        $domain ? : string
    }): Promise < request.Response > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        const errorHandlers = this.errorHandlers;
        const request = this.request;
        let path = '/studies/tags/fetch';
        let body: any;
        let queryParameters: any = {};
        let headers: any = {};
        let form: any = {};
        return new Promise(function(resolve, reject) {
            headers['Accept'] = 'application/json';
            headers['Content-Type'] = 'application/json';

            if (parameters['studyIds'] !== undefined) {
                body = parameters['studyIds'];
            }

            if (parameters['studyIds'] === undefined) {
                reject(new Error('Missing required  parameter: studyIds'));
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
     * Get the study tags by IDs
     * @method
     * @name CBioPortalAPI#getTagsForMultipleStudiesUsingPOST
     * @param {} studyIds - List of Study IDs
     */
    getTagsForMultipleStudiesUsingPOST(parameters: {
            'studyIds': Array < string > ,
            $queryParameters ? : any,
            $domain ? : string
        }): Promise < Array < CancerStudyTags >
        > {
            return this.getTagsForMultipleStudiesUsingPOSTWithHttpInfo(parameters).then(function(response: request.Response) {
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
    getStudyUsingGETWithHttpInfo(parameters: {
        'studyId': string,
        $queryParameters ? : any,
        $domain ? : string
    }): Promise < request.Response > {
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

        });
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
        return this.getStudyUsingGETWithHttpInfo(parameters).then(function(response: request.Response) {
            return response.body;
        });
    };
    getAllClinicalAttributesInStudyUsingGETURL(parameters: {
        'direction' ? : "ASC" | "DESC",
        'pageNumber' ? : number,
        'pageSize' ? : number,
        'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
        'sortBy' ? : "clinicalAttributeId" | "displayName" | "description" | "datatype" | "patientAttribute" | "priority" | "studyId",
        'studyId': string,
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/studies/{studyId}/clinical-attributes';
        if (parameters['direction'] !== undefined) {
            queryParameters['direction'] = parameters['direction'];
        }

        if (parameters['pageNumber'] !== undefined) {
            queryParameters['pageNumber'] = parameters['pageNumber'];
        }

        if (parameters['pageSize'] !== undefined) {
            queryParameters['pageSize'] = parameters['pageSize'];
        }

        if (parameters['projection'] !== undefined) {
            queryParameters['projection'] = parameters['projection'];
        }

        if (parameters['sortBy'] !== undefined) {
            queryParameters['sortBy'] = parameters['sortBy'];
        }

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
     * Get all clinical attributes in the specified study
     * @method
     * @name CBioPortalAPI#getAllClinicalAttributesInStudyUsingGET
     * @param {string} direction - Direction of the sort
     * @param {integer} pageNumber - Page number of the result list
     * @param {integer} pageSize - Page size of the result list
     * @param {string} projection - Level of detail of the response
     * @param {string} sortBy - Name of the property that the result list is sorted by
     * @param {string} studyId - Study ID e.g. acc_tcga
     */
    getAllClinicalAttributesInStudyUsingGETWithHttpInfo(parameters: {
        'direction' ? : "ASC" | "DESC",
        'pageNumber' ? : number,
        'pageSize' ? : number,
        'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
        'sortBy' ? : "clinicalAttributeId" | "displayName" | "description" | "datatype" | "patientAttribute" | "priority" | "studyId",
        'studyId': string,
        $queryParameters ? : any,
            $domain ? : string
    }): Promise < request.Response > {
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

            if (parameters['direction'] !== undefined) {
                queryParameters['direction'] = parameters['direction'];
            }

            if (parameters['pageNumber'] !== undefined) {
                queryParameters['pageNumber'] = parameters['pageNumber'];
            }

            if (parameters['pageSize'] !== undefined) {
                queryParameters['pageSize'] = parameters['pageSize'];
            }

            if (parameters['projection'] !== undefined) {
                queryParameters['projection'] = parameters['projection'];
            }

            if (parameters['sortBy'] !== undefined) {
                queryParameters['sortBy'] = parameters['sortBy'];
            }

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

        });
    };

    /**
     * Get all clinical attributes in the specified study
     * @method
     * @name CBioPortalAPI#getAllClinicalAttributesInStudyUsingGET
     * @param {string} direction - Direction of the sort
     * @param {integer} pageNumber - Page number of the result list
     * @param {integer} pageSize - Page size of the result list
     * @param {string} projection - Level of detail of the response
     * @param {string} sortBy - Name of the property that the result list is sorted by
     * @param {string} studyId - Study ID e.g. acc_tcga
     */
    getAllClinicalAttributesInStudyUsingGET(parameters: {
            'direction' ? : "ASC" | "DESC",
            'pageNumber' ? : number,
            'pageSize' ? : number,
            'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
            'sortBy' ? : "clinicalAttributeId" | "displayName" | "description" | "datatype" | "patientAttribute" | "priority" | "studyId",
            'studyId': string,
            $queryParameters ? : any,
                $domain ? : string
        }): Promise < Array < ClinicalAttribute >
        > {
            return this.getAllClinicalAttributesInStudyUsingGETWithHttpInfo(parameters).then(function(response: request.Response) {
                return response.body;
            });
        };
    getClinicalAttributeInStudyUsingGETURL(parameters: {
        'clinicalAttributeId': string,
        'studyId': string,
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/studies/{studyId}/clinical-attributes/{clinicalAttributeId}';

        path = path.replace('{clinicalAttributeId}', parameters['clinicalAttributeId'] + '');

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
     * Get specified clinical attribute
     * @method
     * @name CBioPortalAPI#getClinicalAttributeInStudyUsingGET
     * @param {string} clinicalAttributeId - Clinical Attribute ID e.g. CANCER_TYPE
     * @param {string} studyId - Study ID e.g. acc_tcga
     */
    getClinicalAttributeInStudyUsingGETWithHttpInfo(parameters: {
        'clinicalAttributeId': string,
        'studyId': string,
        $queryParameters ? : any,
        $domain ? : string
    }): Promise < request.Response > {
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

            path = path.replace('{clinicalAttributeId}', parameters['clinicalAttributeId'] + '');

            if (parameters['clinicalAttributeId'] === undefined) {
                reject(new Error('Missing required  parameter: clinicalAttributeId'));
                return;
            }

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

        });
    };

    /**
     * Get specified clinical attribute
     * @method
     * @name CBioPortalAPI#getClinicalAttributeInStudyUsingGET
     * @param {string} clinicalAttributeId - Clinical Attribute ID e.g. CANCER_TYPE
     * @param {string} studyId - Study ID e.g. acc_tcga
     */
    getClinicalAttributeInStudyUsingGET(parameters: {
        'clinicalAttributeId': string,
        'studyId': string,
        $queryParameters ? : any,
        $domain ? : string
    }): Promise < ClinicalAttribute > {
        return this.getClinicalAttributeInStudyUsingGETWithHttpInfo(parameters).then(function(response: request.Response) {
            return response.body;
        });
    };
    getAllClinicalDataInStudyUsingGETURL(parameters: {
        'attributeId' ? : string,
        'clinicalDataType' ? : "SAMPLE" | "PATIENT",
        'direction' ? : "ASC" | "DESC",
        'pageNumber' ? : number,
        'pageSize' ? : number,
        'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
        'sortBy' ? : "clinicalAttributeId" | "value",
        'studyId': string,
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/studies/{studyId}/clinical-data';
        if (parameters['attributeId'] !== undefined) {
            queryParameters['attributeId'] = parameters['attributeId'];
        }

        if (parameters['clinicalDataType'] !== undefined) {
            queryParameters['clinicalDataType'] = parameters['clinicalDataType'];
        }

        if (parameters['direction'] !== undefined) {
            queryParameters['direction'] = parameters['direction'];
        }

        if (parameters['pageNumber'] !== undefined) {
            queryParameters['pageNumber'] = parameters['pageNumber'];
        }

        if (parameters['pageSize'] !== undefined) {
            queryParameters['pageSize'] = parameters['pageSize'];
        }

        if (parameters['projection'] !== undefined) {
            queryParameters['projection'] = parameters['projection'];
        }

        if (parameters['sortBy'] !== undefined) {
            queryParameters['sortBy'] = parameters['sortBy'];
        }

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
     * Get all clinical data in a study
     * @method
     * @name CBioPortalAPI#getAllClinicalDataInStudyUsingGET
     * @param {string} attributeId - Attribute ID e.g. CANCER_TYPE
     * @param {string} clinicalDataType - Type of the clinical data
     * @param {string} direction - Direction of the sort
     * @param {integer} pageNumber - Page number of the result list
     * @param {integer} pageSize - Page size of the result list
     * @param {string} projection - Level of detail of the response
     * @param {string} sortBy - Name of the property that the result list is sorted by
     * @param {string} studyId - Study ID e.g. acc_tcga
     */
    getAllClinicalDataInStudyUsingGETWithHttpInfo(parameters: {
        'attributeId' ? : string,
        'clinicalDataType' ? : "SAMPLE" | "PATIENT",
        'direction' ? : "ASC" | "DESC",
        'pageNumber' ? : number,
        'pageSize' ? : number,
        'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
        'sortBy' ? : "clinicalAttributeId" | "value",
        'studyId': string,
        $queryParameters ? : any,
            $domain ? : string
    }): Promise < request.Response > {
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

            if (parameters['attributeId'] !== undefined) {
                queryParameters['attributeId'] = parameters['attributeId'];
            }

            if (parameters['clinicalDataType'] !== undefined) {
                queryParameters['clinicalDataType'] = parameters['clinicalDataType'];
            }

            if (parameters['direction'] !== undefined) {
                queryParameters['direction'] = parameters['direction'];
            }

            if (parameters['pageNumber'] !== undefined) {
                queryParameters['pageNumber'] = parameters['pageNumber'];
            }

            if (parameters['pageSize'] !== undefined) {
                queryParameters['pageSize'] = parameters['pageSize'];
            }

            if (parameters['projection'] !== undefined) {
                queryParameters['projection'] = parameters['projection'];
            }

            if (parameters['sortBy'] !== undefined) {
                queryParameters['sortBy'] = parameters['sortBy'];
            }

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

        });
    };

    /**
     * Get all clinical data in a study
     * @method
     * @name CBioPortalAPI#getAllClinicalDataInStudyUsingGET
     * @param {string} attributeId - Attribute ID e.g. CANCER_TYPE
     * @param {string} clinicalDataType - Type of the clinical data
     * @param {string} direction - Direction of the sort
     * @param {integer} pageNumber - Page number of the result list
     * @param {integer} pageSize - Page size of the result list
     * @param {string} projection - Level of detail of the response
     * @param {string} sortBy - Name of the property that the result list is sorted by
     * @param {string} studyId - Study ID e.g. acc_tcga
     */
    getAllClinicalDataInStudyUsingGET(parameters: {
            'attributeId' ? : string,
            'clinicalDataType' ? : "SAMPLE" | "PATIENT",
            'direction' ? : "ASC" | "DESC",
            'pageNumber' ? : number,
            'pageSize' ? : number,
            'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
            'sortBy' ? : "clinicalAttributeId" | "value",
            'studyId': string,
            $queryParameters ? : any,
                $domain ? : string
        }): Promise < Array < ClinicalData >
        > {
            return this.getAllClinicalDataInStudyUsingGETWithHttpInfo(parameters).then(function(response: request.Response) {
                return response.body;
            });
        };
    fetchAllClinicalDataInStudyUsingPOSTURL(parameters: {
        'clinicalDataSingleStudyFilter': ClinicalDataSingleStudyFilter,
        'clinicalDataType' ? : "SAMPLE" | "PATIENT",
        'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
        'studyId': string,
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/studies/{studyId}/clinical-data/fetch';

        if (parameters['clinicalDataType'] !== undefined) {
            queryParameters['clinicalDataType'] = parameters['clinicalDataType'];
        }

        if (parameters['projection'] !== undefined) {
            queryParameters['projection'] = parameters['projection'];
        }

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
     * Fetch clinical data by patient IDs or sample IDs (specific study)
     * @method
     * @name CBioPortalAPI#fetchAllClinicalDataInStudyUsingPOST
     * @param {} clinicalDataSingleStudyFilter - List of patient or sample IDs and attribute IDs
     * @param {string} clinicalDataType - Type of the clinical data
     * @param {string} projection - Level of detail of the response
     * @param {string} studyId - Study ID e.g. acc_tcga
     */
    fetchAllClinicalDataInStudyUsingPOSTWithHttpInfo(parameters: {
        'clinicalDataSingleStudyFilter': ClinicalDataSingleStudyFilter,
        'clinicalDataType' ? : "SAMPLE" | "PATIENT",
        'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
        'studyId': string,
        $queryParameters ? : any,
        $domain ? : string
    }): Promise < request.Response > {
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

            if (parameters['clinicalDataSingleStudyFilter'] !== undefined) {
                body = parameters['clinicalDataSingleStudyFilter'];
            }

            if (parameters['clinicalDataSingleStudyFilter'] === undefined) {
                reject(new Error('Missing required  parameter: clinicalDataSingleStudyFilter'));
                return;
            }

            if (parameters['clinicalDataType'] !== undefined) {
                queryParameters['clinicalDataType'] = parameters['clinicalDataType'];
            }

            if (parameters['projection'] !== undefined) {
                queryParameters['projection'] = parameters['projection'];
            }

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

            request('POST', domain + path, body, headers, queryParameters, form, reject, resolve, errorHandlers);

        });
    };

    /**
     * Fetch clinical data by patient IDs or sample IDs (specific study)
     * @method
     * @name CBioPortalAPI#fetchAllClinicalDataInStudyUsingPOST
     * @param {} clinicalDataSingleStudyFilter - List of patient or sample IDs and attribute IDs
     * @param {string} clinicalDataType - Type of the clinical data
     * @param {string} projection - Level of detail of the response
     * @param {string} studyId - Study ID e.g. acc_tcga
     */
    fetchAllClinicalDataInStudyUsingPOST(parameters: {
            'clinicalDataSingleStudyFilter': ClinicalDataSingleStudyFilter,
            'clinicalDataType' ? : "SAMPLE" | "PATIENT",
            'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
            'studyId': string,
            $queryParameters ? : any,
            $domain ? : string
        }): Promise < Array < ClinicalData >
        > {
            return this.fetchAllClinicalDataInStudyUsingPOSTWithHttpInfo(parameters).then(function(response: request.Response) {
                return response.body;
            });
        };
    getAllClinicalEventsInStudyUsingGETURL(parameters: {
        'direction' ? : "ASC" | "DESC",
        'pageNumber' ? : number,
        'pageSize' ? : number,
        'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
        'sortBy' ? : "eventType" | "startNumberOfDaysSinceDiagnosis" | "endNumberOfDaysSinceDiagnosis",
        'studyId': string,
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/studies/{studyId}/clinical-events';
        if (parameters['direction'] !== undefined) {
            queryParameters['direction'] = parameters['direction'];
        }

        if (parameters['pageNumber'] !== undefined) {
            queryParameters['pageNumber'] = parameters['pageNumber'];
        }

        if (parameters['pageSize'] !== undefined) {
            queryParameters['pageSize'] = parameters['pageSize'];
        }

        if (parameters['projection'] !== undefined) {
            queryParameters['projection'] = parameters['projection'];
        }

        if (parameters['sortBy'] !== undefined) {
            queryParameters['sortBy'] = parameters['sortBy'];
        }

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
     * Get all clinical events in a study
     * @method
     * @name CBioPortalAPI#getAllClinicalEventsInStudyUsingGET
     * @param {string} direction - Direction of the sort
     * @param {integer} pageNumber - Page number of the result list
     * @param {integer} pageSize - Page size of the result list
     * @param {string} projection - Level of detail of the response
     * @param {string} sortBy - Name of the property that the result list is sorted by
     * @param {string} studyId - Study ID e.g. lgg_ucsf_2014
     */
    getAllClinicalEventsInStudyUsingGETWithHttpInfo(parameters: {
        'direction' ? : "ASC" | "DESC",
        'pageNumber' ? : number,
        'pageSize' ? : number,
        'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
        'sortBy' ? : "eventType" | "startNumberOfDaysSinceDiagnosis" | "endNumberOfDaysSinceDiagnosis",
        'studyId': string,
        $queryParameters ? : any,
            $domain ? : string
    }): Promise < request.Response > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        const errorHandlers = this.errorHandlers;
        const request = this.request;
        let path = '/studies/{studyId}/clinical-events';
        let body: any;
        let queryParameters: any = {};
        let headers: any = {};
        let form: any = {};
        return new Promise(function(resolve, reject) {
            headers['Accept'] = 'application/json';

            if (parameters['direction'] !== undefined) {
                queryParameters['direction'] = parameters['direction'];
            }

            if (parameters['pageNumber'] !== undefined) {
                queryParameters['pageNumber'] = parameters['pageNumber'];
            }

            if (parameters['pageSize'] !== undefined) {
                queryParameters['pageSize'] = parameters['pageSize'];
            }

            if (parameters['projection'] !== undefined) {
                queryParameters['projection'] = parameters['projection'];
            }

            if (parameters['sortBy'] !== undefined) {
                queryParameters['sortBy'] = parameters['sortBy'];
            }

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

        });
    };

    /**
     * Get all clinical events in a study
     * @method
     * @name CBioPortalAPI#getAllClinicalEventsInStudyUsingGET
     * @param {string} direction - Direction of the sort
     * @param {integer} pageNumber - Page number of the result list
     * @param {integer} pageSize - Page size of the result list
     * @param {string} projection - Level of detail of the response
     * @param {string} sortBy - Name of the property that the result list is sorted by
     * @param {string} studyId - Study ID e.g. lgg_ucsf_2014
     */
    getAllClinicalEventsInStudyUsingGET(parameters: {
            'direction' ? : "ASC" | "DESC",
            'pageNumber' ? : number,
            'pageSize' ? : number,
            'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
            'sortBy' ? : "eventType" | "startNumberOfDaysSinceDiagnosis" | "endNumberOfDaysSinceDiagnosis",
            'studyId': string,
            $queryParameters ? : any,
                $domain ? : string
        }): Promise < Array < ClinicalEvent >
        > {
            return this.getAllClinicalEventsInStudyUsingGETWithHttpInfo(parameters).then(function(response: request.Response) {
                return response.body;
            });
        };
    getAllMolecularProfilesInStudyUsingGETURL(parameters: {
        'direction' ? : "ASC" | "DESC",
        'pageNumber' ? : number,
        'pageSize' ? : number,
        'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
        'sortBy' ? : "molecularProfileId" | "molecularAlterationType" | "datatype" | "name" | "description" | "showProfileInAnalysisTab",
        'studyId': string,
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/studies/{studyId}/molecular-profiles';
        if (parameters['direction'] !== undefined) {
            queryParameters['direction'] = parameters['direction'];
        }

        if (parameters['pageNumber'] !== undefined) {
            queryParameters['pageNumber'] = parameters['pageNumber'];
        }

        if (parameters['pageSize'] !== undefined) {
            queryParameters['pageSize'] = parameters['pageSize'];
        }

        if (parameters['projection'] !== undefined) {
            queryParameters['projection'] = parameters['projection'];
        }

        if (parameters['sortBy'] !== undefined) {
            queryParameters['sortBy'] = parameters['sortBy'];
        }

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
     * Get all molecular profiles in a study
     * @method
     * @name CBioPortalAPI#getAllMolecularProfilesInStudyUsingGET
     * @param {string} direction - Direction of the sort
     * @param {integer} pageNumber - Page number of the result list
     * @param {integer} pageSize - Page size of the result list
     * @param {string} projection - Level of detail of the response
     * @param {string} sortBy - Name of the property that the result list is sorted by
     * @param {string} studyId - Study ID e.g. acc_tcga
     */
    getAllMolecularProfilesInStudyUsingGETWithHttpInfo(parameters: {
        'direction' ? : "ASC" | "DESC",
        'pageNumber' ? : number,
        'pageSize' ? : number,
        'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
        'sortBy' ? : "molecularProfileId" | "molecularAlterationType" | "datatype" | "name" | "description" | "showProfileInAnalysisTab",
        'studyId': string,
        $queryParameters ? : any,
            $domain ? : string
    }): Promise < request.Response > {
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

            if (parameters['direction'] !== undefined) {
                queryParameters['direction'] = parameters['direction'];
            }

            if (parameters['pageNumber'] !== undefined) {
                queryParameters['pageNumber'] = parameters['pageNumber'];
            }

            if (parameters['pageSize'] !== undefined) {
                queryParameters['pageSize'] = parameters['pageSize'];
            }

            if (parameters['projection'] !== undefined) {
                queryParameters['projection'] = parameters['projection'];
            }

            if (parameters['sortBy'] !== undefined) {
                queryParameters['sortBy'] = parameters['sortBy'];
            }

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

        });
    };

    /**
     * Get all molecular profiles in a study
     * @method
     * @name CBioPortalAPI#getAllMolecularProfilesInStudyUsingGET
     * @param {string} direction - Direction of the sort
     * @param {integer} pageNumber - Page number of the result list
     * @param {integer} pageSize - Page size of the result list
     * @param {string} projection - Level of detail of the response
     * @param {string} sortBy - Name of the property that the result list is sorted by
     * @param {string} studyId - Study ID e.g. acc_tcga
     */
    getAllMolecularProfilesInStudyUsingGET(parameters: {
            'direction' ? : "ASC" | "DESC",
            'pageNumber' ? : number,
            'pageSize' ? : number,
            'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
            'sortBy' ? : "molecularProfileId" | "molecularAlterationType" | "datatype" | "name" | "description" | "showProfileInAnalysisTab",
            'studyId': string,
            $queryParameters ? : any,
                $domain ? : string
        }): Promise < Array < MolecularProfile >
        > {
            return this.getAllMolecularProfilesInStudyUsingGETWithHttpInfo(parameters).then(function(response: request.Response) {
                return response.body;
            });
        };
    getAllPatientsInStudyUsingGETURL(parameters: {
        'direction' ? : "ASC" | "DESC",
        'pageNumber' ? : number,
        'pageSize' ? : number,
        'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
        'studyId': string,
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/studies/{studyId}/patients';
        if (parameters['direction'] !== undefined) {
            queryParameters['direction'] = parameters['direction'];
        }

        if (parameters['pageNumber'] !== undefined) {
            queryParameters['pageNumber'] = parameters['pageNumber'];
        }

        if (parameters['pageSize'] !== undefined) {
            queryParameters['pageSize'] = parameters['pageSize'];
        }

        if (parameters['projection'] !== undefined) {
            queryParameters['projection'] = parameters['projection'];
        }

        queryParameters['sortBy'] = 'patientId';

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
    * Get all patients in a study
    * @method
    * @name CBioPortalAPI#getAllPatientsInStudyUsingGET
         * @param {string} direction - Direction of the sort
         * @param {integer} pageNumber - Page number of the result list
         * @param {integer} pageSize - Page size of the result list
         * @param {string} projection - Level of detail of the response
        
         * @param {string} studyId - Study ID e.g. acc_tcga
    */
    getAllPatientsInStudyUsingGETWithHttpInfo(parameters: {
        'direction' ? : "ASC" | "DESC",
        'pageNumber' ? : number,
        'pageSize' ? : number,
        'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
        'studyId': string,
        $queryParameters ? : any,
            $domain ? : string
    }): Promise < request.Response > {
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

            if (parameters['direction'] !== undefined) {
                queryParameters['direction'] = parameters['direction'];
            }

            if (parameters['pageNumber'] !== undefined) {
                queryParameters['pageNumber'] = parameters['pageNumber'];
            }

            if (parameters['pageSize'] !== undefined) {
                queryParameters['pageSize'] = parameters['pageSize'];
            }

            if (parameters['projection'] !== undefined) {
                queryParameters['projection'] = parameters['projection'];
            }

            queryParameters['sortBy'] = 'patientId';

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

        });
    };

    /**
    * Get all patients in a study
    * @method
    * @name CBioPortalAPI#getAllPatientsInStudyUsingGET
         * @param {string} direction - Direction of the sort
         * @param {integer} pageNumber - Page number of the result list
         * @param {integer} pageSize - Page size of the result list
         * @param {string} projection - Level of detail of the response
        
         * @param {string} studyId - Study ID e.g. acc_tcga
    */
    getAllPatientsInStudyUsingGET(parameters: {
            'direction' ? : "ASC" | "DESC",
            'pageNumber' ? : number,
            'pageSize' ? : number,
            'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
            'studyId': string,
            $queryParameters ? : any,
                $domain ? : string
        }): Promise < Array < Patient >
        > {
            return this.getAllPatientsInStudyUsingGETWithHttpInfo(parameters).then(function(response: request.Response) {
                return response.body;
            });
        };
    getPatientInStudyUsingGETURL(parameters: {
        'patientId': string,
        'studyId': string,
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/studies/{studyId}/patients/{patientId}';

        path = path.replace('{patientId}', parameters['patientId'] + '');

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
     * Get a patient in a study
     * @method
     * @name CBioPortalAPI#getPatientInStudyUsingGET
     * @param {string} patientId - Patient ID e.g. TCGA-OR-A5J2
     * @param {string} studyId - Study ID e.g. acc_tcga
     */
    getPatientInStudyUsingGETWithHttpInfo(parameters: {
        'patientId': string,
        'studyId': string,
        $queryParameters ? : any,
        $domain ? : string
    }): Promise < request.Response > {
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

            path = path.replace('{patientId}', parameters['patientId'] + '');

            if (parameters['patientId'] === undefined) {
                reject(new Error('Missing required  parameter: patientId'));
                return;
            }

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

        });
    };

    /**
     * Get a patient in a study
     * @method
     * @name CBioPortalAPI#getPatientInStudyUsingGET
     * @param {string} patientId - Patient ID e.g. TCGA-OR-A5J2
     * @param {string} studyId - Study ID e.g. acc_tcga
     */
    getPatientInStudyUsingGET(parameters: {
        'patientId': string,
        'studyId': string,
        $queryParameters ? : any,
        $domain ? : string
    }): Promise < Patient > {
        return this.getPatientInStudyUsingGETWithHttpInfo(parameters).then(function(response: request.Response) {
            return response.body;
        });
    };
    getAllClinicalDataOfPatientInStudyUsingGETURL(parameters: {
        'attributeId' ? : string,
        'direction' ? : "ASC" | "DESC",
        'pageNumber' ? : number,
        'pageSize' ? : number,
        'patientId': string,
        'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
        'sortBy' ? : "clinicalAttributeId" | "value",
        'studyId': string,
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/studies/{studyId}/patients/{patientId}/clinical-data';
        if (parameters['attributeId'] !== undefined) {
            queryParameters['attributeId'] = parameters['attributeId'];
        }

        if (parameters['direction'] !== undefined) {
            queryParameters['direction'] = parameters['direction'];
        }

        if (parameters['pageNumber'] !== undefined) {
            queryParameters['pageNumber'] = parameters['pageNumber'];
        }

        if (parameters['pageSize'] !== undefined) {
            queryParameters['pageSize'] = parameters['pageSize'];
        }

        path = path.replace('{patientId}', parameters['patientId'] + '');
        if (parameters['projection'] !== undefined) {
            queryParameters['projection'] = parameters['projection'];
        }

        if (parameters['sortBy'] !== undefined) {
            queryParameters['sortBy'] = parameters['sortBy'];
        }

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
     * Get all clinical data of a patient in a study
     * @method
     * @name CBioPortalAPI#getAllClinicalDataOfPatientInStudyUsingGET
     * @param {string} attributeId - Attribute ID e.g. AGE
     * @param {string} direction - Direction of the sort
     * @param {integer} pageNumber - Page number of the result list
     * @param {integer} pageSize - Page size of the result list
     * @param {string} patientId - Patient ID e.g. TCGA-OR-A5J2
     * @param {string} projection - Level of detail of the response
     * @param {string} sortBy - Name of the property that the result list is sorted by
     * @param {string} studyId - Study ID e.g. acc_tcga
     */
    getAllClinicalDataOfPatientInStudyUsingGETWithHttpInfo(parameters: {
        'attributeId' ? : string,
        'direction' ? : "ASC" | "DESC",
        'pageNumber' ? : number,
        'pageSize' ? : number,
        'patientId': string,
        'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
        'sortBy' ? : "clinicalAttributeId" | "value",
        'studyId': string,
        $queryParameters ? : any,
            $domain ? : string
    }): Promise < request.Response > {
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

            if (parameters['attributeId'] !== undefined) {
                queryParameters['attributeId'] = parameters['attributeId'];
            }

            if (parameters['direction'] !== undefined) {
                queryParameters['direction'] = parameters['direction'];
            }

            if (parameters['pageNumber'] !== undefined) {
                queryParameters['pageNumber'] = parameters['pageNumber'];
            }

            if (parameters['pageSize'] !== undefined) {
                queryParameters['pageSize'] = parameters['pageSize'];
            }

            path = path.replace('{patientId}', parameters['patientId'] + '');

            if (parameters['patientId'] === undefined) {
                reject(new Error('Missing required  parameter: patientId'));
                return;
            }

            if (parameters['projection'] !== undefined) {
                queryParameters['projection'] = parameters['projection'];
            }

            if (parameters['sortBy'] !== undefined) {
                queryParameters['sortBy'] = parameters['sortBy'];
            }

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

        });
    };

    /**
     * Get all clinical data of a patient in a study
     * @method
     * @name CBioPortalAPI#getAllClinicalDataOfPatientInStudyUsingGET
     * @param {string} attributeId - Attribute ID e.g. AGE
     * @param {string} direction - Direction of the sort
     * @param {integer} pageNumber - Page number of the result list
     * @param {integer} pageSize - Page size of the result list
     * @param {string} patientId - Patient ID e.g. TCGA-OR-A5J2
     * @param {string} projection - Level of detail of the response
     * @param {string} sortBy - Name of the property that the result list is sorted by
     * @param {string} studyId - Study ID e.g. acc_tcga
     */
    getAllClinicalDataOfPatientInStudyUsingGET(parameters: {
            'attributeId' ? : string,
            'direction' ? : "ASC" | "DESC",
            'pageNumber' ? : number,
            'pageSize' ? : number,
            'patientId': string,
            'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
            'sortBy' ? : "clinicalAttributeId" | "value",
            'studyId': string,
            $queryParameters ? : any,
                $domain ? : string
        }): Promise < Array < ClinicalData >
        > {
            return this.getAllClinicalDataOfPatientInStudyUsingGETWithHttpInfo(parameters).then(function(response: request.Response) {
                return response.body;
            });
        };
    getAllClinicalEventsOfPatientInStudyUsingGETURL(parameters: {
        'direction' ? : "ASC" | "DESC",
        'pageNumber' ? : number,
        'pageSize' ? : number,
        'patientId': string,
        'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
        'sortBy' ? : "eventType" | "startNumberOfDaysSinceDiagnosis" | "endNumberOfDaysSinceDiagnosis",
        'studyId': string,
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/studies/{studyId}/patients/{patientId}/clinical-events';
        if (parameters['direction'] !== undefined) {
            queryParameters['direction'] = parameters['direction'];
        }

        if (parameters['pageNumber'] !== undefined) {
            queryParameters['pageNumber'] = parameters['pageNumber'];
        }

        if (parameters['pageSize'] !== undefined) {
            queryParameters['pageSize'] = parameters['pageSize'];
        }

        path = path.replace('{patientId}', parameters['patientId'] + '');
        if (parameters['projection'] !== undefined) {
            queryParameters['projection'] = parameters['projection'];
        }

        if (parameters['sortBy'] !== undefined) {
            queryParameters['sortBy'] = parameters['sortBy'];
        }

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
     * Get all clinical events of a patient in a study
     * @method
     * @name CBioPortalAPI#getAllClinicalEventsOfPatientInStudyUsingGET
     * @param {string} direction - Direction of the sort
     * @param {integer} pageNumber - Page number of the result list
     * @param {integer} pageSize - Page size of the result list
     * @param {string} patientId - Patient ID e.g. P01
     * @param {string} projection - Level of detail of the response
     * @param {string} sortBy - Name of the property that the result list is sorted by
     * @param {string} studyId - Study ID e.g. lgg_ucsf_2014
     */
    getAllClinicalEventsOfPatientInStudyUsingGETWithHttpInfo(parameters: {
        'direction' ? : "ASC" | "DESC",
        'pageNumber' ? : number,
        'pageSize' ? : number,
        'patientId': string,
        'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
        'sortBy' ? : "eventType" | "startNumberOfDaysSinceDiagnosis" | "endNumberOfDaysSinceDiagnosis",
        'studyId': string,
        $queryParameters ? : any,
            $domain ? : string
    }): Promise < request.Response > {
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

            if (parameters['direction'] !== undefined) {
                queryParameters['direction'] = parameters['direction'];
            }

            if (parameters['pageNumber'] !== undefined) {
                queryParameters['pageNumber'] = parameters['pageNumber'];
            }

            if (parameters['pageSize'] !== undefined) {
                queryParameters['pageSize'] = parameters['pageSize'];
            }

            path = path.replace('{patientId}', parameters['patientId'] + '');

            if (parameters['patientId'] === undefined) {
                reject(new Error('Missing required  parameter: patientId'));
                return;
            }

            if (parameters['projection'] !== undefined) {
                queryParameters['projection'] = parameters['projection'];
            }

            if (parameters['sortBy'] !== undefined) {
                queryParameters['sortBy'] = parameters['sortBy'];
            }

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

        });
    };

    /**
     * Get all clinical events of a patient in a study
     * @method
     * @name CBioPortalAPI#getAllClinicalEventsOfPatientInStudyUsingGET
     * @param {string} direction - Direction of the sort
     * @param {integer} pageNumber - Page number of the result list
     * @param {integer} pageSize - Page size of the result list
     * @param {string} patientId - Patient ID e.g. P01
     * @param {string} projection - Level of detail of the response
     * @param {string} sortBy - Name of the property that the result list is sorted by
     * @param {string} studyId - Study ID e.g. lgg_ucsf_2014
     */
    getAllClinicalEventsOfPatientInStudyUsingGET(parameters: {
            'direction' ? : "ASC" | "DESC",
            'pageNumber' ? : number,
            'pageSize' ? : number,
            'patientId': string,
            'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
            'sortBy' ? : "eventType" | "startNumberOfDaysSinceDiagnosis" | "endNumberOfDaysSinceDiagnosis",
            'studyId': string,
            $queryParameters ? : any,
                $domain ? : string
        }): Promise < Array < ClinicalEvent >
        > {
            return this.getAllClinicalEventsOfPatientInStudyUsingGETWithHttpInfo(parameters).then(function(response: request.Response) {
                return response.body;
            });
        };
    getAllResourceDataOfPatientInStudyUsingGETURL(parameters: {
        'direction' ? : "ASC" | "DESC",
        'pageNumber' ? : number,
        'pageSize' ? : number,
        'patientId': string,
        'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
        'resourceId' ? : string,
        'sortBy' ? : "ResourceId" | "url",
        'studyId': string,
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/studies/{studyId}/patients/{patientId}/resource-data';
        if (parameters['direction'] !== undefined) {
            queryParameters['direction'] = parameters['direction'];
        }

        if (parameters['pageNumber'] !== undefined) {
            queryParameters['pageNumber'] = parameters['pageNumber'];
        }

        if (parameters['pageSize'] !== undefined) {
            queryParameters['pageSize'] = parameters['pageSize'];
        }

        path = path.replace('{patientId}', parameters['patientId'] + '');
        if (parameters['projection'] !== undefined) {
            queryParameters['projection'] = parameters['projection'];
        }

        if (parameters['resourceId'] !== undefined) {
            queryParameters['resourceId'] = parameters['resourceId'];
        }

        if (parameters['sortBy'] !== undefined) {
            queryParameters['sortBy'] = parameters['sortBy'];
        }

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
     * Get all resource data of a patient in a study
     * @method
     * @name CBioPortalAPI#getAllResourceDataOfPatientInStudyUsingGET
     * @param {string} direction - Direction of the sort
     * @param {integer} pageNumber - Page number of the result list
     * @param {integer} pageSize - Page size of the result list
     * @param {string} patientId - Patient ID e.g. TCGA-OR-A5J2
     * @param {string} projection - Level of detail of the response
     * @param {string} resourceId - Resource ID
     * @param {string} sortBy - Name of the property that the result list is sorted by
     * @param {string} studyId - Study ID e.g. acc_tcga
     */
    getAllResourceDataOfPatientInStudyUsingGETWithHttpInfo(parameters: {
        'direction' ? : "ASC" | "DESC",
        'pageNumber' ? : number,
        'pageSize' ? : number,
        'patientId': string,
        'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
        'resourceId' ? : string,
        'sortBy' ? : "ResourceId" | "url",
        'studyId': string,
        $queryParameters ? : any,
            $domain ? : string
    }): Promise < request.Response > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        const errorHandlers = this.errorHandlers;
        const request = this.request;
        let path = '/studies/{studyId}/patients/{patientId}/resource-data';
        let body: any;
        let queryParameters: any = {};
        let headers: any = {};
        let form: any = {};
        return new Promise(function(resolve, reject) {
            headers['Accept'] = 'application/json';

            if (parameters['direction'] !== undefined) {
                queryParameters['direction'] = parameters['direction'];
            }

            if (parameters['pageNumber'] !== undefined) {
                queryParameters['pageNumber'] = parameters['pageNumber'];
            }

            if (parameters['pageSize'] !== undefined) {
                queryParameters['pageSize'] = parameters['pageSize'];
            }

            path = path.replace('{patientId}', parameters['patientId'] + '');

            if (parameters['patientId'] === undefined) {
                reject(new Error('Missing required  parameter: patientId'));
                return;
            }

            if (parameters['projection'] !== undefined) {
                queryParameters['projection'] = parameters['projection'];
            }

            if (parameters['resourceId'] !== undefined) {
                queryParameters['resourceId'] = parameters['resourceId'];
            }

            if (parameters['sortBy'] !== undefined) {
                queryParameters['sortBy'] = parameters['sortBy'];
            }

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

        });
    };

    /**
     * Get all resource data of a patient in a study
     * @method
     * @name CBioPortalAPI#getAllResourceDataOfPatientInStudyUsingGET
     * @param {string} direction - Direction of the sort
     * @param {integer} pageNumber - Page number of the result list
     * @param {integer} pageSize - Page size of the result list
     * @param {string} patientId - Patient ID e.g. TCGA-OR-A5J2
     * @param {string} projection - Level of detail of the response
     * @param {string} resourceId - Resource ID
     * @param {string} sortBy - Name of the property that the result list is sorted by
     * @param {string} studyId - Study ID e.g. acc_tcga
     */
    getAllResourceDataOfPatientInStudyUsingGET(parameters: {
            'direction' ? : "ASC" | "DESC",
            'pageNumber' ? : number,
            'pageSize' ? : number,
            'patientId': string,
            'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
            'resourceId' ? : string,
            'sortBy' ? : "ResourceId" | "url",
            'studyId': string,
            $queryParameters ? : any,
                $domain ? : string
        }): Promise < Array < ResourceData >
        > {
            return this.getAllResourceDataOfPatientInStudyUsingGETWithHttpInfo(parameters).then(function(response: request.Response) {
                return response.body;
            });
        };
    getAllSamplesOfPatientInStudyUsingGETURL(parameters: {
        'direction' ? : "ASC" | "DESC",
        'pageNumber' ? : number,
        'pageSize' ? : number,
        'patientId': string,
        'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
        'sortBy' ? : "sampleId" | "sampleType",
        'studyId': string,
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/studies/{studyId}/patients/{patientId}/samples';
        if (parameters['direction'] !== undefined) {
            queryParameters['direction'] = parameters['direction'];
        }

        if (parameters['pageNumber'] !== undefined) {
            queryParameters['pageNumber'] = parameters['pageNumber'];
        }

        if (parameters['pageSize'] !== undefined) {
            queryParameters['pageSize'] = parameters['pageSize'];
        }

        path = path.replace('{patientId}', parameters['patientId'] + '');
        if (parameters['projection'] !== undefined) {
            queryParameters['projection'] = parameters['projection'];
        }

        if (parameters['sortBy'] !== undefined) {
            queryParameters['sortBy'] = parameters['sortBy'];
        }

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
     * Get all samples of a patient in a study
     * @method
     * @name CBioPortalAPI#getAllSamplesOfPatientInStudyUsingGET
     * @param {string} direction - Direction of the sort
     * @param {integer} pageNumber - Page number of the result list
     * @param {integer} pageSize - Page size of the result list
     * @param {string} patientId - Patient ID e.g. TCGA-OR-A5J2
     * @param {string} projection - Level of detail of the response
     * @param {string} sortBy - Name of the property that the result list is sorted by
     * @param {string} studyId - Study ID e.g. acc_tcga
     */
    getAllSamplesOfPatientInStudyUsingGETWithHttpInfo(parameters: {
        'direction' ? : "ASC" | "DESC",
        'pageNumber' ? : number,
        'pageSize' ? : number,
        'patientId': string,
        'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
        'sortBy' ? : "sampleId" | "sampleType",
        'studyId': string,
        $queryParameters ? : any,
            $domain ? : string
    }): Promise < request.Response > {
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

            if (parameters['direction'] !== undefined) {
                queryParameters['direction'] = parameters['direction'];
            }

            if (parameters['pageNumber'] !== undefined) {
                queryParameters['pageNumber'] = parameters['pageNumber'];
            }

            if (parameters['pageSize'] !== undefined) {
                queryParameters['pageSize'] = parameters['pageSize'];
            }

            path = path.replace('{patientId}', parameters['patientId'] + '');

            if (parameters['patientId'] === undefined) {
                reject(new Error('Missing required  parameter: patientId'));
                return;
            }

            if (parameters['projection'] !== undefined) {
                queryParameters['projection'] = parameters['projection'];
            }

            if (parameters['sortBy'] !== undefined) {
                queryParameters['sortBy'] = parameters['sortBy'];
            }

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

        });
    };

    /**
     * Get all samples of a patient in a study
     * @method
     * @name CBioPortalAPI#getAllSamplesOfPatientInStudyUsingGET
     * @param {string} direction - Direction of the sort
     * @param {integer} pageNumber - Page number of the result list
     * @param {integer} pageSize - Page size of the result list
     * @param {string} patientId - Patient ID e.g. TCGA-OR-A5J2
     * @param {string} projection - Level of detail of the response
     * @param {string} sortBy - Name of the property that the result list is sorted by
     * @param {string} studyId - Study ID e.g. acc_tcga
     */
    getAllSamplesOfPatientInStudyUsingGET(parameters: {
            'direction' ? : "ASC" | "DESC",
            'pageNumber' ? : number,
            'pageSize' ? : number,
            'patientId': string,
            'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
            'sortBy' ? : "sampleId" | "sampleType",
            'studyId': string,
            $queryParameters ? : any,
                $domain ? : string
        }): Promise < Array < Sample >
        > {
            return this.getAllSamplesOfPatientInStudyUsingGETWithHttpInfo(parameters).then(function(response: request.Response) {
                return response.body;
            });
        };
    getAllStudyResourceDataInStudyUsingGETURL(parameters: {
        'direction' ? : "ASC" | "DESC",
        'pageNumber' ? : number,
        'pageSize' ? : number,
        'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
        'resourceId' ? : string,
        'sortBy' ? : "ResourceId" | "url",
        'studyId': string,
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/studies/{studyId}/resource-data';
        if (parameters['direction'] !== undefined) {
            queryParameters['direction'] = parameters['direction'];
        }

        if (parameters['pageNumber'] !== undefined) {
            queryParameters['pageNumber'] = parameters['pageNumber'];
        }

        if (parameters['pageSize'] !== undefined) {
            queryParameters['pageSize'] = parameters['pageSize'];
        }

        if (parameters['projection'] !== undefined) {
            queryParameters['projection'] = parameters['projection'];
        }

        if (parameters['resourceId'] !== undefined) {
            queryParameters['resourceId'] = parameters['resourceId'];
        }

        if (parameters['sortBy'] !== undefined) {
            queryParameters['sortBy'] = parameters['sortBy'];
        }

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
     * Get all resource data for a study
     * @method
     * @name CBioPortalAPI#getAllStudyResourceDataInStudyUsingGET
     * @param {string} direction - Direction of the sort
     * @param {integer} pageNumber - Page number of the result list
     * @param {integer} pageSize - Page size of the result list
     * @param {string} projection - Level of detail of the response
     * @param {string} resourceId - Resource ID
     * @param {string} sortBy - Name of the property that the result list is sorted by
     * @param {string} studyId - Study ID e.g. acc_tcga
     */
    getAllStudyResourceDataInStudyUsingGETWithHttpInfo(parameters: {
        'direction' ? : "ASC" | "DESC",
        'pageNumber' ? : number,
        'pageSize' ? : number,
        'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
        'resourceId' ? : string,
        'sortBy' ? : "ResourceId" | "url",
        'studyId': string,
        $queryParameters ? : any,
            $domain ? : string
    }): Promise < request.Response > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        const errorHandlers = this.errorHandlers;
        const request = this.request;
        let path = '/studies/{studyId}/resource-data';
        let body: any;
        let queryParameters: any = {};
        let headers: any = {};
        let form: any = {};
        return new Promise(function(resolve, reject) {
            headers['Accept'] = 'application/json';

            if (parameters['direction'] !== undefined) {
                queryParameters['direction'] = parameters['direction'];
            }

            if (parameters['pageNumber'] !== undefined) {
                queryParameters['pageNumber'] = parameters['pageNumber'];
            }

            if (parameters['pageSize'] !== undefined) {
                queryParameters['pageSize'] = parameters['pageSize'];
            }

            if (parameters['projection'] !== undefined) {
                queryParameters['projection'] = parameters['projection'];
            }

            if (parameters['resourceId'] !== undefined) {
                queryParameters['resourceId'] = parameters['resourceId'];
            }

            if (parameters['sortBy'] !== undefined) {
                queryParameters['sortBy'] = parameters['sortBy'];
            }

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

        });
    };

    /**
     * Get all resource data for a study
     * @method
     * @name CBioPortalAPI#getAllStudyResourceDataInStudyUsingGET
     * @param {string} direction - Direction of the sort
     * @param {integer} pageNumber - Page number of the result list
     * @param {integer} pageSize - Page size of the result list
     * @param {string} projection - Level of detail of the response
     * @param {string} resourceId - Resource ID
     * @param {string} sortBy - Name of the property that the result list is sorted by
     * @param {string} studyId - Study ID e.g. acc_tcga
     */
    getAllStudyResourceDataInStudyUsingGET(parameters: {
            'direction' ? : "ASC" | "DESC",
            'pageNumber' ? : number,
            'pageSize' ? : number,
            'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
            'resourceId' ? : string,
            'sortBy' ? : "ResourceId" | "url",
            'studyId': string,
            $queryParameters ? : any,
                $domain ? : string
        }): Promise < Array < ResourceData >
        > {
            return this.getAllStudyResourceDataInStudyUsingGETWithHttpInfo(parameters).then(function(response: request.Response) {
                return response.body;
            });
        };
    getAllResourceDefinitionsInStudyUsingGETURL(parameters: {
        'direction' ? : "ASC" | "DESC",
        'pageNumber' ? : number,
        'pageSize' ? : number,
        'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
        'sortBy' ? : "resourceId" | "displayName" | "description" | "resourceType" | "priority" | "openByDefault" | "studyId",
        'studyId': string,
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/studies/{studyId}/resource-definitions';
        if (parameters['direction'] !== undefined) {
            queryParameters['direction'] = parameters['direction'];
        }

        if (parameters['pageNumber'] !== undefined) {
            queryParameters['pageNumber'] = parameters['pageNumber'];
        }

        if (parameters['pageSize'] !== undefined) {
            queryParameters['pageSize'] = parameters['pageSize'];
        }

        if (parameters['projection'] !== undefined) {
            queryParameters['projection'] = parameters['projection'];
        }

        if (parameters['sortBy'] !== undefined) {
            queryParameters['sortBy'] = parameters['sortBy'];
        }

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
     * Get all resoruce definitions in the specified study
     * @method
     * @name CBioPortalAPI#getAllResourceDefinitionsInStudyUsingGET
     * @param {string} direction - Direction of the sort
     * @param {integer} pageNumber - Page number of the result list
     * @param {integer} pageSize - Page size of the result list
     * @param {string} projection - Level of detail of the response
     * @param {string} sortBy - Name of the property that the result list is sorted by
     * @param {string} studyId - Study ID e.g. acc_tcga
     */
    getAllResourceDefinitionsInStudyUsingGETWithHttpInfo(parameters: {
        'direction' ? : "ASC" | "DESC",
        'pageNumber' ? : number,
        'pageSize' ? : number,
        'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
        'sortBy' ? : "resourceId" | "displayName" | "description" | "resourceType" | "priority" | "openByDefault" | "studyId",
        'studyId': string,
        $queryParameters ? : any,
            $domain ? : string
    }): Promise < request.Response > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        const errorHandlers = this.errorHandlers;
        const request = this.request;
        let path = '/studies/{studyId}/resource-definitions';
        let body: any;
        let queryParameters: any = {};
        let headers: any = {};
        let form: any = {};
        return new Promise(function(resolve, reject) {
            headers['Accept'] = 'application/json';

            if (parameters['direction'] !== undefined) {
                queryParameters['direction'] = parameters['direction'];
            }

            if (parameters['pageNumber'] !== undefined) {
                queryParameters['pageNumber'] = parameters['pageNumber'];
            }

            if (parameters['pageSize'] !== undefined) {
                queryParameters['pageSize'] = parameters['pageSize'];
            }

            if (parameters['projection'] !== undefined) {
                queryParameters['projection'] = parameters['projection'];
            }

            if (parameters['sortBy'] !== undefined) {
                queryParameters['sortBy'] = parameters['sortBy'];
            }

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

        });
    };

    /**
     * Get all resoruce definitions in the specified study
     * @method
     * @name CBioPortalAPI#getAllResourceDefinitionsInStudyUsingGET
     * @param {string} direction - Direction of the sort
     * @param {integer} pageNumber - Page number of the result list
     * @param {integer} pageSize - Page size of the result list
     * @param {string} projection - Level of detail of the response
     * @param {string} sortBy - Name of the property that the result list is sorted by
     * @param {string} studyId - Study ID e.g. acc_tcga
     */
    getAllResourceDefinitionsInStudyUsingGET(parameters: {
            'direction' ? : "ASC" | "DESC",
            'pageNumber' ? : number,
            'pageSize' ? : number,
            'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
            'sortBy' ? : "resourceId" | "displayName" | "description" | "resourceType" | "priority" | "openByDefault" | "studyId",
            'studyId': string,
            $queryParameters ? : any,
                $domain ? : string
        }): Promise < Array < ResourceDefinition >
        > {
            return this.getAllResourceDefinitionsInStudyUsingGETWithHttpInfo(parameters).then(function(response: request.Response) {
                return response.body;
            });
        };
    getResourceDefinitionInStudyUsingGETURL(parameters: {
        'resourceId': string,
        'studyId': string,
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/studies/{studyId}/resource-definitions/{resourceId}';

        path = path.replace('{resourceId}', parameters['resourceId'] + '');

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
     * Get specified resource definition
     * @method
     * @name CBioPortalAPI#getResourceDefinitionInStudyUsingGET
     * @param {string} resourceId - Resource ID
     * @param {string} studyId - Study ID e.g. acc_tcga
     */
    getResourceDefinitionInStudyUsingGETWithHttpInfo(parameters: {
        'resourceId': string,
        'studyId': string,
        $queryParameters ? : any,
        $domain ? : string
    }): Promise < request.Response > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        const errorHandlers = this.errorHandlers;
        const request = this.request;
        let path = '/studies/{studyId}/resource-definitions/{resourceId}';
        let body: any;
        let queryParameters: any = {};
        let headers: any = {};
        let form: any = {};
        return new Promise(function(resolve, reject) {
            headers['Accept'] = 'application/json';

            path = path.replace('{resourceId}', parameters['resourceId'] + '');

            if (parameters['resourceId'] === undefined) {
                reject(new Error('Missing required  parameter: resourceId'));
                return;
            }

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

        });
    };

    /**
     * Get specified resource definition
     * @method
     * @name CBioPortalAPI#getResourceDefinitionInStudyUsingGET
     * @param {string} resourceId - Resource ID
     * @param {string} studyId - Study ID e.g. acc_tcga
     */
    getResourceDefinitionInStudyUsingGET(parameters: {
        'resourceId': string,
        'studyId': string,
        $queryParameters ? : any,
        $domain ? : string
    }): Promise < ResourceDefinition > {
        return this.getResourceDefinitionInStudyUsingGETWithHttpInfo(parameters).then(function(response: request.Response) {
            return response.body;
        });
    };
    getAllSampleListsInStudyUsingGETURL(parameters: {
        'direction' ? : "ASC" | "DESC",
        'pageNumber' ? : number,
        'pageSize' ? : number,
        'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
        'sortBy' ? : "sampleListId" | "category" | "studyId" | "name" | "description",
        'studyId': string,
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/studies/{studyId}/sample-lists';
        if (parameters['direction'] !== undefined) {
            queryParameters['direction'] = parameters['direction'];
        }

        if (parameters['pageNumber'] !== undefined) {
            queryParameters['pageNumber'] = parameters['pageNumber'];
        }

        if (parameters['pageSize'] !== undefined) {
            queryParameters['pageSize'] = parameters['pageSize'];
        }

        if (parameters['projection'] !== undefined) {
            queryParameters['projection'] = parameters['projection'];
        }

        if (parameters['sortBy'] !== undefined) {
            queryParameters['sortBy'] = parameters['sortBy'];
        }

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
     * Get all sample lists in a study
     * @method
     * @name CBioPortalAPI#getAllSampleListsInStudyUsingGET
     * @param {string} direction - Direction of the sort
     * @param {integer} pageNumber - Page number of the result list
     * @param {integer} pageSize - Page size of the result list
     * @param {string} projection - Level of detail of the response
     * @param {string} sortBy - Name of the property that the result list is sorted by
     * @param {string} studyId - Study ID e.g. acc_tcga
     */
    getAllSampleListsInStudyUsingGETWithHttpInfo(parameters: {
        'direction' ? : "ASC" | "DESC",
        'pageNumber' ? : number,
        'pageSize' ? : number,
        'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
        'sortBy' ? : "sampleListId" | "category" | "studyId" | "name" | "description",
        'studyId': string,
        $queryParameters ? : any,
            $domain ? : string
    }): Promise < request.Response > {
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

            if (parameters['direction'] !== undefined) {
                queryParameters['direction'] = parameters['direction'];
            }

            if (parameters['pageNumber'] !== undefined) {
                queryParameters['pageNumber'] = parameters['pageNumber'];
            }

            if (parameters['pageSize'] !== undefined) {
                queryParameters['pageSize'] = parameters['pageSize'];
            }

            if (parameters['projection'] !== undefined) {
                queryParameters['projection'] = parameters['projection'];
            }

            if (parameters['sortBy'] !== undefined) {
                queryParameters['sortBy'] = parameters['sortBy'];
            }

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

        });
    };

    /**
     * Get all sample lists in a study
     * @method
     * @name CBioPortalAPI#getAllSampleListsInStudyUsingGET
     * @param {string} direction - Direction of the sort
     * @param {integer} pageNumber - Page number of the result list
     * @param {integer} pageSize - Page size of the result list
     * @param {string} projection - Level of detail of the response
     * @param {string} sortBy - Name of the property that the result list is sorted by
     * @param {string} studyId - Study ID e.g. acc_tcga
     */
    getAllSampleListsInStudyUsingGET(parameters: {
            'direction' ? : "ASC" | "DESC",
            'pageNumber' ? : number,
            'pageSize' ? : number,
            'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
            'sortBy' ? : "sampleListId" | "category" | "studyId" | "name" | "description",
            'studyId': string,
            $queryParameters ? : any,
                $domain ? : string
        }): Promise < Array < SampleList >
        > {
            return this.getAllSampleListsInStudyUsingGETWithHttpInfo(parameters).then(function(response: request.Response) {
                return response.body;
            });
        };
    getAllSamplesInStudyUsingGETURL(parameters: {
        'direction' ? : "ASC" | "DESC",
        'pageNumber' ? : number,
        'pageSize' ? : number,
        'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
        'sortBy' ? : "sampleId" | "sampleType",
        'studyId': string,
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/studies/{studyId}/samples';
        if (parameters['direction'] !== undefined) {
            queryParameters['direction'] = parameters['direction'];
        }

        if (parameters['pageNumber'] !== undefined) {
            queryParameters['pageNumber'] = parameters['pageNumber'];
        }

        if (parameters['pageSize'] !== undefined) {
            queryParameters['pageSize'] = parameters['pageSize'];
        }

        if (parameters['projection'] !== undefined) {
            queryParameters['projection'] = parameters['projection'];
        }

        if (parameters['sortBy'] !== undefined) {
            queryParameters['sortBy'] = parameters['sortBy'];
        }

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
     * Get all samples in a study
     * @method
     * @name CBioPortalAPI#getAllSamplesInStudyUsingGET
     * @param {string} direction - Direction of the sort
     * @param {integer} pageNumber - Page number of the result list
     * @param {integer} pageSize - Page size of the result list
     * @param {string} projection - Level of detail of the response
     * @param {string} sortBy - Name of the property that the result list is sorted by
     * @param {string} studyId - Study ID e.g. acc_tcga
     */
    getAllSamplesInStudyUsingGETWithHttpInfo(parameters: {
        'direction' ? : "ASC" | "DESC",
        'pageNumber' ? : number,
        'pageSize' ? : number,
        'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
        'sortBy' ? : "sampleId" | "sampleType",
        'studyId': string,
        $queryParameters ? : any,
            $domain ? : string
    }): Promise < request.Response > {
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

            if (parameters['direction'] !== undefined) {
                queryParameters['direction'] = parameters['direction'];
            }

            if (parameters['pageNumber'] !== undefined) {
                queryParameters['pageNumber'] = parameters['pageNumber'];
            }

            if (parameters['pageSize'] !== undefined) {
                queryParameters['pageSize'] = parameters['pageSize'];
            }

            if (parameters['projection'] !== undefined) {
                queryParameters['projection'] = parameters['projection'];
            }

            if (parameters['sortBy'] !== undefined) {
                queryParameters['sortBy'] = parameters['sortBy'];
            }

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

        });
    };

    /**
     * Get all samples in a study
     * @method
     * @name CBioPortalAPI#getAllSamplesInStudyUsingGET
     * @param {string} direction - Direction of the sort
     * @param {integer} pageNumber - Page number of the result list
     * @param {integer} pageSize - Page size of the result list
     * @param {string} projection - Level of detail of the response
     * @param {string} sortBy - Name of the property that the result list is sorted by
     * @param {string} studyId - Study ID e.g. acc_tcga
     */
    getAllSamplesInStudyUsingGET(parameters: {
            'direction' ? : "ASC" | "DESC",
            'pageNumber' ? : number,
            'pageSize' ? : number,
            'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
            'sortBy' ? : "sampleId" | "sampleType",
            'studyId': string,
            $queryParameters ? : any,
                $domain ? : string
        }): Promise < Array < Sample >
        > {
            return this.getAllSamplesInStudyUsingGETWithHttpInfo(parameters).then(function(response: request.Response) {
                return response.body;
            });
        };
    getSampleInStudyUsingGETURL(parameters: {
        'sampleId': string,
        'studyId': string,
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/studies/{studyId}/samples/{sampleId}';

        path = path.replace('{sampleId}', parameters['sampleId'] + '');

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
     * Get a sample in a study
     * @method
     * @name CBioPortalAPI#getSampleInStudyUsingGET
     * @param {string} sampleId - Sample ID e.g. TCGA-OR-A5J2-01
     * @param {string} studyId - Study ID e.g. acc_tcga
     */
    getSampleInStudyUsingGETWithHttpInfo(parameters: {
        'sampleId': string,
        'studyId': string,
        $queryParameters ? : any,
        $domain ? : string
    }): Promise < request.Response > {
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

            path = path.replace('{sampleId}', parameters['sampleId'] + '');

            if (parameters['sampleId'] === undefined) {
                reject(new Error('Missing required  parameter: sampleId'));
                return;
            }

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

        });
    };

    /**
     * Get a sample in a study
     * @method
     * @name CBioPortalAPI#getSampleInStudyUsingGET
     * @param {string} sampleId - Sample ID e.g. TCGA-OR-A5J2-01
     * @param {string} studyId - Study ID e.g. acc_tcga
     */
    getSampleInStudyUsingGET(parameters: {
        'sampleId': string,
        'studyId': string,
        $queryParameters ? : any,
        $domain ? : string
    }): Promise < Sample > {
        return this.getSampleInStudyUsingGETWithHttpInfo(parameters).then(function(response: request.Response) {
            return response.body;
        });
    };
    getAllClinicalDataOfSampleInStudyUsingGETURL(parameters: {
        'attributeId' ? : string,
        'direction' ? : "ASC" | "DESC",
        'pageNumber' ? : number,
        'pageSize' ? : number,
        'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
        'sampleId': string,
        'sortBy' ? : "clinicalAttributeId" | "value",
        'studyId': string,
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/studies/{studyId}/samples/{sampleId}/clinical-data';
        if (parameters['attributeId'] !== undefined) {
            queryParameters['attributeId'] = parameters['attributeId'];
        }

        if (parameters['direction'] !== undefined) {
            queryParameters['direction'] = parameters['direction'];
        }

        if (parameters['pageNumber'] !== undefined) {
            queryParameters['pageNumber'] = parameters['pageNumber'];
        }

        if (parameters['pageSize'] !== undefined) {
            queryParameters['pageSize'] = parameters['pageSize'];
        }

        if (parameters['projection'] !== undefined) {
            queryParameters['projection'] = parameters['projection'];
        }

        path = path.replace('{sampleId}', parameters['sampleId'] + '');
        if (parameters['sortBy'] !== undefined) {
            queryParameters['sortBy'] = parameters['sortBy'];
        }

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
     * Get all clinical data of a sample in a study
     * @method
     * @name CBioPortalAPI#getAllClinicalDataOfSampleInStudyUsingGET
     * @param {string} attributeId - Attribute ID e.g. CANCER_TYPE
     * @param {string} direction - Direction of the sort
     * @param {integer} pageNumber - Page number of the result list
     * @param {integer} pageSize - Page size of the result list
     * @param {string} projection - Level of detail of the response
     * @param {string} sampleId - Sample ID e.g. TCGA-OR-A5J2-01
     * @param {string} sortBy - Name of the property that the result list is sorted by
     * @param {string} studyId - Study ID e.g. acc_tcga
     */
    getAllClinicalDataOfSampleInStudyUsingGETWithHttpInfo(parameters: {
        'attributeId' ? : string,
        'direction' ? : "ASC" | "DESC",
        'pageNumber' ? : number,
        'pageSize' ? : number,
        'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
        'sampleId': string,
        'sortBy' ? : "clinicalAttributeId" | "value",
        'studyId': string,
        $queryParameters ? : any,
            $domain ? : string
    }): Promise < request.Response > {
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

            if (parameters['attributeId'] !== undefined) {
                queryParameters['attributeId'] = parameters['attributeId'];
            }

            if (parameters['direction'] !== undefined) {
                queryParameters['direction'] = parameters['direction'];
            }

            if (parameters['pageNumber'] !== undefined) {
                queryParameters['pageNumber'] = parameters['pageNumber'];
            }

            if (parameters['pageSize'] !== undefined) {
                queryParameters['pageSize'] = parameters['pageSize'];
            }

            if (parameters['projection'] !== undefined) {
                queryParameters['projection'] = parameters['projection'];
            }

            path = path.replace('{sampleId}', parameters['sampleId'] + '');

            if (parameters['sampleId'] === undefined) {
                reject(new Error('Missing required  parameter: sampleId'));
                return;
            }

            if (parameters['sortBy'] !== undefined) {
                queryParameters['sortBy'] = parameters['sortBy'];
            }

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

        });
    };

    /**
     * Get all clinical data of a sample in a study
     * @method
     * @name CBioPortalAPI#getAllClinicalDataOfSampleInStudyUsingGET
     * @param {string} attributeId - Attribute ID e.g. CANCER_TYPE
     * @param {string} direction - Direction of the sort
     * @param {integer} pageNumber - Page number of the result list
     * @param {integer} pageSize - Page size of the result list
     * @param {string} projection - Level of detail of the response
     * @param {string} sampleId - Sample ID e.g. TCGA-OR-A5J2-01
     * @param {string} sortBy - Name of the property that the result list is sorted by
     * @param {string} studyId - Study ID e.g. acc_tcga
     */
    getAllClinicalDataOfSampleInStudyUsingGET(parameters: {
            'attributeId' ? : string,
            'direction' ? : "ASC" | "DESC",
            'pageNumber' ? : number,
            'pageSize' ? : number,
            'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
            'sampleId': string,
            'sortBy' ? : "clinicalAttributeId" | "value",
            'studyId': string,
            $queryParameters ? : any,
                $domain ? : string
        }): Promise < Array < ClinicalData >
        > {
            return this.getAllClinicalDataOfSampleInStudyUsingGETWithHttpInfo(parameters).then(function(response: request.Response) {
                return response.body;
            });
        };
    getCopyNumberSegmentsInSampleInStudyUsingGETURL(parameters: {
        'chromosome' ? : string,
        'direction' ? : "ASC" | "DESC",
        'pageNumber' ? : number,
        'pageSize' ? : number,
        'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
        'sampleId': string,
        'sortBy' ? : "chromosome" | "start" | "end" | "numberOfProbes" | "segmentMean",
        'studyId': string,
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/studies/{studyId}/samples/{sampleId}/copy-number-segments';
        if (parameters['chromosome'] !== undefined) {
            queryParameters['chromosome'] = parameters['chromosome'];
        }

        if (parameters['direction'] !== undefined) {
            queryParameters['direction'] = parameters['direction'];
        }

        if (parameters['pageNumber'] !== undefined) {
            queryParameters['pageNumber'] = parameters['pageNumber'];
        }

        if (parameters['pageSize'] !== undefined) {
            queryParameters['pageSize'] = parameters['pageSize'];
        }

        if (parameters['projection'] !== undefined) {
            queryParameters['projection'] = parameters['projection'];
        }

        path = path.replace('{sampleId}', parameters['sampleId'] + '');
        if (parameters['sortBy'] !== undefined) {
            queryParameters['sortBy'] = parameters['sortBy'];
        }

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
     * Get copy number segments in a sample in a study
     * @method
     * @name CBioPortalAPI#getCopyNumberSegmentsInSampleInStudyUsingGET
     * @param {string} chromosome - Chromosome
     * @param {string} direction - Direction of the sort
     * @param {integer} pageNumber - Page number of the result list
     * @param {integer} pageSize - Page size of the result list
     * @param {string} projection - Level of detail of the response
     * @param {string} sampleId - Sample ID e.g. TCGA-OR-A5J2-01
     * @param {string} sortBy - Name of the property that the result list is sorted by
     * @param {string} studyId - Study ID e.g. acc_tcga
     */
    getCopyNumberSegmentsInSampleInStudyUsingGETWithHttpInfo(parameters: {
        'chromosome' ? : string,
        'direction' ? : "ASC" | "DESC",
        'pageNumber' ? : number,
        'pageSize' ? : number,
        'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
        'sampleId': string,
        'sortBy' ? : "chromosome" | "start" | "end" | "numberOfProbes" | "segmentMean",
        'studyId': string,
        $queryParameters ? : any,
            $domain ? : string
    }): Promise < request.Response > {
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

            if (parameters['chromosome'] !== undefined) {
                queryParameters['chromosome'] = parameters['chromosome'];
            }

            if (parameters['direction'] !== undefined) {
                queryParameters['direction'] = parameters['direction'];
            }

            if (parameters['pageNumber'] !== undefined) {
                queryParameters['pageNumber'] = parameters['pageNumber'];
            }

            if (parameters['pageSize'] !== undefined) {
                queryParameters['pageSize'] = parameters['pageSize'];
            }

            if (parameters['projection'] !== undefined) {
                queryParameters['projection'] = parameters['projection'];
            }

            path = path.replace('{sampleId}', parameters['sampleId'] + '');

            if (parameters['sampleId'] === undefined) {
                reject(new Error('Missing required  parameter: sampleId'));
                return;
            }

            if (parameters['sortBy'] !== undefined) {
                queryParameters['sortBy'] = parameters['sortBy'];
            }

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

        });
    };

    /**
     * Get copy number segments in a sample in a study
     * @method
     * @name CBioPortalAPI#getCopyNumberSegmentsInSampleInStudyUsingGET
     * @param {string} chromosome - Chromosome
     * @param {string} direction - Direction of the sort
     * @param {integer} pageNumber - Page number of the result list
     * @param {integer} pageSize - Page size of the result list
     * @param {string} projection - Level of detail of the response
     * @param {string} sampleId - Sample ID e.g. TCGA-OR-A5J2-01
     * @param {string} sortBy - Name of the property that the result list is sorted by
     * @param {string} studyId - Study ID e.g. acc_tcga
     */
    getCopyNumberSegmentsInSampleInStudyUsingGET(parameters: {
            'chromosome' ? : string,
            'direction' ? : "ASC" | "DESC",
            'pageNumber' ? : number,
            'pageSize' ? : number,
            'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
            'sampleId': string,
            'sortBy' ? : "chromosome" | "start" | "end" | "numberOfProbes" | "segmentMean",
            'studyId': string,
            $queryParameters ? : any,
                $domain ? : string
        }): Promise < Array < CopyNumberSeg >
        > {
            return this.getCopyNumberSegmentsInSampleInStudyUsingGETWithHttpInfo(parameters).then(function(response: request.Response) {
                return response.body;
            });
        };
    getAllResourceDataOfSampleInStudyUsingGETURL(parameters: {
        'direction' ? : "ASC" | "DESC",
        'pageNumber' ? : number,
        'pageSize' ? : number,
        'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
        'resourceId' ? : string,
        'sampleId': string,
        'sortBy' ? : "ResourceId" | "url",
        'studyId': string,
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/studies/{studyId}/samples/{sampleId}/resource-data';
        if (parameters['direction'] !== undefined) {
            queryParameters['direction'] = parameters['direction'];
        }

        if (parameters['pageNumber'] !== undefined) {
            queryParameters['pageNumber'] = parameters['pageNumber'];
        }

        if (parameters['pageSize'] !== undefined) {
            queryParameters['pageSize'] = parameters['pageSize'];
        }

        if (parameters['projection'] !== undefined) {
            queryParameters['projection'] = parameters['projection'];
        }

        if (parameters['resourceId'] !== undefined) {
            queryParameters['resourceId'] = parameters['resourceId'];
        }

        path = path.replace('{sampleId}', parameters['sampleId'] + '');
        if (parameters['sortBy'] !== undefined) {
            queryParameters['sortBy'] = parameters['sortBy'];
        }

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
     * Get all resource data of a sample in a study
     * @method
     * @name CBioPortalAPI#getAllResourceDataOfSampleInStudyUsingGET
     * @param {string} direction - Direction of the sort
     * @param {integer} pageNumber - Page number of the result list
     * @param {integer} pageSize - Page size of the result list
     * @param {string} projection - Level of detail of the response
     * @param {string} resourceId - Resource ID
     * @param {string} sampleId - Sample ID e.g. TCGA-OR-A5J2-01
     * @param {string} sortBy - Name of the property that the result list is sorted by
     * @param {string} studyId - Study ID e.g. acc_tcga
     */
    getAllResourceDataOfSampleInStudyUsingGETWithHttpInfo(parameters: {
        'direction' ? : "ASC" | "DESC",
        'pageNumber' ? : number,
        'pageSize' ? : number,
        'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
        'resourceId' ? : string,
        'sampleId': string,
        'sortBy' ? : "ResourceId" | "url",
        'studyId': string,
        $queryParameters ? : any,
            $domain ? : string
    }): Promise < request.Response > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        const errorHandlers = this.errorHandlers;
        const request = this.request;
        let path = '/studies/{studyId}/samples/{sampleId}/resource-data';
        let body: any;
        let queryParameters: any = {};
        let headers: any = {};
        let form: any = {};
        return new Promise(function(resolve, reject) {
            headers['Accept'] = 'application/json';

            if (parameters['direction'] !== undefined) {
                queryParameters['direction'] = parameters['direction'];
            }

            if (parameters['pageNumber'] !== undefined) {
                queryParameters['pageNumber'] = parameters['pageNumber'];
            }

            if (parameters['pageSize'] !== undefined) {
                queryParameters['pageSize'] = parameters['pageSize'];
            }

            if (parameters['projection'] !== undefined) {
                queryParameters['projection'] = parameters['projection'];
            }

            if (parameters['resourceId'] !== undefined) {
                queryParameters['resourceId'] = parameters['resourceId'];
            }

            path = path.replace('{sampleId}', parameters['sampleId'] + '');

            if (parameters['sampleId'] === undefined) {
                reject(new Error('Missing required  parameter: sampleId'));
                return;
            }

            if (parameters['sortBy'] !== undefined) {
                queryParameters['sortBy'] = parameters['sortBy'];
            }

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

        });
    };

    /**
     * Get all resource data of a sample in a study
     * @method
     * @name CBioPortalAPI#getAllResourceDataOfSampleInStudyUsingGET
     * @param {string} direction - Direction of the sort
     * @param {integer} pageNumber - Page number of the result list
     * @param {integer} pageSize - Page size of the result list
     * @param {string} projection - Level of detail of the response
     * @param {string} resourceId - Resource ID
     * @param {string} sampleId - Sample ID e.g. TCGA-OR-A5J2-01
     * @param {string} sortBy - Name of the property that the result list is sorted by
     * @param {string} studyId - Study ID e.g. acc_tcga
     */
    getAllResourceDataOfSampleInStudyUsingGET(parameters: {
            'direction' ? : "ASC" | "DESC",
            'pageNumber' ? : number,
            'pageSize' ? : number,
            'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
            'resourceId' ? : string,
            'sampleId': string,
            'sortBy' ? : "ResourceId" | "url",
            'studyId': string,
            $queryParameters ? : any,
                $domain ? : string
        }): Promise < Array < ResourceData >
        > {
            return this.getAllResourceDataOfSampleInStudyUsingGETWithHttpInfo(parameters).then(function(response: request.Response) {
                return response.body;
            });
        };
    getTagsUsingGETURL(parameters: {
        'studyId': string,
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/studies/{studyId}/tags';

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
     * Get the tags of a study
     * @method
     * @name CBioPortalAPI#getTagsUsingGET
     * @param {string} studyId - Study ID e.g. acc_tcga
     */
    getTagsUsingGETWithHttpInfo(parameters: {
        'studyId': string,
        $queryParameters ? : any,
        $domain ? : string
    }): Promise < request.Response > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        const errorHandlers = this.errorHandlers;
        const request = this.request;
        let path = '/studies/{studyId}/tags';
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
     * Get the tags of a study
     * @method
     * @name CBioPortalAPI#getTagsUsingGET
     * @param {string} studyId - Study ID e.g. acc_tcga
     */
    getTagsUsingGET(parameters: {
        'studyId': string,
        $queryParameters ? : any,
        $domain ? : string
    }): Promise < {} > {
        return this.getTagsUsingGETWithHttpInfo(parameters).then(function(response: request.Response) {
            return response.body;
        });
    };
}