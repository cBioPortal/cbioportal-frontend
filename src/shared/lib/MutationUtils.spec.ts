import {
    somaticMutationRate, germlineMutationRate
} from "./MutationUtils";
import * as _ from 'lodash';
import { assert, expect } from 'chai';
import sinon from 'sinon';
import {Mutation} from "../api/generated/CBioPortalAPI";
import {initMutation} from "test/MutationMockUtils";
import { MUTATION_STATUS_GERMLINE } from "shared/constants";

describe('MutationUtils', () => {
    let somaticMutations: Mutation[];
    let germlineMutations: Mutation[];

    before(()=>{
        somaticMutations = [
            initMutation({ // mutation
                patientId: "PATIENT1",
                gene: {
                    hugoGeneSymbol: "TP53",
                },
             }),
            initMutation({ // mutation in same gene, same patient
                patientId: "PATIENT1",
                gene: {
                    hugoGeneSymbol: "TP53",
                },
             }),
            initMutation({ // mutation in same patient different gene
                patientId: "PATIENT2",
                gene: {
                    hugoGeneSymbol: "PIK3CA",
                },
             })
        ];
        germlineMutations = [
            initMutation({ // mutation
                patientId: "PATIENT1",
                gene: {
                    hugoGeneSymbol: "TP53",
                },
                mutationStatus: MUTATION_STATUS_GERMLINE
             }),
            initMutation({ // mutation in same gene, same patient
                patientId: "PATIENT1",
                gene: {
                    hugoGeneSymbol: "BRCA1",
                },
                mutationStatus: MUTATION_STATUS_GERMLINE
             }),
            initMutation({ // mutation in same patient different gene
                patientId: "PATIENT2",
                gene: {
                    hugoGeneSymbol: "BRCA2",
                },
                mutationStatus: MUTATION_STATUS_GERMLINE
             })
        ];
    });

    describe('somaticMutationRate', () => {
        it("calculates rate correctly", () => {
            // only one of the patients has a TP53 mutation
            let result:number = 
                somaticMutationRate(
                    "TP53",
                    somaticMutations,
                    ['PATIENT1', 'PATIENT2']
                );
            assert.equal(result, 50)

            // No non-existing gene mutations
            result = 
                somaticMutationRate(
                    "NASDASFASG",
                    somaticMutations,
                    ['PATIENT1', 'PATIENT2']
                );
            assert.equal(result, 0)

            // when nr of given patientIds is 1 it should give 100% (not sure if
            // this should be an error instead)
            result = 
                somaticMutationRate(
                    "PIK3CA",
                    somaticMutations,
                    ['PATIENT2']
                );
            assert.equal(result, 100)

            // germline mutations should be ignored
            result = 
                somaticMutationRate(
                    "BRCA1",
                    somaticMutations.concat(germlineMutations),
                    ['PATIENT2']
                );
            assert.equal(result, 0)

            // ignore all mutations for non existent patient id
            result = 
                somaticMutationRate(
                    "PIK3CA",
                    somaticMutations,
                    ['XXXX']
                );
            assert.equal(result, 0)
        });
    });

    describe('germlineMutationRate', () => {
        it("calculates rate correctly", () => {
            // only half of patients have BRCA1 mutation
            let result:number =
                germlineMutationRate(
                    "BRCA1",
                    germlineMutations,
                    ['PATIENT1', 'PATIENT2'],
                );
            assert.equal(result, 50)

            // somatic mutations should be ignored
            result = 
                germlineMutationRate(
                    "PIK3CA",
                    germlineMutations.concat(somaticMutations),
                    ['PATIENT1', 'PATIENT2'],
                );
            assert.equal(result, 0)

            // ignore all mutations for non existent patient id
            result = 
                germlineMutationRate(
                    "BRCA2",
                    germlineMutations,
                    ['XXXX']
                );
            assert.equal(result, 0)

            // No non-existing gene mutations
            result = 
                germlineMutationRate(
                    "NASDASFASG",
                    germlineMutations,
                    ['PATIENT1', 'PATIENT2']
                );
            assert.equal(result, 0)
        });
    });
});
