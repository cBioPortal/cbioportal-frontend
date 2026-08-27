import { TileMetadata } from './wsiViewerTypes';
import { WsiHashState } from './wsiViewStateUtils';
import { buildWsiRequestHeaders } from './wsiUrls';

const OSD_NAVIGATOR_BOTTOM_OFFSET_PX = '48px';
export const OSD_INITIAL_IMAGE_LOADER_LIMIT = 1;
export const OSD_STEADY_IMAGE_LOADER_LIMIT = 4;
export const OSD_TILE_TIMEOUT_MS = 15_000;
export const OSD_TILE_RETRY_MAX = 2;
export const OSD_TILE_RETRY_DELAY_MS = 500;

export function buildOsdTileSource(meta: TileMetadata, baseUrl: string) {
    return {
        width: meta.dimensions.width,
        height: meta.dimensions.height,
        tileSize: meta.tile_size,
        tileOverlap: 0,
        maxLevel: meta.max_zoom,
        minLevel: Math.max(
            0,
            Math.min(meta.safe_min_level ?? 0, meta.max_zoom)
        ),
        getTileUrl(level: number, x: number, y: number): string {
            return `${baseUrl}/tiles/zxy/${level}/${x}/${y}`;
        },
    };
}

export function buildOsdOptions({
    element,
    navId,
    meta,
    baseUrl,
    accessToken,
    sourceUrl,
}: {
    element: HTMLElement;
    navId: string;
    meta: TileMetadata;
    baseUrl: string;
    accessToken?: string;
    sourceUrl: string;
}) {
    return {
        element,
        showNavigationControl: true,
        zoomInButton: `${navId}-zoom-in`,
        zoomOutButton: `${navId}-zoom-out`,
        homeButton: `${navId}-home`,
        showNavigator: true,
        navigatorPosition: 'BOTTOM_RIGHT' as const,
        navigatorSizeRatio: 0.2,
        navigatorAutoFade: true,
        navigatorRotate: true,
        navigatorBackground: '#000',
        navigatorOpacity: 0.8,
        navigatorBorderColor: '#555',
        navigatorDisplayRegionColor: '#900',
        crossOriginPolicy: 'Anonymous' as const,
        prefixUrl: '/reactapp/osd-images/',
        showFullPageControl: false,
        gestureSettingsMouse: { clickToZoom: false },
        timeout: OSD_TILE_TIMEOUT_MS,
        imageLoaderLimit: OSD_INITIAL_IMAGE_LOADER_LIMIT,
        tileRetryMax: OSD_TILE_RETRY_MAX,
        tileRetryDelay: OSD_TILE_RETRY_DELAY_MS,
        loadTilesWithAjax: Boolean(accessToken || sourceUrl),
        ajaxHeaders: buildWsiRequestHeaders(sourceUrl, accessToken),
        tileSources: buildOsdTileSource(meta, baseUrl),
    };
}

// OpenSeadragon starts with one tile request so that the server can finish the
// expensive cold open before the viewport fans out to steady-state concurrency.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function promoteOsdImageLoaderLimit(osdViewer: any): void {
    const imageLoader = osdViewer?.imageLoader;
    if (imageLoader && typeof imageLoader.jobLimit === 'number') {
        imageLoader.jobLimit = OSD_STEADY_IMAGE_LOADER_LIMIT;
    }
}

export function ensureNavigator({
    osdViewer,
    openSeadragon,
    meta,
    baseUrl,
    accessToken,
    sourceUrl,
}: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    osdViewer: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    openSeadragon: any;
    meta: TileMetadata;
    baseUrl: string;
    accessToken?: string;
    sourceUrl: string;
}) {
    if (!osdViewer || osdViewer.navigator) {
        return osdViewer?.navigator ?? null;
    }

    osdViewer.navigator = new openSeadragon.Navigator({
        viewer: osdViewer,
        position: 'BOTTOM_RIGHT',
        sizeRatio: 0.2,
        autoFade: true,
        navigatorRotate: true,
        background: '#000',
        opacity: 0.8,
        borderColor: '#555',
        displayRegionColor: '#900',
        ajaxHeaders: buildWsiRequestHeaders(sourceUrl, accessToken),
        loadTilesWithAjax: Boolean(accessToken || sourceUrl),
        tileSources: buildOsdTileSource(meta, baseUrl),
    });
    offsetNavigatorElement(osdViewer);
    return osdViewer.navigator;
}

export function offsetNavigatorElement(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    osdViewer: any
): void {
    const navEl = osdViewer?.navigator?.element as HTMLElement | undefined;
    if (navEl) {
        navEl.style.bottom = OSD_NAVIGATOR_BOTTOM_OFFSET_PX;
    }
}

export function restoreOrHomeViewport({
    osdViewer,
    hashState,
    selectedSlideId,
    openSeadragon,
    meta,
}: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    osdViewer: any;
    hashState: WsiHashState | null;
    selectedSlideId: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    openSeadragon: any;
    meta?: TileMetadata | null;
}): void {
    const viewport = osdViewer?.viewport;
    if (!viewport) return;

    if (hashState && hashState.slideId === selectedSlideId) {
        const maxX = meta?.dimensions.width
            ? meta.dimensions.width - 1
            : undefined;
        const maxY = meta?.dimensions.height
            ? meta.dimensions.height - 1
            : undefined;
        const x = clampNumber(hashState.x, 0, maxX);
        const y = clampNumber(hashState.y, 0, maxY);
        const minZoom = getFiniteViewportLimit(viewport, 'getMinZoom');
        const maxZoom = getFiniteViewportLimit(viewport, 'getMaxZoom');
        const lowerZoom = minZoom ?? 0;
        const upperZoom =
            maxZoom !== undefined && maxZoom >= lowerZoom ? maxZoom : undefined;
        const zoom = clampNumber(
            hashState.z > 0 ? hashState.z : lowerZoom,
            lowerZoom,
            upperZoom
        );
        const imagePoint = new openSeadragon.Point(x, y);
        const viewportPoint = viewport.imageToViewportCoordinates(imagePoint);
        viewport.panTo(viewportPoint, true);
        viewport.zoomTo(zoom, undefined, true);
        viewport.applyConstraints?.(true);
        return;
    }

    viewport.goHome(true);
}

function clampNumber(value: number, min: number, max?: number): number {
    const finiteValue = Number.isFinite(value) ? value : min;
    const upperBound = max !== undefined ? Math.max(min, max) : undefined;
    return Math.max(
        min,
        upperBound !== undefined
            ? Math.min(finiteValue, upperBound)
            : finiteValue
    );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getFiniteViewportLimit(
    viewport: any,
    method: 'getMinZoom' | 'getMaxZoom'
): number | undefined {
    const value = viewport?.[method]?.();
    return typeof value === 'number' && Number.isFinite(value) && value > 0
        ? value
        : undefined;
}

export function destroyOsdHandles({
    osdMouseTracker,
    osdViewer,
    clearCursorPos,
}: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    osdMouseTracker: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    osdViewer: any;
    clearCursorPos: () => void;
}) {
    if (osdMouseTracker) {
        try {
            osdMouseTracker.destroy();
        } catch (_) {
            // ignore
        }
    }
    if (osdViewer) {
        try {
            osdViewer.destroy();
        } catch (_) {
            // ignore
        }
    }
    clearCursorPos();
}

export function scheduleOsdSpinnerHide({
    existingTimer,
    hideSpinner,
    loadingStart,
    minimumSpinnerMs,
}: {
    existingTimer: ReturnType<typeof setTimeout> | null;
    hideSpinner: () => void;
    loadingStart: number;
    minimumSpinnerMs: number;
}): ReturnType<typeof setTimeout> {
    const remaining = Math.max(
        0,
        minimumSpinnerMs - (Date.now() - loadingStart)
    );
    if (existingTimer !== null) {
        clearTimeout(existingTimer);
    }
    return setTimeout(hideSpinner, remaining);
}

export function scheduleOsdSpinnerFallback({
    existingTimer,
    hideSpinner,
    fallbackMs = 20_000,
}: {
    existingTimer: ReturnType<typeof setTimeout> | null;
    hideSpinner: () => void;
    fallbackMs?: number;
}): ReturnType<typeof setTimeout> {
    if (existingTimer !== null) {
        clearTimeout(existingTimer);
    }
    return setTimeout(hideSpinner, fallbackMs);
}

export function registerOsdLifecycleHandlers({
    osdViewer,
    onOpen,
    onOpenFailed,
    onTileLoadFailed,
}: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    osdViewer: any;
    onOpen: () => void;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onOpenFailed: (event: any) => void;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onTileLoadFailed: (event: any) => void;
}): void {
    osdViewer.addOnceHandler('open', onOpen);
    osdViewer.addOnceHandler('open-failed', onOpenFailed);
    osdViewer.addHandler('tile-load-failed', onTileLoadFailed);
}

export function createOsdMouseTracker({
    openSeadragon,
    element,
    viewer,
    onCursorMove,
    onCursorExit,
}: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    openSeadragon: any;
    element: HTMLElement;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    viewer: any;
    onCursorMove: (x: number, y: number) => void;
    onCursorExit: () => void;
}) {
    return new openSeadragon.MouseTracker({
        element,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        moveHandler(event: any) {
            if (!viewer.viewport) return;
            try {
                const viewportPoint = viewer.viewport.pointFromPixel(
                    event.position
                );
                const imagePoint = viewer.viewport.viewportToImageCoordinates(
                    viewportPoint
                );
                onCursorMove(
                    Math.round(imagePoint.x),
                    Math.round(imagePoint.y)
                );
            } catch (_) {
                // ignore during init
            }
        },
        exitHandler: onCursorExit,
    });
}
