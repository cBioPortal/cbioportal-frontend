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
});
