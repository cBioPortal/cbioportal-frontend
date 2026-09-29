import * as React from 'react';
import { ClinicalEvent } from 'cbioportal-ts-api-client';
import { buildWsiHierarchyApiUrl } from './wsiUrls';
import { buildWsiSampleTimelineMap } from './wsiSampleTimeline';
import { configureWsiViewerRuntime, WsiViewerConfig } from './wsiViewerConfig';
import WSIViewer from './WSIViewer';
import {
    PathologySlideFilter,
    PathologySlideMatchFilter,
    WsiStainFilter,
    WsiTimepointSelection,
} from './wsiViewerTypes';

export interface WsiViewerProps {
    /** Host services and settings. */
    config: WsiViewerConfig;
    patientId: string;
    studyId: string;
    tileServerUrl: string;
    height: number;
    studyName?: string;
    initialStainFilter?: WsiStainFilter;
    initialMatchFilter?: PathologySlideMatchFilter;
    initialTimepointDays?: WsiTimepointSelection;
    onTimepointChange?: (days: WsiTimepointSelection) => void;
    onStainFilterChange?: (filter: WsiStainFilter) => void;
    onMatchFilterChange?: (filter: PathologySlideMatchFilter) => void;
    onClearFilters?: () => void;
    preferredSampleId?: string;
    pathologyFilter?: PathologySlideFilter;
    /** Slide named by an `imageId` viewer link. */
    requestedImageId?: string;
    /**
     * Patient clinical events; sample acquisition and sequencing days are
     * read from them to relate each slide's procedure to its sample.
     */
    clinicalEvents?: ClinicalEvent[];
}

/**
 * Patient slide viewer: loads the patient's slide hierarchy from the portal
 * and shows the selected slide. Hosts can add their own tabs, filters and
 * linkout handling around it without changing the hierarchy or serving
 * contract used by the viewer itself.
 */
export default function WsiViewer({
    config,
    patientId,
    studyId,
    tileServerUrl,
    height,
    studyName,
    initialStainFilter,
    initialMatchFilter,
    initialTimepointDays,
    onTimepointChange,
    onStainFilterChange,
    onMatchFilterChange,
    onClearFilters,
    preferredSampleId,
    pathologyFilter,
    requestedImageId,
    clinicalEvents,
}: WsiViewerProps) {
    // Installed while rendering so that the viewer's mount effects, which
    // run before this component's, already see the host services.
    configureWsiViewerRuntime(config);
    const hierarchyUrl = buildWsiHierarchyApiUrl(
        config.buildApiUrl,
        studyId,
        patientId
    );
    const sampleTimelines = React.useMemo(
        () =>
            clinicalEvents && clinicalEvents.length > 0
                ? buildWsiSampleTimelineMap(clinicalEvents)
                : undefined,
        [clinicalEvents]
    );

    return (
        <WSIViewer
            tileServerUrl={tileServerUrl}
            hierarchyUrl={hierarchyUrl}
            patientId={patientId}
            studyId={studyId}
            studyName={studyName}
            authScope={config.authScope}
            showDownload={config.showDownload}
            renderLoading={config.renderLoading}
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
            requestedImageId={requestedImageId}
            sampleTimelines={sampleTimelines}
        />
    );
}
