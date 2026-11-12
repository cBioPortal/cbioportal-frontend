import { ICivicVariantIndex, ICivicVariantSummary } from 'cbioportal-utils';
import { getWsiViewerRuntime, WsiOncoKbClient } from './wsiViewerConfig';

// Accessors for the host's molecular annotation services, with the
// behaviour of a host that provides none.

export function isWsiOncoKbEnabled(): boolean {
    return !!getWsiViewerRuntime().molecular?.showOncoKb;
}

export function isWsiCivicEnabled(): boolean {
    return !!getWsiViewerRuntime().molecular?.showCivic;
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
