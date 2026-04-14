import { MolecularProfile } from 'cbioportal-ts-api-client';
import _ from 'lodash';

export function getSuffixOfMolecularProfile(profile: MolecularProfile) {
    return profile.molecularProfileId.replace(profile.studyId + '_', '');
}

/**
 * When the cohort exposes exactly one selectable analysis profile (one suffix),
 * return that suffix so the query UI can default-check it. Covers RNA-only and
 * other single-profile studies (#11569). Multiple studies sharing the same
 * suffix still count as one checkbox column — one suffix is returned.
 */
export function getSingleSelectableProfileSuffixIfUnique(
    profiles: MolecularProfile[],
    options?: { forDownloadTab?: boolean }
): string | undefined {
    if (!profiles?.length) {
        return undefined;
    }
    const forDownloadTab = options?.forDownloadTab ?? false;
    const selectable = profiles.filter(
        p => p.showProfileInAnalysisTab || forDownloadTab
    );
    if (!selectable.length) {
        return undefined;
    }
    const bySuffix = _.groupBy(selectable, p =>
        getSuffixOfMolecularProfile(p)
    );
    const suffixes = Object.keys(bySuffix);
    return suffixes.length === 1 ? suffixes[0] : undefined;
}
