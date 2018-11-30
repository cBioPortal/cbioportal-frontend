import { MSKTab, MSKTabs } from './MSKTabs';
import React from 'react';
import { assert } from 'chai';
import {shallow, mount, ReactWrapper} from 'enzyme';
import sinon from 'sinon';
import {ThreeBounce} from 'better-react-spinkit';
import {sleep} from "../../lib/TimeUtils";

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

    it('initial render only mounts first tab', async ()=>{
        await sleep(0);
        assert.equal(tabs.find('.msk-tab').length, 1);
    });

    it('render of tab is deferred to frame following', async ()=>{
        assert.equal(tabs.find('.msk-tab').length, 0);
        await sleep(0);
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

    it('if unmount on hide is false, we retain tabs when we click away', async()=>{
        tabs = mount(
            <MSKTabs unmountOnHide={false}>
                <MSKTab id="one" linkText="One"><span className="content">One</span></MSKTab>
                <MSKTab linkText="Two" id="two"><span className="content">Two</span></MSKTab>
            </MSKTabs>
        );

        await sleep(0);

        assert.equal(tabs.find('.msk-tab').length, 1);
        tabs.setProps({ activeTabId:"two" });

        await sleep(0);

        assert.equal(tabs.find('.msk-tab').length, 2, "didn't unmount");
        assert.isTrue(tabs.find(MSKTab).at(0).hasClass('hiddenByPosition'));

        tabs.setProps({ activeTabId:"one" });

        await sleep(0);

        assert.isTrue(tabs.find(MSKTab).at(1).hasClass('hiddenByPosition'));
        assert.isFalse(tabs.find(MSKTab).at(0).hasClass('hiddenByPosition'));
    });

    it('if unmount on hide is true, we DO NOT retain tabs when we click away', async()=>{
        tabs = mount(
            <MSKTabs unmountOnHide={true}>
                <MSKTab id="one" linkText="One"><span className="content">One</span></MSKTab>
                <MSKTab linkText="Two" id="two"><span className="content">Two</span></MSKTab>
            </MSKTabs>
        );

        await sleep(0);
        assert.equal(tabs.find('.msk-tab').length, 1);

        tabs.setProps({ activeTabId:"two" });
        await sleep(0);
        assert.equal(tabs.find('.msk-tab').length, 1, "did unmount");
        assert.isFalse(tabs.find(MSKTab).at(0).hasClass('hiddenByPosition'));

        tabs.setProps({ activeTabId:"one" });
        await sleep(0);
        assert.isFalse(tabs.find(MSKTab).at(0).hasClass('hiddenByPosition'));
    });

    it('if unMountOnHide = false, switch tab causes mounting, switching again causes hide/show',async ()=>{
        tabs = mount(
            <MSKTabs unmountOnHide={false}>
                <MSKTab id="one" linkText="One"><span className="content">One</span></MSKTab>
                <MSKTab linkText="Two" id="two"><span className="content">Two</span></MSKTab>
            </MSKTabs>
        );
        await sleep(0);
        assert.equal(tabs.find('.msk-tab').length, 1);
        tabs.setProps({ activeTabId:"two" });
        assert.equal(tabs.find('.msk-tab').length, 2);
        tabs.setProps({ activeTabId:"one" });
    });

    it('if individual tab is unmountOnHide false then it will not be unmounted', async ()=>{
        tabs = mount(
            <MSKTabs>
                <MSKTab unmountOnHide={false} id="one" linkText="One"><span className="content">One</span></MSKTab>
                <MSKTab linkText="Two" id="two"><span className="content">Two</span></MSKTab>
            </MSKTabs>
        );

        await sleep(0);
        assert.equal(tabs.find('.msk-tab').length, 1);

        tabs.setProps({ activeTabId:"two" });
        await sleep(0);
        assert.equal(tabs.find('.msk-tab').length, 2);

        tabs.setProps({ activeTabId:"one" });
        await sleep(0);
        assert.equal(tabs.find('.msk-tab').length, 1);
    });

    it('if individual tab is unmountOnHide false then it will not be unmounted even if parent unmountOnHide is true', async ()=>{
        tabs = mount(
            <MSKTabs unmountOnHide={true}>
                <MSKTab unmountOnHide={false} id="one" linkText="One"><span className="content">One</span></MSKTab>
                <MSKTab linkText="Two" id="two"><span className="content">Two</span></MSKTab>
            </MSKTabs>
        );

        await sleep(0);
        assert.equal(tabs.find('.msk-tab').length, 1);

        tabs.setProps({ activeTabId:"two" });
        await sleep(0);
        assert.equal(tabs.find('.msk-tab').length, 2);

        tabs.setProps({ activeTabId:"one" });
        await sleep(0);
        assert.equal(tabs.find('.msk-tab').length, 1);
    });

    it('if individual tab is unmountOnHide true then it will be unmounted even if parent unmountOnHide is false', async ()=>{
        tabs = mount(
            <MSKTabs unmountOnHide={false}>
                <MSKTab unmountOnHide={true} id="one" linkText="One"><span className="content">One</span></MSKTab>
                <MSKTab linkText="Two" id="two"><span className="content">Two</span></MSKTab>
            </MSKTabs>
        );

        await sleep(0);
        assert.equal(tabs.find('.msk-tab').length, 1);

        tabs.setProps({ activeTabId:"two" });
        await sleep(0);
        assert.equal(tabs.find('.msk-tab').length, 1);

        tabs.setProps({ activeTabId:"one" });
        await sleep(0);
        assert.equal(tabs.find('.msk-tab').length, 2);
    });

});
