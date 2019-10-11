import * as request from "superagent";

type CallbackHandler = (err: any, res ? : request.Response) => void;
export type AlterationEnrichment = {
    'counts': Array < CountSummary >

        'cytoband': string

        'entrezGeneId': number

        'hugoGeneSymbol': string

        'pValue': number

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
export type ClinicalDataBinCountFilter = {
    'attributes': Array < ClinicalDataBinFilter >

        'studyViewFilter': StudyViewFilter

};
export type ClinicalDataBinFilter = {
    'attributeId': string

        'clinicalDataType': "SAMPLE" | "PATIENT"

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

        'clinicalDataType': "SAMPLE" | "PATIENT"

        'counts': Array < ClinicalDataCount >

};
export type ClinicalDataEnrichment = {
    'clinicalAttribute': ClinicalAttribute

        'method': string

        'pValue': number

        'score': number

};
export type ClinicalDataEqualityFilter = {
    'attributeId': string

        'clinicalDataType': "SAMPLE" | "PATIENT"

        'values': Array < string >

};
export type ClinicalDataFilter = {
    'attributeId': string

        'clinicalDataType': "SAMPLE" | "PATIENT"

};
export type ClinicalDataIntervalFilter = {
    'attributeId': string

        'clinicalDataType': "SAMPLE" | "PATIENT"

        'values': Array < ClinicalDataIntervalFilterValue >

};
export type ClinicalDataIntervalFilterValue = {
    'end': number

        'start': number

        'value': string

};
export type CoExpression = {
    'cytoband': string

        'geneticEntityId': string

        'geneticEntityName': string

        'geneticEntityType': "GENE" | "GENESET"

        'pValue': number

        'spearmansCorrelation': number

};
export type CoExpressionFilter = {
    'entrezGeneId': number

        'genesetId': string

        'sampleIds': Array < string >

        'sampleListId': string

};
export type CopyNumberCountByGene = {
    'alteration': number

        'cytoband': string

        'entrezGeneId': number

        'hugoGeneSymbol': string

        'matchingGenePanelIds': Array < string >

        'numberOfAlteredCases': number

        'numberOfProfiledCases': number

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
export type CountSummary = {
    'alteredCount': number

        'name': string

        'profiledCount': number

};
export type DataAccessToken = {
    'creation': string

        'expiration': string

        'token': string

        'username': string

};
export type DataBin = {
    'attributeId': string

        'clinicalDataType': "SAMPLE" | "PATIENT"

        'count': number

        'end': number

        'specialValue': string

        'start': number

};
export type DensityPlotBin = {
    'binX': number

        'binY': number

        'count': number

        'maxX': number

        'maxY': number

        'minX': number

        'minY': number

};
export type ExpressionEnrichment = {
    'cytoband': string

        'entrezGeneId': number

        'groupsStatistics': Array < GroupStatistics >

        'hugoGeneSymbol': string

        'pValue': number

};
export type FusionGeneFilter = {
    'entrezGeneIds': Array < number >

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
    'geneset': Geneset

        'genesetId': string

        'geneticProfileId': string

        'patientId': string

        'sampleId': string

        'stableId': string

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
export type Group = {
    'name': string

        'sampleIdentifiers': Array < SampleIdentifier >

};
export type GroupFilter = {
    'groups': Array < Group >

};
export type GroupStatistics = {
    'meanExpression': number

        'name': string

        'standardDeviation': number

};
export type Info = {
    'dbVersion': string

        'gitBranch': string

        'gitCommitId': string

        'gitCommitIdAbbrev': string

        'gitCommitIdDescribe': string

        'gitCommitIdDescribeShort': string

        'gitCommitMessageFull': string

        'gitCommitMessageShort': string

        'gitCommitMessageUserEmail': string

        'gitCommitMessageUserName': string

        'gitDirty': boolean

        'portalVersion': string

};
export type MolecularProfileCaseIdentifier = {
    'caseId': string

        'molecularProfileId': string

};
export type MolecularProfileCasesGroupFilter = {
    'molecularProfileCaseIdentifiers': Array < MolecularProfileCaseIdentifier >

        'name': string

};
export type MolecularProfileSampleCount = {
    'numberOfCNAProfiledSamples': number

        'numberOfCNAUnprofiledSamples': number

        'numberOfCNSegmentSamples': number

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
    'entrezGeneId': number

        'hugoGeneSymbol': string

        'matchingGenePanelIds': Array < string >

        'numberOfAlteredCases': number

        'numberOfProfiledCases': number

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
export type RectangleBounds = {
    'xEnd': number

        'xStart': number

        'yEnd': number

        'yStart': number

};
export type Sample = {
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

        'clinicalDataIntervalFilters': Array < ClinicalDataIntervalFilter >

        'cnaGenes': Array < CopyNumberGeneFilter >

        'fusionGenes': Array < FusionGeneFilter >

        'mutatedGenes': Array < MutationGeneFilter >

        'mutationCountVsCNASelection': RectangleBounds

        'sampleIdentifiers': Array < SampleIdentifier >

        'studyIds': Array < string >

        'withCNAData': boolean

        'withMutationData': boolean

};
export type Treatment = {
    'description': string

        'geneticEntityId': number

        'internalId': number

        'name': string

        'refLink': string

        'treatmentId': string

};
export type TreatmentDataFilterCriteria = {
    'sampleIds': Array < string >

        'sampleListId': string

        'treatmentIds': Array < string >

};
export type TreatmentFilter = {
    'studyIds': Array < string >

        'treatmentIds': Array < string >

};
export type TreatmentMolecularData = {
    'geneticProfileId': string

        'patientId': string

        'sampleId': string

        'stableId': string

        'studyId': string

        'treatmentId': string

        'uniquePatientKey': string

        'uniqueSampleKey': string

        'value': string

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

    fetchClinicalDataBinCountsUsingPOSTURL(parameters: {
        'dataBinMethod' ? : "STATIC" | "DYNAMIC",
        'clinicalDataBinCountFilter': ClinicalDataBinCountFilter,
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/clinical-data-bin-counts/fetch';
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
     * @name CBioPortalAPIInternal#fetchClinicalDataBinCountsUsingPOST
     * @param {string} dataBinMethod - Method for data binning
     * @param {} clinicalDataBinCountFilter - Clinical data bin count filter
     */
    fetchClinicalDataBinCountsUsingPOSTWithHttpInfo(parameters: {
        'dataBinMethod' ? : "STATIC" | "DYNAMIC",
        'clinicalDataBinCountFilter': ClinicalDataBinCountFilter,
        $queryParameters ? : any,
            $domain ? : string
    }): Promise < request.Response > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        const errorHandlers = this.errorHandlers;
        const request = this.request;
        let path = '/clinical-data-bin-counts/fetch';
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

            if (parameters['clinicalDataBinCountFilter'] === undefined) {
                reject(new Error('Missing required  parameter: clinicalDataBinCountFilter'));
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
     * Fetch clinical data bin counts by study view filter
     * @method
     * @name CBioPortalAPIInternal#fetchClinicalDataBinCountsUsingPOST
     * @param {string} dataBinMethod - Method for data binning
     * @param {} clinicalDataBinCountFilter - Clinical data bin count filter
     */
    fetchClinicalDataBinCountsUsingPOST(parameters: {
            'dataBinMethod' ? : "STATIC" | "DYNAMIC",
            'clinicalDataBinCountFilter': ClinicalDataBinCountFilter,
            $queryParameters ? : any,
                $domain ? : string
        }): Promise < Array < DataBin >
        > {
            return this.fetchClinicalDataBinCountsUsingPOSTWithHttpInfo(parameters).then(function(response: request.Response) {
                return response.body;
            });
        };
    fetchClinicalDataCountsUsingPOSTURL(parameters: {
        'clinicalDataCountFilter': ClinicalDataCountFilter,
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/clinical-data-counts/fetch';

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
     * @param {} clinicalDataCountFilter - Clinical data count filter
     */
    fetchClinicalDataCountsUsingPOSTWithHttpInfo(parameters: {
        'clinicalDataCountFilter': ClinicalDataCountFilter,
        $queryParameters ? : any,
        $domain ? : string
    }): Promise < request.Response > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        const errorHandlers = this.errorHandlers;
        const request = this.request;
        let path = '/clinical-data-counts/fetch';
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

            if (parameters['clinicalDataCountFilter'] === undefined) {
                reject(new Error('Missing required  parameter: clinicalDataCountFilter'));
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
     * @param {} clinicalDataCountFilter - Clinical data count filter
     */
    fetchClinicalDataCountsUsingPOST(parameters: {
            'clinicalDataCountFilter': ClinicalDataCountFilter,
            $queryParameters ? : any,
            $domain ? : string
        }): Promise < Array < ClinicalDataCountItem >
        > {
            return this.fetchClinicalDataCountsUsingPOSTWithHttpInfo(parameters).then(function(response: request.Response) {
                return response.body;
            });
        };
    fetchClinicalDataDensityPlotUsingPOSTURL(parameters: {
        'xAxisAttributeId': string,
        'xAxisBinCount' ? : number,
        'xAxisStart' ? : number,
        'xAxisEnd' ? : number,
        'yAxisAttributeId': string,
        'yAxisBinCount' ? : number,
        'yAxisStart' ? : number,
        'yAxisEnd' ? : number,
        'clinicalDataType': "SAMPLE" | "PATIENT",
        'studyViewFilter': StudyViewFilter,
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/clinical-data-density-plot/fetch';
        if (parameters['xAxisAttributeId'] !== undefined) {
            queryParameters['xAxisAttributeId'] = parameters['xAxisAttributeId'];
        }

        if (parameters['xAxisBinCount'] !== undefined) {
            queryParameters['xAxisBinCount'] = parameters['xAxisBinCount'];
        }

        if (parameters['xAxisStart'] !== undefined) {
            queryParameters['xAxisStart'] = parameters['xAxisStart'];
        }

        if (parameters['xAxisEnd'] !== undefined) {
            queryParameters['xAxisEnd'] = parameters['xAxisEnd'];
        }

        if (parameters['yAxisAttributeId'] !== undefined) {
            queryParameters['yAxisAttributeId'] = parameters['yAxisAttributeId'];
        }

        if (parameters['yAxisBinCount'] !== undefined) {
            queryParameters['yAxisBinCount'] = parameters['yAxisBinCount'];
        }

        if (parameters['yAxisStart'] !== undefined) {
            queryParameters['yAxisStart'] = parameters['yAxisStart'];
        }

        if (parameters['yAxisEnd'] !== undefined) {
            queryParameters['yAxisEnd'] = parameters['yAxisEnd'];
        }

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
     * Fetch clinical data density plot bins by study view filter
     * @method
     * @name CBioPortalAPIInternal#fetchClinicalDataDensityPlotUsingPOST
     * @param {string} xAxisAttributeId - Clinical Attribute ID of the X axis
     * @param {integer} xAxisBinCount - Number of the bins in X axis
     * @param {number} xAxisStart - Starting point of the X axis, if different than smallest value
     * @param {number} xAxisEnd - Starting point of the X axis, if different than largest value
     * @param {string} yAxisAttributeId - Clinical Attribute ID of the Y axis
     * @param {integer} yAxisBinCount - Number of the bins in Y axis
     * @param {number} yAxisStart - Starting point of the Y axis, if different than smallest value
     * @param {number} yAxisEnd - Starting point of the Y axis, if different than largest value
     * @param {string} clinicalDataType - Clinical data type of both attributes
     * @param {} studyViewFilter - Study view filter
     */
    fetchClinicalDataDensityPlotUsingPOSTWithHttpInfo(parameters: {
        'xAxisAttributeId': string,
        'xAxisBinCount' ? : number,
        'xAxisStart' ? : number,
        'xAxisEnd' ? : number,
        'yAxisAttributeId': string,
        'yAxisBinCount' ? : number,
        'yAxisStart' ? : number,
        'yAxisEnd' ? : number,
        'clinicalDataType': "SAMPLE" | "PATIENT",
        'studyViewFilter': StudyViewFilter,
        $queryParameters ? : any,
        $domain ? : string
    }): Promise < request.Response > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        const errorHandlers = this.errorHandlers;
        const request = this.request;
        let path = '/clinical-data-density-plot/fetch';
        let body: any;
        let queryParameters: any = {};
        let headers: any = {};
        let form: any = {};
        return new Promise(function(resolve, reject) {
            headers['Accept'] = 'application/json';
            headers['Content-Type'] = 'application/json';

            if (parameters['xAxisAttributeId'] !== undefined) {
                queryParameters['xAxisAttributeId'] = parameters['xAxisAttributeId'];
            }

            if (parameters['xAxisAttributeId'] === undefined) {
                reject(new Error('Missing required  parameter: xAxisAttributeId'));
                return;
            }

            if (parameters['xAxisBinCount'] !== undefined) {
                queryParameters['xAxisBinCount'] = parameters['xAxisBinCount'];
            }

            if (parameters['xAxisStart'] !== undefined) {
                queryParameters['xAxisStart'] = parameters['xAxisStart'];
            }

            if (parameters['xAxisEnd'] !== undefined) {
                queryParameters['xAxisEnd'] = parameters['xAxisEnd'];
            }

            if (parameters['yAxisAttributeId'] !== undefined) {
                queryParameters['yAxisAttributeId'] = parameters['yAxisAttributeId'];
            }

            if (parameters['yAxisAttributeId'] === undefined) {
                reject(new Error('Missing required  parameter: yAxisAttributeId'));
                return;
            }

            if (parameters['yAxisBinCount'] !== undefined) {
                queryParameters['yAxisBinCount'] = parameters['yAxisBinCount'];
            }

            if (parameters['yAxisStart'] !== undefined) {
                queryParameters['yAxisStart'] = parameters['yAxisStart'];
            }

            if (parameters['yAxisEnd'] !== undefined) {
                queryParameters['yAxisEnd'] = parameters['yAxisEnd'];
            }

            if (parameters['clinicalDataType'] !== undefined) {
                queryParameters['clinicalDataType'] = parameters['clinicalDataType'];
            }

            if (parameters['clinicalDataType'] === undefined) {
                reject(new Error('Missing required  parameter: clinicalDataType'));
                return;
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
     * Fetch clinical data density plot bins by study view filter
     * @method
     * @name CBioPortalAPIInternal#fetchClinicalDataDensityPlotUsingPOST
     * @param {string} xAxisAttributeId - Clinical Attribute ID of the X axis
     * @param {integer} xAxisBinCount - Number of the bins in X axis
     * @param {number} xAxisStart - Starting point of the X axis, if different than smallest value
     * @param {number} xAxisEnd - Starting point of the X axis, if different than largest value
     * @param {string} yAxisAttributeId - Clinical Attribute ID of the Y axis
     * @param {integer} yAxisBinCount - Number of the bins in Y axis
     * @param {number} yAxisStart - Starting point of the Y axis, if different than smallest value
     * @param {number} yAxisEnd - Starting point of the Y axis, if different than largest value
     * @param {string} clinicalDataType - Clinical data type of both attributes
     * @param {} studyViewFilter - Study view filter
     */
    fetchClinicalDataDensityPlotUsingPOST(parameters: {
            'xAxisAttributeId': string,
            'xAxisBinCount' ? : number,
            'xAxisStart' ? : number,
            'xAxisEnd' ? : number,
            'yAxisAttributeId': string,
            'yAxisBinCount' ? : number,
            'yAxisStart' ? : number,
            'yAxisEnd' ? : number,
            'clinicalDataType': "SAMPLE" | "PATIENT",
            'studyViewFilter': StudyViewFilter,
            $queryParameters ? : any,
            $domain ? : string
        }): Promise < Array < DensityPlotBin >
        > {
            return this.fetchClinicalDataDensityPlotUsingPOSTWithHttpInfo(parameters).then(function(response: request.Response) {
                return response.body;
            });
        };
    fetchClinicalEnrichmentsUsingPOSTURL(parameters: {
        'groupFilter': GroupFilter,
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/clinical-data-enrichments/fetch';

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
     * Fetch clinical data enrichments for the sample groups
     * @method
     * @name CBioPortalAPIInternal#fetchClinicalEnrichmentsUsingPOST
     * @param {} groupFilter - List of altered and unaltered Sample/Patient IDs
     */
    fetchClinicalEnrichmentsUsingPOSTWithHttpInfo(parameters: {
        'groupFilter': GroupFilter,
        $queryParameters ? : any,
        $domain ? : string
    }): Promise < request.Response > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        const errorHandlers = this.errorHandlers;
        const request = this.request;
        let path = '/clinical-data-enrichments/fetch';
        let body: any;
        let queryParameters: any = {};
        let headers: any = {};
        let form: any = {};
        return new Promise(function(resolve, reject) {
            headers['Accept'] = 'application/json';
            headers['Content-Type'] = 'application/json';

            if (parameters['groupFilter'] !== undefined) {
                body = parameters['groupFilter'];
            }

            if (parameters['groupFilter'] === undefined) {
                reject(new Error('Missing required  parameter: groupFilter'));
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
     * Fetch clinical data enrichments for the sample groups
     * @method
     * @name CBioPortalAPIInternal#fetchClinicalEnrichmentsUsingPOST
     * @param {} groupFilter - List of altered and unaltered Sample/Patient IDs
     */
    fetchClinicalEnrichmentsUsingPOST(parameters: {
            'groupFilter': GroupFilter,
            $queryParameters ? : any,
            $domain ? : string
        }): Promise < Array < ClinicalDataEnrichment >
        > {
            return this.fetchClinicalEnrichmentsUsingPOSTWithHttpInfo(parameters).then(function(response: request.Response) {
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
    fetchCopyNumberEnrichmentsUsingPOSTURL(parameters: {
        'copyNumberEventType' ? : "HOMDEL" | "AMP",
        'enrichmentType' ? : "SAMPLE" | "PATIENT",
        'groups': Array < MolecularProfileCasesGroupFilter > ,
            $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/copy-number-enrichments/fetch';
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
     * @param {string} copyNumberEventType - Type of the copy number event
     * @param {string} enrichmentType - Type of the enrichment e.g. SAMPLE or PATIENT
     * @param {} groups - List of groups containing sample identifiers
     */
    fetchCopyNumberEnrichmentsUsingPOSTWithHttpInfo(parameters: {
        'copyNumberEventType' ? : "HOMDEL" | "AMP",
        'enrichmentType' ? : "SAMPLE" | "PATIENT",
        'groups': Array < MolecularProfileCasesGroupFilter > ,
            $queryParameters ? : any,
            $domain ? : string
    }): Promise < request.Response > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        const errorHandlers = this.errorHandlers;
        const request = this.request;
        let path = '/copy-number-enrichments/fetch';
        let body: any;
        let queryParameters: any = {};
        let headers: any = {};
        let form: any = {};
        return new Promise(function(resolve, reject) {
            headers['Accept'] = 'application/json';
            headers['Content-Type'] = 'application/json';

            if (parameters['copyNumberEventType'] !== undefined) {
                queryParameters['copyNumberEventType'] = parameters['copyNumberEventType'];
            }

            if (parameters['enrichmentType'] !== undefined) {
                queryParameters['enrichmentType'] = parameters['enrichmentType'];
            }

            if (parameters['groups'] !== undefined) {
                body = parameters['groups'];
            }

            if (parameters['groups'] === undefined) {
                reject(new Error('Missing required  parameter: groups'));
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
     * @param {string} copyNumberEventType - Type of the copy number event
     * @param {string} enrichmentType - Type of the enrichment e.g. SAMPLE or PATIENT
     * @param {} groups - List of groups containing sample identifiers
     */
    fetchCopyNumberEnrichmentsUsingPOST(parameters: {
            'copyNumberEventType' ? : "HOMDEL" | "AMP",
            'enrichmentType' ? : "SAMPLE" | "PATIENT",
            'groups': Array < MolecularProfileCasesGroupFilter > ,
                $queryParameters ? : any,
                $domain ? : string
        }): Promise < Array < AlterationEnrichment >
        > {
            return this.fetchCopyNumberEnrichmentsUsingPOSTWithHttpInfo(parameters).then(function(response: request.Response) {
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
    getAllDataAccessTokensUsingGETURL(parameters: {
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/data-access-tokens';

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
     * getAllDataAccessTokens
     * @method
     * @name CBioPortalAPIInternal#getAllDataAccessTokensUsingGET
     */
    getAllDataAccessTokensUsingGETWithHttpInfo(parameters: {
        $queryParameters ? : any,
            $domain ? : string
    }): Promise < request.Response > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        const errorHandlers = this.errorHandlers;
        const request = this.request;
        let path = '/data-access-tokens';
        let body: any;
        let queryParameters: any = {};
        let headers: any = {};
        let form: any = {};
        return new Promise(function(resolve, reject) {
            headers['Accept'] = '*/*';

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
     * getAllDataAccessTokens
     * @method
     * @name CBioPortalAPIInternal#getAllDataAccessTokensUsingGET
     */
    getAllDataAccessTokensUsingGET(parameters: {
            $queryParameters ? : any,
                $domain ? : string
        }): Promise < Array < DataAccessToken >
        > {
            return this.getAllDataAccessTokensUsingGETWithHttpInfo(parameters).then(function(response: request.Response) {
                return response.body;
            });
        };
    createDataAccessTokenUsingPOSTURL(parameters: {
        'allowRevocationOfOtherTokens' ? : boolean,
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/data-access-tokens';
        if (parameters['allowRevocationOfOtherTokens'] !== undefined) {
            queryParameters['allowRevocationOfOtherTokens'] = parameters['allowRevocationOfOtherTokens'];
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
     * createDataAccessToken
     * @method
     * @name CBioPortalAPIInternal#createDataAccessTokenUsingPOST
     * @param {boolean} allowRevocationOfOtherTokens - allowRevocationOfOtherTokens
     */
    createDataAccessTokenUsingPOSTWithHttpInfo(parameters: {
        'allowRevocationOfOtherTokens' ? : boolean,
        $queryParameters ? : any,
            $domain ? : string
    }): Promise < request.Response > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        const errorHandlers = this.errorHandlers;
        const request = this.request;
        let path = '/data-access-tokens';
        let body: any;
        let queryParameters: any = {};
        let headers: any = {};
        let form: any = {};
        return new Promise(function(resolve, reject) {
            headers['Accept'] = 'application/json';
            headers['Content-Type'] = 'application/json';

            if (parameters['allowRevocationOfOtherTokens'] !== undefined) {
                queryParameters['allowRevocationOfOtherTokens'] = parameters['allowRevocationOfOtherTokens'];
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
     * createDataAccessToken
     * @method
     * @name CBioPortalAPIInternal#createDataAccessTokenUsingPOST
     * @param {boolean} allowRevocationOfOtherTokens - allowRevocationOfOtherTokens
     */
    createDataAccessTokenUsingPOST(parameters: {
        'allowRevocationOfOtherTokens' ? : boolean,
        $queryParameters ? : any,
            $domain ? : string
    }): Promise < DataAccessToken > {
        return this.createDataAccessTokenUsingPOSTWithHttpInfo(parameters).then(function(response: request.Response) {
            return response.body;
        });
    };
    revokeAllDataAccessTokensUsingDELETEURL(parameters: {
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/data-access-tokens';

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
     * revokeAllDataAccessTokens
     * @method
     * @name CBioPortalAPIInternal#revokeAllDataAccessTokensUsingDELETE
     */
    revokeAllDataAccessTokensUsingDELETEWithHttpInfo(parameters: {
        $queryParameters ? : any,
            $domain ? : string
    }): Promise < request.Response > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        const errorHandlers = this.errorHandlers;
        const request = this.request;
        let path = '/data-access-tokens';
        let body: any;
        let queryParameters: any = {};
        let headers: any = {};
        let form: any = {};
        return new Promise(function(resolve, reject) {
            headers['Accept'] = '*/*';

            if (parameters.$queryParameters) {
                Object.keys(parameters.$queryParameters).forEach(function(parameterName) {
                    var parameter = parameters.$queryParameters[parameterName];
                    queryParameters[parameterName] = parameter;
                });
            }

            request('DELETE', domain + path, body, headers, queryParameters, form, reject, resolve, errorHandlers);

        });
    };

    /**
     * revokeAllDataAccessTokens
     * @method
     * @name CBioPortalAPIInternal#revokeAllDataAccessTokensUsingDELETE
     */
    revokeAllDataAccessTokensUsingDELETE(parameters: {
        $queryParameters ? : any,
            $domain ? : string
    }): Promise < any > {
        return this.revokeAllDataAccessTokensUsingDELETEWithHttpInfo(parameters).then(function(response: request.Response) {
            return response.body;
        });
    };
    getDataAccessTokenUsingGETURL(parameters: {
        'token': string,
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/data-access-tokens/{token}';

        path = path.replace('{token}', parameters['token'] + '');

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
     * getDataAccessToken
     * @method
     * @name CBioPortalAPIInternal#getDataAccessTokenUsingGET
     * @param {string} token - token
     */
    getDataAccessTokenUsingGETWithHttpInfo(parameters: {
        'token': string,
        $queryParameters ? : any,
        $domain ? : string
    }): Promise < request.Response > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        const errorHandlers = this.errorHandlers;
        const request = this.request;
        let path = '/data-access-tokens/{token}';
        let body: any;
        let queryParameters: any = {};
        let headers: any = {};
        let form: any = {};
        return new Promise(function(resolve, reject) {
            headers['Accept'] = '*/*';

            path = path.replace('{token}', parameters['token'] + '');

            if (parameters['token'] === undefined) {
                reject(new Error('Missing required  parameter: token'));
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
     * getDataAccessToken
     * @method
     * @name CBioPortalAPIInternal#getDataAccessTokenUsingGET
     * @param {string} token - token
     */
    getDataAccessTokenUsingGET(parameters: {
        'token': string,
        $queryParameters ? : any,
        $domain ? : string
    }): Promise < DataAccessToken > {
        return this.getDataAccessTokenUsingGETWithHttpInfo(parameters).then(function(response: request.Response) {
            return response.body;
        });
    };
    revokeDataAccessTokenUsingDELETEURL(parameters: {
        'token': string,
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/data-access-tokens/{token}';

        path = path.replace('{token}', parameters['token'] + '');

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
     * revokeDataAccessToken
     * @method
     * @name CBioPortalAPIInternal#revokeDataAccessTokenUsingDELETE
     * @param {string} token - token
     */
    revokeDataAccessTokenUsingDELETEWithHttpInfo(parameters: {
        'token': string,
        $queryParameters ? : any,
        $domain ? : string
    }): Promise < request.Response > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        const errorHandlers = this.errorHandlers;
        const request = this.request;
        let path = '/data-access-tokens/{token}';
        let body: any;
        let queryParameters: any = {};
        let headers: any = {};
        let form: any = {};
        return new Promise(function(resolve, reject) {
            headers['Accept'] = '*/*';

            path = path.replace('{token}', parameters['token'] + '');

            if (parameters['token'] === undefined) {
                reject(new Error('Missing required  parameter: token'));
                return;
            }

            if (parameters.$queryParameters) {
                Object.keys(parameters.$queryParameters).forEach(function(parameterName) {
                    var parameter = parameters.$queryParameters[parameterName];
                    queryParameters[parameterName] = parameter;
                });
            }

            request('DELETE', domain + path, body, headers, queryParameters, form, reject, resolve, errorHandlers);

        });
    };

    /**
     * revokeDataAccessToken
     * @method
     * @name CBioPortalAPIInternal#revokeDataAccessTokenUsingDELETE
     * @param {string} token - token
     */
    revokeDataAccessTokenUsingDELETE(parameters: {
        'token': string,
        $queryParameters ? : any,
        $domain ? : string
    }): Promise < any > {
        return this.revokeDataAccessTokenUsingDELETEWithHttpInfo(parameters).then(function(response: request.Response) {
            return response.body;
        });
    };
    fetchExpressionEnrichmentsUsingPOSTURL(parameters: {
        'enrichmentType' ? : "SAMPLE" | "PATIENT",
        'groups': Array < MolecularProfileCasesGroupFilter > ,
            $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/expression-enrichments/fetch';
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
     * @param {string} enrichmentType - Type of the enrichment e.g. SAMPLE or PATIENT
     * @param {} groups - List of groups containing sample and molecular profile identifiers
     */
    fetchExpressionEnrichmentsUsingPOSTWithHttpInfo(parameters: {
        'enrichmentType' ? : "SAMPLE" | "PATIENT",
        'groups': Array < MolecularProfileCasesGroupFilter > ,
            $queryParameters ? : any,
            $domain ? : string
    }): Promise < request.Response > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        const errorHandlers = this.errorHandlers;
        const request = this.request;
        let path = '/expression-enrichments/fetch';
        let body: any;
        let queryParameters: any = {};
        let headers: any = {};
        let form: any = {};
        return new Promise(function(resolve, reject) {
            headers['Accept'] = 'application/json';
            headers['Content-Type'] = 'application/json';

            if (parameters['enrichmentType'] !== undefined) {
                queryParameters['enrichmentType'] = parameters['enrichmentType'];
            }

            if (parameters['groups'] !== undefined) {
                body = parameters['groups'];
            }

            if (parameters['groups'] === undefined) {
                reject(new Error('Missing required  parameter: groups'));
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
     * @param {string} enrichmentType - Type of the enrichment e.g. SAMPLE or PATIENT
     * @param {} groups - List of groups containing sample and molecular profile identifiers
     */
    fetchExpressionEnrichmentsUsingPOST(parameters: {
            'enrichmentType' ? : "SAMPLE" | "PATIENT",
            'groups': Array < MolecularProfileCasesGroupFilter > ,
                $queryParameters ? : any,
                $domain ? : string
        }): Promise < Array < ExpressionEnrichment >
        > {
            return this.fetchExpressionEnrichmentsUsingPOSTWithHttpInfo(parameters).then(function(response: request.Response) {
                return response.body;
            });
        };
    fetchFilteredSamplesUsingPOSTURL(parameters: {
        'negateFilters' ? : boolean,
        'studyViewFilter': StudyViewFilter,
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/filtered-samples/fetch';
        if (parameters['negateFilters'] !== undefined) {
            queryParameters['negateFilters'] = parameters['negateFilters'];
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
     * Fetch sample IDs by study view filter
     * @method
     * @name CBioPortalAPIInternal#fetchFilteredSamplesUsingPOST
     * @param {boolean} negateFilters - Whether to negate the study view filters
     * @param {} studyViewFilter - Study view filter
     */
    fetchFilteredSamplesUsingPOSTWithHttpInfo(parameters: {
        'negateFilters' ? : boolean,
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

            if (parameters['negateFilters'] !== undefined) {
                queryParameters['negateFilters'] = parameters['negateFilters'];
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
     * Fetch sample IDs by study view filter
     * @method
     * @name CBioPortalAPIInternal#fetchFilteredSamplesUsingPOST
     * @param {boolean} negateFilters - Whether to negate the study view filters
     * @param {} studyViewFilter - Study view filter
     */
    fetchFilteredSamplesUsingPOST(parameters: {
            'negateFilters' ? : boolean,
            'studyViewFilter': StudyViewFilter,
            $queryParameters ? : any,
                $domain ? : string
        }): Promise < Array < Sample >
        > {
            return this.fetchFilteredSamplesUsingPOSTWithHttpInfo(parameters).then(function(response: request.Response) {
                return response.body;
            });
        };
    fetchFusionGenesUsingPOSTURL(parameters: {
        'studyViewFilter': StudyViewFilter,
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/fusion-genes/fetch';

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
     * Fetch fusion genes by study view filter
     * @method
     * @name CBioPortalAPIInternal#fetchFusionGenesUsingPOST
     * @param {} studyViewFilter - Study view filter
     */
    fetchFusionGenesUsingPOSTWithHttpInfo(parameters: {
        'studyViewFilter': StudyViewFilter,
        $queryParameters ? : any,
        $domain ? : string
    }): Promise < request.Response > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        const errorHandlers = this.errorHandlers;
        const request = this.request;
        let path = '/fusion-genes/fetch';
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
     * Fetch fusion genes by study view filter
     * @method
     * @name CBioPortalAPIInternal#fetchFusionGenesUsingPOST
     * @param {} studyViewFilter - Study view filter
     */
    fetchFusionGenesUsingPOST(parameters: {
            'studyViewFilter': StudyViewFilter,
            $queryParameters ? : any,
            $domain ? : string
        }): Promise < Array < MutationCountByGene >
        > {
            return this.fetchFusionGenesUsingPOSTWithHttpInfo(parameters).then(function(response: request.Response) {
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
    fetchTreatmentGeneticDataItemsUsingPOSTURL(parameters: {
        'geneticProfileId': string,
        'treatmentDataFilterCriteria': TreatmentDataFilterCriteria,
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/genetic-profiles/{geneticProfileId}/treatment-genetic-data/fetch';

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
     * Fetch treatment "genetic data" items (treatment response values) by profile Id, treatment Ids and sample Ids
     * @method
     * @name CBioPortalAPIInternal#fetchTreatmentGeneticDataItemsUsingPOST
     * @param {string} geneticProfileId - Genetic profile ID, e.g. study_es_0_treatment_ic50
     * @param {} treatmentDataFilterCriteria - Search parameters to return the values for a given set of samples and treatment items. treatmentIds: The list of identifiers (STABLE_ID) for the treatments of interest, e.g. 17-AAG. Use one of these if you want to specify a subset of samples:(1) sampleListId: Identifier of pre-defined sample list with samples to query, e.g. brca_tcga_all or (2) sampleIds: custom list of samples or patients to query, e.g. TCGA-BH-A1EO-01, TCGA-AR-A1AR-01
     */
    fetchTreatmentGeneticDataItemsUsingPOSTWithHttpInfo(parameters: {
        'geneticProfileId': string,
        'treatmentDataFilterCriteria': TreatmentDataFilterCriteria,
        $queryParameters ? : any,
        $domain ? : string
    }): Promise < request.Response > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        const errorHandlers = this.errorHandlers;
        const request = this.request;
        let path = '/genetic-profiles/{geneticProfileId}/treatment-genetic-data/fetch';
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

            if (parameters['treatmentDataFilterCriteria'] !== undefined) {
                body = parameters['treatmentDataFilterCriteria'];
            }

            if (parameters['treatmentDataFilterCriteria'] === undefined) {
                reject(new Error('Missing required  parameter: treatmentDataFilterCriteria'));
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
     * Fetch treatment "genetic data" items (treatment response values) by profile Id, treatment Ids and sample Ids
     * @method
     * @name CBioPortalAPIInternal#fetchTreatmentGeneticDataItemsUsingPOST
     * @param {string} geneticProfileId - Genetic profile ID, e.g. study_es_0_treatment_ic50
     * @param {} treatmentDataFilterCriteria - Search parameters to return the values for a given set of samples and treatment items. treatmentIds: The list of identifiers (STABLE_ID) for the treatments of interest, e.g. 17-AAG. Use one of these if you want to specify a subset of samples:(1) sampleListId: Identifier of pre-defined sample list with samples to query, e.g. brca_tcga_all or (2) sampleIds: custom list of samples or patients to query, e.g. TCGA-BH-A1EO-01, TCGA-AR-A1AR-01
     */
    fetchTreatmentGeneticDataItemsUsingPOST(parameters: {
            'geneticProfileId': string,
            'treatmentDataFilterCriteria': TreatmentDataFilterCriteria,
            $queryParameters ? : any,
            $domain ? : string
        }): Promise < Array < TreatmentMolecularData >
        > {
            return this.fetchTreatmentGeneticDataItemsUsingPOSTWithHttpInfo(parameters).then(function(response: request.Response) {
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
        'molecularProfileIdA': string,
        'molecularProfileIdB': string,
        'coExpressionFilter': CoExpressionFilter,
        'threshold' ? : number,
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/molecular-profiles/co-expressions/fetch';
        if (parameters['molecularProfileIdA'] !== undefined) {
            queryParameters['molecularProfileIdA'] = parameters['molecularProfileIdA'];
        }

        if (parameters['molecularProfileIdB'] !== undefined) {
            queryParameters['molecularProfileIdB'] = parameters['molecularProfileIdB'];
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
     * Calculates correlations between a genetic entity from a specific profile and another profile from the same study
     * @method
     * @name CBioPortalAPIInternal#fetchCoExpressionsUsingPOST
     * @param {string} molecularProfileIdA - Molecular Profile ID from the Genetic Entity referenced in the co-expression filter e.g. acc_tcga_rna_seq_v2_mrna
     * @param {string} molecularProfileIdB - Molecular Profile ID (can be the same as molecularProfileIdA) e.g. acc_tcga_rna_seq_v2_mrna
     * @param {} coExpressionFilter - List of Sample IDs/Sample List ID and Entrez Gene ID/Gene set ID
     * @param {number} threshold - Threshold
     */
    fetchCoExpressionsUsingPOSTWithHttpInfo(parameters: {
        'molecularProfileIdA': string,
        'molecularProfileIdB': string,
        'coExpressionFilter': CoExpressionFilter,
        'threshold' ? : number,
        $queryParameters ? : any,
        $domain ? : string
    }): Promise < request.Response > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        const errorHandlers = this.errorHandlers;
        const request = this.request;
        let path = '/molecular-profiles/co-expressions/fetch';
        let body: any;
        let queryParameters: any = {};
        let headers: any = {};
        let form: any = {};
        return new Promise(function(resolve, reject) {
            headers['Accept'] = 'application/json';
            headers['Content-Type'] = 'application/json';

            if (parameters['molecularProfileIdA'] !== undefined) {
                queryParameters['molecularProfileIdA'] = parameters['molecularProfileIdA'];
            }

            if (parameters['molecularProfileIdA'] === undefined) {
                reject(new Error('Missing required  parameter: molecularProfileIdA'));
                return;
            }

            if (parameters['molecularProfileIdB'] !== undefined) {
                queryParameters['molecularProfileIdB'] = parameters['molecularProfileIdB'];
            }

            if (parameters['molecularProfileIdB'] === undefined) {
                reject(new Error('Missing required  parameter: molecularProfileIdB'));
                return;
            }

            if (parameters['coExpressionFilter'] !== undefined) {
                body = parameters['coExpressionFilter'];
            }

            if (parameters['coExpressionFilter'] === undefined) {
                reject(new Error('Missing required  parameter: coExpressionFilter'));
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
     * Calculates correlations between a genetic entity from a specific profile and another profile from the same study
     * @method
     * @name CBioPortalAPIInternal#fetchCoExpressionsUsingPOST
     * @param {string} molecularProfileIdA - Molecular Profile ID from the Genetic Entity referenced in the co-expression filter e.g. acc_tcga_rna_seq_v2_mrna
     * @param {string} molecularProfileIdB - Molecular Profile ID (can be the same as molecularProfileIdA) e.g. acc_tcga_rna_seq_v2_mrna
     * @param {} coExpressionFilter - List of Sample IDs/Sample List ID and Entrez Gene ID/Gene set ID
     * @param {number} threshold - Threshold
     */
    fetchCoExpressionsUsingPOST(parameters: {
            'molecularProfileIdA': string,
            'molecularProfileIdB': string,
            'coExpressionFilter': CoExpressionFilter,
            'threshold' ? : number,
            $queryParameters ? : any,
            $domain ? : string
        }): Promise < Array < CoExpression >
        > {
            return this.fetchCoExpressionsUsingPOSTWithHttpInfo(parameters).then(function(response: request.Response) {
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
    fetchMutationEnrichmentsUsingPOSTURL(parameters: {
        'enrichmentType' ? : "SAMPLE" | "PATIENT",
        'groups': Array < MolecularProfileCasesGroupFilter > ,
            $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/mutation-enrichments/fetch';
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
     * @param {string} enrichmentType - Type of the enrichment e.g. SAMPLE or PATIENT
     * @param {} groups - List of groups containing sample identifiers
     */
    fetchMutationEnrichmentsUsingPOSTWithHttpInfo(parameters: {
        'enrichmentType' ? : "SAMPLE" | "PATIENT",
        'groups': Array < MolecularProfileCasesGroupFilter > ,
            $queryParameters ? : any,
            $domain ? : string
    }): Promise < request.Response > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        const errorHandlers = this.errorHandlers;
        const request = this.request;
        let path = '/mutation-enrichments/fetch';
        let body: any;
        let queryParameters: any = {};
        let headers: any = {};
        let form: any = {};
        return new Promise(function(resolve, reject) {
            headers['Accept'] = 'application/json';
            headers['Content-Type'] = 'application/json';

            if (parameters['enrichmentType'] !== undefined) {
                queryParameters['enrichmentType'] = parameters['enrichmentType'];
            }

            if (parameters['groups'] !== undefined) {
                body = parameters['groups'];
            }

            if (parameters['groups'] === undefined) {
                reject(new Error('Missing required  parameter: groups'));
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
     * @param {string} enrichmentType - Type of the enrichment e.g. SAMPLE or PATIENT
     * @param {} groups - List of groups containing sample identifiers
     */
    fetchMutationEnrichmentsUsingPOST(parameters: {
            'enrichmentType' ? : "SAMPLE" | "PATIENT",
            'groups': Array < MolecularProfileCasesGroupFilter > ,
                $queryParameters ? : any,
                $domain ? : string
        }): Promise < Array < AlterationEnrichment >
        > {
            return this.fetchMutationEnrichmentsUsingPOSTWithHttpInfo(parameters).then(function(response: request.Response) {
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
     * Fetch sample counts by study view filter
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
     * Fetch sample counts by study view filter
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
    getAllTreatmentsUsingGETURL(parameters: {
        'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
        'pageSize' ? : number,
        'pageNumber' ? : number,
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/treatments';
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
     * Get all treatments
     * @method
     * @name CBioPortalAPIInternal#getAllTreatmentsUsingGET
     * @param {string} projection - Level of detail of the response
     * @param {integer} pageSize - Page size of the result list
     * @param {integer} pageNumber - Page number of the result list
     */
    getAllTreatmentsUsingGETWithHttpInfo(parameters: {
        'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
        'pageSize' ? : number,
        'pageNumber' ? : number,
        $queryParameters ? : any,
            $domain ? : string
    }): Promise < request.Response > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        const errorHandlers = this.errorHandlers;
        const request = this.request;
        let path = '/treatments';
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
     * Get all treatments
     * @method
     * @name CBioPortalAPIInternal#getAllTreatmentsUsingGET
     * @param {string} projection - Level of detail of the response
     * @param {integer} pageSize - Page size of the result list
     * @param {integer} pageNumber - Page number of the result list
     */
    getAllTreatmentsUsingGET(parameters: {
            'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
            'pageSize' ? : number,
            'pageNumber' ? : number,
            $queryParameters ? : any,
                $domain ? : string
        }): Promise < Array < Treatment >
        > {
            return this.getAllTreatmentsUsingGETWithHttpInfo(parameters).then(function(response: request.Response) {
                return response.body;
            });
        };
    fetchTreatmentsUsingPOSTURL(parameters: {
        'treatmentFilter': TreatmentFilter,
        'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/treatments/fetch';

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
     * Fetch treatments
     * @method
     * @name CBioPortalAPIInternal#fetchTreatmentsUsingPOST
     * @param {} treatmentFilter - List of Treatment IDs or List of Study IDs (mutually exclusive)
     * @param {string} projection - Level of detail of the response
     */
    fetchTreatmentsUsingPOSTWithHttpInfo(parameters: {
        'treatmentFilter': TreatmentFilter,
        'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
        $queryParameters ? : any,
        $domain ? : string
    }): Promise < request.Response > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        const errorHandlers = this.errorHandlers;
        const request = this.request;
        let path = '/treatments/fetch';
        let body: any;
        let queryParameters: any = {};
        let headers: any = {};
        let form: any = {};
        return new Promise(function(resolve, reject) {
            headers['Accept'] = 'application/json';
            headers['Content-Type'] = 'application/json';

            if (parameters['treatmentFilter'] !== undefined) {
                body = parameters['treatmentFilter'];
            }

            if (parameters['treatmentFilter'] === undefined) {
                reject(new Error('Missing required  parameter: treatmentFilter'));
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
     * Fetch treatments
     * @method
     * @name CBioPortalAPIInternal#fetchTreatmentsUsingPOST
     * @param {} treatmentFilter - List of Treatment IDs or List of Study IDs (mutually exclusive)
     * @param {string} projection - Level of detail of the response
     */
    fetchTreatmentsUsingPOST(parameters: {
            'treatmentFilter': TreatmentFilter,
            'projection' ? : "ID" | "SUMMARY" | "DETAILED" | "META",
            $queryParameters ? : any,
            $domain ? : string
        }): Promise < Array < Treatment >
        > {
            return this.fetchTreatmentsUsingPOSTWithHttpInfo(parameters).then(function(response: request.Response) {
                return response.body;
            });
        };
    getTreatmentUsingGETURL(parameters: {
        'treatmentId': string,
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/treatments/{treatmentId}';

        path = path.replace('{treatmentId}', parameters['treatmentId'] + '');

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
     * Get a treatment by stable ID
     * @method
     * @name CBioPortalAPIInternal#getTreatmentUsingGET
     * @param {string} treatmentId - Treatment stable ID e.g. 17-AAG
     */
    getTreatmentUsingGETWithHttpInfo(parameters: {
        'treatmentId': string,
        $queryParameters ? : any,
        $domain ? : string
    }): Promise < request.Response > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        const errorHandlers = this.errorHandlers;
        const request = this.request;
        let path = '/treatments/{treatmentId}';
        let body: any;
        let queryParameters: any = {};
        let headers: any = {};
        let form: any = {};
        return new Promise(function(resolve, reject) {
            headers['Accept'] = 'application/json';

            path = path.replace('{treatmentId}', parameters['treatmentId'] + '');

            if (parameters['treatmentId'] === undefined) {
                reject(new Error('Missing required  parameter: treatmentId'));
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
     * Get a treatment by stable ID
     * @method
     * @name CBioPortalAPIInternal#getTreatmentUsingGET
     * @param {string} treatmentId - Treatment stable ID e.g. 17-AAG
     */
    getTreatmentUsingGET(parameters: {
        'treatmentId': string,
        $queryParameters ? : any,
        $domain ? : string
    }): Promise < Treatment > {
        return this.getTreatmentUsingGETWithHttpInfo(parameters).then(function(response: request.Response) {
            return response.body;
        });
    };
}