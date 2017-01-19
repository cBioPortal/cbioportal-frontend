import * as request from "superagent";

type CallbackHandler = (err: any, res ? : request.Response) => void;
export type HotspotMutation = any;
export type SingleResidueHotspotMutation = any;
export type IntegerRange = any;
export type TumorTypeComposition = any;
export type Cluster = any;
export type ClusteredHotspotMutation = any;

/**
 * Cancer Hotspots API
 * @class CancerHotspotsAPI
 * @param {(string)} [domainOrOptions] - The project domain.
 */
export default class CancerHotspotsAPI {

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

    postClustersURL(parameters: {
        'clusterIds' ? : Array < string > | string

        ,
        'hugoSymbol' ? : string,
        'residue' ? : string,
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/api/clusters';
        if (parameters['clusterIds'] !== undefined) {
            queryParameters['clusterIds'] = parameters['clusterIds'];
        }

        if (parameters['hugoSymbol'] !== undefined) {
            queryParameters['hugoSymbol'] = parameters['hugoSymbol'];
        }

        if (parameters['residue'] !== undefined) {
            queryParameters['residue'] = parameters['residue'];
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
     * get clusters
     * @method
     * @name CancerHotspotsAPI#postClusters
     * @param {array} clusterIds - Comma separated list of cluster ids, for example 1,2,3
     * @param {string} hugoSymbol - Hugo gene symbol, for example BRAF
     * @param {string} residue - Residue, for example F595
     */
    postClusters(parameters: {
            'clusterIds' ? : Array < string > | string

            ,
            'hugoSymbol' ? : string,
            'residue' ? : string,
            $queryParameters ? : any,
                $domain ? : string
        }): Promise < Array < Cluster >
        > {
            const domain = parameters.$domain ? parameters.$domain : this.domain;
            const errorHandlers = this.errorHandlers;
            const request = this.request;
            let path = '/api/clusters';
            let body: any;
            let queryParameters: any = {};
            let headers: any = {};
            let form: any = {};
            return new Promise(function(resolve, reject) {
                headers['Accept'] = 'application/json';
                headers['Content-Type'] = 'application/json';

                if (parameters['clusterIds'] !== undefined) {
                    queryParameters['clusterIds'] = parameters['clusterIds'];
                }

                if (parameters['hugoSymbol'] !== undefined) {
                    queryParameters['hugoSymbol'] = parameters['hugoSymbol'];
                }

                if (parameters['residue'] !== undefined) {
                    queryParameters['residue'] = parameters['residue'];
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

    getClustersByClusterIdURL(parameters: {
        'clusterIds' ? : Array < string > | string

        ,
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/api/clusters/id/{clusterIds}';

        path = path.replace('{clusterIds}', parameters['clusterIds'] + '');

        if (parameters.$queryParameters) {
            Object.keys(parameters.$queryParameters).forEach(function(parameterName) {
                var parameter = parameters.$queryParameters[parameterName];
                queryParameters[parameterName] = parameter;
            });
        }
        let keys = Object.keys(queryParameters);
        return this.domain + path + (keys.length > 0 ? '?' + (keys.map(key => key + '=' + encodeURIComponent(queryParameters[key])).join('&')) : '');
    };

    /**
     * get clusters by cluster id
     * @method
     * @name CancerHotspotsAPI#getClustersByClusterId
     * @param {array} clusterIds - Comma separated list of cluster ids, for example 1,2,3
     */
    getClustersByClusterId(parameters: {
            'clusterIds' ? : Array < string > | string

            ,
            $queryParameters ? : any,
                $domain ? : string
        }): Promise < Array < Cluster >
        > {
            const domain = parameters.$domain ? parameters.$domain : this.domain;
            const errorHandlers = this.errorHandlers;
            const request = this.request;
            let path = '/api/clusters/id/{clusterIds}';
            let body: any;
            let queryParameters: any = {};
            let headers: any = {};
            let form: any = {};
            return new Promise(function(resolve, reject) {
                headers['Accept'] = 'application/json';
                headers['Content-Type'] = 'application/json';

                path = path.replace('{clusterIds}', parameters['clusterIds'] + '');

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

    getClustersByHugoSymbolURL(parameters: {
        'hugoSymbol': string,
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/api/clusters/{hugoSymbol}';

        path = path.replace('{hugoSymbol}', parameters['hugoSymbol'] + '');

        if (parameters.$queryParameters) {
            Object.keys(parameters.$queryParameters).forEach(function(parameterName) {
                var parameter = parameters.$queryParameters[parameterName];
                queryParameters[parameterName] = parameter;
            });
        }
        let keys = Object.keys(queryParameters);
        return this.domain + path + (keys.length > 0 ? '?' + (keys.map(key => key + '=' + encodeURIComponent(queryParameters[key])).join('&')) : '');
    };

    /**
     * get clusters by hugo symbol
     * @method
     * @name CancerHotspotsAPI#getClustersByHugoSymbol
     * @param {string} hugoSymbol - Hugo gene symbol, for example BRAF
     */
    getClustersByHugoSymbol(parameters: {
            'hugoSymbol': string,
            $queryParameters ? : any,
            $domain ? : string
        }): Promise < Array < Cluster >
        > {
            const domain = parameters.$domain ? parameters.$domain : this.domain;
            const errorHandlers = this.errorHandlers;
            const request = this.request;
            let path = '/api/clusters/{hugoSymbol}';
            let body: any;
            let queryParameters: any = {};
            let headers: any = {};
            let form: any = {};
            return new Promise(function(resolve, reject) {
                headers['Accept'] = 'application/json';
                headers['Content-Type'] = 'application/json';

                path = path.replace('{hugoSymbol}', parameters['hugoSymbol'] + '');

                if (parameters['hugoSymbol'] === undefined) {
                    reject(new Error('Missing required  parameter: hugoSymbol'));
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

    getClustersByHugoSymbolAndResidueURL(parameters: {
        'hugoSymbol': string,
        'residue': string,
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/api/clusters/{hugoSymbol}/{residue}';

        path = path.replace('{hugoSymbol}', parameters['hugoSymbol'] + '');

        path = path.replace('{residue}', parameters['residue'] + '');

        if (parameters.$queryParameters) {
            Object.keys(parameters.$queryParameters).forEach(function(parameterName) {
                var parameter = parameters.$queryParameters[parameterName];
                queryParameters[parameterName] = parameter;
            });
        }
        let keys = Object.keys(queryParameters);
        return this.domain + path + (keys.length > 0 ? '?' + (keys.map(key => key + '=' + encodeURIComponent(queryParameters[key])).join('&')) : '');
    };

    /**
     * get clusters by hugo symbol and residue
     * @method
     * @name CancerHotspotsAPI#getClustersByHugoSymbolAndResidue
     * @param {string} hugoSymbol - Hugo gene symbol, for example BRAF
     * @param {string} residue - Residue, for example F595
     */
    getClustersByHugoSymbolAndResidue(parameters: {
            'hugoSymbol': string,
            'residue': string,
            $queryParameters ? : any,
            $domain ? : string
        }): Promise < Array < Cluster >
        > {
            const domain = parameters.$domain ? parameters.$domain : this.domain;
            const errorHandlers = this.errorHandlers;
            const request = this.request;
            let path = '/api/clusters/{hugoSymbol}/{residue}';
            let body: any;
            let queryParameters: any = {};
            let headers: any = {};
            let form: any = {};
            return new Promise(function(resolve, reject) {
                headers['Accept'] = 'application/json';
                headers['Content-Type'] = 'application/json';

                path = path.replace('{hugoSymbol}', parameters['hugoSymbol'] + '');

                if (parameters['hugoSymbol'] === undefined) {
                    reject(new Error('Missing required  parameter: hugoSymbol'));
                    return;
                }

                path = path.replace('{residue}', parameters['residue'] + '');

                if (parameters['residue'] === undefined) {
                    reject(new Error('Missing required  parameter: residue'));
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

    getAll3dHotspotMutationsURL(parameters: {
        'hugoSymbols' ? : Array < string > | string

        ,
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/api/hotspots/3d';
        if (parameters['hugoSymbols'] !== undefined) {
            queryParameters['hugoSymbols'] = parameters['hugoSymbols'];
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
     * get 3D hotspot mutations
     * @method
     * @name CancerHotspotsAPI#getAll3dHotspotMutations
     * @param {array} hugoSymbols - Comma separated list of hugo symbols. For example PTEN,BRAF,TP53
     */
    getAll3dHotspotMutations(parameters: {
            'hugoSymbols' ? : Array < string > | string

            ,
            $queryParameters ? : any,
                $domain ? : string
        }): Promise < Array < ClusteredHotspotMutation >
        > {
            const domain = parameters.$domain ? parameters.$domain : this.domain;
            const errorHandlers = this.errorHandlers;
            const request = this.request;
            let path = '/api/hotspots/3d';
            let body: any;
            let queryParameters: any = {};
            let headers: any = {};
            let form: any = {};
            return new Promise(function(resolve, reject) {
                headers['Accept'] = 'application/json';
                headers['Content-Type'] = 'application/json';

                if (parameters['hugoSymbols'] !== undefined) {
                    queryParameters['hugoSymbols'] = parameters['hugoSymbols'];
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

    get3dHotspotMutationsByGeneURL(parameters: {
        'hugoSymbols': Array < string > | string

        ,
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/api/hotspots/3d/{hugoSymbols}';

        path = path.replace('{hugoSymbols}', parameters['hugoSymbols'] + '');

        if (parameters.$queryParameters) {
            Object.keys(parameters.$queryParameters).forEach(function(parameterName) {
                var parameter = parameters.$queryParameters[parameterName];
                queryParameters[parameterName] = parameter;
            });
        }
        let keys = Object.keys(queryParameters);
        return this.domain + path + (keys.length > 0 ? '?' + (keys.map(key => key + '=' + encodeURIComponent(queryParameters[key])).join('&')) : '');
    };

    /**
     * get all hotspot mutations for the specified genes
     * @method
     * @name CancerHotspotsAPI#get3dHotspotMutationsByGene
     * @param {array} hugoSymbols - Comma separated list of hugo symbols. For example PTEN,BRAF,TP53
     */
    get3dHotspotMutationsByGene(parameters: {
            'hugoSymbols': Array < string > | string

            ,
            $queryParameters ? : any,
            $domain ? : string
        }): Promise < Array < ClusteredHotspotMutation >
        > {
            const domain = parameters.$domain ? parameters.$domain : this.domain;
            const errorHandlers = this.errorHandlers;
            const request = this.request;
            let path = '/api/hotspots/3d/{hugoSymbols}';
            let body: any;
            let queryParameters: any = {};
            let headers: any = {};
            let form: any = {};
            return new Promise(function(resolve, reject) {
                headers['Accept'] = 'application/json';
                headers['Content-Type'] = 'application/json';

                path = path.replace('{hugoSymbols}', parameters['hugoSymbols'] + '');

                if (parameters['hugoSymbols'] === undefined) {
                    reject(new Error('Missing required  parameter: hugoSymbols'));
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

    getAllHotspotMutationsURL(parameters: {
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/api/hotspots/single';

        if (parameters.$queryParameters) {
            Object.keys(parameters.$queryParameters).forEach(function(parameterName) {
                var parameter = parameters.$queryParameters[parameterName];
                queryParameters[parameterName] = parameter;
            });
        }
        let keys = Object.keys(queryParameters);
        return this.domain + path + (keys.length > 0 ? '?' + (keys.map(key => key + '=' + encodeURIComponent(queryParameters[key])).join('&')) : '');
    };

    /**
     * get all hotspot mutations
     * @method
     * @name CancerHotspotsAPI#getAllHotspotMutations
     */
    getAllHotspotMutations(parameters: {
            $queryParameters ? : any,
                $domain ? : string
        }): Promise < Array < SingleResidueHotspotMutation >
        > {
            const domain = parameters.$domain ? parameters.$domain : this.domain;
            const errorHandlers = this.errorHandlers;
            const request = this.request;
            let path = '/api/hotspots/single';
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

    getAllHotspotMutations_1URL(parameters: {
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/api/hotspots/single';

        if (parameters.$queryParameters) {
            Object.keys(parameters.$queryParameters).forEach(function(parameterName) {
                var parameter = parameters.$queryParameters[parameterName];
                queryParameters[parameterName] = parameter;
            });
        }
        let keys = Object.keys(queryParameters);
        return this.domain + path + (keys.length > 0 ? '?' + (keys.map(key => key + '=' + encodeURIComponent(queryParameters[key])).join('&')) : '');
    };

    /**
     * get all hotspot mutations
     * @method
     * @name CancerHotspotsAPI#getAllHotspotMutations_1
     */
    getAllHotspotMutations_1(parameters: {
            $queryParameters ? : any,
                $domain ? : string
        }): Promise < Array < SingleResidueHotspotMutation >
        > {
            const domain = parameters.$domain ? parameters.$domain : this.domain;
            const errorHandlers = this.errorHandlers;
            const request = this.request;
            let path = '/api/hotspots/single';
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

    postSingleResidueHotspotMutationsByTranscriptURL(parameters: {
        'transcriptIds': Array < string > | string

        ,
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/api/hotspots/single/byTranscript';
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
     * get hotspot mutations by transcript id
     * @method
     * @name CancerHotspotsAPI#postSingleResidueHotspotMutationsByTranscript
     * @param {array} transcriptIds - Comma separated list of transcript IDs. For example ENST00000288602,ENST00000275493
     */
    postSingleResidueHotspotMutationsByTranscript(parameters: {
            'transcriptIds': Array < string > | string

            ,
            $queryParameters ? : any,
            $domain ? : string
        }): Promise < Array < HotspotMutation >
        > {
            const domain = parameters.$domain ? parameters.$domain : this.domain;
            const errorHandlers = this.errorHandlers;
            const request = this.request;
            let path = '/api/hotspots/single/byTranscript';
            let body: any;
            let queryParameters: any = {};
            let headers: any = {};
            let form: any = {};
            return new Promise(function(resolve, reject) {
                headers['Accept'] = 'application/json';
                headers['Content-Type'] = 'application/json';

                if (parameters['transcriptIds'] !== undefined) {
                    queryParameters['transcriptIds'] = parameters['transcriptIds'];
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

    getSingleResidueHotspotMutationsByTranscriptURL(parameters: {
        'transcriptIds': Array < string > | string

        ,
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/api/hotspots/single/byTranscript/{transcriptIds}';

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
     * get hotspot mutations by transcript id
     * @method
     * @name CancerHotspotsAPI#getSingleResidueHotspotMutationsByTranscript
     * @param {array} transcriptIds - Comma separated list of transcript IDs. For example ENST00000288602,ENST00000275493
     */
    getSingleResidueHotspotMutationsByTranscript(parameters: {
            'transcriptIds': Array < string > | string

            ,
            $queryParameters ? : any,
            $domain ? : string
        }): Promise < Array < SingleResidueHotspotMutation >
        > {
            const domain = parameters.$domain ? parameters.$domain : this.domain;
            const errorHandlers = this.errorHandlers;
            const request = this.request;
            let path = '/api/hotspots/single/byTranscript/{transcriptIds}';
            let body: any;
            let queryParameters: any = {};
            let headers: any = {};
            let form: any = {};
            return new Promise(function(resolve, reject) {
                headers['Accept'] = 'application/json';
                headers['Content-Type'] = 'application/json';

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

    getMetadataURL(parameters: {
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/api/metadata';

        if (parameters.$queryParameters) {
            Object.keys(parameters.$queryParameters).forEach(function(parameterName) {
                var parameter = parameters.$queryParameters[parameterName];
                queryParameters[parameterName] = parameter;
            });
        }
        let keys = Object.keys(queryParameters);
        return this.domain + path + (keys.length > 0 ? '?' + (keys.map(key => key + '=' + encodeURIComponent(queryParameters[key])).join('&')) : '');
    };

    /**
     * get metadata
     * @method
     * @name CancerHotspotsAPI#getMetadata
     */
    getMetadata(parameters: {
        $queryParameters ? : any,
            $domain ? : string
    }): Promise < {} > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        const errorHandlers = this.errorHandlers;
        const request = this.request;
        let path = '/api/metadata';
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

    getMetadata_1URL(parameters: {
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/api/metadata';

        if (parameters.$queryParameters) {
            Object.keys(parameters.$queryParameters).forEach(function(parameterName) {
                var parameter = parameters.$queryParameters[parameterName];
                queryParameters[parameterName] = parameter;
            });
        }
        let keys = Object.keys(queryParameters);
        return this.domain + path + (keys.length > 0 ? '?' + (keys.map(key => key + '=' + encodeURIComponent(queryParameters[key])).join('&')) : '');
    };

    /**
     * get metadata
     * @method
     * @name CancerHotspotsAPI#getMetadata_1
     */
    getMetadata_1(parameters: {
        $queryParameters ? : any,
            $domain ? : string
    }): Promise < {} > {
        const domain = parameters.$domain ? parameters.$domain : this.domain;
        const errorHandlers = this.errorHandlers;
        const request = this.request;
        let path = '/api/metadata';
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

    getAllVariantsURL(parameters: {
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/api/variants';

        if (parameters.$queryParameters) {
            Object.keys(parameters.$queryParameters).forEach(function(parameterName) {
                var parameter = parameters.$queryParameters[parameterName];
                queryParameters[parameterName] = parameter;
            });
        }
        let keys = Object.keys(queryParameters);
        return this.domain + path + (keys.length > 0 ? '?' + (keys.map(key => key + '=' + encodeURIComponent(queryParameters[key])).join('&')) : '');
    };

    /**
     * get all variant tumor type composition
     * @method
     * @name CancerHotspotsAPI#getAllVariants
     */
    getAllVariants(parameters: {
            $queryParameters ? : any,
                $domain ? : string
        }): Promise < Array < TumorTypeComposition >
        > {
            const domain = parameters.$domain ? parameters.$domain : this.domain;
            const errorHandlers = this.errorHandlers;
            const request = this.request;
            let path = '/api/variants';
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

    postVariantsURL(parameters: {
        'hugoSymbol' ? : string,
        'aminoAcidChanges' ? : Array < string > | string

        ,
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/api/variants';
        if (parameters['hugoSymbol'] !== undefined) {
            queryParameters['hugoSymbol'] = parameters['hugoSymbol'];
        }

        if (parameters['aminoAcidChanges'] !== undefined) {
            queryParameters['aminoAcidChanges'] = parameters['aminoAcidChanges'];
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
     * get variant tumor type compositions
     * @method
     * @name CancerHotspotsAPI#postVariants
     * @param {string} hugoSymbol - Hugo gene symbol, for example BRAF
     * @param {array} aminoAcidChanges - Comma separated list of amino acid change values. For example V600E,V600K
     */
    postVariants(parameters: {
            'hugoSymbol' ? : string,
            'aminoAcidChanges' ? : Array < string > | string

            ,
            $queryParameters ? : any,
                $domain ? : string
        }): Promise < Array < TumorTypeComposition >
        > {
            const domain = parameters.$domain ? parameters.$domain : this.domain;
            const errorHandlers = this.errorHandlers;
            const request = this.request;
            let path = '/api/variants';
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

                if (parameters['aminoAcidChanges'] !== undefined) {
                    queryParameters['aminoAcidChanges'] = parameters['aminoAcidChanges'];
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

    getVariantsByHugoSymbolAndAminoAcidChangeURL(parameters: {
        'hugoSymbol': string,
        'aminoAcidChanges': Array < string > | string

        ,
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/api/variants/{hugoSymbol}/{aminoAcidChanges}';

        path = path.replace('{hugoSymbol}', parameters['hugoSymbol'] + '');

        path = path.replace('{aminoAcidChanges}', parameters['aminoAcidChanges'] + '');

        if (parameters.$queryParameters) {
            Object.keys(parameters.$queryParameters).forEach(function(parameterName) {
                var parameter = parameters.$queryParameters[parameterName];
                queryParameters[parameterName] = parameter;
            });
        }
        let keys = Object.keys(queryParameters);
        return this.domain + path + (keys.length > 0 ? '?' + (keys.map(key => key + '=' + encodeURIComponent(queryParameters[key])).join('&')) : '');
    };

    /**
     * get variant tumor type compositions
     * @method
     * @name CancerHotspotsAPI#getVariantsByHugoSymbolAndAminoAcidChange
     * @param {string} hugoSymbol - Hugo gene symbol, for example BRAF
     * @param {array} aminoAcidChanges - Comma separated list of amino acid change values. For example V600E,V600K
     */
    getVariantsByHugoSymbolAndAminoAcidChange(parameters: {
            'hugoSymbol': string,
            'aminoAcidChanges': Array < string > | string

            ,
            $queryParameters ? : any,
            $domain ? : string
        }): Promise < Array < TumorTypeComposition >
        > {
            const domain = parameters.$domain ? parameters.$domain : this.domain;
            const errorHandlers = this.errorHandlers;
            const request = this.request;
            let path = '/api/variants/{hugoSymbol}/{aminoAcidChanges}';
            let body: any;
            let queryParameters: any = {};
            let headers: any = {};
            let form: any = {};
            return new Promise(function(resolve, reject) {
                headers['Accept'] = 'application/json';
                headers['Content-Type'] = 'application/json';

                path = path.replace('{hugoSymbol}', parameters['hugoSymbol'] + '');

                if (parameters['hugoSymbol'] === undefined) {
                    reject(new Error('Missing required  parameter: hugoSymbol'));
                    return;
                }

                path = path.replace('{aminoAcidChanges}', parameters['aminoAcidChanges'] + '');

                if (parameters['aminoAcidChanges'] === undefined) {
                    reject(new Error('Missing required  parameter: aminoAcidChanges'));
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