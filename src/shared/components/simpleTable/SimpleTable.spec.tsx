import React from 'react';
import { assert } from 'chai';
import { shallow, mount } from 'enzyme';
import sinon from 'sinon';
import SimpleTable from "./SimpleTable";

describe('SimpleTable', () => {

    let table:any;

    before(()=>{

        let headers:any = [<th>one</th>];
        let rows:any = [<tr><td>data</td></tr>, <tr><td>data</td></tr>];

        table = shallow(<SimpleTable headers={headers} rows={rows} />);
    });

    after(()=>{

    });

    it('renders 3 rows if passed headers and two rows', ()=>{
        assert.equal( table.find('tr').length, 3);
    });

    it('renders no result message when rows is empty array', ()=>{
        table.setProps({rows:[]})
        assert.isTrue( table.containsMatchingElement(<td colSpan={1}>There are no results.</td>));

        table.setProps({rows:[], noRowsText:"Hello there!!!!"})
        assert.isTrue( table.containsMatchingElement(<td colSpan={1}>Hello there!!!!</td>));
    });

});
