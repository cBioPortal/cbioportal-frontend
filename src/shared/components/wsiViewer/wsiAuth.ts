import { buildCBioPortalAPIUrl } from 'shared/api/urls';
import { getServerConfig } from 'config/config';
import { WsiSlideAccess } from './wsiViewerTypes';

const WSI_SESSION_CACHE_PREFIXES = [
    'wsi-hierarchy-cache-',
    'wsi-metadata-cache-',
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
        if (cached && cached.expiresAt && cached.expiresAt > Date.now() + 30_000) {
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
