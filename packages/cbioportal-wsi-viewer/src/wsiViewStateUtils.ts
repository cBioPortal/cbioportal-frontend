import { TileMetadata } from './wsiViewerTypes';

export type WsiHashViewport = {
    x: number;
    y: number;
    z: number;
};

/**
 * A `#wsi:` hash selects a slide and may also carry a viewport. The selection
 * form without coordinates (`#wsi:slide=X`) is written when a slide is chosen
 * before its viewport is known.
 */
export type WsiHashState =
    | ({ slideId: string } & WsiHashViewport)
    | { slideId: string; x?: undefined; y?: undefined; z?: undefined };

export function hasWsiHashViewport(
    state: WsiHashState | null | undefined
): state is { slideId: string } & WsiHashViewport {
    return !!state && state.x !== undefined;
}

/**
 * Where the viewer keeps the selected slide and viewport so that a copied
 * link reopens the same view. The default keeps it in a `#wsi:` URL hash.
 */
export interface WsiUrlStateAdapter {
    /** The stored slide selection and viewport, or null when there is none. */
    read(): WsiHashState | null;
    /** Stores the state and returns the shareable URL that carries it. */
    write(state: WsiHashState): string;
    /** Removes the stored state. */
    clear(): void;
    /** Shareable URL of the current page. */
    currentUrl(): string;
    /**
     * Calls the listener when the stored state changes outside the viewer
     * (e.g. browser navigation). Returns a function that unsubscribes.
     */
    subscribe(listener: () => void): () => void;
}

export function formatWsiHash(state: WsiHashState): string {
    const slide = `wsi:slide=${encodeURIComponent(state.slideId)}`;
    if (!hasWsiHashViewport(state)) {
        return slide;
    }
    return `${slide}&x=${Math.round(state.x)}&y=${Math.round(
        state.y
    )}&z=${state.z.toFixed(6)}`;
}

/** Slide and viewport shown by an OpenSeadragon viewer, in image pixels. */
export function buildWsiViewState({
    selectedSlideId,
    osdViewer,
}: {
    selectedSlideId?: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    osdViewer: any;
}): WsiHashState | null {
    if (
        typeof window === 'undefined' ||
        !osdViewer?.viewport ||
        !selectedSlideId
    ) {
        return null;
    }

    try {
        const viewport = osdViewer.viewport;
        const center = viewport.viewportToImageCoordinates(
            viewport.getCenter()
        );
        return {
            slideId: selectedSlideId,
            x: center.x,
            y: center.y,
            z: viewport.getZoom(),
        };
    } catch (_) {
        return null;
    }
}

export function buildWsiHash(args: {
    selectedSlideId?: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    osdViewer: any;
}): string | null {
    const state = buildWsiViewState(args);
    return state ? formatWsiHash(state) : null;
}

export function writeWsiHashToCurrentUrl(hash: string): string {
    const nextHash = hash.startsWith('#') ? hash : `#${hash}`;
    if (window.location.hash === nextHash) {
        return window.location.href;
    }

    const url = new URL(window.location.href);
    url.hash = hash;
    const href = url.toString();
    window.history.replaceState(null, '', href);
    return href;
}

/**
 * Stores a slide selection. The stored viewport is kept when it belongs to
 * another slide, and nothing is written when the slide is already selected.
 */
export function writeSelectedSlideState(
    urlState: WsiUrlStateAdapter,
    selectedSlideId: string
): string {
    const existing = urlState.read();
    if (existing && existing.slideId === selectedSlideId) {
        return urlState.currentUrl();
    }

    if (hasWsiHashViewport(existing)) {
        return urlState.write({ ...existing, slideId: selectedSlideId });
    }

    return urlState.write({ slideId: selectedSlideId });
}

export function writeSelectedSlideHashToCurrentUrl(
    selectedSlideId: string
): string {
    return writeSelectedSlideState(hashUrlState, selectedSlideId);
}

export function clearWsiHashFromCurrentUrl(): void {
    if (
        typeof window === 'undefined' ||
        !window.location.hash.startsWith('#wsi:')
    ) {
        return;
    }

    const url = new URL(window.location.href);
    url.hash = '';
    window.history.replaceState(null, '', url.toString());
}

export function scheduleHashStateWrite({
    timer,
    selectedSlideId,
    osdViewer,
    urlState = hashUrlState,
}: {
    timer: ReturnType<typeof setTimeout> | null;
    selectedSlideId?: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    osdViewer: any;
    urlState?: WsiUrlStateAdapter;
}): ReturnType<typeof setTimeout> {
    if (timer !== null) {
        clearTimeout(timer);
    }
    return setTimeout(() => {
        const state = buildWsiViewState({
            selectedSlideId,
            osdViewer,
        });
        if (state) {
            urlState.write(state);
        }
    }, 80);
}

export function readWsiHashState(): WsiHashState | null {
    if (typeof window === 'undefined') return null;
    const hash = window.location.hash;
    const prefix = '#wsi:';
    if (!hash.startsWith(prefix)) return null;
    try {
        const params = new URLSearchParams(hash.slice(prefix.length));
        const slideId = params.get('slide') ?? '';
        if (!slideId) return null;
        if (!params.has('x') && !params.has('y') && !params.has('z')) {
            return { slideId };
        }
        const x = parseFloat(params.get('x') ?? 'NaN');
        const y = parseFloat(params.get('y') ?? 'NaN');
        const z = parseFloat(params.get('z') ?? 'NaN');
        // A partial or malformed viewport is rejected rather than guessed.
        if (!isFinite(x) || !isFinite(y) || !isFinite(z)) {
            return null;
        }
        return { slideId, x, y, z };
    } catch (_) {
        return null;
    }
}

/** Keeps the view state in the `#wsi:` hash of the current URL. */
export const hashUrlState: WsiUrlStateAdapter = {
    read: readWsiHashState,
    write: state => writeWsiHashToCurrentUrl(formatWsiHash(state)),
    clear: clearWsiHashFromCurrentUrl,
    currentUrl: () => window.location.href,
    subscribe(listener) {
        window.addEventListener('hashchange', listener);
        return () => window.removeEventListener('hashchange', listener);
    },
};

export function clampImageCoordinates(
    xText: string,
    yText: string,
    dimensions?: TileMetadata['dimensions']
): { x: number; y: number } | null {
    let x = parseInt(xText, 10);
    let y = parseInt(yText, 10);
    if (!isFinite(x) || !isFinite(y)) return null;
    if (dimensions) {
        x = Math.max(0, Math.min(x, dimensions.width - 1));
        y = Math.max(0, Math.min(y, dimensions.height - 1));
    }
    return { x, y };
}

export function buildWsiDownloadFilename({
    patientId,
    slideId,
    x,
    y,
}: {
    patientId?: string | null;
    slideId?: string | number | null;
    x: number;
    y: number;
}): string {
    return `wsi-${patientId ?? 'patient'}-${slideId ??
        'slide'}-x${x}-y${y}.jpg`;
}

export function downloadCanvasAsJpeg(
    canvas: HTMLCanvasElement,
    filename: string
): void {
    canvas.toBlob(
        blob => {
            if (!blob) return;
            const url = URL.createObjectURL(blob);
            const anchor = document.createElement('a');
            anchor.href = url;
            anchor.download = filename;
            document.body.appendChild(anchor);
            anchor.click();
            document.body.removeChild(anchor);
            URL.revokeObjectURL(url);
        },
        'image/jpeg',
        0.92
    );
}

export async function copyCurrentUrlToClipboard(
    url = window.location.href
): Promise<void> {
    try {
        await navigator.clipboard.writeText(url);
    } catch (_) {
        const textarea = document.createElement('textarea');
        textarea.value = url;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
    }
}
