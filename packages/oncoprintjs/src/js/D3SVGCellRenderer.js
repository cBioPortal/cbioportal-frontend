var utils = require('./utils');
var $ = require('jquery');
var _ = require('underscore');

// TODO: handle accessing config properties cleaner

function D3SVGRuleset(track_config) {
	var self = this;
	self.rule_map = {};
	self.track_config = track_config;

	self.addRule = function(condition, d3_shape, attrs, z_index) {
		var rule_id = Object.keys(self.rule_map).length;
		if (z_index === undefined) {
			z_index = rule_id;
		}
		self.rule_map[rule_id] = {condition: condition, shape: d3_shape, attrs: attrs, z_index: z_index};
		return rule_id;
	};

	self.removeRule = function(rule_id) {
		delete self.rule_map[rule_id];
	};

	var percentToPx = function(attr_val, attr_name) {
		// convert a percentage to a local pixel coordinate
		var width_like = ['width', 'x'];
		var height_like = ['height', 'y'];
		attr_val = parseFloat(attr_val)/100;
		if (width_like.indexOf(attr_name) > -1) {
			attr_val = attr_val*self.track_config.get('cell_width');
		} else if (height_like.indexOf(attr_name) > -1) {
			attr_val = attr_val*self.track_config.get('cell_height');
		} 
		return attr_val+'';
	};

	var applyRule = function(params, d3_g_selection, d3_data, d3_data_key) {
		d3_g_selection = d3_g_selection.data(
			d3_data.filter(params.condition || function(d) { return true; }),
			d3_data_key
			);
		var elts = d3_g_selection.select(function() {
			return this.appendChild(params.shape.node().cloneNode(true));
		});
		_.each(params.attrs, function(val, key) {
			elts.attr(key, function(d,i) {
				var curr_val = val;
				if (typeof curr_val === 'function') {
					curr_val = curr_val(d,i);
				}
				if (typeof curr_val === 'string' && curr_val.indexOf('%') > -1) {
					curr_val = percentToPx(curr_val, key);
				}
				return curr_val;
			});
		});
	};

	var getOrderedRules = function() {
		// returns a list of rules to render in order of z_index
		return _.map(
				_.sortBy(Object.keys(self.rule_map), function(x) { return self.rule_map[x].z_index;}),
				function(x) { return self.rule_map[x]; }
				);
	};

	self.apply = function(d3_g_selection, d3_data, d3_data_key) {
		var rules = getOrderedRules();
		_.each(rules, function(rule) {
			applyRule(rule, d3_g_selection, d3_data, d3_data_key);
		});
	};

	self.fromJSON = function(json_rules) {
		self.rule_map = {};
		_.each(json_rules, function(rule) {
			self.addRule(rule.condition, rule.d3_shape, rule.attrs, rule.z_index);
		});
	};
}

function D3SVGCellRenderer(data, track_config) {
	var self = this;
	self.track_config = track_config;
	self.rule_set = new D3SVGRuleset(self.track_config);
	self.data = data;
	self.cell_area;
	self.svg;
	self.g;
	self.hits;

	self.parseRuleset = function(json_rules) {
		self.rule_set.fromJSON(json_rules);
	};

	self.addRule = function(params) {
		var ret = self.rule_set.addRule(params.condition, params.d3_shape, params.attrs, params.z_index);
		self.updateCells();
		return ret;
	};

	self.removeRule = function(rule_id) {
		self.rule_set.removeRule(rule_id);
		self.updateCells();
	};

	self.init = function(cell_area) {
		self.cell_area = cell_area;

		self.cell_area.selectAll('*').remove();
		self.svg = self.cell_area.append('svg')
		self.updateCellArea();

		self.g = self.svg.selectAll('g').data(self.data, self.track_config.get('datum_id')).enter().append('g').classed('cell', true);
		self.updateCells();
	};

	self.updateCellArea = function() {
		self.svg.attr('width', (self.track_config.get('cell_width') + self.track_config.get('cell_padding'))*self.data.length)
			.attr('height', self.track_config.get('track_height'));
	};

	self.updateCells = function() {
		var id_order = utils.invert_array(self.track_config.get('id_order'));
		self.g.transition()
		.attr('transform', function(d,i) {
				return utils.translate(id_order[self.track_config.get('datum_id')(d)]*(self.track_config.get('cell_width') + self.track_config.get('cell_padding')), 0);
			});

		self.drawCells();
	};

	self.drawCells = function() {
		self.g.selectAll('*').remove();
		self.rule_set.apply(self.g, self.data, self.track_config.get('datum_id'));
		self.drawHitZones();
	};

	self.drawHitZones = function() {
		self.g.selectAll('rect.hit').remove();
		var hits = self.g.append('rect').classed('hit', true)
			.attr('width', self.track_config.get('cell_width'))
			.attr('height', self.track_config.get('cell_height'))
			.attr('stroke', 'rgba(0,0,0,0)')
			.attr('fill', 'rgba(0,0,0,0)');
		// bind events
		var eventData = function(d, i, ctx) {
			return {datum: d, index: i, g:d3.select(ctx.parentNode)};
		}
		hits.on('click', function(d, i){
			$(self).trigger('cell_click.oncoprint', eventData(d,i,this));
		}).on('mouseenter', function(d,i) {
			$(self).trigger('cell_mouseenter.oncoprint', eventData(d,i,this));
		}).on('mouseleave', function(d,i) {
			$(self).trigger('cell_mouseleave.oncoprint', eventData(d,i,this));
		});
	};

	self.useTemplate = function(templName, params) {
		// TODO
		// (1) make sure these are the params you want to pass in
		// (1a) Question: for genetic alteration, should we pass in design configurations like color?
		// (2) implement


		// DEF: data accessor = string: datum member which holds the category
		//			| function: takes in datum, outputs value
		if (templName === 'categorical_color') {
			// params: - map from category to color
			//	      - data accessor
			var rect = utils.makeD3SVGElement('rect');
			var color = $.extend({}, params.color);
			var category = params.category;
			var attrs = {
				width: '100%',
				height: '100%',
				fill: function(d) {
					return color[category(d)];
				}
			};
			self.addRule({
				d3_shape: rect,
				attrs: attrs,
			});
		} else if (templName === 'continuous_color') {
			// params: - data accessor
			//	      - endpoints of the value range
			//               - endpoints of the gradient (in same order)

		} else if (templName === 'heat_map') {
			// params: - data accessor
			//	      - endpoints of the value range

		} else if (templName === 'bar_chart') {
			// params: - data accessor
			//	      - endpoints of the value range
			//	      - color: string or function of datum
			var rect = utils.makeD3SVGElement('rect');
			var range = params.range.slice();
			var range_len = range[1] - range[0];
			var color = params.color;
			var data = params.data;
			var height_perc = function(d) {
				return ((data(d) - range[0])/range_len)*100;
			};
			var attrs = {
				width: '100%',
				height: function(d) {
					return height_perc(d)+'%';
				},
				y: function(d) {
					return (100 - height_perc(d))+ '%';
				},
				fill: color || '#000000'
			};
			self.addRule({
				d3_shape: rect,
				attrs: attrs
			});
		} else if (templName === 'genetic_alteration') {
			// any params?
		}
	};
	self.bindEvents = function(track) {
		$(track).on('sort.oncoprint set_cell_width.oncoprint set_cell_padding.oncoprint', function() {
			self.updateCells();
		});
		$(track).on('set_cell_width.oncoprint set_cell_padding.oncoprint', function() {
			self.updateCellArea();
		});
	};
};

module.exports = D3SVGCellRenderer;