import { assert } from 'chai';
import { MolecularProfile } from 'cbioportal-ts-api-client';
import {
    getDefaultProfileSuffixWhenNoMutationData,
    getSingleSelectableProfileSuffixIfUnique,
    getSuffixOfMolecularProfile,
} from './molecularProfileUtils';
import { getFilteredMolecularProfiles } from './getDefaultMolecularProfiles';
import { AlterationTypeConstants } from 'shared/constants';

describe('MolecularProfileUtils', () => {
    describe('getSuffixOfMolecularProfile', () => {
        it('get suffix correctly from molecular profile', () => {
            const profile = {
                molecularProfileId: 'ccle_broad_2019_CCLE_drug_treatment_IC50',
                studyId: 'ccle_broad_2019',
            } as MolecularProfile;
            const suffix = 'CCLE_drug_treatment_IC50';
            const result = getSuffixOfMolecularProfile(profile);
            assert.equal(result, suffix);
        });
    });

    describe('getSingleSelectableProfileSuffixIfUnique', () => {
        it('returns suffix when exactly one showProfileInAnalysisTab profile', () => {
            const profiles = [
                {
                    studyId: 's1',
                    molecularProfileId: 's1_rna_geo',
                    molecularAlterationType: 'MRNA_EXPRESSION',
                    showProfileInAnalysisTab: true,
                },
            ] as MolecularProfile[];
            assert.equal(
                getSingleSelectableProfileSuffixIfUnique(profiles),
                'rna_geo'
            );
        });

        it('returns undefined when two distinct suffixes exist', () => {
            const profiles = [
                {
                    studyId: 's1',
                    molecularProfileId: 's1_mutations',
                    molecularAlterationType: 'MUTATION_EXTENDED',
                    showProfileInAnalysisTab: true,
                },
                {
                    studyId: 's1',
                    molecularProfileId: 's1_gistic',
                    molecularAlterationType: 'COPY_NUMBER_ALTERATION',
                    showProfileInAnalysisTab: true,
                },
            ] as MolecularProfile[];
            assert.isUndefined(
                getSingleSelectableProfileSuffixIfUnique(profiles)
            );
        });

        it('returns one suffix when two studies share the same suffix', () => {
            const profiles = [
                {
                    studyId: 'a',
                    molecularProfileId: 'a_mutations',
                    molecularAlterationType: 'MUTATION_EXTENDED',
                    showProfileInAnalysisTab: true,
                },
                {
                    studyId: 'b',
                    molecularProfileId: 'b_mutations',
                    molecularAlterationType: 'MUTATION_EXTENDED',
                    showProfileInAnalysisTab: true,
                },
            ] as MolecularProfile[];
            assert.equal(
                getSingleSelectableProfileSuffixIfUnique(profiles),
                'mutations'
            );
        });
    });

    describe('getDefaultProfileSuffixWhenNoMutationData', () => {
        it('returns mRNA suffix when no mutation/CNA/SV but multiple selectable profiles', () => {
            const profiles = [
                {
                    studyId: 'ovary_geomx_gray_foundation_2024',
                    molecularProfileId:
                        'ovary_geomx_gray_foundation_2024_cycif_cell_type_fractions',
                    molecularAlterationType: 'GENERIC_ASSAY',
                    showProfileInAnalysisTab: true,
                },
                {
                    studyId: 'ovary_geomx_gray_foundation_2024',
                    molecularProfileId:
                        'ovary_geomx_gray_foundation_2024_mrna_seq_read_counts_Zscores',
                    molecularAlterationType:
                        AlterationTypeConstants.MRNA_EXPRESSION,
                    showProfileInAnalysisTab: true,
                },
                {
                    studyId: 'ovary_geomx_gray_foundation_2024',
                    molecularProfileId:
                        'ovary_geomx_gray_foundation_2024_rfu_p53_marker_intensity',
                    molecularAlterationType: 'GENERIC_ASSAY',
                    showProfileInAnalysisTab: true,
                },
            ] as MolecularProfile[];
            assert.equal(
                getDefaultProfileSuffixWhenNoMutationData(profiles),
                'mrna_seq_read_counts_Zscores'
            );
        });

        it('returns undefined when mutation profile exists', () => {
            const profiles = [
                {
                    studyId: 's1',
                    molecularProfileId: 's1_mutations',
                    molecularAlterationType: 'MUTATION_EXTENDED',
                    showProfileInAnalysisTab: true,
                },
                {
                    studyId: 's1',
                    molecularProfileId: 's1_rna',
                    molecularAlterationType:
                        AlterationTypeConstants.MRNA_EXPRESSION,
                    showProfileInAnalysisTab: true,
                },
            ] as MolecularProfile[];
            assert.isUndefined(
                getDefaultProfileSuffixWhenNoMutationData(profiles)
            );
        });
    });

    describe('getFilteredMolecularProfiles single-profile fallback', () => {
        it('selects the only RNA profile when mutation/CNA defaults are empty', () => {
            const profiles = [
                {
                    studyId: 'g',
                    molecularProfileId: 'g_geo_mx',
                    molecularAlterationType:
                        AlterationTypeConstants.MRNA_EXPRESSION,
                    showProfileInAnalysisTab: true,
                },
            ] as MolecularProfile[];
            const out = getFilteredMolecularProfiles(profiles, undefined, 0);
            assert.equal(out.length, 1);
            assert.equal(out[0]!.molecularProfileId, 'g_geo_mx');
        });

        it('selects mRNA when multiple profiles exist but no mutation/CNA/SV', () => {
            const profiles = [
                {
                    studyId: 'g',
                    molecularProfileId: 'g_cycif',
                    molecularAlterationType: 'GENERIC_ASSAY',
                    showProfileInAnalysisTab: true,
                },
                {
                    studyId: 'g',
                    molecularProfileId: 'g_geo_mx',
                    molecularAlterationType:
                        AlterationTypeConstants.MRNA_EXPRESSION,
                    showProfileInAnalysisTab: true,
                },
            ] as MolecularProfile[];
            const out = getFilteredMolecularProfiles(profiles, undefined, 0);
            assert.equal(out.length, 1);
            assert.equal(out[0]!.molecularProfileId, 'g_geo_mx');
        });
    });
});
