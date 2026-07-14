import {
    countServableBlocksForSample,
    countServableSlidesForSample,
    getOrderedServableSlidesForSample,
    getServableSlideCountsForHierarchy,
    getServableSlideEntriesForHierarchy,
    getServableSlidesForSample,
    sampleHasMultiplePartDescriptions,
    sampleHasServableSlide,
} from './wsiSlideUtils';
import { PatientHierarchy, Sample, Slide } from './wsiViewerTypes';

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
    it('reuses the same servable slide array when only sample metadata changes', () => {
        const sample = makeSample('S-1', [
            makeSlide({ image_id: 'slide-1' }),
            makeSlide({ image_id: 'slide-2', is_hne: false, is_ihc: true }),
        ]);

        const first = getServableSlidesForSample(sample);
        sample.sample_type = 'Metastasis';
        sample.tmb_score = '5.4';
        const second = getServableSlidesForSample(sample);

        expect(second).toBe(first);
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

    it('reuses the same hierarchy entry array while the samples reference is unchanged', () => {
        const hierarchy: PatientHierarchy = {
            patient_id: 'P-1',
            samples: [makeSample('S-1', [makeSlide({ image_id: 'slide-1' })])],
        };

        const first = getServableSlideEntriesForHierarchy(hierarchy);
        hierarchy.samples[0].sample_type = 'Metastasis';
        const second = getServableSlideEntriesForHierarchy(hierarchy);

        expect(second).toBe(first);

        hierarchy.samples = [
            ...hierarchy.samples,
            makeSample('S-2', [makeSlide({ image_id: 'slide-2' })]),
        ];
        const third = getServableSlideEntriesForHierarchy(hierarchy);

        expect(third).not.toBe(first);
        expect(third).toHaveLength(2);
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
        const sample2 = makeSample('S-2', [
            makeSlide({ image_id: 'slide-3' }),
        ]);
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

    it('caches ordered servable slides with normalized block labels', () => {
        const sample = makeSample('S-1', [makeSlide({ image_id: 'slide-hne' })]);
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

        expect(second).toBe(first);
        expect(first.map(entry => [entry.slide.image_id, entry.blockLabel])).toEqual([
            ['slide-hne', 'A1'],
            ['slide-ihc', 'B1'],
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
