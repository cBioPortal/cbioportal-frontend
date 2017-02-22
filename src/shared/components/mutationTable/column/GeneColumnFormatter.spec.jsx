import GeneColumnFormatter from './GeneColumnFormatter';
import React from 'react';
import { assert } from 'chai';
import { shallow, mount } from 'enzyme';
import sinon from 'sinon';

describe('GeneColumnFormatter', () => {

    const mutation = {
        gene: {
            hugoGeneSymbol: "DIABLO"
        }
    };

    const tableData = [[mutation]];
    let component;

    before(() => {
        let data = {
            name: "Gene",
            tableData: tableData,
            rowData: [mutation]
        };

        // mount a single cell component (Td)
        component = mount(GeneColumnFormatter.renderFunction(data));
    });

    it('component display value', () => {
        assert.isTrue(component.find(`span`).text().indexOf("DIABLO") > -1,
            'Gene symbol display value is correct');
    });

    it('component cell value property', () => {
        assert.equal(component.prop("value"), "DIABLO",
            'Cell (Td) value property is correct');
    });

    after(()=>{

    });

});
