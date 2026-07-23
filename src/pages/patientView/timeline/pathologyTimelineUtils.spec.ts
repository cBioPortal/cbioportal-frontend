import {
    buildPathologyAssociationGroups,
    buildTimelineEventsSignature,
    buildPathologyTimelineEvents,
    buildPatientHierarchyUrl,
    hasServableDiagnosticSlides,
} from './pathologyTimelineUtils';
import { clearPatientHierarchyCache } from 'shared/components/wsiViewer/wsiHierarchyFetchCache';
import { PatientHierarchy } from 'shared/components/wsiViewer/wsiViewerTypes';
import { ClinicalEvent } from 'cbioportal-ts-api-client';
import * as wsiSlideUtils from 'shared/components/wsiViewer/wsiSlideUtils';

const mockReportWsiAssociationIntegrity = jest.fn();

jest.mock('shared/lib/tracking', () => ({
    reportWsiAssociationIntegrity: (...args: unknown[]) =>
        mockReportWsiAssociationIntegrity(...args),
}));

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
        slide_timepoint_days: -418,
        slide_timepoint_source: 'Sample acquisition',
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
    const slideAssociations = samples.flatMap(sample =>
        sample.parts.flatMap(part =>
            part.blocks.flatMap(block =>
                block.slides.map(slide => ({
                    image_id: slide.image_id,
                    sample_id: sample.sample_id,
                    match_level: 'BLOCK' as const,
                    specimen_key: `block::${part.part_number}::${block.block_number}`,
                    slide_type: slide.is_ihc
                        ? ('IHC' as const)
                        : ('H&E' as const),
                    procedure_date_days: slide.slide_timepoint_days,
                    timepoint_source: slide.slide_timepoint_source,
                    stain_name: slide.stain_name,
                    part_description: part.part_description,
                    part_number: part.part_number,
                    block_label: block.block_label,
                    block_number: block.block_number,
                    can_serve_tiles: slide.can_serve_tiles,
                }))
            )
        )
    );
    return {
        patient_id: patientId,
        samples,
        slide_associations: slideAssociations,
    };
}

function makeClinicalSample(
    sampleId: string,
    timepointDays = '-418',
    timepointSource = 'Sample acquisition',
    overrides: Record<string, string> = {}
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
            ...Object.entries(overrides).map(
                ([clinicalAttributeId, value]) => ({
                    clinicalAttributeId,
                    value,
                })
            ),
        ],
    } as any;
}

beforeEach(() => {
    clearPatientHierarchyCache();
    mockReportWsiAssociationIntegrity.mockReset();
});

describe('buildPathologyTimelineEvents', () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('uses the source IHC classification for a viewable immuno recut', () => {
        const hierarchy = makeHierarchy('P-1', [
            makeHierarchySample('S-1', [
                makeSlide({
                    image_id: 'other-1',
                    stain_name: 'IMMUNO RECUT',
                    stain_group: 'IHC',
                    is_hne: false,
                    is_ihc: true,
                }),
            ]),
        ]);

        const events = buildPathologyTimelineEvents(
            hierarchy,
            [makeClinicalSample('S-1', '-5')],
            'study',
            'P-1'
        );

        expect(events).toHaveLength(1);
        expect(
            events[0].attributes.find(attribute => attribute.key === 'SUBTYPE')
                ?.value
        ).toBe('IHC');
        expect(
            events[0].attributes.find(
                attribute => attribute.key === 'IMAGE_COUNT'
            )?.value
        ).toBe('1');
    });

    it('keeps same-day legacy pathology slide events separated by sample', () => {
        const hierarchy = makeHierarchy('P-1', [
            makeHierarchySample('S-1', [makeSlide({ image_id: '1' })]),
            makeHierarchySample('S-2', [makeSlide({ image_id: '2' })]),
        ]);

        const events = buildPathologyTimelineEvents(
            hierarchy,
            [makeClinicalSample('S-1', '-5'), makeClinicalSample('S-2', '-5')],
            'study',
            'P-1'
        );

        expect(events).toHaveLength(2);
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
                        attribute => attribute.key === 'SAMPLE_ID'
                    )?.value
            )
        ).toEqual(['S-1', 'S-2']);
    });

    it('creates H&E and IHC pathology timeline events from servable pathology slides', () => {
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
            'PATHOLOGY SLIDES',
            'PATHOLOGY SLIDES',
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
        ).toEqual(['2', '1']);
        expect(
            events.map(
                event =>
                    event.attributes.find(
                        attribute => attribute.key === 'LINKOUT'
                    )?.value
            )
        ).toEqual([
            expect.stringContaining(
                '/patient/wsiHESlides?studyId=coad_msk_2025&caseId=P-0000678&sampleId=P-0000678-T01-IM3&stainFilter=hne'
            ),
            expect.stringContaining(
                '/patient/wsiHESlides?studyId=coad_msk_2025&caseId=P-0000678&sampleId=P-0000678-T01-IM3&stainFilter=ihc'
            ),
        ]);
    });

    it('renders pathology events when sample WSI attrs are absent', () => {
        const hierarchy = makeHierarchy('P-1', [
            makeHierarchySample('S-1', [
                makeSlide({
                    image_id: 'slide-1',
                    slide_timepoint_days: -12,
                    slide_timepoint_source: 'Procedure date',
                }),
            ]),
        ]);

        const events = buildPathologyTimelineEvents(
            hierarchy,
            [
                {
                    id: 'S-1',
                    uniquePatientKey: 'patient-key',
                    uniqueSampleKey: 'sample-key',
                    clinicalData: [],
                } as any,
            ],
            'study',
            'P-1'
        );

        expect(events).toHaveLength(1);
        expect(events[0].startNumberOfDaysSinceDiagnosis).toBe(-12);
        expect(
            events[0].attributes.find(
                attribute => attribute.key === 'TIMEPOINT_SOURCE'
            )?.value
        ).toBe('Procedure date');
    });

    it('includes hierarchy samples that are not present in the clinical sample set', () => {
        const hierarchy = makeHierarchy('P-0000678', [
            makeHierarchySample('P-0000678-T01-IM3', [makeSlide()]),
            makeHierarchySample('P-0000678-T02-IM3', [
                makeSlide({
                    image_id: '9',
                    slide_timepoint_days: -200,
                    slide_timepoint_source: 'Procedure date',
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
        expect(
            events.map(
                event =>
                    event.attributes.find(
                        attribute => attribute.key === 'SAMPLE_ID'
                    )?.value
            )
        ).toEqual(['P-0000678-T01-IM3', 'P-0000678-T02-IM3']);
        expect(
            events[1].attributes.find(
                attribute => attribute.key === 'IMAGE_COUNT'
            )?.value
        ).toBe('1');
    });

    it('counts servable slides when multiple H&E scans exist in the same block', () => {
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
        ).toBe('3');
    });

    it('uses the read-only servable association lookup when building association-backed pathology groups', () => {
        const getAssociationsByImageIdReadOnlySpy = jest.spyOn(
            wsiSlideUtils,
            'getServableSlideAssociationsByImageIdReadOnly'
        );
        const getAssociationsByImageIdSpy = jest.spyOn(
            wsiSlideUtils,
            'getServableSlideAssociationsByImageId'
        );
        const hierarchy: PatientHierarchy = {
            patient_id: 'P-1',
            samples: [makeHierarchySample('S-1', [])],
            slide_associations: [
                {
                    image_id: 'matched-1',
                    sample_id: 'S-1',
                    match_level: 'PART',
                    specimen_key: 'matched::1::1',
                    part_number: '1',
                    part_description: 'Matched specimen',
                    block_number: '1',
                    block_label: 'A1',
                    slide_type: 'H&E',
                    stain_name: 'H&E, Initial',
                    procedure_date_days: -20,
                    timepoint_source: 'Procedure date',
                    can_serve_tiles: true,
                },
            ],
        };

        buildPathologyAssociationGroups(hierarchy, [makeClinicalSample('S-1')]);

        expect(getAssociationsByImageIdReadOnlySpy).toHaveBeenCalledTimes(1);
        expect(getAssociationsByImageIdSpy).not.toHaveBeenCalled();
    });

    it('excludes associated viewable slides that are missing from the hierarchy tree', () => {
        const hierarchy: PatientHierarchy = {
            patient_id: 'P-1',
            samples: [
                makeHierarchySample('S-1', [
                    makeSlide({ image_id: 'present-1' }),
                ]),
            ],
            slide_associations: [
                {
                    image_id: 'present-1',
                    sample_id: 'S-1',
                    match_level: 'BLOCK',
                    specimen_key: 'specimen::1',
                    slide_type: 'H&E',
                    stain_name: 'H&E, Initial',
                    procedure_date_days: -20,
                    timepoint_source: 'Procedure date',
                    can_serve_tiles: true,
                },
                {
                    image_id: 'missing-1',
                    sample_id: 'S-1',
                    match_level: 'BLOCK',
                    specimen_key: 'specimen::1',
                    slide_type: 'H&E',
                    stain_name: 'H&E, Initial',
                    procedure_date_days: -20,
                    timepoint_source: 'Procedure date',
                    can_serve_tiles: true,
                },
            ],
        };

        const events = buildPathologyTimelineEvents(
            hierarchy,
            [makeClinicalSample('S-1', '-20', 'Procedure date')],
            'study',
            'P-1'
        );

        expect(events).toHaveLength(1);
        expect(
            events[0].attributes.find(
                attribute => attribute.key === 'IMAGE_COUNT'
            )?.value
        ).toBe('1');
        expect(
            events[0].attributes.find(attribute => attribute.key === 'LINKOUT')
                ?.value
        ).toContain('sampleId=S-1');
        expect(mockReportWsiAssociationIntegrity).toHaveBeenCalledWith(
            expect.objectContaining({
                hierarchyServableDistinctImages: 2,
                timelineServableDistinctImages: 1,
            })
        );
    });

    it('splits servable slide events by slide-level timepoint within one sample', () => {
        const hierarchy = makeHierarchy('P-1', [
            makeHierarchySample('S-1', [
                makeSlide({
                    image_id: 'slide-1',
                    slide_timepoint_days: -20,
                    slide_timepoint_source: 'Procedure date',
                }),
                makeSlide({
                    image_id: 'slide-2',
                    slide_timepoint_days: -5,
                    slide_timepoint_source: 'Procedure date',
                }),
                makeSlide({
                    image_id: 'slide-3',
                    stain_name: 'PD-L1',
                    stain_group: 'IHC',
                    is_hne: false,
                    is_ihc: true,
                    slide_timepoint_days: -5,
                    slide_timepoint_source: 'Procedure date',
                }),
            ]),
        ]);
        const sample = makeClinicalSample('S-1', '-10', 'Biopsy');

        const events = buildPathologyTimelineEvents(
            hierarchy,
            [sample],
            'study',
            'P-1'
        );

        expect(events).toHaveLength(3);
        expect(
            events.map(event => event.startNumberOfDaysSinceDiagnosis)
        ).toEqual([-20, -5, -5]);
        expect(
            events.map(
                event =>
                    event.attributes.find(
                        attribute => attribute.key === 'SUBTYPE'
                    )?.value
            )
        ).toEqual(['H&E', 'H&E', 'IHC']);
        expect(
            events.map(
                event =>
                    event.attributes.find(
                        attribute => attribute.key === 'IMAGE_COUNT'
                    )?.value
            )
        ).toEqual(['1', '1', '1']);
    });

    it('keeps unmatched viewable slides separate from matched slides at the same date and stain', () => {
        const hierarchy: PatientHierarchy = {
            patient_id: 'P-1',
            samples: [
                makeHierarchySample('S-1', [
                    makeSlide({
                        image_id: 'matched-1',
                        block_label: 'A1',
                        block_number: '1',
                    }),
                ]),
                makeHierarchySample('S-2', [
                    makeSlide({
                        image_id: 'unmatched-1',
                        block_label: 'B1',
                        block_number: '1',
                    }),
                ]),
            ],
            slide_associations: [
                {
                    image_id: 'matched-1',
                    sample_id: 'S-1',
                    match_level: 'PART',
                    specimen_key: 'matched::1::1',
                    part_number: '1',
                    part_description: 'Matched specimen',
                    block_number: '1',
                    block_label: 'A1',
                    slide_type: 'H&E',
                    stain_name: 'H&E, Initial',
                    procedure_date_days: -20,
                    timepoint_source: 'Procedure date',
                    can_serve_tiles: true,
                },
                {
                    image_id: 'unmatched-1',
                    sample_id: null,
                    match_level: 'UNMATCHED',
                    specimen_key: 'unmatched::2::1',
                    part_number: '2',
                    part_description: 'Unmatched specimen',
                    block_number: '1',
                    block_label: 'B1',
                    slide_type: 'H&E',
                    stain_name: 'H&E, Initial',
                    procedure_date_days: -20,
                    timepoint_source: 'Procedure date',
                    can_serve_tiles: true,
                },
            ],
        };

        const events = buildPathologyTimelineEvents(
            hierarchy,
            [makeClinicalSample('S-1')],
            'coad_msk_2025',
            'P-1'
        );

        expect(events).toHaveLength(2);
        expect(
            events.map(
                event =>
                    event.attributes.find(
                        attribute => attribute.key === 'SAMPLE_ID'
                    )?.value
            )
        ).toEqual(['S-1', 'Unmatched']);
        expect(events[0].uniqueSampleKey).not.toBe(events[1].uniqueSampleKey);
        expect(
            events.map(
                event =>
                    event.attributes.find(
                        attribute => attribute.key === 'LINKOUT'
                    )?.value
            )
        ).toEqual([
            '/patient/wsiHESlides?studyId=coad_msk_2025&caseId=P-1&sampleId=S-1&stainFilter=hne&matchLevel=PART&specimenKey=matched%3A%3A1%3A%3A1',
            '/patient/wsiHESlides?studyId=coad_msk_2025&caseId=P-1&stainFilter=hne&matchLevel=Unmatched&specimenKey=unmatched%3A%3A2%3A%3A1',
        ]);
    });

    it('keeps same-day pathology events distinct when specimen or match level differs', () => {
        const hierarchy: PatientHierarchy = {
            patient_id: 'P-1',
            samples: [
                makeHierarchySample('S-1', [
                    makeSlide({
                        image_id: 'block-1',
                        block_label: 'A1',
                        block_number: '1',
                    }),
                    makeSlide({
                        image_id: 'part-1',
                        block_label: 'A2',
                        block_number: '2',
                    }),
                ]),
            ],
            slide_associations: [
                {
                    image_id: 'block-1',
                    sample_id: 'S-1',
                    match_level: 'BLOCK',
                    specimen_key: 'specimen::1::1',
                    part_number: '1',
                    part_description: 'Specimen one',
                    block_number: '1',
                    block_label: 'A1',
                    slide_type: 'H&E',
                    stain_name: 'H&E, Initial',
                    procedure_date_days: -30,
                    timepoint_source: 'Procedure date',
                    can_serve_tiles: true,
                },
                {
                    image_id: 'part-1',
                    sample_id: 'S-1',
                    match_level: 'PART',
                    specimen_key: 'specimen::1::2',
                    part_number: '1',
                    part_description: 'Specimen one',
                    block_number: '2',
                    block_label: 'A2',
                    slide_type: 'H&E',
                    stain_name: 'H&E, Initial',
                    procedure_date_days: -30,
                    timepoint_source: 'Procedure date',
                    can_serve_tiles: true,
                },
            ],
        };

        const events = buildPathologyTimelineEvents(
            hierarchy,
            [makeClinicalSample('S-1')],
            'study',
            'P-1'
        );

        expect(events).toHaveLength(2);
        expect(events[0].uniqueSampleKey).not.toBe(events[1].uniqueSampleKey);
        expect(new Set(events.map(event => event.uniqueSampleKey)).size).toBe(
            2
        );
    });

    it('collapses non-viewable unmatched slides that share the same displayed specimen', () => {
        const hierarchy: PatientHierarchy = {
            patient_id: 'P-1',
            samples: [
                makeHierarchySample('S-1', [
                    makeSlide({
                        image_id: 'unmatched-a',
                        block_label: '1U',
                        block_number: '1',
                        can_serve_tiles: false,
                    }),
                    makeSlide({
                        image_id: 'unmatched-b',
                        block_label: '2U',
                        block_number: '2',
                        can_serve_tiles: false,
                    }),
                ]),
            ],
            slide_associations: [
                {
                    image_id: 'unmatched-a',
                    sample_id: null,
                    match_level: 'UNMATCHED',
                    specimen_key: 'unmatched::1::1',
                    part_number: '1',
                    part_description: 'Part one',
                    block_number: '1',
                    block_label: '1U',
                    slide_type: 'H&E',
                    stain_name: 'H&E, Initial',
                    procedure_date_days: 10,
                    timepoint_source: 'Procedure date',
                    can_serve_tiles: false,
                },
                {
                    image_id: 'unmatched-b',
                    sample_id: null,
                    match_level: 'UNMATCHED',
                    specimen_key: 'unmatched::1::2',
                    part_number: '1',
                    part_description: 'Part one',
                    block_number: '2',
                    block_label: '2U',
                    slide_type: 'H&E',
                    stain_name: 'H&E, Initial',
                    procedure_date_days: 10,
                    timepoint_source: 'Procedure date',
                    can_serve_tiles: false,
                },
            ],
        };

        const events = buildPathologyTimelineEvents(
            hierarchy,
            [],
            'study',
            'P-1'
        );

        expect(events).toHaveLength(1);
        expect(
            events[0].attributes.find(attribute => attribute.key === 'SPECIMEN')
                ?.value
        ).toBe('Part 1');
        expect(
            events[0].attributes.find(
                attribute => attribute.key === 'NON_SERVABLE_IMAGE_COUNT'
            )?.value
        ).toBe('2');
        expect(
            events[0].attributes.find(attribute => attribute.key === 'LINKOUT')
        ).toBeUndefined();
    });

    it('deduplicates duplicate slide associations within the same pathology group', () => {
        const hierarchy: PatientHierarchy = {
            patient_id: 'P-1',
            samples: [
                makeHierarchySample('S-1', [
                    makeSlide({
                        image_id: 'slide-1',
                        block_label: '5T',
                        block_number: '5',
                    }),
                ]),
            ],
            slide_associations: [
                {
                    image_id: 'slide-1',
                    sample_id: 'S-1',
                    match_level: 'BLOCK',
                    specimen_key: 'block::1::5',
                    part_number: '1',
                    part_description: 'Matched specimen',
                    block_number: '5',
                    block_label: '5T',
                    slide_type: 'H&E',
                    stain_name: 'H&E, Initial',
                    procedure_date_days: -20,
                    timepoint_source: 'Procedure date',
                    can_serve_tiles: true,
                },
                {
                    image_id: 'slide-1',
                    sample_id: 'S-1',
                    match_level: 'BLOCK',
                    specimen_key: 'block::1::5',
                    part_number: '1',
                    part_description: 'Matched specimen',
                    block_number: '5',
                    block_label: '5T',
                    slide_type: 'H&E',
                    stain_name: 'H&E, Initial',
                    procedure_date_days: -20,
                    timepoint_source: 'Procedure date',
                    can_serve_tiles: true,
                },
            ],
        };

        const events = buildPathologyTimelineEvents(
            hierarchy,
            [makeClinicalSample('S-1')],
            'study',
            'P-1'
        );

        expect(events).toHaveLength(1);
        expect(
            events[0].attributes.find(
                attribute => attribute.key === 'IMAGE_COUNT'
            )?.value
        ).toBe('1');
        expect(events[0].attributes).toEqual(
            expect.not.arrayContaining([
                expect.objectContaining({ key: 'SLIDE_DETAILS' }),
            ])
        );
    });

    it('materializes only the canonical servable association when one image appears in multiple pathology buckets', () => {
        const hierarchy: PatientHierarchy = {
            patient_id: 'P-1',
            samples: [
                makeHierarchySample('S-1', [
                    makeSlide({
                        image_id: 'slide-1',
                        block_label: '5T',
                        block_number: '5',
                    }),
                ]),
            ],
            slide_associations: [
                {
                    image_id: 'slide-1',
                    sample_id: 'S-1',
                    match_level: 'PART',
                    specimen_key: 'part::1',
                    part_number: '1',
                    part_description: 'Matched specimen',
                    slide_type: 'H&E',
                    stain_name: 'H&E, Initial',
                    procedure_date_days: -20,
                    timepoint_source: 'Procedure date',
                    can_serve_tiles: true,
                },
                {
                    image_id: 'slide-1',
                    sample_id: 'S-1',
                    match_level: 'BLOCK',
                    specimen_key: 'block::1::5',
                    part_number: '1',
                    part_description: 'Matched specimen',
                    block_number: '5',
                    block_label: '5T',
                    slide_type: 'H&E',
                    stain_name: 'H&E, Initial',
                    procedure_date_days: -20,
                    timepoint_source: 'Procedure date',
                    can_serve_tiles: true,
                },
            ],
        };

        const events = buildPathologyTimelineEvents(
            hierarchy,
            [makeClinicalSample('S-1')],
            'study',
            'P-1'
        );

        expect(events).toHaveLength(1);
        expect(
            events[0].attributes.find(
                attribute => attribute.key === 'IMAGE_COUNT'
            )?.value
        ).toBe('1');
        expect(
            events[0].attributes.find(
                attribute => attribute.key === 'MATCH_LEVEL'
            )?.value
        ).toBe('BLOCK');
        expect(
            events[0].attributes.find(attribute => attribute.key === 'SPECIMEN')
                ?.value
        ).toBe('Part 1 / Block 5T');
    });

    it('emits a separate non-viewable pathology event when non-viewable slides are present in the hierarchy', () => {
        const hierarchy = makeHierarchy('P-1', [
            makeHierarchySample('S-1', [
                makeSlide(),
                makeSlide({
                    image_id: 'ns-1',
                    can_serve_tiles: false,
                }),
            ]),
        ]);
        const sample = makeClinicalSample('S-1', '-5', 'Biopsy');

        const events = buildPathologyTimelineEvents(
            hierarchy,
            [sample],
            'study',
            'P-1'
        );

        expect(events).toHaveLength(2);
        expect(
            events.map(
                event =>
                    event.attributes.find(
                        attribute => attribute.key === 'SUBTYPE'
                    )?.value
            )
        ).toEqual(['H&E', 'H&E']);
        expect(
            events[0].attributes.find(
                attribute => attribute.key === 'IMAGE_COUNT'
            )?.value
        ).toBe('1');
        expect(
            events[0].attributes.find(
                attribute => attribute.key === 'NON_SERVABLE_IMAGE_COUNT'
            )?.value
        ).toBe('0');
        expect(
            events[1].attributes.find(
                attribute => attribute.key === 'IMAGE_COUNT'
            )?.value
        ).toBe('0');
        expect(
            events[1].attributes.find(
                attribute => attribute.key === 'NON_SERVABLE_IMAGE_COUNT'
            )?.value
        ).toBe('1');
        expect(
            events[1].attributes.find(attribute => attribute.key === 'LINKOUT')
        ).toBeUndefined();
    });

    it('emits pathology events when only non-viewable slides are present in the hierarchy', () => {
        const hierarchy = makeHierarchy('P-1', [
            makeHierarchySample('S-1', [
                makeSlide({
                    image_id: 'ihc-ns-1',
                    stain_name: 'PD-L1',
                    stain_group: 'IHC',
                    is_hne: false,
                    is_ihc: true,
                    can_serve_tiles: false,
                }),
            ]),
        ]);
        const sample = makeClinicalSample('S-1', '-5', 'Biopsy');

        const events = buildPathologyTimelineEvents(
            hierarchy,
            [sample],
            'study',
            'P-1'
        );

        expect(events).toHaveLength(1);
        expect(
            events[0].attributes.find(attribute => attribute.key === 'SUBTYPE')
                ?.value
        ).toBe('IHC');
        expect(
            events[0].attributes.find(
                attribute => attribute.key === 'IMAGE_COUNT'
            )?.value
        ).toBe('0');
        expect(
            events[0].attributes.find(
                attribute => attribute.key === 'NON_SERVABLE_IMAGE_COUNT'
            )?.value
        ).toBe('1');
        expect(
            events[0].attributes.find(attribute => attribute.key === 'LINKOUT')
        ).toBeUndefined();
    });

    it('uses slide-level timepoints for non-servable slides present in the hierarchy', () => {
        const hierarchy = makeHierarchy('P-1', [
            makeHierarchySample('S-1', [
                makeSlide({
                    image_id: 'ns-1',
                    can_serve_tiles: false,
                    slide_timepoint_days: -22,
                    slide_timepoint_source: 'Procedure date',
                }),
            ]),
        ]);
        const sample = makeClinicalSample('S-1', '-5', 'Biopsy', {
            WSI_NON_SERVABLE_HNE_SLIDE_COUNT: '1',
        });

        const events = buildPathologyTimelineEvents(
            hierarchy,
            [sample],
            'study',
            'P-1'
        );

        expect(events).toHaveLength(1);
        expect(events[0].startNumberOfDaysSinceDiagnosis).toBe(-22);
        expect(
            events[0].attributes.find(attribute => attribute.key === 'SUBTYPE')
                ?.value
        ).toBe('H&E');
        expect(
            events[0].attributes.find(
                attribute => attribute.key === 'IMAGE_COUNT'
            )?.value
        ).toBe('0');
        expect(
            events[0].attributes.find(
                attribute => attribute.key === 'NON_SERVABLE_IMAGE_COUNT'
            )?.value
        ).toBe('1');
        expect(
            events[0].attributes.find(attribute => attribute.key === 'LINKOUT')
        ).toBeUndefined();
    });

    it('suppresses pathology events when no slide associations can be derived', () => {
        const hierarchy = makeHierarchy('P-1', [
            makeHierarchySample('S-1', []),
        ]);
        const sample = makeClinicalSample('S-1', '-5', 'Biopsy');

        const events = buildPathologyTimelineEvents(
            hierarchy,
            [sample],
            'study',
            'P-1'
        );

        expect(events).toHaveLength(0);
    });

    it('treats missing or non-numeric non-servable attrs as zero', () => {
        const hierarchy = makeHierarchy('P-1', [
            makeHierarchySample('S-1', [makeSlide()]),
            makeHierarchySample('S-2', [makeSlide({ image_id: '2' })]),
        ]);
        const samples = [
            makeClinicalSample('S-1', '-5', 'Biopsy'),
            makeClinicalSample('S-2', '-6', 'Biopsy', {
                WSI_NON_SERVABLE_HNE_SLIDE_COUNT: 'abc',
            }),
        ];

        const events = buildPathologyTimelineEvents(
            hierarchy,
            samples,
            'study',
            'P-1'
        );

        expect(events).toHaveLength(2);
        expect(
            events.map(
                event =>
                    event.attributes.find(
                        attribute =>
                            attribute.key === 'NON_SERVABLE_IMAGE_COUNT'
                    )?.value
            )
        ).toEqual(['0', '0']);
    });

    it('ignores legacy sample clinical WSI counts when evaluating association integrity', () => {
        const hierarchy: PatientHierarchy = {
            patient_id: 'P-1',
            slide_associations: [
                {
                    image_id: 'slide-1',
                    sample_id: 'S-1',
                    match_level: 'BLOCK',
                    specimen_key: 'specimen::1',
                    slide_type: 'H&E',
                    procedure_date_days: -5,
                    timepoint_source: 'Procedure date',
                    can_serve_tiles: true,
                },
            ],
            samples: [
                makeHierarchySample('S-1', [
                    makeSlide({ image_id: 'slide-1' }),
                ]),
            ],
        };
        const sample = makeClinicalSample('S-1', '-5', 'Procedure date', {
            WSI_SAMPLE_SLIDE_COUNT: '2',
            WSI_SAMPLE_BLOCK_MATCHED_SLIDE_COUNT: '0',
            WSI_SAMPLE_PART_MATCHED_SLIDE_COUNT: '1',
        });

        buildPathologyTimelineEvents(hierarchy, [sample], 'study', 'P-1');

        expect(mockReportWsiAssociationIntegrity).not.toHaveBeenCalled();
    });

    it('does not report when only legacy declared sample counts differ across reused snapshots', () => {
        const hierarchy: PatientHierarchy = {
            patient_id: 'P-1',
            slide_associations: [
                {
                    image_id: 'slide-1',
                    sample_id: 'S-1',
                    match_level: 'BLOCK',
                    specimen_key: 'specimen::1',
                    slide_type: 'H&E',
                    procedure_date_days: -5,
                    timepoint_source: 'Procedure date',
                    can_serve_tiles: true,
                },
            ],
            samples: [
                makeHierarchySample('S-1', [
                    makeSlide({ image_id: 'slide-1' }),
                ]),
            ],
        };
        const sample = makeClinicalSample('S-1', '-5', 'Procedure date', {
            WSI_SAMPLE_SLIDE_COUNT: '2',
            WSI_SAMPLE_BLOCK_MATCHED_SLIDE_COUNT: '0',
            WSI_SAMPLE_PART_MATCHED_SLIDE_COUNT: '1',
        });

        buildPathologyTimelineEvents(hierarchy, [sample], 'study', 'P-1');
        buildPathologyTimelineEvents(hierarchy, [sample], 'study', 'P-1');

        expect(mockReportWsiAssociationIntegrity).not.toHaveBeenCalled();
    });

    it('does not re-evaluate association integrity when only declared sample counts change', () => {
        const hierarchy: PatientHierarchy = {
            patient_id: 'P-1',
            slide_associations: [
                {
                    image_id: 'slide-1',
                    sample_id: 'S-1',
                    match_level: 'BLOCK',
                    specimen_key: 'specimen::1',
                    slide_type: 'H&E',
                    procedure_date_days: -5,
                    timepoint_source: 'Procedure date',
                    can_serve_tiles: true,
                },
            ],
            samples: [
                makeHierarchySample('S-1', [
                    makeSlide({ image_id: 'slide-1' }),
                ]),
            ],
        };
        const firstSample = makeClinicalSample('S-1', '-5', 'Procedure date', {
            WSI_SAMPLE_SLIDE_COUNT: '2',
            WSI_SAMPLE_BLOCK_MATCHED_SLIDE_COUNT: '0',
            WSI_SAMPLE_PART_MATCHED_SLIDE_COUNT: '1',
        });
        const secondSample = makeClinicalSample('S-1', '-5', 'Procedure date', {
            WSI_SAMPLE_SLIDE_COUNT: '3',
            WSI_SAMPLE_BLOCK_MATCHED_SLIDE_COUNT: '0',
            WSI_SAMPLE_PART_MATCHED_SLIDE_COUNT: '2',
        });

        buildPathologyTimelineEvents(hierarchy, [firstSample], 'study', 'P-1');
        buildPathologyTimelineEvents(hierarchy, [secondSample], 'study', 'P-1');

        expect(mockReportWsiAssociationIntegrity).not.toHaveBeenCalled();
    });

    it('does not report association integrity when counts are consistent', () => {
        const hierarchy: PatientHierarchy = {
            patient_id: 'P-1',
            slide_associations: [
                {
                    image_id: 'slide-1',
                    sample_id: 'S-1',
                    match_level: 'BLOCK',
                    specimen_key: 'specimen::1',
                    slide_type: 'H&E',
                    procedure_date_days: -5,
                    timepoint_source: 'Procedure date',
                    can_serve_tiles: true,
                },
            ],
            samples: [
                makeHierarchySample('S-1', [
                    makeSlide({ image_id: 'slide-1' }),
                ]),
            ],
        };
        const sample = makeClinicalSample('S-1', '-5', 'Procedure date', {
            WSI_SAMPLE_SLIDE_COUNT: '1',
            WSI_SAMPLE_BLOCK_MATCHED_SLIDE_COUNT: '1',
            WSI_SAMPLE_PART_MATCHED_SLIDE_COUNT: '0',
        });

        buildPathologyTimelineEvents(hierarchy, [sample], 'study', 'P-1');

        expect(mockReportWsiAssociationIntegrity).not.toHaveBeenCalled();
    });

    it('reports association integrity when one servable image appears in multiple association buckets', () => {
        const hierarchy: PatientHierarchy = {
            patient_id: 'P-1',
            slide_associations: [
                {
                    image_id: 'slide-1',
                    sample_id: 'S-1',
                    match_level: 'BLOCK',
                    specimen_key: 'specimen::1',
                    slide_type: 'H&E',
                    procedure_date_days: -5,
                    timepoint_source: 'Procedure date',
                    can_serve_tiles: true,
                },
                {
                    image_id: 'slide-1',
                    sample_id: 'S-1',
                    match_level: 'PART',
                    specimen_key: 'specimen::2',
                    slide_type: 'H&E',
                    procedure_date_days: -5,
                    timepoint_source: 'Procedure date',
                    can_serve_tiles: true,
                },
            ],
            samples: [
                makeHierarchySample('S-1', [
                    makeSlide({ image_id: 'slide-1' }),
                ]),
            ],
        };
        const sample = makeClinicalSample('S-1', '-5', 'Procedure date', {
            WSI_SAMPLE_SLIDE_COUNT: '1',
            WSI_SAMPLE_BLOCK_MATCHED_SLIDE_COUNT: '1',
            WSI_SAMPLE_PART_MATCHED_SLIDE_COUNT: '0',
        });

        buildPathologyTimelineEvents(hierarchy, [sample], 'study', 'P-1');

        expect(mockReportWsiAssociationIntegrity).toHaveBeenCalledWith(
            expect.objectContaining({
                hierarchyServableDistinctImages: 1,
                duplicateServableAssociationRows: 0,
                multiBucketServableImages: 1,
            })
        );
    });

    it('reports duplicate servable association rows only for repeated canonical associations', () => {
        const hierarchy: PatientHierarchy = {
            patient_id: 'P-1',
            slide_associations: [
                {
                    image_id: 'slide-1',
                    sample_id: 'S-1',
                    match_level: 'BLOCK',
                    specimen_key: 'specimen::1',
                    slide_type: 'H&E',
                    procedure_date_days: -5,
                    timepoint_source: 'Procedure date',
                    can_serve_tiles: true,
                },
                {
                    image_id: 'slide-1',
                    sample_id: 'S-1',
                    match_level: 'BLOCK',
                    specimen_key: 'specimen::1',
                    slide_type: 'H&E',
                    procedure_date_days: -5,
                    timepoint_source: 'Procedure date',
                    can_serve_tiles: true,
                },
            ],
            samples: [
                makeHierarchySample('S-1', [
                    makeSlide({ image_id: 'slide-1' }),
                ]),
            ],
        };
        const sample = makeClinicalSample('S-1', '-5', 'Procedure date', {
            WSI_SAMPLE_SLIDE_COUNT: '1',
            WSI_SAMPLE_BLOCK_MATCHED_SLIDE_COUNT: '1',
            WSI_SAMPLE_PART_MATCHED_SLIDE_COUNT: '0',
        });

        buildPathologyTimelineEvents(hierarchy, [sample], 'study', 'P-1');

        expect(mockReportWsiAssociationIntegrity).toHaveBeenCalledWith(
            expect.objectContaining({
                hierarchyServableDistinctImages: 1,
                duplicateServableAssociationRows: 1,
                multiBucketServableImages: 0,
            })
        );
    });

    it('reuses grouped pathology associations for association-backed hierarchies when sample timing changes', () => {
        const hierarchy: PatientHierarchy = {
            patient_id: 'P-1',
            slide_associations: [
                {
                    image_id: 'slide-1',
                    sample_id: 'S-1',
                    match_level: 'BLOCK',
                    specimen_key: 'specimen::1',
                    slide_type: 'H&E',
                    procedure_date_days: -5,
                    timepoint_source: 'Procedure date',
                    can_serve_tiles: true,
                },
            ],
            samples: [
                makeHierarchySample('S-1', [
                    makeSlide({ image_id: 'slide-1' }),
                ]),
            ],
        };

        const first = buildPathologyAssociationGroups(hierarchy, [
            makeClinicalSample('S-1', '-10', 'Biopsy'),
        ]);
        const second = buildPathologyAssociationGroups(hierarchy, [
            makeClinicalSample('S-1', '-11', 'Biopsy'),
        ]);

        expect(second).toBe(first);
        expect(second[0]).toBe(first[0]);
        expect(first[0].date).toBe(-5);
        expect(second[0].date).toBe(-5);
    });

    it('freezes grouped pathology associations so callers cannot mutate the cached groups', () => {
        const hierarchy: PatientHierarchy = {
            patient_id: 'P-1',
            slide_associations: [
                {
                    image_id: 'slide-1',
                    sample_id: 'S-1',
                    match_level: 'BLOCK',
                    specimen_key: 'specimen::1',
                    slide_type: 'H&E',
                    procedure_date_days: -5,
                    timepoint_source: 'Procedure date',
                    can_serve_tiles: true,
                },
            ],
            samples: [
                makeHierarchySample('S-1', [
                    makeSlide({ image_id: 'slide-1' }),
                ]),
            ],
        };

        const groups = buildPathologyAssociationGroups(hierarchy, [
            makeClinicalSample('S-1', '-10', 'Biopsy'),
        ]);

        expect(Object.isFrozen(groups)).toBe(true);
        expect(Object.isFrozen(groups[0])).toBe(true);
        expect(Object.isFrozen(groups[0].imageIds)).toBe(true);
        expect(() => {
            groups.push(groups[0]);
        }).toThrow(TypeError);
        expect(() => {
            groups[0].imageIds.push('mutated');
        }).toThrow(TypeError);
    });

    it('rebuilds grouped pathology associations when an association-backed slide association mutates in place', () => {
        const hierarchy: PatientHierarchy = {
            patient_id: 'P-1',
            slide_associations: [
                {
                    image_id: 'slide-1',
                    sample_id: 'S-1',
                    match_level: 'BLOCK',
                    specimen_key: 'specimen::1',
                    slide_type: 'H&E',
                    procedure_date_days: -5,
                    timepoint_source: 'Procedure date',
                    can_serve_tiles: true,
                },
            ],
            samples: [
                makeHierarchySample('S-1', [
                    makeSlide({ image_id: 'slide-1' }),
                ]),
            ],
        };

        const first = buildPathologyAssociationGroups(hierarchy, [
            makeClinicalSample('S-1', '-10', 'Biopsy'),
        ]);
        hierarchy.slide_associations![0].procedure_date_days = -9;
        const second = buildPathologyAssociationGroups(hierarchy, [
            makeClinicalSample('S-1', '-10', 'Biopsy'),
        ]);

        expect(second).not.toBe(first);
        expect(second[0]).not.toBe(first[0]);
        expect(second[0].date).toBe(-9);
    });

    it('reuses grouped pathology associations for legacy hierarchies when sample timing attrs change', () => {
        const hierarchy = makeHierarchy('P-1', [
            makeHierarchySample('S-1', [makeSlide()]),
        ]);

        const first = buildPathologyAssociationGroups(hierarchy, [
            makeClinicalSample('S-1', '-10', 'Biopsy'),
        ]);
        const second = buildPathologyAssociationGroups(hierarchy, [
            makeClinicalSample('S-1', '-11', 'Biopsy'),
        ]);

        expect(second).toBe(first);
        expect(second[0]).toBe(first[0]);
        expect(first[0].date).toBe(-418);
        expect(second[0].date).toBe(-418);
    });

    it('reuses materialized pathology timeline events for association-backed hierarchies when sample timing changes', () => {
        const hierarchy: PatientHierarchy = {
            patient_id: 'P-1',
            slide_associations: [
                {
                    image_id: 'slide-1',
                    sample_id: 'S-1',
                    match_level: 'BLOCK',
                    specimen_key: 'specimen::1',
                    slide_type: 'H&E',
                    procedure_date_days: -5,
                    timepoint_source: 'Procedure date',
                    can_serve_tiles: true,
                },
            ],
            samples: [
                makeHierarchySample('S-1', [
                    makeSlide({ image_id: 'slide-1' }),
                ]),
            ],
        };

        const first = buildPathologyTimelineEvents(
            hierarchy,
            [makeClinicalSample('S-1', '-10', 'Biopsy')],
            'study',
            'P-1'
        );
        const second = buildPathologyTimelineEvents(
            hierarchy,
            [makeClinicalSample('S-1', '-11', 'Biopsy')],
            'study',
            'P-1'
        );

        expect(second).toBe(first);
        expect(second[0]).toBe(first[0]);
        expect(first[0].startNumberOfDaysSinceDiagnosis).toBe(-5);
        expect(second[0].startNumberOfDaysSinceDiagnosis).toBe(-5);
    });

    it('freezes materialized pathology timeline events so callers cannot mutate the cached event list', () => {
        const hierarchy: PatientHierarchy = {
            patient_id: 'P-1',
            slide_associations: [
                {
                    image_id: 'slide-1',
                    sample_id: 'S-1',
                    match_level: 'BLOCK',
                    specimen_key: 'specimen::1',
                    slide_type: 'H&E',
                    procedure_date_days: -5,
                    timepoint_source: 'Procedure date',
                    can_serve_tiles: true,
                },
            ],
            samples: [
                makeHierarchySample('S-1', [
                    makeSlide({ image_id: 'slide-1' }),
                ]),
            ],
        };

        const events = buildPathologyTimelineEvents(
            hierarchy,
            [makeClinicalSample('S-1', '-10', 'Biopsy')],
            'study',
            'P-1'
        );

        expect(Object.isFrozen(events)).toBe(true);
        expect(Object.isFrozen(events[0])).toBe(true);
        expect(Object.isFrozen(events[0].attributes!)).toBe(true);
        expect(Object.isFrozen(events[0].attributes![0])).toBe(true);
        expect(() => {
            events.push({
                eventType: 'PATHOLOGY SLIDES',
                patientId: 'P-1',
                startNumberOfDaysSinceDiagnosis: 9,
                studyId: 'study',
            } as ClinicalEvent);
        }).toThrow(TypeError);
        expect(() => {
            events[0].attributes![0].value = 'mutated';
        }).toThrow(TypeError);
    });

    it('rebuilds materialized pathology timeline events when an association-backed slide association mutates in place', () => {
        const hierarchy: PatientHierarchy = {
            patient_id: 'P-1',
            slide_associations: [
                {
                    image_id: 'slide-1',
                    sample_id: 'S-1',
                    match_level: 'BLOCK',
                    specimen_key: 'specimen::1',
                    slide_type: 'H&E',
                    procedure_date_days: -5,
                    timepoint_source: 'Procedure date',
                    can_serve_tiles: true,
                },
            ],
            samples: [
                makeHierarchySample('S-1', [
                    makeSlide({ image_id: 'slide-1' }),
                ]),
            ],
        };

        const first = buildPathologyTimelineEvents(
            hierarchy,
            [makeClinicalSample('S-1', '-10', 'Biopsy')],
            'study',
            'P-1'
        );
        hierarchy.slide_associations![0].procedure_date_days = -9;
        const second = buildPathologyTimelineEvents(
            hierarchy,
            [makeClinicalSample('S-1', '-10', 'Biopsy')],
            'study',
            'P-1'
        );

        expect(second).not.toBe(first);
        expect(second[0]).not.toBe(first[0]);
        expect(second[0].startNumberOfDaysSinceDiagnosis).toBe(-9);
    });

    it('reuses materialized pathology timeline events for legacy hierarchies when sample timing attrs change', () => {
        const hierarchy = makeHierarchy('P-1', [
            makeHierarchySample('S-1', [makeSlide()]),
        ]);

        const first = buildPathologyTimelineEvents(
            hierarchy,
            [makeClinicalSample('S-1', '-10', 'Biopsy')],
            'study',
            'P-1'
        );
        const second = buildPathologyTimelineEvents(
            hierarchy,
            [makeClinicalSample('S-1', '-11', 'Biopsy')],
            'study',
            'P-1'
        );

        expect(second).toBe(first);
        expect(second[0]).toBe(first[0]);
        expect(first[0].startNumberOfDaysSinceDiagnosis).toBe(-418);
        expect(second[0].startNumberOfDaysSinceDiagnosis).toBe(-418);
    });
});

describe('hasServableDiagnosticSlides', () => {
    it('returns true when a servable H&E or IHC slide is present', () => {
        const hierarchy = makeHierarchy('P-1', [
            makeHierarchySample('S-1', [makeSlide()]),
        ]);

        expect(hasServableDiagnosticSlides(hierarchy)).toBe(true);
    });

    it('returns true when an unclassified viewable slide is present', () => {
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

        expect(hasServableDiagnosticSlides(hierarchy)).toBe(true);
    });

    it('ignores servable slides from samples outside the allowed set', () => {
        const hierarchy = makeHierarchy('P-3', [
            makeHierarchySample('S-3', [makeSlide()]),
        ]);

        expect(hasServableDiagnosticSlides(hierarchy, new Set(['S-4']))).toBe(
            false
        );
    });

    it('uses explicit slide associations and filters by the allowed samples', () => {
        const hierarchy = makeHierarchy('P-4', [
            makeHierarchySample('S-4', [makeSlide()]),
            makeHierarchySample('S-5', [makeSlide({ image_id: '2' })]),
        ]);

        expect(hasServableDiagnosticSlides(hierarchy, new Set(['S-4']))).toBe(
            true
        );
        expect(hasServableDiagnosticSlides(hierarchy, new Set(['S-5']))).toBe(
            true
        );
        expect(hasServableDiagnosticSlides(hierarchy, new Set(['S-6']))).toBe(
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
