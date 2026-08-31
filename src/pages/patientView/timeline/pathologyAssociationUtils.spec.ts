import {
    getPathologySlideAssociationsReadOnly,
    matchesPathologySlideType,
} from './pathologyAssociationUtils';
import {
    PatientHierarchy,
    Slide,
} from 'shared/components/wsiViewer/wsiViewerTypes';

function makeHierarchy(): PatientHierarchy {
    return {
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
                stain_name: 'H&E',
                part_description: 'Colon',
                part_number: '1',
                block_label: 'A1',
                block_number: '1',
                can_serve_tiles: true,
            },
        ],
        samples: [],
    };
}

function makeLegacySlide(overrides: Partial<Slide> = {}): Slide {
    return {
        image_id: 'slide-1',
        stain_name: 'H&E',
        stain_group: 'Histology',
        is_hne: true,
        is_ihc: false,
        magnification: '20x',
        file_size_bytes: '100000000',
        can_serve_tiles: true,
        barcode: 'S-1234567-T01-1-1-1-1',
        block_number: '1',
        block_label: 'A1',
        slide_timepoint_days: -5,
        slide_timepoint_source: 'Procedure date',
        ...overrides,
    };
}

function makeLegacyHierarchy(): PatientHierarchy {
    return {
        patient_id: 'P-1',
        samples: [
            {
                sample_id: 'S-1',
                cancer_type: '',
                cancer_type_detailed: '',
                oncotree_code: '',
                primary_site: '',
                sample_type: 'Primary',
                parts: [
                    {
                        part_number: '1',
                        part_designator: 'A',
                        part_type: 'Resection',
                        part_description: 'Colon',
                        subspecialty: 'GI',
                        path_dx_title: 'TEST',
                        blocks: [
                            {
                                block_number: '1',
                                block_label: 'A1',
                                slides: [makeLegacySlide()],
                            },
                        ],
                    },
                ],
            },
        ],
    };
}

describe('pathologyAssociationUtils', () => {
    it('reuses the same read-only normalized associations for the same hierarchy snapshot', () => {
        const hierarchy = makeHierarchy();

        const first = getPathologySlideAssociationsReadOnly(hierarchy);
        const second = getPathologySlideAssociationsReadOnly(hierarchy);

        expect(second).toBe(first);
    });

    it('recomputes normalized associations when the slide-association array changes', () => {
        const hierarchy = makeHierarchy();

        const first = getPathologySlideAssociationsReadOnly(hierarchy);
        hierarchy.slide_associations = [
            ...(hierarchy.slide_associations || []),
        ];
        const second = getPathologySlideAssociationsReadOnly(hierarchy);

        expect(second).not.toBe(first);
        expect(second).toEqual(first);
    });

    it('recomputes normalized associations when a slide association mutates in place', () => {
        const hierarchy = makeHierarchy();

        const first = getPathologySlideAssociationsReadOnly(hierarchy);
        hierarchy.slide_associations![0].procedure_date_days = -9;
        const second = getPathologySlideAssociationsReadOnly(hierarchy);

        expect(second).not.toBe(first);
        expect(second[0].procedure_date_days).toBe(-9);
    });

    it('does not infer associations from legacy nested sample slides', () => {
        const hierarchy = makeLegacyHierarchy();

        expect(getPathologySlideAssociationsReadOnly(hierarchy)).toEqual([]);
    });

    it('matches slide type directly from the normalized association', () => {
        const [association] = getPathologySlideAssociationsReadOnly(
            makeHierarchy()
        );

        expect(matchesPathologySlideType(association, 'H&E')).toBe(true);
        expect(matchesPathologySlideType(association, 'IHC')).toBe(false);
    });

    it('deduplicates exact duplicate slide association rows', () => {
        const hierarchy = makeHierarchy();
        hierarchy.slide_associations = [
            ...(hierarchy.slide_associations || []),
            { ...(hierarchy.slide_associations || [])[0] },
        ];

        const associations = getPathologySlideAssociationsReadOnly(hierarchy);

        expect(associations).toHaveLength(1);
        expect(associations[0].image_id).toBe('slide-1');
    });

    it('preserves distinct associations for the same image when specimen differs', () => {
        const hierarchy = makeHierarchy();
        hierarchy.slide_associations = [
            ...(hierarchy.slide_associations || []),
            {
                ...(hierarchy.slide_associations || [])[0],
                specimen_key: 'specimen::2',
                part_number: '2',
                block_number: '2',
                block_label: 'B1',
            },
        ];

        const associations = getPathologySlideAssociationsReadOnly(hierarchy);

        expect(associations).toHaveLength(2);
        expect(
            associations.map(association => association.specimen_key)
        ).toEqual(['specimen::1', 'specimen::2']);
    });

    it('returns the same canonical ordering when equivalent slide associations are reordered in place', () => {
        const hierarchy = makeHierarchy();
        hierarchy.slide_associations = [
            {
                ...(hierarchy.slide_associations || [])[0],
                image_id: 'slide-2',
                specimen_key: 'specimen::2',
                procedure_date_days: -2,
                sample_id: 'S-2',
                match_level: 'PART',
                part_number: '2',
                block_number: '2',
                block_label: 'B1',
            },
            ...(hierarchy.slide_associations || []),
        ];

        const first = getPathologySlideAssociationsReadOnly(hierarchy);
        hierarchy.slide_associations!.reverse();
        const second = getPathologySlideAssociationsReadOnly(hierarchy);

        expect(second).toBe(first);
        expect(second).toEqual(first);
        expect(second.map(association => association.image_id)).toEqual([
            'slide-1',
            'slide-2',
        ]);
    });

    it('reuses normalized associations when equivalent slide associations are reordered in place', () => {
        const hierarchy = makeHierarchy();
        hierarchy.slide_associations = [
            ...(hierarchy.slide_associations || []),
            {
                ...(hierarchy.slide_associations || [])[0],
                image_id: 'slide-2',
                specimen_key: 'specimen::2',
                procedure_date_days: -2,
                sample_id: 'S-2',
                match_level: 'PART',
                part_number: '2',
                block_number: '2',
                block_label: 'B1',
            },
        ];

        const first = getPathologySlideAssociationsReadOnly(hierarchy);
        hierarchy.slide_associations!.reverse();
        const second = getPathologySlideAssociationsReadOnly(hierarchy);

        expect(second).toBe(first);
        expect(second).toEqual(first);
    });

    it('freezes cached read-only normalized associations so callers cannot mutate them', () => {
        const hierarchy = makeHierarchy();

        const associations = getPathologySlideAssociationsReadOnly(hierarchy);

        expect(Object.isFrozen(associations)).toBe(true);
        expect(Object.isFrozen(associations[0])).toBe(true);
        expect(() => {
            associations[0].procedure_date_days = -42;
        }).toThrow(TypeError);
    });
});
