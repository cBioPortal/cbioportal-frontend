import { ReactWrapper, mount } from 'enzyme';
import * as React from 'react';
import { expect } from 'chai';
import SampleManager from 'pages/patientView/SampleManager';
import {
    default as ASCNCopyNumberElement,
    ASCNCopyNumberElementTooltip,
    ASCNCopyNumberValueEnum,
} from './ASCNCopyNumberElement';
/* Test Design:

    Test of copy number element rendering
    - nothing is shown if the total copy number or the wgd value is NA
    - otherwise the total copy number is shown as text

    Test "WGD" tag next to the copy number
    - test wgd tag is displayed when properties show WGD
    - test wgd tag is not present when properties do not show WGD

    Test tooltip
    - test ASCNCopyNumberValueEnum text correct {Gain, Diploid, Double Loss After, ...}
    - test "WGD"/"no WGD" text correct
    - test total copy number text correct "with total copy number of #"
    - test minor copy number text correct "and a minor copy number of #"
    - icon for sample (if multiple samples present) from samplemanager not tested

*/

describe('ASCNCopyNumberElement', () => {
    let nullSampleManager = new SampleManager([], []);

    function initSample() {
        return {
            sampleId: 'default',
            wgdValue: 'WGD',
            totalCopyNumberValue: '0',
            minorCopyNumberValue: '0',
            ascnCopyNumberValue: '0',
            sampleManager: nullSampleManager,
        };
    }

    function testNoValueASCNCopyNumberElement(componentProperties: any) {
        const ascnCopyNumberElement = mount(
            <ASCNCopyNumberElement {...componentProperties} />
        );
        expect(
            ascnCopyNumberElement.find('[data-test="ascn-copy-number-value"]')
                .length
        ).to.equal(0);
    }

    function testExpectedTCNValidASCNCopyNumberElement(
        componentProperties: any
    ) {
        const ascnCopyNumberElement = mount(
            <ASCNCopyNumberElement {...componentProperties} />
        );

        const valueElement = ascnCopyNumberElement.find(
            'span[data-test="ascn-copy-number-value"]'
        );
        expect(
            valueElement
                .text()
                .startsWith(componentProperties['totalCopyNumberValue'])
        ).to.equal(
            true,
            "Expected the value to show total copy number '" +
                componentProperties['totalCopyNumberValue'] +
                "' but it did not"
        );
    }

    function testExpectedWGDASCNCopyNumberElement(
        componentProperties: any,
        expectWgd: boolean
    ) {
        const ascnCopyNumberElement = mount(
            <ASCNCopyNumberElement {...componentProperties} />
        );

        const wgdTag = ascnCopyNumberElement.findWhere(
            n => n.type() === 'span' && n.text() === 'WGD'
        );

        if (expectWgd) {
            expect(wgdTag.length).to.not.equal(
                0,
                "Expected to find a 'WGD' tag but did not"
            );
        } else {
            expect(wgdTag.length).to.equal(
                0,
                "Expected no 'WGD' tag but found one"
            );
        }
    }

    function countSpansWithCopyNumberText(
        ascnCopyNumberElementTooltip: ReactWrapper<any, any>,
        componentProperties: any
    ): number {
        const spanElements: ReactWrapper<
            any,
            any
        > = ascnCopyNumberElementTooltip.findWhere(
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
        return spanElements.length;
    }

    function testExpectedValidTooltip(
        componentProperties: any,
        ascnCopyNumberCall: string
    ) {
        /* tooltip should contain something like this:
            <span>
                <span>
                    <b>{ascnCopyNumberCall}</b>
                    <span>{text with wgd, total copy number, and minor copy number}</span>
                </span>
            </span>
        */

        const ascnCopyNumberElementTooltip = mount(
            <ASCNCopyNumberElementTooltip {...componentProperties} />
        );

        const bElement = ascnCopyNumberElementTooltip.find('b');
        expect(bElement.text()).to.be.equal(ascnCopyNumberCall.toLowerCase());

        const spanCount = countSpansWithCopyNumberText(
            ascnCopyNumberElementTooltip,
            componentProperties
        );

        // the span with our text is nested in 2 other spans (see example above) so we match 3
        expect(spanCount).to.equal(
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
        expect(bElement).to.have.length(0);

        const spanCount = countSpansWithCopyNumberText(
            ascnCopyNumberElementTooltip,
            componentProperties
        );
        expect(spanCount).to.equal(
            0,
            "Expected zero 'span' elements containing specified values but failed"
        );
    }

    it('shows the total copy number for any ascn copy number call', () => {
        let sample = initSample();
        sample.ascnCopyNumberValue = '999';
        sample.totalCopyNumberValue = '4';
        testExpectedTCNValidASCNCopyNumberElement(sample);
    });

    it('shows nothing if the total copy number is NA', () => {
        let sample = initSample();
        sample.totalCopyNumberValue = ASCNCopyNumberValueEnum.NA;
        testNoValueASCNCopyNumberElement(sample);
    });

    it('shows nothing if the WGD status is NA', () => {
        let sample = initSample();
        sample.wgdValue = ASCNCopyNumberValueEnum.NA;
        testNoValueASCNCopyNumberElement(sample);
    });

    it('total copy number should be displayed', () => {
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
            ASCNCopyNumberValueEnum.HETLOSS.toLowerCase() +
            ' in tooltip',
        () => {
            let sample = initSample();
            sample.wgdValue = 'no WGD';
            sample.totalCopyNumberValue = '1';
            sample.minorCopyNumberValue = '0';
            testExpectedValidTooltip(sample, ASCNCopyNumberValueEnum.HETLOSS);
        }
    );

    it(
        'no wgd with major copy number of 1 and minor copy number of 1 displays ' +
            ASCNCopyNumberValueEnum.DIPLOID.toLowerCase() +
            ' in tooltip',
        () => {
            let sample = initSample();
            sample.wgdValue = 'no WGD';
            sample.totalCopyNumberValue = '2';
            sample.minorCopyNumberValue = '1';
            testExpectedValidTooltip(sample, ASCNCopyNumberValueEnum.DIPLOID);
        }
    );

    it(
        'no wgd with major copy number of 2 and minor copy number of 1 displays ' +
            ASCNCopyNumberValueEnum.GAIN.toLowerCase() +
            ' in tooltip',
        () => {
            let sample = initSample();
            sample.wgdValue = 'no WGD';
            sample.totalCopyNumberValue = '3';
            sample.minorCopyNumberValue = '1';
            testExpectedValidTooltip(sample, ASCNCopyNumberValueEnum.GAIN);
        }
    );

    it(
        'wgd with major copy number of 1 and minor copy number of 0 displays ' +
            ASCNCopyNumberValueEnum.LOSSBEFOREAFTER.toLowerCase() +
            ' in tooltip',
        () => {
            let sample = initSample();
            sample.wgdValue = 'WGD';
            sample.totalCopyNumberValue = '1';
            sample.minorCopyNumberValue = '0';
            testExpectedValidTooltip(
                sample,
                ASCNCopyNumberValueEnum.LOSSBEFOREAFTER
            );
        }
    );

    it(
        'wgd with major copy number of 1 and minor copy number of 1 displays ' +
            ASCNCopyNumberValueEnum.DOUBLELOSSAFTER.toLowerCase() +
            ' in tooltip',
        () => {
            let sample = initSample();
            sample.wgdValue = 'WGD';
            sample.totalCopyNumberValue = '2';
            sample.minorCopyNumberValue = '1';
            testExpectedValidTooltip(
                sample,
                ASCNCopyNumberValueEnum.DOUBLELOSSAFTER
            );
        }
    );

    it(
        'wgd with major copy number of 2 and minor copy number of 1 displays ' +
            ASCNCopyNumberValueEnum.LOSSAFTER.toLowerCase() +
            ' in tooltip',
        () => {
            let sample = initSample();
            sample.wgdValue = 'WGD';
            sample.totalCopyNumberValue = '3';
            sample.minorCopyNumberValue = '1';
            testExpectedValidTooltip(sample, ASCNCopyNumberValueEnum.LOSSAFTER);
        }
    );

    it(
        'invalid wgd displays ' + ASCNCopyNumberValueEnum.NA + ' in tooltip',
        () => {
            let sample = initSample();
            sample.wgdValue = 'not in table';
            sample.totalCopyNumberValue = '3';
            sample.minorCopyNumberValue = '1';
            testExpectedInvalidTooltip(sample);
        }
    );

    it(
        'invalid major copy number displays ' +
            ASCNCopyNumberValueEnum.NA +
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
            ASCNCopyNumberValueEnum.NA +
            ' in tooltip',
        () => {
            let sample = initSample();
            sample.wgdValue = 'WGD';
            sample.totalCopyNumberValue = '3';
            sample.minorCopyNumberValue = '999';
            testExpectedInvalidTooltip(sample);
        }
    );
});
