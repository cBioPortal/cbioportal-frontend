import {
    compareSamplesByTimepoint,
    procedureSlideTimepointText,
    timepointText,
} from './wsiNavUtils';
import { Sample } from './wsiViewerTypes';

function makeSample(
    overrides: Partial<Sample> & Record<string, unknown> = {}
): Sample {
    return {
        sample_id: 'S-1',
        cancer_type: '',
        cancer_type_detailed: '',
        oncotree_code: '',
        primary_site: '',
        sample_type: '',
        parts: [],
        ...overrides,
    };
}

describe('wsiNavUtils', () => {
    describe('timepoint text helpers', () => {
        it('suppresses sequencing-only timepoints from the displayed text', () => {
            expect(timepointText(-12, 'Sequencing date')).toBeNull();
        });

        it('shows only procedure-based slide timepoints in the procedure-specific helper', () => {
            expect(
                procedureSlideTimepointText({
                    slide_timepoint_days: -9,
                    slide_timepoint_source: 'Procedure date',
                })
            ).toBe('Proc d-9');

            expect(
                procedureSlideTimepointText({
                    slide_timepoint_days: -9,
                    slide_timepoint_source: 'Tumor sequencing date',
                })
            ).toBeNull();
        });

        it('recomputes the cached procedure slide timepoint text when the slide changes in place', () => {
            const slide = {
                slide_timepoint_days: -9,
                slide_timepoint_source: 'Procedure date',
            };

            expect(procedureSlideTimepointText(slide)).toBe('Proc d-9');

            slide.slide_timepoint_days = -2;
            expect(procedureSlideTimepointText(slide)).toBe('Proc d-2');

            slide.slide_timepoint_source = 'Tumor sequencing date';
            expect(procedureSlideTimepointText(slide)).toBeNull();
        });
    });

    describe('compareSamplesByTimepoint', () => {
        it('sorts by earliest servable diagnostic slide timepoint before sample-level timepoint', () => {
            const earlierSlideSample = makeSample({
                sample_id: 'S-early',
                sample_timepoint_days: 20,
                sample_timepoint_source: 'Procedure date',
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
                                        image_id: 'img-1',
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
                                        slide_timepoint_days: -25,
                                        slide_timepoint_source:
                                            'Procedure date',
                                    },
                                ],
                            },
                        ],
                    },
                ],
            });
            const laterSample = makeSample({
                sample_id: 'S-late',
                sample_timepoint_days: -10,
                sample_timepoint_source: 'Procedure date',
            });

            expect(
                compareSamplesByTimepoint(earlierSlideSample, laterSample)
            ).toBeLessThan(0);
        });

        it('ignores non-viewable and unclassified slides when deriving sample sort order', () => {
            const sampleWithIgnoredSlides = makeSample({
                sample_id: 'S-a',
                sample_timepoint_days: -5,
                sample_timepoint_source: 'Procedure date',
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
                                        image_id: 'img-ns',
                                        stain_name: 'H&E',
                                        stain_group: 'H&E (Initial)',
                                        is_hne: true,
                                        is_ihc: false,
                                        magnification: '',
                                        file_size_bytes: '',
                                        can_serve_tiles: false,
                                        barcode: '',
                                        block_label: 'A1',
                                        block_number: '1',
                                        slide_timepoint_days: -30,
                                        slide_timepoint_source:
                                            'Procedure date',
                                    },
                                    {
                                        image_id: 'img-other',
                                        stain_name: 'Slides submitted',
                                        stain_group: 'Slides submitted',
                                        is_hne: false,
                                        is_ihc: false,
                                        magnification: '',
                                        file_size_bytes: '',
                                        can_serve_tiles: true,
                                        barcode: '',
                                        block_label: 'A2',
                                        block_number: '2',
                                        slide_timepoint_days: -40,
                                        slide_timepoint_source:
                                            'Procedure date',
                                    },
                                ],
                            },
                        ],
                    },
                ],
            });
            const sampleWithEarlierSampleTime = makeSample({
                sample_id: 'S-b',
                sample_timepoint_days: -10,
                sample_timepoint_source: 'Procedure date',
            });

            expect(
                compareSamplesByTimepoint(
                    sampleWithIgnoredSlides,
                    sampleWithEarlierSampleTime
                )
            ).toBeLessThan(0);
        });

        it('recomputes the cached earliest servable slide timepoint when the sample parts array changes', () => {
            const sample = makeSample({
                sample_id: 'S-cache',
                sample_timepoint_days: -5,
                sample_timepoint_source: 'Procedure date',
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
                                        image_id: 'img-1',
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
                                        slide_timepoint_days: -20,
                                        slide_timepoint_source:
                                            'Procedure date',
                                    },
                                ],
                            },
                        ],
                    },
                ],
            });
            const comparator = makeSample({
                sample_id: 'S-compare',
                sample_timepoint_days: -10,
                sample_timepoint_source: 'Procedure date',
            });

            expect(compareSamplesByTimepoint(sample, comparator)).toBeLessThan(
                0
            );

            sample.parts = [
                {
                    ...sample.parts[0],
                    blocks: [
                        {
                            ...sample.parts[0].blocks[0],
                            slides: [
                                {
                                    ...sample.parts[0].blocks[0].slides[0],
                                    slide_timepoint_days: 5,
                                },
                            ],
                        },
                    ],
                },
            ];

            expect(compareSamplesByTimepoint(sample, comparator)).toBeLessThan(
                0
            );
        });

        it('recomputes the cached earliest servable slide timepoint when a slide timepoint mutates in place', () => {
            const sample = makeSample({
                sample_id: 'S-cache-in-place',
                sample_timepoint_days: -5,
                sample_timepoint_source: 'Procedure date',
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
                                        image_id: 'img-1',
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
                                        slide_timepoint_days: -20,
                                        slide_timepoint_source:
                                            'Procedure date',
                                    },
                                ],
                            },
                        ],
                    },
                ],
            });
            const comparator = makeSample({
                sample_id: 'S-compare',
                sample_timepoint_days: -10,
                sample_timepoint_source: 'Procedure date',
            });

            expect(compareSamplesByTimepoint(sample, comparator)).toBeLessThan(
                0
            );

            sample.parts[0].blocks[0].slides[0].slide_timepoint_days = 5;

            expect(compareSamplesByTimepoint(sample, comparator)).toBeLessThan(
                0
            );
        });
    });
});
