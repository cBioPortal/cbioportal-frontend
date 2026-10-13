import * as React from 'react';
import { mount } from 'enzyme';
import { assert } from 'chai';
import SectionedFilterMenu, {
    SectionedFilterGroup,
    SectionedFilterSection,
} from './SectionedFilterMenu';

describe('SectionedFilterMenu', () => {
    const sections: SectionedFilterSection[] = [
        {
            id: 'hotspot',
            title: 'Hotspot',
            options: [{ id: 'hotspot:yes', label: 'Hotspot' }],
        },
        {
            id: 'sift',
            title: 'SIFT',
            group: 'impact',
            options: [{ id: 'sift:deleterious', label: 'Deleterious' }],
        },
    ];

    function mountMenu(
        selections: string[],
        group: Partial<SectionedFilterGroup> = {}
    ) {
        const countedGroups: string[][] = [];
        const changes: string[][] = [];
        const menu = mount(
            <SectionedFilterMenu
                sections={sections}
                groups={[{ id: 'impact', title: 'Impact', ...group }]}
                selections={new Set(selections)}
                matchAll={true}
                onChange={s => changes.push(s)}
                getOptionCounts={groups => {
                    countedGroups.push(groups);
                    return new Map([
                        ['hotspot:yes', 3],
                        ['sift:deleterious', 2],
                    ]);
                }}
                dataTestPrefix="f"
            />
        );
        const option = (id: string) =>
            menu.find(`[data-test="f-option-${id}"]`);
        const toggle = () => menu.find('[data-test="f-group-impact-toggle"]');
        return { menu, countedGroups, changes, option, toggle };
    }

    it('starts with a group collapsed, without loading or counting it', () => {
        let loadingChecked = false;
        const { menu, countedGroups, option } = mountMenu([], {
            isLoading: () => {
                loadingChecked = true;
                return false;
            },
        });
        assert.isTrue(option('hotspot:yes').exists());
        assert.isFalse(option('sift:deleterious').exists());
        assert.include(menu.text(), 'SIFT');
        assert.isFalse(loadingChecked);
        assert.deepEqual(countedGroups[countedGroups.length - 1], []);
    });

    it('shows and counts the sections of a group when expanded', () => {
        const { countedGroups, option, toggle, changes } = mountMenu([]);
        toggle().simulate('click');
        assert.isTrue(option('sift:deleterious').exists());
        assert.deepEqual(countedGroups[countedGroups.length - 1], ['impact']);
        option('sift:deleterious')
            .find('input')
            .simulate('change');
        assert.deepEqual(changes, [['sift:deleterious']]);
    });

    it('shows the loading message of an expanded group', () => {
        const { menu, option, toggle } = mountMenu([], {
            isLoading: () => true,
            loadingMessage: () => 'Loading impact…',
        });
        toggle().simulate('click');
        assert.include(
            menu.find('[data-test="f-group-impact-loading"]').text(),
            'Loading impact…'
        );
        assert.isFalse(option('sift:deleterious').exists());
    });

    it('shows the load error of an expanded group', () => {
        const { menu, option, toggle } = mountMenu([], {
            getLoadError: () => 'Too many mutations',
        });
        toggle().simulate('click');
        assert.include(
            menu.find('[data-test="f-group-impact-error"]').text(),
            'Too many mutations'
        );
        assert.isFalse(option('sift:deleterious').exists());
    });

    it('keeps a group with selections expanded', () => {
        const { option, toggle } = mountMenu(['sift:deleterious']);
        assert.isTrue(option('sift:deleterious').exists());
        assert.isTrue(toggle().prop('disabled'));
    });
});
