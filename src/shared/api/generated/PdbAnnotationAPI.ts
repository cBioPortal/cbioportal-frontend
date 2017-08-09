import * as request from "superagent";

type CallbackHandler = (err: any, res ? : request.Response) => void;
export type PdbUniprotResidueMapping = any;
export type AlignmentSummary = any;
export type PdbUniprotAlignment = any;
export type PdbHeader = any;

/**
 * PDB Annotation API
 * @class PdbAnnotationAPI
 * @param {(string)} [domainOrOptions] - The project domain.
 */
export default class PdbAnnotationAPI {

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

    postPdbAlignmentByPdbURL(parameters: {
        'pdbIds': Array < string > ,
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/pdb_annotation/alignment/byPdb';
        if (parameters['pdbIds'] !== undefined) {
            queryParameters['pdbIds'] = parameters['pdbIds'];
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
     * get pdb uniprot alignments by pdb id
     * @method
     * @name PdbAnnotationAPI#postPdbAlignmentByPdb
     * @param {array} pdbIds - Comma separated list of pdb ids. For example 1a37,1a4o
     */
    postPdbAlignmentByPdb(parameters: {
            'pdbIds': Array < string > ,
            $queryParameters ? : any,
            $domain ? : string
        }): Promise < Array < PdbUniprotAlignment >
        > {
            const domain = parameters.$domain ? parameters.$domain : this.domain;
            const errorHandlers = this.errorHandlers;
            const request = this.request;
            let path = '/pdb_annotation/alignment/byPdb';
            let body: any;
            let queryParameters: any = {};
            let headers: any = {};
            let form: any = {};
            return new Promise(function(resolve, reject) {
                headers['Accept'] = 'application/json';
                headers['Content-Type'] = 'application/json';

                if (parameters['pdbIds'] !== undefined) {
                    queryParameters['pdbIds'] = parameters['pdbIds'];
                }

                if (parameters['pdbIds'] === undefined) {
                    reject(new Error('Missing required  parameter: pdbIds'));
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

    getPdbAlignmentByPdbURL(parameters: {
        'pdbIds': Array < string > ,
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/pdb_annotation/alignment/byPdb/{pdbIds}';

        path = path.replace('{pdbIds}', parameters['pdbIds'] + '');

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
     * get pdb uniprot alignments by pdb id
     * @method
     * @name PdbAnnotationAPI#getPdbAlignmentByPdb
     * @param {array} pdbIds - Comma separated list of pdb ids. For example 1a37,1a4o
     */
    getPdbAlignmentByPdb(parameters: {
            'pdbIds': Array < string > ,
            $queryParameters ? : any,
            $domain ? : string
        }): Promise < Array < PdbUniprotAlignment >
        > {
            const domain = parameters.$domain ? parameters.$domain : this.domain;
            const errorHandlers = this.errorHandlers;
            const request = this.request;
            let path = '/pdb_annotation/alignment/byPdb/{pdbIds}';
            let body: any;
            let queryParameters: any = {};
            let headers: any = {};
            let form: any = {};
            return new Promise(function(resolve, reject) {
                headers['Accept'] = 'application/json';
                headers['Content-Type'] = 'application/json';

                path = path.replace('{pdbIds}', parameters['pdbIds'] + '');

                if (parameters['pdbIds'] === undefined) {
                    reject(new Error('Missing required  parameter: pdbIds'));
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

    postPdbAlignmentByUniprotURL(parameters: {
        'uniprotIds': Array < string > ,
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/pdb_annotation/alignment/byUniprot';
        if (parameters['uniprotIds'] !== undefined) {
            queryParameters['uniprotIds'] = parameters['uniprotIds'];
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
     * get pdb uniprot alignments by uniprot id
     * @method
     * @name PdbAnnotationAPI#postPdbAlignmentByUniprot
     * @param {array} uniprotIds - Comma separated list of uniprot ids. For example P53_HUMAN,RASK_HUMAN
     */
    postPdbAlignmentByUniprot(parameters: {
            'uniprotIds': Array < string > ,
            $queryParameters ? : any,
            $domain ? : string
        }): Promise < Array < PdbUniprotAlignment >
        > {
            const domain = parameters.$domain ? parameters.$domain : this.domain;
            const errorHandlers = this.errorHandlers;
            const request = this.request;
            let path = '/pdb_annotation/alignment/byUniprot';
            let body: any;
            let queryParameters: any = {};
            let headers: any = {};
            let form: any = {};
            return new Promise(function(resolve, reject) {
                headers['Accept'] = 'application/json';
                headers['Content-Type'] = 'application/json';

                if (parameters['uniprotIds'] !== undefined) {
                    queryParameters['uniprotIds'] = parameters['uniprotIds'];
                }

                if (parameters['uniprotIds'] === undefined) {
                    reject(new Error('Missing required  parameter: uniprotIds'));
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

    getPdbAlignmentByUniprotURL(parameters: {
        'uniprotIds': Array < string > ,
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/pdb_annotation/alignment/byUniprot/{uniprotIds}';

        path = path.replace('{uniprotIds}', parameters['uniprotIds'] + '');

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
     * get pdb uniprot alignments by uniprot id
     * @method
     * @name PdbAnnotationAPI#getPdbAlignmentByUniprot
     * @param {array} uniprotIds - Comma separated list of uniprot ids. For example P53_HUMAN,RASK_HUMAN
     */
    getPdbAlignmentByUniprot(parameters: {
            'uniprotIds': Array < string > ,
            $queryParameters ? : any,
            $domain ? : string
        }): Promise < Array < PdbUniprotAlignment >
        > {
            const domain = parameters.$domain ? parameters.$domain : this.domain;
            const errorHandlers = this.errorHandlers;
            const request = this.request;
            let path = '/pdb_annotation/alignment/byUniprot/{uniprotIds}';
            let body: any;
            let queryParameters: any = {};
            let headers: any = {};
            let form: any = {};
            return new Promise(function(resolve, reject) {
                headers['Accept'] = 'application/json';
                headers['Content-Type'] = 'application/json';

                path = path.replace('{uniprotIds}', parameters['uniprotIds'] + '');

                if (parameters['uniprotIds'] === undefined) {
                    reject(new Error('Missing required  parameter: uniprotIds'));
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

    postPdbHeaderURL(parameters: {
        'pdbIds': Array < string > ,
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/pdb_annotation/header';
        if (parameters['pdbIds'] !== undefined) {
            queryParameters['pdbIds'] = parameters['pdbIds'];
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
     * get pdb header info by pdb id
     * @method
     * @name PdbAnnotationAPI#postPdbHeader
     * @param {array} pdbIds - Comma separated list of pdb ids. For example 1a37,1a4o
     */
    postPdbHeader(parameters: {
            'pdbIds': Array < string > ,
            $queryParameters ? : any,
            $domain ? : string
        }): Promise < Array < PdbHeader >
        > {
            const domain = parameters.$domain ? parameters.$domain : this.domain;
            const errorHandlers = this.errorHandlers;
            const request = this.request;
            let path = '/pdb_annotation/header';
            let body: any;
            let queryParameters: any = {};
            let headers: any = {};
            let form: any = {};
            return new Promise(function(resolve, reject) {
                headers['Accept'] = 'application/json';
                headers['Content-Type'] = 'application/json';

                if (parameters['pdbIds'] !== undefined) {
                    queryParameters['pdbIds'] = parameters['pdbIds'];
                }

                if (parameters['pdbIds'] === undefined) {
                    reject(new Error('Missing required  parameter: pdbIds'));
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

    getPdbHeaderURL(parameters: {
        'pdbIds': Array < string > ,
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/pdb_annotation/header/{pdbIds}';

        path = path.replace('{pdbIds}', parameters['pdbIds'] + '');

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
     * get pdb header info by pdb id
     * @method
     * @name PdbAnnotationAPI#getPdbHeader
     * @param {array} pdbIds - Comma separated list of pdb ids. For example 1a37,1a4o
     */
    getPdbHeader(parameters: {
            'pdbIds': Array < string > ,
            $queryParameters ? : any,
            $domain ? : string
        }): Promise < Array < PdbHeader >
        > {
            const domain = parameters.$domain ? parameters.$domain : this.domain;
            const errorHandlers = this.errorHandlers;
            const request = this.request;
            let path = '/pdb_annotation/header/{pdbIds}';
            let body: any;
            let queryParameters: any = {};
            let headers: any = {};
            let form: any = {};
            return new Promise(function(resolve, reject) {
                headers['Accept'] = 'application/json';
                headers['Content-Type'] = 'application/json';

                path = path.replace('{pdbIds}', parameters['pdbIds'] + '');

                if (parameters['pdbIds'] === undefined) {
                    reject(new Error('Missing required  parameter: pdbIds'));
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

    postPositionMapURL(parameters: {
        'positions': Array < number > ,
        'alignments': Array < number > ,
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/pdb_annotation/map';
        if (parameters['positions'] !== undefined) {
            queryParameters['positions'] = parameters['positions'];
        }

        if (parameters['alignments'] !== undefined) {
            queryParameters['alignments'] = parameters['alignments'];
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
     * get position mapping for alignments
     * @method
     * @name PdbAnnotationAPI#postPositionMap
     * @param {array} positions - Comma separated list of uniprot positions. For example 97,100,105
     * @param {array} alignments - Comma separated list of alignment ids. For example 3412121,3412119
     */
    postPositionMap(parameters: {
            'positions': Array < number > ,
            'alignments': Array < number > ,
            $queryParameters ? : any,
            $domain ? : string
        }): Promise < Array < PdbUniprotResidueMapping >
        > {
            const domain = parameters.$domain ? parameters.$domain : this.domain;
            const errorHandlers = this.errorHandlers;
            const request = this.request;
            let path = '/pdb_annotation/map';
            let body: any;
            let queryParameters: any = {};
            let headers: any = {};
            let form: any = {};
            return new Promise(function(resolve, reject) {
                headers['Accept'] = 'application/json';
                headers['Content-Type'] = 'application/json';

                if (parameters['positions'] !== undefined) {
                    queryParameters['positions'] = parameters['positions'];
                }

                if (parameters['positions'] === undefined) {
                    reject(new Error('Missing required  parameter: positions'));
                    return;
                }

                if (parameters['alignments'] !== undefined) {
                    queryParameters['alignments'] = parameters['alignments'];
                }

                if (parameters['alignments'] === undefined) {
                    reject(new Error('Missing required  parameter: alignments'));
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

    getPositionMapURL(parameters: {
        'positions': Array < number > ,
        'alignments': Array < number > ,
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/pdb_annotation/map/{positions}/{alignments}';

        path = path.replace('{positions}', parameters['positions'] + '');

        path = path.replace('{alignments}', parameters['alignments'] + '');

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
     * get position mapping for alignments
     * @method
     * @name PdbAnnotationAPI#getPositionMap
     * @param {array} positions - Comma separated list of uniprot positions. For example 97,100,105
     * @param {array} alignments - Comma separated list of alignment ids. For example 3412121,3412119
     */
    getPositionMap(parameters: {
            'positions': Array < number > ,
            'alignments': Array < number > ,
            $queryParameters ? : any,
            $domain ? : string
        }): Promise < Array < PdbUniprotResidueMapping >
        > {
            const domain = parameters.$domain ? parameters.$domain : this.domain;
            const errorHandlers = this.errorHandlers;
            const request = this.request;
            let path = '/pdb_annotation/map/{positions}/{alignments}';
            let body: any;
            let queryParameters: any = {};
            let headers: any = {};
            let form: any = {};
            return new Promise(function(resolve, reject) {
                headers['Accept'] = 'application/json';
                headers['Content-Type'] = 'application/json';

                path = path.replace('{positions}', parameters['positions'] + '');

                if (parameters['positions'] === undefined) {
                    reject(new Error('Missing required  parameter: positions'));
                    return;
                }

                path = path.replace('{alignments}', parameters['alignments'] + '');

                if (parameters['alignments'] === undefined) {
                    reject(new Error('Missing required  parameter: alignments'));
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

    postAlignmentSummaryURL(parameters: {
        'uniprotIds': Array < string > ,
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/pdb_annotation/summary';
        if (parameters['uniprotIds'] !== undefined) {
            queryParameters['uniprotIds'] = parameters['uniprotIds'];
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
     * get alignment summary by uniprot id
     * @method
     * @name PdbAnnotationAPI#postAlignmentSummary
     * @param {array} uniprotIds - Comma separated list of uniprot ids. For example P53_HUMAN,RASK_HUMAN
     */
    postAlignmentSummary(parameters: {
            'uniprotIds': Array < string > ,
            $queryParameters ? : any,
            $domain ? : string
        }): Promise < Array < AlignmentSummary >
        > {
            const domain = parameters.$domain ? parameters.$domain : this.domain;
            const errorHandlers = this.errorHandlers;
            const request = this.request;
            let path = '/pdb_annotation/summary';
            let body: any;
            let queryParameters: any = {};
            let headers: any = {};
            let form: any = {};
            return new Promise(function(resolve, reject) {
                headers['Accept'] = 'application/json';
                headers['Content-Type'] = 'application/json';

                if (parameters['uniprotIds'] !== undefined) {
                    queryParameters['uniprotIds'] = parameters['uniprotIds'];
                }

                if (parameters['uniprotIds'] === undefined) {
                    reject(new Error('Missing required  parameter: uniprotIds'));
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

    getAlignmentSummaryURL(parameters: {
        'uniprotIds': Array < string > ,
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/pdb_annotation/summary/{uniprotIds}';

        path = path.replace('{uniprotIds}', parameters['uniprotIds'] + '');

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
     * get alignment summary by uniprot id
     * @method
     * @name PdbAnnotationAPI#getAlignmentSummary
     * @param {array} uniprotIds - Comma separated list of uniprot ids. For example P53_HUMAN,RASK_HUMAN
     */
    getAlignmentSummary(parameters: {
            'uniprotIds': Array < string > ,
            $queryParameters ? : any,
            $domain ? : string
        }): Promise < Array < AlignmentSummary >
        > {
            const domain = parameters.$domain ? parameters.$domain : this.domain;
            const errorHandlers = this.errorHandlers;
            const request = this.request;
            let path = '/pdb_annotation/summary/{uniprotIds}';
            let body: any;
            let queryParameters: any = {};
            let headers: any = {};
            let form: any = {};
            return new Promise(function(resolve, reject) {
                headers['Accept'] = 'application/json';
                headers['Content-Type'] = 'application/json';

                path = path.replace('{uniprotIds}', parameters['uniprotIds'] + '');

                if (parameters['uniprotIds'] === undefined) {
                    reject(new Error('Missing required  parameter: uniprotIds'));
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