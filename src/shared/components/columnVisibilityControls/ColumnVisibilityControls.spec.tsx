import React from 'react';
import { assert } from 'chai';
import Enzyme, { mount } from 'enzyme';
import {
    ColumnVisibilityControls,
    IColumnVisibilityDef,
} from './ColumnVisibilityControls';
import Adapter from 'enzyme-adapter-react-16';

Enzyme.configure({ adapter: new Adapter() });

describe('ColumnVisibilityControls', () => {
    beforeEach(() => {});

    it('does not render list item if togglabe is false', () => {
        var cols: IColumnVisibilityDef[] = [
            {
                id: 'one',
                name: 'one',
                visible: true,
                togglable: true,
            },
            {
                id: 'two',
                name: 'two',
                visible: true,
                togglable: true,
            },
        ];

        const controls = mount(
            <ColumnVisibilityControls columnVisibility={cols} />
        );

        assert.equal(controls.find('li').length, 2);

        cols[0].togglable = false;

        controls.setProps({ columnVisibility: cols });

        assert.equal(
            controls.find('li').length,
            1,
            'does NOT render togglable false cols'
        );
    });
});
