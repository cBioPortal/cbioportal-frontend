import * as React from 'react';
import { buildWsiHierarchyApiUrl } from './wsiUrls';
import {
    PathologySlideFilter,
    PathologySlideMatchFilter,
    WsiStainFilter,
    WsiTimepointSelection,
} from './wsiViewerTypes';

export interface WsiPatientViewEntryPointProps {
    patientId: string;
    studyId: string;
    tileServerUrl: string;
    height: number;
    studyName?: string;
    authScope?: string;
    initialStainFilter?: WsiStainFilter;
    initialMatchFilter?: PathologySlideMatchFilter;
    initialTimepointDays?: WsiTimepointSelection;
    onTimepointChange?: (days: WsiTimepointSelection) => void;
    onStainFilterChange?: (filter: WsiStainFilter) => void;
    onMatchFilterChange?: (filter: PathologySlideMatchFilter) => void;
    onClearFilters?: () => void;
    preferredSampleId?: string;
    pathologyFilter?: PathologySlideFilter;
}

// Keep the foundation viewer out of the common patient/study bundle. Most
// patient pages do not contain WSI data, and loading the complete viewer for
// those pages delays unrelated visualizations such as embeddings. The
// standalone WSI route is already lazy; using the same boundary here keeps
// the patient tab from regressing ordinary page startup.
const LazyWSIViewer = React.lazy(() => {
    // The project TypeScript module target predates dynamic import syntax;
    // rspack still emits this as the intended async chunk.
    // @ts-ignore
    return import('./WSIViewer');
});

/**
 * Minimal patient-view entrypoint owned by the viewer foundation. Presentation
 * layers can add their own tabs, filters and linkout handling without changing
 * the hierarchy or serving contract used by the viewer itself.
 */
export default function WsiPatientViewEntryPoint({
    patientId,
    studyId,
    tileServerUrl,
    height,
    studyName,
    authScope,
    initialStainFilter,
    initialMatchFilter,
    initialTimepointDays,
    onTimepointChange,
    onStainFilterChange,
    onMatchFilterChange,
    onClearFilters,
    preferredSampleId,
    pathologyFilter,
}: WsiPatientViewEntryPointProps) {
    const hierarchyUrl = buildWsiHierarchyApiUrl(studyId, patientId);

    return (
        <React.Suspense
            fallback={
                <div role="status" data-testid="wsi-viewer-loading">
                    Loading pathology slides…
                </div>
            }
        >
            <LazyWSIViewer
                tileServerUrl={tileServerUrl}
                hierarchyUrl={hierarchyUrl}
                patientId={patientId}
                studyId={studyId}
                studyName={studyName}
                authScope={authScope}
                height={height}
                initialStainFilter={initialStainFilter}
                initialMatchFilter={initialMatchFilter}
                initialTimepointDays={initialTimepointDays}
                onTimepointChange={onTimepointChange}
                onStainFilterChange={onStainFilterChange}
                onMatchFilterChange={onMatchFilterChange}
                onClearFilters={onClearFilters}
                preferredSampleId={preferredSampleId}
                pathologyFilter={pathologyFilter}
            />
        </React.Suspense>
    );
}
