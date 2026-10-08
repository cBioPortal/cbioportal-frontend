/**
 * @jest-environment jsdom
 */
import * as React from 'react';
import { action } from 'mobx';
import TestRenderer from 'react-test-renderer';
import WSIViewer from './WSIViewer';
import { readWsiHashState } from './wsiViewStateUtils';

jest.mock('./wsiOpenSeadragonLoader', () => ({
    loadOpenSeadragon: jest.fn(),
    hasPreloadedOpenSeadragon: () => false,
}));

function makeInstance(
    url = 'https://tiles.example.com/patient/P-1',
    extraProps: Record<string, unknown> = {}
) {
    return new (WSIViewer as any)({
        tileServerUrl: url.replace(/\/patient\/[^/]+\/?$/, ''),
        hierarchyUrl: `/api/wsi/v2/hierarchy/study/P-1`,
        patientId: 'P-1',
        height: 500,
        ...extraProps,
    });
}

function makeSlide(slide_key: string, can_serve_tiles = true): any {
    return {
        slide_key,
        stain_name: 'H&E',
        stain_group: 'Histology',
        is_hne: true,
        is_ihc: false,
        magnification: '20x',
        file_size_bytes: '1000',
        can_serve_tiles,
        block_label: 'A1',
        block_number: '1',
    };
}

function makeHierarchy(slides: any[]): any {
    return {
        patient_id: 'P-1',
        samples: [
            {
                sample_id: 'S-1',
                cancer_type: 'Colon Cancer',
                cancer_type_detailed: 'Colon Adenocarcinoma',
                oncotree_code: 'COAD',
                primary_site: 'Colon',
                sample_type: 'Primary',
                parts: [
                    {
                        part_number: '1',
                        part_type: 'Resection',
                        part_description: 'Colon',
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
            },
        ],
    };
}

describe('WSIViewer foundation behavior', () => {
    afterEach(() => {
        window.location.hash = '';
    });

    it.each([
        [
            'removes a patient suffix',
            'https://tiles.example.com/patient/P-1',
            'https://tiles.example.com',
        ],
        [
            'preserves a path prefix',
            'https://tiles.example.com/api/v1/patient/P-1/',
            'https://tiles.example.com/api/v1',
        ],
        [
            'leaves an unscoped URL unchanged',
            'https://tiles.example.com',
            'https://tiles.example.com',
        ],
    ])('%s', (_name, url, expected) => {
        expect(makeInstance(url as string).tileServerBase).toBe(expected);
    });

    it('flattens only servable slides and removes duplicate slide keys', () => {
        const instance = makeInstance();
        const slide = makeSlide('slide-a');
        instance.hierarchy = makeHierarchy([
            slide,
            { ...slide },
            makeSlide('slide-b', false),
        ]);

        expect(
            instance.servableSlides.map((entry: any) => entry.slide.slide_key)
        ).toEqual(['slide-a']);
        expect(instance.servableSlides[0].sample.sample_id).toBe('S-1');
    });

    it('returns an empty slide list before hierarchy data is loaded', () => {
        expect(makeInstance().servableSlides).toEqual([]);
    });

    it('renders loading and failure states without a hierarchy', () => {
        const instance = makeInstance();
        expect(
            TestRenderer.create(instance.render()).root.findByType('div')
        ).toBeTruthy();

        action(() => {
            instance.loading = false;
            instance.error = 'Hierarchy unavailable';
        })();
        const error = TestRenderer.create(instance.render());
        expect(error.root.findByType('div').children.join('')).toContain(
            'Hierarchy unavailable'
        );
    });

    it('parses a deep-link hash for a slide and viewport', () => {
        window.location.hash = '#wsi:slide=slide-a&x=120&y=240&z=3';
        expect(readWsiHashState()).toEqual({
            slideId: 'slide-a',
            x: 120,
            y: 240,
            z: 3,
        });
    });

    it('rejects unrelated or incomplete hashes', () => {
        window.location.hash = '#other=value';
        expect(readWsiHashState()).toBeNull();
        window.location.hash = '#wsi:slide=slide-a&x=bad&y=2&z=1';
        expect(readWsiHashState()).toBeNull();
    });

    it('parses a coordinate-less selection hash', () => {
        window.location.hash = '#wsi:slide=slide-a';
        expect(readWsiHashState()).toEqual({ slideId: 'slide-a' });
    });

    describe('requested slideKey', () => {
        const slides = () => [
            makeSlide('slide-a'),
            makeSlide('slide id/b #2'),
            makeSlide('slide-c'),
        ];

        function loadedInstance(requestedSlideKey?: string) {
            const instance = makeInstance(undefined, { requestedSlideKey });
            action(() => {
                instance.hierarchy = makeHierarchy(slides());
                instance.loading = false;
            })();
            return instance;
        }

        it('selects the requested slide, including encoded IDs', () => {
            const instance = loadedInstance('slide id/b #2');

            expect(
                instance.chooseInitialServableSlide(instance.servableSlides)
                    .slide.slide_key
            ).toBe('slide id/b #2');
            expect(instance.requestedSlideUnavailable).toBe(false);
        });

        it('lets a hash selection win over the requested slide', () => {
            const instance = loadedInstance('slide id/b #2');
            window.location.hash = '#wsi:slide=slide-c&x=10&y=20&z=1';

            expect(
                instance.chooseInitialServableSlide(instance.servableSlides)
                    .slide.slide_key
            ).toBe('slide-c');
        });

        it('shows a notice and the default slide for an unknown ID', () => {
            const instance = loadedInstance('missing-slide');

            expect(
                instance.chooseInitialServableSlide(instance.servableSlides)
                    .slide.slide_key
            ).toBe('slide-a');
            expect(instance.requestedSlideUnavailable).toBe(true);
            const rendered = TestRenderer.create(instance.render());
            const notice = rendered.root.findByProps({
                'data-testid': 'wsi-requested-slide-unavailable',
            });
            expect(notice.findByType('span').children.join('')).toContain(
                'The requested slide is not available'
            );
        });

        it('treats a non-servable requested slide as unavailable', () => {
            const instance = makeInstance(undefined, {
                requestedSlideKey: 'slide-x',
            });
            action(() => {
                instance.hierarchy = makeHierarchy([
                    makeSlide('slide-a'),
                    makeSlide('slide-x', false),
                ]);
            })();

            expect(instance.requestedSlideUnavailable).toBe(true);
        });

        it('shows no notice without a requested slide', () => {
            expect(loadedInstance().requestedSlideUnavailable).toBe(false);
        });
    });

    describe('linked sample scope', () => {
        function scopedInstance(pathologyFilter?: Record<string, string>) {
            const instance = makeInstance(undefined, { pathologyFilter });
            action(() => {
                instance.hierarchy = makeHierarchy([makeSlide('slide-a')]);
                instance.loading = false;
            })();
            return instance;
        }

        it('scopes the slide list to a sample-only link', () => {
            const instance = scopedInstance({ sampleId: 'S-1' });
            expect(instance.scopedSampleId).toBe('S-1');
            const rendered = TestRenderer.create(instance.render());
            expect(
                rendered.root.findAllByProps({
                    'data-testid': 'wsi-sample-scope',
                })
            ).toHaveLength(1);
        });

        it('does not hide other samples for a specimen or match-level link', () => {
            expect(
                scopedInstance({ sampleId: 'S-1', matchLevel: 'PART' })
                    .scopedSampleId
            ).toBeUndefined();
            expect(
                scopedInstance({ sampleId: 'S-1', specimenKey: 'part::1' })
                    .scopedSampleId
            ).toBeUndefined();
            expect(scopedInstance().scopedSampleId).toBeUndefined();
        });

        it('drops the scope once the link scope is cleared', () => {
            const instance = scopedInstance({ sampleId: 'S-1' });
            action(() => {
                instance.linkoutScopeActive = false;
            })();
            expect(instance.scopedSampleId).toBeUndefined();
        });
    });
});
