/**
 * @jest-environment jsdom
 */
import {
    buildPatientBootstrapUrl,
    clearPatientBootstrapCache,
    fetchPatientBootstrapReadOnly,
    fetchPatientHierarchyWithBootstrap,
    hasCachedPatientBootstrap,
    hydratePatientBootstrapCaches,
    isValidPatientBootstrapResponse,
} from './wsiBootstrapFetch';
import {
    clearPatientHierarchyCache,
    fetchPatientHierarchyReadOnly,
    hasCachedPatientHierarchy,
    seedPatientHierarchyCache,
} from './wsiHierarchyFetchCache';
import {
    clearSlideMetadataCache,
    fetchSlideMetadataCached,
    hasCachedSlideMetadata,
} from './wsiMetadataFetchCache';
import { PatientBootstrapResponse } from './wsiViewerTypes';
import * as wsiHierarchyFetchCache from './wsiHierarchyFetchCache';
import * as wsiMetadataFetchCache from './wsiMetadataFetchCache';

const serverConfig = {
    msk_wsi_enable_bootstrap: false,
};

jest.mock('config/config', () => ({
    getServerConfig: () => serverConfig,
}));

describe('wsiBootstrapFetch', () => {
    beforeEach(() => {
        clearPatientBootstrapCache();
        clearPatientHierarchyCache();
        clearSlideMetadataCache();
        serverConfig.msk_wsi_enable_bootstrap = false;
    });

    it('builds the bootstrap URL and preserves query parameters', () => {
        expect(
            buildPatientBootstrapUrl({
                hierarchyUrl:
                    'https://tiles.example.org/patient/P-1?studyId=study',
            })
        ).toBe('https://tiles.example.org/patient/P-1/bootstrap?studyId=study');
    });

    it('validates bootstrap payload shape', () => {
        expect(
            isValidPatientBootstrapResponse({
                hierarchy: { patient_id: 'P-1', samples: [] },
                initial: null,
            })
        ).toBe(true);
        expect(
            isValidPatientBootstrapResponse({
                hierarchy: { patient_id: 'P-1', samples: [] },
                initial: { image_id: 'slide-1', metadata: {} },
            })
        ).toBe(false);
        expect(
            isValidPatientBootstrapResponse({
                hierarchy: { patient_id: 'P-1', samples: [] },
                initial: {
                    sample_id: 7,
                    image_id: 'slide-1',
                    metadata: {
                        dimensions: { width: 1000, height: 800 },
                        levels: 1,
                        level_dimensions: [{ width: 1000, height: 800 }],
                        max_zoom: 6,
                        tile_size: 256,
                    },
                },
            })
        ).toBe(false);
        expect(
            isValidPatientBootstrapResponse({
                hierarchy: { patient_id: 'P-1', samples: [] },
                initial: {
                    sample_id: 'S-1',
                    image_id: 'slide-1',
                    metadata: {
                        dimensions: { width: 1000, height: 800 },
                        levels: 1,
                        level_dimensions: [{ width: 1000, height: 800 }],
                        max_zoom: 0,
                        tile_size: 256,
                    },
                },
            })
        ).toBe(false);
        expect(
            isValidPatientBootstrapResponse({
                hierarchy: { patient_id: 'P-1', samples: [] },
                initial: {
                    sample_id: 'S-1',
                    image_id: 'slide-1',
                    metadata: {
                        dimensions: { width: 1000, height: 800 },
                        levels: 1,
                        level_dimensions: [{ width: 0, height: 800 }],
                        max_zoom: 6,
                        tile_size: 256,
                    },
                },
            })
        ).toBe(false);
    });

    it('rejects malformed bootstrap responses during fetch', async () => {
        (global as any).fetch = jest.fn().mockResolvedValue({
            ok: true,
            json: async () => ({
                hierarchy: { patient_id: 'P-1', samples: [] },
                initial: {
                    sample_id: 'S-1',
                    image_id: 'slide-1',
                    metadata: {
                        dimensions: { width: 1000, height: 800 },
                        levels: 1,
                        level_dimensions: [{ width: 1000, height: 800 }],
                        max_zoom: 6,
                    },
                },
            }),
        });

        await expect(
            fetchPatientBootstrapReadOnly({
                hierarchyUrl:
                    'https://tiles.example.org/patient/P-1?studyId=study',
            })
        ).rejects.toThrow('Invalid bootstrap response');
    });

    it('reuses cached bootstrap payloads for identical read-only requests', async () => {
        const payload: PatientBootstrapResponse = {
            hierarchy: {
                patient_id: 'P-1',
                samples: [],
            },
            initial: {
                sample_id: 'S-1',
                image_id: 'slide-1',
                metadata: {
                    dimensions: { width: 1000, height: 800 },
                    levels: 1,
                    level_dimensions: [{ width: 1000, height: 800 }],
                    max_zoom: 6,
                    tile_size: 256,
                },
            },
        };
        (global as any).fetch = jest.fn().mockResolvedValue({
            ok: true,
            json: async () => payload,
        });

        const first = await fetchPatientBootstrapReadOnly({
            hierarchyUrl: 'https://tiles.example.org/patient/P-1?studyId=study',
        });

        const second = await fetchPatientBootstrapReadOnly({
            hierarchyUrl: 'https://tiles.example.org/patient/P-1?studyId=study',
        });

        expect((global as any).fetch).toHaveBeenCalledTimes(1);
        expect(second).toBe(first);
    });

    it('lets read-only consumers reuse the cached bootstrap payload without cloning', async () => {
        const payload: PatientBootstrapResponse = {
            hierarchy: {
                patient_id: 'P-1',
                samples: [],
            },
            initial: null,
        };
        (global as any).fetch = jest.fn().mockResolvedValue({
            ok: true,
            json: async () => payload,
        });

        const first = await fetchPatientBootstrapReadOnly({
            hierarchyUrl: 'https://tiles.example.org/patient/P-1?studyId=study',
        });
        const second = await fetchPatientBootstrapReadOnly({
            hierarchyUrl: 'https://tiles.example.org/patient/P-1?studyId=study',
        });

        expect((global as any).fetch).toHaveBeenCalledTimes(1);
        expect(second).toBe(first);
    });

    it('reports warm bootstrap entries as cached for the same patient-scoped request', async () => {
        const payload: PatientBootstrapResponse = {
            hierarchy: {
                patient_id: 'P-1',
                samples: [],
            },
            initial: null,
        };
        (global as any).fetch = jest.fn().mockResolvedValue({
            ok: true,
            json: async () => payload,
        });

        await fetchPatientBootstrapReadOnly({
            hierarchyUrl: 'https://tiles.example.org/patient/P-1?studyId=study',
        });

        expect(
            hasCachedPatientBootstrap({
                hierarchyUrl:
                    'https://tiles.example.org/patient/P-1?studyId=study',
            })
        ).toBe(true);
    });

    it('does not reuse bootstrap payloads across different patient request keys', async () => {
        const payload: PatientBootstrapResponse = {
            hierarchy: {
                patient_id: 'P-1',
                samples: [],
            },
            initial: null,
        };
        (global as any).fetch = jest.fn().mockResolvedValue({
            ok: true,
            json: async () => payload,
        });

        await fetchPatientBootstrapReadOnly({
            hierarchyUrl: 'https://tiles.example.org/patient/P-1?studyId=study',
        });
        await fetchPatientBootstrapReadOnly({
            hierarchyUrl: 'https://tiles.example.org/patient/P-2?studyId=study',
        });

        expect((global as any).fetch).toHaveBeenCalledTimes(2);
    });

    it('reuses cached bootstrap payloads across repeated equivalent patient-scoped requests', async () => {
        const payload: PatientBootstrapResponse = {
            hierarchy: {
                patient_id: 'P-1',
                samples: [],
            },
            initial: null,
        };
        (global as any).fetch = jest.fn().mockResolvedValue({
            ok: true,
            json: async () => payload,
        });

        await fetchPatientBootstrapReadOnly({
            hierarchyUrl: 'https://tiles.example.org/patient/P-1?studyId=study',
        });
        await fetchPatientBootstrapReadOnly({
            hierarchyUrl: 'https://tiles.example.org/patient/P-1?studyId=study',
        });

        expect((global as any).fetch).toHaveBeenCalledTimes(1);
        expect(
            hasCachedPatientBootstrap({
                hierarchyUrl:
                    'https://tiles.example.org/patient/P-1?studyId=study',
            })
        ).toBe(true);
    });

    it('lets an aborted caller fail without canceling the shared bootstrap request', async () => {
        let resolveFetch!: (value: unknown) => void;
        const fetchPromise = new Promise(resolve => {
            resolveFetch = resolve;
        });
        (global as any).fetch = jest.fn().mockReturnValue(fetchPromise);

        const abortController = new AbortController();
        const abortedRequest = fetchPatientBootstrapReadOnly(
            {
                hierarchyUrl:
                    'https://tiles.example.org/patient/P-1?studyId=study',
            },
            abortController.signal
        );
        const sharedRequest = fetchPatientBootstrapReadOnly({
            hierarchyUrl: 'https://tiles.example.org/patient/P-1?studyId=study',
        });

        abortController.abort();
        resolveFetch({
            ok: true,
            json: async () => ({
                hierarchy: {
                    patient_id: 'P-1',
                    samples: [],
                },
                initial: null,
            }),
        });

        await expect(abortedRequest).rejects.toThrow('Aborted');
        await expect(sharedRequest).resolves.toEqual({
            hierarchy: {
                patient_id: 'P-1',
                samples: [],
            },
            initial: null,
        });
        expect((global as any).fetch).toHaveBeenCalledTimes(1);
    });

    it('shares an in-flight unfiltered bootstrap hierarchy with hierarchy readers', async () => {
        let resolveFetch!: (value: unknown) => void;
        const fetchMock = jest.fn().mockImplementation((url: string) => {
            if (url.includes('/bootstrap')) {
                return new Promise(resolve => {
                    resolveFetch = resolve;
                });
            }
            throw new Error(`Unexpected legacy hierarchy fetch: ${url}`);
        });
        (global as any).fetch = fetchMock;

        const bootstrapRequest = fetchPatientBootstrapReadOnly({
            hierarchyUrl: 'https://tiles.example.org/patient/P-1?studyId=study',
        });
        const hierarchyRequest = fetchPatientHierarchyReadOnly(
            'https://tiles.example.org/patient/P-1?studyId=study'
        );

        resolveFetch({
            ok: true,
            json: async () => ({
                hierarchy: {
                    patient_id: 'P-1',
                    samples: [],
                },
                initial: null,
            }),
        });

        await expect(bootstrapRequest).resolves.toEqual({
            hierarchy: {
                patient_id: 'P-1',
                samples: [],
            },
            initial: null,
        });
        await expect(hierarchyRequest).resolves.toEqual({
            patient_id: 'P-1',
            samples: [],
        });
        expect(fetchMock).toHaveBeenCalledTimes(1);
        expect(
            fetchMock
        ).toHaveBeenCalledWith(
            'https://tiles.example.org/patient/P-1/bootstrap?studyId=study',
            { cache: 'no-store' }
        );
    });

    it('hydrates hierarchy and metadata caches from a bootstrap payload', async () => {
        const payload: PatientBootstrapResponse = {
            hierarchy: {
                patient_id: 'P-1',
                samples: [],
            },
            initial: {
                sample_id: null,
                image_id: 'slide-1',
                metadata: {
                    dimensions: { width: 1000, height: 800 },
                    levels: 1,
                    level_dimensions: [{ width: 1000, height: 800 }],
                    max_zoom: 6,
                    tile_size: 256,
                },
            },
        };
        const fetchSpy = jest.fn();
        (global as any).fetch = fetchSpy;

        hydratePatientBootstrapCaches(
            'https://tiles.example.org/patient/P-1?studyId=study',
            'https://tiles.example.org',
            payload
        );

        expect(
            hasCachedPatientHierarchy(
                'https://tiles.example.org/patient/P-1?studyId=study'
            )
        ).toBe(true);
        expect(
            hasCachedSlideMetadata(
                'https://tiles.example.org',
                'slide-1',
                'study'
            )
        ).toBe(true);
        await expect(
            fetchPatientHierarchyReadOnly(
                'https://tiles.example.org/patient/P-1?studyId=study'
            )
        ).resolves.toEqual(payload.hierarchy);
        await expect(
            fetchSlideMetadataCached(
                'https://tiles.example.org',
                'slide-1',
                undefined,
                'study'
            )
        ).resolves.toEqual(payload.initial!.metadata);
        expect(fetchSpy).not.toHaveBeenCalled();
    });

    it('skips reseeding hierarchy and metadata caches when bootstrap hydration is repeated on a warm cache', () => {
        const payload: PatientBootstrapResponse = {
            hierarchy: {
                patient_id: 'P-1',
                samples: [],
            },
            initial: {
                sample_id: null,
                image_id: 'slide-1',
                metadata: {
                    dimensions: { width: 1000, height: 800 },
                    levels: 1,
                    level_dimensions: [{ width: 1000, height: 800 }],
                    max_zoom: 6,
                    tile_size: 256,
                },
            },
        };
        const seedHierarchySpy = jest.spyOn(
            wsiHierarchyFetchCache,
            'seedPatientHierarchyCache'
        );
        const seedMetadataSpy = jest.spyOn(
            wsiMetadataFetchCache,
            'seedSlideMetadataCache'
        );

        hydratePatientBootstrapCaches(
            'https://tiles.example.org/patient/P-1?studyId=study',
            'https://tiles.example.org',
            payload
        );
        hydratePatientBootstrapCaches(
            'https://tiles.example.org/patient/P-1?studyId=study',
            'https://tiles.example.org',
            payload
        );

        expect(seedHierarchySpy).toHaveBeenCalledTimes(1);
        expect(seedMetadataSpy).toHaveBeenCalledTimes(1);
    });

    it('loads hierarchy directly when bootstrap is disabled', async () => {
        const hierarchy = { patient_id: 'P-disabled', samples: [] };
        const fetchMock = jest.fn().mockResolvedValue({
            ok: true,
            json: () => Promise.resolve(hierarchy),
        });
        (global as any).fetch = fetchMock;

        const result = await fetchPatientHierarchyWithBootstrap({
            hierarchyUrl: 'https://tiles.example.org/patient/P-disabled',
            tileServerBase: 'https://tiles.example.org',
        });

        expect(result).toMatchObject({
            hierarchy,
            initial: null,
            source: 'hierarchy',
            bootstrapStatus: 'disabled',
            cacheHit: false,
        });
        expect(fetchMock).toHaveBeenCalledTimes(1);
        expect(fetchMock.mock.calls[0][0]).toBe(
            'https://tiles.example.org/patient/P-disabled'
        );
    });

    it('loads and hydrates hierarchy and initial metadata from bootstrap', async () => {
        serverConfig.msk_wsi_enable_bootstrap = true;
        const payload: PatientBootstrapResponse = {
            hierarchy: { patient_id: 'P-bootstrap', samples: [] },
            initial: {
                sample_id: null,
                image_id: 'slide-bootstrap',
                metadata: {
                    dimensions: { width: 1000, height: 800 },
                    levels: 1,
                    level_dimensions: [{ width: 1000, height: 800 }],
                    max_zoom: 6,
                    tile_size: 256,
                },
            },
        };
        const fetchMock = jest.fn().mockResolvedValue({
            ok: true,
            json: () => Promise.resolve(payload),
        });
        (global as any).fetch = fetchMock;

        const result = await fetchPatientHierarchyWithBootstrap({
            hierarchyUrl: 'https://tiles.example.org/patient/P-bootstrap',
            tileServerBase: 'https://tiles.example.org',
        });

        expect(result).toMatchObject({
            hierarchy: payload.hierarchy,
            initial: payload.initial,
            source: 'bootstrap',
            bootstrapStatus: 'success',
            cacheHit: false,
        });
        expect(
            hasCachedPatientHierarchy(
                'https://tiles.example.org/patient/P-bootstrap'
            )
        ).toBe(true);
        expect(
            hasCachedSlideMetadata(
                'https://tiles.example.org',
                'slide-bootstrap'
            )
        ).toBe(true);
        expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it('falls back to the hierarchy endpoint when bootstrap fails', async () => {
        serverConfig.msk_wsi_enable_bootstrap = true;
        const hierarchy = { patient_id: 'P-fallback', samples: [] };
        const fetchMock = jest
            .fn()
            .mockResolvedValueOnce({ ok: false, status: 503 })
            .mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve(hierarchy),
            });
        (global as any).fetch = fetchMock;

        const result = await fetchPatientHierarchyWithBootstrap({
            hierarchyUrl: 'https://tiles.example.org/patient/P-fallback',
            tileServerBase: 'https://tiles.example.org',
        });

        expect(result).toMatchObject({
            hierarchy,
            source: 'hierarchy',
            bootstrapStatus: 'failed',
            cacheHit: false,
        });
        expect(result.bootstrapFallbackReason).toBe('Server returned 503');
        expect(fetchMock).toHaveBeenCalledTimes(2);
    });

    it('skips bootstrap when the hierarchy cache is already warm', async () => {
        serverConfig.msk_wsi_enable_bootstrap = true;
        const hierarchy = { patient_id: 'P-warm', samples: [] };
        const hierarchyUrl = 'https://tiles.example.org/patient/P-warm';
        seedPatientHierarchyCache(hierarchyUrl, hierarchy);
        const fetchMock = jest.fn();
        (global as any).fetch = fetchMock;

        const result = await fetchPatientHierarchyWithBootstrap({
            hierarchyUrl,
            tileServerBase: 'https://tiles.example.org',
        });

        expect(result).toMatchObject({
            hierarchy,
            source: 'hierarchy',
            bootstrapStatus: 'skipped-cache-hit',
            cacheHit: true,
        });
        expect(fetchMock).not.toHaveBeenCalled();
    });

    it('propagates an aborted bootstrap request without falling back', async () => {
        serverConfig.msk_wsi_enable_bootstrap = true;
        let resolveFetch!: (value: unknown) => void;
        (global as any).fetch = jest.fn().mockReturnValue(
            new Promise(resolve => {
                resolveFetch = resolve;
            })
        );
        const controller = new AbortController();
        const request = fetchPatientHierarchyWithBootstrap(
            {
                hierarchyUrl: 'https://tiles.example.org/patient/P-abort',
                tileServerBase: 'https://tiles.example.org',
            },
            controller.signal
        );

        controller.abort();
        await expect(request).rejects.toMatchObject({ name: 'AbortError' });
        resolveFetch({
            ok: true,
            json: () =>
                Promise.resolve({
                    hierarchy: { patient_id: 'P-abort', samples: [] },
                    initial: null,
                }),
        });
        expect((global as any).fetch).toHaveBeenCalledTimes(1);
    });
});
