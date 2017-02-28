import SampleColumnFormatter from "./SampleColumnFormatter";
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

    const shortSampleId = {
        name: "Sample",
        columnData: mutationShort.sampleId
    };

    const longSampleId = {
        name: "Sample",
        columnData: mutationLong.sampleId
    };

    let componentShort:ReactWrapper<any, any>;
    let componentLong:ReactWrapper<any, any>;

    const tableData = [[mutationShort], [mutationLong]];

    before(() => {
        let data = {
            name: "Sample",
            tableData,
            rowData: [mutationShort]
        };

        // mount a single cell component (Td) for the mutation with short sample id
        componentShort = mount(SampleColumnFormatter.renderFunction(data));

        data = {
            name: "Sample",
            tableData,
            rowData: [mutationLong]
        };

        // mount a single cell component (Td) for the mutation with long sample id
        componentLong = mount(SampleColumnFormatter.renderFunction(data));
    });

    it('sample id text is properly formatted', () => {
        // text and display should be the same for short sample ids
        assert.equal(SampleColumnFormatter.getTextValue(shortSampleId),
                     SampleColumnFormatter.getDisplayValue(shortSampleId));

        // text and display values should be different,
        // and truncated size should have fixed number of characters
        assert.equal(SampleColumnFormatter.getDisplayValue(longSampleId).length,
                     SampleColumnFormatter.MAX_LENGTH + SampleColumnFormatter.SUFFIX.length);

        // suffix should be appended in the end
        assert.isTrue(SampleColumnFormatter.getDisplayValue(longSampleId).indexOf(
                          SampleColumnFormatter.SUFFIX) > -1);
    });

    it('sample id style class is properly set', () => {

        // no tooltips for short ids
        assert.notEqual(SampleColumnFormatter.getTooltipValue(shortSampleId.columnData),
                        SampleColumnFormatter.getTextValue(shortSampleId));

        // tooltip value should be the same as text value for long ids
        assert.equal(SampleColumnFormatter.getTooltipValue(longSampleId.columnData),
                     SampleColumnFormatter.getTextValue(longSampleId));
    });

    it('renders sample display value', () => {
        assert.isTrue(componentShort.find(`span`).text().indexOf("Short_Id") > -1,
            'Display value is correct for short sample id');
        assert.isFalse(componentLong.find(`span`).text().indexOf("This_is_a_quite_long_Sample_Id_in_my_opinion!") > -1,
            'Display value for long sample id should not be equal to the actual value');
    });

    it('sets component cell value property', () => {
        assert.equal(componentShort.prop("value"), "Short_Id",
            'Cell (Td) value property is correct for short sample id');
        assert.equal(componentLong.prop("value"), "This_is_a_quite_long_Sample_Id_in_my_opinion!",
            'Cell (Td) value property is correct for long sample id');
    });

    it('generates component tooltip', () => {
        assert.isFalse(componentShort.find('DefaultTooltip').exists(),
            'Tooltip should not exists for short sample id');
        assert.isTrue(componentLong.find('DefaultTooltip').exists(),
            'Tooltip should exists for long sample id');
    });

    after(() => {

    });
});
