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
        openSeadragonPromise = import(
            /* webpackChunkName: "wsi-openseadragon" */ 'openseadragon'
        ).then(normalizeOpenSeadragonModule);
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
