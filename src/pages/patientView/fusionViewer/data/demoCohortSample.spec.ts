import { assert } from 'chai';
import { DEMO_COHORT_STRUCTURAL_VARIANTS } from './demoCohortSample';
import { FusionCohortStore } from '../FusionCohortStore';

describe('demoCohortSample fixture', () => {
    it('drives the store to the expected recurrence summary', () => {
        const store = new FusionCohortStore();
        store.setStructuralVariants(DEMO_COHORT_STRUCTURAL_VARIANTS);

        const summaries = store.pairSummaries;
        // 4 distinct canonical pairs in the fixture.
        assert.equal(summaries.length, 4);

        // Recurrent pair sorts first: TMPRSS2 & ERG -> 'ERG::TMPRSS2'.
        const top = summaries[0];
        assert.equal(top.key, 'ERG::TMPRSS2');
        assert.equal(top.sampleCount, 3); // S1, S2, S3
        assert.equal(top.eventCount, 4); // S1 contributes 2 breakpoints
        assert.isTrue(top.anyInFrame); // S1/S2 in-frame

        // Intragenic GENE::- pair is present.
        assert.isTrue(summaries.some(s => s.key === 'KMT2A::-'));
    });

    it('exposes both SV-type options', () => {
        const store = new FusionCohortStore();
        store.setStructuralVariants(DEMO_COHORT_STRUCTURAL_VARIANTS);
        assert.deepEqual(store.svTypeOptions, ['FUSION', 'SV']);
    });
});
