var utils = require('./utils');
var $ = require('jquery');
var _ = require('underscore');
function D3SVGRuleSet() {
	var rule_map = {};
	this.addRule = function(condition, d3_shape, attrs, z_index) {
		var rule_id = Object.keys(rule_map).length;
		if (z_index === undefined) {
			z_index = rule_id;
		}
		rule_map[rule_id] = new D3SVGRule(rule_id, condition, d3_shape, attrs, z_index);
		return rule_id;
	}
	this.removeRule = function(rule_id) {
		rule_map[rule_id] = null;
	}
	this.getRules = function() {
		// returns a list of lists of rules to render in the given order
		var z_map = {};
		_.each(rule_map, function(rule, rule_id) {
			z_map[rule.z_index] = z_map[rule.z_index] || [];
			z_map[rule.z_index].push(rule);
		});
		return _.map(Object.keys(z_map).sort(), 
			function(z) { return z_map[z];});
	}
}
function D3SVGRule(rule_id, condition, d3_shape, attrs, z_index) {
	this.rule_id = rule_id; 
	this.d3_shape = d3_shape; 
	this.z_index = z_index; 
	this.condition = condition; 
	this.attrs = attrs;
	this.d3FilterData = function(d3_data) {
		return d3_data.filter(this.condition);
	}
	this.apply = function(d3_g_selection) {
		var elts = d3_g_selection.select(function() {
			return this.appendChild(d3_shape.node().cloneNode(true));
		});
		_.each(this.attrs, function(val, key) {
			elts.attr(key, val);
		});
		console.log($('rect').length);
		console.log($('g').length);
	}
}

function D3SVGRenderer(track) {
	var rule_set = new D3SVGRuleSet();
	this.track = track;
	this.config = this.track.config;
	this.addRule = function(condition, d3_shape, attrs, z_index) {
		return rule_set.addRule(condition, d3_shape, attrs, z_index);
	};
	this.removeRule = function(rule_id) {
		rule_set.removeRule(rule_id);
	};
	this.renderInit = function(container, data, id_order) {
		container.selectAll('g').remove();

		var config = this.config;
		id_order = utils.invert_array(id_order);
		// draw groups with empty rectangle hitzones
		container.selectAll('g').data(data).enter().append('g').classed('cell', true)
			.attr('transform', function(d,i) { return utils.translate(
				id_order[d[config.id_accessor]]*(config.cell_width + config.cell_padding)
				, 0);
			})
			.append('rect').classed('hit', true)
			.attr('width', config.cell_width)
			.attr('height', config.cell_height)
			.attr('stroke', 'rgba(0,0,0,0)')
			.attr('fill', 'rgba(0,0,0,0)');
		this.applyRules(container, data);
	};
	this.applyRule = function(d3_svg_rule, container, d3_data) {
		var config = this.config;
		var d3_filtered_data = d3_svg_rule.d3FilterData(d3_data);
		var d3_g_selection = container.selectAll('g.cell').data(d3_filtered_data, function(d) { return d[config.id_accessor];});
		d3_svg_rule.apply(d3_g_selection);
	};
	this.applyRules = function(container, d3_data) {
		var rule_lists = rule_set.getRules();
		var self = this;
		_.each(rule_lists, function(rule_list) {
			_.each(rule_list, function(rule) {
				self.applyRule(rule, container, d3_data);
			});
		});
	};

	/*this.update_order = function(container, data, id_order) {
		var config = this.config;
		id_order = utils.invert_array(id_order);
		container.selectAll('g.cell').transition(function(d,i) { return i;})
			.attr('transform', function(d, i) { return utils.translate(
									id_order[d[config.id_accessor]]*(config.cell_width + config.cell_padding)
									, 0);})
	};*/
};
module.exports = D3SVGRenderer;