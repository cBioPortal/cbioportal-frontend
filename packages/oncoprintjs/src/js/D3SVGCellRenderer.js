var utils = require('./utils');
var $ = require('jquery');
var _ = require('underscore');
var events = require('./events');
var signals = require('./signals');

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
		self.svg.attr('width', self.track_config.get('pre_track_padding') + (self.track_config.get('cell_width') + self.track_config.get('cell_padding'))*self.data.length)
			.attr('height', self.track_config.get('track_height'));
	};

	self.updateCells = function() {
		var id_order = utils.invert_array(self.track_config.get('id_order'));
		self.g.transition()
		.attr('transform', function(d,i) {
				return utils.translate(self.track_config.get('pre_track_padding') + id_order[self.track_config.get('datum_id')(d)]*(self.track_config.get('cell_width') + self.track_config.get('cell_padding')), 0);
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
			//	     - scale
			var rect = utils.makeD3SVGElement('rect');
			var range = params.range.slice();
			var effective_range = params.range.slice();
			var _data = params.data;
			var data = params.data;
			if (params.log_scale) {
				if (range[0] <= 0 || range[1] <= 0) {
					utils.warn("Using log scale with range that includes a number <= 0", "Bar chart template");
				}
				effective_range[0] = Math.log(range[0]);
				effective_range[1] = Math.log(range[1]);
				data = function(d) {
					return Math.log(_data(d));
				}
			}
			var range_len = effective_range[1] - effective_range[0];
			var color = params.color;
			var height_perc = function(d) {
				return ((data(d) - effective_range[0])/range_len)*100;
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
			// add range markers
			self.svg.selectAll('text.bar_chart_range_marker').remove();
			var range_font_size = params.range_font_size || 10;
			var range_label_width = range_font_size * Math.max(range[0].toString().length, range[1].toString().length) + 2;
			$(self).trigger(signals.REQUEST_PRE_TRACK_PADDING, {pre_track_padding: range_label_width});
			var range_font_color = params.range_font_color || '#FF0000';
			self.svg.append('text').attr('font-size', range_font_size)
						.attr('fill', range_font_color)
						.attr('x', 0)
						.attr('y', range_font_size)
						.text(range[1]);
			self.svg.append('text').attr('font-size', range_font_size)
						.attr('fill', range_font_color)
						.attr('x', 0)
						.attr('y', track_config.get('track_height'))
						.text(range[0]);
		} else if (templName === 'genetic_alteration') {
			params = $.extend({}, params);
			var rect = utils.makeD3SVGElement('rect');
			// background (CNA)
			var cna = params.cna_name || 'cna';
			self.addRule({
				d3_shape: rect,
				attrs: {
					width:'100%',
					height: '100%',
					fill: function(d) {
						if (!d[cna]) {
							return params.default_cell_color || '#D3D3D3';
						} else if (d[cna] === params.cna_amplified_name) {
							return params.cna_amplified_color || '#FF0000';
						} else if (d[cna] === params.cna_homodeleted_name) {
							return params.cna_homodeleted_color || '#0000FF';
						}
					}
				}
			});
			// mutations
			var mut = params.mut_name || 'mut';
			self.addRule({
				condition: function(d) { return !!d[mut]; },
				d3_shape: rect,
				attrs: {
					width: '100%',
					height: '33.33%',
					y: '33.33%',
					fill: function(d) {
						var m = d[mut];
						// TODO: look up defaults in real data
						if (m === (params.mut_missense_name || 'MISSENSE')) {
							return params.mut_missense_color || '#008000';
						} else if (m === (params.mut_trunc_name || 'TRUNC')) {
							return params.mut_trunc_color || '#000000';
						} else if (m === (params.mut_inframe_name || 'INFRAME')) {
							return params.mut_inframe_color || '#9F8170';
						} else if (m === (params.mut_frameshift_name || 'FRAMESHIFT')) {
							return params.mut_frameshift_color || '#000000'; // TODO - is this default?
						} else {
							return params.mut_default_color || '#000000';
						}
					}
				}
			});
			// mrna
			var mrna = params.mrna_name || 'mrna';
			self.addRule({
				condition: function(d) { return !!d[mrna]; },
				d3_shape: rect,
				attrs: {
					width: '100%',
					height: '100%',
					fill: 'rgba(0,0,0,0)',
					'stroke-width': 2,
					stroke: function(d) {
						var m = d[mrna];
						// TODO: look up defaults in real data. or maybe just have no defaults here - put defaults in a different file
						if (m === (params.mrna_upregulated_name || 'UPREGULATED')) {
							return params.mrna_upregulated_color || '#FF9999';
						} else if (m === (params.mrna_downregulated_name || 'DOWNREGULATED')) {
							return params.mrna_downregulated_color || '#6699CC';
						}
					}
				}
			});
			// TODO: rppa
			var triangle_up = utils.makeD3SVGElement('path').attr('d', 'triangle-up')
		}
	};
	self.bindEvents = function(track) {
		$(track).on(events.SORT, function() {
			self.updateCells();
		}).on(events.SET_CELL_WIDTH, function() {
			self.updateCells();
			self.updateCellArea();
		}).on(events.SET_CELL_PADDING, function() {
			self.updateCells();
			self.updateCellArea();
		}).on(events.SET_PRE_TRACK_PADDING, function(e,data) {
			self.updateCells();
			self.updateCellArea();
		});
		$(self).on(signals.REQUEST_PRE_TRACK_PADDING, function(e, data) {
			$(track).trigger(signals.REQUEST_PRE_TRACK_PADDING, data);
		});
	};
};

module.exports = D3SVGCellRenderer;