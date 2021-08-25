import {
    CategorizedConfigItems,
    IAppConfig,
    ILoadConfig,
    IServerConfig,
} from './IAppConfig';
import * as _ from 'lodash';
import ServerConfigDefaults from './serverConfigDefaults';
import memoize from 'memoize-weak-decorator';

import {
    getCbioPortalApiUrl,
    getConfigurationServiceApiUrl,
    getG2SApiUrl,
    getGenomeNexusApiUrl,
    getOncoKbApiUrl,
} from '../shared/api/urls';
import genomeNexusClient from '../shared/api/genomeNexusClientInstance';
import internalGenomeNexusClient from '../shared/api/genomeNexusInternalClientInstance';
import oncoKBClient from '../shared/api/oncokbClientInstance';
import genome2StructureClient from '../shared/api/g2sClientInstance';
import client from '../shared/api/cbioportalClientInstance';
import internalClient from '../shared/api/cbioportalInternalClientInstance';
import $ from 'jquery';
import { AppStore } from '../AppStore';
import { CBioPortalAPI, CBioPortalAPIInternal } from 'cbioportal-ts-api-client';
import {
    cachePostMethodsOnClient,
    getBrowserWindow,
} from 'cbioportal-frontend-commons';
import {
    Genome2StructureAPI,
    GenomeNexusAPI,
    GenomeNexusAPIInternal,
} from 'genome-nexus-ts-api-client';
import { OncoKbAPI } from 'oncokb-ts-api-client';
import { CivicAPI } from 'cbioportal-utils';
import { sendSentryMessage } from '../shared/lib/tracking';
import { log } from '../shared/lib/consoleLog';
import pako from 'pako';

const win = window as any;

// these should not be exported.  they should only be accessed
// via getServerConfig and getLoadConfig
const config: any = { serverConfig: {} };
const loadConfig: ILoadConfig = {};

export function getServerConfig(): IServerConfig {
    return config.serverConfig;
}

export function setServerConfig(serverConfig: { [key: string]: any }) {
    Object.assign(config.serverConfig, serverConfig);
}

export function getLoadConfig(): ILoadConfig {
    return loadConfig;
}

// expose it for use by tests
win.setServerConfig = setServerConfig;
win.getLoadConfig = getLoadConfig;
win.getServerConfig = getServerConfig;

function applyDefaultConfigurationValues(serverConfig: any) {
    _.each(ServerConfigDefaults, (defaultVal, key) => {
        // we only want to work on props which are actually passed to us for setting
        // WE DO NOT EVER SET DEFAULT VALUES EXCEPT WHEN A PASSED VALUE IS NULL
        if (serverConfig.hasOwnProperty(key)) {
            //if we know the prop default is boolean
            //set config to default val IF the configuration value is NOT boolean
            //this handles null or empty string values on boolean props
            //we do not want to allow this for string values, for which empty string or null is valid value
            if (_.isBoolean(defaultVal)) {
                if (!_.isBoolean(serverConfig[key])) {
                    serverConfig[key] = defaultVal;
                }
            } else {
                // for non booleans, only resolve to default if prop is missing or null
                if (
                    serverConfig.hasOwnProperty(key) &&
                    serverConfig[key] === null
                ) {
                    serverConfig[key] = defaultVal;
                }
            }
        }
    });
}

export class ServerConfigHelpers {
    @memoize static skin_example_study_queries(str: string) {
        const matches = str.match(/.+/g);
        return matches ? matches.map((s: string) => s.trim()) : [];
    }

    @memoize static parseConfigFormat(
        str: string | null
    ): CategorizedConfigItems {
        if (str && str.length) {
            // get rid of a trailing semicolon
            str = str.replace(/;$/, '');
            return _.chain(str)
                .split(';')
                .map(s => s.split('#'))
                .fromPairs()
                .mapValues(s => s.split(','))
                .value();
        } else {
            return {};
        }
    }

    @memoize static parseQuerySetsOfGenes(json: string) {
        try {
            return JSON.parse(json);
        } catch (ex) {
            return undefined;
        }
    }

    static sessionServiceIsEnabled() {
        return getServerConfig().sessionServiceEnabled;
    }

    static getUserEmailAddress(): string | undefined {
        return getServerConfig().user_email_address &&
            getServerConfig().user_email_address !== 'anonymousUser'
            ? getServerConfig().user_email_address
            : undefined;
    }
}

function cachePostMethods(
    obj: any,
    excluded: string[] = [],
    regex: RegExp = /UsingPOST$/
) {
    cachePostMethodsOnClient(
        obj,
        excluded,
        regex,
        getServerConfig().api_cache_limit,
        sendSentryMessage,
        log
    );
}

export function initializeAPIClients() {
    // we need to set the domain of our api clients
    (client as any).domain = getCbioPortalApiUrl();
    (internalClient as any).domain = getCbioPortalApiUrl();
    (genomeNexusClient as any).domain = getGenomeNexusApiUrl();
    (internalGenomeNexusClient as any).domain = getGenomeNexusApiUrl();
    (oncoKBClient as any).domain = getOncoKbApiUrl();
    (genome2StructureClient as any).domain = getG2SApiUrl();

    // add POST caching
    cachePostMethods(CBioPortalAPI);
    cachePostMethods(CBioPortalAPIInternal, [
        'fetchMutatedGenesUsingPOST',
        'fetchCNAGenesUsingPOST',
    ]);
    cachePostMethods(CivicAPI);
    cachePostMethods(Genome2StructureAPI);
    cachePostMethods(GenomeNexusAPI, [], /POST$/);
    cachePostMethods(GenomeNexusAPIInternal, [], /POST$/);
    cachePostMethods(OncoKbAPI);

    if (getServerConfig().enable_request_body_gzip_compression) {
        compressRequestBodies(
            CBioPortalAPI,
            [
                '/mutations/fetch',
                '/patients/fetch',
                '/molecular-data/fetch',
                '/clinical-data/fetch?clinicalDataType=SAMPLE',
                '/gene-panel-data/fetch',
                '/clinical-data/fetch?clinicalDataType=PATIENT',
            ],
            getCbioPortalApiUrl()
        );
    }
}

/**
 * Compresses the request bodies of POST calls of urls that start with
 * domain + urlToCompress, and adds the Content-Encoding header. To do this,
 * it wraps the api client's request function.
 * @param apiClient
 * @param urlsToCompress
 * @param domain
 */
function compressRequestBodies(
    apiClient: any,
    urlsToCompress: string[],
    domain: string
): void {
    urlsToCompress = urlsToCompress.map(url => domain + url);

    const oldRequestFunc = apiClient.prototype.request;

    const newRequestFunc = (
        method: string,
        url: string,
        body: any,
        headers: any,
        queryParameters: any,
        form: any,
        reject: any,
        resolve: any,
        errorHandlers: any[]
    ) => {
        if (
            method === 'POST' &&
            urlsToCompress.filter(match => url.startsWith(match)).length > 0
        ) {
            headers['Content-Encoding'] = 'gzip';
            body = pako.gzip(JSON.stringify(body)).buffer;
        }

        oldRequestFunc(
            method,
            url,
            body,
            headers,
            queryParameters,
            form,
            reject,
            resolve,
            errorHandlers
        );
    };

    apiClient.prototype.request = newRequestFunc;
}

export function initializeLoadConfiguration() {
    // @ts-ignore: ENV_* are defined in webpack.config.js
    const BASEURL = getBrowserWindow().frontendConfig.baseUrl;

    // @ts-ignore: ENV_* are defined in webpack.config.js
    const APIROOT =
        // @ts-ignore: ENV_* are defined in webpack.config.js
        getBrowserWindow().frontendConfig.apiRoot || `${ENV_CBIOPORTAL_URL}/`;
    // @ts-ignore: ENV_* are defined in webpack.config.js
    const GENOME_NEXUS_ROOT = `${ENV_GENOME_NEXUS_URL}/`;

    // we want to respect frontUrl if it is already set (case where localdist is true)
    // @ts-ignore: ENV_* are defined in webpack.config.js
    const frontendUrl =
        getBrowserWindow().frontendConfig.frontendUrl ||
        `//${win.location.host}/`;

    const configServiceUrl =
        getBrowserWindow().frontendConfig.configurationServiceUrl ||
        `${APIROOT}config_service.jsp`;

    const loadConfig: Partial<IAppConfig> = {
        configurationServiceUrl: configServiceUrl,
        apiRoot: APIROOT,
        frontendUrl: frontendUrl,
        baseUrl: BASEURL,
    };

    setLoadConfig(loadConfig);
}

export function initializeServerConfiguration(rawConfiguration: any) {
    //were rawConfiguration values are

    // this fixes/normalizes empty strings or erroneous types
    // sent in configuration from server
    applyDefaultConfigurationValues(rawConfiguration);

    // if we have received a frontend config override value, this
    // is unparsed json which we want to use to overwrite configuration
    // it will SUPERSEDE normal configuration
    const frontendOverride = rawConfiguration.frontendConfigOverride
        ? JSON.parse(rawConfiguration.frontendConfigOverride)
        : {};

    let localStorageOverride: any = {};

    // handle localStorage
    // LOCAL STORAGE TRUMPS EVERYTHING EXCEPT WHAT'S ORIGINALLY SET IN JSP
    if (localStorage.frontendConfig) {
        try {
            localStorageOverride = JSON.parse(localStorage.frontendConfig);
            console.log(
                'Using localStorage.frontendConfig (overriding window.frontendConfig): ' +
                    localStorage.frontendConfig
            );
        } catch (err) {
            // ignore
            console.log('Error parsing localStorage.frontendConfig');
        }
    }

    // this establishes the order of precedence of configuration
    // the override each other in the following order
    // Note: server config defaults will only be applied where properties
    // don't yet exist
    const mergedConfig = Object.assign(
        {},
        ServerConfigDefaults,
        rawConfiguration,
        frontendOverride.serverConfig,
        localStorageOverride.serverConfig
    );

    setServerConfig(mergedConfig);
}

export function setLoadConfig(obj: Partial<ILoadConfig>) {
    Object.assign(loadConfig, obj);
}

export function fetchServerConfig() {
    return $.ajax({
        url: getConfigurationServiceApiUrl(),
        dataType: 'jsonp',
        jsonpCallback: 'callback',
    });
}

export function initializeAppStore(appStore: AppStore) {
    appStore.authMethod = getServerConfig().authenticationMethod;
    appStore.userName = getServerConfig().user_email_address;
}
