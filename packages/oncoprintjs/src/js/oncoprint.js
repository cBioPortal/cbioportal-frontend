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

// TODO: use self everywhere

var defaultOncoprintConfig = {
	cell_width: 10,
	cell_padding: 3,
};

var hiddenOncoprintConfig = {
	pre_track_padding: 0,
};

module.exports = function CreateOncoprint(container_selector_string, config) {
	var oncoprint = new Oncoprint(config);
	var renderer = new OncoprintSVGRenderer(container_selector_string, oncoprint);
	return oncoprint;
};

function Oncoprint(config) {
	var self = this;
	var track_id_counter = 0;
	self.config = $.extend({}, defaultOncoprintConfig, config || {});
	self.config = $.extend(self.config, hiddenOncoprintConfig);

	/*self.config.id_order = [];
	self.config.track_order = []; */
	self.id_order = [];
	self.track_order = [];
	self.tracks = {};
	self.ids = {};

	var track_events = [events.TRACK_INIT, events.TRACK_FILTER_DATA, events.UPDATE_RENDER_RULES, 
			events.CELL_CLICK, events.CELL_MOUSEENTER, events.CELL_MOUSELEAVE, 
			signals.REQUEST_PRE_TRACK_PADDING];


	var triggerTracks = function(evt, data) {
		_.each(self.tracks, function(track) {
			$(track).trigger(evt, data);
		});
	};

	self.setCellWidth = function(w) {
		self.config.cell_width = w;
		$(self).trigger(events.SET_CELL_WIDTH);
		//triggerTracks(events.SET_CELL_WIDTH);
	};

	self.setCellPadding = function(p) {
		self.config.cell_padding = p;
		$(self).trigger(events.SET_CELL_PADDING);
		//triggerTracks(events.SET_CELL_PADDING);
	};

	self.sortOnTrack = function(track_id, data_cmp) {
		/*var track_id_order = self.tracks[track_id].getDatumIds(data_cmp);
		self.config.id_order = track_id_order.concat(_.difference(self.config.id_order, track_id_order));
		$(self).trigger(events.SORT, {id_order: self.config.id_order});
		triggerTracks(events.SORT, {id_order: self.config.id_order});*/
		throw "not implemented";
	};

	self.sortOnTracks = function(track_ids, data_cmps) {
		throw "not implemented";
	};

	self.moveTrack = function(track_id, new_position) {
		new_position = Math.min(self.config.track_order.length-1, new_position);
		new_position = Math.max(0, new_position);
		var old_position = self.config.track_order.indexOf(track_id);

		self.config.track_order.splice(old_position, 1);
		self.config.track_order.splice(new_position, 0, track_id);

		$(self).trigger(events.MOVE_TRACK, {track_id: track_id, tracks:self.tracks, track_order: self.config.track_order});
	};

	self.addTrack = function(data, config) {
		var track_id = track_id_counter;
		track_id_counter += 1;
		self.tracks[track_id] ={id: track_id, data: data, config: config}; //new Track(data, config, new ReadOnlyObject(self.config));
		/*_.each(track_events, function(evt) {
			$(self.tracks[track_id]).on(evt, function(e,data) {
				$(self).trigger(evt, data);
			});
		});*/
		//self.config.track_order.push(track_id);
		self.track_order.push(track_id);

		// TODO: maybe this line shouldn't exist if we're not handling no data in oncoprint
		//self.config.id_order = self.config.id_order.concat(_.difference(self.tracks[track_id].getDatumIds(), self.config.id_order));
		self.id_order = self.id_order.concat(_.difference(self.id_order, _.map(data, function(d) {
			return d[config.datum_id_key];
		})));

		$(self).trigger(events.ADD_TRACK, {track: self.tracks[track_id]});
		return track_id;
	};

	self.getTrack = function(track_id) {
		return self.tracks[track_id];
	};

	self.removeTrack = function(track_id) {
		var track = self.tracks[track_id];
		delete self.tracks[track_id];

		var oldPosition = self.config.track_order.indexOf(track_id);
		self.config.track_order.splice(oldPosition, 1);

		$(self).trigger(events.REMOVE_TRACK, {track: track, track_id: track_id});
		return true;
	};

	(function bindEvents(self) {
		$(self).on(signals.REQUEST_PRE_TRACK_PADDING, function(e, data) {
			self.config.pre_track_padding = Math.max(data.pre_track_padding, self.config.pre_track_padding);
			$(self).trigger(events.SET_PRE_TRACK_PADDING, {pre_track_padding: self.config.pre_track_padding});
		});
	})(self);
}

function OncoprintSVGRenderer(container_selector_string, oncoprint) {
	var self = this;
	self.container = d3.select(container_selector_string).classed('oncoprint_container', true);
	self.fixed_svg;
	self.$fixed_svg;
	self.scrolling_svg;
	self.$scrolling_svg;

	var track_configs = {};
	var trackY = function(track_id) {
		var y = 0;
		_.find(oncoprint.config.track_order, function(id) {
			if (id === track_id) {
				return true;
			} else {
				y += trackHeight(id);
				return false;
			}
		});
		return y;
	};

	var trackHeight = function(track_id) {
		var track_config = oncoprint.tracks[track_id].config;
		return track_config.track_height + 2*track_config.track_padding;
	}

	(function init(self) {
		self.container.selectAll('*').remove();
		self.fixed_svg = self.container.append('div').classed('fixed_oncoprint_section_container', true).append('svg');
		self.scrolling_svg = self.container.append('div').classed('scrolling_oncoprint_section_container', true).append('svg');
		self.$fixed_svg = $(self.fixed_svg.node());
		self.$scrolling_svg = $(self.scrolling_svg.node());
	})(self);

	self.bindEvents = function(oncoprint) {
		$(oncoprint).on(events.ADD_TRACK, function(e, data) {
			data.track.renderer.init()
		});
		$(oncoprint).on(events.MOVE_TRACK, function(e, data)) {

		});
		$(oncoprint).on(events.REMOVE_TRACK, function(e, data)) {

		});
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
