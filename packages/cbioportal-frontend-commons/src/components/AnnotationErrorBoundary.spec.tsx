import * as React from 'react';
import { assert } from 'chai';
import { mount } from 'enzyme';

import AnnotationErrorBoundary, {
    setAnnotationErrorLogger,
} from './AnnotationErrorBoundary';

function Throws(): JSX.Element {
    throw new Error('missing field');
}

function Works(): JSX.Element {
    return <span className="works">annotation</span>;
}

describe('AnnotationErrorBoundary', function() {
    let consoleError: any;

    beforeEach(() => {
        // React logs every error it hands to a boundary
        consoleError = console.error;
        console.error = () => {};
    });

    afterEach(() => {
        console.error = consoleError;
        setAnnotationErrorLogger(() => {});
    });

    it('renders children when nothing throws', function() {
        const wrapper = mount(
            <AnnotationErrorBoundary
                componentName="Test"
                fallback={<span className="fallback" />}
            >
                <Works />
            </AnnotationErrorBoundary>
        );

        assert.equal(wrapper.find('.works').length, 1);
        assert.equal(wrapper.find('.fallback').length, 0);
    });

    it('renders the fallback instead of propagating a render error', function() {
        const wrapper = mount(
            <AnnotationErrorBoundary
                componentName="Test"
                fallback={<span className="fallback" />}
            >
                <Throws />
            </AnnotationErrorBoundary>
        );

        assert.equal(wrapper.find('.fallback').length, 1);
    });

    it('does not affect sibling annotations in the same cell', function() {
        const wrapper = mount(
            <span>
                <AnnotationErrorBoundary
                    componentName="Broken"
                    fallback={<span className="fallback" />}
                >
                    <Throws />
                </AnnotationErrorBoundary>
                <AnnotationErrorBoundary
                    componentName="Working"
                    fallback={<span className="fallback" />}
                >
                    <Works />
                </AnnotationErrorBoundary>
            </span>
        );

        assert.equal(wrapper.find('.fallback').length, 1);
        assert.equal(wrapper.find('.works').length, 1);
    });

    it('reports the failure to the registered logger', function() {
        const reported: string[] = [];
        setAnnotationErrorLogger((error, componentName) =>
            reported.push(`${componentName}:${error.message}`)
        );

        mount(
            <AnnotationErrorBoundary
                componentName="Test"
                fallback={<span className="fallback" />}
            >
                <Throws />
            </AnnotationErrorBoundary>
        );

        assert.deepEqual(reported, ['Test:missing field']);
    });

    it('reports the same failure only once across boundaries', function() {
        const reported: string[] = [];
        setAnnotationErrorLogger((error, componentName) =>
            reported.push(`${componentName}:${error.message}`)
        );

        // the same annotation breaking on every row of a table
        mount(
            <span>
                <AnnotationErrorBoundary
                    componentName="Test"
                    fallback={<span className="fallback" />}
                >
                    <Throws />
                </AnnotationErrorBoundary>
                <AnnotationErrorBoundary
                    componentName="Test"
                    fallback={<span className="fallback" />}
                >
                    <Throws />
                </AnnotationErrorBoundary>
            </span>
        );

        assert.deepEqual(reported, ['Test:missing field']);
    });
});
