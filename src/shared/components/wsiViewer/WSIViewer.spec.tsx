import { assert } from 'chai';
import WSIViewer from './WSIViewer';
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
    it('sets hierarchy to null to cancel any running prefetch loop', () => {
        const inst = makeInstance('https://tiles.example.com/patient/P-1');
        inst.hierarchy = makeHierarchy([makeSlide()]);
        assert.isNotNull(inst.hierarchy, 'precondition: hierarchy should be set');

        inst.componentWillUnmount();

        assert.isNull(inst.hierarchy);
    });

    it('does not throw when called before hierarchy is loaded', () => {
        const inst = makeInstance('https://tiles.example.com/patient/P-1');
        assert.isNull(inst.hierarchy);
        assert.doesNotThrow(() => inst.componentWillUnmount());
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
        await (inst as any).loadHierarchy();

        assert.isNotNull(inst.error, 'error should be set');
        assert.include(inst.error, '502');
        assert.isFalse(inst.loading);
    });

    it('sets error and clears loading when fetch rejects (network error)', async () => {
        (global as any).fetch = jest.fn().mockRejectedValue(new Error('Network failure'));

        const inst = makeInstance('https://tiles.example.com/patient/P-1');
        await (inst as any).loadHierarchy();

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
        await (inst as any).loadHierarchy();

        assert.isNull(inst.error);
        assert.isFalse(inst.loading);
        assert.equal(inst.hierarchy?.patient_id, 'P-XYZ');
    });

    it('clears previous hierarchy and error before re-fetching', async () => {
        // First: put instance into an error state
        (global as any).fetch = jest.fn().mockRejectedValue(new Error('first error'));
        const inst = makeInstance('https://tiles.example.com/patient/P-1');
        await (inst as any).loadHierarchy();
        assert.isNotNull(inst.error, 'precondition: error set after first call');

        // Second: successful fetch
        const mockHierarchy = makeHierarchy([makeSlide({ can_serve_tiles: false })]);
        (global as any).fetch = jest.fn().mockResolvedValue({
            ok: true,
            json: () => Promise.resolve(mockHierarchy),
        });
        await (inst as any).loadHierarchy();

        assert.isNull(inst.error);
        assert.isNotNull(inst.hierarchy);
    });

    it('bumps mountSeq to invalidate stale in-flight OSD mounts', async () => {
        (global as any).fetch = jest.fn().mockRejectedValue(new Error('ignore'));
        const inst = makeInstance('https://tiles.example.com/patient/P-1');
        const seqBefore = inst.mountSeq as number;

        await (inst as any).loadHierarchy();

        assert.isAbove(inst.mountSeq, seqBefore);
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
        // Each slide triggers: metadata + thumbnail + nWorkers warmup calls.
        await (inst as any).prefetchSlideMetadata(undefined);

        // Should not have started processing slide2 (which would need another
        // metadata + thumbnail + warmup batch). The exact count is
        // 2 (meta+thumb) + nWorkers (warmup) for slide1, all launched in parallel.
        const maxForOneSlide = 2 + (inst.nWorkers ?? 4);
        assert.isAtMost(fetchCallCount, maxForOneSlide,
            'should not continue after hierarchy cleared');
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
        inst.osdViewer = { viewport: mockViewport };

        (inst as any).goToCoordinates();

        expect(mockViewport.imageToViewportCoordinates).toHaveBeenCalledTimes(1);
        const arg = mockViewport.imageToViewportCoordinates.mock.calls[0][0];
        expect(arg.x).toBe(500);
        expect(arg.y).toBe(750);
        expect(mockViewport.panTo).toHaveBeenCalledWith(mockVpPoint, false);
    });

    it('does nothing when coord inputs are empty strings', () => {
        const inst = makeInstance('https://tiles.example.com/patient/P-1');
        inst.coordInputX = '';
        inst.coordInputY = '';

        const mockViewport = {
            imageToViewportCoordinates: jest.fn(),
            panTo: jest.fn(),
        };
        inst.osdViewer = { viewport: mockViewport };

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
        inst.osdViewer = { viewport: mockViewport };

        (inst as any).goToCoordinates();

        expect(mockViewport.panTo).not.toHaveBeenCalled();
    });
});
