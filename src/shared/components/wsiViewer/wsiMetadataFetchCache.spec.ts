/**
 * @jest-environment jsdom
 */
import {
    clearSlideMetadataCache,
    fetchSlideMetadataCached,
    fetchSlideMetadataCachedReadOnly,
    hasCachedSlideMetadata,
    preloadSlideMetadata,
    seedSlideMetadataCache,
} from './wsiMetadataFetchCache';

describe('wsiMetadataFetchCache', () => {
    let originalFetch: typeof globalThis.fetch;

    function makeMetadata() {
        return {
            dimensions: { width: 1000, height: 800 },
            levels: 1,
            level_dimensions: [{ width: 1000, height: 800 }],
            max_zoom: 6,
            tile_size: 256,
        };
    }

    function makeRichMetadata() {
        return {
            dimensions: { width: 1000, height: 800 },
            levels: 1,
            level_dimensions: [{ width: 1000, height: 800 }],
            max_zoom: 6,
            tile_size: 256,
            mpp: { x: 0.25, y: 0.3 },
            objective_power: 40,
        };
    }

    beforeEach(() => {
        originalFetch = (global as any).fetch;
        clearSlideMetadataCache();
    });

    afterEach(() => {
        (global as any).fetch = originalFetch;
        clearSlideMetadataCache();
    });

    it('deduplicates concurrent metadata requests for the same slide', async () => {
        const metadata = makeMetadata();
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
        expect(first).not.toBe(second);
    });

    it('returns cloned metadata objects so consumers cannot mutate the cache', async () => {
        const fetchMock = jest.fn().mockResolvedValue({
            ok: true,
            json: () => Promise.resolve(makeMetadata()),
        });
        (global as any).fetch = fetchMock;

        const first = await fetchSlideMetadataCached(
            'https://tiles.example.com',
            'A'
        );
        first.dimensions.width = 1;

        const second = await fetchSlideMetadataCached(
            'https://tiles.example.com',
            'A'
        );

        expect(fetchMock).toHaveBeenCalledTimes(1);
        expect(second.dimensions.width).toBe(1000);
    });

    it('clones optional metadata fields so callers cannot mutate cached rich metadata', async () => {
        const fetchMock = jest.fn().mockResolvedValue({
            ok: true,
            json: () => Promise.resolve(makeRichMetadata()),
        });
        (global as any).fetch = fetchMock;

        const first = await fetchSlideMetadataCached(
            'https://tiles.example.com',
            'A'
        );
        first.mpp!.x = 9;
        first.level_dimensions[0].width = 1;

        const second = await fetchSlideMetadataCached(
            'https://tiles.example.com',
            'A'
        );

        expect(fetchMock).toHaveBeenCalledTimes(1);
        expect(second.mpp).toEqual({ x: 0.25, y: 0.3 });
        expect(second.level_dimensions[0].width).toBe(1000);
        expect(second.objective_power).toBe(40);
    });

    it('lets read-only consumers reuse the cached metadata object without cloning', async () => {
        const fetchMock = jest.fn().mockResolvedValue({
            ok: true,
            json: () => Promise.resolve(makeMetadata()),
        });
        (global as any).fetch = fetchMock;

        const first = await fetchSlideMetadataCachedReadOnly(
            'https://tiles.example.com',
            'A'
        );
        const second = await fetchSlideMetadataCachedReadOnly(
            'https://tiles.example.com',
            'A'
        );

        expect(fetchMock).toHaveBeenCalledTimes(1);
        expect(second).toBe(first);
    });

    it('preloads slide metadata into cache for later fetches', async () => {
        const metadata = makeMetadata();
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
        expect(fetched).not.toBe(metadata);
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
        const metadata = makeMetadata();
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
        expect(fetched).not.toBe(metadata);
    });

    it('hydrates cloned metadata from sessionStorage so callers cannot mutate persisted cache state', async () => {
        const metadata = makeMetadata();
        seedSlideMetadataCache('https://tiles.example.com', 'A', metadata);

        const storedEntries = Object.keys(window.sessionStorage).filter(key =>
            key.startsWith('wsi-metadata-cache::')
        );
        const persistedValue = window.sessionStorage.getItem(storedEntries[0]);

        clearSlideMetadataCache();
        if (persistedValue) {
            window.sessionStorage.setItem(storedEntries[0], persistedValue);
        }

        const first = await fetchSlideMetadataCached(
            'https://tiles.example.com',
            'A'
        );
        first.level_dimensions[0].width = 1;

        const second = await fetchSlideMetadataCached(
            'https://tiles.example.com',
            'A'
        );

        expect(second.level_dimensions[0].width).toBe(1000);
    });

    it('reports persisted slide metadata entries as cached', async () => {
        const metadata = makeMetadata();
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
