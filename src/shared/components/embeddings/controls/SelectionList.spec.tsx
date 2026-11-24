import { assert } from 'chai';
import { mount } from 'enzyme';
import * as React from 'react';
import { SelectionList, SelectionListProps } from './SelectionList';

describe('SelectionList', () => {
    function makeProps(
        overrides: Partial<SelectionListProps> = {}
    ): SelectionListProps {
        return {
            selections: [
                { id: 1, name: 'Selection 1', color: '#2e7d32', count: 12 },
                { id: 2, name: 'Selection 2', color: '#c2185b', count: 7 },
            ],
            onRemove: () => undefined,
            onRename: () => undefined,
            onClear: () => undefined,
            ...overrides,
        };
    }

    const pencil = (wrapper: any, index: number) =>
        wrapper.find('[data-test="embeddings-selection-rename"]').at(index);
    const input = (wrapper: any) =>
        wrapper.find('input[data-test="embeddings-selection-name-input"]');

    it('offers a rename on every chip', () => {
        const wrapper = mount(<SelectionList {...makeProps()} />);
        assert.equal(
            wrapper.find('[data-test="embeddings-selection-rename"]').length,
            2
        );
        assert.isFalse(input(wrapper).exists());
    });

    it('opens the chip it was asked about, holding the current name', () => {
        const wrapper = mount(<SelectionList {...makeProps()} />);
        pencil(wrapper, 1).simulate('click');
        assert.equal(input(wrapper).prop('value'), 'Selection 2');
        // Only the edited chip turns into a field.
        assert.equal(input(wrapper).length, 1);
        assert.equal(
            wrapper.find('[data-test="embeddings-selection-rename"]').length,
            1
        );
    });

    it('renames on Enter and closes the field', () => {
        const renamed: [number, string][] = [];
        const wrapper = mount(
            <SelectionList
                {...makeProps({
                    onRename: (id, name) => renamed.push([id, name]),
                })}
            />
        );
        pencil(wrapper, 0).simulate('click');
        input(wrapper).simulate('change', { target: { value: 'Responders' } });
        input(wrapper).simulate('keydown', { key: 'Enter' });
        assert.deepEqual(renamed, [[1, 'Responders']]);
        assert.isFalse(input(wrapper).exists());
    });

    it('renames on blur, so clicking away keeps what was typed', () => {
        const renamed: [number, string][] = [];
        const wrapper = mount(
            <SelectionList
                {...makeProps({
                    onRename: (id, name) => renamed.push([id, name]),
                })}
            />
        );
        pencil(wrapper, 0).simulate('click');
        input(wrapper).simulate('change', {
            target: { value: '  Cluster A  ' },
        });
        input(wrapper).simulate('blur');
        // Trimmed, so stray spaces do not become part of the name.
        assert.deepEqual(renamed, [[1, 'Cluster A']]);
    });

    it('leaves the name alone on Escape', () => {
        const renamed: [number, string][] = [];
        const wrapper = mount(
            <SelectionList
                {...makeProps({
                    onRename: (id, name) => renamed.push([id, name]),
                })}
            />
        );
        pencil(wrapper, 0).simulate('click');
        input(wrapper).simulate('change', { target: { value: 'Discarded' } });
        input(wrapper).simulate('keydown', { key: 'Escape' });
        assert.deepEqual(renamed, []);
        assert.isFalse(input(wrapper).exists());
    });

    it('keeps the old name rather than accepting an empty one', () => {
        const renamed: [number, string][] = [];
        const wrapper = mount(
            <SelectionList
                {...makeProps({
                    onRename: (id, name) => renamed.push([id, name]),
                })}
            />
        );
        pencil(wrapper, 0).simulate('click');
        input(wrapper).simulate('change', { target: { value: '   ' } });
        input(wrapper).simulate('keydown', { key: 'Enter' });
        assert.deepEqual(renamed, []);
        assert.isFalse(input(wrapper).exists());
    });
});
