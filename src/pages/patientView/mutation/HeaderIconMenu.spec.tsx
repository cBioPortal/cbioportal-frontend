import React from 'react';
import Enzyme, { mount } from 'enzyme';
import { assert } from 'chai';
import HeaderIconMenu from './HeaderIconMenu';
import Adapter from 'enzyme-adapter-react-16';

Enzyme.configure({ adapter: new Adapter() });

describe('HeaderIconMenu', () => {
    const headerName = 'MyName';
    const wrapper = mount(<HeaderIconMenu name={headerName} />);

    it('shows the name passed in as prop', () => {
        assert.equal(wrapper.find('span').text(), headerName);
    });

    it('creates menu when icon clicked', () => {
        const icon = wrapper.find('i');
        icon.simulate('click');
        assert.isTrue(wrapper.find('.rc-tooltip').exists());
    });
});
