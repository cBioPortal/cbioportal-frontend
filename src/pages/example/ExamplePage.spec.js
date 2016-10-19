import {assert} from 'chai';
import {shallow, mount} from 'enzyme';
import sinon from 'sinon';

import ExamplePage from './ExamplePage';

import Spinner from 'react-spinkit';

describe('ExamplePage React component', ()=> {

    describe('ExamplePage React component', ()=> {


        it('#isValidEmail validates email', ()=> {

            assert.isTrue(ExamplePage.prototype.isValidEmail('john.doe@gmail.com'), 'john.doe@gmail.com is valid');
            assert.isFalse(ExamplePage.prototype.isValidEmail('john.doe@gmail'), 'john.doe@gmail is invalid');
            assert.isFalse(ExamplePage.prototype.isValidEmail('a@gmail'), 'a@gmail.com is valid');
            assert.isFalse(ExamplePage.prototype.isValidEmail('aaron@nora@gmail'), 'a@gmail.com is valid');


        });

    });






});

