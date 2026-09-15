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
        selectionEffect: 'filter' | 'highlight'
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
            hiddenCategories: new Set(['Lung']),
            onToggleCategoryVisibility: () => {},
            selectionEffect,
        };
    }

    it('filter mode: a hidden category is grayed out with strikethrough, not bordered', () => {
        const wrapper = mount(<LegendPanel {...makeProps('filter')} />);
        const rows = wrapper.find('span[title="Lung"]');
        assert.equal(rows.length, 1);
        assert.equal(
            (rows.at(0).prop('style') as any).textDecoration,
            'line-through'
        );
    });

    it('highlight mode: a hidden category keeps its own color and gets a bordered row instead of graying out', () => {
        const wrapper = mount(<LegendPanel {...makeProps('highlight')} />);
        const label = wrapper.find('span[title="Lung"]');
        assert.equal(label.length, 1);
        // Not grayed/struck-through like filter mode.
        assert.equal((label.prop('style') as any).textDecoration, 'none');
        assert.equal((label.prop('style') as any).color, 'inherit');
    });

    it('a visible (non-hidden) category renders identically in both modes', () => {
        const filterWrapper = mount(<LegendPanel {...makeProps('filter')} />);
        const highlightWrapper = mount(
            <LegendPanel {...makeProps('highlight')} />
        );
        const filterLabel = filterWrapper.find('span[title="Breast"]');
        const highlightLabel = highlightWrapper.find('span[title="Breast"]');
        assert.deepEqual(
            filterLabel.prop('style'),
            highlightLabel.prop('style')
        );
    });

    function findRow(wrapper: any, displayLabel: string) {
        return wrapper
            .find('div')
            .filterWhere(
                (n: any) =>
                    typeof n.prop('title') === 'string' &&
                    n.prop('title').includes(`"${displayLabel}"`)
            )
            .first();
    }

    it('a row explains what clicking it does, worded differently per mode', () => {
        const filterRow = findRow(
            mount(<LegendPanel {...makeProps('filter')} />),
            'Lung'
        );
        const highlightRow = findRow(
            mount(<LegendPanel {...makeProps('highlight')} />),
            'Lung'
        );
        assert.include(filterRow.prop('title'), 'show');
        assert.include(highlightRow.prop('title'), 'include');
        assert.include(highlightRow.prop('title'), 'highlight');
        assert.notEqual(filterRow.prop('title'), highlightRow.prop('title'));
    });

    it('renders an eye/eye-slash icon reflecting shown vs hidden state', () => {
        const wrapper = mount(<LegendPanel {...makeProps('filter')} />);
        const hiddenRow = findRow(wrapper, 'Lung');
        const visibleRow = findRow(wrapper, 'Breast');
        assert.isTrue(hiddenRow.find('.fa-eye-slash').exists());
        assert.isTrue(visibleRow.find('.fa-eye').exists());
        assert.isFalse(visibleRow.find('.fa-eye-slash').exists());
    });
});
