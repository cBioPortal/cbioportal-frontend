import { getSampleViewUrlWithPathname } from 'shared/api/urls';

// 'fusionViewer' is the PatientViewPageTabs.FusionViewer enum value, hardcoded
// in the pathname (rather than imported) to avoid a circular dependency between
// the page tabs module and the fusion-viewer data layer.
const FUSION_VIEWER_PATHNAME = 'patient/fusionViewer';

/**
 * Build an href to a sample's patient page, deep-linked to the Fusion Viewer
 * tab and scoped to that sample. The tab is selected by the URL path segment
 * (`patient/fusionViewer`) and the sample by the `sampleId` query param — the
 * shape the router actually honors. Uses only the sample/study ids the cohort
 * already holds; no new identifiers are introduced.
 */
export function sampleFusionViewerHref(
    studyId: string,
    sampleId: string
): string {
    return getSampleViewUrlWithPathname(
        studyId,
        sampleId,
        FUSION_VIEWER_PATHNAME
    );
}
