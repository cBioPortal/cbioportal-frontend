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
	cell_width: 5.5,
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
		var renderer = new OncoprintSVGRenderer(container_selector_string, oncoprint);
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
			setClipping: function(c) {
				renderer.setClipping(c);
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
				cmp_result = cmp_list[i](self.getTrackDatum(id1),self.getTrackDatum(id2));
				if (cmp_result !== 0) {
					break;
				}
			}
			return cmp_result;
		};
		self.getIdOrder().sort(lexicographically_ordered_cmp);
		$(self).trigger(events.SORT, {id_order: self.id_order});
	};

	self.sortOnTrack = function(track_id, data_cmp) {
		throw "not implemented";
	};
	self.sortOnTracks = function(track_ids, data_cmps) {
		throw "not implemented";
	};
}

function OncoprintSVGRenderer(container_selector_string, oncoprint) {
	var self = this;
	self.container = d3.select(container_selector_string).classed('oncoprint_container', true);
	self.label_svg;
	self.cell_svg;
	self.legend_table;
	self.legend_svg;
	self.rule_sets = {};
	self.clipping = true;

	(function init() {
		self.container.selectAll('*').remove();
		self.label_svg = self.container.append('div').classed('fixed_oncoprint_section_container', true).append('svg')
					.attr('width', 100).attr('xmlns', "http://www.w3.org/2000/svg");
		self.cell_canvas = self.container.append('div').classed('scrolling_oncoprint_section_container', true).append('canvas').attr('id', 'cell_canvas').attr('width', 1000).attr('height', 200);
		self.cell_canvas.node().addEventListener('mousemove', function(evt) {
			$(self).off(events.FINISHED_RENDERING);
			var canvas_rect = self.cell_canvas.node().getBoundingClientRect();
			var x = evt.clientX - canvas_rect.left;
			var y = evt.clientY - canvas_rect.top;
			var cell = self.mousePosToCell(x,y);
			if (cell) {
				$(self).on(events.FINISHED_RENDERING, function() {
					self.cell_canvas_ctx.fillStyle = '#ff0000';
					self.cell_canvas_ctx.fillRect(cell.x, cell.y, 2, 2);
					console.log(cell.datum);
				});
			}
		});
		self.cell_canvas_ctx = self.cell_canvas.node().getContext('2d');
		self.cell_svg = utils.makeD3SVGElement('svg');//self.container.append('div').classed('scrolling_oncoprint_section_container', true).append('svg').attr('xmlns', "http://www.w3.org/2000/svg");
		self.legend_table = self.container.append('table');
	})();

	var render_events = [events.ADD_TRACK, events.REMOVE_TRACK, events.MOVE_TRACK, events.SORT, events.SET_CELL_PADDING, 
				events.SET_CELL_WIDTH, events.SET_TRACK_DATA];
	$(oncoprint).on(render_events.join(" "), function() {
		self.renderTracks();
	});

	self.setRuleSet = function(track_id, type, params) {
		var new_rule_set = RuleSet.makeRuleSet(type, params);
		self.rule_sets[track_id] = new_rule_set;
		self.renderTracks();
	};
	self.useSameRuleSet = function(target_track_id, source_track_id) {
		self.rule_sets[target_track_id] = self.rule_sets[source_track_id];
	};

	var getRuleSet = function(track_id) {
		return self.rule_sets[track_id];
	};

	self.toSVG = function(ctr) {
		ctr.attr('width', 2000);
		ctr.attr('height', 1000);
		var svg = ctr.append('svg').attr('xmlns', "http://www.w3.org/2000/svg");
		//var svg = utils.makeD3SVGElement('svg');
		var vertical_padding = 5;
		utils.appendD3SVGElement(self.label_svg, svg);
		utils.appendD3SVGElement(self.cell_svg, svg).attr('x',+self.label_svg.attr('width'));
		var legend_row_y = +self.label_svg.attr('height') + vertical_padding;
		self.legend_table.selectAll('tr').selectAll('svg').each(function() {
			var d3_elt = d3.select(this);
			utils.appendD3SVGElement(d3_elt, svg).attr('y', legend_row_y);
			console.log(legend_row_y);
			legend_row_y += +d3_elt.attr('height');			
		});
		if (ctr) {
			utils.appendD3SVGElement(svg, ctr);
		}
		return svg;
	};

	self.renderTracks = function() {
		_.each(oncoprint.getTrackOrder(), function(track_id, ind) {
			renderTrackLabel(track_id);
			var rule_set = getRuleSet(track_id);
			if (!rule_set) {
				console.log("No rule set found for track id "+track_id);
				return;
			}
			renderTrackCells(track_id, getRuleSet(track_id));
		});

		(function renderLegend() {
			self.legend_table.selectAll('*').remove();
			_.each(oncoprint.getTrackOrder(), function(track_id) {
				var rule_set = getRuleSet(track_id);
				if (!rule_set) {
					console.log("No rule set found for track id "+track_id);
					return;
				}
				if (!rule_set.isLegendRendered()) {
					var svg = self.legend_table.append('tr').append('svg').attr('width', 1000).attr('height', 50).attr('xmlns', "http://www.w3.org/2000/svg");
					rule_set.putLegendGroup(svg, oncoprint.getCellWidth(), 20); // TODO: get actual cell height
					rule_set.markLegendRendered();
				}
			});
			_.each(oncoprint.getTrackOrder(), function(track_id) {
				var rule_set = getRuleSet(track_id);
				if (rule_set) {
					rule_set.unmarkLegendRendered();
				}
			});
		})();

	};

	var renderTrackLabel = function(track_id) {
		var label_class = 'label'+track_id;
		var track_y = trackY(track_id);
		var label_y = track_y + oncoprint.getTrackPadding(track_id); // TODO: centralize it
		self.label_svg
			.attr('width', labelSvgWidth())
			.attr('height', labelSvgHeight());
		self.label_svg.selectAll('.'+label_class).remove();
		self.label_svg.append('text').classed(label_class, true).text(oncoprint.getTrackLabel(track_id))
				//.attr('x', 0)
				//.attr('y', track_y)
				.attr('transform', utils.translate(0, label_y))
				.attr('alignment-baseline', 'hanging');

		var track_rule_set = getRuleSet(track_id);
		if (!track_rule_set) {
			console.log("No rule set found for track id "+track_id);
			return;
		}
		var track_data = oncoprint.getTrackData(track_id);
		if (track_rule_set.alteredData) {
			var percent_altered = 100*(track_rule_set.alteredData(track_data).length / track_data.length);
			self.label_svg.append('text').classed(label_class, true)
				.attr('text-anchor', 'end')
				.text(Math.floor(percent_altered)+'%')
				.attr('alignment-baseline', 'hanging')
				//.attr('x', labelSvgWidth())
				//.attr('y', track_y);
				.attr('transform', utils.translate(labelSvgWidth(), label_y));
		}

	};
	var renderCellsToCanvas = function() {
		var ctx = self.cell_canvas_ctx;
		ctx.clearRect(0,0, self.cell_canvas.node().width, self.cell_canvas.node().height);
		ctx.beginPath();
		var toprint = 5;
		for (var child = self.cell_svg.node().firstChild; child; child = child.nextSibling) {
			renderCellToCanvas(child);
		}
		ctx.stroke();
		ctx.closePath();
		$(self).trigger(events.FINISHED_RENDERING);
	};
	var pointInCanvas = function(x, y) {
		var canvas_node = self.cell_canvas.node();
		var x_lim = self.cell_canvas.attr('width');
		var y_lim = self.cell_canvas.attr('height');
		return x <= x_lim && x >= 0 && y <= y_lim && y >= 0;
	};
	var renderCellToCanvas = function(node) {
		var ctx = self.cell_canvas_ctx;
		var rectpt = self.cell_svg.node().createSVGPoint();
		var d3_node = d3.select(node);
		rectpt = rectpt.matrixTransform(node.getCTM());
		if (self.clipping && !pointInCanvas(rectpt.x, rectpt.y)) {
			return;
		}
		switch (node.tagName) {
			case 'g':
				for (var child=node.firstChild; child; child = child.nextSibling) {
					renderCellToCanvas(child);
				}
				break;
			case 'rect':
				ctx.fillStyle = d3_node.attr('fill');
				ctx.strokeStyle = d3_node.attr('stroke') || ctx.fillStyle;
				ctx.fillRect(rectpt.x /*+ d3_node.attr('x')*/, rectpt.y/* + d3_node.attr('y')*/, d3_node.attr('width'), d3_node.attr('height'));

		}
	};
	setInterval(renderCellsToCanvas, 1000/60);
	var renderTrackCells = function(track_id, rule_set) {
		var data = oncoprint.getTrackData(track_id);
		var id_accessor = oncoprint.getTrackDatumIdAccessor(track_id);
		if (!id_accessor) {
			console.log("No id accessor found for track id "+track_id);
			return;
		}
		var track_y = trackY(track_id);
		var id_order = utils.invert_array(oncoprint.getIdOrder());
		var cell_width = oncoprint.getCellWidth();
		var cell_height = oncoprint.getCellHeight(track_id);

		(function updateSVG() {
			self.cell_svg
			.attr('width', cellSvgWidth())
			.attr('height', cellSvgHeight());

		})();
		var bound_g = (function createAndRemoveGroups() {
			var cell_class = 'cell'+track_id;

			var bound_g = self.cell_svg.selectAll('g.'+cell_class).data(data, id_accessor);
			bound_g.enter().append('g').classed(cell_class, true);
			bound_g.exit().remove();
			return bound_g;
		})();
		(function positionGroups() {
			bound_g.transition().attr('transform', function(d, i) {
				var x = id_order[id_accessor(d)]*(oncoprint.getCellWidth() + oncoprint.getCellPadding());
				var y = track_y + oncoprint.getTrackPadding(track_id);
				return utils.translate(x, y);
			});
		})();
		(function cleanGroups() {
			bound_g.selectAll('*').remove();	
		})();
		(function renderCells() {
			rule_set.apply(self.cell_svg, bound_g, data, id_accessor, cell_width, cell_height);
		})();
	};

	var trackY = function(track_id) {
		var y = 0;
		_.find(oncoprint.getTrackOrder(), function(id) {
			if (id === track_id) {
				return true;
			} else {
				y += renderedTrackHeight(id);
				return false;
			}
		});
		return y;
	};

	self.mousePosToCell = function(x,y) {
		// TODO: centralize all of these coordinate stuff...shouldn't be calculating them twice in two different functions D:
		var yInTrack = function(track_id, y) {
			var track_y = trackY(track_id);
			var track_padding = oncoprint.getTrackPadding(track_id);
			var track_height = oncoprint.getTrackHeight(track_id);
			return y >= track_y + track_padding && y <= track_y + track_padding + track_height;
		};
		var track_id = false;
		_.find(oncoprint.getTrackOrder(), function(id) {
			if (yInTrack(id, y)) {
				track_id = id;
				return true;
			}
			return false;
		});
		if (track_id === false) {
			return undefined;	
		} else {
			var cell_width = oncoprint.getCellWidth();
			var cell_padding = oncoprint.getCellPadding();
			var cell_index = Math.floor(x / (cell_padding +cell_width));
			var in_cell = (x % (cell_padding + cell_width)) < cell_width;
			if (in_cell) {
				var datum_id = oncoprint.getIdOrder()[cell_index];
				var datum = oncoprint.getTrackDatum(track_id, datum_id);
				var cell_x = cell_index*(cell_padding + cell_width); // TODO: centralize it
				var cell_y = trackY(track_id)+oncoprint.getTrackPadding(track_id);// TODO: centralize it
				return {datum: datum, x: cell_x, y: cell_y};
			} else {
				return undefined;
			}
		}
	};
	var renderedTrackHeight = function(track_id) {
		return oncoprint.getTrackHeight(track_id) + 2*oncoprint.getTrackPadding(track_id);
	};

	var cellSvgWidth = function() {
		return (oncoprint.getCellWidth() + oncoprint.getCellPadding())*oncoprint.getIdOrder().length;
	};

	var cellSvgHeight = function() {
		return _.reduce(oncoprint.getTrackOrder(), function(memo, track_id) {
				return memo + renderedTrackHeight(track_id);
			}, 0);
	};
	var labelSvgHeight = function() {
		return cellSvgHeight();
	};
	var labelSvgWidth = function() {
		return 100;
	};

	self.setClipping = function(c) {
		self.clipping = c;
	};
}
