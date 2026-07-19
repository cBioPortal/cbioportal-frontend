/**
 * @jest-environment jsdom
 */
import {
    clearPatientHierarchyCache,
    fetchPatientHierarchy,
    fetchPatientHierarchyReadOnly,
    hasCachedPatientHierarchy,
    preloadPatientHierarchy,
} from './wsiHierarchyFetchCache';
import { PatientHierarchy } from './wsiViewerTypes';

function makeHierarchy(): PatientHierarchy {
    return {
        patient_id: 'P-1',
        samples: [
            {
                sample_id: 'S-1',
                cancer_type: '',
                cancer_type_detailed: '',
                oncotree_code: '',
                primary_site: '',
                sample_type: '',
                parts: [],
            },
        ],
    };
}

describe('wsiHierarchyFetchCache', () => {
    let originalFetch: typeof globalThis.fetch;

    beforeEach(() => {
        originalFetch = (global as any).fetch;
        clearPatientHierarchyCache();
    });

    afterEach(() => {
        (global as any).fetch = originalFetch;
        clearPatientHierarchyCache();
    });

    it('deduplicates concurrent requests for the same URL', async () => {
        const hierarchy = makeHierarchy();
        const fetchMock = jest.fn().mockResolvedValue({
            ok: true,
            json: () => Promise.resolve(hierarchy),
        });
        (global as any).fetch = fetchMock;

        const [first, second] = await Promise.all([
            fetchPatientHierarchy('https://tiles.example.com/patient/P-1'),
            fetchPatientHierarchy('https://tiles.example.com/patient/P-1'),
        ]);

        expect(fetchMock).toHaveBeenCalledTimes(1);
        expect(first).toEqual(hierarchy);
        expect(second).toEqual(hierarchy);
        expect(first).not.toBe(second);
    });

    it('returns cloned hierarchy objects so consumers cannot mutate the cache', async () => {
        const fetchMock = jest.fn().mockResolvedValue({
            ok: true,
            json: () => Promise.resolve(makeHierarchy()),
        });
        (global as any).fetch = fetchMock;

        const first = await fetchPatientHierarchy(
            'https://tiles.example.com/patient/P-1'
        );
        first.samples[0].sample_type = 'Changed';

        const second = await fetchPatientHierarchy(
            'https://tiles.example.com/patient/P-1'
        );

        expect(fetchMock).toHaveBeenCalledTimes(1);
        expect(second.samples[0].sample_type).toBe('');
    });

    it('lets read-only consumers reuse the cached hierarchy without cloning', async () => {
        const fetchMock = jest.fn().mockResolvedValue({
            ok: true,
            json: () => Promise.resolve(makeHierarchy()),
        });
        (global as any).fetch = fetchMock;

        const first = await fetchPatientHierarchyReadOnly(
            'https://tiles.example.com/patient/P-1'
        );
        const second = await fetchPatientHierarchyReadOnly(
            'https://tiles.example.com/patient/P-1'
        );

        expect(fetchMock).toHaveBeenCalledTimes(1);
        expect(second).toBe(first);
    });

    it('lets aborted callers exit without cancelling the shared request', async () => {
        let resolveFetch!: (value: unknown) => void;
        const fetchMock = jest.fn().mockImplementation(
            () =>
                new Promise(resolve => {
                    resolveFetch = resolve;
                })
        );
        (global as any).fetch = fetchMock;

        const abortController = new AbortController();
        const abortedPromise = fetchPatientHierarchy(
            'https://tiles.example.com/patient/P-1',
            abortController.signal
        );
        const sharedPromise = fetchPatientHierarchy(
            'https://tiles.example.com/patient/P-1'
        );

        abortController.abort();

        await expect(abortedPromise).rejects.toMatchObject({
            name: 'AbortError',
        });

        resolveFetch({
            ok: true,
            json: () => Promise.resolve(makeHierarchy()),
        });

        await expect(sharedPromise).resolves.toMatchObject({
            patient_id: 'P-1',
        });
        expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it('preloads the hierarchy into cache for later fetches', async () => {
        const hierarchy = makeHierarchy();
        const fetchMock = jest.fn().mockResolvedValue({
            ok: true,
            json: () => Promise.resolve(hierarchy),
        });
        (global as any).fetch = fetchMock;

        await preloadPatientHierarchy('https://tiles.example.com/patient/P-1');
        const fetched = await fetchPatientHierarchy(
            'https://tiles.example.com/patient/P-1'
        );

        expect(fetchMock).toHaveBeenCalledTimes(1);
        expect(fetched).toEqual(hierarchy);
        expect(fetched).not.toBe(hierarchy);
    });

    it('hydrates the hierarchy cache from sessionStorage across in-memory cache clears', async () => {
        const hierarchy = makeHierarchy();
        const fetchMock = jest.fn().mockResolvedValue({
            ok: true,
            json: () => Promise.resolve(hierarchy),
        });
        (global as any).fetch = fetchMock;

        const url = 'https://tiles.example.com/patient/P-1';
        await preloadPatientHierarchy(url);

        const storedEntries = Object.keys(window.sessionStorage).filter(key =>
            key.startsWith('wsi-hierarchy-cache-v3::')
        );
        expect(storedEntries).toHaveLength(1);

        const persistedValue = window.sessionStorage.getItem(storedEntries[0]);
        clearPatientHierarchyCache();
        if (persistedValue) {
            window.sessionStorage.setItem(storedEntries[0], persistedValue);
        }

        await fetchPatientHierarchy(url);
        expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it('reports persisted hierarchy entries as cached', async () => {
        const fetchMock = jest.fn().mockResolvedValue({
            ok: true,
            json: () => Promise.resolve(makeHierarchy()),
        });
        (global as any).fetch = fetchMock;

        const url = 'https://tiles.example.com/patient/P-1';
        await preloadPatientHierarchy(url);
        const storedKey = Object.keys(window.sessionStorage).find(key =>
            key.startsWith('wsi-hierarchy-cache-v3::')
        )!;
        const persistedValue = window.sessionStorage.getItem(storedKey);

        clearPatientHierarchyCache();
        if (persistedValue) {
            window.sessionStorage.setItem(storedKey, persistedValue);
        }

        expect(hasCachedPatientHierarchy(url)).toBe(true);
    });
});
