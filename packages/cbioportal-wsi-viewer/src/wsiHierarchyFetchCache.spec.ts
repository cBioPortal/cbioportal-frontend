/**
 * @jest-environment jsdom
 */
import {
    clearPatientHierarchyCache,
    fetchWsiPatientHierarchy,
} from './wsiHierarchyFetchCache';
import {
    clearWsiResourceAccessTargets,
    clearWsiSlideAccess,
    getWsiSlideAccess,
} from './wsiAuth';
import { makeTileMetadata } from './wsiTestFixtures';
import { configureWsiViewerRuntime } from './wsiViewerConfig';

configureWsiViewerRuntime({
    buildApiUrl: (path: string) => `/${path}`,
});

function makeHierarchy() {
    return {
        referenceSampleId: 'S-1',
        sampleGroups: [
            {
                sampleId: 'S-1',
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
        const fetchMock = jest.fn().mockResolvedValue({
            ok: true,
            json: () => Promise.resolve(makeHierarchy()),
        });
        (global as any).fetch = fetchMock;

        const [first, second] = await Promise.all([
            fetchWsiPatientHierarchy('study', 'P 1', 'user-a'),
            fetchWsiPatientHierarchy('study', 'P 1', 'user-a'),
        ]);
        const third = await fetchWsiPatientHierarchy('study', 'P 1', 'user-a');

        expect(fetchMock).toHaveBeenCalledTimes(1);
        expect(fetchMock).toHaveBeenCalledWith(
            '/api/wsi/v2/hierarchy/study/P%201',
            {
                credentials: 'include',
            }
        );
        expect(second).toBe(first);
        expect(third).toBe(first);
        expect(first.patient_id).toBe('P 1');
    });

    it('isolates cached hierarchy data by authenticated subject', async () => {
        const fetchMock = jest
            .fn()
            .mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve(makeHierarchy()),
            })
            .mockResolvedValueOnce({
                ok: true,
                json: () =>
                    Promise.resolve({
                        ...makeHierarchy(),
                        referenceSampleId: 'S-2',
                    }),
            });
        (global as any).fetch = fetchMock;

        const first = await fetchWsiPatientHierarchy('study', 'P-1', 'user-a');
        const second = await fetchWsiPatientHierarchy('study', 'P-1', 'user-b');
        const firstAgain = await fetchWsiPatientHierarchy(
            'study',
            'P-1',
            'user-a'
        );

        expect(first.reference_sample_id).toBe('S-1');
        expect(second.reference_sample_id).toBe('S-2');
        expect(firstAgain).toBe(first);
        expect(fetchMock).toHaveBeenCalledTimes(2);
    });

    it('normalizes the v2 nested payload for the existing viewer state', async () => {
        (global as any).fetch = jest.fn().mockResolvedValue({
            ok: true,
            json: () =>
                Promise.resolve({
                    referenceSampleId: 'S-1',
                    sampleGroups: [
                        {
                            sampleId: null,
                            parts: [
                                {
                                    partNumber: '1',
                                    partType: 'SPECIMEN',
                                    partDescription: 'Unmatched specimen',
                                    subspecialty: '',
                                    blocks: [
                                        {
                                            blockNumber: 'A',
                                            blockLabel: 'A1',
                                            slides: [
                                                {
                                                    slideKey: 'slide-1',
                                                    stainName: 'H&E',
                                                    stainGroup: 'H&E',
                                                    isHne: true,
                                                    isIhc: false,
                                                    magnification: '20x',
                                                    fileSizeBytes: null,
                                                    canServeTiles: false,
                                                    slideType: 'H&E',
                                                    sampleId: null,
                                                    matchLevel: 'UNMATCHED',
                                                    specimenKey:
                                                        'unmatched::1::A',
                                                },
                                            ],
                                        },
                                    ],
                                },
                            ],
                        },
                    ],
                }),
        });

        const hierarchy = await fetchWsiPatientHierarchy('study', 'P-1');

        expect(hierarchy.patient_id).toBe('P-1');
        expect(hierarchy.reference_sample_id).toBe('S-1');
        expect(hierarchy.samples[0].sample_id).toBe('UNMATCHED');
        expect(hierarchy.slide_associations).toEqual([
            expect.objectContaining({
                slide_key: 'slide-1',
                sample_id: null,
                match_level: 'UNMATCHED',
            }),
        ]);
        expect(Object.keys(hierarchy)).toContain('slide_associations');
        expect(JSON.stringify(hierarchy)).toContain('slide_associations');
        const slide = hierarchy.samples[0].parts[0].blocks[0].slides[0];
        expect(slide.slide_key).toBe('slide-1');
        expect(JSON.stringify(hierarchy)).not.toMatch(
            /image_?id|barcode|resource_?(data_?)?id/i
        );
    });

    it('derives an IHC slide type from the authoritative flag when slideType is null', async () => {
        (global as any).fetch = jest.fn().mockResolvedValue({
            ok: true,
            json: () =>
                Promise.resolve({
                    referenceSampleId: 'S-1',
                    sampleGroups: [
                        {
                            sampleId: 'S-1',
                            parts: [
                                {
                                    partNumber: '1',
                                    partType: '',
                                    partDescription: '',
                                    subspecialty: '',
                                    blocks: [
                                        {
                                            blockNumber: '1',
                                            blockLabel: 'A1',
                                            slides: [
                                                {
                                                    slideKey: 'ihc-slide',
                                                    stainName: 'PD-L1',
                                                    stainGroup: 'IHC',
                                                    isHne: false,
                                                    isIhc: true,
                                                    magnification: '',
                                                    fileSizeBytes: null,
                                                    canServeTiles: true,
                                                    slideType: null,
                                                    sampleId: 'S-1',
                                                    matchLevel: 'BLOCK',
                                                    specimenKey: 'block::1',
                                                },
                                            ],
                                        },
                                    ],
                                },
                            ],
                        },
                    ],
                }),
        });

        const hierarchy = await fetchWsiPatientHierarchy('study', 'P-1');
        expect(
            hierarchy.samples[0].parts[0].blocks[0].slides[0].slide_type
        ).toBe('IHC');
        expect(hierarchy.slide_associations?.[0].slide_type).toBe('IHC');
    });

    it('preserves Other instead of coercing it to H&E or IHC', async () => {
        const payload = {
            referenceSampleId: null,
            sampleGroups: [
                {
                    sampleId: null,
                    parts: [
                        {
                            partNumber: '1',
                            partType: '',
                            partDescription: '',
                            subspecialty: '',
                            blocks: [
                                {
                                    blockNumber: 'A',
                                    blockLabel: 'A1',
                                    slides: [
                                        {
                                            slideKey: 'other-slide',
                                            stainName: 'Other',
                                            stainGroup: 'Other',
                                            isHne: false,
                                            isIhc: false,
                                            magnification: '',
                                            fileSizeBytes: null,
                                            canServeTiles: true,
                                            slideType: 'Other',
                                            sampleId: null,
                                            matchLevel: 'UNMATCHED',
                                            specimenKey: 'unmatched::other',
                                        },
                                    ],
                                },
                            ],
                        },
                    ],
                },
            ],
        };
        (global as any).fetch = jest.fn().mockResolvedValue({
            ok: true,
            json: () => Promise.resolve(payload),
        });

        const hierarchy = await fetchWsiPatientHierarchy('study', 'P-other');
        expect(
            hierarchy.samples[0].parts[0].blocks[0].slides[0].slide_type
        ).toBe('Other');
        expect(hierarchy.slide_associations?.[0].slide_type).toBe('Other');
    });

    it('rejects hierarchy payloads without a sample collection and retries cleanly', async () => {
        const fetchMock = jest
            .fn()
            .mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({ referenceSampleId: 'S-1' }),
            })
            .mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve(makeHierarchy()),
            });
        (global as any).fetch = fetchMock;
        await expect(fetchWsiPatientHierarchy('study', 'P-1')).rejects.toThrow(
            'Invalid WSI hierarchy: expected the v2 sampleGroups contract'
        );
        await expect(
            fetchWsiPatientHierarchy('study', 'P-1')
        ).resolves.toMatchObject({
            samples: [expect.objectContaining({ sample_id: 'S-1' })],
        });
        expect(fetchMock).toHaveBeenCalledTimes(2);
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
        const abortedPromise = fetchWsiPatientHierarchy(
            'study',
            'P-1',
            undefined,
            abortController.signal
        );
        const sharedPromise = fetchWsiPatientHierarchy('study', 'P-1');
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

    it('fetches again after the cache is cleared', async () => {
        const fetchMock = jest.fn().mockResolvedValue({
            ok: true,
            json: () => Promise.resolve(makeHierarchy()),
        });
        (global as any).fetch = fetchMock;

        await fetchWsiPatientHierarchy('study-1', 'P-1');
        await fetchWsiPatientHierarchy('study-1', 'P-1');
        expect(fetchMock).toHaveBeenCalledTimes(1);

        clearPatientHierarchyCache();

        await fetchWsiPatientHierarchy('study-1', 'P-1');
        expect(fetchMock).toHaveBeenCalledTimes(2);
    });
});

describe('wsiHierarchyFetchCache resource access registration', () => {
    const STUDY = 'study-1';
    const PATIENT = 'P-1';
    const URL_P1 = '/api/wsi/v2/hierarchy/study-1/P-1';
    let originalFetch: typeof globalThis.fetch;
    let hierarchyResponses: Record<string, unknown[]>;
    let accessStatuses: number[];
    let fetchMock: jest.Mock;

    function v2Slide(slideKey: string) {
        return {
            slideKey,
            stainName: 'H&E',
            stainGroup: 'H&E',
            isHne: true,
            isIhc: false,
            magnification: '20x',
            fileSizeBytes: null,
            canServeTiles: true,
            slideType: 'H&E',
            sampleId: 'S-1',
            matchLevel: 'BLOCK',
            specimenKey: 'block::1::A',
        };
    }

    function v2Hierarchy(slideKeys: string[]) {
        return {
            referenceSampleId: 'S-1',
            sampleGroups: [
                {
                    sampleId: 'S-1',
                    parts: [
                        {
                            partNumber: '1',
                            partType: '',
                            partDescription: '',
                            subspecialty: '',
                            blocks: [
                                {
                                    blockNumber: 'A',
                                    blockLabel: 'A1',
                                    slides: slideKeys.map(v2Slide),
                                },
                            ],
                        },
                    ],
                },
            ],
        };
    }

    const accessPayload = {
        slideKey: 'slide',
        tileMetadata: makeTileMetadata({
            dimensions: { width: 100, height: 80 },
            levels: 1,
            level_dimensions: [{ width: 100, height: 80 }],
            level_downsamples: [1],
            max_zoom: 0,
            tile_size: 256,
            safe_min_level: 0,
        }),
        thumbnail: {
            width: 128,
            height: 96,
            contentType: 'image/jpeg',
        },
        accessToken: 'token',
        tokenType: 'Bearer',
        expiresIn: 300,
    };

    function hierarchyCalls(url: string): number {
        return fetchMock.mock.calls.filter(([called]) => called === url).length;
    }

    function accessCalls(): string[] {
        return fetchMock.mock.calls
            .map(([called]) => String(called))
            .filter(called => called.includes('/access?'))
            .map(called => {
                const parsed = new URL(called);
                return `${parsed.pathname.replace(
                    '/api/wsi/v2/resources/',
                    ''
                )}${parsed.search}`;
            });
    }

    beforeEach(() => {
        originalFetch = (global as any).fetch;
        clearPatientHierarchyCache();
        clearWsiSlideAccess();
        hierarchyResponses = {};
        accessStatuses = [];
        fetchMock = jest.fn((url: string) => {
            if (String(url).includes('/access?')) {
                const status = accessStatuses.shift() ?? 200;
                const slideKey = new URL(String(url)).searchParams.get(
                    'slideKey'
                );
                return Promise.resolve({
                    ok: status >= 200 && status < 300,
                    status,
                    json: () => Promise.resolve({ ...accessPayload, slideKey }),
                });
            }
            const queue = hierarchyResponses[url] || [];
            const payload = queue.length > 1 ? queue.shift() : queue[0];
            return Promise.resolve({
                ok: true,
                status: 200,
                json: () => Promise.resolve(payload),
            });
        });
        (global as any).fetch = fetchMock;
    });

    afterEach(() => {
        (global as any).fetch = originalFetch;
        clearPatientHierarchyCache();
    });

    it('registers the slides of a network hierarchy', async () => {
        hierarchyResponses[URL_P1] = [v2Hierarchy(['slide-1'])];

        await fetchWsiPatientHierarchy(STUDY, PATIENT, 'user-a');
        await getWsiSlideAccess(STUDY, 'slide-1', false, 'user-a');

        expect(accessCalls()).toEqual(['study-1/P-1/access?slideKey=slide-1']);
    });

    it('re-registers the slides on a cache hit', async () => {
        hierarchyResponses[URL_P1] = [v2Hierarchy(['slide-1'])];
        await fetchWsiPatientHierarchy(STUDY, PATIENT, 'user-a');
        clearWsiResourceAccessTargets(STUDY);

        await fetchWsiPatientHierarchy(STUDY, PATIENT, 'user-a');
        await getWsiSlideAccess(STUDY, 'slide-1', false, 'user-a');

        expect(hierarchyCalls(URL_P1)).toBe(1);
        expect(accessCalls()).toEqual(['study-1/P-1/access?slideKey=slide-1']);
    });

    it('surfaces a 404 without reloading the hierarchy', async () => {
        hierarchyResponses[URL_P1] = [v2Hierarchy(['slide-1'])];
        await fetchWsiPatientHierarchy(STUDY, PATIENT, 'user-a');
        accessStatuses = [404];

        await expect(
            getWsiSlideAccess(STUDY, 'slide-1', false, 'user-a')
        ).rejects.toThrow('WSI authorization failed (404)');

        expect(hierarchyCalls(URL_P1)).toBe(1);
        expect(accessCalls()).toHaveLength(1);
    });

    it('forgets the slides with the whole hierarchy cache', async () => {
        hierarchyResponses[URL_P1] = [v2Hierarchy(['slide-1'])];
        await fetchWsiPatientHierarchy(STUDY, PATIENT, 'user-a');

        clearPatientHierarchyCache();

        await expect(
            getWsiSlideAccess(STUDY, 'slide-1', false, 'user-a')
        ).rejects.toThrow('WSI resource selection is unavailable');
        expect(accessCalls()).toEqual([]);
    });
});
