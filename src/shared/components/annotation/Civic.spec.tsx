import Civic from './Civic';
import React from 'react';
import { assert, expect } from 'chai';
import {shallow, mount, ReactWrapper} from 'enzyme';
import sinon from 'sinon';
import {getExpectedCivicEntry, getExpectedCnaCivicEntry} from "test/CivicMockUtils";
import CivicCard from "./CivicCard";
import {ICivicProps} from "./Civic";

describe('Civic with no data', () => {
    const props = {
        civicEntry: undefined,
        civicStatus: "complete",
        hasCivicVariants: true
    } as ICivicProps;

    let component: ReactWrapper<any, any>;

    before(() => {
        component = mount(<Civic {...props}/>);
    });

    it('displays a load spinner when there is no civic data', () => {
        const spinner = component.find("Circle");

        assert.isTrue(spinner.exists(),
            "Spinner component should exist");

        assert.equal(spinner.prop("size"), 18,
            "Spinner size should be equal to 18");

        assert.equal(spinner.prop("color"), "#aaa",
            "Spinner color should be #aaa");
    });

    after(() => {

    });
});

describe('Civic with data with variants', () => {
    const props = {
        civicEntry: getExpectedCivicEntry(),
        civicStatus: "complete",
        hasCivicVariants: true
    } as ICivicProps;

    let component: ReactWrapper<any, any>;

    before(() => {
        component = mount(<Civic {...props}/>);
    });

    it('displays the correct Civic icon', () => {
        const civicIcon = component.find('img');

        assert.isTrue(civicIcon.exists(),
        "Civic icon should exist");

        assert.equal(civicIcon.prop("width"), 14,
        "Civic icon width should be equal to 14");

        assert.equal(civicIcon.prop("height"), 14,
        "Civic icon height should be equal to 14");

        assert.equal(civicIcon.prop("src"), require("./images/civic-logo.png"),
        "Civic icon should be civic-logo.png");
    });

    after(() => {

    });
});

describe('Civic with data with no variants', () => {
    const props = {
        civicEntry: getExpectedCnaCivicEntry(),
        civicStatus: "complete",
        hasCivicVariants: false
    } as ICivicProps;

    let component: ReactWrapper<any, any>;

    before(() => {
        component = mount(<Civic {...props}/>);
    });

    it('displays the correct Civic icon', () => {
        const civicIcon = component.find('img');

        assert.isTrue(civicIcon.exists(),
        "Civic icon should exist");

        assert.equal(civicIcon.prop("width"), 14,
        "Civic icon width should be equal to 14");

        assert.equal(civicIcon.prop("height"), 14,
        "Civic icon height should be equal to 14");

        assert.equal(civicIcon.prop("src"), require("./images/civic-logo-no-variants.png"),
        "Civic icon should be civic-logo-no-variants.png");
    });

    after(() => {

    });
});

describe('Counts correctly', () => {

    before(() => {
    });

    it('Gives 1 point per entry', () => {
        const value = Civic.sortValue(getExpectedCnaCivicEntry());
        
        assert.equal(value, 1,
        "Correctly gives 1 point for an entry");
    });

    it('Gives 0 points if the entry is undefined', () => {
        const value = Civic.sortValue(undefined);
        
        assert.equal(value, 0,
        "Correctly gives 0 points if the entry is undefined");
    });
    
    it('Gives 0 points if the entry is null', () => {
        const value = Civic.sortValue(null);
        
        assert.equal(value, 0,
        "Correctly gives 0 points if the entry is null");
    });
    after(() => {

    });
});
