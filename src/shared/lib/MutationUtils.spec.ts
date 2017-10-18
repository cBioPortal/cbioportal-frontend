import {
    somaticMutationRate, germlineMutationRate
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
});
