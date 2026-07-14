/**
 * @jest-environment jsdom
 */
import {
    clearSlideMetadataCache,
    fetchSlideMetadataCached,
    hasCachedSlideMetadata,
    preloadSlideMetadata,
} from './wsiMetadataFetchCache';

describe('wsiMetadataFetchCache', () => {
    let originalFetch: typeof globalThis.fetch;

    beforeEach(() => {
        originalFetch = (global as any).fetch;
        clearSlideMetadataCache();
    });

    afterEach(() => {
        (global as any).fetch = originalFetch;
        clearSlideMetadataCache();
    });

    it('deduplicates concurrent metadata requests for the same slide', async () => {
        const metadata = {
            dimensions: { width: 1000, height: 800 },
            levels: 1,
            level_dimensions: [{ width: 1000, height: 800 }],
            max_zoom: 6,
            tile_size: 256,
        };
        const fetchMock = jest.fn().mockResolvedValue({
            ok: true,
            json: () => Promise.resolve(metadata),
        });
        (global as any).fetch = fetchMock;

        const [first, second] = await Promise.all([
            fetchSlideMetadataCached('https://tiles.example.com', 'A'),
            fetchSlideMetadataCached('https://tiles.example.com', 'A'),
        ]);

        expect(fetchMock).toHaveBeenCalledTimes(1);
        expect(first).toEqual(metadata);
        expect(second).toEqual(metadata);
    });

    it('preloads slide metadata into cache for later fetches', async () => {
        const metadata = {
            dimensions: { width: 1000, height: 800 },
            levels: 1,
            level_dimensions: [{ width: 1000, height: 800 }],
            max_zoom: 6,
            tile_size: 256,
        };
        const fetchMock = jest.fn().mockResolvedValue({
            ok: true,
            json: () => Promise.resolve(metadata),
        });
        (global as any).fetch = fetchMock;

        await preloadSlideMetadata('https://tiles.example.com', 'A');
        const fetched = await fetchSlideMetadataCached(
            'https://tiles.example.com',
            'A'
        );

        expect(fetchMock).toHaveBeenCalledTimes(1);
        expect(fetched).toEqual(metadata);
    });

    it('lets aborted callers exit without cancelling the shared metadata request', async () => {
        let resolveFetch!: (value: unknown) => void;
        const fetchMock = jest.fn().mockImplementation(
            () =>
                new Promise(resolve => {
                    resolveFetch = resolve;
                })
        );
        (global as any).fetch = fetchMock;

        const abortController = new AbortController();
        const abortedPromise = fetchSlideMetadataCached(
            'https://tiles.example.com',
            'A',
            abortController.signal
        );
        const sharedPromise = fetchSlideMetadataCached(
            'https://tiles.example.com',
            'A'
        );

        abortController.abort();

        await expect(abortedPromise).rejects.toMatchObject({
            name: 'AbortError',
        });

        resolveFetch({
            ok: true,
            json: () =>
                Promise.resolve({
                    dimensions: { width: 1000, height: 800 },
                    levels: 1,
                    level_dimensions: [{ width: 1000, height: 800 }],
                    max_zoom: 6,
                    tile_size: 256,
                }),
        });

        await expect(sharedPromise).resolves.toMatchObject({
            max_zoom: 6,
        });
        expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it('hydrates slide metadata from sessionStorage across in-memory cache clears', async () => {
        const metadata = {
            dimensions: { width: 1000, height: 800 },
            levels: 1,
            level_dimensions: [{ width: 1000, height: 800 }],
            max_zoom: 6,
            tile_size: 256,
        };
        const fetchMock = jest.fn().mockResolvedValue({
            ok: true,
            json: () => Promise.resolve(metadata),
        });
        (global as any).fetch = fetchMock;

        await preloadSlideMetadata('https://tiles.example.com', 'A');

        expect(fetchMock).toHaveBeenCalledTimes(1);

        const storedEntries = Object.keys(window.sessionStorage).filter(key =>
            key.startsWith('wsi-metadata-cache::')
        );
        expect(storedEntries).toHaveLength(1);

        const persistedValue = window.sessionStorage.getItem(storedEntries[0]);
        clearSlideMetadataCache();
        if (persistedValue) {
            window.sessionStorage.setItem(storedEntries[0], persistedValue);
        }

        const fetched = await fetchSlideMetadataCached(
            'https://tiles.example.com',
            'A'
        );

        expect(fetchMock).toHaveBeenCalledTimes(1);
        expect(fetched).toEqual(metadata);
    });

    it('reports persisted slide metadata entries as cached', async () => {
        const metadata = {
            dimensions: { width: 1000, height: 800 },
            levels: 1,
            level_dimensions: [{ width: 1000, height: 800 }],
            max_zoom: 6,
            tile_size: 256,
        };
        const fetchMock = jest.fn().mockResolvedValue({
            ok: true,
            json: () => Promise.resolve(metadata),
        });
        (global as any).fetch = fetchMock;

        await preloadSlideMetadata('https://tiles.example.com', 'A');

        const storedEntries = Object.keys(window.sessionStorage).filter(key =>
            key.startsWith('wsi-metadata-cache::')
        );
        const persistedValue = window.sessionStorage.getItem(storedEntries[0]);

        clearSlideMetadataCache();
        if (persistedValue) {
            window.sessionStorage.setItem(storedEntries[0], persistedValue);
        }

        expect(
            hasCachedSlideMetadata('https://tiles.example.com', 'A')
        ).toBe(true);
    });
});
