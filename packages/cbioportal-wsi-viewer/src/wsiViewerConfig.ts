import { ICivicVariantIndex, ICivicVariantSummary } from 'cbioportal-utils';
import { OncoKbAPI } from 'oncokb-ts-api-client';

/** The OncoKB annotation endpoints the viewer calls. */
export type WsiOncoKbClient = Pick<
    OncoKbAPI,
    | 'annotateMutationsByProteinChangePostUsingPOST_1'
    | 'annotateCopyNumberAlterationsPostUsingPOST_1'
    | 'annotateStructuralVariantsPostUsingPOST_1'
>;

/**
 * Host services for the molecular tables' OncoKB and CIViC annotations and
 * mutation type colors. Without them, the tables show the portal's sample
 * molecular data unannotated.
 */
export interface WsiMolecularServices {
    /** Annotate variants with OncoKB. */
    showOncoKb: boolean;
    /** Annotate variants with CIViC. */
    showCivic: boolean;
    /**
     * OncoKB API URL, also the namespace of the viewer's annotation caches.
     * An empty URL disables OncoKB annotations.
     */
    getOncoKbApiUrl: () => string;
    /**
     * OncoKB client for that URL. Annotations are optional, so failures
     * should not reach the host's global error reporting.
     */
    getOncoKbClient: () => WsiOncoKbClient;
    /** CIViC variants of one gene for a copy number alteration (2 or -2). */
    getCivicCnaVariants: (
        alteration: number,
        geneSymbol: string,
        civicVariants: ICivicVariantIndex
    ) => { [name: string]: ICivicVariantSummary };
    /** Simplified mutation type (`missense`, `frameshift`, ...). */
    getSimplifiedMutationType: (mutationType: string) => string;
}

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
     * Molecular annotation services. Portal molecular data is fetched
     * through `buildApiUrl` and `fetchImpl` either way.
     */
    molecular?: WsiMolecularServices;
}

/** Services read by the viewer's module-level caches and controller. */
export interface WsiViewerRuntime {
    buildApiUrl: (path: string) => string;
    buildPageUrl: (path: string, query: Record<string, string>) => string;
    fetchImpl: typeof fetch;
    osdPrefixUrl?: string;
    molecular?: WsiMolecularServices;
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
    runtime = {
        buildApiUrl: config.buildApiUrl,
        buildPageUrl: config.buildPageUrl ?? rootRelativePageUrl,
        fetchImpl: config.fetchImpl ?? globalFetch,
        osdPrefixUrl: config.osdPrefixUrl,
        molecular: config.molecular,
    };
}

export function getWsiViewerRuntime(): Readonly<WsiViewerRuntime> {
    return runtime;
}

export function resetWsiViewerRuntime(): void {
    runtime = DEFAULT_RUNTIME;
}
