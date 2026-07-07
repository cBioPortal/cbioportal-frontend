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
    PatientHierarchy,
    Block,
    Part,
    Sample,
    Slide,
} from './wsiViewerTypes';

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
    return OSD;
});

// Keep a reference to the original shared mockViewer so integration tests can
// restore it after overriding OSD.mockReturnValue() for per-test fresh viewers.
const OSD = jest.requireMock('openseadragon') as jest.MockedFunction<any>;
const _origMockViewer = OSD();
OSD.mockClear(); // don't count this bootstrap call in real test assertions

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

// ---- tests ----

describe('WSIViewer — tileServerBase', () => {
    it('strips /patient/{id} with no trailing slash', () => {
        const inst = makeInstance('https://tiles.example.com/patient/P-123456');
        assert.equal(inst.tileServerBase, 'https://tiles.example.com');
    });

    it('strips /patient/{id}/ with trailing slash', () => {
        const inst = makeInstance('https://tiles.example.com/patient/P-123456/');
        assert.equal(inst.tileServerBase, 'https://tiles.example.com');
    });

    it('handles a path prefix before /patient/', () => {
        const inst = makeInstance('https://tiles.example.com/api/v1/patient/P-789');
        assert.equal(inst.tileServerBase, 'https://tiles.example.com/api/v1');
    });

    it('returns URL unchanged when no /patient/ segment is present', () => {
        const inst = makeInstance('https://tiles.example.com');
        assert.equal(inst.tileServerBase, 'https://tiles.example.com');
    });

    it('handles numeric-only patient IDs (legacy IMPACT format)', () => {
        const inst = makeInstance('http://localhost:8081/patient/12345');
        assert.equal(inst.tileServerBase, 'http://localhost:8081');
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
        (global as any).fetch = jest.fn(
            () => new Promise(() => undefined)
        ) as any;
    });

    afterEach(() => {
        (global as any).fetch = origFetch;
    });

    function renderViewer(url = 'https://tiles.example.com/patient/P-1') {
        let renderer: TestRenderer.ReactTestRenderer;
        act(() => {
            renderer = TestRenderer.create(<WSIViewer url={url} height={500} />);
        });
        const inst = renderer!.getInstance() as any;
        return { renderer: renderer!, inst };
    }

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
});

describe('WSIViewer — loadHierarchy', () => {
    let origFetch: typeof globalThis.fetch;

    beforeEach(() => {
        origFetch = (global as any).fetch;
    });

    afterEach(() => {
        (global as any).fetch = origFetch;
    });

    it('sets error and clears loading when server returns a non-ok status', async () => {
        (global as any).fetch = jest.fn().mockResolvedValue({ ok: false, status: 502 });

        const inst = makeInstance('https://tiles.example.com/patient/P-1');
        await controllerOf(inst).loadHierarchy();

        assert.isNotNull(inst.error, 'error should be set');
        assert.include(inst.error, '502');
        assert.isFalse(inst.loading);
    });

    it('sets error and clears loading when fetch rejects (network error)', async () => {
        (global as any).fetch = jest.fn().mockRejectedValue(new Error('Network failure'));

        const inst = makeInstance('https://tiles.example.com/patient/P-1');
        await controllerOf(inst).loadHierarchy();

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
        (global as any).fetch = jest.fn().mockResolvedValue({
            ok: true,
            json: () => Promise.resolve(mockHierarchy),
        });

        const inst = makeInstance('https://tiles.example.com/patient/P-XYZ');
        await controllerOf(inst).loadHierarchy();

        assert.isNull(inst.error);
        assert.isFalse(inst.loading);
        assert.equal(inst.hierarchy?.patient_id, 'P-XYZ');
    });

    it('clears previous hierarchy and error before re-fetching', async () => {
        // First: put instance into an error state
        (global as any).fetch = jest.fn().mockRejectedValue(new Error('first error'));
        const inst = makeInstance('https://tiles.example.com/patient/P-1');
        await controllerOf(inst).loadHierarchy();
        assert.isNotNull(inst.error, 'precondition: error set after first call');

        // Second: successful fetch
        const mockHierarchy = makeHierarchy([makeSlide({ can_serve_tiles: false })]);
        (global as any).fetch = jest.fn().mockResolvedValue({
            ok: true,
            json: () => Promise.resolve(mockHierarchy),
        });
        await controllerOf(inst).loadHierarchy();

        assert.isNull(inst.error);
        assert.isNotNull(inst.hierarchy);
    });

    it('bumps mountSeq to invalidate stale in-flight OSD mounts', async () => {
        (global as any).fetch = jest.fn().mockRejectedValue(new Error('ignore'));
        const inst = makeInstance('https://tiles.example.com/patient/P-1');
        const controller = controllerOf(inst);
        const seqBefore = controller.mountSeq as number;

        await controller.loadHierarchy();

        assert.isAbove(controller.mountSeq, seqBefore);
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
        (global as any).fetch = jest.fn().mockImplementation(async () => {
            fetchCallCount++;
            // Null the hierarchy after the first fetch to simulate unmount
            if (fetchCallCount === 1) {
                inst.hierarchy = null;
            }
            return { ok: true, json: () => Promise.resolve({}) };
        });

        // Run the loop — it should stop after first slide because hierarchy→null.
        await controllerOf(inst).prefetchSlideMetadata(undefined);

        assert.isAtMost(fetchCallCount, 2, 'should not continue after hierarchy cleared');
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
    let mockViewport: any;
    let mockViewer: any;
    let capturedOpenCb: (() => void) | null;

    const metaMock = {
        dimensions: { width: 40000, height: 30000 },
        max_zoom: 8,
        tile_size: 256,
    };

    beforeEach(() => {
        origFetch = (global as any).fetch;
        origHash = window.location.hash;
        origRaf = (global as any).requestAnimationFrame;
        capturedOpenCb = null;

        // Synchronous rAF so mountOSD's two-frame wait resolves immediately
        (global as any).requestAnimationFrame = (cb: FrameRequestCallback) => {
            cb(0);
            return 0;
        };

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
            }),
            addHandler: jest.fn(),
        };
        OSD.mockReturnValue(mockViewer);
    });

    afterEach(() => {
        (global as any).fetch = origFetch;
        (global as any).requestAnimationFrame = origRaf;
        window.location.hash = origHash;
        // Restore original shared mock viewer for tests outside this block
        OSD.mockReturnValue(_origMockViewer);
    });

    /** Run mountOSD on a fresh instance and return the instance. */
    async function runMount(slide: Slide): Promise<any> {
        const inst = makeInstance('https://tiles.example.com/patient/P-1');
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
});
