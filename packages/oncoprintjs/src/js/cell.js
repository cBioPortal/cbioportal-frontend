var utils = require('utils');
// cellDecoratorTypes is an enum as well as giving a rendering order
var cellDecoratorTypes = ['CELL', 'ONE_THIRD_FILL', 'LARGE_RIGHTARROW', 'UPPER_UPARROW', 'LOWER_DOWNARROW']
// a decorator attribute is of the form {'type':T, 'stroke':CS, 'fill':CF, selector:F} 
//	where T is in cellDecoratorTypes, CS and CF are hex color strings, and F is a function from datum to boolean that decides whether its active
var defaultConfig = {
	cell_width: 10,
	cell_height: 20,
}; 
function CellDecorator(config) {
	var rules = [];
	this.config = $.extend({}, defaultConfig, config);

	this.decorate = function(container, data) {
		rules.sort(function(a,b) {
			return cellDecoratorTypes.index(a.type) - cellDecoratorTypes.index(b.type);
		});
		var rule, filtered_data;
		for (var i=0; i<rules.length; i++) {
			rule = rules[i];
			filtered_data = data.filter(rule.selector)
			if (rule.type === 'CELL') {
				// create new rects if necessary
				container.selectAll('rect .cell').data(filtered_data).enter().append('rect').class('cell');
				container.selectAll('rect .cell').data(filtered_data)
					.attr('stroke', rule.stroke)
					.attr('fill', rule.fill);
			} else if (rule.type === 'ONE_THIRD_FILL') {
				container.selectAll('rect .cell').data(filtered_data).selectAll('rect .one-third-fill').remove();
				container.selectAll('rect .cell').data(filtered_data).selectAll('rect .one-third-fill')
				.enter().append('rect').class('one-third-fill')
				.attr('transform', utils.translate(0,this.config.cell_height/3));
				.attr('stroke', rule.stroke)
				.attr('fill', rule.fill)
				.style('width', this.config.cell_width)
				.style('height', this.config.cell_height/3);
			} else if (rule.type === 'LARGE_RIGHTARROW') {

			} else if (rule.type === 'UPPER_UPARROW') {

			} else if (rule.type === 'LOWER_DOWNARROW') {

			}
		}
	}
	this.addRule = function(type, stroke, fill, selector) {
		rules.push({'type': type, 'stroke': stroke, 'fill': fill, 'selector': selector});
	};
};