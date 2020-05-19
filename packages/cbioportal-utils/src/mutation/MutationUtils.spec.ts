import { assert } from 'chai';
import { GenomicLocation } from 'genome-nexus-ts-api-client';

import {
    countMutationsByProteinChange,
    groupMutationsByProteinStartPos,
    extractGenomicLocation,
    genomicLocationString,
    uniqueGenomicLocations,
    normalizeChromosome,
} from './MutationUtils';

import { Mutation } from '../model/Mutation';

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
        it('extracts genomic location', () => {
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
        it('normalizes chromosome and extracts genomic location', () => {
            let genomicLocation: GenomicLocation = {
                chromosome: '23',
                start: 100,
                end: 100,
                referenceAllele: 'C',
                variantAllele: 'G',
            };
            assert.equal(
                genomicLocationString(genomicLocation),
                'X,100,100,C,G',
                'genomic location string should be:  X,100,100,C,G'
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
