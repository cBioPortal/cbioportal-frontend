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
var Track = require('./Track');
var _ = require('underscore');
var d3 = require('d3');
var $ = require('jquery');
var ReadOnlyObject = require('./ReadOnlyObject');
var Toolbar = require('./Toolbar')
var events = require('./events');
var signals = require('./signals');
var globals = require('./globals');
var utils = require('./utils');
var RuleSet = require('./RuleSet');

// TODO: use self everywhere

var defaultOncoprintConfig = {
	cell_width: 10,
	cell_padding: 3,
};

var hiddenOncoprintConfig = {
	pre_track_padding: 0,
};

var defaultTrackConfig = {
	label: 'Gene',
	datum_id_key: 'sample',
	cell_height: 20,
	track_height: 20,
	track_padding: 5,
	sort_cmp: undefined
}; 

module.exports = function CreateOncoprint(container_selector_string, config) {
	var oncoprint = new Oncoprint(config);
	var renderer = new OncoprintSVGRenderer(container_selector_string, oncoprint);
	return {
		CATEGORICAL_COLOR: RuleSet.CATEGORICAL_COLOR,
		GRADIENT_COLOR: RuleSet.GRADIENT_COLOR,
		GENETIC_ALTERATION: RuleSet.GENETIC_ALTERATION_TRACK,
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
			//<REMOVE>
			renderer.renderTracks();
			//</REMOVE>
		},
		setRuleSet: function(track_id, type, params) {
			renderer.setRuleSet(track_id, type, params);
			//<REMOVE>
			renderer.renderTracks();
			//</REMOVE>
		},
		useSameRuleSet: function(target_track_id, source_track_id) {
			renderer.useSameRuleSet(target_track_id, source_track_id);
		}
	};
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
		self.tracks[track_id].data = data;
		self.id_order = self.id_order.concat(_.difference(_.map(data, self.getTrackDatumIdAccessor(track_id)), self.id_order));
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

		var oldPosition = self.config.track_order.indexOf(track_id);
		self.config.track_order.splice(oldPosition, 1);

		$(self).trigger(events.REMOVE_TRACK, {track: track, track_id: track_id});
		return true;
	};
	self.moveTrack = function(track_id, new_position) {
		new_position = Math.min(self.config.track_order.length-1, new_position);
		new_position = Math.max(0, new_position);
		var old_position = self.config.track_order.indexOf(track_id);

		self.config.track_order.splice(old_position, 1);
		self.config.track_order.splice(new_position, 0, track_id);

		$(self).trigger(events.MOVE_TRACK, {track_id: track_id, tracks:self.tracks, track_order: self.config.track_order});
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
	self.$label_svg;
	self.cell_svg;
	self.$cell_svg;
	self.rule_set_map = {};
	self.rule_sets = [];

	(function init() {
		self.container.selectAll('*').remove();
		self.label_svg = self.container.append('div').classed('fixed_oncoprint_section_container', true).append('svg');
		self.cell_svg = self.container.append('div').classed('scrolling_oncoprint_section_container', true).append('svg');
		self.$label_svg = $(self.label_svg.node());
		self.$cell_svg = $(self.cell_svg.node());
	})();

	self.setRuleSet = function(track_id, type, params) {
		var new_rule_set = RuleSet.makeRuleSet(type, params);
		self.rule_sets.push(new_rule_set);
		self.rule_set_map[track_id] = self.rule_sets.length-1;
	};
	self.useSameRuleSet = function(target_track_id, source_track_id) {
		self.rule_set_map[target_track_id] = self.rule_set_map[source_track_id];
	};

	var getRuleSet = function(track_id) {
		var rule_set_index = self.rule_set_map[track_id];
		return self.rule_sets[rule_set_index];
	};

	self.renderTracks = function() {
		_.each(oncoprint.getTrackOrder(), function(track_id) {
			renderTrackLabel(track_id);
			renderTrackCells(track_id, getRuleSet(track_id));
		});
	};

	var renderTrackLabel = function(track_id) {
		var label_class = 'label'+track_id;
		self.label_svg.selectAll('.'+label_class).remove();
		self.label_svg.append('text').classed(label_class, true).text(oncoprint.getTrackLabel(track_id))
				.attr('transform', utils.translate(0, trackY(track_id)))
				.attr('alignment-baseline', 'hanging');

	};
	var renderTrackCells = function(track_id, rule_set) {
		var data = oncoprint.getTrackData(track_id);
		var id_accessor = oncoprint.getTrackDatumIdAccessor(track_id);
		var track_y = trackY(track_id);
		var id_order = utils.invert_array(oncoprint.getIdOrder());

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
			bound_g.attr('transform', function(d, i) {
				return utils.translate(id_order[id_accessor(d)]*(oncoprint.getCellWidth() + oncoprint.getCellPadding()), track_y);
			});
		})();
		(function cleanGroups() {
			bound_g.selectAll('*').remove();	
		})();
		(function renderCells() {
			rule_set.apply(bound_g, data, id_accessor, oncoprint.getCellWidth(), oncoprint.getCellHeight(track_id));
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
}


function OncoprintTableRenderer(container_selector_string) {
	var self = this;
	self.container = d3.select(container_selector_string).classed('oncoprint_container', true);
	self.fixed_table;
	self.$fixed_table;
	self.scrolling_table;
	self.$scrolling_table;
	self.legend_table;
	self.$legend_table;
	
	(function initTable(self) {
		self.container.selectAll('*').remove();
		self.fixed_table = self.container.append('div').classed('fixed_oncoprint_table_container', true).append('table')
		self.$fixed_table = $(self.fixed_table.node());
		self.scrolling_table = self.container.append('div').classed('scrolling_oncoprint_table_container', true).append('table');
		self.$scrolling_table = $(self.scrolling_table.node());
		self.legend_table = self.container.append('div').classed('legend_oncoprint_table_container', true).append('table');
		self.$legend_table = $(self.legend_table.node());
		self.legend_table.append('tr').append('svg').attr('width', 2000).attr('height', 100);
	})(self);

	self.bindEvents = function(oncoprint) {
		$(oncoprint).on(events.ADD_TRACK, function(e, data) {
			var new_fixed_table_row = self.fixed_table.append('tr');
			var new_scrolling_table_row = self.scrolling_table.append('tr');
			var new_legend_table_row = self.legend_table.append('tr');
			data.track.renderer.init(new_fixed_table_row, new_scrolling_table_row);
		});
		$(oncoprint).on(events.MOVE_TRACK, function(e, data) {
			var track_name = data.track_name;
			var new_position = data.track_order.indexOf(track_name);
			var track_order = data.track_order;
			var track = data.tracks[track_name];
			if (new_position === 0) {
				self.$table.find('tr:first').before(track.renderer.$row);
			} else {
				var before_track = data.tracks[track_order[new_position-1]];
				before_track.renderer.$row.after(track.renderer.$row);
			}
		});
		$(oncoprint).on(events.REMOVE_TRACK, function(e, data) {
			var track = data.track;
			track.renderer.$row.remove();
		});
		var legend_x = 0;
		$(oncoprint).on(events.UPDATE_RENDER_RULES, function(e, data) {
			var group = utils.appendD3SVGElement(globals.rulesvgs[globals.rulesvgs.length-1], self.legend_table.select('svg'));
			utils.spaceSVGElementsHorizontally(group, 10);
			utils.spaceSVGElementsHorizontally(self.legend_table.select('svg'), 20);
		});
		self.$fixed_table.mouseenter(function() {
			$(oncoprint).trigger(events.ONCOPRINT_MOUSEENTER);
		});
		self.$fixed_table.mouseleave(function() {
			$(oncoprint).trigger(events.ONCOPRINT_MOUSELEAVE);
		});
		self.$scrolling_table.mouseenter(function() {
			$(oncoprint).trigger(events.ONCOPRINT_MOUSEENTER);
		});
		self.$scrolling_table.mouseleave(function() {
			$(oncoprint).trigger(events.ONCOPRINT_MOUSELEAVE);
		});
	};
}

function OncoprintLegendRenderer(container_selector_string) {
	var self = this;
	self.container = d3.select(container_selector_string).classed('oncoprint_legend_container', true);
	self.table;
	self.$table;

	var rows = [];

	(function initTable(self) {
		self.container.selectAll('*').remove();
		self.table = self.container.append('table');
		self.$table = $(self.table.node());		
	})(self);

	var addRow = function(track_id) {

	}

	self.bindEvents = function(oncoprint) {
		$(oncoprint).on(events.UPDATE_RENDER_RULES, function(e, data) {

		});
	};
}
