import * as React from 'react';
import { mount } from 'enzyme';
import { assert } from 'chai';
import CategoricalFilterMenu from './CategoricalFilterMenu';

describe('CategoricalFilterMenu', () => {
    const all = ['CLONAL', 'SUBCLONAL', 'NA'];

    function mountMenu(included: string[]) {
        const toggled: Set<string>[] = [];
        const menu = mount(
            <CategoricalFilterMenu
                id="Clonal"
                currSelections={new Set(included)}
                allSelections={new Set(all)}
                updateFilterCondition={() => {}}
                updateFilterString={() => {}}
                toggleSelections={s => toggled.push(new Set(s))}
            />
        );
        const checkbox = (value: string) =>
            menu.find(
                `[data-test="categorical-filter-menu-option-${value}"] input`
            );
        return { menu, toggled, checkbox };
    }

    it('shows nothing checked without a filter', () => {
        const { menu, checkbox } = mountMenu(all);
        all.forEach(v => assert.isFalse(checkbox(v).prop('checked'), v));
        assert.include(menu.text(), 'All 3 values');
    });

    it('restricts to a value when checking it without a filter', () => {
        const { toggled, checkbox } = mountMenu(all);
        checkbox('SUBCLONAL').simulate('change');
        // everything but SUBCLONAL is toggled off
        assert.sameMembers(Array.from(toggled[0]), ['CLONAL', 'NA']);
    });

    it('shows the included values as checked with a filter', () => {
        const { menu, checkbox } = mountMenu(['CLONAL']);
        assert.isTrue(checkbox('CLONAL').prop('checked'));
        assert.isFalse(checkbox('NA').prop('checked'));
        assert.include(menu.text(), '1 of 3 selected');
    });

    it('adds a value when checking it with a filter', () => {
        const { toggled, checkbox } = mountMenu(['CLONAL']);
        checkbox('NA').simulate('change');
        assert.sameMembers(Array.from(toggled[0]), ['NA']);
    });

    it('removes the filter when unchecking the last value', () => {
        const { toggled, checkbox } = mountMenu(['CLONAL']);
        checkbox('CLONAL').simulate('change');
        // all other values are toggled back on
        assert.sameMembers(Array.from(toggled[0]), ['SUBCLONAL', 'NA']);
    });

    it('shows a value as checked when checking it covers all values', () => {
        // the only value: checking it doesn't restrict the table
        const toggled: Set<string>[] = [];
        const menu = mount(
            <CategoricalFilterMenu
                id="Mutation Type"
                currSelections={new Set(['Missense'])}
                allSelections={new Set(['Missense'])}
                updateFilterCondition={() => {}}
                updateFilterString={() => {}}
                toggleSelections={s => toggled.push(new Set(s))}
            />
        );
        const checkbox = () =>
            menu.find(
                '[data-test="categorical-filter-menu-option-Missense"] input'
            );
        checkbox().simulate('change');
        menu.update();
        assert.isTrue(checkbox().prop('checked'));
        assert.include(menu.text(), '1 of 1 selected');
        assert.sameMembers(Array.from(toggled[0]), []);

        // and unchecking it clears the selection again
        checkbox().simulate('change');
        menu.update();
        assert.isFalse(checkbox().prop('checked'));
        assert.include(menu.text(), 'All 1 values');
    });

    it('keeps all values checked after checking the last one', () => {
        const { menu, toggled, checkbox } = mountMenu(['CLONAL', 'SUBCLONAL']);
        checkbox('NA').simulate('change');
        assert.sameMembers(Array.from(toggled[0]), ['NA']);
        // the table then includes all values, so the filter no longer restricts
        menu.setProps({ currSelections: new Set(all) });
        menu.update();
        all.forEach(v => assert.isTrue(checkbox(v).prop('checked'), v));
        assert.include(menu.text(), '3 of 3 selected');
    });

    it('stops showing remembered values as checked once a new value appears', () => {
        const menu = mount(
            <CategoricalFilterMenu
                id="Mutation Type"
                currSelections={new Set(['Missense'])}
                allSelections={new Set(['Missense'])}
                updateFilterCondition={() => {}}
                updateFilterString={() => {}}
                toggleSelections={() => {}}
            />
        );
        const checkbox = (value: string) =>
            menu.find(
                `[data-test="categorical-filter-menu-option-${value}"] input`
            );
        checkbox('Missense').simulate('change');
        menu.update();
        assert.isTrue(checkbox('Missense').prop('checked'));

        // e.g. after a filter on another column changes, a value appears
        // that wasn't checked, and the table still isn't restricted
        const values = new Set(['Missense', 'Nonsense']);
        menu.setProps({ allSelections: values, currSelections: values });
        menu.update();
        assert.isFalse(checkbox('Missense').prop('checked'));
        assert.isFalse(checkbox('Nonsense').prop('checked'));
        assert.include(menu.text(), 'All 2 values');
    });
});
