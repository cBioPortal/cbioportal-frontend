import * as React from 'react';
import { ClinicalEvent } from 'cbioportal-ts-api-client';
import { buildWsiSampleTimelineMap } from './wsiSampleTimeline';
import WSIViewer, { WsiViewerProps as ViewerProps } from './WSIViewer';

export type WsiViewerProps = Omit<ViewerProps, 'sampleTimelines'> & {
    /**
     * Patient clinical events; sample acquisition and sequencing days are
     * read from them to relate each slide's procedure to its sample.
     */
    clinicalEvents?: ClinicalEvent[];
};

/**
 * The patient slide viewer, with each sample's timeline built from the
 * patient's clinical events.
 */
export default function WsiViewer({
    clinicalEvents,
    ...viewerProps
}: WsiViewerProps) {
    const sampleTimelines = React.useMemo(
        () =>
            clinicalEvents && clinicalEvents.length > 0
                ? buildWsiSampleTimelineMap(clinicalEvents)
                : undefined,
        [clinicalEvents]
    );

    return <WSIViewer {...viewerProps} sampleTimelines={sampleTimelines} />;
}
