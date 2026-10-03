/**
 * @jest-environment jsdom
 */
import {
    clearSlideMetadataCache,
    fetchSlideMetadataCachedReadOnly,
    hasCachedSlideMetadata,
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
            slideKey: 'A',
            tileMetadata: metadata,
            thumbnail: {
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
            fetchSlideMetadataCachedReadOnly(
                'https://tiles.example.com',
                'A',
                undefined,
                'study-1'
            ),
            fetchSlideMetadataCachedReadOnly(
                'https://tiles.example.com',
                'A',
                undefined,
                'study-1'
            ),
        ]);

        expect(mockGetWsiSlideAccess).toHaveBeenCalledTimes(1);
        expect(first).toEqual(metadata);
        expect(second).toEqual(metadata);
        expect(second).toBe(first);
    });

    it('does not reuse metadata across study scopes', async () => {
        await fetchSlideMetadataCachedReadOnly(
            'https://tiles.example.com',
            'A',
            undefined,
            'study-1'
        );
        await fetchSlideMetadataCachedReadOnly(
            'https://tiles.example.com',
            'A',
            undefined,
            'study-2'
        );

        expect(mockGetWsiSlideAccess).toHaveBeenCalledTimes(2);
        expect(mockGetWsiSlideAccess.mock.calls[0]).toEqual([
            'study-1',
            'A',
            false,
            undefined,
        ]);
        expect(mockGetWsiSlideAccess.mock.calls[1]).toEqual([
            'study-2',
            'A',
            false,
            undefined,
        ]);
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

    it('serves later fetches from the cache', async () => {
        const metadata = makeMetadata();
        mockAccess(metadata);

        await fetchSlideMetadataCachedReadOnly(
            'https://tiles.example.com',
            'A',
            undefined,
            'study-1'
        );
        const fetched = await fetchSlideMetadataCachedReadOnly(
            'https://tiles.example.com',
            'A',
            undefined,
            'study-1'
        );

        expect(mockGetWsiSlideAccess).toHaveBeenCalledTimes(1);
        expect(fetched).toEqual(metadata);
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
        const abortedPromise = fetchSlideMetadataCachedReadOnly(
            'https://tiles.example.com',
            'A',
            abortController.signal,
            'study-1'
        );
        const sharedPromise = fetchSlideMetadataCachedReadOnly(
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

        await fetchSlideMetadataCachedReadOnly(
            'https://tiles.example.com',
            'A',
            undefined,
            'study-1'
        );

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

        const fetched = await fetchSlideMetadataCachedReadOnly(
            'https://tiles.example.com',
            'A',
            undefined,
            'study-1'
        );

        expect(mockGetWsiSlideAccess).toHaveBeenCalledTimes(1);
        expect(fetched).toEqual(metadata);
        expect(fetched).not.toBe(metadata);
    });

    it('reports persisted slide metadata entries as cached', async () => {
        const metadata = makeMetadata();
        mockAccess(metadata);

        await fetchSlideMetadataCachedReadOnly(
            'https://tiles.example.com',
            'A',
            undefined,
            'study-1'
        );

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
