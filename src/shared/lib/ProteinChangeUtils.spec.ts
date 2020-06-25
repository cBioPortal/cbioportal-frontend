import { initMutation } from 'test/MutationMockUtils';
import { Mutation } from 'cbioportal-ts-api-client';
import { assert } from 'chai';
import {
    getProteinChangeData,
    shouldShowWarningForProteinChangeDifference,
} from './ProteinChangeUtils';
import {
    extractGenomicLocation,
    genomicLocationString,
} from 'cbioportal-utils';
import { VariantAnnotation } from 'genome-nexus-ts-api-client';

describe('ProteinChangeUtils', () => {
    let mutationFromDatabase: Mutation[];
    let mutationWithDifferentProteinchange: Mutation[];
    let mutationWithNoProteinchange: Mutation[];
    let fusionMutation: Mutation[];

    let genomicLocation:
        | {
              chromosome: string;
              start: number;
              end: number;
              referenceAllele: string;
              variantAllele: string;
          }
        | undefined;
    let genomicLocationByString: string;

    before(() => {
        mutationFromDatabase = [
            initMutation({
                sampleId: 'sample1',
                patientId: 'P1',
                gene: {
                    hugoGeneSymbol: 'TP53',
                },
                proteinPosStart: 666,
                proteinChange: 'D666F',
                chr: '7',
                startPosition: 123456,
                endPosition: 123456,
                variantAllele: 'T',
                referenceAllele: 'A',
            }),
        ];

        mutationWithDifferentProteinchange = [
            initMutation({
                sampleId: 'sample2',
                patientId: 'P2',
                gene: {
                    hugoGeneSymbol: 'TP53',
                },
                proteinPosStart: 666,
                proteinChange: 'SOMEPROTEINCHANGE',
                chromosome: '7',
                startPosition: 123456,
                endPosition: 123456,
                variantAllele: 'T',
                referenceAllele: 'A',
            }),
        ];

        mutationWithNoProteinchange = [
            initMutation({
                sampleId: 'sample3',
                patientId: 'P3',
                gene: {
                    hugoGeneSymbol: 'TP53',
                },
                proteinPosStart: 666,
                proteinChange: '',
                chr: '7',
                startPosition: 123456,
                endPosition: 123456,
                variantAllele: 'T',
                referenceAllele: 'A',
            }),
        ];

        fusionMutation = [
            initMutation({
                sampleId: 'sample3',
                patientId: 'P3',
                gene: {
                    hugoGeneSymbol: 'TP53',
                },
                proteinPosStart: 666,
                proteinChange: 'D666',
                chr: '7',
                startPosition: 123456,
                endPosition: 123456,
                variantAllele: 'T',
                referenceAllele: 'A',
                mutationType: 'Fusion',
            }),
        ];

        genomicLocation = extractGenomicLocation(mutationFromDatabase[0]);
        genomicLocationByString = genomicLocationString(genomicLocation!);
    });

    describe('getProteinChangeData', () => {
        it('if GN does not have data, show protein change from database', () => {
            const indexedNoGNMutation: {
                [genomicLocation: string]: Mutation;
            } = {};
            assert.equal(
                getProteinChangeData(
                    mutationFromDatabase[0],
                    indexedNoGNMutation,
                    true
                ),
                mutationFromDatabase[0].proteinChange
            );
            assert.equal(
                getProteinChangeData(
                    mutationFromDatabase[0],
                    indexedNoGNMutation,
                    false
                ),
                mutationFromDatabase[0].proteinChange
            );
        });

        it('if protein change differs in GN and database, show database result for canonical transcript and GN result for non-canonical transcript', () => {
            const indexedMutationWithDifferentProteinchange: {
                [genomicLocation: string]: Mutation;
            } = {};
            indexedMutationWithDifferentProteinchange[genomicLocationByString] =
                mutationWithDifferentProteinchange[0];
            assert.equal(
                getProteinChangeData(
                    mutationFromDatabase[0],
                    indexedMutationWithDifferentProteinchange,
                    true
                ),
                mutationFromDatabase[0].proteinChange
            );
            assert.equal(
                getProteinChangeData(
                    mutationFromDatabase[0],
                    indexedMutationWithDifferentProteinchange,
                    false
                ),
                mutationWithDifferentProteinchange[0].proteinChange
            );
        });

        it('if no protein change differs in GN, show database result for canonical transcript and GN result for non-canonical transcript', () => {
            const indexedMutationWithNoProteinchange: {
                [genomicLocation: string]: Mutation;
            } = {};
            indexedMutationWithNoProteinchange[genomicLocationByString] =
                mutationWithNoProteinchange[0];
            assert.equal(
                getProteinChangeData(
                    mutationFromDatabase[0],
                    indexedMutationWithNoProteinchange,
                    true
                ),
                mutationFromDatabase[0].proteinChange
            );
            assert.equal(
                getProteinChangeData(
                    mutationFromDatabase[0],
                    indexedMutationWithNoProteinchange,
                    false
                ),
                mutationWithNoProteinchange[0].proteinChange
            );
        });
    });

    describe('shouldShowWarningForProteinChangeDifference', () => {
        it('should show warning for protien change difference', () => {
            const indexedMutationFromDatabase: {
                [genomicLocation: string]: Mutation;
            } = {};
            indexedMutationFromDatabase[genomicLocationByString] =
                mutationFromDatabase[0];

            const indexedVariantAnnotations: {
                [genomicLocation: string]: VariantAnnotation;
            } = {};

            assert.equal(
                shouldShowWarningForProteinChangeDifference(
                    mutationFromDatabase[0],
                    indexedMutationFromDatabase,
                    indexedVariantAnnotations
                ),
                true
            );
        });

        it('do not show warning for "Fusion" mutation', () => {
            const indexedFusionMutation: {
                [genomicLocation: string]: Mutation;
            } = {};
            indexedFusionMutation[genomicLocationByString] = fusionMutation[0];

            const indexedVariantAnnotations: {
                [genomicLocation: string]: VariantAnnotation;
            } = {};

            assert.equal(
                shouldShowWarningForProteinChangeDifference(
                    fusionMutation[0],
                    indexedFusionMutation,
                    indexedVariantAnnotations
                ),
                false
            );
        });
    });

    after(() => {});
});
