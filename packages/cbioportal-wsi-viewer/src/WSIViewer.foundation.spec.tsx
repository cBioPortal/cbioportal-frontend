/**
 * @jest-environment jsdom
 */
import * as React from 'react';
import { action } from 'mobx';
import TestRenderer from 'react-test-renderer';
import WSIViewer from './WSIViewer';
import { makeHierarchy, makeSample, makeSlide } from './wsiTestFixtures';
import { Slide } from './wsiViewerTypes';

jest.mock('./wsiOpenSeadragonLoader', () => ({
    loadOpenSeadragon: jest.fn(),
}));

function makeInstance(extraProps: Record<string, unknown> = {}) {
    return new (WSIViewer as any)({
        tileServerUrl: 'https://tiles.example.com',
        patientId: 'P-1',
        height: 500,
        ...extraProps,
    });
}

function testSlide(slide_key: string, can_serve_tiles = true) {
    return makeSlide({ slide_key, can_serve_tiles });
}

function hierarchyOf(slides: Slide[]) {
    return makeHierarchy([makeSample('S-1', slides)]);
}

describe('WSIViewer foundation behavior', () => {
    afterEach(() => {
        window.location.hash = '';
    });

    it('renders loading and failure states without a hierarchy', () => {
        const instance = makeInstance();
        expect(
            TestRenderer.create(instance.render()).root.findAllByType('div')
                .length
        ).toBeGreaterThan(0);

        action(() => {
            instance.viewerState.loading = false;
            instance.viewerState.error = 'Hierarchy unavailable';
        })();
        const error = TestRenderer.create(instance.render());
        expect(JSON.stringify(error.toJSON())).toContain(
            'Hierarchy unavailable'
        );
    });

    describe('requested slideKey', () => {
        const slides = () => [
            testSlide('slide-a'),
            testSlide('slide id/b #2'),
            testSlide('slide-c'),
        ];

        function loadedInstance(requestedSlideKey?: string) {
            const instance = makeInstance({ requestedSlideKey });
            action(() => {
                instance.viewerState.hierarchy = hierarchyOf(slides());
                instance.viewerState.loading = false;
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
            const instance = makeInstance({
                requestedSlideKey: 'slide-x',
            });
            action(() => {
                instance.viewerState.hierarchy = hierarchyOf([
                    testSlide('slide-a'),
                    testSlide('slide-x', false),
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
            const instance = makeInstance({ pathologyFilter });
            action(() => {
                instance.viewerState.hierarchy = hierarchyOf([
                    testSlide('slide-a'),
                ]);
                instance.viewerState.loading = false;
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

        describe('owned by the host', () => {
            function hostInstance() {
                const instance = makeInstance({
                    pathologyFilter: { sampleId: 'S-1' },
                    preferredSampleId: 'S-1',
                    hostOwnsSampleScope: true,
                });
                action(() => {
                    instance.viewerState.hierarchy = hierarchyOf([
                        testSlide('slide-a'),
                    ]);
                    instance.viewerState.loading = false;
                })();
                return instance;
            }
            const count = (instance: any, testId: string) =>
                TestRenderer.create(instance.render()).root.findAllByProps({
                    'data-testid': testId,
                }).length;

            it('shows neither the sample chip nor a filter reset', () => {
                const instance = hostInstance();
                expect(count(instance, 'wsi-sample-scope')).toBe(0);
                expect(count(instance, 'wsi-clear-filters')).toBe(0);
            });

            it('keeps the sample scope through filter changes and their reset', () => {
                const instance = hostInstance();
                instance.handleFilterChange('hne');
                expect(instance.scopedSampleId).toBe('S-1');
                expect(count(instance, 'wsi-clear-filters')).toBe(1);

                instance.handleClearFilters();
                expect(instance.stainFilter).toBe('all');
                expect(instance.scopedSampleId).toBe('S-1');
                expect(count(instance, 'wsi-clear-filters')).toBe(0);
            });
        });
    });

    describe('filter reset', () => {
        const sampleSlide = (slide_key: string, sample_id: string) =>
            makeSlide({ slide_key, sample_id, can_serve_tiles: true });
        const twoSamples = () =>
            makeHierarchy([
                makeSample('S-1', [sampleSlide('slide-a', 'S-1')]),
                makeSample('S-2', [sampleSlide('slide-b', 'S-2')]),
            ]);
        function loaded(
            props: Record<string, unknown>,
            hierarchy = twoSamples()
        ) {
            const instance = makeInstance(props);
            action(() => {
                instance.viewerState.hierarchy = hierarchy;
                instance.viewerState.loading = false;
            })();
            // These tests cover the list's controls, not opening a slide.
            instance.reselectSlideForCurrentFilters = jest
                .fn()
                .mockResolvedValue(undefined);
            return instance;
        }
        const resets = (instance: any) =>
            TestRenderer.create(instance.render()).root.findAllByProps({
                'data-testid': 'wsi-clear-filters',
            }).length;

        it('is offered while a link scope hides slides, and not once released', () => {
            const instance = loaded({
                pathologyFilter: { sampleId: 'S-1' },
                preferredSampleId: 'S-1',
            });
            expect(resets(instance)).toBe(1);

            instance.handleClearFilters();
            // The preferred sample still picks the first slide; it is not a filter.
            expect(resets(instance)).toBe(0);
        });

        it('is not offered for a preferred sample alone', () => {
            expect(resets(loaded({ preferredSampleId: 'S-1' }))).toBe(0);
        });

        it('is not offered for a link scope that hides nothing', () => {
            const instance = loaded(
                { pathologyFilter: { sampleId: 'S-1' } },
                hierarchyOf([sampleSlide('slide-a', 'S-1')])
            );
            expect(resets(instance)).toBe(0);
        });

        const chips = (instance: any) =>
            TestRenderer.create(instance.render()).root.findAllByProps({
                'data-testid': 'wsi-sample-scope',
            }).length;

        it('shows a link sample chip only while the scope hides slides', () => {
            expect(
                chips(loaded({ pathologyFilter: { sampleId: 'S-1' } }))
            ).toBe(1);
            expect(
                chips(
                    loaded(
                        { pathologyFilter: { sampleId: 'S-1' } },
                        hierarchyOf([sampleSlide('slide-a', 'S-1')])
                    )
                )
            ).toBe(0);
        });

        it('counts unmatched slides a sample scope hides', () => {
            const instance = loaded(
                { pathologyFilter: { sampleId: 'S-1' } },
                makeHierarchy([
                    makeSample('', [
                        makeSlide({
                            slide_key: 'unmatched',
                            sample_id: null,
                            match_level: 'UNMATCHED',
                            can_serve_tiles: true,
                        }),
                    ]),
                    makeSample('S-1', [sampleSlide('slide-a', 'S-1')]),
                ])
            );
            expect(resets(instance)).toBe(1);
        });

        it('is offered when a link matches no slide, so the patient can be shown', () => {
            const instance = loaded({
                pathologyFilter: { sampleId: 'S-1', specimenKey: 'part::9' },
            });
            expect(resets(instance)).toBe(1);

            instance.handleClearFilters();
            expect(resets(instance)).toBe(0);
        });

        it('is offered for a match-level link until it is used', () => {
            const instance = loaded(
                { pathologyFilter: { matchLevel: 'PART' } },
                makeHierarchy([
                    makeSample('S-1', [
                        makeSlide({
                            slide_key: 'part',
                            sample_id: 'S-1',
                            match_level: 'PART',
                            can_serve_tiles: true,
                        }),
                        makeSlide({
                            slide_key: 'block',
                            sample_id: 'S-1',
                            match_level: 'BLOCK',
                            can_serve_tiles: true,
                        }),
                    ]),
                ])
            );
            expect(resets(instance)).toBe(1);

            instance.handleClearFilters();
            expect(resets(instance)).toBe(0);
        });

        it('ignores slides the viewer cannot open', () => {
            const instance = loaded(
                { pathologyFilter: { sampleId: 'S-1' } },
                makeHierarchy([
                    makeSample('S-1', [sampleSlide('slide-a', 'S-1')]),
                    makeSample('S-2', [
                        makeSlide({
                            slide_key: 'dark',
                            sample_id: 'S-2',
                            can_serve_tiles: false,
                        }),
                    ]),
                ])
            );
            expect(resets(instance)).toBe(0);
            expect(chips(instance)).toBe(0);
        });

        it('follows the stain filter, not the stain the link started with', () => {
            const instance = loaded({ initialStainFilter: 'hne' });
            expect(resets(instance)).toBe(1);

            instance.handleFilterChange('all');
            expect(resets(instance)).toBe(0);
        });
    });
});
