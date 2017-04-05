import * as request from "superagent";

type CallbackHandler = (err: any, res ? : request.Response) => void;
export type HotspotMutation = any;
export type IntegerRange = any;
export type TumorTypeComposition = any;
export type Cluster = any;

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

    fetchClustersPOSTURL(parameters: {
        'clusterIds' ? : Array < string > ,
            'hugoSymbol' ? : string,
            'residue' ? : string,
            $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/api/clusters';

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
     * @name CancerHotspotsAPI#fetchClustersPOST
     * @param {} clusterIds - List of cluster ids, for example [1,2,3]
     * @param {string} hugoSymbol - Hugo gene symbol, for example BRAF
     * @param {string} residue - Residue, for example F595
     */
    fetchClustersPOST(parameters: {
            'clusterIds' ? : Array < string > ,
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
                    body = parameters['clusterIds'];
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

    fetchClustersByClusterIdGETURL(parameters: {
        'clusterIds': Array < string > ,
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
     * @name CancerHotspotsAPI#fetchClustersByClusterIdGET
     * @param {array} clusterIds - Comma separated list of cluster ids, for example 1,2,3
     */
    fetchClustersByClusterIdGET(parameters: {
            'clusterIds': Array < string > ,
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

                if (parameters['clusterIds'] === undefined) {
                    reject(new Error('Missing required  parameter: clusterIds'));
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

    fetchClustersByHugoSymbolGETURL(parameters: {
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
     * @name CancerHotspotsAPI#fetchClustersByHugoSymbolGET
     * @param {string} hugoSymbol - Hugo gene symbol, for example BRAF
     */
    fetchClustersByHugoSymbolGET(parameters: {
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

    fetchClustersByHugoSymbolAndResidueGETURL(parameters: {
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
     * @name CancerHotspotsAPI#fetchClustersByHugoSymbolAndResidueGET
     * @param {string} hugoSymbol - Hugo gene symbol, for example BRAF
     * @param {string} residue - Residue, for example F595
     */
    fetchClustersByHugoSymbolAndResidueGET(parameters: {
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

    fetch3dHotspotMutationsPOST_1URL(parameters: {
        'hugoSymbols' ? : Array < string > ,
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
     * get all 3D hotspot mutations
     * @method
     * @name CancerHotspotsAPI#fetch3dHotspotMutationsPOST_1
     * @param {array} hugoSymbols - Comma separated list of hugo symbols. For example PTEN,BRAF,TP53
     */
    fetch3dHotspotMutationsPOST_1(parameters: {
            'hugoSymbols' ? : Array < string > ,
                $queryParameters ? : any,
                $domain ? : string
        }): Promise < Array < HotspotMutation >
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

                request('GET', domain + path, body, headers, queryParameters, form, reject, resolve, errorHandlers);

            }).then(function(response: request.Response) {
                return response.body;
            });
        };

    fetch3dHotspotMutationsPOSTURL(parameters: {
        'hugoSymbols' ? : Array < string > ,
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
     * get all 3D hotspot mutations
     * @method
     * @name CancerHotspotsAPI#fetch3dHotspotMutationsPOST
     * @param {array} hugoSymbols - Comma separated list of hugo symbols. For example PTEN,BRAF,TP53
     */
    fetch3dHotspotMutationsPOST(parameters: {
            'hugoSymbols' ? : Array < string > ,
                $queryParameters ? : any,
                $domain ? : string
        }): Promise < Array < HotspotMutation >
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

    fetch3dHotspotMutationsByGenePOSTURL(parameters: {
        'hugoSymbols': Array < string > ,
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/api/hotspots/3d/byGene';

        if (parameters.$queryParameters) {
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
     * @name CancerHotspotsAPI#fetch3dHotspotMutationsByGenePOST
     * @param {} hugoSymbols - List of hugo symbols. For example ["PTEN","BRAF","TP53"]
     */
    fetch3dHotspotMutationsByGenePOST(parameters: {
            'hugoSymbols': Array < string > ,
            $queryParameters ? : any,
            $domain ? : string
        }): Promise < Array < HotspotMutation >
        > {
            const domain = parameters.$domain ? parameters.$domain : this.domain;
            const errorHandlers = this.errorHandlers;
            const request = this.request;
            let path = '/api/hotspots/3d/byGene';
            let body: any;
            let queryParameters: any = {};
            let headers: any = {};
            let form: any = {};
            return new Promise(function(resolve, reject) {
                headers['Accept'] = 'application/json';
                headers['Content-Type'] = 'application/json';

                if (parameters['hugoSymbols'] !== undefined) {
                    body = parameters['hugoSymbols'];
                }

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

                request('POST', domain + path, body, headers, queryParameters, form, reject, resolve, errorHandlers);

            }).then(function(response: request.Response) {
                return response.body;
            });
        };

    fetch3dHotspotMutationsByGeneGETURL(parameters: {
        'hugoSymbols': Array < string > ,
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/api/hotspots/3d/byGene/{hugoSymbols}';

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
     * @name CancerHotspotsAPI#fetch3dHotspotMutationsByGeneGET
     * @param {array} hugoSymbols - Comma separated list of hugo symbols. For example PTEN,BRAF,TP53
     */
    fetch3dHotspotMutationsByGeneGET(parameters: {
            'hugoSymbols': Array < string > ,
            $queryParameters ? : any,
            $domain ? : string
        }): Promise < Array < HotspotMutation >
        > {
            const domain = parameters.$domain ? parameters.$domain : this.domain;
            const errorHandlers = this.errorHandlers;
            const request = this.request;
            let path = '/api/hotspots/3d/byGene/{hugoSymbols}';
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

    fetch3dHotspotMutationsByTranscriptPOSTURL(parameters: {
        'transcriptIds': Array < string > ,
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/api/hotspots/3d/byTranscript';

        if (parameters.$queryParameters) {
            Object.keys(parameters.$queryParameters).forEach(function(parameterName) {
                var parameter = parameters.$queryParameters[parameterName];
                queryParameters[parameterName] = parameter;
            });
        }
        let keys = Object.keys(queryParameters);
        return this.domain + path + (keys.length > 0 ? '?' + (keys.map(key => key + '=' + encodeURIComponent(queryParameters[key])).join('&')) : '');
    };

    /**
     * get 3D hotspot mutations by transcript id
     * @method
     * @name CancerHotspotsAPI#fetch3dHotspotMutationsByTranscriptPOST
     * @param {} transcriptIds - List of transcript IDs. For example ["ENST00000288602","ENST00000275493"]
     */
    fetch3dHotspotMutationsByTranscriptPOST(parameters: {
            'transcriptIds': Array < string > ,
            $queryParameters ? : any,
            $domain ? : string
        }): Promise < Array < HotspotMutation >
        > {
            const domain = parameters.$domain ? parameters.$domain : this.domain;
            const errorHandlers = this.errorHandlers;
            const request = this.request;
            let path = '/api/hotspots/3d/byTranscript';
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

    fetch3dHotspotMutationsByTranscriptGETURL(parameters: {
        'transcriptIds': Array < string > ,
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/api/hotspots/3d/byTranscript/{transcriptIds}';

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
     * get 3D hotspot mutations by transcript id
     * @method
     * @name CancerHotspotsAPI#fetch3dHotspotMutationsByTranscriptGET
     * @param {array} transcriptIds - Comma separated list of transcript IDs. For example ENST00000288602,ENST00000275493
     */
    fetch3dHotspotMutationsByTranscriptGET(parameters: {
            'transcriptIds': Array < string > ,
            $queryParameters ? : any,
            $domain ? : string
        }): Promise < Array < HotspotMutation >
        > {
            const domain = parameters.$domain ? parameters.$domain : this.domain;
            const errorHandlers = this.errorHandlers;
            const request = this.request;
            let path = '/api/hotspots/3d/byTranscript/{transcriptIds}';
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

    fetch3dHotspotMutationsByGene_LegacyURL(parameters: {
        'hugoSymbols': Array < string > ,
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
     * @name CancerHotspotsAPI#fetch3dHotspotMutationsByGene_Legacy
     * @param {array} hugoSymbols - Comma separated list of hugo symbols. For example PTEN,BRAF,TP53
     */
    fetch3dHotspotMutationsByGene_Legacy(parameters: {
            'hugoSymbols': Array < string > ,
            $queryParameters ? : any,
            $domain ? : string
        }): Promise < Array < HotspotMutation >
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

    fetchSingleResidueHotspotMutationsURL(parameters: {
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
     * get all single residue hotspot mutations
     * @method
     * @name CancerHotspotsAPI#fetchSingleResidueHotspotMutations
     */
    fetchSingleResidueHotspotMutations(parameters: {
            $queryParameters ? : any,
                $domain ? : string
        }): Promise < Array < HotspotMutation >
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

    fetchSingleResidueHotspotMutations_1URL(parameters: {
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
     * get all single residue hotspot mutations
     * @method
     * @name CancerHotspotsAPI#fetchSingleResidueHotspotMutations_1
     */
    fetchSingleResidueHotspotMutations_1(parameters: {
            $queryParameters ? : any,
                $domain ? : string
        }): Promise < Array < HotspotMutation >
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

    fetchSingleResidueHotspotMutationsByGenePOSTURL(parameters: {
        'hugoSymbols': Array < string > ,
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/api/hotspots/single/byGene';

        if (parameters.$queryParameters) {
            Object.keys(parameters.$queryParameters).forEach(function(parameterName) {
                var parameter = parameters.$queryParameters[parameterName];
                queryParameters[parameterName] = parameter;
            });
        }
        let keys = Object.keys(queryParameters);
        return this.domain + path + (keys.length > 0 ? '?' + (keys.map(key => key + '=' + encodeURIComponent(queryParameters[key])).join('&')) : '');
    };

    /**
     * get hotspot mutations by hugo gene symbol
     * @method
     * @name CancerHotspotsAPI#fetchSingleResidueHotspotMutationsByGenePOST
     * @param {} hugoSymbols - List of hugo gene symbols. For example ["PTEN","BRAF","TP53"]
     */
    fetchSingleResidueHotspotMutationsByGenePOST(parameters: {
            'hugoSymbols': Array < string > ,
            $queryParameters ? : any,
            $domain ? : string
        }): Promise < Array < HotspotMutation >
        > {
            const domain = parameters.$domain ? parameters.$domain : this.domain;
            const errorHandlers = this.errorHandlers;
            const request = this.request;
            let path = '/api/hotspots/single/byGene';
            let body: any;
            let queryParameters: any = {};
            let headers: any = {};
            let form: any = {};
            return new Promise(function(resolve, reject) {
                headers['Accept'] = 'application/json';
                headers['Content-Type'] = 'application/json';

                if (parameters['hugoSymbols'] !== undefined) {
                    body = parameters['hugoSymbols'];
                }

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

                request('POST', domain + path, body, headers, queryParameters, form, reject, resolve, errorHandlers);

            }).then(function(response: request.Response) {
                return response.body;
            });
        };

    fetchSingleResidueHotspotMutationsByGeneGETURL(parameters: {
        'hugoSymbols': Array < string > ,
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/api/hotspots/single/byGene/{hugoSymbols}';

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
     * get hotspot mutations by hugo gene symbol
     * @method
     * @name CancerHotspotsAPI#fetchSingleResidueHotspotMutationsByGeneGET
     * @param {array} hugoSymbols - Comma separated list of hugo gene symbols. For example PTEN,BRAF,TP53
     */
    fetchSingleResidueHotspotMutationsByGeneGET(parameters: {
            'hugoSymbols': Array < string > ,
            $queryParameters ? : any,
            $domain ? : string
        }): Promise < Array < HotspotMutation >
        > {
            const domain = parameters.$domain ? parameters.$domain : this.domain;
            const errorHandlers = this.errorHandlers;
            const request = this.request;
            let path = '/api/hotspots/single/byGene/{hugoSymbols}';
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

    fetchSingleResidueHotspotMutationsByTranscriptPOSTURL(parameters: {
        'transcriptIds': Array < string > ,
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/api/hotspots/single/byTranscript';

        if (parameters.$queryParameters) {
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
     * @name CancerHotspotsAPI#fetchSingleResidueHotspotMutationsByTranscriptPOST
     * @param {} transcriptIds - List of transcript IDs. For example ["ENST00000288602","ENST00000275493"]
     */
    fetchSingleResidueHotspotMutationsByTranscriptPOST(parameters: {
            'transcriptIds': Array < string > ,
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

    fetchSingleResidueHotspotMutationsByTranscriptGETURL(parameters: {
        'transcriptIds': Array < string > ,
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
     * @name CancerHotspotsAPI#fetchSingleResidueHotspotMutationsByTranscriptGET
     * @param {array} transcriptIds - Comma separated list of transcript IDs. For example ENST00000288602,ENST00000275493
     */
    fetchSingleResidueHotspotMutationsByTranscriptGET(parameters: {
            'transcriptIds': Array < string > ,
            $queryParameters ? : any,
            $domain ? : string
        }): Promise < Array < HotspotMutation >
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

    fetchMetadataURL(parameters: {
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
     * @name CancerHotspotsAPI#fetchMetadata
     */
    fetchMetadata(parameters: {
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

    fetchMetadata_1URL(parameters: {
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
     * @name CancerHotspotsAPI#fetchMetadata_1
     */
    fetchMetadata_1(parameters: {
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

    fetchAllVariantsGETURL(parameters: {
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
     * @name CancerHotspotsAPI#fetchAllVariantsGET
     */
    fetchAllVariantsGET(parameters: {
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

    fetchVariantsPOSTURL(parameters: {
        'hugoSymbol' ? : string,
        'aminoAcidChanges' ? : Array < string > ,
            $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/api/variants';
        if (parameters['hugoSymbol'] !== undefined) {
            queryParameters['hugoSymbol'] = parameters['hugoSymbol'];
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
     * @name CancerHotspotsAPI#fetchVariantsPOST
     * @param {string} hugoSymbol - Hugo gene symbol, for example BRAF
     * @param {} aminoAcidChanges - List of amino acid change values. For example ["V600E","V600K"]
     */
    fetchVariantsPOST(parameters: {
            'hugoSymbol' ? : string,
            'aminoAcidChanges' ? : Array < string > ,
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
                    body = parameters['aminoAcidChanges'];
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

    fetchVariantsGETURL(parameters: {
        'hugoSymbol': string,
        'aminoAcidChanges': Array < string > ,
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
     * get variant tumor type compositions by gene and amino acid change
     * @method
     * @name CancerHotspotsAPI#fetchVariantsGET
     * @param {string} hugoSymbol - Hugo gene symbol, for example BRAF
     * @param {array} aminoAcidChanges - Comma separated list of amino acid change values. For example V600E,V600K
     */
    fetchVariantsGET(parameters: {
            'hugoSymbol': string,
            'aminoAcidChanges': Array < string > ,
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