import { assert } from 'chai';
import { mount } from 'enzyme';
import * as React from 'react';
import { LegendPanel, LegendPanelProps } from './LegendPanel';
import { EmbeddingPoint } from '../EmbeddingTypes';

describe('LegendPanel', () => {
    const data: EmbeddingPoint[] = [
        { x: 0, y: 0, sampleId: 's1', displayLabel: 'Lung', color: '#ff0000' },
        {
            x: 1,
            y: 1,
            sampleId: 's2',
            displayLabel: 'Breast',
            color: '#00ff00',
        },
    ];

    function makeProps(
        overrides: Partial<LegendPanelProps> = {}
    ): LegendPanelProps {
        return {
            data,
            actualHeight: 400,
            categoryCounts: new Map([
                ['Lung', 10],
                ['Breast', 5],
            ]),
            visibleCategoryCounts: new Map([
                ['Lung', 10],
                ['Breast', 5],
            ]),
            categoryColors: new Map([
                [
                    'Lung',
                    {
                        fillColor: '#ff0000',
                        strokeColor: '#ff0000',
                        hasStroke: false,
                    },
                ],
                [
                    'Breast',
                    {
                        fillColor: '#00ff00',
                        strokeColor: '#00ff00',
                        hasStroke: false,
                    },
                ],
            ]),
            hiddenCategories: new Set(),
            selectedCategories: new Set(),
            onToggleCategoryVisibility: () => {},
            onToggleCategorySelected: () => {},
            ...overrides,
        };
    }

    function findRow(wrapper: any, displayLabel: string) {
        return wrapper
            .find(`span[title="${displayLabel}"]`)
            .parents('div')
            .filterWhere((n: any) => typeof n.prop('onClick') === 'function')
            .first();
    }

    it('a neutral category offers both Select and Hide on hover', () => {
        const wrapper = mount(<LegendPanel {...makeProps()} />);
        findRow(wrapper, 'Lung').simulate('mouseenter');

        const row = findRow(wrapper.update(), 'Lung');
        assert.include(row.text(), 'Select');
        assert.include(row.text(), 'Hide');
        assert.notInclude(row.text(), 'Unselect');
    });

    it('an already-selected category offers Unselect instead of Select', () => {
        const wrapper = mount(
            <LegendPanel
                {...makeProps({ selectedCategories: new Set(['Lung']) })}
            />
        );
        findRow(wrapper, 'Lung').simulate('mouseenter');

        const row = findRow(wrapper.update(), 'Lung');
        assert.include(row.text(), 'Unselect');
        assert.include(row.text(), 'Hide');
    });

    it('a hidden category only offers Show - it cannot be part of a selection', () => {
        const wrapper = mount(
            <LegendPanel
                {...makeProps({ hiddenCategories: new Set(['Lung']) })}
            />
        );
        findRow(wrapper, 'Lung').simulate('mouseenter');

        const row = findRow(wrapper.update(), 'Lung');
        assert.include(row.text(), 'Show');
        assert.notInclude(row.text(), 'Select');
    });

    it('swaps the count out for the actions on hover, and back on leave', () => {
        const wrapper = mount(<LegendPanel {...makeProps()} />);
        assert.include(findRow(wrapper, 'Lung').text(), '10');

        findRow(wrapper, 'Lung').simulate('mouseenter');
        assert.notInclude(findRow(wrapper.update(), 'Lung').text(), '10');

        findRow(wrapper.update(), 'Lung').simulate('mouseleave');
        assert.include(findRow(wrapper.update(), 'Lung').text(), '10');
    });

    it('routes each action to its own handler, without the row click also firing', () => {
        const selected: string[] = [];
        const hidden: string[] = [];
        const wrapper = mount(
            <LegendPanel
                {...makeProps({
                    onToggleCategorySelected: c => selected.push(c),
                    onToggleCategoryVisibility: c => hidden.push(c),
                })}
            />
        );

        findRow(wrapper, 'Lung').simulate('mouseenter');
        findRow(wrapper.update(), 'Lung')
            .find('[data-test="embeddings-legend-hide-button"]')
            .simulate('click');
        assert.deepEqual(hidden, ['Lung']);
        assert.deepEqual(selected, []);

        findRow(wrapper.update(), 'Breast').simulate('mouseenter');
        findRow(wrapper.update(), 'Breast')
            .find('[data-test="embeddings-legend-select-button"]')
            .simulate('click');
        assert.deepEqual(selected, ['Breast']);
        assert.deepEqual(hidden, ['Lung']);
    });

    it('shows "in selection / total" when a category is only partly in the selection', () => {
        const wrapper = mount(
            <LegendPanel
                {...makeProps({
                    visibleCategoryCounts: new Map([
                        ['Lung', 3],
                        ['Breast', 0],
                    ]),
                })}
            />
        );
        assert.include(findRow(wrapper, 'Lung').text(), '3 / 10');
        assert.include(findRow(wrapper, 'Breast').text(), '0 / 5');
    });

    it('hides a hidden category with the grey/strikethrough treatment', () => {
        const wrapper = mount(
            <LegendPanel
                {...makeProps({ hiddenCategories: new Set(['Lung']) })}
            />
        );
        const label = wrapper.find('span[title="Lung"]');
        assert.equal(
            (label.prop('style') as any).textDecoration,
            'line-through'
        );
    });
});
