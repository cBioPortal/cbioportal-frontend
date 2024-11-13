import * as request from "superagent";

type CallbackHandler = (err: any, res ? : request.Response) => void;
export type AlterationFilter = {
    'copyNumberAlterationEventTypes': {}

    'includeDriver': boolean

        'includeGermline': boolean

        'includeSomatic': boolean

        'includeUnknownOncogenicity': boolean

        'includeUnknownStatus': boolean

        'includeUnknownTier': boolean

        'includeVUS': boolean

        'mutationEventTypes': {}

        'structuralVariants': boolean

        'tiersBooleanMap': {}

};
export type AndedPatientTreatmentFilters = {
    'filters': Array < OredPatientTreatmentFilters >

};
export type AndedSampleTreatmentFilters = {
    'filters': Array < OredSampleTreatmentFilters >

};
export type BinsGeneratorConfig = {
    'anchorValue': number

        'binSize': number

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
export type ClinicalDataBin = {
    'attributeId': string

        'count': number

        'end': number

        'specialValue': string

        'start': number

};
export type ClinicalDataBinCountFilter = {
    'attributes': Array < ClinicalDataBinFilter >

        'studyViewFilter': StudyViewFilter

};
export type ClinicalDataBinFilter = {
    'attributeId': string

        'binMethod': "MEDIAN" | "QUARTILE" | "CUSTOM" | "GENERATE"

        'binsGeneratorConfig': BinsGeneratorConfig

        'customBins': Array < number >

        'disableLogScale': boolean

        'end': number

        'start': number

};
export type ClinicalDataCount = {
    'count': number

        'value': string

};
export type ClinicalDataCountFilter = {
    'attributes': Array < ClinicalDataFilter >

        'studyViewFilter': StudyViewFilter

};
export type ClinicalDataCountItem = {
    'attributeId': string

        'counts': Array < ClinicalDataCount >

};
export type ClinicalDataFilter = {
    'attributeId': string

        'values': Array < DataFilterValue >

};
export type DataFilter = {
    'values': Array < DataFilterValue >

};
export type DataFilterValue = {
    'end': number

        'start': number

        'value': string

};
export type GeneFilter = {
    'geneQueries': Array < Array < GeneFilterQuery >
        >

        'molecularProfileIds': Array < string >

};
export type GeneFilterQuery = {
    'alterations': Array < "AMP" | "GAIN" | "DIPLOID" | "HETLOSS" | "HOMDEL" >

        'entrezGeneId': number

        'hugoGeneSymbol': string

        'includeDriver': boolean

        'includeGermline': boolean

        'includeSomatic': boolean

        'includeUnknownOncogenicity': boolean

        'includeUnknownStatus': boolean

        'includeUnknownTier': boolean

        'includeVUS': boolean

        'tiersBooleanMap': {}

};
export type GenericAssayDataFilter = {
    'profileType': string

        'stableId': string

        'values': Array < DataFilterValue >

};
export type GenomicDataFilter = {
    'hugoGeneSymbol': string

        'profileType': string

        'values': Array < DataFilterValue >

};
export type MutationDataFilter = {
    'categorization': "MUTATED" | "MUTATION_TYPE"

        'hugoGeneSymbol': string

        'profileType': string

        'values': Array < Array < DataFilterValue >
        >

};
export type OredPatientTreatmentFilters = {
    'filters': Array < PatientTreatmentFilter >

};
export type OredSampleTreatmentFilters = {
    'filters': Array < SampleTreatmentFilter >

};
export type PatientTreatmentFilter = {
    'treatment': string

};
export type SampleIdentifier = {
    'sampleId': string

        'studyId': string

};
export type SampleTreatmentFilter = {
    'time': "Pre" | "Post"

        'treatment': string

};
export type StructuralVariantFilterQuery = {
    'gene1Query': StructuralVariantGeneSubQuery

        'gene2Query': StructuralVariantGeneSubQuery

        'includeDriver': boolean

        'includeGermline': boolean

        'includeSomatic': boolean

        'includeUnknownOncogenicity': boolean

        'includeUnknownStatus': boolean

        'includeUnknownTier': boolean

        'includeVUS': boolean

        'tiersBooleanMap': {}

};
export type StructuralVariantGeneSubQuery = {
    'entrezId': number

        'hugoSymbol': string

        'specialValue': "ANY_GENE" | "NO_GENE"

};
export type StudyViewFilter = {
    'alterationFilter': AlterationFilter

        'caseLists': Array < Array < string >
        >

        'clinicalDataFilters': Array < ClinicalDataFilter >

        'clinicalEventFilters': Array < DataFilter >

        'customDataFilters': Array < ClinicalDataFilter >

        'geneFilters': Array < GeneFilter >

        'genericAssayDataFilters': Array < GenericAssayDataFilter >

        'genomicDataFilters': Array < GenomicDataFilter >

        'genomicProfiles': Array < Array < string >
        >

        'mutationDataFilters': Array < MutationDataFilter >

        'patientTreatmentFilters': AndedPatientTreatmentFilters

        'patientTreatmentGroupFilters': AndedPatientTreatmentFilters

        'patientTreatmentTargetFilters': AndedPatientTreatmentFilters

        'sampleIdentifiers': Array < SampleIdentifier >

        'sampleTreatmentFilters': AndedSampleTreatmentFilters

        'sampleTreatmentGroupFilters': AndedSampleTreatmentFilters

        'sampleTreatmentTargetFilters': AndedSampleTreatmentFilters

        'structuralVariantFilters': Array < StudyViewStructuralVariantFilter >

        'studyIds': Array < string >

};
export type StudyViewStructuralVariantFilter = {
    'molecularProfileIds': Array < string >

        'structVarQueries': Array < Array < StructuralVariantFilterQuery >
        >

};

/**
 * A web service for supplying JSON formatted data to cBioPortal clients. Please note that this API is currently in beta and subject to change.
 * @class CBioPortalAPIFederated
 * @param {(string)} [domainOrOptions] - The project domain.
 */
export default class CBioPortalAPIFederated {

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

    fetchClinicalAttributesUsingPOSTURL(parameters: {
        'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
        'studyIds': Array < string > ,
            $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/api-fed/clinical-attributes/fetch';
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
     * @name CBioPortalAPIFederated#fetchClinicalAttributesUsingPOST
     * @param {string} projection - Level of detail of the response
     * @param {} studyIds - A web service for supplying JSON formatted data to cBioPortal clients. Please note that this API is currently in beta and subject to change.
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
        let path = '/api-fed/clinical-attributes/fetch';
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
     * @name CBioPortalAPIFederated#fetchClinicalAttributesUsingPOST
     * @param {string} projection - Level of detail of the response
     * @param {} studyIds - A web service for supplying JSON formatted data to cBioPortal clients. Please note that this API is currently in beta and subject to change.
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
    fetchClinicalDataBinCountsUsingPOSTURL(parameters: {
        'dataBinMethod' ? : "STATIC" | "DYNAMIC",
        'clinicalDataBinCountFilter' ? : ClinicalDataBinCountFilter,
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/api-fed/clinical-data-bin-counts/fetch';
        if (parameters['dataBinMethod'] !== undefined) {
            queryParameters['dataBinMethod'] = parameters['dataBinMethod'];
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
     * Fetch clinical data bin counts by study view filter
     * @method
     * @name CBioPortalAPIFederated#fetchClinicalDataBinCountsUsingPOST
     * @param {string} dataBinMethod - Method for data binning
     * @param {} clinicalDataBinCountFilter - A web service for supplying JSON formatted data to cBioPortal clients. Please note that this API is currently in beta and subject to change.
     */
    fetchClinicalDataBinCountsUsingPOSTWithHttpInfo(parameters: {
        'dataBinMethod' ? : "STATIC" | "DYNAMIC",
        'clinicalDataBinCountFilter' ? : ClinicalDataBinCountFilter,
        $queryParameters ? : any,
            $domain ? : string
    }): Promise < request.Response > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        const errorHandlers = this.errorHandlers;
        const request = this.request;
        let path = '/api-fed/clinical-data-bin-counts/fetch';
        let body: any;
        let queryParameters: any = {};
        let headers: any = {};
        let form: any = {};
        return new Promise(function(resolve, reject) {
            headers['Accept'] = 'application/json';
            headers['Content-Type'] = 'application/json';

            if (parameters['dataBinMethod'] !== undefined) {
                queryParameters['dataBinMethod'] = parameters['dataBinMethod'];
            }

            if (parameters['clinicalDataBinCountFilter'] !== undefined) {
                body = parameters['clinicalDataBinCountFilter'];
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
     * Fetch clinical data bin counts by study view filter
     * @method
     * @name CBioPortalAPIFederated#fetchClinicalDataBinCountsUsingPOST
     * @param {string} dataBinMethod - Method for data binning
     * @param {} clinicalDataBinCountFilter - A web service for supplying JSON formatted data to cBioPortal clients. Please note that this API is currently in beta and subject to change.
     */
    fetchClinicalDataBinCountsUsingPOST(parameters: {
            'dataBinMethod' ? : "STATIC" | "DYNAMIC",
            'clinicalDataBinCountFilter' ? : ClinicalDataBinCountFilter,
            $queryParameters ? : any,
                $domain ? : string
        }): Promise < Array < ClinicalDataBin >
        > {
            return this.fetchClinicalDataBinCountsUsingPOSTWithHttpInfo(parameters).then(function(response: request.Response) {
                return response.body;
            });
        };
    fetchClinicalDataCountsUsingPOSTURL(parameters: {
        'clinicalDataCountFilter' ? : ClinicalDataCountFilter,
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/api-fed/clinical-data-counts/fetch';

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
     * @name CBioPortalAPIFederated#fetchClinicalDataCountsUsingPOST
     * @param {} clinicalDataCountFilter - A web service for supplying JSON formatted data to cBioPortal clients. Please note that this API is currently in beta and subject to change.
     */
    fetchClinicalDataCountsUsingPOSTWithHttpInfo(parameters: {
        'clinicalDataCountFilter' ? : ClinicalDataCountFilter,
        $queryParameters ? : any,
            $domain ? : string
    }): Promise < request.Response > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        const errorHandlers = this.errorHandlers;
        const request = this.request;
        let path = '/api-fed/clinical-data-counts/fetch';
        let body: any;
        let queryParameters: any = {};
        let headers: any = {};
        let form: any = {};
        return new Promise(function(resolve, reject) {
            headers['Accept'] = 'application/json';
            headers['Content-Type'] = 'application/json';

            if (parameters['clinicalDataCountFilter'] !== undefined) {
                body = parameters['clinicalDataCountFilter'];
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
     * @name CBioPortalAPIFederated#fetchClinicalDataCountsUsingPOST
     * @param {} clinicalDataCountFilter - A web service for supplying JSON formatted data to cBioPortal clients. Please note that this API is currently in beta and subject to change.
     */
    fetchClinicalDataCountsUsingPOST(parameters: {
            'clinicalDataCountFilter' ? : ClinicalDataCountFilter,
            $queryParameters ? : any,
                $domain ? : string
        }): Promise < Array < ClinicalDataCountItem >
        > {
            return this.fetchClinicalDataCountsUsingPOSTWithHttpInfo(parameters).then(function(response: request.Response) {
                return response.body;
            });
        };
}