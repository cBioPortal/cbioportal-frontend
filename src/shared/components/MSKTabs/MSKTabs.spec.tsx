import { MSKTab, MSKTabs } from './MSKTabs';
import React from 'react';
import { assert } from 'chai';
import { mount, ReactWrapper } from 'enzyme';

describe('MSKTabs', () => {
    let tabs: any;

    function tabText(tabs: ReactWrapper<any, any>): string[] {
        return tabs
            .find('ul.nav-tabs')
            .find('li')
            .map(x => x.text());
    }

    // MSKTabs mounts its tabs on a timer after the first render, which can
    // take a while on a busy runner, so poll for them.
    async function waitForFirstRender(wrapper: ReactWrapper<any, any>) {
        for (let i = 0; i < 40; i++) {
            if (wrapper.update().find('.msk-tab').length > 0) {
                return;
            }
            await new Promise(resolve => setTimeout(resolve, 25));
        }
        throw new Error('MSKTabs did not mount its tabs');
    }

    beforeEach(() => {
        tabs = mount(
            <MSKTabs>
                <MSKTab id="one" linkText="One">
                    <span className="content">One</span>
                </MSKTab>
                <MSKTab linkText="Two" id="two">
                    <span className="content">Two</span>
                </MSKTab>
            </MSKTabs>
        );

        // Force enzyme to traverse the tree once, which flushes any
        // pending render work from the concurrent renderer.
        tabs.find('.msk-tab');
        tabs.update();
    });

    it('initial render only mounts first tab', async () => {
        await waitForFirstRender(tabs);
        assert.equal(tabs.update().find('.msk-tab').length, 1);
    });

    it('render of tab is deferred to frame following', async () => {
        assert.equal(tabs.find('.msk-tab').length, 0);
        await waitForFirstRender(tabs);
        assert.equal(tabs.update().find('.msk-tab').length, 1);
    });

    it('creates two tab buttons and toggles them properly', async () => {
        await waitForFirstRender(tabs);
        // the number of actual tabs are 2, but we have an additional 'li' element for the loader icon
        assert.equal(tabs.update().find('li').length, 3);
        assert.isTrue(
            tabs
                .find('li')
                .at(0)
                .hasClass('active')
        );
        assert.isFalse(
            tabs
                .find('li')
                .at(1)
                .hasClass('active')
        );
        tabs.setProps({ activeTabId: 'two' });
        assert.isFalse(
            tabs
                .find('li')
                .at(0)
                .hasClass('active')
        );
        assert.isTrue(
            tabs
                .find('li')
                .at(1)
                .hasClass('active')
        );
    });

    it('if unmount on hide is false, we retain tabs when we click away', async () => {
        var tabs = mount(
            <MSKTabs unmountOnHide={false}>
                <MSKTab id="one" linkText="One">
                    <span className="content">One</span>
                </MSKTab>
                <MSKTab linkText="Two" id="two">
                    <span className="content">Two</span>
                </MSKTab>
            </MSKTabs>
        );

        await waitForFirstRender(tabs);
        assert.equal(tabs.update().find('.msk-tab').length, 1);
        tabs.setProps({ activeTabId: 'two' });
        assert.equal(tabs.find('.msk-tab').length, 2, "didn't unmount");
        assert.isTrue(
            tabs
                .find('.msk-tab')
                .at(0)
                .hasClass('hiddenByPosition')
        );

        tabs.setProps({ activeTabId: 'one' });

        // assert.isTrue(tabs.find('.msk-tab').at(1).hasClass('hiddenByPosition'));
        // assert.isFalse(tabs.find('.msk-tab').at(0).hasClass('hiddenByPosition'));
    });

    it('if unmount on hide is true, we DO NOT retain tabs when we click away', async () => {
        var tabs = mount(
            <MSKTabs unmountOnHide={true}>
                <MSKTab id="one" linkText="One">
                    <span className="content">One</span>
                </MSKTab>
                <MSKTab linkText="Two" id="two">
                    <span className="content">Two</span>
                </MSKTab>
            </MSKTabs>
        );

        await waitForFirstRender(tabs);
        assert.equal(tabs.update().find('.msk-tab').length, 1);

        tabs.setProps({ activeTabId: 'two' });

        // assert.equal(tabs.find('.msk-tab').length, 1, "did unmount");
        // assert.isFalse(tabs.find('.msk-tab').at(0).hasClass('hiddenByPosition'));
        //
        // tabs.setProps({ activeTabId:"one" });
        //
        // assert.isFalse(tabs.find('.msk-tab').at(0).hasClass('hiddenByPosition'));
    });

    it('if unMountOnHide = false, switch tab causes mounting, switching again causes hide/show', async () => {
        var tabs = mount(
            <MSKTabs unmountOnHide={false}>
                <MSKTab id="one" linkText="One">
                    <span className="content">One</span>
                </MSKTab>
                <MSKTab linkText="Two" id="two">
                    <span className="content">Two</span>
                </MSKTab>
            </MSKTabs>
        );
        await waitForFirstRender(tabs);
        assert.equal(tabs.update().find('.msk-tab').length, 1);
        tabs.setProps({ activeTabId: 'two' });
        assert.equal(tabs.update().find('.msk-tab').length, 2);
        tabs.setProps({ activeTabId: 'one' });
    });

    it('if individual tab is unmountOnHide false then it will not be unmounted', async () => {
        tabs = mount(
            <MSKTabs>
                <MSKTab unmountOnHide={false} id="one" linkText="One">
                    <span className="content">One</span>
                </MSKTab>
                <MSKTab linkText="Two" id="two">
                    <span className="content">Two</span>
                </MSKTab>
            </MSKTabs>
        );

        await waitForFirstRender(tabs);
        assert.equal(tabs.update().find('.msk-tab').length, 1);

        tabs.setProps({ activeTabId: 'two' });
        assert.equal(tabs.find('.msk-tab').length, 2);

        tabs.setProps({ activeTabId: 'one' });
        assert.equal(tabs.find('.msk-tab').length, 1);
    });

    it('if individual tab is unmountOnHide false then it will not be unmounted even if parent unmountOnHide is true', async () => {
        var tabs = mount(
            <MSKTabs unmountOnHide={true}>
                <MSKTab unmountOnHide={false} id="one" linkText="One">
                    <span className="content">One</span>
                </MSKTab>
                <MSKTab linkText="Two" id="two">
                    <span className="content">Two</span>
                </MSKTab>
            </MSKTabs>
        );

        await waitForFirstRender(tabs);
        assert.equal(tabs.update().find('.msk-tab').length, 1);

        tabs.setProps({ activeTabId: 'two' });
        assert.equal(tabs.find('.msk-tab').length, 2);

        tabs.setProps({ activeTabId: 'one' });
        assert.equal(tabs.find('.msk-tab').length, 1);
    });

    it('if individual tab is unmountOnHide true then it will be unmounted even if parent unmountOnHide is false', async () => {
        var tabs = mount(
            <MSKTabs unmountOnHide={false}>
                <MSKTab unmountOnHide={true} id="one" linkText="One">
                    <span className="content">One</span>
                </MSKTab>
                <MSKTab linkText="Two" id="two">
                    <span className="content">Two</span>
                </MSKTab>
            </MSKTabs>
        );

        await waitForFirstRender(tabs);
        assert.equal(tabs.update().find('.msk-tab').length, 1);

        tabs.setProps({ activeTabId: 'two' });
        assert.equal(tabs.find('.msk-tab').length, 1);

        tabs.setProps({ activeTabId: 'one' });
        assert.equal(tabs.find('.msk-tab').length, 2);
    });
});
