import { Buffer } from 'buffer';
import _ from 'lodash';
import * as request from 'superagent';
// import {getServerConfig} from "../../../../src/config/config";
// import {getBrowserWindow} from "cbioportal-frontend-commons";

const BASE64_ENCODING = 'base64';
const UTF8_ENCODING = 'utf8';

// Convert standard base64 to URL-safe (alphabet `-_`, no `=` padding) so the
// encoded path can sit inside a URL path segment without `+` becoming a space,
// `/` splitting the path, or padding chars getting stripped. We do the
// conversion manually rather than relying on Buffer's `'base64url'` encoding
// because the browser-side `buffer` polyfill (v5.x) doesn't recognize it and
// throws `Unknown encoding: base64url`. The cbioportal backend's Apache
// Commons Codec Base64 decoder accepts both alphabets transparently.
function toUrlSafeBase64(b64: string) {
    return b64
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
}

// Convert URL-safe base64 back to standard before decoding, also restoring
// the `=` padding the standard decoder requires.
function fromUrlSafeBase64(urlSafe: string) {
    const standard = urlSafe.replace(/-/g, '+').replace(/_/g, '/');
    const pad = standard.length % 4;
    return pad ? standard + '='.repeat(4 - pad) : standard;
}

export async function chunkCalls<ParamData, ResponseData>(
    callback: (chunk: ParamData[]) => Promise<ResponseData[]>,
    paramData: ParamData[],
    chunkSize: number
): Promise<ResponseData[]> {
    const chunks = _.chunk(paramData, chunkSize);
    const proms = chunks.map(callback);
    return _.flatten(await Promise.all(proms));
}

function monkify(obj: any) {
    return toUrlSafeBase64(
        Buffer.from(_.isString(obj) ? obj : JSON.stringify(obj)).toString(
            BASE64_ENCODING
        )
    );
}

function unmonkify(base64String: string) {
    return JSON.parse(
        Buffer.from(fromUrlSafeBase64(base64String), BASE64_ENCODING).toString(
            UTF8_ENCODING
        )
    );
}

function addCustomHeaders(
    headers: any,
    customHeaders?: { [key: string]: string }
) {
    if (!_.isEmpty(customHeaders)) {
        _.forEach(customHeaders, (value, key) => {
            headers[key] = value;
        });
    }
}

export function addCustomHeadersForApiRequests(
    apiClient: any,
    domain: string,
    customHeaders?: { [key: string]: string }
) {
    const oldRequestFunc = apiClient.prototype.request;

    apiClient.prototype.request = (
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
        addCustomHeaders(headers, customHeaders);

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
}

export function maskApiRequests(
    apiClient: any,
    domain: string,
    customHeaders?: { [key: string]: string }
) {
    const oldRequestFunc = apiClient.prototype.request;

    apiClient.prototype.request = (
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
        const path = url.replace(domain, '');
        const maskedPath = monkify(path);
        const maskedUrl = `${domain}/${maskedPath}`;
        const maskedBody = body ? monkify(body) : body;
        const maskedParams = _.reduce(
            queryParameters,
            (acc, val, key) => {
                acc[monkify(key)] = monkify(val);
                return acc;
            },
            {} as any
        );

        const resolvePossiblyEncodedResponse = (
            res?: request.Response,
            ...args: any[]
        ) => {
            if (res && res.body) {
                try {
                    res.body = unmonkify(res.body);
                } catch (e) {
                    // failed decoding: either the response is not encoded, or there is a server side error
                }
            }

            resolve(res, ...args);
        };

        addCustomHeaders(headers, customHeaders);

        oldRequestFunc(
            method,
            maskedUrl,
            maskedBody,
            headers,
            maskedParams,
            form,
            reject,
            resolvePossiblyEncodedResponse,
            errorHandlers
        );
    };
}
