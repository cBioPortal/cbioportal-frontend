import { MolecularProfile } from 'cbioportal-ts-api-client';
import * as _ from 'lodash';
import { AlterationTypeConstants } from '../../pages/resultsView/ResultsViewPageStore';
import {
    CNAProfilesEnum,
    MutationProfilesEnum,
    StructuralVariantProfilesEnum,
} from 'shared/components/query/QueryStoreUtils';
import { stringListToSet } from 'cbioportal-frontend-commons';

export enum MolecularProfileFilterEnum {
    MutationAndCNA = 0,
    Mutation = 1,
    CNA = 2,
}

export function getDefaultMolecularProfiles(
    studyToMolecularProfiles: { [studyId: string]: MolecularProfile[] },
    profileFilter: string
) {
    let profileFilterSet: { [id: string]: boolean } | undefined = undefined;
    let dataPriority = parseInt(profileFilter, 10);
    if (isNaN(dataPriority)) {
        profileFilterSet = stringListToSet(profileFilter.split(','));
    }

    return _.flatMap(studyToMolecularProfiles, profiles =>
        getFilteredMolecularProfiles(
            profiles,
            profileFilterSet,
            isNaN(dataPriority) ? 0 : dataPriority
        )
    );
}

export function isGistic(profileId: string) {
    return /GISTIC/i.test(profileId);
}

export function isRAE(profileId: string) {
    return /RAE/i.test(profileId);
}

export interface CNAProfileGroups {
    gistic: MolecularProfile[];
    rae: MolecularProfile[];
    other: MolecularProfile[];
}

export function getDefaultCNAProfile(
    profiles: MolecularProfile[]
): MolecularProfile | undefined {
    // we only want CNA profiles
    const cnaProfiles = profiles.filter(
        profile =>
            profile.molecularAlterationType ===
            AlterationTypeConstants.COPY_NUMBER_ALTERATION
    );
    // now put profiles into groups (gistic, RAE, other)
    const cnaGroups = cnaProfiles.reduce(
        (map: CNAProfileGroups, profile) => {
            if (isGistic(profile.molecularProfileId)) {
                map.gistic.push(profile);
            } else if (isRAE(profile.molecularProfileId)) {
                map.rae.push(profile);
            } else {
                map.other.push(profile);
            }
            return map;
        },
        {
            gistic: [],
            rae: [],
            other: [],
        }
    );

    //now return according to priority (gistic, rae, other)
    if (cnaGroups.gistic.length) {
        return cnaGroups.gistic[0];
    } else if (cnaGroups.rae.length) {
        return cnaGroups.rae[0];
    } else if (cnaGroups.other.length) {
        // show the first profile in with showProfileInAnalysisTab flag set to true
        return _.find(
            cnaGroups.other,
            profile => profile.showProfileInAnalysisTab
        );
    } else {
        return undefined;
    }
}

export function getDefaultMutationProfile(profiles: MolecularProfile[]) {
    return _.find(
        profiles,
        profile =>
            profile.molecularAlterationType ===
            AlterationTypeConstants.MUTATION_EXTENDED
    );
}

export function getDefaultStructuralVariantProfile(
    profiles: MolecularProfile[]
) {
    return _.find(
        profiles,
        profile =>
            profile.molecularAlterationType ===
            AlterationTypeConstants.STRUCTURAL_VARIANT
    );
}

export function getFilteredMolecularProfiles(
    profiles: MolecularProfile[],
    profileFilterSet?: { [profileType: string]: boolean },
    dataPriority: number = 0 // this is legacy and necessary only for backward compatibility
) {
    const defaultProfiles: (MolecularProfile | undefined)[] = [];

    if (profileFilterSet) {
        if (profileFilterSet[MutationProfilesEnum.mutations]) {
            defaultProfiles.push(getDefaultMutationProfile(profiles));
        }
        if (
            profileFilterSet[CNAProfilesEnum.gistic] ||
            profileFilterSet[CNAProfilesEnum.cna_rae] ||
            profileFilterSet[CNAProfilesEnum.cna] ||
            profileFilterSet[CNAProfilesEnum.cna_consensus]
        ) {
            defaultProfiles.push(getDefaultCNAProfile(profiles));
        }
        if (
            profileFilterSet[StructuralVariantProfilesEnum.fusion] ||
            profileFilterSet[StructuralVariantProfilesEnum.structural_variants]
        ) {
            defaultProfiles.push(getDefaultStructuralVariantProfile(profiles));
        }
    } else {
        switch (dataPriority) {
            case MolecularProfileFilterEnum.Mutation:
                defaultProfiles.push(getDefaultMutationProfile(profiles));
                defaultProfiles.push(
                    getDefaultStructuralVariantProfile(profiles)
                );
                break;
            case MolecularProfileFilterEnum.CNA:
                defaultProfiles.push(getDefaultCNAProfile(profiles));
                break;
            case MolecularProfileFilterEnum.MutationAndCNA:
                defaultProfiles.push(getDefaultMutationProfile(profiles));
                defaultProfiles.push(getDefaultCNAProfile(profiles));
                defaultProfiles.push(
                    getDefaultStructuralVariantProfile(profiles)
                );
        }
    }
    // get rid of any undefined items
    return _.compact(defaultProfiles);
}
