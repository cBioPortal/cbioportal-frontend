import * as React from 'react';
import { mount } from 'enzyme';
import { assert } from 'chai';
import { Mutation } from 'cbioportal-ts-api-client';
import { initMutation } from 'test/MutationMockUtils';
import ColumnLegend, {
    ColumnLegendRowsContext,
    countCategories,
    countDuplicatesInMultipleSamples,
    summarizeNumbers,
} from './ColumnLegend';
import {
    ClonalColumnLegend,
    ClonalValue,
} from './column/clonal/ClonalColumnFormatter';

function clonalMutation(sampleId: string, clonal?: string): Mutation {
    return initMutation({
        sampleId,
        alleleSpecificCopyNumber: clonal ? { clonal } : {},
    });
}

describe('ColumnLegend', () => {
    const rows: Mutation[][] = [
        [clonalMutation('S1', 'CLONAL')],
        [clonalMutation('S2', 'CLONAL')],
        [clonalMutation('S3', 'SUBCLONAL')],
        [clonalMutation('S4')],
    ];

    describe('countCategories', () => {
        it('lists known categories in order, then other values by count', () => {
            const { counts, total } = countCategories(
                [
                    [initMutation({ center: 'B' })],
                    [initMutation({ center: 'A' })],
                    [initMutation({ center: 'B' })],
                    [initMutation({ center: '' })],
                ],
                d => d.map(m => m.center),
                [{ value: 'C' }]
            );
            assert.equal(total, 4);
            assert.deepEqual(
                counts.map(c => [c.value, c.count]),
                [
                    ['C', 0],
                    ['B', 2],
                    ['A', 1],
                    ['NA', 1],
                ]
            );
        });

        it('counts every value of a row', () => {
            const { total } = countCategories(
                [[clonalMutation('S1', 'CLONAL'), clonalMutation('S2')]],
                d => d.map(m => m.sampleId)
            );
            assert.equal(total, 2);
        });
    });

    describe('summarizeNumbers', () => {
        it('computes median and range, counting missing values', () => {
            const summary = summarizeNumbers(
                [[initMutation({})], [initMutation({})], [initMutation({})]],
                (() => {
                    const values = [0.2, null, 0.6];
                    let i = 0;
                    return () => [values[i++]];
                })()
            );
            assert.deepEqual(summary, {
                count: 2,
                missing: 1,
                min: 0.2,
                median: 0.4,
                max: 0.6,
            });
        });

        it('reports only missing values when no row has a value', () => {
            assert.deepEqual(
                summarizeNumbers([[initMutation({})]], () => [null]),
                { count: 0, missing: 1 }
            );
        });

        it('returns undefined when rows have no values at all', () => {
            assert.isUndefined(
                summarizeNumbers([[initMutation({})]], () => [])
            );
        });
    });

    it('shows the legend without counts when rows are not available', () => {
        const legend = mount(<ClonalColumnLegend />);
        assert.equal(legend.find('[data-test="column-legend"]').length, 1);
        assert.include(legend.text(), 'Subclonal');
        assert.equal(
            legend.find('[data-test="column-legend-breakdown"]').length,
            0
        );
    });

    it('shows the count of each clonal value in the table', () => {
        const legend = mount(
            <ColumnLegendRowsContext.Provider value={() => rows}>
                <ClonalColumnLegend />
            </ColumnLegendRowsContext.Provider>
        );
        const countOf = (value: string) =>
            legend
                .find(`tr[data-test="column-legend-row-${value}"]`)
                .find('td')
                .at(2)
                .text();
        assert.equal(countOf(ClonalValue.CLONAL), '2');
        assert.equal(countOf(ClonalValue.SUBCLONAL), '1');
        assert.equal(countOf(ClonalValue.INDETERMINATE), '0');
        assert.equal(countOf(ClonalValue.NA), '1');
        assert.include(legend.text(), 'In this table (4 mutations)');
    });

    it('shows a numeric summary', () => {
        const legend = mount(
            <ColumnLegendRowsContext.Provider value={() => rows}>
                <ColumnLegend
                    description="Reads"
                    getNumericValues={d => d.map(() => 10)}
                />
            </ColumnLegendRowsContext.Provider>
        );
        assert.equal(
            legend.find('[data-test="column-legend-summary"]').length,
            1
        );
        assert.include(legend.text(), 'Median10');
    });

    it('orders values numerically and hides empty categories', () => {
        const cnRows = [10, 2, 3, 2].map(n => [
            initMutation({ tumorAltCount: n }),
        ]);
        const legend = mount(
            <ColumnLegendRowsContext.Provider value={() => cnRows}>
                <ColumnLegend
                    description="CN"
                    categories={[{ value: 'NA' }]}
                    showEmptyCategories={false}
                    sortByValue={true}
                    getCategoryValues={d => d.map(m => m.tumorAltCount)}
                />
            </ColumnLegendRowsContext.Provider>
        );
        assert.deepEqual(
            legend
                .find('tr[data-test^="column-legend-row-"]')
                .map(r => r.prop('data-test')),
            [
                'column-legend-row-2',
                'column-legend-row-3',
                'column-legend-row-10',
            ]
        );
    });

    it('shows the missing count for a column without values', () => {
        const legend = mount(
            <ColumnLegendRowsContext.Provider value={() => rows}>
                <ColumnLegend description="CCF" getNumericValues={() => ['']} />
            </ColumnLegendRowsContext.Provider>
        );
        const text = legend.find('[data-test="column-legend-summary"]').text();
        assert.notInclude(text, 'Median');
        assert.include(text, 'No value4');
    });

    describe('duplicate mutations in patients with multiple samples', () => {
        const mutation = (sampleId: string, patientId: string) =>
            initMutation({
                sampleId,
                patientId,
                proteinChange: 'E545K',
                gene: { hugoGeneSymbol: 'PIK3CA' },
            });

        it('counts the same mutation in more samples of a patient', () => {
            assert.equal(
                countDuplicatesInMultipleSamples([
                    [mutation('S1', 'P1')],
                    [mutation('S2', 'P1')],
                    [mutation('S3', 'P2')],
                ]),
                1
            );
        });

        it('ignores rows that already group samples', () => {
            assert.equal(
                countDuplicatesInMultipleSamples([
                    [mutation('S1', 'P1'), mutation('S2', 'P1')],
                ]),
                0
            );
        });

        it('shows the duplicate count in the legend', () => {
            const legend = mount(
                <ColumnLegendRowsContext.Provider
                    value={() => [
                        [mutation('S1', 'P1')],
                        [mutation('S2', 'P1')],
                    ]}
                >
                    <ClonalColumnLegend />
                </ColumnLegendRowsContext.Provider>
            );
            assert.include(
                legend.find('[data-test="column-legend-duplicates"]').text(),
                'Includes 1 duplicate mutation in patients with multiple samples'
            );
        });
    });
});
