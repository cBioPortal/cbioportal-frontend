import { TileMetadata } from './wsiViewerTypes';

export type WsiHashState = {
    slideId: string;
    x: number;
    y: number;
    z: number;
};

export function buildWsiHash({
    selectedSlideId,
    osdViewer,
}: {
    selectedSlideId?: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    osdViewer: any;
}): string | null {
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
        const zoom = viewport.getZoom();
        const params = new URLSearchParams({
            slide: selectedSlideId,
            x: Math.round(center.x).toString(),
            y: Math.round(center.y).toString(),
            z: zoom.toFixed(6),
        });
        return `wsi:${params.toString()}`;
    } catch (_) {
        return null;
    }
}

export function writeWsiHashToCurrentUrl(hash: string): string {
    const url = new URL(window.location.href);
    url.hash = hash;
    const href = url.toString();
    window.history.replaceState(null, '', href);
    return href;
}

export function scheduleHashStateWrite({
    timer,
    selectedSlideId,
    osdViewer,
}: {
    timer: ReturnType<typeof setTimeout> | null;
    selectedSlideId?: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    osdViewer: any;
}): ReturnType<typeof setTimeout> {
    if (timer !== null) {
        clearTimeout(timer);
    }
    return setTimeout(() => {
        const hash = buildWsiHash({
            selectedSlideId,
            osdViewer,
        });
        if (hash) {
            writeWsiHashToCurrentUrl(hash);
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
        const x = parseFloat(params.get('x') ?? 'NaN');
        const y = parseFloat(params.get('y') ?? 'NaN');
        const z = parseFloat(params.get('z') ?? 'NaN');
        if (!slideId || !isFinite(x) || !isFinite(y) || !isFinite(z)) {
            return null;
        }
        return { slideId, x, y, z };
    } catch (_) {
        return null;
    }
}

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
    return `wsi-${patientId ?? 'patient'}-${slideId ?? 'slide'}-x${x}-y${y}.jpg`;
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
