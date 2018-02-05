import {assert} from 'chai';
import React from 'react';
import expect from 'expect';
import expectJSX from 'expect-jsx';
import {shallow} from "enzyme";
import {checkBoxes} from "./DataTypePrioritySelector";
import {AlterationTypeConstants} from "../../../pages/resultsView/ResultsViewPageStore";
import {MolecularProfile} from "../../api/generated/CBioPortalAPI";
import {stringListToSet} from "../../lib/StringUtils";
import {QueryStore} from "./QueryStore";

expect.extend(expectJSX);

describe("DataTypePrioritySelector", ()=>{
    describe("checkBoxes",()=>{
        it("shows the right buttons when theres mutation and cna profiles available",()=>{
            const buttonLabels = stringListToSet(checkBoxes({mutation:true, cna:true}, {} as QueryStore).map(x=>x.props.label));
            assert.deepEqual(buttonLabels, stringListToSet(["Mutation", "Copy number alterations"]));
        });
        it("shows the right buttons when theres just mutation profiles available",()=>{
            const buttonLabels = stringListToSet(checkBoxes({mutation:true, cna:false}, {} as QueryStore).map(x=>x.props.label));
            assert.deepEqual(buttonLabels, stringListToSet(["Mutation"]));
        });
        it("shows the right buttons when theres just cna profiles available",()=>{
            const buttonLabels = stringListToSet(checkBoxes({mutation:false, cna:true}, {} as QueryStore).map(x=>x.props.label));
            assert.deepEqual(buttonLabels, stringListToSet(["Copy number alterations"]));
        });
    })
});