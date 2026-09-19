/**
 * @jest-environment jsdom
 */
import {
    clearPatientHierarchyCache,
    fetchPatientHierarchyReadOnly,
    hasCachedPatientHierarchy,
} from './wsiHierarchyFetchCache';

jest.mock('shared/api/urls', () => ({
    buildCBioPortalAPIUrl: jest.fn((path: string) => `/${path}`),
}));

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
                                    partDesignator: '1',
                                    partType: 'SPECIMEN',
                                    partDescription: 'Unmatched specimen',
                                    subspecialty: '',
                                    pathDxTitle: '',
                                    blocks: [
                                        {
                                            blockNumber: 'A',
                                            blockLabel: 'A1',
                                            slides: [
                                                {
                                                    imageId: 'slide-1',
                                                    stainName: 'H&E',
                                                    stainGroup: 'H&E',
                                                    isHne: true,
                                                    isIhc: false,
                                                    magnification: '20x',
                                                    fileSizeBytes: null,
                                                    canServeTiles: false,
                                                    barcode: '',
                                                    slideType: 'H&E',
                                                    sampleId: null,
                                                    matchLevel: 'UNMATCHED',
                                                    specimenKey:
                                                        'unmatched::1::A',
                                                    procedureDateDays: null,
                                                    timepointSource: 'Procedure date unavailable',
                                                    procedureDateKind: 'UNDATED',
                                                    procedureDateSource: 'missing_procedure_date',
                                                    procedureDateReason: 'unavailable',
                                                    procedureDateStatus: 'MISSING_PROCEDURE_DATE',
                                                    procedureCoordinateSystem: 'patient_first_tumor_sequencing_day_zero',
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

        expect(hierarchy.patient_id).toBe('P-1');
        expect(hierarchy.reference_sample_id).toBe('S-1');
        expect(hierarchy.samples[0].sample_id).toBe('UNMATCHED');
        expect(hierarchy.slide_associations).toEqual([
            expect.objectContaining({
                image_id: 'slide-1',
                sample_id: null,
                match_level: 'UNMATCHED',
            }),
        ]);
        expect(Object.keys(hierarchy)).toContain('slide_associations');
        expect(JSON.stringify(hierarchy)).toContain('slide_associations');
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
                                    partDesignator: '1',
                                    partType: '',
                                    partDescription: '',
                                    subspecialty: '',
                                    pathDxTitle: '',
                                    blocks: [
                                        {
                                            blockNumber: '1',
                                            blockLabel: 'A1',
                                            slides: [
                                                {
                                                    imageId: 'ihc-slide',
                                                    stainName: 'PD-L1',
                                                    stainGroup: 'IHC',
                                                    isHne: false,
                                                    isIhc: true,
                                                    magnification: '',
                                                    fileSizeBytes: null,
                                                    canServeTiles: true,
                                                    barcode: '',
                                                    slideType: null,
                                                    sampleId: 'S-1',
                                                    matchLevel: 'BLOCK',
                                                    specimenKey: 'block::1',
                                                    procedureDateDays: null,
                                                    timepointSource: 'Procedure date unavailable',
                                                    procedureDateKind: 'UNDATED',
                                                    procedureDateSource: 'missing_procedure_date',
                                                    procedureDateReason: 'unavailable',
                                                    procedureDateStatus: 'MISSING_PROCEDURE_DATE',
                                                    procedureCoordinateSystem: 'patient_first_tumor_sequencing_day_zero',
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
                            partDesignator: '',
                            partType: '',
                            partDescription: '',
                            subspecialty: '',
                            pathDxTitle: '',
                            blocks: [
                                {
                                    blockNumber: 'A',
                                    blockLabel: 'A1',
                                    slides: [
                                        {
                                            imageId: 'other-slide',
                                            stainName: 'Other',
                                            stainGroup: 'Other',
                                            isHne: false,
                                            isIhc: false,
                                            magnification: '',
                                            fileSizeBytes: null,
                                            canServeTiles: true,
                                            barcode: '',
                                            slideType: 'Other',
                                            sampleId: null,
                                            matchLevel: 'UNMATCHED',
                                            specimenKey: 'unmatched::other',
                                            procedureDateDays: null,
                                            timepointSource: 'Procedure date unavailable',
                                            procedureDateKind: 'UNDATED',
                                            procedureDateSource: 'missing_procedure_date',
                                            procedureDateReason: 'unavailable',
                                            procedureDateStatus: 'MISSING_PROCEDURE_DATE',
                                            procedureCoordinateSystem: 'patient_first_tumor_sequencing_day_zero',
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
