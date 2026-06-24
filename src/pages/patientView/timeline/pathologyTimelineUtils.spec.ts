import {
    buildPathologyTimelineEvents,
    buildPatientHierarchyUrl,
    hasServableDiagnosticSlides,
} from './pathologyTimelineUtils';
import { PatientHierarchy } from 'shared/components/wsiViewer/wsiViewerTypes';

describe('buildPathologyTimelineEvents', () => {
    it('creates H&E and IHC pathology timeline events from distinct servable tile-server image counts', () => {
        const hierarchy: PatientHierarchy = {
            patient_id: 'P-0000678',
            samples: [
                {
                    sample_id: 'P-0000678-T01-IM3',
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
                                    slides: [
                                        {
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
                                        },
                                        {
                                            image_id: '2',
                                            stain_name: 'H&E',
                                            stain_group: 'H&E (Other)',
                                            is_hne: true,
                                            is_ihc: false,
                                            magnification: '',
                                            file_size_bytes: '',
                                            can_serve_tiles: true,
                                            barcode: '',
                                            block_label: 'A1',
                                            block_number: '1',
                                        },
                                        {
                                            image_id: '2',
                                            stain_name: 'H&E',
                                            stain_group: 'H&E (Other)',
                                            is_hne: true,
                                            is_ihc: false,
                                            magnification: '',
                                            file_size_bytes: '',
                                            can_serve_tiles: true,
                                            barcode: '',
                                            block_label: 'A1',
                                            block_number: '1',
                                        },
                                        {
                                            image_id: '3',
                                            stain_name: 'PD-L1',
                                            stain_group: 'IHC',
                                            is_hne: false,
                                            is_ihc: true,
                                            magnification: '',
                                            file_size_bytes: '',
                                            can_serve_tiles: true,
                                            barcode: '',
                                            block_label: 'A1',
                                            block_number: '1',
                                        },
                                    ],
                                },
                            ],
                        },
                    ],
                },
            ],
        };

        const sample = {
            id: 'P-0000678-T01-IM3',
            uniquePatientKey: 'patient-key',
            uniqueSampleKey: 'sample-key',
            clinicalData: [
                { clinicalAttributeId: 'WSI_TIMEPOINT_DAYS', value: '-418' },
                {
                    clinicalAttributeId: 'WSI_TIMEPOINT_SOURCE',
                    value: 'Sample acquisition',
                },
            ],
        } as any;

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
        expect(events.map(event => event.startNumberOfDaysSinceDiagnosis)).toEqual(
            [-418, -418]
        );
        expect(
            events.map(
                event =>
                    event.attributes.find(attribute => attribute.key === 'SUBTYPE')
                        ?.value
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
    });

    it('ignores hierarchy samples that are not present in the clinical sample set', () => {
        const hierarchy: PatientHierarchy = {
            patient_id: 'P-0000678',
            samples: [
                {
                    sample_id: 'P-0000678-T01-IM3',
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
                                    slides: [
                                        {
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
                                        },
                                    ],
                                },
                            ],
                        },
                    ],
                },
                {
                    sample_id: 'P-0000678-T02-IM3',
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
                                    slides: [
                                        {
                                            image_id: '9',
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
                                        },
                                    ],
                                },
                            ],
                        },
                    ],
                },
            ],
        };

        const sample = {
            id: 'P-0000678-T01-IM3',
            uniquePatientKey: 'patient-key',
            uniqueSampleKey: 'sample-key',
            clinicalData: [
                { clinicalAttributeId: 'WSI_TIMEPOINT_DAYS', value: '-418' },
                {
                    clinicalAttributeId: 'WSI_TIMEPOINT_SOURCE',
                    value: 'Sample acquisition',
                },
            ],
        } as any;

        const events = buildPathologyTimelineEvents(
            hierarchy,
            [sample],
            'coad_msk_2025',
            'P-0000678'
        );

        expect(events).toHaveLength(1);
        expect(
            events[0].attributes.find(attribute => attribute.key === 'IMAGE_COUNT')
                ?.value
        ).toBe('1');
    });
});


describe('hasServableDiagnosticSlides', () => {
    it('returns true when a servable H&E or IHC slide is present', () => {
        const hierarchy: PatientHierarchy = {
            patient_id: 'P-1',
            samples: [
                {
                    sample_id: 'S-1',
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
                                    slides: [
                                        {
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
                                        },
                                    ],
                                },
                            ],
                        },
                    ],
                },
            ],
        };

        expect(hasServableDiagnosticSlides(hierarchy)).toBe(true);
    });

    it('returns false when only non-diagnostic servable slides are present', () => {
        const hierarchy: PatientHierarchy = {
            patient_id: 'P-2',
            samples: [
                {
                    sample_id: 'S-2',
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
                                    slides: [
                                        {
                                            image_id: '9',
                                            stain_name: 'SLIDES SUBMITTED',
                                            stain_group: 'SLIDES SUBMITTED',
                                            is_hne: false,
                                            is_ihc: false,
                                            magnification: '',
                                            file_size_bytes: '',
                                            can_serve_tiles: true,
                                            barcode: '',
                                            block_label: 'A1',
                                            block_number: '1',
                                        },
                                    ],
                                },
                            ],
                        },
                    ],
                },
            ],
        };

        expect(hasServableDiagnosticSlides(hierarchy)).toBe(false);
    });

    it('ignores servable slides from samples outside the allowed set', () => {
        const hierarchy: PatientHierarchy = {
            patient_id: 'P-3',
            samples: [
                {
                    sample_id: 'S-3',
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
                                    slides: [
                                        {
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
                                        },
                                    ],
                                },
                            ],
                        },
                    ],
                },
            ],
        };

        expect(hasServableDiagnosticSlides(hierarchy, new Set(['S-4']))).toBe(
            false
        );
    });
});

describe('buildPatientHierarchyUrl', () => {
    it('includes the studyId query parameter', () => {
        expect(
            buildPatientHierarchyUrl(
                '/api',
                'P-0074875',
                'coad_msk_2025'
            )
        ).toBe('/api/patient/P-0074875?studyId=coad_msk_2025');
    });
});
