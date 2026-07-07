import * as React from 'react';
import { assert } from 'chai';
import { mount } from 'enzyme';
import CategoricalFilterMenu from 'shared/components/categoricalFilterMenu/CategoricalFilterMenu';
import { ColumnVisibilityControls } from 'shared/components/columnVisibilityControls/ColumnVisibilityControls';
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
});
