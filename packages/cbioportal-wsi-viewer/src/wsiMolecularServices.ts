import { getWsiViewerRuntime } from './wsiViewerConfig';

// Accessors for the host's molecular services, with the behaviour of a host
// that provides none.

export function getSimplifiedMutationType(mutationType: string): string {
    const molecular = getWsiViewerRuntime().molecular;
    return molecular
        ? molecular.getSimplifiedMutationType(mutationType)
        : (mutationType || '').toLowerCase();
}
