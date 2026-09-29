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
        imageId: 'slide-1',
        sourceUrl: 's3://slides/slide-1.svs',
        tileMetadata: {} as WsiSlideAccess['tileMetadata'],
        thumbnail: {
            sourceUrl: 's3://slides/slide-1.jpg',
            width: 128,
            height: 88,
            contentType: 'image/jpeg',
        },
        accessToken: 'token-1',
        tokenType: 'Bearer',
        expiresIn: 300,
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
                    'X-WSI-Source': 's3://slides/slide-1.jpg',
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

    it('does not cancel the shared request when one caller aborts', async () => {
        let resolveResponse!: (response: Response) => void;
        let requestSignal!: AbortSignal;
        (global.fetch as jest.Mock).mockImplementation(
            (_url: string, init: RequestInit) => {
                requestSignal = init.signal!;
                return new Promise(resolve => (resolveResponse = resolve));
            }
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
        expect(requestSignal.aborted).toBe(false);
        expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    it('aborts and evicts the request when all consumers abort', async () => {
        let requestSignal!: AbortSignal;
        (global.fetch as jest.Mock).mockImplementation(
            (_url: string, init: RequestInit) =>
                new Promise((_resolve, reject) => {
                    requestSignal = init.signal!;
                    requestSignal.addEventListener(
                        'abort',
                        () => reject(new DOMException('Aborted', 'AbortError')),
                        { once: true }
                    );
                })
        );
        const access = makeAccess();
        const abortController = new AbortController();
        const pending = fetchWsiThumbnailBlob(
            'https://tiles.example.com',
            'study-1',
            'slide-1',
            access,
            abortController.signal
        );

        abortController.abort();
        await expect(pending).rejects.toMatchObject({ name: 'AbortError' });
        expect(requestSignal.aborted).toBe(true);

        (global.fetch as jest.Mock).mockResolvedValueOnce(
            makeResponse(200, new Blob(['thumbnail'], { type: 'image/jpeg' }), {
                'Content-Type': 'image/jpeg',
                'X-Thumbnail-Status': 'ok',
            })
        );
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
