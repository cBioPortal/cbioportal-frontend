/**
 * @jest-environment jsdom
 */
import * as React from 'react';
import { assert } from 'chai';
import { autorun, action as mobxAction } from 'mobx';
import TestRenderer, { act } from 'react-test-renderer';
import WSIViewer from './WSIViewer';
import { WsiViewerController } from './wsiViewerController';
import { readWsiHashState } from './wsiViewStateUtils';
import * as wsiSlideUtils from './wsiSlideUtils';
import {
    clearPatientHierarchyCache,
    fetchPatientHierarchyReadOnly,
    hasCachedPatientHierarchy,
} from './wsiHierarchyFetchCache';
import {
    clearWsiSlideAccess,
    registerWsiResourceAccessTarget,
} from './wsiAuth';
import {
    clearSlideMetadataCache,
    fetchSlideMetadataCachedReadOnly,
} from './wsiMetadataFetchCache';
import { clearWsiThumbnailFetchCache } from './wsiThumbnailFetchCache';
import { PatientHierarchy, Block, Part, Sample, Slide } from './wsiViewerTypes';
import { configureWsiViewerRuntime, WsiViewerConfig } from './wsiViewerConfig';

// Component tests use a synthetic origin, so keep portal API URLs relative.
function configureTestRuntime(overrides: Partial<WsiViewerConfig> = {}) {
    configureWsiViewerRuntime({
        buildApiUrl: (path: string) => `/${path}`,
        authEnabled: false,
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
    hasPreloadedOpenSeadragon: () => false,
}));

jest.mock('./wsiHierarchyFetchCache', () => ({
    clearPatientHierarchyCache: jest.requireActual('./wsiHierarchyFetchCache')
        .clearPatientHierarchyCache,
    fetchPatientHierarchyReadOnly: (...args: unknown[]) =>
        mockFetchPatientHierarchy(...args),
    hasCachedPatientHierarchy: jest.requireActual('./wsiHierarchyFetchCache')
        .hasCachedPatientHierarchy,
}));

// Keep a reference to the original shared mockViewer so integration tests can
// restore it after overriding OSD.mockReturnValue() for per-test fresh viewers.
const OSD = jest.requireMock('openseadragon') as jest.MockedFunction<any>;
const _origMockViewer = OSD();
OSD.mockClear(); // don't count this setup call in real test assertions
mockLoadOpenSeadragon.mockResolvedValue(OSD);

// ---- test data factories ----

function makeSlide(overrides: Partial<Slide> = {}): Slide {
    return {
        slide_key: '1000',
        stain_name: 'H&E',
        stain_group: 'Histology',
        is_hne: true,
        is_ihc: false,
        magnification: '20x',
        file_size_bytes: '100000000',
        can_serve_tiles: true,
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
        part_type: 'Resection',
        part_description: 'Test part',
        subspecialty: 'GI',
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

function makeWireHierarchy(slides: Slide[], patientId = 'P-123'): any {
    const block = makeBlock(slides);
    const part = makePart([block]);
    const sample = makeSample('S-123456-T01', [part]);
    return {
        referenceSampleId: sample.sample_id,
        sampleGroups: [
            {
                sampleId: sample.sample_id,
                parts: [
                    {
                        partNumber: part.part_number,
                        partType: part.part_type,
                        partDescription: part.part_description,
                        subspecialty: part.subspecialty,
                        blocks: [
                            {
                                blockNumber: block.block_number,
                                blockLabel: block.block_label,
                                slides: slides.map(slide => ({
                                    slideKey: slide.slide_key,
                                    stainName: slide.stain_name,
                                    stainGroup: slide.stain_group,
                                    isHne: slide.is_hne,
                                    isIhc: slide.is_ihc,
                                    magnification: slide.magnification,
                                    fileSizeBytes: Number(
                                        slide.file_size_bytes
                                    ),
                                    canServeTiles: slide.can_serve_tiles,
                                    slideType: slide.slide_type || null,
                                    sampleId: sample.sample_id,
                                    matchLevel: slide.match_level || 'BLOCK',
                                    specimenKey:
                                        slide.specimen_key || 'specimen-1',
                                    procedureDateDays:
                                        slide.slide_timepoint_days ?? null,
                                    timepointSource:
                                        slide.slide_timepoint_source ||
                                        'Procedure date unavailable',
                                    procedureDateKind:
                                        slide.slide_timepoint_kind || 'UNDATED',
                                    procedureDateSource:
                                        slide.slide_timepoint_date_source ||
                                        'missing_procedure_date',
                                    procedureDateReason:
                                        slide.slide_timepoint_reason ||
                                        'unavailable',
                                    procedureDateStatus:
                                        slide.slide_timepoint_status ||
                                        'MISSING_PROCEDURE_DATE',
                                    procedureCoordinateSystem:
                                        slide.slide_timepoint_coordinate_system ||
                                        'patient_first_tumor_sequencing_day_zero',
                                })),
                            },
                        ],
                    },
                ],
            },
        ],
    };
}

// Slide access is requested by slide key for a slide a loaded hierarchy
// published for the patient.
function testAccessUrl(studyId: string, patientId: string, slideKey: string) {
    return `http://localhost/api/wsi/v2/resources/${studyId}/${patientId}/access?slideKey=${slideKey}`;
}

/** Publishes a slide as a loaded hierarchy would. */
function registerTestSlideAccess(
    studyId: string,
    patientId: string,
    slideKey: string
) {
    registerWsiResourceAccessTarget(studyId, slideKey, patientId);
}

function toWireHierarchy(hierarchy: PatientHierarchy): any {
    return {
        referenceSampleId: hierarchy.reference_sample_id || null,
        sampleGroups: hierarchy.samples.map(sample => ({
            sampleId:
                sample.sample_id === 'UNMATCHED' ? null : sample.sample_id,
            parts: sample.parts.map(part => ({
                partNumber: part.part_number,
                partType: part.part_type,
                partDescription: part.part_description,
                subspecialty: part.subspecialty,
                blocks: part.blocks.map(block => ({
                    blockNumber: block.block_number,
                    blockLabel: block.block_label,
                    slides: block.slides.map(slide => {
                        const hasDays = slide.slide_timepoint_days != null;
                        return {
                            slideKey: slide.slide_key,
                            stainName: slide.stain_name,
                            stainGroup: slide.stain_group,
                            isHne: slide.is_hne,
                            isIhc: slide.is_ihc,
                            magnification: slide.magnification,
                            fileSizeBytes: slide.file_size_bytes
                                ? Number(slide.file_size_bytes)
                                : null,
                            canServeTiles: slide.can_serve_tiles,
                            slideType: slide.slide_type || null,
                            sampleId: slide.sample_id ?? sample.sample_id,
                            matchLevel:
                                slide.match_level ||
                                (sample.sample_id === 'UNMATCHED'
                                    ? 'UNMATCHED'
                                    : 'BLOCK'),
                            specimenKey: slide.specimen_key || 'specimen-1',
                            procedureDateDays:
                                slide.slide_timepoint_days ?? null,
                            timepointSource:
                                slide.slide_timepoint_source ||
                                (hasDays
                                    ? 'Procedure date'
                                    : 'Procedure date unavailable'),
                            procedureDateKind:
                                slide.slide_timepoint_kind ||
                                (hasDays ? 'RECORDED' : 'UNDATED'),
                            procedureDateSource:
                                slide.slide_timepoint_date_source ||
                                (hasDays
                                    ? 'recorded_procedure_date'
                                    : 'missing_procedure_date'),
                            procedureDateReason: hasDays
                                ? null
                                : slide.slide_timepoint_reason || 'unavailable',
                            procedureDateStatus:
                                slide.slide_timepoint_status ||
                                (hasDays
                                    ? 'AVAILABLE'
                                    : 'MISSING_PROCEDURE_DATE'),
                            procedureCoordinateSystem:
                                slide.slide_timepoint_coordinate_system ||
                                'patient_first_tumor_sequencing_day_zero',
                        };
                    }),
                })),
            })),
        })),
    };
}

function viewerPropsForUrl(url: string) {
    const parsed = new URL(url);
    const patientId = decodeURIComponent(
        parsed.pathname
            .split('/')
            .filter(Boolean)
            .pop()!
    );
    return {
        tileServerUrl: `${parsed.origin}${parsed.pathname.replace(
            /\/patient\/[^/]+\/?$/,
            ''
        )}`.replace(/\/$/, ''),
        hierarchyUrl: url,
        patientId,
    };
}

/** Create an unattached WSIViewer instance (no DOM, lifecycle not started). */
function makeInstance(url: string, props: Record<string, unknown> = {}): any {
    // Bypass React's constructor warning by calling via super
    return new (WSIViewer as any)({
        ...viewerPropsForUrl(url),
        url,
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
    url: string,
    hierarchy: PatientHierarchy,
    studyId?: string
) {
    const previousFetch = (global as any).fetch;
    setFetchMock(
        jest.fn().mockResolvedValue({
            ok: true,
            json: async () => toWireHierarchy(hierarchy),
        })
    );
    try {
        await jest
            .requireActual('./wsiHierarchyFetchCache')
            .fetchPatientHierarchyReadOnly(
                url,
                undefined,
                'anonymousUser',
                studyId,
                hierarchy.patient_id
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
                hierarchyUrl={`/api/wsi/v2/hierarchy/study/${patientId}`}
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
            .fetchPatientHierarchyReadOnly(...args)
    );
    clearPatientHierarchyCache();
    clearSlideMetadataCache();
    clearWsiThumbnailFetchCache();
    clearWsiSlideAccess();
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
        const servable = makeSlide({ slide_key: 'A', can_serve_tiles: true });
        const notServable = makeSlide({
            slide_key: 'B',
            can_serve_tiles: false,
        });
        inst.hierarchy = makeHierarchy([servable, notServable]);

        const result: any[] = inst.servableSlides;
        assert.equal(result.length, 1);
        assert.equal(result[0].slide.slide_key, 'A');
    });

    it('deduplicates repeated servable entries for the same slide within a sample', () => {
        const inst = makeInstance('https://tiles.example.com/patient/P-1');
        const duplicated = makeSlide({ slide_key: 'A', can_serve_tiles: true });
        inst.hierarchy = makeHierarchy([duplicated, { ...duplicated }]);

        const result: any[] = inst.servableSlides;
        assert.equal(result.length, 1);
        assert.equal(result[0].slide.slide_key, 'A');
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

        inst.hierarchy = { patient_id: 'P-1', samples: [sample1, sample2] };

        const result: any[] = inst.servableSlides;
        assert.equal(result.length, 3);
        assert.deepEqual(
            result.map((r: any) => r.slide.slide_key),
            ['A', 'B', 'D']
        );
    });

    it('attaches the correct sample to each slide entry', () => {
        const inst = makeInstance('https://tiles.example.com/patient/P-1');
        const slide = makeSlide({ slide_key: 'X', can_serve_tiles: true });
        inst.hierarchy = makeHierarchy([slide]);

        const result: any[] = inst.servableSlides;
        assert.equal(result[0].sample.sample_id, 'S-123456-T01');
    });

    it('includes all servable samples while preferring the requested sample', () => {
        const inst = makeInstance('https://tiles.example.com/patient/P-1');
        const preferredSample = makeSample('S-preferred', [
            makePart([
                makeBlock([makeSlide({ slide_key: 'preferred-slide' })]),
            ]),
        ]);
        const otherSample = makeSample('S-other', [
            makePart([makeBlock([makeSlide({ slide_key: 'other-slide' })])]),
        ]);
        inst.props = { ...inst.props, preferredSampleId: 'S-preferred' };
        inst.hierarchy = {
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
        const inst = makeInstance('https://tiles.example.com/patient/P-1');
        const preferredSample = makeSample('S-preferred', []);
        const otherSample = makeSample('S-other', [
            makePart([makeBlock([makeSlide({ slide_key: 'other-slide' })])]),
        ]);
        inst.props = { ...inst.props, preferredSampleId: 'S-preferred' };
        inst.hierarchy = {
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

    it('keeps explicit pathology association filters hard during fallback', () => {
        const inst = makeInstance('https://tiles.example.com/patient/P-1');
        const matchingSample = makeSample('S-1', [
            makePart([makeBlock([makeSlide({ slide_key: 'matching-slide' })])]),
        ]);
        const otherSample = makeSample('S-2', [
            makePart([makeBlock([makeSlide({ slide_key: 'other-slide' })])]),
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
        inst.hierarchy = {
            patient_id: 'P-1',
            samples: [matchingSample, otherSample],
            slide_associations: [
                {
                    slide_key: 'matching-slide',
                    sample_id: 'S-1',
                    match_level: 'BLOCK',
                    specimen_key: 'block::matching',
                    slide_type: 'H&E',
                    can_serve_tiles: true,
                },
                {
                    slide_key: 'other-slide',
                    sample_id: 'S-2',
                    match_level: 'BLOCK',
                    specimen_key: 'block::other',
                    slide_type: 'H&E',
                    can_serve_tiles: true,
                },
            ],
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
        const hierarchy = makeHierarchy([makeSlide({ slide_key: 'A' })]);
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
    it('selects a slide matching the initial and interactive timepoint filter', async () => {
        const early = makeSlide({
            slide_key: 'early',
            slide_timepoint_days: -20,
            slide_timepoint_source: 'Procedure date',
        });
        const late = makeSlide({
            slide_key: 'late',
            slide_timepoint_days: -5,
            slide_timepoint_source: 'Procedure date',
        });
        const sample = makeSample('S-1', [
            makePart([makeBlock([early, late])]),
        ]);
        const hierarchy = makeHierarchy([early, late]);
        hierarchy.samples[0] = sample;
        const onTimepointChange = jest.fn();
        const inst = new (WSIViewer as any)({
            ...viewerPropsForUrl('https://tiles.example.com/patient/P-XYZ'),
            url: 'https://tiles.example.com/patient/P-XYZ',
            height: 500,
            initialTimepointDays: -20,
            onTimepointChange,
        });
        inst.hierarchy = hierarchy;
        inst.selectedSample = sample;
        inst.selectedSlide = late;
        const selectSlideSpy = jest
            .spyOn(controllerOf(inst), 'selectSlide')
            .mockResolvedValue(undefined);

        expect(
            (inst as any).chooseInitialServableSlide(
                (inst as any).servableSlides
            ).slide.slide_key
        ).toBe('early');

        inst.timepointDays = undefined;
        await act(async () => {
            (inst as any).handleTimepointChange(-20);
        });
        expect(onTimepointChange).toHaveBeenCalledWith(-20);
        expect(selectSlideSpy).toHaveBeenCalledWith(early, sample);
    });

    it('preserves an unavailable linkout timepoint instead of broadening scope', () => {
        const onTimepointChange = jest.fn();
        const slide = makeSlide({
            slide_key: 'dated-slide',
            slide_timepoint_days: -5,
            slide_timepoint_source: 'Procedure date',
        });
        const sample = makeSample('S-1', [makePart([makeBlock([slide])])]);
        const inst = new (WSIViewer as any)({
            ...viewerPropsForUrl('https://tiles.example.com/patient/P-XYZ'),
            url: 'https://tiles.example.com/patient/P-XYZ',
            height: 500,
            initialTimepointDays: -20,
            pathologyFilter: {
                sampleId: 'S-1',
                matchLevel: 'BLOCK',
                specimenKey: 'block::1::A1',
            },
            onTimepointChange,
        });

        (inst as any).createControllerHost().setHierarchy({
            patient_id: 'P-XYZ',
            samples: [sample],
            slide_associations: [
                {
                    slide_key: 'dated-slide',
                    sample_id: 'S-1',
                    match_level: 'BLOCK',
                    specimen_key: 'block::1::A1',
                    slide_type: 'H&E',
                    can_serve_tiles: true,
                },
            ],
        });

        expect(inst.timepointDays).toBe(-20);
        expect(onTimepointChange).not.toHaveBeenCalled();
        expect((inst as any).linkoutScopeActive).toBe(true);
    });

    it('only mounts the latest slide after rapid left-nav clicks', () => {
        jest.useFakeTimers();
        try {
            const inst = new (WSIViewer as any)({
                ...viewerPropsForUrl('https://tiles.example.com/patient/P-XYZ'),
                url: 'https://tiles.example.com/patient/P-XYZ',
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

    it('honors a matching share-link slide when pathology filters are present', () => {
        const inst = new (WSIViewer as any)({
            ...viewerPropsForUrl('https://tiles.example.com/patient/P-XYZ'),
            url: 'https://tiles.example.com/patient/P-XYZ',
            height: 500,
            pathologyFilter: { matchLevel: 'UNMATCHED' },
        });
        const sample = makeSample('S-1', [
            makePart([
                makeBlock(
                    [
                        makeSlide({ slide_key: 'first-unmatched' }),
                        makeSlide({ slide_key: 'linked-unmatched' }),
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
                    slide_key: 'first-unmatched',
                    sample_id: 'S-1',
                    match_level: 'UNMATCHED',
                    can_serve_tiles: true,
                },
                {
                    slide_key: 'linked-unmatched',
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

        expect(selected.slide.slide_key).toBe('linked-unmatched');
        window.location.hash = '';
    });

    it('reloads the hierarchy when the pathology-filter sample id changes', () => {
        const inst = new (WSIViewer as any)({
            ...viewerPropsForUrl('https://tiles.example.com/patient/P-XYZ'),
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
            ...viewerPropsForUrl('https://tiles.example.com/patient/P-XYZ'),
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
            ...viewerPropsForUrl('https://tiles.example.com/patient/P-XYZ'),
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
                        makeSlide({ slide_key: 'block-slide' }),
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
            slide_associations: [
                {
                    slide_key: 'block-slide',
                    sample_id: 'S-1',
                    match_level: 'BLOCK',
                    specimen_key: 'block::1::A1',
                    slide_type: 'H&E',
                    can_serve_tiles: true,
                },
                {
                    slide_key: 'part-slide',
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
            ...viewerPropsForUrl('https://tiles.example.com/patient/P-XYZ'),
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
            expect.objectContaining({ slide_key: 'part-slide' }),
            expect.objectContaining({ sample_id: 'S-1' })
        );
        expect(inst.matchFilter).toBe('part');
    });

    it('keeps linkout scope when a prop-driven stain changes', () => {
        const onStainFilterChange = jest.fn();
        const hne = makeSlide({
            slide_key: 'hne-slide',
            is_hne: true,
            is_ihc: false,
        });
        const ihc = makeSlide({
            slide_key: 'ihc-slide',
            stain_name: 'IHC',
            stain_group: 'IHC',
            is_hne: false,
            is_ihc: true,
        });
        const sample = makeSample('S-1', [makePart([makeBlock([hne, ihc])])]);
        const inst = new (WSIViewer as any)({
            ...viewerPropsForUrl('https://tiles.example.com/patient/P-XYZ'),
            url: 'https://tiles.example.com/patient/P-XYZ',
            height: 500,
            initialStainFilter: 'all',
            pathologyFilter: {
                sampleId: 'S-1',
                matchLevel: 'BLOCK',
                specimenKey: 'block::1::A1',
            },
            onStainFilterChange,
        });
        inst.hierarchy = {
            patient_id: 'P-XYZ',
            samples: [sample],
            slide_associations: [
                {
                    slide_key: 'hne-slide',
                    sample_id: 'S-1',
                    match_level: 'BLOCK',
                    specimen_key: 'block::1::A1',
                    slide_type: 'H&E',
                    can_serve_tiles: true,
                },
                {
                    slide_key: 'ihc-slide',
                    sample_id: 'S-1',
                    match_level: 'BLOCK',
                    specimen_key: 'block::1::A1',
                    slide_type: 'IHC',
                    can_serve_tiles: true,
                },
            ],
        };
        inst.selectedSample = sample;
        inst.selectedSlide = hne;
        const selectSlideSpy = jest
            .spyOn(controllerOf(inst), 'selectSlide')
            .mockResolvedValue(undefined);
        const prevProps = { ...inst.props };
        inst.props = { ...inst.props, initialStainFilter: 'ihc' };

        inst.componentDidUpdate(prevProps);

        expect(onStainFilterChange).not.toHaveBeenCalled();
        expect((inst as any).linkoutScopeActive).toBe(true);
        expect(inst.stainFilter).toBe('ihc');
        expect(selectSlideSpy).toHaveBeenCalledWith(ihc, sample);
    });

    it('checks the current slide against the matching sample instead of scanning all hierarchy entries on local pathology-filter reuse', () => {
        const inst = new (WSIViewer as any)({
            ...viewerPropsForUrl('https://tiles.example.com/patient/P-XYZ'),
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
                        makeSlide({ slide_key: 'block-slide' }),
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
            slide_associations: [
                {
                    slide_key: 'block-slide',
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
        expect(inst.selectedSlide?.slide_key).toBe('block-slide');
        expect(inst.selectedSample?.sample_id).toBe('S-1');
        expect(inst.hierarchy).toEqual(sourceHierarchy);
    });

    it('reselects from the loaded hierarchy when only the preferred sample changes', () => {
        const inst = new (WSIViewer as any)({
            ...viewerPropsForUrl('https://tiles.example.com/patient/P-XYZ'),
            url: 'https://tiles.example.com/patient/P-XYZ',
            height: 500,
            preferredSampleId: 'S-1',
        });
        const sample1 = makeSample('S-1', [
            makePart([makeBlock([makeSlide({ slide_key: 'slide-1' })], '1')]),
        ]);
        const sample2 = makeSample('S-2', [
            makePart([makeBlock([makeSlide({ slide_key: 'slide-2' })], '1')]),
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
            ...viewerPropsForUrl('https://tiles.example.com/patient/P-XYZ'),
            url: 'https://tiles.example.com/patient/P-XYZ',
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
            ...viewerPropsForUrl('https://tiles.example.com/patient/P-XYZ'),
            url: 'https://tiles.example.com/patient/P-XYZ',
            height: 500,
        });
        const sample = makeSample('S-1', [
            makePart([
                makeBlock(
                    [
                        makeSlide({ slide_key: 'hne-slide' }),
                        makeSlide({
                            slide_key: 'ihc-slide',
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
            expect.objectContaining({ slide_key: 'hne-slide' }),
            expect.objectContaining({ sample_id: 'S-1' })
        );
    });

    it('loads the first visible slide when the stain filter changes', () => {
        const inst = new (WSIViewer as any)({
            ...viewerPropsForUrl('https://tiles.example.com/patient/P-XYZ'),
            url: 'https://tiles.example.com/patient/P-XYZ',
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
            expect.objectContaining({ slide_key: 'first-hne-slide' }),
            expect.objectContaining({ sample_id: 'S-1' })
        );
    });

    it('reselects a visible slide when the match filter hides the current selection', () => {
        const inst = new (WSIViewer as any)({
            ...viewerPropsForUrl('https://tiles.example.com/patient/P-XYZ'),
            url: 'https://tiles.example.com/patient/P-XYZ',
            height: 500,
        });
        const sample = makeSample('S-1', [
            makePart([
                makeBlock(
                    [
                        makeSlide({ slide_key: 'block-slide' }),
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
        inst.hierarchy = {
            patient_id: 'P-XYZ',
            samples: [sample],
            slide_associations: [
                {
                    slide_key: 'block-slide',
                    sample_id: 'S-1',
                    match_level: 'BLOCK',
                    specimen_key: 'block::1::A1',
                    slide_type: 'H&E',
                    can_serve_tiles: true,
                },
                {
                    slide_key: 'part-slide',
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
            expect.objectContaining({ slide_key: 'part-slide' }),
            expect.objectContaining({ sample_id: 'S-1' })
        );
    });

    it('loads the first visible slide when the match filter changes', () => {
        const inst = new (WSIViewer as any)({
            ...viewerPropsForUrl('https://tiles.example.com/patient/P-XYZ'),
            url: 'https://tiles.example.com/patient/P-XYZ',
            height: 500,
        });
        const sample = makeSample('S-1', [
            makePart([
                makeBlock(
                    [
                        makeSlide({ slide_key: 'first-part-slide' }),
                        makeSlide({ slide_key: 'second-part-slide' }),
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
                    slide_key: 'first-part-slide',
                    sample_id: 'S-1',
                    match_level: 'PART',
                    specimen_key: 'part::1',
                    slide_type: 'H&E',
                    can_serve_tiles: true,
                },
                {
                    slide_key: 'second-part-slide',
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
            expect.objectContaining({ slide_key: 'first-part-slide' }),
            expect.objectContaining({ sample_id: 'S-1' })
        );
    });

    it('clears the selected slide when filters have no matches', () => {
        const inst = new (WSIViewer as any)({
            ...viewerPropsForUrl('https://tiles.example.com/patient/P-XYZ'),
            url: 'https://tiles.example.com/patient/P-XYZ',
            height: 500,
        });
        const sample = makeSample('S-1', [
            makePart([
                makeBlock([makeSlide({ slide_key: 'part-slide' })], '1'),
            ]),
        ]);
        inst.hierarchy = {
            patient_id: 'P-XYZ',
            samples: [sample],
            slide_associations: [
                {
                    slide_key: 'part-slide',
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
            ...viewerPropsForUrl('https://tiles.example.com/patient/P-XYZ'),
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
            makePart([makeBlock([makeSlide({ slide_key: 'slide-1' })], '1')]),
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
            ...viewerPropsForUrl('https://tiles.example.com/patient/P-XYZ'),
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
            ...viewerPropsForUrl('https://tiles.example.com/patient/P-XYZ'),
            url: 'https://tiles.example.com/patient/P-XYZ',
            height: 500,
        });
        const sample = makeSample('S-1', [
            makePart([makeBlock([makeSlide({ slide_key: 'hne-slide' })], '1')]),
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

    it('releases a linkout scope when an already-active All filter is selected', () => {
        const onStainFilterChange = jest.fn();
        const inst = new (WSIViewer as any)({
            ...viewerPropsForUrl('https://tiles.example.com/patient/P-XYZ'),
            url: 'https://tiles.example.com/patient/P-XYZ',
            height: 500,
            initialStainFilter: 'all',
            pathologyFilter: {
                sampleId: 'S-1',
                matchLevel: 'BLOCK',
                specimenKey: 'block::1::A1',
            },
            onStainFilterChange,
        });
        const sample = makeSample('S-1', [
            makePart([makeBlock([makeSlide({ slide_key: 'hne-slide' })], '1')]),
        ]);
        inst.hierarchy = {
            patient_id: 'P-XYZ',
            samples: [sample],
            slide_associations: [
                {
                    slide_key: 'hne-slide',
                    sample_id: 'S-1',
                    match_level: 'BLOCK',
                    specimen_key: 'block::1::A1',
                    slide_type: 'H&E',
                    can_serve_tiles: true,
                },
            ],
        };

        (inst as any).handleFilterChange('all');

        expect(onStainFilterChange).toHaveBeenCalledWith('all');
        expect((inst as any).linkoutScopeActive).toBe(false);
    });

    it('does not remount when re-selecting the already active ready slide', async () => {
        const inst = new (WSIViewer as any)({
            ...viewerPropsForUrl('https://tiles.example.com/patient/P-XYZ'),
            url: 'https://tiles.example.com/patient/P-XYZ',
            height: 500,
        });
        const sample = makeSample('S-1', [
            makePart([makeBlock([makeSlide({ slide_key: 'hne-slide' })], '1')]),
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
        (controller as any).osdSlideMounted = true;

        const beginSpy = jest.spyOn(inst as any, 'beginSlideSelection');
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
        const inst = makeInstance('https://tiles.example.com/patient/P-1');
        const hierarchy = makeHierarchy([makeSlide({ slide_key: 'A' })], 'P-1');
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

        const stopObserving = observeSidebarRows(inst);
        const firstWsiRows = (inst as any).selectedWsiRows;
        const firstPathRows = (inst as any).selectedPathRows;

        act(() => {
            mobxAction(() => {
                inst.spinnerVisible = true;
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
        const mockHierarchy = makeWireHierarchy(
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
        const mockHierarchy = makeWireHierarchy([
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

    it('starts warming first-slide metadata as soon as the initial slide is chosen', async () => {
        let releaseMetadata!: () => void;
        const metadataWarmupStarted = new Promise<void>(resolve => {
            releaseMetadata = resolve;
        });
        (global as any).requestAnimationFrame = (cb: FrameRequestCallback) => {
            cb(0);
            return 0;
        };
        const mockHierarchy = makeWireHierarchy(
            [makeSlide({ slide_key: 'A', can_serve_tiles: true })],
            'P-XYZ'
        );
        setFetchMock(
            jest.fn().mockResolvedValue({
                ok: true,
                json: () => Promise.resolve(mockHierarchy),
            })
        );

        const inst = new (WSIViewer as any)({
            ...viewerPropsForUrl('https://tiles.example.com/patient/P-XYZ'),
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
                    slide_key: 'matched-1',
                    sample_id: 'S-123456-T01',
                    match_level: 'BLOCK',
                    specimen_key: 'block::1::A1',
                    slide_type: 'H&E',
                    can_serve_tiles: true,
                },
                {
                    slide_key: 'unmatched-1',
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
                        makeBlock([makeSlide({ slide_key: 'matched-1' })], '1'),
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
            jest.fn().mockResolvedValue({
                ok: true,
                json: () => Promise.resolve(toWireHierarchy(mockHierarchy)),
            })
        );

        const inst = new (WSIViewer as any)({
            ...viewerPropsForUrl('https://tiles.example.com/patient/P-XYZ'),
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
                block.slides.map((slide: Slide) => slide.slide_key)
            )
        ).toEqual(['matched-1', 'unmatched-1']);
        expect(inst.matchFilter).toBe('unmatched');
        expect(inst.hierarchy.slide_associations).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    slide_key: 'matched-1',
                    match_level: 'BLOCK',
                }),
                expect.objectContaining({
                    slide_key: 'unmatched-1',
                    match_level: 'UNMATCHED',
                    specimen_key: 'unmatched::1::B1',
                }),
            ])
        );
        expect(selectSlideSpy).toHaveBeenCalledTimes(1);
        expect((selectSlideSpy.mock.calls[0][0] as Slide).slide_key).toBe(
            'unmatched-1'
        );
    });

    it('loads hierarchy data and warms metadata for the selected initial slide', async () => {
        const hierarchy = makeWireHierarchy(
            [
                makeSlide({
                    slide_key: 'bootstrap-slide',
                    can_serve_tiles: true,
                }),
            ],
            'P-XYZ'
        );
        setFetchMock(
            jest.fn(async (input: RequestInfo | URL) => {
                const url = String(input);
                if (
                    url ===
                    'https://tiles.example.com/patient/P-XYZ?studyId=study'
                ) {
                    return {
                        ok: true,
                        json: async () => hierarchy,
                    } as Response;
                }
                if (
                    url ===
                    'https://tiles.example.com/tiles/bootstrap-slide/metadata?studyId=study'
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

        const inst = new (WSIViewer as any)({
            ...viewerPropsForUrl(
                'https://tiles.example.com/patient/P-XYZ?studyId=study'
            ),
            url: 'https://tiles.example.com/patient/P-XYZ?studyId=study',
            height: 500,
            studyId: 'study',
        });
        const controller = controllerOf(inst);
        const selectSlideSpy = jest
            .spyOn(controller, 'selectSlide')
            .mockResolvedValue(undefined);

        await loadHierarchyFor(inst);

        expect(
            (global as any).fetch.mock.calls.filter(
                ([url]: [string]) =>
                    url.includes('/patient/P-XYZ') ||
                    url === testAccessUrl('study', 'P-XYZ', 'bootstrap-slide')
            )
        ).toHaveLength(2);
        expect((global as any).fetch).toHaveBeenNthCalledWith(
            1,
            'https://tiles.example.com/patient/P-XYZ?studyId=study',
            { credentials: 'include' }
        );
        expect((global as any).fetch).toHaveBeenNthCalledWith(
            2,
            testAccessUrl('study', 'P-XYZ', 'bootstrap-slide'),
            { cache: 'no-store', credentials: 'same-origin' }
        );
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
        await warmHierarchyCache(
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
            ...viewerPropsForUrl('https://tiles.example.com/patient/P-1'),
            url: 'https://tiles.example.com/patient/P-1',
            height: 500,
        });
        const controller = controllerOf(inst);
        const selectSlideSpy = jest
            .spyOn(controller, 'selectSlide')
            .mockResolvedValue(undefined);

        await loadHierarchyFor(inst);

        expect(inst.hierarchy?.patient_id).toBe('P-1');
        expect(selectSlideSpy).toHaveBeenCalledWith(
            expect.objectContaining({ slide_key: 'cached-slide' }),
            expect.objectContaining({ sample_id: 'S-123456-T01' })
        );
    });

    it('keeps metadata tracing on the selected slide when frontend filtering picks an unmatched slide', async () => {
        const mockHierarchy: PatientHierarchy = {
            patient_id: 'P-XYZ',
            slide_associations: [
                {
                    slide_key: 'matched-1',
                    sample_id: 'S-123456-T01',
                    match_level: 'BLOCK',
                    specimen_key: 'block::1::A1',
                    slide_type: 'H&E',
                    can_serve_tiles: true,
                },
                {
                    slide_key: 'unmatched-1',
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
                        makeBlock([makeSlide({ slide_key: 'matched-1' })], '1'),
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
            jest.fn(async (input: RequestInfo | URL) => {
                const url = String(input);
                if (
                    url ===
                    'https://tiles.example.com/patient/P-XYZ?studyId=study'
                ) {
                    return {
                        ok: true,
                        json: async () => toWireHierarchy(mockHierarchy),
                    } as Response;
                }
                if (
                    url ===
                    'https://tiles.example.com/tiles/unmatched-1/metadata?studyId=study'
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

        const inst = new (WSIViewer as any)({
            ...viewerPropsForUrl(
                'https://tiles.example.com/patient/P-XYZ?studyId=study'
            ),
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
                hierarchySource: 'network',
                metadataSource: 'network',
                metadataCacheHit: false,
                slideId: 'unmatched-1',
            })
        );
    });

    it('primes OpenSeadragon on hierarchy load and mounts the initial slide with it', async () => {
        (global as any).requestAnimationFrame = (cb: FrameRequestCallback) => {
            cb(0);
            return 0;
        };
        const mockHierarchy = makeWireHierarchy(
            [makeSlide({ slide_key: 'A', can_serve_tiles: true })],
            'P-XYZ'
        );
        const metadata = {
            dimensions: { width: 1000, height: 800 },
            levels: 1,
            level_dimensions: [{ width: 1000, height: 800 }],
            max_zoom: 6,
            tile_size: 256,
        };
        setFetchMock(
            jest.fn().mockImplementation((url: string) =>
                Promise.resolve({
                    ok: true,
                    json: () =>
                        Promise.resolve(
                            url.includes('/patient/')
                                ? mockHierarchy
                                : {
                                      accessToken: 'test-token',
                                      slideKey: 'A',
                                      tileMetadata: metadata,
                                      thumbnail: {
                                          width: 256,
                                          height: 256,
                                      },
                                      expiresIn: 300,
                                  }
                        ),
                })
            )
        );

        const inst = makeInstance('https://tiles.example.com/patient/P-XYZ');
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
        const mockHierarchy = makeWireHierarchy(
            [makeSlide({ slide_key: 'A', can_serve_tiles: true })],
            'P-XYZ'
        );
        const metadata = {
            dimensions: { width: 1000, height: 800 },
            levels: 1,
            level_dimensions: [{ width: 1000, height: 800 }],
            max_zoom: 6,
            tile_size: 256,
        };
        setFetchMock(
            jest.fn().mockImplementation((url: string) =>
                Promise.resolve({
                    ok: true,
                    json: () =>
                        Promise.resolve(
                            url.includes('/patient/')
                                ? mockHierarchy
                                : {
                                      accessToken: 'test-token',
                                      slideKey: 'A',
                                      tileMetadata: metadata,
                                      thumbnail: {
                                          width: 256,
                                          height: 256,
                                      },
                                      expiresIn: 300,
                                  }
                        ),
                })
            )
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
        const slide1 = makeSlide({ slide_key: 'AAA', can_serve_tiles: true });
        const slide2 = makeSlide({ slide_key: 'BBB', can_serve_tiles: true });
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
        const slide = makeSlide({ slide_key: 'AAA', can_serve_tiles: true });
        inst.hierarchy = makeHierarchy([slide]);
        registerTestSlideAccess('study', 'P-123', 'AAA');

        setFetchMock(
            jest.fn().mockResolvedValue({
                ok: true,
                json: () =>
                    Promise.resolve({
                        accessToken: 'test-token',
                        slideKey: 'AAA',
                        tileMetadata: {
                            dimensions: { width: 1000, height: 800 },
                            levels: 1,
                            level_dimensions: [{ width: 1000, height: 800 }],
                            max_zoom: 6,
                            tile_size: 256,
                        },
                        thumbnail: {
                            width: 256,
                            height: 256,
                        },
                        expiresIn: 300,
                    }),
            })
        );

        const firstPromise = controller.fetchSlideMetadata('AAA');
        const secondPromise = controller.fetchSlideMetadata('AAA');

        await Promise.all([firstPromise, secondPromise]);

        expect((global as any).fetch).toHaveBeenCalledTimes(1);
    });

    it('prefetches metadata in bounded concurrent batches', async () => {
        const inst = makeInstance('https://tiles.example.com/patient/P-1');
        const controller = controllerOf(inst);
        const slides = ['AAA', 'BBB', 'CCC', 'DDD'].map(slide_key =>
            makeSlide({ slide_key, can_serve_tiles: true })
        );
        inst.hierarchy = makeHierarchy(slides);
        // Only the selected sample's slides are prefetched.
        inst.selectedSample = inst.hierarchy.samples[0];

        const order: string[] = [];
        const deferred = new Map<string, ReturnType<typeof deferredPromise>>();
        slides.forEach(slide => {
            deferred.set(slide.slide_key, deferredPromise<void>());
        });

        jest.spyOn(controller, 'fetchSlideMetadata').mockImplementation(
            (slideKey: string) => {
                order.push(slideKey);
                return deferred.get(slideKey)!.promise.then(() => ({
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

        // The prefetch limit is three slides, so DDD is never fetched.
        await prefetchPromise;
        expect(order).toEqual(['AAA', 'BBB', 'CCC']);
    });

    it('prefetches only the selected sample, active stain first', async () => {
        const inst = makeInstance('https://tiles.example.com/patient/P-1');
        const controller = controllerOf(inst);
        const selectedSampleSlides = [
            makeSlide({
                slide_key: 'BBB',
                can_serve_tiles: true,
                is_hne: true,
            }),
            makeSlide({
                slide_key: 'CCC',
                can_serve_tiles: true,
                is_hne: false,
                is_ihc: true,
                stain_name: 'IHC',
            }),
        ];
        const otherSampleSlides = [
            makeSlide({
                slide_key: 'AAA',
                can_serve_tiles: true,
                is_hne: true,
            }),
            makeSlide({
                slide_key: 'DDD',
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
            async (slideKey: string) => {
                order.push(slideKey);
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

        // Other samples' slides load their metadata when selected.
        expect(order).toEqual(['BBB', 'CCC']);
    });

    it('does not spend prefetch queue slots on duplicate servable slide keys', async () => {
        const inst = makeInstance('https://tiles.example.com/patient/P-1');
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
        inst.hierarchy = makeHierarchy([
            duplicateSlideA,
            duplicateSlideB,
            slideB,
            slideC,
            slideD,
        ]);
        inst.selectedSample = inst.hierarchy.samples[0];

        const order: string[] = [];
        const deferred = new Map<string, ReturnType<typeof deferredPromise>>();
        ['AAA', 'BBB', 'CCC', 'DDD'].forEach(slideKey => {
            deferred.set(slideKey, deferredPromise<void>());
        });

        jest.spyOn(controller, 'fetchSlideMetadata').mockImplementation(
            (slideKey: string) => {
                order.push(slideKey);
                return deferred.get(slideKey)!.promise.then(() => ({
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

        // The prefetch limit is three slides, so DDD is never fetched.
        await prefetchPromise;
        expect(order).toEqual(['AAA', 'BBB', 'CCC']);
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
        controllerOf(inst).osdSlideMounted = true;
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
        controllerOf(inst).osdSlideMounted = true;

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
        controllerOf(inst).osdSlideMounted = true;

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
        inst.selectedSlide = makeSlide({ slide_key: '12345' });

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
    let capturedFullyLoadedCb:
        | ((event: { fullyLoaded: boolean }) => void)
        | null;
    let idleCallbacks: Array<() => void>;

    const metaMock = {
        dimensions: { width: 40000, height: 30000 },
        levels: 1,
        level_dimensions: [{ width: 40000, height: 30000 }],
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

        // v2 access capability mock: metadata is returned as part of the
        // source-bound capability rather than from a legacy tile endpoint.
        (global as any).fetch = jest.fn().mockResolvedValue({
            ok: true,
            json: () =>
                Promise.resolve({
                    accessToken: 'test-token',
                    slideKey: '42',
                    tileMetadata: metaMock,
                    thumbnail: {
                        width: 256,
                        height: 256,
                    },
                    expiresIn: 300,
                }),
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
            ...viewerPropsForUrl('https://tiles.example.com/patient/P-XYZ'),
            url: 'https://tiles.example.com/patient/P-XYZ',
            height: 500,
            studyId: 'study-1',
            ...props,
        });
        inst.selectedSlide = slide;
        registerTestSlideAccess(
            String(props.studyId ?? 'study-1'),
            'P-XYZ',
            slide.slide_key
        );
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
                Promise.resolve({
                    accessToken: 'test-token',
                    slideKey: '42',
                    tileMetadata: metaMock,
                    // This represents the already-published S3 artifact.
                    thumbnail: {
                        width: 256,
                        height: 256,
                        contentType: 'image/jpeg',
                    },
                    expiresIn: 300,
                }),
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
            expect((inst as any).thumbnailPreviewUrl).toBe(
                'blob:published-thumb'
            );

            capturedOpenCb!();
            capturedTileLoadedCb!();
            expect((inst as any).thumbnailPreviewUrl).toBe(
                'blob:published-thumb'
            );

            capturedTileDrawnCb!();
            expect((inst as any).thumbnailPreviewUrl).toBeNull();
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
        const slide = makeSlide({ slide_key: '42' });
        const inst = await runMount(slide);
        const controller = controllerOf(inst);
        (inst as any).spinnerVisible = true;
        controller.loadingStart = Date.now() - 1000;

        capturedOpenCb!();
        expect((inst as any).tilesReady).toBe(false);

        // WebGL-backed renderers can load the image successfully without
        // delivering OpenSeadragon's tile-drawn event.
        capturedTileLoadedCb!();

        expect((inst as any).tilesReady).toBe(true);
        expect((inst as any).spinnerVisible).toBe(false);
    });

    it('surfaces a retryable error when no tile becomes ready', async () => {
        window.location.hash = '';
        const slide = makeSlide({ slide_key: '42' });
        const inst = await runMount(slide);
        jest.useFakeTimers();
        try {
            capturedOpenCb!();

            jest.advanceTimersByTime(185_000);

            expect((inst as any).error).toContain('Slide tiles did not load');
            expect((inst as any).spinnerVisible).toBe(false);
            expect((inst as any).tilesReady).toBe(true);
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
            expect((inst as any).error).toContain('Slide tiles did not load');

            capturedTileDrawnCb!();

            expect((inst as any).error).toBeNull();
            expect((inst as any).tilesReady).toBe(true);
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
                Promise.resolve({
                    accessToken: 'test-token',
                    slideKey: '42',
                    tileMetadata: metaMock,
                    thumbnail: {
                        width: 256,
                        height: 256,
                        contentType: 'image/jpeg',
                    },
                    expiresIn: 300,
                }),
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

        inst.selectedSample = makeSample('S-123456-T01', [
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
        inst.hierarchy = makeHierarchy([slide]);
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
        inst.hierarchy = makeHierarchy([slide]);
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

    it('reports staged initial-slide timings after the first tile is ready', async () => {
        window.location.hash = '';
        const slide = makeSlide({ slide_key: '42' });
        const inst = await runMount(slide, { studyId: 'study-1' });
        const controller = controllerOf(inst);
        const reportSpy = jest
            .spyOn(inst as any, 'reportInitialSlideLoadPerformance')
            .mockImplementation(() => undefined);

        controller.initialSlideKey = '42';
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
        capturedTileDrawnCb!();

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
            hierarchySource: 'network',
            metadataSource: 'viewer-cache',
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
                hierarchySource: 'network',
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
        const hierarchy = makeHierarchy(
            [makeSlide({ slide_key: '42' })],
            'P-1'
        );
        setFetchMock(
            jest.fn().mockImplementation((url: string) => {
                if (url.includes('/wsi/v2/resources/')) {
                    return Promise.resolve({
                        ok: true,
                        json: () =>
                            Promise.resolve({
                                accessToken: 'test-token',
                                slideKey: '42',
                                tileMetadata: {
                                    dimensions: { width: 1000, height: 800 },
                                    levels: 1,
                                    level_dimensions: [
                                        { width: 1000, height: 800 },
                                    ],
                                    max_zoom: 6,
                                    tile_size: 256,
                                },
                                thumbnail: {
                                    width: 256,
                                    height: 256,
                                },
                                expiresIn: 300,
                            }),
                    });
                }
                return Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve(toWireHierarchy(hierarchy)),
                });
            })
        );

        await fetchPatientHierarchyReadOnly(
            'https://tiles.example.com/patient/P-1',
            undefined,
            undefined,
            'study',
            'P-1'
        );
        await fetchSlideMetadataCachedReadOnly(
            'https://tiles.example.com',
            '42',
            undefined,
            'study',
            'anonymousUser'
        );

        window.location.hash = '';
        const inst = await runMount(makeSlide({ slide_key: '42' }));
        const controller = controllerOf(inst);
        const reportSpy = jest
            .spyOn(inst as any, 'reportInitialSlideLoadPerformance')
            .mockImplementation(() => undefined);

        controller.initialSlideKey = '42';
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
        capturedTileDrawnCb!();

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

    it('attributes initial slide metadata to the shared cache when it is warm', async () => {
        const metadata = {
            dimensions: { width: 1000, height: 800 },
            levels: 1,
            level_dimensions: [{ width: 1000, height: 800 }],
            max_zoom: 6,
            tile_size: 256,
        };
        const inst = makeInstance('https://tiles.example.com/patient/P-1');
        const controller = controllerOf(inst);

        controller.initialSlideKey = '42';
        controller.initialSlideLoadTrace = {
            loadSeq: 9,
            startedAt: 10,
            slideId: '42',
            openSeadragonWarmHit: false,
            hierarchyCacheHit: false,
            metadataCacheHit: false,
            hierarchySource: 'network',
            metadataSource: 'network',
            reported: false,
        };

        registerTestSlideAccess('study', 'P-1', '42');
        setFetchMock(
            jest.fn().mockResolvedValue({
                ok: true,
                json: async () => ({
                    accessToken: 'test-token',
                    slideKey: '42',
                    tileMetadata: metadata,
                    thumbnail: {
                        width: 256,
                        height: 256,
                    },
                    expiresIn: 300,
                }),
            })
        );
        await fetchSlideMetadataCachedReadOnly(
            'https://tiles.example.com',
            '42',
            undefined,
            'study',
            'anonymousUser'
        );

        await (controller as any).fetchSlideMetadata('42');

        expect(controller.initialSlideLoadTrace).toEqual(
            expect.objectContaining({
                metadataCacheHit: true,
                metadataSource: 'shared-cache',
            })
        );
    });

    it('treats a warm shared hierarchy cache reuse as a hierarchy cache hit', async () => {
        const hierarchy = makeHierarchy(
            [
                makeSlide({
                    slide_key: 'bootstrap-slide',
                    can_serve_tiles: true,
                }),
            ],
            'P-XYZ'
        );
        await warmHierarchyCache(
            'https://tiles.example.com/patient/P-XYZ?studyId=study',
            hierarchy,
            'study'
        );
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
            ...viewerPropsForUrl(
                'https://tiles.example.com/patient/P-XYZ?studyId=study'
            ),
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
                hierarchySource: 'shared-cache',
            })
        );
    });

    it('reloads the initial slide from the published hierarchy after cache clear', async () => {
        const hierarchyPayload = {
            referenceSampleId: 'S-123456-T01',
            sampleGroups: [
                {
                    sampleId: 'S-123456-T01',
                    parts: [
                        {
                            partNumber: '1',
                            partType: 'Resection',
                            partDescription: 'Test part',
                            subspecialty: 'GI',
                            blocks: [
                                {
                                    blockNumber: '1',
                                    blockLabel: 'A1',
                                    slides: [
                                        {
                                            slideKey: '42',
                                            stainName: 'H&E',
                                            stainGroup: 'Histology',
                                            isHne: true,
                                            isIhc: false,
                                            magnification: '20x',
                                            fileSizeBytes: 100000000,
                                            canServeTiles: true,
                                            slideType: 'H&E',
                                            sampleId: 'S-123456-T01',
                                            matchLevel: 'BLOCK',
                                            specimenKey: 'block::1::1',
                                            procedureDateDays: 0,
                                            timepointSource:
                                                'Recorded procedure date relative to first tumor sequencing',
                                            procedureDateKind: 'RECORDED',
                                            procedureDateSource:
                                                'Recorded procedure date relative to first tumor sequencing',
                                            procedureDateReason: null,
                                            procedureDateStatus: 'AVAILABLE',
                                            procedureCoordinateSystem:
                                                'patient_first_tumor_sequencing_day_zero',
                                        },
                                    ],
                                },
                            ],
                        },
                    ],
                },
            ],
        };
        const preloadFetchMock = jest.fn().mockImplementation((url: string) => {
            if (url.includes('/wsi/v2/resources/')) {
                return Promise.resolve({
                    ok: true,
                    json: () =>
                        Promise.resolve({
                            accessToken: 'test-token',
                            slideKey: '42',
                            tileMetadata: {
                                dimensions: { width: 1000, height: 800 },
                                levels: 1,
                                level_dimensions: [
                                    { width: 1000, height: 800 },
                                ],
                                max_zoom: 6,
                                tile_size: 256,
                            },
                            thumbnail: {
                                width: 256,
                                height: 256,
                            },
                            expiresIn: 300,
                        }),
                });
            }
            return Promise.resolve({
                ok: true,
                json: () => Promise.resolve(hierarchyPayload),
            });
        });
        setFetchMock(preloadFetchMock);

        const hierarchyUrl = 'https://tiles.example.com/patient/P-1';
        await fetchPatientHierarchyReadOnly(
            hierarchyUrl,
            undefined,
            undefined,
            'study',
            'P-1'
        );
        await fetchSlideMetadataCachedReadOnly(
            'https://tiles.example.com',
            '42',
            undefined,
            'study',
            'anonymousUser'
        );

        clearPatientHierarchyCache();
        clearSlideMetadataCache();

        const networkFetchMock = jest.fn().mockImplementation((url: string) => {
            if (url === hierarchyUrl) {
                return Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve(hierarchyPayload),
                });
            }
            if (url.includes('/wsi/v2/resources/')) {
                return Promise.resolve({
                    ok: true,
                    json: () =>
                        Promise.resolve({
                            accessToken: 'test-token',
                            slideKey: '42',
                            tileMetadata: {
                                dimensions: { width: 1000, height: 800 },
                                levels: 1,
                                level_dimensions: [
                                    { width: 1000, height: 800 },
                                ],
                                max_zoom: 6,
                                tile_size: 256,
                            },
                            thumbnail: {
                                width: 256,
                                height: 256,
                            },
                            expiresIn: 300,
                        }),
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
            const inst = makeInstance(hierarchyUrl);
            await loadHierarchyFor(inst);

            const trace = controllerOf(inst).initialSlideLoadTrace;
            expect(trace?.hierarchyCacheHit).toBe(false);
            expect(trace?.hierarchySource).toBe('network');
            expect(inst.selectedMeta).toMatchObject({
                max_zoom: 6,
                tile_size: 256,
            });
            expect(networkFetchMock).toHaveBeenCalledTimes(2);
            expect(networkFetchMock.mock.calls[0][0]).toBe(hierarchyUrl);
            expect(networkFetchMock.mock.calls[1][0]).toContain('/thumbnails');
        } finally {
            (global as any).requestAnimationFrame = origRaf;
        }
    });
});
