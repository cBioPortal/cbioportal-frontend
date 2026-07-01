import { assert } from 'chai';
import React from 'react';
import CustomDropdown from './CustomDropdown';

describe('CustomDropdown', () => {
    it('wires menu clicks to hide only when closeOnMenuClick is enabled', () => {
        const autocloseDropdown = new CustomDropdown({
            id: 'autoclose',
            title: '',
            closeOnMenuClick: true,
            children: <div>Option</div>,
        });
        const persistentDropdown = new CustomDropdown({
            id: 'persistent',
            title: '',
            children: <div>Option</div>,
        });

        const autocloseMenu = (
            (autocloseDropdown.render().props.children as React.ReactElement)
                .props.children as React.ReactElement[]
        )[1];
        const persistentMenu = (
            (persistentDropdown.render().props.children as React.ReactElement)
                .props.children as React.ReactElement[]
        )[1];

        assert.isFunction(autocloseMenu.props.onClick);
        assert.isUndefined(persistentMenu.props.onClick);
    });
});
