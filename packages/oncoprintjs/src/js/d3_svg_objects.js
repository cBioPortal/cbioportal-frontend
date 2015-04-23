var d3 = require('d3');

module.exports = {};
module.exports.makeD3SVGElement = function(tag) {
	return d3.select(document.createElementNS('http://www.w3.org/2000/svg', tag));
};
