/**
 * @jest-environment jsdom
 */
import * as React from 'react';
import { assert } from 'chai';
import { action as mobxAction } from 'mobx';
import TestRenderer, { act } from 'react-test-renderer';
import WSIViewer from './WSIViewer';
import { readWsiHashState } from './wsiViewStateUtils';
import {
    clearPatientHierarchyCache,
    fetchPatientHierarchy,
} from './wsiHierarchyFetchCache';
import { clearMolecularProfileIdCache } from './wsiCbioportalDataUtils';
import {
    clearSlideMetadataCache,
    preloadSlideMetadata,
} from './wsiMetadataFetchCache';
import {
    PatientHierarchy,
    Block,
    Part,
    Sample,
    Slide,
} from './wsiViewerTypes';

const mockLoadOpenSeadragon = jest.fn();

// Mock OpenSeadragon so mountOSD never touches the real DOM/canvas
jest.mock('openseadragon', () => {
    const mockViewer = {
        destroy: jest.fn(),
        addOnceHandler: jest.fn(),
        addHandler: jest.fn(),
    };
    const OSD = jest.fn(() => mockViewer) as any;
    OSD.Point = function(x: number, y: number) { return { x, y }; };
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
    return { block_number: blockNumber, block_label: `A${blockNumber}`, slides };
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
    let resolve!: (value: T | PromiseLike<T>) => void;
    const promise = new Promise<T>(res => {
        resolve = res;
    });
    return { promise, resolve };
}

// ---- tests ----

beforeEach(() => {
    mockLoadOpenSeadragon.mockReset();
    mockLoadOpenSeadragon.mockResolvedValue(OSD);
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
        const notServable = makeSlide({ image_id: 'B', can_serve_tiles: false });
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
        setFetchMock(
            jest.fn(() => new Promise(() => undefined)) as any
        );
    });

    afterEach(() => {
        (global as any).fetch = origFetch;
    });
    it('sets hierarchy to null to cancel any running prefetch loop', () => {
        const { renderer, inst } = renderViewer();
        mobxAction(() => {
            inst.hierarchy = makeHierarchy([makeSlide()]);
        })();
        assert.isNotNull(inst.hierarchy, 'precondition: hierarchy should be set');

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

    it('invalidates cached sidebar rows after in-place sample enrichment', () => {
        const inst = makeInstance('https://tiles.example.com/patient/P-1');
        const hierarchy = makeHierarchy([makeSlide({ image_id: 'A' })], 'P-1');
        const sample = hierarchy.samples[0];
        const slide = sample.parts[0].blocks[0].slides[0];

        act(() => {
            mobxAction(() => {
                inst.hierarchy = hierarchy;
                inst.selectedSample = sample;
                inst.selectedSlide = slide;
            })();
        });

        const initialSeqRows = (inst as any).selectedSeqRows;
        const initialPathRows = (inst as any).selectedPathRows;

        act(() => {
            (inst as any).applyHierarchyMutation((samples: any[]) => {
                samples[0].tmb_score = '12.3';
                samples[0].sample_timepoint_days = -42;
                samples[0].sample_timepoint_source = 'Sample acquisition';
            });
        });

        const nextSeqRows = (inst as any).selectedSeqRows;
        const nextPathRows = (inst as any).selectedPathRows;

        expect(nextSeqRows).not.toBe(initialSeqRows);
        expect(nextPathRows).not.toBe(initialPathRows);
        expect((inst as any).hierarchyDataVersion).toBe(1);
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
        setFetchMock(
            jest.fn().mockRejectedValue(new Error('Network failure'))
        );

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
        setFetchMock(jest.fn().mockResolvedValue({
            ok: true,
            json: () => Promise.resolve(mockHierarchy),
        }));

        const inst = makeInstance('https://tiles.example.com/patient/P-XYZ');
        await loadHierarchyFor(inst);

        assert.isNull(inst.error);
        assert.isFalse(inst.loading);
        assert.equal(inst.hierarchy?.patient_id, 'P-XYZ');
    });

    it('clears previous hierarchy and error before re-fetching', async () => {
        // First: put instance into an error state
        setFetchMock(
            jest.fn().mockRejectedValue(new Error('first error'))
        );
        const inst = makeInstance('https://tiles.example.com/patient/P-1');
        await loadHierarchyFor(inst);
        assert.isNotNull(inst.error, 'precondition: error set after first call');

        // Second: successful fetch
        const mockHierarchy = makeHierarchy([makeSlide({ can_serve_tiles: false })]);
        setFetchMock(jest.fn().mockResolvedValue({
            ok: true,
            json: () => Promise.resolve(mockHierarchy),
        }));
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
        setFetchMock(jest.fn().mockResolvedValue({
            ok: true,
            json: () => Promise.resolve(mockHierarchy),
        }));

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
        setFetchMock(jest.fn().mockResolvedValue({
            ok: true,
            json: () => Promise.resolve(mockHierarchy),
        }));

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
        setFetchMock(jest.fn().mockImplementation((url: string) => {
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
        }));

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
        setFetchMock(jest.fn().mockImplementation((url: string) => {
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
        }));

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
        setFetchMock(jest.fn().mockImplementation(async () => {
            fetchCallCount++;
            // Null the hierarchy after the first fetch to simulate unmount
            if (fetchCallCount === 1) {
                inst.hierarchy = null;
            }
            return { ok: true, json: () => Promise.resolve({}) };
        }));

        // Run the loop — it should stop after first slide because hierarchy→null.
        await controllerOf(inst).prefetchSlideMetadata(undefined);

        assert.isAtMost(fetchCallCount, 2, 'should not continue after hierarchy cleared');
    });

    it('deduplicates concurrent metadata fetches for the same slide', async () => {
        const inst = makeInstance('https://tiles.example.com/patient/P-1');
        const controller = controllerOf(inst);
        const slide = makeSlide({ image_id: 'AAA', can_serve_tiles: true });
        inst.hierarchy = makeHierarchy([slide]);

        setFetchMock(jest.fn().mockResolvedValue({
            ok: true,
            json: () =>
                Promise.resolve({
                    dimensions: { width: 1000, height: 800 },
                    max_zoom: 6,
                    tile_size: 256,
                }),
        }));

        await Promise.all([
            controller.fetchSlideMetadata('AAA'),
            controller.fetchSlideMetadata('AAA'),
        ]);

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
        const deferred = new Map<
            string,
            ReturnType<typeof deferredPromise<void>>
        >();
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
});

describe('WSIViewer — sample enrichment scheduling', () => {
    it('runs independent enrichment fetches in parallel stages', async () => {
        const inst = makeInstance('https://tiles.example.com/patient/P-1');
        const order: string[] = [];
        const timepoints = deferredPromise();
        const clinical = deferredPromise();
        const mutations = deferredPromise();
        const cna = deferredPromise();
        const structuralVariants = deferredPromise();

        jest.spyOn(inst as any, 'fetchAndMergeSampleTimepoints').mockImplementation(() => {
            order.push('timepoints');
            return timepoints.promise;
        });
        jest.spyOn(inst as any, 'fetchAndMergeClinicalData').mockImplementation(() => {
            order.push('clinical');
            return clinical.promise;
        });
        jest.spyOn(inst as any, 'fetchAndMergeMutations').mockImplementation(() => {
            order.push('mutations');
            return mutations.promise;
        });
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
        jest.spyOn(inst as any, 'fetchAndMergeStructuralVariants').mockImplementation(() => {
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
            .spyOn(inst as any, 'fetchAndMergeStructuralVariantOncoKbAnnotations')
            .mockResolvedValue(undefined);

        const enrichmentPromise = (inst as any).runSampleEnrichment(
            '',
            'study-1',
            'P-1',
            ['S-1'],
            () => true
        );

        await Promise.resolve();
        expect(order).toEqual(['timepoints', 'clinical', 'mutations']);
        expect((inst as any).fetchAndMergeCNA).not.toHaveBeenCalled();
        expect((inst as any).fetchAndMergeStructuralVariants).not.toHaveBeenCalled();

        timepoints.resolve();
        clinical.resolve();
        await Promise.resolve();
        expect((inst as any).fetchAndMergeCNA).not.toHaveBeenCalled();

        mutations.resolve();
        await Promise.resolve();
        await Promise.resolve();
        expect(order).toEqual(['timepoints', 'clinical', 'mutations', 'cna', 'sv']);
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
            { studyId: 'study-1', sampleId: inst.hierarchy.samples[0].sample_id },
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

        expect(mockViewport.imageToViewportCoordinates).toHaveBeenCalledTimes(1);
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
        window.location.hash = '#wsi:slide=12345&x=500';  // missing y, z
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

        window.history.replaceState(
            null,
            '',
            '/patient/P-1#old'
        );

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
        props: Record<string, unknown> = {}
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
        await controller.mountOSD(slide, seq);
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
        expect(mockViewport.panTo).toHaveBeenCalledWith(expect.anything(), true);
        expect(mockViewport.zoomTo).toHaveBeenCalledWith(2.5, undefined, true);

        // imageToViewportCoordinates was called with the hash image-pixel coords
        const imgArg = mockViewport.imageToViewportCoordinates.mock.calls[0][0];
        expect(imgArg.x).toBe(15000);
        expect(imgArg.y).toBe(10000);
    });

    it('does not clobber the share-link hash before the open handler fires (selectSlide regression)', async () => {
        // The old bug: selectSlide called writeHashState() after mountOSD() returned
        // but before the OSD 'open' event fired. The viewport existed but had no tile
        // source, so image coordinates defaulted to ~(1,1), overwriting the hash.
        window.location.hash = '#wsi:slide=42&x=15000&y=10000&z=2.5';
        const slide = makeSlide({ image_id: '42' });

        await runMount(slide); // mountOSD returns; 'open' has NOT fired yet

        // Hash must still carry the original share-link coordinates
        expect(window.location.hash).toBe('#wsi:slide=42&x=15000&y=10000&z=2.5');

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
        const beforeOpen = (mockViewer.addHandler.mock.calls as [string, unknown][])
            .some(([ev]) => ev === 'animation-finish');
        expect(beforeOpen).toBe(false);

        capturedOpenCb!();

        // After 'open' fires: animation-finish listener must be registered
        const afterOpen = (mockViewer.addHandler.mock.calls as [string, unknown][])
            .some(([ev]) => ev === 'animation-finish');
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

        await fetchPatientHierarchy('https://tiles.example.com/patient/P-1');
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
        await fetchPatientHierarchy(hierarchyUrl);
        await preloadSlideMetadata('https://tiles.example.com', '42');

        const persistedEntries = Object.entries(window.sessionStorage);
        clearPatientHierarchyCache();
        clearSlideMetadataCache();
        persistedEntries.forEach(([key, value]) => {
            if (
                key.startsWith('wsi-hierarchy-cache::') ||
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
