import * as request from "superagent";

type CallbackHandler = (err: any, res ? : request.Response) => void;
export type Drug = {
    'atcCodes': Array < string > | string

        'drugName': string

        'synonyms': Array < string > | string

};
export type ApiErrorResp = {
    'meta': Meta

};
export type OncoTreeType = {
    'cancerType': string

        'code': string

        'level': string

        'subtype': string

        'tissue': string

};
export type Meta = {
    'code': number

        'errorMessage': string

        'errorType': string

};
export type EvidenceQueryRes = {
    'alleles': Array < Alteration > | Alteration

        'alterations': Array < Alteration > | Alteration

        'evidences': Array < Evidence > | Evidence

        'gene': Gene

        'id': string

        'levelOfEvidences': Array < "LEVEL_0" | "LEVEL_1" | "LEVEL_2A" | "LEVEL_2B" | "LEVEL_3" | "LEVEL_3A" | "LEVEL_3B" | "LEVEL_4" | "LEVEL_R1" | "LEVEL_R2" | "LEVEL_R3" > | "LEVEL_0" | "LEVEL_1" | "LEVEL_2A" | "LEVEL_2B" | "LEVEL_3" | "LEVEL_3A" | "LEVEL_3B" | "LEVEL_4" | "LEVEL_R1" | "LEVEL_R2" | "LEVEL_R3"

        'oncoTreeTypes': Array < OncoTreeType > | OncoTreeType

        'query': Query

};
export type Query = {
    'alteration': string

        'alterationType': string

        'consequence': string

        'entrezGeneId': number

        'hugoSymbol': string

        'id': string

        'proteinEnd': number

        'proteinStart': number

        'tumorType': string

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
export type NccnGuideline = {
    'additionalInfo': string

        'category': string

        'description': string

        'disease': string

        'pages': string

        'version': string

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
    'gene': string

        'mutationEffect': string

        'mutationEffectAbstracts': string

        'mutationEffectPmids': string

        'oncogenicity': string

        'variant': string

};
export type VariantConsequence = {
    'description': string

        'isGenerallyTruncating': boolean

        'term': string

};
export type IndicatorQueryTreatment = {
    'abstracts': Array < ArticleAbstract > | ArticleAbstract

        'approvedIndications': Array < string > | string

        'drugs': Array < Drug > | Drug

        'fdaApproved': boolean

        'level': "LEVEL_0" | "LEVEL_1" | "LEVEL_2A" | "LEVEL_2B" | "LEVEL_3" | "LEVEL_3A" | "LEVEL_3B" | "LEVEL_4" | "LEVEL_R1" | "LEVEL_R2" | "LEVEL_R3"

        'pmids': Array < string > | string

};
export type Treatment = {
    'approvedIndications': Array < string > | string

        'drugs': Array < Drug > | Drug

};
export type EvidenceQueries = {
    'evidenceTypes': string

        'highestLevelOnly': boolean

        'levels': Array < "LEVEL_0" | "LEVEL_1" | "LEVEL_2A" | "LEVEL_2B" | "LEVEL_3" | "LEVEL_3A" | "LEVEL_3B" | "LEVEL_4" | "LEVEL_R1" | "LEVEL_R2" | "LEVEL_R3" > | "LEVEL_0" | "LEVEL_1" | "LEVEL_2A" | "LEVEL_2B" | "LEVEL_3" | "LEVEL_3A" | "LEVEL_3B" | "LEVEL_4" | "LEVEL_R1" | "LEVEL_R2" | "LEVEL_R3"

        'queries': Array < Query > | Query

        'source': string

};
export type Gene = {
    'curatedIsoform': string

        'curatedRefSeq': string

        'entrezGeneId': number

        'geneAliases': Array < string > | string

        'hugoSymbol': string

        'name': string

        'oncogene': boolean

        'tsg': boolean

};
export type GeneEvidence = {
    'articles': Array < Article > | Article

        'desc': string

        'evidenceId': number

        'evidenceType': "GENE_SUMMARY" | "MUTATION_SUMMARY" | "TUMOR_TYPE_SUMMARY" | "GENE_TUMOR_TYPE_SUMMARY" | "GENE_BACKGROUND" | "ONCOGENIC" | "MUTATION_EFFECT" | "VUS" | "PREVALENCE" | "PROGNOSTIC_IMPLICATION" | "NCCN_GUIDELINES" | "STANDARD_THERAPEUTIC_IMPLICATIONS_FOR_DRUG_SENSITIVITY" | "STANDARD_THERAPEUTIC_IMPLICATIONS_FOR_DRUG_RESISTANCE" | "INVESTIGATIONAL_THERAPEUTIC_IMPLICATIONS_DRUG_SENSITIVITY" | "INVESTIGATIONAL_THERAPEUTIC_IMPLICATIONS_DRUG_RESISTANCE" | "CLINICAL_TRIAL"

        'gene': Gene

        'id': string

        'lastEdit': string

        'shortDesc': string

        'status': string

};
export type ClinicalTrial = {
    'cdrId': string

        'countries': Array < string > | string

        'diseaseCondition': string

        'drugs': Array < Drug > | Drug

        'eligibilityCriteria': string

        'inUSA': boolean

        'lastChangedDate': string

        'nctId': string

        'open': boolean

        'phase': string

        'purpose': string

        'recruitingStatus': string

        'title': string

};
export type ApiObjectResp = {
    'data': {}

    'meta': Meta

};
export type Evidence = {
    'additionalInfo': string

        'alterations': Array < Alteration > | Alteration

        'articles': Array < Article > | Article

        'cancerType': string

        'clinicalTrials': Array < ClinicalTrial > | ClinicalTrial

        'description': string

        'evidenceType': "GENE_SUMMARY" | "MUTATION_SUMMARY" | "TUMOR_TYPE_SUMMARY" | "GENE_TUMOR_TYPE_SUMMARY" | "GENE_BACKGROUND" | "ONCOGENIC" | "MUTATION_EFFECT" | "VUS" | "PREVALENCE" | "PROGNOSTIC_IMPLICATION" | "NCCN_GUIDELINES" | "STANDARD_THERAPEUTIC_IMPLICATIONS_FOR_DRUG_SENSITIVITY" | "STANDARD_THERAPEUTIC_IMPLICATIONS_FOR_DRUG_RESISTANCE" | "INVESTIGATIONAL_THERAPEUTIC_IMPLICATIONS_DRUG_SENSITIVITY" | "INVESTIGATIONAL_THERAPEUTIC_IMPLICATIONS_DRUG_RESISTANCE" | "CLINICAL_TRIAL"

        'gene': Gene

        'knownEffect': string

        'lastEdit': string

        'levelOfEvidence': "LEVEL_0" | "LEVEL_1" | "LEVEL_2A" | "LEVEL_2B" | "LEVEL_3" | "LEVEL_3A" | "LEVEL_3B" | "LEVEL_4" | "LEVEL_R1" | "LEVEL_R2" | "LEVEL_R3"

        'nccnGuidelines': Array < NccnGuideline > | NccnGuideline

        'oncoTreeType': OncoTreeType

        'subtype': string

        'treatments': Array < Treatment > | Treatment

};
export type ApiListResp = {
    'data': Array < {} > | {}

        'meta': Meta

};
export type IndicatorQueryResp = {
    'alleleExist': boolean

        'dataVersion': string

        'geneExist': boolean

        'geneSummary': string

        'highestResistanceLevel': "LEVEL_0" | "LEVEL_1" | "LEVEL_2A" | "LEVEL_2B" | "LEVEL_3" | "LEVEL_3A" | "LEVEL_3B" | "LEVEL_4" | "LEVEL_R1" | "LEVEL_R2" | "LEVEL_R3"

        'highestSensitiveLevel': "LEVEL_0" | "LEVEL_1" | "LEVEL_2A" | "LEVEL_2B" | "LEVEL_3" | "LEVEL_3A" | "LEVEL_3B" | "LEVEL_4" | "LEVEL_R1" | "LEVEL_R2" | "LEVEL_R3"

        'hotspot': boolean

        'lastUpdate': string

        'oncogenic': string

        'otherSignificantResistanceLevels': Array < "LEVEL_0" | "LEVEL_1" | "LEVEL_2A" | "LEVEL_2B" | "LEVEL_3" | "LEVEL_3A" | "LEVEL_3B" | "LEVEL_4" | "LEVEL_R1" | "LEVEL_R2" | "LEVEL_R3" > | "LEVEL_0" | "LEVEL_1" | "LEVEL_2A" | "LEVEL_2B" | "LEVEL_3" | "LEVEL_3A" | "LEVEL_3B" | "LEVEL_4" | "LEVEL_R1" | "LEVEL_R2" | "LEVEL_R3"

        'otherSignificantSensitiveLevels': Array < "LEVEL_0" | "LEVEL_1" | "LEVEL_2A" | "LEVEL_2B" | "LEVEL_3" | "LEVEL_3A" | "LEVEL_3B" | "LEVEL_4" | "LEVEL_R1" | "LEVEL_R2" | "LEVEL_R3" > | "LEVEL_0" | "LEVEL_1" | "LEVEL_2A" | "LEVEL_2B" | "LEVEL_3" | "LEVEL_3A" | "LEVEL_3B" | "LEVEL_4" | "LEVEL_R1" | "LEVEL_R2" | "LEVEL_R3"

        'query': Query

        'treatments': Array < IndicatorQueryTreatment > | IndicatorQueryTreatment

        'tumorTypeSummary': string

        'variantExist': boolean

        'variantSummary': string

        'vus': boolean

};
export type ActionableGene = {
    'abstracts': string

        'cancerType': string

        'drugs': string

        'gene': string

        'level': string

        'pmids': string

        'variant': string

};
export type ArticleAbstract = {
    'abstract': string

        'link': string

};

/**
 * Every response is contained by an envelope. The meta key is used to communicate extra information about the response to the developer. 
In order to expose the data structure, we return object model in the Swagger response class directly instead of envelope structure. So you may not be able to reproduce data structure through swagger.json directly.
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
    drugsGetUsingGET(parameters: {
            $queryParameters ? : any,
                $domain ? : string
        }): Promise < Array < Drug >
        > {
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

            }).then(function(response: request.Response) {
                return response.body;
            });
        };

    drugsLookupGetUsingGETURL(parameters: {
        'name' ? : string,
        'atcCode' ? : string,
        'synonym' ? : string,
        'exactMatch': boolean,
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/drugs/lookup';
        if (parameters['name'] !== undefined) {
            queryParameters['name'] = parameters['name'];
        }

        if (parameters['atcCode'] !== undefined) {
            queryParameters['atcCode'] = parameters['atcCode'];
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
     * @param {string} atcCode - ATC Code
     * @param {string} synonym - Drug Synonyms
     * @param {boolean} exactMatch - Exactly Match
     */
    drugsLookupGetUsingGET(parameters: {
            'name' ? : string,
            'atcCode' ? : string,
            'synonym' ? : string,
            'exactMatch': boolean,
            $queryParameters ? : any,
                $domain ? : string
        }): Promise < Array < Drug >
        > {
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

                if (parameters['atcCode'] !== undefined) {
                    queryParameters['atcCode'] = parameters['atcCode'];
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

            }).then(function(response: request.Response) {
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

        if (parameters.$queryParameters) {
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
     * @param {integer} entrezGeneId - The entrez gene ID. Use comma to seperate multi-queries.
     * @param {string} hugoSymbol - The gene symbol used in Human Genome Organisation. Use comma to seperate multi-queries.
     * @param {string} variant - Variant name. Use comma to seperate multi-queries.
     * @param {string} tumorType - Tumor type name. OncoTree code is supported. Use comma to seperate multi-queries.
     * @param {string} consequence - Consequence. Use comma to seperate multi-queries. Possible value: feature_truncation, frameshift_variant, inframe_deletion, inframe_insertion, initiator_codon_variant, missense_variant, splice_region_variant, stop_gained, synonymous_variant
     * @param {string} proteinStart - Protein Start. Use comma to seperate multi-queries.
     * @param {string} proteinEnd - Protein End. Use comma to seperate multi-queries.
     * @param {string} source - Tumor type source. OncoTree tumor types are the default setting. We may have customized version, like Quest.
     * @param {boolean} highestLevelOnly - Only show highest level evidences
     * @param {string} levelOfEvidence - Separate by comma. LEVEL_1, LEVEL_2A, LEVEL_2B, LEVEL_3A, LEVEL_3B, LEVEL_4, LEVEL_R1, LEVEL_R2, LEVEL_R3
     * @param {string} evidenceTypes - Separate by comma. Evidence type includes GENE_SUMMARY, GENE_BACKGROUND, MUTATION_SUMMARY, ONCOGENIC, MUTATION_EFFECT, VUS, PREVALENCE, PROGNOSTIC_IMPLICATION, TUMOR_TYPE_SUMMARY, NCCN_GUIDELINES, STANDARD_THERAPEUTIC_IMPLICATIONS_FOR_DRUG_SENSITIVITY, STANDARD_THERAPEUTIC_IMPLICATIONS_FOR_DRUG_RESISTANCE, INVESTIGATIONAL_THERAPEUTIC_IMPLICATIONS_DRUG_SENSITIVITY, INVESTIGATIONAL_THERAPEUTIC_IMPLICATIONS_DRUG_RESISTANCE, CLINICAL_TRIAL
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
            $queryParameters ? : any,
                $domain ? : string
        }): Promise < Array < Evidence >
        > {
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

    evidencesLookupPostUsingPOSTURL(parameters: {
        'body': EvidenceQueries,
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/evidences/lookup';

        if (parameters.$queryParameters) {
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
     */
    evidencesLookupPostUsingPOST(parameters: {
            'body': EvidenceQueries,
            $queryParameters ? : any,
            $domain ? : string
        }): Promise < Array < EvidenceQueryRes >
        > {
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

    genesGetUsingGETURL(parameters: {
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/genes';

        if (parameters.$queryParameters) {
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
     */
    genesGetUsingGET(parameters: {
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

    genesLookupGetUsingGETURL(parameters: {
        'hugoSymbol' ? : string,
        'entrezGeneId' ? : number,
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

        if (parameters.$queryParameters) {
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
     * @param {string} hugoSymbol - The gene symbol used in Human Genome Organisation.
     * @param {integer} entrezGeneId - The entrez gene ID.
     */
    genesLookupGetUsingGET(parameters: {
            'hugoSymbol' ? : string,
            'entrezGeneId' ? : number,
            $queryParameters ? : any,
                $domain ? : string
        }): Promise < Array < Gene >
        > {
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

    genesEntrezGeneIdGetUsingGETURL(parameters: {
        'entrezGeneId': number,
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/genes/{entrezGeneId}';

        path = path.replace('{entrezGeneId}', parameters['entrezGeneId'] + '');

        if (parameters.$queryParameters) {
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
     */
    genesEntrezGeneIdGetUsingGET(parameters: {
        'entrezGeneId': number,
        $queryParameters ? : any,
        $domain ? : string
    }): Promise < Gene > {
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
    genesEntrezGeneIdEvidencesGetUsingGET(parameters: {
            'entrezGeneId': number,
            'evidenceTypes' ? : string,
            $queryParameters ? : any,
            $domain ? : string
        }): Promise < Array < GeneEvidence >
        > {
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

            }).then(function(response: request.Response) {
                return response.body;
            });
        };

    genesEntrezGeneIdVariantsGetUsingGETURL(parameters: {
        'entrezGeneId': number,
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/genes/{entrezGeneId}/variants';

        path = path.replace('{entrezGeneId}', parameters['entrezGeneId'] + '');

        if (parameters.$queryParameters) {
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
     */
    genesEntrezGeneIdVariantsGetUsingGET(parameters: {
            'entrezGeneId': number,
            $queryParameters ? : any,
            $domain ? : string
        }): Promise < Array < Alteration >
        > {
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
    levelsGetUsingGET(parameters: {
        $queryParameters ? : any,
            $domain ? : string
    }): Promise < ApiObjectResp > {
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

        }).then(function(response: request.Response) {
            return response.body;
        });
    };

    levelsResistenceGetUsingGETURL(parameters: {
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/levels/resistence';

        if (parameters.$queryParameters) {
            Object.keys(parameters.$queryParameters).forEach(function(parameterName) {
                var parameter = parameters.$queryParameters[parameterName];
                queryParameters[parameterName] = parameter;
            });
        }
        let keys = Object.keys(queryParameters);
        return this.domain + path + (keys.length > 0 ? '?' + (keys.map(key => key + '=' + encodeURIComponent(queryParameters[key])).join('&')) : '');
    };

    /**
     * Get all resistence levels.
     * @method
     * @name OncoKbAPI#levelsResistenceGetUsingGET
     */
    levelsResistenceGetUsingGET(parameters: {
        $queryParameters ? : any,
            $domain ? : string
    }): Promise < ApiObjectResp > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        const errorHandlers = this.errorHandlers;
        const request = this.request;
        let path = '/levels/resistence';
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

        }).then(function(response: request.Response) {
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
    levelsSensitiveGetUsingGET(parameters: {
        $queryParameters ? : any,
            $domain ? : string
    }): Promise < ApiObjectResp > {
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

        }).then(function(response: request.Response) {
            return response.body;
        });
    };

    searchGetUsingGETURL(parameters: {
        'id' ? : string,
        'hugoSymbol' ? : string,
        'entrezGeneId' ? : number,
        'variant' ? : string,
        'consequence' ? : string,
        'proteinStart' ? : number,
        'proteinEnd' ? : number,
        'tumorType' ? : string,
        'source' ? : string,
        'levels' ? : string,
        'highestLevelOnly' ? : boolean,
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

        if (parameters.$queryParameters) {
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
     * @param {string} consequence - Consequence
     * @param {integer} proteinStart - Protein Start
     * @param {integer} proteinEnd - Protein End
     * @param {string} tumorType - Tumor type name. OncoTree code is supported.
     * @param {string} source - Tumor type source. OncoTree tumor types are the default setting. We may have customized version, like Quest.
     * @param {string} levels - Level of evidences.
     * @param {boolean} highestLevelOnly - Only show treatments of highest level
     */
    searchGetUsingGET(parameters: {
        'id' ? : string,
        'hugoSymbol' ? : string,
        'entrezGeneId' ? : number,
        'variant' ? : string,
        'consequence' ? : string,
        'proteinStart' ? : number,
        'proteinEnd' ? : number,
        'tumorType' ? : string,
        'source' ? : string,
        'levels' ? : string,
        'highestLevelOnly' ? : boolean,
        $queryParameters ? : any,
            $domain ? : string
    }): Promise < IndicatorQueryResp > {
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

    searchPostUsingPOSTURL(parameters: {
        'body': EvidenceQueries,
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/search';

        if (parameters.$queryParameters) {
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
     */
    searchPostUsingPOST(parameters: {
            'body': EvidenceQueries,
            $queryParameters ? : any,
            $domain ? : string
        }): Promise < Array < IndicatorQueryResp >
        > {
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
    utilsAllActionableVariantsGetUsingGET(parameters: {
            $queryParameters ? : any,
                $domain ? : string
        }): Promise < Array < ActionableGene >
        > {
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

            }).then(function(response: request.Response) {
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
    utilsAllActionableVariantsTxtGetUsingGET(parameters: {
        $queryParameters ? : any,
            $domain ? : string
    }): Promise < string > {
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

        }).then(function(response: request.Response) {
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
    utilsAllAnnotatedVariantsGetUsingGET(parameters: {
            $queryParameters ? : any,
                $domain ? : string
        }): Promise < Array < AnnotatedVariant >
        > {
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

            }).then(function(response: request.Response) {
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
    utilsAllAnnotatedVariantsTxtGetUsingGET(parameters: {
        $queryParameters ? : any,
            $domain ? : string
    }): Promise < string > {
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

        }).then(function(response: request.Response) {
            return response.body;
        });
    };

    variantsGetUsingGETURL(parameters: {
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/variants';

        if (parameters.$queryParameters) {
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
     */
    variantsGetUsingGET(parameters: {
            $queryParameters ? : any,
                $domain ? : string
        }): Promise < Array < Alteration >
        > {
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

    variantsLookupGetUsingGETURL(parameters: {
        'entrezGeneId' ? : number,
        'hugoSymbol' ? : string,
        'variant' ? : string,
        'variantType' ? : string,
        'consequence' ? : string,
        'proteinStart' ? : number,
        'proteinEnd' ? : number,
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

        if (parameters.$queryParameters) {
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
     */
    variantsLookupGetUsingGET(parameters: {
            'entrezGeneId' ? : number,
            'hugoSymbol' ? : string,
            'variant' ? : string,
            'variantType' ? : string,
            'consequence' ? : string,
            'proteinStart' ? : number,
            'proteinEnd' ? : number,
            $queryParameters ? : any,
                $domain ? : string
        }): Promise < Array < Alteration >
        > {
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