import _ from 'lodash';
import { MolecularProfile, Mutation } from 'cbioportal-ts-api-client';

// Virtual heatmap profiles that show clonality (cancer cell fraction) of the
// mutations in a mutation profile. They are identified by an id suffix on the
// source mutation profile id and a dedicated datatype.
export const CLONALITY_HEATMAP_PROFILE_SUFFIX = '_ccf_heatmap';
export const CLONALITY_HEATMAP_DATATYPE = 'CCF';

export function getClonalityHeatmapProfileId(mutationProfileId: string) {
    return `${mutationProfileId}${CLONALITY_HEATMAP_PROFILE_SUFFIX}`;
}

export function isClonalityHeatmapProfileId(molecularProfileId: string) {
    return molecularProfileId.endsWith(CLONALITY_HEATMAP_PROFILE_SUFFIX);
}

export function isClonalityHeatmapProfile(
    profile: Pick<MolecularProfile, 'datatype'> | undefined
) {
    return !!profile && profile.datatype === CLONALITY_HEATMAP_DATATYPE;
}

/**
 * Returns the mutation profile id a heatmap profile id draws its data from.
 * For non-clonality profile ids this is the id itself.
 */
export function getSourceMutationProfileId(molecularProfileId: string) {
    return isClonalityHeatmapProfileId(molecularProfileId)
        ? molecularProfileId.slice(0, -CLONALITY_HEATMAP_PROFILE_SUFFIX.length)
        : molecularProfileId;
}

export function makeClonalityHeatmapProfile(
    mutationProfile: MolecularProfile
): MolecularProfile {
    return {
        ...mutationProfile,
        molecularProfileId: getClonalityHeatmapProfileId(
            mutationProfile.molecularProfileId
        ),
        datatype: CLONALITY_HEATMAP_DATATYPE,
        name: `Clonality (CCF) in ${mutationProfile.name}`,
        description: `Cancer cell fraction (ccfExpectedCopies) of mutations in ${mutationProfile.name}`,
    };
}

/**
 * Cancer cell fraction (ccfExpectedCopies) of a mutation, or undefined if
 * the mutation has no valid allele-specific copy number CCF estimate.
 */
export function getCancerCellFraction(
    m: Pick<Mutation, 'alleleSpecificCopyNumber'>
): number | undefined {
    const ccf =
        m.alleleSpecificCopyNumber &&
        m.alleleSpecificCopyNumber.ccfExpectedCopies;
    return _.isFinite(ccf) && ccf! >= 0 ? ccf : undefined;
}
