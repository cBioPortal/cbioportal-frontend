import xhook from 'xhook';
import IdbKvStore from 'idb-kv-store';
import { parseUrl } from 'query-string';
import { getBrowserWindow } from 'cbioportal-frontend-commons';

var store = new IdbKvStore('e2e-storage');

getBrowserWindow()._e2eNetworkStore = store;

function makeHash(str: string) {
    var hash = 0;
    if (str.length == 0) {
        return hash;
    }
    for (var i = 0; i < str.length; i++) {
        var char = str.charCodeAt(i);
        hash = (hash << 5) - hash + char;
        hash = hash & hash; // Convert to 32bit integer
    }
    return hash;
}

var decoder = new TextDecoder('utf-8');

function ab2str(buf: ArrayBuffer) {
    return decoder.decode(new Uint8Array(buf));
}

function makeKey(request: any) {
    let requestBody = '';

    if (request.method === 'POST' && request.body) {
        try {
            requestBody =
                request.body instanceof ArrayBuffer
                    ? ab2str(request.body)
                    : request.body;
        } catch (ex) {
            debugger;
        }
    }

    const key = makeHash(
        request.url + JSON.stringify(request.headers) + requestBody
    );

    return key;
}

function shouldCacheUrl(url: string) {
    const hostname = url.split('/')[2];

    return [
        window.location.hostname,
        'www.cbioportal.org',
        'master.cbioportal.org',
        'v1.genomenexus.org',
    ].includes(hostname);
}

export function setNetworkCache() {
    xhook.before(async (request: any, callback: any) => {
        if (shouldCacheUrl(request.url)) {
            store.get(makeKey(request)).then((cachedItem: any) => {
                if (cachedItem) {
                    console.log(`using cache for: ${request.url}`);
                    const item = JSON.parse(cachedItem);
                    request.fromCache = true;
                    setTimeout(() => {
                        callback({
                            ...item.response,
                            status: 200,
                            text: item.response.data,
                        });
                    }, 0);
                } else {
                    callback();
                }
            });
        } else {
            callback();
        }
    });

    xhook.after((request: any, response: any, callback: () => void) => {
        if (!request.fromCache && shouldCacheUrl(request.url)) {
            const key = makeKey(request);

            console.log(`saving cache for: ${request.url}`);

            const item = JSON.stringify({
                response: {
                    data: response.data,
                    headers: response.headers,
                    status: response.status,
                    statusText: response.statusText,
                },
                meta: {},
            });

            store.set(key, item, function(err: Error) {
                if (err) throw err;
            });
        }

        // store.set('abc', 'def', function (err) {
        //     if (err) throw err
        //     store.get('abc', function (err, value) {
        //         if (err) throw err
        //         console.log('key=abc  value=' + value)
        //     })
        // })

        //const key =

        callback();
    });
}
