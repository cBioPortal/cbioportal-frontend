import MutationTypeColumnFormatter from './MutationTypeColumnFormatter';
import styles from './mutationType.module.scss';
import React from 'react';
import { assert } from 'chai';
import { shallow, mount } from 'enzyme';
import sinon from 'sinon';

describe('MutationTypeColumnFormatter', () => {
    const missenseVariant = {
        mutationType: "Missense_Variant"
    };

    const missenseMutation = {
        mutationType: "Missense_mutation"
    };

    const stopgainSnv = {
        mutationType: "stopgain_SNV"
    };

    const nonFrameShiftDeletion = {
        mutationType: "NonFrameShift_deletion"
    };

    const spliceSite = {
        mutationType: "Splice Site"
    };

    const frameshiftDeletion = {
        mutationType: "FrameShift_Deletion"
    };

    const otherMutation = {
        mutationType: "other"
    };

    const unknownMutation = {
        mutationType: "a_strange_type_of_mutation"
    };

    const tableData = [
        [missenseVariant],
        [missenseMutation],
        [stopgainSnv],
        [nonFrameShiftDeletion],
        [spliceSite],
        [frameshiftDeletion],
        [otherMutation],
        [unknownMutation]
    ];

    let msVarComponent, msMutComponent, stopgainSnvComponent,
        nonFsDelComponent, unknownMutComponent, fsDelComponent,
        otherMutComponent, spliceComponent;

    before(() => {
        let data = {
            name: "Mutation Type",
            tableData: tableData,
            rowData: [missenseVariant]
        };
        msVarComponent = mount(MutationTypeColumnFormatter.renderFunction(data));

        data.rowData = [missenseMutation];
        msMutComponent = mount(MutationTypeColumnFormatter.renderFunction(data));

        data.rowData = [stopgainSnv];
        stopgainSnvComponent = mount(MutationTypeColumnFormatter.renderFunction(data));

        data.rowData = [nonFrameShiftDeletion];
        nonFsDelComponent = mount(MutationTypeColumnFormatter.renderFunction(data));

        data.rowData = [spliceSite];
        spliceComponent = mount(MutationTypeColumnFormatter.renderFunction(data));

        data.rowData = [frameshiftDeletion];
        fsDelComponent = mount(MutationTypeColumnFormatter.renderFunction(data));

        data.rowData = [unknownMutation];
        unknownMutComponent = mount(MutationTypeColumnFormatter.renderFunction(data));

        data.rowData = [otherMutation];
        otherMutComponent = mount(MutationTypeColumnFormatter.renderFunction(data));
    });

    function testRenderedValues(component, mutationType, className, value)
    {
        assert.isTrue(component.find(`span.${styles[className]}`).exists(),
            `Span has the correct class name for ${mutationType}`);
        assert.isTrue(component.find(`span.${styles[className]}`).text().indexOf(value) > -1,
            `Display value is correct for ${mutationType}`);
        assert.equal(component.prop("value"), value,
            `Cell (Td) value property is correct for ${mutationType}`);
    }

    it('component display value, class name, and cell value property', () => {
        testRenderedValues(msVarComponent, "Missense_Variant", "missense-mutation", "Missense");
        testRenderedValues(msMutComponent, "Missense_mutation", "missense-mutation", "Missense");
        testRenderedValues(stopgainSnvComponent, "stopgain_SNV", "trunc-mutation", "Nonsense");
        testRenderedValues(nonFsDelComponent, "NonFrameShift_deletion", "inframe-mutation", "IF");
        testRenderedValues(spliceComponent, "Splice Site", "trunc-mutation", "Splice");
        testRenderedValues(fsDelComponent, "FrameShift_Deletion", "trunc-mutation", "FS del");
        testRenderedValues(unknownMutComponent, "a_strange_type_of_mutation", "other-mutation", "a_strange_type_of_mutation");
        testRenderedValues(otherMutComponent, "other", "other-mutation", "Other");
    });

    after(()=>{

    });

});
