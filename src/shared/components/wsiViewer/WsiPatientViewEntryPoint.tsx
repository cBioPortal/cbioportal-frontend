import * as React from 'react';
import WSIViewer from './WSIViewer';

export interface WsiPatientViewEntryPointProps {
    patientId: string;
    studyId: string;
    tileServerUrl: string;
    height: number;
    studyName?: string;
}

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
}: WsiPatientViewEntryPointProps) {
    const hierarchyUrl = `/api/wsi/v2/hierarchy/${encodeURIComponent(
        studyId
    )}/${encodeURIComponent(patientId)}`;

    return (
        <WSIViewer
            tileServerUrl={tileServerUrl}
            hierarchyUrl={hierarchyUrl}
            patientId={patientId}
            studyId={studyId}
            studyName={studyName}
            height={height}
        />
    );
}
