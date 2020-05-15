import * as _ from 'lodash';
import { render, ReactWrapper, mount, shallow } from 'enzyme';
import * as React from 'react';
import { assert, expect } from 'chai';
import {
    default as ASCNCopyNumberElement,
    ASCNCopyNumberElementTooltip,
    ASCNCopyNumberValue,
} from './ASCNCopyNumberElement';
import {
    ASCN_AMP,
    ASCN_GAIN,
    ASCN_LIGHTGREY,
    ASCN_HETLOSS,
    ASCN_HOMDEL,
    ASCN_BLACK,
} from 'shared/lib/Colors';

/*
    done: black icon is returned if:
       ascn copy number value is NA
       wgd value is NA
       total copy number NA
       ascn copy number is not 2, 1, 0, -1, or -2

       then also test opacity of black icon is 0

    done: test all other colors and that opacity is 100

    done: test rect is there

    done: icon displays total copy number

    done: test wgd
        done: test wgd displayed
        done: it also has an opactity? (0 vs 100)

    test tooltip
        - ASCNCopyNumberValue text
        - WGD/no WGD
        - total copy number
        - minor copy number
        - icon for sample (if multiple samples) -- maybe do this

*/

describe('ASCNCopyNumberElement', () => {
    before(() => {});

    function initSample() {
        return {
            sampleId: 'default',
            wgdValue: 'WGD',
            totalCopyNumberValue: '0',
            minorCopyNumberValue: '0',
            ascnCopyNumberValue: '0',
            sampleManager: null,
        };
    }

    function testExpectedColorValidASCNCopyNumberElement(
        componentProperties: any,
        expectedColor: string
    ) {
        const ascnCopyNumberElement = mount(
            <ASCNCopyNumberElement {...componentProperties} />
        );

        expect(ascnCopyNumberElement.find('rect').length).to.not.equal(
            0,
            "Expected to find a 'rect' element but did not"
        );
        expect(ascnCopyNumberElement.find('rect').props()).to.have.property(
            'fill',
            expectedColor
        );
        expect(ascnCopyNumberElement.find('rect').props()).to.have.property(
            'opacity',
            100
        );
    }

    function testExpectedColorInvalidASCNCopyNumberElement(
        componentProperties: any
    ) {
        const ascnCopyNumberElement = mount(
            <ASCNCopyNumberElement {...componentProperties} />
        );

        expect(ascnCopyNumberElement.find('rect').length).to.not.equal(
            0,
            "Expected to find a 'rect' element but did not"
        );
        expect(ascnCopyNumberElement.find('rect').props()).to.have.property(
            'fill',
            ASCN_BLACK
        );
        expect(ascnCopyNumberElement.find('rect').props()).to.have.property(
            'opacity',
            0
        );
    }

    function testExpectedTCNValidASCNCopyNumberElement(
        componentProperties: any
    ) {
        const ascnCopyNumberElement = mount(
            <ASCNCopyNumberElement {...componentProperties} />
        );

        const textElement = ascnCopyNumberElement.findWhere(
            n =>
                n.type() === 'text' &&
                n.render().text() ===
                    componentProperties['totalCopyNumberValue']
        );

        expect(textElement.length).to.not.equal(
            0,
            "Expected to find a 'text' element containing total copy number value '" +
                +componentProperties['totalCopyNumberValue'] +
                "' but did not"
        );
    }

    function testExpectedWGDASCNCopyNumberElement(
        componentProperties: any,
        expectWgd: boolean
    ) {
        const ascnCopyNumberElement = mount(
            <ASCNCopyNumberElement {...componentProperties} />
        );

        const textElement = ascnCopyNumberElement.findWhere(
            n => n.type() === 'text' && n.render().text() === 'WGD'
        );

        if (expectWgd) {
            expect(textElement.length).to.not.equal(
                0,
                "Expected to find a 'text' element containing 'WGD' but did not"
            );
        } else {
            expect(textElement.length).to.equal(
                0,
                "Expected no 'text' element containing 'WGD' but found one"
            );
        }
    }

    function testExpectedValidTooltip(
        componentProperties: any,
        ascnCopyNumberCall: string
    ) {
        const ascnCopyNumberElementTooltip = mount(
            <ASCNCopyNumberElementTooltip {...componentProperties} />
        );

        /* tooltip looks like: 
            <span>
                <span>
                    <b>{ascnCopyNumberCall}</b>
                    <span>{text with total copy number, minor copy number, and wgd}</span>
                </span>
            </span>
        */
        const bElement = ascnCopyNumberElementTooltip.find('b');
        expect(bElement).to.have.text(ascnCopyNumberCall.toLowerCase());

        const spanElement = ascnCopyNumberElementTooltip.findWhere(
            n =>
                n.type() === 'span' &&
                n
                    .text()
                    .includes(
                        componentProperties.wgdValue +
                            ' with total copy number of'
                    ) &&
                n
                    .text()
                    .includes(
                        componentProperties.totalCopyNumberValue +
                            ' and a minor copy number of'
                    ) &&
                n.text().includes(componentProperties.minorCopyNumberValue)
        );

        // the span with our text is nested in 2 other spans (see example above) so we match 3
        expect(spanElement.length).to.equal(
            3,
            "Expected to find three 'span' elements containing specified values but failed"
        );
    }

    function testExpectedInvalidTooltip(componentProperties: any) {
        const ascnCopyNumberElementTooltip = mount(
            <ASCNCopyNumberElementTooltip {...componentProperties} />
        );

        /* tooltip looks like: 
            <span>
                <span>
                    <b>{ascnCopyNumberCall}</b>
                </span>
            </span>
        */
        const bElement = ascnCopyNumberElementTooltip.find('b');
        expect(bElement).to.have.text(ASCNCopyNumberValue.NA);

        // TODO make a function
        const spanElement = ascnCopyNumberElementTooltip.findWhere(
            n =>
                n.type() === 'span' &&
                n
                    .text()
                    .includes(
                        componentProperties.wgdValue +
                            ' with total copy number of'
                    ) &&
                n
                    .text()
                    .includes(
                        componentProperties.totalCopyNumberValue +
                            ' and a minor copy number of'
                    ) &&
                n.text().includes(componentProperties.minorCopyNumberValue)
        );

        expect(spanElement.length).to.equal(
            0,
            "Expected zero 'span' elements containing specified values but failed"
        );
    }

    it('ascn copy number of 2 should have the ASCN_AMP color and be visible', () => {
        let sample = initSample();
        sample.ascnCopyNumberValue = '2';
        testExpectedColorValidASCNCopyNumberElement(sample, ASCN_AMP);
    });

    it('ascn copy number of 1 should have the ASCN_GAIN color and be visible', () => {
        let sample = initSample();
        sample.ascnCopyNumberValue = '1';
        testExpectedColorValidASCNCopyNumberElement(sample, ASCN_GAIN);
    });

    it('ascn copy number value 0 should have the ASCN_LIGHTGREY color and be visible', () => {
        let sample = initSample();
        sample.ascnCopyNumberValue = '0';
        testExpectedColorValidASCNCopyNumberElement(sample, ASCN_LIGHTGREY);
    });

    it('ascn copy number value -1 should have the ASCN_HETLOSS color and be visible', () => {
        let sample = initSample();
        sample.ascnCopyNumberValue = '-1';
        testExpectedColorValidASCNCopyNumberElement(sample, ASCN_HETLOSS);
    });

    it('ascn copy number value -2 should have the ASCN_HOMDEL color and be visible', () => {
        let sample = initSample();
        sample.ascnCopyNumberValue = '-2';
        testExpectedColorValidASCNCopyNumberElement(sample, ASCN_HOMDEL);
    });

    it('ascn copy number value of anything else should have the ASCN_BLACK color and be invisible', () => {
        let sample = initSample();
        sample.ascnCopyNumberValue = '999';
        testExpectedColorInvalidASCNCopyNumberElement(sample);
    });

    it('total copy number of NA should have the ASCN_BLACK color and be invisible', () => {
        let sample = initSample();
        sample.totalCopyNumberValue = ASCNCopyNumberValue.NA;
        testExpectedColorInvalidASCNCopyNumberElement(sample);
    });

    it('WGD of NA should have the ASCN_BLACK color and be invisible', () => {
        let sample = initSample();
        sample.wgdValue = ASCNCopyNumberValue.NA;
        testExpectedColorInvalidASCNCopyNumberElement(sample);
    });

    it('ascn copy number of NA should have the ASCN_BLACK color and be invisible', () => {
        let sample = initSample();
        sample.ascnCopyNumberValue = ASCNCopyNumberValue.NA;
        testExpectedColorInvalidASCNCopyNumberElement(sample);
    });

    it('total copy number should be displayed in a rect', () => {
        let sample = initSample();
        // use a nonsense total copy number value so we won't have an accidental success with it
        sample.totalCopyNumberValue = '999';
        testExpectedTCNValidASCNCopyNumberElement(sample);
    });

    it('wgd should be displayed if whole genome duplication occured', () => {
        let sample = initSample();
        sample.wgdValue = 'WGD';
        testExpectedWGDASCNCopyNumberElement(sample, true);
    });

    it('no wgd text should be displayed if no whole genome duplication occured', () => {
        let sample = initSample();
        sample.wgdValue = 'no WGD';
        testExpectedWGDASCNCopyNumberElement(sample, false);
    });

    it(
        'no wgd with major copy number of 1 and minor copy number of 0 displays ' +
            ASCNCopyNumberValue.HETLOSS.toLowerCase() +
            ' in tooltip',
        () => {
            let sample = initSample();
            sample.wgdValue = 'no WGD';
            sample.totalCopyNumberValue = '1';
            sample.minorCopyNumberValue = '0';
            testExpectedValidTooltip(sample, ASCNCopyNumberValue.HETLOSS);
        }
    );

    it(
        'no wgd with major copy number of 1 and minor copy number of 1 displays ' +
            ASCNCopyNumberValue.DIPLOID.toLowerCase() +
            ' in tooltip',
        () => {
            let sample = initSample();
            sample.wgdValue = 'no WGD';
            sample.totalCopyNumberValue = '2';
            sample.minorCopyNumberValue = '1';
            testExpectedValidTooltip(sample, ASCNCopyNumberValue.DIPLOID);
        }
    );

    it(
        'no wgd with major copy number of 2 and minor copy number of 1 displays ' +
            ASCNCopyNumberValue.GAIN.toLowerCase() +
            ' in tooltip',
        () => {
            let sample = initSample();
            sample.wgdValue = 'no WGD';
            sample.totalCopyNumberValue = '3';
            sample.minorCopyNumberValue = '1';
            testExpectedValidTooltip(sample, ASCNCopyNumberValue.GAIN);
        }
    );

    it(
        'wgd with major copy number of 1 and minor copy number of 0 displays ' +
            ASCNCopyNumberValue.LOSSBEFOREAFTER.toLowerCase() +
            ' in tooltip',
        () => {
            let sample = initSample();
            sample.wgdValue = 'WGD';
            sample.totalCopyNumberValue = '1';
            sample.minorCopyNumberValue = '0';
            testExpectedValidTooltip(
                sample,
                ASCNCopyNumberValue.LOSSBEFOREAFTER
            );
        }
    );

    it(
        'wgd with major copy number of 1 and minor copy number of 1 displays ' +
            ASCNCopyNumberValue.DOUBLELOSSAFTER.toLowerCase() +
            ' in tooltip',
        () => {
            let sample = initSample();
            sample.wgdValue = 'WGD';
            sample.totalCopyNumberValue = '2';
            sample.minorCopyNumberValue = '1';
            testExpectedValidTooltip(
                sample,
                ASCNCopyNumberValue.DOUBLELOSSAFTER
            );
        }
    );

    it(
        'wgd with major copy number of 2 and minor copy number of 1 displays ' +
            ASCNCopyNumberValue.LOSSAFTER.toLowerCase() +
            ' in tooltip',
        () => {
            let sample = initSample();
            sample.wgdValue = 'WGD';
            sample.totalCopyNumberValue = '3';
            sample.minorCopyNumberValue = '1';
            testExpectedValidTooltip(sample, ASCNCopyNumberValue.LOSSAFTER);
        }
    );

    it('invalid wgd displays ' + ASCNCopyNumberValue.NA + ' in tooltip', () => {
        let sample = initSample();
        sample.wgdValue = 'not in table';
        sample.totalCopyNumberValue = '3';
        sample.minorCopyNumberValue = '1';
        testExpectedInvalidTooltip(sample);
    });

    it(
        'invalid major copy number displays ' +
            ASCNCopyNumberValue.NA +
            ' in tooltip',
        () => {
            let sample = initSample();
            sample.wgdValue = 'WGD';
            sample.totalCopyNumberValue = '999';
            sample.minorCopyNumberValue = '1';
            testExpectedInvalidTooltip(sample);
        }
    );

    it(
        'invalid minor copy number displays ' +
            ASCNCopyNumberValue.NA +
            ' in tooltip',
        () => {
            let sample = initSample();
            sample.wgdValue = 'WGD';
            sample.totalCopyNumberValue = '3';
            sample.minorCopyNumberValue = '999';
            testExpectedInvalidTooltip(sample);
        }
    );

    after(() => {});
});
