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
	create: function CreateOncoprint(container_selector_string, config) {
		var oncoprint = new Oncoprint(config);
		var renderer = new OncoprintSVGRenderer(container_selector_string, oncoprint);
		return {
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
			},
			setCellPadding: function(p) {
				oncoprint.setCellPadding(p);
				//<REMOVE>
				renderer.renderTracks();
				//</REMOVE>
			}
		};
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
	self.setCellPadding = function(p) {
		self.config.cell_padding = p;
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
	self.legend_table;
	self.$legend_table;
	self.rule_set_map = {};
	self.rule_sets = [];

	(function init() {
		self.container.selectAll('*').remove();
		self.label_svg = self.container.append('div').classed('fixed_oncoprint_section_container', true).append('svg')
					.attr('width', 100);
		self.cell_svg = self.container.append('div').classed('scrolling_oncoprint_section_container', true).append('svg');
		self.$label_svg = $(self.label_svg.node());
		self.$cell_svg = $(self.cell_svg.node());
		self.legend_table = self.container.append('table');
		self.$legend_table = $(self.legend_table.node());
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
		_.each(oncoprint.getTrackOrder(), function(track_id, ind) {
			renderTrackLabel(track_id);
			renderTrackCells(track_id, getRuleSet(track_id));
		});

		(function renderLegend() {
			self.legend_table.selectAll('*').remove();
			_.each(self.rule_sets, function(rule_set) {
				var svg = self.legend_table.append('tr').append('svg').attr('width', 1000).attr('height', 50);
				rule_set.putLegendGroup(svg, oncoprint.getCellWidth(), 20); // TODO: get actual cell height
			})
		})();
	};

	var renderTrackLabel = function(track_id) {
		var label_class = 'label'+track_id;
		var track_y = trackY(track_id);
		self.label_svg
			.attr('width', labelSvgWidth())
			.attr('height', labelSvgHeight());
		self.label_svg.selectAll('.'+label_class).remove();
		self.label_svg.append('text').classed(label_class, true).text(oncoprint.getTrackLabel(track_id))
				.attr('transform', utils.translate(0, track_y))
				.attr('alignment-baseline', 'hanging');

		var track_rule_set = getRuleSet(track_id);
		var track_data = oncoprint.getTrackData(track_id);
		if (track_rule_set.alteredData) {
			var percent_altered = 100*(track_rule_set.alteredData(track_data).length / track_data.length);
			self.label_svg.append('text').classed(label_class, true)
				.attr('text-anchor', 'end')
				.text(Math.floor(percent_altered)+'%')
				.attr('alignment-baseline', 'hanging')
				.attr('transform', utils.translate(labelSvgWidth(), track_y));
		}

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
			bound_g.transition().attr('transform', function(d, i) {
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
	var labelSvgHeight = function() {
		return cellSvgHeight();
	};
	var labelSvgWidth = function() {
		return 100;
	};
}
