import {assert} from 'chai';
import React from 'react';
import expect from 'expect';
import expectJSX from 'expect-jsx';
import {shallow} from "enzyme";
import {profileAvailability, radioButtons} from "./DataTypePrioritySelector";
import {AlterationTypeConstants} from "../../../pages/resultsView/ResultsViewPageStore";
import {MolecularProfile} from "../../api/generated/CBioPortalAPI";
import {stringListToSet} from "../../lib/StringUtils";
import {QueryStore} from "./QueryStore";

expect.extend(expectJSX);

describe("DataTypePrioritySelector", ()=>{
    describe("profileAvailability", ()=>{
        it("returns correct profile availability result in case of zero profiles", ()=>{
            assert.deepEqual(profileAvailability([]), {mutation:false, cna:false});
        });
        it("returns correct profile availability result in case of one profile", ()=>{
            let profiles = [{
                molecularAlterationType: AlterationTypeConstants.MUTATION_EXTENDED,
                showProfileInAnalysisTab: true
            }] as MolecularProfile[];
            assert.deepEqual(profileAvailability(profiles), {mutation:true, cna:false});

            profiles = [{
                molecularAlterationType: AlterationTypeConstants.MUTATION_EXTENDED,
                showProfileInAnalysisTab: false
            }] as MolecularProfile[];
            assert.deepEqual(profileAvailability(profiles), {mutation:false, cna:false});

            profiles = [{
                molecularAlterationType: AlterationTypeConstants.COPY_NUMBER_ALTERATION,
                showProfileInAnalysisTab: true
            }] as MolecularProfile[];
            assert.deepEqual(profileAvailability(profiles), {mutation:false, cna:true});

            profiles = [{
                molecularAlterationType: AlterationTypeConstants.COPY_NUMBER_ALTERATION,
                showProfileInAnalysisTab: false
            }] as MolecularProfile[];
            assert.deepEqual(profileAvailability(profiles), {mutation:false, cna:false});
        });
        it("returns correct profile availability result in case of two profiles", ()=>{
            let profiles = [{
                molecularAlterationType: AlterationTypeConstants.MUTATION_EXTENDED,
                showProfileInAnalysisTab: true
            },{
                molecularAlterationType: AlterationTypeConstants.COPY_NUMBER_ALTERATION,
                showProfileInAnalysisTab: true
            }] as MolecularProfile[];
            assert.deepEqual(profileAvailability(profiles), {mutation:true, cna:true});

            profiles = [{
                molecularAlterationType: AlterationTypeConstants.MUTATION_EXTENDED,
                showProfileInAnalysisTab: false
            },{
                molecularAlterationType: AlterationTypeConstants.COPY_NUMBER_ALTERATION,
                showProfileInAnalysisTab: true
            }] as MolecularProfile[];
            assert.deepEqual(profileAvailability(profiles), {mutation:false, cna:true});

            profiles = [{
                molecularAlterationType: AlterationTypeConstants.MUTATION_EXTENDED,
                showProfileInAnalysisTab: true
            },{
                molecularAlterationType: AlterationTypeConstants.COPY_NUMBER_ALTERATION,
                showProfileInAnalysisTab: false
            }] as MolecularProfile[];
            assert.deepEqual(profileAvailability(profiles), {mutation:true, cna:false});

            profiles = [{
                molecularAlterationType: AlterationTypeConstants.MUTATION_EXTENDED,
                showProfileInAnalysisTab: false
            },{
                molecularAlterationType: AlterationTypeConstants.COPY_NUMBER_ALTERATION,
                showProfileInAnalysisTab: false
            }] as MolecularProfile[];
            assert.deepEqual(profileAvailability(profiles), {mutation:false, cna:false});
        });
        it("returns correct profile availability result in case of several profiles", ()=>{
            let profiles = [{
                molecularAlterationType: AlterationTypeConstants.MUTATION_EXTENDED,
                showProfileInAnalysisTab: true
            },{
                molecularAlterationType: AlterationTypeConstants.MUTATION_EXTENDED,
                showProfileInAnalysisTab: false
            },{
                molecularAlterationType: AlterationTypeConstants.COPY_NUMBER_ALTERATION,
                showProfileInAnalysisTab: false
            }] as MolecularProfile[];
            assert.deepEqual(profileAvailability(profiles), {mutation:true, cna:false});
        });
    });
    describe("radioButtons",()=>{
        it("shows the right buttons when theres mutation and cna profiles available",()=>{
            const buttonLabels = stringListToSet(radioButtons({mutation:true, cna:true}, {} as QueryStore).map(x=>x.props.label));
            assert.deepEqual(buttonLabels, stringListToSet(["Mutation and CNA", "Only Mutation", "Only CNA"]));
        });
        it("shows the right buttons when theres just mutation profiles available",()=>{
            const buttonLabels = stringListToSet(radioButtons({mutation:true, cna:false}, {} as QueryStore).map(x=>x.props.label));
            assert.deepEqual(buttonLabels, stringListToSet(["Mutation"]));
        });
        it("shows the right buttons when theres just cna profiles available",()=>{
            const buttonLabels = stringListToSet(radioButtons({mutation:false, cna:true}, {} as QueryStore).map(x=>x.props.label));
            assert.deepEqual(buttonLabels, stringListToSet(["CNA"]));
        });
    })
});