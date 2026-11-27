import { assert } from 'chai';
import { MolecularProfile, Mutation } from 'cbioportal-ts-api-client';
import {
    getCancerCellFraction,
    getClonalityHeatmapProfileId,
    getSourceMutationProfileId,
    isClonalityHeatmapProfile,
    isClonalityHeatmapProfileId,
    makeClonalityHeatmapProfile,
} from './ClonalityHeatmapUtils';

describe('ClonalityHeatmapUtils', () => {
    const mutationProfile = {
        molecularProfileId: 'msk_impact_2017_mutations',
        molecularAlterationType: 'MUTATION_EXTENDED',
        datatype: 'MAF',
        name: 'Mutations',
        studyId: 'msk_impact_2017',
    } as MolecularProfile;

    it('round trips profile ids', () => {
        const id = getClonalityHeatmapProfileId('study_mutations');
        assert.isTrue(isClonalityHeatmapProfileId(id));
        assert.isFalse(isClonalityHeatmapProfileId('study_mutations'));
        assert.equal(getSourceMutationProfileId(id), 'study_mutations');
        assert.equal(
            getSourceMutationProfileId('study_mutations'),
            'study_mutations'
        );
    });

    it('makes a clonality heatmap profile from a mutation profile', () => {
        const profile = makeClonalityHeatmapProfile(mutationProfile);
        assert.equal(
            profile.molecularProfileId,
            'msk_impact_2017_mutations_ccf_heatmap'
        );
        assert.equal(profile.molecularAlterationType, 'MUTATION_EXTENDED');
        assert.equal(profile.studyId, 'msk_impact_2017');
        assert.isTrue(isClonalityHeatmapProfile(profile));
        assert.isFalse(isClonalityHeatmapProfile(mutationProfile));
        assert.isFalse(isClonalityHeatmapProfile(undefined));
    });

    it('extracts cancer cell fraction', () => {
        const withCCF = (ccfExpectedCopies: any) =>
            ({
                alleleSpecificCopyNumber: { ccfExpectedCopies },
            } as Mutation);
        assert.equal(getCancerCellFraction(withCCF(0.42)), 0.42);
        assert.equal(getCancerCellFraction(withCCF(0)), 0);
        assert.isUndefined(getCancerCellFraction(withCCF(-1)));
        assert.isUndefined(getCancerCellFraction(withCCF(undefined)));
        assert.isUndefined(getCancerCellFraction(withCCF(NaN)));
        assert.isUndefined(getCancerCellFraction({} as Mutation));
    });
});
