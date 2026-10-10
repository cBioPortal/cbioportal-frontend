import { chooseInitialServableSlide } from './wsiInitialSlideUtils';
import { makeSample, makeSlide } from './wsiTestFixtures';

describe('chooseInitialServableSlide', () => {
    it('prefers an explicit preferred slide id', () => {
        const sample = makeSample('S-1', [], { parts: [] });
        const first = { slide: makeSlide({ slide_key: 'A' }), sample };
        const second = { slide: makeSlide({ slide_key: 'B' }), sample };

        expect(
            chooseInitialServableSlide([first, second], {
                preferredSlideId: 'B',
                stainFilter: 'all',
            })
        ).toBe(second);
    });

    it('prefers a matching-stain slide from the preferred sample', () => {
        const preferred = makeSample('S-preferred', [], { parts: [] });
        const other = makeSample('S-other', [], { parts: [] });
        const entries = [
            { slide: makeSlide({ slide_key: 'A' }), sample: other },
            {
                slide: makeSlide({
                    slide_key: 'B',
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
        const sample = makeSample('S-1', [], { parts: [] });
        const entries = [
            {
                slide: makeSlide({
                    slide_key: 'B',
                    is_hne: false,
                    is_ihc: true,
                    stain_name: 'IHC',
                }),
                sample,
            },
            { slide: makeSlide({ slide_key: 'A' }), sample },
        ];

        expect(
            chooseInitialServableSlide(entries, {
                stainFilter: 'ihc',
            })
        ).toBe(entries[0]);
    });

    it('falls back to an H&E slide from the preferred sample before leaving that sample', () => {
        const preferred = makeSample('S-preferred', [], { parts: [] });
        const other = makeSample('S-other', [], { parts: [] });
        const entries = [
            {
                slide: makeSlide({
                    slide_key: 'global-ihc',
                    is_hne: false,
                    is_ihc: true,
                    stain_name: 'IHC',
                }),
                sample: other,
            },
            {
                slide: makeSlide({ slide_key: 'preferred-hne' }),
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
        const sample = makeSample('S-1', [], { parts: [] });
        const entries = [
            { slide: makeSlide({ slide_key: 'hidden' }), sample },
            { slide: makeSlide({ slide_key: 'visible-1' }), sample },
            { slide: makeSlide({ slide_key: 'visible-2' }), sample },
        ];

        expect(
            chooseInitialServableSlide(entries, {
                preferredSlideId: 'hidden',
                stainFilter: 'all',
                matchesEntry: entry => entry.slide.slide_key !== 'hidden',
            })
        ).toBe(entries[1]);
    });

    it('returns undefined when every entry fails the matching predicate', () => {
        const sample = makeSample('S-1', [], { parts: [] });
        const entries = [
            { slide: makeSlide({ slide_key: 'A' }), sample },
            { slide: makeSlide({ slide_key: 'B' }), sample },
        ];

        expect(
            chooseInitialServableSlide(entries, {
                stainFilter: 'all',
                matchesEntry: () => false,
            })
        ).toBeUndefined();
    });

    it('does not return a rejected preferred slide during stain fallback', () => {
        const sample = makeSample('S-1', [], { parts: [] });
        const rejectedPreferred = {
            slide: makeSlide({ slide_key: 'rejected-preferred' }),
            sample,
        };
        const accepted = {
            slide: makeSlide({
                slide_key: 'accepted',
                is_hne: false,
                is_ihc: true,
                stain_name: 'IHC',
            }),
            sample,
        };

        expect(
            chooseInitialServableSlide([rejectedPreferred, accepted], {
                preferredSlideId: 'rejected-preferred',
                stainFilter: 'hne',
                matchesEntry: entry => entry === accepted,
            })
        ).toBe(accepted);
    });
});

describe('chooseInitialServableSlide requested image', () => {
    const preferred = makeSample('S-preferred', [], { parts: [] });
    const other = makeSample('S-other', [], { parts: [] });
    const hne = { slide: makeSlide({ slide_key: 'A' }), sample: preferred };
    const encoded = {
        slide: makeSlide({
            slide_key: 'slide id/2 #x',
            is_hne: false,
            is_ihc: true,
            stain_name: 'IHC',
        }),
        sample: other,
    };
    const third = { slide: makeSlide({ slide_key: 'C' }), sample: other };

    it('selects the requested image over the default ranking', () => {
        expect(
            chooseInitialServableSlide([hne, encoded, third], {
                preferredSampleId: 'S-preferred',
                requestedSlideKey: 'slide id/2 #x',
                stainFilter: 'hne',
            })
        ).toBe(encoded);
    });

    it('lets the hash slide win over the requested image', () => {
        expect(
            chooseInitialServableSlide([hne, encoded, third], {
                preferredSlideId: 'C',
                requestedSlideKey: 'slide id/2 #x',
                stainFilter: 'all',
            })
        ).toBe(third);
    });

    it('uses the requested image when the hash slide is unknown', () => {
        expect(
            chooseInitialServableSlide([hne, encoded, third], {
                preferredSlideId: 'missing',
                requestedSlideKey: 'C',
                stainFilter: 'all',
            })
        ).toBe(third);
    });

    it('falls back to the default slide for an unknown requested image', () => {
        expect(
            chooseInitialServableSlide([encoded, hne, third], {
                preferredSampleId: 'S-preferred',
                requestedSlideKey: 'missing',
                stainFilter: 'all',
            })
        ).toBe(hne);
    });

    it('ignores a requested image excluded by the entry filter', () => {
        expect(
            chooseInitialServableSlide([hne, encoded, third], {
                requestedSlideKey: 'slide id/2 #x',
                stainFilter: 'all',
                matchesEntry: entry => entry.sample === preferred,
            })
        ).toBe(hne);
    });
});
