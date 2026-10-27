/**
 * @jest-environment jsdom
 */
import * as React from 'react';
import { assert } from 'chai';
import { autorun, action as mobxAction } from 'mobx';
import TestRenderer, { act } from 'react-test-renderer';
import WSIViewer from './WSIViewer';
import { WsiViewerController } from './wsiViewerController';
import * as wsiSlideUtils from './wsiSlideUtils';
import {
    clearPatientHierarchyCache,
    fetchWsiPatientHierarchy,
} from './wsiHierarchyFetchCache';
import { clearWsiSlideAccess, getWsiSlideAccess } from './wsiAuth';
import { clearWsiThumbnailFetchCache } from './wsiThumbnailFetchCache';
import { PatientHierarchy, Part, Sample, Slide } from './wsiViewerTypes';
import {
    makeBlock,
    makePart,
    makeSample as fixtureSample,
    makeSlide,
    makeAccessPayload,
    makeTileMetadata,
    registerTestSlideAccess,
    isSlideRowsRequest,
    slideRowsFor,
} from './wsiTestFixtures';
import { configureWsiViewerRuntime, WsiViewerConfig } from './wsiViewerConfig';

// Component tests use a synthetic origin, so keep portal API URLs relative.
function configureTestRuntime(overrides: Partial<WsiViewerConfig> = {}) {
    configureWsiViewerRuntime({
        buildApiUrl: (path: string) => `/${path}`,
        ...overrides,
    });
}

configureTestRuntime();
beforeEach(() => configureTestRuntime());

// Controllers that started a hierarchy load or a mount are disposed after each
// test, so their background requests and retries cannot reach the fetch mocks
// of later tests.
const activeControllers = new Set<WsiViewerController>();
(['loadHierarchy', 'mountOSD'] as const).forEach(method => {
    const proto = WsiViewerController.prototype as any;
    const original = proto[method];
    proto[method] = function(this: WsiViewerController, ...args: any[]) {
        activeControllers.add(this);
        return original.apply(this, args);
    };
});
afterEach(() => {
    activeControllers.forEach(controller => controller.dispose());
    activeControllers.clear();
});

const mockLoadOpenSeadragon = jest.fn();
const mockFetchPatientHierarchy = jest.fn();

// Mock OpenSeadragon so mountOSD never touches the real DOM/canvas
jest.mock('openseadragon', () => {
    const mockViewer = {
        destroy: jest.fn(),
        addOnceHandler: jest.fn(),
        addHandler: jest.fn(),
    };
    const OSD = jest.fn(() => mockViewer) as any;
    OSD.Point = function(x: number, y: number) {
        return { x, y };
    };
    OSD.MouseTracker = jest.fn().mockReturnValue({ destroy: jest.fn() });
    OSD.Navigator = jest.fn().mockImplementation(() => ({
        element: document.createElement('div'),
        destroy: jest.fn(),
        update: jest.fn(),
    }));
    return OSD;
});

jest.mock('./wsiOpenSeadragonLoader', () => ({
    loadOpenSeadragon: () => mockLoadOpenSeadragon(),
}));

jest.mock('./wsiHierarchyFetchCache', () => ({
    clearPatientHierarchyCache: jest.requireActual('./wsiHierarchyFetchCache')
        .clearPatientHierarchyCache,
    fetchWsiPatientHierarchy: (...args: unknown[]) =>
        mockFetchPatientHierarchy(...args),
}));

// Keep a reference to the original shared mockViewer so integration tests can
// restore it after overriding OSD.mockReturnValue() for per-test fresh viewers.
const OSD = jest.requireMock('openseadragon') as jest.MockedFunction<any>;
const _origMockViewer = OSD();
OSD.mockClear(); // don't count this setup call in real test assertions
mockLoadOpenSeadragon.mockResolvedValue(OSD);

// ---- test data factories ----

function makeSample(sampleId: string, parts: Part[]): Sample {
    return fixtureSample(sampleId, [], { parts });
}

function makeHierarchy(slides: Slide[], patientId = 'P-123'): PatientHierarchy {
    return {
        patient_id: patientId,
        samples: [makeSample('S-123456-T01', [makePart([makeBlock(slides)])])],
    };
}

function makeLoadedHierarchy(slides: Slide[]): PatientHierarchy {
    return {
        ...makeHierarchy(slides),
        reference_sample_id: 'S-123456-T01',
    };
}

/** The response to one slide rows request for a hierarchy. */
function rowsResponse(hierarchy: PatientHierarchy, init?: RequestInit) {
    return {
        ok: true,
        json: async () => slideRowsFor(hierarchy, init),
    } as Response;
}

/** A fetch mock that answers the slide rows requests for a hierarchy. */
function rowsFetchMock(hierarchy: PatientHierarchy) {
    return jest.fn(async (_input: RequestInfo | URL, init?: RequestInit) =>
        rowsResponse(hierarchy, init)
    );
}

// Slide access is requested by slide key for a slide a loaded hierarchy
// published for the patient.
function testAccessUrl(studyId: string, patientId: string, slideKey: string) {
    return `http://localhost/api/wsi/v2/resources/${studyId}/${patientId}/access?slideKey=${slideKey}`;
}

const TILE_SERVER_URL = 'https://tiles.example.com';

/** Create an unattached WSIViewer instance (no DOM, lifecycle not started). */
function makeInstance(
    patientId = 'P-1',
    props: Record<string, unknown> = {}
): any {
    return new (WSIViewer as any)({
        tileServerUrl: TILE_SERVER_URL,
        patientId,
        height: 500,
        studyId: 'study',
        ...props,
    });
}

function controllerOf(inst: any): any {
    return inst.controller;
}

function setFetchMock(mockImpl: unknown) {
    (global as any).fetch = mockImpl;
}

/** Loads a hierarchy into the shared cache as an earlier viewer would. */
async function warmHierarchyCache(
    hierarchy: PatientHierarchy,
    studyId = 'study'
) {
    const previousFetch = (global as any).fetch;
    setFetchMock(rowsFetchMock(hierarchy));
    try {
        await jest
            .requireActual('./wsiHierarchyFetchCache')
            .fetchWsiPatientHierarchy(
                studyId,
                hierarchy.patient_id,
                'anonymousUser'
            );
    } finally {
        setFetchMock(previousFetch);
    }
}

/**
 * Observes the sidebar rows as the rendered viewer does, so their computeds
 * are cached rather than recomputed on every read.
 */
function observeSidebarRows(inst: any): () => void {
    return autorun(() => {
        void inst.selectedWsiRows;
        void inst.selectedPathRows;
    });
}

async function loadHierarchyFor(inst: any) {
    await controllerOf(inst).loadHierarchy();
}

function renderViewer(url = 'https://tiles.example.com/patient/P-1') {
    const parsed = new URL(url);
    const patientId = decodeURIComponent(
        parsed.pathname
            .split('/')
            .filter(Boolean)
            .pop()!
    );
    const tileServerUrl = `${parsed.origin}${parsed.pathname.replace(
        /\/patient\/[^/]+\/?$/,
        ''
    )}`.replace(/\/$/, '');
    let renderer: TestRenderer.ReactTestRenderer;
    act(() => {
        renderer = TestRenderer.create(
            <WSIViewer
                tileServerUrl={tileServerUrl}
                studyId="study"
                authScope="anonymousUser"
                patientId={patientId}
                height={500}
            />
        );
    });
    const inst = renderer!.getInstance() as any;
    return { renderer: renderer!, inst };
}

function deferredPromise<T = void>() {
    let resolve!: (value?: T | PromiseLike<T>) => void;
    const promise = new Promise<T>(res => {
        resolve = value => res(value as T);
    });
    return { promise, resolve };
}

// ---- tests ----

beforeEach(() => {
    mockLoadOpenSeadragon.mockReset();
    mockLoadOpenSeadragon.mockResolvedValue(OSD);
    mockFetchPatientHierarchy.mockImplementation((...args: unknown[]) =>
        jest
            .requireActual('./wsiHierarchyFetchCache')
            .fetchWsiPatientHierarchy(...args)
    );
    clearPatientHierarchyCache();
    clearWsiThumbnailFetchCache();
    clearWsiSlideAccess();
});

describe('WSIViewer — tileServerBase', () => {
    it('drops a trailing slash', () => {
        const inst = makeInstance('P-1', {
            tileServerUrl: 'https://tiles.example.com/api/v1/',
        });
        assert.equal(inst.tileServerBase, 'https://tiles.example.com/api/v1');
    });
});

describe('WSIViewer — servableSlides', () => {
    it('returns empty array when hierarchy is null', () => {
        const inst = makeInstance('P-1');
        assert.deepEqual(inst.servableSlides, []);
    });

    it('returns only slides with can_serve_tiles=true', () => {
        const inst = makeInstance('P-1');
        const servable = makeSlide({ slide_key: 'A', can_serve_tiles: true });
        const notServable = makeSlide({
            slide_key: 'B',
            can_serve_tiles: false,
        });
        inst.viewerState.hierarchy = makeHierarchy([servable, notServable]);

        const result: any[] = inst.servableSlides;
        assert.equal(result.length, 1);
        assert.equal(result[0].slide.slide_key, 'A');
    });

    it('deduplicates repeated servable entries for the same slide within a sample', () => {
        const inst = makeInstance('P-1');
        const duplicated = makeSlide({ slide_key: 'A', can_serve_tiles: true });
        inst.viewerState.hierarchy = makeHierarchy([
            duplicated,
            { ...duplicated },
        ]);

        const result: any[] = inst.servableSlides;
        assert.equal(result.length, 1);
        assert.equal(result[0].slide.slide_key, 'A');
    });

    it('returns empty array when all slides have can_serve_tiles=false', () => {
        const inst = makeInstance('P-1');
        inst.viewerState.hierarchy = makeHierarchy([
            makeSlide({ can_serve_tiles: false }),
            makeSlide({ can_serve_tiles: false }),
        ]);
        assert.equal(inst.servableSlides.length, 0);
    });

    it('flattens slides across multiple samples, parts and blocks', () => {
        const inst = makeInstance('P-1');

        const slideA = makeSlide({ slide_key: 'A', can_serve_tiles: true });
        const slideB = makeSlide({ slide_key: 'B', can_serve_tiles: true });
        const slideC = makeSlide({ slide_key: 'C', can_serve_tiles: false });

        const block1 = makeBlock([slideA, slideC], '1');
        const block2 = makeBlock([slideB], '2');
        const part1 = makePart([block1, block2]);
        const sample1 = makeSample('S-001', [part1]);

        const slideD = makeSlide({ slide_key: 'D', can_serve_tiles: true });
        const block3 = makeBlock([slideD], '1');
        const part2 = makePart([block3]);
        const sample2 = makeSample('S-002', [part2]);

        inst.viewerState.hierarchy = {
            patient_id: 'P-1',
            samples: [sample1, sample2],
        };

        const result: any[] = inst.servableSlides;
        assert.equal(result.length, 3);
        assert.deepEqual(
            result.map((r: any) => r.slide.slide_key),
            ['A', 'B', 'D']
        );
    });

    it('attaches the correct sample to each slide entry', () => {
        const inst = makeInstance('P-1');
        const slide = makeSlide({ slide_key: 'X', can_serve_tiles: true });
        inst.viewerState.hierarchy = makeHierarchy([slide]);

        const result: any[] = inst.servableSlides;
        assert.equal(result[0].sample.sample_id, 'S-123456-T01');
    });

    it('includes all servable samples while preferring the requested sample', () => {
        const inst = makeInstance('P-1');
        const preferredSample = makeSample('S-preferred', [
            makePart([
                makeBlock([makeSlide({ slide_key: 'preferred-slide' })]),
            ]),
        ]);
        const otherSample = makeSample('S-other', [
            makePart([makeBlock([makeSlide({ slide_key: 'other-slide' })])]),
        ]);
        inst.props = { ...inst.props, preferredSampleId: 'S-preferred' };
        inst.viewerState.hierarchy = {
            patient_id: 'P-1',
            samples: [preferredSample, otherSample],
        };

        assert.deepEqual(
            inst.servableSlides
                .map((entry: any) => entry.slide.slide_key)
                .sort(),
            ['other-slide', 'preferred-slide']
        );
        assert.equal(
            (inst as any).chooseInitialServableSlide(inst.servableSlides).sample
                .sample_id,
            'S-preferred'
        );
    });

    it('falls back to another sample when the preferred sample has no slides', () => {
        const inst = makeInstance('P-1');
        const preferredSample = makeSample('S-preferred', []);
        const otherSample = makeSample('S-other', [
            makePart([makeBlock([makeSlide({ slide_key: 'other-slide' })])]),
        ]);
        inst.props = { ...inst.props, preferredSampleId: 'S-preferred' };
        inst.viewerState.hierarchy = {
            patient_id: 'P-1',
            samples: [preferredSample, otherSample],
        };

        assert.deepEqual(
            inst.servableSlides.map((entry: any) => entry.slide.slide_key),
            ['other-slide']
        );
        assert.equal(
            (inst as any).chooseInitialServableSlide(inst.servableSlides).sample
                .sample_id,
            'S-other'
        );
    });

    it('keeps explicit pathology placement filters hard during fallback', () => {
        const inst = makeInstance('P-1');
        const matchingSample = makeSample('S-1', [
            makePart([
                makeBlock([
                    makeSlide({
                        slide_key: 'matching-slide',
                        sample_id: 'S-1',
                        match_level: 'BLOCK',
                        specimen_key: 'block::matching',
                    }),
                ]),
            ]),
        ]);
        const otherSample = makeSample('S-2', [
            makePart([
                makeBlock([
                    makeSlide({
                        slide_key: 'other-slide',
                        sample_id: 'S-2',
                        match_level: 'BLOCK',
                        specimen_key: 'block::other',
                    }),
                ]),
            ]),
        ]);
        inst.props = {
            ...inst.props,
            preferredSampleId: 'S-1',
            pathologyFilter: {
                sampleId: 'S-1',
                matchLevel: 'BLOCK',
                specimenKey: 'block::matching',
            },
        };
        inst.viewerState.hierarchy = {
            patient_id: 'P-1',
            samples: [matchingSample, otherSample],
        };

        const selected = (inst as any).chooseInitialServableSlide(
            inst.servableSlides
        );

        assert.equal(selected.slide.slide_key, 'matching-slide');
    });
});

describe('WSIViewer — componentWillUnmount', () => {
    let origFetch: typeof globalThis.fetch;

    beforeEach(() => {
        origFetch = (global as any).fetch;
        setFetchMock(jest.fn(() => new Promise(() => undefined)) as any);
    });

    afterEach(() => {
        (global as any).fetch = origFetch;
    });
    it('sets hierarchy to null to cancel any running prefetch loop', () => {
        const { renderer, inst } = renderViewer();
        mobxAction(() => {
            inst.viewerState.hierarchy = makeHierarchy([makeSlide()]);
        })();
        assert.isNotNull(
            inst.viewerState.hierarchy,
            'precondition: hierarchy should be set'
        );

        act(() => {
            renderer.unmount();
        });

        assert.isNull(inst.viewerState.hierarchy);
    });

    it('does not throw when called before hierarchy is loaded', () => {
        const { renderer, inst } = renderViewer();
        assert.isNull(inst.viewerState.hierarchy);
        assert.doesNotThrow(() =>
            act(() => {
                renderer.unmount();
            })
        );
    });

    it('does not rerender the full viewer on cursor movement', () => {
        let origFetch: typeof globalThis.fetch = (global as any).fetch;
        setFetchMock(jest.fn(() => new Promise(() => undefined)) as any);

        const { renderer, inst } = renderViewer();
        const hierarchy = makeHierarchy([makeSlide({ slide_key: 'A' })]);
        const sample = hierarchy.samples[0];
        const slide = sample.parts[0].blocks[0].slides[0];

        act(() => {
            mobxAction(() => {
                inst.viewerState.loading = false;
                inst.viewerState.hierarchy = hierarchy;
                inst.viewerState.selectedSample = sample;
                inst.viewerState.selectedSlide = slide;
                inst.viewerState.selectedMeta = makeTileMetadata({
                    dimensions: { width: 1000, height: 800 },
                    levels: 1,
                    level_dimensions: [{ width: 1000, height: 800 }],
                    max_zoom: 6,
                    tile_size: 256,
                    mpp: { x: 0.25, y: 0.25 },
                });
                inst.viewerState.tilesReady = true;
            })();
        });

        const renderSpy = jest.spyOn(inst, 'render');
        renderSpy.mockClear();

        act(() => {
            inst.viewerState.setCursorPos(10, 20);
        });

        expect(renderSpy).not.toHaveBeenCalled();
        renderSpy.mockRestore();
        (global as any).fetch = origFetch;
        act(() => {
            renderer.unmount();
        });
    });
});

describe('WSIViewer — pathology filter updates', () => {
    it('orders slides by part, block and H&E first, and defaults to the first', () => {
        const slide = (key: string, blockNumber: string, isHne: boolean) =>
            makeSlide({
                slide_key: key,
                block_number: blockNumber,
                block_label: `A${blockNumber}`,
                stain_name: isHne ? 'H&E' : 'CD3',
                stain_kind: isHne ? 'hne' : 'ihc',
            });
        // Hierarchy order differs from the expected display order.
        const sample = makeSample('S-1', [
            {
                ...makePart([makeBlock([slide('p2-b1-he', '1', true)])]),
                part_number: '2',
            },
            {
                ...makePart([
                    makeBlock([slide('p1-b2-he', '2', true)], '2'),
                    makeBlock([
                        slide('p1-b1-ihc', '1', false),
                        slide('p1-b1-he', '1', true),
                    ]),
                ]),
                part_number: '1',
            },
        ]);
        const inst = new (WSIViewer as any)({
            patientId: 'P-XYZ',
            tileServerUrl: TILE_SERVER_URL,
            height: 500,
        });
        inst.viewerState.hierarchy = { patient_id: 'P-XYZ', samples: [sample] };

        expect(
            (inst as any).servableSlides.map(
                (entry: { slide: Slide }) => entry.slide.slide_key
            )
        ).toEqual(['p1-b1-he', 'p1-b1-ihc', 'p1-b2-he', 'p2-b1-he']);
        expect(
            (inst as any).chooseInitialServableSlide(
                (inst as any).servableSlides
            ).slide.slide_key
        ).toBe('p1-b1-he');
    });

    it('only mounts the latest slide after rapid left-nav clicks', () => {
        jest.useFakeTimers();
        try {
            const inst = new (WSIViewer as any)({
                patientId: 'P-XYZ',
                tileServerUrl: TILE_SERVER_URL,
                height: 500,
            });
            const sample = makeSample('S-1', [
                makePart([
                    makeBlock([
                        makeSlide({ slide_key: 'slide-1' }),
                        makeSlide({ slide_key: 'slide-2' }),
                    ]),
                ]),
            ]);
            const controller = controllerOf(inst);
            const selectSlideSpy = jest
                .spyOn(controller, 'selectSlide')
                .mockResolvedValue(undefined);

            (inst as any).handleSelectSlide(
                sample.parts[0].blocks[0].slides[0],
                sample
            );
            jest.advanceTimersByTime(60);
            (inst as any).handleSelectSlide(
                sample.parts[0].blocks[0].slides[1],
                sample
            );

            jest.advanceTimersByTime(119);
            expect(selectSlideSpy).not.toHaveBeenCalled();
            jest.advanceTimersByTime(1);

            expect(selectSlideSpy).toHaveBeenCalledTimes(1);
            expect(selectSlideSpy).toHaveBeenCalledWith(
                expect.objectContaining({ slide_key: 'slide-2' }),
                sample
            );
        } finally {
            jest.useRealTimers();
        }
    });

    it('drops a queued slide click when the patient changes', () => {
        jest.useFakeTimers();
        try {
            const inst = new (WSIViewer as any)({
                patientId: 'P-XYZ',
                tileServerUrl: TILE_SERVER_URL,
                height: 500,
            });
            const sample = makeSample('S-1', [
                makePart([makeBlock([makeSlide({ slide_key: 'old-slide' })])]),
            ]);
            const controller = controllerOf(inst);
            const selectSlideSpy = jest
                .spyOn(controller, 'selectSlide')
                .mockResolvedValue(undefined);
            jest.spyOn(controller, 'loadHierarchy').mockResolvedValue(
                undefined
            );

            (inst as any).handleSelectSlide(
                sample.parts[0].blocks[0].slides[0],
                sample
            );
            const prevProps = inst.props;
            inst.props = { ...inst.props, patientId: 'P-NEW' };
            inst.componentDidUpdate(prevProps);
            jest.advanceTimersByTime(200);

            expect(selectSlideSpy).not.toHaveBeenCalled();
        } finally {
            jest.useRealTimers();
        }
    });

    it('honors a matching share-link slide when pathology filters are present', () => {
        const inst = new (WSIViewer as any)({
            patientId: 'P-XYZ',
            tileServerUrl: TILE_SERVER_URL,
            height: 500,
            pathologyFilter: { matchLevel: 'UNMATCHED' },
        });
        const sample = makeSample('S-1', [
            makePart([
                makeBlock(
                    [
                        makeSlide({
                            slide_key: 'first-unmatched',
                            sample_id: 'S-1',
                            match_level: 'UNMATCHED',
                        }),
                        makeSlide({
                            slide_key: 'linked-unmatched',
                            sample_id: 'S-1',
                            match_level: 'UNMATCHED',
                        }),
                    ],
                    '1'
                ),
            ]),
        ]);
        const hierarchy = {
            patient_id: 'P-XYZ',
            samples: [sample],
        };
        inst.viewerState.hierarchy = hierarchy;
        inst.stainFilter = 'hne';
        window.location.hash =
            '#wsi:slide=linked-unmatched&x=10&y=20&z=1.000000';

        const selected = (inst as any).chooseInitialServableSlide(
            (inst as any).servableSlides
        );

        expect(selected.slide.slide_key).toBe('linked-unmatched');
        window.location.hash = '';
    });

    it('reloads the hierarchy when the pathology-filter sample id changes', () => {
        const inst = new (WSIViewer as any)({
            patientId: 'P-XYZ',
            tileServerUrl: TILE_SERVER_URL,
            height: 500,
            pathologyFilter: {
                sampleId: 'S-1',
                matchLevel: 'Part',
                specimenKey: 'specimen::1::1',
            },
        });

        const controller = controllerOf(inst);
        const disposeSpy = jest.spyOn(controller, 'dispose');
        const loadHierarchySpy = jest
            .spyOn(controller, 'loadHierarchy')
            .mockResolvedValue(undefined);

        inst.props = {
            ...inst.props,
            pathologyFilter: {
                sampleId: 'S-2',
                matchLevel: 'Part',
                specimenKey: 'specimen::1::1',
            },
        };

        inst.componentDidUpdate({
            patientId: 'P-XYZ',
            tileServerUrl: TILE_SERVER_URL,
            height: 500,
            pathologyFilter: {
                sampleId: 'S-1',
                matchLevel: 'Part',
                specimenKey: 'specimen::1::1',
            },
        });

        expect(disposeSpy).toHaveBeenCalledTimes(1);
        expect(loadHierarchySpy).toHaveBeenCalledTimes(1);
    });

    it('reuses the cached source hierarchy when only the pathology filter changes', () => {
        const inst = new (WSIViewer as any)({
            patientId: 'P-XYZ',
            tileServerUrl: TILE_SERVER_URL,
            height: 500,
            pathologyFilter: {
                sampleId: 'S-1',
                matchLevel: 'BLOCK',
                specimenKey: 'block::1::A1',
            },
        });
        const sample = makeSample('S-1', [
            makePart([
                makeBlock(
                    [
                        makeSlide({
                            slide_key: 'block-slide',
                            sample_id: 'S-1',
                            match_level: 'BLOCK',
                            specimen_key: 'block::1::A1',
                        }),
                        makeSlide({
                            slide_key: 'part-slide',
                            sample_id: 'S-1',
                            match_level: 'PART',
                            specimen_key: 'part::2::B1',
                            block_number: '2',
                            block_label: 'B1',
                        }),
                    ],
                    '1'
                ),
            ]),
        ]);
        const sourceHierarchy = {
            patient_id: 'P-XYZ',
            samples: [sample],
        };
        inst.viewerState.hierarchy = sourceHierarchy as any;
        inst.viewerState.selectedSample = sample;
        inst.viewerState.selectedSlide = sample.parts[0].blocks[0].slides[0];

        const controller = controllerOf(inst);
        const disposeSpy = jest.spyOn(controller, 'dispose');
        const loadHierarchySpy = jest
            .spyOn(controller, 'loadHierarchy')
            .mockResolvedValue(undefined);
        const selectSlideSpy = jest
            .spyOn(controller, 'selectSlide')
            .mockResolvedValue(undefined);

        inst.props = {
            ...inst.props,
            pathologyFilter: {
                sampleId: 'S-1',
                matchLevel: 'PART',
                specimenKey: 'part::2::B1',
            },
        };

        inst.componentDidUpdate({
            patientId: 'P-XYZ',
            tileServerUrl: TILE_SERVER_URL,
            height: 500,
            pathologyFilter: {
                sampleId: 'S-1',
                matchLevel: 'BLOCK',
                specimenKey: 'block::1::A1',
            },
        });

        expect(disposeSpy).not.toHaveBeenCalled();
        expect(loadHierarchySpy).not.toHaveBeenCalled();
        expect(selectSlideSpy).toHaveBeenCalledTimes(1);
        expect(selectSlideSpy).toHaveBeenCalledWith(
            expect.objectContaining({ slide_key: 'part-slide' }),
            expect.objectContaining({ sample_id: 'S-1' })
        );
        expect(inst.matchFilter).toBe('part');
    });

    it('keeps linkout scope when a prop-driven stain changes', () => {
        const hne = makeSlide({
            slide_key: 'hne-slide',
            sample_id: 'S-1',
            match_level: 'BLOCK',
            specimen_key: 'block::1::A1',
            stain_kind: 'hne',
        });
        const ihc = makeSlide({
            slide_key: 'ihc-slide',
            sample_id: 'S-1',
            match_level: 'BLOCK',
            specimen_key: 'block::1::A1',
            stain_name: 'IHC',
            stain_group: 'IHC',
            stain_kind: 'ihc',
        });
        const sample = makeSample('S-1', [makePart([makeBlock([hne, ihc])])]);
        const inst = new (WSIViewer as any)({
            patientId: 'P-XYZ',
            tileServerUrl: TILE_SERVER_URL,
            height: 500,
            initialStainFilter: 'all',
            pathologyFilter: {
                sampleId: 'S-1',
                matchLevel: 'BLOCK',
                specimenKey: 'block::1::A1',
            },
        });
        inst.viewerState.hierarchy = {
            patient_id: 'P-XYZ',
            samples: [sample],
        };
        inst.viewerState.selectedSample = sample;
        inst.viewerState.selectedSlide = hne;
        const selectSlideSpy = jest
            .spyOn(controllerOf(inst), 'selectSlide')
            .mockResolvedValue(undefined);
        const prevProps = { ...inst.props };
        inst.props = { ...inst.props, initialStainFilter: 'ihc' };

        inst.componentDidUpdate(prevProps);

        expect((inst as any).linkoutScopeActive).toBe(true);
        expect(inst.stainFilter).toBe('ihc');
        expect(selectSlideSpy).toHaveBeenCalledWith(ihc, sample);
    });

    it('checks the current slide against the matching sample instead of scanning all hierarchy entries on local pathology-filter reuse', () => {
        const inst = new (WSIViewer as any)({
            patientId: 'P-XYZ',
            tileServerUrl: TILE_SERVER_URL,
            height: 500,
            pathologyFilter: {
                sampleId: 'S-1',
                matchLevel: 'BLOCK',
                specimenKey: 'block::1::A1',
            },
        });
        const sample = makeSample('S-1', [
            makePart([
                makeBlock(
                    [
                        makeSlide({
                            slide_key: 'block-slide',
                            sample_id: 'S-1',
                            match_level: 'BLOCK',
                            specimen_key: 'block::1::A1',
                        }),
                        makeSlide({
                            slide_key: 'part-slide',
                            block_number: '2',
                            block_label: 'B1',
                        }),
                    ],
                    '1'
                ),
            ]),
        ]);
        const sourceHierarchy = {
            patient_id: 'P-XYZ',
            samples: [sample],
        };
        inst.viewerState.hierarchy = sourceHierarchy as any;
        inst.viewerState.selectedSample = sample;
        inst.viewerState.selectedSlide = sample.parts[0].blocks[0].slides[0];

        const getOrderedSlidesSpy = jest.spyOn(
            wsiSlideUtils,
            'getOrderedServableSlidesForSampleReadOnly'
        );

        inst.props = {
            ...inst.props,
            pathologyFilter: {
                sampleId: 'S-1',
                matchLevel: 'BLOCK',
                specimenKey: 'block::1::A1',
            },
        };

        (inst as any).applyPathologyFilterFromSourceHierarchy();

        expect(getOrderedSlidesSpy).toHaveBeenCalledTimes(1);
        expect(inst.viewerState.selectedSlide?.slide_key).toBe('block-slide');
        expect(inst.viewerState.selectedSample?.sample_id).toBe('S-1');
        expect(inst.viewerState.hierarchy).toEqual(sourceHierarchy);
    });

    it('reselects from the loaded hierarchy when only the preferred sample changes', () => {
        const inst = new (WSIViewer as any)({
            patientId: 'P-XYZ',
            tileServerUrl: TILE_SERVER_URL,
            height: 500,
            preferredSampleId: 'S-1',
        });
        const sample1 = makeSample('S-1', [
            makePart([makeBlock([makeSlide({ slide_key: 'slide-1' })], '1')]),
        ]);
        const sample2 = makeSample('S-2', [
            makePart([makeBlock([makeSlide({ slide_key: 'slide-2' })], '1')]),
        ]);
        inst.viewerState.hierarchy = {
            patient_id: 'P-XYZ',
            samples: [sample1, sample2],
        };
        inst.viewerState.selectedSample = sample1;
        inst.viewerState.selectedSlide = sample1.parts[0].blocks[0].slides[0];

        const controller = controllerOf(inst);
        const disposeSpy = jest.spyOn(controller, 'dispose');
        const loadHierarchySpy = jest
            .spyOn(controller, 'loadHierarchy')
            .mockResolvedValue(undefined);
        const selectSlideSpy = jest
            .spyOn(controller, 'selectSlide')
            .mockResolvedValue(undefined);

        inst.props = {
            ...inst.props,
            preferredSampleId: 'S-2',
        };

        inst.componentDidUpdate({
            patientId: 'P-XYZ',
            tileServerUrl: TILE_SERVER_URL,
            height: 500,
            preferredSampleId: 'S-1',
        });

        expect(disposeSpy).not.toHaveBeenCalled();
        expect(loadHierarchySpy).not.toHaveBeenCalled();
        expect(selectSlideSpy).toHaveBeenCalledWith(
            expect.objectContaining({ slide_key: 'slide-2' }),
            expect.objectContaining({ sample_id: 'S-2' })
        );
    });

    it('reselects a visible slide when the stain filter hides the current selection', () => {
        const inst = new (WSIViewer as any)({
            patientId: 'P-XYZ',
            tileServerUrl: TILE_SERVER_URL,
            height: 500,
        });
        const sample = makeSample('S-1', [
            makePart([
                makeBlock(
                    [
                        makeSlide({ slide_key: 'hne-slide' }),
                        makeSlide({
                            slide_key: 'ihc-slide',
                            stain_kind: 'ihc',
                            stain_name: 'IHC',
                            stain_group: 'IHC',
                        }),
                    ],
                    '1'
                ),
            ]),
        ]);
        inst.viewerState.hierarchy = {
            patient_id: 'P-XYZ',
            samples: [sample],
        };
        inst.viewerState.selectedSample = sample;
        inst.viewerState.selectedSlide = sample.parts[0].blocks[0].slides[1];

        const controller = controllerOf(inst);
        const disposeSpy = jest.spyOn(controller, 'dispose');
        const loadHierarchySpy = jest
            .spyOn(controller, 'loadHierarchy')
            .mockResolvedValue(undefined);
        const selectSlideSpy = jest
            .spyOn(controller, 'selectSlide')
            .mockResolvedValue(undefined);

        (inst as any).handleFilterChange('hne');

        expect(disposeSpy).not.toHaveBeenCalled();
        expect(loadHierarchySpy).not.toHaveBeenCalled();
        expect(selectSlideSpy).toHaveBeenCalledWith(
            expect.objectContaining({ slide_key: 'hne-slide' }),
            expect.objectContaining({ sample_id: 'S-1' })
        );
    });

    it('loads the first visible slide when the stain filter changes', () => {
        const inst = new (WSIViewer as any)({
            patientId: 'P-XYZ',
            tileServerUrl: TILE_SERVER_URL,
            height: 500,
        });
        const sample = makeSample('S-1', [
            makePart([
                makeBlock(
                    [
                        makeSlide({ slide_key: 'first-hne-slide' }),
                        makeSlide({ slide_key: 'second-hne-slide' }),
                    ],
                    '1'
                ),
            ]),
        ]);
        inst.viewerState.hierarchy = {
            patient_id: 'P-XYZ',
            samples: [sample],
        };
        inst.viewerState.selectedSample = sample;
        inst.viewerState.selectedSlide = sample.parts[0].blocks[0].slides[1];
        inst.matchFilter = 'all';

        const controller = controllerOf(inst);
        const selectSlideSpy = jest
            .spyOn(controller, 'selectSlide')
            .mockResolvedValue(undefined);

        (inst as any).handleFilterChange('hne');

        expect(selectSlideSpy).toHaveBeenCalledWith(
            expect.objectContaining({ slide_key: 'first-hne-slide' }),
            expect.objectContaining({ sample_id: 'S-1' })
        );
    });

    it('reselects a visible slide when the match filter hides the current selection', () => {
        const inst = new (WSIViewer as any)({
            patientId: 'P-XYZ',
            tileServerUrl: TILE_SERVER_URL,
            height: 500,
        });
        const sample = makeSample('S-1', [
            makePart([
                makeBlock(
                    [
                        makeSlide({
                            slide_key: 'block-slide',
                            sample_id: 'S-1',
                            match_level: 'BLOCK',
                            specimen_key: 'block::1::A1',
                        }),
                        makeSlide({
                            slide_key: 'part-slide',
                            sample_id: 'S-1',
                            match_level: 'PART',
                            specimen_key: 'part::2::B1',
                            block_number: '2',
                            block_label: 'B1',
                        }),
                    ],
                    '1'
                ),
            ]),
        ]);
        inst.viewerState.hierarchy = {
            patient_id: 'P-XYZ',
            samples: [sample],
        };
        inst.viewerState.selectedSample = sample;
        inst.viewerState.selectedSlide = sample.parts[0].blocks[0].slides[0];

        const controller = controllerOf(inst);
        const disposeSpy = jest.spyOn(controller, 'dispose');
        const loadHierarchySpy = jest
            .spyOn(controller, 'loadHierarchy')
            .mockResolvedValue(undefined);
        const selectSlideSpy = jest
            .spyOn(controller, 'selectSlide')
            .mockResolvedValue(undefined);

        (inst as any).handleMatchFilterChange('part');

        expect(disposeSpy).not.toHaveBeenCalled();
        expect(loadHierarchySpy).not.toHaveBeenCalled();
        expect(selectSlideSpy).toHaveBeenCalledWith(
            expect.objectContaining({ slide_key: 'part-slide' }),
            expect.objectContaining({ sample_id: 'S-1' })
        );
    });

    it('loads the first visible slide when the match filter changes', () => {
        const inst = new (WSIViewer as any)({
            patientId: 'P-XYZ',
            tileServerUrl: TILE_SERVER_URL,
            height: 500,
        });
        const sample = makeSample('S-1', [
            makePart([
                makeBlock(
                    [
                        makeSlide({
                            slide_key: 'first-part-slide',
                            sample_id: 'S-1',
                            match_level: 'PART',
                            specimen_key: 'part::1',
                        }),
                        makeSlide({
                            slide_key: 'second-part-slide',
                            sample_id: 'S-1',
                            match_level: 'PART',
                            specimen_key: 'part::2',
                        }),
                    ],
                    '1'
                ),
            ]),
        ]);
        inst.viewerState.hierarchy = {
            patient_id: 'P-XYZ',
            samples: [sample],
        };
        inst.viewerState.selectedSample = sample;
        inst.viewerState.selectedSlide = sample.parts[0].blocks[0].slides[1];
        inst.matchFilter = 'all';

        const controller = controllerOf(inst);
        const selectSlideSpy = jest
            .spyOn(controller, 'selectSlide')
            .mockResolvedValue(undefined);

        (inst as any).handleMatchFilterChange('part');

        expect(selectSlideSpy).toHaveBeenCalledWith(
            expect.objectContaining({ slide_key: 'first-part-slide' }),
            expect.objectContaining({ sample_id: 'S-1' })
        );
    });

    it('clears the selected slide when filters have no matches', () => {
        const inst = new (WSIViewer as any)({
            patientId: 'P-XYZ',
            tileServerUrl: TILE_SERVER_URL,
            height: 500,
        });
        const sample = makeSample('S-1', [
            makePart([
                makeBlock(
                    [
                        makeSlide({
                            slide_key: 'part-slide',
                            sample_id: 'S-1',
                            match_level: 'PART',
                            specimen_key: 'part::1',
                        }),
                    ],
                    '1'
                ),
            ]),
        ]);
        inst.viewerState.hierarchy = {
            patient_id: 'P-XYZ',
            samples: [sample],
        };
        inst.viewerState.selectedSample = sample;
        inst.viewerState.selectedSlide = sample.parts[0].blocks[0].slides[0];

        const controller = controllerOf(inst);
        const clearSelectedSlideSpy = jest.spyOn(
            controller,
            'clearSelectedSlide'
        );

        (inst as any).handleMatchFilterChange('block');

        expect(clearSelectedSlideSpy).toHaveBeenCalledTimes(1);
    });

    it('does not locally reselect when the same update requires a hierarchy reload', () => {
        const inst = new (WSIViewer as any)({
            patientId: 'P-XYZ',
            tileServerUrl: TILE_SERVER_URL,
            height: 500,
            initialStainFilter: 'all',
            pathologyFilter: {
                sampleId: 'S-1',
                matchLevel: 'BLOCK',
                specimenKey: 'specimen::1::1',
            },
        });
        const sample = makeSample('S-1', [
            makePart([makeBlock([makeSlide({ slide_key: 'slide-1' })], '1')]),
        ]);
        inst.viewerState.hierarchy = {
            patient_id: 'P-XYZ',
            samples: [sample],
        };
        inst.viewerState.selectedSample = sample;
        inst.viewerState.selectedSlide = sample.parts[0].blocks[0].slides[0];

        const controller = controllerOf(inst);
        const disposeSpy = jest.spyOn(controller, 'dispose');
        const loadHierarchySpy = jest
            .spyOn(controller, 'loadHierarchy')
            .mockResolvedValue(undefined);
        const selectSlideSpy = jest
            .spyOn(controller, 'selectSlide')
            .mockResolvedValue(undefined);

        inst.props = {
            ...inst.props,
            initialStainFilter: 'hne',
            pathologyFilter: {
                sampleId: 'S-2',
                matchLevel: 'PART',
                specimenKey: 'specimen::2::1',
            },
        };

        inst.componentDidUpdate({
            patientId: 'P-XYZ',
            tileServerUrl: TILE_SERVER_URL,
            height: 500,
            studyId: 'previous-study',
            initialStainFilter: 'all',
            pathologyFilter: {
                sampleId: 'S-1',
                matchLevel: 'BLOCK',
                specimenKey: 'specimen::1::1',
            },
        });

        expect(disposeSpy).toHaveBeenCalledTimes(1);
        expect(loadHierarchySpy).toHaveBeenCalledTimes(1);
        expect(selectSlideSpy).not.toHaveBeenCalled();
        expect(inst.stainFilter).toBe('hne');
        expect(inst.matchFilter).toBe('part');
    });

    it('does not reselect when the requested stain or match filter is already active', () => {
        const inst = new (WSIViewer as any)({
            patientId: 'P-XYZ',
            tileServerUrl: TILE_SERVER_URL,
            height: 500,
        });
        const sample = makeSample('S-1', [
            makePart([makeBlock([makeSlide({ slide_key: 'hne-slide' })], '1')]),
        ]);
        inst.viewerState.hierarchy = {
            patient_id: 'P-XYZ',
            samples: [sample],
        };
        inst.viewerState.selectedSample = sample;
        inst.viewerState.selectedSlide = sample.parts[0].blocks[0].slides[0];
        inst.stainFilter = 'all';
        inst.matchFilter = 'all';

        const controller = controllerOf(inst);
        const selectSlideSpy = jest
            .spyOn(controller, 'selectSlide')
            .mockResolvedValue(undefined);

        (inst as any).handleFilterChange('all');
        (inst as any).handleMatchFilterChange('all');

        expect(selectSlideSpy).not.toHaveBeenCalled();
    });

    it('releases a linkout scope when an already-active All filter is selected', () => {
        const inst = new (WSIViewer as any)({
            patientId: 'P-XYZ',
            tileServerUrl: TILE_SERVER_URL,
            height: 500,
            initialStainFilter: 'all',
            pathologyFilter: {
                sampleId: 'S-1',
                matchLevel: 'BLOCK',
                specimenKey: 'block::1::A1',
            },
        });
        const sample = makeSample('S-1', [
            makePart([
                makeBlock(
                    [
                        makeSlide({
                            slide_key: 'hne-slide',
                            sample_id: 'S-1',
                            match_level: 'BLOCK',
                            specimen_key: 'block::1::A1',
                        }),
                    ],
                    '1'
                ),
            ]),
        ]);
        inst.viewerState.hierarchy = {
            patient_id: 'P-XYZ',
            samples: [sample],
        };

        (inst as any).handleFilterChange('all');

        expect((inst as any).linkoutScopeActive).toBe(false);
    });

    it('does not remount when re-selecting the already active ready slide', async () => {
        const inst = new (WSIViewer as any)({
            patientId: 'P-XYZ',
            tileServerUrl: TILE_SERVER_URL,
            height: 500,
        });
        const sample = makeSample('S-1', [
            makePart([makeBlock([makeSlide({ slide_key: 'hne-slide' })], '1')]),
        ]);
        const slide = sample.parts[0].blocks[0].slides[0];
        const controller = controllerOf(inst);

        inst.viewerState.selectedSample = sample;
        inst.viewerState.selectedSlide = slide;
        inst.viewerState.selectedMeta = makeTileMetadata({
            dimensions: { width: 1000, height: 800 },
            levels: 1,
            level_dimensions: [{ width: 1000, height: 800 }],
            max_zoom: 6,
            tile_size: 256,
        });
        (controller as any).osdViewer = { destroy: jest.fn() };
        (controller as any).osdSlideMounted = true;

        const beginSpy = jest.spyOn(
            (inst as any).viewerState,
            'beginSlideSelection'
        );
        const mountSpy = jest
            .spyOn(controller as any, 'mountOSD')
            .mockResolvedValue(undefined);

        await controller.selectSlide(slide, sample);

        expect(beginSpy).not.toHaveBeenCalled();
        expect(mountSpy).not.toHaveBeenCalled();
    });
});

describe('WSIViewer — sidebar row caching', () => {
    let origRaf: typeof globalThis.requestAnimationFrame;

    beforeEach(() => {
        origRaf = (global as any).requestAnimationFrame;
    });

    afterEach(() => {
        (global as any).requestAnimationFrame = origRaf;
    });

    it('keeps metadata row references stable across unrelated state changes', () => {
        const inst = makeInstance('P-1');
        const hierarchy = makeHierarchy([makeSlide({ slide_key: 'A' })], 'P-1');
        const sample = hierarchy.samples[0];
        const slide = sample.parts[0].blocks[0].slides[0];

        act(() => {
            mobxAction(() => {
                inst.viewerState.hierarchy = hierarchy;
                inst.viewerState.selectedSample = sample;
                inst.viewerState.selectedSlide = slide;
                inst.viewerState.selectedMeta = makeTileMetadata({
                    dimensions: { width: 1000, height: 800 },
                    levels: 1,
                    level_dimensions: [{ width: 1000, height: 800 }],
                    max_zoom: 6,
                    tile_size: 256,
                    mpp: { x: 0.25, y: 0.25 },
                });
                inst.viewerState.spinnerVisible = false;
            })();
        });

        const stopObserving = observeSidebarRows(inst);
        const firstWsiRows = (inst as any).selectedWsiRows;
        const firstPathRows = (inst as any).selectedPathRows;

        act(() => {
            mobxAction(() => {
                inst.viewerState.spinnerVisible = true;
            })();
        });

        expect((inst as any).selectedWsiRows).toBe(firstWsiRows);
        expect((inst as any).selectedPathRows).toBe(firstPathRows);
        stopObserving();
    });
});

describe('WSIViewer — loadHierarchy', () => {
    let origFetch: typeof globalThis.fetch;
    let origRaf: typeof globalThis.requestAnimationFrame;

    beforeEach(() => {
        origFetch = (global as any).fetch;
        origRaf = (global as any).requestAnimationFrame;
    });

    afterEach(() => {
        (global as any).fetch = origFetch;
        (global as any).requestAnimationFrame = origRaf;
    });

    it('sets error and clears loading when server returns a non-ok status', async () => {
        setFetchMock(jest.fn().mockResolvedValue({ ok: false, status: 502 }));

        const inst = makeInstance('P-1');
        await loadHierarchyFor(inst);

        assert.isNotNull(inst.viewerState.error, 'error should be set');
        assert.include(inst.viewerState.error, '502');
        assert.isFalse(inst.viewerState.loading);
    });

    it('sets error and clears loading when fetch rejects (network error)', async () => {
        setFetchMock(jest.fn().mockRejectedValue(new Error('Network failure')));

        const inst = makeInstance('P-1');
        await loadHierarchyFor(inst);

        assert.include(inst.viewerState.error, 'Network failure');
        assert.isFalse(inst.viewerState.loading);
    });

    it('populates hierarchy and clears loading on successful response', async () => {
        // Provide a hierarchy with no servable slides to avoid triggering
        // mountOSD (which requires a real DOM container and OSD canvas).
        const mockHierarchy = makeLoadedHierarchy([
            makeSlide({ can_serve_tiles: false }),
        ]);
        setFetchMock(rowsFetchMock(mockHierarchy));

        const inst = makeInstance('P-XYZ');
        await loadHierarchyFor(inst);

        assert.isNull(inst.viewerState.error);
        assert.isFalse(inst.viewerState.loading);
        assert.equal(inst.viewerState.hierarchy?.patient_id, 'P-XYZ');
    });

    it('clears previous hierarchy and error before re-fetching', async () => {
        // First: put instance into an error state
        setFetchMock(jest.fn().mockRejectedValue(new Error('first error')));
        const inst = makeInstance('P-1');
        await loadHierarchyFor(inst);
        assert.isNotNull(
            inst.viewerState.error,
            'precondition: error set after first call'
        );

        // Second: successful fetch
        const mockHierarchy = makeLoadedHierarchy([
            makeSlide({ can_serve_tiles: false }),
        ]);
        setFetchMock(rowsFetchMock(mockHierarchy));
        await loadHierarchyFor(inst);

        assert.isNull(inst.viewerState.error);
        assert.isNotNull(inst.viewerState.hierarchy);
    });

    it('bumps mountSeq to invalidate stale in-flight OSD mounts', async () => {
        setFetchMock(jest.fn().mockRejectedValue(new Error('ignore')));
        const inst = makeInstance('P-1');
        const controller = controllerOf(inst);
        const seqBefore = controller.mountSeq as number;

        await loadHierarchyFor(inst);

        assert.isAbove(controller.mountSeq, seqBefore);
    });

    it('starts warming first-slide metadata as soon as the initial slide is chosen', async () => {
        let releaseMetadata!: () => void;
        const metadataWarmupStarted = new Promise<void>(resolve => {
            releaseMetadata = resolve;
        });
        (global as any).requestAnimationFrame = (cb: FrameRequestCallback) => {
            cb(0);
            return 0;
        };
        const mockHierarchy = makeLoadedHierarchy([
            makeSlide({ slide_key: 'A', can_serve_tiles: true }),
        ]);
        setFetchMock(rowsFetchMock(mockHierarchy));

        const inst = new (WSIViewer as any)({
            patientId: 'P-XYZ',
            tileServerUrl: TILE_SERVER_URL,
            height: 500,
            studyId: 'study-1',
        });
        const controller = controllerOf(inst);
        const fetchMetadataSpy = jest
            .spyOn(controller as any, 'fetchSlideMetadata')
            .mockImplementation(async () => {
                releaseMetadata();
                return makeTileMetadata({
                    dimensions: { width: 1000, height: 800 },
                    levels: 1,
                    level_dimensions: [{ width: 1000, height: 800 }],
                    max_zoom: 6,
                    tile_size: 256,
                });
            });
        const selectSlideSpy = jest
            .spyOn(controller, 'selectSlide')
            .mockResolvedValue(undefined);

        const loadPromise = loadHierarchyFor(inst);

        await metadataWarmupStarted;
        expect(fetchMetadataSpy).toHaveBeenCalledWith('A');
        expect(selectSlideSpy).not.toHaveBeenCalled();

        await loadPromise;

        expect(selectSlideSpy).toHaveBeenCalledTimes(1);
    });

    it('filters the loaded hierarchy to the requested pathology context before selecting the initial slide', async () => {
        const mockHierarchy: PatientHierarchy = {
            patient_id: 'P-XYZ',
            samples: [
                makeSample('S-123456-T01', [
                    makePart([
                        makeBlock(
                            [
                                makeSlide({
                                    slide_key: 'matched-1',
                                    sample_id: 'S-123456-T01',
                                    match_level: 'BLOCK',
                                    specimen_key: 'block::1::A1',
                                }),
                            ],
                            '1'
                        ),
                        makeBlock(
                            [
                                makeSlide({
                                    slide_key: 'unmatched-1',
                                    block_number: '2',
                                    block_label: 'B1',
                                    sample_id: null,
                                    match_level: 'UNMATCHED',
                                    specimen_key: 'unmatched::1::B1',
                                }),
                            ],
                            '2'
                        ),
                    ]),
                ]),
            ],
        };
        setFetchMock(rowsFetchMock(mockHierarchy));

        const inst = new (WSIViewer as any)({
            patientId: 'P-XYZ',
            tileServerUrl: TILE_SERVER_URL,
            height: 500,
            pathologyFilter: {
                matchLevel: 'Unmatched',
                specimenKey: 'unmatched::1::B1',
            },
        });
        const controller = controllerOf(inst);
        const selectSlideSpy = jest
            .spyOn(controller, 'selectSlide')
            .mockResolvedValue(undefined);

        await loadHierarchyFor(inst);

        expect(inst.viewerState.hierarchy.samples).toHaveLength(1);
        expect(
            inst.viewerState.hierarchy.samples[0].parts[0].blocks
        ).toHaveLength(2);
        expect(
            inst.viewerState.hierarchy.samples[0].parts[0].blocks.flatMap(
                (block: any) =>
                    block.slides.map((slide: Slide) => slide.slide_key)
            )
        ).toEqual(['matched-1', 'unmatched-1']);
        expect(inst.matchFilter).toBe('unmatched');
        expect(
            inst.viewerState.hierarchy.samples[0].parts[0].blocks.flatMap(
                (block: any) => block.slides
            )
        ).toEqual([
            expect.objectContaining({
                slide_key: 'matched-1',
                match_level: 'BLOCK',
            }),
            expect.objectContaining({
                slide_key: 'unmatched-1',
                match_level: 'UNMATCHED',
                specimen_key: 'unmatched::1::B1',
            }),
        ]);
        expect(selectSlideSpy).toHaveBeenCalledTimes(1);
        expect((selectSlideSpy.mock.calls[0][0] as Slide).slide_key).toBe(
            'unmatched-1'
        );
    });

    it('loads hierarchy data and warms metadata for the selected initial slide', async () => {
        const hierarchy = makeLoadedHierarchy([
            makeSlide({
                slide_key: 'bootstrap-slide',
                can_serve_tiles: true,
            }),
        ]);
        setFetchMock(
            jest.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
                const url = String(input);
                if (isSlideRowsRequest(url)) {
                    return rowsResponse(hierarchy, init);
                }
                if (
                    url === testAccessUrl('study', 'P-XYZ', 'bootstrap-slide')
                ) {
                    return {
                        ok: true,
                        json: async () =>
                            makeAccessPayload({ slideKey: 'bootstrap-slide' }),
                    } as Response;
                }
                throw new Error(`Unexpected fetch ${url}`);
            }) as any
        );

        const inst = new (WSIViewer as any)({
            patientId: 'P-XYZ',
            tileServerUrl: TILE_SERVER_URL,
            height: 500,
            studyId: 'study',
        });
        const controller = controllerOf(inst);
        const selectSlideSpy = jest
            .spyOn(controller, 'selectSlide')
            .mockResolvedValue(undefined);

        await loadHierarchyFor(inst);

        const calls = (global as any).fetch.mock.calls;
        expect(calls.map(([url]: [string]) => url)).toEqual([
            '/api/resource-table/query/fetch',
            '/api/resource-table/query/fetch',
            testAccessUrl('study', 'P-XYZ', 'bootstrap-slide'),
        ]);
        expect(calls[2][1]).toEqual({
            cache: 'no-store',
            credentials: 'include',
        });
        expect(selectSlideSpy).toHaveBeenCalledWith(
            expect.objectContaining({ slide_key: 'bootstrap-slide' }),
            expect.objectContaining({ sample_id: 'S-123456-T01' })
        );
    });

    it('reuses the shared hierarchy cache when it is already warm', async () => {
        const hierarchy = makeHierarchy(
            [makeSlide({ slide_key: 'cached-slide', can_serve_tiles: true })],
            'P-1'
        );
        await warmHierarchyCache(hierarchy);
        setFetchMock(
            jest.fn(async (input: RequestInfo | URL) => {
                const url = String(input);
                throw new Error(`Unexpected fetch ${url}`);
            }) as any
        );

        const inst = new (WSIViewer as any)({
            patientId: 'P-1',
            tileServerUrl: TILE_SERVER_URL,
            height: 500,
            studyId: 'study',
        });
        const controller = controllerOf(inst);
        const selectSlideSpy = jest
            .spyOn(controller, 'selectSlide')
            .mockResolvedValue(undefined);

        await loadHierarchyFor(inst);

        expect(inst.viewerState.hierarchy?.patient_id).toBe('P-1');
        expect(selectSlideSpy).toHaveBeenCalledWith(
            expect.objectContaining({ slide_key: 'cached-slide' }),
            expect.objectContaining({ sample_id: 'S-123456-T01' })
        );
    });

    it('keeps metadata tracing on the selected slide when frontend filtering picks an unmatched slide', async () => {
        const mockHierarchy: PatientHierarchy = {
            patient_id: 'P-XYZ',
            samples: [
                makeSample('S-123456-T01', [
                    makePart([
                        makeBlock(
                            [
                                makeSlide({
                                    slide_key: 'matched-1',
                                    sample_id: 'S-123456-T01',
                                    match_level: 'BLOCK',
                                    specimen_key: 'block::1::A1',
                                }),
                            ],
                            '1'
                        ),
                        makeBlock(
                            [
                                makeSlide({
                                    slide_key: 'unmatched-1',
                                    block_number: '2',
                                    block_label: 'B1',
                                    sample_id: null,
                                    match_level: 'UNMATCHED',
                                    specimen_key: 'unmatched::1::B1',
                                }),
                            ],
                            '2'
                        ),
                    ]),
                ]),
            ],
        };
        setFetchMock(
            jest.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
                const url = String(input);
                if (isSlideRowsRequest(url)) {
                    return rowsResponse(mockHierarchy, init);
                }
                throw new Error(`Unexpected fetch ${url}`);
            }) as any
        );

        const inst = new (WSIViewer as any)({
            patientId: 'P-XYZ',
            tileServerUrl: TILE_SERVER_URL,
            height: 500,
            studyId: 'study',
            pathologyFilter: {
                matchLevel: 'Unmatched',
                specimenKey: 'unmatched::1::B1',
            },
        });
        const controller = controllerOf(inst);
        jest.spyOn(controller, 'selectSlide').mockResolvedValue(undefined);

        await loadHierarchyFor(inst);

        expect(controller.initialSlideKey).toBe('unmatched-1');
    });

    it('primes OpenSeadragon on hierarchy load and mounts the initial slide with it', async () => {
        (global as any).requestAnimationFrame = (cb: FrameRequestCallback) => {
            cb(0);
            return 0;
        };
        const mockHierarchy = makeLoadedHierarchy([
            makeSlide({ slide_key: 'A', can_serve_tiles: true }),
        ]);
        setFetchMock(
            jest.fn().mockImplementation((url: string, init?: RequestInit) =>
                Promise.resolve({
                    ok: true,
                    json: () =>
                        Promise.resolve(
                            isSlideRowsRequest(url)
                                ? slideRowsFor(mockHierarchy, init)
                                : makeAccessPayload({ slideKey: 'A' })
                        ),
                })
            )
        );

        const inst = makeInstance('P-XYZ');
        (inst as any).viewerContainerRef = {
            current: document.createElement('div'),
        };

        OSD.mockClear();
        await loadHierarchyFor(inst);

        // The loader memoizes the import, so the prime on hierarchy load and
        // the initial mount share one OpenSeadragon module.
        expect(mockLoadOpenSeadragon).toHaveBeenCalled();
        expect(OSD).toHaveBeenCalledTimes(1);
    });

    it('shows an error when the lazy OpenSeadragon import fails', async () => {
        (global as any).requestAnimationFrame = (cb: FrameRequestCallback) => {
            cb(0);
            return 0;
        };
        mockLoadOpenSeadragon.mockRejectedValue(new Error('OSD chunk failed'));
        const mockHierarchy = makeLoadedHierarchy([
            makeSlide({ slide_key: 'A', can_serve_tiles: true }),
        ]);
        setFetchMock(
            jest.fn().mockImplementation((url: string, init?: RequestInit) =>
                Promise.resolve({
                    ok: true,
                    json: () =>
                        Promise.resolve(
                            isSlideRowsRequest(url)
                                ? slideRowsFor(mockHierarchy, init)
                                : makeAccessPayload({ slideKey: 'A' })
                        ),
                })
            )
        );

        const inst = makeInstance('P-XYZ');
        (inst as any).viewerContainerRef = {
            current: document.createElement('div'),
        };

        await loadHierarchyFor(inst);

        expect(inst.viewerState.error).toContain('OSD init error');
        expect(inst.viewerState.error).toContain('OSD chunk failed');
    });
});

describe('WSIViewer — prefetchSlideMetadata cancellation', () => {
    let origFetch: typeof globalThis.fetch;

    beforeEach(() => {
        origFetch = (global as any).fetch;
    });

    afterEach(() => {
        (global as any).fetch = origFetch;
    });

    it('deduplicates concurrent metadata fetches for the same slide', async () => {
        const inst = makeInstance('P-1');
        const controller = controllerOf(inst);
        const slide = makeSlide({ slide_key: 'AAA', can_serve_tiles: true });
        inst.viewerState.hierarchy = makeHierarchy([slide]);
        registerTestSlideAccess('study', 'P-123', 'AAA');

        setFetchMock(
            jest.fn().mockResolvedValue({
                ok: true,
                json: () =>
                    Promise.resolve(makeAccessPayload({ slideKey: 'AAA' })),
            })
        );

        const firstPromise = controller.fetchSlideMetadata('AAA');
        const secondPromise = controller.fetchSlideMetadata('AAA');

        await Promise.all([firstPromise, secondPromise]);

        expect((global as any).fetch).toHaveBeenCalledTimes(1);
    });

    it('prefetches only the selected sample, active stain first', async () => {
        const inst = makeInstance('P-1');
        const controller = controllerOf(inst);
        const selectedSampleSlides = [
            makeSlide({
                slide_key: 'BBB',
                can_serve_tiles: true,
                stain_kind: 'hne',
            }),
            makeSlide({
                slide_key: 'CCC',
                can_serve_tiles: true,
                stain_kind: 'ihc',
                stain_name: 'IHC',
            }),
        ];
        const otherSampleSlides = [
            makeSlide({
                slide_key: 'AAA',
                can_serve_tiles: true,
                stain_kind: 'hne',
            }),
            makeSlide({
                slide_key: 'DDD',
                can_serve_tiles: true,
                stain_kind: 'ihc',
                stain_name: 'IHC',
            }),
        ];
        const selectedSample = makeSample('S-selected', [
            makePart([makeBlock(selectedSampleSlides)]),
        ]);
        const otherSample = makeSample('S-other', [
            makePart([makeBlock(otherSampleSlides)]),
        ]);
        inst.viewerState.hierarchy = {
            patient_id: 'P-1',
            samples: [otherSample, selectedSample],
        };
        inst.viewerState.selectedSample = selectedSample;
        inst.stainFilter = 'hne';

        const order: string[] = [];
        jest.spyOn(controller, 'fetchSlideMetadata').mockImplementation(
            async (slideKey: string) => {
                order.push(slideKey);
                return makeTileMetadata({
                    dimensions: { width: 1000, height: 800 },
                    levels: 1,
                    level_dimensions: [{ width: 1000, height: 800 }],
                    max_zoom: 6,
                    tile_size: 256,
                });
            }
        );

        await controller.prefetchSlideMetadata(undefined);

        // Other samples' slides load their metadata when selected.
        expect(order).toEqual(['BBB', 'CCC']);
    });

    it('does not spend prefetch queue slots on duplicate servable slide keys', async () => {
        const inst = makeInstance('P-1');
        const controller = controllerOf(inst);
        const duplicateSlideA = makeSlide({
            slide_key: 'AAA',
            can_serve_tiles: true,
        });
        const duplicateSlideB = makeSlide({
            slide_key: 'AAA',
            can_serve_tiles: true,
            block_number: '2',
            block_label: 'A2',
        });
        const slideB = makeSlide({
            slide_key: 'BBB',
            can_serve_tiles: true,
            block_number: '3',
            block_label: 'A3',
        });
        const slideC = makeSlide({
            slide_key: 'CCC',
            can_serve_tiles: true,
            block_number: '4',
            block_label: 'A4',
        });
        const slideD = makeSlide({
            slide_key: 'DDD',
            can_serve_tiles: true,
            block_number: '5',
            block_label: 'A5',
        });
        inst.viewerState.hierarchy = makeHierarchy([
            duplicateSlideA,
            duplicateSlideB,
            slideB,
            slideC,
            slideD,
        ]);
        inst.viewerState.selectedSample = inst.viewerState.hierarchy.samples[0];

        const order: string[] = [];
        const deferred = new Map<string, ReturnType<typeof deferredPromise>>();
        ['AAA', 'BBB', 'CCC', 'DDD'].forEach(slideKey => {
            deferred.set(slideKey, deferredPromise<void>());
        });

        jest.spyOn(controller, 'fetchSlideMetadata').mockImplementation(
            (slideKey: string) => {
                order.push(slideKey);
                return deferred.get(slideKey)!.promise.then(() =>
                    makeTileMetadata({
                        dimensions: { width: 1000, height: 800 },
                        levels: 1,
                        level_dimensions: [{ width: 1000, height: 800 }],
                        max_zoom: 6,
                        tile_size: 256,
                    })
                );
            }
        );

        const prefetchPromise = controller.prefetchSlideMetadata(undefined);

        await Promise.resolve();
        expect(order).toEqual(['AAA', 'BBB', 'CCC']);

        deferred.get('AAA')!.resolve();
        deferred.get('BBB')!.resolve();
        deferred.get('CCC')!.resolve();
        await Promise.resolve();
        await Promise.resolve();

        // The prefetch limit is three slides, so DDD is never fetched.
        await prefetchPromise;
        expect(order).toEqual(['AAA', 'BBB', 'CCC']);
    });
});

describe('WSIViewer — goToCoordinates', () => {
    it('does nothing when osdViewer is null', () => {
        const inst = makeInstance('P-1');
        inst.viewerState.coordInputX = '100';
        inst.viewerState.coordInputY = '200';
        // Should not throw
        controllerOf(inst).goToCoordinates();
    });

    it('calls viewport.imageToViewportCoordinates and panTo with parsed coords', () => {
        const inst = makeInstance('P-1');
        inst.viewerState.coordInputX = '500';
        inst.viewerState.coordInputY = '750';

        const mockVpPoint = { x: 0.5, y: 0.75 };
        const mockViewport = {
            imageToViewportCoordinates: jest.fn().mockReturnValue(mockVpPoint),
            panTo: jest.fn(),
        };
        controllerOf(inst).osdViewer = { viewport: mockViewport };
        controllerOf(inst).osdSlideMounted = true;
        controllerOf(inst).openSeadragon = OSD;

        controllerOf(inst).goToCoordinates();

        expect(mockViewport.imageToViewportCoordinates).toHaveBeenCalledTimes(
            1
        );
        const arg = mockViewport.imageToViewportCoordinates.mock.calls[0][0];
        expect(arg.x).toBe(500);
        expect(arg.y).toBe(750);
        expect(mockViewport.panTo).toHaveBeenCalledWith(mockVpPoint, true);
    });

    it('does nothing when coord inputs are empty strings', () => {
        const inst = makeInstance('P-1');
        inst.viewerState.coordInputX = '';
        inst.viewerState.coordInputY = '';

        const mockViewport = {
            imageToViewportCoordinates: jest.fn(),
            panTo: jest.fn(),
        };
        controllerOf(inst).osdViewer = { viewport: mockViewport };
        controllerOf(inst).osdSlideMounted = true;

        controllerOf(inst).goToCoordinates();

        expect(mockViewport.panTo).not.toHaveBeenCalled();
    });

    it('does nothing when coord inputs are non-numeric', () => {
        const inst = makeInstance('P-1');
        inst.viewerState.coordInputX = 'abc';
        inst.viewerState.coordInputY = 'xyz';

        const mockViewport = {
            imageToViewportCoordinates: jest.fn(),
            panTo: jest.fn(),
        };
        controllerOf(inst).osdViewer = { viewport: mockViewport };
        controllerOf(inst).osdSlideMounted = true;

        controllerOf(inst).goToCoordinates();

        expect(mockViewport.panTo).not.toHaveBeenCalled();
    });
});

describe('WSIViewer — URL hash state', () => {
    let origHash: string;

    beforeEach(() => {
        origHash = window.location.hash;
    });

    afterEach(() => {
        window.location.hash = origHash;
    });

    it('copyViewLink copies the current viewport hash instead of the stale URL', async () => {
        const inst = makeInstance('P-1');
        inst.viewerState.selectedSlide = makeSlide({ slide_key: '12345' });

        const writeText = jest.fn().mockResolvedValue(undefined);
        Object.assign(navigator, {
            clipboard: { writeText },
        });

        controllerOf(inst).osdSlideMounted = true;
        controllerOf(inst).osdViewer = {
            viewport: {
                getCenter: jest.fn().mockReturnValue({ x: 100, y: 200 }),
                getZoom: jest.fn().mockReturnValue(1.23456),
                viewportToImageCoordinates: jest.fn((pt: any) => pt),
            },
        };

        window.history.replaceState(null, '', '/patient/P-1#old');

        await controllerOf(inst).copyViewLink();

        expect(writeText).toHaveBeenCalledWith(
            'http://localhost/patient/P-1#wsi:slide=12345&x=100&y=200&z=1.234560'
        );
        expect(window.location.hash).toBe(
            '#wsi:slide=12345&x=100&y=200&z=1.234560'
        );
    });
});

/**
 * Integration tests: run the real mountOSD with a fake DOM container + fetch
 * mock so we can capture the 'open' callback and exercise the full hash-restore
 * and goHome logic.
 */
describe('WSIViewer — open handler (mountOSD integration)', () => {
    let origFetch: typeof globalThis.fetch;
    let origHash: string;
    let origRaf: any;
    let origRequestIdleCallback: any;
    let origCancelIdleCallback: any;
    let mockViewport: any;
    let mockViewer: any;
    let capturedOpenCb: (() => void) | null;
    let capturedTileLoadedCb: (() => void) | null;
    let capturedTileDrawnCb: (() => void) | null;
    let capturedFullyLoadedCb:
        | ((event: { fullyLoaded: boolean }) => void)
        | null;
    let idleCallbacks: Array<() => void>;

    const metaMock = makeTileMetadata({
        dimensions: { width: 40000, height: 30000 },
        levels: 1,
        level_dimensions: [{ width: 40000, height: 30000 }],
        max_zoom: 8,
        tile_size: 256,
    });

    beforeEach(() => {
        origFetch = (global as any).fetch;
        origHash = window.location.hash;
        origRaf = (global as any).requestAnimationFrame;
        origRequestIdleCallback = (window as any).requestIdleCallback;
        origCancelIdleCallback = (window as any).cancelIdleCallback;
        capturedOpenCb = null;
        capturedTileLoadedCb = null;
        capturedTileDrawnCb = null;
        capturedFullyLoadedCb = null;
        idleCallbacks = [];

        // Synchronous rAF so mountOSD's two-frame wait resolves immediately
        (global as any).requestAnimationFrame = (cb: FrameRequestCallback) => {
            cb(0);
            return 0;
        };
        (window as any).requestIdleCallback = (cb: () => void) => {
            idleCallbacks.push(cb);
            return idleCallbacks.length;
        };
        (window as any).cancelIdleCallback = jest.fn();

        // Tile metadata comes with the slide access.
        (global as any).fetch = jest.fn().mockResolvedValue({
            ok: true,
            json: () =>
                Promise.resolve(
                    makeAccessPayload({
                        slideKey: '42',
                        tileMetadata: metaMock,
                    })
                ),
        });

        // Fresh viewport mock — identity coordinate transforms for simplicity
        mockViewport = {
            getCenter: jest.fn().mockReturnValue({ x: 0.5, y: 0.5 }),
            getZoom: jest.fn().mockReturnValue(1.0),
            viewportToImageCoordinates: jest.fn((pt: any) => pt),
            imageToViewportCoordinates: jest.fn((pt: any) => pt),
            panTo: jest.fn(),
            zoomTo: jest.fn(),
            goHome: jest.fn(),
        };

        // Fresh viewer mock that captures the slide's handlers for each test.
        // The controller binds one-time handlers through addHandler and
        // removes them itself, so the viewer can be reused across slides.
        mockViewer = {
            destroy: jest.fn(),
            viewport: mockViewport,
            addOnceHandler: jest.fn(),
            addHandler: jest.fn(),
            removeHandler: jest.fn(),
        };
        mockViewer.addHandler.mockImplementation(
            (event: string, cb: (event?: any) => void) => {
                if (event === 'open') capturedOpenCb = cb;
                if (event === 'tile-loaded') capturedTileLoadedCb = cb;
                if (event === 'tile-drawn') capturedTileDrawnCb = cb;
                if (event === 'fully-loaded-change') {
                    capturedFullyLoadedCb = cb;
                }
            }
        );
        OSD.mockReturnValue(mockViewer);
        OSD.MouseTracker.mockClear();
    });

    afterEach(() => {
        (global as any).fetch = origFetch;
        (global as any).requestAnimationFrame = origRaf;
        (window as any).requestIdleCallback = origRequestIdleCallback;
        (window as any).cancelIdleCallback = origCancelIdleCallback;
        window.location.hash = origHash;
        // Restore original shared mock viewer for tests outside this block
        OSD.mockReturnValue(_origMockViewer);
    });

    /** Run mountOSD on a fresh instance and return the instance. */
    async function runMount(
        slide: Slide,
        props: Record<string, unknown> = {},
        restoreHashViewport = true
    ): Promise<any> {
        const inst = new (WSIViewer as any)({
            patientId: 'P-XYZ',
            tileServerUrl: TILE_SERVER_URL,
            height: 500,
            studyId: 'study-1',
            ...props,
        });
        inst.viewerState.selectedSlide = slide;
        registerTestSlideAccess(
            String(props.studyId ?? 'study-1'),
            'P-XYZ',
            slide.slide_key,
            metaMock
        );
        // Provide a real DOM container so the containerEl guard passes
        const container = document.createElement('div');
        (inst as any).viewerContainerRef = { current: container };
        const controller = controllerOf(inst);
        const seq = ++controller.mountSeq;
        await controller.mountOSD(slide, seq, restoreHashViewport);
        return inst;
    }

    it('waits for a hidden container to get a size before fitting the slide', async () => {
        // A tab laid out off-screen can give the viewer a zero-width container;
        // fitting the slide then leaves a near-zero zoom once the tab is shown.
        window.location.hash = '';
        let resizeCb: ((event: any) => void) | null = null;
        const addHandler = mockViewer.addHandler.getMockImplementation();
        mockViewer.addHandler.mockImplementation(
            (event: string, cb: (event?: any) => void) => {
                if (event === 'resize') resizeCb = cb;
                addHandler(event, cb);
            }
        );
        let containerSize = { x: 1, y: 658 };
        mockViewport.getContainerSize = jest.fn(() => containerSize);
        const slide = makeSlide({ slide_key: '42' });
        await runMount(slide);

        capturedOpenCb!();
        expect(mockViewport.goHome).not.toHaveBeenCalled();
        expect(resizeCb).not.toBeNull();

        resizeCb!({ newContainerSize: { x: 1, y: 658 } });
        expect(mockViewport.goHome).not.toHaveBeenCalled();

        // OpenSeadragon raises 'resize' before it rescales the viewport for
        // the new size, so the view is fitted on the next frame.
        const frames: FrameRequestCallback[] = [];
        (global as any).requestAnimationFrame = (cb: FrameRequestCallback) => {
            frames.push(cb);
            return frames.length;
        };
        containerSize = { x: 462, y: 658 };
        resizeCb!({ newContainerSize: containerSize });
        expect(mockViewport.goHome).not.toHaveBeenCalled();
        expect(mockViewer.removeHandler).toHaveBeenCalledWith(
            'resize',
            resizeCb
        );

        frames.forEach(cb => cb(0));
        expect(mockViewport.goHome).toHaveBeenCalledTimes(1);
    });

    it('calls goHome(true) on fresh load with no wsi hash', async () => {
        window.location.hash = '';
        const slide = makeSlide({ slide_key: '42' });
        await runMount(slide);

        expect(capturedOpenCb).not.toBeNull();
        capturedOpenCb!();

        expect(mockViewport.goHome).toHaveBeenCalledWith(true);
        expect(mockViewport.panTo).not.toHaveBeenCalled();
    });

    it('shows the published thumbnail until the first native tile is drawn', async () => {
        const originalCreateObjectURL = (URL as any).createObjectURL;
        const originalRevokeObjectURL = (URL as any).revokeObjectURL;
        const createObjectURL = jest
            .fn()
            .mockReturnValue('blob:published-thumb');
        const revokeObjectURL = jest.fn();
        (URL as any).createObjectURL = createObjectURL;
        (URL as any).revokeObjectURL = revokeObjectURL;

        const accessResponse = {
            ok: true,
            json: () =>
                Promise.resolve(
                    makeAccessPayload({
                        slideKey: '42',
                        tileMetadata: metaMock,
                    })
                ),
        };
        const thumbnailResponse = {
            ok: true,
            status: 200,
            headers: new Headers({
                'Content-Type': 'image/jpeg',
                'X-Thumbnail-Status': 'ok',
            }),
            blob: () =>
                Promise.resolve(new Blob(['jpeg'], { type: 'image/jpeg' })),
        };
        const fetchMock = jest.fn((url: string) =>
            Promise.resolve(
                url.includes('/thumbnails') ? thumbnailResponse : accessResponse
            )
        );
        (global as any).fetch = fetchMock;

        try {
            const inst = await runMount(makeSlide({ slide_key: '42' }));
            await new Promise(resolve => setTimeout(resolve, 0));

            expect(fetchMock).toHaveBeenCalledWith(
                'https://tiles.example.com/thumbnails?width=128&height=96',
                expect.objectContaining({
                    cache: 'default',
                    headers: {
                        Authorization: 'Bearer test-token',
                    },
                })
            );
            expect(createObjectURL).toHaveBeenCalledTimes(1);
            expect((inst as any).viewerState.thumbnailPreviewUrl).toBe(
                'blob:published-thumb'
            );

            capturedOpenCb!();
            capturedTileLoadedCb!();
            expect((inst as any).viewerState.thumbnailPreviewUrl).toBe(
                'blob:published-thumb'
            );

            capturedTileDrawnCb!();
            expect((inst as any).viewerState.thumbnailPreviewUrl).toBeNull();
            expect(revokeObjectURL).toHaveBeenCalledWith(
                'blob:published-thumb'
            );
        } finally {
            if (originalCreateObjectURL === undefined) {
                delete (URL as any).createObjectURL;
            } else {
                (URL as any).createObjectURL = originalCreateObjectURL;
            }
            if (originalRevokeObjectURL === undefined) {
                delete (URL as any).revokeObjectURL;
            } else {
                (URL as any).revokeObjectURL = originalRevokeObjectURL;
            }
        }
    });

    it('treats a loaded tile as viewer-ready when no draw event is emitted', async () => {
        window.location.hash = '';
        // WebGL-backed renderers can load the image successfully without
        // delivering OpenSeadragon's tile-drawn event.
        mockViewer.drawer = { getType: () => 'webgl' };
        let updateViewportCb: (() => void) | null = null;
        const addHandler = mockViewer.addHandler.getMockImplementation();
        mockViewer.addHandler.mockImplementation(
            (event: string, cb: (event?: any) => void) => {
                if (event === 'update-viewport') updateViewportCb = cb;
                addHandler(event, cb);
            }
        );
        const slide = makeSlide({ slide_key: '42' });
        const inst = await runMount(slide);
        const controller = controllerOf(inst);
        (inst as any).viewerState.spinnerVisible = true;
        (inst as any).viewerState.thumbnailPreviewUrl = 'blob:preview';
        controller.loadingStart = Date.now() - 1000;

        capturedOpenCb!();
        expect((inst as any).viewerState.tilesReady).toBe(false);

        capturedTileLoadedCb!();

        expect((inst as any).viewerState.tilesReady).toBe(true);
        expect((inst as any).viewerState.spinnerVisible).toBe(false);
        // The preview stays until the redraw that draws the loaded tile, then
        // goes, rather than staying under the slide where zooming out shows it.
        expect((inst as any).viewerState.thumbnailPreviewUrl).toBe(
            'blob:preview'
        );
        updateViewportCb!();
        expect((inst as any).viewerState.thumbnailPreviewUrl).toBeNull();
    });

    it('drops the preview later when a canvas renderer never draws a tile', async () => {
        window.location.hash = '';
        const slide = makeSlide({ slide_key: '42' });
        const inst = await runMount(slide);
        const controller = controllerOf(inst);
        (inst as any).viewerState.thumbnailPreviewUrl = 'blob:preview';
        controller.loadingStart = Date.now() - 1000;
        jest.useFakeTimers();
        try {
            capturedOpenCb!();
            capturedTileLoadedCb!();
            expect((inst as any).viewerState.thumbnailPreviewUrl).toBe(
                'blob:preview'
            );

            jest.advanceTimersByTime(1500);
            expect((inst as any).viewerState.thumbnailPreviewUrl).toBeNull();
        } finally {
            jest.useRealTimers();
        }
    });

    it('surfaces a retryable error when no tile becomes ready', async () => {
        window.location.hash = '';
        const slide = makeSlide({ slide_key: '42' });
        const inst = await runMount(slide);
        jest.useFakeTimers();
        try {
            capturedOpenCb!();

            jest.advanceTimersByTime(185_000);

            expect((inst as any).viewerState.error).toContain(
                'Slide tiles did not load'
            );
            expect((inst as any).viewerState.spinnerVisible).toBe(false);
            expect((inst as any).viewerState.tilesReady).toBe(true);
        } finally {
            jest.useRealTimers();
        }
    });

    it('clears the timeout error when a tile is drawn late', async () => {
        window.location.hash = '';
        const slide = makeSlide({ slide_key: '42' });
        const inst = await runMount(slide);
        jest.useFakeTimers();
        try {
            capturedOpenCb!();
            jest.advanceTimersByTime(185_000);
            expect((inst as any).viewerState.error).toContain(
                'Slide tiles did not load'
            );

            capturedTileDrawnCb!();

            expect((inst as any).viewerState.error).toBeNull();
            expect((inst as any).viewerState.tilesReady).toBe(true);
        } finally {
            jest.useRealTimers();
        }
    });

    it('reuses the published thumbnail when retrying the selected slide', async () => {
        window.location.hash = '';
        const slide = makeSlide({ slide_key: '42' });
        const accessResponse = {
            ok: true,
            json: () =>
                Promise.resolve(
                    makeAccessPayload({
                        slideKey: '42',
                        tileMetadata: metaMock,
                    })
                ),
        };
        const thumbnailResponse = {
            ok: true,
            status: 200,
            headers: new Headers({
                'Content-Type': 'image/jpeg',
                'X-Thumbnail-Status': 'ok',
            }),
            blob: () =>
                Promise.resolve(new Blob(['jpeg'], { type: 'image/jpeg' })),
        };
        const fetchMock = jest.fn((url: string) =>
            Promise.resolve(
                url.includes('/thumbnails') ? thumbnailResponse : accessResponse
            )
        );
        setFetchMock(fetchMock);

        const inst = await runMount(slide);
        const controller = controllerOf(inst);

        inst.viewerState.selectedSample = makeSample('S-123456-T01', [
            makePart([makeBlock([slide])]),
        ]);

        expect((global as any).fetch).toHaveBeenCalledTimes(2);

        await controller.retrySelectedSlide();

        // The v2 access capability is cached across a retry and the published
        // thumbnail is reused from the shared Blob cache.
        expect((global as any).fetch).toHaveBeenCalledTimes(2);
        expect(
            fetchMock.mock.calls.filter(([url]) => url.includes('/thumbnails'))
        ).toHaveLength(1);
    });

    it('calls goHome(true) when hash belongs to a different slide', async () => {
        window.location.hash = '#wsi:slide=99&x=5000&y=3000&z=0.8';
        const slide = makeSlide({ slide_key: '42' }); // hash has slideId=99
        await runMount(slide);
        capturedOpenCb!();

        expect(mockViewport.goHome).toHaveBeenCalledWith(true);
        expect(mockViewport.panTo).not.toHaveBeenCalled();
    });

    it('calls panTo + zoomTo (not goHome) when hash slideId matches', async () => {
        window.location.hash = '#wsi:slide=42&x=15000&y=10000&z=2.500000';
        const slide = makeSlide({ slide_key: '42' });
        await runMount(slide);
        capturedOpenCb!();

        expect(mockViewport.goHome).not.toHaveBeenCalled();
        expect(mockViewport.panTo).toHaveBeenCalledWith(
            expect.anything(),
            true
        );
        expect(mockViewport.zoomTo).toHaveBeenCalledWith(2.5, undefined, true);

        // imageToViewportCoordinates was called with the hash image-pixel coords
        const imgArg = mockViewport.imageToViewportCoordinates.mock.calls[0][0];
        expect(imgArg.x).toBe(15000);
        expect(imgArg.y).toBe(10000);
    });

    it('homes ordinary slide navigation even when a stale hash names the slide', async () => {
        window.location.hash = '#wsi:slide=42&x=15000&y=10000&z=2.500000';
        const slide = makeSlide({ slide_key: '42' });
        await runMount(slide, {}, false);
        capturedOpenCb!();

        expect(mockViewport.goHome).toHaveBeenCalledWith(true);
        expect(mockViewport.panTo).not.toHaveBeenCalled();
        expect(mockViewport.zoomTo).not.toHaveBeenCalled();
    });

    it('does not clobber the share-link hash before the open handler fires (selectSlide regression)', async () => {
        // The old bug: selectSlide called writeHashState() after mountOSD() returned
        // but before the OSD 'open' event fired. The viewport existed but had no tile
        // source, so image coordinates defaulted to ~(1,1), overwriting the hash.
        window.location.hash = '#wsi:slide=42&x=15000&y=10000&z=2.5';
        const slide = makeSlide({ slide_key: '42' });

        await runMount(slide); // mountOSD returns; 'open' has NOT fired yet

        // Hash must still carry the original share-link coordinates
        expect(window.location.hash).toBe(
            '#wsi:slide=42&x=15000&y=10000&z=2.5'
        );

        // Firing the open handler must restore (panTo) not reset (goHome)
        capturedOpenCb!();
        expect(mockViewport.goHome).not.toHaveBeenCalled();
        expect(mockViewport.panTo).toHaveBeenCalled();
    });

    it('registers animation-finish inside open callback, not before', async () => {
        // animation-finish must only be registered AFTER hash is read and viewport
        // is set, so OSD's own initial-animation-finish cannot clobber the hash.
        window.location.hash = '';
        const slide = makeSlide({ slide_key: '42' });
        await runMount(slide);

        // Before 'open' fires: no animation-finish listener should exist
        const beforeOpen = (mockViewer.addHandler.mock.calls as [
            string,
            unknown
        ][]).some(([ev]) => ev === 'animation-finish');
        expect(beforeOpen).toBe(false);

        capturedOpenCb!();

        // After 'open' fires: animation-finish listener must be registered
        const afterOpen = (mockViewer.addHandler.mock.calls as [
            string,
            unknown
        ][]).some(([ev]) => ev === 'animation-finish');
        expect(afterOpen).toBe(true);
    });

    it('starts metadata prefetch only after the first tile readiness event', async () => {
        window.location.hash = '';
        const slide = makeSlide({ slide_key: '42' });
        const inst = await runMount(slide, { studyId: 'study-1' });
        const controller = controllerOf(inst);
        inst.viewerState.hierarchy = makeHierarchy([slide]);
        controller.initialSlideKey = '42';
        controller.hierarchyLoadSeq = 1;
        controller.loadingStart = Date.now() - 1000;
        const prefetchSpy = jest
            .spyOn(controller, 'prefetchSlideMetadata')
            .mockResolvedValue(undefined);

        capturedOpenCb!();
        expect(prefetchSpy).not.toHaveBeenCalled();
        expect(OSD.Navigator).not.toHaveBeenCalled();
        expect(OSD.MouseTracker).not.toHaveBeenCalled();

        capturedTileDrawnCb!();
        expect(prefetchSpy).not.toHaveBeenCalled();
        expect(idleCallbacks).toHaveLength(1);
        expect(OSD.Navigator).not.toHaveBeenCalled();
        expect(OSD.MouseTracker).toHaveBeenCalledTimes(1);

        capturedFullyLoadedCb!({ fullyLoaded: true });
        expect(idleCallbacks).toHaveLength(2);

        await idleCallbacks.pop()!();
        expect(OSD.Navigator).toHaveBeenCalledTimes(1);
        expect(prefetchSpy).not.toHaveBeenCalled();

        idleCallbacks.shift()!();
        expect(prefetchSpy).toHaveBeenCalledTimes(1);
        expect(prefetchSpy).toHaveBeenCalledWith(
            '42',
            controller.hierarchyLoadSeq
        );
        expect(idleCallbacks).toHaveLength(0);

        capturedTileDrawnCb!();
        expect(prefetchSpy).toHaveBeenCalledTimes(1);
    });

    it('cancels scheduled background work on dispose before idle execution', async () => {
        window.location.hash = '';
        const slide = makeSlide({ slide_key: '42' });
        const inst = await runMount(slide, { studyId: 'study-1' });
        const controller = controllerOf(inst);
        inst.viewerState.hierarchy = makeHierarchy([slide]);
        controller.initialSlideKey = '42';
        controller.hierarchyLoadSeq = 1;
        controller.loadingStart = Date.now() - 1000;
        const prefetchSpy = jest
            .spyOn(controller, 'prefetchSlideMetadata')
            .mockResolvedValue(undefined);

        capturedOpenCb!();
        capturedTileDrawnCb!();
        capturedFullyLoadedCb!({ fullyLoaded: true });
        expect(idleCallbacks).toHaveLength(2);

        controller.dispose();
        expect((window as any).cancelIdleCallback).toHaveBeenCalledWith(1);
        expect((window as any).cancelIdleCallback).toHaveBeenCalledWith(2);

        expect(prefetchSpy).not.toHaveBeenCalled();
    });

    it('reports the outcome and first-tile time once the first tile is ready', async () => {
        window.location.hash = '';
        const slide = makeSlide({ slide_key: '42' });
        const inst = await runMount(slide, { studyId: 'study-1' });
        const controller = controllerOf(inst);
        const reportSpy = jest
            .spyOn(inst as any, 'reportInitialSlideLoadPerformance')
            .mockImplementation(() => undefined);

        controller.initialSlideKey = '42';
        controller.initialSlideLoadStartedAt = Date.now() - 50;
        controller.loadingStart = Date.now() - 1000;

        capturedOpenCb!();
        capturedTileDrawnCb!();
        capturedTileDrawnCb!();

        expect(reportSpy).toHaveBeenCalledTimes(1);
        const reportedMetric = reportSpy.mock.calls[0][0] as any;
        expect(Object.keys(reportedMetric).sort()).toEqual([
            'firstTileReadyMs',
            'outcome',
        ]);
        expect(reportedMetric.outcome).toBe('success');
        expect(reportedMetric.firstTileReadyMs).toBeGreaterThanOrEqual(50);
    });

    it('dispatches the browser performance event', () => {
        const inst = makeInstance('P-1');
        const dispatchSpy = jest
            .spyOn(window, 'dispatchEvent')
            .mockReturnValue(true);

        (inst as any).reportInitialSlideLoadPerformance({
            outcome: 'success',
            firstTileReadyMs: 67,
        });

        expect(dispatchSpy).toHaveBeenCalledTimes(1);
        const event = dispatchSpy.mock.calls[0][0] as CustomEvent;
        expect(event.type).toBe('wsi-initial-slide-performance');
        expect(event.detail).toEqual({
            outcome: 'success',
            firstTileReadyMs: 67,
        });

        dispatchSpy.mockRestore();
    });

    it('reloads the initial slide from the published hierarchy after cache clear', async () => {
        const hierarchy: PatientHierarchy = {
            ...makeLoadedHierarchy([
                makeSlide({
                    slide_key: '42',
                    sample_id: 'S-123456-T01',
                    match_level: 'BLOCK',
                    specimen_key: 'block::1::1',
                }),
            ]),
            patient_id: 'P-1',
        };
        const preloadFetchMock = jest
            .fn()
            .mockImplementation((url: string, init?: RequestInit) => {
                if (url.includes('/wsi/v2/resources/')) {
                    return Promise.resolve({
                        ok: true,
                        json: () =>
                            Promise.resolve(
                                makeAccessPayload({ slideKey: '42' })
                            ),
                    });
                }
                return Promise.resolve(rowsResponse(hierarchy, init));
            });
        setFetchMock(preloadFetchMock);

        const rowsUrl = '/api/resource-table/query/fetch';
        await fetchWsiPatientHierarchy('study', 'P-1');
        await getWsiSlideAccess('study', '42', false, 'anonymousUser');

        clearPatientHierarchyCache();
        clearWsiSlideAccess();

        const networkFetchMock = jest
            .fn()
            .mockImplementation((url: string, init?: RequestInit) => {
                if (url === rowsUrl) {
                    return Promise.resolve(rowsResponse(hierarchy, init));
                }
                if (url.includes('/wsi/v2/resources/')) {
                    return Promise.resolve({
                        ok: true,
                        json: () =>
                            Promise.resolve(
                                makeAccessPayload({ slideKey: '42' })
                            ),
                    });
                }
                return Promise.reject(new Error('unexpected metadata fetch'));
            });
        setFetchMock(networkFetchMock);

        const origRaf = (global as any).requestAnimationFrame;
        (global as any).requestAnimationFrame = (cb: FrameRequestCallback) => {
            cb(0);
            return 0;
        };

        try {
            const inst = makeInstance('P-1');
            await loadHierarchyFor(inst);

            expect(inst.viewerState.selectedMeta).toMatchObject({
                max_zoom: 6,
                tile_size: 256,
            });
            const requests = networkFetchMock.mock.calls.map(
                ([url]: [string]) => url
            );
            expect(requests[0]).toBe(rowsUrl);
            expect(
                requests.filter((url: string) => url.includes('/thumbnails'))
            ).toHaveLength(1);
        } finally {
            (global as any).requestAnimationFrame = origRaf;
        }
    });
});
