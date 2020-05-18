import * as _ from 'lodash';
import { ReactWrapper, mount } from 'enzyme';
import { assert, expect } from 'chai';
import { initMutation } from 'test/MutationMockUtils';
import { getDefaultMutantCopiesColumnDefinition } from './MutantCopiesColumnFormatter';
import { Mutation, AlleleSpecificCopyNumber } from 'cbioportal-ts-api-client';

describe('MutantCopiesColumnFormatter', () => {
    function testExpectedMutantCopiesElementProperties(
        mutantCopiesElementProperties: any,
        expectedSampleId: string,
        expectedTotalCopyNumberValue: string,
        expectedMutantCopiesValue: string
    ) {
        expect(mutantCopiesElementProperties['sampleId']).to.equal(
            expectedSampleId
        );
        expect(mutantCopiesElementProperties['totalCopyNumberValue']).to.equal(
            expectedTotalCopyNumberValue
        );
        expect(mutantCopiesElementProperties['mutantCopiesValue']).to.equal(
            expectedMutantCopiesValue
        );
    }

    function testExpectedNumberOfMutantCopiesElements(
        columnCell: ReactWrapper<any, any>,
        expectedNumber: number
    ) {
        expect(columnCell.find('MutantCopiesElement')).to.have.length(
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
                mutantCopies: 1,
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

    // one valid, one missing tcn, one missing mutantCopies, one w/o ASCN
    const mutations: Mutation[] = [
        // MutantCopies 'yes' case
        initMutation({
            sampleId: 'S001',
            alleleSpecificCopyNumber: {
                totalCopyNumber: 4,
                mutantCopies: 1,
            },
        }),
        // missing total copy number
        createMutationWithMissingData('S002', ['totalCopyNumber']),
        initMutation({
            sampleId: 'S003',
            alleleSpecificCopyNumber: {
                totalCopyNumber: 3,
                mutantCopies: 2,
            },
        }),
        initMutation({
            sampleId: 'S004',
            alleleSpecificCopyNumber: {
                totalCopyNumber: 2,
                mutantCopies: 1,
            },
        }),
        // missing mutant copies
        createMutationWithMissingData('S005', ['mutantCopies']),
        // no ascn data at all
        createMutationWithMissingData('S006', ['alleleSpecificCopyNumber']),
    ];

    before(() => {});

    it('has expected number of MutantCopiesElement components', () => {
        // only mutations with tcn/mutantCopies available map to an element
        let mutantCopiesColumnTest = mount(
            getDefaultMutantCopiesColumnDefinition(
                ['S001', 'S002', 'S003', 'S004', 'S005', 'S006'],
                null
            ).render(mutations)
        );
        testExpectedNumberOfMutantCopiesElements(mutantCopiesColumnTest, 3);

        mutantCopiesColumnTest = mount(
            getDefaultMutantCopiesColumnDefinition().render(mutations)
        );
        testExpectedNumberOfMutantCopiesElements(mutantCopiesColumnTest, 1);

        // nothing returned for single NA one
        mutantCopiesColumnTest = mount(
            getDefaultMutantCopiesColumnDefinition().render([
                createMutationWithMissingData('S001', [
                    'alleleSpecificCopyNumber',
                ]),
            ])
        );
        testExpectedNumberOfMutantCopiesElements(mutantCopiesColumnTest, 0);
    });

    it('generated MutantCopiesElement components use correct property values', () => {
        let mutantCopiesColumnTest = mount(
            getDefaultMutantCopiesColumnDefinition(
                ['S001', 'S002', 'S003', 'S004', 'S005', 'S006'],
                null
            ).render(mutations)
        );

        let sampleToMutantCopiesElement: { [key: string]: any } = {};
        mutantCopiesColumnTest.find('MutantCopiesElement').forEach(node => {
            var sampleIdProp: string = node.prop('sampleId');
            sampleToMutantCopiesElement[sampleIdProp] = node.props();
        });

        testExpectedMutantCopiesElementProperties(
            sampleToMutantCopiesElement['S001'],
            'S001',
            '4',
            '1'
        );
        expect(sampleToMutantCopiesElement['S002']).to.not.exist;
        testExpectedMutantCopiesElementProperties(
            sampleToMutantCopiesElement['S003'],
            'S003',
            '3',
            '2'
        );
        testExpectedMutantCopiesElementProperties(
            sampleToMutantCopiesElement['S004'],
            'S004',
            '2',
            '1'
        );
        expect(sampleToMutantCopiesElement['S005']).to.not.exist;
        expect(sampleToMutantCopiesElement['S006']).to.not.exist;
    });

    it('semi-colons placed after correct MutantCopiesElement(s)', () => {
        let mutantCopiesColumnTest = mount(
            getDefaultMutantCopiesColumnDefinition(
                ['S001', 'S002', 'S003', 'S004', 'S005', 'S006'],
                null
            ).render(mutations)
        );
        // not last and valid - has delimiter
        expect(
            mutantCopiesColumnTest
                .findWhere(
                    node => node.type() === 'span' && node.key() === 'S001'
                )
                .text()
        ).to.have.string(';');
        // not last but valid - has delimiter
        expect(
            mutantCopiesColumnTest
                .findWhere(
                    node => node.type() === 'span' && node.key() === 'S003'
                )
                .text()
        ).to.have.string(';');
        // last valid - should not have delimiter
        expect(
            mutantCopiesColumnTest
                .findWhere(
                    node => node.type() === 'span' && node.key() === 'S004'
                )
                .text()
        ).to.not.have.string(';');
    });
});
