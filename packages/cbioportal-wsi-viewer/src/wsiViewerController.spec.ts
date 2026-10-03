/**
 * @jest-environment jsdom
 */
import {
    WsiViewerController,
    WsiViewerControllerHost,
} from './wsiViewerController';
import { getWsiSlideAccess } from './wsiAuth';
import { configureWsiViewerRuntime } from './wsiViewerConfig';
import { Sample, Slide, TileMetadata } from './wsiViewerTypes';

jest.mock('./wsiAuth', () => ({
    getWsiSlideAccess: jest.fn(),
}));
jest.mock('./wsiMetadataFetchCache', () => ({
    evictSlideMetadataCache: jest.fn(),
    fetchSlideMetadataCachedReadOnly: jest.fn(() =>
        Promise.resolve({
            dimensions: { width: 1000, height: 800 },
            levels: 3,
            level_dimensions: [],
            max_zoom: 10,
            tile_size: 256,
        })
    ),
    hasCachedSlideMetadata: jest.fn(() => false),
}));
jest.mock('./wsiThumbnailFetchCache', () => ({
    fetchWsiThumbnailBlob: jest.fn(() =>
        Promise.reject(new Error('no preview'))
    ),
}));
jest.mock('./wsiOpenSeadragonLoader', () => ({
    hasPreloadedOpenSeadragon: () => false,
}));
jest.mock('./wsiNetworkWarmup', () => ({
    ensureWsiPreconnect: jest.fn(),
}));

const getWsiSlideAccessMock = getWsiSlideAccess as jest.Mock;

type Handler = (event?: any) => void;

class FakeViewer {
    handlers = new Map<string, Handler[]>();
    ajaxHeaders: Record<string, string>;
    element: HTMLElement;
    loadTilesWithAjax: boolean;
    imageLoader = {
        jobLimit: 1,
        jobsInProgress: 0,
        jobQueue: [] as unknown[],
        failedTiles: [] as unknown[],
    };
    items: unknown[] = [];
    world = {
        getIndexOfItem: (item: unknown) => this.items.indexOf(item),
    };
    drawer = { getType: () => 'canvas' };
    viewport = { goHome: jest.fn() };
    navigator: any = null;
    open = jest.fn();
    close = jest.fn();
    destroy = jest.fn();
    setAjaxHeaders = jest.fn((headers: Record<string, string>) => {
        this.ajaxHeaders = headers;
    });

    constructor(public options: any) {
        this.element = options.element;
        this.ajaxHeaders = options.ajaxHeaders;
        this.loadTilesWithAjax = options.loadTilesWithAjax;
    }

    addHandler(eventName: string, handler: Handler) {
        this.handlers.set(eventName, [
            ...(this.handlers.get(eventName) ?? []),
            handler,
        ]);
        return true;
    }

    removeHandler(eventName: string, handler: Handler) {
        this.handlers.set(
            eventName,
            (this.handlers.get(eventName) ?? []).filter(h => h !== handler)
        );
    }

    raise(eventName: string, event: any = {}) {
        [...(this.handlers.get(eventName) ?? [])].forEach(h => h(event));
    }

    handlerCount(eventName: string) {
        return this.handlers.get(eventName)?.length ?? 0;
    }
}

function makeSlide(slideKey: string): Slide {
    return { slide_key: slideKey, can_serve_tiles: true } as Slide;
}

function makeAccess(slideKey: string, token: string) {
    return {
        slideKey,
        accessToken: token,
        tokenType: 'Bearer',
        expiresIn: 600,
        expiresAt: Date.now() + 600_000,
    };
}

function makeHarness() {
    let container: HTMLDivElement = document.createElement('div');
    let selected: Slide | null = null;
    let meta: TileMetadata | null = null;
    const host: WsiViewerControllerHost = {
        getProps: () => ({
            hierarchyUrl: '/api/wsi/v2/hierarchy/study/P-1',
            studyId: 'study',
            patientId: 'P-1',
            authScope: 'user',
        }),
        resetHierarchyLoadState: jest.fn(),
        setHierarchy: jest.fn(),
        setLoading: jest.fn(),
        setError: jest.fn(),
        getHierarchy: () => null,
        getServableSlides: () => [],
        getStainFilter: () => 'all' as any,
        getTileServerBase: () => 'https://tiles.example.com',
        getTileServerOrigin: () => 'https://tiles.example.com',
        getViewerContainerElement: () => container,
        chooseInitialServableSlide: () => undefined,
        beginSlideSelection: slide => {
            selected = slide;
            meta = null;
        },
        setSelectedMeta: value => {
            meta = value;
        },
        setViewerReady: jest.fn(),
        setSpinnerVisible: jest.fn(),
        setTilesReady: jest.fn(),
        setThumbnailPreview: jest.fn(),
        getSelectedSlide: () => selected,
        getSelectedSample: () => ({ sample_id: 'S-1' } as Sample),
        getSelectedMeta: () => meta,
        clearSelectedSlide: jest.fn(),
        getPatientId: () => 'P-1',
        setCoordInputs: jest.fn(),
        getCoordInputs: () => ({ x: '', y: '' }),
        updateCursorPos: jest.fn(),
        clearCursorPos: jest.fn(),
        reportInitialSlideLoadPerformance: jest.fn(),
    };
    const viewers: FakeViewer[] = [];
    const openSeadragon: any = jest.fn((options: any) => {
        const viewer = new FakeViewer(options);
        viewers.push(viewer);
        return viewer;
    });
    const controller = new WsiViewerController(host, () =>
        Promise.resolve(openSeadragon)
    );
    return {
        controller,
        openSeadragon,
        viewers,
        replaceContainer: () => {
            container = document.createElement('div');
        },
    };
}

const sample = { sample_id: 'S-1' } as Sample;

describe('WsiViewerController viewer lifecycle', () => {
    let rafSpy: jest.SpyInstance;

    beforeAll(() => {
        configureWsiViewerRuntime({
            buildApiUrl: path => `/${path}`,
            authEnabled: false,
        });
    });

    beforeEach(() => {
        rafSpy = jest
            .spyOn(window, 'requestAnimationFrame')
            .mockImplementation((cb: FrameRequestCallback) => {
                cb(0);
                return 0;
            });
        getWsiSlideAccessMock.mockImplementation(
            (_study: string, slideKey: string) =>
                Promise.resolve(makeAccess(slideKey, `token-${slideKey}`))
        );
    });

    afterEach(() => {
        rafSpy.mockRestore();
        getWsiSlideAccessMock.mockReset();
    });

    it('opens later slides in the same viewer with their own headers', async () => {
        const { controller, openSeadragon, viewers } = makeHarness();

        await controller.selectSlide(makeSlide('slide-a'), sample);
        expect(openSeadragon).toHaveBeenCalledTimes(1);
        const viewer = viewers[0];
        expect(viewer.options.ajaxHeaders.Authorization).toBe(
            'Bearer token-slide-a'
        );
        viewer.raise('open');
        expect(viewer.handlerCount('animation-finish')).toBe(1);

        await controller.selectSlide(makeSlide('slide-b'), sample);

        expect(openSeadragon).toHaveBeenCalledTimes(1);
        expect(viewer.destroy).not.toHaveBeenCalled();
        expect(viewer.close).toHaveBeenCalled();
        expect(viewer.setAjaxHeaders).toHaveBeenCalledWith(
            {
                Authorization: 'Bearer token-slide-b',
            },
            true
        );
        expect(viewer.open).toHaveBeenCalledTimes(1);
        expect(viewer.open.mock.calls[0][0]).toMatchObject({
            width: 1000,
            height: 800,
        });
        // Slide A's handlers are gone; slide B binds its own once.
        expect(viewer.handlerCount('animation-finish')).toBe(0);
        expect(viewer.handlerCount('open')).toBe(1);
        expect(viewer.handlerCount('tile-load-failed')).toBe(1);
        viewer.raise('open');
        expect(viewer.handlerCount('open')).toBe(0);
        expect(viewer.handlerCount('animation-finish')).toBe(1);

        controller.dispose();
        expect(viewer.destroy).toHaveBeenCalledTimes(1);
    });

    it('rebuilds the viewer while the previous slide still has tile requests', async () => {
        const { controller, openSeadragon, viewers } = makeHarness();

        await controller.selectSlide(makeSlide('slide-a'), sample);
        viewers[0].imageLoader.jobsInProgress = 2;
        await controller.selectSlide(makeSlide('slide-b'), sample);

        expect(openSeadragon).toHaveBeenCalledTimes(2);
        expect(viewers[0].destroy).toHaveBeenCalledTimes(1);
        expect(viewers[0].open).not.toHaveBeenCalled();
        expect(viewers[1].options.ajaxHeaders.Authorization).toBe(
            'Bearer token-slide-b'
        );
        controller.dispose();
    });

    it("ignores a closed slide's tile events on the reused viewer", async () => {
        const { controller, viewers } = makeHarness();

        await controller.selectSlide(makeSlide('slide-a'), sample);
        const viewer = viewers[0];
        await controller.selectSlide(makeSlide('slide-b'), sample);
        const imageB = {};
        viewer.items = [imageB];
        viewer.raise('open');
        expect(viewer.handlerCount('tile-loaded')).toBe(1);

        // A request for slide A finishing late does not count for slide B.
        viewer.raise('tile-loaded', { tiledImage: {} });
        expect(viewer.handlerCount('tile-loaded')).toBe(1);

        viewer.raise('tile-loaded', { tiledImage: imageB });
        expect(viewer.handlerCount('tile-loaded')).toBe(0);
        controller.dispose();
    });

    it('rebuilds the viewer when its container was replaced', async () => {
        const {
            controller,
            openSeadragon,
            viewers,
            replaceContainer,
        } = makeHarness();

        await controller.selectSlide(makeSlide('slide-a'), sample);
        replaceContainer();
        await controller.selectSlide(makeSlide('slide-b'), sample);

        expect(openSeadragon).toHaveBeenCalledTimes(2);
        expect(viewers[0].destroy).toHaveBeenCalledTimes(1);
        expect(viewers[1].options.ajaxHeaders.Authorization).toBe(
            'Bearer token-slide-b'
        );
        controller.dispose();
    });

    it('reopens the same slide after its selection was cancelled', async () => {
        const { controller, viewers } = makeHarness();

        await controller.selectSlide(makeSlide('slide-a'), sample);
        controller.cancelSlideSelection();
        await controller.selectSlide(makeSlide('slide-a'), sample);

        expect(viewers).toHaveLength(1);
        expect(viewers[0].open).toHaveBeenCalledTimes(1);
        controller.dispose();
    });
});

describe('WsiViewerController token refresh', () => {
    let rafSpy: jest.SpyInstance;

    beforeEach(() => {
        jest.useFakeTimers();
        rafSpy = jest
            .spyOn(window, 'requestAnimationFrame')
            .mockImplementation((cb: FrameRequestCallback) => {
                cb(0);
                return 0;
            });
        getWsiSlideAccessMock.mockImplementation(
            (_study: string, slideKey: string, forceRefresh: boolean) =>
                Promise.resolve({
                    ...makeAccess(
                        slideKey,
                        forceRefresh ? 'token-new' : 'token-old'
                    ),
                    // Due for refresh 10 s from now.
                    expiresAt: Date.now() + 40_000,
                })
        );
    });

    afterEach(() => {
        rafSpy.mockRestore();
        getWsiSlideAccessMock.mockReset();
        jest.useRealTimers();
    });

    async function flushPromises() {
        for (let i = 0; i < 5; i++) await Promise.resolve();
    }

    function refreshCalls() {
        return getWsiSlideAccessMock.mock.calls.filter(call => call[2]);
    }

    it('refreshes the token before it expires', async () => {
        const { controller, viewers } = makeHarness();
        await controller.selectSlide(makeSlide('slide-a'), sample);

        jest.advanceTimersByTime(10_000);
        await flushPromises();

        expect(refreshCalls()).toHaveLength(1);
        expect(viewers[0].setAjaxHeaders).toHaveBeenLastCalledWith(
            expect.objectContaining({ Authorization: 'Bearer token-new' }),
            true
        );
        controller.dispose();
    });

    it('pauses refresh while hidden and refreshes a due token when shown', async () => {
        const { controller, viewers } = makeHarness();
        await controller.selectSlide(makeSlide('slide-a'), sample);

        controller.setVisible(false);
        jest.advanceTimersByTime(60_000);
        await flushPromises();
        expect(refreshCalls()).toHaveLength(0);

        controller.setVisible(true);
        await flushPromises();

        expect(refreshCalls()).toHaveLength(1);
        expect(viewers[0].setAjaxHeaders).toHaveBeenLastCalledWith(
            expect.objectContaining({ Authorization: 'Bearer token-new' }),
            true
        );
        controller.dispose();
    });

    it('resumes the refresh schedule when shown before the token is due', async () => {
        const { controller } = makeHarness();
        await controller.selectSlide(makeSlide('slide-a'), sample);

        controller.setVisible(false);
        jest.advanceTimersByTime(5_000);
        controller.setVisible(true);
        await flushPromises();
        expect(refreshCalls()).toHaveLength(0);

        jest.advanceTimersByTime(5_000);
        await flushPromises();
        expect(refreshCalls()).toHaveLength(1);
        controller.dispose();
    });
});
