var utils = require('./utils');
var $ = require('jquery');
var _ = require('underscore');

// TODO: handle accessing config properties cleaner

function D3SVGRuleSet(renderer) {
	var self = this;
	self.rule_map = {};
	self.renderer = renderer;

	self.addRule = function(condition, d3_shape, attrs, z_index) {
		var rule_id = Object.keys(self.rule_map).length;
		if (z_index === undefined) {
			z_index = rule_id;
		}
		self.rule_map[rule_id] = new D3SVGRule(rule_id, self.renderer, condition, d3_shape, attrs, z_index);
		return rule_id;
	};

	self.removeRule = function(rule_id) {
		delete self.rule_map[rule_id];
	}

	self.getRules = function() {
		// returns a list of lists of rules to render in the given order
		var z_map = {};
		_.each(self.rule_map, function(rule, rule_id) {
			z_map[rule.z_index] = z_map[rule.z_index] || [];
			z_map[rule.z_index].push(rule);
		});
		return _.map(Object.keys(z_map).sort(), 
			function(z) { return z_map[z];});
	};

	self.fromJSON = function(json_rules) {
		self.rule_map = {};
		_.each(json_rules, function(rule) {
			self.addRule(rule.condition, rule.d3_shape, rule.attrs, rule.z_index);
		});
	};
}

function D3SVGRule(rule_id, renderer, condition, d3_shape, attrs, z_index) {
	var self = this;
	self.rule_id = rule_id; 
	self.renderer = renderer;
	self.d3_shape = d3_shape; 
	self.z_index = z_index; 
	self.condition = condition; 
	self.attrs = attrs;

	var widthLike = ['width', 'x'];
	var heightLike = ['height', 'y'];

	self.filterData = function(d3_data) {
		return d3_data.filter(self.condition);
	};

	self.apply = function(d3_g_selection) {
		var elts = d3_g_selection.select(function() {
			return this.appendChild(d3_shape.node().cloneNode(true));
		});
		_.each(self.attrs, function(val, key) {
			elts.attr(key, function(d,i) {
				// handle percentages manually so its percent of the specified
				//	cell dimensions. This cannot be done automatically b/c
				//	this is naturally handled as percentage of the entire svg
				//	and <g>'s don't have dimension
				var currVal = val;
				if (typeof currVal === 'function') {
					currVal = currVal(d,i);
				}
				if (typeof currVal === 'string' && currVal.indexOf('%') > -1) {
					currVal = parseFloat(currVal)/100;
					if (widthLike.indexOf(key) > -1) {
						currVal = currVal*self.renderer.track.oncoprint.config.cell_width;	
					} else if (heightLike.indexOf(key) > -1) {
						currVal = currVal*self.renderer.config.cell_height;	
					} 
				}
				return currVal+'';
			});
		});
	};
}

function D3SVGCellRenderer(track) {
	var self = this;
	self.rule_set = new D3SVGRuleSet(self);
	self.track = track;
	self.config = self.track.config;
	self.data = self.track.data;
	self.cell_area;
	self.svg;
	self.g;

	self.data_key = function(d) {
		return d[self.config.id_member];
	};

	self.parseRuleSet = function(json_rules) {
		self.rule_set.fromJSON(json_rules);
	};

	self.addRule = function(condition, d3_shape, attrs, z_index) {
		var ret = self.rule_set.addRule(condition, d3_shape, attrs, z_index);
		self.updateCells();
		return ret;
	};

	self.removeRule = function(rule_id) {
		self.rule_set.removeRule(rule_id);
		self.updateCells();
	};

	self.renderCells = function(cell_area) {
		self.cell_area = cell_area;

		self.cell_area.selectAll('*').remove();
		self.svg = self.cell_area.append('svg')
		.attr('width', (self.track.oncoprint.config.cell_width + self.track.oncoprint.config.cell_padding)*self.track.data.length)
		.attr('height', self.config.track_height);

		self.g = self.svg.selectAll('g').data(self.data, self.data_key).enter().append('g').classed('cell', true);
		self.updateCells();
	};

	self.updateCells = function() {
		var config = self.config;
		var id_order = utils.invert_array(self.track.oncoprint.id_order);
		self.g.transition()
		.attr('transform', function(d,i) {
				return utils.translate(id_order[d[config.id_member]]*(self.track.oncoprint.config.cell_width + self.track.oncoprint.config.cell_padding), 0);
			});

		self.drawCells();
	};

	self.drawCells = function() {
		self.g.selectAll('*').remove();

		var renderRule = function(rule) {
			rule.apply(self.g.data(rule.filterData(self.data), self.data_key));
		};
		var rule_lists = self.rule_set.getRules();
		_.each(rule_lists, function(rule_list) {
			_.each(rule_list, function(rule) {
				renderRule(rule);
			});
		});
		self.drawHitZones();
	};

	self.drawHitZones = function() {
		var hits = self.g.append('rect').classed('hit', true)
			.attr('width', self.config.cell_width)
			.attr('height', self.config.cell_height)
			.attr('stroke', 'rgba(0,0,0,0)')
			.attr('fill', 'rgba(0,0,0,0)');
		// bind events
		var eventData = function(d, i, ctx) {
			return {datum: d, index: i, track: self.track, g:d3.select(ctx.parentNode)};
		}
		hits.on('click', function(d, i){
			$(self.track.oncoprint).trigger('cell_click.oncoprint', eventData(d,i,this));
		}).on('mouseenter', function(d,i) {
			$(self.track.oncoprint).trigger('cell_mouseenter.oncoprint', eventData(d,i,this));
		}).on('mouseleave', function(d,i) {
			$(self.track.oncoprint).trigger('cell_mouseleave.oncoprint', eventData(d,i,this));
		});
	};

	self.useTemplate = function(templName, params) {
		// TODO
		if (templName === 'categorical') {

		} else if (templName === 'continuous') {

		} else if (templName === 'heat_map') {

		} else if (templName === 'bar_chart') {

		} else if (templName === 'genetic_alteration') {

		}
	};
};

module.exports = D3SVGCellRenderer;