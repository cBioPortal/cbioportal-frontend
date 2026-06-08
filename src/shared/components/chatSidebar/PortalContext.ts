// PortalContext — the single capability surface the cBioPortal host page
// exposes to in-page agents (the chat sidebar today; arbitrary MCP clients
// tomorrow). Consolidates logic that used to be scattered across
// ChatSidebar.tsx, AlterationBeacons.tsx, and screenshot.ts behind one typed
// provider, so there is exactly ONE place that knows how to read the portal's
// view, URL, inventory, and pixels — and how to annotate and navigate it.
//
// Framework-neutral: no React, no MobX, no MCP. ChatSidebar wires the concrete
// HostPortalContext from `store.urlWrapper`; the MCP shim (portalMcpServer.ts)
// and the existing sidebar both consume this interface.

import {
    captureViewport,
    waitForNetworkIdle,
    waitForViewReady,
} from './screenshot';
import { scrapeInventory, PageInventory } from './inventory';
import { BeaconEngine, Beacon, AnnotationTarget } from './BeaconEngine';

export { PageInventory, AnnotationTarget };

export interface CurrentView {
    /** Study currently open. `null` when none, or while still resolving. */
    studyId: string | null;
    /** All study ids when a multi-study query is open (grounding disabled then). */
    studyIds: string[];
    /** Queried HUGO gene symbols (oncoprint gene tracks). */
    genes: string[];
    /** Active results-view tab id, e.g. "oncoprint", "survival". */
    tab: string | null;
}

// The results view is entirely URL-driven: ResultsViewPageStore reads every
// piece of state off urlWrapper.query.*, and handleTabChange is just
// urlWrapper.updateURL({}, `results/<tab>`). So we expose the URL itself as the
// navigation primitive instead of a one-off navigateToTab — CurrentView above
// is just a typed projection of this.
export interface PortalLocation {
    href: string;
    /** Path after the origin, e.g. "results/mutations". */
    path: string;
    /** Parsed query params (urlWrapper.query). */
    query: Record<string, string>;
    /** Resolved active tab id. */
    tabId: string | null;
}

// A structured URL patch — mirrors urlWrapper.updateURL(params, path, clear,
// replace). Soft navigation: merges onto the current query, no page reload.
export interface NavigatePatch {
    /** New path segment, e.g. "results/survival". Omit to keep the current tab. */
    path?: string;
    /** Query params to set. `undefined` value clears that param. */
    params?: Record<string, string | undefined>;
    /** Replace the whole query instead of merging (default false). */
    clear?: boolean;
    /** Use history.replace instead of push (default false). */
    replace?: boolean;
}

/** A page annotation = a beacon. Re-exported so callers don't reach into
 *  BeaconEngine for the shape. */
export type Annotation = Beacon;

export interface ScreenshotOptions {
    /** Wait for host-page network idle before capturing (default true). */
    waitForIdle?: boolean;
}

/**
 * The capability surface. Read = resources, act = tools (in MCP terms). Every
 * method is async so a remote MCP client sees a uniform contract even for the
 * synchronous reads.
 */
export interface PortalContext {
    // --- resources (read) ---
    getCurrentView(): Promise<CurrentView>;
    getLocation(): Promise<PortalLocation>;
    getInventory(): Promise<PageInventory>;
    captureViewport(opts?: ScreenshotOptions): Promise<string | null>; // PNG data URL

    // --- tools (act) ---
    annotate(annotations: Annotation[]): Promise<{ placed: number }>;
    clearAnnotations(): Promise<void>;
    /** URL-driven navigation through urlWrapper.updateURL (soft, no reload).
     *  Subsumes tab switching, gene/cohort/threshold changes — anything
     *  URL-encoded. Returns the resulting location. */
    navigate(patch: NavigatePatch): Promise<PortalLocation>;

    // --- change feed ---
    /** Fires whenever the current view changes (study/genes/tab). Returns an
     *  unsubscribe fn. Lets a client invalidate cached context / re-run. */
    onViewChange(cb: (view: CurrentView) => void): () => void;
}

// ---------------------------------------------------------------------------
// ViewSource — the host's thin adapter over the MobX store + ResultsViewURLWrapper.
// ChatSidebar builds one of these from `store.urlWrapper` and its own props,
// keeping PortalContext free of any MobX/React import.
// ---------------------------------------------------------------------------

export interface ViewSource {
    readonly studyIds: string[] | undefined;
    readonly genes: string[] | undefined;
    readonly tab: string | undefined;
    // --- URL surface (urlWrapper) ---
    readonly href: string;
    readonly path: string;
    readonly query: Record<string, string>;
    readonly tabId: string | null;
    /** Forwards straight to ResultsViewURLWrapper.updateURL — the same call
     *  handleTabChange uses, so navigation stays soft and session-prop-aware. */
    updateURL(
        params: Record<string, string | undefined>,
        path: string | undefined,
        clear: boolean,
        replace: boolean
    ): void;
    /** Subscribe to store/URL changes; host passes a mobx-reaction-backed impl.
     *  Returns an unsubscribe fn. */
    subscribe(cb: () => void): () => void;
}

export class HostPortalContext implements PortalContext {
    private beacons = new BeaconEngine();

    constructor(private source: ViewSource) {
        this.beacons.start();
    }

    /** Release the beacon engine's listeners/DOM. Call from componentWillUnmount. */
    dispose() {
        this.beacons.destroy();
    }

    async getCurrentView(): Promise<CurrentView> {
        const ids = this.source.studyIds ?? [];
        return {
            studyId: ids.length === 1 ? ids[0] : null,
            studyIds: ids,
            genes: this.source.genes ?? [],
            tab: this.source.tab ?? null,
        };
    }

    async getLocation(): Promise<PortalLocation> {
        return {
            href: this.source.href,
            path: this.source.path,
            query: this.source.query,
            tabId: this.source.tabId,
        };
    }

    async getInventory(): Promise<PageInventory> {
        // Same settle-then-scrape sequence AlterationBeacons.loadHighlights uses,
        // so the inventory reflects what the user actually sees.
        await waitForNetworkIdle(1000);
        await waitForViewReady();
        return scrapeInventory(this.source.genes ?? []);
    }

    async captureViewport(
        opts: ScreenshotOptions = {}
    ): Promise<string | null> {
        if (opts.waitForIdle !== false) {
            await waitForNetworkIdle(1000);
            await waitForViewReady();
        }
        return captureViewport(); // excludes the sidebar panel itself
    }

    async annotate(annotations: Annotation[]): Promise<{ placed: number }> {
        // Replaces the current beacon set. Placement is async (next rAF), so we
        // report accepted count, not DOM-matched count.
        this.beacons.setBeacons(annotations);
        return { placed: annotations.length };
    }

    async clearAnnotations(): Promise<void> {
        this.beacons.clear();
    }

    async navigate(patch: NavigatePatch): Promise<PortalLocation> {
        // Soft, router-mediated, session-prop-aware — never window.location.
        this.source.updateURL(
            patch.params ?? {},
            patch.path,
            patch.clear ?? false,
            patch.replace ?? false
        );
        return this.getLocation();
    }

    onViewChange(cb: (v: CurrentView) => void): () => void {
        return this.source.subscribe(() => {
            void this.getCurrentView().then(cb);
        });
    }
}
