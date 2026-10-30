/**
 * The Fusion Viewer is a beta feature. It is off unless either the
 * `fusionViewer` feature flag is set (?featureFlags=fusionViewer, persisted in
 * localStorage) or the portal lists the patient's study in the
 * `fusion_viewer_study_ids` server property (comma-separated study ids). For
 * the property, every study the patient belongs to must be listed.
 */
export function isFusionViewerEnabled(
    studyIds: string[],
    configuredIds: string | null | undefined,
    featureFlagEnabled: boolean = false
): boolean {
    if (studyIds.length === 0) return false;
    if (featureFlagEnabled) return true;
    const allowed = (configuredIds || '')
        .split(',')
        .map(id => id.trim())
        .filter(id => id.length > 0);
    return studyIds.every(id => allowed.indexOf(id) !== -1);
}
