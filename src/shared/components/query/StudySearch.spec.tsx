import React from 'react';
import { assert } from 'chai';
import { mount } from 'enzyme';
import { SearchMenuToggle } from './StudySearch';

describe('SearchMenuToggle', () => {
    it('renders with accessible name and aria-expanded false when closed', () => {
        const wrapper = mount(
            <SearchMenuToggle onClick={() => {}} open={false} />
        );
        const button = wrapper.find('button');
        assert.equal(button.prop('aria-label'), 'Toggle study search menu');
        assert.equal(button.prop('aria-expanded'), false);
    });

    it('renders with aria-expanded true when open', () => {
        const wrapper = mount(
            <SearchMenuToggle onClick={() => {}} open={true} />
        );
        const button = wrapper.find('button');
        assert.equal(button.prop('aria-label'), 'Toggle study search menu');
        assert.equal(button.prop('aria-expanded'), true);
    });
});
