import { assert } from 'chai';
import { mount, shallow } from 'enzyme';
import * as React from 'react';
import TopSvGenePairsTable from './TopSvGenePairsTable';
import { SvGenePairRow } from './svGenePairData';

// react-virtualized measures the DOM to virtualise rows; in jsdom those
// measurements are always 0, so no rows are rendered.  Replace the Table
// with a plain <div> that just calls rowGetter/cellRenderer directly so
// enzyme can find the rendered cells.
jest.mock('react-virtualized', () => {
    const React = require('react');
    return {
        Table: ({
            rowCount,
            rowGetter,
            children,
        }: {
            rowCount: number;
            rowGetter: (args: { index: number }) => any;
            children: React.ReactElement[];
        }) => (
            <div data-testid="rv-table-mock">
                {Array.from({ length: rowCount }, (_, i) => {
                    const row = rowGetter({ index: i });
                    return (
                        <div key={i} data-testid="rv-table-row">
                            {React.Children.map(children, (col: any) => {
                                if (
                                    !col ||
                                    !col.props ||
                                    !col.props.cellRenderer
                                )
                                    return null;
                                return col.props.cellRenderer({
                                    rowData: row,
                                    rowIndex: i,
                                    dataKey: col.props.dataKey,
                                    columnIndex: 0,
                                    cellData: null,
                                    isScrolling: false,
                                    parent: null,
                                });
                            })}
                        </div>
                    );
                })}
            </div>
        ),
        Column: ({
            cellRenderer,
            headerRenderer,
        }: {
            cellRenderer?: Function;
            headerRenderer?: Function;
        }) => <div />,
        SortDirection: { ASC: 'ASC', DESC: 'DESC' },
        AutoSizer: ({
            children,
        }: {
            children: (size: {
                width: number;
                height: number;
            }) => React.ReactNode;
        }) => <div>{children({ width: 400, height: 350 })}</div>,
    };
});

function makeRow(
    key: string,
    count: number,
    studyId = 'study1'
): SvGenePairRow {
    const [gene1, gene2] = key.split('::');
    return {
        uniqueKey: key,
        gene1,
        gene2,
        sampleCount: count,
        sampleIdentifiers: [{ studyId, sampleId: 'S1' }],
    };
}

describe('TopSvGenePairsTable', () => {
    it('renders rows for each pair in promise result', () => {
        const rows = [makeRow('ERG::TMPRSS2', 5), makeRow('BCR::ABL1', 3)];
        const promise = {
            isComplete: true,
            isPending: false,
            result: rows,
        } as any;
        const wrapper = mount(
            <TopSvGenePairsTable promise={promise} onSelectPair={() => {}} />
        );
        assert.equal(
            wrapper.find('[data-testid="sv-pair-row"]').hostNodes().length,
            2
        );
    });

    it('calls onSelectPair with the correct row when clicked', () => {
        const rows = [makeRow('ERG::TMPRSS2', 5), makeRow('BCR::ABL1', 3)];
        const promise = {
            isComplete: true,
            isPending: false,
            result: rows,
        } as any;
        let picked: SvGenePairRow | null = null;
        const wrapper = mount(
            <TopSvGenePairsTable
                promise={promise}
                onSelectPair={r => (picked = r)}
            />
        );
        wrapper
            .find('[data-testid="sv-pair-row"]')
            .hostNodes()
            .first()
            .simulate('click');
        assert.isNotNull(picked);
        assert.equal(picked!.uniqueKey, 'ERG::TMPRSS2');
    });

    it('shows loading text when promise is pending', () => {
        const promise = {
            isComplete: false,
            isPending: true,
            result: undefined,
        } as any;
        const wrapper = mount(
            <TopSvGenePairsTable promise={promise} onSelectPair={() => {}} />
        );
        assert.include(wrapper.text(), 'Loading');
        assert.equal(
            wrapper.find('[data-testid="sv-pair-row"]').hostNodes().length,
            0
        );
    });

    it('limits display to 15 rows', () => {
        const rows = Array.from({ length: 20 }, (_, i) =>
            makeRow(`GENE${i}A::GENE${i}B`, 20 - i)
        );
        const promise = {
            isComplete: true,
            isPending: false,
            result: rows,
        } as any;
        const wrapper = mount(
            <TopSvGenePairsTable promise={promise} onSelectPair={() => {}} />
        );
        assert.equal(
            wrapper.find('[data-testid="sv-pair-row"]').hostNodes().length,
            15
        );
    });

    it('renders Freq column as em-dash when numberOfProfiledSamples is not provided', () => {
        const rows = [makeRow('ERG::TMPRSS2', 5)];
        const promise = {
            isComplete: true,
            isPending: false,
            result: rows,
        } as any;
        const wrapper = mount(
            <TopSvGenePairsTable promise={promise} onSelectPair={() => {}} />
        );
        // The em-dash entity renders as the unicode em-dash character
        assert.include(wrapper.text(), '—');
    });

    it('renders Freq column as percentage when numberOfProfiledSamples is provided', () => {
        const rows = [makeRow('ERG::TMPRSS2', 10)];
        const promise = {
            isComplete: true,
            isPending: false,
            result: rows,
        } as any;
        const wrapper = mount(
            <TopSvGenePairsTable
                promise={promise}
                onSelectPair={() => {}}
                numberOfProfiledSamples={100}
            />
        );
        // 10/100 * 100 = 10.0%
        assert.include(wrapper.text(), '10.0%');
    });
});
