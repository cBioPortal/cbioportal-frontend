import {
    countServableBlocksForSample,
    countServableSlidesForSample,
    getOrderedServableSlidesForSampleReadOnly,
    getServableSlideAssociationsByImageIdReadOnly,
    getServableSlideCountsForHierarchyReadOnly,
    getServableSlideEntriesForHierarchyReadOnly,
    getServableSlideIdsForPathologyFilterReadOnly,
    getServableSlidesForSampleReadOnly,
    sampleHasMultiplePartDescriptions,
    sampleHasServableSlide,
} from './wsiSlideUtils';
import {
    PatientHierarchy,
    Sample,
    Slide,
    SlideAssociation,
} from './wsiViewerTypes';

function makeSlide(overrides: Partial<Slide> = {}): Slide {
    return {
        image_id: '1000',
        stain_name: 'H&E',
        stain_group: 'Histology',
        is_hne: true,
        is_ihc: false,
        magnification: '20x',
        file_size_bytes: '100000000',
        can_serve_tiles: true,
        barcode: 'S-1234567-T01-1-1-1-1',
        block_label: 'A1',
        block_number: '1',
        ...overrides,
    };
}

function makeSample(sampleId: string, slides: Slide[]): Sample {
    return {
        sample_id: sampleId,
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
                part_description: 'Test part',
                subspecialty: 'GI',
                path_dx_title: 'TEST',
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

describe('wsiSlideUtils read-only slide derivation', () => {
    it('selects the preferred association for an image', () => {
        const associations: SlideAssociation[] = [
            {
                image_id: 'slide-1',
                sample_id: 'S-1',
                match_level: 'PART',
                specimen_key: 'part::1',
                slide_type: 'H&E',
                can_serve_tiles: true,
            },
            {
                image_id: 'slide-1',
                sample_id: 'S-1',
                match_level: 'BLOCK',
                specimen_key: 'block::1::A1',
                slide_type: 'H&E',
                can_serve_tiles: true,
            },
        ];

        expect(
            getServableSlideAssociationsByImageIdReadOnly(associations).get(
                'slide-1'
            )?.match_level
        ).toBe('BLOCK');
    });

    it('caches servable slides while invalidating in-place slide changes', () => {
        const sample = makeSample('S-1', [makeSlide({ image_id: 'slide-1' })]);
        const first = getServableSlidesForSampleReadOnly(sample);
        expect(getServableSlidesForSampleReadOnly(sample)).toBe(first);

        sample.parts[0].blocks[0].slides[0].can_serve_tiles = false;
        expect(getServableSlidesForSampleReadOnly(sample)).toEqual([]);
    });

    it('derives stain and block counts from servable slides', () => {
        const sample = makeSample('S-1', [
            makeSlide({ image_id: 'slide-hne', block_label: 'A1' }),
            makeSlide({
                image_id: 'slide-ihc',
                is_hne: false,
                is_ihc: true,
                stain_name: 'IHC',
                block_label: 'A1',
            }),
            makeSlide({ image_id: 'slide-hne-2', block_label: 'B1' }),
        ]);

        expect(countServableSlidesForSample(sample, 'all')).toBe(3);
        expect(countServableSlidesForSample(sample, 'hne')).toBe(2);
        expect(countServableSlidesForSample(sample, 'ihc')).toBe(1);
        expect(countServableBlocksForSample(sample, 'all')).toBe(2);
        expect(countServableBlocksForSample(sample, 'ihc')).toBe(1);
    });

    it('aggregates hierarchy entries and counts from samples', () => {
        const hierarchy: PatientHierarchy = {
            patient_id: 'P-1',
            samples: [
                makeSample('S-1', [makeSlide({ image_id: 'slide-1' })]),
                makeSample('S-2', [makeSlide({ image_id: 'slide-2' })]),
            ],
        };

        expect(
            getServableSlideEntriesForHierarchyReadOnly(hierarchy)
        ).toHaveLength(2);
        expect(getServableSlideCountsForHierarchyReadOnly(hierarchy)).toEqual({
            all: 2,
            hne: 2,
            ihc: 0,
        });
    });

    it('orders slides by slide-level timepoint', () => {
        const sample = makeSample('S-1', [
            makeSlide({ image_id: 'late', slide_timepoint_days: 10 }),
            makeSlide({ image_id: 'early', slide_timepoint_days: -10 }),
        ]);

        expect(
            getOrderedServableSlidesForSampleReadOnly(sample).map(
                entry => entry.slide.image_id
            )
        ).toEqual(['early', 'late']);
    });

    it('uses association metadata for pathology filtering', () => {
        const hierarchy: PatientHierarchy = {
            patient_id: 'P-1',
            samples: [makeSample('S-1', [makeSlide({ image_id: 'slide-1' })])],
            slide_associations: [
                {
                    image_id: 'slide-1',
                    sample_id: 'S-1',
                    match_level: 'BLOCK',
                    specimen_key: 'block::1::A1',
                    slide_type: 'H&E',
                    can_serve_tiles: true,
                },
                {
                    image_id: 'slide-2',
                    sample_id: null,
                    match_level: 'UNMATCHED',
                    specimen_key: 'unmatched::1::B1',
                    slide_type: 'IHC',
                    can_serve_tiles: true,
                },
            ],
        };

        expect(
            getServableSlideIdsForPathologyFilterReadOnly(hierarchy, {
                matchLevel: 'UNMATCHED',
                specimenKey: 'unmatched::1::B1',
            })
        ).toEqual(new Set(['slide-2']));
    });

    it('keeps sample lookup helpers based on the same cached slide set', () => {
        const sample = makeSample('S-1', [
            makeSlide({ image_id: 'slide-1', part_description: 'Colon' }),
            makeSlide({ image_id: 'slide-2', part_description: 'Liver' }),
        ]);

        expect(sampleHasServableSlide(sample, 'slide-1')).toBe(true);
        expect(sampleHasServableSlide(sample, 'missing')).toBe(false);
        expect(sampleHasMultiplePartDescriptions(sample)).toBe(true);
    });
});
