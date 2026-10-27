import { assert } from 'chai';

import { collectLevelSummaries } from './OncoKbTrackTooltip';

describe('OncoKbTrackTooltip', () => {
    describe('missing fields in the OncoKB response', () => {
        const indicatorWithTreatments = {
            query: { germline: false },
            treatments: [
                {
                    level: 'LEVEL_1',
                    levelAssociatedCancerType: { name: 'Melanoma' },
                },
            ],
        } as any;

        it('ignores an indicator without treatments and keeps the others', () => {
            const summaries = collectLevelSummaries([
                { query: { germline: false } } as any,
                indicatorWithTreatments,
            ]);

            assert.deepEqual(summaries.sensitive, {
                level: '1',
                cancerTypes: ['Melanoma'],
            });
        });

        it('still summarizes levels when treatments are populated', () => {
            const summaries = collectLevelSummaries([indicatorWithTreatments]);

            assert.deepEqual(summaries.sensitive, {
                level: '1',
                cancerTypes: ['Melanoma'],
            });
            assert.isUndefined(summaries.resistance);
        });
    });
});
