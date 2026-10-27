/**
 * @jest-environment jsdom
 */
import {
    buildPatientHierarchy,
    clearPatientHierarchyCache,
    fetchWsiPatientHierarchy,
} from './wsiHierarchyFetchCache';
import {
    clearWsiResourceAccessTargets,
    clearWsiSlideAccess,
    getWsiSlideAccess,
} from './wsiAuth';
import {
    isSlideRowsRequest,
    makeAccessPayload,
    makeSample,
    makeSlide,
    makeTileMetadata,
    slideRowsFor,
} from './wsiTestFixtures';
import { PatientHierarchy, WsiResourceRow } from './wsiViewerTypes';
import { configureWsiViewerRuntime } from './wsiViewerConfig';

configureWsiViewerRuntime({
    buildApiUrl: (path: string) => `/${path}`,
});

const ROWS_URL = '/api/resource-table/query/fetch';

function row(
    sampleId: string | null,
    metadata: Record<string, unknown>
): WsiResourceRow {
    return {
        resourceId: sampleId ? 'WSI_SAMPLE' : 'WSI_PATIENT',
        patientId: 'P-1',
        sampleId,
        metadata,
    };
}

/** A fetch mock that answers each resource table request with its rows. */
function rowsFetch(hierarchy: PatientHierarchy) {
    return jest.fn((url: string, init?: RequestInit) =>
        Promise.resolve({
            ok: true,
            status: 200,
            json: () => Promise.resolve(slideRowsFor(hierarchy, init)),
        })
    );
}

function oneSlide(referenceSampleId = 'S-1'): PatientHierarchy {
    return {
        patient_id: 'P-1',
        reference_sample_id: referenceSampleId,
        samples: [makeSample('S-1', [makeSlide({ slide_key: 'slide-1' })])],
    };
}

describe('wsiHierarchyFetchCache loading', () => {
    let originalFetch: typeof globalThis.fetch;

    beforeEach(() => {
        originalFetch = (global as any).fetch;
        clearPatientHierarchyCache();
    });

    afterEach(() => {
        (global as any).fetch = originalFetch;
        clearPatientHierarchyCache();
    });

    it('requests both slide resources once and reuses the cached hierarchy', async () => {
        const fetchMock = rowsFetch(oneSlide());
        (global as any).fetch = fetchMock;

        const [first, second] = await Promise.all([
            fetchWsiPatientHierarchy('study', 'P 1', 'user-a'),
            fetchWsiPatientHierarchy('study', 'P 1', 'user-a'),
        ]);
        const third = await fetchWsiPatientHierarchy('study', 'P 1', 'user-a');

        expect(fetchMock).toHaveBeenCalledTimes(2);
        const bodies = fetchMock.mock.calls.map(([url, init]) => {
            expect(url).toBe(ROWS_URL);
            expect(init).toMatchObject({
                method: 'POST',
                credentials: 'include',
            });
            return JSON.parse(String(init!.body));
        });
        expect(bodies.map(body => body.resourceId)).toEqual([
            'WSI_SAMPLE',
            'WSI_PATIENT',
        ]);
        expect(bodies[0]).toMatchObject({
            studyIds: ['study'],
            patientIdentifiers: [{ studyId: 'study', patientId: 'P 1' }],
            pageNumber: 0,
        });
        expect(second).toBe(first);
        expect(third).toBe(first);
        expect(first.patient_id).toBe('P 1');
    });

    it('isolates cached hierarchy data by authenticated subject', async () => {
        const fetchMock = jest
            .fn()
            .mockImplementationOnce((url: string, init?: RequestInit) =>
                rowsFetch(oneSlide('S-1'))(url, init)
            )
            .mockImplementationOnce((url: string, init?: RequestInit) =>
                rowsFetch(oneSlide('S-1'))(url, init)
            )
            .mockImplementation((url: string, init?: RequestInit) =>
                rowsFetch(oneSlide('S-2'))(url, init)
            );
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
        expect(fetchMock).toHaveBeenCalledTimes(4);
    });

    it('rejects a response that is not a row list and retries cleanly', async () => {
        const fetchMock = jest
            .fn()
            .mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({ rows: [] }),
            })
            .mockImplementation((url: string, init?: RequestInit) =>
                rowsFetch(oneSlide())(url, init)
            );
        (global as any).fetch = fetchMock;

        await expect(fetchWsiPatientHierarchy('study', 'P-1')).rejects.toThrow(
            'Invalid WSI slide rows: expected an array'
        );
        await expect(
            fetchWsiPatientHierarchy('study', 'P-1')
        ).resolves.toMatchObject({
            samples: [expect.objectContaining({ sample_id: 'S-1' })],
        });
    });
});

describe('buildPatientHierarchy', () => {
    it('groups rows into samples, parts and blocks in pathology order', () => {
        const part = (n: string, key: string) => ({
            part_number: n,
            part_key: key,
            part_type: `Part ${n}`,
        });
        const hierarchy = buildPatientHierarchy(
            [
                row('S-2', {
                    ...part('2', 'p2'),
                    block_number: '1',
                    block_key: 'b21',
                    slide_key: 'c',
                }),
                row('S-1', {
                    ...part('10', 'p10'),
                    block_number: '1',
                    block_key: 'b101',
                    slide_key: 'e',
                }),
                row('S-1', {
                    ...part('2', 'p2'),
                    block_number: '3',
                    block_key: 'b23',
                    slide_key: 'b',
                }),
                row('S-1', {
                    ...part('2', 'p2'),
                    block_number: '1',
                    block_key: 'b21',
                    slide_key: 'd',
                }),
                row('S-1', {
                    ...part('2', 'p2'),
                    block_number: '1',
                    block_key: 'b21',
                    slide_key: 'a',
                }),
                row(null, {
                    ...part('1', 'p1'),
                    block_number: '1',
                    block_key: 'b11',
                    slide_key: 'u',
                    reference_sample_id: 'S-1',
                }),
            ],
            'P-1'
        );

        expect(hierarchy.reference_sample_id).toBe('S-1');
        expect(
            hierarchy.samples.map(sample => [
                sample.sample_id,
                sample.parts.map(p => [
                    p.part_number,
                    p.blocks.map(b => [
                        b.block_number,
                        b.slides.map(s => s.slide_key),
                    ]),
                ]),
            ])
        ).toEqual([
            ['UNMATCHED', [['1', [['1', ['u']]]]]],
            [
                'S-1',
                [
                    [
                        '2',
                        [
                            ['1', ['a', 'd']],
                            ['3', ['b']],
                        ],
                    ],
                    ['10', [['1', ['e']]]],
                ],
            ],
            ['S-2', [['2', [['1', ['c']]]]]],
        ]);
    });

    it('maps the row fields onto the slide and keeps only servable tile metadata', () => {
        const tileMetadata = makeTileMetadata();
        const hierarchy = buildPatientHierarchy(
            [
                row(null, {
                    slide_key: 'slide-1',
                    part_number: '1',
                    part_description: 'Unmatched specimen',
                    block_number: 'A',
                    block_label: 'A1',
                    stain_name: 'H&E',
                    is_hne: true,
                    file_size_bytes: 1234,
                    can_serve_tiles: true,
                    match_level: 'UNMATCHED',
                    specimen_key: 'unmatched::1::A',
                    serving: {
                        key: 'slide-1',
                        sealed_source: 'sealed',
                        tile_metadata_json: tileMetadata,
                    },
                }),
                row(null, {
                    slide_key: 'slide-2',
                    part_number: '1',
                    block_number: 'A',
                    can_serve_tiles: false,
                }),
            ],
            'P-1'
        );

        const [
            servable,
            notServable,
        ] = hierarchy.samples[0].parts[0].blocks[0].slides;
        expect(servable).toEqual(
            expect.objectContaining({
                slide_key: 'slide-1',
                sample_id: null,
                stain_kind: 'hne',
                file_size_bytes: '1234',
                can_serve_tiles: true,
                match_level: 'UNMATCHED',
                specimen_key: 'unmatched::1::A',
                part_number: '1',
                part_description: 'Unmatched specimen',
                block_label: 'A1',
                block_number: 'A',
                resource_id: 'WSI_PATIENT',
                serving_key: 'slide-1',
                tile_metadata: tileMetadata,
            })
        );
        expect(notServable.can_serve_tiles).toBe(false);
        expect(notServable.resource_id).toBe('WSI_PATIENT');
        expect(notServable.serving_key).toBeUndefined();
        expect(notServable.tile_metadata).toBeUndefined();
        expect(notServable.file_size_bytes).toBe('');
    });

    it.each([
        // The resolved flags win over the stored type.
        [true, false, 'IHC', 'hne'],
        [false, true, 'H&E', 'ihc'],
        [true, true, null, 'ihc'],
        [false, false, 'Other', 'other'],
        [false, false, null, 'other'],
        // A stored stain type the flags don't confirm is unknown.
        [false, false, ' unknown ', 'unknown'],
        [false, false, 'he', 'unknown'],
        [false, false, 'IHC', 'unknown'],
    ] as const)(
        'classifies is_hne=%s is_ihc=%s slide_type=%p as %s',
        (isHne, isIhc, slideType, expected) => {
            const hierarchy = buildPatientHierarchy(
                [
                    row('S-1', {
                        slide_key: 'slide-1',
                        is_hne: isHne,
                        is_ihc: isIhc,
                        slide_type: slideType,
                    }),
                ],
                'P-1'
            );
            expect(
                hierarchy.samples[0].parts[0].blocks[0].slides[0].stain_kind
            ).toBe(expected);
        }
    );
});

describe('wsiHierarchyFetchCache resource access registration', () => {
    const STUDY = 'study-1';
    const PATIENT = 'P-1';
    let originalFetch: typeof globalThis.fetch;
    let hierarchy: PatientHierarchy;
    let accessStatuses: number[];
    let fetchMock: jest.Mock;

    function withSlides(...slides: ReturnType<typeof makeSlide>[]) {
        return {
            patient_id: PATIENT,
            samples: [makeSample('S-1', slides)],
        };
    }

    function rowsCalls(): number {
        return fetchMock.mock.calls.filter(([called]) =>
            isSlideRowsRequest(String(called))
        ).length;
    }

    function accessCalls(): string[] {
        return fetchMock.mock.calls
            .map(([called]) => String(called))
            .filter(called => called.includes('/access?'))
            .map(called => {
                const parsed = new URL(called);
                return `${parsed.pathname.replace('/api/resources/', '')}${
                    parsed.search
                }`;
            });
    }

    beforeEach(() => {
        originalFetch = (global as any).fetch;
        clearPatientHierarchyCache();
        clearWsiSlideAccess();
        hierarchy = withSlides(makeSlide({ slide_key: 'slide-1' }));
        accessStatuses = [];
        fetchMock = jest.fn((url: string, init?: RequestInit) => {
            if (String(url).includes('/access?')) {
                const status = accessStatuses.shift() ?? 200;
                const key = new URL(String(url)).searchParams.get('key');
                return Promise.resolve({
                    ok: status >= 200 && status < 300,
                    status,
                    json: () => Promise.resolve(makeAccessPayload({ key })),
                });
            }
            return Promise.resolve({
                ok: true,
                status: 200,
                json: () => Promise.resolve(slideRowsFor(hierarchy, init)),
            });
        });
        (global as any).fetch = fetchMock;
    });

    afterEach(() => {
        (global as any).fetch = originalFetch;
        clearPatientHierarchyCache();
    });

    it('registers the slides of a loaded hierarchy with their tile metadata', async () => {
        await fetchWsiPatientHierarchy(STUDY, PATIENT, 'user-a');
        const access = await getWsiSlideAccess(
            STUDY,
            'slide-1',
            false,
            'user-a'
        );

        expect(accessCalls()).toEqual([
            'study-1/WSI_SAMPLE/access?key=slide-1&patientId=P-1',
        ]);
        expect(access.tileMetadata).toEqual(makeTileMetadata());
        expect(access.accessToken).toBe('test-token');
    });

    it('re-registers the slides on a cache hit', async () => {
        await fetchWsiPatientHierarchy(STUDY, PATIENT, 'user-a');
        clearWsiResourceAccessTargets(STUDY);

        await fetchWsiPatientHierarchy(STUDY, PATIENT, 'user-a');
        await getWsiSlideAccess(STUDY, 'slide-1', false, 'user-a');

        expect(rowsCalls()).toBe(2);
        expect(accessCalls()).toEqual([
            'study-1/WSI_SAMPLE/access?key=slide-1&patientId=P-1',
        ]);
    });

    it('does not request access for a slide that cannot serve tiles', async () => {
        hierarchy = withSlides(
            makeSlide({ slide_key: 'slide-1', can_serve_tiles: false })
        );
        await fetchWsiPatientHierarchy(STUDY, PATIENT, 'user-a');

        await expect(
            getWsiSlideAccess(STUDY, 'slide-1', false, 'user-a')
        ).rejects.toThrow('WSI slide cannot serve tiles');
        expect(accessCalls()).toEqual([]);
    });

    it('surfaces a 404 without reloading the hierarchy', async () => {
        await fetchWsiPatientHierarchy(STUDY, PATIENT, 'user-a');
        accessStatuses = [404];

        await expect(
            getWsiSlideAccess(STUDY, 'slide-1', false, 'user-a')
        ).rejects.toThrow('WSI authorization failed (404)');

        expect(rowsCalls()).toBe(2);
        expect(accessCalls()).toHaveLength(1);
    });

    it('forgets the slides with the whole hierarchy cache', async () => {
        await fetchWsiPatientHierarchy(STUDY, PATIENT, 'user-a');

        clearPatientHierarchyCache();

        await expect(
            getWsiSlideAccess(STUDY, 'slide-1', false, 'user-a')
        ).rejects.toThrow('WSI resource selection is unavailable');
        expect(accessCalls()).toEqual([]);
    });
});
