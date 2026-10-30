/**
 * @jest-environment jsdom
 */
import {
    clearWsiThumbnailFetchCache,
    fetchWsiThumbnailBlob,
    WsiThumbnailFetchError,
} from './wsiThumbnailFetchCache';
import { WsiSlideSource } from './wsiViewerTypes';

function makeSource(overrides: Partial<WsiSlideSource> = {}): WsiSlideSource {
    return {
        slideKey: 'slide-1',
        servingKey: 'slide-1',
        sealedSource: 'sealed-1',
        thumbnailWidth: 1024,
        thumbnailHeight: 768,
        tileMetadata: {} as WsiSlideSource['tileMetadata'],
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
        const source = makeSource();
        const first = fetchWsiThumbnailBlob(
            'https://tiles.example.com',
            'study-1',
            source
        );
        const second = fetchWsiThumbnailBlob(
            'https://tiles.example.com',
            'study-1',
            source
        );

        const [firstBlob, secondBlob] = await Promise.all([first, second]);

        expect(global.fetch).toHaveBeenCalledTimes(1);
        expect(global.fetch).toHaveBeenCalledWith(
            'https://tiles.example.com/thumbnails?studyId=study-1&key=slide-1&enc=sealed-1&tw=1024&th=768&width=128&height=96',
            expect.objectContaining({
                cache: 'default',
                credentials: 'same-origin',
            })
        );
        // The session cookie authorizes the request; no bearer token.
        const init = (global.fetch as jest.Mock).mock.calls[0][1];
        expect(init.headers).toBeUndefined();
        expect(firstBlob).toBe(secondBlob);

        await expect(
            fetchWsiThumbnailBlob(
                'https://tiles.example.com',
                'study-1',
                source
            )
        ).resolves.toBe(firstBlob);
        expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    it('keeps one thumbnail per user', async () => {
        await fetchWsiThumbnailBlob(
            'https://tiles.example.com',
            'study-1',
            makeSource(),
            undefined,
            'default',
            'user-a'
        );
        await fetchWsiThumbnailBlob(
            'https://tiles.example.com',
            'study-1',
            makeSource(),
            undefined,
            'default',
            'user-b'
        );
        expect(global.fetch).toHaveBeenCalledTimes(2);
    });

    it.each([401, 403])(
        'reports a %s from the portal session check as final',
        async status => {
            (global.fetch as jest.Mock).mockResolvedValueOnce(
                makeResponse(status, '', { 'Content-Type': 'text/html' })
            );

            const error = await fetchWsiThumbnailBlob(
                'https://tiles.example.com',
                'study-1',
                makeSource()
            ).catch(e => e);

            expect(error).toBeInstanceOf(WsiThumbnailFetchError);
            expect(error.retryable).toBe(false);
            expect(error.response.status).toBe(status);
        }
    );

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
        const source = makeSource();

        await expect(
            fetchWsiThumbnailBlob(
                'https://tiles.example.com',
                'study-1',
                source
            )
        ).rejects.toBeInstanceOf(WsiThumbnailFetchError);
        await expect(
            fetchWsiThumbnailBlob(
                'https://tiles.example.com',
                'study-1',
                source
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
            makeSource(),
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
                makeSource()
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
