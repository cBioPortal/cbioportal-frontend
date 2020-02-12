import getBrowserWindow from './getBrowserWindow';
import sizeof from 'object-sizeof';
import localForage from 'localforage';

// ------------- STORE OBJECT --------------
const postCacheStore: any = {};
getBrowserWindow().postCacheStore = postCacheStore;

// Testing mode: use IndexedDB to persist across sessions in same browser window
const isTestingMode = !!window.navigator.webdriver;

// ------------- UTILS -------------
function hash(str: string) {
    var hash = 0,
        i,
        chr;
    if (str.length === 0) return hash;
    for (i = 0; i < str.length; i++) {
        chr = str.charCodeAt(i);
        hash = (hash << 5) - hash + chr;
        hash |= 0; // Convert to 32bit integer
    }
    return hash;
}

function getHash(obj: any) {
    return hash(JSON.stringify(obj));
}

function megabytes(n: number) {
    return n * Math.pow(10, 6);
}

// ------------- ADD/GET/CONTAINS - these are only methods need to abstract because they're the ones also used in testing mode -------------
function addToCache(methodName: string, hash: number, result: Promise<any>) {
    if (isTestingMode) {
        return localForage.setItem(`${methodName}_${hash}`, result);
    } else {
        postCacheStore[methodName][hash] = result;
        return Promise.resolve();
    }
}

function getPromiseFromCache(methodName: string, hash: number) {
    if (isTestingMode) {
        return localForage.getItem(`${methodName}_${hash}`);
    } else {
        return postCacheStore[methodName][hash];
    }
}

function doesCacheContainEntry(methodName: string, hash: number) {
    if (isTestingMode) {
        return localForage.getItem(`${methodName}_${hash}`).then(x => {
            return !!x;
        });
    } else {
        return hash in postCacheStore[methodName];
    }
}

// ------------- MEMORY MANAGEMENT - PROD MODE ONLY -------------

// Cache clearing for memory management
type SizeQueueElt = { methodName: string; storeKey: number; size: number };
const sizeQueue: SizeQueueElt[] = [];
let cacheSize = 0;

// set apiCacheLimit to Number.POSITIVE_INFINITY to disable cache clearing
function tryFreeCache(
    apiCacheLimit: number = Number.POSITIVE_INFINITY,
    log?: (message: string) => void,
    sentryLog?: (message: string) => void
) {
    if (isTestingMode) {
        // we're not using this system when in testing mode
        return;
    }

    const maxCacheSize = megabytes(apiCacheLimit);

    // delete data to free up memory, starting from the front of the line (least recently used)
    let elt: any;
    try {
        if (sentryLog && cacheSize > maxCacheSize) {
            // log this
            sentryLog(
                `Clearing cache after reaching cache limit of ${maxCacheSize} bytes (${(
                    maxCacheSize / Math.pow(10, 6)
                ).toFixed(2)} Mb)`
            );
        }

        while (cacheSize > maxCacheSize) {
            elt = undefined;
            // remove least recently used element from front, skipping over
            //  elements that dont have updated size (aka call hasnt completed yet)
            for (let i = 0; i < sizeQueue.length; i++) {
                if (sizeQueue[i].size !== -1) {
                    elt = sizeQueue[i];
                    sizeQueue.splice(i, 1);
                    break;
                }
            }

            // delete it from cache
            // at this point we'll encounter an error if elt is undefined - this should never happen
            if (log) {
                log(
                    `POST cache max size exceeded: ${cacheSize} > ${maxCacheSize}. Deleting entries.`
                );
            }

            delete postCacheStore[elt.methodName][elt.storeKey];
            // update cacheSize
            cacheSize -= elt.size;
        }
        //console.log(`POST cache size is now ${cacheSize}`);
    } catch (e) {
        throw 'maxCacheSize exceeded while nothing in cache. This should never happen.';
    }
}

// ------------- CONNECT CACHE TO CLIENT -------------
export function cachePostMethod(
    targetObj: any,
    methodName: string,
    apiCacheLimit?: number,
    log?: (message: string) => void,
    sentryLog?: (message: string) => void
) {
    const oldMethod = targetObj[methodName];

    //prepare store with entry for this method
    postCacheStore[methodName] = {};
    const storeNode = postCacheStore[methodName];

    targetObj[methodName] = async function(arg: any) {
        //console.log('posted data',arg);
        const hash = getHash(arg);
        // remove this from sizeQueue, if it exists, because we just used it so it should get bumped back in line,
        //  away from deletion
        const sizeQueueIndex = sizeQueue.findIndex(
            o => o.methodName === methodName && o.storeKey === hash
        );
        let sizeQueueElement: SizeQueueElt;
        if (sizeQueueIndex > -1) {
            sizeQueueElement = sizeQueue.splice(sizeQueueIndex, 1)[0];
        } else {
            sizeQueueElement = { methodName, storeKey: hash, size: -1 };
        }
        // add element to back of size queue- push it here so that its place in line depends on when it was called, not
        //  when the call completes. We'll update its size when the call completes
        sizeQueue.push(sizeQueueElement);

        const cacheEntryExists = isTestingMode
            ? await doesCacheContainEntry(methodName, hash)
            : doesCacheContainEntry(methodName, hash);
        if (!cacheEntryExists) {
            // make call and add handler to update size, if we dont already have this data
            const addResult = addToCache(
                methodName,
                hash,
                oldMethod.call(this, arg)
            );
            if (isTestingMode) {
                // async so we need to await before continuing
                await addResult;
            }
            getPromiseFromCache(methodName, hash).then((result: any) => {
                // if the hash doesnt exist, then this is the data being fetched for first time
                // update sizeQueueElement size and cacheSize
                sizeQueueElement.size = sizeof(result);
                cacheSize += sizeQueueElement.size;
                //console.log(`Added entry to cache from ${sizeQueueElement.methodName} of size ${sizeQueueElement.size}. cacheSize is now ${cacheSize}`);
                // free memory if necessary
                tryFreeCache(apiCacheLimit, log, sentryLog);
            });
        }
        return getPromiseFromCache(methodName, hash);
    };
}

export function cachePostMethodsOnClient(
    obj: any,
    excluded: string[] = [],
    postMethodNameRegex: RegExp = /UsingPOST$/,
    apiCacheLimit?: number,
    log?: (message: string) => void,
    sentryLog?: (message: string) => void
) {
    const postMethods = Object.getOwnPropertyNames(obj.prototype).filter(
        methodName =>
            postMethodNameRegex.test(methodName) &&
            !excluded.includes(methodName)
    );

    postMethods.forEach(methodName =>
        cachePostMethod(
            obj.prototype,
            methodName,
            apiCacheLimit,
            log,
            sentryLog
        )
    );
}
