var utils = require('./utils');
var $ = require('jquery');
// cellDecoratorTypes is an enum as well as giving a rendering order
var cellDecoratorTypes = utils.invert_array(['CELL', 'ONE_THIRD_FILL', 'LARGE_RIGHTARROW', 'UPPER_UPARROW', 'LOWER_DOWNARROW']);
// a decorator attribute is of the form {'type':T, 'stroke':CS, 'fill':CF, selector:F} 
//	where T is in cellDecoratorTypes, CS and CF are hex color strings or functions that take a datum and return a hex color string, 
//	and F is a function from datum to boolean that decides whether its active
function CellRenderer(track) {
	var defaultRules = [];
	var rules = [];
	this.track = track;
	this.config = this.track.config;

	this.update_order = function(container, data, id_order) {
		var config = this.config;
		id_order = utils.invert_array(id_order);
		container.selectAll('g.cell').transition(function(d,i) { return i;})
			.attr('transform', function(d, i) { return utils.translate(
									id_order[d[config.id_accessor]]*(config.cell_width + config.cell_padding)
									, 0);})
	};

	this.decorate = function(container, data) {
		var config = this.config;
		// decorate according to rules
		rules.sort(function(a,b) {
			return cellDecoratorTypes[a.type] - cellDecoratorTypes[b.type];
		});
		var rule, filtered_data;
		var fullRules = defaultRules.concat(rules);
		for (var i=0; i<fullRules.length; i++) {
			rule = fullRules[i];
			filtered_data = data.filter(rule.selector);
			var d3_selection;
			if (rule.type === 'CELL') {
				// create new rects if necessary
				d3_selection = container.selectAll('g.cell').data(filtered_data, function(d) { return d[config.id_accessor]; });
			} else if (rule.type === 'ONE_THIRD_FILL') {
				container.selectAll('g.cell').data(filtered_data, function(d) { return d[config.id_accessor]; }).selectAll('rect.one-third-fill').remove();
				d3_selection = container.selectAll('g.cell').data(filtered_data, function(d) { return d[config.id_accessor]; })
							.append('rect').classed('one-third-fill', true)
							.attr('transform', utils.translate(0,config.cell_height/3))
							.attr('width', config.cell_width)
							.attr('height', config.cell_height/3);
			} else if (rule.type === 'LARGE_RIGHTARROW') {

			} else if (rule.type === 'UPPER_UPARROW') {

			} else if (rule.type === 'LOWER_DOWNARROW') {

			}
			if (rule.stroke) {
				d3_selection.attr('stroke', rule.stroke)
			}
			if (rule.fill) {
				d3_selection.attr('fill', rule.fill);
			}
		}
	}

	this.render = function(container, data, id_order) {
		// first clear everything
		container.selectAll('g').remove();

		var config = this.config;
		id_order = utils.invert_array(id_order);
		// draw initial rectangles
		container.selectAll('g').data(data).enter().append('g').classed('cell', true)
			.attr('transform', function(d, i) { return utils.translate(
									id_order[d[config.id_accessor]]*(config.cell_width + config.cell_padding)
									, 0);})
			.append('rect').classed('cell', true)
			.attr('width', config.cell_width)
			.attr('height', config.cell_height);
		this.decorate(container, data);
	}
	this.addRule = function(type, stroke, fill, selector) {
		rules.push({'type': type, 'stroke': stroke, 'fill': fill, 'selector': selector});
	};
	this.addDefaultRule = function(type, stroke, fill) {
		defaultRules.push({'type':type, 'stroke':stroke, 'fill':fill, 'selector': function(d) { return true;}});
	}
};
module.exports = {};
module.exports.CellRenderer = CellRenderer;