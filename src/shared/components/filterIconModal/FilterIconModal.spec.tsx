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

    const mountAttached = (element: React.ReactElement) =>
        mount(element, { attachTo: container });

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

    it('shows the label in the menu heading rather than the raw menu id', () => {
        // Regression: `label` was declared on the props and rendered by FilterMenu as
        // `label || id`, but FilterIconModal never forwarded it — so every filter popover
        // displayed its internal menu id (e.g. "resource-data-table-metadata:score")
        // instead of the column's display name.
        const wrapper = mountAttached(
            <FilterIconModal {...defaultProps()} label="Tumor Cells (%)" />
        );

        openMenu(wrapper);

        assert.include(menu().textContent!, 'Tumor Cells (%)');
        assert.notInclude(menu().textContent!, 'test-filter');
    });

    it('falls back to the id when no label is given', () => {
        const wrapper = mountAttached(
            <FilterIconModal {...defaultProps()} label={undefined} />
        );

        openMenu(wrapper);

        assert.include(menu().textContent!, 'test-filter');
    });

    it('lifts the containing header cell above its siblings while the menu is open', () => {
        // Sticky headers are all z-index 10, and each is its own stacking context, so the menu
        // would otherwise be painted under the header cells that follow it. The menu cannot
        // escape its ancestor's context, so the cell itself has to be raised.
        const table = document.createElement('table');
        const th = document.createElement('th');
        th.style.zIndex = '10';
        const host = document.createElement('div');
        th.appendChild(host);
        table.appendChild(th);
        container.appendChild(table);

        const wrapper = mount(
            <FilterIconModal
                {...defaultProps()}
                escapeScrollContainer={true}
            />,
            { attachTo: host }
        );

        openMenu(wrapper);
        assert.equal(th.style.zIndex, '100');

        wrapper.find('.headerFilterIcon').simulate('click');
        wrapper.update();
        assert.equal(th.style.zIndex, '10', 'restores the original z-index');
    });

    it('leaves the header cell alone for consumers that have not opted in', () => {
        const table = document.createElement('table');
        const th = document.createElement('th');
        th.style.zIndex = '10';
        const host = document.createElement('div');
        th.appendChild(host);
        table.appendChild(th);
        container.appendChild(table);

        const wrapper = mount(<FilterIconModal {...defaultProps()} />, {
            attachTo: host,
        });

        openMenu(wrapper);

        assert.equal(th.style.zIndex, '10');
    });

    it('gives the filter icon a padded click target', () => {
        // The glyph alone is a fussy ~12px target; the label cannot take the click because it
        // sorts.
        const wrapper = mountAttached(<FilterIconModal {...defaultProps()} />);

        const icon = wrapper
            .find('.headerFilterIcon')
            .getDOMNode() as HTMLElement;

        assert.equal(icon.style.padding, '3px 4px');
        assert.equal(icon.style.cursor, 'pointer');
    });
});
