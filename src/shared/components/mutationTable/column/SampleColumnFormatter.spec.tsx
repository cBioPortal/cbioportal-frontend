import SampleColumnFormatter from "./SampleColumnFormatter";
import DefaultTooltip from "shared/components/DefaultTooltip";
import {initMutation} from "test/MutationMockUtils";
import React from 'react';
import { assert } from 'chai';
import {shallow, mount, ReactWrapper} from 'enzyme';
import sinon from 'sinon';

/**
 * @author Selcuk Onur Sumer
 */
describe('SampleColumnFormatter', () => {
    const mutationShort = initMutation({
        sampleId: "Short_Id"
    });

    const mutationLong = initMutation({
        sampleId: "This_is_a_quite_long_Sample_Id_in_my_opinion!"
    });

    let componentShort:ReactWrapper<any, any>;
    let componentLong:ReactWrapper<any, any>;

    before(() => {
        let data = [mutationShort];

        // mount a single cell component (Td) for the mutation with short sample id
        componentShort = mount(SampleColumnFormatter.renderFunction(data));

        data = [mutationLong];

        // mount a single cell component (Td) for the mutation with long sample id
        componentLong = mount(SampleColumnFormatter.renderFunction(data));
    });

    it('renders sample display value', () => {
        assert.isTrue(componentShort.find(`span`).text().indexOf("Short_Id") > -1,
            'Display value is correct for short sample id');
        assert.isFalse(componentLong.find(`span`).text().indexOf("This_is_a_quite_long_Sample_Id_in_my_opinion!") > -1,
            'Display value for long sample id should not be equal to the actual value');
    });

    it('generates component tooltip', () => {
        assert.isFalse(componentShort.find(DefaultTooltip).exists(),
            'Tooltip should not exists for short sample id');
        assert.isTrue(componentLong.find(DefaultTooltip).exists(),
            'Tooltip should exists for long sample id');
    });

    after(() => {

    });
});
