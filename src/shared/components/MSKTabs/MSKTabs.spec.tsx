import { MSKTab, MSKTabs } from './MSKTabs';
import React from 'react';
import { assert } from 'chai';
import { shallow, mount } from 'enzyme';
import sinon from 'sinon';

describe('IMutationTableProps', () => {

    let tabs: any;

    beforeEach(()=>{

        tabs = mount(
          <MSKTabs onTabClick={()=>{}}>
              <MSKTab id="one" linkText="One">One</MSKTab>
              <MSKTab linkText="Two" id="two">Two</MSKTab>
          </MSKTabs>
        );

    });

    after(()=>{

    });

    it('initial render only mounts first tab', ()=>{
        assert.equal(tabs.find('.msk-tab').length, 1);
    });

    it('creates two tab buttons and toggles them properly', ()=>{
        assert.equal(tabs.find('li').length, 2);
        assert.isTrue(tabs.find('li').at(0).hasClass('active'));
        assert.isFalse(tabs.find('li').at(1).hasClass('active'));
        tabs.setProps({ activeTabId:"two" });
        assert.isFalse(tabs.find('li').at(0).hasClass('active'));
        assert.isTrue(tabs.find('li').at(1).hasClass('active'));
    });

    it('switch tab causes mounting, switching again causes hide/show', ()=>{
        assert.equal(tabs.find('.msk-tab').length, 1);
        tabs.setProps({ activeTabId:"two" });
        assert.equal(tabs.find('.msk-tab').length, 2);
        assert.isTrue(tabs.find(MSKTab).at(0).hasClass('hidden'));
        tabs.setProps({ activeTabId:"one" });
        assert.isTrue(tabs.find(MSKTab).at(1).hasClass('hidden'));
        assert.isFalse(tabs.find(MSKTab).at(0).hasClass('hidden'));
    });

});
