import { assert } from 'chai';
import {
    formatPrediction,
    getFunctionalImpactOptionIds,
} from './FunctionalImpactFilter';
import { FunctionalImpactData } from './FunctionalImpactColumnFormatter';

describe('FunctionalImpactFilter', () => {
    const data = ({
        mutationAssessor: { functionalImpactPrediction: 'High' },
        siftPrediction: 'deleterious_low_confidence',
        polyPhenPrediction: 'probably_damaging',
        alphaMissensePrediction: undefined,
    } as any) as FunctionalImpactData;

    it('lists a prediction per predictor, "none" without a prediction', () => {
        assert.sameMembers(getFunctionalImpactOptionIds(data, true), [
            'mutationAssessor:high',
            'sift:deleterious_low_confidence',
            'polyphen2:probably_damaging',
            'alphaMissense:none',
        ]);
    });

    it('leaves out Mutation Assessor when it is not shown', () => {
        assert.notInclude(
            getFunctionalImpactOptionIds(data, false),
            'mutationAssessor:high'
        );
    });

    it('formats predictions as labels', () => {
        assert.equal(
            formatPrediction('deleterious_low_confidence'),
            'Deleterious (low confidence)'
        );
        assert.equal(
            formatPrediction('probably_damaging'),
            'Probably damaging'
        );
        assert.equal(formatPrediction('none'), 'No prediction');
    });
});
