/**
 * The error an aborted wait rejects with. Callers match it by name, so a
 * plain Error works where DOMException is unavailable (e.g. Node tests).
 */
export function abortError(): Error {
    const error = new Error('Aborted');
    error.name = 'AbortError';
    return error;
}

/**
 * Lets one caller stop waiting on a shared promise without cancelling it for
 * the other callers.
 */
export function withAbort<T>(
    promise: Promise<T>,
    signal?: AbortSignal
): Promise<T> {
    if (!signal) {
        return promise;
    }
    if (signal.aborted) {
        return Promise.reject(abortError());
    }

    return new Promise<T>((resolve, reject) => {
        const onAbort = () => reject(abortError());
        signal.addEventListener('abort', onAbort, { once: true });
        promise.then(resolve, reject).finally(() => {
            signal.removeEventListener('abort', onAbort);
        });
    });
}

/** Deletes the entries of a TTL cache whose `expiresAt` has passed. */
export function deleteExpiredEntries(
    cache: Map<string, { expiresAt?: number }>,
    now = Date.now()
): void {
    for (const [key, entry] of cache) {
        if (entry.expiresAt !== undefined && entry.expiresAt <= now) {
            cache.delete(key);
        }
    }
}

/** Promises shared by key, such as one request per patient or slide. */
export interface PromiseCache<T> {
    /**
     * The pending or unexpired promise for `key`, else the one `load`
     * starts. `refresh` replaces a settled entry but still joins a pending
     * one. A rejected load is forgotten, so the next call retries it.
     */
    get(key: string, load: () => Promise<T>, refresh?: boolean): Promise<T>;
    /** Forgets the entries whose key matches; all entries when unset. */
    clear(matches?: (key: string) => boolean): void;
}

/**
 * Creates a PromiseCache. `expiresAt` gives the time (ms since the epoch)
 * at which a resolved value goes stale; values never expire by default.
 */
export function createPromiseCache<T>(
    expiresAt: (value: T) => number = () => Infinity
): PromiseCache<T> {
    const entries = new Map<
        string,
        { promise: Promise<T>; expiresAt?: number }
    >();
    return {
        get(key, load, refresh = false) {
            const now = Date.now();
            const cached = entries.get(key);
            if (
                cached &&
                (cached.expiresAt === undefined ||
                    (!refresh && cached.expiresAt > now))
            ) {
                return cached.promise;
            }
            deleteExpiredEntries(entries, now);
            const entry: { promise: Promise<T>; expiresAt?: number } = {
                promise: load(),
            };
            entries.set(key, entry);
            entry.promise.then(
                value => {
                    if (entries.get(key) === entry) {
                        entry.expiresAt = expiresAt(value);
                    }
                },
                () => {
                    if (entries.get(key) === entry) entries.delete(key);
                }
            );
            return entry.promise;
        },
        clear(matches) {
            if (!matches) {
                entries.clear();
                return;
            }
            for (const key of Array.from(entries.keys())) {
                if (matches(key)) entries.delete(key);
            }
        },
    };
}
