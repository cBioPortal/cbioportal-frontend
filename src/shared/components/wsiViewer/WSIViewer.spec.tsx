/**
 * @jest-environment jsdom
 */
import * as React from 'react';
import { assert } from 'chai';
import { action as mobxAction } from 'mobx';
import TestRenderer, { act } from 'react-test-renderer';
import WSIViewer from './WSIViewer';
import { readWsiHashState } from './wsiViewStateUtils';
import * as wsiMetaUtils from './wsiMetaUtils';
import * as wsiSlideUtils from './wsiSlideUtils';
import {
    clearPatientHierarchyCache,
    fetchPatientHierarchyReadOnly,
    hasCachedPatientHierarchy,
    seedPatientHierarchyCache,
} from './wsiHierarchyFetchCache';
import { clearMolecularProfileIdCache } from './wsiCbioportalDataUtils';
import {
    clearSlideMetadataCache,
    preloadSlideMetadata,
    seedSlideMetadataCache,
} from './wsiMetadataFetchCache';
import {
    PatientHierarchy,
    PatientBootstrapResponse,
    Block,
    Part,
    Sample,
    Slide,
} from './wsiViewerTypes';

const mockLoadOpenSeadragon = jest.fn();
const mockFetchPatientBootstrap = jest.fn();
const mockFetchPatientHierarchyWithBootstrap = jest.fn();
const mockHasCachedPatientBootstrap = jest.fn();
const mockHydratePatientBootstrapCaches = jest.fn();
const serverConfig = {
    msk_wsi_enable_bootstrap: false,
};

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
    hasPreloadedOpenSeadragon: () => false,
}));

jest.mock('./wsiBootstrapFetch', () => ({
    fetchPatientHierarchyWithBootstrap: (...args: unknown[]) =>
        mockFetchPatientHierarchyWithBootstrap(...args),
    fetchPatientBootstrapReadOnly: (...args: unknown[]) =>
        mockFetchPatientBootstrap(...args),
    hasCachedPatientBootstrap: (...args: unknown[]) =>
        mockHasCachedPatientBootstrap(...args),
    hydratePatientBootstrapCaches: (...args: unknown[]) =>
        mockHydratePatientBootstrapCaches(...args),
    isWsiBootstrapEnabled: () => serverConfig.msk_wsi_enable_bootstrap === true,
}));

jest.mock('config/config', () => ({
    getServerConfig: () => serverConfig,
}));

// Keep a reference to the original shared mockViewer so integration tests can
// restore it after overriding OSD.mockReturnValue() for per-test fresh viewers.
const OSD = jest.requireMock('openseadragon') as jest.MockedFunction<any>;
const _origMockViewer = OSD();
OSD.mockClear(); // don't count this bootstrap call in real test assertions
mockLoadOpenSeadragon.mockResolvedValue(OSD);

// ---- test data factories ----

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

function makeBlock(slides: Slide[], blockNumber = '1'): Block {
    return {
        block_number: blockNumber,
        block_label: `A${blockNumber}`,
        slides,
    };
}

function makePart(blocks: Block[]): Part {
    return {
        part_number: '1',
        part_designator: 'A',
        part_type: 'Resection',
        part_description: 'Test part',
        subspecialty: 'GI',
        path_dx_title: 'COLON ADENOCARCINOMA',
        blocks,
    };
}

function makeSample(sampleId: string, parts: Part[]): Sample {
    return {
        sample_id: sampleId,
        cancer_type: 'Colorectal Cancer',
        cancer_type_detailed: 'Colon Adenocarcinoma',
        oncotree_code: 'COAD',
        primary_site: 'Colon',
        sample_type: 'Primary',
        parts,
    };
}

function makeHierarchy(slides: Slide[], patientId = 'P-123'): PatientHierarchy {
    const block = makeBlock(slides);
    const part = makePart([block]);
    const sample = makeSample('S-123456-T01', [part]);
    return { patient_id: patientId, samples: [sample] };
}

/** Create an unattached WSIViewer instance (no DOM, lifecycle not started). */
function makeInstance(url: string): any {
    // Bypass React's constructor warning by calling via super
    return new (WSIViewer as any)({ url, height: 500 });
}

function controllerOf(inst: any): any {
    return inst.controller;
}

function setFetchMock(mockImpl: unknown) {
    (global as any).fetch = mockImpl;
}

async function loadHierarchyFor(inst: any) {
    await controllerOf(inst).loadHierarchy();
}

function renderViewer(url = 'https://tiles.example.com/patient/P-1') {
    let renderer: TestRenderer.ReactTestRenderer;
    act(() => {
        renderer = TestRenderer.create(<WSIViewer url={url} height={500} />);
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
    mockFetchPatientBootstrap.mockReset();
    mockFetchPatientHierarchyWithBootstrap.mockImplementation(
        async (
            options: { hierarchyUrl: string; tileServerBase: string },
            signal?: AbortSignal
        ) => {
            if (
                serverConfig.msk_wsi_enable_bootstrap === true &&
                !hasCachedPatientHierarchy(options.hierarchyUrl)
            ) {
                try {
                    const payload = await mockFetchPatientBootstrap(
                        { hierarchyUrl: options.hierarchyUrl },
                        signal
                    );
                    mockHydratePatientBootstrapCaches(
                        options.hierarchyUrl,
                        options.tileServerBase,
                        payload
                    );
                    return {
                        hierarchy: payload.hierarchy,
                        initial: payload.initial,
                        source: 'bootstrap',
                        bootstrapStatus: payload.initial
                            ? 'success'
                            : 'missing-initial',
                        cacheHit: mockHasCachedPatientBootstrap(options),
                    };
                } catch (error) {
                    if (signal?.aborted) throw error;
                    const hierarchy = await fetchPatientHierarchyReadOnly(
                        options.hierarchyUrl,
                        signal
                    );
                    return {
                        hierarchy,
                        initial: null,
                        source: 'hierarchy',
                        bootstrapStatus: 'failed',
                        cacheHit: false,
                    };
                }
            }
            return {
                hierarchy: await fetchPatientHierarchyReadOnly(
                    options.hierarchyUrl,
                    signal
                ),
                initial: null,
                source: 'hierarchy',
                bootstrapStatus: serverConfig.msk_wsi_enable_bootstrap
                    ? 'skipped-cache-hit'
                    : 'disabled',
                cacheHit:
                    serverConfig.msk_wsi_enable_bootstrap &&
                    mockHasCachedPatientBootstrap(options),
            };
        }
    );
    mockHasCachedPatientBootstrap.mockReset();
    mockHasCachedPatientBootstrap.mockReturnValue(false);
    mockHydratePatientBootstrapCaches.mockReset();
    serverConfig.msk_wsi_enable_bootstrap = false;
    clearPatientHierarchyCache();
    clearMolecularProfileIdCache();
    clearSlideMetadataCache();
});

describe('WSIViewer — tileServerBase', () => {
    [
        [
            'strips /patient/{id} with no trailing slash',
            'https://tiles.example.com/patient/P-123456',
            'https://tiles.example.com',
        ],
        [
            'strips /patient/{id}/ with trailing slash',
            'https://tiles.example.com/patient/P-123456/',
            'https://tiles.example.com',
        ],
        [
            'handles a path prefix before /patient/',
            'https://tiles.example.com/api/v1/patient/P-789',
            'https://tiles.example.com/api/v1',
        ],
        [
            'returns URL unchanged when no /patient/ segment is present',
            'https://tiles.example.com',
            'https://tiles.example.com',
        ],
        [
            'handles numeric-only patient IDs (legacy IMPACT format)',
            'http://localhost:8081/patient/12345',
            'http://localhost:8081',
        ],
    ].forEach(([name, url, expected]) => {
        it(name as string, () => {
            const inst = makeInstance(url as string);
            assert.equal(inst.tileServerBase, expected);
        });
    });
});

describe('WSIViewer — servableSlides', () => {
    it('returns empty array when hierarchy is null', () => {
        const inst = makeInstance('https://tiles.example.com/patient/P-1');
        assert.deepEqual(inst.servableSlides, []);
    });

    it('returns only slides with can_serve_tiles=true', () => {
        const inst = makeInstance('https://tiles.example.com/patient/P-1');
        const servable = makeSlide({ image_id: 'A', can_serve_tiles: true });
        const notServable = makeSlide({
            image_id: 'B',
            can_serve_tiles: false,
        });
        inst.hierarchy = makeHierarchy([servable, notServable]);

        const result: any[] = inst.servableSlides;
        assert.equal(result.length, 1);
        assert.equal(result[0].slide.image_id, 'A');
    });

    it('deduplicates repeated servable entries for the same image within a sample', () => {
        const inst = makeInstance('https://tiles.example.com/patient/P-1');
        const duplicated = makeSlide({ image_id: 'A', can_serve_tiles: true });
        inst.hierarchy = makeHierarchy([duplicated, { ...duplicated }]);

        const result: any[] = inst.servableSlides;
        assert.equal(result.length, 1);
        assert.equal(result[0].slide.image_id, 'A');
    });

    it('returns empty array when all slides have can_serve_tiles=false', () => {
        const inst = makeInstance('https://tiles.example.com/patient/P-1');
        inst.hierarchy = makeHierarchy([
            makeSlide({ can_serve_tiles: false }),
            makeSlide({ can_serve_tiles: false }),
        ]);
        assert.equal(inst.servableSlides.length, 0);
    });

    it('flattens slides across multiple samples, parts and blocks', () => {
        const inst = makeInstance('https://tiles.example.com/patient/P-1');

        const slideA = makeSlide({ image_id: 'A', can_serve_tiles: true });
        const slideB = makeSlide({ image_id: 'B', can_serve_tiles: true });
        const slideC = makeSlide({ image_id: 'C', can_serve_tiles: false });

        const block1 = makeBlock([slideA, slideC], '1');
        const block2 = makeBlock([slideB], '2');
        const part1 = makePart([block1, block2]);
        const sample1 = makeSample('S-001', [part1]);

        const slideD = makeSlide({ image_id: 'D', can_serve_tiles: true });
        const block3 = makeBlock([slideD], '1');
        const part2 = makePart([block3]);
        const sample2 = makeSample('S-002', [part2]);

        inst.hierarchy = { patient_id: 'P-1', samples: [sample1, sample2] };

        const result: any[] = inst.servableSlides;
        assert.equal(result.length, 3);
        assert.deepEqual(
            result.map((r: any) => r.slide.image_id),
            ['A', 'B', 'D']
        );
    });

    it('attaches the correct sample to each slide entry', () => {
        const inst = makeInstance('https://tiles.example.com/patient/P-1');
        const slide = makeSlide({ image_id: 'X', can_serve_tiles: true });
        inst.hierarchy = makeHierarchy([slide]);

        const result: any[] = inst.servableSlides;
        assert.equal(result[0].sample.sample_id, 'S-123456-T01');
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
            inst.hierarchy = makeHierarchy([makeSlide()]);
        })();
        assert.isNotNull(
            inst.hierarchy,
            'precondition: hierarchy should be set'
        );

        act(() => {
            renderer.unmount();
        });

        assert.isNull(inst.hierarchy);
    });

    it('does not throw when called before hierarchy is loaded', () => {
        const { renderer, inst } = renderViewer();
        assert.isNull(inst.hierarchy);
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
        const hierarchy = makeHierarchy([makeSlide({ image_id: 'A' })]);
        const sample = hierarchy.samples[0];
        const slide = sample.parts[0].blocks[0].slides[0];

        act(() => {
            mobxAction(() => {
                inst.loading = false;
                inst.hierarchy = hierarchy;
                inst.selectedSample = sample;
                inst.selectedSlide = slide;
                inst.selectedMeta = {
                    dimensions: { width: 1000, height: 800 },
                    levels: 1,
                    level_dimensions: [{ width: 1000, height: 800 }],
                    max_zoom: 6,
                    tile_size: 256,
                    mpp: { x: 0.25, y: 0.25 },
                };
                inst.tilesReady = true;
            })();
        });

        const renderSpy = jest.spyOn(inst, 'render');
        renderSpy.mockClear();

        act(() => {
            inst.handleCursorMove(10, 20);
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
    it('only mounts the latest slide after rapid left-nav clicks', () => {
        jest.useFakeTimers();
        try {
            const inst = new (WSIViewer as any)({
                url: 'https://tiles.example.com/patient/P-XYZ',
                height: 500,
            });
            const sample = makeSample('S-1', [
                makePart([
                    makeBlock([
                        makeSlide({ image_id: 'slide-1' }),
                        makeSlide({ image_id: 'slide-2' }),
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
                expect.objectContaining({ image_id: 'slide-2' }),
                sample
            );
        } finally {
            jest.useRealTimers();
        }
    });

    it('honors a matching share-link slide when pathology filters are present', () => {
        const inst = new (WSIViewer as any)({
            url: 'https://tiles.example.com/patient/P-XYZ',
            height: 500,
            pathologyFilter: { matchLevel: 'UNMATCHED' },
        });
        const sample = makeSample('S-1', [
            makePart([
                makeBlock(
                    [
                        makeSlide({ image_id: 'first-unmatched' }),
                        makeSlide({ image_id: 'linked-unmatched' }),
                    ],
                    '1'
                ),
            ]),
        ]);
        const hierarchy = {
            patient_id: 'P-XYZ',
            samples: [sample],
            slide_associations: [
                {
                    image_id: 'first-unmatched',
                    sample_id: 'S-1',
                    match_level: 'UNMATCHED',
                    can_serve_tiles: true,
                },
                {
                    image_id: 'linked-unmatched',
                    sample_id: 'S-1',
                    match_level: 'UNMATCHED',
                    can_serve_tiles: true,
                },
            ],
        };
        inst.hierarchy = hierarchy;
        inst.stainFilter = 'hne';
        window.location.hash =
            '#wsi:slide=linked-unmatched&x=10&y=20&z=1.000000';

        const selected = (inst as any).chooseInitialServableSlide(
            (inst as any).servableSlides
        );

        expect(selected.slide.image_id).toBe('linked-unmatched');
        window.location.hash = '';
    });

    it('reloads the hierarchy when the pathology-filter sample id changes', () => {
        const inst = new (WSIViewer as any)({
            url: 'https://tiles.example.com/patient/P-XYZ',
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
            url: 'https://tiles.example.com/patient/P-XYZ',
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
            url: 'https://tiles.example.com/patient/P-XYZ',
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
                        makeSlide({ image_id: 'block-slide' }),
                        makeSlide({
                            image_id: 'part-slide',
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
            slide_associations: [
                {
                    image_id: 'block-slide',
                    sample_id: 'S-1',
                    match_level: 'BLOCK',
                    specimen_key: 'block::1::A1',
                    slide_type: 'H&E',
                    can_serve_tiles: true,
                },
                {
                    image_id: 'part-slide',
                    sample_id: 'S-1',
                    match_level: 'PART',
                    specimen_key: 'part::2::B1',
                    slide_type: 'H&E',
                    can_serve_tiles: true,
                },
            ],
        };
        inst.hierarchy = sourceHierarchy as any;
        inst.selectedSample = sample;
        inst.selectedSlide = sample.parts[0].blocks[0].slides[0];

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
            url: 'https://tiles.example.com/patient/P-XYZ',
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
            expect.objectContaining({ image_id: 'part-slide' }),
            expect.objectContaining({ sample_id: 'S-1' })
        );
        expect(inst.matchFilter).toBe('part');
    });

    it('checks the current slide against the matching sample instead of scanning all hierarchy entries on local pathology-filter reuse', () => {
        const inst = new (WSIViewer as any)({
            url: 'https://tiles.example.com/patient/P-XYZ',
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
                        makeSlide({ image_id: 'block-slide' }),
                        makeSlide({
                            image_id: 'part-slide',
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
            slide_associations: [
                {
                    image_id: 'block-slide',
                    sample_id: 'S-1',
                    match_level: 'BLOCK',
                    specimen_key: 'block::1::A1',
                    slide_type: 'H&E',
                    can_serve_tiles: true,
                },
            ],
        };
        inst.hierarchy = sourceHierarchy as any;
        inst.selectedSample = sample;
        inst.selectedSlide = sample.parts[0].blocks[0].slides[0];

        const getEntriesSpy = jest.spyOn(
            wsiSlideUtils,
            'getServableSlideEntriesForHierarchyReadOnly'
        );
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

        expect(getEntriesSpy).not.toHaveBeenCalled();
        expect(getOrderedSlidesSpy).toHaveBeenCalledTimes(1);
        expect(inst.selectedSlide?.image_id).toBe('block-slide');
        expect(inst.selectedSample?.sample_id).toBe('S-1');
        expect(inst.hierarchy).toEqual(sourceHierarchy);
    });

    it('reselects from the loaded hierarchy when only the preferred sample changes', () => {
        const inst = new (WSIViewer as any)({
            url: 'https://tiles.example.com/patient/P-XYZ',
            height: 500,
            preferredSampleId: 'S-1',
        });
        const sample1 = makeSample('S-1', [
            makePart([makeBlock([makeSlide({ image_id: 'slide-1' })], '1')]),
        ]);
        const sample2 = makeSample('S-2', [
            makePart([makeBlock([makeSlide({ image_id: 'slide-2' })], '1')]),
        ]);
        inst.hierarchy = {
            patient_id: 'P-XYZ',
            samples: [sample1, sample2],
        };
        inst.selectedSample = sample1;
        inst.selectedSlide = sample1.parts[0].blocks[0].slides[0];

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
            url: 'https://tiles.example.com/patient/P-XYZ',
            height: 500,
            preferredSampleId: 'S-1',
        });

        expect(disposeSpy).not.toHaveBeenCalled();
        expect(loadHierarchySpy).not.toHaveBeenCalled();
        expect(selectSlideSpy).toHaveBeenCalledWith(
            expect.objectContaining({ image_id: 'slide-2' }),
            expect.objectContaining({ sample_id: 'S-2' })
        );
    });

    it('reselects a visible slide when the stain filter hides the current selection', () => {
        const inst = new (WSIViewer as any)({
            url: 'https://tiles.example.com/patient/P-XYZ',
            height: 500,
        });
        const sample = makeSample('S-1', [
            makePart([
                makeBlock(
                    [
                        makeSlide({ image_id: 'hne-slide' }),
                        makeSlide({
                            image_id: 'ihc-slide',
                            is_hne: false,
                            is_ihc: true,
                            stain_name: 'IHC',
                            stain_group: 'IHC',
                        }),
                    ],
                    '1'
                ),
            ]),
        ]);
        inst.hierarchy = {
            patient_id: 'P-XYZ',
            samples: [sample],
        };
        inst.selectedSample = sample;
        inst.selectedSlide = sample.parts[0].blocks[0].slides[1];

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
            expect.objectContaining({ image_id: 'hne-slide' }),
            expect.objectContaining({ sample_id: 'S-1' })
        );
    });

    it('loads the first visible slide when the stain filter changes', () => {
        const inst = new (WSIViewer as any)({
            url: 'https://tiles.example.com/patient/P-XYZ',
            height: 500,
        });
        const sample = makeSample('S-1', [
            makePart([
                makeBlock(
                    [
                        makeSlide({ image_id: 'first-hne-slide' }),
                        makeSlide({ image_id: 'second-hne-slide' }),
                    ],
                    '1'
                ),
            ]),
        ]);
        inst.hierarchy = {
            patient_id: 'P-XYZ',
            samples: [sample],
        };
        inst.selectedSample = sample;
        inst.selectedSlide = sample.parts[0].blocks[0].slides[1];
        inst.matchFilter = 'all';

        const controller = controllerOf(inst);
        const selectSlideSpy = jest
            .spyOn(controller, 'selectSlide')
            .mockResolvedValue(undefined);

        (inst as any).handleFilterChange('hne');

        expect(selectSlideSpy).toHaveBeenCalledWith(
            expect.objectContaining({ image_id: 'first-hne-slide' }),
            expect.objectContaining({ sample_id: 'S-1' })
        );
    });

    it('reselects a visible slide when the match filter hides the current selection', () => {
        const inst = new (WSIViewer as any)({
            url: 'https://tiles.example.com/patient/P-XYZ',
            height: 500,
        });
        const sample = makeSample('S-1', [
            makePart([
                makeBlock(
                    [
                        makeSlide({ image_id: 'block-slide' }),
                        makeSlide({
                            image_id: 'part-slide',
                            block_number: '2',
                            block_label: 'B1',
                        }),
                    ],
                    '1'
                ),
            ]),
        ]);
        inst.hierarchy = {
            patient_id: 'P-XYZ',
            samples: [sample],
            slide_associations: [
                {
                    image_id: 'block-slide',
                    sample_id: 'S-1',
                    match_level: 'BLOCK',
                    specimen_key: 'block::1::A1',
                    slide_type: 'H&E',
                    can_serve_tiles: true,
                },
                {
                    image_id: 'part-slide',
                    sample_id: 'S-1',
                    match_level: 'PART',
                    specimen_key: 'part::2::B1',
                    slide_type: 'H&E',
                    can_serve_tiles: true,
                },
            ],
        };
        inst.selectedSample = sample;
        inst.selectedSlide = sample.parts[0].blocks[0].slides[0];

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
            expect.objectContaining({ image_id: 'part-slide' }),
            expect.objectContaining({ sample_id: 'S-1' })
        );
    });

    it('loads the first visible slide when the match filter changes', () => {
        const inst = new (WSIViewer as any)({
            url: 'https://tiles.example.com/patient/P-XYZ',
            height: 500,
        });
        const sample = makeSample('S-1', [
            makePart([
                makeBlock(
                    [
                        makeSlide({ image_id: 'first-part-slide' }),
                        makeSlide({ image_id: 'second-part-slide' }),
                    ],
                    '1'
                ),
            ]),
        ]);
        inst.hierarchy = {
            patient_id: 'P-XYZ',
            samples: [sample],
            slide_associations: [
                {
                    image_id: 'first-part-slide',
                    sample_id: 'S-1',
                    match_level: 'PART',
                    specimen_key: 'part::1',
                    slide_type: 'H&E',
                    can_serve_tiles: true,
                },
                {
                    image_id: 'second-part-slide',
                    sample_id: 'S-1',
                    match_level: 'PART',
                    specimen_key: 'part::2',
                    slide_type: 'H&E',
                    can_serve_tiles: true,
                },
            ],
        };
        inst.selectedSample = sample;
        inst.selectedSlide = sample.parts[0].blocks[0].slides[1];
        inst.matchFilter = 'all';

        const controller = controllerOf(inst);
        const selectSlideSpy = jest
            .spyOn(controller, 'selectSlide')
            .mockResolvedValue(undefined);

        (inst as any).handleMatchFilterChange('part');

        expect(selectSlideSpy).toHaveBeenCalledWith(
            expect.objectContaining({ image_id: 'first-part-slide' }),
            expect.objectContaining({ sample_id: 'S-1' })
        );
    });

    it('clears the selected slide when filters have no matches', () => {
        const inst = new (WSIViewer as any)({
            url: 'https://tiles.example.com/patient/P-XYZ',
            height: 500,
        });
        const sample = makeSample('S-1', [
            makePart([makeBlock([makeSlide({ image_id: 'part-slide' })], '1')]),
        ]);
        inst.hierarchy = {
            patient_id: 'P-XYZ',
            samples: [sample],
            slide_associations: [
                {
                    image_id: 'part-slide',
                    sample_id: 'S-1',
                    match_level: 'PART',
                    specimen_key: 'part::1',
                    slide_type: 'H&E',
                    can_serve_tiles: true,
                },
            ],
        };
        inst.selectedSample = sample;
        inst.selectedSlide = sample.parts[0].blocks[0].slides[0];

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
            url: 'https://tiles.example.com/patient/P-XYZ',
            height: 500,
            initialStainFilter: 'all',
            pathologyFilter: {
                sampleId: 'S-1',
                matchLevel: 'BLOCK',
                specimenKey: 'specimen::1::1',
            },
        });
        const sample = makeSample('S-1', [
            makePart([makeBlock([makeSlide({ image_id: 'slide-1' })], '1')]),
        ]);
        inst.hierarchy = {
            patient_id: 'P-XYZ',
            samples: [sample],
        };
        inst.selectedSample = sample;
        inst.selectedSlide = sample.parts[0].blocks[0].slides[0];

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
            url: 'https://tiles.example.com/patient/P-XYZ',
            height: 500,
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
            url: 'https://tiles.example.com/patient/P-XYZ',
            height: 500,
        });
        const sample = makeSample('S-1', [
            makePart([makeBlock([makeSlide({ image_id: 'hne-slide' })], '1')]),
        ]);
        inst.hierarchy = {
            patient_id: 'P-XYZ',
            samples: [sample],
        };
        inst.selectedSample = sample;
        inst.selectedSlide = sample.parts[0].blocks[0].slides[0];
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

    it('does not remount when re-selecting the already active ready slide', async () => {
        const inst = new (WSIViewer as any)({
            url: 'https://tiles.example.com/patient/P-XYZ',
            height: 500,
        });
        const sample = makeSample('S-1', [
            makePart([makeBlock([makeSlide({ image_id: 'hne-slide' })], '1')]),
        ]);
        const slide = sample.parts[0].blocks[0].slides[0];
        const controller = controllerOf(inst);

        inst.selectedSample = sample;
        inst.selectedSlide = slide;
        inst.selectedMeta = {
            dimensions: { width: 1000, height: 800 },
            levels: 1,
            level_dimensions: [{ width: 1000, height: 800 }],
            max_zoom: 6,
            tile_size: 256,
        };
        (controller as any).osdViewer = { destroy: jest.fn() };

        const beginSpy = jest.spyOn(inst as any, 'beginSlideSelection');
        const mountSpy = jest
            .spyOn(controller as any, 'mountOSD')
            .mockResolvedValue(undefined);

        await controller.selectSlide(slide, sample);

        expect(beginSpy).not.toHaveBeenCalled();
        expect(mountSpy).not.toHaveBeenCalled();
    });
});

describe('WSIViewer — cached sidebar data', () => {
    let origRaf: typeof globalThis.requestAnimationFrame;

    beforeEach(() => {
        origRaf = (global as any).requestAnimationFrame;
    });

    afterEach(() => {
        (global as any).requestAnimationFrame = origRaf;
    });

    it('keeps metadata row references stable across unrelated state changes', () => {
        const inst = makeInstance('https://tiles.example.com/patient/P-1');
        const hierarchy = makeHierarchy([makeSlide({ image_id: 'A' })], 'P-1');
        const sample = hierarchy.samples[0];
        const slide = sample.parts[0].blocks[0].slides[0];

        act(() => {
            mobxAction(() => {
                inst.hierarchy = hierarchy;
                inst.selectedSample = sample;
                inst.selectedSlide = slide;
                inst.selectedMeta = {
                    dimensions: { width: 1000, height: 800 },
                    levels: 1,
                    level_dimensions: [{ width: 1000, height: 800 }],
                    max_zoom: 6,
                    tile_size: 256,
                    mpp: { x: 0.25, y: 0.25 },
                };
                inst.spinnerVisible = false;
            })();
        });

        const firstWsiRows = (inst as any).selectedWsiRows;
        const firstPathRows = (inst as any).selectedPathRows;

        act(() => {
            mobxAction(() => {
                inst.spinnerVisible = true;
            })();
        });

        expect((inst as any).selectedWsiRows).toBe(firstWsiRows);
        expect((inst as any).selectedPathRows).toBe(firstPathRows);
    });

    it('freezes cached sidebar rows so callers cannot mutate the shared viewer cache', () => {
        const inst = makeInstance('https://tiles.example.com/patient/P-1');
        const hierarchy = makeHierarchy([makeSlide({ image_id: 'A' })], 'P-1');
        const sample = hierarchy.samples[0];
        const slide = sample.parts[0].blocks[0].slides[0];

        act(() => {
            mobxAction(() => {
                inst.hierarchy = hierarchy;
                inst.selectedSample = sample;
                inst.selectedSlide = slide;
                inst.selectedMeta = {
                    dimensions: { width: 1000, height: 800 },
                    levels: 1,
                    level_dimensions: [{ width: 1000, height: 800 }],
                    max_zoom: 6,
                    tile_size: 256,
                    mpp: { x: 0.25, y: 0.25 },
                };
            })();
        });

        const seqRows = (inst as any).selectedSeqRows;
        const wsiRows = (inst as any).selectedWsiRows;
        const pathRows = (inst as any).selectedPathRows;

        expect(Object.isFrozen(seqRows)).toBe(true);
        expect(Object.isFrozen(seqRows[0])).toBe(true);
        expect(Object.isFrozen(wsiRows)).toBe(true);
        expect(Object.isFrozen(wsiRows[0])).toBe(true);
        expect(Object.isFrozen(pathRows)).toBe(true);
        expect(Object.isFrozen(pathRows[0])).toBe(true);

        expect(() => {
            seqRows.push({ label: 'mutated', value: 'mutated' });
        }).toThrow(TypeError);
        expect(() => {
            wsiRows[0].label = 'mutated';
        }).toThrow(TypeError);
        expect(() => {
            pathRows[0].value = 'mutated';
        }).toThrow(TypeError);

        expect((inst as any).selectedSeqRows).toBe(seqRows);
        expect((inst as any).selectedWsiRows).toBe(wsiRows);
        expect((inst as any).selectedPathRows).toBe(pathRows);
    });

    it('invalidates cached sidebar rows after in-place sample enrichment', () => {
        const inst = makeInstance('https://tiles.example.com/patient/P-1');
        const hierarchy = makeHierarchy([makeSlide({ image_id: 'A' })], 'P-1');
        (hierarchy.samples[0] as any).tmb_score = '7.1';

        act(() => {
            mobxAction(() => {
                inst.hierarchy = hierarchy;
                inst.selectedSample = inst.hierarchy.samples[0];
                inst.selectedSlide =
                    inst.hierarchy.samples[0].parts[0].blocks[0].slides[0];
            })();
        });

        const initialSeqRows = (inst as any).selectedSeqRows;
        const initialPathRows = (inst as any).selectedPathRows;

        act(() => {
            (inst as any).applyHierarchyMutation((samples: any[]) => {
                samples[0].tmb_score = '12.3';
                samples[0].primary_site = 'Rectum';
            });
        });

        const nextSeqRows = (inst as any).selectedSeqRows;
        const nextPathRows = (inst as any).selectedPathRows;

        expect(nextSeqRows).not.toBe(initialSeqRows);
        expect(nextPathRows).not.toBe(initialPathRows);
        expect(nextSeqRows).toContainEqual(
            expect.objectContaining({ label: 'TMB', value: '12.3 mut/Mb' })
        );
        expect(nextPathRows).toContainEqual(
            expect.objectContaining({
                label: 'Primary site',
                value: 'Rectum',
            })
        );
        expect((inst as any).hierarchyDataVersion).toBe(1);
    });

    it('recomputes WSI rows after in-place slide enrichment', () => {
        const inst = makeInstance('https://tiles.example.com/patient/P-1');
        const hierarchy = makeHierarchy([makeSlide({ image_id: 'A' })], 'P-1');
        const sample = hierarchy.samples[0];
        const slide = sample.parts[0].blocks[0].slides[0];
        const meta = {
            dimensions: { width: 1000, height: 2000 },
            mpp: { x: 0.25, y: 0.25 },
            max_zoom: 4,
            tile_size: 256,
        };

        act(() => {
            mobxAction(() => {
                inst.hierarchy = hierarchy;
                inst.selectedSample = sample;
                inst.selectedSlide = slide;
                inst.selectedMeta = meta;
            })();
        });

        const buildWsiRowsSpy = jest.spyOn(
            wsiMetaUtils,
            'buildWsiRowsReadOnly'
        );
        (inst as any).selectedWsiRows;
        buildWsiRowsSpy.mockClear();

        act(() => {
            (inst as any).applyHierarchyMutation((samples: any[]) => {
                samples[0].parts[0].blocks[0].slides[0].file_size_bytes =
                    '200000000';
            });
        });

        (inst as any).selectedWsiRows;

        expect(buildWsiRowsSpy).toHaveBeenCalledTimes(1);
        expect(buildWsiRowsSpy).toHaveBeenCalledWith(slide, meta);
        expect((inst as any).hierarchyDataVersion).toBe(1);
        buildWsiRowsSpy.mockRestore();
    });

    it('coalesces multiple hierarchy refreshes into one frame', () => {
        let scheduledFrame: FrameRequestCallback | undefined;
        (global as any).requestAnimationFrame = (cb: FrameRequestCallback) => {
            scheduledFrame = cb;
            return 1;
        };

        const inst = makeInstance('https://tiles.example.com/patient/P-1');
        inst.hierarchy = makeHierarchy([makeSlide({ image_id: 'A' })], 'P-1');
        const updateSpy = jest.spyOn(inst as any, 'updateHierarchy');

        act(() => {
            (inst as any).applyHierarchyMutationAndRefresh((samples: any[]) => {
                samples[0].tmb_score = '12.3';
            });
            (inst as any).applyHierarchyMutationAndRefresh((samples: any[]) => {
                samples[0].msi_type = 'MSI-H';
            });
        });

        expect(updateSpy).not.toHaveBeenCalled();
        expect((inst as any).hierarchyRefreshScheduled).toBe(true);

        act(() => {
            scheduledFrame?.(0);
        });

        expect(updateSpy).toHaveBeenCalledTimes(1);
        updateSpy.mockRestore();
    });

    it('defers sidebar thumbnail loading until the first tile is ready', () => {
        const inst = makeInstance('https://tiles.example.com/patient/P-1');
        const hierarchy = makeHierarchy([makeSlide({ image_id: 'A' })], 'P-1');
        const sample = hierarchy.samples[0];
        const slide = sample.parts[0].blocks[0].slides[0];

        act(() => {
            mobxAction(() => {
                inst.hierarchy = hierarchy;
                inst.selectedSample = sample;
                inst.selectedSlide = slide;
                inst.tilesReady = false;
            })();
        });

        expect((inst as any).sidebarThumbDeferred).toBe(true);
        expect((inst as any).sidebarThumbSrc).toBeNull();

        act(() => {
            mobxAction(() => {
                inst.tilesReady = true;
            })();
        });

        expect((inst as any).sidebarThumbDeferred).toBe(false);
        expect((inst as any).sidebarThumbSrc).toBe(
            'https://tiles.example.com/tiles/A/thumbnail'
        );
    });

    it('defers MSK-IMPACT sidebar content until the first tile is ready', () => {
        const inst = makeInstance('https://tiles.example.com/patient/P-1');
        const hierarchy = makeHierarchy([makeSlide({ image_id: 'A' })], 'P-1');
        const sample = hierarchy.samples[0];
        const slide = sample.parts[0].blocks[0].slides[0];
        sample.tmb_score = '12.3';

        act(() => {
            mobxAction(() => {
                inst.hierarchy = hierarchy;
                inst.selectedSample = sample;
                inst.selectedSlide = slide;
                inst.tilesReady = false;
            })();
        });

        expect((inst as any).sidebarImpactSample).toBeNull();
        expect((inst as any).sidebarSeqRowsForRender).toEqual([]);

        act(() => {
            mobxAction(() => {
                inst.tilesReady = true;
            })();
        });

        expect((inst as any).sidebarImpactSample?.sample_id).toBe(
            sample.sample_id
        );
        expect((inst as any).sidebarSeqRowsForRender).toEqual(
            (inst as any).selectedSeqRows
        );
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

        const inst = makeInstance('https://tiles.example.com/patient/P-1');
        await loadHierarchyFor(inst);

        assert.isNotNull(inst.error, 'error should be set');
        assert.include(inst.error, '502');
        assert.isFalse(inst.loading);
    });

    it('sets error and clears loading when fetch rejects (network error)', async () => {
        setFetchMock(jest.fn().mockRejectedValue(new Error('Network failure')));

        const inst = makeInstance('https://tiles.example.com/patient/P-1');
        await loadHierarchyFor(inst);

        assert.include(inst.error, 'Network failure');
        assert.isFalse(inst.loading);
    });

    it('populates hierarchy and clears loading on successful response', async () => {
        // Provide a hierarchy with no servable slides to avoid triggering
        // mountOSD (which requires a real DOM container and OSD canvas).
        const mockHierarchy = makeHierarchy(
            [makeSlide({ can_serve_tiles: false })],
            'P-XYZ'
        );
        setFetchMock(
            jest.fn().mockResolvedValue({
                ok: true,
                json: () => Promise.resolve(mockHierarchy),
            })
        );

        const inst = makeInstance('https://tiles.example.com/patient/P-XYZ');
        await loadHierarchyFor(inst);

        assert.isNull(inst.error);
        assert.isFalse(inst.loading);
        assert.equal(inst.hierarchy?.patient_id, 'P-XYZ');
    });

    it('clears previous hierarchy and error before re-fetching', async () => {
        // First: put instance into an error state
        setFetchMock(jest.fn().mockRejectedValue(new Error('first error')));
        const inst = makeInstance('https://tiles.example.com/patient/P-1');
        await loadHierarchyFor(inst);
        assert.isNotNull(
            inst.error,
            'precondition: error set after first call'
        );

        // Second: successful fetch
        const mockHierarchy = makeHierarchy([
            makeSlide({ can_serve_tiles: false }),
        ]);
        setFetchMock(
            jest.fn().mockResolvedValue({
                ok: true,
                json: () => Promise.resolve(mockHierarchy),
            })
        );
        await loadHierarchyFor(inst);

        assert.isNull(inst.error);
        assert.isNotNull(inst.hierarchy);
    });

    it('bumps mountSeq to invalidate stale in-flight OSD mounts', async () => {
        setFetchMock(jest.fn().mockRejectedValue(new Error('ignore')));
        const inst = makeInstance('https://tiles.example.com/patient/P-1');
        const controller = controllerOf(inst);
        const seqBefore = controller.mountSeq as number;

        await loadHierarchyFor(inst);

        assert.isAbove(controller.mountSeq, seqBefore);
    });

    it('defers enrichment and all-slide prefetch until the first view is usable', async () => {
        (global as any).requestAnimationFrame = (cb: FrameRequestCallback) => {
            cb(0);
            return 0;
        };
        const mockHierarchy = makeHierarchy(
            [makeSlide({ image_id: 'A', can_serve_tiles: true })],
            'P-XYZ'
        );
        setFetchMock(
            jest.fn().mockResolvedValue({
                ok: true,
                json: () => Promise.resolve(mockHierarchy),
            })
        );

        const inst = new (WSIViewer as any)({
            url: 'https://tiles.example.com/patient/P-XYZ',
            height: 500,
            studyId: 'study-1',
        });
        const controller = controllerOf(inst);
        jest.spyOn(controller, 'selectSlide').mockResolvedValue(undefined);
        const prefetchSpy = jest
            .spyOn(controller as any, 'prefetchSlideMetadata')
            .mockResolvedValue(undefined);
        const enrichSpy = jest
            .spyOn(controller as any, 'enrichSamplesFromCbioportal')
            .mockResolvedValue(undefined);

        await loadHierarchyFor(inst);

        expect(controller.selectSlide).toHaveBeenCalledTimes(1);
        expect(prefetchSpy).not.toHaveBeenCalled();
        expect(enrichSpy).not.toHaveBeenCalled();
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
        const mockHierarchy = makeHierarchy(
            [makeSlide({ image_id: 'A', can_serve_tiles: true })],
            'P-XYZ'
        );
        setFetchMock(
            jest.fn().mockResolvedValue({
                ok: true,
                json: () => Promise.resolve(mockHierarchy),
            })
        );

        const inst = new (WSIViewer as any)({
            url: 'https://tiles.example.com/patient/P-XYZ',
            height: 500,
            studyId: 'study-1',
        });
        const controller = controllerOf(inst);
        const fetchMetadataSpy = jest
            .spyOn(controller as any, 'fetchSlideMetadata')
            .mockImplementation(async () => {
                releaseMetadata();
                return {
                    dimensions: { width: 1000, height: 800 },
                    levels: 1,
                    level_dimensions: [{ width: 1000, height: 800 }],
                    max_zoom: 6,
                    tile_size: 256,
                };
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
            slide_associations: [
                {
                    image_id: 'matched-1',
                    sample_id: 'S-123456-T01',
                    match_level: 'BLOCK',
                    specimen_key: 'block::1::A1',
                    slide_type: 'H&E',
                    can_serve_tiles: true,
                },
                {
                    image_id: 'unmatched-1',
                    sample_id: null,
                    match_level: 'UNMATCHED',
                    specimen_key: 'unmatched::1::B1',
                    slide_type: 'H&E',
                    can_serve_tiles: true,
                },
            ],
            samples: [
                makeSample('S-123456-T01', [
                    makePart([
                        makeBlock([makeSlide({ image_id: 'matched-1' })], '1'),
                        makeBlock(
                            [
                                makeSlide({
                                    image_id: 'unmatched-1',
                                    block_number: '2',
                                    block_label: 'B1',
                                }),
                            ],
                            '2'
                        ),
                    ]),
                ]),
            ],
        };
        setFetchMock(
            jest.fn().mockResolvedValue({
                ok: true,
                json: () => Promise.resolve(mockHierarchy),
            })
        );

        const inst = new (WSIViewer as any)({
            url: 'https://tiles.example.com/patient/P-XYZ',
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

        expect(inst.hierarchy.samples).toHaveLength(1);
        expect(inst.hierarchy.samples[0].parts[0].blocks).toHaveLength(2);
        expect(
            inst.hierarchy.samples[0].parts[0].blocks.flatMap((block: any) =>
                block.slides.map((slide: Slide) => slide.image_id)
            )
        ).toEqual(['matched-1', 'unmatched-1']);
        expect(inst.matchFilter).toBe('unmatched');
        expect(inst.hierarchy.slide_associations).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    image_id: 'matched-1',
                    match_level: 'BLOCK',
                }),
                expect.objectContaining({
                    image_id: 'unmatched-1',
                    match_level: 'UNMATCHED',
                    specimen_key: 'unmatched::1::B1',
                }),
            ])
        );
        expect(selectSlideSpy).toHaveBeenCalledTimes(1);
        expect((selectSlideSpy.mock.calls[0][0] as Slide).image_id).toBe(
            'unmatched-1'
        );
    });

    it('uses the bootstrap payload when enabled and skips the legacy hierarchy fetch', async () => {
        serverConfig.msk_wsi_enable_bootstrap = true;
        const hierarchy = makeHierarchy(
            [
                makeSlide({
                    image_id: 'bootstrap-slide',
                    can_serve_tiles: true,
                }),
            ],
            'P-XYZ'
        );
        const payload: PatientBootstrapResponse = {
            hierarchy,
            initial: {
                sample_id: 'S-123456-T01',
                image_id: 'bootstrap-slide',
                metadata: {
                    dimensions: { width: 1000, height: 800 },
                    levels: 1,
                    level_dimensions: [{ width: 1000, height: 800 }],
                    max_zoom: 6,
                    tile_size: 256,
                },
            },
        };
        mockFetchPatientBootstrap.mockResolvedValue(payload);
        setFetchMock(jest.fn());

        const inst = new (WSIViewer as any)({
            url: 'https://tiles.example.com/patient/P-XYZ?studyId=study',
            height: 500,
            studyId: 'study',
        });
        const controller = controllerOf(inst);
        const selectSlideSpy = jest
            .spyOn(controller, 'selectSlide')
            .mockResolvedValue(undefined);

        await loadHierarchyFor(inst);

        expect(mockFetchPatientBootstrap).toHaveBeenCalledWith(
            {
                hierarchyUrl:
                    'https://tiles.example.com/patient/P-XYZ?studyId=study',
            },
            expect.any(Object)
        );
        expect(mockHydratePatientBootstrapCaches).toHaveBeenCalledWith(
            'https://tiles.example.com/patient/P-XYZ?studyId=study',
            'https://tiles.example.com',
            payload
        );
        expect((global as any).fetch).toHaveBeenCalledTimes(1);
        expect((global as any).fetch).toHaveBeenCalledWith(
            'https://tiles.example.com/tiles/bootstrap-slide/metadata?studyId=study'
        );
        expect(selectSlideSpy).toHaveBeenCalledWith(
            expect.objectContaining({ image_id: 'bootstrap-slide' }),
            expect.objectContaining({ sample_id: 'S-123456-T01' })
        );
    });

    it('falls back to the legacy hierarchy fetch when bootstrap fails', async () => {
        serverConfig.msk_wsi_enable_bootstrap = true;
        mockFetchPatientBootstrap.mockRejectedValue(
            new Error('bootstrap unavailable')
        );
        const mockHierarchy = makeHierarchy(
            [makeSlide({ image_id: 'legacy-slide', can_serve_tiles: true })],
            'P-XYZ'
        );
        setFetchMock(
            jest.fn().mockResolvedValue({
                ok: true,
                json: () => Promise.resolve(mockHierarchy),
            })
        );

        const inst = new (WSIViewer as any)({
            url: 'https://tiles.example.com/patient/P-XYZ',
            height: 500,
        });
        const controller = controllerOf(inst);
        jest.spyOn(controller, 'selectSlide').mockResolvedValue(undefined);

        await loadHierarchyFor(inst);

        expect((global as any).fetch).toHaveBeenNthCalledWith(
            1,
            'https://tiles.example.com/patient/P-XYZ',
            { cache: 'no-store' }
        );
        expect(inst.hierarchy?.patient_id).toBe('P-XYZ');
    });

    it('skips bootstrap when the shared hierarchy cache is already warm', async () => {
        serverConfig.msk_wsi_enable_bootstrap = true;
        const hierarchy = makeHierarchy(
            [makeSlide({ image_id: 'cached-slide', can_serve_tiles: true })],
            'P-1'
        );
        seedPatientHierarchyCache(
            'https://tiles.example.com/patient/P-1',
            hierarchy
        );
        setFetchMock(
            jest.fn(async (input: RequestInfo | URL) => {
                const url = String(input);
                if (
                    url ===
                    'https://tiles.example.com/tiles/cached-slide/metadata'
                ) {
                    return {
                        ok: true,
                        json: async () => ({
                            dimensions: { width: 1000, height: 1000 },
                            levels: 1,
                            level_dimensions: [{ width: 1000, height: 1000 }],
                            max_zoom: 4,
                            tile_size: 256,
                        }),
                    } as Response;
                }
                throw new Error(`Unexpected fetch ${url}`);
            }) as any
        );

        const inst = new (WSIViewer as any)({
            url: 'https://tiles.example.com/patient/P-1',
            height: 500,
        });
        const controller = controllerOf(inst);
        const selectSlideSpy = jest
            .spyOn(controller, 'selectSlide')
            .mockResolvedValue(undefined);

        await loadHierarchyFor(inst);

        expect(mockFetchPatientBootstrap).not.toHaveBeenCalled();
        expect(inst.hierarchy?.patient_id).toBe('P-1');
        expect(selectSlideSpy).toHaveBeenCalledWith(
            expect.objectContaining({ image_id: 'cached-slide' }),
            expect.objectContaining({ sample_id: 'S-123456-T01' })
        );
    });

    it('keeps local initial-slide precedence when bootstrap returns metadata for a different slide', async () => {
        serverConfig.msk_wsi_enable_bootstrap = true;
        const preferredSlide = makeSlide({
            image_id: 'preferred-slide',
            can_serve_tiles: true,
        });
        const fallbackSlide = makeSlide({
            image_id: 'bootstrap-slide',
            can_serve_tiles: true,
            is_hne: false,
            is_ihc: true,
            stain_name: 'IHC',
            stain_group: 'IHC',
        });
        const hierarchy = makeHierarchy(
            [preferredSlide, fallbackSlide],
            'P-XYZ'
        );
        mockFetchPatientBootstrap.mockResolvedValue({
            hierarchy,
            initial: {
                sample_id: 'S-123456-T01',
                image_id: 'bootstrap-slide',
                metadata: {
                    dimensions: { width: 1000, height: 800 },
                    levels: 1,
                    level_dimensions: [{ width: 1000, height: 800 }],
                    max_zoom: 6,
                    tile_size: 256,
                },
            },
        } as PatientBootstrapResponse);
        setFetchMock(
            jest.fn(async (input: RequestInfo | URL) => {
                const url = String(input);
                if (
                    url ===
                    'https://tiles.example.com/tiles/preferred-slide/metadata?studyId=study'
                ) {
                    return {
                        ok: true,
                        json: async () => ({
                            dimensions: { width: 1000, height: 800 },
                            levels: 1,
                            level_dimensions: [{ width: 1000, height: 800 }],
                            max_zoom: 6,
                            tile_size: 256,
                        }),
                    } as Response;
                }
                throw new Error(`Unexpected fetch ${url}`);
            }) as any
        );
        window.location.hash = '#wsi:slide=preferred-slide&x=1&y=2&z=3';

        const inst = new (WSIViewer as any)({
            url: 'https://tiles.example.com/patient/P-XYZ?studyId=study',
            height: 500,
            studyId: 'study',
        });
        const controller = controllerOf(inst);
        const selectSlideSpy = jest
            .spyOn(controller, 'selectSlide')
            .mockResolvedValue(undefined);

        await loadHierarchyFor(inst);

        expect(selectSlideSpy).toHaveBeenCalledWith(
            expect.objectContaining({ image_id: 'preferred-slide' }),
            expect.objectContaining({ sample_id: 'S-123456-T01' })
        );
        expect((global as any).fetch).toHaveBeenCalledWith(
            'https://tiles.example.com/tiles/preferred-slide/metadata?studyId=study'
        );
    });

    it('resets bootstrap metadata tracing when frontend filtering excludes the bootstrap initial slide', async () => {
        serverConfig.msk_wsi_enable_bootstrap = true;
        const mockHierarchy: PatientHierarchy = {
            patient_id: 'P-XYZ',
            slide_associations: [
                {
                    image_id: 'matched-1',
                    sample_id: 'S-123456-T01',
                    match_level: 'BLOCK',
                    specimen_key: 'block::1::A1',
                    slide_type: 'H&E',
                    can_serve_tiles: true,
                },
                {
                    image_id: 'unmatched-1',
                    sample_id: null,
                    match_level: 'UNMATCHED',
                    specimen_key: 'unmatched::1::B1',
                    slide_type: 'H&E',
                    can_serve_tiles: true,
                },
            ],
            samples: [
                makeSample('S-123456-T01', [
                    makePart([
                        makeBlock([makeSlide({ image_id: 'matched-1' })], '1'),
                        makeBlock(
                            [
                                makeSlide({
                                    image_id: 'unmatched-1',
                                    block_number: '2',
                                    block_label: 'B1',
                                }),
                            ],
                            '2'
                        ),
                    ]),
                ]),
            ],
        };
        const payload: PatientBootstrapResponse = {
            hierarchy: mockHierarchy,
            initial: {
                sample_id: 'S-123456-T01',
                image_id: 'matched-1',
                metadata: {
                    dimensions: { width: 1000, height: 800 },
                    levels: 1,
                    level_dimensions: [{ width: 1000, height: 800 }],
                    max_zoom: 6,
                    tile_size: 256,
                },
            },
        };
        mockFetchPatientBootstrap.mockResolvedValue(payload);
        setFetchMock(
            jest.fn().mockResolvedValue({
                ok: true,
                json: () =>
                    Promise.resolve({
                        dimensions: { width: 1000, height: 800 },
                        levels: 1,
                        level_dimensions: [{ width: 1000, height: 800 }],
                        max_zoom: 6,
                        tile_size: 256,
                    }),
            })
        );

        const inst = new (WSIViewer as any)({
            url: 'https://tiles.example.com/patient/P-XYZ?studyId=study',
            height: 500,
            pathologyFilter: {
                matchLevel: 'Unmatched',
                specimenKey: 'unmatched::1::B1',
            },
        });
        const controller = controllerOf(inst);
        jest.spyOn(controller, 'selectSlide').mockResolvedValue(undefined);

        await loadHierarchyFor(inst);

        expect(controller.initialSlideLoadTrace).toEqual(
            expect.objectContaining({
                bootstrapStatus: 'success',
                metadataSource: 'network',
                metadataCacheHit: false,
                slideId: 'unmatched-1',
            })
        );
    });

    it('preloads OpenSeadragon once and reuses it for the initial slide mount', async () => {
        (global as any).requestAnimationFrame = (cb: FrameRequestCallback) => {
            cb(0);
            return 0;
        };
        const mockHierarchy = makeHierarchy(
            [makeSlide({ image_id: 'A', can_serve_tiles: true })],
            'P-XYZ'
        );
        const metadata = {
            dimensions: { width: 1000, height: 800 },
            max_zoom: 6,
            tile_size: 256,
        };
        setFetchMock(
            jest.fn().mockImplementation((url: string) => {
                if (url.includes('/metadata')) {
                    return Promise.resolve({
                        ok: true,
                        json: () => Promise.resolve(metadata),
                    });
                }
                return Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve(mockHierarchy),
                });
            })
        );

        const inst = makeInstance('https://tiles.example.com/patient/P-XYZ');
        (inst as any).viewerContainerRef = {
            current: document.createElement('div'),
        };

        await loadHierarchyFor(inst);

        expect(mockLoadOpenSeadragon).toHaveBeenCalledTimes(1);
    });

    it('shows an error when the lazy OpenSeadragon import fails', async () => {
        (global as any).requestAnimationFrame = (cb: FrameRequestCallback) => {
            cb(0);
            return 0;
        };
        mockLoadOpenSeadragon.mockRejectedValue(new Error('OSD chunk failed'));
        const mockHierarchy = makeHierarchy(
            [makeSlide({ image_id: 'A', can_serve_tiles: true })],
            'P-XYZ'
        );
        const metadata = {
            dimensions: { width: 1000, height: 800 },
            max_zoom: 6,
            tile_size: 256,
        };
        setFetchMock(
            jest.fn().mockImplementation((url: string) => {
                if (url.includes('/metadata')) {
                    return Promise.resolve({
                        ok: true,
                        json: () => Promise.resolve(metadata),
                    });
                }
                return Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve(mockHierarchy),
                });
            })
        );

        const inst = makeInstance('https://tiles.example.com/patient/P-XYZ');
        (inst as any).viewerContainerRef = {
            current: document.createElement('div'),
        };

        await loadHierarchyFor(inst);

        expect(inst.error).toContain('OSD init error');
        expect(inst.error).toContain('OSD chunk failed');
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

    it('stops iterating when hierarchy is nulled mid-loop', async () => {
        // Each fetch call in the prefetch loop checks `if (!this.hierarchy) return`.
        // Setting hierarchy=null between fetches should halt the loop without error.
        const inst = makeInstance('https://tiles.example.com/patient/P-1');
        const slide1 = makeSlide({ image_id: 'AAA', can_serve_tiles: true });
        const slide2 = makeSlide({ image_id: 'BBB', can_serve_tiles: true });
        inst.hierarchy = makeHierarchy([slide1, slide2]);

        let fetchCallCount = 0;
        setFetchMock(
            jest.fn().mockImplementation(async () => {
                fetchCallCount++;
                // Null the hierarchy after the first fetch to simulate unmount
                if (fetchCallCount === 1) {
                    inst.hierarchy = null;
                }
                return { ok: true, json: () => Promise.resolve({}) };
            })
        );

        // Run the loop — it should stop after first slide because hierarchy→null.
        await controllerOf(inst).prefetchSlideMetadata(undefined);

        assert.isAtMost(
            fetchCallCount,
            2,
            'should not continue after hierarchy cleared'
        );
    });

    it('deduplicates concurrent metadata fetches for the same slide', async () => {
        const inst = makeInstance('https://tiles.example.com/patient/P-1');
        const controller = controllerOf(inst);
        const slide = makeSlide({ image_id: 'AAA', can_serve_tiles: true });
        inst.hierarchy = makeHierarchy([slide]);

        setFetchMock(
            jest.fn().mockResolvedValue({
                ok: true,
                json: () =>
                    Promise.resolve({
                        dimensions: { width: 1000, height: 800 },
                        max_zoom: 6,
                        tile_size: 256,
                    }),
            })
        );

        const firstPromise = controller.fetchSlideMetadata('AAA');
        const secondPromise = controller.fetchSlideMetadata('AAA');

        expect(secondPromise).toBe(firstPromise);

        await Promise.all([firstPromise, secondPromise]);

        expect((global as any).fetch).toHaveBeenCalledTimes(1);
    });

    it('prefetches metadata in bounded concurrent batches', async () => {
        const inst = makeInstance('https://tiles.example.com/patient/P-1');
        const controller = controllerOf(inst);
        const slides = ['AAA', 'BBB', 'CCC', 'DDD'].map(image_id =>
            makeSlide({ image_id, can_serve_tiles: true })
        );
        inst.hierarchy = makeHierarchy(slides);

        const order: string[] = [];
        const deferred = new Map<string, ReturnType<typeof deferredPromise>>();
        slides.forEach(slide => {
            deferred.set(slide.image_id, deferredPromise<void>());
        });

        jest.spyOn(controller, 'fetchSlideMetadata').mockImplementation(
            (imageId: string) => {
                order.push(imageId);
                return deferred.get(imageId)!.promise.then(() => ({
                    dimensions: { width: 1000, height: 800 },
                    max_zoom: 6,
                    tile_size: 256,
                }));
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
        expect(order).toEqual(['AAA', 'BBB', 'CCC']);

        await new Promise(resolve => setTimeout(resolve, 180));
        expect(order).toEqual(['AAA', 'BBB', 'CCC', 'DDD']);

        deferred.get('DDD')!.resolve();
        await prefetchPromise;
    });

    it('prioritizes same-sample and active-stain metadata prefetches first', async () => {
        const inst = makeInstance('https://tiles.example.com/patient/P-1');
        const controller = controllerOf(inst);
        const selectedSampleSlides = [
            makeSlide({ image_id: 'BBB', can_serve_tiles: true, is_hne: true }),
            makeSlide({
                image_id: 'CCC',
                can_serve_tiles: true,
                is_hne: false,
                is_ihc: true,
                stain_name: 'IHC',
            }),
        ];
        const otherSampleSlides = [
            makeSlide({ image_id: 'AAA', can_serve_tiles: true, is_hne: true }),
            makeSlide({
                image_id: 'DDD',
                can_serve_tiles: true,
                is_hne: false,
                is_ihc: true,
                stain_name: 'IHC',
            }),
        ];
        const selectedSample = makeSample('S-selected', [
            makePart([makeBlock(selectedSampleSlides)]),
        ]);
        const otherSample = makeSample('S-other', [
            makePart([makeBlock(otherSampleSlides)]),
        ]);
        inst.hierarchy = {
            patient_id: 'P-1',
            samples: [otherSample, selectedSample],
        };
        inst.selectedSample = selectedSample;
        inst.stainFilter = 'hne';

        const order: string[] = [];
        jest.spyOn(controller, 'fetchSlideMetadata').mockImplementation(
            async (imageId: string) => {
                order.push(imageId);
                return {
                    dimensions: { width: 1000, height: 800 },
                    levels: 1,
                    level_dimensions: [{ width: 1000, height: 800 }],
                    max_zoom: 6,
                    tile_size: 256,
                };
            }
        );

        await controller.prefetchSlideMetadata(undefined);

        expect(order).toEqual(['BBB', 'CCC', 'AAA', 'DDD']);
    });

    it('does not spend prefetch queue slots on duplicate servable image ids', async () => {
        const inst = makeInstance('https://tiles.example.com/patient/P-1');
        const controller = controllerOf(inst);
        const duplicateSlideA = makeSlide({
            image_id: 'AAA',
            can_serve_tiles: true,
        });
        const duplicateSlideB = makeSlide({
            image_id: 'AAA',
            can_serve_tiles: true,
            block_number: '2',
            block_label: 'A2',
            barcode: 'dup-aaa',
        });
        const slideB = makeSlide({
            image_id: 'BBB',
            can_serve_tiles: true,
            block_number: '3',
            block_label: 'A3',
            barcode: 'bbb',
        });
        const slideC = makeSlide({
            image_id: 'CCC',
            can_serve_tiles: true,
            block_number: '4',
            block_label: 'A4',
            barcode: 'ccc',
        });
        const slideD = makeSlide({
            image_id: 'DDD',
            can_serve_tiles: true,
            block_number: '5',
            block_label: 'A5',
            barcode: 'ddd',
        });
        inst.hierarchy = makeHierarchy([
            duplicateSlideA,
            duplicateSlideB,
            slideB,
            slideC,
            slideD,
        ]);

        const order: string[] = [];
        const deferred = new Map<string, ReturnType<typeof deferredPromise>>();
        ['AAA', 'BBB', 'CCC', 'DDD'].forEach(imageId => {
            deferred.set(imageId, deferredPromise<void>());
        });

        jest.spyOn(controller, 'fetchSlideMetadata').mockImplementation(
            (imageId: string) => {
                order.push(imageId);
                return deferred.get(imageId)!.promise.then(() => ({
                    dimensions: { width: 1000, height: 800 },
                    levels: 1,
                    level_dimensions: [{ width: 1000, height: 800 }],
                    max_zoom: 6,
                    tile_size: 256,
                }));
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

        await new Promise(resolve => setTimeout(resolve, 180));
        expect(order).toEqual(['AAA', 'BBB', 'CCC', 'DDD']);

        deferred.get('DDD')!.resolve();
        await prefetchPromise;
    });
});

describe('WSIViewer — sample enrichment scheduling', () => {
    it('runs independent enrichment fetches in parallel stages', async () => {
        const inst = makeInstance('https://tiles.example.com/patient/P-1');
        const order: string[] = [];
        const clinical = deferredPromise();
        const mutations = deferredPromise();
        const cna = deferredPromise();
        const structuralVariants = deferredPromise();

        jest.spyOn(inst as any, 'fetchAndMergeClinicalData').mockImplementation(
            () => {
                order.push('clinical');
                return clinical.promise;
            }
        );
        jest.spyOn(inst as any, 'fetchAndMergeMutations').mockImplementation(
            () => {
                order.push('mutations');
                return mutations.promise;
            }
        );
        const civicSpy = jest
            .spyOn(inst as any, 'fetchAndMergeCivicAnnotations')
            .mockResolvedValue(undefined);
        const frequencySpy = jest
            .spyOn(inst as any, 'fetchAndMergeMutationFrequency')
            .mockResolvedValue(undefined);
        const oncoKbSpy = jest
            .spyOn(inst as any, 'fetchAndMergeOncoKbAnnotations')
            .mockResolvedValue(undefined);
        jest.spyOn(inst as any, 'fetchAndMergeCNA').mockImplementation(() => {
            order.push('cna');
            return cna.promise;
        });
        jest.spyOn(
            inst as any,
            'fetchAndMergeStructuralVariants'
        ).mockImplementation(() => {
            order.push('sv');
            return structuralVariants.promise;
        });
        const cnaOncoKbSpy = jest
            .spyOn(inst as any, 'fetchAndMergeCnaOncoKbAnnotations')
            .mockResolvedValue(undefined);
        const cnaCivicSpy = jest
            .spyOn(inst as any, 'fetchAndMergeCnaCivicAnnotations')
            .mockResolvedValue(undefined);
        const svOncoKbSpy = jest
            .spyOn(
                inst as any,
                'fetchAndMergeStructuralVariantOncoKbAnnotations'
            )
            .mockResolvedValue(undefined);

        const enrichmentPromise = (inst as any).runSampleEnrichment(
            '',
            'study-1',
            'P-1',
            ['S-1'],
            () => true
        );

        await Promise.resolve();
        expect(order).toEqual(['clinical', 'mutations']);
        expect((inst as any).fetchAndMergeCNA).not.toHaveBeenCalled();
        expect(
            (inst as any).fetchAndMergeStructuralVariants
        ).not.toHaveBeenCalled();

        clinical.resolve();
        await Promise.resolve();
        expect((inst as any).fetchAndMergeCNA).not.toHaveBeenCalled();

        mutations.resolve();
        await Promise.resolve();
        await Promise.resolve();
        expect(order).toEqual(['clinical', 'mutations', 'cna', 'sv']);
        expect(oncoKbSpy).not.toHaveBeenCalled();
        expect(civicSpy).not.toHaveBeenCalled();
        expect(frequencySpy).not.toHaveBeenCalled();

        cna.resolve();
        await Promise.resolve();
        expect(cnaOncoKbSpy).not.toHaveBeenCalled();
        expect(cnaCivicSpy).not.toHaveBeenCalled();
        expect(svOncoKbSpy).not.toHaveBeenCalled();
        expect(oncoKbSpy).not.toHaveBeenCalled();
        expect(civicSpy).not.toHaveBeenCalled();
        expect(frequencySpy).not.toHaveBeenCalled();

        structuralVariants.resolve();
        await enrichmentPromise;

        expect(oncoKbSpy).toHaveBeenCalledTimes(1);
        expect(civicSpy).toHaveBeenCalledTimes(1);
        expect(frequencySpy).toHaveBeenCalledTimes(1);
        expect(cnaOncoKbSpy).toHaveBeenCalledTimes(1);
        expect(cnaCivicSpy).toHaveBeenCalledTimes(1);
        expect(svOncoKbSpy).toHaveBeenCalledTimes(1);
    });

    it('skips mutation hierarchy updates when no mutation data and no existing mutation text are available', async () => {
        const inst = makeInstance('https://tiles.example.com/patient/P-1');
        inst.hierarchy = makeHierarchy([makeSlide({ image_id: 'A' })], 'P-1');
        const sampleIdentifiers = [
            {
                studyId: 'study-1',
                sampleId: inst.hierarchy.samples[0].sample_id,
            },
        ];
        const originalFetch = (global as any).fetch;
        (global as any).fetch = jest
            .fn()
            .mockResolvedValueOnce({
                ok: true,
                json: async () => [],
            })
            .mockResolvedValueOnce({
                ok: true,
                json: async () => null,
            });

        const applySpy = jest.spyOn(inst as any, 'applyHierarchyMutation');

        await (inst as any).fetchAndMergeMutations(
            '',
            'study-1',
            sampleIdentifiers
        );

        expect(applySpy).not.toHaveBeenCalled();
        applySpy.mockRestore();
        (global as any).fetch = originalFetch;
    });

    it('deduplicates sample identifiers before staged enrichment fetches', async () => {
        const inst = makeInstance('https://tiles.example.com/patient/P-1');
        const dedupedIdentifiers = [
            { studyId: 'study-1', sampleId: 'S-1' },
            { studyId: 'study-1', sampleId: 'S-2' },
        ];

        const clinicalSpy = jest
            .spyOn(inst as any, 'fetchAndMergeClinicalData')
            .mockResolvedValue(undefined);
        const mutationSpy = jest
            .spyOn(inst as any, 'fetchAndMergeMutations')
            .mockResolvedValue(undefined);
        const cnaSpy = jest
            .spyOn(inst as any, 'fetchAndMergeCNA')
            .mockResolvedValue(undefined);
        const structuralVariantSpy = jest
            .spyOn(inst as any, 'fetchAndMergeStructuralVariants')
            .mockResolvedValue(undefined);
        jest.spyOn(
            inst as any,
            'fetchAndMergeOncoKbAnnotations'
        ).mockResolvedValue(undefined);
        jest.spyOn(
            inst as any,
            'fetchAndMergeCivicAnnotations'
        ).mockResolvedValue(undefined);
        jest.spyOn(
            inst as any,
            'fetchAndMergeMutationFrequency'
        ).mockResolvedValue(undefined);
        jest.spyOn(
            inst as any,
            'fetchAndMergeCnaOncoKbAnnotations'
        ).mockResolvedValue(undefined);
        jest.spyOn(
            inst as any,
            'fetchAndMergeCnaCivicAnnotations'
        ).mockResolvedValue(undefined);
        jest.spyOn(
            inst as any,
            'fetchAndMergeStructuralVariantOncoKbAnnotations'
        ).mockResolvedValue(undefined);

        await (inst as any).runSampleEnrichment(
            '',
            'study-1',
            'P-1',
            ['S-1', 'S-1', 'S-2'],
            () => true
        );

        expect(clinicalSpy).toHaveBeenCalledWith(
            '',
            'study-1',
            dedupedIdentifiers
        );
        expect(mutationSpy).toHaveBeenCalledWith(
            '',
            'study-1',
            dedupedIdentifiers
        );
        expect(cnaSpy).toHaveBeenCalledWith('', 'study-1', dedupedIdentifiers);
        expect(structuralVariantSpy).toHaveBeenCalledWith(
            '',
            'study-1',
            dedupedIdentifiers
        );
    });
});

describe('WSIViewer — goToCoordinates', () => {
    it('does nothing when osdViewer is null', () => {
        const inst = makeInstance('https://tiles.example.com/patient/P-1');
        inst.coordInputX = '100';
        inst.coordInputY = '200';
        // Should not throw
        (inst as any).goToCoordinates();
    });

    it('calls viewport.imageToViewportCoordinates and panTo with parsed coords', () => {
        const inst = makeInstance('https://tiles.example.com/patient/P-1');
        inst.coordInputX = '500';
        inst.coordInputY = '750';

        const mockVpPoint = { x: 0.5, y: 0.75 };
        const mockViewport = {
            imageToViewportCoordinates: jest.fn().mockReturnValue(mockVpPoint),
            panTo: jest.fn(),
        };
        controllerOf(inst).osdViewer = { viewport: mockViewport };
        controllerOf(inst).openSeadragon = OSD;

        (inst as any).goToCoordinates();

        expect(mockViewport.imageToViewportCoordinates).toHaveBeenCalledTimes(
            1
        );
        const arg = mockViewport.imageToViewportCoordinates.mock.calls[0][0];
        expect(arg.x).toBe(500);
        expect(arg.y).toBe(750);
        expect(mockViewport.panTo).toHaveBeenCalledWith(mockVpPoint, true);
    });

    it('does nothing when coord inputs are empty strings', () => {
        const inst = makeInstance('https://tiles.example.com/patient/P-1');
        inst.coordInputX = '';
        inst.coordInputY = '';

        const mockViewport = {
            imageToViewportCoordinates: jest.fn(),
            panTo: jest.fn(),
        };
        controllerOf(inst).osdViewer = { viewport: mockViewport };

        (inst as any).goToCoordinates();

        expect(mockViewport.panTo).not.toHaveBeenCalled();
    });

    it('does nothing when coord inputs are non-numeric', () => {
        const inst = makeInstance('https://tiles.example.com/patient/P-1');
        inst.coordInputX = 'abc';
        inst.coordInputY = 'xyz';

        const mockViewport = {
            imageToViewportCoordinates: jest.fn(),
            panTo: jest.fn(),
        };
        controllerOf(inst).osdViewer = { viewport: mockViewport };

        (inst as any).goToCoordinates();

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

    it('readHashState returns null when hash is empty', () => {
        window.location.hash = '';
        expect(readWsiHashState()).toBeNull();
    });

    it('readHashState returns null for unrelated hash', () => {
        window.location.hash = '#someOtherThing=123';
        expect(readWsiHashState()).toBeNull();
    });

    it('readHashState parses a valid wsi hash', () => {
        window.location.hash = '#wsi:slide=12345&x=500&y=750&z=1.234560';
        const state = readWsiHashState();
        expect(state).not.toBeNull();
        expect(state!.slideId).toBe('12345');
        expect(state!.x).toBe(500);
        expect(state!.y).toBe(750);
        expect(state!.z).toBeCloseTo(1.23456);
    });

    it('readHashState returns null when required fields are missing', () => {
        window.location.hash = '#wsi:slide=12345&x=500'; // missing y, z
        expect(readWsiHashState()).toBeNull();
    });

    it('readHashState returns null when x/y are non-numeric', () => {
        window.location.hash = '#wsi:slide=12345&x=abc&y=750&z=1.0';
        expect(readWsiHashState()).toBeNull();
    });

    it('copyViewLink copies the current viewport hash instead of the stale URL', async () => {
        const inst = makeInstance('https://tiles.example.com/patient/P-1');
        inst.selectedSlide = makeSlide({ image_id: '12345' });

        const writeText = jest.fn().mockResolvedValue(undefined);
        Object.assign(navigator, {
            clipboard: { writeText },
        });

        controllerOf(inst).osdViewer = {
            viewport: {
                getCenter: jest.fn().mockReturnValue({ x: 100, y: 200 }),
                getZoom: jest.fn().mockReturnValue(1.23456),
                viewportToImageCoordinates: jest.fn((pt: any) => pt),
            },
        };

        window.history.replaceState(null, '', '/patient/P-1#old');

        await (inst as any).copyViewLink();

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
    let idleCallbacks: Array<() => void>;

    const metaMock = {
        dimensions: { width: 40000, height: 30000 },
        max_zoom: 8,
        tile_size: 256,
    };

    beforeEach(() => {
        origFetch = (global as any).fetch;
        origHash = window.location.hash;
        origRaf = (global as any).requestAnimationFrame;
        origRequestIdleCallback = (window as any).requestIdleCallback;
        origCancelIdleCallback = (window as any).cancelIdleCallback;
        capturedOpenCb = null;
        capturedTileLoadedCb = null;
        capturedTileDrawnCb = null;
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

        // Tile metadata fetch mock
        (global as any).fetch = jest.fn().mockResolvedValue({
            ok: true,
            json: () => Promise.resolve(metaMock),
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

        // Fresh viewer mock that captures the 'open' once-handler for each test
        mockViewer = {
            destroy: jest.fn(),
            viewport: mockViewport,
            addOnceHandler: jest.fn((event: string, cb: () => void) => {
                if (event === 'open') capturedOpenCb = cb;
                if (event === 'tile-loaded') capturedTileLoadedCb = cb;
                if (event === 'tile-drawn') capturedTileDrawnCb = cb;
            }),
            addHandler: jest.fn(),
        };
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
            url: 'https://tiles.example.com/patient/P-1',
            height: 500,
            ...props,
        });
        inst.selectedSlide = slide;
        // Provide a real DOM container so the containerEl guard passes
        const container = document.createElement('div');
        (inst as any).viewerContainerRef = { current: container };
        const controller = controllerOf(inst);
        const seq = ++controller.mountSeq;
        await controller.mountOSD(slide, seq, restoreHashViewport);
        return inst;
    }

    it('calls goHome(true) on fresh load with no wsi hash', async () => {
        window.location.hash = '';
        const slide = makeSlide({ image_id: '42' });
        await runMount(slide);

        expect(capturedOpenCb).not.toBeNull();
        capturedOpenCb!();

        expect(mockViewport.goHome).toHaveBeenCalledWith(true);
        expect(mockViewport.panTo).not.toHaveBeenCalled();
    });

    it('surfaces a retryable error when no tile becomes ready', async () => {
        window.location.hash = '';
        const slide = makeSlide({ image_id: '42' });
        const inst = await runMount(slide);
        jest.useFakeTimers();
        try {
            capturedOpenCb!();

            jest.advanceTimersByTime(15_000);

            expect((inst as any).error).toContain('Slide tiles did not load');
            expect((inst as any).spinnerVisible).toBe(false);
            expect((inst as any).tilesReady).toBe(true);
        } finally {
            jest.useRealTimers();
        }
    });

    it('clears the timeout error when a tile arrives late', async () => {
        window.location.hash = '';
        const slide = makeSlide({ image_id: '42' });
        const inst = await runMount(slide);
        jest.useFakeTimers();
        try {
            capturedOpenCb!();
            jest.advanceTimersByTime(15_000);
            expect((inst as any).error).toContain('Slide tiles did not load');

            capturedTileLoadedCb!();

            expect((inst as any).error).toBeNull();
            expect((inst as any).tilesReady).toBe(true);
        } finally {
            jest.useRealTimers();
        }
    });

    it('calls goHome(true) when hash belongs to a different slide', async () => {
        window.location.hash = '#wsi:slide=99&x=5000&y=3000&z=0.8';
        const slide = makeSlide({ image_id: '42' }); // hash has slideId=99
        await runMount(slide);
        capturedOpenCb!();

        expect(mockViewport.goHome).toHaveBeenCalledWith(true);
        expect(mockViewport.panTo).not.toHaveBeenCalled();
    });

    it('calls panTo + zoomTo (not goHome) when hash slideId matches', async () => {
        window.location.hash = '#wsi:slide=42&x=15000&y=10000&z=2.500000';
        const slide = makeSlide({ image_id: '42' });
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
        const slide = makeSlide({ image_id: '42' });
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
        const slide = makeSlide({ image_id: '42' });

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
        const slide = makeSlide({ image_id: '42' });
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

    it('starts deferred background work only after the first tile readiness event', async () => {
        window.location.hash = '';
        const slide = makeSlide({ image_id: '42' });
        const inst = await runMount(slide, { studyId: 'study-1' });
        const controller = controllerOf(inst);
        inst.hierarchy = makeHierarchy([slide]);
        controller.initialSlideImageId = '42';
        controller.hierarchyLoadSeq = 1;
        controller.loadingStart = Date.now() - 1000;
        const prefetchSpy = jest
            .spyOn(controller, 'prefetchSlideMetadata')
            .mockResolvedValue(undefined);
        const enrichSpy = jest
            .spyOn(controller, 'enrichSamplesFromCbioportal')
            .mockResolvedValue(undefined);

        capturedOpenCb!();
        expect(prefetchSpy).not.toHaveBeenCalled();
        expect(enrichSpy).not.toHaveBeenCalled();
        expect(OSD.Navigator).not.toHaveBeenCalled();
        expect(OSD.MouseTracker).not.toHaveBeenCalled();

        capturedTileLoadedCb!();
        expect(prefetchSpy).not.toHaveBeenCalled();
        expect(enrichSpy).not.toHaveBeenCalled();
        expect(idleCallbacks).toHaveLength(2);
        expect(OSD.Navigator).not.toHaveBeenCalled();
        expect(OSD.MouseTracker).toHaveBeenCalledTimes(1);

        idleCallbacks.shift()!();
        expect(OSD.Navigator).toHaveBeenCalledTimes(1);
        expect(prefetchSpy).not.toHaveBeenCalled();
        expect(enrichSpy).not.toHaveBeenCalled();

        idleCallbacks.shift()!();
        expect(prefetchSpy).toHaveBeenCalledTimes(1);
        expect(prefetchSpy).toHaveBeenCalledWith(
            '42',
            controller.hierarchyLoadSeq
        );
        expect(idleCallbacks).toHaveLength(1);
        expect(enrichSpy).not.toHaveBeenCalled();

        idleCallbacks.shift()!();
        expect(enrichSpy).toHaveBeenCalledTimes(1);
        expect(enrichSpy).toHaveBeenCalledWith(controller.hierarchyLoadSeq);

        capturedTileDrawnCb!();
        expect(prefetchSpy).toHaveBeenCalledTimes(1);
        expect(enrichSpy).toHaveBeenCalledTimes(1);
    });

    it('cancels scheduled background work on dispose before idle execution', async () => {
        window.location.hash = '';
        const slide = makeSlide({ image_id: '42' });
        const inst = await runMount(slide, { studyId: 'study-1' });
        const controller = controllerOf(inst);
        inst.hierarchy = makeHierarchy([slide]);
        controller.initialSlideImageId = '42';
        controller.hierarchyLoadSeq = 1;
        controller.loadingStart = Date.now() - 1000;
        const prefetchSpy = jest
            .spyOn(controller, 'prefetchSlideMetadata')
            .mockResolvedValue(undefined);

        capturedOpenCb!();
        capturedTileLoadedCb!();
        expect(idleCallbacks).toHaveLength(2);

        controller.dispose();
        expect((window as any).cancelIdleCallback).toHaveBeenCalledWith(1);
        expect((window as any).cancelIdleCallback).toHaveBeenCalledWith(2);

        expect(prefetchSpy).not.toHaveBeenCalled();
    });

    it('reports staged initial-slide timings after the first tile is ready', async () => {
        window.location.hash = '';
        const slide = makeSlide({ image_id: '42' });
        const inst = await runMount(slide, { studyId: 'study-1' });
        const controller = controllerOf(inst);
        const reportSpy = jest
            .spyOn(inst as any, 'reportInitialSlideLoadPerformance')
            .mockImplementation(() => undefined);

        controller.initialSlideImageId = '42';
        controller.initialSlideLoadTrace = {
            loadSeq: 7,
            startedAt: 10,
            slideId: '42',
            openSeadragonWarmHit: false,
            hierarchyCacheHit: false,
            metadataCacheHit: false,
            hierarchySource: 'network',
            metadataSource: 'network',
            hierarchyLoadedAt: 20,
            metadataLoadedAt: 40,
            reported: false,
        };
        controller.loadingStart = Date.now() - 1000;

        capturedOpenCb!();
        capturedTileLoadedCb!();

        expect(reportSpy).toHaveBeenCalledTimes(1);
        expect(reportSpy).toHaveBeenCalledWith(
            expect.objectContaining({
                loadSeq: 7,
                slideId: '42',
                studyId: 'study-1',
                openSeadragonWarmHit: false,
                hierarchyCacheHit: false,
                metadataCacheHit: false,
                hierarchySource: 'network',
                metadataSource: 'network',
                hierarchyMs: 10,
                metadataMs: 30,
            })
        );
        const reportedMetric = reportSpy.mock.calls[0][0] as any;
        expect(reportedMetric.osdOpenMs).toBeGreaterThanOrEqual(30);
        expect(reportedMetric.firstTileReadyMs).toBeGreaterThanOrEqual(
            reportedMetric.osdOpenMs
        );
    });

    it('dispatches a non-PHI browser performance event payload', () => {
        const inst = makeInstance('https://tiles.example.com/patient/P-1');
        const dispatchSpy = jest
            .spyOn(window, 'dispatchEvent')
            .mockReturnValue(true);

        (inst as any).reportInitialSlideLoadPerformance({
            loadSeq: 7,
            slideId: 'slide-42',
            patientId: 'P-1',
            studyId: 'study-1',
            openSeadragonWarmHit: true,
            hierarchyCacheHit: false,
            metadataCacheHit: true,
            hierarchySource: 'bootstrap',
            metadataSource: 'viewer-cache',
            loadPath: 'bootstrap',
            bootstrapStatus: 'failed',
            bootstrapFallbackReason: 'Server returned 502',
            hierarchyMs: 15,
            metadataMs: 23,
            osdOpenMs: 40,
            firstTileReadyMs: 67,
        });

        expect(dispatchSpy).toHaveBeenCalledTimes(1);
        const event = dispatchSpy.mock.calls[0][0] as CustomEvent;
        expect(event.type).toBe('wsi-initial-slide-performance');
        expect(event.detail).toEqual(
            expect.objectContaining({
                loadSeq: 7,
                loadPath: 'bootstrap',
                bootstrapStatus: 'failed',
                bootstrapFallbackReason: 'Server returned 502',
                hierarchySource: 'bootstrap',
                metadataSource: 'viewer-cache',
                openSeadragonWarmHit: true,
                hierarchyCacheHit: false,
                metadataCacheHit: true,
                hierarchyMs: 15,
                metadataMs: 23,
                osdOpenMs: 40,
                firstTileReadyMs: 67,
            })
        );
        expect(event.detail).not.toHaveProperty('slideId');
        expect(event.detail).not.toHaveProperty('patientId');
        expect(event.detail).not.toHaveProperty('studyId');

        dispatchSpy.mockRestore();
    });

    it('reports cache-hit flags when initial hierarchy and metadata were warmed', async () => {
        const hierarchy = makeHierarchy([makeSlide({ image_id: '42' })], 'P-1');
        setFetchMock(
            jest.fn().mockImplementation((url: string) => {
                if (url.includes('/metadata')) {
                    return Promise.resolve({
                        ok: true,
                        json: () =>
                            Promise.resolve({
                                dimensions: { width: 1000, height: 800 },
                                levels: 1,
                                level_dimensions: [
                                    { width: 1000, height: 800 },
                                ],
                                max_zoom: 6,
                                tile_size: 256,
                            }),
                    });
                }
                return Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve(hierarchy),
                });
            })
        );

        await fetchPatientHierarchyReadOnly(
            'https://tiles.example.com/patient/P-1'
        );
        await preloadSlideMetadata('https://tiles.example.com', '42');

        window.location.hash = '';
        const inst = await runMount(makeSlide({ image_id: '42' }));
        const controller = controllerOf(inst);
        const reportSpy = jest
            .spyOn(inst as any, 'reportInitialSlideLoadPerformance')
            .mockImplementation(() => undefined);

        controller.initialSlideImageId = '42';
        controller.initialSlideLoadTrace = {
            loadSeq: 8,
            startedAt: 10,
            slideId: '42',
            openSeadragonWarmHit: true,
            hierarchyCacheHit: true,
            metadataCacheHit: true,
            hierarchySource: 'shared-cache',
            metadataSource: 'shared-cache',
            hierarchyLoadedAt: 20,
            metadataLoadedAt: 40,
            reported: false,
        };
        controller.loadingStart = Date.now() - 1000;

        capturedOpenCb!();
        capturedTileLoadedCb!();

        expect(reportSpy).toHaveBeenCalledWith(
            expect.objectContaining({
                openSeadragonWarmHit: true,
                hierarchyCacheHit: true,
                metadataCacheHit: true,
                hierarchySource: 'shared-cache',
                metadataSource: 'shared-cache',
            })
        );
    });

    it('preserves bootstrap metadata attribution when the initial slide metadata is served from the seeded shared cache', async () => {
        const metadata = {
            dimensions: { width: 1000, height: 800 },
            levels: 1,
            level_dimensions: [{ width: 1000, height: 800 }],
            max_zoom: 6,
            tile_size: 256,
        };
        const inst = makeInstance('https://tiles.example.com/patient/P-1');
        const controller = controllerOf(inst);

        controller.initialSlideImageId = '42';
        controller.initialSlideLoadTrace = {
            loadSeq: 9,
            startedAt: 10,
            slideId: '42',
            openSeadragonWarmHit: false,
            hierarchyCacheHit: false,
            metadataCacheHit: false,
            hierarchySource: 'bootstrap',
            metadataSource: 'bootstrap',
            loadPath: 'bootstrap',
            bootstrapStatus: 'success',
            reported: false,
        };

        seedSlideMetadataCache(
            'https://tiles.example.com',
            '42',
            metadata as any
        );

        await (controller as any).fetchSlideMetadata('42');

        expect(controller.initialSlideLoadTrace).toEqual(
            expect.objectContaining({
                metadataCacheHit: true,
                metadataSource: 'bootstrap',
            })
        );
    });

    it('treats a warm bootstrap-cache reuse as a hierarchy cache hit even without shared hierarchy-cache seeding', async () => {
        serverConfig.msk_wsi_enable_bootstrap = true;
        mockHasCachedPatientBootstrap.mockReturnValue(true);
        const payload: PatientBootstrapResponse = {
            hierarchy: makeHierarchy(
                [
                    makeSlide({
                        image_id: 'bootstrap-slide',
                        can_serve_tiles: true,
                    }),
                ],
                'P-XYZ'
            ),
            initial: {
                sample_id: 'S-123456-T01',
                image_id: 'bootstrap-slide',
                metadata: {
                    dimensions: { width: 1000, height: 800 },
                    levels: 1,
                    level_dimensions: [{ width: 1000, height: 800 }],
                    max_zoom: 6,
                    tile_size: 256,
                },
            },
        };
        mockFetchPatientBootstrap.mockResolvedValue(payload);
        setFetchMock(
            jest.fn().mockResolvedValue({
                ok: true,
                json: () => Promise.resolve(payload.initial!.metadata),
            })
        );

        const inst = new (WSIViewer as any)({
            url: 'https://tiles.example.com/patient/P-XYZ?studyId=study',
            height: 500,
            studyId: 'study',
        });
        const controller = controllerOf(inst);
        jest.spyOn(controller, 'selectSlide').mockResolvedValue(undefined);

        await loadHierarchyFor(inst);

        expect(controller.initialSlideLoadTrace).toEqual(
            expect.objectContaining({
                hierarchyCacheHit: true,
                hierarchySource: 'bootstrap',
            })
        );
    });

    it('reloads the initial slide from persisted hierarchy and metadata caches without network fetches', async () => {
        const hierarchy = makeHierarchy([makeSlide({ image_id: '42' })], 'P-1');
        const preloadFetchMock = jest.fn().mockImplementation((url: string) => {
            if (url.includes('/metadata')) {
                return Promise.resolve({
                    ok: true,
                    json: () =>
                        Promise.resolve({
                            dimensions: { width: 1000, height: 800 },
                            levels: 1,
                            level_dimensions: [{ width: 1000, height: 800 }],
                            max_zoom: 6,
                            tile_size: 256,
                        }),
                });
            }
            return Promise.resolve({
                ok: true,
                json: () => Promise.resolve(hierarchy),
            });
        });
        setFetchMock(preloadFetchMock);

        const hierarchyUrl = 'https://tiles.example.com/patient/P-1';
        await fetchPatientHierarchyReadOnly(hierarchyUrl);
        await preloadSlideMetadata('https://tiles.example.com', '42');

        const persistedEntries = Object.entries(window.sessionStorage);
        clearPatientHierarchyCache();
        clearSlideMetadataCache();
        persistedEntries.forEach(([key, value]) => {
            if (
                key.startsWith('wsi-hierarchy-cache-v3::') ||
                key.startsWith('wsi-metadata-cache::')
            ) {
                window.sessionStorage.setItem(key, value);
            }
        });

        const networkFetchMock = jest
            .fn()
            .mockRejectedValue(new Error('unexpected network fetch'));
        setFetchMock(networkFetchMock);

        const origRaf = (global as any).requestAnimationFrame;
        (global as any).requestAnimationFrame = (cb: FrameRequestCallback) => {
            cb(0);
            return 0;
        };

        try {
            const inst = makeInstance(hierarchyUrl);
            await loadHierarchyFor(inst);

            const trace = controllerOf(inst).initialSlideLoadTrace;
            expect(trace?.hierarchyCacheHit).toBe(true);
            expect(trace?.metadataCacheHit).toBe(true);
            expect(trace?.hierarchySource).toBe('shared-cache');
            expect(trace?.metadataSource).toBe('shared-cache');
            expect(inst.selectedMeta).toMatchObject({
                max_zoom: 6,
                tile_size: 256,
            });
            expect(networkFetchMock).not.toHaveBeenCalled();
        } finally {
            (global as any).requestAnimationFrame = origRaf;
        }
    });
});
