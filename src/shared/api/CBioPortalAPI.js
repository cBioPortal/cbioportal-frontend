"use strict";
var request = require("superagent");
/**
 * A web service for supplying JSON formatted data to cBioPortal clients.
 * @class CBioPortalAPI
 * @param {(string)} [domainOrOptions] - The project domain.
 */
var CBioPortalAPI = (function () {
    function CBioPortalAPI(domain) {
        this.domain = "";
        this.errorHandlers = [];
        if (domain) {
            this.domain = domain;
        }
    }
    CBioPortalAPI.prototype.getDomain = function () {
        return this.domain;
    };
    CBioPortalAPI.prototype.addErrorHandler = function (handler) {
        this.errorHandlers.push(handler);
    };
    CBioPortalAPI.prototype.request = function (method, url, body, headers, queryParameters, form, reject, resolve, errorHandlers) {
        var req = new request.Request(method, url)
            .query(queryParameters);
        Object.keys(headers).forEach(function (key) {
            req.set(key, headers[key]);
        });
        if (body) {
            req.send(body);
        }
        if (typeof (body) === 'object' && !(body.constructor.name === 'Buffer')) {
            req.set('Content-Type', 'application/json');
        }
        if (Object.keys(form).length > 0) {
            req.type('form');
            req.send(form);
        }
        req.end(function (error, response) {
            if (error || !response.ok) {
                reject(error);
                errorHandlers.forEach(function (handler) { return handler(error); });
            }
            else {
                resolve(response);
            }
        });
    };
    CBioPortalAPI.prototype.getAllCancerTypesUsingGETURL = function (parameters) {
        var queryParameters = {};
        var path = '/cancer-types';
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
            Object.keys(parameters.$queryParameters).forEach(function (parameterName) {
                var parameter = parameters.$queryParameters[parameterName];
                queryParameters[parameterName] = parameter;
            });
        }
        var keys = Object.keys(queryParameters);
        return this.domain + path + (keys.length > 0 ? '?' + (keys.map(function (key) { return key + '=' + encodeURIComponent(queryParameters[key]); }).join('&')) : '');
    };
    ;
    /**
     * Get all cancer types
     * @method
     * @name CBioPortalAPI#getAllCancerTypesUsingGET
     * @param {string} projection - Level of detail of the response
     * @param {integer} pageSize - Page size of the result list
     * @param {integer} pageNumber - Page number of the result list
     * @param {string} sortBy - Name of the property that the result list is sorted by
     * @param {string} direction - Direction of the sort
     */
    CBioPortalAPI.prototype.getAllCancerTypesUsingGET = function (parameters) {
        var domain = parameters.$domain ? parameters.$domain : this.domain;
        var errorHandlers = this.errorHandlers;
        var request = this.request;
        var path = '/cancer-types';
        var body;
        var queryParameters = {};
        var headers = {};
        var form = {};
        return new Promise(function (resolve, reject) {
            headers['Accept'] = 'application/json';
            headers['Content-Type'] = 'application/json';
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
                Object.keys(parameters.$queryParameters).forEach(function (parameterName) {
                    var parameter = parameters.$queryParameters[parameterName];
                    queryParameters[parameterName] = parameter;
                });
            }
            request('GET', domain + path, body, headers, queryParameters, form, reject, resolve, errorHandlers);
        }).then(function (response) {
            return response.body;
        });
    };
    ;
    CBioPortalAPI.prototype.getCancerTypeUsingGETURL = function (parameters) {
        var queryParameters = {};
        var path = '/cancer-types/{cancerTypeId}';
        path = path.replace('{cancerTypeId}', parameters['cancerTypeId']);
        if (parameters.$queryParameters) {
            Object.keys(parameters.$queryParameters).forEach(function (parameterName) {
                var parameter = parameters.$queryParameters[parameterName];
                queryParameters[parameterName] = parameter;
            });
        }
        var keys = Object.keys(queryParameters);
        return this.domain + path + (keys.length > 0 ? '?' + (keys.map(function (key) { return key + '=' + encodeURIComponent(queryParameters[key]); }).join('&')) : '');
    };
    ;
    /**
     * Get a cancer type
     * @method
     * @name CBioPortalAPI#getCancerTypeUsingGET
     * @param {string} cancerTypeId - Cancer Type ID e.g. acc
     */
    CBioPortalAPI.prototype.getCancerTypeUsingGET = function (parameters) {
        var domain = parameters.$domain ? parameters.$domain : this.domain;
        var errorHandlers = this.errorHandlers;
        var request = this.request;
        var path = '/cancer-types/{cancerTypeId}';
        var body;
        var queryParameters = {};
        var headers = {};
        var form = {};
        return new Promise(function (resolve, reject) {
            headers['Accept'] = 'application/json';
            headers['Content-Type'] = 'application/json';
            path = path.replace('{cancerTypeId}', parameters['cancerTypeId']);
            if (parameters['cancerTypeId'] === undefined) {
                reject(new Error('Missing required  parameter: cancerTypeId'));
                return;
            }
            if (parameters.$queryParameters) {
                Object.keys(parameters.$queryParameters).forEach(function (parameterName) {
                    var parameter = parameters.$queryParameters[parameterName];
                    queryParameters[parameterName] = parameter;
                });
            }
            request('GET', domain + path, body, headers, queryParameters, form, reject, resolve, errorHandlers);
        }).then(function (response) {
            return response.body;
        });
    };
    ;
    CBioPortalAPI.prototype.getAllClinicalAttributesUsingGETURL = function (parameters) {
        var queryParameters = {};
        var path = '/clinical-attributes';
        if (parameters['studyId'] !== undefined) {
            queryParameters['studyId'] = parameters['studyId'];
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
        if (parameters.$queryParameters) {
            Object.keys(parameters.$queryParameters).forEach(function (parameterName) {
                var parameter = parameters.$queryParameters[parameterName];
                queryParameters[parameterName] = parameter;
            });
        }
        var keys = Object.keys(queryParameters);
        return this.domain + path + (keys.length > 0 ? '?' + (keys.map(function (key) { return key + '=' + encodeURIComponent(queryParameters[key]); }).join('&')) : '');
    };
    ;
    /**
     * Get all clinical attributes
     * @method
     * @name CBioPortalAPI#getAllClinicalAttributesUsingGET
     * @param {string} studyId - studyId
     * @param {string} projection - projection
     * @param {integer} pageSize - pageSize
     * @param {integer} pageNumber - pageNumber
     */
    CBioPortalAPI.prototype.getAllClinicalAttributesUsingGET = function (parameters) {
        var domain = parameters.$domain ? parameters.$domain : this.domain;
        var errorHandlers = this.errorHandlers;
        var request = this.request;
        var path = '/clinical-attributes';
        var body;
        var queryParameters = {};
        var headers = {};
        var form = {};
        return new Promise(function (resolve, reject) {
            headers['Accept'] = '*/*';
            headers['Content-Type'] = 'application/json';
            if (parameters['studyId'] !== undefined) {
                queryParameters['studyId'] = parameters['studyId'];
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
            if (parameters.$queryParameters) {
                Object.keys(parameters.$queryParameters).forEach(function (parameterName) {
                    var parameter = parameters.$queryParameters[parameterName];
                    queryParameters[parameterName] = parameter;
                });
            }
            request('GET', domain + path, body, headers, queryParameters, form, reject, resolve, errorHandlers);
        }).then(function (response) {
            return response.body;
        });
    };
    ;
    CBioPortalAPI.prototype.getClinicalAttributeUsingGETURL = function (parameters) {
        var queryParameters = {};
        var path = '/clinical-attributes/{clinicalAttributeId}';
        path = path.replace('{clinicalAttributeId}', parameters['clinicalAttributeId']);
        if (parameters.$queryParameters) {
            Object.keys(parameters.$queryParameters).forEach(function (parameterName) {
                var parameter = parameters.$queryParameters[parameterName];
                queryParameters[parameterName] = parameter;
            });
        }
        var keys = Object.keys(queryParameters);
        return this.domain + path + (keys.length > 0 ? '?' + (keys.map(function (key) { return key + '=' + encodeURIComponent(queryParameters[key]); }).join('&')) : '');
    };
    ;
    /**
     * Get a clinical attribute
     * @method
     * @name CBioPortalAPI#getClinicalAttributeUsingGET
     * @param {string} clinicalAttributeId - clinicalAttributeId
     */
    CBioPortalAPI.prototype.getClinicalAttributeUsingGET = function (parameters) {
        var domain = parameters.$domain ? parameters.$domain : this.domain;
        var errorHandlers = this.errorHandlers;
        var request = this.request;
        var path = '/clinical-attributes/{clinicalAttributeId}';
        var body;
        var queryParameters = {};
        var headers = {};
        var form = {};
        return new Promise(function (resolve, reject) {
            headers['Accept'] = '*/*';
            headers['Content-Type'] = 'application/json';
            path = path.replace('{clinicalAttributeId}', parameters['clinicalAttributeId']);
            if (parameters['clinicalAttributeId'] === undefined) {
                reject(new Error('Missing required  parameter: clinicalAttributeId'));
                return;
            }
            if (parameters.$queryParameters) {
                Object.keys(parameters.$queryParameters).forEach(function (parameterName) {
                    var parameter = parameters.$queryParameters[parameterName];
                    queryParameters[parameterName] = parameter;
                });
            }
            request('GET', domain + path, body, headers, queryParameters, form, reject, resolve, errorHandlers);
        }).then(function (response) {
            return response.body;
        });
    };
    ;
    CBioPortalAPI.prototype.fetchClinicalDataUsingPOSTURL = function (parameters) {
        var queryParameters = {};
        var path = '/clinical-data/fetch';
        if (parameters['attributeId'] !== undefined) {
            queryParameters['attributeId'] = parameters['attributeId'];
        }
        if (parameters['clinicalDataType'] !== undefined) {
            queryParameters['clinicalDataType'] = parameters['clinicalDataType'];
        }
        if (parameters['projection'] !== undefined) {
            queryParameters['projection'] = parameters['projection'];
        }
        if (parameters.$queryParameters) {
            Object.keys(parameters.$queryParameters).forEach(function (parameterName) {
                var parameter = parameters.$queryParameters[parameterName];
                queryParameters[parameterName] = parameter;
            });
        }
        var keys = Object.keys(queryParameters);
        return this.domain + path + (keys.length > 0 ? '?' + (keys.map(function (key) { return key + '=' + encodeURIComponent(queryParameters[key]); }).join('&')) : '');
    };
    ;
    /**
     * Fetch clinical data by patient IDs or sample IDs
     * @method
     * @name CBioPortalAPI#fetchClinicalDataUsingPOST
     * @param {string} attributeId - Attribute ID e.g. CANCER_TYPE
     * @param {string} clinicalDataType - Type of the clinical data
     * @param {string} projection - Level of detail of the response
     * @param {} identifiers - List of patient or sample identifiers
     */
    CBioPortalAPI.prototype.fetchClinicalDataUsingPOST = function (parameters) {
        var domain = parameters.$domain ? parameters.$domain : this.domain;
        var errorHandlers = this.errorHandlers;
        var request = this.request;
        var path = '/clinical-data/fetch';
        var body;
        var queryParameters = {};
        var headers = {};
        var form = {};
        return new Promise(function (resolve, reject) {
            headers['Accept'] = 'application/json';
            headers['Content-Type'] = 'application/json';
            if (parameters['attributeId'] !== undefined) {
                queryParameters['attributeId'] = parameters['attributeId'];
            }
            if (parameters['clinicalDataType'] !== undefined) {
                queryParameters['clinicalDataType'] = parameters['clinicalDataType'];
            }
            if (parameters['projection'] !== undefined) {
                queryParameters['projection'] = parameters['projection'];
            }
            if (parameters['identifiers'] !== undefined) {
                body = parameters['identifiers'];
            }
            if (parameters['identifiers'] === undefined) {
                reject(new Error('Missing required  parameter: identifiers'));
                return;
            }
            if (parameters.$queryParameters) {
                Object.keys(parameters.$queryParameters).forEach(function (parameterName) {
                    var parameter = parameters.$queryParameters[parameterName];
                    queryParameters[parameterName] = parameter;
                });
            }
            request('POST', domain + path, body, headers, queryParameters, form, reject, resolve, errorHandlers);
        }).then(function (response) {
            return response.body;
        });
    };
    ;
    CBioPortalAPI.prototype.getAllGenesUsingGETURL = function (parameters) {
        var queryParameters = {};
        var path = '/genes';
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
            Object.keys(parameters.$queryParameters).forEach(function (parameterName) {
                var parameter = parameters.$queryParameters[parameterName];
                queryParameters[parameterName] = parameter;
            });
        }
        var keys = Object.keys(queryParameters);
        return this.domain + path + (keys.length > 0 ? '?' + (keys.map(function (key) { return key + '=' + encodeURIComponent(queryParameters[key]); }).join('&')) : '');
    };
    ;
    /**
     * Get all genes
     * @method
     * @name CBioPortalAPI#getAllGenesUsingGET
     * @param {string} projection - Level of detail of the response
     * @param {integer} pageSize - Page size of the result list
     * @param {integer} pageNumber - Page number of the result list
     * @param {string} sortBy - Name of the property that the result list is sorted by
     * @param {string} direction - Direction of the sort
     */
    CBioPortalAPI.prototype.getAllGenesUsingGET = function (parameters) {
        var domain = parameters.$domain ? parameters.$domain : this.domain;
        var errorHandlers = this.errorHandlers;
        var request = this.request;
        var path = '/genes';
        var body;
        var queryParameters = {};
        var headers = {};
        var form = {};
        return new Promise(function (resolve, reject) {
            headers['Accept'] = 'application/json';
            headers['Content-Type'] = 'application/json';
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
                Object.keys(parameters.$queryParameters).forEach(function (parameterName) {
                    var parameter = parameters.$queryParameters[parameterName];
                    queryParameters[parameterName] = parameter;
                });
            }
            request('GET', domain + path, body, headers, queryParameters, form, reject, resolve, errorHandlers);
        }).then(function (response) {
            return response.body;
        });
    };
    ;
    CBioPortalAPI.prototype.fetchGenesUsingPOSTURL = function (parameters) {
        var queryParameters = {};
        var path = '/genes/fetch';
        if (parameters['projection'] !== undefined) {
            queryParameters['projection'] = parameters['projection'];
        }
        if (parameters.$queryParameters) {
            Object.keys(parameters.$queryParameters).forEach(function (parameterName) {
                var parameter = parameters.$queryParameters[parameterName];
                queryParameters[parameterName] = parameter;
            });
        }
        var keys = Object.keys(queryParameters);
        return this.domain + path + (keys.length > 0 ? '?' + (keys.map(function (key) { return key + '=' + encodeURIComponent(queryParameters[key]); }).join('&')) : '');
    };
    ;
    /**
     * Fetch genes by ID
     * @method
     * @name CBioPortalAPI#fetchGenesUsingPOST
     * @param {string} projection - Level of detail of the response
     * @param {} geneIds - List of Entrez Gene IDs and/or Hugo Gene Symbols
     */
    CBioPortalAPI.prototype.fetchGenesUsingPOST = function (parameters) {
        var domain = parameters.$domain ? parameters.$domain : this.domain;
        var errorHandlers = this.errorHandlers;
        var request = this.request;
        var path = '/genes/fetch';
        var body;
        var queryParameters = {};
        var headers = {};
        var form = {};
        return new Promise(function (resolve, reject) {
            headers['Accept'] = 'application/json';
            headers['Content-Type'] = 'application/json';
            if (parameters['projection'] !== undefined) {
                queryParameters['projection'] = parameters['projection'];
            }
            if (parameters['geneIds'] !== undefined) {
                body = parameters['geneIds'];
            }
            if (parameters['geneIds'] === undefined) {
                reject(new Error('Missing required  parameter: geneIds'));
                return;
            }
            if (parameters.$queryParameters) {
                Object.keys(parameters.$queryParameters).forEach(function (parameterName) {
                    var parameter = parameters.$queryParameters[parameterName];
                    queryParameters[parameterName] = parameter;
                });
            }
            request('POST', domain + path, body, headers, queryParameters, form, reject, resolve, errorHandlers);
        }).then(function (response) {
            return response.body;
        });
    };
    ;
    CBioPortalAPI.prototype.getGeneUsingGETURL = function (parameters) {
        var queryParameters = {};
        var path = '/genes/{geneId}';
        path = path.replace('{geneId}', parameters['geneId']);
        if (parameters.$queryParameters) {
            Object.keys(parameters.$queryParameters).forEach(function (parameterName) {
                var parameter = parameters.$queryParameters[parameterName];
                queryParameters[parameterName] = parameter;
            });
        }
        var keys = Object.keys(queryParameters);
        return this.domain + path + (keys.length > 0 ? '?' + (keys.map(function (key) { return key + '=' + encodeURIComponent(queryParameters[key]); }).join('&')) : '');
    };
    ;
    /**
     * Get a gene
     * @method
     * @name CBioPortalAPI#getGeneUsingGET
     * @param {string} geneId - Entrez Gene ID or Hugo Gene Symbol e.g. 1 or A1BG
     */
    CBioPortalAPI.prototype.getGeneUsingGET = function (parameters) {
        var domain = parameters.$domain ? parameters.$domain : this.domain;
        var errorHandlers = this.errorHandlers;
        var request = this.request;
        var path = '/genes/{geneId}';
        var body;
        var queryParameters = {};
        var headers = {};
        var form = {};
        return new Promise(function (resolve, reject) {
            headers['Accept'] = 'application/json';
            headers['Content-Type'] = 'application/json';
            path = path.replace('{geneId}', parameters['geneId']);
            if (parameters['geneId'] === undefined) {
                reject(new Error('Missing required  parameter: geneId'));
                return;
            }
            if (parameters.$queryParameters) {
                Object.keys(parameters.$queryParameters).forEach(function (parameterName) {
                    var parameter = parameters.$queryParameters[parameterName];
                    queryParameters[parameterName] = parameter;
                });
            }
            request('GET', domain + path, body, headers, queryParameters, form, reject, resolve, errorHandlers);
        }).then(function (response) {
            return response.body;
        });
    };
    ;
    CBioPortalAPI.prototype.getAliasesOfGeneUsingGETURL = function (parameters) {
        var queryParameters = {};
        var path = '/genes/{geneId}/aliases';
        path = path.replace('{geneId}', parameters['geneId']);
        if (parameters.$queryParameters) {
            Object.keys(parameters.$queryParameters).forEach(function (parameterName) {
                var parameter = parameters.$queryParameters[parameterName];
                queryParameters[parameterName] = parameter;
            });
        }
        var keys = Object.keys(queryParameters);
        return this.domain + path + (keys.length > 0 ? '?' + (keys.map(function (key) { return key + '=' + encodeURIComponent(queryParameters[key]); }).join('&')) : '');
    };
    ;
    /**
     * Get aliases of a gene
     * @method
     * @name CBioPortalAPI#getAliasesOfGeneUsingGET
     * @param {string} geneId - Entrez Gene ID or Hugo Gene Symbol e.g. 1 or A1BG
     */
    CBioPortalAPI.prototype.getAliasesOfGeneUsingGET = function (parameters) {
        var domain = parameters.$domain ? parameters.$domain : this.domain;
        var errorHandlers = this.errorHandlers;
        var request = this.request;
        var path = '/genes/{geneId}/aliases';
        var body;
        var queryParameters = {};
        var headers = {};
        var form = {};
        return new Promise(function (resolve, reject) {
            headers['Accept'] = 'application/json';
            headers['Content-Type'] = 'application/json';
            path = path.replace('{geneId}', parameters['geneId']);
            if (parameters['geneId'] === undefined) {
                reject(new Error('Missing required  parameter: geneId'));
                return;
            }
            if (parameters.$queryParameters) {
                Object.keys(parameters.$queryParameters).forEach(function (parameterName) {
                    var parameter = parameters.$queryParameters[parameterName];
                    queryParameters[parameterName] = parameter;
                });
            }
            request('GET', domain + path, body, headers, queryParameters, form, reject, resolve, errorHandlers);
        }).then(function (response) {
            return response.body;
        });
    };
    ;
    CBioPortalAPI.prototype.queryGeneticDataByExampleUsingPOSTURL = function (parameters) {
        var queryParameters = {};
        var path = '/genetic-data/query';
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
            Object.keys(parameters.$queryParameters).forEach(function (parameterName) {
                var parameter = parameters.$queryParameters[parameterName];
                queryParameters[parameterName] = parameter;
            });
        }
        var keys = Object.keys(queryParameters);
        return this.domain + path + (keys.length > 0 ? '?' + (keys.map(function (key) { return key + '=' + encodeURIComponent(queryParameters[key]); }).join('&')) : '');
    };
    ;
    /**
     * Query genetic data by example
     * @method
     * @name CBioPortalAPI#queryGeneticDataByExampleUsingPOST
     * @param {string} projection - projection
     * @param {integer} pageSize - pageSize
     * @param {integer} pageNumber - pageNumber
     * @param {} exampleGenericData - exampleGenericData
     */
    CBioPortalAPI.prototype.queryGeneticDataByExampleUsingPOST = function (parameters) {
        var domain = parameters.$domain ? parameters.$domain : this.domain;
        var errorHandlers = this.errorHandlers;
        var request = this.request;
        var path = '/genetic-data/query';
        var body;
        var queryParameters = {};
        var headers = {};
        var form = {};
        return new Promise(function (resolve, reject) {
            headers['Accept'] = '*/*';
            headers['Content-Type'] = 'application/json';
            if (parameters['projection'] !== undefined) {
                queryParameters['projection'] = parameters['projection'];
            }
            if (parameters['pageSize'] !== undefined) {
                queryParameters['pageSize'] = parameters['pageSize'];
            }
            if (parameters['pageNumber'] !== undefined) {
                queryParameters['pageNumber'] = parameters['pageNumber'];
            }
            if (parameters['exampleGenericData'] !== undefined) {
                body = parameters['exampleGenericData'];
            }
            if (parameters['exampleGenericData'] === undefined) {
                reject(new Error('Missing required  parameter: exampleGenericData'));
                return;
            }
            if (parameters.$queryParameters) {
                Object.keys(parameters.$queryParameters).forEach(function (parameterName) {
                    var parameter = parameters.$queryParameters[parameterName];
                    queryParameters[parameterName] = parameter;
                });
            }
            request('POST', domain + path, body, headers, queryParameters, form, reject, resolve, errorHandlers);
        }).then(function (response) {
            return response.body;
        });
    };
    ;
    CBioPortalAPI.prototype.getAllGeneticProfilesUsingGETURL = function (parameters) {
        var queryParameters = {};
        var path = '/genetic-profiles';
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
            Object.keys(parameters.$queryParameters).forEach(function (parameterName) {
                var parameter = parameters.$queryParameters[parameterName];
                queryParameters[parameterName] = parameter;
            });
        }
        var keys = Object.keys(queryParameters);
        return this.domain + path + (keys.length > 0 ? '?' + (keys.map(function (key) { return key + '=' + encodeURIComponent(queryParameters[key]); }).join('&')) : '');
    };
    ;
    /**
     * Get all genetic profiles
     * @method
     * @name CBioPortalAPI#getAllGeneticProfilesUsingGET
     * @param {string} projection - Level of detail of the response
     * @param {integer} pageSize - Page size of the result list
     * @param {integer} pageNumber - Page number of the result list
     * @param {string} sortBy - Name of the property that the result list is sorted by
     * @param {string} direction - Direction of the sort
     */
    CBioPortalAPI.prototype.getAllGeneticProfilesUsingGET = function (parameters) {
        var domain = parameters.$domain ? parameters.$domain : this.domain;
        var errorHandlers = this.errorHandlers;
        var request = this.request;
        var path = '/genetic-profiles';
        var body;
        var queryParameters = {};
        var headers = {};
        var form = {};
        return new Promise(function (resolve, reject) {
            headers['Accept'] = 'application/json';
            headers['Content-Type'] = 'application/json';
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
                Object.keys(parameters.$queryParameters).forEach(function (parameterName) {
                    var parameter = parameters.$queryParameters[parameterName];
                    queryParameters[parameterName] = parameter;
                });
            }
            request('GET', domain + path, body, headers, queryParameters, form, reject, resolve, errorHandlers);
        }).then(function (response) {
            return response.body;
        });
    };
    ;
    CBioPortalAPI.prototype.getGeneticProfileUsingGETURL = function (parameters) {
        var queryParameters = {};
        var path = '/genetic-profiles/{geneticProfileId}';
        path = path.replace('{geneticProfileId}', parameters['geneticProfileId']);
        if (parameters.$queryParameters) {
            Object.keys(parameters.$queryParameters).forEach(function (parameterName) {
                var parameter = parameters.$queryParameters[parameterName];
                queryParameters[parameterName] = parameter;
            });
        }
        var keys = Object.keys(queryParameters);
        return this.domain + path + (keys.length > 0 ? '?' + (keys.map(function (key) { return key + '=' + encodeURIComponent(queryParameters[key]); }).join('&')) : '');
    };
    ;
    /**
     * Get genetic profile
     * @method
     * @name CBioPortalAPI#getGeneticProfileUsingGET
     * @param {string} geneticProfileId - Genetic Profile ID e.g. acc_tcga_mutations
     */
    CBioPortalAPI.prototype.getGeneticProfileUsingGET = function (parameters) {
        var domain = parameters.$domain ? parameters.$domain : this.domain;
        var errorHandlers = this.errorHandlers;
        var request = this.request;
        var path = '/genetic-profiles/{geneticProfileId}';
        var body;
        var queryParameters = {};
        var headers = {};
        var form = {};
        return new Promise(function (resolve, reject) {
            headers['Accept'] = 'application/json';
            headers['Content-Type'] = 'application/json';
            path = path.replace('{geneticProfileId}', parameters['geneticProfileId']);
            if (parameters['geneticProfileId'] === undefined) {
                reject(new Error('Missing required  parameter: geneticProfileId'));
                return;
            }
            if (parameters.$queryParameters) {
                Object.keys(parameters.$queryParameters).forEach(function (parameterName) {
                    var parameter = parameters.$queryParameters[parameterName];
                    queryParameters[parameterName] = parameter;
                });
            }
            request('GET', domain + path, body, headers, queryParameters, form, reject, resolve, errorHandlers);
        }).then(function (response) {
            return response.body;
        });
    };
    ;
    CBioPortalAPI.prototype.getAllGeneticDataInGeneticProfileUsingGETURL = function (parameters) {
        var queryParameters = {};
        var path = '/genetic-profiles/{geneticProfileId}/genetic-data';
        path = path.replace('{geneticProfileId}', parameters['geneticProfileId']);
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
            Object.keys(parameters.$queryParameters).forEach(function (parameterName) {
                var parameter = parameters.$queryParameters[parameterName];
                queryParameters[parameterName] = parameter;
            });
        }
        var keys = Object.keys(queryParameters);
        return this.domain + path + (keys.length > 0 ? '?' + (keys.map(function (key) { return key + '=' + encodeURIComponent(queryParameters[key]); }).join('&')) : '');
    };
    ;
    /**
     * Get all genetic data in a genetic profile
     * @method
     * @name CBioPortalAPI#getAllGeneticDataInGeneticProfileUsingGET
     * @param {string} geneticProfileId - geneticProfileId
     * @param {string} projection - projection
     * @param {integer} pageSize - pageSize
     * @param {integer} pageNumber - pageNumber
     */
    CBioPortalAPI.prototype.getAllGeneticDataInGeneticProfileUsingGET = function (parameters) {
        var domain = parameters.$domain ? parameters.$domain : this.domain;
        var errorHandlers = this.errorHandlers;
        var request = this.request;
        var path = '/genetic-profiles/{geneticProfileId}/genetic-data';
        var body;
        var queryParameters = {};
        var headers = {};
        var form = {};
        return new Promise(function (resolve, reject) {
            headers['Accept'] = '*/*';
            headers['Content-Type'] = 'application/json';
            path = path.replace('{geneticProfileId}', parameters['geneticProfileId']);
            if (parameters['geneticProfileId'] === undefined) {
                reject(new Error('Missing required  parameter: geneticProfileId'));
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
            if (parameters.$queryParameters) {
                Object.keys(parameters.$queryParameters).forEach(function (parameterName) {
                    var parameter = parameters.$queryParameters[parameterName];
                    queryParameters[parameterName] = parameter;
                });
            }
            request('GET', domain + path, body, headers, queryParameters, form, reject, resolve, errorHandlers);
        }).then(function (response) {
            return response.body;
        });
    };
    ;
    CBioPortalAPI.prototype.queryMutationsByExampleUsingPOSTURL = function (parameters) {
        var queryParameters = {};
        var path = '/mutations/query';
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
            Object.keys(parameters.$queryParameters).forEach(function (parameterName) {
                var parameter = parameters.$queryParameters[parameterName];
                queryParameters[parameterName] = parameter;
            });
        }
        var keys = Object.keys(queryParameters);
        return this.domain + path + (keys.length > 0 ? '?' + (keys.map(function (key) { return key + '=' + encodeURIComponent(queryParameters[key]); }).join('&')) : '');
    };
    ;
    /**
     * Query mutations by example
     * @method
     * @name CBioPortalAPI#queryMutationsByExampleUsingPOST
     * @param {string} projection - projection
     * @param {integer} pageSize - pageSize
     * @param {integer} pageNumber - pageNumber
     * @param {} exampleMutation - exampleMutation
     */
    CBioPortalAPI.prototype.queryMutationsByExampleUsingPOST = function (parameters) {
        var domain = parameters.$domain ? parameters.$domain : this.domain;
        var errorHandlers = this.errorHandlers;
        var request = this.request;
        var path = '/mutations/query';
        var body;
        var queryParameters = {};
        var headers = {};
        var form = {};
        return new Promise(function (resolve, reject) {
            headers['Accept'] = '*/*';
            headers['Content-Type'] = 'application/json';
            if (parameters['projection'] !== undefined) {
                queryParameters['projection'] = parameters['projection'];
            }
            if (parameters['pageSize'] !== undefined) {
                queryParameters['pageSize'] = parameters['pageSize'];
            }
            if (parameters['pageNumber'] !== undefined) {
                queryParameters['pageNumber'] = parameters['pageNumber'];
            }
            if (parameters['exampleMutation'] !== undefined) {
                body = parameters['exampleMutation'];
            }
            if (parameters['exampleMutation'] === undefined) {
                reject(new Error('Missing required  parameter: exampleMutation'));
                return;
            }
            if (parameters.$queryParameters) {
                Object.keys(parameters.$queryParameters).forEach(function (parameterName) {
                    var parameter = parameters.$queryParameters[parameterName];
                    queryParameters[parameterName] = parameter;
                });
            }
            request('POST', domain + path, body, headers, queryParameters, form, reject, resolve, errorHandlers);
        }).then(function (response) {
            return response.body;
        });
    };
    ;
    CBioPortalAPI.prototype.fetchPatientsUsingPOSTURL = function (parameters) {
        var queryParameters = {};
        var path = '/patients/fetch';
        if (parameters['projection'] !== undefined) {
            queryParameters['projection'] = parameters['projection'];
        }
        if (parameters.$queryParameters) {
            Object.keys(parameters.$queryParameters).forEach(function (parameterName) {
                var parameter = parameters.$queryParameters[parameterName];
                queryParameters[parameterName] = parameter;
            });
        }
        var keys = Object.keys(queryParameters);
        return this.domain + path + (keys.length > 0 ? '?' + (keys.map(function (key) { return key + '=' + encodeURIComponent(queryParameters[key]); }).join('&')) : '');
    };
    ;
    /**
     * Fetch patients by ID
     * @method
     * @name CBioPortalAPI#fetchPatientsUsingPOST
     * @param {string} projection - Level of detail of the response
     * @param {} patientIdentifiers - List of patient identifiers
     */
    CBioPortalAPI.prototype.fetchPatientsUsingPOST = function (parameters) {
        var domain = parameters.$domain ? parameters.$domain : this.domain;
        var errorHandlers = this.errorHandlers;
        var request = this.request;
        var path = '/patients/fetch';
        var body;
        var queryParameters = {};
        var headers = {};
        var form = {};
        return new Promise(function (resolve, reject) {
            headers['Accept'] = 'application/json';
            headers['Content-Type'] = 'application/json';
            if (parameters['projection'] !== undefined) {
                queryParameters['projection'] = parameters['projection'];
            }
            if (parameters['patientIdentifiers'] !== undefined) {
                body = parameters['patientIdentifiers'];
            }
            if (parameters['patientIdentifiers'] === undefined) {
                reject(new Error('Missing required  parameter: patientIdentifiers'));
                return;
            }
            if (parameters.$queryParameters) {
                Object.keys(parameters.$queryParameters).forEach(function (parameterName) {
                    var parameter = parameters.$queryParameters[parameterName];
                    queryParameters[parameterName] = parameter;
                });
            }
            request('POST', domain + path, body, headers, queryParameters, form, reject, resolve, errorHandlers);
        }).then(function (response) {
            return response.body;
        });
    };
    ;
    CBioPortalAPI.prototype.getAllSampleListsUsingGETURL = function (parameters) {
        var queryParameters = {};
        var path = '/sample-lists';
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
            Object.keys(parameters.$queryParameters).forEach(function (parameterName) {
                var parameter = parameters.$queryParameters[parameterName];
                queryParameters[parameterName] = parameter;
            });
        }
        var keys = Object.keys(queryParameters);
        return this.domain + path + (keys.length > 0 ? '?' + (keys.map(function (key) { return key + '=' + encodeURIComponent(queryParameters[key]); }).join('&')) : '');
    };
    ;
    /**
     * Get all sample lists
     * @method
     * @name CBioPortalAPI#getAllSampleListsUsingGET
     * @param {string} projection - Level of detail of the response
     * @param {integer} pageSize - Page size of the result list
     * @param {integer} pageNumber - Page number of the result list
     * @param {string} sortBy - Name of the property that the result list is sorted by
     * @param {string} direction - Direction of the sort
     */
    CBioPortalAPI.prototype.getAllSampleListsUsingGET = function (parameters) {
        var domain = parameters.$domain ? parameters.$domain : this.domain;
        var errorHandlers = this.errorHandlers;
        var request = this.request;
        var path = '/sample-lists';
        var body;
        var queryParameters = {};
        var headers = {};
        var form = {};
        return new Promise(function (resolve, reject) {
            headers['Accept'] = 'application/json';
            headers['Content-Type'] = 'application/json';
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
                Object.keys(parameters.$queryParameters).forEach(function (parameterName) {
                    var parameter = parameters.$queryParameters[parameterName];
                    queryParameters[parameterName] = parameter;
                });
            }
            request('GET', domain + path, body, headers, queryParameters, form, reject, resolve, errorHandlers);
        }).then(function (response) {
            return response.body;
        });
    };
    ;
    CBioPortalAPI.prototype.getSampleListUsingGETURL = function (parameters) {
        var queryParameters = {};
        var path = '/sample-lists/{sampleListId}';
        path = path.replace('{sampleListId}', parameters['sampleListId']);
        if (parameters.$queryParameters) {
            Object.keys(parameters.$queryParameters).forEach(function (parameterName) {
                var parameter = parameters.$queryParameters[parameterName];
                queryParameters[parameterName] = parameter;
            });
        }
        var keys = Object.keys(queryParameters);
        return this.domain + path + (keys.length > 0 ? '?' + (keys.map(function (key) { return key + '=' + encodeURIComponent(queryParameters[key]); }).join('&')) : '');
    };
    ;
    /**
     * Get sample list
     * @method
     * @name CBioPortalAPI#getSampleListUsingGET
     * @param {string} sampleListId - Sample List ID e.g. acc_tcga_all
     */
    CBioPortalAPI.prototype.getSampleListUsingGET = function (parameters) {
        var domain = parameters.$domain ? parameters.$domain : this.domain;
        var errorHandlers = this.errorHandlers;
        var request = this.request;
        var path = '/sample-lists/{sampleListId}';
        var body;
        var queryParameters = {};
        var headers = {};
        var form = {};
        return new Promise(function (resolve, reject) {
            headers['Accept'] = 'application/json';
            headers['Content-Type'] = 'application/json';
            path = path.replace('{sampleListId}', parameters['sampleListId']);
            if (parameters['sampleListId'] === undefined) {
                reject(new Error('Missing required  parameter: sampleListId'));
                return;
            }
            if (parameters.$queryParameters) {
                Object.keys(parameters.$queryParameters).forEach(function (parameterName) {
                    var parameter = parameters.$queryParameters[parameterName];
                    queryParameters[parameterName] = parameter;
                });
            }
            request('GET', domain + path, body, headers, queryParameters, form, reject, resolve, errorHandlers);
        }).then(function (response) {
            return response.body;
        });
    };
    ;
    CBioPortalAPI.prototype.getAllSampleIdsInSampleListUsingGETURL = function (parameters) {
        var queryParameters = {};
        var path = '/sample-lists/{sampleListId}/sample-ids';
        path = path.replace('{sampleListId}', parameters['sampleListId']);
        if (parameters.$queryParameters) {
            Object.keys(parameters.$queryParameters).forEach(function (parameterName) {
                var parameter = parameters.$queryParameters[parameterName];
                queryParameters[parameterName] = parameter;
            });
        }
        var keys = Object.keys(queryParameters);
        return this.domain + path + (keys.length > 0 ? '?' + (keys.map(function (key) { return key + '=' + encodeURIComponent(queryParameters[key]); }).join('&')) : '');
    };
    ;
    /**
     * Get all sample IDs in a sample list
     * @method
     * @name CBioPortalAPI#getAllSampleIdsInSampleListUsingGET
     * @param {string} sampleListId - Sample List ID e.g. acc_tcga_all
     */
    CBioPortalAPI.prototype.getAllSampleIdsInSampleListUsingGET = function (parameters) {
        var domain = parameters.$domain ? parameters.$domain : this.domain;
        var errorHandlers = this.errorHandlers;
        var request = this.request;
        var path = '/sample-lists/{sampleListId}/sample-ids';
        var body;
        var queryParameters = {};
        var headers = {};
        var form = {};
        return new Promise(function (resolve, reject) {
            headers['Accept'] = 'application/json';
            headers['Content-Type'] = 'application/json';
            path = path.replace('{sampleListId}', parameters['sampleListId']);
            if (parameters['sampleListId'] === undefined) {
                reject(new Error('Missing required  parameter: sampleListId'));
                return;
            }
            if (parameters.$queryParameters) {
                Object.keys(parameters.$queryParameters).forEach(function (parameterName) {
                    var parameter = parameters.$queryParameters[parameterName];
                    queryParameters[parameterName] = parameter;
                });
            }
            request('GET', domain + path, body, headers, queryParameters, form, reject, resolve, errorHandlers);
        }).then(function (response) {
            return response.body;
        });
    };
    ;
    CBioPortalAPI.prototype.fetchSamplesUsingPOSTURL = function (parameters) {
        var queryParameters = {};
        var path = '/samples/fetch';
        if (parameters['projection'] !== undefined) {
            queryParameters['projection'] = parameters['projection'];
        }
        if (parameters.$queryParameters) {
            Object.keys(parameters.$queryParameters).forEach(function (parameterName) {
                var parameter = parameters.$queryParameters[parameterName];
                queryParameters[parameterName] = parameter;
            });
        }
        var keys = Object.keys(queryParameters);
        return this.domain + path + (keys.length > 0 ? '?' + (keys.map(function (key) { return key + '=' + encodeURIComponent(queryParameters[key]); }).join('&')) : '');
    };
    ;
    /**
     * Fetch samples by ID
     * @method
     * @name CBioPortalAPI#fetchSamplesUsingPOST
     * @param {string} projection - Level of detail of the response
     * @param {} sampleIdentifiers - List of sample identifiers
     */
    CBioPortalAPI.prototype.fetchSamplesUsingPOST = function (parameters) {
        var domain = parameters.$domain ? parameters.$domain : this.domain;
        var errorHandlers = this.errorHandlers;
        var request = this.request;
        var path = '/samples/fetch';
        var body;
        var queryParameters = {};
        var headers = {};
        var form = {};
        return new Promise(function (resolve, reject) {
            headers['Accept'] = 'application/json';
            headers['Content-Type'] = 'application/json';
            if (parameters['projection'] !== undefined) {
                queryParameters['projection'] = parameters['projection'];
            }
            if (parameters['sampleIdentifiers'] !== undefined) {
                body = parameters['sampleIdentifiers'];
            }
            if (parameters['sampleIdentifiers'] === undefined) {
                reject(new Error('Missing required  parameter: sampleIdentifiers'));
                return;
            }
            if (parameters.$queryParameters) {
                Object.keys(parameters.$queryParameters).forEach(function (parameterName) {
                    var parameter = parameters.$queryParameters[parameterName];
                    queryParameters[parameterName] = parameter;
                });
            }
            request('POST', domain + path, body, headers, queryParameters, form, reject, resolve, errorHandlers);
        }).then(function (response) {
            return response.body;
        });
    };
    ;
    CBioPortalAPI.prototype.getAllStudiesUsingGETURL = function (parameters) {
        var queryParameters = {};
        var path = '/studies';
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
            Object.keys(parameters.$queryParameters).forEach(function (parameterName) {
                var parameter = parameters.$queryParameters[parameterName];
                queryParameters[parameterName] = parameter;
            });
        }
        var keys = Object.keys(queryParameters);
        return this.domain + path + (keys.length > 0 ? '?' + (keys.map(function (key) { return key + '=' + encodeURIComponent(queryParameters[key]); }).join('&')) : '');
    };
    ;
    /**
     * Get all studies
     * @method
     * @name CBioPortalAPI#getAllStudiesUsingGET
     * @param {string} projection - Level of detail of the response
     * @param {integer} pageSize - Page size of the result list
     * @param {integer} pageNumber - Page number of the result list
     * @param {string} sortBy - Name of the property that the result list is sorted by
     * @param {string} direction - Direction of the sort
     */
    CBioPortalAPI.prototype.getAllStudiesUsingGET = function (parameters) {
        var domain = parameters.$domain ? parameters.$domain : this.domain;
        var errorHandlers = this.errorHandlers;
        var request = this.request;
        var path = '/studies';
        var body;
        var queryParameters = {};
        var headers = {};
        var form = {};
        return new Promise(function (resolve, reject) {
            headers['Accept'] = 'application/json';
            headers['Content-Type'] = 'application/json';
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
                Object.keys(parameters.$queryParameters).forEach(function (parameterName) {
                    var parameter = parameters.$queryParameters[parameterName];
                    queryParameters[parameterName] = parameter;
                });
            }
            request('GET', domain + path, body, headers, queryParameters, form, reject, resolve, errorHandlers);
        }).then(function (response) {
            return response.body;
        });
    };
    ;
    CBioPortalAPI.prototype.getStudyUsingGETURL = function (parameters) {
        var queryParameters = {};
        var path = '/studies/{studyId}';
        path = path.replace('{studyId}', parameters['studyId']);
        if (parameters.$queryParameters) {
            Object.keys(parameters.$queryParameters).forEach(function (parameterName) {
                var parameter = parameters.$queryParameters[parameterName];
                queryParameters[parameterName] = parameter;
            });
        }
        var keys = Object.keys(queryParameters);
        return this.domain + path + (keys.length > 0 ? '?' + (keys.map(function (key) { return key + '=' + encodeURIComponent(queryParameters[key]); }).join('&')) : '');
    };
    ;
    /**
     * Get a study
     * @method
     * @name CBioPortalAPI#getStudyUsingGET
     * @param {string} studyId - Study ID e.g. acc_tcga
     */
    CBioPortalAPI.prototype.getStudyUsingGET = function (parameters) {
        var domain = parameters.$domain ? parameters.$domain : this.domain;
        var errorHandlers = this.errorHandlers;
        var request = this.request;
        var path = '/studies/{studyId}';
        var body;
        var queryParameters = {};
        var headers = {};
        var form = {};
        return new Promise(function (resolve, reject) {
            headers['Accept'] = 'application/json';
            headers['Content-Type'] = 'application/json';
            path = path.replace('{studyId}', parameters['studyId']);
            if (parameters['studyId'] === undefined) {
                reject(new Error('Missing required  parameter: studyId'));
                return;
            }
            if (parameters.$queryParameters) {
                Object.keys(parameters.$queryParameters).forEach(function (parameterName) {
                    var parameter = parameters.$queryParameters[parameterName];
                    queryParameters[parameterName] = parameter;
                });
            }
            request('GET', domain + path, body, headers, queryParameters, form, reject, resolve, errorHandlers);
        }).then(function (response) {
            return response.body;
        });
    };
    ;
    CBioPortalAPI.prototype.getAllClinicalDataInStudyUsingGETURL = function (parameters) {
        var queryParameters = {};
        var path = '/studies/{studyId}/clinical-data';
        path = path.replace('{studyId}', parameters['studyId']);
        if (parameters['attributeId'] !== undefined) {
            queryParameters['attributeId'] = parameters['attributeId'];
        }
        if (parameters['clinicalDataType'] !== undefined) {
            queryParameters['clinicalDataType'] = parameters['clinicalDataType'];
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
            Object.keys(parameters.$queryParameters).forEach(function (parameterName) {
                var parameter = parameters.$queryParameters[parameterName];
                queryParameters[parameterName] = parameter;
            });
        }
        var keys = Object.keys(queryParameters);
        return this.domain + path + (keys.length > 0 ? '?' + (keys.map(function (key) { return key + '=' + encodeURIComponent(queryParameters[key]); }).join('&')) : '');
    };
    ;
    /**
     * Get all clinical data in a study
     * @method
     * @name CBioPortalAPI#getAllClinicalDataInStudyUsingGET
     * @param {string} studyId - Study ID e.g. acc_tcga
     * @param {string} attributeId - Attribute ID e.g. CANCER_TYPE
     * @param {string} clinicalDataType - Type of the clinical data
     * @param {string} projection - Level of detail of the response
     * @param {integer} pageSize - Page size of the result list
     * @param {integer} pageNumber - Page number of the result list
     * @param {string} sortBy - Name of the property that the result list is sorted by
     * @param {string} direction - Direction of the sort
     */
    CBioPortalAPI.prototype.getAllClinicalDataInStudyUsingGET = function (parameters) {
        var domain = parameters.$domain ? parameters.$domain : this.domain;
        var errorHandlers = this.errorHandlers;
        var request = this.request;
        var path = '/studies/{studyId}/clinical-data';
        var body;
        var queryParameters = {};
        var headers = {};
        var form = {};
        return new Promise(function (resolve, reject) {
            headers['Accept'] = 'application/json';
            headers['Content-Type'] = 'application/json';
            path = path.replace('{studyId}', parameters['studyId']);
            if (parameters['studyId'] === undefined) {
                reject(new Error('Missing required  parameter: studyId'));
                return;
            }
            if (parameters['attributeId'] !== undefined) {
                queryParameters['attributeId'] = parameters['attributeId'];
            }
            if (parameters['clinicalDataType'] !== undefined) {
                queryParameters['clinicalDataType'] = parameters['clinicalDataType'];
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
                Object.keys(parameters.$queryParameters).forEach(function (parameterName) {
                    var parameter = parameters.$queryParameters[parameterName];
                    queryParameters[parameterName] = parameter;
                });
            }
            request('GET', domain + path, body, headers, queryParameters, form, reject, resolve, errorHandlers);
        }).then(function (response) {
            return response.body;
        });
    };
    ;
    CBioPortalAPI.prototype.getAllGeneticProfilesInStudyUsingGETURL = function (parameters) {
        var queryParameters = {};
        var path = '/studies/{studyId}/genetic-profiles';
        path = path.replace('{studyId}', parameters['studyId']);
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
            Object.keys(parameters.$queryParameters).forEach(function (parameterName) {
                var parameter = parameters.$queryParameters[parameterName];
                queryParameters[parameterName] = parameter;
            });
        }
        var keys = Object.keys(queryParameters);
        return this.domain + path + (keys.length > 0 ? '?' + (keys.map(function (key) { return key + '=' + encodeURIComponent(queryParameters[key]); }).join('&')) : '');
    };
    ;
    /**
     * Get all genetic profiles in a study
     * @method
     * @name CBioPortalAPI#getAllGeneticProfilesInStudyUsingGET
     * @param {string} studyId - Study ID e.g. acc_tcga
     * @param {string} projection - Level of detail of the response
     * @param {integer} pageSize - Page size of the result list
     * @param {integer} pageNumber - Page number of the result list
     * @param {string} sortBy - Name of the property that the result list is sorted by
     * @param {string} direction - Direction of the sort
     */
    CBioPortalAPI.prototype.getAllGeneticProfilesInStudyUsingGET = function (parameters) {
        var domain = parameters.$domain ? parameters.$domain : this.domain;
        var errorHandlers = this.errorHandlers;
        var request = this.request;
        var path = '/studies/{studyId}/genetic-profiles';
        var body;
        var queryParameters = {};
        var headers = {};
        var form = {};
        return new Promise(function (resolve, reject) {
            headers['Accept'] = 'application/json';
            headers['Content-Type'] = 'application/json';
            path = path.replace('{studyId}', parameters['studyId']);
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
                Object.keys(parameters.$queryParameters).forEach(function (parameterName) {
                    var parameter = parameters.$queryParameters[parameterName];
                    queryParameters[parameterName] = parameter;
                });
            }
            request('GET', domain + path, body, headers, queryParameters, form, reject, resolve, errorHandlers);
        }).then(function (response) {
            return response.body;
        });
    };
    ;
    CBioPortalAPI.prototype.getAllMutationsInStudyUsingGETURL = function (parameters) {
        var queryParameters = {};
        var path = '/studies/{studyId}/mutations';
        path = path.replace('{studyId}', parameters['studyId']);
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
            Object.keys(parameters.$queryParameters).forEach(function (parameterName) {
                var parameter = parameters.$queryParameters[parameterName];
                queryParameters[parameterName] = parameter;
            });
        }
        var keys = Object.keys(queryParameters);
        return this.domain + path + (keys.length > 0 ? '?' + (keys.map(function (key) { return key + '=' + encodeURIComponent(queryParameters[key]); }).join('&')) : '');
    };
    ;
    /**
     * Get all mutations in a study
     * @method
     * @name CBioPortalAPI#getAllMutationsInStudyUsingGET
     * @param {string} studyId - studyId
     * @param {string} projection - projection
     * @param {integer} pageSize - pageSize
     * @param {integer} pageNumber - pageNumber
     */
    CBioPortalAPI.prototype.getAllMutationsInStudyUsingGET = function (parameters) {
        var domain = parameters.$domain ? parameters.$domain : this.domain;
        var errorHandlers = this.errorHandlers;
        var request = this.request;
        var path = '/studies/{studyId}/mutations';
        var body;
        var queryParameters = {};
        var headers = {};
        var form = {};
        return new Promise(function (resolve, reject) {
            headers['Accept'] = '*/*';
            headers['Content-Type'] = 'application/json';
            path = path.replace('{studyId}', parameters['studyId']);
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
            if (parameters.$queryParameters) {
                Object.keys(parameters.$queryParameters).forEach(function (parameterName) {
                    var parameter = parameters.$queryParameters[parameterName];
                    queryParameters[parameterName] = parameter;
                });
            }
            request('GET', domain + path, body, headers, queryParameters, form, reject, resolve, errorHandlers);
        }).then(function (response) {
            return response.body;
        });
    };
    ;
    CBioPortalAPI.prototype.getAllPatientsInStudyUsingGETURL = function (parameters) {
        var queryParameters = {};
        var path = '/studies/{studyId}/patients';
        path = path.replace('{studyId}', parameters['studyId']);
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
            Object.keys(parameters.$queryParameters).forEach(function (parameterName) {
                var parameter = parameters.$queryParameters[parameterName];
                queryParameters[parameterName] = parameter;
            });
        }
        var keys = Object.keys(queryParameters);
        return this.domain + path + (keys.length > 0 ? '?' + (keys.map(function (key) { return key + '=' + encodeURIComponent(queryParameters[key]); }).join('&')) : '');
    };
    ;
    /**
     * Get all patients in a study
     * @method
     * @name CBioPortalAPI#getAllPatientsInStudyUsingGET
     * @param {string} studyId - Study ID e.g. acc_tcga
     * @param {string} projection - Level of detail of the response
     * @param {integer} pageSize - Page size of the result list
     * @param {integer} pageNumber - Page number of the result list
     * @param {string} sortBy - Name of the property that the result list is sorted by
     * @param {string} direction - Direction of the sort
     */
    CBioPortalAPI.prototype.getAllPatientsInStudyUsingGET = function (parameters) {
        var domain = parameters.$domain ? parameters.$domain : this.domain;
        var errorHandlers = this.errorHandlers;
        var request = this.request;
        var path = '/studies/{studyId}/patients';
        var body;
        var queryParameters = {};
        var headers = {};
        var form = {};
        return new Promise(function (resolve, reject) {
            headers['Accept'] = 'application/json';
            headers['Content-Type'] = 'application/json';
            path = path.replace('{studyId}', parameters['studyId']);
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
                Object.keys(parameters.$queryParameters).forEach(function (parameterName) {
                    var parameter = parameters.$queryParameters[parameterName];
                    queryParameters[parameterName] = parameter;
                });
            }
            request('GET', domain + path, body, headers, queryParameters, form, reject, resolve, errorHandlers);
        }).then(function (response) {
            return response.body;
        });
    };
    ;
    CBioPortalAPI.prototype.getPatientInStudyUsingGETURL = function (parameters) {
        var queryParameters = {};
        var path = '/studies/{studyId}/patients/{patientId}';
        path = path.replace('{studyId}', parameters['studyId']);
        path = path.replace('{patientId}', parameters['patientId']);
        if (parameters.$queryParameters) {
            Object.keys(parameters.$queryParameters).forEach(function (parameterName) {
                var parameter = parameters.$queryParameters[parameterName];
                queryParameters[parameterName] = parameter;
            });
        }
        var keys = Object.keys(queryParameters);
        return this.domain + path + (keys.length > 0 ? '?' + (keys.map(function (key) { return key + '=' + encodeURIComponent(queryParameters[key]); }).join('&')) : '');
    };
    ;
    /**
     * Get a patient in a study
     * @method
     * @name CBioPortalAPI#getPatientInStudyUsingGET
     * @param {string} studyId - Study ID e.g. acc_tcga
     * @param {string} patientId - Patient ID e.g. TCGA-OR-A5J2
     */
    CBioPortalAPI.prototype.getPatientInStudyUsingGET = function (parameters) {
        var domain = parameters.$domain ? parameters.$domain : this.domain;
        var errorHandlers = this.errorHandlers;
        var request = this.request;
        var path = '/studies/{studyId}/patients/{patientId}';
        var body;
        var queryParameters = {};
        var headers = {};
        var form = {};
        return new Promise(function (resolve, reject) {
            headers['Accept'] = 'application/json';
            headers['Content-Type'] = 'application/json';
            path = path.replace('{studyId}', parameters['studyId']);
            if (parameters['studyId'] === undefined) {
                reject(new Error('Missing required  parameter: studyId'));
                return;
            }
            path = path.replace('{patientId}', parameters['patientId']);
            if (parameters['patientId'] === undefined) {
                reject(new Error('Missing required  parameter: patientId'));
                return;
            }
            if (parameters.$queryParameters) {
                Object.keys(parameters.$queryParameters).forEach(function (parameterName) {
                    var parameter = parameters.$queryParameters[parameterName];
                    queryParameters[parameterName] = parameter;
                });
            }
            request('GET', domain + path, body, headers, queryParameters, form, reject, resolve, errorHandlers);
        }).then(function (response) {
            return response.body;
        });
    };
    ;
    CBioPortalAPI.prototype.getAllClinicalDataOfPatientInStudyUsingGETURL = function (parameters) {
        var queryParameters = {};
        var path = '/studies/{studyId}/patients/{patientId}/clinical-data';
        path = path.replace('{studyId}', parameters['studyId']);
        path = path.replace('{patientId}', parameters['patientId']);
        if (parameters['attributeId'] !== undefined) {
            queryParameters['attributeId'] = parameters['attributeId'];
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
            Object.keys(parameters.$queryParameters).forEach(function (parameterName) {
                var parameter = parameters.$queryParameters[parameterName];
                queryParameters[parameterName] = parameter;
            });
        }
        var keys = Object.keys(queryParameters);
        return this.domain + path + (keys.length > 0 ? '?' + (keys.map(function (key) { return key + '=' + encodeURIComponent(queryParameters[key]); }).join('&')) : '');
    };
    ;
    /**
     * Get all clinical data of a patient in a study
     * @method
     * @name CBioPortalAPI#getAllClinicalDataOfPatientInStudyUsingGET
     * @param {string} studyId - Study ID e.g. acc_tcga
     * @param {string} patientId - Patient ID e.g. TCGA-OR-A5J2
     * @param {string} attributeId - Attribute ID e.g. AGE
     * @param {string} projection - Level of detail of the response
     * @param {integer} pageSize - Page size of the result list
     * @param {integer} pageNumber - Page number of the result list
     * @param {string} sortBy - Name of the property that the result list is sorted by
     * @param {string} direction - Direction of the sort
     */
    CBioPortalAPI.prototype.getAllClinicalDataOfPatientInStudyUsingGET = function (parameters) {
        var domain = parameters.$domain ? parameters.$domain : this.domain;
        var errorHandlers = this.errorHandlers;
        var request = this.request;
        var path = '/studies/{studyId}/patients/{patientId}/clinical-data';
        var body;
        var queryParameters = {};
        var headers = {};
        var form = {};
        return new Promise(function (resolve, reject) {
            headers['Accept'] = 'application/json';
            headers['Content-Type'] = 'application/json';
            path = path.replace('{studyId}', parameters['studyId']);
            if (parameters['studyId'] === undefined) {
                reject(new Error('Missing required  parameter: studyId'));
                return;
            }
            path = path.replace('{patientId}', parameters['patientId']);
            if (parameters['patientId'] === undefined) {
                reject(new Error('Missing required  parameter: patientId'));
                return;
            }
            if (parameters['attributeId'] !== undefined) {
                queryParameters['attributeId'] = parameters['attributeId'];
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
                Object.keys(parameters.$queryParameters).forEach(function (parameterName) {
                    var parameter = parameters.$queryParameters[parameterName];
                    queryParameters[parameterName] = parameter;
                });
            }
            request('GET', domain + path, body, headers, queryParameters, form, reject, resolve, errorHandlers);
        }).then(function (response) {
            return response.body;
        });
    };
    ;
    CBioPortalAPI.prototype.getAllGeneticDataInPatientInStudyUsingGETURL = function (parameters) {
        var queryParameters = {};
        var path = '/studies/{studyId}/patients/{patientId}/genetic-data';
        path = path.replace('{studyId}', parameters['studyId']);
        path = path.replace('{patientId}', parameters['patientId']);
        if (parameters['geneticProfileId'] !== undefined) {
            queryParameters['geneticProfileId'] = parameters['geneticProfileId'];
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
        if (parameters.$queryParameters) {
            Object.keys(parameters.$queryParameters).forEach(function (parameterName) {
                var parameter = parameters.$queryParameters[parameterName];
                queryParameters[parameterName] = parameter;
            });
        }
        var keys = Object.keys(queryParameters);
        return this.domain + path + (keys.length > 0 ? '?' + (keys.map(function (key) { return key + '=' + encodeURIComponent(queryParameters[key]); }).join('&')) : '');
    };
    ;
    /**
     * Get all genetic data of a patient in a study
     * @method
     * @name CBioPortalAPI#getAllGeneticDataInPatientInStudyUsingGET
     * @param {string} studyId - studyId
     * @param {string} patientId - patientId
     * @param {string} geneticProfileId - geneticProfileId
     * @param {string} projection - projection
     * @param {integer} pageSize - pageSize
     * @param {integer} pageNumber - pageNumber
     */
    CBioPortalAPI.prototype.getAllGeneticDataInPatientInStudyUsingGET = function (parameters) {
        var domain = parameters.$domain ? parameters.$domain : this.domain;
        var errorHandlers = this.errorHandlers;
        var request = this.request;
        var path = '/studies/{studyId}/patients/{patientId}/genetic-data';
        var body;
        var queryParameters = {};
        var headers = {};
        var form = {};
        return new Promise(function (resolve, reject) {
            headers['Accept'] = '*/*';
            headers['Content-Type'] = 'application/json';
            path = path.replace('{studyId}', parameters['studyId']);
            if (parameters['studyId'] === undefined) {
                reject(new Error('Missing required  parameter: studyId'));
                return;
            }
            path = path.replace('{patientId}', parameters['patientId']);
            if (parameters['patientId'] === undefined) {
                reject(new Error('Missing required  parameter: patientId'));
                return;
            }
            if (parameters['geneticProfileId'] !== undefined) {
                queryParameters['geneticProfileId'] = parameters['geneticProfileId'];
            }
            if (parameters['geneticProfileId'] === undefined) {
                reject(new Error('Missing required  parameter: geneticProfileId'));
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
            if (parameters.$queryParameters) {
                Object.keys(parameters.$queryParameters).forEach(function (parameterName) {
                    var parameter = parameters.$queryParameters[parameterName];
                    queryParameters[parameterName] = parameter;
                });
            }
            request('GET', domain + path, body, headers, queryParameters, form, reject, resolve, errorHandlers);
        }).then(function (response) {
            return response.body;
        });
    };
    ;
    CBioPortalAPI.prototype.getAllMutationsInPatientInStudyUsingGETURL = function (parameters) {
        var queryParameters = {};
        var path = '/studies/{studyId}/patients/{patientId}/mutations';
        path = path.replace('{studyId}', parameters['studyId']);
        path = path.replace('{patientId}', parameters['patientId']);
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
            Object.keys(parameters.$queryParameters).forEach(function (parameterName) {
                var parameter = parameters.$queryParameters[parameterName];
                queryParameters[parameterName] = parameter;
            });
        }
        var keys = Object.keys(queryParameters);
        return this.domain + path + (keys.length > 0 ? '?' + (keys.map(function (key) { return key + '=' + encodeURIComponent(queryParameters[key]); }).join('&')) : '');
    };
    ;
    /**
     * Get all mutations in a patient in a study
     * @method
     * @name CBioPortalAPI#getAllMutationsInPatientInStudyUsingGET
     * @param {string} studyId - studyId
     * @param {string} patientId - patientId
     * @param {string} projection - projection
     * @param {integer} pageSize - pageSize
     * @param {integer} pageNumber - pageNumber
     */
    CBioPortalAPI.prototype.getAllMutationsInPatientInStudyUsingGET = function (parameters) {
        var domain = parameters.$domain ? parameters.$domain : this.domain;
        var errorHandlers = this.errorHandlers;
        var request = this.request;
        var path = '/studies/{studyId}/patients/{patientId}/mutations';
        var body;
        var queryParameters = {};
        var headers = {};
        var form = {};
        return new Promise(function (resolve, reject) {
            headers['Accept'] = '*/*';
            headers['Content-Type'] = 'application/json';
            path = path.replace('{studyId}', parameters['studyId']);
            if (parameters['studyId'] === undefined) {
                reject(new Error('Missing required  parameter: studyId'));
                return;
            }
            path = path.replace('{patientId}', parameters['patientId']);
            if (parameters['patientId'] === undefined) {
                reject(new Error('Missing required  parameter: patientId'));
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
            if (parameters.$queryParameters) {
                Object.keys(parameters.$queryParameters).forEach(function (parameterName) {
                    var parameter = parameters.$queryParameters[parameterName];
                    queryParameters[parameterName] = parameter;
                });
            }
            request('GET', domain + path, body, headers, queryParameters, form, reject, resolve, errorHandlers);
        }).then(function (response) {
            return response.body;
        });
    };
    ;
    CBioPortalAPI.prototype.getAllSamplesOfPatientInStudyUsingGETURL = function (parameters) {
        var queryParameters = {};
        var path = '/studies/{studyId}/patients/{patientId}/samples';
        path = path.replace('{studyId}', parameters['studyId']);
        path = path.replace('{patientId}', parameters['patientId']);
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
            Object.keys(parameters.$queryParameters).forEach(function (parameterName) {
                var parameter = parameters.$queryParameters[parameterName];
                queryParameters[parameterName] = parameter;
            });
        }
        var keys = Object.keys(queryParameters);
        return this.domain + path + (keys.length > 0 ? '?' + (keys.map(function (key) { return key + '=' + encodeURIComponent(queryParameters[key]); }).join('&')) : '');
    };
    ;
    /**
     * Get all samples of a patient in a study
     * @method
     * @name CBioPortalAPI#getAllSamplesOfPatientInStudyUsingGET
     * @param {string} studyId - Study ID e.g. acc_tcga
     * @param {string} patientId - Patient ID e.g. TCGA-OR-A5J2
     * @param {string} projection - Level of detail of the response
     * @param {integer} pageSize - Page size of the result list
     * @param {integer} pageNumber - Page number of the result list
     * @param {string} sortBy - Name of the property that the result list is sorted by
     * @param {string} direction - Direction of the sort
     */
    CBioPortalAPI.prototype.getAllSamplesOfPatientInStudyUsingGET = function (parameters) {
        var domain = parameters.$domain ? parameters.$domain : this.domain;
        var errorHandlers = this.errorHandlers;
        var request = this.request;
        var path = '/studies/{studyId}/patients/{patientId}/samples';
        var body;
        var queryParameters = {};
        var headers = {};
        var form = {};
        return new Promise(function (resolve, reject) {
            headers['Accept'] = 'application/json';
            headers['Content-Type'] = 'application/json';
            path = path.replace('{studyId}', parameters['studyId']);
            if (parameters['studyId'] === undefined) {
                reject(new Error('Missing required  parameter: studyId'));
                return;
            }
            path = path.replace('{patientId}', parameters['patientId']);
            if (parameters['patientId'] === undefined) {
                reject(new Error('Missing required  parameter: patientId'));
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
                Object.keys(parameters.$queryParameters).forEach(function (parameterName) {
                    var parameter = parameters.$queryParameters[parameterName];
                    queryParameters[parameterName] = parameter;
                });
            }
            request('GET', domain + path, body, headers, queryParameters, form, reject, resolve, errorHandlers);
        }).then(function (response) {
            return response.body;
        });
    };
    ;
    CBioPortalAPI.prototype.getAllSampleListsInStudyUsingGETURL = function (parameters) {
        var queryParameters = {};
        var path = '/studies/{studyId}/sample-lists';
        path = path.replace('{studyId}', parameters['studyId']);
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
            Object.keys(parameters.$queryParameters).forEach(function (parameterName) {
                var parameter = parameters.$queryParameters[parameterName];
                queryParameters[parameterName] = parameter;
            });
        }
        var keys = Object.keys(queryParameters);
        return this.domain + path + (keys.length > 0 ? '?' + (keys.map(function (key) { return key + '=' + encodeURIComponent(queryParameters[key]); }).join('&')) : '');
    };
    ;
    /**
     * Get all sample lists in a study
     * @method
     * @name CBioPortalAPI#getAllSampleListsInStudyUsingGET
     * @param {string} studyId - Study ID e.g. acc_tcga
     * @param {string} projection - Level of detail of the response
     * @param {integer} pageSize - Page size of the result list
     * @param {integer} pageNumber - Page number of the result list
     * @param {string} sortBy - Name of the property that the result list is sorted by
     * @param {string} direction - Direction of the sort
     */
    CBioPortalAPI.prototype.getAllSampleListsInStudyUsingGET = function (parameters) {
        var domain = parameters.$domain ? parameters.$domain : this.domain;
        var errorHandlers = this.errorHandlers;
        var request = this.request;
        var path = '/studies/{studyId}/sample-lists';
        var body;
        var queryParameters = {};
        var headers = {};
        var form = {};
        return new Promise(function (resolve, reject) {
            headers['Accept'] = 'application/json';
            headers['Content-Type'] = 'application/json';
            path = path.replace('{studyId}', parameters['studyId']);
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
                Object.keys(parameters.$queryParameters).forEach(function (parameterName) {
                    var parameter = parameters.$queryParameters[parameterName];
                    queryParameters[parameterName] = parameter;
                });
            }
            request('GET', domain + path, body, headers, queryParameters, form, reject, resolve, errorHandlers);
        }).then(function (response) {
            return response.body;
        });
    };
    ;
    CBioPortalAPI.prototype.getAllSamplesInStudyUsingGETURL = function (parameters) {
        var queryParameters = {};
        var path = '/studies/{studyId}/samples';
        path = path.replace('{studyId}', parameters['studyId']);
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
            Object.keys(parameters.$queryParameters).forEach(function (parameterName) {
                var parameter = parameters.$queryParameters[parameterName];
                queryParameters[parameterName] = parameter;
            });
        }
        var keys = Object.keys(queryParameters);
        return this.domain + path + (keys.length > 0 ? '?' + (keys.map(function (key) { return key + '=' + encodeURIComponent(queryParameters[key]); }).join('&')) : '');
    };
    ;
    /**
     * Get all samples in a study
     * @method
     * @name CBioPortalAPI#getAllSamplesInStudyUsingGET
     * @param {string} studyId - Study ID e.g. acc_tcga
     * @param {string} projection - Level of detail of the response
     * @param {integer} pageSize - Page size of the result list
     * @param {integer} pageNumber - Page number of the result list
     * @param {string} sortBy - Name of the property that the result list is sorted by
     * @param {string} direction - Direction of the sort
     */
    CBioPortalAPI.prototype.getAllSamplesInStudyUsingGET = function (parameters) {
        var domain = parameters.$domain ? parameters.$domain : this.domain;
        var errorHandlers = this.errorHandlers;
        var request = this.request;
        var path = '/studies/{studyId}/samples';
        var body;
        var queryParameters = {};
        var headers = {};
        var form = {};
        return new Promise(function (resolve, reject) {
            headers['Accept'] = 'application/json';
            headers['Content-Type'] = 'application/json';
            path = path.replace('{studyId}', parameters['studyId']);
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
                Object.keys(parameters.$queryParameters).forEach(function (parameterName) {
                    var parameter = parameters.$queryParameters[parameterName];
                    queryParameters[parameterName] = parameter;
                });
            }
            request('GET', domain + path, body, headers, queryParameters, form, reject, resolve, errorHandlers);
        }).then(function (response) {
            return response.body;
        });
    };
    ;
    CBioPortalAPI.prototype.getSampleInStudyUsingGETURL = function (parameters) {
        var queryParameters = {};
        var path = '/studies/{studyId}/samples/{sampleId}';
        path = path.replace('{studyId}', parameters['studyId']);
        path = path.replace('{sampleId}', parameters['sampleId']);
        if (parameters.$queryParameters) {
            Object.keys(parameters.$queryParameters).forEach(function (parameterName) {
                var parameter = parameters.$queryParameters[parameterName];
                queryParameters[parameterName] = parameter;
            });
        }
        var keys = Object.keys(queryParameters);
        return this.domain + path + (keys.length > 0 ? '?' + (keys.map(function (key) { return key + '=' + encodeURIComponent(queryParameters[key]); }).join('&')) : '');
    };
    ;
    /**
     * Get a sample in a study
     * @method
     * @name CBioPortalAPI#getSampleInStudyUsingGET
     * @param {string} studyId - Study ID e.g. acc_tcga
     * @param {string} sampleId - Sample ID e.g. TCGA-OR-A5J2-01
     */
    CBioPortalAPI.prototype.getSampleInStudyUsingGET = function (parameters) {
        var domain = parameters.$domain ? parameters.$domain : this.domain;
        var errorHandlers = this.errorHandlers;
        var request = this.request;
        var path = '/studies/{studyId}/samples/{sampleId}';
        var body;
        var queryParameters = {};
        var headers = {};
        var form = {};
        return new Promise(function (resolve, reject) {
            headers['Accept'] = 'application/json';
            headers['Content-Type'] = 'application/json';
            path = path.replace('{studyId}', parameters['studyId']);
            if (parameters['studyId'] === undefined) {
                reject(new Error('Missing required  parameter: studyId'));
                return;
            }
            path = path.replace('{sampleId}', parameters['sampleId']);
            if (parameters['sampleId'] === undefined) {
                reject(new Error('Missing required  parameter: sampleId'));
                return;
            }
            if (parameters.$queryParameters) {
                Object.keys(parameters.$queryParameters).forEach(function (parameterName) {
                    var parameter = parameters.$queryParameters[parameterName];
                    queryParameters[parameterName] = parameter;
                });
            }
            request('GET', domain + path, body, headers, queryParameters, form, reject, resolve, errorHandlers);
        }).then(function (response) {
            return response.body;
        });
    };
    ;
    CBioPortalAPI.prototype.getAllClinicalDataOfSampleInStudyUsingGETURL = function (parameters) {
        var queryParameters = {};
        var path = '/studies/{studyId}/samples/{sampleId}/clinical-data';
        path = path.replace('{studyId}', parameters['studyId']);
        path = path.replace('{sampleId}', parameters['sampleId']);
        if (parameters['attributeId'] !== undefined) {
            queryParameters['attributeId'] = parameters['attributeId'];
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
            Object.keys(parameters.$queryParameters).forEach(function (parameterName) {
                var parameter = parameters.$queryParameters[parameterName];
                queryParameters[parameterName] = parameter;
            });
        }
        var keys = Object.keys(queryParameters);
        return this.domain + path + (keys.length > 0 ? '?' + (keys.map(function (key) { return key + '=' + encodeURIComponent(queryParameters[key]); }).join('&')) : '');
    };
    ;
    /**
     * Get all clinical data of a sample in a study
     * @method
     * @name CBioPortalAPI#getAllClinicalDataOfSampleInStudyUsingGET
     * @param {string} studyId - Study ID e.g. acc_tcga
     * @param {string} sampleId - Sample ID e.g. TCGA-OR-A5J2-01
     * @param {string} attributeId - Attribute ID e.g. CANCER_TYPE
     * @param {string} projection - Level of detail of the response
     * @param {integer} pageSize - Page size of the result list
     * @param {integer} pageNumber - Page number of the result list
     * @param {string} sortBy - Name of the property that the result list is sorted by
     * @param {string} direction - Direction of the sort
     */
    CBioPortalAPI.prototype.getAllClinicalDataOfSampleInStudyUsingGET = function (parameters) {
        var domain = parameters.$domain ? parameters.$domain : this.domain;
        var errorHandlers = this.errorHandlers;
        var request = this.request;
        var path = '/studies/{studyId}/samples/{sampleId}/clinical-data';
        var body;
        var queryParameters = {};
        var headers = {};
        var form = {};
        return new Promise(function (resolve, reject) {
            headers['Accept'] = 'application/json';
            headers['Content-Type'] = 'application/json';
            path = path.replace('{studyId}', parameters['studyId']);
            if (parameters['studyId'] === undefined) {
                reject(new Error('Missing required  parameter: studyId'));
                return;
            }
            path = path.replace('{sampleId}', parameters['sampleId']);
            if (parameters['sampleId'] === undefined) {
                reject(new Error('Missing required  parameter: sampleId'));
                return;
            }
            if (parameters['attributeId'] !== undefined) {
                queryParameters['attributeId'] = parameters['attributeId'];
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
                Object.keys(parameters.$queryParameters).forEach(function (parameterName) {
                    var parameter = parameters.$queryParameters[parameterName];
                    queryParameters[parameterName] = parameter;
                });
            }
            request('GET', domain + path, body, headers, queryParameters, form, reject, resolve, errorHandlers);
        }).then(function (response) {
            return response.body;
        });
    };
    ;
    CBioPortalAPI.prototype.getAllCopyNumberSegmentsInSampleInStudyUsingGETURL = function (parameters) {
        var queryParameters = {};
        var path = '/studies/{studyId}/samples/{sampleId}/copy-number-segments';
        path = path.replace('{studyId}', parameters['studyId']);
        path = path.replace('{sampleId}', parameters['sampleId']);
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
            Object.keys(parameters.$queryParameters).forEach(function (parameterName) {
                var parameter = parameters.$queryParameters[parameterName];
                queryParameters[parameterName] = parameter;
            });
        }
        var keys = Object.keys(queryParameters);
        return this.domain + path + (keys.length > 0 ? '?' + (keys.map(function (key) { return key + '=' + encodeURIComponent(queryParameters[key]); }).join('&')) : '');
    };
    ;
    /**
     * Get all copy number segments in a sample in a study
     * @method
     * @name CBioPortalAPI#getAllCopyNumberSegmentsInSampleInStudyUsingGET
     * @param {string} studyId - studyId
     * @param {string} sampleId - sampleId
     * @param {string} projection - projection
     * @param {integer} pageSize - pageSize
     * @param {integer} pageNumber - pageNumber
     */
    CBioPortalAPI.prototype.getAllCopyNumberSegmentsInSampleInStudyUsingGET = function (parameters) {
        var domain = parameters.$domain ? parameters.$domain : this.domain;
        var errorHandlers = this.errorHandlers;
        var request = this.request;
        var path = '/studies/{studyId}/samples/{sampleId}/copy-number-segments';
        var body;
        var queryParameters = {};
        var headers = {};
        var form = {};
        return new Promise(function (resolve, reject) {
            headers['Accept'] = '*/*';
            headers['Content-Type'] = 'application/json';
            path = path.replace('{studyId}', parameters['studyId']);
            if (parameters['studyId'] === undefined) {
                reject(new Error('Missing required  parameter: studyId'));
                return;
            }
            path = path.replace('{sampleId}', parameters['sampleId']);
            if (parameters['sampleId'] === undefined) {
                reject(new Error('Missing required  parameter: sampleId'));
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
            if (parameters.$queryParameters) {
                Object.keys(parameters.$queryParameters).forEach(function (parameterName) {
                    var parameter = parameters.$queryParameters[parameterName];
                    queryParameters[parameterName] = parameter;
                });
            }
            request('GET', domain + path, body, headers, queryParameters, form, reject, resolve, errorHandlers);
        }).then(function (response) {
            return response.body;
        });
    };
    ;
    CBioPortalAPI.prototype.getAllGeneticDataInSampleInStudyUsingGETURL = function (parameters) {
        var queryParameters = {};
        var path = '/studies/{studyId}/samples/{sampleId}/genetic-data';
        path = path.replace('{studyId}', parameters['studyId']);
        path = path.replace('{sampleId}', parameters['sampleId']);
        if (parameters['geneticProfileId'] !== undefined) {
            queryParameters['geneticProfileId'] = parameters['geneticProfileId'];
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
        if (parameters.$queryParameters) {
            Object.keys(parameters.$queryParameters).forEach(function (parameterName) {
                var parameter = parameters.$queryParameters[parameterName];
                queryParameters[parameterName] = parameter;
            });
        }
        var keys = Object.keys(queryParameters);
        return this.domain + path + (keys.length > 0 ? '?' + (keys.map(function (key) { return key + '=' + encodeURIComponent(queryParameters[key]); }).join('&')) : '');
    };
    ;
    /**
     * Get all genetic data of a sample in a study
     * @method
     * @name CBioPortalAPI#getAllGeneticDataInSampleInStudyUsingGET
     * @param {string} studyId - studyId
     * @param {string} sampleId - sampleId
     * @param {string} geneticProfileId - geneticProfileId
     * @param {string} projection - projection
     * @param {integer} pageSize - pageSize
     * @param {integer} pageNumber - pageNumber
     */
    CBioPortalAPI.prototype.getAllGeneticDataInSampleInStudyUsingGET = function (parameters) {
        var domain = parameters.$domain ? parameters.$domain : this.domain;
        var errorHandlers = this.errorHandlers;
        var request = this.request;
        var path = '/studies/{studyId}/samples/{sampleId}/genetic-data';
        var body;
        var queryParameters = {};
        var headers = {};
        var form = {};
        return new Promise(function (resolve, reject) {
            headers['Accept'] = '*/*';
            headers['Content-Type'] = 'application/json';
            path = path.replace('{studyId}', parameters['studyId']);
            if (parameters['studyId'] === undefined) {
                reject(new Error('Missing required  parameter: studyId'));
                return;
            }
            path = path.replace('{sampleId}', parameters['sampleId']);
            if (parameters['sampleId'] === undefined) {
                reject(new Error('Missing required  parameter: sampleId'));
                return;
            }
            if (parameters['geneticProfileId'] !== undefined) {
                queryParameters['geneticProfileId'] = parameters['geneticProfileId'];
            }
            if (parameters['geneticProfileId'] === undefined) {
                reject(new Error('Missing required  parameter: geneticProfileId'));
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
            if (parameters.$queryParameters) {
                Object.keys(parameters.$queryParameters).forEach(function (parameterName) {
                    var parameter = parameters.$queryParameters[parameterName];
                    queryParameters[parameterName] = parameter;
                });
            }
            request('GET', domain + path, body, headers, queryParameters, form, reject, resolve, errorHandlers);
        }).then(function (response) {
            return response.body;
        });
    };
    ;
    CBioPortalAPI.prototype.getAllMutationsInSampleInStudyUsingGETURL = function (parameters) {
        var queryParameters = {};
        var path = '/studies/{studyId}/samples/{sampleId}/mutations';
        path = path.replace('{studyId}', parameters['studyId']);
        path = path.replace('{sampleId}', parameters['sampleId']);
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
            Object.keys(parameters.$queryParameters).forEach(function (parameterName) {
                var parameter = parameters.$queryParameters[parameterName];
                queryParameters[parameterName] = parameter;
            });
        }
        var keys = Object.keys(queryParameters);
        return this.domain + path + (keys.length > 0 ? '?' + (keys.map(function (key) { return key + '=' + encodeURIComponent(queryParameters[key]); }).join('&')) : '');
    };
    ;
    /**
     * Get all mutations in a sample in a study
     * @method
     * @name CBioPortalAPI#getAllMutationsInSampleInStudyUsingGET
     * @param {string} studyId - studyId
     * @param {string} sampleId - sampleId
     * @param {string} projection - projection
     * @param {integer} pageSize - pageSize
     * @param {integer} pageNumber - pageNumber
     */
    CBioPortalAPI.prototype.getAllMutationsInSampleInStudyUsingGET = function (parameters) {
        var domain = parameters.$domain ? parameters.$domain : this.domain;
        var errorHandlers = this.errorHandlers;
        var request = this.request;
        var path = '/studies/{studyId}/samples/{sampleId}/mutations';
        var body;
        var queryParameters = {};
        var headers = {};
        var form = {};
        return new Promise(function (resolve, reject) {
            headers['Accept'] = '*/*';
            headers['Content-Type'] = 'application/json';
            path = path.replace('{studyId}', parameters['studyId']);
            if (parameters['studyId'] === undefined) {
                reject(new Error('Missing required  parameter: studyId'));
                return;
            }
            path = path.replace('{sampleId}', parameters['sampleId']);
            if (parameters['sampleId'] === undefined) {
                reject(new Error('Missing required  parameter: sampleId'));
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
            if (parameters.$queryParameters) {
                Object.keys(parameters.$queryParameters).forEach(function (parameterName) {
                    var parameter = parameters.$queryParameters[parameterName];
                    queryParameters[parameterName] = parameter;
                });
            }
            request('GET', domain + path, body, headers, queryParameters, form, reject, resolve, errorHandlers);
        }).then(function (response) {
            return response.body;
        });
    };
    ;
    return CBioPortalAPI;
}());
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = CBioPortalAPI;
