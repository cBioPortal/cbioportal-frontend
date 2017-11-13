import { MSKTab, MSKTabs } from './MSKTabs';
import React from 'react';
import { assert } from 'chai';
import {shallow, mount, ReactWrapper} from 'enzyme';
import sinon from 'sinon';
import {ThreeBounce} from 'better-react-spinkit';

describe('MSKTabs', () => {

    let tabs: any;

    function tabText(tabs:ReactWrapper<any,any>):string[] {
        return tabs.find('ul.nav-tabs').find('li').map(x=>x.text());
    }

    beforeEach(()=>{

        tabs = mount(
          <MSKTabs>
              <MSKTab id="one" linkText="One"><span className="content">One</span></MSKTab>
              <MSKTab linkText="Two" id="two"><span className="content">Two</span></MSKTab>
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

    it('if unMountOnHide = false (or not set), switch tab causes mounting, switching again causes hide/show', ()=>{
        assert.equal(tabs.find('.msk-tab').length, 1);
        tabs.setProps({ activeTabId:"two" });
        assert.equal(tabs.find('.msk-tab').length, 2);
        assert.isTrue(tabs.find(MSKTab).at(0).hasClass('hiddenByPosition'));
        tabs.setProps({ activeTabId:"one" });
        assert.isTrue(tabs.find(MSKTab).at(1).hasClass('hiddenByPosition'));
        assert.isFalse(tabs.find(MSKTab).at(0).hasClass('hiddenByPosition'));
    });

    it('if unMountOnHide = true, switch tab causes mounting, switching again causes hide/show', ()=>{
        tabs.setProps({ unmountOnHide:true });
        assert.equal(tabs.find('.msk-tab').length, 1);
        tabs.setProps({ activeTabId:"two" });
        assert.equal(tabs.find('.msk-tab').length, 1);
        tabs.setProps({ activeTabId:"one" });
    });

    it('does not display tabs that have hide={true}', ()=>{
        let tabs2 = mount(<MSKTabs>
            <MSKTab id="one" linkText="One"><span className="content">One</span></MSKTab>
            <MSKTab linkText="Two" id="two" hide={true}><span className="content">Two</span></MSKTab>
        </MSKTabs>);
        assert.deepEqual(tabText(tabs2), ["One"]);
    });

    it('does not display the content of tabs that have loading={true}, instead showing a spinner; and ' +
        'does not show a tab with loading={true} unless it is the active tab', ()=>{

        tabs.setProps({ activeTabId: "one" });
        const tab = tabs.find(MSKTab).at(0);
        let span:ReactWrapper<any,any> = tab.find("span").at(0);
        assert(span.exists(), "the span exists");
        assert.equal(span.text(), "One");

        let tabs2 = mount(<MSKTabs activeTabId="one">
            <MSKTab id="one" linkText="One" loading={true}><span className="content">One</span></MSKTab>
            <MSKTab linkText="Two" id="two"><span className="content">Two</span></MSKTab>
        </MSKTabs>);

        const tab2 = tabs2.find(MSKTab).at(0);
        span = tab2.find("span").at(0);
        assert.notEqual(span.text(), "One", "the span with the content 'One' does not exist for a loading tab");
        assert(tab2.find(".default-spinner").at(0).exists(), "a loading tab contains a spinner element");
        assert.deepEqual(tabText(tabs2), ["One", "Two"], "both tabs visible");

        tabs2.setProps({ activeTabId: "two" });
        assert.deepEqual(tabText(tabs2), ["Two"], "only one tab visible, since the other is loading");

    });

});
