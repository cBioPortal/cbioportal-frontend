/**
 * @jest-environment jsdom
 */
import {
    clearPatientHierarchyCache,
    fetchPatientHierarchyReadOnly,
    hasCachedPatientHierarchy,
} from './wsiHierarchyFetchCache';
import { PatientHierarchy } from './wsiViewerTypes';
import * as config from 'config/config';

jest.mock('shared/api/urls', () => ({
    buildCBioPortalAPIUrl: jest.fn(() => '/api/wsi/access-token'),
}));

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

describe('wsiHierarchyFetchCache read-only contract', () => {
    let originalFetch: typeof globalThis.fetch;

    beforeEach(() => {
        originalFetch = (global as any).fetch;
        clearPatientHierarchyCache();
    });

    afterEach(() => {
        (global as any).fetch = originalFetch;
        clearPatientHierarchyCache();
    });

    it('deduplicates concurrent requests and reuses the cached hierarchy', async () => {
        const hierarchy = makeHierarchy();
        const fetchMock = jest.fn().mockResolvedValue({
            ok: true,
            json: () => Promise.resolve(hierarchy),
        });
        (global as any).fetch = fetchMock;

        const [first, second] = await Promise.all([
            fetchPatientHierarchyReadOnly(
                'https://tiles.example.com/patient/P-1'
            ),
            fetchPatientHierarchyReadOnly(
                'https://tiles.example.com/patient/P-1'
            ),
        ]);

        expect(fetchMock).toHaveBeenCalledTimes(1);
        expect(second).toBe(first);
    });

    it('lets an aborted caller exit without cancelling the shared request', async () => {
        let resolveFetch!: (value: unknown) => void;
        const fetchMock = jest.fn().mockImplementation(
            () =>
                new Promise(resolve => {
                    resolveFetch = resolve;
                })
        );
        (global as any).fetch = fetchMock;

        const abortController = new AbortController();
        const abortedPromise = fetchPatientHierarchyReadOnly(
            'https://tiles.example.com/patient/P-1',
            abortController.signal
        );
        const sharedPromise = fetchPatientHierarchyReadOnly(
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

    it('hydrates and reuses the persisted hierarchy cache', async () => {
        const fetchMock = jest.fn().mockResolvedValue({
            ok: true,
            json: () => Promise.resolve(makeHierarchy()),
        });
        (global as any).fetch = fetchMock;
        const url = 'https://tiles.example.com/patient/P-1?studyId=study-1';

        await fetchPatientHierarchyReadOnly(url);
        expect(hasCachedPatientHierarchy(url)).toBe(true);

        const storedKey = Object.keys(window.sessionStorage).find(key =>
            key.startsWith('wsi-hierarchy-cache-v3::')
        )!;
        const persistedValue = window.sessionStorage.getItem(storedKey);
        clearPatientHierarchyCache();
        if (persistedValue) {
            window.sessionStorage.setItem(storedKey, persistedValue);
        }

        await fetchPatientHierarchyReadOnly(url);
        expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it('does not use persisted hierarchy data when WSI auth is enabled', async () => {
        const getServerConfigSpy = jest
            .spyOn(config, 'getServerConfig')
            .mockReturnValue({
                authenticationMethod: 'saml_plus_basic',
            } as any);
        config.setLoadConfig({ apiRoot: '/' });
        const url = 'https://tiles.example.com/patient/P-1?studyId=study-1';
        window.sessionStorage.setItem(
            `wsi-hierarchy-cache-v3::${url}`,
            JSON.stringify({
                expiresAt: Date.now() + 60_000,
                data: makeHierarchy(),
            })
        );
        const fetchMock = jest
            .fn()
            .mockResolvedValueOnce({
                ok: true,
                json: () =>
                    Promise.resolve({ access_token: 'token', expires_in: 300 }),
            })
            .mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve(makeHierarchy()),
            });
        (global as any).fetch = fetchMock;

        await fetchPatientHierarchyReadOnly(url);

        expect(fetchMock).toHaveBeenCalledTimes(2);
        expect(
            window.sessionStorage.getItem(`wsi-hierarchy-cache-v3::${url}`)
        ).toBeNull();
        getServerConfigSpy.mockRestore();
    });
});
