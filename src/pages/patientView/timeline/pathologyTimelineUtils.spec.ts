import {
    appendPathologyTimelineEvents,
    buildPathologyTimelineEvents,
    buildPatientHierarchyUrl,
    clearPathologyTimelineEventsCache,
    fetchPathologyTimelineEvents,
    hasServableDiagnosticSlides,
} from './pathologyTimelineUtils';
import { clearPatientHierarchyCache } from 'shared/components/wsiViewer/wsiHierarchyFetchCache';
import { PatientHierarchy } from 'shared/components/wsiViewer/wsiViewerTypes';
import { ClinicalEvent } from 'cbioportal-ts-api-client';

function makeSlide(
    overrides: Partial<
        PatientHierarchy['samples'][number]['parts'][number]['blocks'][number]['slides'][number]
    > = {}
) {
    return {
        image_id: '1',
        stain_name: 'H&E',
        stain_group: 'H&E (Initial)',
        is_hne: true,
        is_ihc: false,
        magnification: '',
        file_size_bytes: '',
        can_serve_tiles: true,
        barcode: '',
        block_label: 'A1',
        block_number: '1',
        ...overrides,
    };
}

function makeHierarchySample(
    sampleId: string,
    slides: Array<ReturnType<typeof makeSlide>>
) {
    return {
        sample_id: sampleId,
        cancer_type: '',
        cancer_type_detailed: '',
        oncotree_code: '',
        primary_site: '',
        sample_type: '',
        parts: [
            {
                part_number: '1',
                part_designator: '1',
                part_type: '',
                part_description: '',
                subspecialty: '',
                path_dx_title: '',
                blocks: [
                    {
                        block_number: '1',
                        block_label: 'A1',
                        slides,
                    },
                ],
            },
        ],
    };
}

function makeHierarchy(
    patientId: string,
    samples: Array<ReturnType<typeof makeHierarchySample>>
): PatientHierarchy {
    return {
        patient_id: patientId,
        samples,
    };
}

function makeClinicalSample(
    sampleId: string,
    timepointDays = '-418',
    timepointSource = 'Sample acquisition'
) {
    return {
        id: sampleId,
        uniquePatientKey: 'patient-key',
        uniqueSampleKey: 'sample-key',
        clinicalData: [
            { clinicalAttributeId: 'WSI_TIMEPOINT_DAYS', value: timepointDays },
            {
                clinicalAttributeId: 'WSI_TIMEPOINT_SOURCE',
                value: timepointSource,
            },
        ],
    } as any;
}

beforeEach(() => {
    clearPatientHierarchyCache();
    clearPathologyTimelineEventsCache();
});

describe('buildPathologyTimelineEvents', () => {
    it('creates H&E and IHC pathology timeline events from distinct servable pathology blocks', () => {
        const hierarchy = makeHierarchy('P-0000678', [
            makeHierarchySample('P-0000678-T01-IM3', [
                makeSlide(),
                makeSlide({
                    image_id: '2',
                    stain_group: 'H&E (Other)',
                    stain_name: 'H&E',
                }),
                makeSlide({
                    image_id: '2',
                    stain_group: 'H&E (Other)',
                    stain_name: 'H&E',
                }),
                makeSlide({
                    image_id: '3',
                    stain_group: 'IHC',
                    stain_name: 'PD-L1',
                    is_hne: false,
                    is_ihc: true,
                }),
            ]),
        ]);
        const sample = makeClinicalSample('P-0000678-T01-IM3');

        const events = buildPathologyTimelineEvents(
            hierarchy,
            [sample],
            'coad_msk_2025',
            'P-0000678'
        );

        expect(events).toHaveLength(2);
        expect(events.map(event => event.eventType)).toEqual([
            'PATHOLOGY',
            'PATHOLOGY',
        ]);
        expect(
            events.map(event => event.startNumberOfDaysSinceDiagnosis)
        ).toEqual([-418, -418]);
        expect(
            events.map(
                event =>
                    event.attributes.find(
                        attribute => attribute.key === 'SUBTYPE'
                    )?.value
            )
        ).toEqual(['H&E', 'IHC']);
        expect(
            events.map(
                event =>
                    event.attributes.find(
                        attribute => attribute.key === 'IMAGE_COUNT'
                    )?.value
            )
        ).toEqual(['1', '1']);
        expect(
            events.map(
                event =>
                    event.attributes.find(
                        attribute => attribute.key === 'LINKOUT'
                    )?.value
            )
        ).toEqual([
            '/patient/wsiHESlides?studyId=coad_msk_2025&caseId=P-0000678&sampleId=P-0000678-T01-IM3&stainFilter=hne',
            '/patient/wsiHESlides?studyId=coad_msk_2025&caseId=P-0000678&sampleId=P-0000678-T01-IM3&stainFilter=ihc',
        ]);
    });

    it('ignores hierarchy samples that are not present in the clinical sample set', () => {
        const hierarchy = makeHierarchy('P-0000678', [
            makeHierarchySample('P-0000678-T01-IM3', [makeSlide()]),
            makeHierarchySample('P-0000678-T02-IM3', [
                makeSlide({ image_id: '9' }),
            ]),
        ]);
        const sample = makeClinicalSample('P-0000678-T01-IM3');

        const events = buildPathologyTimelineEvents(
            hierarchy,
            [sample],
            'coad_msk_2025',
            'P-0000678'
        );

        expect(events).toHaveLength(1);
        expect(
            events[0].attributes.find(
                attribute => attribute.key === 'IMAGE_COUNT'
            )?.value
        ).toBe('1');
    });

    it('counts distinct blocks when multiple servable H&E scans exist in the same block', () => {
        const hierarchy = makeHierarchy('P-0035830', [
            makeHierarchySample('P-0035830-T01-IM6', [
                makeSlide({
                    image_id: '2239305',
                    stain_name: 'H&E, Initial',
                    block_label: '6L',
                    block_number: '6',
                }),
                makeSlide({
                    image_id: '1306439',
                    stain_name: 'DM H&E RECUT',
                    stain_group: 'H&E (Other)',
                    block_label: '6L',
                    block_number: '6',
                }),
                makeSlide({
                    image_id: '1310221',
                    stain_name: 'RECUT ADDITIONAL H&E',
                    stain_group: 'H&E (Other)',
                    block_label: '6L',
                    block_number: '6',
                }),
            ]),
        ]);
        const sample = makeClinicalSample('P-0035830-T01-IM6', '-10');

        const events = buildPathologyTimelineEvents(
            hierarchy,
            [sample],
            'coad_msk_2025',
            'P-0035830'
        );

        expect(events).toHaveLength(1);
        expect(
            events[0].attributes.find(
                attribute => attribute.key === 'IMAGE_COUNT'
            )?.value
        ).toBe('1');
    });
});

describe('hasServableDiagnosticSlides', () => {
    it('returns true when a servable H&E or IHC slide is present', () => {
        const hierarchy = makeHierarchy('P-1', [
            makeHierarchySample('S-1', [makeSlide()]),
        ]);

        expect(hasServableDiagnosticSlides(hierarchy)).toBe(true);
    });

    it('returns false when only non-diagnostic servable slides are present', () => {
        const hierarchy = makeHierarchy('P-2', [
            makeHierarchySample('S-2', [
                makeSlide({
                    image_id: '9',
                    stain_name: 'SLIDES SUBMITTED',
                    stain_group: 'SLIDES SUBMITTED',
                    is_hne: false,
                    is_ihc: false,
                }),
            ]),
        ]);

        expect(hasServableDiagnosticSlides(hierarchy)).toBe(false);
    });

    it('ignores servable slides from samples outside the allowed set', () => {
        const hierarchy = makeHierarchy('P-3', [
            makeHierarchySample('S-3', [makeSlide()]),
        ]);

        expect(hasServableDiagnosticSlides(hierarchy, new Set(['S-4']))).toBe(
            false
        );
    });
});

describe('buildPatientHierarchyUrl', () => {
    it('includes the studyId query parameter', () => {
        expect(
            buildPatientHierarchyUrl('/api', 'P-0074875', 'coad_msk_2025')
        ).toBe('/api/patient/P-0074875?studyId=coad_msk_2025');
    });
});

describe('appendPathologyTimelineEvents', () => {
    const originalFetch = global.fetch;

    afterEach(() => {
        global.fetch = originalFetch;
    });

    it('returns the original clinical events when patient or study IDs are missing', async () => {
        const clinicalEvents = [
            {
                eventType: 'TREATMENT',
                patientId: 'P-1',
                startNumberOfDaysSinceDiagnosis: 1,
                studyId: 'study',
            },
        ] as ClinicalEvent[];

        const result = await appendPathologyTimelineEvents(
            clinicalEvents,
            'https://slides.example.com',
            undefined,
            'study',
            []
        );

        expect(result).toEqual(clinicalEvents);
        expect(result).toBe(clinicalEvents);
    });

    it('returns the original clinical events when the tile server is missing', async () => {
        const clinicalEvents = [
            {
                eventType: 'TREATMENT',
                patientId: 'P-1',
                startNumberOfDaysSinceDiagnosis: 1,
                studyId: 'study',
            },
        ] as ClinicalEvent[];

        const result = await appendPathologyTimelineEvents(
            clinicalEvents,
            undefined,
            'P-1',
            'study',
            []
        );

        expect(result).toBe(clinicalEvents);
    });

    it('returns the original clinical events when no pathology events are found', async () => {
        const clinicalEvents = [
            {
                eventType: 'TREATMENT',
                patientId: 'P-1',
                startNumberOfDaysSinceDiagnosis: 1,
                studyId: 'study',
            },
        ] as ClinicalEvent[];

        global.fetch = jest.fn().mockResolvedValue({
            ok: true,
            json: async () => ({
                patient_id: 'P-1',
                samples: [],
            }),
        }) as typeof fetch;

        const result = await appendPathologyTimelineEvents(
            clinicalEvents,
            'https://slides.example.com',
            'P-1',
            'study',
            []
        );

        expect(result).toBe(clinicalEvents);
    });

    it('deduplicates concurrent pathology timeline fetches for the same patient context', async () => {
        const hierarchy = makeHierarchy('P-1', [
            makeHierarchySample('S-1', [makeSlide()]),
        ]);
        const fetchMock = jest.fn().mockResolvedValue({
            ok: true,
            json: async () => hierarchy,
        });
        global.fetch = fetchMock as typeof fetch;
        const samples = [makeClinicalSample('S-1')];

        const [first, second] = await Promise.all([
            fetchPathologyTimelineEvents(
                'https://slides.example.com',
                'P-1',
                'study',
                samples
            ),
            fetchPathologyTimelineEvents(
                'https://slides.example.com',
                'P-1',
                'study',
                samples
            ),
        ]);

        expect(fetchMock).toHaveBeenCalledTimes(1);
        expect(second).toBe(first);
    });

    it('uses separate pathology timeline cache entries when sample timing changes', async () => {
        const hierarchy = makeHierarchy('P-1', [
            makeHierarchySample('S-1', [makeSlide()]),
        ]);
        const fetchMock = jest.fn().mockResolvedValue({
            ok: true,
            json: async () => hierarchy,
        });
        global.fetch = fetchMock as typeof fetch;

        const first = await fetchPathologyTimelineEvents(
            'https://slides.example.com',
            'P-1',
            'study',
            [makeClinicalSample('S-1', '-10', 'Biopsy')]
        );
        const second = await fetchPathologyTimelineEvents(
            'https://slides.example.com',
            'P-1',
            'study',
            [makeClinicalSample('S-1', '-11', 'Biopsy')]
        );

        expect(fetchMock).toHaveBeenCalledTimes(1);
        expect(second).not.toBe(first);
        expect(first[0].startNumberOfDaysSinceDiagnosis).toBe(-10);
        expect(second[0].startNumberOfDaysSinceDiagnosis).toBe(-11);
    });
});
