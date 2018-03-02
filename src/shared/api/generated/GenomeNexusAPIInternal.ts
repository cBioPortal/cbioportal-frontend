import * as request from "superagent";

type CallbackHandler = (err: any, res ? : request.Response) => void;
export type AggregatedHotspots = {
    'genomicLocation': GenomicLocation

        'hotspots': Array < Hotspot >

        'variant': string

};
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
export type GenomicLocation = {
    'chromosome': string

        'start': number

        'end': number

        'referenceAllele': string

        'variantAllele': string

};
export type Hotspot = {
    'aminoAcidPosition': IntegerRange

        'hugoSymbol': string

        'residue': string

        'transcriptId': string

        'tumorCount': number

        'tumorTypeCount': number

        'type': string

};
export type IntegerRange = {
    'end': number

        'start': number

};
export type IsoformOverride = {
    'ccdsId': string

        'geneSymbol': string

        'refseqId': string

        'transcriptId': string

};
export type MutationAssessor = {
    'codonStartPosition': string

        'cosmicCount': number

        'functionalImpact': string

        'functionalImpactScore': number

        'hgvs': string

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

/**
 * Genome Nexus Variant Annotation API
 * @class GenomeNexusAPIInternal
 * @param {(string)} [domainOrOptions] - The project domain.
 */
export default class GenomeNexusAPIInternal {

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

    fetchHotspotAnnotationByGenomicLocationPOSTURL(parameters: {
        'genomicLocations': Array < GenomicLocation > ,
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/cancer_hotspots/genomic';

        if (parameters.$queryParameters) {
            Object.keys(parameters.$queryParameters).forEach(function(parameterName) {
                var parameter = parameters.$queryParameters[parameterName];
                queryParameters[parameterName] = parameter;
            });
        }
        let keys = Object.keys(queryParameters);
        return this.domain + path + (keys.length > 0 ? '?' + (keys.map(key => key + '=' + encodeURIComponent(queryParameters[key])).join('&')) : '');
    };

    /**
     * Retrieves hotspot annotations for the provided list of genomic locations
     * @method
     * @name GenomeNexusAPIInternal#fetchHotspotAnnotationByGenomicLocationPOST
     * @param {} genomicLocations - List of genomic locations.
     */
    fetchHotspotAnnotationByGenomicLocationPOST(parameters: {
            'genomicLocations': Array < GenomicLocation > ,
            $queryParameters ? : any,
            $domain ? : string
        }): Promise < Array < AggregatedHotspots >
        > {
            const domain = parameters.$domain ? parameters.$domain : this.domain;
            const errorHandlers = this.errorHandlers;
            const request = this.request;
            let path = '/cancer_hotspots/genomic';
            let body: any;
            let queryParameters: any = {};
            let headers: any = {};
            let form: any = {};
            return new Promise(function(resolve, reject) {
                headers['Accept'] = 'application/json';
                headers['Content-Type'] = 'application/json';

                if (parameters['genomicLocations'] !== undefined) {
                    body = parameters['genomicLocations'];
                }

                if (parameters['genomicLocations'] === undefined) {
                    reject(new Error('Missing required  parameter: genomicLocations'));
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

    fetchHotspotAnnotationByGenomicLocationGETURL(parameters: {
        'genomicLocation': string,
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/cancer_hotspots/genomic/{genomicLocation}';

        path = path.replace('{genomicLocation}', parameters['genomicLocation'] + '');

        if (parameters.$queryParameters) {
            Object.keys(parameters.$queryParameters).forEach(function(parameterName) {
                var parameter = parameters.$queryParameters[parameterName];
                queryParameters[parameterName] = parameter;
            });
        }
        let keys = Object.keys(queryParameters);
        return this.domain + path + (keys.length > 0 ? '?' + (keys.map(key => key + '=' + encodeURIComponent(queryParameters[key])).join('&')) : '');
    };

    /**
     * Retrieves hotspot annotations for a specific genomic location
     * @method
     * @name GenomeNexusAPIInternal#fetchHotspotAnnotationByGenomicLocationGET
     * @param {string} genomicLocation - A genomic location. For example 7,140453136,140453136,A,T
     */
    fetchHotspotAnnotationByGenomicLocationGET(parameters: {
            'genomicLocation': string,
            $queryParameters ? : any,
            $domain ? : string
        }): Promise < Array < Hotspot >
        > {
            const domain = parameters.$domain ? parameters.$domain : this.domain;
            const errorHandlers = this.errorHandlers;
            const request = this.request;
            let path = '/cancer_hotspots/genomic/{genomicLocation}';
            let body: any;
            let queryParameters: any = {};
            let headers: any = {};
            let form: any = {};
            return new Promise(function(resolve, reject) {
                headers['Accept'] = 'application/json';
                headers['Content-Type'] = 'application/json';

                path = path.replace('{genomicLocation}', parameters['genomicLocation'] + '');

                if (parameters['genomicLocation'] === undefined) {
                    reject(new Error('Missing required  parameter: genomicLocation'));
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

    fetchHotspotAnnotationByHgvsPOSTURL(parameters: {
        'variants': Array < string > ,
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/cancer_hotspots/hgvs';

        if (parameters.$queryParameters) {
            Object.keys(parameters.$queryParameters).forEach(function(parameterName) {
                var parameter = parameters.$queryParameters[parameterName];
                queryParameters[parameterName] = parameter;
            });
        }
        let keys = Object.keys(queryParameters);
        return this.domain + path + (keys.length > 0 ? '?' + (keys.map(key => key + '=' + encodeURIComponent(queryParameters[key])).join('&')) : '');
    };

    /**
     * Retrieves hotspot annotations for the provided list of variants
     * @method
     * @name GenomeNexusAPIInternal#fetchHotspotAnnotationByHgvsPOST
     * @param {} variants - List of variants. For example ["7:g.140453136A>T","12:g.25398285C>A"]
     */
    fetchHotspotAnnotationByHgvsPOST(parameters: {
            'variants': Array < string > ,
            $queryParameters ? : any,
            $domain ? : string
        }): Promise < Array < AggregatedHotspots >
        > {
            const domain = parameters.$domain ? parameters.$domain : this.domain;
            const errorHandlers = this.errorHandlers;
            const request = this.request;
            let path = '/cancer_hotspots/hgvs';
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

    fetchHotspotAnnotationByHgvsGETURL(parameters: {
        'variant': string,
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/cancer_hotspots/hgvs/{variant}';

        path = path.replace('{variant}', parameters['variant'] + '');

        if (parameters.$queryParameters) {
            Object.keys(parameters.$queryParameters).forEach(function(parameterName) {
                var parameter = parameters.$queryParameters[parameterName];
                queryParameters[parameterName] = parameter;
            });
        }
        let keys = Object.keys(queryParameters);
        return this.domain + path + (keys.length > 0 ? '?' + (keys.map(key => key + '=' + encodeURIComponent(queryParameters[key])).join('&')) : '');
    };

    /**
     * Retrieves hotspot annotations for a specific variant
     * @method
     * @name GenomeNexusAPIInternal#fetchHotspotAnnotationByHgvsGET
     * @param {string} variant - A variant. For example 7:g.140453136A>T
     */
    fetchHotspotAnnotationByHgvsGET(parameters: {
            'variant': string,
            $queryParameters ? : any,
            $domain ? : string
        }): Promise < Array < Hotspot >
        > {
            const domain = parameters.$domain ? parameters.$domain : this.domain;
            const errorHandlers = this.errorHandlers;
            const request = this.request;
            let path = '/cancer_hotspots/hgvs/{variant}';
            let body: any;
            let queryParameters: any = {};
            let headers: any = {};
            let form: any = {};
            return new Promise(function(resolve, reject) {
                headers['Accept'] = 'application/json';
                headers['Content-Type'] = 'application/json';

                path = path.replace('{variant}', parameters['variant'] + '');

                if (parameters['variant'] === undefined) {
                    reject(new Error('Missing required  parameter: variant'));
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

    fetchIsoformOverridePOSTURL(parameters: {
        'source': string,
        'transcriptIds': Array < string > ,
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/isoform_override';
        if (parameters['source'] !== undefined) {
            queryParameters['source'] = parameters['source'];
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
     * @name GenomeNexusAPIInternal#fetchIsoformOverridePOST
     * @param {string} source - Override source. For example uniprot
     * @param {} transcriptIds - List of transcript ids. For example ["ENST00000361125","ENST00000443649"]. 
     */
    fetchIsoformOverridePOST(parameters: {
            'source': string,
            'transcriptIds': Array < string > ,
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

    fetchIsoformOverrideSourcesGETURL(parameters: {
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
     * @name GenomeNexusAPIInternal#fetchIsoformOverrideSourcesGET
     */
    fetchIsoformOverrideSourcesGET(parameters: {
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

                request('GET', domain + path, body, headers, queryParameters, form, reject, resolve, errorHandlers);

            }).then(function(response: request.Response) {
                return response.body;
            });
        };

    fetchAllIsoformOverridesGETURL(parameters: {
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
     * @name GenomeNexusAPIInternal#fetchAllIsoformOverridesGET
     * @param {string} source - Override source. For example uniprot
     */
    fetchAllIsoformOverridesGET(parameters: {
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

    fetchIsoformOverrideGETURL(parameters: {
        'source': string,
        'transcriptId': string,
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/isoform_override/{source}/{transcriptId}';

        path = path.replace('{source}', parameters['source'] + '');

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
     * Gets the isoform override information for the specified source and transcript id
     * @method
     * @name GenomeNexusAPIInternal#fetchIsoformOverrideGET
     * @param {string} source - Override source. For example uniprot.
     * @param {string} transcriptId - Transcript id. For example ENST00000361125.
     */
    fetchIsoformOverrideGET(parameters: {
        'source': string,
        'transcriptId': string,
        $queryParameters ? : any,
        $domain ? : string
    }): Promise < IsoformOverride > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        const errorHandlers = this.errorHandlers;
        const request = this.request;
        let path = '/isoform_override/{source}/{transcriptId}';
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
     * @name GenomeNexusAPIInternal#postMutationAssessorAnnotation
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

    fetchMutationAssessorAnnotationGETURL(parameters: {
        'variant': string,
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/mutation_assessor/{variant}';

        path = path.replace('{variant}', parameters['variant'] + '');

        if (parameters.$queryParameters) {
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
     * @name GenomeNexusAPIInternal#fetchMutationAssessorAnnotationGET
     * @param {string} variant - A variants. For example 7:g.140453136A>T
     */
    fetchMutationAssessorAnnotationGET(parameters: {
        'variant': string,
        $queryParameters ? : any,
        $domain ? : string
    }): Promise < MutationAssessor > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        const errorHandlers = this.errorHandlers;
        const request = this.request;
        let path = '/mutation_assessor/{variant}';
        let body: any;
        let queryParameters: any = {};
        let headers: any = {};
        let form: any = {};
        return new Promise(function(resolve, reject) {
            headers['Accept'] = 'application/json';
            headers['Content-Type'] = 'application/json';

            path = path.replace('{variant}', parameters['variant'] + '');

            if (parameters['variant'] === undefined) {
                reject(new Error('Missing required  parameter: variant'));
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

    fetchGeneXrefsGET_1URL(parameters: {
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
     * Perform lookups of Ensembl identifiers and retrieve their external references in other databases
     * @method
     * @name GenomeNexusAPIInternal#fetchGeneXrefsGET_1
     * @param {string} accession - Ensembl gene accession. For example ENSG00000169083
     */
    fetchGeneXrefsGET_1(parameters: {
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