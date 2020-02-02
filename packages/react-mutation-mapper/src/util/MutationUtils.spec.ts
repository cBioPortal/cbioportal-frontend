import { assert } from 'chai';

import { Mutation } from '../model/Mutation';
import {
    countMutationsByProteinChange,
    groupMutationsByProteinStartPos,
    mutationTypeSort,
    getColorForProteinImpactType,
    extractGenomicLocation,
    genomicLocationString,
    uniqueGenomicLocations,
    MUT_COLOR_MISSENSE,
    MUT_COLOR_TRUNC,
} from './MutationUtils';
import { CanonicalMutationType } from 'cbioportal-frontend-commons';
import { GenomicLocation } from '../model/CancerHotspot';

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

    describe('groupMutationsByProteinStartPos', () => {
        it('returns an empty object when there are no mutations', () => {
            assert.deepEqual(
                groupMutationsByProteinStartPos([]),
                {},
                'no mutations for an empty input'
            );
        });

        it('groups mutations by protein start position', () => {
            const mutationCountByProteinChange = groupMutationsByProteinStartPos(
                mutationsToCount
            );

            assert.equal(
                mutationCountByProteinChange['66'].length,
                5,
                'there should be 5 mutations at posititon 66'
            );

            assert.equal(
                mutationCountByProteinChange['666'].length,
                2,
                'there should be 2 mutations at posititon 666'
            );

            assert.deepEqual(
                mutationCountByProteinChange['666'][0],
                { proteinPosStart: 666, proteinChange: 'D666C' },
                'first mutation at pos 666 should be D666C'
            );
            assert.deepEqual(
                mutationCountByProteinChange['666'][1],
                { proteinPosStart: 666, proteinChange: 'D666F' },
                'second mutation at pos 666 should be D666F'
            );
        });
    });

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

    describe('extractGenomicLocation', () => {
        it('extracts genomic location', () => {
            let mutation0: Partial<Mutation> = {
                chromosome: 'chr1',
                startPosition: 100,
                endPosition: 200,
                referenceAllele: 'C',
                variantAllele: 'G',
            };
            assert.deepEqual(
                extractGenomicLocation(mutation0),
                {
                    chromosome: '1',
                    start: 100,
                    end: 200,
                    referenceAllele: 'C',
                    variantAllele: 'G',
                },
                'chr1 should be converted to 1'
            );
        });
    });

    describe('genomicLocationString', () => {
        it('extract genomic location', () => {
            let genomicLocation: GenomicLocation = {
                chromosome: '1',
                start: 100,
                end: 100,
                referenceAllele: 'C',
                variantAllele: 'G',
            };
            assert.equal(
                genomicLocationString(genomicLocation),
                '1,100,100,C,G',
                'genomic location string should be:  1,100,100,C,G'
            );
        });
    });

    describe('uniqueGenomicLocations', () => {
        //  These three mutations should map to only two genomic locations
        let mutationList: Partial<Mutation>[] = [
            {
                chromosome: 'chr1',
                startPosition: 100,
                endPosition: 200,
                referenceAllele: 'C',
                variantAllele: 'G',
            },
            {
                chromosome: 'chr1',
                startPosition: 100,
                endPosition: 200,
                referenceAllele: 'C',
                variantAllele: 'G',
            },
            {
                chromosome: 'chr2',
                startPosition: 200,
                endPosition: 300,
                referenceAllele: 'C',
                variantAllele: 'G',
            },
        ];
        it('extract unique genomic locations', () => {
            let genomicLocations = uniqueGenomicLocations(mutationList);
            assert.equal(
                genomicLocations.length,
                2,
                'return value should indicate only 2 unique genomic locations'
            );
            assert.equal(
                genomicLocations[0].chromosome,
                '1',
                'zeroeth genomic location should map to chr1'
            );
            assert.equal(
                genomicLocations[1].chromosome,
                '2',
                'first genomic location should map to chr2'
            );
        });
    });
});
