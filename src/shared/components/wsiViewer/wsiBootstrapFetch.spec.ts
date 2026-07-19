/**
 * @jest-environment jsdom
 */
import {
    buildPatientBootstrapUrl,
    clearPatientBootstrapCache,
    fetchPatientBootstrap,
    fetchPatientBootstrapReadOnly,
    hasCachedPatientBootstrap,
    hydratePatientBootstrapCaches,
    isValidPatientBootstrapResponse,
} from './wsiBootstrapFetch';
import {
    clearPatientHierarchyCache,
    fetchPatientHierarchy,
    fetchPatientHierarchyReadOnly,
    hasCachedPatientHierarchy,
} from './wsiHierarchyFetchCache';
import {
    clearSlideMetadataCache,
    fetchSlideMetadataCached,
    hasCachedSlideMetadata,
} from './wsiMetadataFetchCache';
import { PatientBootstrapResponse } from './wsiViewerTypes';
import * as wsiHierarchyFetchCache from './wsiHierarchyFetchCache';
import * as wsiMetadataFetchCache from './wsiMetadataFetchCache';

describe('wsiBootstrapFetch', () => {
    beforeEach(() => {
        clearPatientBootstrapCache();
        clearPatientHierarchyCache();
        clearSlideMetadataCache();
    });

    it('builds the bootstrap URL and preserves query parameters', () => {
        expect(
            buildPatientBootstrapUrl({
                hierarchyUrl: 'https://tiles.example.org/patient/P-1?studyId=study',
            })
        ).toBe(
            'https://tiles.example.org/patient/P-1/bootstrap?studyId=study'
        );
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
            fetchPatientBootstrap({
                hierarchyUrl: 'https://tiles.example.org/patient/P-1?studyId=study',
            })
        ).rejects.toThrow('Invalid bootstrap response');
    });

    it('reuses cached bootstrap payloads for identical requests and returns cloned data', async () => {
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

        const first = await fetchPatientBootstrap({
            hierarchyUrl: 'https://tiles.example.org/patient/P-1?studyId=study',
        });
        first.hierarchy.patient_id = 'mutated';

        const second = await fetchPatientBootstrap({
            hierarchyUrl: 'https://tiles.example.org/patient/P-1?studyId=study',
        });

        expect((global as any).fetch).toHaveBeenCalledTimes(1);
        expect(second.hierarchy.patient_id).toBe('P-1');
        expect(second).not.toBe(first);
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

        await fetchPatientBootstrap({
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

        await fetchPatientBootstrap({
            hierarchyUrl: 'https://tiles.example.org/patient/P-1?studyId=study',
        });
        await fetchPatientBootstrap({
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

        await fetchPatientBootstrap({
            hierarchyUrl: 'https://tiles.example.org/patient/P-1?studyId=study',
        });
        await fetchPatientBootstrap({
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
        const abortedRequest = fetchPatientBootstrap(
            {
                hierarchyUrl:
                    'https://tiles.example.org/patient/P-1?studyId=study',
            },
            abortController.signal
        );
        const sharedRequest = fetchPatientBootstrap({
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

    it('shares an in-flight unfiltered bootstrap hierarchy with legacy hierarchy readers', async () => {
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

        const bootstrapRequest = fetchPatientBootstrap({
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
        expect(fetchMock).toHaveBeenCalledWith(
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
            hasCachedSlideMetadata('https://tiles.example.org', 'slide-1')
        ).toBe(true);
        await expect(
            fetchPatientHierarchy(
                'https://tiles.example.org/patient/P-1?studyId=study'
            )
        ).resolves.toEqual(payload.hierarchy);
        await expect(
            fetchSlideMetadataCached('https://tiles.example.org', 'slide-1')
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

});
