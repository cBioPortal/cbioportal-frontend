import {
    CategorizedConfigItems,
    IAppConfig,
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
    trimTrailingSlash,
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
import { cachePostMethodsOnClient } from 'cbioportal-frontend-commons';
import {
    Genome2StructureAPI,
    GenomeNexusAPI,
    GenomeNexusAPIInternal,
} from 'genome-nexus-ts-api-client';
import { OncoKbAPI } from 'oncokb-ts-api-client';
import { CivicAPI } from 'cbioportal-utils';
import AppConfig from 'appConfig';
import { sendSentryMessage } from '../shared/lib/tracking';
import { log } from '../shared/lib/consoleLog';

const config: any = (window as any).frontendConfig || { serverConfig: {} };

const win = window as any;

export default config;

export function updateConfig(obj: Partial<IAppConfig>) {
    // handle serverConfig
    if (obj.serverConfig) {
        setServerConfig(obj.serverConfig);
        delete obj.serverConfig;
    }

    // first construct the new object, but DEFERRING TO THE OLD PROPERTIES
    const nextConfig = Object.assign({}, obj, config);

    // now we have to overwrite AppConfig props
    // NOTE: we cannot put AppConfig as target of above assign because
    // assignment proceeds left to right and the original AppConfig that's the last param will be overwritten
    // so we have to copy

    // WE CANNOT REPLACE REFERENCE
    // we have to use assign here (as opposed to replacing the reference because importers
    // already have reference and those will become detached from this
    Object.assign(config, nextConfig);
}

export function setServerConfig(serverConfig: { [key: string]: any }) {
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

    const frontendOverride = serverConfig.frontendConfigOverride
        ? JSON.parse(serverConfig.frontendConfigOverride)
        : {};

    // TODO: temp WARNING remove after we are done testing with AWS. This allows
    // one to change the backend api through the frontendConfigOverride file, so
    // we can point to a different backend then AppConfig.baseUrl
    // ** Don't try this at home, kids **
    if (frontendOverride.apiRoot) {
        console.log(`Overriding apiRoot with: ${frontendOverride.apiRoot}`);
        config.apiRoot = `${frontendOverride.apiRoot}`;
    }

    // allow any hardcoded serverConfig props to override those from service
    const mergedConfig = Object.assign(
        {},
        serverConfig,
        frontendOverride,
        config.serverConfig || {}
    );

    config.serverConfig = mergedConfig;
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
        return config.serverConfig.sessionServiceEnabled;
    }

    static getUserEmailAddress(): string | undefined {
        return config.serverConfig.user_email_address &&
            config.serverConfig.user_email_address !== 'anonymousUser'
            ? config.serverConfig.user_email_address
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
        AppConfig.serverConfig.api_cache_limit,
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
}

export function initializeConfiguration() {
    // @ts-ignore: ENV_* are defined in webpack.config.js

    // handle localStorage
    // LOCAL STORAGE TRUMPS EVERYTHING EXCEPT WHAT'S ORIGINALLY SET IN JSP
    if (localStorage.frontendConfig) {
        try {
            updateConfig(JSON.parse(localStorage.frontendConfig));
            console.log(
                'Using localStorage.frontendConfig (overriding window.frontendConfig): ' +
                    localStorage.frontendConfig
            );
        } catch (err) {
            // ignore
            console.log('Error parsing localStorage.frontendConfig');
        }
    }

    // @ts-ignore: ENV_* are defined in webpack.config.js
    const APIROOT = `${ENV_CBIOPORTAL_URL}/`;
    // @ts-ignore: ENV_* are defined in webpack.config.js
    const GENOME_NEXUS_ROOT = `${ENV_GENOME_NEXUS_URL}/`;

    // we want to respect frontUrl if it is already set (case where localdist is true)
    // @ts-ignore: ENV_* are defined in webpack.config.js
    const frontendUrl = config.frontendUrl || `//${win.location.host}/`;

    const configServiceUrl =
        config.configurationServiceUrl || `${APIROOT}config_service.jsp`;

    // should override both when in dev mode and when serving compiled source
    // code outside of legacy project
    // @ts-ignore: ENV_* are defined in webpack.config.js
    if (IS_DEV_MODE || !config.frontendUrl) {
        // @ts-ignore: ENV_* are defined in webpack.config.js
        const envConfig: Partial<IAppConfig> = {
            configurationServiceUrl: configServiceUrl,
            apiRoot: APIROOT,
            frontendUrl: frontendUrl,
            serverConfig: {
                genomenexus_url: GENOME_NEXUS_ROOT,
            } as IServerConfig,
        };
        updateConfig(envConfig);
    }
}

export function setConfigDefaults() {
    setServerConfig(ServerConfigDefaults);
}

export function fetchServerConfig() {
    return $.ajax({
        url: getConfigurationServiceApiUrl(),
        dataType: 'jsonp',
        jsonpCallback: 'callback',
    });
}

export function initializeAppStore(appStore: AppStore, config: IServerConfig) {
    appStore.authMethod = config.authenticationMethod;
    appStore.userName = config.user_email_address;
}
