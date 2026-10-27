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

            it('shows neither the sample chip nor "Show all slides"', () => {
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
});
