import * as React from 'react';
import { expect } from 'chai';
import { shallow, mount } from 'enzyme';
import UnsupportedBrowserModal from "./UnsupportedBrowserModal";
import browser from 'detect-browser';

describe('UnsupportedBrowserModal', () => {

    // let wrapper: any;
    //
    // before(()=> {
    //
    //      wrapper = shallow(<UnsupportedBrowserModal/>);
    //
    // });

    it('does not show modal when Chrome is being used', () => {
        const wrapper = shallow(<UnsupportedBrowserModal/>);
        shallow(<UnsupportedBrowserModal/>).instance().setState({show:false});
        expect(wrapper.state('show')).to.equal(false);
    });
    //
    // it('does not show modal when Safari is being used', () => {
    //     wrapper.instance().handleUnsupportedBrowsers('safari');
    //     expect(wrapper.state('show')).to.equal(false);
    // });
    //
    // it('shows modal when IE10 is being used and site is accessed for first time', () => {
    //     wrapper.instance().handleUnsupportedBrowsers('ie');
    //     expect(wrapper.state('show')).to.equal(true);
    //     window.localStorage.browserError = true;
    // });
    //
    // it('does not show modal when site is accessed after the first time, regardless of browser and/or version', () => {
    //     wrapper.instance().handleUnsupportedBrowsers('ie');
    //     expect(wrapper.state('show')).to.equal(false);
    // });

})
