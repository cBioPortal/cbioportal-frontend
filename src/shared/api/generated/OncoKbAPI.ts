import * as request from "superagent";

type CallbackHandler = (err: any, res ? : request.Response) => void;
export type Drug = {
    'atcCodes': Array < string >

        'drugName': string

        'synonyms': Array < string >

};
export type EvidenceQueryRes = {
    'alleles': Array < Alteration >

        'alterations': Array < Alteration >

        'evidences': Array < Evidence >

        'gene': Gene

        'id': string

        'levelOfEvidences': Array < "LEVEL_0" | "LEVEL_1" | "LEVEL_2A" | "LEVEL_2B" | "LEVEL_3" | "LEVEL_3A" | "LEVEL_3B" | "LEVEL_4" | "LEVEL_R1" | "LEVEL_R2" | "LEVEL_R3" | "LEVEL_P1" | "LEVEL_P2" | "LEVEL_P3" | "LEVEL_P4" | "LEVEL_D1" | "LEVEL_D2" | "LEVEL_D3" >

        'oncoTreeTypes': Array < TumorType >

        'query': Query

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
export type NccnGuideline = {
    'additionalInfo': string

        'category': string

        'description': string

        'disease': string

        'empty': boolean

        'pages': string

        'therapy': string

        'version': string

};
export type CancerGene = {
    'entrezGeneId': string

        'foundation': boolean

        'foundationHeme': boolean

        'hugoSymbol': string

        'mSKHeme': boolean

        'mSKImpact': boolean

        'occurrenceCount': number

        'oncokbAnnotated': boolean

        'sangerCGC': boolean

        'vogelstein': boolean

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
export type MainType = {
    'id': number

        'name': string

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
    'abstracts': Array < ArticleAbstract >

        'approvedIndications': Array < string >

        'drugs': Array < Drug >

        'fdaApproved': boolean

        'level': "LEVEL_0" | "LEVEL_1" | "LEVEL_2A" | "LEVEL_2B" | "LEVEL_3" | "LEVEL_3A" | "LEVEL_3B" | "LEVEL_4" | "LEVEL_R1" | "LEVEL_R2" | "LEVEL_R3" | "LEVEL_P1" | "LEVEL_P2" | "LEVEL_P3" | "LEVEL_P4" | "LEVEL_D1" | "LEVEL_D2" | "LEVEL_D3"

        'pmids': Array < string >

};
export type ResponseEntity = {
    'body': {}

    'statusCode': "100" | "101" | "102" | "103" | "200" | "201" | "202" | "203" | "204" | "205" | "206" | "207" | "208" | "226" | "300" | "301" | "302" | "303" | "304" | "305" | "307" | "308" | "400" | "401" | "402" | "403" | "404" | "405" | "406" | "407" | "408" | "409" | "410" | "411" | "412" | "413" | "414" | "415" | "416" | "417" | "418" | "419" | "420" | "421" | "422" | "423" | "424" | "426" | "428" | "429" | "431" | "500" | "501" | "502" | "503" | "504" | "505" | "506" | "507" | "508" | "509" | "510" | "511"

};
export type Treatment = {
    'approvedIndications': Array < string >

        'drugs': Array < Drug >

};
export type EvidenceQueries = {
    'evidenceTypes': string

        'highestLevelOnly': boolean

        'levels': Array < "LEVEL_0" | "LEVEL_1" | "LEVEL_2A" | "LEVEL_2B" | "LEVEL_3" | "LEVEL_3A" | "LEVEL_3B" | "LEVEL_4" | "LEVEL_R1" | "LEVEL_R2" | "LEVEL_R3" | "LEVEL_P1" | "LEVEL_P2" | "LEVEL_P3" | "LEVEL_P4" | "LEVEL_D1" | "LEVEL_D2" | "LEVEL_D3" >

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

        'level': "PRIMARY" | "Secondary" | "Tertiary" | "Quaternary" | "Quinternary"

        'links': Array < Link >

        'mainType': MainType

        'name': string

        'parent': string

        'tissue': string

};
export type GeneEvidence = {
    'articles': Array < Article >

        'desc': string

        'evidenceId': number

        'evidenceType': "GENE_SUMMARY" | "MUTATION_SUMMARY" | "TUMOR_TYPE_SUMMARY" | "GENE_TUMOR_TYPE_SUMMARY" | "GENE_BACKGROUND" | "ONCOGENIC" | "MUTATION_EFFECT" | "VUS" | "PREVALENCE" | "PROGNOSTIC_IMPLICATION" | "DIAGNOSTIC_IMPLICATION" | "NCCN_GUIDELINES" | "STANDARD_THERAPEUTIC_IMPLICATIONS_FOR_DRUG_SENSITIVITY" | "STANDARD_THERAPEUTIC_IMPLICATIONS_FOR_DRUG_RESISTANCE" | "INVESTIGATIONAL_THERAPEUTIC_IMPLICATIONS_DRUG_SENSITIVITY" | "INVESTIGATIONAL_THERAPEUTIC_IMPLICATIONS_DRUG_RESISTANCE" | "CLINICAL_TRIAL"

        'gene': Gene

        'id': string

        'lastEdit': string

        'shortDesc': string

        'status': string

};
export type ClinicalTrial = {
    'cdrId': string

        'countries': Array < string >

        'diseaseCondition': string

        'drugs': Array < Drug >

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
export type Evidence = {
    'additionalInfo': string

        'alterations': Array < Alteration >

        'articles': Array < Article >

        'cancerType': string

        'clinicalTrials': Array < ClinicalTrial >

        'description': string

        'evidenceType': "GENE_SUMMARY" | "MUTATION_SUMMARY" | "TUMOR_TYPE_SUMMARY" | "GENE_TUMOR_TYPE_SUMMARY" | "GENE_BACKGROUND" | "ONCOGENIC" | "MUTATION_EFFECT" | "VUS" | "PREVALENCE" | "PROGNOSTIC_IMPLICATION" | "DIAGNOSTIC_IMPLICATION" | "NCCN_GUIDELINES" | "STANDARD_THERAPEUTIC_IMPLICATIONS_FOR_DRUG_SENSITIVITY" | "STANDARD_THERAPEUTIC_IMPLICATIONS_FOR_DRUG_RESISTANCE" | "INVESTIGATIONAL_THERAPEUTIC_IMPLICATIONS_DRUG_SENSITIVITY" | "INVESTIGATIONAL_THERAPEUTIC_IMPLICATIONS_DRUG_RESISTANCE" | "CLINICAL_TRIAL"

        'gene': Gene

        'knownEffect': string

        'lastEdit': string

        'levelOfEvidence': "LEVEL_0" | "LEVEL_1" | "LEVEL_2A" | "LEVEL_2B" | "LEVEL_3" | "LEVEL_3A" | "LEVEL_3B" | "LEVEL_4" | "LEVEL_R1" | "LEVEL_R2" | "LEVEL_R3" | "LEVEL_P1" | "LEVEL_P2" | "LEVEL_P3" | "LEVEL_P4" | "LEVEL_D1" | "LEVEL_D2" | "LEVEL_D3"

        'nccnGuidelines': Array < NccnGuideline >

        'oncoTreeType': TumorType

        'propagation': string

        'subtype': string

        'treatments': Array < Treatment >

};
export type IndicatorQueryResp = {
    'alleleExist': boolean

        'dataVersion': string

        'geneExist': boolean

        'geneSummary': string

        'highestResistanceLevel': "LEVEL_0" | "LEVEL_1" | "LEVEL_2A" | "LEVEL_2B" | "LEVEL_3" | "LEVEL_3A" | "LEVEL_3B" | "LEVEL_4" | "LEVEL_R1" | "LEVEL_R2" | "LEVEL_R3" | "LEVEL_P1" | "LEVEL_P2" | "LEVEL_P3" | "LEVEL_P4" | "LEVEL_D1" | "LEVEL_D2" | "LEVEL_D3"

        'highestSensitiveLevel': "LEVEL_0" | "LEVEL_1" | "LEVEL_2A" | "LEVEL_2B" | "LEVEL_3" | "LEVEL_3A" | "LEVEL_3B" | "LEVEL_4" | "LEVEL_R1" | "LEVEL_R2" | "LEVEL_R3" | "LEVEL_P1" | "LEVEL_P2" | "LEVEL_P3" | "LEVEL_P4" | "LEVEL_D1" | "LEVEL_D2" | "LEVEL_D3"

        'hotspot': boolean

        'lastUpdate': string

        'oncogenic': string

        'otherSignificantResistanceLevels': Array < "LEVEL_0" | "LEVEL_1" | "LEVEL_2A" | "LEVEL_2B" | "LEVEL_3" | "LEVEL_3A" | "LEVEL_3B" | "LEVEL_4" | "LEVEL_R1" | "LEVEL_R2" | "LEVEL_R3" | "LEVEL_P1" | "LEVEL_P2" | "LEVEL_P3" | "LEVEL_P4" | "LEVEL_D1" | "LEVEL_D2" | "LEVEL_D3" >

        'otherSignificantSensitiveLevels': Array < "LEVEL_0" | "LEVEL_1" | "LEVEL_2A" | "LEVEL_2B" | "LEVEL_3" | "LEVEL_3A" | "LEVEL_3B" | "LEVEL_4" | "LEVEL_R1" | "LEVEL_R2" | "LEVEL_R3" | "LEVEL_P1" | "LEVEL_P2" | "LEVEL_P3" | "LEVEL_P4" | "LEVEL_D1" | "LEVEL_D2" | "LEVEL_D3" >

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

        'gene': string

        'level': string

        'pmids': string

        'variant': string

};
export type Link = {
    'href': string

        'method': string

        'rel': string

};
export type ArticleAbstract = {
    'abstract': string

        'link': string

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

    evidencesUUIDsGetUsingPOSTURL(parameters: {
        'uuids': Array < string > ,
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/evidences';

        if (parameters.$queryParameters) {
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
     */
    evidencesUUIDsGetUsingPOST(parameters: {
        'uuids': Array < string > ,
        $queryParameters ? : any,
        $domain ? : string
    }): Promise < Evidence > {
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
     * @param {string} evidenceTypes - Separate by comma. Evidence type includes GENE_SUMMARY, GENE_BACKGROUND, MUTATION_SUMMARY, ONCOGENIC, MUTATION_EFFECT, VUS, PREVALENCE, PROGNOSTIC_IMPLICATION, DIAGNOSTIC_IMPLICATION, TUMOR_TYPE_SUMMARY, NCCN_GUIDELINES, STANDARD_THERAPEUTIC_IMPLICATIONS_FOR_DRUG_SENSITIVITY, STANDARD_THERAPEUTIC_IMPLICATIONS_FOR_DRUG_RESISTANCE, INVESTIGATIONAL_THERAPEUTIC_IMPLICATIONS_DRUG_SENSITIVITY, INVESTIGATIONAL_THERAPEUTIC_IMPLICATIONS_DRUG_RESISTANCE, CLINICAL_TRIAL
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

    evidencesUUIDGetUsingGETURL(parameters: {
        'uuid': string,
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/evidences/{uuid}';

        path = path.replace('{uuid}', parameters['uuid'] + '');

        if (parameters.$queryParameters) {
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
     */
    evidencesUUIDGetUsingGET(parameters: {
        'uuid': string,
        $queryParameters ? : any,
        $domain ? : string
    }): Promise < Evidence > {
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
        'query' ? : string,
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

        if (parameters.$queryParameters) {
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
     */
    genesLookupGetUsingGET(parameters: {
            'hugoSymbol' ? : string,
            'entrezGeneId' ? : number,
            'query' ? : string,
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

                if (parameters['query'] !== undefined) {
                    queryParameters['query'] = parameters['query'];
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
    }): Promise < {} > {
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
    }): Promise < {} > {
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
    }): Promise < {} > {
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
        'queryType' ? : string,
        'hgvs' ? : string,
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

        if (parameters['queryType'] !== undefined) {
            queryParameters['queryType'] = parameters['queryType'];
        }

        if (parameters['hgvs'] !== undefined) {
            queryParameters['hgvs'] = parameters['hgvs'];
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
     * @param {string} queryType - Query type. There maybe slight differences between different query types. Currently support web or regular.
     * @param {string} hgvs - HGVS varaint. Its priority is higher than entrezGeneId/hugoSymbol + variant combination
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
        'queryType' ? : string,
        'hgvs' ? : string,
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

            if (parameters['queryType'] !== undefined) {
                queryParameters['queryType'] = parameters['queryType'];
            }

            if (parameters['hgvs'] !== undefined) {
                queryParameters['hgvs'] = parameters['hgvs'];
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
     * Get cancer gene list in text file.
     * @method
     * @name OncoKbAPI#utilsCancerGeneListGetUsingGET
     */
    utilsCancerGeneListGetUsingGET(parameters: {
            $queryParameters ? : any,
                $domain ? : string
        }): Promise < Array < CancerGene >
        > {
            const domain = parameters.$domain ? parameters.$domain : this.domain;
            const errorHandlers = this.errorHandlers;
            const request = this.request;
            let path = '/utils/cancerGeneList';
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
        'hgvs' ? : string,
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

        if (parameters.$queryParameters) {
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

                if (parameters['hgvs'] !== undefined) {
                    queryParameters['hgvs'] = parameters['hgvs'];
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

    variantsLookupPostUsingPOSTURL(parameters: {
        'body': Array < VariantSearchQuery > ,
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/variants/lookup';

        if (parameters.$queryParameters) {
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
     */
    variantsLookupPostUsingPOST(parameters: {
            'body': Array < VariantSearchQuery > ,
            $queryParameters ? : any,
            $domain ? : string
        }): Promise < Array < Array < {} >
        >
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

}