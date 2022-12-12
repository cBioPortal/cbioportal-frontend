import * as request from "superagent";

type CallbackHandler = (err: any, res ? : request.Response) => void;
export type AlterationCountByGene = {
    'entrezGeneId': number

        'hugoGeneSymbol': string

        'matchingGenePanelIds': Array < string >

        'numberOfAlteredCases': number

        'numberOfProfiledCases': number

        'qValue': number

        'totalCount': number

};
export type AlterationEnrichment = {
    'counts': Array < CountSummary >

        'cytoband': string

        'entrezGeneId': number

        'hugoGeneSymbol': string

        'pValue': number

};
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
export type CaseListDataCount = {
    'count': number

        'label': string

        'value': string

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

        'binMethod': "CUSTOM" | "GENERATE" | "MEDIAN" | "QUARTILE"

        'binsGeneratorConfig': BinsGeneratorConfig

        'customBins': Array < number >

        'disableLogScale': boolean

        'end': number

        'start': number

};
export type ClinicalDataCollection = {
    'patientClinicalData': Array < ClinicalData >

        'sampleClinicalData': Array < ClinicalData >

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
export type ClinicalDataEnrichment = {
    'clinicalAttribute': ClinicalAttribute

        'method': string

        'pValue': number

        'score': number

};
export type ClinicalDataFilter = {
    'attributeId': string

        'values': Array < DataFilterValue >

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
export type ClinicalViolinPlotBoxData = {
    'median': number

        'q1': number

        'q3': number

        'whiskerLower': number

        'whiskerUpper': number

};
export type ClinicalViolinPlotData = {
    'axisEnd': number

        'axisStart': number

        'rows': Array < ClinicalViolinPlotRowData >

};
export type ClinicalViolinPlotIndividualPoint = {
    'sampleId': string

        'studyId': string

        'value': number

};
export type ClinicalViolinPlotRowData = {
    'boxData': ClinicalViolinPlotBoxData

        'category': string

        'curveData': Array < number >

        'individualPoints': Array < ClinicalViolinPlotIndividualPoint >

        'numSamples': number

};
export type CoExpression = {
    'geneticEntityId': string

        'geneticEntityType': "GENE" | "GENERIC_ASSAY" | "GENESET" | "PHOSPHOPROTEIN"

        'pValue': number

        'spearmansCorrelation': number

};
export type CoExpressionFilter = {
    'entrezGeneId': number

        'genesetId': string

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
export type CopyNumberCountIdentifier = {
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
export type CustomDriverAnnotationReport = {
    'hasBinary': boolean

        'tiers': Array < string >

};
export type DataAccessToken = {
    'creation': string

        'expiration': string

        'token': string

        'username': string

};
export type DataFilterValue = {
    'end': number

        'start': number

        'value': string

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
export type DensityPlotData = {
    'bins': Array < DensityPlotBin >

        'pearsonCorr': number

        'spearmanCorr': number

};
export type GeneFilter = {
    'geneQueries': Array < Array < GeneFilterQuery >
        >

        'molecularProfileIds': Array < string >

};
export type GeneFilterQuery = {
    'alterations': Array < "AMP" | "DIPLOID" | "GAIN" | "HETLOSS" | "HOMDEL" >

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
export type GenericAssayDataBin = {
    'count': number

        'end': number

        'profileType': string

        'specialValue': string

        'stableId': string

        'start': number

};
export type GenericAssayDataBinCountFilter = {
    'genericAssayDataBinFilters': Array < GenericAssayDataBinFilter >

        'studyViewFilter': StudyViewFilter

};
export type GenericAssayDataBinFilter = {
    'binMethod': "CUSTOM" | "GENERATE" | "MEDIAN" | "QUARTILE"

        'binsGeneratorConfig': BinsGeneratorConfig

        'customBins': Array < number >

        'disableLogScale': boolean

        'end': number

        'profileType': string

        'stableId': string

        'start': number

};
export type GenericAssayDataCount = {
    'count': number

        'value': string

};
export type GenericAssayDataCountFilter = {
    'genericAssayDataFilters': Array < GenericAssayDataFilter >

        'studyViewFilter': StudyViewFilter

};
export type GenericAssayDataCountItem = {
    'counts': Array < GenericAssayDataCount >

        'stableId': string

};
export type GenericAssayDataFilter = {
    'profileType': string

        'stableId': string

        'values': Array < DataFilterValue >

};
export type GenericAssayEnrichment = {
    'genericEntityMetaProperties': {}

    'groupsStatistics': Array < GroupStatistics >

        'name': string

        'pValue': number

        'stableId': string

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
export type GenomicDataBin = {
    'count': number

        'end': number

        'hugoGeneSymbol': string

        'profileType': string

        'specialValue': string

        'start': number

};
export type GenomicDataBinCountFilter = {
    'genomicDataBinFilters': Array < GenomicDataBinFilter >

        'studyViewFilter': StudyViewFilter

};
export type GenomicDataBinFilter = {
    'binMethod': "CUSTOM" | "GENERATE" | "MEDIAN" | "QUARTILE"

        'binsGeneratorConfig': BinsGeneratorConfig

        'customBins': Array < number >

        'disableLogScale': boolean

        'end': number

        'hugoGeneSymbol': string

        'profileType': string

        'start': number

};
export type GenomicDataCount = {
    'count': number

        'label': string

        'value': string

};
export type GenomicDataFilter = {
    'hugoGeneSymbol': string

        'profileType': string

        'values': Array < DataFilterValue >

};
export type GenomicEnrichment = {
    'cytoband': string

        'entrezGeneId': number

        'groupsStatistics': Array < GroupStatistics >

        'hugoGeneSymbol': string

        'pValue': number

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
export type MolecularProfileCaseIdentifier = {
    'caseId': string

        'molecularProfileId': string

};
export type MolecularProfileCasesGroupAndAlterationTypeFilter = {
    'alterationEventTypes': AlterationFilter

        'molecularProfileCasesGroupFilter': Array < MolecularProfileCasesGroupFilter >

};
export type MolecularProfileCasesGroupFilter = {
    'molecularProfileCaseIdentifiers': Array < MolecularProfileCaseIdentifier >

        'name': string

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
export type MutationCountByPosition = {
    'count': number

        'entrezGeneId': number

        'proteinPosEnd': number

        'proteinPosStart': number

};
export type MutationPositionIdentifier = {
    'entrezGeneId': number

        'proteinPosEnd': number

        'proteinPosStart': number

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
export type OredPatientTreatmentFilters = {
    'filters': Array < PatientTreatmentFilter >

};
export type OredSampleTreatmentFilters = {
    'filters': Array < SampleTreatmentFilter >

};
export type PatientTreatmentFilter = {
    'treatment': string

};
export type ReferenceGenomeGene = {
    'chromosome': string

        'cytoband': string

        'end': number

        'entrezGeneId': number

        'hugoGeneSymbol': string

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

        'resourceType': "PATIENT" | "SAMPLE" | "STUDY"

        'studyId': string

};
export type Sample = {
    'copyNumberSegmentPresent': boolean

        'patientId': string

        'sampleId': string

        'sampleType': "BLOOD_NORMAL" | "METASTATIC" | "PRIMARY_BLOOD_TUMOR" | "PRIMARY_SOLID_TUMOR" | "RECURRENT_BLOOD_TUMOR" | "RECURRENT_SOLID_TUMOR" | "SOLID_NORMAL"

        'sequenced': boolean

        'studyId': string

        'uniquePatientKey': string

        'uniqueSampleKey': string

};
export type SampleIdentifier = {
    'sampleId': string

        'studyId': string

};
export type SampleMolecularIdentifier = {
    'molecularProfileId': string

        'sampleId': string

};
export type SampleTreatmentFilter = {
    'time': "Post" | "Pre"

        'treatment': string

};
export type StructuralVariant = {
    'annotation': string

        'breakpointType': string

        'comments': string

        'connectionType': string

        'dnaSupport': string

        'driverFilter': string

        'driverFilterAnn': string

        'driverTiersFilter': string

        'driverTiersFilterAnn': string

        'eventInfo': string

        'length': number

        'molecularProfileId': string

        'namespaceColumns': {}

        'ncbiBuild': string

        'normalPairedEndReadCount': number

        'normalReadCount': number

        'normalSplitReadCount': number

        'normalVariantCount': number

        'patientId': string

        'rnaSupport': string

        'sampleId': string

        'site1Chromosome': string

        'site1Contig': string

        'site1Description': string

        'site1EnsemblTranscriptId': string

        'site1EntrezGeneId': number

        'site1HugoSymbol': string

        'site1Position': number

        'site1Region': string

        'site1RegionNumber': number

        'site2Chromosome': string

        'site2Contig': string

        'site2Description': string

        'site2EffectOnFrame': string

        'site2EnsemblTranscriptId': string

        'site2EntrezGeneId': number

        'site2HugoSymbol': string

        'site2Position': number

        'site2Region': string

        'site2RegionNumber': number

        'studyId': string

        'svStatus': string

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
export type StudyViewFilter = {
    'alterationFilter': AlterationFilter

        'caseLists': Array < Array < string >
        >

        'clinicalDataFilters': Array < ClinicalDataFilter >

        'customDataFilters': Array < ClinicalDataFilter >

        'geneFilters': Array < GeneFilter >

        'genericAssayDataFilters': Array < GenericAssayDataFilter >

        'genomicDataFilters': Array < GenomicDataFilter >

        'genomicProfiles': Array < Array < string >
        >

        'patientTreatmentFilters': AndedPatientTreatmentFilters

        'patientTreatmentGroupFilters': AndedPatientTreatmentFilters

        'patientTreatmentTargetFilters': AndedPatientTreatmentFilters

        'sampleIdentifiers': Array < SampleIdentifier >

        'sampleTreatmentFilters': AndedSampleTreatmentFilters

        'sampleTreatmentGroupFilters': AndedSampleTreatmentFilters

        'sampleTreatmentTargetFilters': AndedSampleTreatmentFilters

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
 * A web service for supplying JSON formatted data to cBioPortal clients. Please note that interal API is currently in beta and subject to change.
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

    fetchAlterationEnrichmentsUsingPOSTURL(parameters: {
        'enrichmentType' ? : "PATIENT" | "SAMPLE",
        'groupsAndAlterationTypes': MolecularProfileCasesGroupAndAlterationTypeFilter,
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/alteration-enrichments/fetch';
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
     * Fetch alteration enrichments in molecular profiles
     * @method
     * @name CBioPortalAPIInternal#fetchAlterationEnrichmentsUsingPOST
     * @param {string} enrichmentType - Type of the enrichment e.g. SAMPLE or PATIENT
     * @param {} groupsAndAlterationTypes - List of groups containing sample identifiers and list of Alteration Types
     */
    fetchAlterationEnrichmentsUsingPOSTWithHttpInfo(parameters: {
        'enrichmentType' ? : "PATIENT" | "SAMPLE",
        'groupsAndAlterationTypes': MolecularProfileCasesGroupAndAlterationTypeFilter,
        $queryParameters ? : any,
            $domain ? : string
    }): Promise < request.Response > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        const errorHandlers = this.errorHandlers;
        const request = this.request;
        let path = '/alteration-enrichments/fetch';
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

            if (parameters['groupsAndAlterationTypes'] !== undefined) {
                body = parameters['groupsAndAlterationTypes'];
            }

            if (parameters['groupsAndAlterationTypes'] === undefined) {
                reject(new Error('Missing required  parameter: groupsAndAlterationTypes'));
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
     * Fetch alteration enrichments in molecular profiles
     * @method
     * @name CBioPortalAPIInternal#fetchAlterationEnrichmentsUsingPOST
     * @param {string} enrichmentType - Type of the enrichment e.g. SAMPLE or PATIENT
     * @param {} groupsAndAlterationTypes - List of groups containing sample identifiers and list of Alteration Types
     */
    fetchAlterationEnrichmentsUsingPOST(parameters: {
            'enrichmentType' ? : "PATIENT" | "SAMPLE",
            'groupsAndAlterationTypes': MolecularProfileCasesGroupAndAlterationTypeFilter,
            $queryParameters ? : any,
                $domain ? : string
        }): Promise < Array < AlterationEnrichment >
        > {
            return this.fetchAlterationEnrichmentsUsingPOSTWithHttpInfo(parameters).then(function(response: request.Response) {
                return response.body;
            });
        };
    clearAllCachesUsingDELETEURL(parameters: {
        'springManagedCache' ? : boolean,
        'xApiKey': string,
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/cache';
        if (parameters['springManagedCache'] !== undefined) {
            queryParameters['springManagedCache'] = parameters['springManagedCache'];
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
     * Clear and reinitialize caches
     * @method
     * @name CBioPortalAPIInternal#clearAllCachesUsingDELETE
     * @param {boolean} springManagedCache - Clear Spring-managed caches
     * @param {string} xApiKey - Secret API key passed in HTTP header. The key is configured in portal.properties of the portal instance.
     */
    clearAllCachesUsingDELETEWithHttpInfo(parameters: {
        'springManagedCache' ? : boolean,
        'xApiKey': string,
        $queryParameters ? : any,
            $domain ? : string
    }): Promise < request.Response > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        const errorHandlers = this.errorHandlers;
        const request = this.request;
        let path = '/cache';
        let body: any;
        let queryParameters: any = {};
        let headers: any = {};
        let form: any = {};
        return new Promise(function(resolve, reject) {
            headers['Accept'] = 'text/plain';

            if (parameters['springManagedCache'] !== undefined) {
                queryParameters['springManagedCache'] = parameters['springManagedCache'];
            }

            if (parameters['xApiKey'] !== undefined) {
                headers['X-API-KEY'] = parameters['xApiKey'];
            }

            if (parameters['xApiKey'] === undefined) {
                reject(new Error('Missing required  parameter: xApiKey'));
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
     * Clear and reinitialize caches
     * @method
     * @name CBioPortalAPIInternal#clearAllCachesUsingDELETE
     * @param {boolean} springManagedCache - Clear Spring-managed caches
     * @param {string} xApiKey - Secret API key passed in HTTP header. The key is configured in portal.properties of the portal instance.
     */
    clearAllCachesUsingDELETE(parameters: {
        'springManagedCache' ? : boolean,
        'xApiKey': string,
        $queryParameters ? : any,
            $domain ? : string
    }): Promise < string > {
        return this.clearAllCachesUsingDELETEWithHttpInfo(parameters).then(function(response: request.Response) {
            return response.body;
        });
    };
    clearCachesForStudyUsingDELETEURL(parameters: {
        'springManagedCache' ? : boolean,
        'studyId': string,
        'xApiKey': string,
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/cache/{studyId}';
        if (parameters['springManagedCache'] !== undefined) {
            queryParameters['springManagedCache'] = parameters['springManagedCache'];
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
     * Clear and reinitialize caches after import/removal/update of a study
     * @method
     * @name CBioPortalAPIInternal#clearCachesForStudyUsingDELETE
     * @param {boolean} springManagedCache - Clear Spring-managed caches
     * @param {string} studyId - studyId
     * @param {string} xApiKey - Secret API key passed in HTTP header. The key is configured in portal.properties of the portal instance.
     */
    clearCachesForStudyUsingDELETEWithHttpInfo(parameters: {
        'springManagedCache' ? : boolean,
        'studyId': string,
        'xApiKey': string,
        $queryParameters ? : any,
            $domain ? : string
    }): Promise < request.Response > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        const errorHandlers = this.errorHandlers;
        const request = this.request;
        let path = '/cache/{studyId}';
        let body: any;
        let queryParameters: any = {};
        let headers: any = {};
        let form: any = {};
        return new Promise(function(resolve, reject) {
            headers['Accept'] = 'text/plain';

            if (parameters['springManagedCache'] !== undefined) {
                queryParameters['springManagedCache'] = parameters['springManagedCache'];
            }

            path = path.replace('{studyId}', parameters['studyId'] + '');

            if (parameters['studyId'] === undefined) {
                reject(new Error('Missing required  parameter: studyId'));
                return;
            }

            if (parameters['xApiKey'] !== undefined) {
                headers['X-API-KEY'] = parameters['xApiKey'];
            }

            if (parameters['xApiKey'] === undefined) {
                reject(new Error('Missing required  parameter: xApiKey'));
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
     * Clear and reinitialize caches after import/removal/update of a study
     * @method
     * @name CBioPortalAPIInternal#clearCachesForStudyUsingDELETE
     * @param {boolean} springManagedCache - Clear Spring-managed caches
     * @param {string} studyId - studyId
     * @param {string} xApiKey - Secret API key passed in HTTP header. The key is configured in portal.properties of the portal instance.
     */
    clearCachesForStudyUsingDELETE(parameters: {
        'springManagedCache' ? : boolean,
        'studyId': string,
        'xApiKey': string,
        $queryParameters ? : any,
            $domain ? : string
    }): Promise < string > {
        return this.clearCachesForStudyUsingDELETEWithHttpInfo(parameters).then(function(response: request.Response) {
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
     * @name CBioPortalAPIInternal#getClinicalAttributeCountsUsingPOST
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
     * @name CBioPortalAPIInternal#getClinicalAttributeCountsUsingPOST
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
    fetchClinicalDataBinCountsUsingPOSTURL(parameters: {
        'clinicalDataBinCountFilter': ClinicalDataBinCountFilter,
        'dataBinMethod' ? : "DYNAMIC" | "STATIC",
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
     * @param {} clinicalDataBinCountFilter - Clinical data bin count filter
     * @param {string} dataBinMethod - Method for data binning
     */
    fetchClinicalDataBinCountsUsingPOSTWithHttpInfo(parameters: {
        'clinicalDataBinCountFilter': ClinicalDataBinCountFilter,
        'dataBinMethod' ? : "DYNAMIC" | "STATIC",
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

            if (parameters['clinicalDataBinCountFilter'] !== undefined) {
                body = parameters['clinicalDataBinCountFilter'];
            }

            if (parameters['clinicalDataBinCountFilter'] === undefined) {
                reject(new Error('Missing required  parameter: clinicalDataBinCountFilter'));
                return;
            }

            if (parameters['dataBinMethod'] !== undefined) {
                queryParameters['dataBinMethod'] = parameters['dataBinMethod'];
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
     * @param {} clinicalDataBinCountFilter - Clinical data bin count filter
     * @param {string} dataBinMethod - Method for data binning
     */
    fetchClinicalDataBinCountsUsingPOST(parameters: {
            'clinicalDataBinCountFilter': ClinicalDataBinCountFilter,
            'dataBinMethod' ? : "DYNAMIC" | "STATIC",
            $queryParameters ? : any,
            $domain ? : string
        }): Promise < Array < ClinicalDataBin >
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
        'studyViewFilter': StudyViewFilter,
        'xAxisAttributeId': string,
        'xAxisBinCount' ? : number,
        'xAxisEnd' ? : number,
        'xAxisLogScale' ? : boolean,
        'xAxisStart' ? : number,
        'yAxisAttributeId': string,
        'yAxisBinCount' ? : number,
        'yAxisEnd' ? : number,
        'yAxisLogScale' ? : boolean,
        'yAxisStart' ? : number,
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

        if (parameters['xAxisEnd'] !== undefined) {
            queryParameters['xAxisEnd'] = parameters['xAxisEnd'];
        }

        if (parameters['xAxisLogScale'] !== undefined) {
            queryParameters['xAxisLogScale'] = parameters['xAxisLogScale'];
        }

        if (parameters['xAxisStart'] !== undefined) {
            queryParameters['xAxisStart'] = parameters['xAxisStart'];
        }

        if (parameters['yAxisAttributeId'] !== undefined) {
            queryParameters['yAxisAttributeId'] = parameters['yAxisAttributeId'];
        }

        if (parameters['yAxisBinCount'] !== undefined) {
            queryParameters['yAxisBinCount'] = parameters['yAxisBinCount'];
        }

        if (parameters['yAxisEnd'] !== undefined) {
            queryParameters['yAxisEnd'] = parameters['yAxisEnd'];
        }

        if (parameters['yAxisLogScale'] !== undefined) {
            queryParameters['yAxisLogScale'] = parameters['yAxisLogScale'];
        }

        if (parameters['yAxisStart'] !== undefined) {
            queryParameters['yAxisStart'] = parameters['yAxisStart'];
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
     * @param {} studyViewFilter - Study view filter
     * @param {string} xAxisAttributeId - Clinical Attribute ID of the X axis
     * @param {integer} xAxisBinCount - Number of the bins in X axis
     * @param {number} xAxisEnd - Starting point of the X axis, if different than largest value
     * @param {boolean} xAxisLogScale - Use log scale for X axis
     * @param {number} xAxisStart - Starting point of the X axis, if different than smallest value
     * @param {string} yAxisAttributeId - Clinical Attribute ID of the Y axis
     * @param {integer} yAxisBinCount - Number of the bins in Y axis
     * @param {number} yAxisEnd - Starting point of the Y axis, if different than largest value
     * @param {boolean} yAxisLogScale - Use log scale for Y axis
     * @param {number} yAxisStart - Starting point of the Y axis, if different than smallest value
     */
    fetchClinicalDataDensityPlotUsingPOSTWithHttpInfo(parameters: {
        'studyViewFilter': StudyViewFilter,
        'xAxisAttributeId': string,
        'xAxisBinCount' ? : number,
        'xAxisEnd' ? : number,
        'xAxisLogScale' ? : boolean,
        'xAxisStart' ? : number,
        'yAxisAttributeId': string,
        'yAxisBinCount' ? : number,
        'yAxisEnd' ? : number,
        'yAxisLogScale' ? : boolean,
        'yAxisStart' ? : number,
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

            if (parameters['studyViewFilter'] !== undefined) {
                body = parameters['studyViewFilter'];
            }

            if (parameters['studyViewFilter'] === undefined) {
                reject(new Error('Missing required  parameter: studyViewFilter'));
                return;
            }

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

            if (parameters['xAxisEnd'] !== undefined) {
                queryParameters['xAxisEnd'] = parameters['xAxisEnd'];
            }

            if (parameters['xAxisLogScale'] !== undefined) {
                queryParameters['xAxisLogScale'] = parameters['xAxisLogScale'];
            }

            if (parameters['xAxisStart'] !== undefined) {
                queryParameters['xAxisStart'] = parameters['xAxisStart'];
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

            if (parameters['yAxisEnd'] !== undefined) {
                queryParameters['yAxisEnd'] = parameters['yAxisEnd'];
            }

            if (parameters['yAxisLogScale'] !== undefined) {
                queryParameters['yAxisLogScale'] = parameters['yAxisLogScale'];
            }

            if (parameters['yAxisStart'] !== undefined) {
                queryParameters['yAxisStart'] = parameters['yAxisStart'];
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
     * @param {} studyViewFilter - Study view filter
     * @param {string} xAxisAttributeId - Clinical Attribute ID of the X axis
     * @param {integer} xAxisBinCount - Number of the bins in X axis
     * @param {number} xAxisEnd - Starting point of the X axis, if different than largest value
     * @param {boolean} xAxisLogScale - Use log scale for X axis
     * @param {number} xAxisStart - Starting point of the X axis, if different than smallest value
     * @param {string} yAxisAttributeId - Clinical Attribute ID of the Y axis
     * @param {integer} yAxisBinCount - Number of the bins in Y axis
     * @param {number} yAxisEnd - Starting point of the Y axis, if different than largest value
     * @param {boolean} yAxisLogScale - Use log scale for Y axis
     * @param {number} yAxisStart - Starting point of the Y axis, if different than smallest value
     */
    fetchClinicalDataDensityPlotUsingPOST(parameters: {
        'studyViewFilter': StudyViewFilter,
        'xAxisAttributeId': string,
        'xAxisBinCount' ? : number,
        'xAxisEnd' ? : number,
        'xAxisLogScale' ? : boolean,
        'xAxisStart' ? : number,
        'yAxisAttributeId': string,
        'yAxisBinCount' ? : number,
        'yAxisEnd' ? : number,
        'yAxisLogScale' ? : boolean,
        'yAxisStart' ? : number,
        $queryParameters ? : any,
        $domain ? : string
    }): Promise < DensityPlotData > {
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
    fetchClinicalDataClinicalTableUsingPOSTURL(parameters: {
        'direction' ? : "ASC" | "DESC",
        'pageNumber' ? : number,
        'pageSize' ? : number,
        'searchTerm' ? : string,
        'sortBy' ? : "clinicalAttributeId" | "value",
        'studyViewFilter': StudyViewFilter,
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/clinical-data-table/fetch';
        if (parameters['direction'] !== undefined) {
            queryParameters['direction'] = parameters['direction'];
        }

        if (parameters['pageNumber'] !== undefined) {
            queryParameters['pageNumber'] = parameters['pageNumber'];
        }

        if (parameters['pageSize'] !== undefined) {
            queryParameters['pageSize'] = parameters['pageSize'];
        }

        if (parameters['searchTerm'] !== undefined) {
            queryParameters['searchTerm'] = parameters['searchTerm'];
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
     * Fetch clinical data for the Clinical Tab of Study View
     * @method
     * @name CBioPortalAPIInternal#fetchClinicalDataClinicalTableUsingPOST
     * @param {string} direction - Direction of the sort
     * @param {integer} pageNumber - Page number of the result list
     * @param {integer} pageSize - Page size of the result list
     * @param {string} searchTerm - Search term to filter sample rows. Samples are returned with a partial match to the search term for any sample clinical attribute.
     * @param {string} sortBy - Name of the property that the result list is sorted by
     * @param {} studyViewFilter - Study view filter
     */
    fetchClinicalDataClinicalTableUsingPOSTWithHttpInfo(parameters: {
        'direction' ? : "ASC" | "DESC",
        'pageNumber' ? : number,
        'pageSize' ? : number,
        'searchTerm' ? : string,
        'sortBy' ? : "clinicalAttributeId" | "value",
        'studyViewFilter': StudyViewFilter,
        $queryParameters ? : any,
            $domain ? : string
    }): Promise < request.Response > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        const errorHandlers = this.errorHandlers;
        const request = this.request;
        let path = '/clinical-data-table/fetch';
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

            if (parameters['pageNumber'] !== undefined) {
                queryParameters['pageNumber'] = parameters['pageNumber'];
            }

            if (parameters['pageSize'] !== undefined) {
                queryParameters['pageSize'] = parameters['pageSize'];
            }

            if (parameters['searchTerm'] !== undefined) {
                queryParameters['searchTerm'] = parameters['searchTerm'];
            }

            if (parameters['sortBy'] !== undefined) {
                queryParameters['sortBy'] = parameters['sortBy'];
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
     * Fetch clinical data for the Clinical Tab of Study View
     * @method
     * @name CBioPortalAPIInternal#fetchClinicalDataClinicalTableUsingPOST
     * @param {string} direction - Direction of the sort
     * @param {integer} pageNumber - Page number of the result list
     * @param {integer} pageSize - Page size of the result list
     * @param {string} searchTerm - Search term to filter sample rows. Samples are returned with a partial match to the search term for any sample clinical attribute.
     * @param {string} sortBy - Name of the property that the result list is sorted by
     * @param {} studyViewFilter - Study view filter
     */
    fetchClinicalDataClinicalTableUsingPOST(parameters: {
        'direction' ? : "ASC" | "DESC",
        'pageNumber' ? : number,
        'pageSize' ? : number,
        'searchTerm' ? : string,
        'sortBy' ? : "clinicalAttributeId" | "value",
        'studyViewFilter': StudyViewFilter,
        $queryParameters ? : any,
            $domain ? : string
    }): Promise < ClinicalDataCollection > {
        return this.fetchClinicalDataClinicalTableUsingPOSTWithHttpInfo(parameters).then(function(response: request.Response) {
            return response.body;
        });
    };
    fetchClinicalDataViolinPlotsUsingPOSTURL(parameters: {
        'axisEnd' ? : number,
        'axisStart' ? : number,
        'categoricalAttributeId': string,
        'logScale' ? : boolean,
        'numCurvePoints' ? : number,
        'numericalAttributeId': string,
        'sigmaMultiplier' ? : number,
        'studyViewFilter': StudyViewFilter,
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/clinical-data-violin-plots/fetch';
        if (parameters['axisEnd'] !== undefined) {
            queryParameters['axisEnd'] = parameters['axisEnd'];
        }

        if (parameters['axisStart'] !== undefined) {
            queryParameters['axisStart'] = parameters['axisStart'];
        }

        if (parameters['categoricalAttributeId'] !== undefined) {
            queryParameters['categoricalAttributeId'] = parameters['categoricalAttributeId'];
        }

        if (parameters['logScale'] !== undefined) {
            queryParameters['logScale'] = parameters['logScale'];
        }

        if (parameters['numCurvePoints'] !== undefined) {
            queryParameters['numCurvePoints'] = parameters['numCurvePoints'];
        }

        if (parameters['numericalAttributeId'] !== undefined) {
            queryParameters['numericalAttributeId'] = parameters['numericalAttributeId'];
        }

        if (parameters['sigmaMultiplier'] !== undefined) {
            queryParameters['sigmaMultiplier'] = parameters['sigmaMultiplier'];
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
     * Fetch violin plot curves per categorical clinical data value, filtered by study view filter
     * @method
     * @name CBioPortalAPIInternal#fetchClinicalDataViolinPlotsUsingPOST
     * @param {number} axisEnd - Ending point  of the violin plot axis, if different than largest value
     * @param {number} axisStart - Starting point of the violin plot axis, if different than smallest value
     * @param {string} categoricalAttributeId - Clinical Attribute ID of the categorical attribute
     * @param {boolean} logScale - Use log scale for the numerical attribute
     * @param {number} numCurvePoints - Number of points in the curve
     * @param {string} numericalAttributeId - Clinical Attribute ID of the numerical attribute
     * @param {number} sigmaMultiplier - Sigma stepsize multiplier
     * @param {} studyViewFilter - Study view filter
     */
    fetchClinicalDataViolinPlotsUsingPOSTWithHttpInfo(parameters: {
        'axisEnd' ? : number,
        'axisStart' ? : number,
        'categoricalAttributeId': string,
        'logScale' ? : boolean,
        'numCurvePoints' ? : number,
        'numericalAttributeId': string,
        'sigmaMultiplier' ? : number,
        'studyViewFilter': StudyViewFilter,
        $queryParameters ? : any,
            $domain ? : string
    }): Promise < request.Response > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        const errorHandlers = this.errorHandlers;
        const request = this.request;
        let path = '/clinical-data-violin-plots/fetch';
        let body: any;
        let queryParameters: any = {};
        let headers: any = {};
        let form: any = {};
        return new Promise(function(resolve, reject) {
            headers['Accept'] = 'application/json';
            headers['Content-Type'] = 'application/json';

            if (parameters['axisEnd'] !== undefined) {
                queryParameters['axisEnd'] = parameters['axisEnd'];
            }

            if (parameters['axisStart'] !== undefined) {
                queryParameters['axisStart'] = parameters['axisStart'];
            }

            if (parameters['categoricalAttributeId'] !== undefined) {
                queryParameters['categoricalAttributeId'] = parameters['categoricalAttributeId'];
            }

            if (parameters['categoricalAttributeId'] === undefined) {
                reject(new Error('Missing required  parameter: categoricalAttributeId'));
                return;
            }

            if (parameters['logScale'] !== undefined) {
                queryParameters['logScale'] = parameters['logScale'];
            }

            if (parameters['numCurvePoints'] !== undefined) {
                queryParameters['numCurvePoints'] = parameters['numCurvePoints'];
            }

            if (parameters['numericalAttributeId'] !== undefined) {
                queryParameters['numericalAttributeId'] = parameters['numericalAttributeId'];
            }

            if (parameters['numericalAttributeId'] === undefined) {
                reject(new Error('Missing required  parameter: numericalAttributeId'));
                return;
            }

            if (parameters['sigmaMultiplier'] !== undefined) {
                queryParameters['sigmaMultiplier'] = parameters['sigmaMultiplier'];
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
     * Fetch violin plot curves per categorical clinical data value, filtered by study view filter
     * @method
     * @name CBioPortalAPIInternal#fetchClinicalDataViolinPlotsUsingPOST
     * @param {number} axisEnd - Ending point  of the violin plot axis, if different than largest value
     * @param {number} axisStart - Starting point of the violin plot axis, if different than smallest value
     * @param {string} categoricalAttributeId - Clinical Attribute ID of the categorical attribute
     * @param {boolean} logScale - Use log scale for the numerical attribute
     * @param {number} numCurvePoints - Number of points in the curve
     * @param {string} numericalAttributeId - Clinical Attribute ID of the numerical attribute
     * @param {number} sigmaMultiplier - Sigma stepsize multiplier
     * @param {} studyViewFilter - Study view filter
     */
    fetchClinicalDataViolinPlotsUsingPOST(parameters: {
        'axisEnd' ? : number,
        'axisStart' ? : number,
        'categoricalAttributeId': string,
        'logScale' ? : boolean,
        'numCurvePoints' ? : number,
        'numericalAttributeId': string,
        'sigmaMultiplier' ? : number,
        'studyViewFilter': StudyViewFilter,
        $queryParameters ? : any,
            $domain ? : string
    }): Promise < ClinicalViolinPlotData > {
        return this.fetchClinicalDataViolinPlotsUsingPOSTWithHttpInfo(parameters).then(function(response: request.Response) {
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
    fetchCustomDataCountsUsingPOSTURL(parameters: {
        'clinicalDataCountFilter': ClinicalDataCountFilter,
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/custom-data-counts/fetch';

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
     * Fetch custom data counts by study view filter
     * @method
     * @name CBioPortalAPIInternal#fetchCustomDataCountsUsingPOST
     * @param {} clinicalDataCountFilter - Custom data count filter
     */
    fetchCustomDataCountsUsingPOSTWithHttpInfo(parameters: {
        'clinicalDataCountFilter': ClinicalDataCountFilter,
        $queryParameters ? : any,
        $domain ? : string
    }): Promise < request.Response > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        const errorHandlers = this.errorHandlers;
        const request = this.request;
        let path = '/custom-data-counts/fetch';
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
     * Fetch custom data counts by study view filter
     * @method
     * @name CBioPortalAPIInternal#fetchCustomDataCountsUsingPOST
     * @param {} clinicalDataCountFilter - Custom data count filter
     */
    fetchCustomDataCountsUsingPOST(parameters: {
            'clinicalDataCountFilter': ClinicalDataCountFilter,
            $queryParameters ? : any,
            $domain ? : string
        }): Promise < Array < ClinicalDataCountItem >
        > {
            return this.fetchCustomDataCountsUsingPOSTWithHttpInfo(parameters).then(function(response: request.Response) {
                return response.body;
            });
        };
    fetchAlterationDriverAnnotationReportUsingPOSTURL(parameters: {
        'molecularProfileIds': Array < string > ,
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/custom-driver-annotation-report/fetch';

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
     * Return availability of custom driver annotations for molecular profiles
     * @method
     * @name CBioPortalAPIInternal#fetchAlterationDriverAnnotationReportUsingPOST
     * @param {} molecularProfileIds - molecularProfileIds
     */
    fetchAlterationDriverAnnotationReportUsingPOSTWithHttpInfo(parameters: {
        'molecularProfileIds': Array < string > ,
        $queryParameters ? : any,
        $domain ? : string
    }): Promise < request.Response > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        const errorHandlers = this.errorHandlers;
        const request = this.request;
        let path = '/custom-driver-annotation-report/fetch';
        let body: any;
        let queryParameters: any = {};
        let headers: any = {};
        let form: any = {};
        return new Promise(function(resolve, reject) {
            headers['Accept'] = 'application/json';
            headers['Content-Type'] = 'application/json';

            if (parameters['molecularProfileIds'] !== undefined) {
                body = parameters['molecularProfileIds'];
            }

            if (parameters['molecularProfileIds'] === undefined) {
                reject(new Error('Missing required  parameter: molecularProfileIds'));
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
     * Return availability of custom driver annotations for molecular profiles
     * @method
     * @name CBioPortalAPIInternal#fetchAlterationDriverAnnotationReportUsingPOST
     * @param {} molecularProfileIds - molecularProfileIds
     */
    fetchAlterationDriverAnnotationReportUsingPOST(parameters: {
        'molecularProfileIds': Array < string > ,
        $queryParameters ? : any,
        $domain ? : string
    }): Promise < CustomDriverAnnotationReport > {
        return this.fetchAlterationDriverAnnotationReportUsingPOSTWithHttpInfo(parameters).then(function(response: request.Response) {
            return response.body;
        });
    };
    downloadDataAccessTokenUsingGETURL(parameters: {
        'authenticated' ? : boolean,
        'authorities0Authority' ? : string,
        'credentials' ? : {},
        'details' ? : {},
        'principal' ? : {},
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/data-access-token';
        if (parameters['authenticated'] !== undefined) {
            queryParameters['authenticated'] = parameters['authenticated'];
        }

        if (parameters['authorities0Authority'] !== undefined) {
            queryParameters['authorities[0].authority'] = parameters['authorities0Authority'];
        }

        if (parameters['credentials'] !== undefined) {
            queryParameters['credentials'] = parameters['credentials'];
        }

        if (parameters['details'] !== undefined) {
            queryParameters['details'] = parameters['details'];
        }

        if (parameters['principal'] !== undefined) {
            queryParameters['principal'] = parameters['principal'];
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
     * Create a new data access token
     * @method
     * @name CBioPortalAPIInternal#downloadDataAccessTokenUsingGET
     * @param {boolean} authenticated - A web service for supplying JSON formatted data to cBioPortal clients. Please note that interal API is currently in beta and subject to change.
     * @param {string} authorities0Authority - A web service for supplying JSON formatted data to cBioPortal clients. Please note that interal API is currently in beta and subject to change.
     * @param {object} credentials - A web service for supplying JSON formatted data to cBioPortal clients. Please note that interal API is currently in beta and subject to change.
     * @param {object} details - A web service for supplying JSON formatted data to cBioPortal clients. Please note that interal API is currently in beta and subject to change.
     * @param {object} principal - A web service for supplying JSON formatted data to cBioPortal clients. Please note that interal API is currently in beta and subject to change.
     */
    downloadDataAccessTokenUsingGETWithHttpInfo(parameters: {
        'authenticated' ? : boolean,
        'authorities0Authority' ? : string,
        'credentials' ? : {},
        'details' ? : {},
        'principal' ? : {},
        $queryParameters ? : any,
            $domain ? : string
    }): Promise < request.Response > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        const errorHandlers = this.errorHandlers;
        const request = this.request;
        let path = '/data-access-token';
        let body: any;
        let queryParameters: any = {};
        let headers: any = {};
        let form: any = {};
        return new Promise(function(resolve, reject) {
            headers['Accept'] = '*/*';

            if (parameters['authenticated'] !== undefined) {
                queryParameters['authenticated'] = parameters['authenticated'];
            }

            if (parameters['authorities0Authority'] !== undefined) {
                queryParameters['authorities[0].authority'] = parameters['authorities0Authority'];
            }

            if (parameters['credentials'] !== undefined) {
                queryParameters['credentials'] = parameters['credentials'];
            }

            if (parameters['details'] !== undefined) {
                queryParameters['details'] = parameters['details'];
            }

            if (parameters['principal'] !== undefined) {
                queryParameters['principal'] = parameters['principal'];
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
     * Create a new data access token
     * @method
     * @name CBioPortalAPIInternal#downloadDataAccessTokenUsingGET
     * @param {boolean} authenticated - A web service for supplying JSON formatted data to cBioPortal clients. Please note that interal API is currently in beta and subject to change.
     * @param {string} authorities0Authority - A web service for supplying JSON formatted data to cBioPortal clients. Please note that interal API is currently in beta and subject to change.
     * @param {object} credentials - A web service for supplying JSON formatted data to cBioPortal clients. Please note that interal API is currently in beta and subject to change.
     * @param {object} details - A web service for supplying JSON formatted data to cBioPortal clients. Please note that interal API is currently in beta and subject to change.
     * @param {object} principal - A web service for supplying JSON formatted data to cBioPortal clients. Please note that interal API is currently in beta and subject to change.
     */
    downloadDataAccessTokenUsingGET(parameters: {
        'authenticated' ? : boolean,
        'authorities0Authority' ? : string,
        'credentials' ? : {},
        'details' ? : {},
        'principal' ? : {},
        $queryParameters ? : any,
            $domain ? : string
    }): Promise < string > {
        return this.downloadDataAccessTokenUsingGETWithHttpInfo(parameters).then(function(response: request.Response) {
            return response.body;
        });
    };
    getAllDataAccessTokensUsingGETURL(parameters: {
        'authenticated' ? : boolean,
        'authorities0Authority' ? : string,
        'credentials' ? : {},
        'details' ? : {},
        'principal' ? : {},
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/data-access-tokens';
        if (parameters['authenticated'] !== undefined) {
            queryParameters['authenticated'] = parameters['authenticated'];
        }

        if (parameters['authorities0Authority'] !== undefined) {
            queryParameters['authorities[0].authority'] = parameters['authorities0Authority'];
        }

        if (parameters['credentials'] !== undefined) {
            queryParameters['credentials'] = parameters['credentials'];
        }

        if (parameters['details'] !== undefined) {
            queryParameters['details'] = parameters['details'];
        }

        if (parameters['principal'] !== undefined) {
            queryParameters['principal'] = parameters['principal'];
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
     * Retrieve all data access tokens
     * @method
     * @name CBioPortalAPIInternal#getAllDataAccessTokensUsingGET
     * @param {boolean} authenticated - A web service for supplying JSON formatted data to cBioPortal clients. Please note that interal API is currently in beta and subject to change.
     * @param {string} authorities0Authority - A web service for supplying JSON formatted data to cBioPortal clients. Please note that interal API is currently in beta and subject to change.
     * @param {object} credentials - A web service for supplying JSON formatted data to cBioPortal clients. Please note that interal API is currently in beta and subject to change.
     * @param {object} details - A web service for supplying JSON formatted data to cBioPortal clients. Please note that interal API is currently in beta and subject to change.
     * @param {object} principal - A web service for supplying JSON formatted data to cBioPortal clients. Please note that interal API is currently in beta and subject to change.
     */
    getAllDataAccessTokensUsingGETWithHttpInfo(parameters: {
        'authenticated' ? : boolean,
        'authorities0Authority' ? : string,
        'credentials' ? : {},
        'details' ? : {},
        'principal' ? : {},
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

            if (parameters['authenticated'] !== undefined) {
                queryParameters['authenticated'] = parameters['authenticated'];
            }

            if (parameters['authorities0Authority'] !== undefined) {
                queryParameters['authorities[0].authority'] = parameters['authorities0Authority'];
            }

            if (parameters['credentials'] !== undefined) {
                queryParameters['credentials'] = parameters['credentials'];
            }

            if (parameters['details'] !== undefined) {
                queryParameters['details'] = parameters['details'];
            }

            if (parameters['principal'] !== undefined) {
                queryParameters['principal'] = parameters['principal'];
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
     * Retrieve all data access tokens
     * @method
     * @name CBioPortalAPIInternal#getAllDataAccessTokensUsingGET
     * @param {boolean} authenticated - A web service for supplying JSON formatted data to cBioPortal clients. Please note that interal API is currently in beta and subject to change.
     * @param {string} authorities0Authority - A web service for supplying JSON formatted data to cBioPortal clients. Please note that interal API is currently in beta and subject to change.
     * @param {object} credentials - A web service for supplying JSON formatted data to cBioPortal clients. Please note that interal API is currently in beta and subject to change.
     * @param {object} details - A web service for supplying JSON formatted data to cBioPortal clients. Please note that interal API is currently in beta and subject to change.
     * @param {object} principal - A web service for supplying JSON formatted data to cBioPortal clients. Please note that interal API is currently in beta and subject to change.
     */
    getAllDataAccessTokensUsingGET(parameters: {
            'authenticated' ? : boolean,
            'authorities0Authority' ? : string,
            'credentials' ? : {},
            'details' ? : {},
            'principal' ? : {},
            $queryParameters ? : any,
                $domain ? : string
        }): Promise < Array < DataAccessToken >
        > {
            return this.getAllDataAccessTokensUsingGETWithHttpInfo(parameters).then(function(response: request.Response) {
                return response.body;
            });
        };
    createDataAccessTokenUsingPOSTURL(parameters: {
        'authenticated' ? : boolean,
        'authorities0Authority' ? : string,
        'credentials' ? : {},
        'details' ? : {},
        'principal' ? : {},
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/data-access-tokens';
        if (parameters['authenticated'] !== undefined) {
            queryParameters['authenticated'] = parameters['authenticated'];
        }

        if (parameters['authorities0Authority'] !== undefined) {
            queryParameters['authorities[0].authority'] = parameters['authorities0Authority'];
        }

        if (parameters['credentials'] !== undefined) {
            queryParameters['credentials'] = parameters['credentials'];
        }

        if (parameters['details'] !== undefined) {
            queryParameters['details'] = parameters['details'];
        }

        if (parameters['principal'] !== undefined) {
            queryParameters['principal'] = parameters['principal'];
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
     * Get all data access tokens
     * @method
     * @name CBioPortalAPIInternal#createDataAccessTokenUsingPOST
     * @param {boolean} authenticated - A web service for supplying JSON formatted data to cBioPortal clients. Please note that interal API is currently in beta and subject to change.
     * @param {string} authorities0Authority - A web service for supplying JSON formatted data to cBioPortal clients. Please note that interal API is currently in beta and subject to change.
     * @param {object} credentials - A web service for supplying JSON formatted data to cBioPortal clients. Please note that interal API is currently in beta and subject to change.
     * @param {object} details - A web service for supplying JSON formatted data to cBioPortal clients. Please note that interal API is currently in beta and subject to change.
     * @param {object} principal - A web service for supplying JSON formatted data to cBioPortal clients. Please note that interal API is currently in beta and subject to change.
     */
    createDataAccessTokenUsingPOSTWithHttpInfo(parameters: {
        'authenticated' ? : boolean,
        'authorities0Authority' ? : string,
        'credentials' ? : {},
        'details' ? : {},
        'principal' ? : {},
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

            if (parameters['authenticated'] !== undefined) {
                queryParameters['authenticated'] = parameters['authenticated'];
            }

            if (parameters['authorities0Authority'] !== undefined) {
                queryParameters['authorities[0].authority'] = parameters['authorities0Authority'];
            }

            if (parameters['credentials'] !== undefined) {
                queryParameters['credentials'] = parameters['credentials'];
            }

            if (parameters['details'] !== undefined) {
                queryParameters['details'] = parameters['details'];
            }

            if (parameters['principal'] !== undefined) {
                queryParameters['principal'] = parameters['principal'];
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
     * Get all data access tokens
     * @method
     * @name CBioPortalAPIInternal#createDataAccessTokenUsingPOST
     * @param {boolean} authenticated - A web service for supplying JSON formatted data to cBioPortal clients. Please note that interal API is currently in beta and subject to change.
     * @param {string} authorities0Authority - A web service for supplying JSON formatted data to cBioPortal clients. Please note that interal API is currently in beta and subject to change.
     * @param {object} credentials - A web service for supplying JSON formatted data to cBioPortal clients. Please note that interal API is currently in beta and subject to change.
     * @param {object} details - A web service for supplying JSON formatted data to cBioPortal clients. Please note that interal API is currently in beta and subject to change.
     * @param {object} principal - A web service for supplying JSON formatted data to cBioPortal clients. Please note that interal API is currently in beta and subject to change.
     */
    createDataAccessTokenUsingPOST(parameters: {
        'authenticated' ? : boolean,
        'authorities0Authority' ? : string,
        'credentials' ? : {},
        'details' ? : {},
        'principal' ? : {},
        $queryParameters ? : any,
            $domain ? : string
    }): Promise < DataAccessToken > {
        return this.createDataAccessTokenUsingPOSTWithHttpInfo(parameters).then(function(response: request.Response) {
            return response.body;
        });
    };
    revokeAllDataAccessTokensUsingDELETEURL(parameters: {
        'authenticated' ? : boolean,
        'authorities0Authority' ? : string,
        'credentials' ? : {},
        'details' ? : {},
        'principal' ? : {},
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/data-access-tokens';
        if (parameters['authenticated'] !== undefined) {
            queryParameters['authenticated'] = parameters['authenticated'];
        }

        if (parameters['authorities0Authority'] !== undefined) {
            queryParameters['authorities[0].authority'] = parameters['authorities0Authority'];
        }

        if (parameters['credentials'] !== undefined) {
            queryParameters['credentials'] = parameters['credentials'];
        }

        if (parameters['details'] !== undefined) {
            queryParameters['details'] = parameters['details'];
        }

        if (parameters['principal'] !== undefined) {
            queryParameters['principal'] = parameters['principal'];
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
     * Delete all data access tokens
     * @method
     * @name CBioPortalAPIInternal#revokeAllDataAccessTokensUsingDELETE
     * @param {boolean} authenticated - A web service for supplying JSON formatted data to cBioPortal clients. Please note that interal API is currently in beta and subject to change.
     * @param {string} authorities0Authority - A web service for supplying JSON formatted data to cBioPortal clients. Please note that interal API is currently in beta and subject to change.
     * @param {object} credentials - A web service for supplying JSON formatted data to cBioPortal clients. Please note that interal API is currently in beta and subject to change.
     * @param {object} details - A web service for supplying JSON formatted data to cBioPortal clients. Please note that interal API is currently in beta and subject to change.
     * @param {object} principal - A web service for supplying JSON formatted data to cBioPortal clients. Please note that interal API is currently in beta and subject to change.
     */
    revokeAllDataAccessTokensUsingDELETEWithHttpInfo(parameters: {
        'authenticated' ? : boolean,
        'authorities0Authority' ? : string,
        'credentials' ? : {},
        'details' ? : {},
        'principal' ? : {},
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

            if (parameters['authenticated'] !== undefined) {
                queryParameters['authenticated'] = parameters['authenticated'];
            }

            if (parameters['authorities0Authority'] !== undefined) {
                queryParameters['authorities[0].authority'] = parameters['authorities0Authority'];
            }

            if (parameters['credentials'] !== undefined) {
                queryParameters['credentials'] = parameters['credentials'];
            }

            if (parameters['details'] !== undefined) {
                queryParameters['details'] = parameters['details'];
            }

            if (parameters['principal'] !== undefined) {
                queryParameters['principal'] = parameters['principal'];
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
     * Delete all data access tokens
     * @method
     * @name CBioPortalAPIInternal#revokeAllDataAccessTokensUsingDELETE
     * @param {boolean} authenticated - A web service for supplying JSON formatted data to cBioPortal clients. Please note that interal API is currently in beta and subject to change.
     * @param {string} authorities0Authority - A web service for supplying JSON formatted data to cBioPortal clients. Please note that interal API is currently in beta and subject to change.
     * @param {object} credentials - A web service for supplying JSON formatted data to cBioPortal clients. Please note that interal API is currently in beta and subject to change.
     * @param {object} details - A web service for supplying JSON formatted data to cBioPortal clients. Please note that interal API is currently in beta and subject to change.
     * @param {object} principal - A web service for supplying JSON formatted data to cBioPortal clients. Please note that interal API is currently in beta and subject to change.
     */
    revokeAllDataAccessTokensUsingDELETE(parameters: {
        'authenticated' ? : boolean,
        'authorities0Authority' ? : string,
        'credentials' ? : {},
        'details' ? : {},
        'principal' ? : {},
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
     * Retrieve an existing data access token
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
     * Retrieve an existing data access token
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
     * Delete a data access token
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
     * Delete a data access token
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
    fetchGenomicEnrichmentsUsingPOSTURL(parameters: {
        'enrichmentType' ? : "PATIENT" | "SAMPLE",
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
     * Fetch genomic enrichments in a molecular profile
     * @method
     * @name CBioPortalAPIInternal#fetchGenomicEnrichmentsUsingPOST
     * @param {string} enrichmentType - Type of the enrichment e.g. SAMPLE or PATIENT
     * @param {} groups - List of groups containing sample and molecular profile identifiers
     */
    fetchGenomicEnrichmentsUsingPOSTWithHttpInfo(parameters: {
        'enrichmentType' ? : "PATIENT" | "SAMPLE",
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
     * Fetch genomic enrichments in a molecular profile
     * @method
     * @name CBioPortalAPIInternal#fetchGenomicEnrichmentsUsingPOST
     * @param {string} enrichmentType - Type of the enrichment e.g. SAMPLE or PATIENT
     * @param {} groups - List of groups containing sample and molecular profile identifiers
     */
    fetchGenomicEnrichmentsUsingPOST(parameters: {
            'enrichmentType' ? : "PATIENT" | "SAMPLE",
            'groups': Array < MolecularProfileCasesGroupFilter > ,
                $queryParameters ? : any,
                $domain ? : string
        }): Promise < Array < GenomicEnrichment >
        > {
            return this.fetchGenomicEnrichmentsUsingPOSTWithHttpInfo(parameters).then(function(response: request.Response) {
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
    fetchGenericAssayDataBinCountsUsingPOSTURL(parameters: {
        'dataBinMethod' ? : "DYNAMIC" | "STATIC",
        'genericAssayDataBinCountFilter': GenericAssayDataBinCountFilter,
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/generic-assay-data-bin-counts/fetch';
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
     * Fetch generic assay data bin counts by study view filter
     * @method
     * @name CBioPortalAPIInternal#fetchGenericAssayDataBinCountsUsingPOST
     * @param {string} dataBinMethod - Method for data binning
     * @param {} genericAssayDataBinCountFilter - Generic assay data bin count filter
     */
    fetchGenericAssayDataBinCountsUsingPOSTWithHttpInfo(parameters: {
        'dataBinMethod' ? : "DYNAMIC" | "STATIC",
        'genericAssayDataBinCountFilter': GenericAssayDataBinCountFilter,
        $queryParameters ? : any,
            $domain ? : string
    }): Promise < request.Response > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        const errorHandlers = this.errorHandlers;
        const request = this.request;
        let path = '/generic-assay-data-bin-counts/fetch';
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

            if (parameters['genericAssayDataBinCountFilter'] !== undefined) {
                body = parameters['genericAssayDataBinCountFilter'];
            }

            if (parameters['genericAssayDataBinCountFilter'] === undefined) {
                reject(new Error('Missing required  parameter: genericAssayDataBinCountFilter'));
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
     * Fetch generic assay data bin counts by study view filter
     * @method
     * @name CBioPortalAPIInternal#fetchGenericAssayDataBinCountsUsingPOST
     * @param {string} dataBinMethod - Method for data binning
     * @param {} genericAssayDataBinCountFilter - Generic assay data bin count filter
     */
    fetchGenericAssayDataBinCountsUsingPOST(parameters: {
            'dataBinMethod' ? : "DYNAMIC" | "STATIC",
            'genericAssayDataBinCountFilter': GenericAssayDataBinCountFilter,
            $queryParameters ? : any,
                $domain ? : string
        }): Promise < Array < GenericAssayDataBin >
        > {
            return this.fetchGenericAssayDataBinCountsUsingPOSTWithHttpInfo(parameters).then(function(response: request.Response) {
                return response.body;
            });
        };
    fetchGenericAssayDataCountsUsingPOSTURL(parameters: {
        'genericAssayDataCountFilter': GenericAssayDataCountFilter,
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/generic-assay-data-counts/fetch';

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
     * Fetch generic assay data counts by study view filter
     * @method
     * @name CBioPortalAPIInternal#fetchGenericAssayDataCountsUsingPOST
     * @param {} genericAssayDataCountFilter - Generic assay data count filter
     */
    fetchGenericAssayDataCountsUsingPOSTWithHttpInfo(parameters: {
        'genericAssayDataCountFilter': GenericAssayDataCountFilter,
        $queryParameters ? : any,
        $domain ? : string
    }): Promise < request.Response > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        const errorHandlers = this.errorHandlers;
        const request = this.request;
        let path = '/generic-assay-data-counts/fetch';
        let body: any;
        let queryParameters: any = {};
        let headers: any = {};
        let form: any = {};
        return new Promise(function(resolve, reject) {
            headers['Accept'] = 'application/json';
            headers['Content-Type'] = 'application/json';

            if (parameters['genericAssayDataCountFilter'] !== undefined) {
                body = parameters['genericAssayDataCountFilter'];
            }

            if (parameters['genericAssayDataCountFilter'] === undefined) {
                reject(new Error('Missing required  parameter: genericAssayDataCountFilter'));
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
     * Fetch generic assay data counts by study view filter
     * @method
     * @name CBioPortalAPIInternal#fetchGenericAssayDataCountsUsingPOST
     * @param {} genericAssayDataCountFilter - Generic assay data count filter
     */
    fetchGenericAssayDataCountsUsingPOST(parameters: {
            'genericAssayDataCountFilter': GenericAssayDataCountFilter,
            $queryParameters ? : any,
            $domain ? : string
        }): Promise < Array < GenericAssayDataCountItem >
        > {
            return this.fetchGenericAssayDataCountsUsingPOSTWithHttpInfo(parameters).then(function(response: request.Response) {
                return response.body;
            });
        };
    fetchGenericAssayEnrichmentsUsingPOSTURL(parameters: {
        'enrichmentType' ? : "PATIENT" | "SAMPLE",
        'groups': Array < MolecularProfileCasesGroupFilter > ,
            $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/generic-assay-enrichments/fetch';
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
     * Fetch generic assay enrichments in a molecular profile
     * @method
     * @name CBioPortalAPIInternal#fetchGenericAssayEnrichmentsUsingPOST
     * @param {string} enrichmentType - Type of the enrichment e.g. SAMPLE or PATIENT
     * @param {} groups - List of groups containing sample and molecular profile identifiers
     */
    fetchGenericAssayEnrichmentsUsingPOSTWithHttpInfo(parameters: {
        'enrichmentType' ? : "PATIENT" | "SAMPLE",
        'groups': Array < MolecularProfileCasesGroupFilter > ,
            $queryParameters ? : any,
            $domain ? : string
    }): Promise < request.Response > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        const errorHandlers = this.errorHandlers;
        const request = this.request;
        let path = '/generic-assay-enrichments/fetch';
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
     * Fetch generic assay enrichments in a molecular profile
     * @method
     * @name CBioPortalAPIInternal#fetchGenericAssayEnrichmentsUsingPOST
     * @param {string} enrichmentType - Type of the enrichment e.g. SAMPLE or PATIENT
     * @param {} groups - List of groups containing sample and molecular profile identifiers
     */
    fetchGenericAssayEnrichmentsUsingPOST(parameters: {
            'enrichmentType' ? : "PATIENT" | "SAMPLE",
            'groups': Array < MolecularProfileCasesGroupFilter > ,
                $queryParameters ? : any,
                $domain ? : string
        }): Promise < Array < GenericAssayEnrichment >
        > {
            return this.fetchGenericAssayEnrichmentsUsingPOSTWithHttpInfo(parameters).then(function(response: request.Response) {
                return response.body;
            });
        };
    fetchGenesetHierarchyInfoUsingPOSTURL(parameters: {
        'geneticProfileId': string,
        'percentile' ? : number,
        'pvalueThreshold' ? : number,
        'sampleIds' ? : Array < string > ,
        'sampleListId' ? : string,
        'scoreThreshold' ? : number,
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

        if (parameters['pvalueThreshold'] !== undefined) {
            queryParameters['pvalueThreshold'] = parameters['pvalueThreshold'];
        }

        if (parameters['sampleListId'] !== undefined) {
            queryParameters['sampleListId'] = parameters['sampleListId'];
        }

        if (parameters['scoreThreshold'] !== undefined) {
            queryParameters['scoreThreshold'] = parameters['scoreThreshold'];
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
     * @param {number} pvalueThreshold - p-value threshold. Filters out gene sets for which the score p-value is higher than this threshold.
     * @param {} sampleIds - Fill this one if you want to specify a subset of samples: sampleIds: custom list of samples or patients to query, e.g. ["TCGA-A1-A0SD-01", "TCGA-A1-A0SE-01"]
     * @param {string} sampleListId - Identifier of pre-defined sample list with samples to query, e.g. brca_tcga_all
     * @param {number} scoreThreshold - Gene set score threshold (for absolute score value). Filters out gene sets where the GSVA(like) *representative score* is under this threshold.
     */
    fetchGenesetHierarchyInfoUsingPOSTWithHttpInfo(parameters: {
        'geneticProfileId': string,
        'percentile' ? : number,
        'pvalueThreshold' ? : number,
        'sampleIds' ? : Array < string > ,
        'sampleListId' ? : string,
        'scoreThreshold' ? : number,
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

            if (parameters['pvalueThreshold'] !== undefined) {
                queryParameters['pvalueThreshold'] = parameters['pvalueThreshold'];
            }

            if (parameters['sampleIds'] !== undefined) {
                body = parameters['sampleIds'];
            }

            if (parameters['sampleListId'] !== undefined) {
                queryParameters['sampleListId'] = parameters['sampleListId'];
            }

            if (parameters['scoreThreshold'] !== undefined) {
                queryParameters['scoreThreshold'] = parameters['scoreThreshold'];
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
     * @param {number} pvalueThreshold - p-value threshold. Filters out gene sets for which the score p-value is higher than this threshold.
     * @param {} sampleIds - Fill this one if you want to specify a subset of samples: sampleIds: custom list of samples or patients to query, e.g. ["TCGA-A1-A0SD-01", "TCGA-A1-A0SE-01"]
     * @param {string} sampleListId - Identifier of pre-defined sample list with samples to query, e.g. brca_tcga_all
     * @param {number} scoreThreshold - Gene set score threshold (for absolute score value). Filters out gene sets where the GSVA(like) *representative score* is under this threshold.
     */
    fetchGenesetHierarchyInfoUsingPOST(parameters: {
            'geneticProfileId': string,
            'percentile' ? : number,
            'pvalueThreshold' ? : number,
            'sampleIds' ? : Array < string > ,
            'sampleListId' ? : string,
            'scoreThreshold' ? : number,
            $queryParameters ? : any,
            $domain ? : string
        }): Promise < Array < GenesetHierarchyInfo >
        > {
            return this.fetchGenesetHierarchyInfoUsingPOSTWithHttpInfo(parameters).then(function(response: request.Response) {
                return response.body;
            });
        };
    getAllGenesetsUsingGETURL(parameters: {
        'pageNumber' ? : number,
        'pageSize' ? : number,
        'projection' ? : "DETAILED" | "ID" | "META" | "SUMMARY",
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/genesets';
        if (parameters['pageNumber'] !== undefined) {
            queryParameters['pageNumber'] = parameters['pageNumber'];
        }

        if (parameters['pageSize'] !== undefined) {
            queryParameters['pageSize'] = parameters['pageSize'];
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
     * Get all gene sets
     * @method
     * @name CBioPortalAPIInternal#getAllGenesetsUsingGET
     * @param {integer} pageNumber - Page number of the result list
     * @param {integer} pageSize - Page size of the result list
     * @param {string} projection - Level of detail of the response
     */
    getAllGenesetsUsingGETWithHttpInfo(parameters: {
        'pageNumber' ? : number,
        'pageSize' ? : number,
        'projection' ? : "DETAILED" | "ID" | "META" | "SUMMARY",
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

            if (parameters['pageNumber'] !== undefined) {
                queryParameters['pageNumber'] = parameters['pageNumber'];
            }

            if (parameters['pageSize'] !== undefined) {
                queryParameters['pageSize'] = parameters['pageSize'];
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

        });
    };

    /**
     * Get all gene sets
     * @method
     * @name CBioPortalAPIInternal#getAllGenesetsUsingGET
     * @param {integer} pageNumber - Page number of the result list
     * @param {integer} pageSize - Page size of the result list
     * @param {string} projection - Level of detail of the response
     */
    getAllGenesetsUsingGET(parameters: {
            'pageNumber' ? : number,
            'pageSize' ? : number,
            'projection' ? : "DETAILED" | "ID" | "META" | "SUMMARY",
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
    getGenesetVersionUsingGETURL(parameters: {
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/genesets/version';

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
     * Get the geneset version
     * @method
     * @name CBioPortalAPIInternal#getGenesetVersionUsingGET
     */
    getGenesetVersionUsingGETWithHttpInfo(parameters: {
        $queryParameters ? : any,
            $domain ? : string
    }): Promise < request.Response > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        const errorHandlers = this.errorHandlers;
        const request = this.request;
        let path = '/genesets/version';
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
     * Get the geneset version
     * @method
     * @name CBioPortalAPIInternal#getGenesetVersionUsingGET
     */
    getGenesetVersionUsingGET(parameters: {
        $queryParameters ? : any,
            $domain ? : string
    }): Promise < string > {
        return this.getGenesetVersionUsingGETWithHttpInfo(parameters).then(function(response: request.Response) {
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
        'correlationThreshold' ? : number,
        'genesetId': string,
        'geneticProfileId': string,
        'sampleIds' ? : Array < string > ,
            'sampleListId' ? : string,
            $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/genesets/{genesetId}/expression-correlation/fetch';
        if (parameters['correlationThreshold'] !== undefined) {
            queryParameters['correlationThreshold'] = parameters['correlationThreshold'];
        }

        path = path.replace('{genesetId}', parameters['genesetId'] + '');
        if (parameters['geneticProfileId'] !== undefined) {
            queryParameters['geneticProfileId'] = parameters['geneticProfileId'];
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
     * @param {number} correlationThreshold - Correlation threshold (for absolute correlation value, Spearman correlation)
     * @param {string} genesetId - Gene set ID, e.g. HINATA_NFKB_MATRIX.
     * @param {string} geneticProfileId - Genetic Profile ID e.g. gbm_tcga_gsva_scores
     * @param {} sampleIds - Fill this one if you want to specify a subset of samples: sampleIds: custom list of samples or patients to query, e.g. ["TCGA-A1-A0SD-01", "TCGA-A1-A0SE-01"]
     * @param {string} sampleListId - Identifier of pre-defined sample list with samples to query, e.g. brca_tcga_all
     */
    fetchCorrelatedGenesUsingPOSTWithHttpInfo(parameters: {
        'correlationThreshold' ? : number,
        'genesetId': string,
        'geneticProfileId': string,
        'sampleIds' ? : Array < string > ,
            'sampleListId' ? : string,
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

            if (parameters['correlationThreshold'] !== undefined) {
                queryParameters['correlationThreshold'] = parameters['correlationThreshold'];
            }

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

            if (parameters['sampleIds'] !== undefined) {
                body = parameters['sampleIds'];
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

            request('POST', domain + path, body, headers, queryParameters, form, reject, resolve, errorHandlers);

        });
    };

    /**
     * Get the genes in a gene set that have expression correlated to the gene set scores (calculated using Spearman's correlation)
     * @method
     * @name CBioPortalAPIInternal#fetchCorrelatedGenesUsingPOST
     * @param {number} correlationThreshold - Correlation threshold (for absolute correlation value, Spearman correlation)
     * @param {string} genesetId - Gene set ID, e.g. HINATA_NFKB_MATRIX.
     * @param {string} geneticProfileId - Genetic Profile ID e.g. gbm_tcga_gsva_scores
     * @param {} sampleIds - Fill this one if you want to specify a subset of samples: sampleIds: custom list of samples or patients to query, e.g. ["TCGA-A1-A0SD-01", "TCGA-A1-A0SE-01"]
     * @param {string} sampleListId - Identifier of pre-defined sample list with samples to query, e.g. brca_tcga_all
     */
    fetchCorrelatedGenesUsingPOST(parameters: {
            'correlationThreshold' ? : number,
            'genesetId': string,
            'geneticProfileId': string,
            'sampleIds' ? : Array < string > ,
                'sampleListId' ? : string,
                $queryParameters ? : any,
                $domain ? : string
        }): Promise < Array < GenesetCorrelation >
        > {
            return this.fetchCorrelatedGenesUsingPOSTWithHttpInfo(parameters).then(function(response: request.Response) {
                return response.body;
            });
        };
    fetchGeneticDataItemsUsingPOSTURL(parameters: {
        'genesetDataFilterCriteria': GenesetDataFilterCriteria,
        'geneticProfileId': string,
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
     * @param {} genesetDataFilterCriteria - Search criteria to return the values for a given set of samples and gene set items. genesetIds: The list of identifiers for the gene sets of interest, e.g. HINATA_NFKB_MATRIX. Use one of these if you want to specify a subset of samples:(1) sampleListId: Identifier of pre-defined sample list with samples to query, e.g. brca_tcga_all or (2) sampleIds: custom list of samples or patients to query, e.g. TCGA-BH-A1EO-01, TCGA-AR-A1AR-01
     * @param {string} geneticProfileId - Genetic profile ID, e.g. gbm_tcga_gsva_scores
     */
    fetchGeneticDataItemsUsingPOSTWithHttpInfo(parameters: {
        'genesetDataFilterCriteria': GenesetDataFilterCriteria,
        'geneticProfileId': string,
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

            if (parameters['genesetDataFilterCriteria'] !== undefined) {
                body = parameters['genesetDataFilterCriteria'];
            }

            if (parameters['genesetDataFilterCriteria'] === undefined) {
                reject(new Error('Missing required  parameter: genesetDataFilterCriteria'));
                return;
            }

            path = path.replace('{geneticProfileId}', parameters['geneticProfileId'] + '');

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

            request('POST', domain + path, body, headers, queryParameters, form, reject, resolve, errorHandlers);

        });
    };

    /**
     * Fetch gene set "genetic data" items (gene set scores) by profile Id, gene set ids and sample ids
     * @method
     * @name CBioPortalAPIInternal#fetchGeneticDataItemsUsingPOST
     * @param {} genesetDataFilterCriteria - Search criteria to return the values for a given set of samples and gene set items. genesetIds: The list of identifiers for the gene sets of interest, e.g. HINATA_NFKB_MATRIX. Use one of these if you want to specify a subset of samples:(1) sampleListId: Identifier of pre-defined sample list with samples to query, e.g. brca_tcga_all or (2) sampleIds: custom list of samples or patients to query, e.g. TCGA-BH-A1EO-01, TCGA-AR-A1AR-01
     * @param {string} geneticProfileId - Genetic profile ID, e.g. gbm_tcga_gsva_scores
     */
    fetchGeneticDataItemsUsingPOST(parameters: {
            'genesetDataFilterCriteria': GenesetDataFilterCriteria,
            'geneticProfileId': string,
            $queryParameters ? : any,
            $domain ? : string
        }): Promise < Array < GenesetMolecularData >
        > {
            return this.fetchGeneticDataItemsUsingPOSTWithHttpInfo(parameters).then(function(response: request.Response) {
                return response.body;
            });
        };
    fetchGenomicDataBinCountsUsingPOSTURL(parameters: {
        'dataBinMethod' ? : "DYNAMIC" | "STATIC",
        'genomicDataBinCountFilter': GenomicDataBinCountFilter,
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/genomic-data-bin-counts/fetch';
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
     * Fetch genomic data bin counts by study view filter
     * @method
     * @name CBioPortalAPIInternal#fetchGenomicDataBinCountsUsingPOST
     * @param {string} dataBinMethod - Method for data binning
     * @param {} genomicDataBinCountFilter - Genomic data bin count filter
     */
    fetchGenomicDataBinCountsUsingPOSTWithHttpInfo(parameters: {
        'dataBinMethod' ? : "DYNAMIC" | "STATIC",
        'genomicDataBinCountFilter': GenomicDataBinCountFilter,
        $queryParameters ? : any,
            $domain ? : string
    }): Promise < request.Response > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        const errorHandlers = this.errorHandlers;
        const request = this.request;
        let path = '/genomic-data-bin-counts/fetch';
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

            if (parameters['genomicDataBinCountFilter'] !== undefined) {
                body = parameters['genomicDataBinCountFilter'];
            }

            if (parameters['genomicDataBinCountFilter'] === undefined) {
                reject(new Error('Missing required  parameter: genomicDataBinCountFilter'));
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
     * Fetch genomic data bin counts by study view filter
     * @method
     * @name CBioPortalAPIInternal#fetchGenomicDataBinCountsUsingPOST
     * @param {string} dataBinMethod - Method for data binning
     * @param {} genomicDataBinCountFilter - Genomic data bin count filter
     */
    fetchGenomicDataBinCountsUsingPOST(parameters: {
            'dataBinMethod' ? : "DYNAMIC" | "STATIC",
            'genomicDataBinCountFilter': GenomicDataBinCountFilter,
            $queryParameters ? : any,
                $domain ? : string
        }): Promise < Array < GenomicDataBin >
        > {
            return this.fetchGenomicDataBinCountsUsingPOSTWithHttpInfo(parameters).then(function(response: request.Response) {
                return response.body;
            });
        };
    fetchMolecularProfileSampleCountsUsingPOSTURL(parameters: {
        'studyViewFilter': StudyViewFilter,
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/molecular-profile-sample-counts/fetch';

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
        let path = '/molecular-profile-sample-counts/fetch';
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
        }): Promise < Array < GenomicDataCount >
        > {
            return this.fetchMolecularProfileSampleCountsUsingPOSTWithHttpInfo(parameters).then(function(response: request.Response) {
                return response.body;
            });
        };
    fetchCoExpressionsUsingPOSTURL(parameters: {
        'coExpressionFilter': CoExpressionFilter,
        'molecularProfileIdA': string,
        'molecularProfileIdB': string,
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
     * @param {} coExpressionFilter - List of Sample IDs/Sample List ID and Entrez Gene ID/Gene set ID
     * @param {string} molecularProfileIdA - Molecular Profile ID from the Genetic Entity referenced in the co-expression filter e.g. acc_tcga_rna_seq_v2_mrna
     * @param {string} molecularProfileIdB - Molecular Profile ID (can be the same as molecularProfileIdA) e.g. acc_tcga_rna_seq_v2_mrna
     * @param {number} threshold - Threshold
     */
    fetchCoExpressionsUsingPOSTWithHttpInfo(parameters: {
        'coExpressionFilter': CoExpressionFilter,
        'molecularProfileIdA': string,
        'molecularProfileIdB': string,
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

            if (parameters['coExpressionFilter'] !== undefined) {
                body = parameters['coExpressionFilter'];
            }

            if (parameters['coExpressionFilter'] === undefined) {
                reject(new Error('Missing required  parameter: coExpressionFilter'));
                return;
            }

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
     * @param {} coExpressionFilter - List of Sample IDs/Sample List ID and Entrez Gene ID/Gene set ID
     * @param {string} molecularProfileIdA - Molecular Profile ID from the Genetic Entity referenced in the co-expression filter e.g. acc_tcga_rna_seq_v2_mrna
     * @param {string} molecularProfileIdB - Molecular Profile ID (can be the same as molecularProfileIdA) e.g. acc_tcga_rna_seq_v2_mrna
     * @param {number} threshold - Threshold
     */
    fetchCoExpressionsUsingPOST(parameters: {
            'coExpressionFilter': CoExpressionFilter,
            'molecularProfileIdA': string,
            'molecularProfileIdB': string,
            'threshold' ? : number,
            $queryParameters ? : any,
            $domain ? : string
        }): Promise < Array < CoExpression >
        > {
            return this.fetchCoExpressionsUsingPOSTWithHttpInfo(parameters).then(function(response: request.Response) {
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
     * @name CBioPortalAPIInternal#fetchCopyNumberCountsUsingPOST
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
     * @name CBioPortalAPIInternal#fetchCopyNumberCountsUsingPOST
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
    fetchMrnaPercentileUsingPOSTURL(parameters: {
        'entrezGeneIds': Array < number > ,
        'molecularProfileId': string,
        'sampleId': string,
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
     * @param {} entrezGeneIds - List of Entrez Gene IDs
     * @param {string} molecularProfileId - Molecular Profile ID e.g. acc_tcga_rna_seq_v2_mrna
     * @param {string} sampleId - Sample ID e.g. TCGA-OR-A5J2-01
     */
    fetchMrnaPercentileUsingPOSTWithHttpInfo(parameters: {
        'entrezGeneIds': Array < number > ,
        'molecularProfileId': string,
        'sampleId': string,
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

            if (parameters['entrezGeneIds'] !== undefined) {
                body = parameters['entrezGeneIds'];
            }

            if (parameters['entrezGeneIds'] === undefined) {
                reject(new Error('Missing required  parameter: entrezGeneIds'));
                return;
            }

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
     * @param {} entrezGeneIds - List of Entrez Gene IDs
     * @param {string} molecularProfileId - Molecular Profile ID e.g. acc_tcga_rna_seq_v2_mrna
     * @param {string} sampleId - Sample ID e.g. TCGA-OR-A5J2-01
     */
    fetchMrnaPercentileUsingPOST(parameters: {
            'entrezGeneIds': Array < number > ,
            'molecularProfileId': string,
            'sampleId': string,
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
        }): Promise < Array < AlterationCountByGene >
        > {
            return this.fetchMutatedGenesUsingPOSTWithHttpInfo(parameters).then(function(response: request.Response) {
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
     * @name CBioPortalAPIInternal#fetchMutationCountsByPositionUsingPOST
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
     * @name CBioPortalAPIInternal#fetchMutationCountsByPositionUsingPOST
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
     * @name CBioPortalAPIInternal#getAllReferenceGenomeGenesUsingGET
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
     * @name CBioPortalAPIInternal#getAllReferenceGenomeGenesUsingGET
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
     * @name CBioPortalAPIInternal#fetchReferenceGenomeGenesUsingPOST
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
     * @name CBioPortalAPIInternal#fetchReferenceGenomeGenesUsingPOST
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
     * @name CBioPortalAPIInternal#getReferenceGenomeGeneUsingGET
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
     * @name CBioPortalAPIInternal#getReferenceGenomeGeneUsingGET
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
    fetchResourceDefinitionsUsingPOSTURL(parameters: {
        'projection' ? : "DETAILED" | "ID" | "META" | "SUMMARY",
        'studyIds': Array < string > ,
            $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/resource-definitions/fetch';
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
     * Get all resource definitions for specified studies
     * @method
     * @name CBioPortalAPIInternal#fetchResourceDefinitionsUsingPOST
     * @param {string} projection - Level of detail of the response
     * @param {} studyIds - List of Study IDs
     */
    fetchResourceDefinitionsUsingPOSTWithHttpInfo(parameters: {
        'projection' ? : "DETAILED" | "ID" | "META" | "SUMMARY",
        'studyIds': Array < string > ,
            $queryParameters ? : any,
            $domain ? : string
    }): Promise < request.Response > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        const errorHandlers = this.errorHandlers;
        const request = this.request;
        let path = '/resource-definitions/fetch';
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
     * Get all resource definitions for specified studies
     * @method
     * @name CBioPortalAPIInternal#fetchResourceDefinitionsUsingPOST
     * @param {string} projection - Level of detail of the response
     * @param {} studyIds - List of Study IDs
     */
    fetchResourceDefinitionsUsingPOST(parameters: {
            'projection' ? : "DETAILED" | "ID" | "META" | "SUMMARY",
            'studyIds': Array < string > ,
                $queryParameters ? : any,
                $domain ? : string
        }): Promise < Array < ResourceDefinition >
        > {
            return this.fetchResourceDefinitionsUsingPOSTWithHttpInfo(parameters).then(function(response: request.Response) {
                return response.body;
            });
        };
    fetchCaseListCountsUsingPOSTURL(parameters: {
        'studyViewFilter': StudyViewFilter,
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/sample-lists-counts/fetch';

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
     * Fetch case list sample counts by study view filter
     * @method
     * @name CBioPortalAPIInternal#fetchCaseListCountsUsingPOST
     * @param {} studyViewFilter - Study view filter
     */
    fetchCaseListCountsUsingPOSTWithHttpInfo(parameters: {
        'studyViewFilter': StudyViewFilter,
        $queryParameters ? : any,
        $domain ? : string
    }): Promise < request.Response > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        const errorHandlers = this.errorHandlers;
        const request = this.request;
        let path = '/sample-lists-counts/fetch';
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
     * Fetch case list sample counts by study view filter
     * @method
     * @name CBioPortalAPIInternal#fetchCaseListCountsUsingPOST
     * @param {} studyViewFilter - Study view filter
     */
    fetchCaseListCountsUsingPOST(parameters: {
            'studyViewFilter': StudyViewFilter,
            $queryParameters ? : any,
            $domain ? : string
        }): Promise < Array < CaseListDataCount >
        > {
            return this.fetchCaseListCountsUsingPOSTWithHttpInfo(parameters).then(function(response: request.Response) {
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
        let path = '/structural-variant/fetch';
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
     * @name CBioPortalAPIInternal#fetchStructuralVariantsUsingPOST
     * @param {array} entrezGeneIds - A web service for supplying JSON formatted data to cBioPortal clients. Please note that interal API is currently in beta and subject to change.
     * @param {array} molecularProfileIds - A web service for supplying JSON formatted data to cBioPortal clients. Please note that interal API is currently in beta and subject to change.
     * @param {string} sampleMolecularIdentifiers0MolecularProfileId - A web service for supplying JSON formatted data to cBioPortal clients. Please note that interal API is currently in beta and subject to change.
     * @param {string} sampleMolecularIdentifiers0SampleId - A web service for supplying JSON formatted data to cBioPortal clients. Please note that interal API is currently in beta and subject to change.
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
        let path = '/structural-variant/fetch';
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
     * @name CBioPortalAPIInternal#fetchStructuralVariantsUsingPOST
     * @param {array} entrezGeneIds - A web service for supplying JSON formatted data to cBioPortal clients. Please note that interal API is currently in beta and subject to change.
     * @param {array} molecularProfileIds - A web service for supplying JSON formatted data to cBioPortal clients. Please note that interal API is currently in beta and subject to change.
     * @param {string} sampleMolecularIdentifiers0MolecularProfileId - A web service for supplying JSON formatted data to cBioPortal clients. Please note that interal API is currently in beta and subject to change.
     * @param {string} sampleMolecularIdentifiers0SampleId - A web service for supplying JSON formatted data to cBioPortal clients. Please note that interal API is currently in beta and subject to change.
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
    fetchStructuralVariantGenesUsingPOSTURL(parameters: {
        'studyViewFilter': StudyViewFilter,
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/structuralvariant-genes/fetch';

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
     * Fetch structural variant genes by study view filter
     * @method
     * @name CBioPortalAPIInternal#fetchStructuralVariantGenesUsingPOST
     * @param {} studyViewFilter - Study view filter
     */
    fetchStructuralVariantGenesUsingPOSTWithHttpInfo(parameters: {
        'studyViewFilter': StudyViewFilter,
        $queryParameters ? : any,
        $domain ? : string
    }): Promise < request.Response > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        const errorHandlers = this.errorHandlers;
        const request = this.request;
        let path = '/structuralvariant-genes/fetch';
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
     * Fetch structural variant genes by study view filter
     * @method
     * @name CBioPortalAPIInternal#fetchStructuralVariantGenesUsingPOST
     * @param {} studyViewFilter - Study view filter
     */
    fetchStructuralVariantGenesUsingPOST(parameters: {
            'studyViewFilter': StudyViewFilter,
            $queryParameters ? : any,
            $domain ? : string
        }): Promise < Array < AlterationCountByGene >
        > {
            return this.fetchStructuralVariantGenesUsingPOSTWithHttpInfo(parameters).then(function(response: request.Response) {
                return response.body;
            });
        };
    getAllClinicalEventsInStudyUsingGETURL(parameters: {
        'direction' ? : "ASC" | "DESC",
        'pageNumber' ? : number,
        'pageSize' ? : number,
        'projection' ? : "DETAILED" | "ID" | "META" | "SUMMARY",
        'sortBy' ? : "endNumberOfDaysSinceDiagnosis" | "eventType" | "startNumberOfDaysSinceDiagnosis",
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
     * @name CBioPortalAPIInternal#getAllClinicalEventsInStudyUsingGET
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
        'projection' ? : "DETAILED" | "ID" | "META" | "SUMMARY",
        'sortBy' ? : "endNumberOfDaysSinceDiagnosis" | "eventType" | "startNumberOfDaysSinceDiagnosis",
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
     * @name CBioPortalAPIInternal#getAllClinicalEventsInStudyUsingGET
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
            'projection' ? : "DETAILED" | "ID" | "META" | "SUMMARY",
            'sortBy' ? : "endNumberOfDaysSinceDiagnosis" | "eventType" | "startNumberOfDaysSinceDiagnosis",
            'studyId': string,
            $queryParameters ? : any,
                $domain ? : string
        }): Promise < Array < ClinicalEvent >
        > {
            return this.getAllClinicalEventsInStudyUsingGETWithHttpInfo(parameters).then(function(response: request.Response) {
                return response.body;
            });
        };
    getAllClinicalEventsOfPatientInStudyUsingGETURL(parameters: {
        'direction' ? : "ASC" | "DESC",
        'pageNumber' ? : number,
        'pageSize' ? : number,
        'patientId': string,
        'projection' ? : "DETAILED" | "ID" | "META" | "SUMMARY",
        'sortBy' ? : "endNumberOfDaysSinceDiagnosis" | "eventType" | "startNumberOfDaysSinceDiagnosis",
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
     * @name CBioPortalAPIInternal#getAllClinicalEventsOfPatientInStudyUsingGET
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
        'projection' ? : "DETAILED" | "ID" | "META" | "SUMMARY",
        'sortBy' ? : "endNumberOfDaysSinceDiagnosis" | "eventType" | "startNumberOfDaysSinceDiagnosis",
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
     * @name CBioPortalAPIInternal#getAllClinicalEventsOfPatientInStudyUsingGET
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
            'projection' ? : "DETAILED" | "ID" | "META" | "SUMMARY",
            'sortBy' ? : "endNumberOfDaysSinceDiagnosis" | "eventType" | "startNumberOfDaysSinceDiagnosis",
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
        'projection' ? : "DETAILED" | "ID" | "META" | "SUMMARY",
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
     * @name CBioPortalAPIInternal#getAllResourceDataOfPatientInStudyUsingGET
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
        'projection' ? : "DETAILED" | "ID" | "META" | "SUMMARY",
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
     * @name CBioPortalAPIInternal#getAllResourceDataOfPatientInStudyUsingGET
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
            'projection' ? : "DETAILED" | "ID" | "META" | "SUMMARY",
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
    getAllStudyResourceDataInStudyUsingGETURL(parameters: {
        'direction' ? : "ASC" | "DESC",
        'pageNumber' ? : number,
        'pageSize' ? : number,
        'projection' ? : "DETAILED" | "ID" | "META" | "SUMMARY",
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
     * @name CBioPortalAPIInternal#getAllStudyResourceDataInStudyUsingGET
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
        'projection' ? : "DETAILED" | "ID" | "META" | "SUMMARY",
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
     * @name CBioPortalAPIInternal#getAllStudyResourceDataInStudyUsingGET
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
            'projection' ? : "DETAILED" | "ID" | "META" | "SUMMARY",
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
        'projection' ? : "DETAILED" | "ID" | "META" | "SUMMARY",
        'sortBy' ? : "description" | "displayName" | "openByDefault" | "priority" | "resourceId" | "resourceType" | "studyId",
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
     * Get all resource definitions in the specified study
     * @method
     * @name CBioPortalAPIInternal#getAllResourceDefinitionsInStudyUsingGET
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
        'projection' ? : "DETAILED" | "ID" | "META" | "SUMMARY",
        'sortBy' ? : "description" | "displayName" | "openByDefault" | "priority" | "resourceId" | "resourceType" | "studyId",
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
     * Get all resource definitions in the specified study
     * @method
     * @name CBioPortalAPIInternal#getAllResourceDefinitionsInStudyUsingGET
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
            'projection' ? : "DETAILED" | "ID" | "META" | "SUMMARY",
            'sortBy' ? : "description" | "displayName" | "openByDefault" | "priority" | "resourceId" | "resourceType" | "studyId",
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
     * @name CBioPortalAPIInternal#getResourceDefinitionInStudyUsingGET
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
     * @name CBioPortalAPIInternal#getResourceDefinitionInStudyUsingGET
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
    getAllResourceDataOfSampleInStudyUsingGETURL(parameters: {
        'direction' ? : "ASC" | "DESC",
        'pageNumber' ? : number,
        'pageSize' ? : number,
        'projection' ? : "DETAILED" | "ID" | "META" | "SUMMARY",
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
     * @name CBioPortalAPIInternal#getAllResourceDataOfSampleInStudyUsingGET
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
        'projection' ? : "DETAILED" | "ID" | "META" | "SUMMARY",
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
     * @name CBioPortalAPIInternal#getAllResourceDataOfSampleInStudyUsingGET
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
            'projection' ? : "DETAILED" | "ID" | "META" | "SUMMARY",
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
    getSignificantCopyNumberRegionsUsingGETURL(parameters: {
        'direction' ? : "ASC" | "DESC",
        'pageNumber' ? : number,
        'pageSize' ? : number,
        'projection' ? : "DETAILED" | "ID" | "META" | "SUMMARY",
        'sortBy' ? : "amp" | "chromosome" | "cytoband" | "qValue" | "widePeakEnd" | "widePeakStart",
        'studyId': string,
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/studies/{studyId}/significant-copy-number-regions';
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
     * Get significant copy number alteration regions in a study
     * @method
     * @name CBioPortalAPIInternal#getSignificantCopyNumberRegionsUsingGET
     * @param {string} direction - Direction of the sort
     * @param {integer} pageNumber - Page number of the result list
     * @param {integer} pageSize - Page size of the result list
     * @param {string} projection - Level of detail of the response
     * @param {string} sortBy - Name of the property that the result list is sorted by
     * @param {string} studyId - Study ID e.g. acc_tcga
     */
    getSignificantCopyNumberRegionsUsingGETWithHttpInfo(parameters: {
        'direction' ? : "ASC" | "DESC",
        'pageNumber' ? : number,
        'pageSize' ? : number,
        'projection' ? : "DETAILED" | "ID" | "META" | "SUMMARY",
        'sortBy' ? : "amp" | "chromosome" | "cytoband" | "qValue" | "widePeakEnd" | "widePeakStart",
        'studyId': string,
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
     * Get significant copy number alteration regions in a study
     * @method
     * @name CBioPortalAPIInternal#getSignificantCopyNumberRegionsUsingGET
     * @param {string} direction - Direction of the sort
     * @param {integer} pageNumber - Page number of the result list
     * @param {integer} pageSize - Page size of the result list
     * @param {string} projection - Level of detail of the response
     * @param {string} sortBy - Name of the property that the result list is sorted by
     * @param {string} studyId - Study ID e.g. acc_tcga
     */
    getSignificantCopyNumberRegionsUsingGET(parameters: {
            'direction' ? : "ASC" | "DESC",
            'pageNumber' ? : number,
            'pageSize' ? : number,
            'projection' ? : "DETAILED" | "ID" | "META" | "SUMMARY",
            'sortBy' ? : "amp" | "chromosome" | "cytoband" | "qValue" | "widePeakEnd" | "widePeakStart",
            'studyId': string,
            $queryParameters ? : any,
                $domain ? : string
        }): Promise < Array < Gistic >
        > {
            return this.getSignificantCopyNumberRegionsUsingGETWithHttpInfo(parameters).then(function(response: request.Response) {
                return response.body;
            });
        };
    getSignificantlyMutatedGenesUsingGETURL(parameters: {
        'direction' ? : "ASC" | "DESC",
        'pageNumber' ? : number,
        'pageSize' ? : number,
        'projection' ? : "DETAILED" | "ID" | "META" | "SUMMARY",
        'sortBy' ? : "entrezGeneId" | "hugoGeneSymbol" | "numberOfMutations" | "pValue" | "qValue" | "rank",
        'studyId': string,
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/studies/{studyId}/significantly-mutated-genes';
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
     * Get significantly mutated genes in a study
     * @method
     * @name CBioPortalAPIInternal#getSignificantlyMutatedGenesUsingGET
     * @param {string} direction - Direction of the sort
     * @param {integer} pageNumber - Page number of the result list
     * @param {integer} pageSize - Page size of the result list
     * @param {string} projection - Level of detail of the response
     * @param {string} sortBy - Name of the property that the result list is sorted by
     * @param {string} studyId - Study ID e.g. acc_tcga
     */
    getSignificantlyMutatedGenesUsingGETWithHttpInfo(parameters: {
        'direction' ? : "ASC" | "DESC",
        'pageNumber' ? : number,
        'pageSize' ? : number,
        'projection' ? : "DETAILED" | "ID" | "META" | "SUMMARY",
        'sortBy' ? : "entrezGeneId" | "hugoGeneSymbol" | "numberOfMutations" | "pValue" | "qValue" | "rank",
        'studyId': string,
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
     * Get significantly mutated genes in a study
     * @method
     * @name CBioPortalAPIInternal#getSignificantlyMutatedGenesUsingGET
     * @param {string} direction - Direction of the sort
     * @param {integer} pageNumber - Page number of the result list
     * @param {integer} pageSize - Page size of the result list
     * @param {string} projection - Level of detail of the response
     * @param {string} sortBy - Name of the property that the result list is sorted by
     * @param {string} studyId - Study ID e.g. acc_tcga
     */
    getSignificantlyMutatedGenesUsingGET(parameters: {
            'direction' ? : "ASC" | "DESC",
            'pageNumber' ? : number,
            'pageSize' ? : number,
            'projection' ? : "DETAILED" | "ID" | "META" | "SUMMARY",
            'sortBy' ? : "entrezGeneId" | "hugoGeneSymbol" | "numberOfMutations" | "pValue" | "qValue" | "rank",
            'studyId': string,
            $queryParameters ? : any,
                $domain ? : string
        }): Promise < Array < MutSig >
        > {
            return this.getSignificantlyMutatedGenesUsingGETWithHttpInfo(parameters).then(function(response: request.Response) {
                return response.body;
            });
        };
    getAllTimestampsUsingGETURL(parameters: {
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/timestamps';

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
     * Get the last time each static resource was updated
     * @method
     * @name CBioPortalAPIInternal#getAllTimestampsUsingGET
     */
    getAllTimestampsUsingGETWithHttpInfo(parameters: {
        $queryParameters ? : any,
            $domain ? : string
    }): Promise < request.Response > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        const errorHandlers = this.errorHandlers;
        const request = this.request;
        let path = '/timestamps';
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
     * Get the last time each static resource was updated
     * @method
     * @name CBioPortalAPIInternal#getAllTimestampsUsingGET
     */
    getAllTimestampsUsingGET(parameters: {
        $queryParameters ? : any,
            $domain ? : string
    }): Promise < {} > {
        return this.getAllTimestampsUsingGETWithHttpInfo(parameters).then(function(response: request.Response) {
            return response.body;
        });
    };
}