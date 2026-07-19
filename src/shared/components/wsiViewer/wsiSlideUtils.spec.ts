import {
    countServableBlocksForSample,
    countServableSlidesForSample,
    filterHierarchyToServableSlideIds,
    filterHierarchyToServableSlideIdsReadOnly,
    getOrderedServableSlidesForSample,
    getOrderedServableSlidesForSampleReadOnly,
    getServableSlideAssociationsByImageId,
    getServableSlideAssociationsByImageIdReadOnly,
    getServableSlideIdsForPathologyFilter,
    getServableSlideIdsForPathologyFilterReadOnly,
    getServableSlideCountsForHierarchy,
    getServableSlideCountsForHierarchyReadOnly,
    getServableSlideEntriesForHierarchy,
    getServableSlideEntriesForHierarchyReadOnly,
    getServableSlidesForSample,
    getServableSlidesForSampleReadOnly,
    sampleHasMultiplePartDescriptions,
    sampleHasServableSlide,
} from './wsiSlideUtils';
import * as wsiSlideUtils from './wsiSlideUtils';
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

describe('wsiSlideUtils caching', () => {
    it('prefers block associations when a slide has multiple viewable matches', () => {
        const associations: SlideAssociation[] = [
            {
                image_id: 'slide-1',
                sample_id: 'S-1',
                match_level: 'PART',
                specimen_key: 'PART::slide-1',
                slide_type: 'H&E',
                can_serve_tiles: true,
            },
            {
                image_id: 'slide-1',
                sample_id: 'S-1',
                match_level: 'BLOCK',
                specimen_key: 'BLOCK::slide-1',
                slide_type: 'H&E',
                can_serve_tiles: true,
            },
        ];

        expect(
            getServableSlideAssociationsByImageId(associations).get('slide-1')
                ?.match_level
        ).toBe('BLOCK');
    });

    it('chooses the same canonical association when equal-priority rows arrive in different orders', () => {
        const first: SlideAssociation = {
            image_id: 'slide-1',
            sample_id: 'S-2',
            match_level: 'BLOCK',
            specimen_key: 'BLOCK::2::B1',
            slide_type: 'H&E',
            can_serve_tiles: true,
        };
        const second: SlideAssociation = {
            image_id: 'slide-1',
            sample_id: 'S-1',
            match_level: 'BLOCK',
            specimen_key: 'BLOCK::1::A1',
            slide_type: 'H&E',
            can_serve_tiles: true,
        };

        const forward = getServableSlideAssociationsByImageId([
            first,
            second,
        ]).get('slide-1');
        const reversed = getServableSlideAssociationsByImageId([
            second,
            first,
        ]).get('slide-1');

        expect(forward).toEqual(second);
        expect(reversed).toEqual(second);
    });

    it('returns cloned association-by-image maps for the same association array', () => {
        const associations: SlideAssociation[] = [
            {
                image_id: 'slide-1',
                sample_id: 'S-1',
                match_level: 'BLOCK',
                specimen_key: 'BLOCK::slide-1',
                slide_type: 'H&E',
                can_serve_tiles: true,
            },
        ];

        const first = getServableSlideAssociationsByImageId(associations);
        const second = getServableSlideAssociationsByImageId(associations);

        expect(second).toEqual(first);
        expect(second).not.toBe(first);
    });

    it('reuses the same read-only association-by-image map for the same association array', () => {
        const associations: SlideAssociation[] = [
            {
                image_id: 'slide-1',
                sample_id: 'S-1',
                match_level: 'BLOCK',
                specimen_key: 'BLOCK::slide-1',
                slide_type: 'H&E',
                can_serve_tiles: true,
            },
        ];

        const first = getServableSlideAssociationsByImageIdReadOnly(
            associations
        );
        const second = getServableSlideAssociationsByImageIdReadOnly(
            associations
        );

        expect(second).toBe(first);
    });

    it('reuses the cached association snapshot signature for the same warm association array', () => {
        const sortSpy = jest.spyOn(Array.prototype as any, 'sort');
        const associations: SlideAssociation[] = [
            {
                image_id: 'slide-1',
                sample_id: 'S-1',
                match_level: 'BLOCK',
                specimen_key: 'BLOCK::slide-1',
                slide_type: 'H&E',
                can_serve_tiles: true,
            },
        ];

        const first = wsiSlideUtils.getServableSlideAssociationsByImageIdReadOnly(
            associations
        );
        const initialSortCallCount = sortSpy.mock.calls.length;
        const second = wsiSlideUtils.getServableSlideAssociationsByImageIdReadOnly(
            associations
        );

        expect(second).toBe(first);
        expect(sortSpy.mock.calls.length).toBe(initialSortCallCount);
    });

    it('does not let callers mutate the cached association-by-image map', () => {
        const associations: SlideAssociation[] = [
            {
                image_id: 'slide-1',
                sample_id: 'S-1',
                match_level: 'BLOCK',
                specimen_key: 'BLOCK::slide-1',
                slide_type: 'H&E',
                can_serve_tiles: true,
            },
        ];

        const first = getServableSlideAssociationsByImageId(associations);
        first.set('slide-2', {
            image_id: 'slide-2',
            sample_id: 'S-2',
            match_level: 'PART',
            specimen_key: 'PART::slide-2',
            slide_type: 'H&E',
            can_serve_tiles: true,
        });
        first.get('slide-1')!.match_level = 'PART';

        const second = getServableSlideAssociationsByImageId(associations);

        expect(second.size).toBe(1);
        expect(second.get('slide-1')?.match_level).toBe('BLOCK');
    });

    it('rebuilds the association-by-image map when the association array reference changes', () => {
        const associations: SlideAssociation[] = [
            {
                image_id: 'slide-1',
                sample_id: 'S-1',
                match_level: 'BLOCK',
                specimen_key: 'BLOCK::slide-1',
                slide_type: 'H&E',
                can_serve_tiles: true,
            },
        ];

        const first = getServableSlideAssociationsByImageId(associations);
        const second = getServableSlideAssociationsByImageId([
            ...associations,
        ]);

        expect(second).not.toBe(first);
        expect(second.get('slide-1')).toEqual(first.get('slide-1'));
    });

    it('rebuilds the association-by-image map when an association mutates in place', () => {
        const associations: SlideAssociation[] = [
            {
                image_id: 'slide-1',
                sample_id: 'S-1',
                match_level: 'PART',
                specimen_key: 'PART::slide-1',
                slide_type: 'H&E',
                can_serve_tiles: true,
            },
        ];

        const first = getServableSlideAssociationsByImageId(associations);
        associations[0].match_level = 'BLOCK';
        const second = getServableSlideAssociationsByImageId(associations);

        expect(second).not.toBe(first);
        expect(second.get('slide-1')?.match_level).toBe('BLOCK');
    });

    it('returns cloned association-by-image maps when equivalent associations are reordered in place', () => {
        const associations: SlideAssociation[] = [
            {
                image_id: 'slide-1',
                sample_id: 'S-1',
                match_level: 'BLOCK',
                specimen_key: 'BLOCK::slide-1',
                slide_type: 'H&E',
                can_serve_tiles: true,
            },
            {
                image_id: 'slide-2',
                sample_id: 'S-2',
                match_level: 'PART',
                specimen_key: 'PART::slide-2',
                slide_type: 'H&E',
                can_serve_tiles: true,
            },
        ];

        const first = getServableSlideAssociationsByImageId(associations);
        associations.reverse();
        const second = getServableSlideAssociationsByImageId(associations);

        expect(second).toEqual(first);
        expect(second).not.toBe(first);
    });

    it('returns cloned servable slide arrays when only sample metadata changes', () => {
        const sample = makeSample('S-1', [
            makeSlide({ image_id: 'slide-1' }),
            makeSlide({ image_id: 'slide-2', is_hne: false, is_ihc: true }),
        ]);

        const first = getServableSlidesForSample(sample);
        sample.sample_type = 'Metastasis';
        sample.tmb_score = '5.4';
        const second = getServableSlidesForSample(sample);

        expect(second).toEqual(first);
        expect(second).not.toBe(first);
    });

    it('does not let callers mutate cached servable slide arrays', () => {
        const sample = makeSample('S-1', [makeSlide({ image_id: 'slide-1' })]);

        const first = getServableSlidesForSample(sample);
        first.push(makeSlide({ image_id: 'slide-2' }));

        const second = getServableSlidesForSample(sample);

        expect(second.map(slide => slide.image_id)).toEqual(['slide-1']);
    });

    it('reuses the same read-only servable slide array when the sample slide snapshot is unchanged', () => {
        const sample = makeSample('S-1', [makeSlide({ image_id: 'slide-1' })]);

        const first = getServableSlidesForSampleReadOnly(sample);
        sample.sample_type = 'Metastasis';
        const second = getServableSlidesForSampleReadOnly(sample);

        expect(second).toBe(first);
    });

    it('reuses the cached servable slide snapshot signature for the same warm parts array', () => {
        const sortSpy = jest.spyOn(Array.prototype as any, 'sort');
        const sample = makeSample('S-1', [makeSlide({ image_id: 'slide-1' })]);

        const first = getServableSlidesForSampleReadOnly(sample);
        const initialSortCallCount = sortSpy.mock.calls.length;
        const second = getServableSlidesForSampleReadOnly(sample);

        expect(second).toBe(first);
        expect(sortSpy.mock.calls.length).toBe(initialSortCallCount);
    });

    it('rebuilds servable slides when the parts reference changes', () => {
        const sample = makeSample('S-1', [makeSlide({ image_id: 'slide-1' })]);
        const first = getServableSlidesForSample(sample);

        sample.parts = [
            {
                ...sample.parts[0],
                blocks: [
                    ...sample.parts[0].blocks,
                    {
                        block_number: '2',
                        block_label: 'B1',
                        slides: [makeSlide({ image_id: 'slide-2' })],
                    },
                ],
            },
        ];

        const second = getServableSlidesForSample(sample);

        expect(second).not.toBe(first);
        expect(second.map(slide => slide.image_id)).toEqual([
            'slide-1',
            'slide-2',
        ]);
    });

    it('rebuilds servable slides when a slide mutates in place under the same parts reference', () => {
        const sample = makeSample('S-1', [makeSlide({ image_id: 'slide-1' })]);

        const first = getServableSlidesForSample(sample);
        sample.parts[0].blocks[0].slides[0].can_serve_tiles = false;
        const second = getServableSlidesForSample(sample);

        expect(second).not.toBe(first);
        expect(second).toEqual([]);
    });

    it('reuses cached sample slide derivation when building hierarchy entries', () => {
        const sample = makeSample('S-1', [makeSlide({ image_id: 'slide-1' })]);
        const hierarchy: PatientHierarchy = {
            patient_id: 'P-1',
            samples: [sample],
        };

        const cachedSlides = getServableSlidesForSample(sample);
        const entries = getServableSlideEntriesForHierarchy(hierarchy);

        expect(entries).toHaveLength(1);
        expect(entries[0].slide).toBe(cachedSlides[0]);
        expect(entries[0].sample).toBe(sample);
    });

    it('returns cloned hierarchy entry arrays while the samples reference is unchanged', () => {
        const hierarchy: PatientHierarchy = {
            patient_id: 'P-1',
            samples: [makeSample('S-1', [makeSlide({ image_id: 'slide-1' })])],
        };

        const first = getServableSlideEntriesForHierarchy(hierarchy);
        hierarchy.samples[0].sample_type = 'Metastasis';
        const second = getServableSlideEntriesForHierarchy(hierarchy);

        expect(second).toEqual(first);
        expect(second).not.toBe(first);

        hierarchy.samples = [
            ...hierarchy.samples,
            makeSample('S-2', [makeSlide({ image_id: 'slide-2' })]),
        ];
        const third = getServableSlideEntriesForHierarchy(hierarchy);

        expect(third).not.toBe(first);
        expect(third).toHaveLength(2);
    });

    it('reuses the same read-only hierarchy entry array while the samples snapshot is unchanged', () => {
        const hierarchy: PatientHierarchy = {
            patient_id: 'P-1',
            samples: [makeSample('S-1', [makeSlide({ image_id: 'slide-1' })])],
        };

        const first = getServableSlideEntriesForHierarchyReadOnly(hierarchy);
        hierarchy.samples[0].sample_type = 'Metastasis';
        const second = getServableSlideEntriesForHierarchyReadOnly(hierarchy);

        expect(second).toBe(first);
    });

    it('does not let callers mutate cached hierarchy entry arrays or counts', () => {
        const hierarchy: PatientHierarchy = {
            patient_id: 'P-1',
            samples: [makeSample('S-1', [makeSlide({ image_id: 'slide-1' })])],
        };

        const firstEntries = getServableSlideEntriesForHierarchy(hierarchy);
        const firstCounts = getServableSlideCountsForHierarchy(hierarchy);
        firstEntries.push({
            slide: makeSlide({ image_id: 'slide-2' }),
            sample: makeSample('S-2', [makeSlide({ image_id: 'slide-2' })]),
        });
        firstCounts.all = 99;

        const secondEntries = getServableSlideEntriesForHierarchy(hierarchy);
        const secondCounts = getServableSlideCountsForHierarchy(hierarchy);

        expect(secondEntries).toHaveLength(1);
        expect(secondEntries[0].slide.image_id).toBe('slide-1');
        expect(secondCounts).toEqual({ all: 1, hne: 1, ihc: 0 });
    });

    it('recomputes hierarchy entries when a sample parts reference changes in place', () => {
        const hierarchy: PatientHierarchy = {
            patient_id: 'P-1',
            samples: [makeSample('S-1', [makeSlide({ image_id: 'slide-1' })])],
        };

        const first = getServableSlideEntriesForHierarchy(hierarchy);
        hierarchy.samples[0].parts = [
            {
                ...hierarchy.samples[0].parts[0],
                blocks: [
                    ...hierarchy.samples[0].parts[0].blocks,
                    {
                        block_number: '2',
                        block_label: 'B1',
                        slides: [makeSlide({ image_id: 'slide-2' })],
                    },
                ],
            },
        ];
        const second = getServableSlideEntriesForHierarchy(hierarchy);

        expect(second).not.toBe(first);
        expect(second.map(entry => entry.slide.image_id)).toEqual([
            'slide-1',
            'slide-2',
        ]);
    });

    it('recomputes hierarchy entries when a slide mutates in place under the same parts reference', () => {
        const hierarchy: PatientHierarchy = {
            patient_id: 'P-1',
            samples: [makeSample('S-1', [makeSlide({ image_id: 'slide-1' })])],
        };

        const first = getServableSlideEntriesForHierarchy(hierarchy);
        hierarchy.samples[0].parts[0].blocks[0].slides[0].can_serve_tiles = false;
        const second = getServableSlideEntriesForHierarchy(hierarchy);

        expect(second).not.toBe(first);
        expect(second).toEqual([]);
    });

    it('recomputes hierarchy counts when a sample id changes in place', () => {
        const hierarchy: PatientHierarchy = {
            patient_id: 'P-1',
            samples: [makeSample('S-1', [makeSlide({ image_id: 'slide-1' })])],
        };

        const firstEntries = getServableSlideEntriesForHierarchy(hierarchy);
        const firstCounts = getServableSlideCountsForHierarchy(hierarchy);

        hierarchy.samples[0].sample_id = 'S-1-renamed';
        const secondEntries = getServableSlideEntriesForHierarchy(hierarchy);
        const secondCounts = getServableSlideCountsForHierarchy(hierarchy);

        expect(secondEntries).not.toBe(firstEntries);
        expect(secondCounts).toEqual(firstCounts);
        expect(secondCounts).not.toBe(firstCounts);
    });

    it('reuses cached slide and block counts for a sample', () => {
        const sample = makeSample('S-1', [
            makeSlide({ image_id: 'slide-1', block_label: 'A1' }),
            makeSlide({
                image_id: 'slide-2',
                is_hne: false,
                is_ihc: true,
                stain_name: 'IHC',
                block_label: 'A1',
            }),
            makeSlide({ image_id: 'slide-3', block_label: 'B1' }),
        ]);

        getServableSlidesForSample(sample);
        sample.sample_type = 'Metastasis';

        expect(countServableSlidesForSample(sample, 'all')).toBe(3);
        expect(countServableSlidesForSample(sample, 'hne')).toBe(2);
        expect(countServableSlidesForSample(sample, 'ihc')).toBe(1);
        expect(countServableBlocksForSample(sample, 'all')).toBe(2);
        expect(countServableBlocksForSample(sample, 'hne')).toBe(2);
        expect(countServableBlocksForSample(sample, 'ihc')).toBe(1);
    });

    it('aggregates hierarchy slide counts without materializing all slide entries', () => {
        const sample1 = makeSample('S-1', [
            makeSlide({ image_id: 'slide-1' }),
            makeSlide({
                image_id: 'slide-2',
                is_hne: false,
                is_ihc: true,
                stain_name: 'IHC',
            }),
        ]);
        const sample2 = makeSample('S-2', [makeSlide({ image_id: 'slide-3' })]);
        const hierarchy: PatientHierarchy = {
            patient_id: 'P-1',
            samples: [sample1, sample2],
        };

        expect(getServableSlideCountsForHierarchy(hierarchy)).toEqual({
            all: 3,
            hne: 2,
            ihc: 1,
        });
    });

    it('reuses the same read-only hierarchy counts object while the samples snapshot is unchanged', () => {
        const hierarchy: PatientHierarchy = {
            patient_id: 'P-1',
            samples: [makeSample('S-1', [makeSlide({ image_id: 'slide-1' })])],
        };

        const first = getServableSlideCountsForHierarchyReadOnly(hierarchy);
        hierarchy.samples[0].sample_type = 'Metastasis';
        const second = getServableSlideCountsForHierarchyReadOnly(hierarchy);

        expect(second).toBe(first);
    });

    it('materializes hierarchy entries after a prior count-only cache fill', () => {
        const hierarchy: PatientHierarchy = {
            patient_id: 'P-1',
            samples: [makeSample('S-1', [makeSlide({ image_id: 'slide-1' })])],
        };

        expect(getServableSlideCountsForHierarchyReadOnly(hierarchy)).toEqual({
            all: 1,
            hne: 1,
            ihc: 0,
        });

        const entries = getServableSlideEntriesForHierarchyReadOnly(hierarchy);

        expect(entries).toHaveLength(1);
        expect(entries[0].slide.image_id).toBe('slide-1');
        expect(entries[0].sample.sample_id).toBe('S-1');
    });

    it('returns cloned ordered servable slides with normalized block labels', () => {
        const sample = makeSample('S-1', [
            makeSlide({ image_id: 'slide-hne' }),
        ]);
        sample.parts = [
            {
                ...sample.parts[0],
                blocks: [
                    {
                        block_number: '2',
                        block_label: 'B1',
                        slides: [
                            makeSlide({
                                image_id: 'slide-ihc',
                                is_hne: false,
                                is_ihc: true,
                                stain_name: 'IHC',
                                block_number: '2',
                                block_label: 'B1',
                            }),
                        ],
                    },
                    {
                        block_number: '1',
                        block_label: 'A1',
                        slides: [
                            makeSlide({
                                image_id: 'slide-hne',
                                block_number: '1',
                                block_label: 'A1',
                            }),
                        ],
                    },
                ],
            },
        ];

        const first = getOrderedServableSlidesForSample(sample);
        const second = getOrderedServableSlidesForSample(sample);

        expect(second).toEqual(first);
        expect(second).not.toBe(first);
        expect(
            first.map(entry => [entry.slide.image_id, entry.blockLabel])
        ).toEqual([
            ['slide-hne', 'A1'],
            ['slide-ihc', 'B1'],
        ]);
    });

    it('does not let callers mutate cached ordered servable slide entries', () => {
        const sample = makeSample('S-1', [makeSlide({ image_id: 'slide-1' })]);

        const first = getOrderedServableSlidesForSample(sample);
        first[0].blockLabel = 'mutated';

        const second = getOrderedServableSlidesForSample(sample);

        expect(second[0].blockLabel).toBe('A1');
    });

    it('reuses the same read-only ordered slide entries when the sample slide snapshot is unchanged', () => {
        const sample = makeSample('S-1', [makeSlide({ image_id: 'slide-1' })]);

        const first = getOrderedServableSlidesForSampleReadOnly(sample);
        sample.sample_type = 'Metastasis';
        const second = getOrderedServableSlidesForSampleReadOnly(sample);

        expect(second).toBe(first);
    });

    it('orders servable slides by slide-level timepoint before block order', () => {
        const sample = makeSample('S-1', [
            makeSlide({
                image_id: 'slide-late',
                slide_timepoint_days: -5,
                slide_timepoint_source: 'Procedure date',
                block_number: '1',
                block_label: 'A1',
            }),
            makeSlide({
                image_id: 'slide-early',
                slide_timepoint_days: -20,
                slide_timepoint_source: 'Procedure date',
                block_number: '9',
                block_label: 'Z1',
            }),
        ]);

        const ordered = getOrderedServableSlidesForSample(sample);

        expect(ordered.map(entry => entry.slide.image_id)).toEqual([
            'slide-early',
            'slide-late',
        ]);
    });

    it('uses cached sample slide ids and part descriptions for lookup helpers', () => {
        const sample = makeSample('S-1', [
            makeSlide({
                image_id: 'slide-1',
                part_description: 'Colon',
            }),
            makeSlide({
                image_id: 'slide-2',
                part_description: 'Liver',
            }),
        ]);

        getServableSlidesForSample(sample);

        expect(sampleHasServableSlide(sample, 'slide-1')).toBe(true);
        expect(sampleHasServableSlide(sample, 'missing')).toBe(false);
        expect(sampleHasMultiplePartDescriptions(sample)).toBe(true);
    });
});

describe('pathology slide filtering', () => {
    it('derives exact servable slide ids from pathology filter metadata', () => {
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
                    slide_type: 'H&E',
                    can_serve_tiles: true,
                },
            ],
        };

        expect(
            getServableSlideIdsForPathologyFilter(hierarchy, {
                matchLevel: 'Unmatched',
                specimenKey: 'unmatched::1::B1',
            })
        ).toEqual(new Set(['slide-2']));
    });

    it('returns cloned filtered slide ids for the same hierarchy snapshot and pathology filter', () => {
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
            ],
        };
        const filter = {
            sampleId: 'S-1',
            matchLevel: 'BLOCK',
            specimenKey: 'block::1::A1',
        };

        const first = getServableSlideIdsForPathologyFilter(hierarchy, filter);
        const second = getServableSlideIdsForPathologyFilter(hierarchy, filter);

        expect(second).toEqual(first);
        expect(second).not.toBe(first);
    });

    it('returns cloned filtered slide ids after toggling between pathology filters', () => {
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
                    slide_type: 'H&E',
                    can_serve_tiles: true,
                },
            ],
        };

        const blockFilter = {
            sampleId: 'S-1',
            matchLevel: 'BLOCK',
            specimenKey: 'block::1::A1',
        };
        const unmatchedFilter = {
            matchLevel: 'UNMATCHED',
            specimenKey: 'unmatched::1::B1',
        };

        const firstBlock =
            getServableSlideIdsForPathologyFilter(hierarchy, blockFilter);
        const unmatched = getServableSlideIdsForPathologyFilter(
            hierarchy,
            unmatchedFilter
        );
        const secondBlock =
            getServableSlideIdsForPathologyFilter(hierarchy, blockFilter);

        expect(unmatched).toEqual(new Set(['slide-2']));
        expect(secondBlock).toEqual(firstBlock);
        expect(secondBlock).not.toBe(firstBlock);
    });

    it('does not let callers mutate cached filtered slide ids', () => {
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
            ],
        };
        const filter = {
            sampleId: 'S-1',
            matchLevel: 'BLOCK',
            specimenKey: 'block::1::A1',
        };

        const first = getServableSlideIdsForPathologyFilter(hierarchy, filter)!;
        first.add('slide-2');

        const second = getServableSlideIdsForPathologyFilter(hierarchy, filter);

        expect(second).toEqual(new Set(['slide-1']));
    });

    it('reuses the same read-only filtered slide-id set for the same hierarchy snapshot and filter', () => {
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
            ],
        };
        const filter = {
            sampleId: 'S-1',
            matchLevel: 'BLOCK',
            specimenKey: 'block::1::A1',
        };

        const first = getServableSlideIdsForPathologyFilterReadOnly(
            hierarchy,
            filter
        );
        const second = getServableSlideIdsForPathologyFilterReadOnly(
            hierarchy,
            filter
        );

        expect(second).toBe(first);
    });

    it('recomputes filtered slide ids when slide associations change on the same hierarchy object', () => {
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
            ],
        };
        const filter = {
            sampleId: 'S-1',
            matchLevel: 'BLOCK',
            specimenKey: 'block::1::A1',
        };

        const first = getServableSlideIdsForPathologyFilter(hierarchy, filter);
        hierarchy.slide_associations = [
            ...hierarchy.slide_associations!,
            {
                image_id: 'slide-2',
                sample_id: 'S-1',
                match_level: 'BLOCK',
                specimen_key: 'block::1::A1',
                slide_type: 'H&E',
                can_serve_tiles: true,
            },
        ];
        const second = getServableSlideIdsForPathologyFilter(hierarchy, filter);

        expect(second).not.toBe(first);
        expect(second).toEqual(new Set(['slide-1', 'slide-2']));
    });

    it('recomputes filtered slide ids when a slide association mutates in place', () => {
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
            ],
        };
        const filter = {
            sampleId: 'S-1',
            matchLevel: 'BLOCK',
            specimenKey: 'block::1::A1',
        };

        const first = getServableSlideIdsForPathologyFilter(hierarchy, filter);
        hierarchy.slide_associations![0].can_serve_tiles = false;
        const second = getServableSlideIdsForPathologyFilter(hierarchy, filter);

        expect(second).not.toBe(first);
        expect(second).toEqual(new Set());
    });

    it('returns cloned filtered slide ids when equivalent slide associations are reordered in place', () => {
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
                    slide_type: 'H&E',
                    can_serve_tiles: true,
                },
            ],
        };
        const filter = {
            sampleId: 'S-1',
            matchLevel: 'BLOCK',
            specimenKey: 'block::1::A1',
        };

        const first = getServableSlideIdsForPathologyFilter(hierarchy, filter);
        hierarchy.slide_associations!.reverse();
        const second = getServableSlideIdsForPathologyFilter(hierarchy, filter);

        expect(second).toEqual(first);
        expect(second).not.toBe(first);
    });

    it('prunes the hierarchy to only the selected servable slide ids', () => {
        const hierarchy: PatientHierarchy = {
            patient_id: 'P-1',
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
                    slide_type: 'H&E',
                    can_serve_tiles: true,
                },
                {
                    image_id: 'slide-3',
                    sample_id: 'S-1',
                    match_level: 'PART',
                    specimen_key: 'part::1',
                    slide_type: 'H&E',
                    can_serve_tiles: false,
                },
            ],
            samples: [
                makeSample('S-1', [
                    makeSlide({ image_id: 'slide-1' }),
                    makeSlide({ image_id: 'slide-2', block_label: 'B1' }),
                ]),
            ],
        };

        const filtered = filterHierarchyToServableSlideIds(
            hierarchy,
            new Set(['slide-2'])
        );

        expect(filtered.samples).toHaveLength(1);
        expect(filtered.samples[0].parts[0].blocks).toHaveLength(1);
        expect(filtered.samples[0].parts[0].blocks[0].slides).toHaveLength(1);
        expect(filtered.samples[0].parts[0].blocks[0].slides[0].image_id).toBe(
            'slide-2'
        );
        expect(filtered.slide_associations).toEqual([
            {
                image_id: 'slide-2',
                sample_id: null,
                match_level: 'UNMATCHED',
                specimen_key: 'unmatched::1::B1',
                slide_type: 'H&E',
                can_serve_tiles: true,
            },
        ]);
    });

    it('returns cloned filtered hierarchies for the same hierarchy snapshot and allowed image ids', () => {
        const hierarchy: PatientHierarchy = {
            patient_id: 'P-1',
            slide_associations: [
                {
                    image_id: 'slide-1',
                    sample_id: 'S-1',
                    match_level: 'BLOCK',
                    specimen_key: 'block::1::A1',
                    slide_type: 'H&E',
                    can_serve_tiles: true,
                },
            ],
            samples: [makeSample('S-1', [makeSlide({ image_id: 'slide-1' })])],
        };

        const first = filterHierarchyToServableSlideIds(
            hierarchy,
            new Set(['slide-1'])
        );
        const second = filterHierarchyToServableSlideIds(
            hierarchy,
            new Set(['slide-1'])
        );

        expect(second).toEqual(first);
        expect(second).not.toBe(first);
    });

    it('reuses the same read-only filtered hierarchy for the same hierarchy snapshot and allowed image ids', () => {
        const hierarchy: PatientHierarchy = {
            patient_id: 'P-1',
            slide_associations: [
                {
                    image_id: 'slide-1',
                    sample_id: 'S-1',
                    match_level: 'BLOCK',
                    specimen_key: 'block::1::A1',
                    slide_type: 'H&E',
                    can_serve_tiles: true,
                },
            ],
            samples: [makeSample('S-1', [makeSlide({ image_id: 'slide-1' })])],
        };

        const first = filterHierarchyToServableSlideIdsReadOnly(
            hierarchy,
            new Set(['slide-1'])
        );
        const second = filterHierarchyToServableSlideIdsReadOnly(
            hierarchy,
            new Set(['slide-1'])
        );

        expect(second).toBe(first);
    });

    it('returns cloned cached filtered hierarchies after toggling between allowed image id sets', () => {
        const hierarchy: PatientHierarchy = {
            patient_id: 'P-1',
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
                    sample_id: 'S-1',
                    match_level: 'BLOCK',
                    specimen_key: 'block::1::B1',
                    slide_type: 'H&E',
                    can_serve_tiles: true,
                },
            ],
            samples: [
                makeSample('S-1', [
                    makeSlide({ image_id: 'slide-1' }),
                    makeSlide({ image_id: 'slide-2', block_label: 'B1' }),
                ]),
            ],
        };

        const first = filterHierarchyToServableSlideIds(
            hierarchy,
            new Set(['slide-1'])
        );
        const second = filterHierarchyToServableSlideIds(
            hierarchy,
            new Set(['slide-2'])
        );
        const third = filterHierarchyToServableSlideIds(
            hierarchy,
            new Set(['slide-1'])
        );

        expect(second.samples[0].parts[0].blocks[0].slides[0].image_id).toBe(
            'slide-2'
        );
        expect(third).toEqual(first);
        expect(third).not.toBe(first);
    });

    it('does not let callers mutate cached filtered hierarchies', () => {
        const hierarchy: PatientHierarchy = {
            patient_id: 'P-1',
            slide_associations: [
                {
                    image_id: 'slide-1',
                    sample_id: 'S-1',
                    match_level: 'BLOCK',
                    specimen_key: 'block::1::A1',
                    slide_type: 'H&E',
                    can_serve_tiles: true,
                },
            ],
            samples: [makeSample('S-1', [makeSlide({ image_id: 'slide-1' })])],
        };

        const first = filterHierarchyToServableSlideIds(
            hierarchy,
            new Set(['slide-1'])
        );
        first.samples[0].parts[0].blocks[0].slides.push(
            makeSlide({ image_id: 'slide-2' })
        );
        first.slide_associations!.push({
            image_id: 'slide-2',
            sample_id: 'S-1',
            match_level: 'BLOCK',
            specimen_key: 'block::1::B1',
            slide_type: 'H&E',
            can_serve_tiles: true,
        });

        const second = filterHierarchyToServableSlideIds(
            hierarchy,
            new Set(['slide-1'])
        );

        expect(
            second.samples[0].parts[0].blocks[0].slides.map(
                slide => slide.image_id
            )
        ).toEqual(['slide-1']);
        expect(second.slide_associations).toHaveLength(1);
    });

    it('recomputes the filtered hierarchy when samples change on the same hierarchy object', () => {
        const hierarchy: PatientHierarchy = {
            patient_id: 'P-1',
            slide_associations: [
                {
                    image_id: 'slide-1',
                    sample_id: 'S-1',
                    match_level: 'BLOCK',
                    specimen_key: 'block::1::A1',
                    slide_type: 'H&E',
                    can_serve_tiles: true,
                },
            ],
            samples: [makeSample('S-1', [makeSlide({ image_id: 'slide-1' })])],
        };

        const first = filterHierarchyToServableSlideIds(
            hierarchy,
            new Set(['slide-1'])
        );
        hierarchy.samples = [
            makeSample('S-1', [
                makeSlide({ image_id: 'slide-1' }),
                makeSlide({ image_id: 'slide-2', block_label: 'B1' }),
            ]),
        ];
        hierarchy.slide_associations = [
            ...hierarchy.slide_associations!,
            {
                image_id: 'slide-2',
                sample_id: 'S-1',
                match_level: 'BLOCK',
                specimen_key: 'block::1::B1',
                slide_type: 'H&E',
                can_serve_tiles: true,
            },
        ];
        const second = filterHierarchyToServableSlideIds(
            hierarchy,
            new Set(['slide-1', 'slide-2'])
        );

        expect(second).not.toBe(first);
        expect(
            second.samples[0].parts[0].blocks.flatMap(block => block.slides)
        ).toHaveLength(2);
        expect(
            second.samples[0].parts[0].blocks
                .flatMap(block => block.slides)
                .map(slide => slide.image_id)
        ).toEqual(['slide-1', 'slide-2']);
    });

    it('recomputes the filtered hierarchy when sample parts change in place', () => {
        const hierarchy: PatientHierarchy = {
            patient_id: 'P-1',
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
                    sample_id: 'S-1',
                    match_level: 'BLOCK',
                    specimen_key: 'block::1::B1',
                    slide_type: 'H&E',
                    can_serve_tiles: true,
                },
            ],
            samples: [makeSample('S-1', [makeSlide({ image_id: 'slide-1' })])],
        };

        const first = filterHierarchyToServableSlideIds(
            hierarchy,
            new Set(['slide-1', 'slide-2'])
        );

        hierarchy.samples[0].parts = [
            {
                ...hierarchy.samples[0].parts[0],
                blocks: [
                    ...hierarchy.samples[0].parts[0].blocks,
                    {
                        block_number: '2',
                        block_label: 'B1',
                        slides: [makeSlide({ image_id: 'slide-2' })],
                    },
                ],
            },
        ];

        const second = filterHierarchyToServableSlideIds(
            hierarchy,
            new Set(['slide-1', 'slide-2'])
        );

        expect(second).not.toBe(first);
        expect(
            second.samples[0].parts[0].blocks
                .flatMap(block => block.slides)
                .map(slide => slide.image_id)
        ).toEqual(['slide-1', 'slide-2']);
    });

    it('recomputes the filtered hierarchy when a slide association mutates in place', () => {
        const hierarchy: PatientHierarchy = {
            patient_id: 'P-1',
            slide_associations: [
                {
                    image_id: 'slide-1',
                    sample_id: 'S-1',
                    match_level: 'BLOCK',
                    specimen_key: 'block::1::A1',
                    slide_type: 'H&E',
                    can_serve_tiles: true,
                },
            ],
            samples: [makeSample('S-1', [makeSlide({ image_id: 'slide-1' })])],
        };

        const first = filterHierarchyToServableSlideIds(
            hierarchy,
            new Set(['slide-1'])
        );
        hierarchy.slide_associations![0].can_serve_tiles = false;
        const second = filterHierarchyToServableSlideIds(
            hierarchy,
            new Set(['slide-1'])
        );

        expect(second).not.toBe(first);
        expect(second.slide_associations).toEqual([]);
    });
});
