import {
    clearWsiSlideSources,
    getWsiSlideSource,
    registerWsiSlideSources,
    wsiSlideRegistryGeneration,
} from './wsiAuth';
import {
    makeTileMetadata,
    registerTestSlide,
    TEST_SEALED_SOURCE,
} from './wsiTestFixtures';

function hierarchy(
    slideKeys: string[],
    slideOverrides: Record<string, unknown> = {}
): any {
    return {
        patient_id: 'patient-1',
        samples: [
            {
                sample_id: 'S-1',
                parts: [
                    {
                        blocks: [
                            {
                                slides: slideKeys.map(slideKey => ({
                                    slide_key: slideKey,
                                    resource_id: 'WSI_SAMPLE',
                                    serving_key: slideKey,
                                    sealed_source: TEST_SEALED_SOURCE,
                                    tile_metadata: makeTileMetadata(),
                                    ...slideOverrides,
                                })),
                            },
                        ],
                    },
                ],
            },
        ],
    };
}

describe('WSI slide sources', () => {
    beforeEach(() => {
        clearWsiSlideSources();
        global.fetch = jest.fn() as typeof fetch;
    });

    it('returns the serving fields of a registered slide without any request', () => {
        registerTestSlide('study-1', 'patient-1', 'slide-1');

        expect(getWsiSlideSource('study-1', 'slide-1')).toEqual({
            slideKey: 'slide-1',
            servingKey: 'slide-1',
            sealedSource: TEST_SEALED_SOURCE,
            tileMetadata: makeTileMetadata(),
        });
        expect(global.fetch).not.toHaveBeenCalled();
    });

    it('rejects tile metadata with a non-current decode policy', () => {
        registerWsiSlideSources(
            'study-1',
            hierarchy(['slide-1'], {
                tile_metadata: makeTileMetadata({
                    decode_policy_version:
                        'geometry-v2;tile-max=4194304;thumbnail-max=4194304',
                    max_decode_pixels: 4194304,
                    thumbnail_max_decode_pixels: 4194304,
                }),
            })
        );

        expect(() => getWsiSlideSource('study-1', 'slide-1')).toThrow(
            'Invalid WSI decode policy'
        );
    });

    it('rejects tile metadata without the schema version', () => {
        const { tile_metadata_schema_version, ...legacy } = makeTileMetadata();
        registerWsiSlideSources(
            'study-1',
            hierarchy(['slide-1'], { tile_metadata: legacy })
        );

        expect(() => getWsiSlideSource('study-1', 'slide-1')).toThrow(
            'Invalid WSI tile metadata schema'
        );
    });

    it('rejects an unknown slide', () => {
        registerWsiSlideSources('study-1', hierarchy(['slide-1']));

        expect(() => getWsiSlideSource('study-1', 'unknown-slide')).toThrow(
            'WSI resource selection is unavailable'
        );
        expect(() => getWsiSlideSource('other-study', 'slide-1')).toThrow(
            'WSI resource selection is unavailable'
        );
    });

    it('replaces every slide of a patient on re-registration', () => {
        registerWsiSlideSources('study-1', hierarchy(['slide-1', 'slide-2']));
        registerWsiSlideSources('study-1', hierarchy(['slide-1']));

        expect(getWsiSlideSource('study-1', 'slide-1').slideKey).toBe(
            'slide-1'
        );
        expect(() => getWsiSlideSource('study-1', 'slide-2')).toThrow(
            'WSI resource selection is unavailable'
        );
    });

    it('skips registration captured before a clear', () => {
        const generation = wsiSlideRegistryGeneration();
        clearWsiSlideSources('other-study');

        expect(
            registerWsiSlideSources(
                'study-1',
                hierarchy(['slide-1']),
                generation
            )
        ).toBe(false);
        expect(() => getWsiSlideSource('study-1', 'slide-1')).toThrow(
            'WSI resource selection is unavailable'
        );

        expect(
            registerWsiSlideSources(
                'study-1',
                hierarchy(['slide-1']),
                wsiSlideRegistryGeneration()
            )
        ).toBe(true);
        expect(getWsiSlideSource('study-1', 'slide-1').slideKey).toBe(
            'slide-1'
        );
    });

    it('does not advance the generation when registering', () => {
        const generation = wsiSlideRegistryGeneration();
        registerWsiSlideSources('study-1', hierarchy(['slide-1']));
        registerWsiSlideSources('study-1', hierarchy(['slide-2']));

        expect(wsiSlideRegistryGeneration()).toBe(generation);
    });

    it('forgets the slides of one study only', () => {
        registerWsiSlideSources('study-1', hierarchy(['slide-1']));
        registerWsiSlideSources('study-2', hierarchy(['slide-1']));

        clearWsiSlideSources('study-1');

        expect(() => getWsiSlideSource('study-1', 'slide-1')).toThrow(
            'WSI resource selection is unavailable'
        );
        expect(getWsiSlideSource('study-2', 'slide-1').slideKey).toBe(
            'slide-1'
        );
    });

    it.each(['serving_key', 'sealed_source', 'tile_metadata'])(
        'rejects a slide without %s',
        field => {
            registerWsiSlideSources(
                'study-1',
                hierarchy(['slide-1'], { [field]: undefined })
            );

            expect(() => getWsiSlideSource('study-1', 'slide-1')).toThrow(
                'WSI slide cannot serve tiles'
            );
        }
    );
});
