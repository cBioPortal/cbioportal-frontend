import { TileMetadata } from './wsiViewerTypes';
import { WsiHashState } from './wsiViewStateUtils';

const OSD_NAVIGATOR_BOTTOM_OFFSET_PX = '48px';

export function buildOsdTileSource(
    meta: TileMetadata,
    baseUrl: string,
    imageId: string,
    studyId?: string
) {
    return {
        width: meta.dimensions.width,
        height: meta.dimensions.height,
        tileSize: meta.tile_size,
        tileOverlap: 0,
        maxLevel: meta.max_zoom,
        minLevel: 0,
        getTileUrl(level: number, x: number, y: number): string {
            const query = studyId
                ? `?studyId=${encodeURIComponent(studyId)}`
                : '';
            return `${baseUrl}/tiles/${imageId}/zxy/${level}/${x}/${y}${query}`;
        },
    };
}

export function buildOsdOptions({
    element,
    navId,
    meta,
    baseUrl,
    imageId,
    accessToken,
    studyId,
}: {
    element: HTMLElement;
    navId: string;
    meta: TileMetadata;
    baseUrl: string;
    imageId: string;
    accessToken?: string;
    studyId?: string;
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
        timeout: 90000,
        imageLoaderLimit: 6,
        ...(accessToken
            ? { ajaxHeaders: { Authorization: `Bearer ${accessToken}` } }
            : {}),
        tileSources: buildOsdTileSource(meta, baseUrl, imageId, studyId),
    };
}

export function ensureNavigator({
    osdViewer,
    openSeadragon,
    meta,
    baseUrl,
    imageId,
    accessToken,
    studyId,
}: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    osdViewer: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    openSeadragon: any;
    meta: TileMetadata;
    baseUrl: string;
    imageId: string;
    accessToken?: string;
    studyId?: string;
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
        ...(accessToken
            ? { ajaxHeaders: { Authorization: `Bearer ${accessToken}` } }
            : {}),
        tileSources: buildOsdTileSource(meta, baseUrl, imageId, studyId),
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
}: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    osdViewer: any;
    hashState: WsiHashState | null;
    selectedSlideId: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    openSeadragon: any;
}): void {
    const viewport = osdViewer?.viewport;
    if (!viewport) return;

    if (hashState && hashState.slideId === selectedSlideId) {
        const imagePoint = new openSeadragon.Point(hashState.x, hashState.y);
        const viewportPoint = viewport.imageToViewportCoordinates(imagePoint);
        viewport.panTo(viewportPoint, true);
        viewport.zoomTo(hashState.z, undefined, true);
        return;
    }

    viewport.goHome(true);
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
