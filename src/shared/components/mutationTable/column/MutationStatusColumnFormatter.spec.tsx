import MutationStatusColumnFormatter from './MutationStatusColumnFormatter';
import {initMutation} from "test/MutationMockUtils";
import React from 'react';
import { assert } from 'chai';
import { shallow, mount } from 'enzyme';
import sinon from 'sinon';

describe('MutationStatusColumnFormatter', () => {
    const mutation = initMutation({
        mutationStatus: "Germline"
    });

    const data = {
        name: "Mutation Status",
        tableData: [[mutation]],
        rowData: [mutation]
    };

    before(() => {

    });

    after(() => {

    });

    it('gets mutation status data', () => {
        assert.equal(MutationStatusColumnFormatter.getData(data), "Germline",
            "Mutation status data is properly extracted");
    });

});
