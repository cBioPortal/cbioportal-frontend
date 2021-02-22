import GeneColumnFormatter from './GeneColumnFormatter';
import React from 'react';
import { assert } from 'chai';
import Enzyme, { mount, ReactWrapper } from 'enzyme';
import { initMutation } from 'test/MutationMockUtils';
import Adapter from 'enzyme-adapter-react-16';

Enzyme.configure({ adapter: new Adapter() });

describe('GeneColumnFormatter', () => {
    const mutation = initMutation({
        gene: {
            hugoGeneSymbol: 'DIABLO',
        },
    });

    const tableData = [[mutation]];
    let component: ReactWrapper<any, any>;

    before(() => {
        const data = [mutation];

        // mount a single cell component (Td)
        component = mount(GeneColumnFormatter.renderFunction(data));
    });

    it('renders display value', () => {
        assert.isTrue(
            component
                .find(`span`)
                .text()
                .indexOf('DIABLO') > -1,
            'Gene symbol display value is correct'
        );
    });
});
