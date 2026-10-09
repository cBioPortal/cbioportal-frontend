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

    it('does not cancel the shared request when one caller aborts', async () => {
        let resolveResponse!: (response: Response) => void;
        (global.fetch as jest.Mock).mockImplementation(
            () => new Promise(resolve => (resolveResponse = resolve))
        );
        const access = makeAccess();
        const abortController = new AbortController();
        const aborted = fetchWsiThumbnailBlob(
            'https://tiles.example.com',
            'study-1',
            'slide-1',
            access,
            abortController.signal
        );
        const shared = fetchWsiThumbnailBlob(
            'https://tiles.example.com',
            'study-1',
            'slide-1',
            access
        );

        abortController.abort();
        await expect(aborted).rejects.toMatchObject({ name: 'AbortError' });

        resolveResponse(
            makeResponse(200, new Blob(['thumbnail'], { type: 'image/jpeg' }), {
                'Content-Type': 'image/jpeg',
                'X-Thumbnail-Status': 'ok',
            })
        );
        await expect(shared).resolves.toBeInstanceOf(Blob);
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
