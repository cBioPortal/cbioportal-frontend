type PendingRequest<T> = {
    task: () => Promise<T>;
    signal: AbortSignal;
    resolve: (value: T | PromiseLike<T>) => void;
    reject: (reason?: unknown) => void;
};

export const THUMBNAIL_REQUEST_CONCURRENCY = 4;

let activeRequests = 0;
const pendingRequests: PendingRequest<unknown>[] = [];

function abortError(): Error {
    const error = new Error('Thumbnail request aborted');
    error.name = 'AbortError';
    return error;
}

function drainQueue(): void {
    while (
        activeRequests < THUMBNAIL_REQUEST_CONCURRENCY &&
        pendingRequests.length > 0
    ) {
        const request = pendingRequests.shift()!;
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
    return new Promise<T>((resolve, reject) => {
        const request: PendingRequest<T> = {
            task,
            signal,
            resolve,
            reject,
        };
        pendingRequests.push(request as PendingRequest<unknown>);
        drainQueue();
    });
}
