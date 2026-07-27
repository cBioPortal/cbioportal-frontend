import { preloadOpenSeadragon } from './wsiOpenSeadragonLoader';
import { ensureWsiPreconnect } from './wsiNetworkWarmup';
import { preloadSlideMetadata } from './wsiMetadataFetchCache';
import {
    chooseInitialMatchingServableSlide,
    chooseInitialServableSlide,
} from './wsiInitialSlideUtils';
import { fetchPatientHierarchyWithBootstrap } from './wsiBootstrapFetch';
import {
    getServableSlideEntriesForHierarchyReadOnly,
    getServableSlideIdsForPathologyFilterReadOnly,
} from './wsiSlideUtils';
import { PathologySlideFilter, PatientHierarchy } from './wsiViewerTypes';

export interface WsiViewerWarmupOptions {
    tileServerUrl: string;
    hierarchyUrl: string;
    fallbackHierarchyUrl?: string;
    studyId?: string;
    preferredSampleId?: string;
    preferredSlideId?: string;
    stainFilter: 'all' | 'hne' | 'ihc';
    pathologyFilter?: PathologySlideFilter;
}

export async function primeInitialWsiHierarchy({
    tileServerUrl,
    hierarchyUrl,
    fallbackHierarchyUrl,
}: Pick<
    WsiViewerWarmupOptions,
    'tileServerUrl' | 'hierarchyUrl' | 'fallbackHierarchyUrl'
>): Promise<PatientHierarchy> {
    const result = await fetchPatientHierarchyWithBootstrap({
        hierarchyUrl,
        fallbackHierarchyUrl,
        tileServerBase: tileServerUrl,
    });
    return result.hierarchy;
}

export async function warmInitialWsiSlide({
    tileServerUrl,
    hierarchyUrl,
    fallbackHierarchyUrl,
    studyId,
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
        fallbackHierarchyUrl,
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

    if (studyId) {
        await preloadSlideMetadata(
            tileServerUrl,
            first.slide.image_id,
            studyId
        );
    } else {
        await preloadSlideMetadata(tileServerUrl, first.slide.image_id);
    }
}
