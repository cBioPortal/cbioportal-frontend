import * as _ from 'lodash';
import { ReactWrapper, mount } from 'enzyme';
import { assert } from 'chai';
import { initMutation } from 'test/MutationMockUtils';
import { getDefaultClonalColumnDefinition } from './ClonalColumnFormatter';
import { Mutation } from 'cbioportal-ts-api-client';

describe('ClonalColumnFormatter', () => {
    function testExpectedClonalElementProperties(
        clonalElementProperties: any,
        expectedSampleId: string,
        expectedClonalValue: string,
        expectedCCFMCopies: string
    ) {
        assert.equal(clonalElementProperties['sampleId'], expectedSampleId);
        assert.equal(
            clonalElementProperties['clonalValue'],
            expectedClonalValue
        );
        assert.equal(clonalElementProperties['ccfMCopies'], expectedCCFMCopies);
    }

    function testExpectedNumberOfClonalElements(
        columnCell: ReactWrapper<any, any>,
        expectedNumber: number
    ) {
        assert.equal(
            columnCell.find('ClonalElement').length,
            expectedNumber,
            'Does not match expected number of ClonalElement(s)'
        );
    }

    // backend API currently does not include ASCN fields if no data available
    // completely drops data member, instead of returning default "null"/"" value
    function createEmptyMutation() {
        let emptyMutation: Mutation = initMutation({
            sampleId: 'S003',
            alleleSpecificCopyNumber: {
                totalCopyNumber: 2,
                minorCopyNumber: 1,
            },
        });
        delete emptyMutation.alleleSpecificCopyNumber.clonal;
        delete emptyMutation.alleleSpecificCopyNumber.ccfMCopies;
        return emptyMutation;
    }

    const mutations: Mutation[] = [
        // Clonal 'yes' case
        initMutation({
            sampleId: 'S001',
            alleleSpecificCopyNumber: {
                ccfMCopies: 1,
                clonal: true,
            },
        }),
        // Clonal 'no' case
        initMutation({
            sampleId: 'S002',
            alleleSpecificCopyNumber: {
                ccfMCopies: 0.85,
                clonal: false,
            },
        }),
        // Clonal NA case
        createEmptyMutation(),
    ];

    let clonalColumnTest: ReactWrapper<any, any>;
    let clonalNoComponent: ReactWrapper<any, any>;

    before(() => {});

    it('has expected number of ClonalElement components', () => {
        clonalColumnTest = mount(
            getDefaultClonalColumnDefinition(
                ['S001', 'S002', 'S003'],
                null
            ).render(mutations)
        );
        testExpectedNumberOfClonalElements(clonalColumnTest, 3);

        clonalColumnTest = mount(
            getDefaultClonalColumnDefinition().render(mutations)
        );
        testExpectedNumberOfClonalElements(clonalColumnTest, 1);
    });

    it('generated ClonalElement componenets use correct property values', () => {
        clonalColumnTest = mount(
            getDefaultClonalColumnDefinition(
                ['S001', 'S002', 'S003'],
                null
            ).render(mutations)
        );

        let sampleToClonalElement: { [key: string]: any } = {};
        clonalColumnTest.find('ClonalElement').forEach(node => {
            var sampleIdProp: string = node.prop('sampleId');
            sampleToClonalElement[sampleIdProp] = node.props();
        });

        testExpectedClonalElementProperties(
            sampleToClonalElement['S001'],
            'S001',
            'yes',
            '1'
        );
        testExpectedClonalElementProperties(
            sampleToClonalElement['S002'],
            'S002',
            'no',
            '0.85'
        );
        testExpectedClonalElementProperties(
            sampleToClonalElement['S003'],
            'S003',
            'NA',
            'NA'
        );
    });
});
