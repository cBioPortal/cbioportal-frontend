let openSeadragonPromise: Promise<typeof import('openseadragon')> | null = null;

function normalizeOpenSeadragonModule(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mod: any
): typeof import('openseadragon') {
    return ((mod as any).default ?? mod) as typeof import('openseadragon');
}

export function loadOpenSeadragon(): Promise<typeof import('openseadragon')> {
    if (!openSeadragonPromise) {
        // Rspack handles this import as an async chunk; the project TypeScript
        // target predates the dynamic import syntax.
        // @ts-ignore
        const loadPromise = import(
            /* webpackChunkName: "wsi-openseadragon" */ 'openseadragon'
        ).then(normalizeOpenSeadragonModule);
        openSeadragonPromise = loadPromise.catch(error => {
            // A failed chunk can be transient. Do not cache the rejection:
            // the viewer's Retry action must be able to request it again.
            openSeadragonPromise = null;
            throw error;
        });
    }

    return openSeadragonPromise;
}

export function preloadOpenSeadragon() {
    void loadOpenSeadragon().catch(() => {
        // Best-effort warmup only; the viewer will surface a real error on use.
    });
}

export function hasPreloadedOpenSeadragon(): boolean {
    return openSeadragonPromise !== null;
}
