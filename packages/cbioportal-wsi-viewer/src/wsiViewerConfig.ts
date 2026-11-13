/**
 * Host services shared by every viewer on the page. Hosts install them once,
 * at startup, with `configureWsiViewerRuntime`.
 */
export interface WsiViewerConfig {
    /**
     * Resolves a portal API path such as `api/resource-table/query/fetch` to the
     * URL to request, including any deployment context path.
     */
    buildApiUrl: (path: string) => string;
    /**
     * Resolves a portal page path such as `patient` and its query to a link,
     * including any deployment context path; root-relative when unset.
     */
    buildPageUrl?: (path: string, query: Record<string, string>) => string;
    /** OpenSeadragon `prefixUrl`; OpenSeadragon's own default when unset. */
    osdPrefixUrl?: string;
    /**
     * Fetch used for hierarchy and thumbnail requests; the
     * global `fetch` when unset. OpenSeadragon loads tiles itself.
     */
    fetchImpl?: typeof fetch;
    /**
     * Called when a viewer request is refused with 401: the portal session
     * that authorizes slides has ended. Hosts send the page through sign-in,
     * as they do for their own API calls; without it the viewer shows an
     * error that asks for a page reload.
     */
    onSessionExpired?: () => void;
}

/** Services read by the viewer's module-level caches and controller. */
export interface WsiViewerRuntime {
    buildApiUrl: (path: string) => string;
    buildPageUrl: (path: string, query: Record<string, string>) => string;
    fetchImpl: typeof fetch;
    osdPrefixUrl?: string;
    onSessionExpired?: () => void;
}

// Resolves the global at call time so a replaced `window.fetch` is used.
const globalFetch: typeof fetch = (...args: Parameters<typeof fetch>) =>
    fetch(...args);

function rootRelativePageUrl(
    path: string,
    query: Record<string, string>
): string {
    const search = Object.keys(query)
        .map(
            key =>
                `${encodeURIComponent(key)}=${encodeURIComponent(query[key])}`
        )
        .join('&');
    return `/${path}${search ? `?${search}` : ''}`;
}

const DEFAULT_RUNTIME: WsiViewerRuntime = {
    buildApiUrl: () => {
        throw new Error(
            'WSI viewer is not configured: call configureWsiViewerRuntime at startup'
        );
    },
    buildPageUrl: rootRelativePageUrl,
    fetchImpl: globalFetch,
};

let runtime: WsiViewerRuntime = DEFAULT_RUNTIME;

/** Installs the host services. Call once, before any viewer renders. */
export function configureWsiViewerRuntime(config: WsiViewerConfig): void {
    const baseFetch = config.fetchImpl ?? globalFetch;
    const onSessionExpired = config.onSessionExpired;
    runtime = {
        buildApiUrl: config.buildApiUrl,
        buildPageUrl: config.buildPageUrl ?? rootRelativePageUrl,
        fetchImpl: onSessionExpired
            ? async (...args: Parameters<typeof fetch>) => {
                  const response = await baseFetch(...args);
                  if (response.status === 401) onSessionExpired();
                  return response;
              }
            : baseFetch,
        osdPrefixUrl: config.osdPrefixUrl,
        onSessionExpired,
    };
}

export function getWsiViewerRuntime(): Readonly<WsiViewerRuntime> {
    return runtime;
}

export function resetWsiViewerRuntime(): void {
    runtime = DEFAULT_RUNTIME;
}
