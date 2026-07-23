import { buildCBioPortalAPIUrl } from 'shared/api/urls';
import { getServerConfig } from 'config/config';
import { WsiSlideAccess } from './wsiViewerTypes';

const CURRENT_WSI_DECODE_POLICY =
    'geometry-v2;tile-max=16777216;thumbnail-max=16777216';
const CURRENT_WSI_DECODE_PIXELS = 16_777_216;

export function validateWsiTileMetadata(metadata: WsiSlideAccess['tileMetadata']): void {
    if (
        !metadata ||
        !metadata.dimensions ||
        !Number.isInteger(metadata.dimensions.width) ||
        metadata.dimensions.width <= 0 ||
        !Number.isInteger(metadata.dimensions.height) ||
        metadata.dimensions.height <= 0 ||
        !Number.isInteger(metadata.levels) ||
        metadata.levels <= 0 ||
        !Array.isArray(metadata.level_dimensions) ||
        metadata.level_dimensions.length !== metadata.levels ||
        metadata.level_dimensions.some(
            level =>
                !level ||
                !Number.isInteger(level.width) ||
                level.width <= 0 ||
                !Number.isInteger(level.height) ||
                level.height <= 0
        ) ||
        !Number.isInteger(metadata.max_zoom) ||
        metadata.max_zoom < 0 ||
        !Number.isInteger(metadata.tile_size) ||
        metadata.tile_size <= 0
    ) {
        throw new Error('Invalid WSI tile metadata');
    }

    const schema = metadata.tile_metadata_schema_version;
    if (schema == null) return;
    if (!Number.isInteger(schema) || schema !== 2) {
        throw new Error('Invalid WSI tile metadata schema');
    }
    const safeMinLevel = metadata.safe_min_level;
    if (
        safeMinLevel == null ||
        !Number.isInteger(safeMinLevel) ||
        safeMinLevel < 0 ||
        safeMinLevel > metadata.max_zoom
    ) {
        throw new Error('Invalid WSI safe minimum level');
    }
    if (
        !Array.isArray(metadata.level_downsamples) ||
        metadata.level_downsamples.length !== metadata.levels ||
        metadata.level_downsamples.some(
            value => !Number.isFinite(value) || value <= 0
        )
    ) {
        throw new Error('Invalid WSI level downsamples');
    }
    if (metadata.decode_policy_version !== CURRENT_WSI_DECODE_POLICY) {
        throw new Error('Invalid WSI decode policy');
    }
    for (const [name, value] of [
        ['max_decode_pixels', metadata.max_decode_pixels],
        ['thumbnail_max_decode_pixels', metadata.thumbnail_max_decode_pixels],
    ] as Array<[string, number | null | undefined]>) {
        if (!Number.isInteger(value) || value !== CURRENT_WSI_DECODE_PIXELS) {
            throw new Error(`Invalid WSI ${name}`);
        }
    }
}
type WsiTokenResponse = {
    access_token: string;
    expires_in: number;
};

type WsiTokenPurpose = 'wsi' | 'annotations';

export type WsiAccessToken = {
    value: string;
    expiresAt: number;
};

const tokens = new Map<string, WsiAccessToken>();
const pendingTokens = new Map<string, Promise<string>>();

const WSI_SESSION_CACHE_PREFIXES = [
    'wsi-hierarchy-cache-',
    'wsi-metadata-cache-',
    'wsi-bootstrap-cache-',
];
let protectedSessionCachePurged = false;

function isConfiguredWsiAuthEnabled(): boolean {
    const config = getServerConfig() as ReturnType<typeof getServerConfig> & {
        msk_wsi_authentication_enabled?: boolean;
    };
    const authenticationMethod = config.authenticationMethod?.toLowerCase();
    return (
        authenticationMethod === 'saml' ||
        authenticationMethod === 'saml_plus_basic' ||
        config.msk_wsi_authentication_enabled === true
    );
}

export function isWsiAuthConfigured(): boolean {
    return isConfiguredWsiAuthEnabled();
}

export function isWsiAuthEnabled(): boolean {
    // The v2 backend contract is mandatory for every deployed viewer mode.
    return true;
}

export function getWsiSessionStorage(): Storage | null {
    if (typeof window === 'undefined') {
        return null;
    }

    try {
        const storage = window.sessionStorage;
        if (!isConfiguredWsiAuthEnabled()) {
            return storage;
        }
        if (!protectedSessionCachePurged) {
            for (let index = storage.length - 1; index >= 0; index -= 1) {
                const key = storage.key(index);
                if (
                    key &&
                    WSI_SESSION_CACHE_PREFIXES.some(prefix =>
                        key.startsWith(prefix)
                    )
                ) {
                    storage.removeItem(key);
                }
            }
            protectedSessionCachePurged = true;
        }
        return null;
    } catch (_) {
        return null;
    }
}

const slideAccess = new Map<string, WsiSlideAccess>();
const pendingSlideAccess = new Map<string, Promise<WsiSlideAccess>>();

async function requestSlideAccess(
    studyId: string,
    imageId: string
): Promise<WsiSlideAccess> {
    const url = new URL(
        buildCBioPortalAPIUrl(
            `api/wsi/v2/slides/${encodeURIComponent(
                studyId
            )}/${encodeURIComponent(imageId)}/access`
        ),
        typeof window === 'undefined'
            ? 'http://localhost'
            : window.location.origin
    );
    const response = await fetch(url.toString(), {
        credentials: 'include',
        cache: 'no-store',
    });
    if (!response.ok) {
        throw new Error(`WSI authorization failed (${response.status})`);
    }
    const payload = (await response.json()) as WsiSlideAccess;
    if (
        !payload.accessToken ||
        !payload.sourceUrl ||
        !payload.tileMetadata ||
        !payload.thumbnail?.sourceUrl ||
        !Number.isFinite(payload.thumbnail.width) ||
        !Number.isFinite(payload.thumbnail.height) ||
        !Number.isFinite(payload.expiresIn) ||
        payload.expiresIn <= 0
    ) {
        throw new Error('Invalid WSI slide access response');
    }
    validateWsiTileMetadata(payload.tileMetadata);
    const access: WsiSlideAccess = {
        ...payload,
        expiresAt: Date.now() + payload.expiresIn * 1000,
    };
    slideAccess.set(`${studyId}::${imageId}`, access);
    return access;
}

export function getWsiSlideAccess(
    studyId: string,
    imageId: string,
    forceRefresh = false
): Promise<WsiSlideAccess> {
    if (!studyId || !imageId) {
        return Promise.reject(new Error('WSI study and slide are required'));
    }
    const key = `${studyId}::${imageId}`;
    if (!forceRefresh) {
        const cached = slideAccess.get(key);
        if (
            cached &&
            cached.expiresAt &&
            cached.expiresAt > Date.now() + 30_000
        ) {
            return Promise.resolve(cached);
        }
    }
    slideAccess.delete(key);
    let request = pendingSlideAccess.get(key);
    if (!request) {
        request = requestSlideAccess(studyId, imageId).finally(() => {
            pendingSlideAccess.delete(key);
        });
        pendingSlideAccess.set(key, request);
    }
    return request;
}

export function clearWsiSlideAccess(studyId?: string): void {
    if (studyId) {
        for (const key of slideAccess.keys()) {
            if (key.startsWith(`${studyId}::`)) slideAccess.delete(key);
        }
        return;
    }
    slideAccess.clear();
    pendingSlideAccess.clear();
}

async function requestToken(
    studyId: string,
    purpose: WsiTokenPurpose = 'wsi'
): Promise<string> {
    const url = new URL(
        buildCBioPortalAPIUrl('api/wsi/access-token'),
        typeof window === 'undefined'
            ? 'http://localhost'
            : window.location.origin
    );
    url.searchParams.set('studyId', studyId);
    if (purpose === 'annotations') {
        url.searchParams.set('purpose', purpose);
    }
    const response = await fetch(url.toString(), {
        credentials: 'include',
        cache: 'no-store',
    });
    if (!response.ok) {
        throw new Error(`WSI authorization failed (${response.status})`);
    }
    const payload = (await response.json()) as WsiTokenResponse;
    if (!payload.access_token || !Number.isFinite(payload.expires_in)) {
        throw new Error('Invalid WSI authorization response');
    }
    tokens.set(tokenKey(studyId, purpose), {
        value: payload.access_token,
        expiresAt: Date.now() + payload.expires_in * 1000,
    });
    return payload.access_token;
}

function tokenKey(studyId: string, purpose: WsiTokenPurpose): string {
    return `${purpose}:${studyId}`;
}

function getAccessToken(
    studyId: string,
    purpose: WsiTokenPurpose
): Promise<string> {
    if (!studyId) {
        return Promise.reject(new Error('WSI study scope is required'));
    }
    const key = tokenKey(studyId, purpose);
    const cached = tokens.get(key);
    if (cached && cached.expiresAt > Date.now() + 30_000) {
        return Promise.resolve(cached.value);
    }
    let request = pendingTokens.get(key);
    if (!request) {
        request = requestToken(studyId, purpose).finally(() => {
            pendingTokens.delete(key);
        });
        pendingTokens.set(key, request);
    }
    return request;
}

export function getWsiAccessToken(studyId: string): Promise<string> {
    return getAccessToken(studyId, 'wsi');
}

export function getAnnotationAccessToken(studyId: string): Promise<string> {
    return getAccessToken(studyId, 'annotations');
}

export async function getWsiAccessTokenDetails(
    studyId: string,
    forceRefresh = false
): Promise<WsiAccessToken> {
    if (!studyId) {
        throw new Error('WSI study scope is required');
    }
    if (forceRefresh) {
        tokens.delete(tokenKey(studyId, 'wsi'));
    }
    await getAccessToken(studyId, 'wsi');
    return tokens.get(tokenKey(studyId, 'wsi'))!;
}

export async function fetchWsi(
    input: RequestInfo | URL,
    init?: RequestInit,
    studyId?: string
): Promise<Response> {
    if (!isWsiAuthEnabled()) {
        return init === undefined ? fetch(input) : fetch(input, init);
    }
    const requestUrl = new URL(
        input.toString(),
        typeof window === 'undefined'
            ? 'http://localhost'
            : window.location.origin
    );
    const scopedStudyId =
        studyId || requestUrl.searchParams.get('studyId') || '';
    const accessToken = await getWsiAccessToken(scopedStudyId);
    const headers = new Headers(init?.headers);
    headers.set('Authorization', `Bearer ${accessToken}`);
    return fetch(input, {
        ...(init ?? {}),
        headers,
        credentials: 'same-origin',
    });
}

export function clearWsiAccessToken(studyId?: string): void {
    if (studyId) {
        tokens.delete(tokenKey(studyId, 'wsi'));
        tokens.delete(tokenKey(studyId, 'annotations'));
        pendingTokens.delete(tokenKey(studyId, 'wsi'));
        pendingTokens.delete(tokenKey(studyId, 'annotations'));
        return;
    }
    tokens.clear();
    pendingTokens.clear();
}
