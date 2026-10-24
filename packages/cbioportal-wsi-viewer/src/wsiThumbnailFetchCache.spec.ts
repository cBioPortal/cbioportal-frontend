/**
 * @jest-environment jsdom
 */
import {
    clearWsiThumbnailFetchCache,
    fetchWsiThumbnailBlob,
    WsiThumbnailFetchError,
} from './wsiThumbnailFetchCache';
import { WsiSlideAccess } from './wsiViewerTypes';

function makeAccess(overrides: Partial<WsiSlideAccess> = {}): WsiSlideAccess {
    return {
        slideKey: 'slide-1',
        tileMetadata: {} as WsiSlideAccess['tileMetadata'],
        accessToken: 'token-1',
        expiresIn: 300,
        expiresAt: Date.now() + 300_000,
        ...overrides,
    };
}

function makeResponse(
    status: number,
    body: Blob | string,
    headers: Record<string, string> = {}
): Response {
    return {
        ok: status >= 200 && status < 300,
        status,
        headers: new Headers(headers),
        blob: async () =>
            body instanceof Blob
                ? body
                : new Blob([body], { type: headers['Content-Type'] }),
    } as Response;
}

describe('wsiThumbnailFetchCache', () => {
    beforeEach(() => {
        clearWsiThumbnailFetchCache();
        global.fetch = jest.fn().mockResolvedValue(
            makeResponse(200, new Blob(['thumbnail'], { type: 'image/jpeg' }), {
                'Cache-Control': 'private, max-age=300',
                'Content-Type': 'image/jpeg',
                'X-Thumbnail-Status': 'ok',
            })
        ) as typeof fetch;
    });

    afterEach(() => {
        clearWsiThumbnailFetchCache();
    });

    it('shares one canonical request between concurrent consumers', async () => {
        const access = makeAccess();
        const first = fetchWsiThumbnailBlob(
            'https://tiles.example.com',
            'study-1',
            'slide-1',
            access
        );
        const second = fetchWsiThumbnailBlob(
            'https://tiles.example.com',
            'study-1',
            'slide-1',
            access
        );

        const [firstBlob, secondBlob] = await Promise.all([first, second]);

        expect(global.fetch).toHaveBeenCalledTimes(1);
        expect(global.fetch).toHaveBeenCalledWith(
            'https://tiles.example.com/thumbnails?width=128&height=96',
            expect.objectContaining({
                cache: 'default',
                headers: {
                    Authorization: 'Bearer token-1',
                },
            })
        );
        expect(firstBlob).toBe(secondBlob);

        await expect(
            fetchWsiThumbnailBlob(
                'https://tiles.example.com',
                'study-1',
                'slide-1',
                access
            )
        ).resolves.toBe(firstBlob);
        expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    it('keeps a cached thumbnail when the access token is refreshed', async () => {
        const blob = await fetchWsiThumbnailBlob(
            'https://tiles.example.com',
            'study-1',
            'slide-1',
            makeAccess()
        );

        await expect(
            fetchWsiThumbnailBlob(
                'https://tiles.example.com',
                'study-1',
                'slide-1',
                makeAccess({ accessToken: 'token-2' })
            )
        ).resolves.toBe(blob);
        expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    it('evicts failed requests so a later attempt can recover', async () => {
        const firstResponse = makeResponse(502, '{}', {
            'Content-Type': 'application/json',
        });
        const secondResponse = makeResponse(
            200,
            new Blob(['thumbnail'], { type: 'image/jpeg' }),
            {
                'Content-Type': 'image/jpeg',
                'X-Thumbnail-Status': 'ok',
            }
        );
        (global.fetch as jest.Mock)
            .mockResolvedValueOnce(firstResponse)
            .mockResolvedValueOnce(secondResponse);
        const access = makeAccess();

        await expect(
            fetchWsiThumbnailBlob(
                'https://tiles.example.com',
                'study-1',
                'slide-1',
                access
            )
        ).rejects.toBeInstanceOf(WsiThumbnailFetchError);
        await expect(
            fetchWsiThumbnailBlob(
                'https://tiles.example.com',
                'study-1',
                'slide-1',
                access
            )
        ).resolves.toBeInstanceOf(Blob);
        expect(global.fetch).toHaveBeenCalledTimes(2);
    });
});

describe('wsiThumbnailFetchCache cancellation', () => {
    const okResponse = () =>
        makeResponse(200, new Blob(['thumbnail'], { type: 'image/jpeg' }), {
            'Content-Type': 'image/jpeg',
            'X-Thumbnail-Status': 'ok',
        });
    let requests: {
        signal: AbortSignal;
        resolve: (response: Response) => void;
    }[];

    const fetchThumbnail = (signal?: AbortSignal) =>
        fetchWsiThumbnailBlob(
            'https://tiles.example.com',
            'study-1',
            'slide-1',
            makeAccess(),
            signal
        );

    beforeEach(() => {
        clearWsiThumbnailFetchCache();
        requests = [];
        // Each request stays pending until the test answers it, and rejects
        // like fetch does once its signal aborts.
        global.fetch = jest.fn(
            (_url: RequestInfo, init?: RequestInit) =>
                new Promise<Response>((resolve, reject) => {
                    const signal = init!.signal!;
                    signal.addEventListener('abort', () => {
                        const error = new Error('Aborted');
                        error.name = 'AbortError';
                        reject(error);
                    });
                    requests.push({ signal, resolve });
                })
        ) as typeof fetch;
    });

    afterEach(() => {
        clearWsiThumbnailFetchCache();
    });

    it('cancels the request when its only caller aborts', async () => {
        const controller = new AbortController();
        const thumbnail = fetchThumbnail(controller.signal);
        expect(requests).toHaveLength(1);
        expect(requests[0].signal.aborted).toBe(false);

        controller.abort();

        await expect(thumbnail).rejects.toMatchObject({ name: 'AbortError' });
        expect(requests[0].signal.aborted).toBe(true);
    });

    it('keeps the request for the callers still waiting on it', async () => {
        const first = new AbortController();
        const firstThumbnail = fetchThumbnail(first.signal);
        const secondThumbnail = fetchThumbnail(new AbortController().signal);
        expect(requests).toHaveLength(1);

        first.abort();
        await expect(firstThumbnail).rejects.toMatchObject({
            name: 'AbortError',
        });
        expect(requests[0].signal.aborted).toBe(false);

        requests[0].resolve(okResponse());
        await expect(secondThumbnail).resolves.toBeInstanceOf(Blob);
    });

    it('never cancels a request a caller without a signal waits on', async () => {
        const controller = new AbortController();
        const unsignalled = fetchThumbnail();
        const signalled = fetchThumbnail(controller.signal);

        controller.abort();
        await expect(signalled).rejects.toMatchObject({ name: 'AbortError' });
        expect(requests[0].signal.aborted).toBe(false);

        requests[0].resolve(okResponse());
        await expect(unsignalled).resolves.toBeInstanceOf(Blob);
    });

    it('starts a fresh request once the last caller has aborted', async () => {
        const controller = new AbortController();
        const cancelled = fetchThumbnail(controller.signal);
        controller.abort();
        await expect(cancelled).rejects.toMatchObject({ name: 'AbortError' });

        const thumbnail = fetchThumbnail(new AbortController().signal);
        expect(requests).toHaveLength(2);
        expect(requests[1].signal.aborted).toBe(false);

        requests[1].resolve(okResponse());
        await expect(thumbnail).resolves.toBeInstanceOf(Blob);
        // The cancelled request left nothing behind in the cache.
        await expect(fetchThumbnail()).resolves.toBeInstanceOf(Blob);
        expect(requests).toHaveLength(2);
    });

    it('does not start a request for a caller that has already aborted', async () => {
        const controller = new AbortController();
        controller.abort();

        await expect(fetchThumbnail(controller.signal)).rejects.toMatchObject({
            name: 'AbortError',
        });
        expect(requests).toHaveLength(0);
    });

    it('caches a completed request even after its caller aborts', async () => {
        const controller = new AbortController();
        const thumbnail = fetchThumbnail(controller.signal);
        requests[0].resolve(okResponse());
        const blob = await thumbnail;

        controller.abort();
        await expect(
            fetchThumbnail(new AbortController().signal)
        ).resolves.toBe(blob);
        expect(requests).toHaveLength(1);
        expect(requests[0].signal.aborted).toBe(false);
    });
});

describe('wsiThumbnailFetchCache expiry', () => {
    afterEach(() => {
        clearWsiThumbnailFetchCache();
        jest.useRealTimers();
    });

    it('refetches once the Cache-Control max-age has passed', async () => {
        jest.useFakeTimers();
        global.fetch = jest.fn().mockResolvedValue(
            makeResponse(200, new Blob(['thumbnail'], { type: 'image/jpeg' }), {
                'Cache-Control': 'private, max-age=60',
                'Content-Type': 'image/jpeg',
            })
        ) as typeof fetch;
        const fetchThumbnail = () =>
            fetchWsiThumbnailBlob(
                'https://tiles.example.com',
                'study-1',
                'slide-1',
                makeAccess({ expiresAt: Date.now() + 300_000 })
            );

        await fetchThumbnail();
        jest.advanceTimersByTime(59_000);
        await fetchThumbnail();
        expect(global.fetch).toHaveBeenCalledTimes(1);

        jest.advanceTimersByTime(2_000);
        await fetchThumbnail();
        expect(global.fetch).toHaveBeenCalledTimes(2);
    });
});
