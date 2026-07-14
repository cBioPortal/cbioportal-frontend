import { PatientHierarchy } from './wsiViewerTypes';

const HIERARCHY_CACHE_TTL_MS = 5 * 60 * 1000;
const HIERARCHY_STORAGE_KEY_PREFIX = 'wsi-hierarchy-cache::';

type CachedHierarchyEntry = {
    expiresAt: number;
    promise: Promise<PatientHierarchy>;
};

const hierarchyCache = new Map<string, CachedHierarchyEntry>();

function getHierarchyStorageKey(url: string): string {
    return `${HIERARCHY_STORAGE_KEY_PREFIX}${url}`;
}

function getSessionStorage(): Storage | null {
    if (typeof window === 'undefined') {
        return null;
    }

    try {
        return window.sessionStorage;
    } catch (_) {
        return null;
    }
}

function readPersistedHierarchy(url: string): CachedHierarchyEntry | undefined {
    const storage = getSessionStorage();
    if (!storage) {
        return undefined;
    }

    try {
        const raw = storage.getItem(getHierarchyStorageKey(url));
        if (!raw) {
            return undefined;
        }

        const parsed = JSON.parse(raw) as {
            expiresAt?: number;
            data?: PatientHierarchy;
        };
        if (
            !parsed ||
            typeof parsed.expiresAt !== 'number' ||
            !parsed.data ||
            parsed.expiresAt <= Date.now()
        ) {
            storage.removeItem(getHierarchyStorageKey(url));
            return undefined;
        }

        return {
            expiresAt: parsed.expiresAt,
            promise: Promise.resolve(parsed.data),
        };
    } catch (_) {
        return undefined;
    }
}

function persistHierarchy(
    url: string,
    expiresAt: number,
    hierarchy: PatientHierarchy
): void {
    const storage = getSessionStorage();
    if (!storage) {
        return;
    }

    try {
        storage.setItem(
            getHierarchyStorageKey(url),
            JSON.stringify({
                expiresAt,
                data: hierarchy,
            })
        );
    } catch (_) {
        // Ignore storage quota or serialization failures.
    }
}

function clonePatientHierarchy(
    hierarchy: PatientHierarchy
): PatientHierarchy {
    // The hierarchy is plain JSON and consumers mutate it after load, so return
    // a fresh deep copy to keep the shared cache immutable from callers.
    if (typeof structuredClone === 'function') {
        return structuredClone(hierarchy) as PatientHierarchy;
    }
    return JSON.parse(JSON.stringify(hierarchy)) as PatientHierarchy;
}

function wrapWithAbort<T>(
    promise: Promise<T>,
    signal?: AbortSignal
): Promise<T> {
    if (!signal) {
        return promise;
    }

    if (signal.aborted) {
        return Promise.reject(new DOMException('Aborted', 'AbortError'));
    }

    return new Promise<T>((resolve, reject) => {
        const onAbort = () => {
            cleanup();
            reject(new DOMException('Aborted', 'AbortError'));
        };
        const cleanup = () => {
            signal.removeEventListener('abort', onAbort);
        };

        signal.addEventListener('abort', onAbort, { once: true });
        promise.then(
            value => {
                cleanup();
                resolve(value);
            },
            error => {
                cleanup();
                reject(error);
            }
        );
    });
}

function getOrCreateHierarchyRequest(url: string): Promise<PatientHierarchy> {
    const now = Date.now();
    const cached = hierarchyCache.get(url);
    if (cached && cached.expiresAt > now) {
        return cached.promise;
    }

    const persisted = readPersistedHierarchy(url);
    if (persisted) {
        hierarchyCache.set(url, persisted);
        return persisted.promise;
    }

    const expiresAt = now + HIERARCHY_CACHE_TTL_MS;

    const promise = fetch(url)
        .then(async response => {
            if (!response.ok) {
                throw new Error(`Server returned ${response.status}`);
            }
            const hierarchy = (await response.json()) as PatientHierarchy;
            persistHierarchy(url, expiresAt, hierarchy);
            return hierarchy;
        })
        .catch(error => {
            const current = hierarchyCache.get(url);
            if (current?.promise === promise) {
                hierarchyCache.delete(url);
            }
            throw error;
        });

    hierarchyCache.set(url, {
        expiresAt,
        promise,
    });
    return promise;
}

export async function fetchPatientHierarchy(
    url: string,
    signal?: AbortSignal
): Promise<PatientHierarchy> {
    const hierarchy = await wrapWithAbort(
        getOrCreateHierarchyRequest(url),
        signal
    );
    return clonePatientHierarchy(hierarchy);
}

export async function fetchPatientHierarchyReadOnly(
    url: string,
    signal?: AbortSignal
): Promise<PatientHierarchy> {
    return wrapWithAbort(getOrCreateHierarchyRequest(url), signal);
}

export async function preloadPatientHierarchy(url: string): Promise<void> {
    await getOrCreateHierarchyRequest(url);
}

export function hasCachedPatientHierarchy(url: string): boolean {
    const cached = hierarchyCache.get(url);
    return (
        (!!cached && cached.expiresAt > Date.now()) ||
        !!readPersistedHierarchy(url)
    );
}

export function clearPatientHierarchyCache() {
    hierarchyCache.clear();
    const storage = getSessionStorage();
    if (!storage) {
        return;
    }

    try {
        for (let index = storage.length - 1; index >= 0; index -= 1) {
            const key = storage.key(index);
            if (key?.startsWith(HIERARCHY_STORAGE_KEY_PREFIX)) {
                storage.removeItem(key);
            }
        }
    } catch (_) {
        // Ignore storage access failures.
    }
}
