import React from 'react';
import { assert } from 'chai';
import { mount } from 'enzyme';
import sinon from 'sinon';
import { SearchMenuToggle, ClearSearchButton } from './StudySearch';

describe('SearchMenuToggle', () => {
    it('renders with accessible name, aria-controls, and aria-expanded false when closed', () => {
        const wrapper = mount(
            <SearchMenuToggle onClick={() => {}} open={false} />
        );
        const button = wrapper.find('button');
        assert.equal(button.prop('aria-label'), 'Toggle study search menu');
        assert.equal(button.prop('aria-expanded'), false);
        assert.equal(button.prop('aria-controls'), 'study-search-menu');
    });

    it('renders with aria-expanded true when open', () => {
        const wrapper = mount(
            <SearchMenuToggle onClick={() => {}} open={true} />
        );
        const button = wrapper.find('button');
        assert.equal(button.prop('aria-label'), 'Toggle study search menu');
        assert.equal(button.prop('aria-expanded'), true);
        assert.equal(button.prop('aria-controls'), 'study-search-menu');
    });

    it('renders with custom controlsId if provided', () => {
        const wrapper = mount(
            <SearchMenuToggle
                onClick={() => {}}
                open={false}
                controlsId="custom-menu-id"
            />
        );
        const button = wrapper.find('button');
        assert.equal(button.prop('aria-controls'), 'custom-menu-id');
    });

    it('calls onClick on mousedown', () => {
        const onClickSpy = sinon.spy();
        const wrapper = mount(
            <SearchMenuToggle onClick={onClickSpy} open={false} />
        );
        wrapper.find('button').simulate('mousedown');
        assert.isTrue(onClickSpy.calledOnce);
    });

    it('calls onClick on Enter keydown', () => {
        const onClickSpy = sinon.spy();
        const wrapper = mount(
            <SearchMenuToggle onClick={onClickSpy} open={false} />
        );
        wrapper.find('button').simulate('keydown', { key: 'Enter' });
        assert.isTrue(onClickSpy.calledOnce);
    });

    it('calls onClick on Space keydown', () => {
        const onClickSpy = sinon.spy();
        const wrapper = mount(
            <SearchMenuToggle onClick={onClickSpy} open={false} />
        );
        wrapper.find('button').simulate('keydown', { key: ' ' });
        assert.isTrue(onClickSpy.calledOnce);
    });

    it('does not call onClick on other keys', () => {
        const onClickSpy = sinon.spy();
        const wrapper = mount(
            <SearchMenuToggle onClick={onClickSpy} open={false} />
        );
        wrapper.find('button').simulate('keydown', { key: 'Tab' });
        assert.isFalse(onClickSpy.called);
    });
});

describe('ClearSearchButton', () => {
    it('renders as button with type="button" and accessible label', () => {
        const wrapper = mount(
            <ClearSearchButton onClick={() => {}} show={true} />
        );
        const button = wrapper.find('button');
        assert.equal(button.length, 1);
        assert.equal(button.prop('type'), 'button');
        assert.equal(button.prop('aria-label'), 'Clear study search');
        assert.equal(button.prop('data-test'), 'clearStudyFilter');
    });

    it('sets visibility style based on show prop', () => {
        const wrapperVisible = mount(
            <ClearSearchButton onClick={() => {}} show={true} />
        );
        assert.equal(
            wrapperVisible.find('button').prop('style')?.visibility,
            'visible'
        );

        const wrapperHidden = mount(
            <ClearSearchButton onClick={() => {}} show={false} />
        );
        assert.equal(
            wrapperHidden.find('button').prop('style')?.visibility,
            'hidden'
        );
    });

    it('calls onClick when clicked', () => {
        const onClickSpy = sinon.spy();
        const wrapper = mount(
            <ClearSearchButton onClick={onClickSpy} show={true} />
        );
        wrapper.find('button').simulate('click');
        assert.isTrue(onClickSpy.calledOnce);
    });
});
