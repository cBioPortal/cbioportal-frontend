import { MolecularProfile } from 'cbioportal-ts-api-client';
import { AlterationTypeConstants } from 'shared/constants';

export function getSuffixOfMolecularProfile(profile: MolecularProfile) {
    return profile.molecularProfileId.replace(profile.studyId + '_', '');
}

function isDefaultAlterationProfile(profile: MolecularProfile) {
    return (
        profile.molecularAlterationType ===
            AlterationTypeConstants.MUTATION_EXTENDED ||
        profile.molecularAlterationType ===
            AlterationTypeConstants.COPY_NUMBER_ALTERATION ||
        profile.molecularAlterationType ===
            AlterationTypeConstants.STRUCTURAL_VARIANT
    );
}

/**
 * First selectable profile (showProfileInAnalysisTab), preferring
 * Mutations > Structural Variant > Copy Number Alterations > other
 * alteration types, in `AlterationTypeConstants` declaration order.
 */
export function getFirstSelectableProfile(
    profiles: MolecularProfile[],
    options?: { forDownloadTab?: boolean }
): MolecularProfile | undefined {
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
    for (const profileType of Object.values(AlterationTypeConstants)) {
        const match = selectable.find(
            p => p.molecularAlterationType === profileType
        );
        if (match) {
            return match;
        }
    }
    return selectable[0];
}

/**
 * When Mutations / Structural Variant / Copy Number Alterations profiles are
 * missing, fall back to the first selectable profile (e.g. mRNA, protein, or
 * other analysis profiles).
 */
export function getFallbackSelectableProfileSuffix(
    profiles: MolecularProfile[],
    options?: { forDownloadTab?: boolean }
): string | undefined {
    if (!profiles?.length) {
        return undefined;
    }
    if (profiles.some(isDefaultAlterationProfile)) {
        return undefined;
    }
    const firstSelectable = getFirstSelectableProfile(profiles, options);
    return firstSelectable
        ? getSuffixOfMolecularProfile(firstSelectable)
        : undefined;
}
