var utils = require('./utils');
var $ = require('jquery');
var _ = require('underscore');

// TODO: handle accessing config properties cleaner

function D3SVGRuleset(renderer) {
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
		// returns a list of rules to render in order
		var z_map = {};
		_.each(self.rule_map, function(rule, rule_id) {
			z_map[rule.z_index] = z_map[rule.z_index] || [];
			z_map[rule.z_index].push(rule);
		});
		return _.flatten(
			_.map(
				Object.keys(z_map).sort(), 
				function(z) { return z_map[z];}
				)
			);
	};

	self.apply = function(d3_g_selection, d3_data, d3_data_key) {
		var rules = self.getRules();
		_.each(rules, function(rule) {
			rule.apply(d3_g_selection, d3_data, d3_data_key);
		});
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

	self._toLocalCoords = function(val, key) {
		// convert a percentage to a local pixel coordinate
		var widthLike = ['width', 'x'];
		var heightLike = ['height', 'y'];
		if (typeof val === 'string' && val.indexOf('%') > -1) {
			val = parseFloat(val)/100;
			if (widthLike.indexOf(key) > -1) {
				val = val*self.renderer.track.oncoprint.config.cell_width;	
			} else if (heightLike.indexOf(key) > -1) {
				val = val*self.renderer.config.cell_height;	
			} 
		}
		return val+'';
	};
	self.apply = function(d3_g_selection, d3_data, d3_data_key) {
		d3_g_selection = d3_g_selection.data(
			d3_data.filter(self.condition),
			d3_data_key
			);
		var elts = d3_g_selection.select(function() {
			return this.appendChild(d3_shape.node().cloneNode(true));
		});
		_.each(self.attrs, function(val, key) {
			elts.attr(key, function(d,i) {
				var currVal = val;
				if (typeof currVal === 'function') {
					currVal = currVal(d,i);
				}
				currVal = self._toLocalCoords(currVal, key);
				return currVal;
			});
		});
	};
}

function D3SVGCellRenderer(track) {
	var self = this;
	self.rule_set = new D3SVGRuleset(self);
	self.track = track;
	self.config = self.track.config;
	self.data = self.track.data;
	self.cell_area;
	self.svg;
	self.g;

	self.parseRuleset = function(json_rules) {
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

	self.init = function(cell_area) {
		self.cell_area = cell_area;

		self.cell_area.selectAll('*').remove();
		self.svg = self.cell_area.append('svg')
		.attr('width', (self.track.oncoprint.config.cell_width + self.track.oncoprint.config.cell_padding)*self.track.data.length)
		.attr('height', self.config.track_height);

		self.g = self.svg.selectAll('g').data(self.data, self.config.datum_id).enter().append('g').classed('cell', true);
		self.updateCells();
	};

	self.updateCells = function() {
		var config = self.config;
		var id_order = utils.invert_array(self.track.oncoprint.id_order);
		self.g.transition()
		.attr('transform', function(d,i) {
				return utils.translate(id_order[self.config.datum_id(d)]*(self.track.oncoprint.config.cell_width + self.track.oncoprint.config.cell_padding), 0);
			});

		self.drawCells();
	};

	self.drawCells = function() {
		self.g.selectAll('*').remove();
		self.rule_set.apply(self.g, self.data, self.config.datum_id);
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
		// (1) make sure these are the params you want to pass in
		// (1a) Question: for genetic alteration, should we pass in design configurations like color?
		// (2) implement


		// DEF: data accessor = string: datum member which holds the category
		//			| function: takes in datum, outputs value
		if (templName === 'categorical_color') {
			// params: - map from category to color
			//	      - data accessor

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

		} else if (templName === 'genetic_alteration') {
			// any params?
		}
	};
	$(self.track.oncoprint).on('sort.oncoprint set_cell_width.oncoprint set_cell_padding.oncoprint', function() {
		self.updateCells();
	});
};

module.exports = D3SVGCellRenderer;