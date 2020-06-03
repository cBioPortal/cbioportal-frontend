import * as _ from 'lodash';
import { ReactWrapper, mount } from 'enzyme';
import { assert, expect } from 'chai';
import { initMutation } from 'test/MutationMockUtils';
import { getDefaultExpectedAltCopiesColumnDefinition } from './ExpectedAltCopiesColumnFormatter';
import { Mutation, AlleleSpecificCopyNumber } from 'cbioportal-ts-api-client';

describe('ExpectedAltCopiesColumnFormatter', () => {
    function testExpectedExpectedAltCopiesElementProperties(
        expectedAltCopiesElementProperties: any,
        expectedSampleId: string,
        expectedTotalCopyNumberValue: string,
        expectedExpectedAltCopiesValue: string
    ) {
        expect(expectedAltCopiesElementProperties['sampleId']).to.equal(
            expectedSampleId
        );
        expect(
            expectedAltCopiesElementProperties['totalCopyNumberValue']
        ).to.equal(expectedTotalCopyNumberValue);
        expect(
            expectedAltCopiesElementProperties['expectedAltCopiesValue']
        ).to.equal(expectedExpectedAltCopiesValue);
    }

    function testExpectedNumberOfExpectedAltCopiesElements(
        columnCell: ReactWrapper<any, any>,
        expectedNumber: number
    ) {
        expect(columnCell.find('ExpectedAltCopiesElement')).to.have.length(
            expectedNumber
        );
    }

    // backend API currently does not include ASCN fields if no data available
    // completely drops data member, instead of returning default "null"/"" value
    function createMutationWithMissingData(
        sampleId: string,
        missingFields: string[]
    ) {
        let emptyMutation: Mutation = initMutation({
            sampleId: sampleId,
            alleleSpecificCopyNumber: {
                totalCopyNumber: 2,
                expectedAltCopies: 1,
            },
        });
        if (
            missingFields.length === 1 &&
            missingFields[0] === 'alleleSpecificCopyNumber'
        ) {
            delete emptyMutation[missingFields[0] as keyof Mutation];
        } else {
            for (let i = 0; i < missingFields.length; i++) {
                delete emptyMutation.alleleSpecificCopyNumber[
                    missingFields[i] as keyof AlleleSpecificCopyNumber
                ];
            }
        }
        return emptyMutation;
    }

    // one valid, one missing tcn, one missing expectedAltCopies, one w/o ASCN
    const mutations: Mutation[] = [
        // ExpectedAltCopies 'yes' case
        initMutation({
            sampleId: 'S001',
            alleleSpecificCopyNumber: {
                totalCopyNumber: 4,
                expectedAltCopies: 1,
            },
        }),
        // missing total copy number
        createMutationWithMissingData('S002', ['totalCopyNumber']),
        initMutation({
            sampleId: 'S003',
            alleleSpecificCopyNumber: {
                totalCopyNumber: 3,
                expectedAltCopies: 2,
            },
        }),
        initMutation({
            sampleId: 'S004',
            alleleSpecificCopyNumber: {
                totalCopyNumber: 2,
                expectedAltCopies: 1,
            },
        }),
        // missing expected alt copies
        createMutationWithMissingData('S005', ['expectedAltCopies']),
        // no ascn data at all
        createMutationWithMissingData('S006', ['alleleSpecificCopyNumber']),
    ];

    it('has expected number of ExpectedAltCopiesElement components', () => {
        // only mutations with tcn/expectedAltCopies available map to an element
        let expectedAltCopiesColumnTest = mount(
            getDefaultExpectedAltCopiesColumnDefinition(
                ['S001', 'S002', 'S003', 'S004', 'S005', 'S006'],
                null
            ).render(mutations)
        );
        testExpectedNumberOfExpectedAltCopiesElements(
            expectedAltCopiesColumnTest,
            3
        );

        expectedAltCopiesColumnTest = mount(
            getDefaultExpectedAltCopiesColumnDefinition().render(mutations)
        );
        testExpectedNumberOfExpectedAltCopiesElements(
            expectedAltCopiesColumnTest,
            1
        );

        // nothing returned for single NA one
        expectedAltCopiesColumnTest = mount(
            getDefaultExpectedAltCopiesColumnDefinition().render([
                createMutationWithMissingData('S001', [
                    'alleleSpecificCopyNumber',
                ]),
            ])
        );
        testExpectedNumberOfExpectedAltCopiesElements(
            expectedAltCopiesColumnTest,
            0
        );
    });

    it('generated ExpectedAltCopiesElement components use correct property values', () => {
        let expectedAltCopiesColumnTest = mount(
            getDefaultExpectedAltCopiesColumnDefinition(
                ['S001', 'S002', 'S003', 'S004', 'S005', 'S006'],
                null
            ).render(mutations)
        );

        let sampleToExpectedAltCopiesElement: { [key: string]: any } = {};
        expectedAltCopiesColumnTest
            .find('ExpectedAltCopiesElement')
            .forEach(node => {
                var sampleIdProp: string = node.prop('sampleId');
                sampleToExpectedAltCopiesElement[sampleIdProp] = node.props();
            });

        testExpectedExpectedAltCopiesElementProperties(
            sampleToExpectedAltCopiesElement['S001'],
            'S001',
            '4',
            '1'
        );
        expect(sampleToExpectedAltCopiesElement['S002']).to.not.exist;
        testExpectedExpectedAltCopiesElementProperties(
            sampleToExpectedAltCopiesElement['S003'],
            'S003',
            '3',
            '2'
        );
        testExpectedExpectedAltCopiesElementProperties(
            sampleToExpectedAltCopiesElement['S004'],
            'S004',
            '2',
            '1'
        );
        expect(sampleToExpectedAltCopiesElement['S005']).to.not.exist;
        expect(sampleToExpectedAltCopiesElement['S006']).to.not.exist;
    });

    it('semi-colons placed after correct ExpectedAltCopiesElement(s)', () => {
        let expectedAltCopiesColumnTest = mount(
            getDefaultExpectedAltCopiesColumnDefinition(
                ['S001', 'S002', 'S003', 'S004', 'S005', 'S006'],
                null
            ).render(mutations)
        );
        // not last and valid - has delimiter
        expect(
            expectedAltCopiesColumnTest
                .findWhere(
                    node => node.type() === 'span' && node.key() === 'S001'
                )
                .text()
        ).to.have.string(';');
        // not last but valid - has delimiter
        expect(
            expectedAltCopiesColumnTest
                .findWhere(
                    node => node.type() === 'span' && node.key() === 'S003'
                )
                .text()
        ).to.have.string(';');
        // last valid - should not have delimiter
        expect(
            expectedAltCopiesColumnTest
                .findWhere(
                    node => node.type() === 'span' && node.key() === 'S004'
                )
                .text()
        ).to.not.have.string(';');
    });
});
