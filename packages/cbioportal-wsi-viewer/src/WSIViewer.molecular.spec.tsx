/**
 * @jest-environment jsdom
 */
import { autorun, action as mobxAction } from 'mobx';
import { act } from 'react-test-renderer';
import WSIViewer from './WSIViewer';
import { WsiViewerController } from './wsiViewerController';
import * as wsiMetaUtils from './wsiMetaUtils';
import * as wsiSlideUtils from './wsiSlideUtils';
import * as wsiCbioportalDataUtils from './wsiCbioportalDataUtils';
import * as wsiMolecularAnnotationDataUtils from './wsiMolecularAnnotationDataUtils';
import { clearPatientHierarchyCache } from './wsiHierarchyFetchCache';
import { clearWsiCbioportalRequestCaches } from './wsiCbioportalDataUtils';
import { clearWsiSlideSources } from './wsiAuth';
import { clearWsiThumbnailFetchCache } from './wsiThumbnailFetchCache';
import { slideRowsFor } from './wsiTestFixtures';
import {
    PatientHierarchy,
    Block,
    MutationDetail,
    Part,
    Sample,
    Slide,
} from './wsiViewerTypes';
import {
    configureWsiViewerRuntime,
    WsiMolecularServices,
    WsiViewerConfig,
} from './wsiViewerConfig';

// Component tests use a synthetic origin, so keep portal API URLs relative.
let annotationsEnabled = false;
const testMolecularServices: WsiMolecularServices = {
    showOncoKb: () => annotationsEnabled,
    showCivic: () => annotationsEnabled,
    getOncoKbApiUrl: () => '/proxy/oncokb',
    getOncoKbClient: () => {
        throw new Error('OncoKB client is not used by these tests');
    },
    getCivicCnaVariants: () => ({}),
    getSimplifiedMutationType: (type: string) => type.toLowerCase(),
};

function configureTestRuntime(overrides: Partial<WsiViewerConfig> = {}) {
    configureWsiViewerRuntime({
        buildApiUrl: (path: string) => `/${path}`,
        molecular: testMolecularServices,
        ...overrides,
    });
}

configureTestRuntime();
beforeEach(() => {
    annotationsEnabled = false;
    configureTestRuntime();
});

// Controllers that started a hierarchy load, a mount or sample enrichment are
// disposed after each test, so their background requests and retries cannot
// reach the fetch mocks of later tests.
const activeControllers = new Set<WsiViewerController>();
(['loadHierarchy', 'mountOSD', 'scheduleSampleEnrichment'] as const).forEach(
    method => {
        const proto = WsiViewerController.prototype as any;
        const original = proto[method];
        proto[method] = function(this: WsiViewerController, ...args: any[]) {
            activeControllers.add(this);
            return original.apply(this, args);
        };
    }
);
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

const OSD = jest.requireMock('openseadragon') as jest.MockedFunction<any>;
mockLoadOpenSeadragon.mockResolvedValue(OSD);

// ---- test data factories ----

function makeSlide(overrides: Partial<Slide> = {}): Slide {
    return {
        slide_key: '1000',
        stain_name: 'H&E',
        stain_group: 'Histology',
        stain_kind: 'hne',
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
        authScope: 'anonymousUser',
        ...props,
    });
}

function controllerOf(inst: any): any {
    return inst.controller;
}

function setFetchMock(mockImpl: unknown) {
    (global as any).fetch = mockImpl;
}

/**
 * Observes the sidebar rows as the rendered viewer does, so their computeds
 * are cached rather than recomputed on every read.
 */
function observeSidebarRows(inst: any): () => void {
    return autorun(() => {
        void inst.selectedSeqRows;
        void inst.selectedWsiRows;
        void inst.selectedPathRows;
    });
}

async function loadHierarchyFor(inst: any) {
    await controllerOf(inst).loadHierarchy();
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
    clearWsiCbioportalRequestCaches();
    clearWsiThumbnailFetchCache();
    clearWsiSlideSources();
});

describe('WSIViewer — cached sidebar data', () => {
    let origRaf: typeof globalThis.requestAnimationFrame;

    beforeEach(() => {
        origRaf = (global as any).requestAnimationFrame;
    });

    afterEach(() => {
        (global as any).requestAnimationFrame = origRaf;
    });

    it('freezes cached sidebar rows so callers cannot mutate the shared viewer cache', () => {
        const inst = makeInstance('https://tiles.example.com/patient/P-1');
        const hierarchy = makeHierarchy([makeSlide({ slide_key: 'A' })], 'P-1');
        const sample = hierarchy.samples[0];
        const slide = sample.parts[0].blocks[0].slides[0];

        act(() => {
            mobxAction(() => {
                inst.viewerState.hierarchy = hierarchy;
                inst.viewerState.selectedSample = sample;
                inst.viewerState.selectedSlide = slide;
                inst.viewerState.selectedMeta = {
                    dimensions: { width: 1000, height: 800 },
                    levels: 1,
                    level_dimensions: [{ width: 1000, height: 800 }],
                    max_zoom: 6,
                    tile_size: 256,
                    mpp: { x: 0.25, y: 0.25 },
                };
            })();
        });

        const stopObserving = observeSidebarRows(inst);
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
        stopObserving();
    });

    it('invalidates cached sidebar rows after in-place sample enrichment', () => {
        const inst = makeInstance('https://tiles.example.com/patient/P-1');
        const hierarchy = makeHierarchy([makeSlide({ slide_key: 'A' })], 'P-1');
        (hierarchy.samples[0] as any).tmb_score = '7.1';

        act(() => {
            mobxAction(() => {
                inst.viewerState.hierarchy = hierarchy;
                inst.viewerState.selectedSample =
                    inst.viewerState.hierarchy.samples[0];
                inst.viewerState.selectedSlide =
                    inst.viewerState.hierarchy.samples[0].parts[0].blocks[0].slides[0];
            })();
        });

        const initialSeqRows = (inst as any).selectedSeqRows;
        const initialPathRows = (inst as any).selectedPathRows;

        act(() => {
            (inst as any).applyHierarchyMutation((samples: any[]) => {
                samples[0].tmb_score = '12.3';
                samples[0].sample_type = 'Metastasis';
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
                label: 'Sample',
                valueTip: expect.stringContaining('Type: Metastasis'),
            })
        );
        expect((inst as any).hierarchyDataVersion).toBe(1);
    });

    it('recomputes WSI rows after in-place slide enrichment', () => {
        const inst = makeInstance('https://tiles.example.com/patient/P-1');
        const hierarchy = makeHierarchy([makeSlide({ slide_key: 'A' })], 'P-1');
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
                inst.viewerState.hierarchy = hierarchy;
                inst.viewerState.selectedSample = sample;
                inst.viewerState.selectedSlide = slide;
                inst.viewerState.selectedMeta = meta;
            })();
        });

        const buildWsiRowsSpy = jest.spyOn(wsiMetaUtils, 'buildWsiRows');
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
        inst.viewerState.hierarchy = makeHierarchy(
            [makeSlide({ slide_key: 'A' })],
            'P-1'
        );
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

    it('keeps slide placement filters across hierarchy refreshes', () => {
        const inst = makeInstance('https://tiles.example.com/patient/P-1');
        const slide = makeSlide({
            slide_key: 'block-slide',
            sample_id: 'S-1',
            match_level: 'BLOCK',
            stain_kind: 'hne',
        });
        const hierarchy = makeHierarchy([slide], 'P-1');
        hierarchy.samples[0].sample_id = 'S-1';
        inst.viewerState.hierarchy = hierarchy;

        act(() => {
            (inst as any).updateHierarchy(hierarchy);
        });

        expect(
            wsiSlideUtils.getServableSlideIdsForPathologyFilterReadOnly(
                inst.viewerState.hierarchy,
                { sampleId: 'S-1', matchLevel: 'BLOCK' }
            )
        ).toEqual(new Set(['block-slide']));
    });

    it('keeps hierarchy identity stable across an enrichment refresh', () => {
        const inst = makeInstance('https://tiles.example.com/patient/P-1');
        const hierarchy = makeHierarchy([makeSlide({ slide_key: 'A' })], 'P-1');
        inst.viewerState.hierarchy = hierarchy;
        const currentHierarchy = inst.viewerState.hierarchy;
        const initialVersion = (inst as any).hierarchyDataVersion;

        act(() => {
            (inst as any).updateHierarchy(currentHierarchy);
        });

        expect(inst.viewerState.hierarchy).toBe(currentHierarchy);
        expect((inst as any).hierarchyDataVersion).toBe(initialVersion + 1);
    });

    it('defers the molecular tables, not the summary rows, until the first tile is ready', () => {
        const inst = makeInstance('https://tiles.example.com/patient/P-1');
        const hierarchy = makeHierarchy([makeSlide({ slide_key: 'A' })], 'P-1');
        const sample = hierarchy.samples[0];
        const slide = sample.parts[0].blocks[0].slides[0];
        sample.tmb_score = '12.3';

        act(() => {
            mobxAction(() => {
                inst.viewerState.hierarchy = hierarchy;
                inst.viewerState.selectedSample = sample;
                inst.viewerState.selectedSlide = slide;
                inst.viewerState.tilesReady = false;
            })();
        });

        expect((inst as any).sidebarTableSample).toBeNull();
        // A slide whose tiles never load still shows TMB, MSI and purity.
        expect((inst as any).selectedSeqRows).toContainEqual(
            expect.objectContaining({ label: 'TMB', value: '12.3 mut/Mb' })
        );

        act(() => {
            mobxAction(() => {
                inst.viewerState.tilesReady = true;
            })();
        });

        expect((inst as any).sidebarTableSample?.sample_id).toBe(
            sample.sample_id
        );
    });

    it('uses the reference sample for molecular sidebar data on unmatched slides', () => {
        const inst = makeInstance('https://tiles.example.com/patient/P-1');
        const slide = makeSlide({ slide_key: 'unmatched-slide' });
        const unmatched = makeSample('UNMATCHED', [
            makePart([makeBlock([slide])]),
        ]);
        const reference = makeSample('P-1-T02-IM5', []);
        reference.mutations = [];
        const hierarchy: PatientHierarchy = {
            patient_id: 'P-1',
            reference_sample_id: reference.sample_id,
            samples: [unmatched, reference],
        };

        act(() => {
            mobxAction(() => {
                inst.viewerState.hierarchy = hierarchy;
                inst.viewerState.selectedSample = unmatched;
                inst.viewerState.selectedSlide = slide;
                inst.viewerState.tilesReady = true;
            })();
        });

        expect((inst as any).sidebarTableSample?.sample_id).toBe(
            reference.sample_id
        );
        expect((inst as any).selectedSampleUrl).toContain(
            encodeURIComponent(reference.sample_id)
        );

        act(() => {
            mobxAction(() => {
                hierarchy.reference_sample_id = undefined;
                inst.viewerState.hierarchy = { ...hierarchy };
            })();
        });
        expect((inst as any).sidebarTableSample).toBeNull();
    });
});

describe('WSIViewer — loadHierarchy enrichment', () => {
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

    it('schedules sample enrichment as soon as the hierarchy is loaded', async () => {
        jest.useFakeTimers();
        try {
            (global as any).requestAnimationFrame = (
                cb: FrameRequestCallback
            ) => {
                cb(0);
                return 0;
            };
            const mockHierarchy = makeHierarchy(
                [makeSlide({ slide_key: 'A', can_serve_tiles: true })],
                'P-XYZ'
            );
            setFetchMock(
                jest.fn(async (_input: unknown, init?: RequestInit) => ({
                    ok: true,
                    json: () =>
                        Promise.resolve(slideRowsFor(mockHierarchy, init)),
                }))
            );

            const inst = new (WSIViewer as any)({
                ...viewerPropsForUrl('https://tiles.example.com/patient/P-XYZ'),
                url: 'https://tiles.example.com/patient/P-XYZ',
                height: 500,
                studyId: 'study-1',
                authScope: 'anonymousUser',
            });
            const controller = controllerOf(inst);
            jest.spyOn(controller, 'selectSlide').mockResolvedValue(undefined);
            const enrichSpy = jest
                .spyOn(controller as any, 'enrichSamplesFromCbioportal')
                .mockResolvedValue(undefined);

            await loadHierarchyFor(inst);

            expect(controller.selectSlide).toHaveBeenCalledTimes(1);
            expect(enrichSpy).not.toHaveBeenCalled();
            jest.advanceTimersByTime(0);
            expect(enrichSpy).toHaveBeenCalledWith(controller.hierarchyLoadSeq);
        } finally {
            jest.useRealTimers();
        }
    });
});

describe('WSIViewer — sample enrichment scheduling', () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    const TP53: MutationDetail = {
        token: 'TP53 R175H',
        gene: 'TP53',
        proteinChange: 'R175H',
        entrezGeneId: 7157,
        keyword: 'TP53 R175 missense',
    };
    const tp53Counts = () =>
        new Map([
            [
                wsiCbioportalDataUtils.variantCountKey(
                    'study_mutations',
                    7157,
                    'TP53 R175 missense'
                ),
                {
                    entrezGeneId: 7157,
                    keyword: 'TP53 R175 missense',
                    numberOfSamples: 4,
                    numberOfSamplesWithKeyword: 2,
                },
            ],
        ]);

    it('does not apply stale variant counts to a new hierarchy', async () => {
        const makeEnrichmentHierarchy = (patientId: string) => {
            const hierarchy = makeHierarchy(
                [makeSlide({ slide_key: `${patientId}-slide` })],
                patientId
            );
            hierarchy.samples[0].mutations = [{ ...TP53 }];
            return hierarchy;
        };

        const inst = makeInstance('https://tiles.example.com/patient/P-1');
        const hierarchyA = makeEnrichmentHierarchy('P-A');
        const hierarchyB = makeEnrichmentHierarchy('P-B');
        inst.viewerState.hierarchy = hierarchyA;

        const counts = deferredPromise<ReturnType<typeof tp53Counts>>();
        const countsSpy = jest
            .spyOn(wsiCbioportalDataUtils, 'fetchVariantCounts')
            .mockReturnValue(counts.promise);
        jest.spyOn(inst as any, 'fetchAndMergeClinicalData').mockResolvedValue(
            undefined
        );
        jest.spyOn(inst as any, 'fetchAndMergeMutations').mockResolvedValue(
            'study_mutations'
        );
        jest.spyOn(inst as any, 'fetchAndMergeCNA').mockResolvedValue(
            undefined
        );
        jest.spyOn(
            inst as any,
            'fetchAndMergeStructuralVariants'
        ).mockResolvedValue(undefined);

        const enrichmentPromise = (inst as any).runSampleEnrichment(
            'study-1',
            'P-A',
            ['S-123456-T01'],
            () => true
        );
        for (let tick = 0; tick < 10; tick += 1) {
            await Promise.resolve();
        }

        expect(countsSpy).toHaveBeenCalledWith('study_mutations', [TP53]);

        inst.viewerState.hierarchy = hierarchyB;
        counts.resolve(tp53Counts());
        await enrichmentPromise;

        expect(
            inst.viewerState.hierarchy.samples[0].mutations![0]
                .cohortAlteredCount
        ).toBeUndefined();
    });

    it('applies the variant counts when the hierarchy is still current', async () => {
        const inst = makeInstance('https://tiles.example.com/patient/P-1');
        const hierarchy = makeHierarchy(
            [makeSlide({ slide_key: 'current-slide' })],
            'P-current'
        );
        hierarchy.samples[0].mutations = [{ ...TP53 }];
        inst.viewerState.hierarchy = hierarchy;

        const countsSpy = jest
            .spyOn(wsiCbioportalDataUtils, 'fetchVariantCounts')
            .mockResolvedValue(tp53Counts());

        await (inst as any).fetchAndMergeVariantCounts(
            'study_mutations',
            () => true
        );
        expect(countsSpy).toHaveBeenCalledTimes(1);

        expect(inst.viewerState.hierarchy.samples[0].mutations![0]).toEqual(
            expect.objectContaining({
                cohortAlteredCount: 2,
                cohortProfiledCount: 4,
            })
        );
    });

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
                return mutations.promise.then(() => 'study_mutations');
            }
        );
        const frequencySpy = jest
            .spyOn(inst as any, 'fetchAndMergeVariantCounts')
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

        const enrichmentPromise = (inst as any).runSampleEnrichment(
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
        await Promise.resolve();
        expect(order).toEqual(['clinical', 'mutations', 'cna', 'sv']);
        expect(frequencySpy).not.toHaveBeenCalled();

        cna.resolve();
        await Promise.resolve();
        expect(frequencySpy).not.toHaveBeenCalled();

        structuralVariants.resolve();
        await enrichmentPromise;

        expect(frequencySpy).toHaveBeenCalledWith(
            'study_mutations',
            expect.any(Function)
        );
    });

    it('reports a study without a mutation profile as not profiled, without retrying', async () => {
        const inst = makeInstance('https://tiles.example.com/patient/P-1');
        inst.viewerState.hierarchy = makeHierarchy(
            [makeSlide({ slide_key: 'A' })],
            'P-1'
        );
        const sampleIdentifiers = [
            {
                studyId: 'study-1',
                sampleId: inst.viewerState.hierarchy.samples[0].sample_id,
            },
        ];
        const originalFetch = (global as any).fetch;
        const fetchMock = jest.fn().mockResolvedValue({
            ok: true,
            json: async () => [
                {
                    molecularProfileId: 'study_log2CNA',
                    molecularAlterationType: 'COPY_NUMBER_ALTERATION',
                    datatype: 'LOG2-VALUE',
                },
            ],
        });
        (global as any).fetch = fetchMock;

        const applySpy = jest.spyOn(inst as any, 'applyHierarchyMutation');
        try {
            await expect(
                (inst as any).fetchAndMergeMutations(
                    'study-1',
                    sampleIdentifiers,
                    () => true
                )
            ).resolves.toBeNull();

            expect(applySpy).not.toHaveBeenCalled();
            expect((inst as any).mutationDataStatus).toBe('unprofiled');
            expect(fetchMock).toHaveBeenCalledTimes(1);
            expect(fetchMock.mock.calls[0][0]).toBe(
                '/api/studies/study-1/molecular-profiles?projection=DETAILED'
            );
        } finally {
            applySpy.mockRestore();
            (global as any).fetch = originalFetch;
        }
    });

    it('gives profiled samples without mutations an empty list', async () => {
        const inst = makeInstance('https://tiles.example.com/patient/P-1');
        inst.viewerState.hierarchy = makeHierarchy(
            [makeSlide({ slide_key: 'A' })],
            'P-1'
        );
        const sampleId = inst.viewerState.hierarchy.samples[0].sample_id;
        const originalFetch = (global as any).fetch;
        (global as any).fetch = jest
            .fn()
            .mockResolvedValueOnce({
                ok: true,
                json: async () => [
                    {
                        molecularProfileId: 'study_mutations',
                        molecularAlterationType: 'MUTATION_EXTENDED',
                    },
                ],
            })
            .mockResolvedValueOnce({ ok: true, json: async () => [] });

        try {
            await (inst as any).fetchAndMergeMutations(
                'study-1',
                [{ studyId: 'study-1', sampleId }],
                () => true
            );
        } finally {
            (global as any).fetch = originalFetch;
        }

        expect((inst as any).mutationDataStatus).toBe('ready');
        expect(inst.viewerState.hierarchy.samples[0].mutations).toEqual([]);
    });

    it('retries a transient mutation profile response before giving up', async () => {
        const inst = makeInstance('https://tiles.example.com/patient/P-1');
        inst.viewerState.hierarchy = makeHierarchy(
            [makeSlide({ slide_key: 'A' })],
            'P-1'
        );
        const sampleIdentifiers = [
            {
                studyId: 'study-1',
                sampleId: inst.viewerState.hierarchy.samples[0].sample_id,
            },
        ];
        clearWsiCbioportalRequestCaches();
        clearWsiCbioportalRequestCaches();
        const originalFetch = (global as any).fetch;
        const fetchMock = jest
            .fn()
            .mockResolvedValueOnce({ ok: false, status: 503 })
            .mockResolvedValueOnce({
                ok: true,
                json: async () => [
                    {
                        molecularProfileId: 'study_mutations',
                        molecularAlterationType: 'MUTATION_EXTENDED',
                    },
                ],
            })
            .mockResolvedValueOnce({
                ok: true,
                json: async () => [
                    {
                        sampleId: sampleIdentifiers[0].sampleId,
                        gene: { hugoGeneSymbol: 'TP53', entrezGeneId: 7157 },
                        proteinChange: 'R175H',
                        mutationType: 'Missense_Mutation',
                        tumorAltCount: 5,
                        tumorRefCount: 5,
                    },
                ],
            });
        (global as any).fetch = fetchMock;

        try {
            await (inst as any).fetchAndMergeMutations(
                'study-1',
                sampleIdentifiers,
                () => true
            );
        } finally {
            (global as any).fetch = originalFetch;
            clearWsiCbioportalRequestCaches();
            clearWsiCbioportalRequestCaches();
        }

        expect(inst.viewerState.hierarchy.samples[0].mutations).toEqual([
            expect.objectContaining({
                token: 'TP53 R175H',
                proteinChange: 'R175H',
                type: 'Missense',
            }),
        ]);
        expect((inst as any).mutationDataStatus).toBe('ready');
        expect(fetchMock).toHaveBeenCalledTimes(3);
    });

    it('reports an error after mutation retries are exhausted', async () => {
        const inst = makeInstance('https://tiles.example.com/patient/P-1');
        inst.viewerState.hierarchy = makeHierarchy(
            [makeSlide({ slide_key: 'A' })],
            'P-1'
        );
        const sampleIdentifiers = [
            {
                studyId: 'study-1',
                sampleId: inst.viewerState.hierarchy.samples[0].sample_id,
            },
        ];
        clearWsiCbioportalRequestCaches();
        clearWsiCbioportalRequestCaches();
        const originalFetch = (global as any).fetch;
        const fetchMock = jest
            .fn()
            .mockResolvedValue({ ok: false, status: 503 });
        (global as any).fetch = fetchMock;

        try {
            await (inst as any).fetchAndMergeMutations(
                'study-1',
                sampleIdentifiers,
                () => true
            );

            expect((inst as any).mutationDataStatus).toBe('error');
            expect(fetchMock).toHaveBeenCalledTimes(2);
        } finally {
            (global as any).fetch = originalFetch;
            clearWsiCbioportalRequestCaches();
            clearWsiCbioportalRequestCaches();
        }
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
        jest.spyOn(inst as any, 'fetchAndMergeVariantCounts').mockResolvedValue(
            undefined
        );

        await (inst as any).runSampleEnrichment(
            'study-1',
            'P-1',
            ['S-1', 'S-1', 'S-2'],
            () => true
        );

        expect(clinicalSpy).toHaveBeenCalledWith(
            dedupedIdentifiers,
            expect.any(Function)
        );
        expect(mutationSpy).toHaveBeenCalledWith(
            'study-1',
            dedupedIdentifiers,
            expect.any(Function)
        );
        expect(cnaSpy).toHaveBeenCalledWith(
            'study-1',
            dedupedIdentifiers,
            expect.any(Function)
        );
        expect(structuralVariantSpy).toHaveBeenCalledWith(
            'study-1',
            dedupedIdentifiers,
            expect.any(Function)
        );
    });

    it('reads the sample attributes from the host clinical data without requesting them', async () => {
        const inst = makeInstance('https://tiles.example.com/patient/P-1', {
            sampleClinicalData: null,
        });
        inst.viewerState.hierarchy = makeHierarchy(
            [makeSlide({ slide_key: 'A' })],
            'P-1'
        );
        const sampleId = inst.viewerState.hierarchy.samples[0].sample_id;
        const originalFetch = (global as any).fetch;
        const fetchMock = jest.fn();
        (global as any).fetch = fetchMock;

        try {
            await (inst as any).fetchAndMergeClinicalData(
                [{ studyId: 'study', sampleId }],
                () => true
            );
            expect(inst.viewerState.hierarchy.samples[0].tmb_score).toBe(
                undefined
            );

            const prevProps = inst.props;
            inst.props = {
                ...prevProps,
                sampleClinicalData: [
                    {
                        sampleId,
                        clinicalAttributeId: 'TMB_NONSYNONYMOUS',
                        value: '8.2',
                    },
                ],
            };
            inst.componentDidUpdate(prevProps);
        } finally {
            (global as any).fetch = originalFetch;
        }

        expect(fetchMock).not.toHaveBeenCalled();
        expect(inst.viewerState.hierarchy.samples[0].tmb_score).toBe('8.2');
    });
});

describe('WSIViewer — OncoKB and CIViC annotations', () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    function stubDataStages(inst: any) {
        jest.spyOn(inst, 'fetchAndMergeClinicalData').mockResolvedValue(
            undefined
        );
        jest.spyOn(inst, 'fetchAndMergeMutations').mockResolvedValue(
            'study_mutations'
        );
        jest.spyOn(inst, 'fetchAndMergeCNA').mockResolvedValue(undefined);
        jest.spyOn(inst, 'fetchAndMergeStructuralVariants').mockResolvedValue(
            undefined
        );
        jest.spyOn(inst, 'fetchAndMergeVariantCounts').mockResolvedValue(
            undefined
        );
    }

    it('reads the OncoKB and CIViC settings when a patient loads', async () => {
        const inst = makeInstance('https://tiles.example.com/patient/P-1');
        inst.viewerState.hierarchy = makeHierarchy(
            [makeSlide({ slide_key: 'A' })],
            'P-1'
        );
        stubDataStages(inst);
        const oncoKbSpy = jest
            .spyOn(inst, 'fetchAndMergeOncoKbAnnotations')
            .mockResolvedValue(undefined);
        const civicSpy = jest
            .spyOn(inst, 'fetchAndMergeCivicAnnotations')
            .mockResolvedValue(undefined);

        await inst.runSampleEnrichment('study-1', 'P-1', ['S-1'], () => true);
        expect(oncoKbSpy).not.toHaveBeenCalled();
        expect(civicSpy).not.toHaveBeenCalled();

        annotationsEnabled = true;
        await inst.runSampleEnrichment('study-1', 'P-1', ['S-1'], () => true);
        expect(oncoKbSpy).toHaveBeenCalledWith('study-1', expect.any(Function));
        expect(civicSpy).toHaveBeenCalledWith(expect.any(Function));
    });

    it("annotates for the sample's OncoTree code and the study's genome", async () => {
        annotationsEnabled = true;
        const inst = makeInstance('https://tiles.example.com/patient/P-1');
        const hierarchy = makeHierarchy([makeSlide({ slide_key: 'A' })], 'P-1');
        hierarchy.samples[0].mutations = [
            {
                token: 'KRAS G12D',
                gene: 'KRAS',
                proteinChange: 'G12D',
                entrezGeneId: 3845,
                consequence: 'Missense_Mutation',
            },
        ];
        inst.viewerState.hierarchy = hierarchy;
        jest.spyOn(
            wsiCbioportalDataUtils,
            'fetchStudyMolecularProfiles'
        ).mockResolvedValue({
            mutation: 'study_mutations',
            discreteCna: null,
            structuralVariant: null,
            referenceGenome: 'hg38',
        });
        const mutationSpy = jest
            .spyOn(
                wsiMolecularAnnotationDataUtils,
                'fetchOncoKbMutationAnnotations'
            )
            .mockResolvedValue([
                {
                    id: '3845_G12D_Missense_Mutation_COAD',
                    oncogenic: 'Oncogenic',
                },
            ]);

        await inst.fetchAndMergeOncoKbAnnotations('study-1', () => true);

        expect(mutationSpy).toHaveBeenCalledWith(
            [
                {
                    entry: expect.objectContaining({ token: 'KRAS G12D' }),
                    tumorType: 'COAD',
                },
            ],
            'GRCh38'
        );
        expect(
            inst.viewerState.hierarchy.samples[0].mutations[0].oncogenic
        ).toBe('Oncogenic');
        inst.cancelScheduledHierarchyRefresh();
    });

    it('drops annotations that arrive after the patient changed', async () => {
        annotationsEnabled = true;
        const inst = makeInstance('https://tiles.example.com/patient/P-1');
        const makeAnnotatedHierarchy = (patientId: string) => {
            const hierarchy = makeHierarchy(
                [makeSlide({ slide_key: `${patientId}-slide` })],
                patientId
            );
            hierarchy.samples[0].mutations = [
                {
                    token: 'KRAS G12D',
                    gene: 'KRAS',
                    proteinChange: 'G12D',
                    entrezGeneId: 3845,
                },
            ];
            return hierarchy;
        };
        inst.viewerState.hierarchy = makeAnnotatedHierarchy('P-A');
        // The observable copy the viewer holds.
        const hierarchyA = inst.viewerState.hierarchy;
        jest.spyOn(
            wsiCbioportalDataUtils,
            'fetchStudyMolecularProfiles'
        ).mockResolvedValue({
            mutation: 'study_mutations',
            discreteCna: null,
            structuralVariant: null,
            referenceGenome: 'hg19',
        });
        const annotations = deferredPromise<any[]>();
        jest.spyOn(
            wsiMolecularAnnotationDataUtils,
            'fetchOncoKbMutationAnnotations'
        ).mockReturnValue(annotations.promise);

        const pending = inst.fetchAndMergeOncoKbAnnotations(
            'study-1',
            () => inst.viewerState.hierarchy === hierarchyA
        );
        for (let tick = 0; tick < 5; tick += 1) {
            await Promise.resolve();
        }
        inst.viewerState.hierarchy = makeAnnotatedHierarchy('P-B');
        annotations.resolve([
            { id: '3845_G12D__COAD', oncogenic: 'Oncogenic' },
        ]);
        await pending;

        expect(hierarchyA.samples[0].mutations[0].oncogenic).toBeUndefined();
        expect(
            inst.viewerState.hierarchy.samples[0].mutations[0].oncogenic
        ).toBeUndefined();
    });
});
