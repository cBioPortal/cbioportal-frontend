import exposeComponentRenderer from './exposeComponentRenderer';
import { assert } from 'chai';
import * as React from 'react';
import * as _ from 'lodash';
import * as $ from 'jquery';

describe('test',()=>{

    let targetEl;

    before(()=>{
        targetEl = document.createElement('div');
    });

    after(()=>{
        targetEl = null;
    });


    it ('exposeComponentRenderer puts a function on window object. calling the function renders the passed component', ()=>{

        class testClass extends React.Component {

            render(){

                return <div>foo</div>;

            }

        };

        exposeComponentRenderer("renderTestComponent",testClass,{});

        assert.isTrue(_.isFunction(window.renderTestComponent));

        window.renderTestComponent(targetEl);

        assert.equal(targetEl.innerText, 'foo');

    });




});