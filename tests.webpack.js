require('babel-polyfill');
// some setup first
import { configure } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';

configure({ adapter: new Adapter() });


var chai = require('chai');
var chaiEnzyme = require('chai-enzyme');

chai.use(chaiEnzyme());


// NOTE: SPEC_REGEXP is injected using webpack define
var context = require.context('./src', true, SPEC_REGEXP);

context.keys().forEach(context);
