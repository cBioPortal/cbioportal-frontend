import { assert } from 'chai';

import { Mutation } from '../model/Mutation';
import { countMutationsByProteinChange } from './MutationUtils';

describe('MutationUtils', () => {
    let mutationsToCount: Mutation[];

    beforeAll(() => {
        mutationsToCount = [
            {
                proteinPosStart: 66,
                proteinChange: 'D66B',
            },
            {
                proteinPosStart: 66,
                proteinChange: 'D66B',
            },
            {
                proteinPosStart: 66,
                proteinChange: 'D66B',
            },
            {
                proteinPosStart: 66,
                proteinChange: 'D66B',
            },
            {
                proteinPosStart: 66,
                proteinChange: 'D66B',
            },
            {
                proteinPosStart: 666,
                proteinChange: 'D666C',
            },
            {
                proteinPosStart: 666,
                proteinChange: 'D666F',
            },
        ];
    });

    describe('countMutationsByProteinChange', () => {
        it('returns an empty array when there are no mutations', () => {
            assert.equal(
                countMutationsByProteinChange([]).length,
                0,
                'no mutation count for an empty input'
            );
        });

        it('counts and sorts mutations by protein change values', () => {
            const mutationCountByProteinChange = countMutationsByProteinChange(
                mutationsToCount
            );

            assert.equal(
                mutationCountByProteinChange.length,
                3,
                'there should be 3 unique protein change values'
            );

            assert.deepEqual(
                mutationCountByProteinChange[0],
                { proteinChange: 'D66B', count: 5 },
                'first protein change should be D66B with 5 count'
            );

            assert.deepEqual(
                mutationCountByProteinChange[1],
                { proteinChange: 'D666C', count: 1 },
                'second protein change should be D666C with 1 count'
            );

            assert.deepEqual(
                mutationCountByProteinChange[2],
                { proteinChange: 'D666F', count: 1 },
                'third protein change should be D666F with 1 count'
            );
        });
    });
});
