import * as React from 'react';
import * as _ from 'lodash';
import { ReactWrapper, mount } from 'enzyme';
import { assert, expect } from 'chai';
import {
    default as ExpectedAltCopiesElement,
    ExpectedAltCopiesElementTooltip,
} from './ExpectedAltCopiesElement';
import { Mutation, AlleleSpecificCopyNumber } from 'cbioportal-ts-api-client';

describe('ExpectedAltCopiesElement', () => {
    function getExpectedAltCopiesProps(
        sampleId: string,
        totalCopyNumberValue: string,
        expectedAltCopiesValue: string
    ) {
        return {
            sampleId: sampleId,
            totalCopyNumberValue: totalCopyNumberValue,
            expectedAltCopiesValue: expectedAltCopiesValue,
            sampleManager: undefined,
        };
    }

    function testExpectedAltCopiesElementTooltip(
        expectedAltCopiesElement: any
    ) {
        let expectedAltCopiesElementTooltip = mount(
            <ExpectedAltCopiesElementTooltip
                {...(expectedAltCopiesElement.find('DefaultTooltip').props()
                    .overlay as any).props}
            />
        );
        expect(
            expectedAltCopiesElementTooltip.findWhere(
                node =>
                    node.type() === 'span' &&
                    node.children().length == 0 &&
                    node.text() ==
                        ' 2 out of 4 copies of this gene are mutated.'
            )
        ).to.exist;
    }

    it('generates ExpectedAltCopiesElement with Tooltip', () => {
        // only mutations with tcn/expectedAltCopies available map to an element
        let expectedAltCopiesElementTest = mount(
            <ExpectedAltCopiesElement
                {...getExpectedAltCopiesProps('S001', '4', '2')}
            />
        );
        expect(expectedAltCopiesElementTest.find('span').text()).to.equal(
            '2/4'
        );
        testExpectedAltCopiesElementTooltip(expectedAltCopiesElementTest);
    });
});
