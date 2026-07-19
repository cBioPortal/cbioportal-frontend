import {
    chooseInitialMatchingServableSlide,
    chooseInitialServableSlide,
} from './wsiInitialSlideUtils';
import { Sample, Slide } from './wsiViewerTypes';

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

function makeSample(sampleId: string): Sample {
    return {
        sample_id: sampleId,
        cancer_type: '',
        cancer_type_detailed: '',
        oncotree_code: '',
        primary_site: '',
        sample_type: 'Primary',
        parts: [],
    };
}

describe('chooseInitialServableSlide', () => {
    it('prefers an explicit preferred slide id', () => {
        const sample = makeSample('S-1');
        const first = { slide: makeSlide({ image_id: 'A' }), sample };
        const second = { slide: makeSlide({ image_id: 'B' }), sample };

        expect(
            chooseInitialServableSlide([first, second], {
                preferredSlideId: 'B',
                stainFilter: 'all',
            })
        ).toBe(second);
    });

    it('prefers a matching-stain slide from the preferred sample', () => {
        const preferred = makeSample('S-preferred');
        const other = makeSample('S-other');
        const entries = [
            { slide: makeSlide({ image_id: 'A' }), sample: other },
            {
                slide: makeSlide({
                    image_id: 'B',
                    is_hne: false,
                    is_ihc: true,
                    stain_name: 'IHC',
                }),
                sample: preferred,
            },
        ];

        expect(
            chooseInitialServableSlide(entries, {
                preferredSampleId: 'S-preferred',
                stainFilter: 'ihc',
            })
        ).toBe(entries[1]);
    });

    it('falls back to a global H&E slide when the requested stain is unavailable', () => {
        const sample = makeSample('S-1');
        const entries = [
            {
                slide: makeSlide({
                    image_id: 'B',
                    is_hne: false,
                    is_ihc: true,
                    stain_name: 'IHC',
                }),
                sample,
            },
            { slide: makeSlide({ image_id: 'A' }), sample },
        ];

        expect(
            chooseInitialServableSlide(entries, {
                stainFilter: 'ihc',
            })
        ).toBe(entries[0]);
    });

    it('falls back to an H&E slide from the preferred sample before leaving that sample', () => {
        const preferred = makeSample('S-preferred');
        const other = makeSample('S-other');
        const entries = [
            {
                slide: makeSlide({
                    image_id: 'global-ihc',
                    is_hne: false,
                    is_ihc: true,
                    stain_name: 'IHC',
                }),
                sample: other,
            },
            {
                slide: makeSlide({ image_id: 'preferred-hne' }),
                sample: preferred,
            },
        ];

        expect(
            chooseInitialServableSlide(entries, {
                preferredSampleId: 'S-preferred',
                stainFilter: 'ihc',
            })
        ).toBe(entries[1]);
    });

    it('does not return a preferred slide id when that entry is filtered out', () => {
        const sample = makeSample('S-1');
        const entries = [
            { slide: makeSlide({ image_id: 'hidden' }), sample },
            { slide: makeSlide({ image_id: 'visible-1' }), sample },
            { slide: makeSlide({ image_id: 'visible-2' }), sample },
        ];

        expect(
            chooseInitialMatchingServableSlide(entries, {
                preferredSlideId: 'hidden',
                stainFilter: 'all',
                matchesEntry: entry => entry.slide.image_id !== 'hidden',
            })
        ).toBe(entries[1]);
    });
});
