export function abortError(): DOMException {
    return new DOMException('Aborted', 'AbortError');
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
