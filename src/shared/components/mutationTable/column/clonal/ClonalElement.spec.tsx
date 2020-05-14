import * as _ from 'lodash';
import { render, ReactWrapper, mount, shallow } from 'enzyme';
import * as React from 'react';
import { DefaultTooltip } from 'cbioportal-frontend-commons';
import { assert } from 'chai';
import {
    default as ClonalElement,
    ClonalElementTooltip,
    ClonalColor,
} from './ClonalElement';

describe('ClonalElement', () => {
    const clonalYes = {
        sampleId: 'S001',
        clonalValue: 'yes',
        ccfMCopies: '1',
    };

    const clonalNo = {
        sampleId: 'S002',
        clonalValue: 'no',
        ccfMCopies: '0.85',
    };

    const clonalNA = {
        sampleId: 'S003',
        clonalValue: 'NA',
        ccfMCopies: 'NA',
    };

    before(() => {});

    function testExpectedValidClonalElement(
        componentProperties: any,
        expectedColor: string
    ) {
        // check main icon is right color given a clonalValue
        const validClonalElementTest = mount(
            <ClonalElement {...componentProperties} />
        );
        assert.equal(
            validClonalElementTest.find('circle').prop('fill'),
            expectedColor
        );

        // check props are correctly passed to tooltip
        const clonalElementTooltipTest = mount(
            <ClonalElementTooltip
                {...(validClonalElementTest
                    .find('DefaultTooltip')
                    .prop('overlay') as any).props}
            />
        );

        // get individual divs in tooltip
        const clonalDiv = clonalElementTooltipTest.findWhere(
            n =>
                n.type() === 'div' &&
                n
                    .render()
                    .children('span')
                    .text() === 'Clonal'
        );

        const ccfDiv = clonalElementTooltipTest.findWhere(
            n =>
                n.type() === 'div' &&
                n
                    .render()
                    .children('span')
                    .text() === 'CCF'
        );

        // check clonal text is same color as circle && correct text values are used
        assert.isTrue(clonalDiv.exists() && ccfDiv.exists());
        assert.equal(
            (clonalDiv.find('strong').prop('style') as any).color,
            expectedColor
        );
        assert.equal(
            clonalDiv.find('strong').text(),
            componentProperties['clonalValue']
        );
        assert.equal(
            ccfDiv.find('strong').text(),
            componentProperties['ccfMCopies']
        );
    }

    function testExpectedInvalidClonalElement(
        componentProperties: any,
        expectedColor: string
    ) {
        const invalidClonalElementTest = mount(
            <ClonalElement {...componentProperties} />
        );
        assert.isTrue(
            invalidClonalElementTest.find('circle').prop('opacity') === 0
        );

        assert.isTrue(
            !invalidClonalElementTest.find('DefaultTooltip').exists()
        );
    }

    it('generates limegreen circle with tooltip for clonal yes', () => {
        testExpectedValidClonalElement(clonalYes, ClonalColor.LIMEGREEN);
    });

    it('generates dimgrey circle with tooltip for clonal no', () => {
        testExpectedValidClonalElement(clonalNo, ClonalColor.DIMGREY);
    });

    it('generates lightgrey circle with tooltip for clonal NA', () => {
        testExpectedInvalidClonalElement(clonalNA, ClonalColor.LIGHTGREY);
    });

    after(() => {});
});
