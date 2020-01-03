import * as request from "superagent";

type CallbackHandler = (err: any, res ? : request.Response) => void;
export type AnnotateMutationByGenomicChangeQuery = {
    'genomicLocation': string

        'id': string

        'tumorType': string

};
export type TreatmentDrug = {
    'priority': number

        'treatmentDrugId': TreatmentDrugId

};
export type Query = {
    'alteration': string

        'alterationType': string

        'consequence': string

        'entrezGeneId': number

        'hgvs': string

        'hugoSymbol': string

        'id': string

        'proteinEnd': number

        'proteinStart': number

        'svType': "DELETION" | "TRANSLOCATION" | "DUPLICATION" | "INSERTION" | "INVERSION" | "FUSION"

        'tumorType': string

        'type': string

};
export type Article = {
    'abstract': string

        'authors': string

        'elocationId': string

        'issue': string

        'journal': string

        'link': string

        'pages': string

        'pmid': string

        'pubDate': string

        'reference': string

        'title': string

        'volume': string

};
export type Alteration = {
    'alteration': string

        'consequence': VariantConsequence

        'gene': Gene

        'name': string

        'proteinEnd': number

        'proteinStart': number

        'refResidues': string

        'variantResidues': string

};
export type AnnotatedVariant = {
    'entrezGeneId': number

        'gene': string

        'isoform': string

        'mutationEffect': string

        'mutationEffectAbstracts': string

        'mutationEffectPmids': string

        'oncogenicity': string

        'proteinChange': string

        'refSeq': string

        'variant': string

};
export type Gene = {
    'curatedIsoform': string

        'curatedRefSeq': string

        'entrezGeneId': number

        'geneAliases': Array < string >

        'hugoSymbol': string

        'name': string

        'oncogene': boolean

        'tsg': boolean

};
export type TumorType = {
    'NCI': Array < string >

        'UMLS': Array < string >

        'children': {}

        'code': string

        'color': string

        'deprecated': boolean

        'history': Array < string >

        'id': number

        'level': number

        'links': Array < Link >

        'mainType': MainType

        'name': string

        'parent': string

        'tissue': string

};
export type Version = {
    'date': string

        'version': string

};
export type TreatmentDrugId = {
    'drug': Drug

};
export type GeneEvidence = {
    'articles': Array < Article >

        'desc': string

        'evidenceId': number

        'evidenceType': "GENE_SUMMARY" | "MUTATION_SUMMARY" | "TUMOR_TYPE_SUMMARY" | "GENE_TUMOR_TYPE_SUMMARY" | "PROGNOSTIC_SUMMARY" | "DIAGNOSTIC_SUMMARY" | "GENE_BACKGROUND" | "ONCOGENIC" | "MUTATION_EFFECT" | "VUS" | "PROGNOSTIC_IMPLICATION" | "DIAGNOSTIC_IMPLICATION" | "STANDARD_THERAPEUTIC_IMPLICATIONS_FOR_DRUG_SENSITIVITY" | "STANDARD_THERAPEUTIC_IMPLICATIONS_FOR_DRUG_RESISTANCE" | "INVESTIGATIONAL_THERAPEUTIC_IMPLICATIONS_DRUG_SENSITIVITY" | "INVESTIGATIONAL_THERAPEUTIC_IMPLICATIONS_DRUG_RESISTANCE"

        'gene': Gene

        'id': string

        'lastEdit': string

        'shortDesc': string

        'status': string

};
export type Evidence = {
    'additionalInfo': string

        'alterations': Array < Alteration >

        'articles': Array < Article >

        'cancerType': string

        'description': string

        'evidenceType': "GENE_SUMMARY" | "MUTATION_SUMMARY" | "TUMOR_TYPE_SUMMARY" | "GENE_TUMOR_TYPE_SUMMARY" | "PROGNOSTIC_SUMMARY" | "DIAGNOSTIC_SUMMARY" | "GENE_BACKGROUND" | "ONCOGENIC" | "MUTATION_EFFECT" | "VUS" | "PROGNOSTIC_IMPLICATION" | "DIAGNOSTIC_IMPLICATION" | "STANDARD_THERAPEUTIC_IMPLICATIONS_FOR_DRUG_SENSITIVITY" | "STANDARD_THERAPEUTIC_IMPLICATIONS_FOR_DRUG_RESISTANCE" | "INVESTIGATIONAL_THERAPEUTIC_IMPLICATIONS_DRUG_SENSITIVITY" | "INVESTIGATIONAL_THERAPEUTIC_IMPLICATIONS_DRUG_RESISTANCE"

        'gene': Gene

        'id': number

        'knownEffect': string

        'lastEdit': string

        'levelOfEvidence': "LEVEL_0" | "LEVEL_1" | "LEVEL_2A" | "LEVEL_2B" | "LEVEL_3A" | "LEVEL_3B" | "LEVEL_4" | "LEVEL_R1" | "LEVEL_R2" | "LEVEL_R3" | "LEVEL_Px1" | "LEVEL_Px2" | "LEVEL_Px3" | "LEVEL_Dx1" | "LEVEL_Dx2" | "LEVEL_Dx3"

        'oncoTreeType': TumorType

        'propagation': string

        'subtype': string

        'treatments': Array < Treatment >

};
export type AnnotateStructuralVariantQuery = {
    'functionalFusion': boolean

        'geneA': QueryGene

        'geneB': QueryGene

        'id': string

        'structuralVariantType': "DELETION" | "TRANSLOCATION" | "DUPLICATION" | "INSERTION" | "INVERSION" | "FUSION"

        'tumorType': string

};
export type IndicatorQueryResp = {
    'alleleExist': boolean

        'dataVersion': string

        'diagnosticSummary': string

        'geneExist': boolean

        'geneSummary': string

        'highestResistanceLevel': "LEVEL_0" | "LEVEL_1" | "LEVEL_2A" | "LEVEL_2B" | "LEVEL_3A" | "LEVEL_3B" | "LEVEL_4" | "LEVEL_R1" | "LEVEL_R2" | "LEVEL_R3" | "LEVEL_Px1" | "LEVEL_Px2" | "LEVEL_Px3" | "LEVEL_Dx1" | "LEVEL_Dx2" | "LEVEL_Dx3"

        'highestSensitiveLevel': "LEVEL_0" | "LEVEL_1" | "LEVEL_2A" | "LEVEL_2B" | "LEVEL_3A" | "LEVEL_3B" | "LEVEL_4" | "LEVEL_R1" | "LEVEL_R2" | "LEVEL_R3" | "LEVEL_Px1" | "LEVEL_Px2" | "LEVEL_Px3" | "LEVEL_Dx1" | "LEVEL_Dx2" | "LEVEL_Dx3"

        'hotspot': boolean

        'lastUpdate': string

        'mutationEffect': MutationEffectResp

        'oncogenic': string

        'otherSignificantResistanceLevels': Array < "LEVEL_0" | "LEVEL_1" | "LEVEL_2A" | "LEVEL_2B" | "LEVEL_3A" | "LEVEL_3B" | "LEVEL_4" | "LEVEL_R1" | "LEVEL_R2" | "LEVEL_R3" | "LEVEL_Px1" | "LEVEL_Px2" | "LEVEL_Px3" | "LEVEL_Dx1" | "LEVEL_Dx2" | "LEVEL_Dx3" >

        'otherSignificantSensitiveLevels': Array < "LEVEL_0" | "LEVEL_1" | "LEVEL_2A" | "LEVEL_2B" | "LEVEL_3A" | "LEVEL_3B" | "LEVEL_4" | "LEVEL_R1" | "LEVEL_R2" | "LEVEL_R3" | "LEVEL_Px1" | "LEVEL_Px2" | "LEVEL_Px3" | "LEVEL_Dx1" | "LEVEL_Dx2" | "LEVEL_Dx3" >

        'prognosticSummary': string

        'query': Query

        'treatments': Array < IndicatorQueryTreatment >

        'tumorTypeSummary': string

        'variantExist': boolean

        'variantSummary': string

        'vus': boolean

};
export type ActionableGene = {
    'abstracts': string

        'cancerType': string

        'drugs': string

        'entrezGeneId': number

        'gene': string

        'isoform': string

        'level': string

        'pmids': string

        'proteinChange': string

        'refSeq': string

        'variant': string

};
export type ArticleAbstract = {
    'abstract': string

        'link': string

};
export type InfoLevel = {
    'colorHex': string

        'description': string

        'htmlDescription': string

        'levelOfEvidence': "LEVEL_0" | "LEVEL_1" | "LEVEL_2A" | "LEVEL_2B" | "LEVEL_3A" | "LEVEL_3B" | "LEVEL_4" | "LEVEL_R1" | "LEVEL_R2" | "LEVEL_R3" | "LEVEL_Px1" | "LEVEL_Px2" | "LEVEL_Px3" | "LEVEL_Dx1" | "LEVEL_Dx2" | "LEVEL_Dx3"

};
export type Drug = {
    'drugName': string

        'ncitCode': string

        'synonyms': Array < string >

        'uuid': string

};
export type CuratedGene = {
    'entrezGeneId': number

        'highestResistancLevel': string

        'highestSensitiveLevel': string

        'hugoSymbol': string

        'isoform': string

        'oncogene': boolean

        'refSeq': string

        'summary': string

        'tsg': boolean

};
export type EvidenceQueryRes = {
    'alleles': Array < Alteration >

        'alterations': Array < Alteration >

        'evidences': Array < Evidence >

        'exactMatchedAlteration': Alteration

        'gene': Gene

        'id': string

        'levelOfEvidences': Array < "LEVEL_0" | "LEVEL_1" | "LEVEL_2A" | "LEVEL_2B" | "LEVEL_3A" | "LEVEL_3B" | "LEVEL_4" | "LEVEL_R1" | "LEVEL_R2" | "LEVEL_R3" | "LEVEL_Px1" | "LEVEL_Px2" | "LEVEL_Px3" | "LEVEL_Dx1" | "LEVEL_Dx2" | "LEVEL_Dx3" >

        'oncoTreeTypes': Array < TumorType >

        'query': Query

};
export type QueryGene = {
    'entrezGeneId': number

        'hugoSymbol': string

};
export type CancerGene = {
    'entrezGeneId': number

        'foundation': boolean

        'foundationHeme': boolean

        'hugoSymbol': string

        'mSKHeme': boolean

        'mSKImpact': boolean

        'occurrenceCount': number

        'oncogene': boolean

        'oncokbAnnotated': boolean

        'sangerCGC': boolean

        'tsg': boolean

        'vogelstein': boolean

};
export type MainType = {
    'id': number

        'name': string

};
export type OncoKBInfo = {
    'dataVersion': Version

        'levels': Array < InfoLevel >

        'ncitVersion': string

        'oncoTreeVersion': string

};
export type VariantConsequence = {
    'description': string

        'isGenerallyTruncating': boolean

        'term': string

};
export type AnnotateMutationByProteinChangeQuery = {
    'alteration': string

        'consequence': string

        'gene': QueryGene

        'id': string

        'proteinEnd': number

        'proteinStart': number

        'tumorType': string

};
export type IndicatorQueryTreatment = {
    'abstracts': Array < ArticleAbstract >

        'approvedIndications': Array < string >

        'drugs': Array < Drug >

        'fdaApproved': boolean

        'level': "LEVEL_0" | "LEVEL_1" | "LEVEL_2A" | "LEVEL_2B" | "LEVEL_3A" | "LEVEL_3B" | "LEVEL_4" | "LEVEL_R1" | "LEVEL_R2" | "LEVEL_R3" | "LEVEL_Px1" | "LEVEL_Px2" | "LEVEL_Px3" | "LEVEL_Dx1" | "LEVEL_Dx2" | "LEVEL_Dx3"

        'pmids': Array < string >

};
export type ResponseEntity = {
    'body': {}

    'statusCode': "100" | "101" | "102" | "103" | "200" | "201" | "202" | "203" | "204" | "205" | "206" | "207" | "208" | "226" | "300" | "301" | "302" | "302" | "303" | "304" | "305" | "307" | "308" | "400" | "401" | "402" | "403" | "404" | "405" | "406" | "407" | "408" | "409" | "410" | "411" | "412" | "413" | "413" | "414" | "414" | "415" | "416" | "417" | "418" | "419" | "420" | "421" | "422" | "423" | "424" | "426" | "428" | "429" | "431" | "500" | "501" | "502" | "503" | "504" | "505" | "506" | "507" | "508" | "509" | "510" | "511"

};
export type Treatment = {
    'approvedIndications': Array < string >

        'drugs': Array < TreatmentDrug >

        'priority': number

};
export type EvidenceQueries = {
    'evidenceTypes': string

        'highestLevelOnly': boolean

        'levels': Array < "LEVEL_0" | "LEVEL_1" | "LEVEL_2A" | "LEVEL_2B" | "LEVEL_3A" | "LEVEL_3B" | "LEVEL_4" | "LEVEL_R1" | "LEVEL_R2" | "LEVEL_R3" | "LEVEL_Px1" | "LEVEL_Px2" | "LEVEL_Px3" | "LEVEL_Dx1" | "LEVEL_Dx2" | "LEVEL_Dx3" >

        'queries': Array < Query >

        'source': string

};
export type VariantSearchQuery = {
    'consequence': string

        'entrezGeneId': number

        'hgvs': string

        'hugoSymbol': string

        'proteinEnd': number

        'proteinStart': number

        'variant': string

        'variantType': string

};
export type MutationEffectResp = {
    'citations': Citations

        'description': string

        'knownEffect': string

};
export type AnnotateCopyNumberAlterationQuery = {
    'copyNameAlterationType': "AMPLIFICATION" | "DELETION" | "GAIN" | "LOSS"

        'gene': QueryGene

        'id': string

        'tumorType': string

};
export type AnnotateMutationByHGVSgQuery = {
    'hgvsg': string

        'id': string

        'tumorType': string

};
export type Citations = {
    'abstracts': Array < ArticleAbstract >

        'pmids': Array < string >

};
export type Link = {
    'href': string

        'method': string

        'rel': string

};

/**
 * OncoKB, a comprehensive and curated precision oncology knowledge base, offers oncologists detailed, evidence-based information about individual somatic mutations and structural alterations present in patient tumors with the goal of supporting optimal treatment decisions.
 * @class OncoKbAPI
 * @param {(string)} [domainOrOptions] - The project domain.
 */
export default class OncoKbAPI {

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

    annotateCopyNumberAlterationsGetUsingGETURL(parameters: {
        'hugoSymbol' ? : string,
        'entrezGeneId' ? : number,
        'copyNameAlterationType': "AMPLIFICATION" | "DELETION" | "GAIN" | "LOSS",
        'tumorType' ? : string,
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/annotate/copyNumberAlterations';
        if (parameters['hugoSymbol'] !== undefined) {
            queryParameters['hugoSymbol'] = parameters['hugoSymbol'];
        }

        if (parameters['entrezGeneId'] !== undefined) {
            queryParameters['entrezGeneId'] = parameters['entrezGeneId'];
        }

        if (parameters['copyNameAlterationType'] !== undefined) {
            queryParameters['copyNameAlterationType'] = parameters['copyNameAlterationType'];
        }

        if (parameters['tumorType'] !== undefined) {
            queryParameters['tumorType'] = parameters['tumorType'];
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
     * Annotate copy number alteration.
     * @method
     * @name OncoKbAPI#annotateCopyNumberAlterationsGetUsingGET
     * @param {string} hugoSymbol - The gene symbol used in Human Genome Organisation. Example: BRAF
     * @param {integer} entrezGeneId - The entrez gene ID. (Higher priority than hugoSymbol). Example: 673
     * @param {string} copyNameAlterationType - Copy number alteration type
     * @param {string} tumorType - OncoTree(http://oncotree.mskcc.org) tumor type name. The field supports OncoTree Code, OncoTree Name and OncoTree Main type. Example: Melanoma
     */
    annotateCopyNumberAlterationsGetUsingGETWithHttpInfo(parameters: {
        'hugoSymbol' ? : string,
        'entrezGeneId' ? : number,
        'copyNameAlterationType': "AMPLIFICATION" | "DELETION" | "GAIN" | "LOSS",
        'tumorType' ? : string,
        $queryParameters ? : any,
            $domain ? : string
    }): Promise < request.Response > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        const errorHandlers = this.errorHandlers;
        const request = this.request;
        let path = '/annotate/copyNumberAlterations';
        let body: any;
        let queryParameters: any = {};
        let headers: any = {};
        let form: any = {};
        return new Promise(function(resolve, reject) {
            headers['Accept'] = 'application/json';
            headers['Content-Type'] = 'application/json';

            if (parameters['hugoSymbol'] !== undefined) {
                queryParameters['hugoSymbol'] = parameters['hugoSymbol'];
            }

            if (parameters['entrezGeneId'] !== undefined) {
                queryParameters['entrezGeneId'] = parameters['entrezGeneId'];
            }

            if (parameters['copyNameAlterationType'] !== undefined) {
                queryParameters['copyNameAlterationType'] = parameters['copyNameAlterationType'];
            }

            if (parameters['copyNameAlterationType'] === undefined) {
                reject(new Error('Missing required  parameter: copyNameAlterationType'));
                return;
            }

            if (parameters['tumorType'] !== undefined) {
                queryParameters['tumorType'] = parameters['tumorType'];
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
     * Annotate copy number alteration.
     * @method
     * @name OncoKbAPI#annotateCopyNumberAlterationsGetUsingGET
     * @param {string} hugoSymbol - The gene symbol used in Human Genome Organisation. Example: BRAF
     * @param {integer} entrezGeneId - The entrez gene ID. (Higher priority than hugoSymbol). Example: 673
     * @param {string} copyNameAlterationType - Copy number alteration type
     * @param {string} tumorType - OncoTree(http://oncotree.mskcc.org) tumor type name. The field supports OncoTree Code, OncoTree Name and OncoTree Main type. Example: Melanoma
     */
    annotateCopyNumberAlterationsGetUsingGET(parameters: {
        'hugoSymbol' ? : string,
        'entrezGeneId' ? : number,
        'copyNameAlterationType': "AMPLIFICATION" | "DELETION" | "GAIN" | "LOSS",
        'tumorType' ? : string,
        $queryParameters ? : any,
            $domain ? : string
    }): Promise < IndicatorQueryResp > {
        return this.annotateCopyNumberAlterationsGetUsingGETWithHttpInfo(parameters).then(function(response: request.Response) {
            return response.body;
        });
    };
    annotateCopyNumberAlterationsPostUsingPOSTURL(parameters: {
        'body': Array < AnnotateCopyNumberAlterationQuery > ,
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/annotate/copyNumberAlterations';

        if (parameters.$queryParameters) {
            Object.keys(parameters.$queryParameters).forEach(function(parameterName) {
                var parameter = parameters.$queryParameters[parameterName];
                queryParameters[parameterName] = parameter;
            });
        }
        let keys = Object.keys(queryParameters);
        return this.domain + path + (keys.length > 0 ? '?' + (keys.map(key => key + '=' + encodeURIComponent(queryParameters[key])).join('&')) : '');
    };

    /**
     * Annotate copy number alterations.
     * @method
     * @name OncoKbAPI#annotateCopyNumberAlterationsPostUsingPOST
     * @param {} body - List of queries. Please see swagger.json for request body format.
     */
    annotateCopyNumberAlterationsPostUsingPOSTWithHttpInfo(parameters: {
        'body': Array < AnnotateCopyNumberAlterationQuery > ,
        $queryParameters ? : any,
        $domain ? : string
    }): Promise < request.Response > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        const errorHandlers = this.errorHandlers;
        const request = this.request;
        let path = '/annotate/copyNumberAlterations';
        let body: any;
        let queryParameters: any = {};
        let headers: any = {};
        let form: any = {};
        return new Promise(function(resolve, reject) {
            headers['Accept'] = 'application/json';
            headers['Content-Type'] = 'application/json';

            if (parameters['body'] !== undefined) {
                body = parameters['body'];
            }

            if (parameters['body'] === undefined) {
                reject(new Error('Missing required  parameter: body'));
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
     * Annotate copy number alterations.
     * @method
     * @name OncoKbAPI#annotateCopyNumberAlterationsPostUsingPOST
     * @param {} body - List of queries. Please see swagger.json for request body format.
     */
    annotateCopyNumberAlterationsPostUsingPOST(parameters: {
            'body': Array < AnnotateCopyNumberAlterationQuery > ,
            $queryParameters ? : any,
            $domain ? : string
        }): Promise < Array < IndicatorQueryResp >
        > {
            return this.annotateCopyNumberAlterationsPostUsingPOSTWithHttpInfo(parameters).then(function(response: request.Response) {
                return response.body;
            });
        };
    annotateMutationsByGenomicChangeGetUsingGETURL(parameters: {
        'genomicLocation': string,
        'tumorType' ? : string,
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/annotate/mutations/byGenomicChange';
        if (parameters['genomicLocation'] !== undefined) {
            queryParameters['genomicLocation'] = parameters['genomicLocation'];
        }

        if (parameters['tumorType'] !== undefined) {
            queryParameters['tumorType'] = parameters['tumorType'];
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
     * Annotate mutation by genomic change.
     * @method
     * @name OncoKbAPI#annotateMutationsByGenomicChangeGetUsingGET
     * @param {string} genomicLocation - Genomic location. Example: 7,140453136,140453136,A,T
     * @param {string} tumorType - OncoTree(http://oncotree.mskcc.org) tumor type name. The field supports OncoTree Code, OncoTree Name and OncoTree Main type. Example: Melanoma
     */
    annotateMutationsByGenomicChangeGetUsingGETWithHttpInfo(parameters: {
        'genomicLocation': string,
        'tumorType' ? : string,
        $queryParameters ? : any,
        $domain ? : string
    }): Promise < request.Response > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        const errorHandlers = this.errorHandlers;
        const request = this.request;
        let path = '/annotate/mutations/byGenomicChange';
        let body: any;
        let queryParameters: any = {};
        let headers: any = {};
        let form: any = {};
        return new Promise(function(resolve, reject) {
            headers['Accept'] = 'application/json';
            headers['Content-Type'] = 'application/json';

            if (parameters['genomicLocation'] !== undefined) {
                queryParameters['genomicLocation'] = parameters['genomicLocation'];
            }

            if (parameters['genomicLocation'] === undefined) {
                reject(new Error('Missing required  parameter: genomicLocation'));
                return;
            }

            if (parameters['tumorType'] !== undefined) {
                queryParameters['tumorType'] = parameters['tumorType'];
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
     * Annotate mutation by genomic change.
     * @method
     * @name OncoKbAPI#annotateMutationsByGenomicChangeGetUsingGET
     * @param {string} genomicLocation - Genomic location. Example: 7,140453136,140453136,A,T
     * @param {string} tumorType - OncoTree(http://oncotree.mskcc.org) tumor type name. The field supports OncoTree Code, OncoTree Name and OncoTree Main type. Example: Melanoma
     */
    annotateMutationsByGenomicChangeGetUsingGET(parameters: {
        'genomicLocation': string,
        'tumorType' ? : string,
        $queryParameters ? : any,
        $domain ? : string
    }): Promise < IndicatorQueryResp > {
        return this.annotateMutationsByGenomicChangeGetUsingGETWithHttpInfo(parameters).then(function(response: request.Response) {
            return response.body;
        });
    };
    annotateMutationsByGenomicChangePostUsingPOSTURL(parameters: {
        'body': Array < AnnotateMutationByGenomicChangeQuery > ,
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/annotate/mutations/byGenomicChange';

        if (parameters.$queryParameters) {
            Object.keys(parameters.$queryParameters).forEach(function(parameterName) {
                var parameter = parameters.$queryParameters[parameterName];
                queryParameters[parameterName] = parameter;
            });
        }
        let keys = Object.keys(queryParameters);
        return this.domain + path + (keys.length > 0 ? '?' + (keys.map(key => key + '=' + encodeURIComponent(queryParameters[key])).join('&')) : '');
    };

    /**
     * Annotate mutations by genomic change.
     * @method
     * @name OncoKbAPI#annotateMutationsByGenomicChangePostUsingPOST
     * @param {} body - List of queries. Please see swagger.json for request body format.
     */
    annotateMutationsByGenomicChangePostUsingPOSTWithHttpInfo(parameters: {
        'body': Array < AnnotateMutationByGenomicChangeQuery > ,
        $queryParameters ? : any,
        $domain ? : string
    }): Promise < request.Response > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        const errorHandlers = this.errorHandlers;
        const request = this.request;
        let path = '/annotate/mutations/byGenomicChange';
        let body: any;
        let queryParameters: any = {};
        let headers: any = {};
        let form: any = {};
        return new Promise(function(resolve, reject) {
            headers['Accept'] = 'application/json';
            headers['Content-Type'] = 'application/json';

            if (parameters['body'] !== undefined) {
                body = parameters['body'];
            }

            if (parameters['body'] === undefined) {
                reject(new Error('Missing required  parameter: body'));
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
     * Annotate mutations by genomic change.
     * @method
     * @name OncoKbAPI#annotateMutationsByGenomicChangePostUsingPOST
     * @param {} body - List of queries. Please see swagger.json for request body format.
     */
    annotateMutationsByGenomicChangePostUsingPOST(parameters: {
            'body': Array < AnnotateMutationByGenomicChangeQuery > ,
            $queryParameters ? : any,
            $domain ? : string
        }): Promise < Array < IndicatorQueryResp >
        > {
            return this.annotateMutationsByGenomicChangePostUsingPOSTWithHttpInfo(parameters).then(function(response: request.Response) {
                return response.body;
            });
        };
    annotateMutationsByHGVSgGetUsingGETURL(parameters: {
        'hgvsg': string,
        'tumorType' ? : string,
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/annotate/mutations/byHGVSg';
        if (parameters['hgvsg'] !== undefined) {
            queryParameters['hgvsg'] = parameters['hgvsg'];
        }

        if (parameters['tumorType'] !== undefined) {
            queryParameters['tumorType'] = parameters['tumorType'];
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
     * Annotate mutation by HGVSg.
     * @method
     * @name OncoKbAPI#annotateMutationsByHGVSgGetUsingGET
     * @param {string} hgvsg - HGVS genomic format. Example: 7:g.140453136A>T
     * @param {string} tumorType - OncoTree(http://oncotree.mskcc.org) tumor type name. The field supports OncoTree Code, OncoTree Name and OncoTree Main type. Example: Melanoma
     */
    annotateMutationsByHGVSgGetUsingGETWithHttpInfo(parameters: {
        'hgvsg': string,
        'tumorType' ? : string,
        $queryParameters ? : any,
        $domain ? : string
    }): Promise < request.Response > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        const errorHandlers = this.errorHandlers;
        const request = this.request;
        let path = '/annotate/mutations/byHGVSg';
        let body: any;
        let queryParameters: any = {};
        let headers: any = {};
        let form: any = {};
        return new Promise(function(resolve, reject) {
            headers['Accept'] = 'application/json';
            headers['Content-Type'] = 'application/json';

            if (parameters['hgvsg'] !== undefined) {
                queryParameters['hgvsg'] = parameters['hgvsg'];
            }

            if (parameters['hgvsg'] === undefined) {
                reject(new Error('Missing required  parameter: hgvsg'));
                return;
            }

            if (parameters['tumorType'] !== undefined) {
                queryParameters['tumorType'] = parameters['tumorType'];
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
     * Annotate mutation by HGVSg.
     * @method
     * @name OncoKbAPI#annotateMutationsByHGVSgGetUsingGET
     * @param {string} hgvsg - HGVS genomic format. Example: 7:g.140453136A>T
     * @param {string} tumorType - OncoTree(http://oncotree.mskcc.org) tumor type name. The field supports OncoTree Code, OncoTree Name and OncoTree Main type. Example: Melanoma
     */
    annotateMutationsByHGVSgGetUsingGET(parameters: {
        'hgvsg': string,
        'tumorType' ? : string,
        $queryParameters ? : any,
        $domain ? : string
    }): Promise < IndicatorQueryResp > {
        return this.annotateMutationsByHGVSgGetUsingGETWithHttpInfo(parameters).then(function(response: request.Response) {
            return response.body;
        });
    };
    annotateMutationsByHGVSgPostUsingPOSTURL(parameters: {
        'body': Array < AnnotateMutationByHGVSgQuery > ,
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/annotate/mutations/byHGVSg';

        if (parameters.$queryParameters) {
            Object.keys(parameters.$queryParameters).forEach(function(parameterName) {
                var parameter = parameters.$queryParameters[parameterName];
                queryParameters[parameterName] = parameter;
            });
        }
        let keys = Object.keys(queryParameters);
        return this.domain + path + (keys.length > 0 ? '?' + (keys.map(key => key + '=' + encodeURIComponent(queryParameters[key])).join('&')) : '');
    };

    /**
     * Annotate mutations by genomic change.
     * @method
     * @name OncoKbAPI#annotateMutationsByHGVSgPostUsingPOST
     * @param {} body - List of queries. Please see swagger.json for request body format.
     */
    annotateMutationsByHGVSgPostUsingPOSTWithHttpInfo(parameters: {
        'body': Array < AnnotateMutationByHGVSgQuery > ,
        $queryParameters ? : any,
        $domain ? : string
    }): Promise < request.Response > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        const errorHandlers = this.errorHandlers;
        const request = this.request;
        let path = '/annotate/mutations/byHGVSg';
        let body: any;
        let queryParameters: any = {};
        let headers: any = {};
        let form: any = {};
        return new Promise(function(resolve, reject) {
            headers['Accept'] = 'application/json';
            headers['Content-Type'] = 'application/json';

            if (parameters['body'] !== undefined) {
                body = parameters['body'];
            }

            if (parameters['body'] === undefined) {
                reject(new Error('Missing required  parameter: body'));
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
     * Annotate mutations by genomic change.
     * @method
     * @name OncoKbAPI#annotateMutationsByHGVSgPostUsingPOST
     * @param {} body - List of queries. Please see swagger.json for request body format.
     */
    annotateMutationsByHGVSgPostUsingPOST(parameters: {
            'body': Array < AnnotateMutationByHGVSgQuery > ,
            $queryParameters ? : any,
            $domain ? : string
        }): Promise < Array < IndicatorQueryResp >
        > {
            return this.annotateMutationsByHGVSgPostUsingPOSTWithHttpInfo(parameters).then(function(response: request.Response) {
                return response.body;
            });
        };
    annotateMutationsByProteinChangeGetUsingGETURL(parameters: {
        'hugoSymbol' ? : string,
        'entrezGeneId' ? : number,
        'alteration' ? : string,
        'consequence' ? : "feature_truncation" | "frameshift_variant" | "inframe_deletion" | "inframe_insertion" | "start_lost" | "missense_variant" | "splice_region_variant" | "stop_gained" | "synonymous_variant",
        'proteinStart' ? : number,
        'proteinEnd' ? : number,
        'tumorType' ? : string,
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/annotate/mutations/byProteinChange';
        if (parameters['hugoSymbol'] !== undefined) {
            queryParameters['hugoSymbol'] = parameters['hugoSymbol'];
        }

        if (parameters['entrezGeneId'] !== undefined) {
            queryParameters['entrezGeneId'] = parameters['entrezGeneId'];
        }

        if (parameters['alteration'] !== undefined) {
            queryParameters['alteration'] = parameters['alteration'];
        }

        if (parameters['consequence'] !== undefined) {
            queryParameters['consequence'] = parameters['consequence'];
        }

        if (parameters['proteinStart'] !== undefined) {
            queryParameters['proteinStart'] = parameters['proteinStart'];
        }

        if (parameters['proteinEnd'] !== undefined) {
            queryParameters['proteinEnd'] = parameters['proteinEnd'];
        }

        if (parameters['tumorType'] !== undefined) {
            queryParameters['tumorType'] = parameters['tumorType'];
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
     * Annotate mutation by protein change.
     * @method
     * @name OncoKbAPI#annotateMutationsByProteinChangeGetUsingGET
     * @param {string} hugoSymbol - The gene symbol used in Human Genome Organisation. Example: BRAF
     * @param {integer} entrezGeneId - The entrez gene ID. (Higher priority than hugoSymbol). Example: 673
     * @param {string} alteration - Protein Change. Example: V600E
     * @param {string} consequence - Consequence. Exacmple: missense_variant
     * @param {integer} proteinStart - Protein Start. Example: 600
     * @param {integer} proteinEnd - Protein End. Example: 600
     * @param {string} tumorType - OncoTree(http://oncotree.mskcc.org) tumor type name. The field supports OncoTree Code, OncoTree Name and OncoTree Main type. Example: Melanoma
     */
    annotateMutationsByProteinChangeGetUsingGETWithHttpInfo(parameters: {
        'hugoSymbol' ? : string,
        'entrezGeneId' ? : number,
        'alteration' ? : string,
        'consequence' ? : "feature_truncation" | "frameshift_variant" | "inframe_deletion" | "inframe_insertion" | "start_lost" | "missense_variant" | "splice_region_variant" | "stop_gained" | "synonymous_variant",
        'proteinStart' ? : number,
        'proteinEnd' ? : number,
        'tumorType' ? : string,
        $queryParameters ? : any,
            $domain ? : string
    }): Promise < request.Response > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        const errorHandlers = this.errorHandlers;
        const request = this.request;
        let path = '/annotate/mutations/byProteinChange';
        let body: any;
        let queryParameters: any = {};
        let headers: any = {};
        let form: any = {};
        return new Promise(function(resolve, reject) {
            headers['Accept'] = 'application/json';
            headers['Content-Type'] = 'application/json';

            if (parameters['hugoSymbol'] !== undefined) {
                queryParameters['hugoSymbol'] = parameters['hugoSymbol'];
            }

            if (parameters['entrezGeneId'] !== undefined) {
                queryParameters['entrezGeneId'] = parameters['entrezGeneId'];
            }

            if (parameters['alteration'] !== undefined) {
                queryParameters['alteration'] = parameters['alteration'];
            }

            if (parameters['consequence'] !== undefined) {
                queryParameters['consequence'] = parameters['consequence'];
            }

            if (parameters['proteinStart'] !== undefined) {
                queryParameters['proteinStart'] = parameters['proteinStart'];
            }

            if (parameters['proteinEnd'] !== undefined) {
                queryParameters['proteinEnd'] = parameters['proteinEnd'];
            }

            if (parameters['tumorType'] !== undefined) {
                queryParameters['tumorType'] = parameters['tumorType'];
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
     * Annotate mutation by protein change.
     * @method
     * @name OncoKbAPI#annotateMutationsByProteinChangeGetUsingGET
     * @param {string} hugoSymbol - The gene symbol used in Human Genome Organisation. Example: BRAF
     * @param {integer} entrezGeneId - The entrez gene ID. (Higher priority than hugoSymbol). Example: 673
     * @param {string} alteration - Protein Change. Example: V600E
     * @param {string} consequence - Consequence. Exacmple: missense_variant
     * @param {integer} proteinStart - Protein Start. Example: 600
     * @param {integer} proteinEnd - Protein End. Example: 600
     * @param {string} tumorType - OncoTree(http://oncotree.mskcc.org) tumor type name. The field supports OncoTree Code, OncoTree Name and OncoTree Main type. Example: Melanoma
     */
    annotateMutationsByProteinChangeGetUsingGET(parameters: {
        'hugoSymbol' ? : string,
        'entrezGeneId' ? : number,
        'alteration' ? : string,
        'consequence' ? : "feature_truncation" | "frameshift_variant" | "inframe_deletion" | "inframe_insertion" | "start_lost" | "missense_variant" | "splice_region_variant" | "stop_gained" | "synonymous_variant",
        'proteinStart' ? : number,
        'proteinEnd' ? : number,
        'tumorType' ? : string,
        $queryParameters ? : any,
            $domain ? : string
    }): Promise < IndicatorQueryResp > {
        return this.annotateMutationsByProteinChangeGetUsingGETWithHttpInfo(parameters).then(function(response: request.Response) {
            return response.body;
        });
    };
    annotateMutationsByProteinChangePostUsingPOSTURL(parameters: {
        'body': Array < AnnotateMutationByProteinChangeQuery > ,
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/annotate/mutations/byProteinChange';

        if (parameters.$queryParameters) {
            Object.keys(parameters.$queryParameters).forEach(function(parameterName) {
                var parameter = parameters.$queryParameters[parameterName];
                queryParameters[parameterName] = parameter;
            });
        }
        let keys = Object.keys(queryParameters);
        return this.domain + path + (keys.length > 0 ? '?' + (keys.map(key => key + '=' + encodeURIComponent(queryParameters[key])).join('&')) : '');
    };

    /**
     * Annotate mutations by protein change.
     * @method
     * @name OncoKbAPI#annotateMutationsByProteinChangePostUsingPOST
     * @param {} body - List of queries. Please see swagger.json for request body format.
     */
    annotateMutationsByProteinChangePostUsingPOSTWithHttpInfo(parameters: {
        'body': Array < AnnotateMutationByProteinChangeQuery > ,
        $queryParameters ? : any,
        $domain ? : string
    }): Promise < request.Response > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        const errorHandlers = this.errorHandlers;
        const request = this.request;
        let path = '/annotate/mutations/byProteinChange';
        let body: any;
        let queryParameters: any = {};
        let headers: any = {};
        let form: any = {};
        return new Promise(function(resolve, reject) {
            headers['Accept'] = 'application/json';
            headers['Content-Type'] = 'application/json';

            if (parameters['body'] !== undefined) {
                body = parameters['body'];
            }

            if (parameters['body'] === undefined) {
                reject(new Error('Missing required  parameter: body'));
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
     * Annotate mutations by protein change.
     * @method
     * @name OncoKbAPI#annotateMutationsByProteinChangePostUsingPOST
     * @param {} body - List of queries. Please see swagger.json for request body format.
     */
    annotateMutationsByProteinChangePostUsingPOST(parameters: {
            'body': Array < AnnotateMutationByProteinChangeQuery > ,
            $queryParameters ? : any,
            $domain ? : string
        }): Promise < Array < IndicatorQueryResp >
        > {
            return this.annotateMutationsByProteinChangePostUsingPOSTWithHttpInfo(parameters).then(function(response: request.Response) {
                return response.body;
            });
        };
    annotateStructuralVariantsGetUsingGETURL(parameters: {
        'hugoSymbolA' ? : string,
        'entrezGeneIdA' ? : number,
        'hugoSymbolB' ? : string,
        'entrezGeneIdB' ? : number,
        'structuralVariantType': "DELETION" | "TRANSLOCATION" | "DUPLICATION" | "INSERTION" | "INVERSION" | "FUSION",
        'isFunctionalFusion': boolean,
        'tumorType' ? : string,
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/annotate/structuralVariants';
        if (parameters['hugoSymbolA'] !== undefined) {
            queryParameters['hugoSymbolA'] = parameters['hugoSymbolA'];
        }

        if (parameters['entrezGeneIdA'] !== undefined) {
            queryParameters['entrezGeneIdA'] = parameters['entrezGeneIdA'];
        }

        if (parameters['hugoSymbolB'] !== undefined) {
            queryParameters['hugoSymbolB'] = parameters['hugoSymbolB'];
        }

        if (parameters['entrezGeneIdB'] !== undefined) {
            queryParameters['entrezGeneIdB'] = parameters['entrezGeneIdB'];
        }

        if (parameters['structuralVariantType'] !== undefined) {
            queryParameters['structuralVariantType'] = parameters['structuralVariantType'];
        }

        if (parameters['isFunctionalFusion'] !== undefined) {
            queryParameters['isFunctionalFusion'] = parameters['isFunctionalFusion'];
        }

        if (parameters['tumorType'] !== undefined) {
            queryParameters['tumorType'] = parameters['tumorType'];
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
     * Annotate structural variant.
     * @method
     * @name OncoKbAPI#annotateStructuralVariantsGetUsingGET
     * @param {string} hugoSymbolA - The gene symbol A used in Human Genome Organisation. Example: ABL1
     * @param {integer} entrezGeneIdA - The entrez gene ID A. (Higher priority than hugoSymbolA) Example: 25
     * @param {string} hugoSymbolB - The gene symbol B used in Human Genome Organisation.Example: BCR 
     * @param {integer} entrezGeneIdB - The entrez gene ID B. (Higher priority than hugoSymbolB) Example: 613
     * @param {string} structuralVariantType - Structural variant type
     * @param {boolean} isFunctionalFusion - Whether is functional fusion
     * @param {string} tumorType - OncoTree(http://oncotree.mskcc.org) tumor type name. The field supports OncoTree Code, OncoTree Name and OncoTree Main type. Example: Melanoma
     */
    annotateStructuralVariantsGetUsingGETWithHttpInfo(parameters: {
        'hugoSymbolA' ? : string,
        'entrezGeneIdA' ? : number,
        'hugoSymbolB' ? : string,
        'entrezGeneIdB' ? : number,
        'structuralVariantType': "DELETION" | "TRANSLOCATION" | "DUPLICATION" | "INSERTION" | "INVERSION" | "FUSION",
        'isFunctionalFusion': boolean,
        'tumorType' ? : string,
        $queryParameters ? : any,
            $domain ? : string
    }): Promise < request.Response > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        const errorHandlers = this.errorHandlers;
        const request = this.request;
        let path = '/annotate/structuralVariants';
        let body: any;
        let queryParameters: any = {};
        let headers: any = {};
        let form: any = {};
        return new Promise(function(resolve, reject) {
            headers['Accept'] = 'application/json';
            headers['Content-Type'] = 'application/json';

            if (parameters['hugoSymbolA'] !== undefined) {
                queryParameters['hugoSymbolA'] = parameters['hugoSymbolA'];
            }

            if (parameters['entrezGeneIdA'] !== undefined) {
                queryParameters['entrezGeneIdA'] = parameters['entrezGeneIdA'];
            }

            if (parameters['hugoSymbolB'] !== undefined) {
                queryParameters['hugoSymbolB'] = parameters['hugoSymbolB'];
            }

            if (parameters['entrezGeneIdB'] !== undefined) {
                queryParameters['entrezGeneIdB'] = parameters['entrezGeneIdB'];
            }

            if (parameters['structuralVariantType'] !== undefined) {
                queryParameters['structuralVariantType'] = parameters['structuralVariantType'];
            }

            if (parameters['structuralVariantType'] === undefined) {
                reject(new Error('Missing required  parameter: structuralVariantType'));
                return;
            }

            if (parameters['isFunctionalFusion'] !== undefined) {
                queryParameters['isFunctionalFusion'] = parameters['isFunctionalFusion'];
            }

            if (parameters['isFunctionalFusion'] === undefined) {
                reject(new Error('Missing required  parameter: isFunctionalFusion'));
                return;
            }

            if (parameters['tumorType'] !== undefined) {
                queryParameters['tumorType'] = parameters['tumorType'];
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
     * Annotate structural variant.
     * @method
     * @name OncoKbAPI#annotateStructuralVariantsGetUsingGET
     * @param {string} hugoSymbolA - The gene symbol A used in Human Genome Organisation. Example: ABL1
     * @param {integer} entrezGeneIdA - The entrez gene ID A. (Higher priority than hugoSymbolA) Example: 25
     * @param {string} hugoSymbolB - The gene symbol B used in Human Genome Organisation.Example: BCR 
     * @param {integer} entrezGeneIdB - The entrez gene ID B. (Higher priority than hugoSymbolB) Example: 613
     * @param {string} structuralVariantType - Structural variant type
     * @param {boolean} isFunctionalFusion - Whether is functional fusion
     * @param {string} tumorType - OncoTree(http://oncotree.mskcc.org) tumor type name. The field supports OncoTree Code, OncoTree Name and OncoTree Main type. Example: Melanoma
     */
    annotateStructuralVariantsGetUsingGET(parameters: {
        'hugoSymbolA' ? : string,
        'entrezGeneIdA' ? : number,
        'hugoSymbolB' ? : string,
        'entrezGeneIdB' ? : number,
        'structuralVariantType': "DELETION" | "TRANSLOCATION" | "DUPLICATION" | "INSERTION" | "INVERSION" | "FUSION",
        'isFunctionalFusion': boolean,
        'tumorType' ? : string,
        $queryParameters ? : any,
            $domain ? : string
    }): Promise < IndicatorQueryResp > {
        return this.annotateStructuralVariantsGetUsingGETWithHttpInfo(parameters).then(function(response: request.Response) {
            return response.body;
        });
    };
    annotateStructuralVariantsPostUsingPOSTURL(parameters: {
        'body': Array < AnnotateStructuralVariantQuery > ,
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/annotate/structuralVariants';

        if (parameters.$queryParameters) {
            Object.keys(parameters.$queryParameters).forEach(function(parameterName) {
                var parameter = parameters.$queryParameters[parameterName];
                queryParameters[parameterName] = parameter;
            });
        }
        let keys = Object.keys(queryParameters);
        return this.domain + path + (keys.length > 0 ? '?' + (keys.map(key => key + '=' + encodeURIComponent(queryParameters[key])).join('&')) : '');
    };

    /**
     * Annotate structural variants.
     * @method
     * @name OncoKbAPI#annotateStructuralVariantsPostUsingPOST
     * @param {} body - List of queries. Please see swagger.json for request body format.
     */
    annotateStructuralVariantsPostUsingPOSTWithHttpInfo(parameters: {
        'body': Array < AnnotateStructuralVariantQuery > ,
        $queryParameters ? : any,
        $domain ? : string
    }): Promise < request.Response > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        const errorHandlers = this.errorHandlers;
        const request = this.request;
        let path = '/annotate/structuralVariants';
        let body: any;
        let queryParameters: any = {};
        let headers: any = {};
        let form: any = {};
        return new Promise(function(resolve, reject) {
            headers['Accept'] = 'application/json';
            headers['Content-Type'] = 'application/json';

            if (parameters['body'] !== undefined) {
                body = parameters['body'];
            }

            if (parameters['body'] === undefined) {
                reject(new Error('Missing required  parameter: body'));
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
     * Annotate structural variants.
     * @method
     * @name OncoKbAPI#annotateStructuralVariantsPostUsingPOST
     * @param {} body - List of queries. Please see swagger.json for request body format.
     */
    annotateStructuralVariantsPostUsingPOST(parameters: {
            'body': Array < AnnotateStructuralVariantQuery > ,
            $queryParameters ? : any,
            $domain ? : string
        }): Promise < Array < IndicatorQueryResp >
        > {
            return this.annotateStructuralVariantsPostUsingPOSTWithHttpInfo(parameters).then(function(response: request.Response) {
                return response.body;
            });
        };
    classificationVariantsGetUsingGETURL(parameters: {
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/classification/variants';

        if (parameters.$queryParameters) {
            Object.keys(parameters.$queryParameters).forEach(function(parameterName) {
                var parameter = parameters.$queryParameters[parameterName];
                queryParameters[parameterName] = parameter;
            });
        }
        let keys = Object.keys(queryParameters);
        return this.domain + path + (keys.length > 0 ? '?' + (keys.map(key => key + '=' + encodeURIComponent(queryParameters[key])).join('&')) : '');
    };

    /**
     * Get All OncoKB Variant Classification.
     * @method
     * @name OncoKbAPI#classificationVariantsGetUsingGET
     */
    classificationVariantsGetUsingGETWithHttpInfo(parameters: {
        $queryParameters ? : any,
            $domain ? : string
    }): Promise < request.Response > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        const errorHandlers = this.errorHandlers;
        const request = this.request;
        let path = '/classification/variants';
        let body: any;
        let queryParameters: any = {};
        let headers: any = {};
        let form: any = {};
        return new Promise(function(resolve, reject) {
            headers['Accept'] = 'application/json';
            headers['Content-Type'] = 'application/json';

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
     * Get All OncoKB Variant Classification.
     * @method
     * @name OncoKbAPI#classificationVariantsGetUsingGET
     */
    classificationVariantsGetUsingGET(parameters: {
            $queryParameters ? : any,
                $domain ? : string
        }): Promise < Array < string >
        > {
            return this.classificationVariantsGetUsingGETWithHttpInfo(parameters).then(function(response: request.Response) {
                return response.body;
            });
        };
    drugsGetUsingGETURL(parameters: {
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/drugs';

        if (parameters.$queryParameters) {
            Object.keys(parameters.$queryParameters).forEach(function(parameterName) {
                var parameter = parameters.$queryParameters[parameterName];
                queryParameters[parameterName] = parameter;
            });
        }
        let keys = Object.keys(queryParameters);
        return this.domain + path + (keys.length > 0 ? '?' + (keys.map(key => key + '=' + encodeURIComponent(queryParameters[key])).join('&')) : '');
    };

    /**
     * Get all curated drugs.
     * @method
     * @name OncoKbAPI#drugsGetUsingGET
     */
    drugsGetUsingGETWithHttpInfo(parameters: {
        $queryParameters ? : any,
            $domain ? : string
    }): Promise < request.Response > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        const errorHandlers = this.errorHandlers;
        const request = this.request;
        let path = '/drugs';
        let body: any;
        let queryParameters: any = {};
        let headers: any = {};
        let form: any = {};
        return new Promise(function(resolve, reject) {
            headers['Accept'] = 'application/json';
            headers['Content-Type'] = 'application/json';

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
     * Get all curated drugs.
     * @method
     * @name OncoKbAPI#drugsGetUsingGET
     */
    drugsGetUsingGET(parameters: {
            $queryParameters ? : any,
                $domain ? : string
        }): Promise < Array < Drug >
        > {
            return this.drugsGetUsingGETWithHttpInfo(parameters).then(function(response: request.Response) {
                return response.body;
            });
        };
    drugsLookupGetUsingGETURL(parameters: {
        'name' ? : string,
        'ncitCode' ? : string,
        'synonym' ? : string,
        'exactMatch': boolean,
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/drugs/lookup';
        if (parameters['name'] !== undefined) {
            queryParameters['name'] = parameters['name'];
        }

        if (parameters['ncitCode'] !== undefined) {
            queryParameters['ncitCode'] = parameters['ncitCode'];
        }

        if (parameters['synonym'] !== undefined) {
            queryParameters['synonym'] = parameters['synonym'];
        }

        if (parameters['exactMatch'] !== undefined) {
            queryParameters['exactMatch'] = parameters['exactMatch'];
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
     * Search drugs.
     * @method
     * @name OncoKbAPI#drugsLookupGetUsingGET
     * @param {string} name - Drug Name
     * @param {string} ncitCode - NCI Thesaurus Code
     * @param {string} synonym - Drug Synonyms
     * @param {boolean} exactMatch - Exactly Match
     */
    drugsLookupGetUsingGETWithHttpInfo(parameters: {
        'name' ? : string,
        'ncitCode' ? : string,
        'synonym' ? : string,
        'exactMatch': boolean,
        $queryParameters ? : any,
            $domain ? : string
    }): Promise < request.Response > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        const errorHandlers = this.errorHandlers;
        const request = this.request;
        let path = '/drugs/lookup';
        let body: any;
        let queryParameters: any = {};
        let headers: any = {};
        let form: any = {};
        return new Promise(function(resolve, reject) {
            headers['Accept'] = 'application/json';
            headers['Content-Type'] = 'application/json';

            if (parameters['name'] !== undefined) {
                queryParameters['name'] = parameters['name'];
            }

            if (parameters['ncitCode'] !== undefined) {
                queryParameters['ncitCode'] = parameters['ncitCode'];
            }

            if (parameters['synonym'] !== undefined) {
                queryParameters['synonym'] = parameters['synonym'];
            }

            if (parameters['exactMatch'] !== undefined) {
                queryParameters['exactMatch'] = parameters['exactMatch'];
            }

            if (parameters['exactMatch'] === undefined) {
                reject(new Error('Missing required  parameter: exactMatch'));
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
     * Search drugs.
     * @method
     * @name OncoKbAPI#drugsLookupGetUsingGET
     * @param {string} name - Drug Name
     * @param {string} ncitCode - NCI Thesaurus Code
     * @param {string} synonym - Drug Synonyms
     * @param {boolean} exactMatch - Exactly Match
     */
    drugsLookupGetUsingGET(parameters: {
            'name' ? : string,
            'ncitCode' ? : string,
            'synonym' ? : string,
            'exactMatch': boolean,
            $queryParameters ? : any,
                $domain ? : string
        }): Promise < Array < Drug >
        > {
            return this.drugsLookupGetUsingGETWithHttpInfo(parameters).then(function(response: request.Response) {
                return response.body;
            });
        };
    evidencesUUIDsGetUsingPOSTURL(parameters: {
        'uuids': Array < string > ,
        'fields' ? : string,
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/evidences';

        if (parameters['fields'] !== undefined) {
            queryParameters['fields'] = parameters['fields'];
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
     * Get specific evidences.
     * @method
     * @name OncoKbAPI#evidencesUUIDsGetUsingPOST
     * @param {} uuids - Unique identifier list.
     * @param {string} fields - The fields to be returned.
     */
    evidencesUUIDsGetUsingPOSTWithHttpInfo(parameters: {
        'uuids': Array < string > ,
        'fields' ? : string,
        $queryParameters ? : any,
        $domain ? : string
    }): Promise < request.Response > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        const errorHandlers = this.errorHandlers;
        const request = this.request;
        let path = '/evidences';
        let body: any;
        let queryParameters: any = {};
        let headers: any = {};
        let form: any = {};
        return new Promise(function(resolve, reject) {
            headers['Accept'] = 'application/json';
            headers['Content-Type'] = 'application/json';

            if (parameters['uuids'] !== undefined) {
                body = parameters['uuids'];
            }

            if (parameters['uuids'] === undefined) {
                reject(new Error('Missing required  parameter: uuids'));
                return;
            }

            if (parameters['fields'] !== undefined) {
                queryParameters['fields'] = parameters['fields'];
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
     * Get specific evidences.
     * @method
     * @name OncoKbAPI#evidencesUUIDsGetUsingPOST
     * @param {} uuids - Unique identifier list.
     * @param {string} fields - The fields to be returned.
     */
    evidencesUUIDsGetUsingPOST(parameters: {
        'uuids': Array < string > ,
        'fields' ? : string,
        $queryParameters ? : any,
        $domain ? : string
    }): Promise < Evidence > {
        return this.evidencesUUIDsGetUsingPOSTWithHttpInfo(parameters).then(function(response: request.Response) {
            return response.body;
        });
    };
    evidencesLookupGetUsingGETURL(parameters: {
        'entrezGeneId' ? : number,
        'hugoSymbol' ? : string,
        'variant' ? : string,
        'tumorType' ? : string,
        'consequence' ? : string,
        'proteinStart' ? : string,
        'proteinEnd' ? : string,
        'source' ? : string,
        'highestLevelOnly' ? : boolean,
        'levelOfEvidence' ? : string,
        'evidenceTypes' ? : string,
        'fields' ? : string,
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/evidences/lookup';
        if (parameters['entrezGeneId'] !== undefined) {
            queryParameters['entrezGeneId'] = parameters['entrezGeneId'];
        }

        if (parameters['hugoSymbol'] !== undefined) {
            queryParameters['hugoSymbol'] = parameters['hugoSymbol'];
        }

        if (parameters['variant'] !== undefined) {
            queryParameters['variant'] = parameters['variant'];
        }

        if (parameters['tumorType'] !== undefined) {
            queryParameters['tumorType'] = parameters['tumorType'];
        }

        if (parameters['consequence'] !== undefined) {
            queryParameters['consequence'] = parameters['consequence'];
        }

        if (parameters['proteinStart'] !== undefined) {
            queryParameters['proteinStart'] = parameters['proteinStart'];
        }

        if (parameters['proteinEnd'] !== undefined) {
            queryParameters['proteinEnd'] = parameters['proteinEnd'];
        }

        if (parameters['source'] !== undefined) {
            queryParameters['source'] = parameters['source'];
        }

        if (parameters['highestLevelOnly'] !== undefined) {
            queryParameters['highestLevelOnly'] = parameters['highestLevelOnly'];
        }

        if (parameters['levelOfEvidence'] !== undefined) {
            queryParameters['levelOfEvidence'] = parameters['levelOfEvidence'];
        }

        if (parameters['evidenceTypes'] !== undefined) {
            queryParameters['evidenceTypes'] = parameters['evidenceTypes'];
        }

        if (parameters['fields'] !== undefined) {
            queryParameters['fields'] = parameters['fields'];
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
     * Search evidences. Multi-queries are supported.
     * @method
     * @name OncoKbAPI#evidencesLookupGetUsingGET
     * @param {integer} entrezGeneId - The entrez gene ID.
     * @param {string} hugoSymbol - The gene symbol used in Human Genome Organisation.
     * @param {string} variant - Variant name.
     * @param {string} tumorType - Tumor type name. OncoTree code is supported.
     * @param {string} consequence - Consequence. Possible value: feature_truncation, frameshift_variant, inframe_deletion, inframe_insertion, start_lost, missense_variant, splice_region_variant, stop_gained, synonymous_variant
     * @param {string} proteinStart - Protein Start.
     * @param {string} proteinEnd - Protein End.
     * @param {string} source - Tumor type source. OncoTree tumor types are the default setting. We may have customized version, like Quest.
     * @param {boolean} highestLevelOnly - Only show highest level evidences
     * @param {string} levelOfEvidence - Separate by comma. LEVEL_1, LEVEL_2A, LEVEL_2B, LEVEL_3A, LEVEL_3B, LEVEL_4, LEVEL_R1, LEVEL_R2, LEVEL_R3
     * @param {string} evidenceTypes - Separate by comma. Evidence type includes GENE_SUMMARY, GENE_BACKGROUND, MUTATION_SUMMARY, ONCOGENIC, MUTATION_EFFECT, VUS, PROGNOSTIC_IMPLICATION, DIAGNOSTIC_IMPLICATION, TUMOR_TYPE_SUMMARY, DIAGNOSTIC_SUMMARY, PROGNOSTIC_SUMMARY, STANDARD_THERAPEUTIC_IMPLICATIONS_FOR_DRUG_SENSITIVITY, STANDARD_THERAPEUTIC_IMPLICATIONS_FOR_DRUG_RESISTANCE, INVESTIGATIONAL_THERAPEUTIC_IMPLICATIONS_DRUG_SENSITIVITY, INVESTIGATIONAL_THERAPEUTIC_IMPLICATIONS_DRUG_RESISTANCE
     * @param {string} fields - The fields to be returned.
     */
    evidencesLookupGetUsingGETWithHttpInfo(parameters: {
        'entrezGeneId' ? : number,
        'hugoSymbol' ? : string,
        'variant' ? : string,
        'tumorType' ? : string,
        'consequence' ? : string,
        'proteinStart' ? : string,
        'proteinEnd' ? : string,
        'source' ? : string,
        'highestLevelOnly' ? : boolean,
        'levelOfEvidence' ? : string,
        'evidenceTypes' ? : string,
        'fields' ? : string,
        $queryParameters ? : any,
            $domain ? : string
    }): Promise < request.Response > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        const errorHandlers = this.errorHandlers;
        const request = this.request;
        let path = '/evidences/lookup';
        let body: any;
        let queryParameters: any = {};
        let headers: any = {};
        let form: any = {};
        return new Promise(function(resolve, reject) {
            headers['Accept'] = 'application/json';
            headers['Content-Type'] = 'application/json';

            if (parameters['entrezGeneId'] !== undefined) {
                queryParameters['entrezGeneId'] = parameters['entrezGeneId'];
            }

            if (parameters['hugoSymbol'] !== undefined) {
                queryParameters['hugoSymbol'] = parameters['hugoSymbol'];
            }

            if (parameters['variant'] !== undefined) {
                queryParameters['variant'] = parameters['variant'];
            }

            if (parameters['tumorType'] !== undefined) {
                queryParameters['tumorType'] = parameters['tumorType'];
            }

            if (parameters['consequence'] !== undefined) {
                queryParameters['consequence'] = parameters['consequence'];
            }

            if (parameters['proteinStart'] !== undefined) {
                queryParameters['proteinStart'] = parameters['proteinStart'];
            }

            if (parameters['proteinEnd'] !== undefined) {
                queryParameters['proteinEnd'] = parameters['proteinEnd'];
            }

            if (parameters['source'] !== undefined) {
                queryParameters['source'] = parameters['source'];
            }

            if (parameters['highestLevelOnly'] !== undefined) {
                queryParameters['highestLevelOnly'] = parameters['highestLevelOnly'];
            }

            if (parameters['levelOfEvidence'] !== undefined) {
                queryParameters['levelOfEvidence'] = parameters['levelOfEvidence'];
            }

            if (parameters['evidenceTypes'] !== undefined) {
                queryParameters['evidenceTypes'] = parameters['evidenceTypes'];
            }

            if (parameters['fields'] !== undefined) {
                queryParameters['fields'] = parameters['fields'];
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
     * Search evidences. Multi-queries are supported.
     * @method
     * @name OncoKbAPI#evidencesLookupGetUsingGET
     * @param {integer} entrezGeneId - The entrez gene ID.
     * @param {string} hugoSymbol - The gene symbol used in Human Genome Organisation.
     * @param {string} variant - Variant name.
     * @param {string} tumorType - Tumor type name. OncoTree code is supported.
     * @param {string} consequence - Consequence. Possible value: feature_truncation, frameshift_variant, inframe_deletion, inframe_insertion, start_lost, missense_variant, splice_region_variant, stop_gained, synonymous_variant
     * @param {string} proteinStart - Protein Start.
     * @param {string} proteinEnd - Protein End.
     * @param {string} source - Tumor type source. OncoTree tumor types are the default setting. We may have customized version, like Quest.
     * @param {boolean} highestLevelOnly - Only show highest level evidences
     * @param {string} levelOfEvidence - Separate by comma. LEVEL_1, LEVEL_2A, LEVEL_2B, LEVEL_3A, LEVEL_3B, LEVEL_4, LEVEL_R1, LEVEL_R2, LEVEL_R3
     * @param {string} evidenceTypes - Separate by comma. Evidence type includes GENE_SUMMARY, GENE_BACKGROUND, MUTATION_SUMMARY, ONCOGENIC, MUTATION_EFFECT, VUS, PROGNOSTIC_IMPLICATION, DIAGNOSTIC_IMPLICATION, TUMOR_TYPE_SUMMARY, DIAGNOSTIC_SUMMARY, PROGNOSTIC_SUMMARY, STANDARD_THERAPEUTIC_IMPLICATIONS_FOR_DRUG_SENSITIVITY, STANDARD_THERAPEUTIC_IMPLICATIONS_FOR_DRUG_RESISTANCE, INVESTIGATIONAL_THERAPEUTIC_IMPLICATIONS_DRUG_SENSITIVITY, INVESTIGATIONAL_THERAPEUTIC_IMPLICATIONS_DRUG_RESISTANCE
     * @param {string} fields - The fields to be returned.
     */
    evidencesLookupGetUsingGET(parameters: {
            'entrezGeneId' ? : number,
            'hugoSymbol' ? : string,
            'variant' ? : string,
            'tumorType' ? : string,
            'consequence' ? : string,
            'proteinStart' ? : string,
            'proteinEnd' ? : string,
            'source' ? : string,
            'highestLevelOnly' ? : boolean,
            'levelOfEvidence' ? : string,
            'evidenceTypes' ? : string,
            'fields' ? : string,
            $queryParameters ? : any,
                $domain ? : string
        }): Promise < Array < Evidence >
        > {
            return this.evidencesLookupGetUsingGETWithHttpInfo(parameters).then(function(response: request.Response) {
                return response.body;
            });
        };
    evidencesLookupPostUsingPOSTURL(parameters: {
        'body': EvidenceQueries,
        'fields' ? : string,
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/evidences/lookup';

        if (parameters['fields'] !== undefined) {
            queryParameters['fields'] = parameters['fields'];
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
     * Search evidences.
     * @method
     * @name OncoKbAPI#evidencesLookupPostUsingPOST
     * @param {} body - List of queries. Please see swagger.json for request body format. Please use JSON string.
     * @param {string} fields - The fields to be returned.
     */
    evidencesLookupPostUsingPOSTWithHttpInfo(parameters: {
        'body': EvidenceQueries,
        'fields' ? : string,
        $queryParameters ? : any,
        $domain ? : string
    }): Promise < request.Response > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        const errorHandlers = this.errorHandlers;
        const request = this.request;
        let path = '/evidences/lookup';
        let body: any;
        let queryParameters: any = {};
        let headers: any = {};
        let form: any = {};
        return new Promise(function(resolve, reject) {
            headers['Accept'] = 'application/json';
            headers['Content-Type'] = 'application/json';

            if (parameters['body'] !== undefined) {
                body = parameters['body'];
            }

            if (parameters['body'] === undefined) {
                reject(new Error('Missing required  parameter: body'));
                return;
            }

            if (parameters['fields'] !== undefined) {
                queryParameters['fields'] = parameters['fields'];
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
     * Search evidences.
     * @method
     * @name OncoKbAPI#evidencesLookupPostUsingPOST
     * @param {} body - List of queries. Please see swagger.json for request body format. Please use JSON string.
     * @param {string} fields - The fields to be returned.
     */
    evidencesLookupPostUsingPOST(parameters: {
            'body': EvidenceQueries,
            'fields' ? : string,
            $queryParameters ? : any,
            $domain ? : string
        }): Promise < Array < EvidenceQueryRes >
        > {
            return this.evidencesLookupPostUsingPOSTWithHttpInfo(parameters).then(function(response: request.Response) {
                return response.body;
            });
        };
    evidencesUUIDGetUsingGETURL(parameters: {
        'uuid': string,
        'fields' ? : string,
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/evidences/{uuid}';

        path = path.replace('{uuid}', parameters['uuid'] + '');
        if (parameters['fields'] !== undefined) {
            queryParameters['fields'] = parameters['fields'];
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
     * Get specific evidence.
     * @method
     * @name OncoKbAPI#evidencesUUIDGetUsingGET
     * @param {string} uuid - Unique identifier.
     * @param {string} fields - The fields to be returned.
     */
    evidencesUUIDGetUsingGETWithHttpInfo(parameters: {
        'uuid': string,
        'fields' ? : string,
        $queryParameters ? : any,
        $domain ? : string
    }): Promise < request.Response > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        const errorHandlers = this.errorHandlers;
        const request = this.request;
        let path = '/evidences/{uuid}';
        let body: any;
        let queryParameters: any = {};
        let headers: any = {};
        let form: any = {};
        return new Promise(function(resolve, reject) {
            headers['Accept'] = 'application/json';
            headers['Content-Type'] = 'application/json';

            path = path.replace('{uuid}', parameters['uuid'] + '');

            if (parameters['uuid'] === undefined) {
                reject(new Error('Missing required  parameter: uuid'));
                return;
            }

            if (parameters['fields'] !== undefined) {
                queryParameters['fields'] = parameters['fields'];
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
     * Get specific evidence.
     * @method
     * @name OncoKbAPI#evidencesUUIDGetUsingGET
     * @param {string} uuid - Unique identifier.
     * @param {string} fields - The fields to be returned.
     */
    evidencesUUIDGetUsingGET(parameters: {
        'uuid': string,
        'fields' ? : string,
        $queryParameters ? : any,
        $domain ? : string
    }): Promise < Evidence > {
        return this.evidencesUUIDGetUsingGETWithHttpInfo(parameters).then(function(response: request.Response) {
            return response.body;
        });
    };
    genesGetUsingGETURL(parameters: {
        'fields' ? : string,
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/genes';
        if (parameters['fields'] !== undefined) {
            queryParameters['fields'] = parameters['fields'];
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
     * Get list of currently curated genes.
     * @method
     * @name OncoKbAPI#genesGetUsingGET
     * @param {string} fields - The fields to be returned.
     */
    genesGetUsingGETWithHttpInfo(parameters: {
        'fields' ? : string,
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
            headers['Content-Type'] = 'application/json';

            if (parameters['fields'] !== undefined) {
                queryParameters['fields'] = parameters['fields'];
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
     * Get list of currently curated genes.
     * @method
     * @name OncoKbAPI#genesGetUsingGET
     * @param {string} fields - The fields to be returned.
     */
    genesGetUsingGET(parameters: {
            'fields' ? : string,
            $queryParameters ? : any,
                $domain ? : string
        }): Promise < Array < Gene >
        > {
            return this.genesGetUsingGETWithHttpInfo(parameters).then(function(response: request.Response) {
                return response.body;
            });
        };
    genesLookupGetUsingGETURL(parameters: {
        'hugoSymbol' ? : string,
        'entrezGeneId' ? : number,
        'query' ? : string,
        'fields' ? : string,
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/genes/lookup';
        if (parameters['hugoSymbol'] !== undefined) {
            queryParameters['hugoSymbol'] = parameters['hugoSymbol'];
        }

        if (parameters['entrezGeneId'] !== undefined) {
            queryParameters['entrezGeneId'] = parameters['entrezGeneId'];
        }

        if (parameters['query'] !== undefined) {
            queryParameters['query'] = parameters['query'];
        }

        if (parameters['fields'] !== undefined) {
            queryParameters['fields'] = parameters['fields'];
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
     * Search gene.
     * @method
     * @name OncoKbAPI#genesLookupGetUsingGET
     * @param {string} hugoSymbol - The gene symbol used in Human Genome Organisation. (Deprecated, use query instead)
     * @param {integer} entrezGeneId - The entrez gene ID. (Deprecated, use query instead)
     * @param {string} query - The search query, it could be hugoSymbol or entrezGeneId.
     * @param {string} fields - The fields to be returned.
     */
    genesLookupGetUsingGETWithHttpInfo(parameters: {
        'hugoSymbol' ? : string,
        'entrezGeneId' ? : number,
        'query' ? : string,
        'fields' ? : string,
        $queryParameters ? : any,
            $domain ? : string
    }): Promise < request.Response > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        const errorHandlers = this.errorHandlers;
        const request = this.request;
        let path = '/genes/lookup';
        let body: any;
        let queryParameters: any = {};
        let headers: any = {};
        let form: any = {};
        return new Promise(function(resolve, reject) {
            headers['Accept'] = 'application/json';
            headers['Content-Type'] = 'application/json';

            if (parameters['hugoSymbol'] !== undefined) {
                queryParameters['hugoSymbol'] = parameters['hugoSymbol'];
            }

            if (parameters['entrezGeneId'] !== undefined) {
                queryParameters['entrezGeneId'] = parameters['entrezGeneId'];
            }

            if (parameters['query'] !== undefined) {
                queryParameters['query'] = parameters['query'];
            }

            if (parameters['fields'] !== undefined) {
                queryParameters['fields'] = parameters['fields'];
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
     * Search gene.
     * @method
     * @name OncoKbAPI#genesLookupGetUsingGET
     * @param {string} hugoSymbol - The gene symbol used in Human Genome Organisation. (Deprecated, use query instead)
     * @param {integer} entrezGeneId - The entrez gene ID. (Deprecated, use query instead)
     * @param {string} query - The search query, it could be hugoSymbol or entrezGeneId.
     * @param {string} fields - The fields to be returned.
     */
    genesLookupGetUsingGET(parameters: {
            'hugoSymbol' ? : string,
            'entrezGeneId' ? : number,
            'query' ? : string,
            'fields' ? : string,
            $queryParameters ? : any,
                $domain ? : string
        }): Promise < Array < Gene >
        > {
            return this.genesLookupGetUsingGETWithHttpInfo(parameters).then(function(response: request.Response) {
                return response.body;
            });
        };
    genesEntrezGeneIdGetUsingGETURL(parameters: {
        'entrezGeneId': number,
        'fields' ? : string,
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/genes/{entrezGeneId}';

        path = path.replace('{entrezGeneId}', parameters['entrezGeneId'] + '');
        if (parameters['fields'] !== undefined) {
            queryParameters['fields'] = parameters['fields'];
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
     * Get specific gene information.
     * @method
     * @name OncoKbAPI#genesEntrezGeneIdGetUsingGET
     * @param {integer} entrezGeneId - The entrez gene ID.
     * @param {string} fields - The fields to be returned.
     */
    genesEntrezGeneIdGetUsingGETWithHttpInfo(parameters: {
        'entrezGeneId': number,
        'fields' ? : string,
        $queryParameters ? : any,
        $domain ? : string
    }): Promise < request.Response > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        const errorHandlers = this.errorHandlers;
        const request = this.request;
        let path = '/genes/{entrezGeneId}';
        let body: any;
        let queryParameters: any = {};
        let headers: any = {};
        let form: any = {};
        return new Promise(function(resolve, reject) {
            headers['Accept'] = 'application/json';
            headers['Content-Type'] = 'application/json';

            path = path.replace('{entrezGeneId}', parameters['entrezGeneId'] + '');

            if (parameters['entrezGeneId'] === undefined) {
                reject(new Error('Missing required  parameter: entrezGeneId'));
                return;
            }

            if (parameters['fields'] !== undefined) {
                queryParameters['fields'] = parameters['fields'];
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
     * Get specific gene information.
     * @method
     * @name OncoKbAPI#genesEntrezGeneIdGetUsingGET
     * @param {integer} entrezGeneId - The entrez gene ID.
     * @param {string} fields - The fields to be returned.
     */
    genesEntrezGeneIdGetUsingGET(parameters: {
        'entrezGeneId': number,
        'fields' ? : string,
        $queryParameters ? : any,
        $domain ? : string
    }): Promise < Gene > {
        return this.genesEntrezGeneIdGetUsingGETWithHttpInfo(parameters).then(function(response: request.Response) {
            return response.body;
        });
    };
    genesEntrezGeneIdEvidencesGetUsingGETURL(parameters: {
        'entrezGeneId': number,
        'evidenceTypes' ? : string,
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/genes/{entrezGeneId}/evidences';

        path = path.replace('{entrezGeneId}', parameters['entrezGeneId'] + '');
        if (parameters['evidenceTypes'] !== undefined) {
            queryParameters['evidenceTypes'] = parameters['evidenceTypes'];
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
     * Get list of evidences for specific gene.
     * @method
     * @name OncoKbAPI#genesEntrezGeneIdEvidencesGetUsingGET
     * @param {integer} entrezGeneId - The entrez gene ID.
     * @param {string} evidenceTypes - Separate by comma. Evidence type includes GENE_SUMMARY, GENE_BACKGROUND
     */
    genesEntrezGeneIdEvidencesGetUsingGETWithHttpInfo(parameters: {
        'entrezGeneId': number,
        'evidenceTypes' ? : string,
        $queryParameters ? : any,
        $domain ? : string
    }): Promise < request.Response > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        const errorHandlers = this.errorHandlers;
        const request = this.request;
        let path = '/genes/{entrezGeneId}/evidences';
        let body: any;
        let queryParameters: any = {};
        let headers: any = {};
        let form: any = {};
        return new Promise(function(resolve, reject) {
            headers['Accept'] = 'application/json';
            headers['Content-Type'] = 'application/json';

            path = path.replace('{entrezGeneId}', parameters['entrezGeneId'] + '');

            if (parameters['entrezGeneId'] === undefined) {
                reject(new Error('Missing required  parameter: entrezGeneId'));
                return;
            }

            if (parameters['evidenceTypes'] !== undefined) {
                queryParameters['evidenceTypes'] = parameters['evidenceTypes'];
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
     * Get list of evidences for specific gene.
     * @method
     * @name OncoKbAPI#genesEntrezGeneIdEvidencesGetUsingGET
     * @param {integer} entrezGeneId - The entrez gene ID.
     * @param {string} evidenceTypes - Separate by comma. Evidence type includes GENE_SUMMARY, GENE_BACKGROUND
     */
    genesEntrezGeneIdEvidencesGetUsingGET(parameters: {
            'entrezGeneId': number,
            'evidenceTypes' ? : string,
            $queryParameters ? : any,
            $domain ? : string
        }): Promise < Array < GeneEvidence >
        > {
            return this.genesEntrezGeneIdEvidencesGetUsingGETWithHttpInfo(parameters).then(function(response: request.Response) {
                return response.body;
            });
        };
    genesEntrezGeneIdVariantsGetUsingGETURL(parameters: {
        'entrezGeneId': number,
        'fields' ? : string,
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/genes/{entrezGeneId}/variants';

        path = path.replace('{entrezGeneId}', parameters['entrezGeneId'] + '');
        if (parameters['fields'] !== undefined) {
            queryParameters['fields'] = parameters['fields'];
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
     * Get list of variants for specific gene.
     * @method
     * @name OncoKbAPI#genesEntrezGeneIdVariantsGetUsingGET
     * @param {integer} entrezGeneId - The entrez gene ID.
     * @param {string} fields - The fields to be returned.
     */
    genesEntrezGeneIdVariantsGetUsingGETWithHttpInfo(parameters: {
        'entrezGeneId': number,
        'fields' ? : string,
        $queryParameters ? : any,
        $domain ? : string
    }): Promise < request.Response > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        const errorHandlers = this.errorHandlers;
        const request = this.request;
        let path = '/genes/{entrezGeneId}/variants';
        let body: any;
        let queryParameters: any = {};
        let headers: any = {};
        let form: any = {};
        return new Promise(function(resolve, reject) {
            headers['Accept'] = 'application/json';
            headers['Content-Type'] = 'application/json';

            path = path.replace('{entrezGeneId}', parameters['entrezGeneId'] + '');

            if (parameters['entrezGeneId'] === undefined) {
                reject(new Error('Missing required  parameter: entrezGeneId'));
                return;
            }

            if (parameters['fields'] !== undefined) {
                queryParameters['fields'] = parameters['fields'];
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
     * Get list of variants for specific gene.
     * @method
     * @name OncoKbAPI#genesEntrezGeneIdVariantsGetUsingGET
     * @param {integer} entrezGeneId - The entrez gene ID.
     * @param {string} fields - The fields to be returned.
     */
    genesEntrezGeneIdVariantsGetUsingGET(parameters: {
            'entrezGeneId': number,
            'fields' ? : string,
            $queryParameters ? : any,
            $domain ? : string
        }): Promise < Array < Alteration >
        > {
            return this.genesEntrezGeneIdVariantsGetUsingGETWithHttpInfo(parameters).then(function(response: request.Response) {
                return response.body;
            });
        };
    infoGetUsingGETURL(parameters: {
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
     * infoGet
     * @method
     * @name OncoKbAPI#infoGetUsingGET
     */
    infoGetUsingGETWithHttpInfo(parameters: {
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
            headers['Content-Type'] = 'application/json';

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
     * infoGet
     * @method
     * @name OncoKbAPI#infoGetUsingGET
     */
    infoGetUsingGET(parameters: {
        $queryParameters ? : any,
            $domain ? : string
    }): Promise < OncoKBInfo > {
        return this.infoGetUsingGETWithHttpInfo(parameters).then(function(response: request.Response) {
            return response.body;
        });
    };
    levelsGetUsingGETURL(parameters: {
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/levels';

        if (parameters.$queryParameters) {
            Object.keys(parameters.$queryParameters).forEach(function(parameterName) {
                var parameter = parameters.$queryParameters[parameterName];
                queryParameters[parameterName] = parameter;
            });
        }
        let keys = Object.keys(queryParameters);
        return this.domain + path + (keys.length > 0 ? '?' + (keys.map(key => key + '=' + encodeURIComponent(queryParameters[key])).join('&')) : '');
    };

    /**
     * Get all levels.
     * @method
     * @name OncoKbAPI#levelsGetUsingGET
     */
    levelsGetUsingGETWithHttpInfo(parameters: {
        $queryParameters ? : any,
            $domain ? : string
    }): Promise < request.Response > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        const errorHandlers = this.errorHandlers;
        const request = this.request;
        let path = '/levels';
        let body: any;
        let queryParameters: any = {};
        let headers: any = {};
        let form: any = {};
        return new Promise(function(resolve, reject) {
            headers['Accept'] = 'application/json';
            headers['Content-Type'] = 'application/json';

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
     * Get all levels.
     * @method
     * @name OncoKbAPI#levelsGetUsingGET
     */
    levelsGetUsingGET(parameters: {
        $queryParameters ? : any,
            $domain ? : string
    }): Promise < {} > {
        return this.levelsGetUsingGETWithHttpInfo(parameters).then(function(response: request.Response) {
            return response.body;
        });
    };
    levelsResistanceGetUsingGETURL(parameters: {
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/levels/resistance';

        if (parameters.$queryParameters) {
            Object.keys(parameters.$queryParameters).forEach(function(parameterName) {
                var parameter = parameters.$queryParameters[parameterName];
                queryParameters[parameterName] = parameter;
            });
        }
        let keys = Object.keys(queryParameters);
        return this.domain + path + (keys.length > 0 ? '?' + (keys.map(key => key + '=' + encodeURIComponent(queryParameters[key])).join('&')) : '');
    };

    /**
     * Get all resistance levels.
     * @method
     * @name OncoKbAPI#levelsResistanceGetUsingGET
     */
    levelsResistanceGetUsingGETWithHttpInfo(parameters: {
        $queryParameters ? : any,
            $domain ? : string
    }): Promise < request.Response > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        const errorHandlers = this.errorHandlers;
        const request = this.request;
        let path = '/levels/resistance';
        let body: any;
        let queryParameters: any = {};
        let headers: any = {};
        let form: any = {};
        return new Promise(function(resolve, reject) {
            headers['Accept'] = 'application/json';
            headers['Content-Type'] = 'application/json';

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
     * Get all resistance levels.
     * @method
     * @name OncoKbAPI#levelsResistanceGetUsingGET
     */
    levelsResistanceGetUsingGET(parameters: {
        $queryParameters ? : any,
            $domain ? : string
    }): Promise < {} > {
        return this.levelsResistanceGetUsingGETWithHttpInfo(parameters).then(function(response: request.Response) {
            return response.body;
        });
    };
    levelsSensitiveGetUsingGETURL(parameters: {
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/levels/sensitive';

        if (parameters.$queryParameters) {
            Object.keys(parameters.$queryParameters).forEach(function(parameterName) {
                var parameter = parameters.$queryParameters[parameterName];
                queryParameters[parameterName] = parameter;
            });
        }
        let keys = Object.keys(queryParameters);
        return this.domain + path + (keys.length > 0 ? '?' + (keys.map(key => key + '=' + encodeURIComponent(queryParameters[key])).join('&')) : '');
    };

    /**
     * Get all sensitive levels.
     * @method
     * @name OncoKbAPI#levelsSensitiveGetUsingGET
     */
    levelsSensitiveGetUsingGETWithHttpInfo(parameters: {
        $queryParameters ? : any,
            $domain ? : string
    }): Promise < request.Response > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        const errorHandlers = this.errorHandlers;
        const request = this.request;
        let path = '/levels/sensitive';
        let body: any;
        let queryParameters: any = {};
        let headers: any = {};
        let form: any = {};
        return new Promise(function(resolve, reject) {
            headers['Accept'] = 'application/json';
            headers['Content-Type'] = 'application/json';

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
     * Get all sensitive levels.
     * @method
     * @name OncoKbAPI#levelsSensitiveGetUsingGET
     */
    levelsSensitiveGetUsingGET(parameters: {
        $queryParameters ? : any,
            $domain ? : string
    }): Promise < {} > {
        return this.levelsSensitiveGetUsingGETWithHttpInfo(parameters).then(function(response: request.Response) {
            return response.body;
        });
    };
    searchGetUsingGETURL(parameters: {
        'id' ? : string,
        'hugoSymbol' ? : string,
        'entrezGeneId' ? : number,
        'variant' ? : string,
        'variantType' ? : string,
        'svType' ? : "DELETION" | "TRANSLOCATION" | "DUPLICATION" | "INSERTION" | "INVERSION" | "FUSION",
        'consequence' ? : string,
        'proteinStart' ? : number,
        'proteinEnd' ? : number,
        'tumorType' ? : string,
        'source' ? : string,
        'levels' ? : string,
        'highestLevelOnly' ? : boolean,
        'queryType' ? : string,
        'evidenceType' ? : string,
        'hgvs' ? : string,
        'fields' ? : string,
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/search';
        if (parameters['id'] !== undefined) {
            queryParameters['id'] = parameters['id'];
        }

        if (parameters['hugoSymbol'] !== undefined) {
            queryParameters['hugoSymbol'] = parameters['hugoSymbol'];
        }

        if (parameters['entrezGeneId'] !== undefined) {
            queryParameters['entrezGeneId'] = parameters['entrezGeneId'];
        }

        if (parameters['variant'] !== undefined) {
            queryParameters['variant'] = parameters['variant'];
        }

        if (parameters['variantType'] !== undefined) {
            queryParameters['variantType'] = parameters['variantType'];
        }

        if (parameters['svType'] !== undefined) {
            queryParameters['svType'] = parameters['svType'];
        }

        if (parameters['consequence'] !== undefined) {
            queryParameters['consequence'] = parameters['consequence'];
        }

        if (parameters['proteinStart'] !== undefined) {
            queryParameters['proteinStart'] = parameters['proteinStart'];
        }

        if (parameters['proteinEnd'] !== undefined) {
            queryParameters['proteinEnd'] = parameters['proteinEnd'];
        }

        if (parameters['tumorType'] !== undefined) {
            queryParameters['tumorType'] = parameters['tumorType'];
        }

        if (parameters['source'] !== undefined) {
            queryParameters['source'] = parameters['source'];
        }

        if (parameters['levels'] !== undefined) {
            queryParameters['levels'] = parameters['levels'];
        }

        if (parameters['highestLevelOnly'] !== undefined) {
            queryParameters['highestLevelOnly'] = parameters['highestLevelOnly'];
        }

        if (parameters['queryType'] !== undefined) {
            queryParameters['queryType'] = parameters['queryType'];
        }

        if (parameters['evidenceType'] !== undefined) {
            queryParameters['evidenceType'] = parameters['evidenceType'];
        }

        if (parameters['hgvs'] !== undefined) {
            queryParameters['hgvs'] = parameters['hgvs'];
        }

        if (parameters['fields'] !== undefined) {
            queryParameters['fields'] = parameters['fields'];
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
     * General search for possible combinations.
     * @method
     * @name OncoKbAPI#searchGetUsingGET
     * @param {string} id - The query ID
     * @param {string} hugoSymbol - The gene symbol used in Human Genome Organisation.
     * @param {integer} entrezGeneId - The entrez gene ID.
     * @param {string} variant - Variant name.
     * @param {string} variantType - Variant type.
     * @param {string} svType - Structural Variant Type.
     * @param {string} consequence - Consequence
     * @param {integer} proteinStart - Protein Start
     * @param {integer} proteinEnd - Protein End
     * @param {string} tumorType - Tumor type name. OncoTree code is supported.
     * @param {string} source - Tumor type source. OncoTree tumor types are the default setting. We may have customized version, like Quest.
     * @param {string} levels - Level of evidences.
     * @param {boolean} highestLevelOnly - Only show treatments of highest level
     * @param {string} queryType - Query type. There maybe slight differences between different query types. Currently support web or regular.
     * @param {string} evidenceType - Evidence type.
     * @param {string} hgvs - HGVS varaint. Its priority is higher than entrezGeneId/hugoSymbol + variant combination
     * @param {string} fields - The fields to be returned.
     */
    searchGetUsingGETWithHttpInfo(parameters: {
        'id' ? : string,
        'hugoSymbol' ? : string,
        'entrezGeneId' ? : number,
        'variant' ? : string,
        'variantType' ? : string,
        'svType' ? : "DELETION" | "TRANSLOCATION" | "DUPLICATION" | "INSERTION" | "INVERSION" | "FUSION",
        'consequence' ? : string,
        'proteinStart' ? : number,
        'proteinEnd' ? : number,
        'tumorType' ? : string,
        'source' ? : string,
        'levels' ? : string,
        'highestLevelOnly' ? : boolean,
        'queryType' ? : string,
        'evidenceType' ? : string,
        'hgvs' ? : string,
        'fields' ? : string,
        $queryParameters ? : any,
            $domain ? : string
    }): Promise < request.Response > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        const errorHandlers = this.errorHandlers;
        const request = this.request;
        let path = '/search';
        let body: any;
        let queryParameters: any = {};
        let headers: any = {};
        let form: any = {};
        return new Promise(function(resolve, reject) {
            headers['Accept'] = 'application/json';
            headers['Content-Type'] = 'application/json';

            if (parameters['id'] !== undefined) {
                queryParameters['id'] = parameters['id'];
            }

            if (parameters['hugoSymbol'] !== undefined) {
                queryParameters['hugoSymbol'] = parameters['hugoSymbol'];
            }

            if (parameters['entrezGeneId'] !== undefined) {
                queryParameters['entrezGeneId'] = parameters['entrezGeneId'];
            }

            if (parameters['variant'] !== undefined) {
                queryParameters['variant'] = parameters['variant'];
            }

            if (parameters['variantType'] !== undefined) {
                queryParameters['variantType'] = parameters['variantType'];
            }

            if (parameters['svType'] !== undefined) {
                queryParameters['svType'] = parameters['svType'];
            }

            if (parameters['consequence'] !== undefined) {
                queryParameters['consequence'] = parameters['consequence'];
            }

            if (parameters['proteinStart'] !== undefined) {
                queryParameters['proteinStart'] = parameters['proteinStart'];
            }

            if (parameters['proteinEnd'] !== undefined) {
                queryParameters['proteinEnd'] = parameters['proteinEnd'];
            }

            if (parameters['tumorType'] !== undefined) {
                queryParameters['tumorType'] = parameters['tumorType'];
            }

            if (parameters['source'] !== undefined) {
                queryParameters['source'] = parameters['source'];
            }

            if (parameters['levels'] !== undefined) {
                queryParameters['levels'] = parameters['levels'];
            }

            if (parameters['highestLevelOnly'] !== undefined) {
                queryParameters['highestLevelOnly'] = parameters['highestLevelOnly'];
            }

            if (parameters['queryType'] !== undefined) {
                queryParameters['queryType'] = parameters['queryType'];
            }

            if (parameters['evidenceType'] !== undefined) {
                queryParameters['evidenceType'] = parameters['evidenceType'];
            }

            if (parameters['hgvs'] !== undefined) {
                queryParameters['hgvs'] = parameters['hgvs'];
            }

            if (parameters['fields'] !== undefined) {
                queryParameters['fields'] = parameters['fields'];
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
     * General search for possible combinations.
     * @method
     * @name OncoKbAPI#searchGetUsingGET
     * @param {string} id - The query ID
     * @param {string} hugoSymbol - The gene symbol used in Human Genome Organisation.
     * @param {integer} entrezGeneId - The entrez gene ID.
     * @param {string} variant - Variant name.
     * @param {string} variantType - Variant type.
     * @param {string} svType - Structural Variant Type.
     * @param {string} consequence - Consequence
     * @param {integer} proteinStart - Protein Start
     * @param {integer} proteinEnd - Protein End
     * @param {string} tumorType - Tumor type name. OncoTree code is supported.
     * @param {string} source - Tumor type source. OncoTree tumor types are the default setting. We may have customized version, like Quest.
     * @param {string} levels - Level of evidences.
     * @param {boolean} highestLevelOnly - Only show treatments of highest level
     * @param {string} queryType - Query type. There maybe slight differences between different query types. Currently support web or regular.
     * @param {string} evidenceType - Evidence type.
     * @param {string} hgvs - HGVS varaint. Its priority is higher than entrezGeneId/hugoSymbol + variant combination
     * @param {string} fields - The fields to be returned.
     */
    searchGetUsingGET(parameters: {
        'id' ? : string,
        'hugoSymbol' ? : string,
        'entrezGeneId' ? : number,
        'variant' ? : string,
        'variantType' ? : string,
        'svType' ? : "DELETION" | "TRANSLOCATION" | "DUPLICATION" | "INSERTION" | "INVERSION" | "FUSION",
        'consequence' ? : string,
        'proteinStart' ? : number,
        'proteinEnd' ? : number,
        'tumorType' ? : string,
        'source' ? : string,
        'levels' ? : string,
        'highestLevelOnly' ? : boolean,
        'queryType' ? : string,
        'evidenceType' ? : string,
        'hgvs' ? : string,
        'fields' ? : string,
        $queryParameters ? : any,
            $domain ? : string
    }): Promise < IndicatorQueryResp > {
        return this.searchGetUsingGETWithHttpInfo(parameters).then(function(response: request.Response) {
            return response.body;
        });
    };
    searchPostUsingPOSTURL(parameters: {
        'body': EvidenceQueries,
        'fields' ? : string,
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/search';

        if (parameters['fields'] !== undefined) {
            queryParameters['fields'] = parameters['fields'];
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
     * General search for possible combinations.
     * @method
     * @name OncoKbAPI#searchPostUsingPOST
     * @param {} body - List of queries. Please see swagger.json for request body format.
     * @param {string} fields - The fields to be returned.
     */
    searchPostUsingPOSTWithHttpInfo(parameters: {
        'body': EvidenceQueries,
        'fields' ? : string,
        $queryParameters ? : any,
        $domain ? : string
    }): Promise < request.Response > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        const errorHandlers = this.errorHandlers;
        const request = this.request;
        let path = '/search';
        let body: any;
        let queryParameters: any = {};
        let headers: any = {};
        let form: any = {};
        return new Promise(function(resolve, reject) {
            headers['Accept'] = 'application/json';
            headers['Content-Type'] = 'application/json';

            if (parameters['body'] !== undefined) {
                body = parameters['body'];
            }

            if (parameters['body'] === undefined) {
                reject(new Error('Missing required  parameter: body'));
                return;
            }

            if (parameters['fields'] !== undefined) {
                queryParameters['fields'] = parameters['fields'];
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
     * General search for possible combinations.
     * @method
     * @name OncoKbAPI#searchPostUsingPOST
     * @param {} body - List of queries. Please see swagger.json for request body format.
     * @param {string} fields - The fields to be returned.
     */
    searchPostUsingPOST(parameters: {
            'body': EvidenceQueries,
            'fields' ? : string,
            $queryParameters ? : any,
            $domain ? : string
        }): Promise < Array < IndicatorQueryResp >
        > {
            return this.searchPostUsingPOSTWithHttpInfo(parameters).then(function(response: request.Response) {
                return response.body;
            });
        };
    utilsAllActionableVariantsGetUsingGETURL(parameters: {
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/utils/allActionableVariants';

        if (parameters.$queryParameters) {
            Object.keys(parameters.$queryParameters).forEach(function(parameterName) {
                var parameter = parameters.$queryParameters[parameterName];
                queryParameters[parameterName] = parameter;
            });
        }
        let keys = Object.keys(queryParameters);
        return this.domain + path + (keys.length > 0 ? '?' + (keys.map(key => key + '=' + encodeURIComponent(queryParameters[key])).join('&')) : '');
    };

    /**
     * Get All Actionable Variants.
     * @method
     * @name OncoKbAPI#utilsAllActionableVariantsGetUsingGET
     */
    utilsAllActionableVariantsGetUsingGETWithHttpInfo(parameters: {
        $queryParameters ? : any,
            $domain ? : string
    }): Promise < request.Response > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        const errorHandlers = this.errorHandlers;
        const request = this.request;
        let path = '/utils/allActionableVariants';
        let body: any;
        let queryParameters: any = {};
        let headers: any = {};
        let form: any = {};
        return new Promise(function(resolve, reject) {
            headers['Accept'] = 'application/json';
            headers['Content-Type'] = 'application/json';

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
     * Get All Actionable Variants.
     * @method
     * @name OncoKbAPI#utilsAllActionableVariantsGetUsingGET
     */
    utilsAllActionableVariantsGetUsingGET(parameters: {
            $queryParameters ? : any,
                $domain ? : string
        }): Promise < Array < ActionableGene >
        > {
            return this.utilsAllActionableVariantsGetUsingGETWithHttpInfo(parameters).then(function(response: request.Response) {
                return response.body;
            });
        };
    utilsAllActionableVariantsTxtGetUsingGETURL(parameters: {
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/utils/allActionableVariants.txt';

        if (parameters.$queryParameters) {
            Object.keys(parameters.$queryParameters).forEach(function(parameterName) {
                var parameter = parameters.$queryParameters[parameterName];
                queryParameters[parameterName] = parameter;
            });
        }
        let keys = Object.keys(queryParameters);
        return this.domain + path + (keys.length > 0 ? '?' + (keys.map(key => key + '=' + encodeURIComponent(queryParameters[key])).join('&')) : '');
    };

    /**
     * Get All Actionable Variants in text file.
     * @method
     * @name OncoKbAPI#utilsAllActionableVariantsTxtGetUsingGET
     */
    utilsAllActionableVariantsTxtGetUsingGETWithHttpInfo(parameters: {
        $queryParameters ? : any,
            $domain ? : string
    }): Promise < request.Response > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        const errorHandlers = this.errorHandlers;
        const request = this.request;
        let path = '/utils/allActionableVariants.txt';
        let body: any;
        let queryParameters: any = {};
        let headers: any = {};
        let form: any = {};
        return new Promise(function(resolve, reject) {
            headers['Accept'] = '*/*';
            headers['Content-Type'] = 'application/json';

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
     * Get All Actionable Variants in text file.
     * @method
     * @name OncoKbAPI#utilsAllActionableVariantsTxtGetUsingGET
     */
    utilsAllActionableVariantsTxtGetUsingGET(parameters: {
        $queryParameters ? : any,
            $domain ? : string
    }): Promise < string > {
        return this.utilsAllActionableVariantsTxtGetUsingGETWithHttpInfo(parameters).then(function(response: request.Response) {
            return response.body;
        });
    };
    utilsAllAnnotatedVariantsGetUsingGETURL(parameters: {
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/utils/allAnnotatedVariants';

        if (parameters.$queryParameters) {
            Object.keys(parameters.$queryParameters).forEach(function(parameterName) {
                var parameter = parameters.$queryParameters[parameterName];
                queryParameters[parameterName] = parameter;
            });
        }
        let keys = Object.keys(queryParameters);
        return this.domain + path + (keys.length > 0 ? '?' + (keys.map(key => key + '=' + encodeURIComponent(queryParameters[key])).join('&')) : '');
    };

    /**
     * Get All Annotated Variants.
     * @method
     * @name OncoKbAPI#utilsAllAnnotatedVariantsGetUsingGET
     */
    utilsAllAnnotatedVariantsGetUsingGETWithHttpInfo(parameters: {
        $queryParameters ? : any,
            $domain ? : string
    }): Promise < request.Response > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        const errorHandlers = this.errorHandlers;
        const request = this.request;
        let path = '/utils/allAnnotatedVariants';
        let body: any;
        let queryParameters: any = {};
        let headers: any = {};
        let form: any = {};
        return new Promise(function(resolve, reject) {
            headers['Accept'] = 'application/json';
            headers['Content-Type'] = 'application/json';

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
     * Get All Annotated Variants.
     * @method
     * @name OncoKbAPI#utilsAllAnnotatedVariantsGetUsingGET
     */
    utilsAllAnnotatedVariantsGetUsingGET(parameters: {
            $queryParameters ? : any,
                $domain ? : string
        }): Promise < Array < AnnotatedVariant >
        > {
            return this.utilsAllAnnotatedVariantsGetUsingGETWithHttpInfo(parameters).then(function(response: request.Response) {
                return response.body;
            });
        };
    utilsAllAnnotatedVariantsTxtGetUsingGETURL(parameters: {
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/utils/allAnnotatedVariants.txt';

        if (parameters.$queryParameters) {
            Object.keys(parameters.$queryParameters).forEach(function(parameterName) {
                var parameter = parameters.$queryParameters[parameterName];
                queryParameters[parameterName] = parameter;
            });
        }
        let keys = Object.keys(queryParameters);
        return this.domain + path + (keys.length > 0 ? '?' + (keys.map(key => key + '=' + encodeURIComponent(queryParameters[key])).join('&')) : '');
    };

    /**
     * Get All Annotated Variants in text file.
     * @method
     * @name OncoKbAPI#utilsAllAnnotatedVariantsTxtGetUsingGET
     */
    utilsAllAnnotatedVariantsTxtGetUsingGETWithHttpInfo(parameters: {
        $queryParameters ? : any,
            $domain ? : string
    }): Promise < request.Response > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        const errorHandlers = this.errorHandlers;
        const request = this.request;
        let path = '/utils/allAnnotatedVariants.txt';
        let body: any;
        let queryParameters: any = {};
        let headers: any = {};
        let form: any = {};
        return new Promise(function(resolve, reject) {
            headers['Accept'] = '*/*';
            headers['Content-Type'] = 'application/json';

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
     * Get All Annotated Variants in text file.
     * @method
     * @name OncoKbAPI#utilsAllAnnotatedVariantsTxtGetUsingGET
     */
    utilsAllAnnotatedVariantsTxtGetUsingGET(parameters: {
        $queryParameters ? : any,
            $domain ? : string
    }): Promise < string > {
        return this.utilsAllAnnotatedVariantsTxtGetUsingGETWithHttpInfo(parameters).then(function(response: request.Response) {
            return response.body;
        });
    };
    utilsAllCuratedGenesGetUsingGETURL(parameters: {
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/utils/allCuratedGenes';

        if (parameters.$queryParameters) {
            Object.keys(parameters.$queryParameters).forEach(function(parameterName) {
                var parameter = parameters.$queryParameters[parameterName];
                queryParameters[parameterName] = parameter;
            });
        }
        let keys = Object.keys(queryParameters);
        return this.domain + path + (keys.length > 0 ? '?' + (keys.map(key => key + '=' + encodeURIComponent(queryParameters[key])).join('&')) : '');
    };

    /**
     * Get list of genes OncoKB curated
     * @method
     * @name OncoKbAPI#utilsAllCuratedGenesGetUsingGET
     */
    utilsAllCuratedGenesGetUsingGETWithHttpInfo(parameters: {
        $queryParameters ? : any,
            $domain ? : string
    }): Promise < request.Response > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        const errorHandlers = this.errorHandlers;
        const request = this.request;
        let path = '/utils/allCuratedGenes';
        let body: any;
        let queryParameters: any = {};
        let headers: any = {};
        let form: any = {};
        return new Promise(function(resolve, reject) {
            headers['Accept'] = 'application/json';
            headers['Content-Type'] = 'application/json';

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
     * Get list of genes OncoKB curated
     * @method
     * @name OncoKbAPI#utilsAllCuratedGenesGetUsingGET
     */
    utilsAllCuratedGenesGetUsingGET(parameters: {
            $queryParameters ? : any,
                $domain ? : string
        }): Promise < Array < CuratedGene >
        > {
            return this.utilsAllCuratedGenesGetUsingGETWithHttpInfo(parameters).then(function(response: request.Response) {
                return response.body;
            });
        };
    utilsAllCuratedGenesTxtGetUsingGETURL(parameters: {
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/utils/allCuratedGenes.txt';

        if (parameters.$queryParameters) {
            Object.keys(parameters.$queryParameters).forEach(function(parameterName) {
                var parameter = parameters.$queryParameters[parameterName];
                queryParameters[parameterName] = parameter;
            });
        }
        let keys = Object.keys(queryParameters);
        return this.domain + path + (keys.length > 0 ? '?' + (keys.map(key => key + '=' + encodeURIComponent(queryParameters[key])).join('&')) : '');
    };

    /**
     * Get list of genes OncoKB curated in text file.
     * @method
     * @name OncoKbAPI#utilsAllCuratedGenesTxtGetUsingGET
     */
    utilsAllCuratedGenesTxtGetUsingGETWithHttpInfo(parameters: {
        $queryParameters ? : any,
            $domain ? : string
    }): Promise < request.Response > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        const errorHandlers = this.errorHandlers;
        const request = this.request;
        let path = '/utils/allCuratedGenes.txt';
        let body: any;
        let queryParameters: any = {};
        let headers: any = {};
        let form: any = {};
        return new Promise(function(resolve, reject) {
            headers['Accept'] = '*/*';
            headers['Content-Type'] = 'application/json';

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
     * Get list of genes OncoKB curated in text file.
     * @method
     * @name OncoKbAPI#utilsAllCuratedGenesTxtGetUsingGET
     */
    utilsAllCuratedGenesTxtGetUsingGET(parameters: {
        $queryParameters ? : any,
            $domain ? : string
    }): Promise < string > {
        return this.utilsAllCuratedGenesTxtGetUsingGETWithHttpInfo(parameters).then(function(response: request.Response) {
            return response.body;
        });
    };
    utilsCancerGeneListGetUsingGETURL(parameters: {
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/utils/cancerGeneList';

        if (parameters.$queryParameters) {
            Object.keys(parameters.$queryParameters).forEach(function(parameterName) {
                var parameter = parameters.$queryParameters[parameterName];
                queryParameters[parameterName] = parameter;
            });
        }
        let keys = Object.keys(queryParameters);
        return this.domain + path + (keys.length > 0 ? '?' + (keys.map(key => key + '=' + encodeURIComponent(queryParameters[key])).join('&')) : '');
    };

    /**
     * Get cancer gene list
     * @method
     * @name OncoKbAPI#utilsCancerGeneListGetUsingGET
     */
    utilsCancerGeneListGetUsingGETWithHttpInfo(parameters: {
        $queryParameters ? : any,
            $domain ? : string
    }): Promise < request.Response > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        const errorHandlers = this.errorHandlers;
        const request = this.request;
        let path = '/utils/cancerGeneList';
        let body: any;
        let queryParameters: any = {};
        let headers: any = {};
        let form: any = {};
        return new Promise(function(resolve, reject) {
            headers['Accept'] = 'application/json';
            headers['Content-Type'] = 'application/json';

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
     * Get cancer gene list
     * @method
     * @name OncoKbAPI#utilsCancerGeneListGetUsingGET
     */
    utilsCancerGeneListGetUsingGET(parameters: {
            $queryParameters ? : any,
                $domain ? : string
        }): Promise < Array < CancerGene >
        > {
            return this.utilsCancerGeneListGetUsingGETWithHttpInfo(parameters).then(function(response: request.Response) {
                return response.body;
            });
        };
    utilsCancerGeneListTxtGetUsingGETURL(parameters: {
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/utils/cancerGeneList.txt';

        if (parameters.$queryParameters) {
            Object.keys(parameters.$queryParameters).forEach(function(parameterName) {
                var parameter = parameters.$queryParameters[parameterName];
                queryParameters[parameterName] = parameter;
            });
        }
        let keys = Object.keys(queryParameters);
        return this.domain + path + (keys.length > 0 ? '?' + (keys.map(key => key + '=' + encodeURIComponent(queryParameters[key])).join('&')) : '');
    };

    /**
     * Get cancer gene list in text file.
     * @method
     * @name OncoKbAPI#utilsCancerGeneListTxtGetUsingGET
     */
    utilsCancerGeneListTxtGetUsingGETWithHttpInfo(parameters: {
        $queryParameters ? : any,
            $domain ? : string
    }): Promise < request.Response > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        const errorHandlers = this.errorHandlers;
        const request = this.request;
        let path = '/utils/cancerGeneList.txt';
        let body: any;
        let queryParameters: any = {};
        let headers: any = {};
        let form: any = {};
        return new Promise(function(resolve, reject) {
            headers['Accept'] = '*/*';
            headers['Content-Type'] = 'application/json';

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
     * Get cancer gene list in text file.
     * @method
     * @name OncoKbAPI#utilsCancerGeneListTxtGetUsingGET
     */
    utilsCancerGeneListTxtGetUsingGET(parameters: {
        $queryParameters ? : any,
            $domain ? : string
    }): Promise < string > {
        return this.utilsCancerGeneListTxtGetUsingGETWithHttpInfo(parameters).then(function(response: request.Response) {
            return response.body;
        });
    };
    variantsGetUsingGETURL(parameters: {
        'fields' ? : string,
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/variants';
        if (parameters['fields'] !== undefined) {
            queryParameters['fields'] = parameters['fields'];
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
     * Get all annotated variants.
     * @method
     * @name OncoKbAPI#variantsGetUsingGET
     * @param {string} fields - The fields to be returned.
     */
    variantsGetUsingGETWithHttpInfo(parameters: {
        'fields' ? : string,
        $queryParameters ? : any,
            $domain ? : string
    }): Promise < request.Response > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        const errorHandlers = this.errorHandlers;
        const request = this.request;
        let path = '/variants';
        let body: any;
        let queryParameters: any = {};
        let headers: any = {};
        let form: any = {};
        return new Promise(function(resolve, reject) {
            headers['Accept'] = 'application/json';
            headers['Content-Type'] = 'application/json';

            if (parameters['fields'] !== undefined) {
                queryParameters['fields'] = parameters['fields'];
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
     * Get all annotated variants.
     * @method
     * @name OncoKbAPI#variantsGetUsingGET
     * @param {string} fields - The fields to be returned.
     */
    variantsGetUsingGET(parameters: {
            'fields' ? : string,
            $queryParameters ? : any,
                $domain ? : string
        }): Promise < Array < Alteration >
        > {
            return this.variantsGetUsingGETWithHttpInfo(parameters).then(function(response: request.Response) {
                return response.body;
            });
        };
    variantsLookupGetUsingGETURL(parameters: {
        'entrezGeneId' ? : number,
        'hugoSymbol' ? : string,
        'variant' ? : string,
        'variantType' ? : string,
        'consequence' ? : string,
        'proteinStart' ? : number,
        'proteinEnd' ? : number,
        'hgvs' ? : string,
        'fields' ? : string,
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/variants/lookup';
        if (parameters['entrezGeneId'] !== undefined) {
            queryParameters['entrezGeneId'] = parameters['entrezGeneId'];
        }

        if (parameters['hugoSymbol'] !== undefined) {
            queryParameters['hugoSymbol'] = parameters['hugoSymbol'];
        }

        if (parameters['variant'] !== undefined) {
            queryParameters['variant'] = parameters['variant'];
        }

        if (parameters['variantType'] !== undefined) {
            queryParameters['variantType'] = parameters['variantType'];
        }

        if (parameters['consequence'] !== undefined) {
            queryParameters['consequence'] = parameters['consequence'];
        }

        if (parameters['proteinStart'] !== undefined) {
            queryParameters['proteinStart'] = parameters['proteinStart'];
        }

        if (parameters['proteinEnd'] !== undefined) {
            queryParameters['proteinEnd'] = parameters['proteinEnd'];
        }

        if (parameters['hgvs'] !== undefined) {
            queryParameters['hgvs'] = parameters['hgvs'];
        }

        if (parameters['fields'] !== undefined) {
            queryParameters['fields'] = parameters['fields'];
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
     * Search for variants.
     * @method
     * @name OncoKbAPI#variantsLookupGetUsingGET
     * @param {integer} entrezGeneId - The entrez gene ID. entrezGeneId is prioritize than hugoSymbol if both parameters have been defined
     * @param {string} hugoSymbol - The gene symbol used in Human Genome Organisation.
     * @param {string} variant - variant name.
     * @param {string} variantType - variantType
     * @param {string} consequence - consequence
     * @param {integer} proteinStart - proteinStart
     * @param {integer} proteinEnd - proteinEnd
     * @param {string} hgvs - HGVS varaint. Its priority is higher than entrezGeneId/hugoSymbol + variant combination
     * @param {string} fields - The fields to be returned.
     */
    variantsLookupGetUsingGETWithHttpInfo(parameters: {
        'entrezGeneId' ? : number,
        'hugoSymbol' ? : string,
        'variant' ? : string,
        'variantType' ? : string,
        'consequence' ? : string,
        'proteinStart' ? : number,
        'proteinEnd' ? : number,
        'hgvs' ? : string,
        'fields' ? : string,
        $queryParameters ? : any,
            $domain ? : string
    }): Promise < request.Response > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        const errorHandlers = this.errorHandlers;
        const request = this.request;
        let path = '/variants/lookup';
        let body: any;
        let queryParameters: any = {};
        let headers: any = {};
        let form: any = {};
        return new Promise(function(resolve, reject) {
            headers['Accept'] = 'application/json';
            headers['Content-Type'] = 'application/json';

            if (parameters['entrezGeneId'] !== undefined) {
                queryParameters['entrezGeneId'] = parameters['entrezGeneId'];
            }

            if (parameters['hugoSymbol'] !== undefined) {
                queryParameters['hugoSymbol'] = parameters['hugoSymbol'];
            }

            if (parameters['variant'] !== undefined) {
                queryParameters['variant'] = parameters['variant'];
            }

            if (parameters['variantType'] !== undefined) {
                queryParameters['variantType'] = parameters['variantType'];
            }

            if (parameters['consequence'] !== undefined) {
                queryParameters['consequence'] = parameters['consequence'];
            }

            if (parameters['proteinStart'] !== undefined) {
                queryParameters['proteinStart'] = parameters['proteinStart'];
            }

            if (parameters['proteinEnd'] !== undefined) {
                queryParameters['proteinEnd'] = parameters['proteinEnd'];
            }

            if (parameters['hgvs'] !== undefined) {
                queryParameters['hgvs'] = parameters['hgvs'];
            }

            if (parameters['fields'] !== undefined) {
                queryParameters['fields'] = parameters['fields'];
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
     * Search for variants.
     * @method
     * @name OncoKbAPI#variantsLookupGetUsingGET
     * @param {integer} entrezGeneId - The entrez gene ID. entrezGeneId is prioritize than hugoSymbol if both parameters have been defined
     * @param {string} hugoSymbol - The gene symbol used in Human Genome Organisation.
     * @param {string} variant - variant name.
     * @param {string} variantType - variantType
     * @param {string} consequence - consequence
     * @param {integer} proteinStart - proteinStart
     * @param {integer} proteinEnd - proteinEnd
     * @param {string} hgvs - HGVS varaint. Its priority is higher than entrezGeneId/hugoSymbol + variant combination
     * @param {string} fields - The fields to be returned.
     */
    variantsLookupGetUsingGET(parameters: {
            'entrezGeneId' ? : number,
            'hugoSymbol' ? : string,
            'variant' ? : string,
            'variantType' ? : string,
            'consequence' ? : string,
            'proteinStart' ? : number,
            'proteinEnd' ? : number,
            'hgvs' ? : string,
            'fields' ? : string,
            $queryParameters ? : any,
                $domain ? : string
        }): Promise < Array < Alteration >
        > {
            return this.variantsLookupGetUsingGETWithHttpInfo(parameters).then(function(response: request.Response) {
                return response.body;
            });
        };
    variantsLookupPostUsingPOSTURL(parameters: {
        'body': Array < VariantSearchQuery > ,
        'fields' ? : string,
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/variants/lookup';

        if (parameters['fields'] !== undefined) {
            queryParameters['fields'] = parameters['fields'];
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
     * Search for variants.
     * @method
     * @name OncoKbAPI#variantsLookupPostUsingPOST
     * @param {} body - List of queries.
     * @param {string} fields - The fields to be returned.
     */
    variantsLookupPostUsingPOSTWithHttpInfo(parameters: {
        'body': Array < VariantSearchQuery > ,
        'fields' ? : string,
        $queryParameters ? : any,
        $domain ? : string
    }): Promise < request.Response > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        const errorHandlers = this.errorHandlers;
        const request = this.request;
        let path = '/variants/lookup';
        let body: any;
        let queryParameters: any = {};
        let headers: any = {};
        let form: any = {};
        return new Promise(function(resolve, reject) {
            headers['Accept'] = 'application/json';
            headers['Content-Type'] = 'application/json';

            if (parameters['body'] !== undefined) {
                body = parameters['body'];
            }

            if (parameters['body'] === undefined) {
                reject(new Error('Missing required  parameter: body'));
                return;
            }

            if (parameters['fields'] !== undefined) {
                queryParameters['fields'] = parameters['fields'];
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
     * Search for variants.
     * @method
     * @name OncoKbAPI#variantsLookupPostUsingPOST
     * @param {} body - List of queries.
     * @param {string} fields - The fields to be returned.
     */
    variantsLookupPostUsingPOST(parameters: {
            'body': Array < VariantSearchQuery > ,
            'fields' ? : string,
            $queryParameters ? : any,
            $domain ? : string
        }): Promise < Array < Array < {} >
        >
        > {
            return this.variantsLookupPostUsingPOSTWithHttpInfo(parameters).then(function(response: request.Response) {
                return response.body;
            });
        };
}