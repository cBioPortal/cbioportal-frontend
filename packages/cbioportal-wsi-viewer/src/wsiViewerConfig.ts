/**
 * Host services shared by every viewer on the page. Hosts install them once,
 * at startup, with `configureWsiViewerRuntime`.
 */
export interface WsiViewerConfig {
    /**
     * Resolves a portal API path such as `api/wsi/v2/hierarchy/...` to the
     * URL to request, including any deployment context path.
     */
    buildApiUrl: (path: string) => string;
    /** OpenSeadragon `prefixUrl`; OpenSeadragon's own default when unset. */
    osdPrefixUrl?: string;
    /**
     * Fetch used for hierarchy, slide access and thumbnail requests; the
     * global `fetch` when unset. OpenSeadragon loads tiles itself.
     */
    fetchImpl?: typeof fetch;
}

/** Services read by the viewer's module-level caches and controller. */
export interface WsiViewerRuntime {
    buildApiUrl: (path: string) => string;
    fetchImpl: typeof fetch;
    osdPrefixUrl?: string;
}

// Resolves the global at call time so a replaced `window.fetch` is used.
const globalFetch: typeof fetch = (...args: Parameters<typeof fetch>) =>
    fetch(...args);

const DEFAULT_RUNTIME: WsiViewerRuntime = {
    buildApiUrl: () => {
        throw new Error(
            'WSI viewer is not configured: call configureWsiViewerRuntime at startup'
        );
    },
    fetchImpl: globalFetch,
};

let runtime: WsiViewerRuntime = DEFAULT_RUNTIME;

/** Installs the host services. Call once, before any viewer renders. */
export function configureWsiViewerRuntime(config: WsiViewerConfig): void {
    runtime = {
        buildApiUrl: config.buildApiUrl,
        fetchImpl: config.fetchImpl ?? globalFetch,
        osdPrefixUrl: config.osdPrefixUrl,
    };
}

export function getWsiViewerRuntime(): Readonly<WsiViewerRuntime> {
    return runtime;
}

export function resetWsiViewerRuntime(): void {
    runtime = DEFAULT_RUNTIME;
}
