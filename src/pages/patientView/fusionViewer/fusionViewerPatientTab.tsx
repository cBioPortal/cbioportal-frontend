import * as React from 'react';
import { StructuralVariant } from 'cbioportal-ts-api-client';
import { MSKTab } from 'shared/components/MSKTabs/MSKTabs';
import LoadingIndicator from 'shared/components/loadingIndicator/LoadingIndicator';
import { FusionViewerTab } from './FusionViewerTab';
import { hasRnaFusion, patientSvTabLabel } from './data/svTabLabels';

export interface FusionViewerSvData {
    isPending: boolean;
    isError: boolean;
    result?: StructuralVariant[];
}

/**
 * The tab is hidden when the patient has no SVs, unless it is the active
 * route: then it stays mounted and shows a loading, error or empty state,
 * so a deep link or a patient switch never lands on a blank page.
 */
export function buildFusionViewerTab(
    tabId: string,
    svData: FusionViewerSvData,
    activeTabId: string | undefined,
    referenceGenome: string | undefined
) {
    const svs = svData.result || [];
    const hide =
        activeTabId !== tabId && (svData.isPending || svs.length === 0);

    let content: JSX.Element;
    if (svData.isPending) {
        content = (
            <LoadingIndicator isLoading={true} size={'big'} center={true} />
        );
    } else if (svData.isError) {
        content = (
            <div style={{ padding: 20, color: '#999', fontSize: 14 }}>
                Structural variant data could not be loaded.
            </div>
        );
    } else {
        content = (
            <FusionViewerTab
                structuralVariants={svs}
                referenceGenome={referenceGenome}
            />
        );
    }

    return (
        <MSKTab
            key={11}
            id={tabId}
            linkText={patientSvTabLabel(hasRnaFusion(svs))}
            hide={hide}
        >
            {content}
        </MSKTab>
    );
}
