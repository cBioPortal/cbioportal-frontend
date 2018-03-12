import {
    somaticMutationRate, germlineMutationRate, countUniqueMutations, groupMutationsByGeneAndPatientAndProteinChange,
    countDuplicateMutations, uniqueGenomicLocations
} from "./MutationUtils";
import * as _ from 'lodash';
import { assert, expect } from 'chai';
import sinon from 'sinon';
import {MolecularProfile, Mutation} from "../api/generated/CBioPortalAPI";
import {initMutation} from "test/MutationMockUtils";
import { MUTATION_STATUS_GERMLINE } from "shared/constants";

describe('MutationUtils', () => {
    let somaticMutations: Mutation[];
    let germlineMutations: Mutation[];
    let molecularProfileIdToMolecularProfile:{[molecularProfileId:string]:MolecularProfile};
    let mutationsToCount: Mutation[];

    before(()=>{
        molecularProfileIdToMolecularProfile = {
            'GP1':{
                studyId: 'STUDY1'
            } as MolecularProfile
        };
        somaticMutations = [
            initMutation({ // mutation
                sampleId: "PATIENT1",
                gene: {
                    hugoGeneSymbol: "TP53",
                },
                molecularProfileId:"GP1"
             }),
            initMutation({ // mutation in same gene, same patient
                sampleId: "PATIENT1",
                gene: {
                    hugoGeneSymbol: "TP53",
                },
                molecularProfileId:"GP1"
             }),
            initMutation({ // mutation in same patient different gene
                sampleId: "PATIENT2",
                gene: {
                    hugoGeneSymbol: "PIK3CA",
                },
                molecularProfileId:"GP1"
             })
        ];
        germlineMutations = [
            initMutation({ // mutation
                sampleId: "PATIENT1",
                gene: {
                    hugoGeneSymbol: "TP53",
                },
                mutationStatus: MUTATION_STATUS_GERMLINE,
                molecularProfileId:"GP1"
             }),
            initMutation({ // mutation in same gene, same patient
                sampleId: "PATIENT1",
                gene: {
                    hugoGeneSymbol: "BRCA1",
                },
                mutationStatus: MUTATION_STATUS_GERMLINE,
                molecularProfileId:"GP1"
             }),
            initMutation({ // mutation in same patient different gene
                sampleId: "PATIENT2",
                gene: {
                    hugoGeneSymbol: "BRCA2",
                },
                mutationStatus: MUTATION_STATUS_GERMLINE,
                molecularProfileId:"GP1"
             })
        ];
        mutationsToCount = [
            initMutation({ // mutation
                sampleId: "P1_sample1",
                patientId: "P1",
                gene: {
                    hugoGeneSymbol: "TP53",
                },
                proteinPosStart: 66,
                proteinChange: "D66B"

            }),
            initMutation({ // mutation
                sampleId: "P1_sample2",
                patientId: "P1",
                gene: {
                    hugoGeneSymbol: "TP53",
                },
                proteinPosStart: 66,
                proteinChange: "D66B"
            }),
            initMutation({ // mutation
                sampleId: "P2_sample1",
                patientId: "P2",
                gene: {
                    hugoGeneSymbol: "TP53",
                },
                proteinPosStart: 66,
                proteinChange: "D66B"
            }),
            initMutation({ // mutation
                sampleId: "P2_sample2",
                patientId: "P2",
                gene: {
                    hugoGeneSymbol: "TP53",
                },
                proteinPosStart: 66,
                proteinChange: "D66B"
            }),
            initMutation({ // mutation
                sampleId: "P3_sample1",
                patientId: "P3",
                gene: {
                    hugoGeneSymbol: "TP53",
                },
                proteinPosStart: 66,
                proteinChange: "D66B"
            }),
            initMutation({ // mutation
                sampleId: "P4_sample1",
                patientId: "P4",
                gene: {
                    hugoGeneSymbol: "TP53",
                },
                proteinPosStart: 666,
                proteinChange: "D666C"
            }),
            initMutation({ // mutation
                sampleId: "P4_sample2",
                patientId: "P4",
                gene: {
                    hugoGeneSymbol: "TP53",
                },
                proteinPosStart: 666,
                proteinChange: "D666F"
            }),
        ];
    });

    describe('groupMutationsByGeneAndPatientAndProteinChange', () => {
        it("groups mutations correctly by gene, patient, and protein change", () => {
            const grouped = groupMutationsByGeneAndPatientAndProteinChange(mutationsToCount);

            assert.equal(grouped["TP53_P1_D66B"].length, 2,
                "There should be 2 mutations for TP53_P1_D66B");
            assert.equal(grouped["TP53_P2_D66B"].length, 2,
                "There should be 2 mutations for TP53_P2_D66B");
            assert.equal(grouped["TP53_P3_D66B"].length, 1,
                "There should be 1 mutation for TP53_P3_D66B");
            assert.equal(grouped["TP53_P4_D666C"].length, 1,
                "There should be 1 mutation for TP53_P4_D666C");
            assert.equal(grouped["TP53_P4_D666F"].length, 1,
                "There should be 1 mutation for TP53_P4_D666F");
        });
    });

    describe('countUniqueMutations', () => {
        it("counts unique mutations as zero when there are no mutations", () => {
            assert.equal(countUniqueMutations([]), 0,
                "total number of unique mutations should be 0");
        });

        it("counts unique mutations correctly", () => {
            const count = countUniqueMutations(mutationsToCount);

            assert.equal(count, 5,
                "total number of unique mutations should be 5");
        });
    });

    describe('countDuplicateMutations', () => {
        it("counts duplicate mutations as zero when there are no mutations", () => {
            assert.equal(countDuplicateMutations({}), 0,
                "total number of duplicate mutations should be 0");
        });

        it("counts duplicates correctly for mutations grouped by patients", () => {
            const grouped = groupMutationsByGeneAndPatientAndProteinChange(mutationsToCount);
            const count = countDuplicateMutations(grouped);

            assert.equal(count, 2,
                "total number of duplicate mutations should be 2");
        });
    });

    describe('somaticMutationRate', () => {
        it("calculates rate correctly", () => {
            // only one of the patients has a TP53 mutation
            let result:number = 
                somaticMutationRate(
                    "TP53",
                    somaticMutations,
                    molecularProfileIdToMolecularProfile,
                    [{studyId:'STUDY1', sampleId:'PATIENT1'}, {studyId:'STUDY1', sampleId:'PATIENT2'}]
                );
            assert.equal(result, 50);

            // No non-existing gene mutations
            result = 
                somaticMutationRate(
                    "NASDASFASG",
                    somaticMutations,
                    molecularProfileIdToMolecularProfile,
                    [{studyId:'STUDY1', sampleId:'PATIENT1'}, {studyId:'STUDY1', sampleId:'PATIENT2'}]
                );
            assert.equal(result, 0);

            // when nr of given patientIds is 1 it should give 100% (not sure if
            // this should be an error instead)
            result = 
                somaticMutationRate(
                    "PIK3CA",
                    somaticMutations,
                    molecularProfileIdToMolecularProfile,
                    [{studyId:'STUDY1', sampleId:'PATIENT2'}]
                );
            assert.equal(result, 100);

            // germline mutations should be ignored
            result = 
                somaticMutationRate(
                    "BRCA1",
                    somaticMutations.concat(germlineMutations),
                    molecularProfileIdToMolecularProfile,
                    [{studyId:'STUDY1', sampleId:'PATIENT2'}]
                );
            assert.equal(result, 0);

            // ignore all mutations for non existent patient id
            result = 
                somaticMutationRate(
                    "PIK3CA",
                    somaticMutations,
                    molecularProfileIdToMolecularProfile,
                    [{studyId:'STUDY1', sampleId:'XXXX'}]
                );
            assert.equal(result, 0);
        });
    });

    describe('germlineMutationRate', () => {
        it("calculates rate correctly", () => {
            // only half of patients have BRCA1 mutation
            let result:number =
                germlineMutationRate(
                    "BRCA1",
                    germlineMutations,
                    molecularProfileIdToMolecularProfile,
                    [{studyId:'STUDY1', sampleId:'PATIENT1'}, {studyId:'STUDY1', sampleId:'PATIENT2'}]
                );
            assert.equal(result, 50);

            // somatic mutations should be ignored
            result = 
                germlineMutationRate(
                    "PIK3CA",
                    germlineMutations.concat(somaticMutations),
                    molecularProfileIdToMolecularProfile,
                    [{studyId:'STUDY1', sampleId:'PATIENT1'}, {studyId:'STUDY1', sampleId:'PATIENT2'}]
                );
            assert.equal(result, 0);

            // ignore all mutations for non existent patient id
            result = 
                germlineMutationRate(
                    "BRCA2",
                    germlineMutations,
                    molecularProfileIdToMolecularProfile,
                    [{studyId:'STUDY1', sampleId:'XXXX'}]
                );
            assert.equal(result, 0);

            // No non-existing gene mutations
            result = 
                germlineMutationRate(
                    "NASDASFASG",
                    germlineMutations,
                    molecularProfileIdToMolecularProfile,
                    [{studyId:'STUDY1', sampleId:'PATIENT1'}, {studyId:'STUDY1', sampleId:'PATIENT2'}]
                );
            assert.equal(result, 0);
        });
    });

    describe('uniqueGenomicLocations', () => {
        it('extracts unique genomic locations', () => {
            const mutations = [
                initMutation({
                    gene: {
                        chromosome: "7"
                    },
                    startPosition: 111,
                    endPosition: 111,
                    referenceAllele: "T",
                    variantAllele: "C",
                }),
                initMutation({
                    gene: {
                        chromosome: "7"
                    },
                    startPosition: 111,
                    endPosition: 111,
                    referenceAllele: "T",
                    variantAllele: "C",
                }),
                initMutation({
                    gene: {
                        chromosome: "17"
                    },
                    startPosition: 66,
                    endPosition: 66,
                    referenceAllele: "T",
                    variantAllele: "A",
                }),
                initMutation({
                    gene: {
                        chromosome: "17"
                    },
                    startPosition: 66,
                    endPosition: 66,
                    referenceAllele: "T",
                    variantAllele: "A",
                }),
                initMutation({
                    gene: {
                        chromosome: "4"
                    },
                    startPosition: 11,
                    endPosition: 11,
                    referenceAllele: "-",
                    variantAllele: "G",
                }),
            ];

            const genomicLocations = uniqueGenomicLocations(mutations);

            assert.equal(genomicLocations.length, 3,
                "Duplicate genomic locations should be removed (5 - 2 = 3)");
        });
    });
});
