var utils = require('./utils');
var $ = require('jquery');
var _ = require('underscore');

function D3SVGRuleSet() {
	this.rule_map = {};
	this.addRule = function(condition, d3_shape, attrs, z_index) {
		var rule_id = Object.keys(this.rule_map).length;
		if (z_index === undefined) {
			z_index = rule_id;
		}
		this.rule_map[rule_id] = new D3SVGRule(rule_id, condition, d3_shape, attrs, z_index);
		return rule_id;
	}
	this.removeRule = function(rule_id) {
		this.rule_map[rule_id] = null;
	}
	this.getRules = function() {
		// returns a list of lists of rules to render in the given order
		var z_map = {};
		_.each(this.rule_map, function(rule, rule_id) {
			z_map[rule.z_index] = z_map[rule.z_index] || [];
			z_map[rule.z_index].push(rule);
		});
		return _.map(Object.keys(z_map).sort(), 
			function(z) { return z_map[z];});
	}
	this.fromJSON = function(json_rules) {
		this.rule_map = {};
		_.each(json_rules, $.proxy(function(rule) {
			this.addRule(rule.condition, rule.d3_shape, rule.attrs, rule.z_index);
		}, this));
	};
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
	}
}

function D3SVGRenderer(track) {
	var self = this;
	this.rule_set = new D3SVGRuleSet();
	this.track = track;
	this.config = this.track.config;
	this.g;

	this.data_key = function(d) {
		return d[self.config.id_accessor];
	};
	this.setRuleSet = function(rs) {
		this.rule_set = rs;
	};
	this.parseRuleSet = function(json_rules) {
		this.rule_set.fromJSON(json_rules);
	};
	this.addRule = function(condition, d3_shape, attrs, z_index) {
		return this.rule_set.addRule(condition, d3_shape, attrs, z_index);
	};
	this.removeRule = function(rule_id) {
		this.rule_set.removeRule(rule_id);
	};
	this.renderInit = function(container, data, id_order) {
		container.selectAll('g').remove();

		var config = this.config;
		id_order = utils.invert_array(id_order);
		// draw groups with empty rectangle hitzones
		this.g = container.selectAll('g').data(data, this.data_key).enter().append('g').classed('cell', true)
			.attr('transform', function(d,i) { return utils.translate(
				id_order[d[config.id_accessor]]*(config.cell_width + config.cell_padding)
				, 0);
			});
		this.renderCells(container, data);
	};
	this.applyRule = function(d3_svg_rule, container, d3_data) {
		var config = this.config;
		var d3_filtered_data = d3_svg_rule.d3FilterData(d3_data);
		var d3_g_selection = this.g.data(d3_filtered_data, this.data_key);
		d3_svg_rule.apply(d3_g_selection);
	};
	this.renderCells = function(container, d3_data) {
		this.g.selectAll('*').remove();
		var rule_lists = this.rule_set.getRules();
		var config = this.config;
		_.each(rule_lists, function(rule_list) {
			_.each(rule_list, function(rule) {
				self.applyRule(rule, container, d3_data);
			});
		});
		// append hit rectangles
		this.renderHitZones();
	};
	this.renderHitZones = function() {
		this.g.selectAll('rect.hit').remove();
		
		var hits = this.g.append('rect').classed('hit', true)
			.attr('width', this.config.cell_width)
			.attr('height', this.config.cell_height)
			.attr('stroke', 'rgba(0,0,0,0)')
			.attr('fill', 'rgba(0,0,0,0)');
		_.each(this.config.events, function(handler, evt) {
			var wrapHandler = function(d,i) {
				handler(d,i,d3.select(this));
			};
			self.g.on(evt, wrapHandler);
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
/*
function GeneticAlterationRuleSet = function() {
	// standard genetic alteration oncoprint settings
	var ret = new D3SVGRuleSet();
};

function CategoricalDataRuleSet = function(data_member, attrs) {

}

function ContinuousDataRuleSet = function(data_member, attrs) {

}

function BinaryDataColorRuleSet = function(data_member, ) {
}*/

module.exports = D3SVGRenderer;