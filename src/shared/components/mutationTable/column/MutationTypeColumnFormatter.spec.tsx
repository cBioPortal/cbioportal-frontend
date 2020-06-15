import MutationTypeColumnFormatter from './MutationTypeColumnFormatter';
import styles from './mutationType.module.scss';
import { initMutation } from 'test/MutationMockUtils';
import React from 'react';
import { assert } from 'chai';
import { shallow, mount, ReactWrapper } from 'enzyme';
import sinon from 'sinon';

describe('MutationTypeColumnFormatter', () => {
    const missenseVariant = initMutation({
        mutationType: 'Missense_Variant',
    });

    const missenseMutation = initMutation({
        mutationType: 'Missense_mutation',
    });

    const stopgainSnv = initMutation({
        mutationType: 'stopgain_SNV',
    });

    const nonFrameShiftDeletion = initMutation({
        mutationType: 'NonFrameShift_deletion',
    });

    const spliceSite = initMutation({
        mutationType: 'Splice Site',
    });

    const frameshiftDeletion = initMutation({
        mutationType: 'FrameShift_Deletion',
    });

    const otherMutation = initMutation({
        mutationType: 'other',
    });

    const unknownMutation = initMutation({
        mutationType: 'a_strange_type_of_mutation',
    });

    const tableData = [
        [missenseVariant],
        [missenseMutation],
        [stopgainSnv],
        [nonFrameShiftDeletion],
        [spliceSite],
        [frameshiftDeletion],
        [otherMutation],
        [unknownMutation],
    ];

    let msVarComponent: ReactWrapper<any, any>;
    let msMutComponent: ReactWrapper<any, any>;
    let stopgainSnvComponent: ReactWrapper<any, any>;
    let nonFsDelComponent: ReactWrapper<any, any>;
    let unknownMutComponent: ReactWrapper<any, any>;
    let fsDelComponent: ReactWrapper<any, any>;
    let otherMutComponent: ReactWrapper<any, any>;
    let spliceComponent: ReactWrapper<any, any>;

    before(() => {
        let data = [missenseVariant];
        msVarComponent = mount(
            MutationTypeColumnFormatter.renderFunction(data)
        );

        data = [missenseMutation];
        msMutComponent = mount(
            MutationTypeColumnFormatter.renderFunction(data)
        );

        data = [stopgainSnv];
        stopgainSnvComponent = mount(
            MutationTypeColumnFormatter.renderFunction(data)
        );

        data = [nonFrameShiftDeletion];
        nonFsDelComponent = mount(
            MutationTypeColumnFormatter.renderFunction(data)
        );

        data = [spliceSite];
        spliceComponent = mount(
            MutationTypeColumnFormatter.renderFunction(data)
        );

        data = [frameshiftDeletion];
        fsDelComponent = mount(
            MutationTypeColumnFormatter.renderFunction(data)
        );

        data = [unknownMutation];
        unknownMutComponent = mount(
            MutationTypeColumnFormatter.renderFunction(data)
        );

        data = [otherMutation];
        otherMutComponent = mount(
            MutationTypeColumnFormatter.renderFunction(data)
        );
    });

    function testRenderedValues(
        component: ReactWrapper<any, any>,
        mutationType: string,
        className: string,
        value: string
    ) {
        assert.isTrue(
            component.find(`span.${className}`).exists(),
            `Span has the correct class name for ${mutationType}`
        );
        assert.isTrue(
            component
                .find(`span.${className}`)
                .text()
                .indexOf(value) > -1,
            `Display value is correct for ${mutationType}`
        );
    }

    it('renders component display value, class name, and cell value property', () => {
        testRenderedValues(
            msVarComponent,
            'Missense_Variant',
            MutationTypeColumnFormatter.MAIN_MUTATION_TYPE_MAP.missense
                .className,
            'Missense'
        );
        testRenderedValues(
            msMutComponent,
            'Missense_mutation',
            MutationTypeColumnFormatter.MAIN_MUTATION_TYPE_MAP.missense
                .className,
            'Missense'
        );
        testRenderedValues(
            stopgainSnvComponent,
            'stopgain_SNV',
            MutationTypeColumnFormatter.MAIN_MUTATION_TYPE_MAP.nonsense
                .className,
            'Nonsense'
        );
        testRenderedValues(
            nonFsDelComponent,
            'NonFrameShift_deletion',
            MutationTypeColumnFormatter.MAIN_MUTATION_TYPE_MAP.inframe
                .className,
            'IF'
        );
        testRenderedValues(
            spliceComponent,
            'Splice Site',
            MutationTypeColumnFormatter.MAIN_MUTATION_TYPE_MAP.splice_site
                .className,
            'Splice'
        );
        testRenderedValues(
            fsDelComponent,
            'FrameShift_Deletion',
            MutationTypeColumnFormatter.MAIN_MUTATION_TYPE_MAP.frame_shift_del
                .className,
            'FS del'
        );
        testRenderedValues(
            unknownMutComponent,
            'a_strange_type_of_mutation',
            MutationTypeColumnFormatter.MAIN_MUTATION_TYPE_MAP.other.className,
            'Other'
        );
        testRenderedValues(
            otherMutComponent,
            'other',
            MutationTypeColumnFormatter.MAIN_MUTATION_TYPE_MAP.other.className,
            'Other'
        );
    });
});
