/**
 * @jest-environment jsdom
 */
import {
    WSI_SESSION_EXPIRED_MESSAGE,
    WsiViewerController,
    WsiViewerControllerHost,
} from './wsiViewerController';
import { getWsiSlideSource } from './wsiAuth';
import {
    fetchWsiThumbnailBlob,
    WsiThumbnailFetchError,
} from './wsiThumbnailFetchCache';
import { configureWsiViewerRuntime } from './wsiViewerConfig';
import { WsiViewerState } from './wsiViewerState';
import { Sample, Slide, TileMetadata } from './wsiViewerTypes';

jest.mock('./wsiAuth', () => ({
    getWsiSlideSource: jest.fn(),
}));
jest.mock('./wsiThumbnailFetchCache', () => ({
    ...jest.requireActual('./wsiThumbnailFetchCache'),
    fetchWsiThumbnailBlob: jest.fn(),
}));
jest.mock('./wsiOpenSeadragonLoader', () => ({}));

const getWsiSlideSourceMock = getWsiSlideSource as jest.Mock;
const fetchWsiThumbnailBlobMock = fetchWsiThumbnailBlob as jest.Mock;

type Handler = (event?: any) => void;

class FakeViewer {
    handlers = new Map<string, Handler[]>();
    element: HTMLElement;
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

    constructor(public options: any) {
        this.element = options.element;
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

function makeSource(slideKey: string) {
    return {
        slideKey,
        servingKey: slideKey,
        sealedSource: `sealed-${slideKey}`,
        tileMetadata: {
            dimensions: { width: 1000, height: 800 },
            levels: 3,
            level_dimensions: [],
            max_zoom: 10,
            tile_size: 256,
        },
    };
}

/** The URL of tile 0/0/0 of an OpenSeadragon tile source. */
function firstTileUrl(tileSource: any): URL {
    return new URL(tileSource.getTileUrl(0, 0, 0));
}

function expectTileUrlFor(tileSource: any, slideKey: string) {
    const url = firstTileUrl(tileSource);
    expect(url.pathname).toBe('/tiles/zxy/0/0/0');
    expect(url.searchParams.get('studyId')).toBe('study');
    expect(url.searchParams.get('key')).toBe(slideKey);
    expect(url.searchParams.get('enc')).toBe(`sealed-${slideKey}`);
}

function makeHarness() {
    let container: HTMLDivElement = document.createElement('div');
    const state = new WsiViewerState();
    state.selectedSample = { sample_id: 'S-1' } as Sample;
    const host: WsiViewerControllerHost = {
        getProps: () => ({
            studyId: 'study',
            patientId: 'P-1',
            authScope: 'user',
        }),
        getServableSlides: () => [],
        getStainFilter: () => 'all' as any,
        getTileServerBase: () => 'https://tiles.example.com',
        getViewerContainerElement: () => container,
        chooseInitialServableSlide: () => undefined,
        reportInitialSlideLoadPerformance: jest.fn(),
    };
    const viewers: FakeViewer[] = [];
    const openSeadragon: any = jest.fn((options: any) => {
        const viewer = new FakeViewer(options);
        viewers.push(viewer);
        return viewer;
    });
    const controller = new WsiViewerController(host, state, () =>
        Promise.resolve(openSeadragon)
    );
    return {
        controller,
        host,
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
        });
    });

    beforeEach(() => {
        rafSpy = jest
            .spyOn(window, 'requestAnimationFrame')
            .mockImplementation((cb: FrameRequestCallback) => {
                cb(0);
                return 0;
            });
        getWsiSlideSourceMock.mockImplementation(
            (_study: string, slideKey: string) => makeSource(slideKey)
        );
        fetchWsiThumbnailBlobMock.mockImplementation(() =>
            Promise.reject(new Error('no preview'))
        );
    });

    afterEach(() => {
        rafSpy.mockRestore();
        getWsiSlideSourceMock.mockReset();
        fetchWsiThumbnailBlobMock.mockReset();
    });

    it('opens later slides in the same viewer with their own tile URLs', async () => {
        const { controller, openSeadragon, viewers } = makeHarness();

        await controller.selectSlide(makeSlide('slide-a'), sample);
        expect(openSeadragon).toHaveBeenCalledTimes(1);
        const viewer = viewers[0];
        expectTileUrlFor(viewer.options.tileSources, 'slide-a');
        expect(viewer.options).not.toHaveProperty('ajaxHeaders');
        viewer.raise('open');
        expect(viewer.handlerCount('animation-finish')).toBe(1);

        await controller.selectSlide(makeSlide('slide-b'), sample);

        expect(openSeadragon).toHaveBeenCalledTimes(1);
        expect(viewer.destroy).not.toHaveBeenCalled();
        expect(viewer.close).toHaveBeenCalled();
        expect(viewer.open).toHaveBeenCalledTimes(1);
        expectTileUrlFor(viewer.open.mock.calls[0][0], 'slide-b');
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

    it('ignores container resizes while the viewer is hidden', async () => {
        const { controller, viewers } = makeHarness();
        controller.setVisible(false);

        await controller.selectSlide(makeSlide('slide-a'), sample);
        const viewer = viewers[0] as any;
        expect(viewer.autoResize).toBe(false);

        controller.setVisible(true);
        expect(viewer.autoResize).toBe(true);
        controller.setVisible(false);
        expect(viewer.autoResize).toBe(false);
        controller.dispose();
    });

    it('rebuilds the viewer while the previous slide still has tile requests', async () => {
        const { controller, openSeadragon, viewers } = makeHarness();

        await controller.selectSlide(makeSlide('slide-a'), sample);
        viewers[0].imageLoader.jobsInProgress = 2;
        await controller.selectSlide(makeSlide('slide-b'), sample);

        expect(openSeadragon).toHaveBeenCalledTimes(2);
        expect(viewers[0].destroy).toHaveBeenCalledTimes(1);
        expect(viewers[0].open).not.toHaveBeenCalled();
        expectTileUrlFor(viewers[1].options.tileSources, 'slide-b');
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
        expectTileUrlFor(viewers[1].options.tileSources, 'slide-b');
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

describe('WsiViewerController refused session', () => {
    let rafSpy: jest.SpyInstance;

    beforeEach(() => {
        rafSpy = jest
            .spyOn(window, 'requestAnimationFrame')
            .mockImplementation((cb: FrameRequestCallback) => {
                cb(0);
                return 0;
            });
        getWsiSlideSourceMock.mockImplementation(
            (_study: string, slideKey: string) => makeSource(slideKey)
        );
    });

    afterEach(() => {
        rafSpy.mockRestore();
        getWsiSlideSourceMock.mockReset();
        fetchWsiThumbnailBlobMock.mockReset();
    });

    async function flushPromises() {
        for (let i = 0; i < 5; i++) await Promise.resolve();
    }

    it.each([401, 403])(
        'asks to sign in again when a tile is refused with %s',
        async status => {
            fetchWsiThumbnailBlobMock.mockImplementation(
                () => new Promise(() => {})
            );
            const { controller, viewers } = makeHarness();
            const state = (controller as any).state as WsiViewerState;
            await controller.selectSlide(makeSlide('slide-a'), sample);

            // The first refusal is final: retrying cannot help.
            viewers[0].raise('tile-load-failed', {
                tries: 1,
                tileRequest: { status },
                tile: { getUrl: () => 'tile-1' },
            });

            expect(state.error).toBe(WSI_SESSION_EXPIRED_MESSAGE);
            controller.dispose();
        }
    );

    it('keeps retrying a tile that failed for another reason', async () => {
        fetchWsiThumbnailBlobMock.mockImplementation(
            () => new Promise(() => {})
        );
        const { controller, viewers } = makeHarness();
        const state = (controller as any).state as WsiViewerState;
        await controller.selectSlide(makeSlide('slide-a'), sample);

        viewers[0].raise('tile-load-failed', {
            tries: 1,
            tileRequest: { status: 502 },
            tile: { getUrl: () => 'tile-1' },
        });

        expect(state.error).toBeNull();
        controller.dispose();
    });

    it.each([401, 403, 404])(
        'drops a thumbnail preview refused with %s and lets the tiles load',
        async status => {
            fetchWsiThumbnailBlobMock.mockImplementation(() =>
                Promise.reject(
                    new WsiThumbnailFetchError(
                        `thumbnail request failed (${status})`,
                        { response: { status } as Response }
                    )
                )
            );
            const { controller, host, openSeadragon, viewers } = makeHarness();
            openSeadragon.MouseTracker = jest.fn(() => ({
                destroy: jest.fn(),
            }));
            const state = (controller as any).state as WsiViewerState;
            // Treat slide-a as the first slide of a hierarchy load, whose
            // outcome is reported.
            (controller as any).initialSlideKey = 'slide-a';
            (controller as any).initialSlideLoadStartedAt = Date.now();

            await controller.selectSlide(makeSlide('slide-a'), sample);
            await flushPromises();

            expect(fetchWsiThumbnailBlobMock).toHaveBeenCalledTimes(1);
            expect(state.error).toBeNull();
            expect(state.thumbnailPreviewUrl).toBeNull();

            viewers[0].raise('open');
            viewers[0].raise('tile-loaded', {});
            // The spinner stays up for a minimum time after the first tile.
            await new Promise(resolve => setTimeout(resolve, 300));

            expect(state.error).toBeNull();
            expect(state.tilesReady).toBe(true);
            const report = host.reportInitialSlideLoadPerformance as jest.Mock;
            expect(report).toHaveBeenCalledTimes(1);
            expect(report.mock.calls[0][0].outcome).toBe('success');
            controller.dispose();
        }
    );
});
