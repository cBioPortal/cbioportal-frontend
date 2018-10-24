import {
    somaticMutationRate,
    germlineMutationRate,
    countUniqueMutations,
    groupMutationsByGeneAndPatientAndProteinChange,
    countDuplicateMutations,
    uniqueGenomicLocations,
    updateMissingGeneInfo,
    isValidGenomicLocation,
    genomicLocationString,
    generateHgvsgByMutation,
    hasASCNProperty,
} from './MutationUtils';
import { assert } from 'chai';
import { Gene, MolecularProfile, Mutation } from 'cbioportal-ts-api-client';
import { initMutation } from 'test/MutationMockUtils';
import { MUTATION_STATUS_GERMLINE } from 'shared/constants';
import { GenomicLocation } from 'genome-nexus-ts-api-client';

describe('MutationUtils', () => {
    let somaticMutations: Mutation[];
    let germlineMutations: Mutation[];
    let molecularProfileIdToMolecularProfile: {
        [molecularProfileId: string]: MolecularProfile;
    };
    let mutationsToCount: Mutation[];

    before(() => {
        molecularProfileIdToMolecularProfile = {
            GP1: {
                studyId: 'STUDY1',
            } as MolecularProfile,
        };
        somaticMutations = [
            initMutation({
                // mutation
                sampleId: 'PATIENT1',
                gene: {
                    hugoGeneSymbol: 'TP53',
                },
                molecularProfileId: 'GP1',
            }),
            initMutation({
                // mutation in same gene, same patient
                sampleId: 'PATIENT1',
                gene: {
                    hugoGeneSymbol: 'TP53',
                },
                molecularProfileId: 'GP1',
            }),
            initMutation({
                // mutation in same patient different gene
                sampleId: 'PATIENT2',
                gene: {
                    hugoGeneSymbol: 'PIK3CA',
                },
                molecularProfileId: 'GP1',
            }),
        ];
        germlineMutations = [
            initMutation({
                // mutation
                sampleId: 'PATIENT1',
                gene: {
                    hugoGeneSymbol: 'TP53',
                },
                mutationStatus: MUTATION_STATUS_GERMLINE,
                molecularProfileId: 'GP1',
            }),
            initMutation({
                // mutation in same gene, same patient
                sampleId: 'PATIENT1',
                gene: {
                    hugoGeneSymbol: 'BRCA1',
                },
                mutationStatus: MUTATION_STATUS_GERMLINE,
                molecularProfileId: 'GP1',
            }),
            initMutation({
                // mutation in same patient different gene
                sampleId: 'PATIENT2',
                gene: {
                    hugoGeneSymbol: 'BRCA2',
                },
                mutationStatus: MUTATION_STATUS_GERMLINE,
                molecularProfileId: 'GP1',
            }),
        ];
        mutationsToCount = [
            initMutation({
                // mutation
                sampleId: 'P1_sample1',
                patientId: 'P1',
                gene: {
                    hugoGeneSymbol: 'TP53',
                },
                proteinPosStart: 66,
                proteinChange: 'D66B',
            }),
            initMutation({
                // mutation
                sampleId: 'P1_sample2',
                patientId: 'P1',
                gene: {
                    hugoGeneSymbol: 'TP53',
                },
                proteinPosStart: 66,
                proteinChange: 'D66B',
            }),
            initMutation({
                // mutation
                sampleId: 'P2_sample1',
                patientId: 'P2',
                gene: {
                    hugoGeneSymbol: 'TP53',
                },
                proteinPosStart: 66,
                proteinChange: 'D66B',
            }),
            initMutation({
                // mutation
                sampleId: 'P2_sample2',
                patientId: 'P2',
                gene: {
                    hugoGeneSymbol: 'TP53',
                },
                proteinPosStart: 66,
                proteinChange: 'D66B',
            }),
            initMutation({
                // mutation
                sampleId: 'P3_sample1',
                patientId: 'P3',
                gene: {
                    hugoGeneSymbol: 'TP53',
                },
                proteinPosStart: 66,
                proteinChange: 'D66B',
            }),
            initMutation({
                // mutation
                sampleId: 'P4_sample1',
                patientId: 'P4',
                gene: {
                    hugoGeneSymbol: 'TP53',
                },
                proteinPosStart: 666,
                proteinChange: 'D666C',
            }),
            initMutation({
                // mutation
                sampleId: 'P4_sample2',
                patientId: 'P4',
                gene: {
                    hugoGeneSymbol: 'TP53',
                },
                proteinPosStart: 666,
                proteinChange: 'D666F',
            }),
        ];
    });

    describe('groupMutationsByGeneAndPatientAndProteinChange', () => {
        it('groups mutations correctly by gene, patient, and protein change', () => {
            const grouped = groupMutationsByGeneAndPatientAndProteinChange(
                mutationsToCount
            );

            assert.equal(
                grouped['TP53_P1_D66B'].length,
                2,
                'There should be 2 mutations for TP53_P1_D66B'
            );
            assert.equal(
                grouped['TP53_P2_D66B'].length,
                2,
                'There should be 2 mutations for TP53_P2_D66B'
            );
            assert.equal(
                grouped['TP53_P3_D66B'].length,
                1,
                'There should be 1 mutation for TP53_P3_D66B'
            );
            assert.equal(
                grouped['TP53_P4_D666C'].length,
                1,
                'There should be 1 mutation for TP53_P4_D666C'
            );
            assert.equal(
                grouped['TP53_P4_D666F'].length,
                1,
                'There should be 1 mutation for TP53_P4_D666F'
            );
        });
    });

    describe('countUniqueMutations', () => {
        it('counts unique mutations as zero when there are no mutations', () => {
            assert.equal(
                countUniqueMutations([]),
                0,
                'total number of unique mutations should be 0'
            );
        });

        it('counts unique mutations correctly', () => {
            const count = countUniqueMutations(mutationsToCount);

            assert.equal(
                count,
                5,
                'total number of unique mutations should be 5'
            );
        });
    });

    describe('countDuplicateMutations', () => {
        it('counts duplicate mutations as zero when there are no mutations', () => {
            assert.equal(
                countDuplicateMutations({}),
                0,
                'total number of duplicate mutations should be 0'
            );
        });

        it('counts duplicates correctly for mutations grouped by patients', () => {
            const grouped = groupMutationsByGeneAndPatientAndProteinChange(
                mutationsToCount
            );
            const count = countDuplicateMutations(grouped);

            assert.equal(
                count,
                2,
                'total number of duplicate mutations should be 2'
            );
        });
    });

    describe('somaticMutationRate', () => {
        it('calculates rate correctly', () => {
            // only one of the patients has a TP53 mutation
            let result: number = somaticMutationRate(
                'TP53',
                somaticMutations,
                molecularProfileIdToMolecularProfile,
                [
                    { studyId: 'STUDY1', sampleId: 'PATIENT1' },
                    { studyId: 'STUDY1', sampleId: 'PATIENT2' },
                ]
            );
            assert.equal(result, 50);

            // No non-existing gene mutations
            result = somaticMutationRate(
                'NASDASFASG',
                somaticMutations,
                molecularProfileIdToMolecularProfile,
                [
                    { studyId: 'STUDY1', sampleId: 'PATIENT1' },
                    { studyId: 'STUDY1', sampleId: 'PATIENT2' },
                ]
            );
            assert.equal(result, 0);

            // when nr of given patientIds is 1 it should give 100% (not sure if
            // this should be an error instead)
            result = somaticMutationRate(
                'PIK3CA',
                somaticMutations,
                molecularProfileIdToMolecularProfile,
                [{ studyId: 'STUDY1', sampleId: 'PATIENT2' }]
            );
            assert.equal(result, 100);

            // germline mutations should be ignored
            result = somaticMutationRate(
                'BRCA1',
                somaticMutations.concat(germlineMutations),
                molecularProfileIdToMolecularProfile,
                [{ studyId: 'STUDY1', sampleId: 'PATIENT2' }]
            );
            assert.equal(result, 0);

            // ignore all mutations for non existent patient id
            result = somaticMutationRate(
                'PIK3CA',
                somaticMutations,
                molecularProfileIdToMolecularProfile,
                [{ studyId: 'STUDY1', sampleId: 'XXXX' }]
            );
            assert.equal(result, 0);
        });
    });

    describe('germlineMutationRate', () => {
        it('calculates rate correctly', () => {
            // only half of patients have BRCA1 mutation
            let result: number = germlineMutationRate(
                'BRCA1',
                germlineMutations,
                molecularProfileIdToMolecularProfile,
                [
                    { studyId: 'STUDY1', sampleId: 'PATIENT1' },
                    { studyId: 'STUDY1', sampleId: 'PATIENT2' },
                ]
            );
            assert.equal(result, 50);

            // somatic mutations should be ignored
            result = germlineMutationRate(
                'PIK3CA',
                germlineMutations.concat(somaticMutations),
                molecularProfileIdToMolecularProfile,
                [
                    { studyId: 'STUDY1', sampleId: 'PATIENT1' },
                    { studyId: 'STUDY1', sampleId: 'PATIENT2' },
                ]
            );
            assert.equal(result, 0);

            // ignore all mutations for non existent patient id
            result = germlineMutationRate(
                'BRCA2',
                germlineMutations,
                molecularProfileIdToMolecularProfile,
                [{ studyId: 'STUDY1', sampleId: 'XXXX' }]
            );
            assert.equal(result, 0);

            // No non-existing gene mutations
            result = germlineMutationRate(
                'NASDASFASG',
                germlineMutations,
                molecularProfileIdToMolecularProfile,
                [
                    { studyId: 'STUDY1', sampleId: 'PATIENT1' },
                    { studyId: 'STUDY1', sampleId: 'PATIENT2' },
                ]
            );
            assert.equal(result, 0);
        });
    });

    describe('uniqueGenomicLocations', () => {
        it('extracts unique genomic locations', () => {
            const mutations = [
                initMutation({
                    chr: '7',
                    startPosition: 111,
                    endPosition: 111,
                    referenceAllele: 'T',
                    variantAllele: 'C',
                }),
                initMutation({
                    chr: '7',
                    startPosition: 111,
                    endPosition: 111,
                    referenceAllele: 'T',
                    variantAllele: 'C',
                }),
                initMutation({
                    chr: '17',
                    startPosition: 66,
                    endPosition: 66,
                    referenceAllele: 'T',
                    variantAllele: 'A',
                }),
                initMutation({
                    chr: '17',
                    startPosition: 66,
                    endPosition: 66,
                    referenceAllele: 'T',
                    variantAllele: 'A',
                }),
                initMutation({
                    chr: '4',
                    startPosition: 11,
                    endPosition: 11,
                    referenceAllele: '-',
                    variantAllele: 'G',
                }),
            ];

            const genomicLocations = uniqueGenomicLocations(mutations);

            assert.equal(
                genomicLocations.length,
                3,
                'Duplicate genomic locations should be removed (5 - 2 = 3)'
            );
        });
    });

    describe('updateMissingGeneInfo', () => {
        const genesByHugoSymbol: { [hugoGeneSymbol: string]: Gene } = {
            AR: {
                geneticEntityId: 310,
                entrezGeneId: 367,
                hugoGeneSymbol: 'AR',
                type: 'protein-coding',
            },
            BRCA1: {
                geneticEntityId: 553,
                entrezGeneId: 672,
                hugoGeneSymbol: 'BRCA1',
                type: 'protein-coding',
            },
            BRCA2: {
                geneticEntityId: 555,
                entrezGeneId: 675,
                hugoGeneSymbol: 'BRCA2',
                type: 'protein-coding',
            },
        };

        it('adds missing gene information for the mutations', () => {
            const mutations = [
                {
                    gene: {
                        hugoGeneSymbol: 'AR',
                    },
                    proteinChange: 'L729I',
                },
                {
                    gene: {
                        hugoGeneSymbol: 'BRCA1',
                    },
                    proteinChange: 'C47W',
                },
                {
                    gene: {
                        hugoGeneSymbol: 'BRCA2',
                    },
                    entrezGeneId: undefined,
                    aminoAcidChange: 'R2842C',
                },
            ];

            updateMissingGeneInfo(
                mutations as Partial<Mutation>[],
                genesByHugoSymbol
            );

            assert.deepEqual(mutations[0].gene, genesByHugoSymbol['AR']);
            assert.equal(
                mutations[0].entrezGeneId,
                genesByHugoSymbol['AR'].entrezGeneId
            );
            assert.deepEqual(mutations[1].gene, genesByHugoSymbol['BRCA1']);
            assert.equal(
                mutations[1].entrezGeneId,
                genesByHugoSymbol['BRCA1'].entrezGeneId
            );
            assert.deepEqual(mutations[2].gene, genesByHugoSymbol['BRCA2']);
            assert.equal(
                mutations[2].entrezGeneId,
                genesByHugoSymbol['BRCA2'].entrezGeneId
            );
        });

        it('should not overwrite existing gene information', () => {
            const mutations = [
                {
                    gene: {
                        hugoGeneSymbol: 'AR',
                        entrezGeneId: -1,
                    },
                    entrezGeneId: -1,
                },
            ];

            updateMissingGeneInfo(
                mutations as Partial<Mutation>[],
                genesByHugoSymbol
            );

            assert.notEqual(
                mutations[0].entrezGeneId,
                genesByHugoSymbol['AR'].entrezGeneId
            );
            assert.notEqual(
                mutations[0].gene.entrezGeneId,
                genesByHugoSymbol['AR'].entrezGeneId
            );
        });
    });

    describe('generate genomic location string', () => {
        const genomicLocation: GenomicLocation[] = [
            {
                // chromosome is X
                chromosome: 'X',
                start: 47836189,
                end: 47836189,
                referenceAllele: 'C',
                variantAllele: 'G',
            },
            {
                // chromosome is Y
                chromosome: 'Y',
                start: 24089764,
                end: 24089764,
                referenceAllele: 'T',
                variantAllele: 'G',
            },
            {
                // chromosome is x
                chromosome: 'x',
                start: 153694368,
                end: 153694368,
                referenceAllele: 'C',
                variantAllele: 'T',
            },
            {
                // chromosome is y
                chromosome: 'y',
                start: 152057792,
                end: 152057792,
                referenceAllele: 'C',
                variantAllele: 'G',
            },
        ];

        it('match chorosome X and Y to 23 and 24', () => {
            assert.equal(
                '23,47836189,47836189,C,G',
                genomicLocationString(genomicLocation[0]),
                'should ocnver X to 23'
            );
            assert.equal(
                '24,24089764,24089764,T,G',
                genomicLocationString(genomicLocation[1]),
                'should ocnver Y to 24'
            );
            assert.equal(
                '23,153694368,153694368,C,T',
                genomicLocationString(genomicLocation[2]),
                'should ocnver x to 23'
            );
            assert.equal(
                '24,152057792,152057792,C,G',
                genomicLocationString(genomicLocation[3]),
                'should ocnver y to 24'
            );
        });
    });

    describe('generate Hgvsg by mutation', () => {
        it('has valid genomic location', () => {
            const validateMutations: Partial<Mutation>[] = [
                {
                    // valid
                    chr: 'X',
                    startPosition: 47836189,
                    endPosition: 47836189,
                    referenceAllele: 'C',
                    variantAllele: 'G',
                },
                {
                    // invalid allele, referenceAllele = "NA"
                    chr: '17',
                    startPosition: 7574030,
                    endPosition: 7574030,
                    referenceAllele: 'NA',
                    variantAllele: 'G',
                },
                {
                    // invalid allele, both referenceAllele and variantAllele are "-"
                    chr: '17',
                    startPosition: 7577498,
                    endPosition: 7577498,
                    referenceAllele: '-',
                    variantAllele: '-',
                },
                {
                    // invalid allele, referenceAllele is empty
                    chr: '17',
                    startPosition: 7577498,
                    endPosition: 7577498,
                    referenceAllele: '',
                    variantAllele: '-',
                },
                {
                    // invalid position, startPosition is -1
                    chr: '17',
                    startPosition: -1,
                    endPosition: 7664673,
                    referenceAllele: 'G',
                    variantAllele: 'C',
                },
                {
                    // invalid, missing chr
                    chr: '',
                    startPosition: 7577594,
                    endPosition: 7577595,
                    referenceAllele: 'AC',
                    variantAllele: '-',
                },
            ];

            assert.equal(
                true,
                isValidGenomicLocation(validateMutations[0]),
                'should be valid genomic location'
            );
            assert.equal(
                false,
                isValidGenomicLocation(validateMutations[1]),
                'should be invalid allele, referenceAllele = NA'
            );
            assert.equal(
                false,
                isValidGenomicLocation(validateMutations[2]),
                'should be invalid allele, both referenceAllele and variantAllele are -'
            );
            assert.equal(
                false,
                isValidGenomicLocation(validateMutations[3]),
                'should be invalid allele, referenceAllele is empty'
            );
            assert.equal(
                false,
                isValidGenomicLocation(validateMutations[4]),
                'should be invalid position, startPosition is -1'
            );
            assert.equal(
                false,
                isValidGenomicLocation(validateMutations[5]),
                'should be invalid, missing chr'
            );
        });

        it('generate substitution hgvsg', () => {
            const substitutionMutation: Partial<Mutation>[] = [
                {
                    // substitution
                    chr: '17',
                    startPosition: 7577121,
                    endPosition: 7577121,
                    referenceAllele: 'G',
                    variantAllele: 'A',
                },
            ];

            assert.equal(
                '17:g.7577121G>A',
                generateHgvsgByMutation(substitutionMutation[0]),
                'the hgvsg should be 17:g.7577121G>A'
            );
        });

        it('generate insertion hgvsg', () => {
            const insertionMutations: Partial<Mutation>[] = [
                {
                    // ins, length of variantAllele > 1
                    chr: '17',
                    startPosition: 7579590,
                    endPosition: 7579591,
                    referenceAllele: '-',
                    variantAllele: 'CT',
                },
                {
                    // ins, length of variantAllele = 1
                    chr: '17',
                    startPosition: 3637855,
                    endPosition: 3637856,
                    referenceAllele: '-',
                    variantAllele: 'C',
                },
            ];

            assert.equal(
                '17:g.7579590_7579591insCT',
                generateHgvsgByMutation(insertionMutations[0]),
                'should be insertion 17:g.7579590_7579591insCT: (chr):g.(start)_(end)ins(var)'
            );
            assert.equal(
                '17:g.3637855_3637856insC',
                generateHgvsgByMutation(insertionMutations[1]),
                'should be insertion 17:g.3637855_3637856insC: (chr):g.(start)_(end)ins(var)'
            );
        });

        it('generate deletion hgvsg', () => {
            const deletionMutations: Partial<Mutation>[] = [
                {
                    // del, length of referenceAllele = 1
                    chr: '17',
                    startPosition: 7574030,
                    endPosition: 7574030,
                    referenceAllele: 'G',
                    variantAllele: '-',
                },
                {
                    // del, length of referenceAllele > 1
                    chr: '17',
                    startPosition: 7577594,
                    endPosition: 7577595,
                    referenceAllele: 'AC',
                    variantAllele: '-',
                },
            ];

            assert.equal(
                '17:g.7574030del',
                generateHgvsgByMutation(deletionMutations[0]),
                'should be deletion 17:g.7574030del: (chr):g.(start)del'
            );
            assert.equal(
                '17:g.7577594_7577595del',
                generateHgvsgByMutation(deletionMutations[1]),
                'should be deletion 17:g.7577594_7577595del: (chr):g.(start)_(end)del'
            );
        });

        it('generate delins hgvsg', () => {
            const delinsMutations: Partial<Mutation>[] = [
                {
                    // delins, length of variantAllele = 1
                    chr: '17',
                    startPosition: 7573443,
                    endPosition: 7573443,
                    referenceAllele: 'C',
                    variantAllele: 'TGG',
                },
                {
                    // delins, length of variantAllele > 1
                    chr: '17',
                    startPosition: 7578205,
                    endPosition: 7578207,
                    referenceAllele: 'CTA',
                    variantAllele: 'TTT',
                },
            ];

            assert.equal(
                '17:g.7573443delinsTGG',
                generateHgvsgByMutation(delinsMutations[0]),
                'should be delins 17:g.7573443delinsTGG: (chr):g.(start)delins(var)'
            );
            assert.equal(
                '17:g.7578205_7578207delinsTTT',
                generateHgvsgByMutation(delinsMutations[1]),
                'should be delins 17:g.7578205_7578207delinsTTT: (chr):g.(start)_(end)delins(var)'
            );
        });
    });

    describe('hasASCNProperty', () => {
        const mutationWithASCNProperty = {
            // mutation
            sampleId: 'P1_sample1',
            alleleSpecificCopyNumber: {
                ascnMethod: 'FACETS',
            },
        };
        const mutationWithoutASCNProperty = {
            // mutation
            sampleId: 'P1_sample1',
            alleleSpecificCopyNumber: {
                totalCopyNumber: 4,
            },
        };
        const mutationWithoutASCN = {
            // mutation
            sampleId: 'P1_sample1',
        };

        it('checks if mutation has allele specific copy number and specified sub-property', () => {
            const hasASCNMethod = hasASCNProperty(
                mutationWithASCNProperty,
                'ascnMethod'
            );
            const missingASCNMethod = hasASCNProperty(
                mutationWithoutASCNProperty,
                'ascnMethod'
            );
            const missingASCN = hasASCNProperty(
                mutationWithoutASCN,
                'ascnMethod'
            );

            assert.isTrue(
                hasASCNMethod,
                'hasASCNProperty() returned false, should be true.'
            );
            assert.isFalse(
                missingASCNMethod,
                'hasASCNProperty() returned true, should be false.'
            );
            assert.isFalse(
                missingASCN,
                'hasASCNProperty() returned true, should be false.'
            );
        });
    });
});
