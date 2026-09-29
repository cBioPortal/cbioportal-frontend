import * as React from 'react';
import { hashUrlState, WsiUrlStateAdapter } from './wsiViewStateUtils';

/** Host services and settings the viewer needs. */
export interface WsiViewerConfig {
    /**
     * Resolves a portal API path such as `api/wsi/v2/hierarchy/...` to the
     * URL to request, including any deployment context path.
     */
    buildApiUrl: (path: string) => string;
    /**
     * The portal authenticates users. Protected hierarchy and metadata
     * responses are then never kept in sessionStorage.
     */
    authEnabled: boolean;
    /** Subject that isolates protected in-memory caches (the user name). */
    authScope: string;
    /** Shows the "download view" control. */
    showDownload: boolean;
    /** OpenSeadragon `prefixUrl`; OpenSeadragon's own default when unset. */
    osdPrefixUrl?: string;
    /** Indicator shown while the hierarchy loads; a plain spinner when unset. */
    renderLoading?: () => React.ReactNode;
    /** Slide and viewport link state; the `#wsi:` URL hash when unset. */
    urlState?: WsiUrlStateAdapter;
    /**
     * Fetch used for hierarchy, slide access and thumbnail requests; the
     * global `fetch` when unset. OpenSeadragon loads tiles itself.
     */
    fetchImpl?: typeof fetch;
}

/** Services read by the viewer's module-level caches and controller. */
export interface WsiViewerRuntime {
    buildApiUrl: (path: string) => string;
    authEnabled: boolean;
    fetchImpl: typeof fetch;
    osdPrefixUrl?: string;
    urlState: WsiUrlStateAdapter;
}

// Resolves the global at call time so a replaced `window.fetch` is used.
const globalFetch: typeof fetch = (...args: Parameters<typeof fetch>) =>
    fetch(...args);

const DEFAULT_RUNTIME: WsiViewerRuntime = {
    buildApiUrl: () => {
        throw new Error('WSI viewer API URLs are not configured');
    },
    authEnabled: false,
    fetchImpl: globalFetch,
    urlState: hashUrlState,
};

let runtime: WsiViewerRuntime = DEFAULT_RUNTIME;

/**
 * Installs the services of a mounted viewer. The caches behind them are
 * shared by every viewer on the page, so the last configured viewer's
 * services apply to all of them.
 */
export function configureWsiViewerRuntime(config: WsiViewerConfig): void {
    runtime = {
        buildApiUrl: config.buildApiUrl,
        authEnabled: config.authEnabled,
        fetchImpl: config.fetchImpl ?? globalFetch,
        osdPrefixUrl: config.osdPrefixUrl,
        urlState: config.urlState ?? hashUrlState,
    };
}

export function getWsiViewerRuntime(): Readonly<WsiViewerRuntime> {
    return runtime;
}

export function resetWsiViewerRuntime(): void {
    runtime = DEFAULT_RUNTIME;
}
