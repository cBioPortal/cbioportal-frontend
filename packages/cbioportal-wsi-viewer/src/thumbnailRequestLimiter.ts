import { abortError } from './wsiCacheUtils';

type PendingRequest<T> = {
    task: () => Promise<T>;
    signal: AbortSignal;
    resolve: (value: T | PromiseLike<T>) => void;
    reject: (reason?: unknown) => void;
    /** Called when the request leaves the queue to run. */
    onStart: () => void;
};

export const THUMBNAIL_REQUEST_CONCURRENCY = 4;

let activeRequests = 0;
const pendingRequests: PendingRequest<unknown>[] = [];

function drainQueue(): void {
    while (
        activeRequests < THUMBNAIL_REQUEST_CONCURRENCY &&
        pendingRequests.length > 0
    ) {
        const request = pendingRequests.shift()!;
        request.onStart();
        if (request.signal.aborted) {
            request.reject(abortError());
            continue;
        }

        activeRequests += 1;
        request
            .task()
            .then(request.resolve, request.reject)
            .finally(() => {
                activeRequests -= 1;
                drainQueue();
            });
    }
}

export function scheduleThumbnailRequest<T>(
    task: () => Promise<T>,
    signal: AbortSignal
): Promise<T> {
    if (signal.aborted) return Promise.reject(abortError());
    return new Promise<T>((resolve, reject) => {
        // A request cancelled while queued leaves the queue at once.
        const onAbort = () => {
            const index = pendingRequests.indexOf(
                request as PendingRequest<unknown>
            );
            if (index >= 0) pendingRequests.splice(index, 1);
            reject(abortError());
        };
        const request: PendingRequest<T> = {
            task,
            signal,
            resolve,
            reject,
            onStart: () => signal.removeEventListener('abort', onAbort),
        };
        signal.addEventListener('abort', onAbort, { once: true });
        pendingRequests.push(request as PendingRequest<unknown>);
        drainQueue();
    });
}
