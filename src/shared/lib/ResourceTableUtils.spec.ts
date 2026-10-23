import { assert } from 'chai';
import { isStudyWideResource } from './ResourceTableUtils';

describe('isStudyWideResource', () => {
    it('is true when rows exist but none belong to a patient or sample', () => {
        assert.isTrue(
            isStudyWideResource({
                totalCount: 1,
                patientCount: 0,
                sampleCount: 0,
            })
        );
    });

    it('is false when any row belongs to a patient or sample', () => {
        assert.isFalse(
            isStudyWideResource({
                totalCount: 3,
                patientCount: 2,
                sampleCount: 0,
            })
        );
        assert.isFalse(
            isStudyWideResource({
                totalCount: 3,
                patientCount: 0,
                sampleCount: 2,
            })
        );
    });

    it('is false when the resource has no rows', () => {
        assert.isFalse(
            isStudyWideResource({
                totalCount: 0,
                patientCount: 0,
                sampleCount: 0,
            })
        );
    });
});
