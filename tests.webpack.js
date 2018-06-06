require('babel-polyfill');
// some setup first

var chai = require('chai');
var chaiEnzyme = require('chai-enzyme');

chai.use(chaiEnzyme());


// NOTE: SPEC_REGEXP is injected using webpack define
var context = require.context('./src', true, SPEC_REGEXP);

context.keys().forEach(context);
