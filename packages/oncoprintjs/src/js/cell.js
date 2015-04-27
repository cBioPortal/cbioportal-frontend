var utils = require('./utils');
var $ = require('jquery');
var _ = require('underscore');

// TODO: use self everywhere

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
	this.filterData = function(d3_data) {
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

function makeD3SVGElement(tag) {
	return d3.select(document.createElementNS('http://www.w3.org/2000/svg', tag));
};

function D3SVGRenderer(track) {
	var self = this;
	this.rule_set = new D3SVGRuleSet();
	this.track = track;
	this.config = this.track.config;
	this.data = this.track.data;
	this.cell_area;
	this.svg;
	this.g;

	this.data_key = function(d) {
		return d[self.config.id_member];
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

	this.renderCells = function(cell_area) {
		this.cell_area = cell_area;

		this.cell_area.selectAll('*').remove();
		this.svg = this.cell_area.append('svg')
		.attr('width', (this.config.cell_width + this.config.cell_padding)*this.track.data.length)
		.attr('height', this.config.track_height);

		this.g = this.svg.selectAll('g').data(this.data, this.data_key).enter().append('g').classed('cell', true);
		this.updateCells();
	};
	this.updateCells = function() {
		var config = this.config;
		var id_order = utils.invert_array(this.track.oncoprint.id_order);
		this.g.transition()
		.attr('transform', function(d,i) {
				return utils.translate(id_order[d[config.id_member]]*(config.cell_width + config.cell_padding), 0);
			});

		this.drawCells();
	};
	this.drawCells = function() {
		this.g.selectAll('*').remove();

		var renderRule = function(rule) {
			rule.apply(self.g.data(rule.filterData(self.data), self.data_key));
		};
		var rule_lists = this.rule_set.getRules();
		_.each(rule_lists, function(rule_list) {
			_.each(rule_list, function(rule) {
				renderRule(rule);
			});
		});
		this.drawHitZones();
	};
	this.drawHitZones = function() {
		var hits = this.g.append('rect').classed('hit', true)
			.attr('width', this.config.cell_width)
			.attr('height', this.config.cell_height)
			.attr('stroke', 'rgba(0,0,0,0)')
			.attr('fill', 'rgba(0,0,0,0)');
		// bind events
		hits.on('click', function(d, i){
			$(self.track.oncoprint).trigger('cellClick.oncoprint', {datum: d, index: i, track: self.track, g: d3.select(this.parentNode)});
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