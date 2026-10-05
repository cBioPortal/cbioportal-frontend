/**
 * @jest-environment jsdom
 */
import {
    clearPatientHierarchyCache,
    fetchPatientHierarchyReadOnly,
    fetchWsiPatientHierarchy,
    hasCachedPatientHierarchy,
} from './wsiHierarchyFetchCache';
import { buildWsiHierarchyApiUrl } from './wsiUrls';
import {
    clearWsiResourceAccessTargets,
    clearWsiSlideAccess,
    getWsiSlideAccess,
} from './wsiAuth';
import { configureWsiViewerRuntime } from './wsiViewerConfig';

configureWsiViewerRuntime({
    buildApiUrl: (path: string) => `/${path}`,
    authEnabled: true,
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

    it('shares one request between the host gate and the viewer', async () => {
        const fetchMock = jest.fn().mockResolvedValue({
            ok: true,
            json: () => Promise.resolve(makeHierarchy()),
        });
        (global as any).fetch = fetchMock;

        const gated = await fetchWsiPatientHierarchy('study', 'P 1', 'user-a');
        const viewerUrl = buildWsiHierarchyApiUrl(
            path => `/${path}`,
            'study',
            'P 1'
        );
        expect(hasCachedPatientHierarchy(viewerUrl, 'user-a')).toBe(true);
        const viewed = await fetchPatientHierarchyReadOnly(
            viewerUrl,
            undefined,
            'user-a',
            'study',
            'P 1'
        );

        expect(fetchMock).toHaveBeenCalledTimes(1);
        expect(fetchMock).toHaveBeenCalledWith(
            '/api/wsi/v2/hierarchy/study/P%201',
            {
                credentials: 'include',
            }
        );
        expect(viewed).toBe(gated);
        expect(gated.patient_id).toBe('P 1');
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

        const first = await fetchPatientHierarchyReadOnly(
            'https://tiles.example.com/patient/P-1',
            undefined,
            'user-a'
        );
        const second = await fetchPatientHierarchyReadOnly(
            'https://tiles.example.com/patient/P-1',
            undefined,
            'user-b'
        );

        expect(first.reference_sample_id).toBe('S-1');
        expect(second.reference_sample_id).toBe('S-2');
        expect(fetchMock).toHaveBeenCalledTimes(2);
        expect(
            hasCachedPatientHierarchy(
                'https://tiles.example.com/patient/P-1',
                'user-a'
            )
        ).toBe(true);
        expect(
            hasCachedPatientHierarchy(
                'https://tiles.example.com/patient/P-1',
                'user-b'
            )
        ).toBe(true);
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
                                                    procedureDateDays: null,
                                                    timepointSource:
                                                        'Procedure date unavailable',
                                                    procedureDateKind:
                                                        'UNDATED',
                                                    procedureDateSource:
                                                        'missing_procedure_date',
                                                    procedureDateReason:
                                                        'unavailable',
                                                    procedureDateStatus:
                                                        'MISSING_PROCEDURE_DATE',
                                                    procedureCoordinateSystem:
                                                        'patient_first_tumor_sequencing_day_zero',
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

        const hierarchy = await fetchPatientHierarchyReadOnly(
            '/api/wsi/v2/hierarchy/study/P-1',
            undefined,
            undefined,
            'study',
            'P-1'
        );

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
                                                    procedureDateDays: null,
                                                    timepointSource:
                                                        'Procedure date unavailable',
                                                    procedureDateKind:
                                                        'UNDATED',
                                                    procedureDateSource:
                                                        'missing_procedure_date',
                                                    procedureDateReason:
                                                        'unavailable',
                                                    procedureDateStatus:
                                                        'MISSING_PROCEDURE_DATE',
                                                    procedureCoordinateSystem:
                                                        'patient_first_tumor_sequencing_day_zero',
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

        const hierarchy = await fetchPatientHierarchyReadOnly(
            '/api/wsi/v2/hierarchy/study/P-1'
        );
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
                                            procedureDateDays: null,
                                            timepointSource:
                                                'Procedure date unavailable',
                                            procedureDateKind: 'UNDATED',
                                            procedureDateSource:
                                                'missing_procedure_date',
                                            procedureDateReason: 'unavailable',
                                            procedureDateStatus:
                                                'MISSING_PROCEDURE_DATE',
                                            procedureCoordinateSystem:
                                                'patient_first_tumor_sequencing_day_zero',
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

        const hierarchy = await fetchPatientHierarchyReadOnly(
            '/api/wsi/v2/hierarchy/study/P-other'
        );
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
        const url = 'https://tiles.example.com/patient/P-1';

        await expect(fetchPatientHierarchyReadOnly(url)).rejects.toThrow(
            'Invalid WSI hierarchy: expected the v2 sampleGroups contract'
        );
        await expect(fetchPatientHierarchyReadOnly(url)).resolves.toMatchObject(
            {
                samples: [expect.objectContaining({ sample_id: 'S-1' })],
            }
        );
        expect(fetchMock).toHaveBeenCalledTimes(2);
    });

    it('fetches after an unrelated session-storage entry', async () => {
        const url = 'https://tiles.example.com/patient/P-1?studyId=study-1';
        const fetchMock = jest.fn().mockResolvedValue({
            ok: true,
            json: () => Promise.resolve(makeHierarchy()),
        });
        (global as any).fetch = fetchMock;

        await expect(fetchPatientHierarchyReadOnly(url)).resolves.toMatchObject(
            {
                samples: [expect.objectContaining({ sample_id: 'S-1' })],
            }
        );
        expect(fetchMock).toHaveBeenCalledTimes(1);
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
            abortController.signal,
            undefined,
            'study',
            'P-1'
        );
        const sharedPromise = fetchPatientHierarchyReadOnly(
            'https://tiles.example.com/patient/P-1',
            undefined,
            undefined,
            'study',
            'P-1'
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

    it('reuses the in-memory hierarchy cache', async () => {
        const fetchMock = jest.fn().mockResolvedValue({
            ok: true,
            json: () => Promise.resolve(makeHierarchy()),
        });
        (global as any).fetch = fetchMock;
        const url = 'https://tiles.example.com/patient/P-1?studyId=study-1';

        await fetchPatientHierarchyReadOnly(url);
        expect(hasCachedPatientHierarchy(url)).toBe(true);

        clearPatientHierarchyCache();

        await fetchPatientHierarchyReadOnly(url);
        expect(fetchMock).toHaveBeenCalledTimes(2);
    });

    it('does not read hierarchy data from session storage', async () => {
        const url = 'https://tiles.example.com/patient/P-1?studyId=study-1';
        window.sessionStorage.setItem(
            `wsi-hierarchy-cache-v7::${url}`,
            JSON.stringify({
                expiresAt: Date.now() + 60_000,
                data: makeHierarchy(),
            })
        );
        const fetchMock = jest.fn().mockResolvedValueOnce({
            ok: true,
            json: () => Promise.resolve(makeHierarchy()),
        });
        (global as any).fetch = fetchMock;

        await fetchPatientHierarchyReadOnly(url);

        expect(fetchMock).toHaveBeenCalledTimes(1);
    });
});

describe('wsiHierarchyFetchCache resource access registration', () => {
    const STUDY = 'study-1';
    const PATIENT = 'P-1';
    const URL_P1 = '/api/wsi/v2/hierarchy/study-1/P-1';
    const URL_P2 = '/api/wsi/v2/hierarchy/study-1/P-2';
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
            procedureDateDays: 3,
            timepointSource: 'Procedure date',
            procedureDateKind: 'RECORDED',
            procedureDateSource: 'Recorded procedure date',
            procedureDateReason: null,
            procedureDateStatus: 'AVAILABLE',
            procedureCoordinateSystem:
                'patient_first_tumor_sequencing_day_zero',
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
        tileMetadata: {
            dimensions: { width: 100, height: 80 },
            levels: 1,
            level_dimensions: [{ width: 100, height: 80 }],
            level_downsamples: [1],
            max_zoom: 0,
            tile_size: 256,
            safe_min_level: 0,
        },
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

        await fetchPatientHierarchyReadOnly(
            URL_P1,
            undefined,
            'user-a',
            STUDY,
            PATIENT
        );
        await getWsiSlideAccess(STUDY, 'slide-1', false, 'user-a');

        expect(accessCalls()).toEqual(['study-1/P-1/access?slideKey=slide-1']);
    });

    it('does not register slides without an explicit study', async () => {
        hierarchyResponses[URL_P1] = [v2Hierarchy(['slide-1'])];

        await fetchPatientHierarchyReadOnly(URL_P1, undefined, 'user-a');

        await expect(
            getWsiSlideAccess(STUDY, 'slide-1', false, 'user-a')
        ).rejects.toThrow('WSI resource selection is unavailable');
        expect(accessCalls()).toEqual([]);
    });

    it('re-registers the slides on a cache hit', async () => {
        hierarchyResponses[URL_P1] = [v2Hierarchy(['slide-1'])];
        await fetchPatientHierarchyReadOnly(
            URL_P1,
            undefined,
            'user-a',
            STUDY,
            PATIENT
        );
        clearWsiResourceAccessTargets(STUDY);

        await fetchPatientHierarchyReadOnly(
            URL_P1,
            undefined,
            'user-a',
            STUDY,
            PATIENT
        );
        await getWsiSlideAccess(STUDY, 'slide-1', false, 'user-a');

        expect(hierarchyCalls(URL_P1)).toBe(1);
        expect(accessCalls()).toEqual(['study-1/P-1/access?slideKey=slide-1']);
    });

    it('surfaces a 404 without reloading the hierarchy', async () => {
        hierarchyResponses[URL_P1] = [v2Hierarchy(['slide-1'])];
        await fetchPatientHierarchyReadOnly(
            URL_P1,
            undefined,
            'user-a',
            STUDY,
            PATIENT
        );
        accessStatuses = [404];

        await expect(
            getWsiSlideAccess(STUDY, 'slide-1', false, 'user-a')
        ).rejects.toThrow('WSI authorization failed (404)');

        expect(hierarchyCalls(URL_P1)).toBe(1);
        expect(accessCalls()).toHaveLength(1);
    });

    it('forgets the slides with the whole hierarchy cache', async () => {
        hierarchyResponses[URL_P1] = [v2Hierarchy(['slide-1'])];
        await fetchPatientHierarchyReadOnly(
            URL_P1,
            undefined,
            'user-a',
            STUDY,
            PATIENT
        );

        clearPatientHierarchyCache();

        await expect(
            getWsiSlideAccess(STUDY, 'slide-1', false, 'user-a')
        ).rejects.toThrow('WSI resource selection is unavailable');
        expect(accessCalls()).toEqual([]);
    });
});
