import { ICivicVariantIndex, ICivicVariantSummary } from 'cbioportal-utils';
import { getWsiViewerRuntime, WsiOncoKbClient } from './wsiViewerConfig';
import { WsiHotspotFlags, WsiHotspotQuery } from './wsiViewerTypes';

// Accessors for the host's molecular annotation services, with the
// behaviour of a host that provides none.

/** OncoKB annotations are on: the host enables them and has an API URL. */
export function isWsiOncoKbEnabled(): boolean {
    const molecular = getWsiViewerRuntime().molecular;
    return (
        !!molecular && molecular.showOncoKb() && !!molecular.getOncoKbApiUrl()
    );
}

/** Cancer Hotspots flags are on: the host enables them and can look them up. */
export function isWsiHotspotEnabled(): boolean {
    const molecular = getWsiViewerRuntime().molecular;
    return !!molecular?.getHotspots && !!molecular.showHotspots?.();
}

/** The mutations' Cancer Hotspots flags from the host; none without a lookup. */
export function fetchWsiHotspots(
    mutations: ReadonlyArray<WsiHotspotQuery>,
    referenceGenome: string | null
): Promise<WsiHotspotFlags[]> {
    const getHotspots = getWsiViewerRuntime().molecular?.getHotspots;
    return getHotspots
        ? getHotspots(mutations, referenceGenome)
        : Promise.resolve(
              mutations.map(() => ({ recurrent: false, threeD: false }))
          );
}

export function isWsiCivicEnabled(): boolean {
    return !!getWsiViewerRuntime().molecular?.showCivic();
}

/** The configured OncoKB API URL; empty when OncoKB is unavailable. */
export function getOncoKbApiUrl(): string {
    return getWsiViewerRuntime().molecular?.getOncoKbApiUrl() ?? '';
}

export function getWsiOncoKbClient(): WsiOncoKbClient {
    const molecular = getWsiViewerRuntime().molecular;
    if (!molecular) {
        throw new Error('WSI viewer OncoKB client is not configured');
    }
    return molecular.getOncoKbClient();
}

export function getCivicCnaVariants(
    alteration: number,
    geneSymbol: string,
    civicVariants: ICivicVariantIndex
): { [name: string]: ICivicVariantSummary } {
    return (
        getWsiViewerRuntime().molecular?.getCivicCnaVariants(
            alteration,
            geneSymbol,
            civicVariants
        ) ?? {}
    );
}

export function getSimplifiedMutationType(mutationType: string): string {
    const molecular = getWsiViewerRuntime().molecular;
    return molecular
        ? molecular.getSimplifiedMutationType(mutationType)
        : (mutationType || '').toLowerCase();
}
