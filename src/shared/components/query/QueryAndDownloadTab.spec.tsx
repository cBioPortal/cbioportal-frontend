import QueryAndDownloadTabs from './QueryAndDownloadTabs';
import React from 'react';
import { assert } from 'chai';
import { shallow, mount } from 'enzyme';
import sinon from 'sinon';
import { Tab } from 'react-bootstrap';
import {QueryStore} from "./QueryStore";

describe('QueryAndDownloadTabs', () => {

    it.skip('Hides download tab if prop showDownloadTab is false', ()=>{
        const comp = shallow(<QueryAndDownloadTabs getQueryStore={()=>({} as QueryStore)} />);
        assert.equal(comp.find(Tab).length, 2);
        comp.setProps({ showQuickSearchTab:false });
        assert.equal(comp.find(Tab).length, 1);
    });

});