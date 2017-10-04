import * as request from "superagent";

type CallbackHandler = (err: any, res ? : request.Response) => void;
export type GeneXref = {
    'db_display_name': string

        'dbname': string

        'description': string

        'display_id': string

        'info_text': string

        'info_types': string

        'primary_id': string

        'synonyms': Array < string >

        'version': string

};
export type Hotspot = {
    'geneId': string

        'hugoSymbol': string

        'proteinEnd': string

        'proteinStart': string

        'residue': string

        'transcriptId': string

};
export type IsoformOverride = {
    'ccdsId': string

        'geneSymbol': string

        'refseqId': string

        'transcriptId': string

};
export type ModelAndView = {
    'empty': boolean

        'model': {}

        'modelMap': {}

        'reference': boolean

        'view': View

        'viewName': string

};
export type MutationAssessor = {
    'codonStartPosition': string

        'cosmicCount': number

        'functionalImpact': string

        'functionalImpactScore': number

        'hugoSymbol': string

        'input': string

        'mappingIssue': string

        'msaGaps': number

        'msaHeight': number

        'msaLink': string

        'pdbLink': string

        'referenceGenomeVariant': string

        'referenceGenomeVariantType': string

        'refseqId': string

        'refseqPosition': number

        'refseqResidue': string

        'snpCount': number

        'uniprotId': string

        'uniprotPosition': number

        'uniprotResidue': string

        'variant': string

        'variantConservationScore': number

        'variantSpecificityScore': number

};
export type PfamDomain = {
    'geneId': string

        'geneSymbol': string

        'getPfamDomainEnd': string

        'pfamDomainDescription': string

        'pfamDomainId': string

        'pfamDomainName': string

        'pfamDomainStart': string

        'proteinId': string

        'transcriptId': string

};
export type TranscriptConsequence = {
    'amino_acids': string

        'canonical': string

        'codons': string

        'consequence_terms': Array < string >

        'gene_id': string

        'gene_symbol': string

        'hgnc_id': string

        'hgvsc': string

        'hgvsp': string

        'polyphen_prediction': string

        'polyphen_score': string

        'protein_end': string

        'protein_id': string

        'protein_start': string

        'refseq_transcript_ids': Array < string >

        'sift_prediction': string

        'sift_score': string

        'transcript_id': string

        'variant_allele': string

};
export type VariantAnnotation = {
    'allele_string': string

        'annotationJSON': string

        'assembly_name': string

        'end': number

        'id': string

        'most_severe_consequence': string

        'seq_region_name': string

        'start': number

        'strand': number

        'transcript_consequences': Array < TranscriptConsequence >

        'variant': string

};
export type View = {
    'contentType': string

};

/**
 * Genome Nexus Variant Annotation API
 * @class GenomeNexusAPI
 * @param {(string)} [domainOrOptions] - The project domain.
 */
export default class GenomeNexusAPI {

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

    postHotspotAnnotationURL(parameters: {
        'variants': Array < string > ,
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/cancer_hotspots';
        if (parameters['variants'] !== undefined) {
            queryParameters['variants'] = parameters['variants'];
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
     * Retrieves hotspot annotation for the provided list of variants
     * @method
     * @name GenomeNexusAPI#postHotspotAnnotation
     * @param {array} variants - Comma separated list of variants. For example 7:g.140453136A>T,12:g.25398285C>A
     */
    postHotspotAnnotation(parameters: {
            'variants': Array < string > ,
            $queryParameters ? : any,
            $domain ? : string
        }): Promise < Array < Hotspot >
        > {
            const domain = parameters.$domain ? parameters.$domain : this.domain;
            const errorHandlers = this.errorHandlers;
            const request = this.request;
            let path = '/cancer_hotspots';
            let body: any;
            let queryParameters: any = {};
            let headers: any = {};
            let form: any = {};
            return new Promise(function(resolve, reject) {
                headers['Accept'] = 'application/json';
                headers['Content-Type'] = 'application/json';

                if (parameters['variants'] !== undefined) {
                    queryParameters['variants'] = parameters['variants'];
                }

                if (parameters['variants'] === undefined) {
                    reject(new Error('Missing required  parameter: variants'));
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

    getHotspotAnnotationURL(parameters: {
        'variants': string,
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/cancer_hotspots/{variants}';

        path = path.replace('{variants}', parameters['variants'] + '');

        if (parameters.$queryParameters) {
            Object.keys(parameters.$queryParameters).forEach(function(parameterName) {
                var parameter = parameters.$queryParameters[parameterName];
                queryParameters[parameterName] = parameter;
            });
        }
        let keys = Object.keys(queryParameters);
        return this.domain + path + (keys.length > 0 ? '?' + (keys.map(key => key + '=' + encodeURIComponent(queryParameters[key])).join('&')) : '');
    };

    /**
     * Retrieves hotspot annotation for the provided list of variants
     * @method
     * @name GenomeNexusAPI#getHotspotAnnotation
     * @param {string} variants - Comma separated list of variants. For example 7:g.140453136A>T,12:g.25398285C>A
     */
    getHotspotAnnotation(parameters: {
            'variants': string,
            $queryParameters ? : any,
            $domain ? : string
        }): Promise < Array < Hotspot >
        > {
            const domain = parameters.$domain ? parameters.$domain : this.domain;
            const errorHandlers = this.errorHandlers;
            const request = this.request;
            let path = '/cancer_hotspots/{variants}';
            let body: any;
            let queryParameters: any = {};
            let headers: any = {};
            let form: any = {};
            return new Promise(function(resolve, reject) {
                headers['Accept'] = 'application/json';
                headers['Content-Type'] = 'application/json';

                path = path.replace('{variants}', parameters['variants'] + '');

                if (parameters['variants'] === undefined) {
                    reject(new Error('Missing required  parameter: variants'));
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

    errorUsingGETURL(parameters: {
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/error';

        if (parameters.$queryParameters) {
            Object.keys(parameters.$queryParameters).forEach(function(parameterName) {
                var parameter = parameters.$queryParameters[parameterName];
                queryParameters[parameterName] = parameter;
            });
        }
        let keys = Object.keys(queryParameters);
        return this.domain + path + (keys.length > 0 ? '?' + (keys.map(key => key + '=' + encodeURIComponent(queryParameters[key])).join('&')) : '');
    };

    /**
     * error
     * @method
     * @name GenomeNexusAPI#errorUsingGET
     */
    errorUsingGET(parameters: {
        $queryParameters ? : any,
            $domain ? : string
    }): Promise < {} > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        const errorHandlers = this.errorHandlers;
        const request = this.request;
        let path = '/error';
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

    errorUsingHEADURL(parameters: {
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/error';

        if (parameters.$queryParameters) {
            Object.keys(parameters.$queryParameters).forEach(function(parameterName) {
                var parameter = parameters.$queryParameters[parameterName];
                queryParameters[parameterName] = parameter;
            });
        }
        let keys = Object.keys(queryParameters);
        return this.domain + path + (keys.length > 0 ? '?' + (keys.map(key => key + '=' + encodeURIComponent(queryParameters[key])).join('&')) : '');
    };

    /**
     * error
     * @method
     * @name GenomeNexusAPI#errorUsingHEAD
     */
    errorUsingHEAD(parameters: {
        $queryParameters ? : any,
            $domain ? : string
    }): Promise < {} > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        const errorHandlers = this.errorHandlers;
        const request = this.request;
        let path = '/error';
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

            request('HEAD', domain + path, body, headers, queryParameters, form, reject, resolve, errorHandlers);

        }).then(function(response: request.Response) {
            return response.body;
        });
    };

    errorUsingPOSTURL(parameters: {
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/error';

        if (parameters.$queryParameters) {
            Object.keys(parameters.$queryParameters).forEach(function(parameterName) {
                var parameter = parameters.$queryParameters[parameterName];
                queryParameters[parameterName] = parameter;
            });
        }
        let keys = Object.keys(queryParameters);
        return this.domain + path + (keys.length > 0 ? '?' + (keys.map(key => key + '=' + encodeURIComponent(queryParameters[key])).join('&')) : '');
    };

    /**
     * error
     * @method
     * @name GenomeNexusAPI#errorUsingPOST
     */
    errorUsingPOST(parameters: {
        $queryParameters ? : any,
            $domain ? : string
    }): Promise < {} > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        const errorHandlers = this.errorHandlers;
        const request = this.request;
        let path = '/error';
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

            request('POST', domain + path, body, headers, queryParameters, form, reject, resolve, errorHandlers);

        }).then(function(response: request.Response) {
            return response.body;
        });
    };

    errorUsingPUTURL(parameters: {
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/error';

        if (parameters.$queryParameters) {
            Object.keys(parameters.$queryParameters).forEach(function(parameterName) {
                var parameter = parameters.$queryParameters[parameterName];
                queryParameters[parameterName] = parameter;
            });
        }
        let keys = Object.keys(queryParameters);
        return this.domain + path + (keys.length > 0 ? '?' + (keys.map(key => key + '=' + encodeURIComponent(queryParameters[key])).join('&')) : '');
    };

    /**
     * error
     * @method
     * @name GenomeNexusAPI#errorUsingPUT
     */
    errorUsingPUT(parameters: {
        $queryParameters ? : any,
            $domain ? : string
    }): Promise < {} > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        const errorHandlers = this.errorHandlers;
        const request = this.request;
        let path = '/error';
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

            request('PUT', domain + path, body, headers, queryParameters, form, reject, resolve, errorHandlers);

        }).then(function(response: request.Response) {
            return response.body;
        });
    };

    errorUsingDELETEURL(parameters: {
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/error';

        if (parameters.$queryParameters) {
            Object.keys(parameters.$queryParameters).forEach(function(parameterName) {
                var parameter = parameters.$queryParameters[parameterName];
                queryParameters[parameterName] = parameter;
            });
        }
        let keys = Object.keys(queryParameters);
        return this.domain + path + (keys.length > 0 ? '?' + (keys.map(key => key + '=' + encodeURIComponent(queryParameters[key])).join('&')) : '');
    };

    /**
     * error
     * @method
     * @name GenomeNexusAPI#errorUsingDELETE
     */
    errorUsingDELETE(parameters: {
        $queryParameters ? : any,
            $domain ? : string
    }): Promise < {} > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        const errorHandlers = this.errorHandlers;
        const request = this.request;
        let path = '/error';
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

            request('DELETE', domain + path, body, headers, queryParameters, form, reject, resolve, errorHandlers);

        }).then(function(response: request.Response) {
            return response.body;
        });
    };

    errorUsingOPTIONSURL(parameters: {
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/error';

        if (parameters.$queryParameters) {
            Object.keys(parameters.$queryParameters).forEach(function(parameterName) {
                var parameter = parameters.$queryParameters[parameterName];
                queryParameters[parameterName] = parameter;
            });
        }
        let keys = Object.keys(queryParameters);
        return this.domain + path + (keys.length > 0 ? '?' + (keys.map(key => key + '=' + encodeURIComponent(queryParameters[key])).join('&')) : '');
    };

    /**
     * error
     * @method
     * @name GenomeNexusAPI#errorUsingOPTIONS
     */
    errorUsingOPTIONS(parameters: {
        $queryParameters ? : any,
            $domain ? : string
    }): Promise < {} > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        const errorHandlers = this.errorHandlers;
        const request = this.request;
        let path = '/error';
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

            request('OPTIONS', domain + path, body, headers, queryParameters, form, reject, resolve, errorHandlers);

        }).then(function(response: request.Response) {
            return response.body;
        });
    };

    errorUsingPATCHURL(parameters: {
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/error';

        if (parameters.$queryParameters) {
            Object.keys(parameters.$queryParameters).forEach(function(parameterName) {
                var parameter = parameters.$queryParameters[parameterName];
                queryParameters[parameterName] = parameter;
            });
        }
        let keys = Object.keys(queryParameters);
        return this.domain + path + (keys.length > 0 ? '?' + (keys.map(key => key + '=' + encodeURIComponent(queryParameters[key])).join('&')) : '');
    };

    /**
     * error
     * @method
     * @name GenomeNexusAPI#errorUsingPATCH
     */
    errorUsingPATCH(parameters: {
        $queryParameters ? : any,
            $domain ? : string
    }): Promise < {} > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        const errorHandlers = this.errorHandlers;
        const request = this.request;
        let path = '/error';
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

            request('PATCH', domain + path, body, headers, queryParameters, form, reject, resolve, errorHandlers);

        }).then(function(response: request.Response) {
            return response.body;
        });
    };

    postVariantAnnotationURL(parameters: {
        'variants': Array < string > ,
        'isoformOverrideSource' ? : string,
        'fields' ? : Array < string > ,
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/hgvs';
        if (parameters['variants'] !== undefined) {
            queryParameters['variants'] = parameters['variants'];
        }

        if (parameters['isoformOverrideSource'] !== undefined) {
            queryParameters['isoformOverrideSource'] = parameters['isoformOverrideSource'];
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
     * Retrieves VEP annotation for the provided list of variants
     * @method
     * @name GenomeNexusAPI#postVariantAnnotation
     * @param {array} variants - Comma separated list of variants. For example X:g.66937331T>A,17:g.41242962->GA
     * @param {string} isoformOverrideSource - Isoform override source. For example uniprot
     * @param {array} fields - Comma separated list of fields to include (case-sensitive!). For example: hotspots,mutation_assessor
     */
    postVariantAnnotation(parameters: {
            'variants': Array < string > ,
            'isoformOverrideSource' ? : string,
            'fields' ? : Array < string > ,
            $queryParameters ? : any,
            $domain ? : string
        }): Promise < Array < VariantAnnotation >
        > {
            const domain = parameters.$domain ? parameters.$domain : this.domain;
            const errorHandlers = this.errorHandlers;
            const request = this.request;
            let path = '/hgvs';
            let body: any;
            let queryParameters: any = {};
            let headers: any = {};
            let form: any = {};
            return new Promise(function(resolve, reject) {
                headers['Accept'] = 'application/json';
                headers['Content-Type'] = 'application/json';

                if (parameters['variants'] !== undefined) {
                    queryParameters['variants'] = parameters['variants'];
                }

                if (parameters['variants'] === undefined) {
                    reject(new Error('Missing required  parameter: variants'));
                    return;
                }

                if (parameters['isoformOverrideSource'] !== undefined) {
                    queryParameters['isoformOverrideSource'] = parameters['isoformOverrideSource'];
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

            }).then(function(response: request.Response) {
                return response.body;
            });
        };

    getVariantAnnotationURL(parameters: {
        'variants': string,
        'isoformOverrideSource' ? : string,
        'fields' ? : Array < string > ,
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/hgvs/{variants}';

        path = path.replace('{variants}', parameters['variants'] + '');
        if (parameters['isoformOverrideSource'] !== undefined) {
            queryParameters['isoformOverrideSource'] = parameters['isoformOverrideSource'];
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
     * Retrieves VEP annotation for the provided list of variants
     * @method
     * @name GenomeNexusAPI#getVariantAnnotation
     * @param {string} variants - Comma separated list of variants. For example X:g.66937331T>A,17:g.41242962->GA
     * @param {string} isoformOverrideSource - Isoform override source. For example uniprot
     * @param {array} fields - Comma separated list of fields to include (case-sensitive!). For example: hotspots,mutation_assessor
     */
    getVariantAnnotation(parameters: {
            'variants': string,
            'isoformOverrideSource' ? : string,
            'fields' ? : Array < string > ,
            $queryParameters ? : any,
            $domain ? : string
        }): Promise < Array < VariantAnnotation >
        > {
            const domain = parameters.$domain ? parameters.$domain : this.domain;
            const errorHandlers = this.errorHandlers;
            const request = this.request;
            let path = '/hgvs/{variants}';
            let body: any;
            let queryParameters: any = {};
            let headers: any = {};
            let form: any = {};
            return new Promise(function(resolve, reject) {
                headers['Accept'] = 'application/json';
                headers['Content-Type'] = 'application/json';

                path = path.replace('{variants}', parameters['variants'] + '');

                if (parameters['variants'] === undefined) {
                    reject(new Error('Missing required  parameter: variants'));
                    return;
                }

                if (parameters['isoformOverrideSource'] !== undefined) {
                    queryParameters['isoformOverrideSource'] = parameters['isoformOverrideSource'];
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

            }).then(function(response: request.Response) {
                return response.body;
            });
        };

    postIsoformOverrideURL(parameters: {
        'source': string,
        'transcriptIds' ? : Array < string > ,
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/isoform_override';
        if (parameters['source'] !== undefined) {
            queryParameters['source'] = parameters['source'];
        }

        if (parameters['transcriptIds'] !== undefined) {
            queryParameters['transcriptIds'] = parameters['transcriptIds'];
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
     * Gets the isoform override information for the specified source and the list of transcript ids
     * @method
     * @name GenomeNexusAPI#postIsoformOverride
     * @param {string} source - Override source. For example uniprot
     * @param {array} transcriptIds - Comma separated list of transcript ids. For example ENST00000361125,ENST00000443649. If no transcript id provided, all available isoform overrides returned.
     */
    postIsoformOverride(parameters: {
            'source': string,
            'transcriptIds' ? : Array < string > ,
            $queryParameters ? : any,
            $domain ? : string
        }): Promise < Array < IsoformOverride >
        > {
            const domain = parameters.$domain ? parameters.$domain : this.domain;
            const errorHandlers = this.errorHandlers;
            const request = this.request;
            let path = '/isoform_override';
            let body: any;
            let queryParameters: any = {};
            let headers: any = {};
            let form: any = {};
            return new Promise(function(resolve, reject) {
                headers['Accept'] = 'application/json';
                headers['Content-Type'] = 'application/json';

                if (parameters['source'] !== undefined) {
                    queryParameters['source'] = parameters['source'];
                }

                if (parameters['source'] === undefined) {
                    reject(new Error('Missing required  parameter: source'));
                    return;
                }

                if (parameters['transcriptIds'] !== undefined) {
                    queryParameters['transcriptIds'] = parameters['transcriptIds'];
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

    getIsoformOverrideSourcesURL(parameters: {
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/isoform_override/sources';

        if (parameters.$queryParameters) {
            Object.keys(parameters.$queryParameters).forEach(function(parameterName) {
                var parameter = parameters.$queryParameters[parameterName];
                queryParameters[parameterName] = parameter;
            });
        }
        let keys = Object.keys(queryParameters);
        return this.domain + path + (keys.length > 0 ? '?' + (keys.map(key => key + '=' + encodeURIComponent(queryParameters[key])).join('&')) : '');
    };

    /**
     * Gets a list of available isoform override data sources
     * @method
     * @name GenomeNexusAPI#getIsoformOverrideSources
     */
    getIsoformOverrideSources(parameters: {
            $queryParameters ? : any,
                $domain ? : string
        }): Promise < Array < IsoformOverride >
        > {
            const domain = parameters.$domain ? parameters.$domain : this.domain;
            const errorHandlers = this.errorHandlers;
            const request = this.request;
            let path = '/isoform_override/sources';
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

    postIsoformOverrideSourcesURL(parameters: {
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/isoform_override/sources';

        if (parameters.$queryParameters) {
            Object.keys(parameters.$queryParameters).forEach(function(parameterName) {
                var parameter = parameters.$queryParameters[parameterName];
                queryParameters[parameterName] = parameter;
            });
        }
        let keys = Object.keys(queryParameters);
        return this.domain + path + (keys.length > 0 ? '?' + (keys.map(key => key + '=' + encodeURIComponent(queryParameters[key])).join('&')) : '');
    };

    /**
     * Gets a list of available isoform override data sources
     * @method
     * @name GenomeNexusAPI#postIsoformOverrideSources
     */
    postIsoformOverrideSources(parameters: {
            $queryParameters ? : any,
                $domain ? : string
        }): Promise < Array < string >
        > {
            const domain = parameters.$domain ? parameters.$domain : this.domain;
            const errorHandlers = this.errorHandlers;
            const request = this.request;
            let path = '/isoform_override/sources';
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

                request('POST', domain + path, body, headers, queryParameters, form, reject, resolve, errorHandlers);

            }).then(function(response: request.Response) {
                return response.body;
            });
        };

    getAllIsoformOverridesURL(parameters: {
        'source': string,
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/isoform_override/{source}';

        path = path.replace('{source}', parameters['source'] + '');

        if (parameters.$queryParameters) {
            Object.keys(parameters.$queryParameters).forEach(function(parameterName) {
                var parameter = parameters.$queryParameters[parameterName];
                queryParameters[parameterName] = parameter;
            });
        }
        let keys = Object.keys(queryParameters);
        return this.domain + path + (keys.length > 0 ? '?' + (keys.map(key => key + '=' + encodeURIComponent(queryParameters[key])).join('&')) : '');
    };

    /**
     * Gets the isoform override information for the specified source
     * @method
     * @name GenomeNexusAPI#getAllIsoformOverrides
     * @param {string} source - Override source. For example uniprot
     */
    getAllIsoformOverrides(parameters: {
            'source': string,
            $queryParameters ? : any,
            $domain ? : string
        }): Promise < Array < IsoformOverride >
        > {
            const domain = parameters.$domain ? parameters.$domain : this.domain;
            const errorHandlers = this.errorHandlers;
            const request = this.request;
            let path = '/isoform_override/{source}';
            let body: any;
            let queryParameters: any = {};
            let headers: any = {};
            let form: any = {};
            return new Promise(function(resolve, reject) {
                headers['Accept'] = 'application/json';
                headers['Content-Type'] = 'application/json';

                path = path.replace('{source}', parameters['source'] + '');

                if (parameters['source'] === undefined) {
                    reject(new Error('Missing required  parameter: source'));
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

    getIsoformOverrideURL(parameters: {
        'source': string,
        'transcriptIds': string,
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/isoform_override/{source}/{transcriptIds}';

        path = path.replace('{source}', parameters['source'] + '');

        path = path.replace('{transcriptIds}', parameters['transcriptIds'] + '');

        if (parameters.$queryParameters) {
            Object.keys(parameters.$queryParameters).forEach(function(parameterName) {
                var parameter = parameters.$queryParameters[parameterName];
                queryParameters[parameterName] = parameter;
            });
        }
        let keys = Object.keys(queryParameters);
        return this.domain + path + (keys.length > 0 ? '?' + (keys.map(key => key + '=' + encodeURIComponent(queryParameters[key])).join('&')) : '');
    };

    /**
     * Gets the isoform override information for the specified source and the list of transcript ids
     * @method
     * @name GenomeNexusAPI#getIsoformOverride
     * @param {string} source - Override source. For example uniprot.
     * @param {string} transcriptIds - Comma separated list of transcript ids. For example ENST00000361125,ENST00000443649.
     */
    getIsoformOverride(parameters: {
            'source': string,
            'transcriptIds': string,
            $queryParameters ? : any,
            $domain ? : string
        }): Promise < Array < IsoformOverride >
        > {
            const domain = parameters.$domain ? parameters.$domain : this.domain;
            const errorHandlers = this.errorHandlers;
            const request = this.request;
            let path = '/isoform_override/{source}/{transcriptIds}';
            let body: any;
            let queryParameters: any = {};
            let headers: any = {};
            let form: any = {};
            return new Promise(function(resolve, reject) {
                headers['Accept'] = 'application/json';
                headers['Content-Type'] = 'application/json';

                path = path.replace('{source}', parameters['source'] + '');

                if (parameters['source'] === undefined) {
                    reject(new Error('Missing required  parameter: source'));
                    return;
                }

                path = path.replace('{transcriptIds}', parameters['transcriptIds'] + '');

                if (parameters['transcriptIds'] === undefined) {
                    reject(new Error('Missing required  parameter: transcriptIds'));
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

    postMutationAssessorAnnotationURL(parameters: {
        'variants': Array < string > ,
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/mutation_assessor';

        if (parameters.$queryParameters) {
            Object.keys(parameters.$queryParameters).forEach(function(parameterName) {
                var parameter = parameters.$queryParameters[parameterName];
                queryParameters[parameterName] = parameter;
            });
        }
        let keys = Object.keys(queryParameters);
        return this.domain + path + (keys.length > 0 ? '?' + (keys.map(key => key + '=' + encodeURIComponent(queryParameters[key])).join('&')) : '');
    };

    /**
     * Retrieves mutation assessor information for the provided list of variants
     * @method
     * @name GenomeNexusAPI#postMutationAssessorAnnotation
     * @param {} variants - List of variants. For example ["7:g.140453136A>T","12:g.25398285C>A"]
     */
    postMutationAssessorAnnotation(parameters: {
            'variants': Array < string > ,
            $queryParameters ? : any,
            $domain ? : string
        }): Promise < Array < MutationAssessor >
        > {
            const domain = parameters.$domain ? parameters.$domain : this.domain;
            const errorHandlers = this.errorHandlers;
            const request = this.request;
            let path = '/mutation_assessor';
            let body: any;
            let queryParameters: any = {};
            let headers: any = {};
            let form: any = {};
            return new Promise(function(resolve, reject) {
                headers['Accept'] = 'application/json';
                headers['Content-Type'] = 'application/json';

                if (parameters['variants'] !== undefined) {
                    body = parameters['variants'];
                }

                if (parameters['variants'] === undefined) {
                    reject(new Error('Missing required  parameter: variants'));
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

    getMutationAssessorAnnotationURL(parameters: {
        'variants': string,
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/mutation_assessor/{variants}';

        path = path.replace('{variants}', parameters['variants'] + '');

        if (parameters.$queryParameters) {
            Object.keys(parameters.$queryParameters).forEach(function(parameterName) {
                var parameter = parameters.$queryParameters[parameterName];
                queryParameters[parameterName] = parameter;
            });
        }
        let keys = Object.keys(queryParameters);
        return this.domain + path + (keys.length > 0 ? '?' + (keys.map(key => key + '=' + encodeURIComponent(queryParameters[key])).join('&')) : '');
    };

    /**
     * Retrieves mutation assessor information for the provided list of variants
     * @method
     * @name GenomeNexusAPI#getMutationAssessorAnnotation
     * @param {string} variants - Comma separated list of variants. For example 7:g.140453136A>T,12:g.25398285C>A
     */
    getMutationAssessorAnnotation(parameters: {
            'variants': string,
            $queryParameters ? : any,
            $domain ? : string
        }): Promise < Array < MutationAssessor >
        > {
            const domain = parameters.$domain ? parameters.$domain : this.domain;
            const errorHandlers = this.errorHandlers;
            const request = this.request;
            let path = '/mutation_assessor/{variants}';
            let body: any;
            let queryParameters: any = {};
            let headers: any = {};
            let form: any = {};
            return new Promise(function(resolve, reject) {
                headers['Accept'] = 'application/json';
                headers['Content-Type'] = 'application/json';

                path = path.replace('{variants}', parameters['variants'] + '');

                if (parameters['variants'] === undefined) {
                    reject(new Error('Missing required  parameter: variants'));
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

    fetchAllPfamDomainsGETURL(parameters: {
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/pfam/domain';

        if (parameters.$queryParameters) {
            Object.keys(parameters.$queryParameters).forEach(function(parameterName) {
                var parameter = parameters.$queryParameters[parameterName];
                queryParameters[parameterName] = parameter;
            });
        }
        let keys = Object.keys(queryParameters);
        return this.domain + path + (keys.length > 0 ? '?' + (keys.map(key => key + '=' + encodeURIComponent(queryParameters[key])).join('&')) : '');
    };

    /**
     * Retrieves all PFAM domains
     * @method
     * @name GenomeNexusAPI#fetchAllPfamDomainsGET
     */
    fetchAllPfamDomainsGET(parameters: {
            $queryParameters ? : any,
                $domain ? : string
        }): Promise < Array < PfamDomain >
        > {
            const domain = parameters.$domain ? parameters.$domain : this.domain;
            const errorHandlers = this.errorHandlers;
            const request = this.request;
            let path = '/pfam/domain';
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

    fetchPfamDomainsByGeneIdsPOSTURL(parameters: {
        'geneIds': Array < string > ,
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/pfam/domain/gene';

        if (parameters.$queryParameters) {
            Object.keys(parameters.$queryParameters).forEach(function(parameterName) {
                var parameter = parameters.$queryParameters[parameterName];
                queryParameters[parameterName] = parameter;
            });
        }
        let keys = Object.keys(queryParameters);
        return this.domain + path + (keys.length > 0 ? '?' + (keys.map(key => key + '=' + encodeURIComponent(queryParameters[key])).join('&')) : '');
    };

    /**
     * Retrieves PFAM domains by Ensembl gene IDs
     * @method
     * @name GenomeNexusAPI#fetchPfamDomainsByGeneIdsPOST
     * @param {} geneIds - List of Ensembl gene IDs. For example ["ENSG00000136999","ENSG00000272398","ENSG00000198695"]
     */
    fetchPfamDomainsByGeneIdsPOST(parameters: {
            'geneIds': Array < string > ,
            $queryParameters ? : any,
            $domain ? : string
        }): Promise < Array < PfamDomain >
        > {
            const domain = parameters.$domain ? parameters.$domain : this.domain;
            const errorHandlers = this.errorHandlers;
            const request = this.request;
            let path = '/pfam/domain/gene';
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

    fetchPfamDomainsByGeneIdGETURL(parameters: {
        'geneId': string,
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/pfam/domain/gene/{geneId}';

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
     * Retrieves PFAM domains by an Ensembl gene ID
     * @method
     * @name GenomeNexusAPI#fetchPfamDomainsByGeneIdGET
     * @param {string} geneId - An Ensembl gene ID. For example ENSG00000136999
     */
    fetchPfamDomainsByGeneIdGET(parameters: {
            'geneId': string,
            $queryParameters ? : any,
            $domain ? : string
        }): Promise < Array < PfamDomain >
        > {
            const domain = parameters.$domain ? parameters.$domain : this.domain;
            const errorHandlers = this.errorHandlers;
            const request = this.request;
            let path = '/pfam/domain/gene/{geneId}';
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

    fetchPfamDomainsByPfamIdsPOSTURL(parameters: {
        'pfamDomainIds': Array < string > ,
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/pfam/domain/pfam';

        if (parameters.$queryParameters) {
            Object.keys(parameters.$queryParameters).forEach(function(parameterName) {
                var parameter = parameters.$queryParameters[parameterName];
                queryParameters[parameterName] = parameter;
            });
        }
        let keys = Object.keys(queryParameters);
        return this.domain + path + (keys.length > 0 ? '?' + (keys.map(key => key + '=' + encodeURIComponent(queryParameters[key])).join('&')) : '');
    };

    /**
     * Retrieves PFAM domains by PFAM domain IDs
     * @method
     * @name GenomeNexusAPI#fetchPfamDomainsByPfamIdsPOST
     * @param {} pfamDomainIds - List of PFAM domain IDs. For example ["PF02827","PF00093","PF15276"]
     */
    fetchPfamDomainsByPfamIdsPOST(parameters: {
            'pfamDomainIds': Array < string > ,
            $queryParameters ? : any,
            $domain ? : string
        }): Promise < Array < PfamDomain >
        > {
            const domain = parameters.$domain ? parameters.$domain : this.domain;
            const errorHandlers = this.errorHandlers;
            const request = this.request;
            let path = '/pfam/domain/pfam';
            let body: any;
            let queryParameters: any = {};
            let headers: any = {};
            let form: any = {};
            return new Promise(function(resolve, reject) {
                headers['Accept'] = 'application/json';
                headers['Content-Type'] = 'application/json';

                if (parameters['pfamDomainIds'] !== undefined) {
                    body = parameters['pfamDomainIds'];
                }

                if (parameters['pfamDomainIds'] === undefined) {
                    reject(new Error('Missing required  parameter: pfamDomainIds'));
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

    fetchPfamDomainsByPfamIdGETURL(parameters: {
        'pfamDomainId': string,
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/pfam/domain/pfam/{pfamDomainId}';

        path = path.replace('{pfamDomainId}', parameters['pfamDomainId'] + '');

        if (parameters.$queryParameters) {
            Object.keys(parameters.$queryParameters).forEach(function(parameterName) {
                var parameter = parameters.$queryParameters[parameterName];
                queryParameters[parameterName] = parameter;
            });
        }
        let keys = Object.keys(queryParameters);
        return this.domain + path + (keys.length > 0 ? '?' + (keys.map(key => key + '=' + encodeURIComponent(queryParameters[key])).join('&')) : '');
    };

    /**
     * Retrieves PFAM domains by a PFAM domain ID
     * @method
     * @name GenomeNexusAPI#fetchPfamDomainsByPfamIdGET
     * @param {string} pfamDomainId - A PFAM domain ID. For example PF02827
     */
    fetchPfamDomainsByPfamIdGET(parameters: {
            'pfamDomainId': string,
            $queryParameters ? : any,
            $domain ? : string
        }): Promise < Array < PfamDomain >
        > {
            const domain = parameters.$domain ? parameters.$domain : this.domain;
            const errorHandlers = this.errorHandlers;
            const request = this.request;
            let path = '/pfam/domain/pfam/{pfamDomainId}';
            let body: any;
            let queryParameters: any = {};
            let headers: any = {};
            let form: any = {};
            return new Promise(function(resolve, reject) {
                headers['Accept'] = 'application/json';
                headers['Content-Type'] = 'application/json';

                path = path.replace('{pfamDomainId}', parameters['pfamDomainId'] + '');

                if (parameters['pfamDomainId'] === undefined) {
                    reject(new Error('Missing required  parameter: pfamDomainId'));
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

    fetchPfamDomainsByProteinIdsPOSTURL(parameters: {
        'proteinIds': Array < string > ,
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/pfam/domain/protein';

        if (parameters.$queryParameters) {
            Object.keys(parameters.$queryParameters).forEach(function(parameterName) {
                var parameter = parameters.$queryParameters[parameterName];
                queryParameters[parameterName] = parameter;
            });
        }
        let keys = Object.keys(queryParameters);
        return this.domain + path + (keys.length > 0 ? '?' + (keys.map(key => key + '=' + encodeURIComponent(queryParameters[key])).join('&')) : '');
    };

    /**
     * Retrieves PFAM domains by Ensembl protein IDs
     * @method
     * @name GenomeNexusAPI#fetchPfamDomainsByProteinIdsPOST
     * @param {} proteinIds - List of Ensembl protein IDs. For example ["ENSP00000439985","ENSP00000478460","ENSP00000346196"]
     */
    fetchPfamDomainsByProteinIdsPOST(parameters: {
            'proteinIds': Array < string > ,
            $queryParameters ? : any,
            $domain ? : string
        }): Promise < Array < PfamDomain >
        > {
            const domain = parameters.$domain ? parameters.$domain : this.domain;
            const errorHandlers = this.errorHandlers;
            const request = this.request;
            let path = '/pfam/domain/protein';
            let body: any;
            let queryParameters: any = {};
            let headers: any = {};
            let form: any = {};
            return new Promise(function(resolve, reject) {
                headers['Accept'] = 'application/json';
                headers['Content-Type'] = 'application/json';

                if (parameters['proteinIds'] !== undefined) {
                    body = parameters['proteinIds'];
                }

                if (parameters['proteinIds'] === undefined) {
                    reject(new Error('Missing required  parameter: proteinIds'));
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

    fetchPfamDomainsByProteinIdGETURL(parameters: {
        'proteinId': string,
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/pfam/domain/protein/{proteinId}';

        path = path.replace('{proteinId}', parameters['proteinId'] + '');

        if (parameters.$queryParameters) {
            Object.keys(parameters.$queryParameters).forEach(function(parameterName) {
                var parameter = parameters.$queryParameters[parameterName];
                queryParameters[parameterName] = parameter;
            });
        }
        let keys = Object.keys(queryParameters);
        return this.domain + path + (keys.length > 0 ? '?' + (keys.map(key => key + '=' + encodeURIComponent(queryParameters[key])).join('&')) : '');
    };

    /**
     * Retrieves PFAM domains by an Ensembl protein ID
     * @method
     * @name GenomeNexusAPI#fetchPfamDomainsByProteinIdGET
     * @param {string} proteinId - An Ensembl protein ID. For example ENSP00000439985
     */
    fetchPfamDomainsByProteinIdGET(parameters: {
            'proteinId': string,
            $queryParameters ? : any,
            $domain ? : string
        }): Promise < Array < PfamDomain >
        > {
            const domain = parameters.$domain ? parameters.$domain : this.domain;
            const errorHandlers = this.errorHandlers;
            const request = this.request;
            let path = '/pfam/domain/protein/{proteinId}';
            let body: any;
            let queryParameters: any = {};
            let headers: any = {};
            let form: any = {};
            return new Promise(function(resolve, reject) {
                headers['Accept'] = 'application/json';
                headers['Content-Type'] = 'application/json';

                path = path.replace('{proteinId}', parameters['proteinId'] + '');

                if (parameters['proteinId'] === undefined) {
                    reject(new Error('Missing required  parameter: proteinId'));
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

    fetchPfamDomainsByTranscriptIdsPOSTURL(parameters: {
        'transcriptIds': Array < string > ,
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/pfam/domain/transcript';

        if (parameters.$queryParameters) {
            Object.keys(parameters.$queryParameters).forEach(function(parameterName) {
                var parameter = parameters.$queryParameters[parameterName];
                queryParameters[parameterName] = parameter;
            });
        }
        let keys = Object.keys(queryParameters);
        return this.domain + path + (keys.length > 0 ? '?' + (keys.map(key => key + '=' + encodeURIComponent(queryParameters[key])).join('&')) : '');
    };

    /**
     * Retrieves PFAM domains by Ensembl transcript IDs
     * @method
     * @name GenomeNexusAPI#fetchPfamDomainsByTranscriptIdsPOST
     * @param {} transcriptIds - List of Ensembl transcript IDs. For example ["ENST00000361390","ENST00000361453","ENST00000361624"]
     */
    fetchPfamDomainsByTranscriptIdsPOST(parameters: {
            'transcriptIds': Array < string > ,
            $queryParameters ? : any,
            $domain ? : string
        }): Promise < Array < PfamDomain >
        > {
            const domain = parameters.$domain ? parameters.$domain : this.domain;
            const errorHandlers = this.errorHandlers;
            const request = this.request;
            let path = '/pfam/domain/transcript';
            let body: any;
            let queryParameters: any = {};
            let headers: any = {};
            let form: any = {};
            return new Promise(function(resolve, reject) {
                headers['Accept'] = 'application/json';
                headers['Content-Type'] = 'application/json';

                if (parameters['transcriptIds'] !== undefined) {
                    body = parameters['transcriptIds'];
                }

                if (parameters['transcriptIds'] === undefined) {
                    reject(new Error('Missing required  parameter: transcriptIds'));
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

    fetchPfamDomainsByTranscriptIdGETURL(parameters: {
        'transcriptId': string,
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/pfam/domain/transcript/{transcriptId}';

        path = path.replace('{transcriptId}', parameters['transcriptId'] + '');

        if (parameters.$queryParameters) {
            Object.keys(parameters.$queryParameters).forEach(function(parameterName) {
                var parameter = parameters.$queryParameters[parameterName];
                queryParameters[parameterName] = parameter;
            });
        }
        let keys = Object.keys(queryParameters);
        return this.domain + path + (keys.length > 0 ? '?' + (keys.map(key => key + '=' + encodeURIComponent(queryParameters[key])).join('&')) : '');
    };

    /**
     * Retrieves PFAM domains by an Ensembl transcript ID
     * @method
     * @name GenomeNexusAPI#fetchPfamDomainsByTranscriptIdGET
     * @param {string} transcriptId - An Ensembl transcript ID. For example ENST00000361390
     */
    fetchPfamDomainsByTranscriptIdGET(parameters: {
            'transcriptId': string,
            $queryParameters ? : any,
            $domain ? : string
        }): Promise < Array < PfamDomain >
        > {
            const domain = parameters.$domain ? parameters.$domain : this.domain;
            const errorHandlers = this.errorHandlers;
            const request = this.request;
            let path = '/pfam/domain/transcript/{transcriptId}';
            let body: any;
            let queryParameters: any = {};
            let headers: any = {};
            let form: any = {};
            return new Promise(function(resolve, reject) {
                headers['Accept'] = 'application/json';
                headers['Content-Type'] = 'application/json';

                path = path.replace('{transcriptId}', parameters['transcriptId'] + '');

                if (parameters['transcriptId'] === undefined) {
                    reject(new Error('Missing required  parameter: transcriptId'));
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

    getGeneXrefsURL(parameters: {
        'accession': string,
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/xrefs/{accession}';

        path = path.replace('{accession}', parameters['accession'] + '');

        if (parameters.$queryParameters) {
            Object.keys(parameters.$queryParameters).forEach(function(parameterName) {
                var parameter = parameters.$queryParameters[parameterName];
                queryParameters[parameterName] = parameter;
            });
        }
        let keys = Object.keys(queryParameters);
        return this.domain + path + (keys.length > 0 ? '?' + (keys.map(key => key + '=' + encodeURIComponent(queryParameters[key])).join('&')) : '');
    };

    /**
     * Perform lookups of Ensembl identifiers and retrieve their external referenes in other databases
     * @method
     * @name GenomeNexusAPI#getGeneXrefs
     * @param {string} accession - Ensembl gene accession. For example ENSG00000169083
     */
    getGeneXrefs(parameters: {
            'accession': string,
            $queryParameters ? : any,
            $domain ? : string
        }): Promise < Array < GeneXref >
        > {
            const domain = parameters.$domain ? parameters.$domain : this.domain;
            const errorHandlers = this.errorHandlers;
            const request = this.request;
            let path = '/xrefs/{accession}';
            let body: any;
            let queryParameters: any = {};
            let headers: any = {};
            let form: any = {};
            return new Promise(function(resolve, reject) {
                headers['Accept'] = 'application/json';
                headers['Content-Type'] = 'application/json';

                path = path.replace('{accession}', parameters['accession'] + '');

                if (parameters['accession'] === undefined) {
                    reject(new Error('Missing required  parameter: accession'));
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

}