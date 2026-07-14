import OpenSeadragonModule from 'openseadragon';

// OpenSeadragon ships as a CommonJS bundle. Normalize it once and return a
// cached Promise so the viewer code can keep the same async interface.
let openSeadragonPromise: Promise<typeof import('openseadragon')> | null = null;

function normalizeOpenSeadragonModule(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mod: any
): typeof import('openseadragon') {
    return ((mod as any).default ?? mod) as typeof import('openseadragon');
}

export function loadOpenSeadragon(): Promise<typeof import('openseadragon')> {
    if (!openSeadragonPromise) {
        openSeadragonPromise = Promise.resolve(
            normalizeOpenSeadragonModule(OpenSeadragonModule)
        );
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
