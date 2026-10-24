import * as React from 'react';
import { shallow, ShallowWrapper } from 'enzyme';
import { SummaryStatisticsTable } from './SummaryStatisticsTable';
import { toBoxPlotData } from 'shared/components/plots/BoxScatterPlot';

const makeGroup = (label: string, values: number[]) => ({
    label,
    median: 0,
    data: values.map((value, index) => ({
        value,
        sampleId: `${label}_${index}`,
    })),
});

const getRowValues = (table: ShallowWrapper, label: string) =>
    table
        .find('tbody tr')
        .filterWhere(row => row.childAt(0).text() === label)
        .find('td')
        .slice(1)
        .map(cell => cell.text());

describe('Group comparison box plot summary tooltip', () => {
    it('shows observed extremes including outliers for each group', () => {
        const boxes = toBoxPlotData([
            makeGroup('With outliers', [-100, 1, 2, 3, 4, 5, 6, 7, 8, 9, 1000]),
            makeGroup('Without outliers', [3, 1, 2]),
        ]);
        const table = shallow(
            <SummaryStatisticsTable
                data={boxes}
                labels={['With outliers', 'Without outliers']}
            />
        );

        expect(boxes[0].min).toBeGreaterThan(-100);
        expect(boxes[0].max).toBeLessThan(1000);
        expect(getRowValues(table, 'Minimum')).toEqual(['-100', '1']);
        expect(getRowValues(table, 'Maximum')).toEqual(['1000', '3']);
    });

    it('identifies whisker values separately and keeps the quartile statistics', () => {
        const boxes = toBoxPlotData([
            makeGroup('Group', [-100, 1, 2, 3, 4, 5, 6, 7, 8, 9, 1000]),
        ]);
        const table = shallow(
            <SummaryStatisticsTable data={boxes} labels={['Group']} />
        );

        expect(getRowValues(table, 'Lower whisker')).toEqual(['-5.5']);
        expect(getRowValues(table, 'Upper whisker')).toEqual(['14.5']);
        expect(getRowValues(table, '25% (q1)')).toEqual(['2']);
        expect(getRowValues(table, 'Median')).toEqual(['5']);
        expect(getRowValues(table, '75% (q3)')).toEqual(['7']);
    });

    it('reports extremes in the same log scale as the plotted data', () => {
        const boxes = toBoxPlotData(
            [
                makeGroup('Group', [
                    1,
                    2,
                    4,
                    8,
                    16,
                    32,
                    64,
                    128,
                    256,
                    512,
                    2 ** 30,
                ]),
            ],
            undefined,
            undefined,
            {
                label: 'log2',
                fLogScale: value => Math.log2(value),
                fInvLogScale: value => 2 ** value,
            }
        );
        const table = shallow(
            <SummaryStatisticsTable data={boxes} labels={['Group']} />
        );

        expect(getRowValues(table, 'Minimum')).toEqual(['0']);
        expect(getRowValues(table, 'Maximum')).toEqual(['30']);
        expect(boxes[0].max).toBe(14.5);
    });

    it('keeps empty and single-observation groups excluded from tooltip values', () => {
        const boxes = toBoxPlotData([
            makeGroup('Empty', []),
            makeGroup('Single observation', [42.125]),
            makeGroup('Valid group', [1, 2, 3]),
        ]);
        const table = shallow(
            <SummaryStatisticsTable data={boxes} labels={['Valid group']} />
        );

        expect(boxes).toHaveLength(1);
        expect(getRowValues(table, 'Minimum')).toEqual(['1']);
        expect(getRowValues(table, 'Maximum')).toEqual(['3']);
        expect(getRowValues(table, 'Median')).toEqual(['2']);
    });
});
