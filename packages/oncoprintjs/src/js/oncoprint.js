/*
 * Copyright (c) 2015 Memorial Sloan-Kettering Cancer Center.
 *
 * This library is distributed in the hope that it will be useful, but WITHOUT
 * ANY WARRANTY, WITHOUT EVEN THE IMPLIED WARRANTY OF MERCHANTABILITY OR FITNESS
 * FOR A PARTICULAR PURPOSE. The software and documentation provided hereunder
 * is on an "as is" basis, and Memorial Sloan-Kettering Cancer Center has no
 * obligations to provide maintenance, support, updates, enhancements or
 * modifications. In no event shall Memorial Sloan-Kettering Cancer Center be
 * liable to any party for direct, indirect, special, incidental or
 * consequential damages, including lost profits, arising out of the use of this
 * software and its documentation, even if Memorial Sloan-Kettering Cancer
 * Center has been advised of the possibility of such damage.
 */

/*
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Lesser General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */
var _ = require('underscore');
var d3 = require('d3');
var $ = require('jquery');
var events = require('./events');
var signals = require('./signals');
var globals = require('./globals');
var utils = require('./utils');
var RuleSet = require('./RuleSet');

// TODO: use self everywhere

var defaultOncoprintConfig = {
	cell_width: 6,
	cell_padding: 3,
};

var hiddenOncoprintConfig = {
	pre_track_padding: 0,
};

var defaultTrackConfig = {
	label: 'Gene',
	datum_id_key: 'sample',
	cell_height: 23,
	track_height: 20,
	track_padding: 5,
	sort_cmp: undefined
}; 

module.exports = { 
	CATEGORICAL_COLOR: RuleSet.CATEGORICAL_COLOR,
	GRADIENT_COLOR: RuleSet.GRADIENT_COLOR,
	GENETIC_ALTERATION: RuleSet.GENETIC_ALTERATION,
	BAR_CHART: RuleSet.BAR_CHART,
	create: function CreateOncoprint(container_selector_string, config) {
		var oncoprint = new Oncoprint(config);
		var renderer = new OncoprintSVGRenderer(oncoprint, {label_font: '12px Arial'});
		renderer.attachLabelSVG(container_selector_string);
		renderer.attachCellSVG(container_selector_string);
		/*var canvas = d3.select(container_selector_string).append('div').classed('scrolling_oncoprint_section_container', true)
			.append('canvas');
		var canvas_drawer = new CanvasSVGDrawer(canvas, renderer.getCellSVG());*/
		var ret = {
			addTrack: function(config) {
				var track_id = oncoprint.addTrack(config);
				return track_id;
			},
			removeTrack: function(track_id) {
				oncoprint.removeTrack(track_id);
			},
			moveTrack: function(track_id, position) {
				oncoprint.moveTrack(track_id, position);
			},
			setTrackData: function(track_id, data) {
				oncoprint.setTrackData(track_id, data);
			},
			setRuleSet: function(track_id, type, params) {
				renderer.setRuleSet(track_id, type, params);
			},
			useSameRuleSet: function(target_track_id, source_track_id) {
				renderer.useSameRuleSet(target_track_id, source_track_id);
			},
			setCellPadding: function(p) {
				oncoprint.setCellPadding(p);
			},
			toSVG: function(ctr) {
				return renderer.toSVG(ctr);
			},
			sort: function(track_id_list, cmp_list) {
				oncoprint.sort(track_id_list, cmp_list);
			}
		};
		return ret;
	}
};

function Oncoprint(config) {
	var self = this;
	var track_id_counter = 0;
	self.config = $.extend({}, defaultOncoprintConfig, config || {});
	self.config = $.extend(self.config, hiddenOncoprintConfig);

	self.id_order = [];
	self.track_order = [];
	self.tracks = {};
	self.ids = {};

	self.getCellWidth = function() {
		return self.config.cell_width;
	};
	self.getCellPadding = function() {
		return self.config.cell_padding;
	};
	self.getCellHeight = function(track_id) {
		return self.tracks[track_id].config.cell_height;
	};
	self.getTrackHeight = function(track_id) {
		return self.tracks[track_id].config.track_height;
	};
	self.getTrackPadding = function(track_id) {
		return self.tracks[track_id].config.track_padding;
	};
	self.getIdOrder = function() {
		return self.id_order;
	};
	self.setIdOrder = function(id_order) {
		self.id_order = id_order;
		$(self).trigger(events.SET_ID_ORDER);
	};
	self.getTrackOrder = function() {
		return self.track_order;
	};
	self.getTrackLabel = function(track_id) {
		return self.tracks[track_id].config.label;
	};
	self.getTrackData = function(track_id) {
		return self.tracks[track_id].data;
	};
	self.setTrackData = function(track_id, data) {
		var id_accessor = self.getTrackDatumIdAccessor(track_id);

		self.tracks[track_id].data = data;
		self.id_order = self.id_order.concat(_.difference(_.map(data, id_accessor), self.id_order));

		self.tracks[track_id].id_data_map = {};
		var id_data_map = self.tracks[track_id].id_data_map;
		_.each(self.tracks[track_id].data, function(datum) {
			id_data_map[id_accessor(datum)] = datum;
		});
		$(self).trigger(events.SET_TRACK_DATA);
	};
	self.getTrackDatum = function(track_id, datum_id) {
		return self.tracks[track_id].id_data_map[datum_id];
	};

	self.getTrackDatumIdAccessor = function(track_id) {
		return function(d) {
			return d[self.tracks[track_id].config.datum_id_key];
		};
	};
	self.getTrackDatumIdKey = function(track_id) {
		return self.tracks[track_id].config.datum_id_key;
	};

	self.removeTrack = function(track_id) {
		var track = self.tracks[track_id];
		delete self.tracks[track_id];

		var oldPosition = self.track_order.indexOf(track_id);
		self.track_order.splice(oldPosition, 1);

		$(self).trigger(events.REMOVE_TRACK, {track: track, track_id: track_id});
		return true;
	};
	self.moveTrack = function(track_id, new_position) {
		new_position = Math.min(self.track_order.length-1, new_position);
		new_position = Math.max(0, new_position);
		var old_position = self.track_order.indexOf(track_id);

		self.track_order.splice(old_position, 1);
		self.track_order.splice(new_position, 0, track_id);

		$(self).trigger(events.MOVE_TRACK, {track_id: track_id, tracks:self.tracks, track_order: self.track_order});
	};
	self.addTrack = function(config) {
		var track_id = track_id_counter;
		track_id_counter += 1;
		self.tracks[track_id] ={id: track_id, data: [], config: $.extend({}, defaultTrackConfig, config)};
		self.track_order.push(track_id);

		$(self).trigger(events.ADD_TRACK, {track: track_id});
		return track_id;
	};

	self.setCellWidth = function(w) {
		self.config.cell_width = w;
		$(self).trigger(events.SET_CELL_WIDTH);
	};
	self.setCellPadding = function(p) {
		self.config.cell_padding = p;
		$(self).trigger(events.SET_CELL_PADDING);
	};

	self.sort = function(track_id_list, cmp_list) {
		track_id_list = [].concat(track_id_list);
		cmp_list = [].concat(cmp_list);
		var lexicographically_ordered_cmp = function(id1,id2) {
			var cmp_result;
			for (var i=0, _len = track_id_list.length; i<_len; i++) {
				cmp_result = cmp_list[i](self.getTrackDatum(track_id_list[i], id1),self.getTrackDatum(track_id_list[i], id2));
				if (cmp_result !== 0) {
					break;
				}
			}
			return cmp_result;
		};
		self.setIdOrder(utils.stableSort(self.getIdOrder(), lexicographically_ordered_cmp));
		$(self).trigger(events.SORT, {id_order: self.id_order});
	};

	self.sortOnTrack = function(track_id, data_cmp) {
		throw "not implemented";
	};
	self.sortOnTracks = function(track_ids, data_cmps) {
		throw "not implemented";
	};
}

var OncoprintRenderer = (function() {
	function OncoprintRenderer(oncoprint, config) {
		this.rule_sets = {};
		this.clipping = true;
		this.oncoprint = oncoprint;
		this.config = config;
	};
	OncoprintRenderer.prototype.getCellCSSClass = function() {
		return 'cell';	
	};
	OncoprintRenderer.prototype.getTrackCellCSSClass = function(track_id) {
		return 'cell'+track_id;
	};
	OncoprintRenderer.prototype.getLabelFont = function() {
		return this.config.label_font;
	};
	OncoprintRenderer.prototype.setRuleSet = function(track_id, type, params) {
		var new_rule_set = RuleSet.makeRuleSet(type, params);
		this.rule_sets[track_id] = new_rule_set;
	};
	OncoprintRenderer.prototype.useSameRuleSet = function(target_track_id, source_track_id) {
		this.rule_sets[target_track_id] = this.rule_sets[source_track_id];
	};
	OncoprintRenderer.prototype.getRuleSet = function(track_id) {
		return this.rule_sets[track_id];
	};
	OncoprintRenderer.prototype.getTrackTop = function(track_id) {
		var y = 0;
		var self =this;
		_.find(this.oncoprint.getTrackOrder(), function(id) {
			if (id === track_id) {
				return true;
			} else {
				y += self.getTrackRenderHeight(id);
				return false;
			}
		});
		return y;
	};
	OncoprintRenderer.prototype.getTrackRenderTop = function(track_id) {
		return this.getTrackTop(track_id) + this.oncoprint.getTrackPadding(track_id);
	};
	OncoprintRenderer.prototype.getTrackRenderHeight = function(track_id) {
		return this.oncoprint.getTrackHeight(track_id) + 2*this.oncoprint.getTrackPadding(track_id);
	};
	OncoprintRenderer.prototype.getCellX = function(index) {
		return index*(this.oncoprint.getCellWidth()+this.oncoprint.getCellPadding());
	};
	OncoprintRenderer.prototype.getCellPos = function(track_id, datum_id) {
		var index = this.oncoprint.getIdOrder().indexOf(datum_id);
		if (index > -1) {
			return {x: index*(this.oncoprint.getCellWidth()+this.oncoprint.getCellPadding()),
				y: this.getTrackRenderTop(track_id)};
		} else {
			return [-1,-1];
		}
	};
	OncoprintRenderer.prototype.getCellAreaWidth = function() {
		return this.oncoprint.getIdOrder().length*(this.oncoprint.getCellWidth() + this.oncoprint.getCellPadding());
	};
	OncoprintRenderer.prototype.getCellAreaHeight = function() {
		var height = 0;
		var self = this;
		_.each(this.oncoprint.getTrackOrder(), function(track_id) {
			height += self.getTrackRenderHeight(track_id);
		});
		return height;
	};
	OncoprintRenderer.prototype.getLabelAreaWidth = function() {
		var label_font = this.getLabelFont();
		var labels =  _.map(this.oncoprint.getTrackOrder(), this.oncoprint.getTrackLabel);
		var label_widths = _.map(labels, function(label) {
			return utils.textWidth(label, label_font);
		});
		var max_label_width = Math.max(_.max(label_widths), 0);
		var max_percent_altered_width = utils.textWidth('100%', label_font);
		var buffer_width = 20;
		return max_label_width + buffer_width + max_percent_altered_width ;
	};
	OncoprintRenderer.prototype.getLabelAreaHeight = function() {
		return this.getCellAreaHeight();
	};
	OncoprintRenderer.prototype.render = function() {
		throw "not implemented in abstract class";
	}
	return OncoprintRenderer;
})();

var OncoprintSVGRenderer = (function() {
	function VisibleIndexBounds(first, last) {
		this.first = first;
		this.last = last;
		this.toShow = function(new_bounds) {
			var ret = [];
			var i;
			if (new_bounds.first < this.first) {
				for (i=new_bounds.first; i < this.first; i++) {
					ret.push(i);
				}
			}
			if (new_bounds.last > this.last) {
				for (i=this.last + 1; i <= new_bounds.last; i++) {
					ret.push(i);
				}
			}
			return ret;
		};
		this.toHide = function(new_bounds) {
			var ret = [];
			var i;
			if (new_bounds.first > this.first) {
				for (i=this.first; i < new_bounds.first; i++) {
					ret.push(i);
				}
			}
			if (new_bounds.last < this.last) {
				for (i=new_bounds.last+1; i <= this.last; i++) {
					ret.push(i);
				}
			}
			return ret;
		};
		this.set = function(first, last) {
			this.first = first;
			this.last = last;
			return this;
		};
	}
	function OncoprintSVGRenderer(oncoprint, config) {
		OncoprintRenderer.call(this, oncoprint, config);
		this.label_svg = utils.makeD3SVGElement('svg');
		this.cell_svg = utils.makeD3SVGElement('svg');
		this.label_container;
		this.cell_container;
		this.cell_container_node;
		this.cell_div;
		this.cells = {};
		this.curr_clip_bounds = new VisibleIndexBounds(-1, -2);
		this.prev_clip_bounds = new VisibleIndexBounds(-1, -2);

		var render_events = [events.ADD_TRACK, events.REMOVE_TRACK, events.SET_TRACK_DATA];
		var reposition_events = [events.MOVE_TRACK, events.SET_CELL_PADDING, events.SET_CELL_WIDTH];
		var reclip_events = [events.SET_CELL_PADDING, events.SET_CELL_WIDTH];
		var reposition_then_reclip_events = [events.SET_ID_ORDER];
		var self = this;
		$(oncoprint).on(render_events.join(" "), function() {
			self.render();
		});
		$(oncoprint).on(reposition_events.join(" "), function() {
			self.positionCells();
		});
		$(oncoprint).on(reclip_events.join(" "), function() {
			self.clipCells();
		});
		$(oncoprint).on(reposition_then_reclip_events.join(" "), function() {
			self.positionCells();
			self.clipCells(true);
		});
	}
	utils.extends(OncoprintSVGRenderer, OncoprintRenderer);

	OncoprintSVGRenderer.prototype.getClipBounds = function() {
		var parent = this.cell_container_node;
		var parentRect = parent.getBoundingClientRect();
		var x = parent.scrollLeft;
		var width = parentRect.right-parentRect.left;
		var cell_unit = this.oncoprint.getCellWidth() + this.oncoprint.getCellPadding();

		var first_visible = Math.floor(x / cell_unit);
		var last_visible = Math.ceil((x + width) / cell_unit);

		return this.curr_clip_bounds.set(first_visible, last_visible);
	};
	OncoprintSVGRenderer.prototype.getPreviousClipBounds = function() {
		return this.prev_clip_bounds;
	};
	OncoprintSVGRenderer.prototype.getScrollRect = function() {
		var parent = this.cell_div.node().parentNode;
		var parentRect = parent.getBoundingClientRect();
		return {x: parent.scrollLeft, y: parent.scrollTop, width: parentRect.right - parentRect.left, height: parentRect.bottom - parentRect.top};
	};
	OncoprintSVGRenderer.prototype.setRuleSet = function(track_id, type, params) {
		OncoprintRenderer.prototype.setRuleSet.call(this, track_id, type, params);
		this.render();
	};
	OncoprintSVGRenderer.prototype.useSameRuleSet = function(target_track_id, source_track_id) {
		OncoprintRenderer.prototype.useSameRuleSet.call(this, target_track_id, source_track_id);
		this.render();
	}
	OncoprintSVGRenderer.prototype.getLabelSVG = function() {
		return this.label_svg;
	};
	OncoprintSVGRenderer.prototype.getCellSVG = function() {
		return this.cell_svg;
	};
	OncoprintSVGRenderer.prototype.attachLabelSVG = function(container_selector_string) {
		this.label_container = d3.select(container_selector_string).append('div').classed('fixed_oncoprint_section_container', true);
		var label_svg = this.getLabelSVG();
		this.label_container.select(function () {
			return this.appendChild(label_svg.node());
		});
	};
	OncoprintSVGRenderer.prototype.attachCellSVG = function(container_selector_string) {
		this.cell_container = d3.select(container_selector_string).append('div').classed('scrolling_oncoprint_section_container', true);
		this.cell_container_node = this.cell_container.node();
		this.cell_div = this.cell_container.append('div').classed('cell_div', true);
		var self = this;
		
		$(this.cell_container.node()).on('scroll', function() {
			self.clipCells();
		});
	};
	OncoprintSVGRenderer.prototype.renderTrackLabel = function(oncoprint, track_id, rule_set, svg) {
		var label_class = 'label'+track_id;
		var label_y = this.getTrackRenderTop(track_id);
		svg.selectAll('.'+label_class).remove();
		svg.append('text').classed(label_class, true).text(oncoprint.getTrackLabel(track_id))
				.attr('alignment-baseline', 'hanging')
				.attr('transform', utils.translate(0, label_y));
		if (rule_set.alteredData && typeof rule_set.alteredData === 'function') {
			var data = oncoprint.getTrackData(track_id);
			var num_altered = rule_set.alteredData(data).length;
			var percent_altered = Math.floor(100*num_altered/data.length);
			svg.append('text').classed(label_class, true)
				.text(percent_altered+'%')
				.attr('text-anchor', 'end')
				.attr('alignment-baseline', 'hanging')
				.attr('transform', utils.translate(this.getLabelAreaWidth(), label_y));
		}
	};
	OncoprintSVGRenderer.prototype.drawTrackCells = function(track_id, rule_set) {
		var oncoprint = this.oncoprint;
		var data = oncoprint.getTrackData(track_id);
		var id_key = oncoprint.getTrackDatumIdKey(track_id);
		var id_accessor = oncoprint.getTrackDatumIdAccessor(track_id);
		var self = this;
		this.cells[track_id] = this.cells[track_id] || {};

		var cell_class = this.getCellCSSClass();
		var track_cell_class = this.getTrackCellCSSClass(track_id);

		var bound_svg = this.cell_div.selectAll('svg.'+track_cell_class).data(data, id_accessor);
		bound_svg.enter().append('svg').classed(track_cell_class, true).classed(cell_class, true);
		bound_svg.style('width', oncoprint.getCellWidth()).style('height', oncoprint.getCellHeight(track_id));
		bound_svg.each(function(d,i) {
			self.cells[track_id][d[id_key]] = this;
		});
		bound_svg.selectAll('*').remove();
		rule_set.apply(bound_svg, data, id_accessor, oncoprint.getCellWidth(), oncoprint.getCellHeight(track_id));
	};
	OncoprintSVGRenderer.prototype.positionCells = function() {
		var self = this;
		_.each(this.oncoprint.getTrackOrder(), function(track_id) {
			self.positionTrackCells(track_id);
		});
	};
	OncoprintSVGRenderer.prototype.positionTrackCells = function(track_id, bound_svg) {
		var oncoprint = this.oncoprint;
		if (!bound_svg) {
			bound_svg = this.cell_div.selectAll('svg.'+this.getTrackCellCSSClass(track_id))
					.data(oncoprint.getTrackData(track_id), oncoprint.getTrackDatumIdAccessor(track_id));
		}
		var self = this;
		var id_key = oncoprint.getTrackDatumIdKey(track_id);
		var id_order = oncoprint.getIdOrder();
		var y = this.getTrackRenderTop(track_id);
		bound_svg.transition().style('left', function(d,i) {
			return self.getCellX(id_order.indexOf(d[id_key]));
		}).style('top', y).each("end", function() {
			$(self).trigger(events.FINISHED_POSITIONING);
		});
	};
	OncoprintSVGRenderer.prototype.clipCells = function(force) {
		var self = this;
		var oncoprint = this.oncoprint;

		var id_order = oncoprint.getIdOrder();
		var visible_bounds = this.getClipBounds();
		var prev_bounds = force ? this.prev_clip_bounds.set(id_order.length, -1) : this.getPreviousClipBounds();
		var to_show = prev_bounds.toShow(visible_bounds);
		var to_hide = prev_bounds.toHide(visible_bounds);
		var i, len;
		for (i=0, len = to_show.length; i < len; i++) {
			var datum_id = id_order[to_show[i]];
			_.each(self.cells, function(cell_map) {
				var cell = cell_map[datum_id];
				if (cell) {
					cell.style.display = 'initial';
				}
			});
		}
		for (i=0, len = to_hide.length; i < len; i++) {
			var datum_id = id_order[to_hide[i]];
			_.each(self.cells, function(cell_map) {
				var cell = cell_map[datum_id];
				if (cell) {
					cell.style.display = 'none';
				}
			});
		}
		this.prev_clip_bounds.set(visible_bounds.first, visible_bounds.last);
	};
	OncoprintSVGRenderer.prototype.render = function() {
		var self = this;
		this.cell_svg.attr('width', this.getCellAreaWidth())
				.attr('height', this.getCellAreaHeight());
		this.cell_div.style('min-width', this.getCellAreaWidth()+'px')
				.style('min-height', this.getCellAreaHeight()+'px');
		this.label_svg.attr('width', this.getLabelAreaWidth())
				.attr('height', this.getLabelAreaHeight());
		_.each(this.oncoprint.getTrackOrder(), function(track_id) {
			var rule_set = self.getRuleSet(track_id);
			if (rule_set) {
				self.drawTrackCells(track_id, rule_set);
				self.positionTrackCells(track_id);
				self.renderTrackLabel(self.oncoprint, track_id, rule_set, self.getLabelSVG());
				//renderTrackLegend(self.oncoprint, track_id, rule_set, self.getLegendSVG());
			}
		});
		self.clipCells();
	};
	return OncoprintSVGRenderer;
})();

// var CanvasSVGDrawer = (function() {
// 	function CanvasSVGDrawer(canvas, svg) {
// 		this.canvas = canvas;
// 		this.ctx = this.canvas.node().getContext('2d');
// 		this.svg = svg;
// 		this.clipping_buffer = 300;
// 		setInterval($.proxy(this.draw, this), 1000/60);
// 		var self = this;
// 		$(this.canvas.node().parentNode).on('scroll', function() {
// 			self.draw();
// 		});
// 	}
// 	var containsPoint = function(x, y, rect) {
// 		return x >= rect.x && y >= rect.y && x < rect.x + rect.width && y < rect.y + rect.height;
// 	};
// 	CanvasSVGDrawer.prototype.draw = function() {
// 		this.canvas.attr('width', this.svg.attr('width'))
// 			.attr('height', this.svg.attr('height'));
// 		var canvas_node = this.canvas.node();
// 		var ctx = this.ctx;
// 		ctx.clearRect(0, 0, canvas_node.width, canvas_node.height);
// 		ctx.beginPath();
// 		var view_rect = this.getParentViewRect();
// 		for (var child = this.svg.node().firstChild; child; child = child.nextSibling) {
// 			this.drawNode(child, view_rect);
// 		}
// 		ctx.stroke();
// 		ctx.closePath();
// 	};
// 	CanvasSVGDrawer.prototype.getParentViewRect = function() {
// 		var parent = this.canvas.node().parentNode;
// 		var parentRect = parent.getBoundingClientRect();
// 		return {x: parent.scrollLeft, y: parent.scrollTop, width: parentRect.right - parentRect.left, height: parentRect.bottom - parentRect.top};
// 	};
// 	CanvasSVGDrawer.prototype.drawNode = function(node, view_rect) {
// 		var d3_node = d3.select(node);
// 		var ctx = this.ctx;
// 		var pos = this.svg.node().createSVGPoint();
// 		pos = pos.matrixTransform(node.getCTM());
// 		if (containsPoint(pos.x, pos.y, view_rect)) {
// 			switch (node.tagName) {
// 				case 'g':
// 					for (var child = node.firstChild; child; child = child.nextSibling) {
// 						this.drawNode(child, view_rect);
// 					}
// 				case 'rect':
// 					ctx.fillStyle = d3_node.attr('fill');
// 					ctx.strokeStyle = d3_node.attr('stroke') || ctx.fillStyle;
// 					ctx.fillRect(pos.x, pos.y, d3_node.attr('width'), d3_node.attr('height'));
// 			}
// 		}
// 	};
// 	return CanvasSVGDrawer;
// })();
