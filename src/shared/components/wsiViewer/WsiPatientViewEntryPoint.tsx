import * as React from 'react';
import WSIViewer from './WSIViewer';
import { buildWsiHierarchyApiUrl } from './wsiUrls';

export interface WsiPatientViewEntryPointProps {
    patientId: string;
    studyId: string;
    tileServerUrl: string;
    height: number;
    studyName?: string;
    authScope?: string;
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
    authScope,
}: WsiPatientViewEntryPointProps) {
    const hierarchyUrl = buildWsiHierarchyApiUrl(studyId, patientId);

    return (
        <WSIViewer
            tileServerUrl={tileServerUrl}
            hierarchyUrl={hierarchyUrl}
            patientId={patientId}
            studyId={studyId}
            studyName={studyName}
            authScope={authScope}
            height={height}
        />
    );
}
