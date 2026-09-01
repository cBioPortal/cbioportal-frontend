import * as React from 'react';
import { assert } from 'chai';
import { mount } from 'enzyme';
import CategoricalFilterMenu from 'shared/components/categoricalFilterMenu/CategoricalFilterMenu';
import { ColumnVisibilityControls } from 'shared/components/columnVisibilityControls/ColumnVisibilityControls';
import DoubleHandleSlider from 'shared/components/doubleHandleSlider/DoubleHandleSlider';
import FilterIconModal from 'shared/components/filterIconModal/FilterIconModal';
import ServerDrivenTable, {
    ServerDrivenTableColumn,
    ServerDrivenTableProps,
} from './ServerDrivenTable';

type TestRow = {
    name: string;
    type: string;
};

describe('ServerDrivenTable', () => {
    const rows: TestRow[] = [
        { name: 'Alpha', type: 'A' },
        { name: 'Beta', type: 'B' },
    ];

    const columns: ServerDrivenTableColumn<TestRow>[] = [
        {
            id: 'name',
            name: 'Name',
            render: row => row.name,
        },
        {
            id: 'type',
            name: 'Type',
            render: row => row.type,
        },
    ];

    const defaultProps = (): ServerDrivenTableProps<TestRow> => ({
        rows,
        columns,
        totalRowCount: rows.length,
        currentPage: 0,
        pageSize: 25,
        onPageChange: () => undefined,
        onPageSizeChange: () => undefined,
        onSortChange: () => undefined,
        onSearchChange: () => undefined,
        onFilterChange: () => undefined,
        onFilterDeactivate: () => undefined,
    });

    beforeEach(() => {
        jest.useFakeTimers();
    });

    afterEach(() => {
        jest.runOnlyPendingTimers();
        jest.useRealTimers();
    });

    it('renders empty state when not loading and there are no rows', () => {
        const table = mount(
            <ServerDrivenTable<TestRow>
                {...defaultProps()}
                rows={[]}
                totalRowCount={0}
            />
        );

        assert.include(table.text(), 'No data available');
    });

    it('toggles sort direction when clicking the sorted header', () => {
        const onSortChange = jest.fn();
        const table = mount(
            <ServerDrivenTable<TestRow>
                {...defaultProps()}
                sortColumn="name"
                sortDirection="asc"
                onSortChange={onSortChange}
            />
        );

        table
            .find('th.multilineHeader')
            .at(0)
            .find('span[role="button"]')
            .first()
            .simulate('click');

        assert.deepEqual(onSortChange.mock.calls[0], ['name', 'desc']);
    });

    it('debounces search changes and clears immediately', () => {
        const onSearchChange = jest.fn();
        const table = mount(
            <ServerDrivenTable<TestRow>
                {...defaultProps()}
                onSearchChange={onSearchChange}
                searchDebounceMs={300}
            />
        );

        table
            .find('input.form-control')
            .first()
            .simulate('change', {
                currentTarget: { value: 'Alpha' },
            });

        assert.equal(onSearchChange.mock.calls.length, 0);
        jest.advanceTimersByTime(300);
        assert.deepEqual(onSearchChange.mock.calls[0], ['Alpha']);

        table
            .find('span')
            .filterWhere(node => node.text() === 'x')
            .first()
            .simulate('click');

        assert.deepEqual(onSearchChange.mock.calls[1], ['']);
    });

    it('updates column visibility through ColumnVisibilityControls', () => {
        const table = mount(<ServerDrivenTable<TestRow> {...defaultProps()} />);
        const controls = table.find(ColumnVisibilityControls);

        controls.props().onColumnToggled &&
            controls
                .props()
                .onColumnToggled('type', controls.props().columnVisibility);
        table.update();

        assert.equal(table.find('th.multilineHeader').length, 1);
        assert.notInclude(table.text(), 'B');
    });

    it('passes categorical filter changes back to the parent contract', () => {
        const onFilterChange = jest.fn();
        const table = mount(
            <ServerDrivenTable<TestRow>
                {...defaultProps()}
                onFilterChange={onFilterChange}
                facets={{
                    type: [
                        { value: 'A', count: 1 },
                        { value: 'B', count: 1 },
                    ],
                }}
            />
        );

        table
            .find(CategoricalFilterMenu)
            .first()
            .props()
            .toggleSelections(new Set(['A']));

        const [
            columnId,
            selectedValues,
            allValues,
        ] = onFilterChange.mock.calls[0];
        assert.equal(columnId, 'type');
        assert.deepEqual(Array.from(selectedValues as Set<string>).sort(), [
            'B',
        ]);
        assert.deepEqual(Array.from(allValues as Set<string>).sort(), [
            'A',
            'B',
        ]);
    });

    it('deactivates a filter when all values become selected again', () => {
        const onFilterDeactivate = jest.fn();
        const table = mount(
            <ServerDrivenTable<TestRow>
                {...defaultProps()}
                onFilterDeactivate={onFilterDeactivate}
                facets={{
                    type: [
                        { value: 'A', count: 1 },
                        { value: 'B', count: 1 },
                    ],
                }}
                activeFilters={{ type: new Set(['B']) }}
            />
        );

        table
            .find(CategoricalFilterMenu)
            .first()
            .props()
            .toggleSelections(new Set(['A']));

        assert.deepEqual(onFilterDeactivate.mock.calls[0], ['type']);
    });

    it('renders a DoubleHandleSlider for numeric columns with a usable facet range', () => {
        const numericColumns: ServerDrivenTableColumn<TestRow>[] = [
            ...columns,
            {
                id: 'metadata:score',
                name: 'Score',
                dataType: 'number',
                render: () => 'n/a',
            },
        ];

        const container = document.createElement('div');
        document.body.appendChild(container);
        const table = mount(
            <ServerDrivenTable<TestRow>
                {...defaultProps()}
                columns={numericColumns}
                facetRanges={{ 'metadata:score': { min: 0, max: 100 } }}
            />,
            { attachTo: container }
        );

        assert.equal(table.find(DoubleHandleSlider).length, 1);
        const sliderProps = table.find(DoubleHandleSlider).props();
        assert.equal(sliderProps.min, '0');
        assert.equal(sliderProps.max, '100');

        table.unmount();
        document.body.removeChild(container);
    });

    it('does not render a filter control for a numeric column with no usable range (min === max)', () => {
        const numericColumns: ServerDrivenTableColumn<TestRow>[] = [
            ...columns,
            {
                id: 'metadata:score',
                name: 'Score',
                dataType: 'number',
                render: () => 'n/a',
            },
        ];

        const table = mount(
            <ServerDrivenTable<TestRow>
                {...defaultProps()}
                columns={numericColumns}
                facetRanges={{ 'metadata:score': { min: 5, max: 5 } }}
            />
        );

        assert.equal(table.find(DoubleHandleSlider).length, 0);
    });

    it('calls onRangeFilterChange with the selected range when a slider handle moves', () => {
        const onRangeFilterChange = jest.fn();
        const numericColumns: ServerDrivenTableColumn<TestRow>[] = [
            ...columns,
            {
                id: 'metadata:score',
                name: 'Score',
                dataType: 'number',
                render: () => 'n/a',
            },
        ];

        const container = document.createElement('div');
        document.body.appendChild(container);
        const table = mount(
            <ServerDrivenTable<TestRow>
                {...defaultProps()}
                columns={numericColumns}
                facetRanges={{ 'metadata:score': { min: 0, max: 100 } }}
                onRangeFilterChange={onRangeFilterChange}
            />,
            { attachTo: container }
        );

        table
            .find(DoubleHandleSlider)
            .first()
            .props()
            .callbackLowerValue(10);

        assert.equal(onRangeFilterChange.mock.calls[0][0], 'metadata:score');
        assert.deepEqual(onRangeFilterChange.mock.calls[0][1], {
            min: 10,
            max: 100,
        });
        assert.deepEqual(onRangeFilterChange.mock.calls[0][2], {
            min: 0,
            max: 100,
        });

        table.unmount();
        document.body.removeChild(container);
    });

    it('deactivates the range filter when the selection covers the full range again', () => {
        const onRangeFilterDeactivate = jest.fn();
        const numericColumns: ServerDrivenTableColumn<TestRow>[] = [
            ...columns,
            {
                id: 'metadata:score',
                name: 'Score',
                dataType: 'number',
                render: () => 'n/a',
            },
        ];

        const container = document.createElement('div');
        document.body.appendChild(container);
        const table = mount(
            <ServerDrivenTable<TestRow>
                {...defaultProps()}
                columns={numericColumns}
                facetRanges={{ 'metadata:score': { min: 0, max: 100 } }}
                activeRangeFilters={{ 'metadata:score': { min: 10, max: 100 } }}
                onRangeFilterDeactivate={onRangeFilterDeactivate}
            />,
            { attachTo: container }
        );

        table
            .find(DoubleHandleSlider)
            .first()
            .props()
            .callbackLowerValue(0);

        assert.deepEqual(onRangeFilterDeactivate.mock.calls[0], [
            'metadata:score',
        ]);

        table.unmount();
        document.body.removeChild(container);
    });

    it('scrolls a wide column set inside its own container rather than the page', () => {
        const table = mount(
            <ServerDrivenTable
                {...defaultProps()}
                tableMaxHeight="calc(100vh - 220px)"
            />
        );

        const scroller = table.find(
            '[data-test="ServerDrivenTableScrollContainer"]'
        );
        assert.equal(scroller.length, 1);
        assert.equal(scroller.prop('style')!.overflow, 'auto');
        assert.equal(scroller.prop('style')!.maxHeight, 'calc(100vh - 220px)');
    });

    it('lets the table size to its content so columns are not squashed', () => {
        const table = mount(<ServerDrivenTable {...defaultProps()} />);

        const style = table.find('table').prop('style')!;
        assert.equal(style.width, 'auto');
        assert.equal(style.minWidth, '100%');
    });

    it('asks its filter menus to escape the scroll container', () => {
        // The scroll container would otherwise clip the categorical menu and the
        // numeric slider, which live inside the table headers.
        const columnsWithFacet: ServerDrivenTableColumn<TestRow>[] = [
            ...columns.map(c => ({ ...c, filterable: true })),
        ];
        const table = mount(
            <ServerDrivenTable
                {...defaultProps()}
                columns={columnsWithFacet}
                facets={{ type: [{ value: 'A', count: 1 }] }}
            />
        );

        const modals = table.find(FilterIconModal);
        assert.isAtLeast(modals.length, 1);
        modals.forEach(modal => {
            assert.isTrue(modal.prop('escapeScrollContainer'));
        });
    });
});
