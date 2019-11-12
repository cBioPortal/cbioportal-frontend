import { set, get, keys, del } from 'idb-keyval';
import request from 'superagent';
import internalClient from './cbioportalInternalClientInstance';
import { getHash } from 'cbioportal-frontend-commons';

export type EndpointUpdateInfo = {
    tables: string[];
    endpoint: string;
    timestamp?: Date;
};
type TimestampedReponse = { timestamp: Date } & request.Response;
type Log = (message: string) => void;

export const PERSISTENT_CACHE_PREFIX = 'persistent-cache-'; // prefix to namespace keys from anything else in store
var endpointUpdateTimes: Map<string, EndpointUpdateInfo> | Promise<void>;

function createCacheCheckingVersionOfGet(
    name: string,
    api: any,
    log: Log
): void {
    const oldMethod = api[name];
    const method = async function(parameters: any): Promise<request.Response> {
        // Wait for timestamps to finish loading to avoid race condition
        // where the persistent cache would sometimes be ignored
        if (endpointUpdateTimes instanceof Promise) {
            await endpointUpdateTimes;
        }

        // for every GET in the api, there is a corresponding
        // GETURL function that returns the url as a string
        if (!name.endsWith('WithHttpInfo')) {
            log("Attempt to cache method that does not end in 'WithHttpInfo'");
            log('Method: ' + name);
            log('This method will not be cached.');
            return await oldMethod.apply(this, [parameters]);
        }
        const url = name + '?' + getHash(parameters);
        // check the cache for a matching url
        var response: TimestampedReponse = await get(
            PERSISTENT_CACHE_PREFIX + url
        );

        // if not in cache, fetch a response and cache it
        if (!response || cachedResponseOutdated(response, name, log)) {
            response = (await oldMethod.apply(this, [
                parameters,
            ])) as TimestampedReponse;
            response.timestamp = new Date();

            if (response.ok) {
                set(PERSISTENT_CACHE_PREFIX + url, response);
            }
        }

        return response;
    };

    api[name] = method;
}

function cachedResponseOutdated(
    response: TimestampedReponse,
    methodName: string,
    log: Log
): boolean {
    const updateTime = (endpointUpdateTimes as Map<
        string,
        EndpointUpdateInfo
    >).get(methodName);

    const ret =
        updateTime == undefined ||
        updateTime.timestamp == undefined ||
        updateTime.timestamp > response.timestamp;

    if (ret) {
        log(
            `The resource for ${methodName} has been updated since last request.`
        );
        log('The persistent cache entry will be updated.');
    }

    return ret;
}

async function populateUpdateTimes(
    endpoints: EndpointUpdateInfo[]
): Promise<void> {
    const timeStamps: any = await internalClient.getAllTimestampsUsingGET({});

    endpointUpdateTimes = new Map(
        endpoints.map(i => [i.endpoint, i] as [string, EndpointUpdateInfo])
    );
    endpoints.forEach(endpointInfo => {
        endpointInfo.timestamp = endpointInfo.tables
            .map(table => new Date(timeStamps[table]))
            .reduce((a, b) => (a > b ? a : b));
    });
}

/**
 * Clears the persistant cache. If a domain is specified, only cache
 * items matching that domain will be cleared.
 *
 * @param prefix The prefix to clear. If not specified, the entire
 * cache will be cleared
 */
export async function clearPersistentCache(
    prefix: string = ''
): Promise<void[]> {
    const allKeys = await keys();
    const promises = allKeys
        .filter((key: string) =>
            key.startsWith(PERSISTENT_CACHE_PREFIX + prefix)
        )
        .map((key: string) => del(key));
    return Promise.all(promises);
}

/**
 * Pass an api and a list of methods on that API into this method
 * to persistently cache those methods. The persistent cache will persist indefinitely
 * provided the browser does not clear it and it does not become invalidated.
 * If you would like to clear the cache, see {@link persistantApiClientCache#clear}
 *
 * @param api an API classname, such as {@link CBioPortalAPI}
 * @param methodNames the methods to cache
 * @param log logs errors if not null.
 */
export function cacheMethods(
    api: any,
    methodNames: EndpointUpdateInfo[],
    log?: Log
): void {
    if (!window.indexedDB) {
        return;
    }

    const monadicLog = (message: string): void => {
        if (log) {
            log(message);
        }
    };

    Object.getOwnPropertyNames(api.prototype)
        .filter(name => methodNames.find(names => names.endpoint === name))
        .forEach(name =>
            createCacheCheckingVersionOfGet(name, api.prototype, monadicLog)
        );

    endpointUpdateTimes = populateUpdateTimes(methodNames);
}
