import { preloadOpenSeadragon } from './wsiOpenSeadragonLoader';
import { ensureWsiPreconnect } from './wsiNetworkWarmup';
import { fetchPatientHierarchyReadOnly } from './wsiHierarchyFetchCache';
import { preloadSlideMetadata } from './wsiMetadataFetchCache';
import { chooseInitialServableSlide } from './wsiInitialSlideUtils';
import { getServableSlideEntriesForHierarchy } from './wsiSlideUtils';

export interface WsiViewerWarmupOptions {
    tileServerUrl: string;
    hierarchyUrl: string;
    allowedSampleIds?: string[];
    preferredSampleId?: string;
    preferredSlideId?: string;
    stainFilter: 'all' | 'hne' | 'ihc';
}

export async function warmInitialWsiSlide({
    tileServerUrl,
    hierarchyUrl,
    allowedSampleIds,
    preferredSampleId,
    preferredSlideId,
    stainFilter,
}: WsiViewerWarmupOptions): Promise<void> {
    ensureWsiPreconnect(tileServerUrl);
    preloadOpenSeadragon();

    const hierarchy = await fetchPatientHierarchyReadOnly(hierarchyUrl);
    const samples = allowedSampleIds?.length
        ? (() => {
              const allowed = new Set(allowedSampleIds);
            return hierarchy.samples.filter(sample =>
                allowed.has(sample.sample_id)
            );
          })()
        : hierarchy.samples;

    const allSlides = getServableSlideEntriesForHierarchy({
        patient_id: hierarchy.patient_id,
        samples,
    });
    const first = chooseInitialServableSlide(allSlides, {
        preferredSampleId,
        preferredSlideId,
        stainFilter,
    });

    if (!first?.slide.image_id) {
        return;
    }

    await preloadSlideMetadata(tileServerUrl, first.slide.image_id);
}
