import { assert } from 'chai';
import {
    isStudyWideResource,
    studyViewResourceTabs,
} from './ResourceTableUtils';

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

describe('studyViewResourceTabs', () => {
    const tab = (
        resourceId: string,
        totalCount: number,
        patientCount: number,
        sampleCount: number
    ) => ({ resourceId, totalCount, patientCount, sampleCount });

    it('keeps study-wide tabs, which a selection never lists', () => {
        assert.deepEqual(
            studyViewResourceTabs(
                [tab('CELL_EXPLORER', 8, 0, 0), tab('HE', 10, 5, 10)],
                [tab('HE', 2, 1, 2)]
            ),
            [tab('CELL_EXPLORER', 8, 0, 0), tab('HE', 2, 1, 2)]
        );
    });

    it('leaves out other tabs the selection has none of', () => {
        assert.deepEqual(
            studyViewResourceTabs(
                [tab('HE', 10, 5, 10), tab('MXIF', 4, 4, 0)],
                [tab('MXIF', 1, 1, 0)]
            ),
            [tab('MXIF', 1, 1, 0)]
        );
    });
});
