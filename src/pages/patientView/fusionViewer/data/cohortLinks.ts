// 'fusionViewer' is the PatientViewPageTabs.FusionViewer enum value. Hardcoded
// here (rather than imported) to avoid a circular dependency between the page
// tabs module and the fusion-viewer data layer.
const FUSION_VIEWER_TAB_ID = 'fusionViewer';

/**
 * Build a hash href to a sample's patient page, deep-linked to the Fusion
 * Viewer tab. Uses only the sample/study ids the cohort already holds — no new
 * identifiers are introduced.
 */
export function sampleFusionViewerHref(
    studyId: string,
    sampleId: string
): string {
    const params = [
        `studyId=${encodeURIComponent(studyId)}`,
        `caseId=${encodeURIComponent(sampleId)}`,
        `tab=${FUSION_VIEWER_TAB_ID}`,
    ].join('&');
    return `#/patient?${params}`;
}
