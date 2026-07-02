import { MolecularProfile } from 'cbioportal-ts-api-client';
import _ from 'lodash';
import { AlterationTypeConstants } from 'shared/constants';

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
    const bySuffix = _.groupBy(selectable, p => getSuffixOfMolecularProfile(p));
    const suffixes = Object.keys(bySuffix);
    return suffixes.length === 1 ? suffixes[0] : undefined;
}

/**
 * Profile suffix to default when a study has no mutation/CNA/SV data but does
 * have other queryable profiles (e.g. RNA + generic assay). Aligns with
 * QueryStore.shouldSelectDefaultProfile (#11569).
 */
export function getDefaultProfileSuffixWhenNoMutationData(
    profiles: MolecularProfile[],
    options?: { forDownloadTab?: boolean }
): string | undefined {
    const singleSuffix = getSingleSelectableProfileSuffixIfUnique(
        profiles,
        options
    );
    if (singleSuffix) {
        return singleSuffix;
    }
    const forDownloadTab = options?.forDownloadTab ?? false;
    const selectable = profiles.filter(
        p => p.showProfileInAnalysisTab || forDownloadTab
    );
    const hasAlterationProfile = selectable.some(
        p =>
            p.molecularAlterationType ===
                AlterationTypeConstants.MUTATION_EXTENDED ||
            p.molecularAlterationType ===
                AlterationTypeConstants.COPY_NUMBER_ALTERATION ||
            p.molecularAlterationType ===
                AlterationTypeConstants.STRUCTURAL_VARIANT
    );
    if (hasAlterationProfile) {
        return undefined;
    }
    const mrnaProfile = selectable.find(
        p =>
            p.molecularAlterationType ===
            AlterationTypeConstants.MRNA_EXPRESSION
    );
    return mrnaProfile ? getSuffixOfMolecularProfile(mrnaProfile) : undefined;
}
