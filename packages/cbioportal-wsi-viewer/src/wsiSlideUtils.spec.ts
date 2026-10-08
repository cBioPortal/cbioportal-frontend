import {
    compareSlidesInSample,
    countServableSlidesForSample,
    getOrderedServableSlidesForSampleReadOnly,
    getServableSlideAssociationsBySlideKeyReadOnly,
    getServableSlideEntriesForHierarchyReadOnly,
    getServableSlideIdsForPathologyFilterReadOnly,
    getServableSlidesForSampleReadOnly,
    sampleHasMultiplePartDescriptions,
    sampleHasServableSlide,
    selectMetadataPrefetchSlides,
    wsiStainKind,
} from './wsiSlideUtils';
import {
    PatientHierarchy,
    Sample,
    Slide,
    SlideAssociation,
} from './wsiViewerTypes';

function makeSlide(overrides: Partial<Slide> = {}): Slide {
    return {
        slide_key: '1000',
        stain_name: 'H&E',
        stain_group: 'Histology',
        is_hne: true,
        is_ihc: false,
        magnification: '20x',
        file_size_bytes: '100000000',
        can_serve_tiles: true,
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
                part_type: 'Resection',
                part_description: 'Test part',
                subspecialty: 'GI',
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
                slide_key: 'slide-1',
                sample_id: 'S-1',
                match_level: 'PART',
                specimen_key: 'part::1',
                slide_type: 'H&E',
                can_serve_tiles: true,
            },
            {
                slide_key: 'slide-1',
                sample_id: 'S-1',
                match_level: 'BLOCK',
                specimen_key: 'block::1::A1',
                slide_type: 'H&E',
                can_serve_tiles: true,
            },
        ];

        expect(
            getServableSlideAssociationsBySlideKeyReadOnly(associations).get(
                'slide-1'
            )?.match_level
        ).toBe('BLOCK');
    });

    it('memoizes the preferred associations by array identity', () => {
        const association: SlideAssociation = {
            slide_key: 'slide-1',
            sample_id: 'S-1',
            match_level: 'PART',
            specimen_key: 'part::1',
            slide_type: 'H&E',
            can_serve_tiles: true,
        };
        const associations = [association];
        const first = getServableSlideAssociationsBySlideKeyReadOnly(
            associations
        );

        expect(
            getServableSlideAssociationsBySlideKeyReadOnly(associations)
        ).toBe(first);
        expect(
            getServableSlideAssociationsBySlideKeyReadOnly([association])
        ).not.toBe(first);
    });

    it('memoizes servable slides by sample identity', () => {
        const sample = makeSample('S-1', [makeSlide({ slide_key: 'slide-1' })]);
        const first = getServableSlidesForSampleReadOnly(sample);

        expect(getServableSlidesForSampleReadOnly(sample)).toBe(first);
        expect(
            getServableSlidesForSampleReadOnly(
                makeSample('S-1', [
                    makeSlide({ slide_key: 'slide-1', can_serve_tiles: false }),
                ])
            )
        ).toEqual([]);
    });

    it('derives stain counts from servable slides', () => {
        const sample = makeSample('S-1', [
            makeSlide({ slide_key: 'slide-hne', block_label: 'A1' }),
            makeSlide({
                slide_key: 'slide-ihc',
                is_hne: false,
                is_ihc: true,
                stain_name: 'IHC',
                block_label: 'A1',
            }),
            makeSlide({ slide_key: 'slide-hne-2', block_label: 'B1' }),
        ]);

        expect(countServableSlidesForSample(sample, 'all')).toBe(3);
        expect(countServableSlidesForSample(sample, 'hne')).toBe(2);
        expect(countServableSlidesForSample(sample, 'ihc')).toBe(1);
    });

    it('aggregates hierarchy entries from samples', () => {
        const hierarchy: PatientHierarchy = {
            patient_id: 'P-1',
            samples: [
                makeSample('S-1', [makeSlide({ slide_key: 'slide-1' })]),
                makeSample('S-2', [makeSlide({ slide_key: 'slide-2' })]),
            ],
        };

        expect(
            getServableSlideEntriesForHierarchyReadOnly(hierarchy)
        ).toHaveLength(2);
    });

    it('memoizes hierarchy entries by hierarchy identity', () => {
        const hierarchy: PatientHierarchy = {
            patient_id: 'P-1',
            samples: [makeSample('S-1', [makeSlide({ slide_key: 'slide-1' })])],
        };
        const first = getServableSlideEntriesForHierarchyReadOnly(hierarchy);

        expect(getServableSlideEntriesForHierarchyReadOnly(hierarchy)).toBe(
            first
        );
        expect(
            getServableSlideEntriesForHierarchyReadOnly({ ...hierarchy })
        ).not.toBe(first);
    });

    it('orders slides by part, then block, then H&E first', () => {
        const slide = (key: string, blockNumber: string, isHne: boolean) =>
            makeSlide({
                slide_key: key,
                block_number: blockNumber,
                stain_name: isHne ? 'H&E' : 'CD3',
                is_hne: isHne,
                is_ihc: !isHne,
            });
        const part = (partNumber: string, slides: Slide[]) => ({
            ...makeSample('unused', []).parts[0],
            part_number: partNumber,
            blocks: [{ block_number: '', block_label: '', slides }],
        });
        // Hierarchy order differs from the expected display order.
        const sample: Sample = {
            ...makeSample('S-1', []),
            parts: [
                part('10', [slide('p10-b1-he', '1', true)]),
                part('2', [
                    slide('p2-b10-he', '10', true),
                    slide('p2-b2-ihc', '2', false),
                    slide('p2-b2-he', '2', true),
                ]),
            ],
        };

        expect(
            getOrderedServableSlidesForSampleReadOnly(sample).map(
                entry => entry.slide.slide_key
            )
        ).toEqual(['p2-b2-he', 'p2-b2-ihc', 'p2-b10-he', 'p10-b1-he']);
    });

    it('keeps hierarchy order for slides with the same part, block and stain', () => {
        const sample = makeSample('S-1', [
            makeSlide({ slide_key: 'first' }),
            makeSlide({ slide_key: 'second' }),
        ]);

        expect(
            getOrderedServableSlidesForSampleReadOnly(sample).map(
                entry => entry.slide.slide_key
            )
        ).toEqual(['first', 'second']);
    });

    it('sorts numeric part and block numbers before other and missing ones', () => {
        const entry = (partNumber: string | null, blockNumber: string) => ({
            partNumber,
            slide: makeSlide({ block_number: blockNumber }),
        });
        const ordered = [
            entry(null, '1'),
            entry('A', '1'),
            entry('3', ''),
            entry('3', 'B'),
            entry('3', '2'),
            entry('1', '1'),
        ].sort(compareSlidesInSample);

        expect(
            ordered.map(e => `${e.partNumber}/${e.slide.block_number}`)
        ).toEqual(['1/1', '3/2', '3/B', '3/', 'A/1', 'null/1']);
    });

    it('orders non-H&E stains in one block by stain name', () => {
        const ordered = [
            makeSlide({
                slide_key: 'ki67',
                stain_name: 'Ki-67',
                is_hne: false,
            }),
            makeSlide({ slide_key: 'cd3', stain_name: 'CD3', is_hne: false }),
            makeSlide({ slide_key: 'he', stain_name: 'H&E' }),
        ]
            .map(slide => ({ slide, partNumber: '1' }))
            .sort(compareSlidesInSample);

        expect(ordered.map(e => e.slide.slide_key)).toEqual([
            'he',
            'cd3',
            'ki67',
        ]);
    });

    it('uses association metadata for pathology filtering', () => {
        const hierarchy: PatientHierarchy = {
            patient_id: 'P-1',
            samples: [makeSample('S-1', [makeSlide({ slide_key: 'slide-1' })])],
            slide_associations: [
                {
                    slide_key: 'slide-1',
                    sample_id: 'S-1',
                    match_level: 'BLOCK',
                    specimen_key: 'block::1::A1',
                    slide_type: 'H&E',
                    can_serve_tiles: true,
                },
                {
                    slide_key: 'slide-2',
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

    it('matches linkouts whose source sample is represented by the unmatched group', () => {
        const hierarchy: PatientHierarchy = {
            patient_id: 'P-1',
            samples: [
                makeSample('UNMATCHED', [
                    makeSlide({ slide_key: 'source-slide' }),
                ]),
            ],
            slide_associations: [
                {
                    slide_key: 'source-slide',
                    sample_id: null,
                    match_level: 'BLOCK',
                    specimen_key: 'block::part:1::block:S16-1681/1-4TC',
                    part_number: '1',
                    block_number: 'S16-1681/1-4TC',
                    block_label: '4TC',
                    slide_type: 'H&E',
                    can_serve_tiles: true,
                },
            ],
        };

        expect(
            getServableSlideIdsForPathologyFilterReadOnly(hierarchy, {
                sampleId: 'P-1-T01-IM5',
                matchLevel: 'BLOCK',
                specimenKey: 'block::part:1::block:S16-1681/1-4TC',
            })
        ).toEqual(new Set(['source-slide']));
    });

    it('memoizes pathology filter results per associations and filter', () => {
        const hierarchy: PatientHierarchy = {
            patient_id: 'P-1',
            samples: [],
            slide_associations: [
                {
                    slide_key: 'slide-1',
                    sample_id: null,
                    match_level: 'PART',
                    specimen_key: 'part::1',
                    slide_type: 'H&E',
                    can_serve_tiles: true,
                },
                {
                    slide_key: 'slide-2',
                    sample_id: null,
                    match_level: 'BLOCK',
                    specimen_key: 'block::1::A1',
                    slide_type: 'IHC',
                    can_serve_tiles: true,
                },
            ],
        };
        const partFilter = {
            matchLevel: 'PART' as const,
            specimenKey: 'part::1',
        };
        const first = getServableSlideIdsForPathologyFilterReadOnly(
            hierarchy,
            partFilter
        );

        expect(first).toEqual(new Set(['slide-1']));
        expect(
            getServableSlideIdsForPathologyFilterReadOnly(hierarchy, partFilter)
        ).toBe(first);
        expect(
            getServableSlideIdsForPathologyFilterReadOnly(hierarchy, {
                matchLevel: 'BLOCK',
                specimenKey: 'block::1::A1',
            })
        ).toEqual(new Set(['slide-2']));
    });

    it('keeps sample lookup helpers based on the same cached slide set', () => {
        const sample = makeSample('S-1', [
            makeSlide({ slide_key: 'slide-1', part_description: 'Colon' }),
            makeSlide({ slide_key: 'slide-2', part_description: 'Liver' }),
        ]);

        expect(sampleHasServableSlide(sample, 'slide-1')).toBe(true);
        expect(sampleHasServableSlide(sample, 'missing')).toBe(false);
        expect(sampleHasMultiplePartDescriptions(sample)).toBe(true);
    });
});

describe('selectMetadataPrefetchSlides', () => {
    const hne = (id: string) => makeSlide({ slide_key: id });
    const ihc = (id: string) =>
        makeSlide({ slide_key: id, is_hne: false, is_ihc: true });

    function entries(sample: Sample) {
        return sample.parts[0].blocks[0].slides.map(slide => ({
            slide,
            sample,
        }));
    }

    it('takes only the selected sample, matching stain first, capped', () => {
        const selected = makeSample('S1', [ihc('i1'), hne('h1'), hne('h2')]);
        const other = makeSample('S2', [hne('o1'), hne('o2')]);

        const picked = selectMetadataPrefetchSlides(
            [...entries(selected), ...entries(other)],
            { selectedSampleId: 'S1', stainFilter: 'hne', limit: 10 }
        );

        expect(picked.map(slide => slide.slide_key)).toEqual([
            'h1',
            'h2',
            'i1',
        ]);
    });

    it('skips the given image, already-cached slides and duplicates', () => {
        const sample = makeSample('S1', [hne('h1'), hne('h2'), hne('h3')]);

        const picked = selectMetadataPrefetchSlides(
            [...entries(sample), ...entries(sample)],
            {
                selectedSampleId: 'S1',
                stainFilter: 'all',
                limit: 10,
                skipSlideKey: 'h1',
                isCached: slideKey => slideKey === 'h3',
            }
        );

        expect(picked.map(slide => slide.slide_key)).toEqual(['h2']);
    });

    it('stops at the limit', () => {
        const sample = makeSample(
            'S1',
            Array.from({ length: 20 }, (_, index) => hne(`h${index}`))
        );

        expect(
            selectMetadataPrefetchSlides(entries(sample), {
                selectedSampleId: 'S1',
                stainFilter: 'all',
                limit: 5,
            })
        ).toHaveLength(5);
    });

    it('prefetches nothing without a selected sample', () => {
        const sample = makeSample('S1', [hne('h1')]);

        expect(
            selectMetadataPrefetchSlides(entries(sample), {
                selectedSampleId: undefined,
                stainFilter: 'all',
                limit: 5,
            })
        ).toEqual([]);
    });
});

describe('wsiStainKind', () => {
    it('prefers the resolved flags', () => {
        expect(
            wsiStainKind({ is_hne: true, is_ihc: false, slide_type: 'IHC' })
        ).toBe('hne');
        expect(
            wsiStainKind({ is_hne: false, is_ihc: true, slide_type: 'H&E' })
        ).toBe('ihc');
    });

    it('keeps Other and Unknown distinct', () => {
        expect(
            wsiStainKind({ is_hne: false, is_ihc: false, slide_type: 'Other' })
        ).toBe('other');
        expect(
            wsiStainKind({
                is_hne: false,
                is_ihc: false,
                slide_type: 'Unknown',
            })
        ).toBe('unknown');
    });
});
