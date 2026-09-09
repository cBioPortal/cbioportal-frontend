import html2canvas from 'html2canvas';

// Anthropic recommends keeping the longest side under ~1568px to balance
// readability vs. token cost. ~1024 is plenty for an oncoprint at this scale.
const MAX_LONG_SIDE = 1024;

// Track in-flight host-page network requests so we can defer the screenshot
// until cBioPortal is quiescent. Patches fetch + XHR exactly once.
const PATCH_FLAG = '__chatSidebarNetIdlePatched';
let inflight = 0;
let lastChangeAt = Date.now();

function bump() {
    inflight++;
    lastChangeAt = Date.now();
}
function drop() {
    inflight = Math.max(0, inflight - 1);
    lastChangeAt = Date.now();
}

// The iframe's own window/fetch is separate, so this patch never sees its
// requests anyway; isOurRequest only guards the host page's own chat calls.
function isOurRequest(url: string): boolean {
    return url.includes('/api/chat/');
}

(function installNetworkPatch() {
    const w = window as any;
    if (typeof window === 'undefined' || w[PATCH_FLAG]) return;
    w[PATCH_FLAG] = true;

    const origFetch = window.fetch;
    window.fetch = function patchedFetch(input: any, init?: any) {
        const url =
            typeof input === 'string'
                ? input
                : input instanceof URL
                ? input.toString()
                : (input as Request).url;
        const tracked = !isOurRequest(url);
        if (tracked) bump();
        return origFetch.call(this, input, init).finally(() => {
            if (tracked) drop();
        });
    } as typeof fetch;

    const origOpen = XMLHttpRequest.prototype.open;
    const origSend = XMLHttpRequest.prototype.send;
    XMLHttpRequest.prototype.open = function(
        method: string,
        url: string | URL,
        ...rest: any[]
    ) {
        (this as any).__chatSidebarUrl = String(url);
        return (origOpen as any).apply(this, [method, url, ...rest]);
    } as any;
    XMLHttpRequest.prototype.send = function(body?: any) {
        const url = (this as any).__chatSidebarUrl || '';
        const tracked = !isOurRequest(url);
        if (tracked) {
            bump();
            this.addEventListener('loadend', drop, { once: true });
        }
        return origSend.call(this, body);
    } as any;
})();

// Resolves once there's been no in-flight cBioPortal request for `idleMs`ms;
// falls through on timeout so a stuck connection can't block the screenshot.
export async function waitForNetworkIdle(
    idleMs = 1000,
    timeoutMs = 20000
): Promise<void> {
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
        if (inflight === 0 && Date.now() - lastChangeAt >= idleMs) return;
        await new Promise(r => setTimeout(r, 100));
    }
}

// DOM-based readiness check, complementing waitForNetworkIdle for renders
// that land after data arrives but before paint settles.
export async function waitForViewReady(timeoutMs = 8000): Promise<void> {
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
        const indicators = document.querySelectorAll(
            '[data-test="LoadingIndicator"]'
        );
        const anyVisible = Array.from(indicators).some(el => {
            const node = el as HTMLElement;
            if (node.offsetParent === null) return false;
            const rect = node.getBoundingClientRect();
            return rect.width > 0 && rect.height > 0;
        });
        if (!anyVisible) {
            await new Promise(r => setTimeout(r, 200));
            return;
        }
        await new Promise(r => setTimeout(r, 150));
    }
}

// oncoprint's WebGL canvas lacks preserveDrawingBuffer, so html2canvas reads
// it black; toCanvas() (same as "Download PNG") re-renders it from SVG.
// It rasterizes the whole model though, so this crops to the visible slice
// via cell_view.visible_area_width/getHorzScroll()/maxOncoprintScrollLeft() —
// the same coordinate space toCanvas() renders from, no conversion needed.
async function rasterizeOncoprint(): Promise<string | null> {
    const onco = (window as any).donk?.oncoprintJs;
    if (!onco || typeof onco.toCanvas !== 'function') return null;
    return new Promise(resolve => {
        try {
            onco.toCanvas((fullCanvas: HTMLCanvasElement) => {
                try {
                    const cellView = onco.cell_view;
                    const visibleWidth: number = cellView.visible_area_width;
                    const horzScroll: number = onco.model.getHorzScroll();
                    const maxScroll: number = onco.maxOncoprintScrollLeft();
                    const cellAreaX =
                        fullCanvas.width - (visibleWidth + maxScroll);

                    const out = document.createElement('canvas');
                    out.width = Math.round(cellAreaX + visibleWidth);
                    out.height = fullCanvas.height;
                    const ctx = out.getContext('2d');
                    if (!ctx) {
                        resolve(fullCanvas.toDataURL('image/png'));
                        return;
                    }
                    ctx.drawImage(
                        fullCanvas,
                        0,
                        0,
                        cellAreaX,
                        fullCanvas.height,
                        0,
                        0,
                        cellAreaX,
                        fullCanvas.height
                    );
                    ctx.drawImage(
                        fullCanvas,
                        cellAreaX + horzScroll,
                        0,
                        visibleWidth,
                        fullCanvas.height,
                        cellAreaX,
                        0,
                        visibleWidth,
                        fullCanvas.height
                    );
                    resolve(out.toDataURL('image/png'));
                } catch (err) {
                    console.warn(
                        'chat-sidebar oncoprint rasterize failed:',
                        err
                    );
                    resolve(null);
                }
            }, 1);
        } catch (err) {
            console.warn('chat-sidebar oncoprint toCanvas failed:', err);
            resolve(null);
        }
    });
}

export async function captureViewport(): Promise<string | null> {
    try {
        const sidebar = document.querySelector(
            '.chat-sidebar-panel'
        ) as HTMLElement | null;
        const launcher = document.querySelector(
            '.chat-sidebar-launcher'
        ) as HTMLElement | null;
        const oncoprintPng = await rasterizeOncoprint();
        const liveOnco = document.querySelector(
            '.oncoprintContainer'
        ) as HTMLElement | null;
        const oncoSize = liveOnco
            ? { w: liveOnco.offsetWidth, h: liveOnco.offsetHeight }
            : null;
        const canvas = await html2canvas(document.body, {
            x: window.scrollX,
            y: window.scrollY,
            width: window.innerWidth,
            height: window.innerHeight,
            scale: 1,
            useCORS: true,
            logging: false,
            // Excludes the sidebar's own UI so the model isn't looking at itself.
            ignoreElements: el => el === sidebar || el === launcher,
            onclone: doc => {
                if (!oncoprintPng || !oncoSize) return;
                const clonedOnco = doc.querySelector(
                    '.oncoprintContainer'
                ) as HTMLElement | null;
                if (!clonedOnco) return;
                const img = doc.createElement('img');
                img.src = oncoprintPng;
                img.style.width = oncoSize.w + 'px';
                img.style.height = oncoSize.h + 'px';
                img.style.display = 'block';
                img.style.objectFit = 'contain';
                clonedOnco.innerHTML = '';
                clonedOnco.appendChild(img);
            },
        });
        return downscaleToPng(canvas, MAX_LONG_SIDE);
    } catch (err) {
        console.warn('chat-sidebar screenshot failed:', err);
        return null;
    }
}

function downscaleToPng(canvas: HTMLCanvasElement, maxSide: number): string {
    const longSide = Math.max(canvas.width, canvas.height);
    if (longSide <= maxSide) return canvas.toDataURL('image/png');
    const scale = maxSide / longSide;
    const out = document.createElement('canvas');
    out.width = Math.round(canvas.width * scale);
    out.height = Math.round(canvas.height * scale);
    const ctx = out.getContext('2d');
    if (!ctx) return canvas.toDataURL('image/png');
    ctx.drawImage(canvas, 0, 0, out.width, out.height);
    return out.toDataURL('image/png');
}
