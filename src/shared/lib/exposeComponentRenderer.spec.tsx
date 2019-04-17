import exposeComponentRenderer from './exposeComponentRenderer';
import { assert } from 'chai';
import * as React from 'react';
import * as _ from 'lodash';
import * as $ from 'jquery';

describe('test', () => {
    let targetEl: HTMLDivElement | null;

    before(() => {
        targetEl = document.createElement('div');
    });

    after(() => {
        targetEl = null;
    });

    it('exposeComponentRenderer puts a function on window object. calling the function renders the passed component', () => {
        class testClass extends React.Component<any, any> {
            render() {
                return <div>foo</div>;
            }
        }

        exposeComponentRenderer('renderTestComponent', testClass, {});

        assert.isTrue(_.isFunction((window as any).renderTestComponent));

        (window as any).renderTestComponent(targetEl);

        assert.equal(targetEl!.innerText, 'foo');
    });
});
