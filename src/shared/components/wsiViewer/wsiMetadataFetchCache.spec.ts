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
import { getWsiSlideAccess } from './wsiAuth';

jest.mock('./wsiAuth', () => ({
    ...jest.requireActual('./wsiAuth'),
    getWsiSlideAccess: jest.fn(),
}));

const mockGetWsiSlideAccess = getWsiSlideAccess as jest.MockedFunction<
    typeof getWsiSlideAccess
>;

describe('wsiMetadataFetchCache', () => {
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

    function mockAccess(metadata = makeMetadata()) {
        mockGetWsiSlideAccess.mockResolvedValue({
            imageId: 'A',
            sourceUrl: 's3://bucket/A.svs',
            tileMetadata: metadata,
            thumbnail: {
                sourceUrl: 's3://bucket/A.jpg',
                width: 128,
                height: 96,
                contentType: 'image/jpeg',
            },
            accessToken: 'token',
            tokenType: 'Bearer',
            expiresIn: 300,
        });
    }

    beforeEach(() => {
        clearSlideMetadataCache();
        mockGetWsiSlideAccess.mockReset();
        mockAccess();
    });

    afterEach(() => {
        clearSlideMetadataCache();
    });

    it('deduplicates concurrent metadata requests for the same slide', async () => {
        const metadata = makeMetadata();
        mockAccess(metadata);

        const [first, second] = await Promise.all([
            fetchSlideMetadataCached('https://tiles.example.com', 'A', undefined, 'study-1'),
            fetchSlideMetadataCached('https://tiles.example.com', 'A', undefined, 'study-1'),
        ]);

        expect(mockGetWsiSlideAccess).toHaveBeenCalledTimes(1);
        expect(first).toEqual(metadata);
        expect(second).toEqual(metadata);
        expect(first).not.toBe(second);
    });

    it('returns cloned metadata objects so consumers cannot mutate the cache', async () => {
        const first = await fetchSlideMetadataCached(
            'https://tiles.example.com',
            'A',
            undefined,
            'study-1'
        );
        first.dimensions.width = 1;

        const second = await fetchSlideMetadataCached(
            'https://tiles.example.com',
            'A',
            undefined,
            'study-1'
        );

        expect(mockGetWsiSlideAccess).toHaveBeenCalledTimes(1);
        expect(second.dimensions.width).toBe(1000);
    });

    it('does not reuse metadata across study scopes', async () => {
        await fetchSlideMetadataCached(
            'https://tiles.example.com',
            'A',
            undefined,
            'study-1'
        );
        await fetchSlideMetadataCached(
            'https://tiles.example.com',
            'A',
            undefined,
            'study-2'
        );

        expect(mockGetWsiSlideAccess).toHaveBeenCalledTimes(2);
        expect(mockGetWsiSlideAccess.mock.calls[0]).toEqual(['study-1', 'A']);
        expect(mockGetWsiSlideAccess.mock.calls[1]).toEqual(['study-2', 'A']);
    });

    it('clones optional metadata fields so callers cannot mutate cached rich metadata', async () => {
        mockAccess(makeRichMetadata());

        const first = await fetchSlideMetadataCached(
            'https://tiles.example.com',
            'A',
            undefined,
            'study-1'
        );
        first.mpp!.x = 9;
        first.level_dimensions[0].width = 1;

        const second = await fetchSlideMetadataCached(
            'https://tiles.example.com',
            'A',
            undefined,
            'study-1'
        );

        expect(mockGetWsiSlideAccess).toHaveBeenCalledTimes(1);
        expect(second.mpp).toEqual({ x: 0.25, y: 0.3 });
        expect(second.level_dimensions[0].width).toBe(1000);
        expect(second.objective_power).toBe(40);
    });

    it('lets read-only consumers reuse the cached metadata object without cloning', async () => {
        const first = await fetchSlideMetadataCachedReadOnly(
            'https://tiles.example.com',
            'A',
            undefined,
            'study-1'
        );
        const second = await fetchSlideMetadataCachedReadOnly(
            'https://tiles.example.com',
            'A',
            undefined,
            'study-1'
        );

        expect(mockGetWsiSlideAccess).toHaveBeenCalledTimes(1);
        expect(second).toBe(first);
    });

    it('preloads slide metadata into cache for later fetches', async () => {
        const metadata = makeMetadata();
        mockAccess(metadata);

        await preloadSlideMetadata('https://tiles.example.com', 'A', 'study-1');
        const fetched = await fetchSlideMetadataCached(
            'https://tiles.example.com',
            'A',
            undefined,
            'study-1'
        );

        expect(mockGetWsiSlideAccess).toHaveBeenCalledTimes(1);
        expect(fetched).toEqual(metadata);
        expect(fetched).not.toBe(metadata);
    });

    it('lets aborted callers exit without cancelling the shared metadata request', async () => {
        let resolveAccess!: (value: unknown) => void;
        mockGetWsiSlideAccess.mockImplementation(
            () =>
                new Promise(resolve => {
                    resolveAccess = resolve;
                }) as ReturnType<typeof getWsiSlideAccess>
        );

        const abortController = new AbortController();
        const abortedPromise = fetchSlideMetadataCached(
            'https://tiles.example.com',
            'A',
            abortController.signal,
            'study-1'
        );
        const sharedPromise = fetchSlideMetadataCached(
            'https://tiles.example.com',
            'A',
            undefined,
            'study-1'
        );

        abortController.abort();

        await expect(abortedPromise).rejects.toMatchObject({
            name: 'AbortError',
        });

        resolveAccess({
            tileMetadata: makeMetadata(),
        });

        await expect(sharedPromise).resolves.toMatchObject({
            max_zoom: 6,
        });
        expect(mockGetWsiSlideAccess).toHaveBeenCalledTimes(1);
    });

    it('hydrates slide metadata from sessionStorage across in-memory cache clears', async () => {
        const metadata = makeMetadata();
        mockAccess(metadata);

        await preloadSlideMetadata('https://tiles.example.com', 'A', 'study-1');

        expect(mockGetWsiSlideAccess).toHaveBeenCalledTimes(1);

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
            'A',
            undefined,
            'study-1'
        );

        expect(mockGetWsiSlideAccess).toHaveBeenCalledTimes(1);
        expect(fetched).toEqual(metadata);
        expect(fetched).not.toBe(metadata);
    });

    it('hydrates cloned metadata from sessionStorage so callers cannot mutate persisted cache state', async () => {
        const metadata = makeMetadata();
        seedSlideMetadataCache('https://tiles.example.com', 'A', metadata, 'study-1');

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
            'A',
            undefined,
            'study-1'
        );
        first.level_dimensions[0].width = 1;

        const second = await fetchSlideMetadataCached(
            'https://tiles.example.com',
            'A',
            undefined,
            'study-1'
        );

        expect(second.level_dimensions[0].width).toBe(1000);
    });

    it('reports persisted slide metadata entries as cached', async () => {
        const metadata = makeMetadata();
        mockAccess(metadata);

        await preloadSlideMetadata('https://tiles.example.com', 'A', 'study-1');

        const storedEntries = Object.keys(window.sessionStorage).filter(key =>
            key.startsWith('wsi-metadata-cache::')
        );
        const persistedValue = window.sessionStorage.getItem(storedEntries[0]);

        clearSlideMetadataCache();
        if (persistedValue) {
            window.sessionStorage.setItem(storedEntries[0], persistedValue);
        }

        expect(
            hasCachedSlideMetadata('https://tiles.example.com', 'A', 'study-1')
        ).toBe(true);
    });
});
