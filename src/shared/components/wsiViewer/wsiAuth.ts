import { buildCBioPortalAPIUrl } from 'shared/api/urls';
import { getServerConfig } from 'config/config';

type WsiTokenResponse = {
    access_token: string;
    expires_in: number;
};

export type WsiAccessToken = {
    value: string;
    expiresAt: number;
};

const tokens = new Map<string, WsiAccessToken>();
const pending = new Map<string, Promise<string>>();

export function isWsiAuthEnabled(): boolean {
    const config = getServerConfig() as ReturnType<typeof getServerConfig> & {
        msk_wsi_authentication_enabled?: boolean;
    };
    return (
        config.authenticationMethod === 'saml_plus_basic' ||
        config.msk_wsi_authentication_enabled === true
    );
}

async function requestToken(studyId: string): Promise<string> {
    const url = new URL(
        buildCBioPortalAPIUrl('api/wsi/access-token'),
        typeof window === 'undefined'
            ? 'http://localhost'
            : window.location.origin
    );
    url.searchParams.set('studyId', studyId);
    const response = await fetch(url.toString(), {
        credentials: 'same-origin',
        cache: 'no-store',
    });
    if (!response.ok) {
        throw new Error(`WSI authorization failed (${response.status})`);
    }
    const payload = (await response.json()) as WsiTokenResponse;
    if (!payload.access_token || !Number.isFinite(payload.expires_in)) {
        throw new Error('Invalid WSI authorization response');
    }
    tokens.set(studyId, {
        value: payload.access_token,
        expiresAt: Date.now() + payload.expires_in * 1000,
    });
    return payload.access_token;
}

export function getWsiAccessToken(studyId: string): Promise<string> {
    if (!studyId) {
        return Promise.reject(new Error('WSI study scope is required'));
    }
    const cached = tokens.get(studyId);
    if (cached && cached.expiresAt > Date.now() + 30_000) {
        return Promise.resolve(cached.value);
    }
    let request = pending.get(studyId);
    if (!request) {
        request = requestToken(studyId).finally(() => {
            pending.delete(studyId);
        });
        pending.set(studyId, request);
    }
    return request;
}

export async function getWsiAccessTokenDetails(
    studyId: string,
    forceRefresh = false
): Promise<WsiAccessToken> {
    if (!studyId) {
        throw new Error('WSI study scope is required');
    }
    if (forceRefresh) {
        tokens.delete(studyId);
    }
    await getWsiAccessToken(studyId);
    return tokens.get(studyId)!;
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
        tokens.delete(studyId);
        pending.delete(studyId);
        return;
    }
    tokens.clear();
    pending.clear();
}
