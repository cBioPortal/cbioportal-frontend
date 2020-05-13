import * as _ from 'lodash';
import { ReactWrapper, mount } from 'enzyme';
import { assert } from 'chai';
import { Mutation, ClinicalData } from 'cbioportal-ts-api-client';
import { initMutation } from 'test/MutationMockUtils';
import { initClinicalData } from 'test/ClinicalDataMockUtils';
import { CAID_FACETS_WGD } from 'shared/constants';
import {
    ASCN_AMP,
    ASCN_GAIN,
    ASCN_LIGHTGREY,
    ASCN_HETLOSS,
    ASCN_HOMDEL,
    ASCN_BLACK,
} from 'shared/lib/Colors';

import { getDefaultASCNCopyNumberColumnDefinition } from './ASCNCopyNumberColumnFormatter';

/* Test design
    This column formatter renders a complex element which includes a hoverover tooltip popup.
    The rendered elements in a single table cell include:
        - a number (the # of samples with the variant) of copy number icon svg elements which vary by:
            - fill-color : selected from the set {
                        ASCN_AMP = #ff0000 (red) [2]
                        ASCN_GAIN #e15b5b (a salmon-ish color close to web color 'IndianRed') [1]
                        ASCN_LIGHTGREY #bcbcbc (close to web color 'Silver') [0]
                        ASCN_HETLOSS #2a5eea (a medium blue color close to web color 'DodgerBlue') [-1]
                        ASCN_HOMDEL #0000ff (blue) [-2]
                        ASCN_BLACK #000000 (black) [anything else]
                    } based on the value of mutation attribute alleleSpecificCopyNumber.ascnIntegerCopyNumber (e.g. [1])
            - text : showing the value of mutation attribute alleleSpecificCopyNumber.TotalCopyNumber
            - optional "WGD" suprascript, evident when the sample represented has clinical
                    attribute 'FACETS_WGD' containing a value "WGD" (and not "NO_WGD")
        - a hoverover tooltip showing one line per sample having the variant, each line with
            - a sample number icon using black SVG circle with superimposed white numeral
            - a text label (e.g. "diploid") corresponding to the ASCNCopyNumberValue
            - text indication of presence/absence of WGD clinical attribute
            - text reporting of TOTAL_COPY_NUMBER and MINOR_COPY_NUMBER mutation attribute values
            
    test cases explore various expected combinations of the above elements:
        - cases involving only a single sample:
            - without any set ASCN mutation attriubutes
            - with NO_WGD and ASCNCopyNumberValue from each of {'-2','-1','0','1','2','999','NA'}
            - with WGD and ASCNCopyNumberValue from each of {see_above}
            - with NO_WGD and TotalCopyNumber of either '1' or '2' and ASCNCopyNumberValue of '2'
            - with WGD and TotalCopyNumber of either '1' or '2' and ASCNCopyNumberValue of '2'
        - cases involving two samples:
            - without any set ASCN mutation attriubutes
            - sample1 NO_WGD, ASCNCopyNumberValue from each of {see_above}; sample2 NO_WGD, ASCN_AMP
            - sample1 NO_WGD, ASCN_HOMDEL; sample2 NO_WGD, ASCNCopyNumberValue from each of {see_above}
            - sample1 NO_WGD, ASCN_HETLOSS; sample2 WGD, ASCN_GAIN
            - sample1 WGD, ASCN_HOMDEL; sample2 NO_WGD, ASCN_GAIN
            - sample1 WGD, ASCN_LIGHTGREY [0]; sample2 WGD, ASCN_BLACK [999]
            - sample1 and sample 2 with NO_WGD and TotalCopyNumber of either '1' or '2' and ASCNCopyNumberValue of '-1'
            - sample1 and sample 2 with WGD and TotalCopyNumber of either '1' or '2' and ASCNCopyNumberValue of '-1'
        - cases involving three samples:
            - sample1 WGD, ASCN_AMP; sample2 NO_WGD, ASCN_LIGHTGREY; sample3 WGD, ASCN_HOMDEL
    
    Note: all tests will test the appropriate presence of a populated tooltip popup
    Also, the first single sample test case, and second two sample test case will omit the
    samplemanager and still expect a populated tooltip to be output. Sub elementes in the tool tip
    are not tested for correctness.
*/

function createMockMutation(
    sampleId: string,
    integerCopyNumberVal?: string,
    totalCopyNumberVal?: string
) {
    if (integerCopyNumberVal) {
        return initMutation({
            sampleId: sampleId,
            alleleSpecificCopyNumber: {
                ascnMethod: 'mock_ascn_method',
                ascnIntegerCopyNumber: integerCopyNumberVal,
                minorCopyNumber: 1,
                totalCopyNumber: totalCopyNumberVal,
            },
        });
    }
    return initMutation({
        sampleId: sampleId,
    });
}

function test_copy_number_render(
    cellWrapper: ReactWrapper<any, any>,
    expectedWgdValue: string,
    expectedIntegercopyNumberValue: string,
    expectedTotalCopyNumberValue: string,
    expectedBackgroundColor: string
) {
    // console.log(' samples with ascn data: ');
    // cellWrapper.find('text').forEach(el => {
    //     console.log(el.html());
    // });
    // console.log(' samples with ascn data: ');
    // cellWrapper.find('rect').forEach(el => {
    //     console.log(el.prop('fill'));
    //     console.log(el.prop('opacity'));
    // });
    // console.log(' samples without ascn data: ');
    // componentWithoutAscnCopyNumberColumn
    //     .find('svg')
    //     .forEach(spanElement => {
    //         console.log(spanElement.html());
    //     });
    assert.isDefined(
        cellWrapper.find('text'),
        'ASCN copy number elements expected'
    );
    let rectangleElement = cellWrapper.find('rect');
    assert.isDefined(rectangleElement, 'ASCN copy number elements expected');
    assert.equal(
        rectangleElement.prop('fill'),
        expectedBackgroundColor,
        'color wrong'
    );

    let toolTipElement: any = cellWrapper.find('DefaultTooltip');
    if (expectedBackgroundColor === ASCN_BLACK) {
        assert.notEqual(
            toolTipElement,
            {},
            'tooltip was present when not expected.'
        );
        return; // if we expect invisible black box, don't expect the wgd text element or anything else
    }
    let toolTipOverlay: any = toolTipElement.prop('overlay');
    assert.isTrue(
        toolTipOverlay && toolTipOverlay.props.minorCopyNumberValue === '1',
        'tooltip was expected but not present.'
    );
    assert.isBelow(
        cellWrapper.find('text').length,
        3,
        'too many text elements to interpret'
    );
    let wgdText: string = '';
    let copyNumberText: string = '';
    cellWrapper.find('text').forEach(el => {
        if (el.text() === 'WGD') {
            wgdText = el.text();
        } else {
            copyNumberText = el.text();
        }
    });
    assert.equal(wgdText, expectedWgdValue, 'WGD indicator wrong');
    assert.equal(
        copyNumberText,
        expectedTotalCopyNumberValue,
        'copy number wrong'
    );
}

describe('ASCNCopyNumberColumnFormatter', () => {
    /* mock sample ids */
    const sampleId1WithAscnData: string = 'sample_1_with_ascn_data';
    const sampleId2WithAscnData: string = 'sample_2_with_ascn_data';
    const sampleId3WithAscnData: string = 'sample_3_with_ascn_data';
    const sampleId6WithoutAscnData: string = 'sample_6_without_ascn_data';
    const sampleId7WithoutAscnData: string = 'sample_7_without_ascn_data';
    const sampleIds1: string[] = [sampleId1WithAscnData];
    const sampleIds12: string[] = [
        sampleId1WithAscnData,
        sampleId2WithAscnData,
    ];
    const sampleIds123: string[] = [
        sampleId1WithAscnData,
        sampleId2WithAscnData,
        sampleId3WithAscnData,
    ];
    const sampleIds6: string[] = [sampleId6WithoutAscnData];
    const sampleIds67: string[] = [
        sampleId6WithoutAscnData,
        sampleId7WithoutAscnData,
    ];
    /* mock mutation data */
    const mutationS1Amp = createMockMutation(sampleId1WithAscnData, '2', '1');
    const mutationS1Gain = createMockMutation(sampleId1WithAscnData, '1', '1');
    const mutationS1Diploid = createMockMutation(
        sampleId1WithAscnData,
        '0',
        '1'
    );
    const mutationS1Hetloss = createMockMutation(
        sampleId1WithAscnData,
        '-1',
        '1'
    );
    const mutationS1Homdel = createMockMutation(
        sampleId1WithAscnData,
        '-2',
        '1'
    );
    const mutationS1Other = createMockMutation(
        sampleId1WithAscnData,
        '999',
        '1'
    );
    const mutationS1NA = createMockMutation(sampleId1WithAscnData, 'NA', '1');
    const mutationS2Amp = createMockMutation(sampleId2WithAscnData, '2', '1');
    const mutationS2Gain = createMockMutation(sampleId2WithAscnData, '1', '1');
    const mutationS2Diploid = createMockMutation(
        sampleId2WithAscnData,
        '0',
        '1'
    );
    const mutationS2Hetloss = createMockMutation(
        sampleId2WithAscnData,
        '-1',
        '1'
    );
    const mutationS2Homdel = createMockMutation(
        sampleId2WithAscnData,
        '-2',
        '1'
    );
    const mutationS2Other = createMockMutation(
        sampleId2WithAscnData,
        '999',
        '1'
    );
    const mutationS2NA = createMockMutation(sampleId2WithAscnData, 'NA', '1');
    const mutationS3Amp = createMockMutation(sampleId3WithAscnData, '2', '1');
    const mutationS3Gain = createMockMutation(sampleId3WithAscnData, '1', '1');
    const mutationS3Diploid = createMockMutation(
        sampleId3WithAscnData,
        '0',
        '1'
    );
    const mutationS3Hetloss = createMockMutation(
        sampleId3WithAscnData,
        '-1',
        '1'
    );
    const mutationS3Homdel = createMockMutation(
        sampleId3WithAscnData,
        '-2',
        '1'
    );
    const mutationS3Other = createMockMutation(
        sampleId3WithAscnData,
        '999',
        '1'
    );
    const mutationS3NA = createMockMutation(sampleId3WithAscnData, 'NA', '1');
    const mutationS6 = createMockMutation(sampleId6WithoutAscnData);
    const mutationS7 = createMockMutation(sampleId7WithoutAscnData);
    const mutationsS1Amp: Mutation[] = [mutationS1Amp];
    const mutationsS1Gain: Mutation[] = [mutationS1Gain];
    const mutationsS1Diploid: Mutation[] = [mutationS1Diploid];
    const mutationsS1Hetloss: Mutation[] = [mutationS1Hetloss];
    const mutationsS1Homdel: Mutation[] = [mutationS1Homdel];
    const mutationsS1Other: Mutation[] = [mutationS1Other];
    const mutationsS1NA: Mutation[] = [mutationS1NA];
    const mutationsS6: Mutation[] = [mutationS6];
    /* mock clinical attributes */
    const clinicalDataSampleIdForSample1: ClinicalData = initClinicalData({
        clinicalAttributeId: 'SAMPLE_ID',
        value: sampleId1WithAscnData,
    });
    // const clinicalDataSampleIdForSample6: ClinicalData = initClinicalData(
    //     {
    //         clinicalAttributeId: 'SAMPLE_ID',
    //         value: sampleId6WithoutAscnData,
    //     }
    // );
    const clinicalDataWgd: ClinicalData = initClinicalData({
        clinicalAttributeId: CAID_FACETS_WGD,
        value: 'WGD',
    });
    const clinicalDataNoWgd: ClinicalData = initClinicalData({
        clinicalAttributeId: CAID_FACETS_WGD,
        value: 'NO_WGD',
    });
    // const sampleIdToClinicalDataMapWithoutAscnData: {
    //     [sampleId: string]: ClinicalData[];
    // } = { sampleIdWithoutAscnData: [clinicalDataSampleIdForSampleWithoutAscnData] };
    const sampleIdToClinicalDataMapWithWgd: {
        [sampleId: string]: ClinicalData[];
    } = {
        [sampleId1WithAscnData]: [
            clinicalDataSampleIdForSample1,
            clinicalDataWgd,
        ],
    };
    const sampleIdToClinicalDataMapWithoutWgd: {
        [sampleId: string]: ClinicalData[];
    } = {
        [sampleId1WithAscnData]: [
            clinicalDataSampleIdForSample1,
            clinicalDataNoWgd,
        ],
    };
    /* mock react components */
    let componentS1AmpNoWgd: ReactWrapper<any, any>;
    let componentS1GainNoWgd: ReactWrapper<any, any>;
    let componentS1DiploidNoWgd: ReactWrapper<any, any>;
    let componentS1HetlossNoWgd: ReactWrapper<any, any>;
    let componentS1HomdelNoWgd: ReactWrapper<any, any>;
    let componentS1OtherNoWgd: ReactWrapper<any, any>;
    let componentS1NANoWgd: ReactWrapper<any, any>;
    let componentS1AmpWgd: ReactWrapper<any, any>;
    let componentS1GainWgd: ReactWrapper<any, any>;
    let componentS1DiploidWgd: ReactWrapper<any, any>;
    let componentS1HetlossWgd: ReactWrapper<any, any>;
    let componentS1HomdelWgd: ReactWrapper<any, any>;
    let componentS1OtherWgd: ReactWrapper<any, any>;
    let componentS1NAWgd: ReactWrapper<any, any>;
    let componentS6: ReactWrapper<any, any>;

    before(() => {
        componentS1AmpNoWgd = mount(
            getDefaultASCNCopyNumberColumnDefinition(
                sampleIds1,
                sampleIdToClinicalDataMapWithoutWgd
            ).render(mutationsS1Amp)
        );
        componentS1GainNoWgd = mount(
            getDefaultASCNCopyNumberColumnDefinition(
                sampleIds1,
                sampleIdToClinicalDataMapWithoutWgd
            ).render(mutationsS1Gain)
        );
        componentS1DiploidNoWgd = mount(
            getDefaultASCNCopyNumberColumnDefinition(
                sampleIds1,
                sampleIdToClinicalDataMapWithoutWgd
            ).render(mutationsS1Diploid)
        );
        componentS1HetlossNoWgd = mount(
            getDefaultASCNCopyNumberColumnDefinition(
                sampleIds1,
                sampleIdToClinicalDataMapWithoutWgd
            ).render(mutationsS1Hetloss)
        );
        componentS1HomdelNoWgd = mount(
            getDefaultASCNCopyNumberColumnDefinition(
                sampleIds1,
                sampleIdToClinicalDataMapWithoutWgd
            ).render(mutationsS1Homdel)
        );
        componentS1OtherNoWgd = mount(
            getDefaultASCNCopyNumberColumnDefinition(
                sampleIds1,
                sampleIdToClinicalDataMapWithoutWgd
            ).render(mutationsS1Other)
        );
        componentS1NANoWgd = mount(
            getDefaultASCNCopyNumberColumnDefinition(
                sampleIds1,
                sampleIdToClinicalDataMapWithoutWgd
            ).render(mutationsS1NA)
        );
        componentS1AmpWgd = mount(
            getDefaultASCNCopyNumberColumnDefinition(
                sampleIds1,
                sampleIdToClinicalDataMapWithWgd
            ).render(mutationsS1Amp)
        );
        componentS1GainWgd = mount(
            getDefaultASCNCopyNumberColumnDefinition(
                sampleIds1,
                sampleIdToClinicalDataMapWithWgd
            ).render(mutationsS1Gain)
        );
        componentS1DiploidWgd = mount(
            getDefaultASCNCopyNumberColumnDefinition(
                sampleIds1,
                sampleIdToClinicalDataMapWithWgd
            ).render(mutationsS1Diploid)
        );
        componentS1HetlossWgd = mount(
            getDefaultASCNCopyNumberColumnDefinition(
                sampleIds1,
                sampleIdToClinicalDataMapWithWgd
            ).render(mutationsS1Hetloss)
        );
        componentS1HomdelWgd = mount(
            getDefaultASCNCopyNumberColumnDefinition(
                sampleIds1,
                sampleIdToClinicalDataMapWithWgd
            ).render(mutationsS1Homdel)
        );
        componentS1OtherWgd = mount(
            getDefaultASCNCopyNumberColumnDefinition(
                sampleIds1,
                sampleIdToClinicalDataMapWithWgd
            ).render(mutationsS1Other)
        );
        componentS1NAWgd = mount(
            getDefaultASCNCopyNumberColumnDefinition(
                sampleIds1,
                sampleIdToClinicalDataMapWithWgd
            ).render(mutationsS1NA)
        );
        componentS6 = mount(
            getDefaultASCNCopyNumberColumnDefinition().render(mutationsS6)
        );
    });

    it('renders default (no ASCN data) sample6', () => {
        test_copy_number_render(componentS6, '', '', '', ASCN_BLACK);
    });
    it('renders sample1 Wgd Amp', () => {
        test_copy_number_render(componentS1AmpWgd, 'WGD', '2', '1', ASCN_AMP);
    });
    it('renders sample1 Wgd Gain', () => {
        test_copy_number_render(componentS1GainWgd, 'WGD', '1', '1', ASCN_GAIN);
    });
    it('renders sample1 Wgd Diploid', () => {
        test_copy_number_render(
            componentS1DiploidWgd,
            'WGD',
            '0',
            '1',
            ASCN_LIGHTGREY
        );
    });
    it('renders sample1 Wgd Hetloss', () => {
        test_copy_number_render(
            componentS1HetlossWgd,
            'WGD',
            '-1',
            '1',
            ASCN_HETLOSS
        );
    });
    it('renders sample1 Wgd Homdel', () => {
        test_copy_number_render(
            componentS1HomdelWgd,
            'WGD',
            '-2',
            '1',
            ASCN_HOMDEL
        );
    });
    it('renders sample1 Wgd Other', () => {
        test_copy_number_render(componentS1OtherWgd, '', '', '', ASCN_BLACK);
    });
    it('renders sample1 Wgd NA', () => {
        test_copy_number_render(componentS1NAWgd, '', '', '', ASCN_BLACK);
    });
    it('renders sample1 NoWgd Amp', () => {
        test_copy_number_render(componentS1AmpNoWgd, '', '2', '1', ASCN_AMP);
    });
    it('renders sample1 NoWgd Gain', () => {
        test_copy_number_render(componentS1GainNoWgd, '', '1', '1', ASCN_GAIN);
    });
    it('renders sample1 NoWgd Diploid', () => {
        test_copy_number_render(
            componentS1DiploidNoWgd,
            '',
            '0',
            '1',
            ASCN_LIGHTGREY
        );
    });
    it('renders sample1 NoWgd Hetloss', () => {
        test_copy_number_render(
            componentS1HetlossNoWgd,
            '',
            '-1',
            '1',
            ASCN_HETLOSS
        );
    });
    it('renders sample1 NoWgd Homdel', () => {
        test_copy_number_render(
            componentS1HomdelNoWgd,
            '',
            '-2',
            '1',
            ASCN_HOMDEL
        );
    });
    it('renders sample1 NoWgd Other', () => {
        test_copy_number_render(componentS1OtherNoWgd, '', '', '', ASCN_BLACK);
    });
    it('renders sample1 NoWgd NA', () => {
        test_copy_number_render(componentS1NANoWgd, '', '', '', ASCN_BLACK);
    });
    after(() => {});
});
