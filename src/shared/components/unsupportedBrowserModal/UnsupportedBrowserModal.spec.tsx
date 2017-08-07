import * as React from 'react';
import { expect } from 'chai';
import { shallow, mount } from 'enzyme';
import UnsupportedBrowserModal from "./UnsupportedBrowserModal";
import browser from 'detect-browser';

describe('UnsupportedBrowserModal', () => {

    let wrapper: any;

    before(()=> {
         wrapper = shallow(<UnsupportedBrowserModal/>);
    });

    it('does not show modal when Chrome is being used', () => {
        wrapper.instance().handleUnsupportedBrowsers('chrome');
        expect(wrapper.state('show')).to.equal(false);
    });

    it('does not show modal when Edge is being used', () => {
        wrapper.instance().handleUnsupportedBrowsers('edge');
        expect(wrapper.state('show')).to.equal(false);
    });

    it('does not show when state is manually set to false', () => {
        wrapper.instance().setState({show: false});
        expect(wrapper.state('show')).to.equal(false);
    });

    it('shows modal when Safari is being used', () => {
        wrapper.instance().handleUnsupportedBrowsers('safari');
        expect(wrapper.state('show')).to.equal(false);
    });

    it('shows modal when IE10 is being used and site is accessed for first time', () => {
        wrapper.instance().handleUnsupportedBrowsers('ie', '10.0.0');
        expect(wrapper.state('show')).to.equal(true);
    });
    
    it('shows no modal when IE11 is being used and site is accessed for first time', () => {
        wrapper.instance().handleUnsupportedBrowsers('ie', '11.0.0');
        expect(wrapper.state('show')).to.equal(false);
    });

});
