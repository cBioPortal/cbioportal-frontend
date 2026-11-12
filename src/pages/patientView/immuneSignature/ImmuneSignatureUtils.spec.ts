import { assert } from 'chai';
import { ClinicalData, GenericAssayData } from 'cbioportal-ts-api-client';
import { getImmuneSignature } from './ImmuneSignatureUtils';

function makeClinicalData(values: Record<string, string>): ClinicalData[] {
    return Object.entries(values).map(
        ([clinicalAttributeId, value]) =>
            ({ clinicalAttributeId, value } as ClinicalData)
    );
}

describe('ImmuneSignatureUtils', () => {
    const clinicalData = makeClinicalData({
        ISIG_KNN_CLASS: 'F',
        ISIG_KNN_CONFIDENCE: 'high',
    });

    it('reads the class from clinical data and probabilities from generic assay data', () => {
        const genericAssayData = [
            { stableId: 'ISIG_PROB_D', value: '0.25' },
            { stableId: 'ISIG_PROB_F', value: '0.75' },
        ] as GenericAssayData[];
        assert.deepEqual(getImmuneSignature(clinicalData, genericAssayData), {
            knnClass: 'F',
            knnConfidence: 'high',
            classScores: { D: 0.25, F: 0.75, IE: 0, 'IE/F': 0 },
        });
    });

    it('reads only the probability fields from generic assay data', () => {
        const genericAssayData = [
            { stableId: 'ISIG_PROB_F', value: '0.6' },
            { stableId: 'ISIG_PROB_IE_F', value: '0.4' },
            { stableId: 'ISIG_KNN_CLASS', value: 'IE' },
            { stableId: 'ISIG_KNN_CONFIDENCE', value: 'low' },
        ] as GenericAssayData[];
        const signature = getImmuneSignature(clinicalData, genericAssayData)!;
        assert.equal(signature.knnClass, 'F');
        assert.equal(signature.knnConfidence, 'high');
        assert.deepEqual(signature.classScores, {
            D: 0,
            F: 0.6,
            IE: 0,
            'IE/F': 0.4,
        });
    });

    it('ignores probabilities in clinical data', () => {
        const clinicalWithProbabilities = makeClinicalData({
            ISIG_PROB_D: '0.9',
            ISIG_PROB_F: '0.1',
        });
        assert.isUndefined(getImmuneSignature(clinicalWithProbabilities));

        const signature = getImmuneSignature(
            [...clinicalData, ...clinicalWithProbabilities],
            [{ stableId: 'ISIG_PROB_IE', value: '0.8' }] as GenericAssayData[]
        )!;
        assert.deepEqual(signature.classScores, {
            D: 0,
            F: 0,
            IE: 0.8,
            'IE/F': 0,
        });
    });

    it('uses the most probable class when there is no clinical class', () => {
        const signature = getImmuneSignature([], [
            { stableId: 'ISIG_PROB_D', value: '0.1' },
            { stableId: 'ISIG_PROB_IE', value: '0.7' },
            { stableId: 'ISIG_PROB_IE_F', value: '0.2' },
        ] as GenericAssayData[])!;
        assert.equal(signature.knnClass, 'IE');
        assert.isUndefined(signature.knnConfidence);
    });

    it('returns undefined when the sample has no class or probabilities', () => {
        assert.isUndefined(getImmuneSignature([]));
        assert.isUndefined(
            getImmuneSignature([], [
                { stableId: 'ISIG_PROB_D', value: 'NA' },
            ] as GenericAssayData[])
        );
    });
});
