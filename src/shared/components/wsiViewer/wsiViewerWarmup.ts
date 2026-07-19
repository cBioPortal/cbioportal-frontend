import { preloadOpenSeadragon } from './wsiOpenSeadragonLoader';
import { ensureWsiPreconnect } from './wsiNetworkWarmup';
import {
    fetchPatientHierarchyReadOnly,
    hasCachedPatientHierarchy,
    preloadPatientHierarchy,
} from './wsiHierarchyFetchCache';
import { preloadSlideMetadata } from './wsiMetadataFetchCache';
import {
    chooseInitialMatchingServableSlide,
    chooseInitialServableSlide,
} from './wsiInitialSlideUtils';
import {
    fetchPatientBootstrapReadOnly,
    hydratePatientBootstrapCaches,
    isWsiBootstrapEnabled,
} from './wsiBootstrapFetch';
import {
    getServableSlideEntriesForHierarchyReadOnly,
    getServableSlideIdsForPathologyFilterReadOnly,
} from './wsiSlideUtils';
import { PathologySlideFilter, PatientHierarchy } from './wsiViewerTypes';

export interface WsiViewerWarmupOptions {
    tileServerUrl: string;
    hierarchyUrl: string;
    preferredSampleId?: string;
    preferredSlideId?: string;
    stainFilter: 'all' | 'hne' | 'ihc';
    pathologyFilter?: PathologySlideFilter;
}

export async function primeInitialWsiHierarchy({
    tileServerUrl,
    hierarchyUrl,
}: Pick<
    WsiViewerWarmupOptions,
    'tileServerUrl' | 'hierarchyUrl'
>): Promise<PatientHierarchy> {
    if (isWsiBootstrapEnabled() && !hasCachedPatientHierarchy(hierarchyUrl)) {
        try {
            const payload = await fetchPatientBootstrapReadOnly({
                hierarchyUrl,
            });
            hydratePatientBootstrapCaches(
                hierarchyUrl,
                tileServerUrl,
                payload
            );
            return payload.hierarchy;
        } catch {
            return preloadPatientHierarchy(hierarchyUrl);
        }
    }

    return preloadPatientHierarchy(hierarchyUrl);
}

export async function warmInitialWsiSlide({
    tileServerUrl,
    hierarchyUrl,
    preferredSampleId,
    preferredSlideId,
    stainFilter,
    pathologyFilter,
}: WsiViewerWarmupOptions): Promise<void> {
    ensureWsiPreconnect(tileServerUrl);
    preloadOpenSeadragon();

    const hierarchy = await primeInitialWsiHierarchy({
        tileServerUrl,
        hierarchyUrl,
    });
    const preferredImageIds = pathologyFilter
        ? getServableSlideIdsForPathologyFilterReadOnly(
              hierarchy,
              pathologyFilter
          )
        : undefined;

    const allSlides = getServableSlideEntriesForHierarchyReadOnly(hierarchy);
    const first = preferredImageIds
        ? chooseInitialMatchingServableSlide(allSlides, {
              preferredSampleId,
              preferredSlideId,
              stainFilter,
              matchesEntry: entry =>
                  preferredImageIds.has(entry.slide.image_id),
          })
        : chooseInitialServableSlide(allSlides, {
              preferredSampleId,
              preferredSlideId,
              stainFilter,
          });

    if (!first?.slide.image_id) {
        return;
    }

    await preloadSlideMetadata(tileServerUrl, first.slide.image_id);
}
