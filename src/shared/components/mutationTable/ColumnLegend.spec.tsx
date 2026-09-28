import * as React from 'react';
import { mount } from 'enzyme';
import { assert } from 'chai';
import ColumnLegend from './ColumnLegend';
import {
    ClonalColumnLegend,
    ClonalValue,
} from './column/clonal/ClonalColumnFormatter';

describe('ColumnLegend', () => {
    it('shows the description and the legend of the values', () => {
        const legend = mount(
            <ColumnLegend
                description="Reads"
                categories={[
                    { value: 'A', description: 'first' },
                    { value: 'B', label: 'Bee' },
                ]}
            />
        );
        assert.include(legend.text(), 'Reads');
        assert.include(
            legend.find('[data-test="column-legend-row-A"]').text(),
            'first'
        );
        assert.include(
            legend.find('[data-test="column-legend-row-B"]').text(),
            'Bee'
        );
    });

    it('shows only the description without categories', () => {
        const legend = mount(<ColumnLegend description="Chromosome" />);
        assert.equal(legend.text(), 'Chromosome');
        assert.equal(legend.find('table').length, 0);
    });

    it('lists every clonal value', () => {
        const legend = mount(<ClonalColumnLegend />);
        for (const value of Object.values(ClonalValue)) {
            assert.equal(
                legend.find(`[data-test="column-legend-row-${value}"]`).length,
                1,
                value
            );
        }
    });
});
