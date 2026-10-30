import {
    compareSlidesInSample,
    getOrderedServableSlidesForSampleReadOnly,
    getServableSlideIdsForPathologyFilterReadOnly,
    sampleHasMultiplePartDescriptions,
    sampleHasServableSlide,
} from './wsiSlideUtils';
import { makeSample, makeSlide } from './wsiTestFixtures';
import { PatientHierarchy, Sample, Slide } from './wsiViewerTypes';

describe('wsiSlideUtils read-only slide derivation', () => {
    it('memoizes servable slides by sample identity', () => {
        const sample = makeSample('S-1', [makeSlide({ slide_key: 'slide-1' })]);
        const first = getOrderedServableSlidesForSampleReadOnly(sample);

        expect(getOrderedServableSlidesForSampleReadOnly(sample)).toBe(first);
        expect(
            getOrderedServableSlidesForSampleReadOnly(
                makeSample('S-1', [
                    makeSlide({ slide_key: 'slide-1', can_serve_tiles: false }),
                ])
            )
        ).toEqual([]);
    });

    it('orders slides by part, then block, then H&E first', () => {
        const slide = (key: string, blockNumber: string, isHne: boolean) =>
            makeSlide({
                slide_key: key,
                block_number: blockNumber,
                stain_name: isHne ? 'H&E' : 'CD3',
                stain_kind: isHne ? 'hne' : 'ihc',
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
                stain_kind: 'unknown',
            }),
            makeSlide({
                slide_key: 'cd3',
                stain_name: 'CD3',
                stain_kind: 'unknown',
            }),
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

    it('filters pathology slides by their own placement fields', () => {
        const hierarchy: PatientHierarchy = {
            patient_id: 'P-1',
            samples: [
                makeSample('S-1', [
                    makeSlide({
                        slide_key: 'slide-1',
                        sample_id: 'S-1',
                        match_level: 'BLOCK',
                        specimen_key: 'block::1::A1',
                    }),
                ]),
                makeSample('UNMATCHED', [
                    makeSlide({
                        slide_key: 'slide-2',
                        sample_id: null,
                        match_level: 'UNMATCHED',
                        specimen_key: 'unmatched::1::B1',
                    }),
                ]),
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
                    makeSlide({
                        slide_key: 'source-slide',
                        sample_id: null,
                        match_level: 'BLOCK',
                        specimen_key: 'block::part:1::block:S16-1681/1-4TC',
                        block_number: 'S16-1681/1-4TC',
                        block_label: '4TC',
                    }),
                ]),
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

    it('memoizes pathology filter results per hierarchy and filter', () => {
        const hierarchy: PatientHierarchy = {
            patient_id: 'P-1',
            samples: [
                makeSample('UNMATCHED', [
                    makeSlide({
                        slide_key: 'slide-1',
                        sample_id: null,
                        match_level: 'PART',
                        specimen_key: 'part::1',
                    }),
                    makeSlide({
                        slide_key: 'slide-2',
                        sample_id: null,
                        match_level: 'BLOCK',
                        specimen_key: 'block::1::A1',
                    }),
                ]),
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
