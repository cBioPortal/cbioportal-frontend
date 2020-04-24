import { assert } from 'chai';

import { CanonicalMutationType } from 'cbioportal-frontend-commons';
import { Mutation } from 'cbioportal-utils';

import {
    mutationTypeSort,
    getColorForProteinImpactType,
    MUT_COLOR_MISSENSE,
    MUT_COLOR_TRUNC,
} from './MutationTypeUtils';

describe('MutationTypeUtils', () => {
    describe('mutationTypeSort', () => {
        it('sorts mutation types', () => {
            assert.equal(
                mutationTypeSort(
                    CanonicalMutationType.MISSENSE,
                    CanonicalMutationType.NONSENSE
                ),
                -1,
                'return value should be -1, indicating correct priority ordering'
            );
            assert.equal(
                mutationTypeSort(
                    CanonicalMutationType.NONSENSE,
                    CanonicalMutationType.MISSENSE
                ),
                1,
                'return value should be 1, indicating correct priority ordering'
            );
            assert.equal(
                mutationTypeSort(
                    CanonicalMutationType.MISSENSE,
                    CanonicalMutationType.SILENT
                ),
                -1,
                'return value should be -1, indicating correct priority ordering'
            );
        });
    });

    describe('getColorForProteinImpactType', () => {
        it('gets color for protein imact type', () => {
            let mutationList0: Partial<Mutation>[];
            let mutationList1: Partial<Mutation>[];
            //  List of Mostly Missense Mutations
            mutationList0 = [
                {
                    mutationType: CanonicalMutationType.MISSENSE,
                },
                {
                    mutationType: CanonicalMutationType.MISSENSE,
                },
                {
                    mutationType: CanonicalMutationType.TRUNCATING,
                },
            ];
            // List of Mostly Truncating Mutations
            mutationList1 = [
                {
                    mutationType: CanonicalMutationType.MISSENSE,
                },
                {
                    mutationType: CanonicalMutationType.TRUNCATING,
                },
                {
                    mutationType: CanonicalMutationType.TRUNCATING,
                },
            ];
            assert.equal(
                getColorForProteinImpactType(mutationList0),
                MUT_COLOR_MISSENSE,
                'return color should be set to MUT_COLOR_MISSENSE'
            );
            assert.equal(
                getColorForProteinImpactType(mutationList1),
                MUT_COLOR_TRUNC,
                'return color should be set to MUT_COLOR_TRUNC'
            );
        });
    });
});
