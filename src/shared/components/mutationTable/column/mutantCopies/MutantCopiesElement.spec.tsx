import * as React from 'react';
import * as _ from 'lodash';
import { ReactWrapper, mount } from 'enzyme';
import { assert, expect } from 'chai';
import {
    default as MutantCopiesElement,
    MutantCopiesElementTooltip,
} from './MutantCopiesElement';
import { Mutation, AlleleSpecificCopyNumber } from 'cbioportal-ts-api-client';

describe('MutantCopiesElement', () => {
    function getMutantCopiesProps(
        sampleId: string,
        totalCopyNumberValue: string,
        mutantCopiesValue: string
    ) {
        return {
            sampleId: sampleId,
            totalCopyNumberValue: totalCopyNumberValue,
            mutantCopiesValue: mutantCopiesValue,
            sampleManager: undefined,
        };
    }

    function testMutantCopiesElementTooltip(mutantCopiesElement: any) {
        let mutantCopiesElementTooltip = mount(
            <MutantCopiesElementTooltip
                {...(mutantCopiesElement.find('DefaultTooltip').props()
                    .overlay as any).props}
            />
        );
        expect(
            mutantCopiesElementTooltip.findWhere(
                node =>
                    node.type() === 'span' &&
                    node.children().length == 0 &&
                    node.text() ==
                        ' 2 out of 4 copies of this gene are mutated.'
            )
        ).to.exist;
    }

    before(() => {});

    it('generates MutantCopiesElement with Tooltip', () => {
        // only mutations with tcn/mutantCopies available map to an element
        let mutantCopiesElementTest = mount(
            <MutantCopiesElement {...getMutantCopiesProps('S001', '4', '2')} />
        );
        expect(mutantCopiesElementTest.find('span').text()).to.equal('2/4');
        testMutantCopiesElementTooltip(mutantCopiesElementTest);
    });

    after(() => {});
});
