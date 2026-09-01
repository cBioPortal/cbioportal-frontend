import * as React from 'react';
import { assert } from 'chai';
import { mount } from 'enzyme';
import DoubleHandleSlider from './DoubleHandleSlider';

describe('DoubleHandleSlider', () => {
    // The component drives its handles/boxes imperatively via document.getElementById,
    // so it has to be attached to the document rather than rendered detached.
    let container: HTMLDivElement;

    beforeEach(() => {
        container = document.createElement('div');
        document.body.appendChild(container);
    });

    afterEach(() => {
        document.body.removeChild(container);
    });

    const mountAttached = (element: React.ReactElement) =>
        mount(element, { attachTo: container });

    const defaultProps = () => ({
        id: 'test-slider',
        min: '0',
        max: '100',
        callbackLowerValue: () => undefined,
        callbackUpperValue: () => undefined,
    });

    const box = (id: string) =>
        document.getElementById(id) as HTMLInputElement | null;

    it('defaults to the mutation-table width when no width prop is given', () => {
        const slider = mountAttached(
            <DoubleHandleSlider {...defaultProps()} />
        );

        assert.equal((slider.getDOMNode() as HTMLElement).style.width, '135px');
    });

    it('honors an explicit width prop', () => {
        const slider = mountAttached(
            <DoubleHandleSlider {...defaultProps()} width="190px" />
        );

        assert.equal((slider.getDOMNode() as HTMLElement).style.width, '190px');
    });

    it('sizes the value boxes in ch units so long values are not clipped', () => {
        // Regression: the width was a flat (length + 3) * 7 px heuristic that
        // under-allocated the .form-control.input-sm padding, clipping the last
        // character of longer values.
        mountAttached(
            <DoubleHandleSlider
                {...defaultProps()}
                min="0"
                max="1234567"
                lowerValue={0}
                upperValue={1234567}
            />
        );

        const upper = box('test-slider-upperValue-box');
        assert.isNotNull(upper);
        assert.equal(upper!.style.width, 'calc(7ch + 22px)');
    });

    it('never lets the two value boxes wrap onto separate lines', () => {
        mountAttached(<DoubleHandleSlider {...defaultProps()} />);

        assert.equal(
            box('test-slider-lowerValue-box')!.style.maxWidth,
            'calc(50% - 3px)'
        );
        assert.equal(
            box('test-slider-upperValue-box')!.style.maxWidth,
            'calc(50% - 3px)'
        );
    });

    it('rounds fractional slider values to the precision the step implies', () => {
        // With min/max "0.0".."10.0" the step is (max - min) / 100 = 0.1, so values
        // snap to one decimal. Without rounding, the raw binary-float value below
        // reaches the box verbatim and overflows it.
        const slider = mountAttached(
            <DoubleHandleSlider {...defaultProps()} min="0.0" max="10.0" />
        );

        slider
            .find('input[type="range"]')
            .first()
            .simulate('change', { target: { value: '8.500000000000002' } });

        assert.equal(box('test-slider-lowerValue-box')!.value, '8.5');
    });

    it('keeps more decimals when the range implies a finer step', () => {
        // step = (0.5 - 0.0) / 100 = 0.005 -> three decimals retained.
        const slider = mountAttached(
            <DoubleHandleSlider {...defaultProps()} min="0.0" max="0.5" />
        );

        slider
            .find('input[type="range"]')
            .first()
            .simulate('change', { target: { value: '0.185000000000001' } });

        assert.equal(box('test-slider-lowerValue-box')!.value, '0.185');
    });

    it('leaves integer-stepped values untouched', () => {
        const slider = mountAttached(
            <DoubleHandleSlider {...defaultProps()} />
        );

        slider
            .find('input[type="range"]')
            .first()
            .simulate('change', { target: { value: '42' } });

        assert.equal(box('test-slider-lowerValue-box')!.value, '42');
    });
});
