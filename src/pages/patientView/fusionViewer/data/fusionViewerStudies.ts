/**
 * The Fusion Viewer is off unless the portal lists the patient's study in the
 * `fusion_viewer_study_ids` server property (comma-separated study ids).
 * Every study the patient belongs to must be listed.
 */
export function isFusionViewerEnabled(
    studyIds: string[],
    configuredIds: string | null | undefined
): boolean {
    const allowed = (configuredIds || '')
        .split(',')
        .map(id => id.trim())
        .filter(id => id.length > 0);
    return (
        studyIds.length > 0 && studyIds.every(id => allowed.indexOf(id) !== -1)
    );
}
