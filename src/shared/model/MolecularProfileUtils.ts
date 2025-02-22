import { MolecularProfile } from 'cbioportal-ts-api-client';

export function isZScoreProfile(profile: MolecularProfile): boolean {
    return profile.datatype == 'Z-SCORE';
}

export function isZScoreCalculatableProfile(
    profile: MolecularProfile
): boolean {
    return ['CONTINUOUS', 'LOG2-VALUE'].includes(profile.datatype);
}
