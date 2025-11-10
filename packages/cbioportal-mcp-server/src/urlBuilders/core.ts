/**
 * Core URL building functions
 * Adapted from src/shared/api/urls.ts
 */

import { getConfig, trimTrailingSlash } from './config.js';

export interface QueryParams {
    [key: string]:
        | string
        | string[]
        | number
        | boolean
        | undefined
        | null
        | any;
}

export interface BuildUrlParams {
    pathname?: string;
    query?: QueryParams;
    hash?: string;
}

/**
 * Serialize query parameters to URL query string
 */
export function serializeQueryParams(params: QueryParams): string {
    const searchParams = new URLSearchParams();

    for (const [key, value] of Object.entries(params)) {
        if (value === undefined || value === null) {
            continue;
        }

        if (Array.isArray(value)) {
            // Arrays are joined with commas for cBioPortal
            searchParams.append(key, value.join(','));
        } else if (typeof value === 'object') {
            // Objects are JSON stringified
            searchParams.append(key, JSON.stringify(value));
        } else {
            searchParams.append(key, String(value));
        }
    }

    return searchParams.toString();
}

/**
 * Build a complete cBioPortal page URL
 */
export function buildCBioPortalPageUrl(params: BuildUrlParams): string;
export function buildCBioPortalPageUrl(
    pathname: string,
    query?: QueryParams,
    hash?: string
): string;
export function buildCBioPortalPageUrl(
    pathnameOrParams: string | BuildUrlParams,
    query?: QueryParams,
    hash?: string
): string {
    const params: BuildUrlParams =
        typeof pathnameOrParams === 'string'
            ? { pathname: pathnameOrParams, query, hash }
            : pathnameOrParams;

    const config = getConfig();
    const protocol = config.protocol;
    const host = trimTrailingSlash(config.baseUrl);

    let url = `${protocol}//${host}`;

    if (params.pathname) {
        const pathname = params.pathname.startsWith('/')
            ? params.pathname
            : '/' + params.pathname;
        url += pathname;
    }

    if (params.query) {
        const queryString = serializeQueryParams(params.query);
        if (queryString) {
            url += '?' + queryString;
        }
    }

    if (params.hash) {
        const hash = params.hash.startsWith('#')
            ? params.hash
            : '#' + params.hash;
        url += hash;
    }

    return url;
}
