import { formatSampleSlideDateLine } from './wsiSlideDateDisplayUtils';
import { Sample, Slide } from './wsiViewerTypes';

function makeSlide(overrides?: Partial<Slide>): Slide {
    return {
        image_id: '2182891',
        stain_name: 'H&E',
        stain_group: '',
        is_hne: true,
        is_ihc: false,
        magnification: '20',
        file_size_bytes: '1',
        can_serve_tiles: true,
        barcode: 'S-12345-T01-IM3-001-001',
        block_label: '1',
        block_number: '1',
        ...overrides,
    };
}

function makeSample(slides: Slide[]): Sample {
    return {
        sample_id: 'P-1-T01-IM3',
        cancer_type: '',
        cancer_type_detailed: '',
        oncotree_code: '',
        primary_site: '',
        sample_type: '',
        parts: [
            {
                part_number: '1',
                part_designator: '',
                part_type: '',
                part_description: '',
                subspecialty: '',
                path_dx_title: '',
                blocks: [
                    {
                        block_number: '1',
                        block_label: '1',
                        slides,
                    },
                ],
            },
        ],
    };
}

describe('wsiSlideDateDisplayUtils', () => {
    it('formats a slide date line with stain, block, and relative date', () => {
        const sample = makeSample([
            makeSlide({
                slide_timepoint_days: -33,
                slide_timepoint_source: 'Procedure date',
            }),
        ]);

        expect(
            formatSampleSlideDateLine(
                sample.parts[0].blocks[0].slides[0],
                sample
            )
        ).toBe('Slide 2182891 (H&E, block 1): Proc d-33');
    });
});
