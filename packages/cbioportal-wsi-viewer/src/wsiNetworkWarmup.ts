export function ensureWsiPreconnect(url: string) {
    if (typeof document === 'undefined') {
        return;
    }

    let origin: string;
    try {
        origin = new URL(url, window.location.href).origin;
    } catch {
        return;
    }

    if (!origin) {
        return;
    }

    const selector = `link[data-wsi-preconnect="${origin}"]`;
    if (document.head.querySelector(selector)) {
        return;
    }

    const preconnect = document.createElement('link');
    preconnect.rel = 'preconnect';
    preconnect.href = origin;
    preconnect.crossOrigin = 'anonymous';
    preconnect.setAttribute('data-wsi-preconnect', origin);
    document.head.appendChild(preconnect);
}
