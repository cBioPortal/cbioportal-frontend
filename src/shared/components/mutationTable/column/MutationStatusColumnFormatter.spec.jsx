import MutationStatusColumnFormatter from './MutationStatusColumnFormatter';
import React from 'react';
import { assert } from 'chai';
import { shallow, mount } from 'enzyme';
import sinon from 'sinon';

describe('MutationStatusColumnFormatter', () => {
    const mutation = {
        mutationStatus: "Germline"
    };

    const data = {
        tableData: [[mutation]],
        rowData: [mutation]
    };

    before(()=>{

    });

    after(()=>{

    });

    it('data process functions', ()=>{
        assert.equal(MutationStatusColumnFormatter.getData(data), "Germline",
            "Mutation status data is properly extracted");
    });

});
