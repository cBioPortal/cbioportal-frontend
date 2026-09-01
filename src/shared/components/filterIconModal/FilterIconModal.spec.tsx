import * as React from 'react';
import { assert } from 'chai';
import { mount, ReactWrapper } from 'enzyme';
import FilterIconModal from './FilterIconModal';

describe('FilterIconModal', () => {
    let container: HTMLDivElement;

    beforeEach(() => {
        container = document.createElement('div');
        document.body.appendChild(container);
    });

    afterEach(() => {
        document.body.removeChild(container);
    });

    const defaultProps = () => ({
        id: 'test-filter',
        label: 'Test',
        filterIsActive: false,
        deactivateFilter: () => undefined,
        setupFilter: () => undefined,
        menuComponent: <div className="menu-body">menu</div>,
    });

    const openMenu = (wrapper: ReactWrapper) => {
        wrapper.find('.headerFilterIcon').simulate('click');
        wrapper.update();
    };

    const menu = () => document.getElementById('test-filter')!;

    it('leaves the menu positioned by its dropdown parent by default', () => {
        const wrapper = mount(<FilterIconModal {...defaultProps()} />, {
            attachTo: container,
        });

        openMenu(wrapper);

        assert.equal(menu().style.position, '');
        assert.equal(menu().style.transform, 'translateX(-5px)');
    });

    it('positions the open menu against the viewport when asked to escape a scroll container', () => {
        // A horizontally scrollable table clips an absolutely positioned menu;
        // a fixed one is laid out against the viewport instead.
        const wrapper = mount(
            <FilterIconModal
                {...defaultProps()}
                escapeScrollContainer={true}
            />,
            { attachTo: container }
        );

        const anchor = menu().parentElement as HTMLElement;
        anchor.getBoundingClientRect = () =>
            ({ left: 120, right: 140, bottom: 60, top: 40 } as DOMRect);

        openMenu(wrapper);

        assert.equal(menu().style.position, 'fixed');
        assert.equal(menu().style.top, '60px');
        assert.equal(menu().style.left, '120px');
        assert.equal(menu().style.transform, '');
    });

    it('clamps the menu into the viewport when the anchor sits below the fold', () => {
        const wrapper = mount(
            <FilterIconModal
                {...defaultProps()}
                escapeScrollContainer={true}
            />,
            { attachTo: container }
        );

        const anchor = menu().parentElement as HTMLElement;
        anchor.getBoundingClientRect = () =>
            ({
                left: 10,
                right: 30,
                bottom: window.innerHeight + 500,
                top: window.innerHeight + 480,
            } as DOMRect);

        openMenu(wrapper);

        assert.equal(menu().style.top, `${window.innerHeight}px`);
    });
});
