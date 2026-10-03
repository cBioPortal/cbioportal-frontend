import * as React from 'react';
import { ClinicalEvent } from 'cbioportal-ts-api-client';
import { buildWsiHierarchyApiUrl } from './wsiUrls';
import { buildWsiSampleTimelineMap } from './wsiSampleTimeline';
import { getWsiViewerRuntime } from './wsiViewerConfig';
import WSIViewer from './WSIViewer';
import {
    PathologySlideFilter,
    PathologySlideMatchFilter,
    WsiStainFilter,
    WsiClinicalRow,
    WsiTimepointSelection,
} from './wsiViewerTypes';

export interface WsiViewerProps {
    /** Subject that isolates protected in-memory caches (the user name). */
    authScope: string;
    /** Shows the "download view" control. */
    showDownload?: boolean;
    /** Indicator shown while the hierarchy loads; a plain spinner when unset. */
    renderLoading?: () => React.ReactNode;
    patientId: string;
    studyId: string;
    tileServerUrl: string;
    height: number;
    initialStainFilter?: WsiStainFilter;
    initialMatchFilter?: PathologySlideMatchFilter;
    initialTimepointDays?: WsiTimepointSelection;
    onTimepointChange?: (days: WsiTimepointSelection) => void;
    onStainFilterChange?: (filter: WsiStainFilter) => void;
    onMatchFilterChange?: (filter: PathologySlideMatchFilter) => void;
    onClearFilters?: () => void;
    preferredSampleId?: string;
    pathologyFilter?: PathologySlideFilter;
    /** Slide named by a `slideKey` viewer link. */
    requestedSlideKey?: string;
    /**
     * Patient clinical events; sample acquisition and sequencing days are
     * read from them to relate each slide's procedure to its sample.
     */
    clinicalEvents?: ClinicalEvent[];
    /**
     * Rows for the sidebar's Clinical section, in display order. Rows with a
     * `sampleId` show only for that sample's slides. Unset hides the section;
     * an empty list shows it with no values.
     */
    clinicalRows?: ReadonlyArray<WsiClinicalRow>;
    /** Hides the slide list; unset keeps the user's stored choice. */
    navCollapsed?: boolean;
    onNavCollapsedChange?: (collapsed: boolean) => void;
    /** Hides the image details sidebar; unset keeps the user's stored choice. */
    metadataCollapsed?: boolean;
    onMetadataCollapsedChange?: (collapsed: boolean) => void;
    /**
     * The host hides the viewer without unmounting it (e.g. an inactive
     * tab); token refresh pauses meanwhile.
     */
    hidden?: boolean;
}

/**
 * Patient slide viewer: loads the patient's slide hierarchy from the portal
 * and shows the selected slide. Hosts can add their own tabs, filters and
 * linkout handling around it without changing the hierarchy or serving
 * contract used by the viewer itself.
 */
export default function WsiViewer({
    patientId,
    studyId,
    clinicalEvents,
    ...viewerProps
}: WsiViewerProps) {
    const hierarchyUrl = buildWsiHierarchyApiUrl(
        getWsiViewerRuntime().buildApiUrl,
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
            {...viewerProps}
            hierarchyUrl={hierarchyUrl}
            patientId={patientId}
            studyId={studyId}
            sampleTimelines={sampleTimelines}
        />
    );
}
