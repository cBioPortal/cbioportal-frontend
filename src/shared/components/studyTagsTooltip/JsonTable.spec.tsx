import React from 'react';
import { assert } from 'chai';
import { mount } from 'enzyme';
import JsonTable from './JsonTable';

function render(json: any): HTMLElement {
    return mount(<JsonTable json={json} />).getDOMNode() as HTMLElement;
}

function rowTexts(table: Element): string[][] {
    return Array.from(table.querySelectorAll(':scope > tbody > tr')).map(tr =>
        Array.from(tr.querySelectorAll(':scope > td')).map(
            td => td.textContent || ''
        )
    );
}

function subTable(root: HTMLElement): Element {
    return root.querySelector(
        ':scope > table > tbody > tr > td > table'
    ) as Element;
}

describe('JsonTable', () => {
    it('renders a flat object as key/value rows', () => {
        const root = render({ 'Loaded by': 'Jill', 'Load id': 34 });
        assert.equal(root.className, 'json-to-table');
        const table = root.querySelector(':scope > table') as Element;
        assert.deepEqual(rowTexts(table), [
            ['Loaded by', 'Jill'],
            ['Load id', '34'],
        ]);
        assert.equal(table.querySelector('strong')!.textContent, 'Loaded by');
    });

    it('renders a nested object as a labelled sub-table', () => {
        const root = render({
            Analyst: { name: 'Jack', email: 'jack@xyz.com' },
        });
        const cell = root.querySelector(':scope > table > tbody > tr > td')!;
        assert.equal(cell.getAttribute('colspan'), '2');
        assert.equal(
            cell.querySelector(':scope > div > strong')!.textContent,
            'Analyst'
        );
        assert.deepEqual(rowTexts(subTable(root)), [
            ['name', 'Jack'],
            ['email', 'jack@xyz.com'],
        ]);
    });

    it('renders an array of objects as a grid with a header row', () => {
        const root = render({
            'Study sponsors': [
                { name: 'john', email: 'john@xyz.com' },
                { name: 'jane', role: 'PI' },
            ],
        });
        assert.deepEqual(rowTexts(subTable(root)), [
            ['name', 'email', 'role'],
            ['john', 'john@xyz.com', ''],
            ['jane', '', 'PI'],
        ]);
    });

    it('renders an array of primitives one per row', () => {
        const root = render({ Labels: ['a', 'b'] });
        assert.deepEqual(rowTexts(subTable(root)), [['a'], ['b']]);
    });

    it('renders null and boolean values as text', () => {
        const root = render({ Public: false, Note: null });
        assert.deepEqual(rowTexts(root.querySelector(':scope > table')!), [
            ['Public', 'false'],
            ['Note', ''],
        ]);
    });
});
